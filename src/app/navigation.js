import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  FileText,
  FolderOpen,
  Home,
  ListTodo,
  NotebookPen,
  Receipt,
  Settings2,
  Target,
  Users,
  Zap,
} from 'lucide-react';

export const navigationSections = [
  {
    label: 'Command Center',
    items: [
      {
        path: '/',
        label: 'Dashboard',
        section: 'Execution',
        description: 'See the full picture across clients, cash flow, and focus.',
        icon: Home,
      },
      {
        path: '/daily',
        label: 'Daily Execution',
        section: 'Execution',
        description: 'Your single page to run the day. Tasks, habits, and schedule in one view.',
        icon: Zap,
      },
      {
        path: '/calendar',
        label: 'Calendar',
        section: 'Execution',
        description: 'Time-block the week and place work into a real schedule.',
        icon: CalendarDays,
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
        path: '/invoices',
        label: 'Invoices & Cash',
        section: 'Client Ops',
        description: 'Monitor billed work, collections, and overdue payments.',
        icon: FileText,
      },
      {
        path: '/contacts',
        label: 'Contacts',
        section: 'Client Ops',
        description: 'Maintain your contact book, client records, and lead sources.',
        icon: Users,
      },
      {
        path: '/expenses',
        label: 'Expenses',
        section: 'Client Ops',
        description: 'Track software, ads, travel, and business spending.',
        icon: Receipt,
      },
      {
        path: '/tax',
        label: 'TDS & Tax',
        section: 'Client Ops',
        description: 'Monitor TDS credits, advance tax, and financial-year estimates.',
        icon: Calculator,
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
        label: 'Tasks Backlog',
        section: 'Life OS',
        description: 'Organize and complete the concrete work on your plate.',
        icon: ListTodo,
      },
    ],
  },
  {
    label: 'Discipline',
    items: [
      {
        path: '/journal',
        label: 'Reflect',
        section: 'Discipline',
        description: 'Capture thoughts, notes, and daily reflection.',
        icon: NotebookPen,
      },
      {
        path: '/weekly-review',
        label: 'Weekly Review',
        section: 'Discipline',
        description: 'Review the week and reset direction before the next one starts.',
        icon: BarChart3,
      },
      {
        path: '/ai-planner',
        label: 'AI Strategist',
        section: 'Discipline',
        description: 'Turn a goal into projects and tasks with AI-assisted planning.',
        icon: Bot,
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        path: '/settings',
        label: 'Settings',
        section: 'Workspace',
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
      section: 'SyncPlus',
      description: 'Use the workspace across planning, execution, clients, and operations.',
      icon: Home,
    }
  );
}
