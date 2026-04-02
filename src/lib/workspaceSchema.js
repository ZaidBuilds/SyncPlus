export const DEFAULT_WORKSPACE_AREAS = [
  {
    id: 'self',
    slug: 'self',
    label: 'Self',
    color: '#0f766e',
    order: 1,
    enabled: true,
    blurb: 'Identity, discipline, and the way you operate.',
  },
  {
    id: 'health',
    slug: 'health',
    label: 'Health',
    color: '#16a34a',
    order: 2,
    enabled: true,
    blurb: 'Energy, training, food, recovery, and sleep.',
  },
  {
    id: 'learning',
    slug: 'learning',
    label: 'Learning',
    color: '#2563eb',
    order: 3,
    enabled: true,
    blurb: 'Skills, study, craft, and deliberate growth.',
  },
  {
    id: 'work',
    slug: 'work',
    label: 'Work',
    color: '#f97316',
    order: 4,
    enabled: true,
    blurb: 'Projects, delivery, clients, and execution.',
  },
  {
    id: 'money',
    slug: 'money',
    label: 'Money',
    color: '#ca8a04',
    order: 5,
    enabled: true,
    blurb: 'Revenue, collections, savings, and financial calm.',
  },
  {
    id: 'relationships',
    slug: 'relationships',
    label: 'Relationships',
    color: '#db2777',
    order: 6,
    enabled: true,
    blurb: 'Family, partner, friends, community, and network.',
  },
];

export const DEFAULT_ONBOARDING_STATE = {
  id: 'workspace-setup',
  completed_at: null,
  enabled_pillars: DEFAULT_WORKSPACE_AREAS.map((area) => area.id),
  work_enabled: true,
  first_focus: 'self',
  landing_preference: '/today',
  vision_statement: 'Build a calmer, stronger operating rhythm for life and work.',
};

const AREA_BY_ID = Object.fromEntries(DEFAULT_WORKSPACE_AREAS.map((area) => [area.id, area]));

const AREA_KEYWORDS = {
  health: ['health', 'fitness', 'run', 'gym', 'sleep', 'walk', 'diet', 'nutrition', 'wellness'],
  learning: ['learn', 'learning', 'study', 'course', 'read', 'research', 'skill', 'practice', 'engineer', 'training'],
  work: ['client', 'proposal', 'deal', 'project', 'deliver', 'build', 'product', 'design', 'sales', 'outreach', 'meeting'],
  money: ['money', 'revenue', 'invoice', 'cash', 'collections', 'budget', 'finance', 'paid', 'income', 'savings'],
  relationships: ['family', 'partner', 'friend', 'relationship', 'community', 'network', 'reconnect', 'call mom', 'call dad'],
  self: ['system', 'routine', 'clarity', 'discipline', 'planning', 'journal', 'review', 'identity', 'focus'],
};

export function sanitizeEnabledPillars(pillars) {
  const allowed = new Set(DEFAULT_WORKSPACE_AREAS.map((area) => area.id));
  const sanitized = Array.isArray(pillars)
    ? pillars.filter((pillar) => allowed.has(pillar))
    : [];

  return sanitized.length > 0 ? sanitized : DEFAULT_ONBOARDING_STATE.enabled_pillars;
}

export function getAreaMeta(areaId) {
  return AREA_BY_ID[areaId] || AREA_BY_ID.self;
}

export function inferAreaIdFromText(text, fallback = 'self') {
  const haystack = String(text || '').toLowerCase();

  for (const [areaId, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return areaId;
    }
  }

  return fallback;
}

export function inferGoalAreaId(goal) {
  if (goal?.area_id) {
    return goal.area_id;
  }

  if (goal?.type === 'professional') {
    return inferAreaIdFromText(`${goal.title} ${goal.description} ${goal.target_value}`, 'work');
  }

  return inferAreaIdFromText(`${goal?.title} ${goal?.description} ${goal?.target_value}`, 'self');
}

export function inferProjectAreaId(project, goalsById = {}) {
  if (project?.area_id) {
    return project.area_id;
  }

  if (project?.goal_id && goalsById[project.goal_id]?.area_id) {
    return goalsById[project.goal_id].area_id;
  }

  return inferAreaIdFromText(`${project?.title} ${project?.description}`, project?.type === 'professional' ? 'work' : 'self');
}

export function inferTaskAreaId(task, context = {}) {
  if (task?.area_id) {
    return task.area_id;
  }

  const projectArea = task?.project_id && context.projectsById?.[task.project_id]?.area_id;
  if (projectArea) {
    return projectArea;
  }

  const goalArea = task?.goal_id && context.goalsById?.[task.goal_id]?.area_id;
  if (goalArea) {
    return goalArea;
  }

  return inferAreaIdFromText(`${task?.title} ${task?.notes}`, 'self');
}

export function inferHabitAreaId(habit) {
  if (habit?.area_id) {
    return habit.area_id;
  }

  return inferAreaIdFromText(`${habit?.name} ${habit?.description}`, 'self');
}

export function inferFuturePlanAreaId(plan) {
  if (plan?.area_id) {
    return plan.area_id;
  }

  return inferAreaIdFromText(`${plan?.title} ${plan?.description}`, 'self');
}

export function getGoalTypeForArea(areaId) {
  return ['work', 'money'].includes(areaId) ? 'professional' : 'personal';
}
