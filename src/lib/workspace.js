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
        link: '/tasks',
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
        link: '/reminders',
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
        link: '/invoices',
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
        link: '/pipeline',
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
        link: '/habits',
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

export function calculateHabitStreak(habits, habitLogs, habitId) {
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return 0;
  
  const logsForHabit = habitLogs
    .filter(log => log.habit_id === habitId && log.completed)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (logsForHabit.length === 0) return 0;
  
  let streak = 0;
  let currentDate = startOfDay(today);
  
  const completedDates = new Set(logsForHabit.map(log => log.date));
  
  if (!completedDates.has(todayKey)) {
    const yesterdayKey = format(addDays(today, -1), 'yyyy-MM-dd');
    if (!completedDates.has(yesterdayKey)) {
      return 0;
    }
    currentDate = addDays(currentDate, -1);
  }
  
  while (true) {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    if (completedDates.has(dateKey)) {
      streak++;
      currentDate = addDays(currentDate, -1);
    } else {
      break;
    }
  }
  
  return streak;
}

export function calculateTotalStreak(habits, habitLogs) {
  if (habits.length === 0) return 0;
  
  const streaks = habits.map(habit => calculateHabitStreak(habits, habitLogs, habit.id));
  return Math.min(...streaks);
}

export function getTodayProgress(snapshot) {
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  
  const habitsCompletedToday = snapshot.habitLogs.filter(
    log => log.date === todayKey && log.completed
  ).length;
  const totalHabits = snapshot.habits.length;
  const habitsPercent = totalHabits > 0 ? Math.round((habitsCompletedToday / totalHabits) * 100) : 0;
  
  const tasksDueToday = snapshot.tasks.filter(
    task => task.due_date === todayKey && task.status !== 'done'
  ).length;
  const tasksDoneToday = snapshot.tasks.filter(
    task => task.due_date === todayKey && task.status === 'done'
  ).length;
  const totalTasksDue = tasksDueToday + tasksDoneToday;
  const tasksPercent = totalTasksDue > 0 ? Math.round((tasksDoneToday / totalTasksDue) * 100) : 0;
  
  return {
    habitsCompleted: habitsCompletedToday,
    totalHabits,
    habitsPercent,
    tasksDone: tasksDoneToday,
    tasksDue: tasksDueToday,
    tasksPercent,
  };
}

export function getWeeklyData(snapshot) {
  const today = new Date();
  const weekData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    const habitsDone = snapshot.habitLogs.filter(
      log => log.date === dateKey && log.completed
    ).length;
    
    const tasksDone = snapshot.tasks.filter(
      task => task.due_date === dateKey && task.status === 'done'
    ).length;
    
    weekData.push({
      date: dateKey,
      dayName: format(date, 'EEE'),
      habitsDone,
      tasksDone,
      totalHabits: snapshot.habits.length,
    });
  }
  
  return weekData;
}

// Dashboard helper functions
export function getTodayCalendarBlocks(snapshot) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const blocks = snapshot.calendarBlocks || [];
  return blocks
    .filter(b => b.date === today)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
}

export function getThisWeeksTasks(snapshot) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const tasks = snapshot.tasks || [];

  return tasks.filter(task => {
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    return isAfter(due, weekStart) && isBefore(due, weekEnd);
  });
}

export function getUserName(snapshot) {
  let name = 'Friend';
  if (snapshot.onboarding?.user_name) {
    name = snapshot.onboarding.user_name;
  } else if (snapshot.contacts && Array.isArray(snapshot.contacts) && snapshot.contacts.length > 0) {
    const first = snapshot.contacts[0];
    if (first.first_name) {
      name = first.first_name;
    }
  }
  return String(name).split(' ')[0];
}

export function getStreakStats(habits, habitLogs) {
  if (!habits || habits.length === 0) return { current: 0, best: 0, avg: 0, percentToNext: 0 };
  
  const streaks = habits.map(habit => calculateHabitStreak(habits, habitLogs || [], habit.id));
  const current = Math.min(...streaks);
  const best = Math.max(...streaks);
  const avg = streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0;
  const percentToNext = current >= 30 ? 100 : Math.round((current / 30) * 100);
  
  return { current, best, avg, percentToNext };
}

export function getMotivationMessage(streak, progressPercent, overdueCount) {
  if (overdueCount > 3) return `${overdueCount} overdue tasks — let's tackle them first!`;
  if (streak >= 30) return "Incredible! You're building unbreakable habits.";
  if (streak >= 14) return "Two weeks strong! Keep that momentum going! 🔥";
  if (streak >= 7) return "One week down! You're on FIRE! 🔥";
  if (progressPercent >= 80) return "Almost there! Finish your day strong.";
  if (progressPercent >= 50) return "Halfway there! Keep pushing forward.";
  if (streak === 0 && progressPercent === 0) return "Start today — every great habit begins with a single step.";
  return "One day at a time. You've got this! 💪";
}

export function getOpenInvoiceTotal(snapshot) {
  const invoices = snapshot.invoices || [];
  return invoices
    .filter(inv => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.total || 0), 0);
}

export function getActiveProjectsCount(snapshot) {
  const projects = snapshot.projects || [];
  return projects.filter(p => !['completed', 'cancelled'].includes(p.status)).length;
}

export function getTodayOverdueCount(snapshot) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tasks = snapshot.tasks || [];
  return tasks.filter(
    t => t.due_date < today && t.status !== 'done'
  ).length;
}

export function getWeeklyGoalProgress(snapshot) {
  const thisWeekTasks = getThisWeeksTasks(snapshot);
  const doneThisWeek = thisWeekTasks.filter(t => t.status === 'done').length;
  const total = thisWeekTasks.length;
  const percent = total > 0 ? Math.round((doneThisWeek / total) * 100) : 0;
  return { done: doneThisWeek, total, percent };
}

export { getAreaMeta };
