import AiPlanner from '@/pages/AiPlanner';
import Calendar from '@/pages/Calendar';
import Contacts from '@/pages/Contacts';
import Dashboard from '@/pages/Dashboard';
import Expenses from '@/pages/Expenses';
import Goals from '@/pages/Goals';
import Habits from '@/pages/Habits';
import Integrations from '@/pages/Integrations';
import Invoices from '@/pages/Invoices';
import Journal from '@/pages/Journal';
import Pipeline from '@/pages/Pipeline';
import Projects from '@/pages/Projects';
import Reminders from '@/pages/Reminders';
import Settings from '@/pages/Settings';
import Tasks from '@/pages/Tasks';
import TaxCenter from '@/pages/TaxCenter';
import Today from '@/pages/Today';
import WeeklyReview from '@/pages/WeeklyReview';

export const appRoutes = [
  { path: '/', component: Dashboard },
  { path: '/daily', component: Today },
  { path: '/goals', component: Goals },
  { path: '/projects', component: Projects },
  { path: '/tasks', component: Tasks },
  { path: '/habits', component: Habits },
  { path: '/calendar', component: Calendar },
  { path: '/journal', component: Journal },
  { path: '/weekly-review', component: WeeklyReview },
  { path: '/ai-planner', component: AiPlanner },
  { path: '/pipeline', component: Pipeline },
  { path: '/contacts', component: Contacts },
  { path: '/invoices', component: Invoices },
  { path: '/expenses', component: Expenses },
  { path: '/tax', component: TaxCenter },
  { path: '/reminders', component: Reminders },
  { path: '/integrations', component: Integrations },
  { path: '/settings', component: Settings },
];

export const legacyRedirects = [
  { path: '/dashboard', to: '/' },
];