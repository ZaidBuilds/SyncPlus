import {
  BarChart3,
  BellRing,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Flame,
  FolderOpen,
  Globe,
  Home,
  ListTodo,
  NotebookPen,
  Target,
  Users,
  Zap,
} from 'lucide-react';

export const navigationSections = [
  {
    label: 'Overview',
    items: [
      {
        path: '/',
        label: 'Dashboard',
        section: 'Overview',
        description: 'See the full picture across focus, clients, cash flow, and follow-ups.',
        icon: Home,
      },
    ],
  },
  {
    label: 'Personal OS',
    items: [
      {
        path: '/daily',
        label: 'Daily Execution',
        section: 'Personal OS',
        description: 'Run today from tasks, habits, schedule, and quick journal actions.',
        icon: Zap,
      },
      {
        path: '/goals',
        label: 'Goals',
        section: 'Personal OS',
        description: 'Track long-term outcomes and the progress behind them.',
        icon: Target,
      },
      {
        path: '/projects',
        label: 'Projects',
        section: 'Personal OS',
        description: 'Manage active projects connected to your goals.',
        icon: FolderOpen,
      },
      {
        path: '/tasks',
        label: 'Tasks',
        section: 'Personal OS',
        description: 'Organize and complete the concrete work on your plate.',
        icon: ListTodo,
      },
      {
        path: '/habits',
        label: 'Habits',
        section: 'Personal OS',
        description: 'Build streaks and keep the repeatable behaviors visible.',
        icon: Flame,
      },
      {
        path: '/calendar',
        label: 'Calendar',
        section: 'Personal OS',
        description: 'Time-block the day and place work into a real schedule.',
        icon: CalendarDays,
      },
      {
        path: '/journal',
        label: 'Journal',
        section: 'Personal OS',
        description: 'Capture thoughts, notes, and daily reflection.',
        icon: NotebookPen,
      },
      {
        path: '/weekly-review',
        label: 'Weekly Review',
        section: 'Personal OS',
        description: 'Review the week and reset direction before the next one starts.',
        icon: BarChart3,
      },
      {
        path: '/ai-planner',
        label: 'AI Planner',
        section: 'Personal OS',
        description: 'Turn a goal into projects and tasks with AI-assisted planning.',
        icon: Bot,
      },
    ],
  },
  {
    label: 'Client Ops',
    items: [
      {
        path: '/pipeline',
        label: 'Pipeline',
        section: 'Client Ops',
        description: 'Track deals from lead to close in one pipeline view.',
        icon: BriefcaseBusiness,
      },
      {
        path: '/contacts',
        label: 'Contacts',
        section: 'Client Ops',
        description: 'Maintain your contact book, client records, and lead sources.',
        icon: Users,
      },
      {
        path: '/invoices',
        label: 'Invoices',
        section: 'Client Ops',
        description: 'Monitor billed work, collections, and overdue payments.',
        icon: FileText,
      },
      {
        path: '/reminders',
        label: 'Reminders',
        section: 'Client Ops',
        description: 'Keep follow-ups and time-sensitive actions from slipping.',
        icon: BellRing,
      },
    ],
  },
  {
    label: 'Utilities',
    items: [
      {
        path: '/integrations',
        label: 'Integrations',
        section: 'Utilities',
        description: 'Connect the workspace to outside tools and services.',
        icon: Globe,
      },
    ],
  },
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
      section: 'SyncPlus',
      description: 'Use the workspace across planning, execution, clients, and operations.',
      icon: Home,
    }
  );
}
