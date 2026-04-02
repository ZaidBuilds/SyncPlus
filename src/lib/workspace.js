import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { dataClient } from '@/lib/dataClient';
import {
  DEFAULT_ONBOARDING_STATE,
  DEFAULT_WORKSPACE_AREAS,
  getAreaMeta,
  inferFuturePlanAreaId,
  inferGoalAreaId,
  inferHabitAreaId,
  inferProjectAreaId,
  inferTaskAreaId,
  sanitizeEnabledPillars,
} from '@/lib/workspaceSchema';

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function sortAreas(areas) {
  return [...areas].sort((left, right) => (left.order || 0) - (right.order || 0));
}

function mergeAreas(records) {
  const persisted = new Map((records || []).map((record) => [record.id, record]));
  return sortAreas(
    DEFAULT_WORKSPACE_AREAS.map((area) => ({
      ...area,
      ...persisted.get(area.id),
      enabled: persisted.get(area.id)?.enabled ?? area.enabled,
    }))
  );
}

export async function getWorkspaceAreas() {
  const records = await dataClient.entities.WorkspaceArea.list('order', 20);
  return mergeAreas(records);
}

export async function getOnboardingState() {
  const records = await dataClient.entities.OnboardingState.list('-updated_date', 1);
  if (records.length === 0) {
    return { ...DEFAULT_ONBOARDING_STATE };
  }

  return {
    ...DEFAULT_ONBOARDING_STATE,
    ...records[0],
    enabled_pillars: sanitizeEnabledPillars(records[0].enabled_pillars),
  };
}

export async function saveWorkspaceSetup(values) {
  const currentAreas = await getWorkspaceAreas();
  const currentState = await dataClient.entities.OnboardingState.list('-updated_date', 1);
  const enabledPillars = sanitizeEnabledPillars(values.enabled_pillars);

  await Promise.all(
    currentAreas.map((area) => {
      const nextArea = {
        ...area,
        enabled: enabledPillars.includes(area.id),
      };

      return dataClient.entities.WorkspaceArea.update(area.id, nextArea);
    })
  );

  const payload = {
    ...DEFAULT_ONBOARDING_STATE,
    ...values,
    enabled_pillars: enabledPillars,
    completed_at: values.completed_at || new Date().toISOString(),
  };

  if (currentState.length > 0) {
    return dataClient.entities.OnboardingState.update(currentState[0].id, payload);
  }

  return dataClient.entities.OnboardingState.create(payload);
}

export async function loadLifeOsSnapshot() {
  const [
    areas,
    onboarding,
    futurePlans,
    goals,
    projects,
    tasks,
    habits,
    habitLogs,
    journalEntries,
    calendarBlocks,
    deals,
    contacts,
    invoices,
    reminders,
    notes,
    weeklyPriorities,
  ] = await Promise.all([
    getWorkspaceAreas(),
    getOnboardingState(),
    dataClient.entities.FuturePlan.list('-created_date', 100),
    dataClient.entities.Goal.list('-created_date', 100),
    dataClient.entities.Project.list('-created_date', 200),
    dataClient.entities.Task.list('-updated_date', 400),
    dataClient.entities.Habit.list('-created_date', 100),
    dataClient.entities.HabitLog.list('-date', 1000),
    dataClient.entities.JournalEntry.list('-date', 100),
    dataClient.entities.CalendarBlock.list('start_time', 200),
    dataClient.entities.Deal.list('-created_date', 200),
    dataClient.entities.Contact.list('-created_date', 200),
    dataClient.entities.Invoice.list('-created_date', 200),
    dataClient.entities.Reminder.list('due_date', 200),
    dataClient.entities.Note.list('-created_date', 200),
    dataClient.entities.WeeklyPriority.list('-created_date', 20),
  ]);

  const enabledAreaIds = sanitizeEnabledPillars(onboarding.enabled_pillars);
  const enabledAreas = areas.filter((area) => enabledAreaIds.includes(area.id));

  const goalsWithArea = goals.map((goal) => ({
    ...goal,
    area_id: inferGoalAreaId(goal),
  }));
  const goalsById = Object.fromEntries(goalsWithArea.map((goal) => [goal.id, goal]));

  const projectsWithArea = projects.map((project) => ({
    ...project,
    area_id: inferProjectAreaId(project, goalsById),
  }));
  const projectsById = Object.fromEntries(projectsWithArea.map((project) => [project.id, project]));

  const tasksWithArea = tasks.map((task) => ({
    ...task,
    area_id: inferTaskAreaId(task, { projectsById, goalsById }),
  }));

  const habitsWithArea = habits.map((habit) => ({
    ...habit,
    area_id: inferHabitAreaId(habit),
  }));

  const futurePlansWithArea = futurePlans.map((plan) => ({
    ...plan,
    area_id: inferFuturePlanAreaId(plan),
  }));

  return {
    areas,
    enabledAreas,
    enabledAreaIds,
    onboarding,
    futurePlans: futurePlansWithArea,
    goals: goalsWithArea,
    goalsById,
    projects: projectsWithArea,
    projectsById,
    tasks: tasksWithArea,
    habits: habitsWithArea,
    habitLogs,
    journalEntries,
    calendarBlocks,
    deals,
    contacts,
    invoices,
    reminders,
    notes,
    weeklyPriorities,
  };
}

