import AiPlanner from '@/pages/AiPlanner';
import Calendar from '@/pages/Calendar';
import Contacts from '@/pages/Contacts';
import Dashboard from '@/pages/Dashboard';
import Expenses from '@/pages/Expenses';
import Invoices from '@/pages/Invoices';
import Pipeline from '@/pages/Pipeline';
import Goals from '@/pages/Goals';
import Habits from '@/pages/Habits';
import Journal from '@/pages/Journal';
import TaxCenter from '@/pages/TaxCenter';
import Projects from '@/pages/Projects';
import Settings from '@/pages/Settings';
import Tasks from '@/pages/Tasks';
import Today from '@/pages/Today';
import WeeklyReview from '@/pages/WeeklyReview';
import BusinessHub from '@/pages/BusinessHub';
import Reminders from '@/pages/Reminders';
import LoginPage from '@/pages/LoginPage';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/AuthContext';
import { Navigate, Route, Routes } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="daily" element={<Today />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="goals" element={<Goals />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="habits" element={<Habits />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="tax" element={<TaxCenter />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="business" element={<BusinessHub />} />
        <Route path="journal" element={<Journal />} />
        <Route path="weekly-hub" element={<WeeklyReview />} />
        <Route path="ai-planner" element={<AiPlanner />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}