import AiPlanner from '@/pages/AiPlanner';
import Calendar from '@/pages/Calendar';
import Contacts from '@/pages/Contacts';
import DailyExecution from '@/pages/DailyExecution';
import Dashboard from '@/pages/Dashboard';
import Goals from '@/pages/Goals';
import Habits from '@/pages/Habits';
import Integrations from '@/pages/Integrations';
import Invoices from '@/pages/Invoices';
import Journal from '@/pages/Journal';
import Pipeline from '@/pages/Pipeline';
import Projects from '@/pages/Projects';
import Reminders from '@/pages/Reminders';
import Tasks from '@/pages/Tasks';
import WeeklyReview from '@/pages/WeeklyReview';

export const appRoutes = [
  { path: '/', component: Dashboard },
  { path: '/dashboard', component: Dashboard },
  { path: '/daily', component: DailyExecution },
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
  { path: '/reminders', component: Reminders },
  { path: '/integrations', component: Integrations },
];

export const legacyRedirects = [
  { path: '/welcome', to: '/' },
  { path: '/vision', to: '/goals' },
  { path: '/today', to: '/daily' },
  { path: '/systems', to: '/projects' },
  { path: '/review', to: '/weekly-review' },
];
