import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  FolderOpen,
  Flame,
  Home,
  ListTodo,
  NotebookPen,
  Settings2,
  Target,
} from 'lucide-react';

export const navigationSections = [
  {
    label: 'Command Center',
    items: [
      {
        path: '/',
        label: 'Monitoring Center',
        section: 'Command Center',
        description: 'Monitor goals, tasks, habits, and weekly progress at a glance.',
        icon: Home,
      },
      {
        path: '/weekly-hub',
        label: 'Weekly Hub',
        section: 'Command Center',
        description: 'Strategic planning and performance review in one unified hub.',
        icon: BarChart3,
      },
      {
        path: '/calendar',
        label: 'Calendar',
        section: 'Command Center',
        description: 'Time-block the week and place work into a real schedule.',
        icon: CalendarDays,
      },
    ],
  },
  {
    label: 'Life OS',
    items: [
      {
        path: '/goals',
        label: 'Goals',
        section: 'Life OS',
        description: 'Track long-term outcomes and the progress behind them.',
        icon: Target,
      },
      {
        path: '/projects',
        label: 'Projects',
        section: 'Life OS',
        description: 'Manage active projects connected to your goals.',
        icon: FolderOpen,
      },
      {
        path: '/tasks',
        label: 'Tasks',
        section: 'Life OS',
        description: 'Organize and complete the concrete work on your plate.',
        icon: ListTodo,
      },
      {
        path: '/habits',
        label: 'Rituals',
        section: 'Life OS',
        description: 'Build daily routines that compound over time.',
        icon: Flame,
      },
    ],
  },
  {
    label: 'Business',
    items: [
      {
        path: '/business',
        label: 'Business Hub',
        section: 'Business',
        description: 'Pipeline, invoices, contacts, expenses, and tax in one hub.',
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    label: 'Growth',
    items: [
      {
        path: '/journal',
        label: 'Journal',
        section: 'Growth',
        description: 'Capture thoughts, notes, and daily reflection.',
        icon: NotebookPen,
      },
      {
        path: '/ai-planner',
        label: 'AI Strategist',
        section: 'Growth',
        description: 'Turn a goal into projects and tasks with AI-assisted planning.',
        icon: Bot,
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        path: '/settings',
        label: 'Settings',
        section: 'Settings',
        description: 'Personalize invoices, business identity, and workspace defaults.',
        icon: Settings2,
      },
    ],
  }
];

export const navigationItems = navigationSections.flatMap((section) => section.items);

export function getRouteMeta(pathname) {
  const matched = navigationItems.find((item) => {
    if (item.path === '/') {
      return pathname === '/';
    }
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  });

  return (
    matched || {
      path: pathname,
      label: 'Workspace',
      section: 'Vantage',
      description: 'Use the workspace across planning, execution, clients, and operations.',
      icon: Home,
    }
  );
}