export function buildAreaSummary(snapshot) {
  return snapshot.enabledAreas.map((area) => {
    const activeGoals = snapshot.goals.filter((goal) => goal.area_id === area.id && goal.status === 'active').length;
    const activeProjects = snapshot.projects.filter(
      (project) => project.area_id === area.id && !['completed', 'cancelled'].includes(project.status)
    ).length;
    const openTasks = snapshot.tasks.filter((task) => task.area_id === area.id && task.status !== 'done').length;
    const activeHabits = snapshot.habits.filter((habit) => habit.area_id === area.id).length;
    const futurePlans = snapshot.futurePlans.filter((plan) => plan.area_id === area.id && plan.status !== 'archived').length;

    return {
      ...area,
      activeGoals,
      activeProjects,
      openTasks,
      activeHabits,
      futurePlans,
    };
  });
}

function getTaskScore(task, today) {
  const priorityScore = { high: 90, medium: 72, low: 58 }[task.priority] || 60;
  if (!task.due_date) {
    return priorityScore - 5;
  }

  const daysAway = differenceInCalendarDays(new Date(task.due_date), today);
  if (daysAway < 0) {
    return priorityScore + 20;
  }
  if (daysAway === 0) {
    return priorityScore + 12;
  }
  if (daysAway === 1) {
    return priorityScore + 6;
  }

  return priorityScore - daysAway;
}

