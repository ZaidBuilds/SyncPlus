import {
  DEFAULT_ONBOARDING_STATE,
  DEFAULT_WORKSPACE_AREAS,
  inferFuturePlanAreaId,
  inferGoalAreaId,
  inferHabitAreaId,
  inferProjectAreaId,
  inferTaskAreaId,
  sanitizeEnabledPillars,
} from './workspaceSchema';

const STORAGE_KEY = 'vantage.localdb.v1';

const ENTITY_NAMES = [
  'CalendarBlock',
  'Contact',
  'Deal',
  'Expense',
  'FuturePlan',
  'Goal',
  'Habit',
  'HabitLog',
  'Invoice',
  'JournalEntry',
  'Note',
  'OnboardingState',
  'Project',
  'Reminder',
  'Task',
  'TdsEntry',
  'AdvanceTaxPayment',
  'WeeklyPriority',
  'WorkspaceArea',
];

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function isoDateTime(offsetDays = 0, hours = 9, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function createSeedWorkspaceAreas() {
  return DEFAULT_WORKSPACE_AREAS.map((area) => ({
    ...area,
    created_date: isoDateTime(-21, 6, area.order),
    updated_date: isoDateTime(-1, 6, area.order),
  }));
}

function createSeedFuturePlans() {
  return [
    {
      id: 'future-plan-self',
      title: 'Build a calmer weekly operating rhythm',
      description: 'Make planning, execution, and reflection feel deliberate instead of reactive.',
      horizon: '90 days',
      status: 'active',
      area_id: 'self',
      created_date: isoDateTime(-12, 7, 0),
      updated_date: isoDateTime(-3, 7, 0),
    },
    {
      id: 'future-plan-learning',
      title: 'Get sharper at AI product systems',
      description: 'Study practical AI tooling, workflows, and product execution for the next career step.',
      horizon: '12 months',
      status: 'active',
      area_id: 'learning',
      created_date: isoDateTime(-10, 7, 15),
      updated_date: isoDateTime(-2, 7, 15),
    },
    {
      id: 'future-plan-money',
      title: 'Create a steadier money engine',
      description: 'Reduce collection stress and build a cleaner revenue rhythm.',
      horizon: '6 months',
      status: 'active',
      area_id: 'money',
      created_date: isoDateTime(-8, 7, 30),
      updated_date: isoDateTime(-1, 7, 30),
    },
  ];
}

function createSeedDatabase() {
  const contactA = 'contact-aditi';
  const contactB = 'contact-neeraj';
  const contactC = 'contact-maya';
  const contactD = 'contact-rivor';

  const goalA = 'goal-revenue';
  const goalB = 'goal-system';

  const projectA = 'project-proposal-engine';
  const projectB = 'project-client-ops';

  const taskA = 'task-send-proposal';
  const taskB = 'task-followup-revision';
  const taskC = 'task-dashboard-pass';
  const taskD = 'task-journal-review';

  const habitA = 'habit-deep-work';
  const habitB = 'habit-outreach';
  const habitC = 'habit-review';

  const today = isoDate(0);
  const nextWeek = isoDate(7);

  return {
    Contact: [
      {
        id: contactA,
        name: 'Aditi Rao',
        email: 'aditi@northstarstudio.in',
        phone: '+91 98765 43210',
        company: 'Northstar Studio',
        area_id: 'relationships',
        lead_source: 'referral',
        notes: 'High intent founder lead. Interested in a retainer engagement.',
        created_date: isoDateTime(-18, 9, 15),
        updated_date: isoDateTime(-2, 12, 30),
      },
      {
        id: contactB,
        name: 'Neeraj Singh',
        email: 'neeraj@zenbrick.io',
        phone: '+91 91234 56789',
        company: 'Zenbrick',
        area_id: 'relationships',
        lead_source: 'linkedin',
        notes: 'Waiting on revised quote after discovery call.',
        created_date: isoDateTime(-14, 11, 0),
        updated_date: isoDateTime(-1, 10, 0),
      },
      {
        id: contactC,
        name: 'Maya Design Co.',
        email: 'hello@mayadesign.co',
        phone: '+91 99887 77665',
        company: 'Maya Design Co.',
        area_id: 'relationships',
        lead_source: 'instagram',
        notes: 'Already converted. Potential for upsell in Q2.',
        created_date: isoDateTime(-30, 14, 0),
        updated_date: isoDateTime(-6, 16, 30),
      },
      {
        id: contactD,
        name: 'Rivor Systems',
        email: 'ops@rivor.systems',
        phone: '+91 90000 55555',
        company: 'Rivor Systems',
        area_id: 'relationships',
        lead_source: 'cold_outreach',
        notes: 'Finance team asked for invoice follow-up.',
        created_date: isoDateTime(-9, 8, 45),
        updated_date: isoDateTime(-3, 9, 20),
      },
    ],
    Deal: [
      {
        id: 'deal-northstar-retainer',
        title: 'Northstar retainer',
        contact_id: contactA,
        contact_name: 'Aditi Rao',
        value: 180000,
        area_id: 'work',
        currency: 'INR',
        stage: 'proposal',
        expected_close_date: isoDate(6),
        description: 'Monthly strategy and build retainer.',
        lead_source: 'referral',
        last_activity_date: isoDateTime(-4, 15, 0),
        created_date: isoDateTime(-18, 10, 0),
        updated_date: isoDateTime(-4, 15, 0),
      },
      {
        id: 'deal-zenbrick-site',
        title: 'Zenbrick website rebuild',
        contact_id: contactB,
        contact_name: 'Neeraj Singh',
        value: 92000,
        area_id: 'work',
        currency: 'INR',
        stage: 'meeting',
        expected_close_date: isoDate(4),
        description: 'Sales site redesign and CMS implementation.',
        lead_source: 'linkedin',
        last_activity_date: isoDateTime(-2, 11, 30),
        created_date: isoDateTime(-14, 12, 0),
        updated_date: isoDateTime(-2, 11, 30),
      },
      {
        id: 'deal-maya-ops',
        title: 'Maya dashboard sprint',
        contact_id: contactC,
        contact_name: 'Maya Design Co.',
        value: 64000,
        area_id: 'work',
        currency: 'INR',
        stage: 'closed',
        expected_close_date: isoDate(-10),
        description: 'Internal reporting dashboard sprint.',
        lead_source: 'instagram',
        last_activity_date: isoDateTime(-8, 10, 45),
        created_date: isoDateTime(-30, 13, 0),
        updated_date: isoDateTime(-8, 10, 45),
      },
      {
        id: 'deal-rivor-automation',
        title: 'Rivor automation setup',
        contact_id: contactD,
        contact_name: 'Rivor Systems',
        value: 128000,
        area_id: 'work',
        currency: 'INR',
        stage: 'negotiating',
        expected_close_date: isoDate(9),
        description: 'Client follow-up and workflow automation system.',
        lead_source: 'cold_outreach',
        last_activity_date: isoDateTime(-7, 9, 15),
        created_date: isoDateTime(-9, 10, 15),
        updated_date: isoDateTime(-7, 9, 15),
      },
    ],
    Invoice: [
      {
        id: 'invoice-1001',
        invoice_number: 'SP-1001',
        contact_id: contactC,
        contact_name: 'Maya Design Co.',
        deal_id: 'deal-maya-ops',
        issue_date: isoDate(-20),
        due_date: isoDate(-10),
        paid_date: isoDate(-8),
        area_id: 'money',
        status: 'paid',
        currency: 'INR',
        line_items: [{ description: 'Dashboard sprint', quantity: 1, unit_price: 64000, total: 64000 }],
        subtotal: 64000,
        gst_rate: 18,
        total: 64000,
        created_date: isoDateTime(-20, 10, 0),
        updated_date: isoDateTime(-8, 11, 30),
      },
      {
        id: 'invoice-1002',
        invoice_number: 'SP-1002',
        contact_id: contactD,
        contact_name: 'Rivor Systems',
        issue_date: isoDate(-6),
        due_date: isoDate(-1),
        area_id: 'money',
        status: 'overdue',
        currency: 'INR',
        line_items: [{ description: 'Automation discovery', quantity: 1, unit_price: 18000, total: 18000 }],
        subtotal: 18000,
        gst_rate: 18,
        total: 18000,
        created_date: isoDateTime(-6, 9, 40),
        updated_date: isoDateTime(-1, 18, 0),
      },
      {
        id: 'invoice-1003',
        invoice_number: 'SP-1003',
        contact_id: contactA,
        contact_name: 'Aditi Rao',
        issue_date: isoDate(-2),
        due_date: isoDate(5),
        area_id: 'money',
        status: 'sent',
        currency: 'INR',
        line_items: [{ description: 'Strategy retainer deposit', quantity: 1, unit_price: 45000, total: 45000 }],
        subtotal: 45000,
        gst_rate: 18,
        total: 45000,
        created_date: isoDateTime(-2, 14, 20),
        updated_date: isoDateTime(-2, 14, 20),
      },
    ],
    Expense: [
      {
        id: 'expense-figma',
        date: isoDate(-9),
        description: 'Figma subscription',
        category: 'software',
        amount: 1499,
        payment_mode: 'card',
        notes: 'Monthly design tooling cost.',
        created_date: isoDateTime(-9, 10, 0),
        updated_date: isoDateTime(-9, 10, 0),
      },
      {
        id: 'expense-meta-ads',
        date: isoDate(-5),
        description: 'Instagram lead campaign',
        category: 'marketing',
        amount: 3200,
        payment_mode: 'card',
        notes: 'Test campaign for inbound freelancer leads.',
        created_date: isoDateTime(-5, 18, 0),
        updated_date: isoDateTime(-5, 18, 0),
      },
      {
        id: 'expense-travel',
        date: isoDate(-2),
        description: 'Client meeting travel',
        category: 'travel',
        amount: 860,
        payment_mode: 'upi',
        notes: 'Local travel for discovery meeting.',
        created_date: isoDateTime(-2, 19, 0),
        updated_date: isoDateTime(-2, 19, 0),
      },
    ],
    Reminder: [
      {
        id: 'reminder-aditi',
        title: 'Follow up on Northstar proposal',
        area_id: 'work',
        deal_id: 'deal-northstar-retainer',
        contact_id: contactA,
        due_date: isoDateTime(0, 16, 0),
        is_done: false,
        notes: 'Share final scope and payment milestone.',
        created_date: isoDateTime(-1, 9, 30),
        updated_date: isoDateTime(-1, 9, 30),
      },
      {
        id: 'reminder-rivor',
        title: 'Check overdue invoice with Rivor',
        area_id: 'money',
        deal_id: 'deal-rivor-automation',
        contact_id: contactD,
        due_date: isoDateTime(-1, 12, 0),
        is_done: false,
        notes: 'Confirm finance approval timeline.',
        created_date: isoDateTime(-3, 12, 15),
        updated_date: isoDateTime(-3, 12, 15),
      },
      {
        id: 'reminder-neeraj',
        title: 'Send revised estimate to Zenbrick',
        area_id: 'work',
        deal_id: 'deal-zenbrick-site',
        contact_id: contactB,
        due_date: isoDateTime(2, 11, 0),
        is_done: false,
        notes: 'Updated build scope and delivery phases.',
        created_date: isoDateTime(0, 8, 15),
        updated_date: isoDateTime(0, 8, 15),
      },
    ],
    Goal: [
      {
        id: goalA,
        title: 'Reach INR 3L in monthly collections',
        description: 'Tighten collections and move open deals faster.',
        area_id: 'money',
        target_value: '₹3,00,000',
        deadline: isoDate(45),
        status: 'active',
        type: 'professional',
        created_date: isoDateTime(-21, 8, 0),
        updated_date: isoDateTime(-3, 8, 30),
      },
      {
        id: goalB,
        title: 'Systemize weekly planning',
        description: 'Make the planning loop repeatable and visible.',
        area_id: 'self',
        target_value: '4 strong weekly reviews',
        deadline: isoDate(28),
        status: 'active',
        type: 'personal',
        created_date: isoDateTime(-10, 7, 30),
        updated_date: isoDateTime(-2, 7, 30),
      },
    ],
    Project: [
      {
        id: projectA,
        goal_id: goalA,
        title: 'Proposal engine refresh',
        description: 'Standardize proposal generation and follow-up cadence.',
        area_id: 'work',
        status: 'in_progress',
        deadline: isoDate(14),
        type: 'professional',
        created_date: isoDateTime(-12, 10, 0),
        updated_date: isoDateTime(-1, 18, 0),
      },
      {
        id: projectB,
        goal_id: goalB,
        title: 'Client ops dashboard',
        description: 'Unify daily execution, reminders, and collections.',
        area_id: 'self',
        status: 'in_progress',
        deadline: isoDate(21),
        type: 'internal',
        created_date: isoDateTime(-8, 9, 0),
        updated_date: isoDateTime(-1, 16, 20),
      },
    ],
    Task: [
      {
        id: taskA,
        title: 'Send final proposal to Northstar',
        project_id: projectA,
        goal_id: goalA,
        area_id: 'work',
        status: 'todo',
        priority: 'high',
        due_date: today,
        estimated_time: 45,
        notes: 'Include maintenance terms and onboarding step.',
        created_date: isoDateTime(-2, 10, 0),
        updated_date: isoDateTime(-2, 10, 0),
      },
      {
        id: taskB,
        title: 'Revise Zenbrick estimate',
        project_id: projectA,
        goal_id: goalA,
        area_id: 'work',
        status: 'todo',
        priority: 'medium',
        due_date: isoDate(1),
        estimated_time: 60,
        notes: 'Adjust package split for content + build.',
        created_date: isoDateTime(-1, 11, 0),
        updated_date: isoDateTime(-1, 11, 0),
      },
      {
        id: taskC,
        title: 'Review dashboard interaction pass',
        project_id: projectB,
        goal_id: goalB,
        area_id: 'self',
        status: 'in_progress',
        priority: 'medium',
        due_date: today,
        estimated_time: 30,
        notes: 'Refine metrics layout and card states.',
        created_date: isoDateTime(-3, 14, 15),
        updated_date: isoDateTime(-1, 13, 30),
      },
      {
        id: taskD,
        title: 'Write weekly reflection',
        project_id: projectB,
        goal_id: goalB,
        area_id: 'self',
        status: 'done',
        priority: 'low',
        due_date: isoDate(-2),
        estimated_time: 20,
        notes: 'Capture what worked and what needs to tighten.',
        created_date: isoDateTime(-5, 8, 0),
        updated_date: isoDateTime(-2, 21, 0),
      },
    ],
    Habit: [
      {
        id: habitA,
        name: '90 min deep work',
        description: 'Protected build block before meetings.',
        area_id: 'work',
        frequency: 'daily',
        target: 1,
        color: '#0f766e',
        created_date: isoDateTime(-14, 7, 0),
        updated_date: isoDateTime(-2, 7, 0),
      },
      {
        id: habitB,
        name: 'Daily outreach',
        description: 'Reach out to one warm or cold lead.',
        area_id: 'work',
        frequency: 'daily',
        target: 1,
        color: '#f97316',
        created_date: isoDateTime(-14, 7, 5),
        updated_date: isoDateTime(-1, 7, 5),
      },
      {
        id: habitC,
        name: 'End-of-day review',
        description: 'Close the day with a short written reflection.',
        area_id: 'self',
        frequency: 'daily',
        target: 1,
        color: '#2563eb',
        created_date: isoDateTime(-14, 7, 10),
        updated_date: isoDateTime(-1, 7, 10),
      },
    ],
    HabitLog: [
      { id: 'habitlog-1', habit_id: habitA, date: isoDate(-2), completed: true, created_date: isoDateTime(-2, 19, 0), updated_date: isoDateTime(-2, 19, 0) },
      { id: 'habitlog-2', habit_id: habitB, date: isoDate(-2), completed: true, created_date: isoDateTime(-2, 19, 5), updated_date: isoDateTime(-2, 19, 5) },
      { id: 'habitlog-3', habit_id: habitC, date: isoDate(-2), completed: false, created_date: isoDateTime(-2, 19, 10), updated_date: isoDateTime(-2, 19, 10) },
      { id: 'habitlog-4', habit_id: habitA, date: isoDate(-1), completed: true, created_date: isoDateTime(-1, 19, 0), updated_date: isoDateTime(-1, 19, 0) },
      { id: 'habitlog-5', habit_id: habitB, date: isoDate(-1), completed: false, created_date: isoDateTime(-1, 19, 5), updated_date: isoDateTime(-1, 19, 5) },
      { id: 'habitlog-6', habit_id: habitC, date: isoDate(-1), completed: true, created_date: isoDateTime(-1, 19, 10), updated_date: isoDateTime(-1, 19, 10) },
      { id: 'habitlog-7', habit_id: habitA, date: today, completed: true, created_date: isoDateTime(0, 8, 0), updated_date: isoDateTime(0, 8, 0) },
    ],
    JournalEntry: [
      {
        id: 'journal-yesterday',
        date: isoDate(-1),
        area_id: 'self',
        what_done: 'Closed invoice follow-up and moved one proposal forward.',
        what_failed: 'Too much context switching after lunch.',
        improvements: 'Protect one uninterrupted build block.',
        mood: 'good',
        created_date: isoDateTime(-1, 20, 30),
        updated_date: isoDateTime(-1, 20, 30),
      },
      {
        id: 'journal-two-days',
        date: isoDate(-2),
        area_id: 'self',
        what_done: 'Finished dashboard shell refactor.',
        what_failed: 'Did not send the revised estimate.',
        improvements: 'Ship client communication before visual polish.',
        mood: 'neutral',
        created_date: isoDateTime(-2, 21, 0),
        updated_date: isoDateTime(-2, 21, 0),
      },
    ],
    CalendarBlock: [
      {
        id: 'block-today-1',
        date: today,
        start_time: '09:00',
        end_time: '10:30',
        area_id: 'work',
        title: 'Deep work: proposal revision',
        task_id: taskA,
        type: 'deep_work',
        created_date: isoDateTime(0, 7, 30),
        updated_date: isoDateTime(0, 7, 30),
      },
      {
        id: 'block-today-2',
        date: today,
        start_time: '16:00',
        end_time: '16:30',
        area_id: 'work',
        title: 'Northstar follow-up',
        task_id: '',
        type: 'outreach',
        created_date: isoDateTime(0, 7, 40),
        updated_date: isoDateTime(0, 7, 40),
      },
    ],
    Note: [
      {
        id: 'note-rivor',
        deal_id: 'deal-rivor-automation',
        contact_id: contactD,
        area_id: 'work',
        content: 'Finance asked for a two-part payment plan.',
        type: 'call',
        created_date: isoDateTime(-3, 16, 15),
        updated_date: isoDateTime(-3, 16, 15),
      },
    ],
    WeeklyPriority: [
      {
        id: 'priority-next-week',
        week_start: nextWeek,
        priorities: [
          'Close Northstar proposal',
          'Clear overdue invoice follow-ups',
          'Protect three deep-work mornings',
        ],
        intention: 'Move fewer things, but move them decisively.',
        created_date: isoDateTime(0, 18, 0),
        updated_date: isoDateTime(0, 18, 0),
      },
    ],
    TdsEntry: [
      {
        id: 'tds-q1-northstar',
        client_name: 'Northstar Studio',
        financial_year: '2026-27',
        quarter: 'Q1',
        amount: 5400,
        certificate_number: 'TDS-NS-001',
        date_received: isoDate(-12),
        notes: 'Retainer deposit TDS credit.',
        created_date: isoDateTime(-12, 11, 0),
        updated_date: isoDateTime(-12, 11, 0),
      },
      {
        id: 'tds-q1-rivor',
        client_name: 'Rivor Systems',
        financial_year: '2026-27',
        quarter: 'Q1',
        amount: 1800,
        certificate_number: 'TDS-RV-002',
        date_received: isoDate(-4),
        notes: 'Discovery invoice deduction.',
        created_date: isoDateTime(-4, 15, 0),
        updated_date: isoDateTime(-4, 15, 0),
      },
    ],
    AdvanceTaxPayment: [
      {
        id: 'advance-tax-june',
        financial_year: '2026-27',
        instalment: 'June',
        amount_paid: 12000,
        date_paid: isoDate(-20),
        notes: 'Quarterly advance tax payment.',
        created_date: isoDateTime(-20, 13, 0),
        updated_date: isoDateTime(-20, 13, 0),
      },
    ],
    FuturePlan: createSeedFuturePlans(),
    WorkspaceArea: createSeedWorkspaceAreas(),
    OnboardingState: [],
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function mergeWorkspaceAreas(existingAreas = []) {
  const existingById = new Map(existingAreas.map((area) => [area.id, area]));

  return DEFAULT_WORKSPACE_AREAS.map((area) => ({
    ...area,
    ...existingById.get(area.id),
    enabled: existingById.get(area.id)?.enabled ?? area.enabled,
  }));
}

function migrateDatabase(database) {
  let changed = false;

  ENTITY_NAMES.forEach((entityName) => {
    if (!database[entityName]) {
      database[entityName] = [];
      changed = true;
    }
  });

  const workspaceAreas = ensureEntity(database, 'WorkspaceArea');
  const mergedAreas = mergeWorkspaceAreas(workspaceAreas);
  if (
    workspaceAreas.length !== mergedAreas.length ||
    JSON.stringify(workspaceAreas.map((area) => ({ id: area.id, enabled: area.enabled }))) !==
      JSON.stringify(mergedAreas.map((area) => ({ id: area.id, enabled: area.enabled })))
  ) {
    database.WorkspaceArea = mergedAreas;
    changed = true;
  }

  const onboardingStates = ensureEntity(database, 'OnboardingState');
  if (onboardingStates.length > 0) {
    const current = onboardingStates[0];
    const normalized = {
      ...DEFAULT_ONBOARDING_STATE,
      ...current,
      enabled_pillars: sanitizeEnabledPillars(current.enabled_pillars),
    };

    if (JSON.stringify(current) !== JSON.stringify(normalized)) {
      onboardingStates[0] = normalized;
      changed = true;
    }
  }

  if (ensureEntity(database, 'FuturePlan').length === 0) {
    database.FuturePlan = createSeedFuturePlans();
    changed = true;
  }

  const goals = ensureEntity(database, 'Goal');
  goals.forEach((goal) => {
    if (!goal.area_id) {
      goal.area_id = inferGoalAreaId(goal);
      changed = true;
    }
  });

  const goalsById = Object.fromEntries(goals.map((goal) => [goal.id, goal]));

  const projects = ensureEntity(database, 'Project');
  projects.forEach((project) => {
    if (!project.area_id) {
      project.area_id = inferProjectAreaId(project, goalsById);
      changed = true;
    }
  });

  const projectsById = Object.fromEntries(projects.map((project) => [project.id, project]));

  ensureEntity(database, 'Task').forEach((task) => {
    if (!task.area_id) {
      task.area_id = inferTaskAreaId(task, { projectsById, goalsById });
      changed = true;
    }
  });

  ensureEntity(database, 'Habit').forEach((habit) => {
    if (!habit.area_id) {
      habit.area_id = inferHabitAreaId(habit);
      changed = true;
    }
  });

  ensureEntity(database, 'FuturePlan').forEach((plan) => {
    if (!plan.area_id) {
      plan.area_id = inferFuturePlanAreaId(plan);
      changed = true;
    }
  });

  ensureEntity(database, 'Contact').forEach((contact) => {
    if (!contact.area_id) {
      contact.area_id = 'relationships';
      changed = true;
    }
  });

  ensureEntity(database, 'Deal').forEach((deal) => {
    if (!deal.area_id) {
      deal.area_id = 'work';
      changed = true;
    }
  });

  ensureEntity(database, 'Invoice').forEach((invoice) => {
    if (!invoice.area_id) {
      invoice.area_id = 'money';
      changed = true;
    }
  });

  ensureEntity(database, 'Reminder').forEach((reminder) => {
    if (!reminder.area_id) {
      reminder.area_id = reminder.title?.toLowerCase().includes('invoice') ? 'money' : 'work';
      changed = true;
    }
  });

  ensureEntity(database, 'CalendarBlock').forEach((block) => {
    if (!block.area_id) {
      block.area_id = 'work';
      changed = true;
    }
  });

  ensureEntity(database, 'JournalEntry').forEach((entry) => {
    if (!entry.area_id) {
      entry.area_id = 'self';
      changed = true;
    }
  });

  ensureEntity(database, 'Note').forEach((note) => {
    if (!note.area_id) {
      note.area_id = 'work';
      changed = true;
    }
  });

  return { database, changed };
}

function readDatabase() {
  const storage = getStorage();
  if (!storage) {
    return createSeedDatabase();
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = createSeedDatabase();
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    const migrated = migrateDatabase(parsed);
    if (migrated.changed) {
      storage.setItem(STORAGE_KEY, JSON.stringify(migrated.database));
    }
    return migrated.database;
  } catch (error) {
    const seeded = createSeedDatabase();
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeDatabase(database) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(database));
}

function ensureEntity(database, entityName) {
  if (!database[entityName]) {
    database[entityName] = [];
  }

  return database[entityName];
}

function normalizeSortField(sortField = '-created_date') {
  if (!sortField) {
    return { field: 'created_date', descending: true };
  }

  return sortField.startsWith('-')
    ? { field: sortField.slice(1), descending: true }
    : { field: sortField, descending: false };
}

function compareValues(a, b) {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  const dateA = Date.parse(a);
  const dateB = Date.parse(b);
  if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
    return dateA - dateB;
  }

  return String(a).localeCompare(String(b));
}

function sortRecords(records, sortField) {
  const { field, descending } = normalizeSortField(sortField);
  const sorted = [...records].sort((left, right) => compareValues(left[field], right[field]));
  return descending ? sorted.reverse() : sorted;
}

function applyLimit(records, limit) {
  return typeof limit === 'number' ? records.slice(0, limit) : records;
}

function matchesFilter(record, criteria = {}) {
  return Object.entries(criteria).every(([key, expected]) => record[key] === expected);
}

function createEntityApi(entityName) {
  return {
    async list(sortField = '-created_date', limit) {
      const database = readDatabase();
      const records = ensureEntity(database, entityName);
      return clone(applyLimit(sortRecords(records, sortField), limit));
    },

    async filter(criteria = {}, sortField = '-created_date', limit) {
      const database = readDatabase();
      const records = ensureEntity(database, entityName).filter((record) => matchesFilter(record, criteria));
      return clone(applyLimit(sortRecords(records, sortField), limit));
    },

    async create(data) {
      const database = readDatabase();
      const records = ensureEntity(database, entityName);
      const timestamp = new Date().toISOString();
      const record = {
        id: globalThis.crypto?.randomUUID?.() || `${entityName.toLowerCase()}-${Date.now()}`,
        created_date: timestamp,
        updated_date: timestamp,
        ...clone(data),
      };
      records.push(record);
      writeDatabase(database);
      return clone(record);
    },

    async update(id, data) {
      const database = readDatabase();
      const records = ensureEntity(database, entityName);
      const index = records.findIndex((record) => record.id === id);

      if (index === -1) {
        throw new Error(`${entityName} with id ${id} was not found.`);
      }

      const updated = {
        ...records[index],
        ...clone(data),
        id,
        updated_date: new Date().toISOString(),
      };

      records[index] = updated;
      writeDatabase(database);
      return clone(updated);
    },

    async delete(id) {
      const database = readDatabase();
      const records = ensureEntity(database, entityName);
      const filtered = records.filter((record) => record.id !== id);
      database[entityName] = filtered;
      writeDatabase(database);
      return { id };
    },
  };
}

export function resetLocalDatabase() {
  writeDatabase(createSeedDatabase());
}

export const dataClient = {
  entities: Object.fromEntries(ENTITY_NAMES.map((entityName) => [entityName, createEntityApi(entityName)])),
};