export function buildTodayFocusItems(snapshot) {
  const now = new Date();
  const today = startOfDay(now);
  const todayKey = format(today, 'yyyy-MM-dd');
  const habitLogsByHabitId = Object.fromEntries(
    snapshot.habitLogs
      .filter((log) => log.date === todayKey)
      .map((log) => [log.habit_id, log])
  );

  const items = [];

  snapshot.tasks
    .filter((task) => task.status !== 'done')
    .filter((task) => !task.due_date || differenceInCalendarDays(new Date(task.due_date), today) <= 2)
    .forEach((task) => {
      items.push({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        subtitle: task.estimated_time ? `${task.estimated_time} min planned` : 'Task',
        due: task.due_date,
        area_id: task.area_id,
        score: getTaskScore(task, today),
        tone: task.priority === 'high' ? 'critical' : task.priority === 'medium' ? 'steady' : 'light',
        link: '/systems?tab=tasks',
        record: task,
      });
    });

  snapshot.reminders
    .filter((reminder) => !reminder.is_done)
    .forEach((reminder) => {
      const dueDate = reminder.due_date ? new Date(reminder.due_date) : now;
      const overdue = isBefore(dueDate, now);
      const dueSoon = isAfter(dueDate, now) && differenceInCalendarDays(dueDate, now) <= 1;

      if (!overdue && !dueSoon) {
        return;
      }

      items.push({
        id: `reminder-${reminder.id}`,
        kind: 'reminder',
        title: reminder.title,
        subtitle: reminder.notes || 'Follow-up',
        due: reminder.due_date,
        area_id: reminder.area_id || 'work',
        score: overdue ? 98 : 83,
        tone: overdue ? 'critical' : 'steady',
        link: '/systems?tab=work',
        record: reminder,
      });
    });

  snapshot.invoices
    .filter((invoice) => ['sent', 'overdue'].includes(invoice.status))
    .forEach((invoice) => {
      const dueDate = invoice.due_date ? new Date(invoice.due_date) : now;
      const daysAway = differenceInCalendarDays(dueDate, today);
      if (daysAway > 4) {
        return;
      }

      items.push({
        id: `invoice-${invoice.id}`,
        kind: 'invoice',
        title: `${invoice.contact_name || 'Client'} · collect ₹${formatCurrency(invoice.total)}`,
        subtitle: invoice.status === 'overdue' ? 'Invoice overdue' : 'Invoice due soon',
        due: invoice.due_date,
        area_id: 'money',
        score: invoice.status === 'overdue' ? 100 : 78 - daysAway,
        tone: invoice.status === 'overdue' ? 'critical' : 'steady',
        link: '/systems?tab=money',
        record: invoice,
      });
    });

  snapshot.deals
    .filter((deal) => !['closed', 'lost'].includes(deal.stage))
    .forEach((deal) => {
      const lastTouch = deal.last_activity_date ? new Date(deal.last_activity_date) : addDays(now, -5);
      const inactiveDays = differenceInCalendarDays(today, startOfDay(lastTouch));
      if (inactiveDays < 4) {
        return;
      }

      items.push({
        id: `deal-${deal.id}`,
        kind: 'deal',
        title: `Move ${deal.title}`,
        subtitle: `${inactiveDays}d since last touch`,
        due: deal.expected_close_date,
        area_id: 'work',
        score: 68 + Math.min(inactiveDays, 14),
        tone: inactiveDays >= 7 ? 'critical' : 'steady',
        link: '/systems?tab=work',
        record: deal,
      });
    });

  snapshot.habits
    .filter((habit) => !habitLogsByHabitId[habit.id]?.completed)
    .forEach((habit) => {
      items.push({
        id: `habit-${habit.id}`,
        kind: 'habit',
        title: habit.name,
        subtitle: habit.description || 'Habit',
        due: todayKey,
        area_id: habit.area_id,
        score: 52,
        tone: 'light',
        link: '/systems?tab=habits',
        record: habit,
      });
    });

  return items.sort((left, right) => right.score - left.score);
}

export function getWeeklyMetrics(snapshot, weekOffset = 0) {
  const weekStart = startOfWeek(addDays(new Date(), weekOffset * -7), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addDays(new Date(), weekOffset * -7), { weekStartsOn: 1 });

  const tasks = snapshot.tasks.filter((task) => {
    if (!task.due_date) {
      return false;
    }

    const dueDate = new Date(task.due_date);
    return dueDate >= weekStart && dueDate <= weekEnd;
  });
  const tasksDone = tasks.filter((task) => task.status === 'done').length;

  const habitLogs = snapshot.habitLogs.filter((log) => {
    const date = new Date(log.date);
    return date >= weekStart && date <= weekEnd;
  });
  const completedHabitLogs = habitLogs.filter((log) => log.completed).length;

  const journalEntries = snapshot.journalEntries.filter((entry) => {
    const date = new Date(entry.date);
    return date >= weekStart && date <= weekEnd;
  });

  const overdueItems = snapshot.tasks.filter((task) => {
    if (task.status === 'done' || !task.due_date) {
      return false;
    }

    return isBefore(new Date(task.due_date), new Date());
  }).length;

  const habitCompletionRate = snapshot.habits.length > 0
    ? Math.round((completedHabitLogs / (snapshot.habits.length * 7)) * 100)
    : 0;

  return {
    weekStart,
    weekEnd,
    tasks,
    tasksDone,
    habitLogs,
    habitCompletionRate,
    journalEntries,
    overdueItems,
  };
}

export function getTodayJournalEntry(snapshot) {
  const today = new Date();
  return snapshot.journalEntries.find((entry) => isSameDay(new Date(entry.date), today)) || null;
}

export { getAreaMeta };
