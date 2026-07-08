import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataClient } from '@/lib/dataClient';
import { 
  Target, TrendingUp, CalendarRange, ArrowUpRight, Zap,
  Wallet, Activity, ShieldCheck
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isToday, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    goals: [], tasks: [], projects: [], habits: [], habitLogs: [], invoices: [], expenses: []
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [g, t, p, h, hl, i, e] = await Promise.all([
      dataClient.entities.Goal.list('-created_date', 50),
      dataClient.entities.Task.list('-created_date', 200),
      dataClient.entities.Project.list('-created_date', 100),
      dataClient.entities.Habit.list('-created_date', 50),
      dataClient.entities.HabitLog.list('-date', 500),
      dataClient.entities.Invoice.list('-issue_date', 100),
      dataClient.entities.Expense.list('-date', 100)
    ]);
    setData({ goals: g, tasks: t, projects: p, habits: h, habitLogs: hl, invoices: i, expenses: e });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeGoals = useMemo(() => data.goals.filter(g => g.status === 'active'), [data.goals]);
  const todayTasks = useMemo(() => data.tasks.filter(t => t.due_date === format(new Date(), 'yyyy-MM-dd') && t.status !== 'done'), [data.tasks]);
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), []);
  
  const weekProgress = useMemo(() => {
    const weekTasks = data.tasks.filter(t => t.due_date && new Date(t.due_date) >= weekStart && new Date(t.due_date) <= weekEnd);
    const weekDone = weekTasks.filter(t => t.status === 'done').length;
    return weekTasks.length > 0 ? Math.round((weekDone / weekTasks.length) * 100) : 0;
  }, [data.tasks, weekStart, weekEnd]);

  const habitProgress = useMemo(() => {
    const todayHabits = data.habits.length;
    const todayHabitDone = data.habits.filter(h => data.habitLogs.find(l => l.habit_id === h.id && l.date === format(new Date(), 'yyyy-MM-dd') && l.completed)).length;
    return todayHabits > 0 ? Math.round((todayHabitDone / todayHabits) * 100) : 0;
  }, [data.habits, data.habitLogs]);

  const financialStats = useMemo(() => ({
    revenue: data.invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
    pending: data.invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
    expenses: data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  }), [data.invoices, data.expenses]);

  if (loading) return <div className="flex items-center justify-center h-screen text-xs font-black uppercase tracking-widest opacity-40">Loading Vantage workspace...</div>;

  const hasWorkspaceData = [data.goals, data.tasks, data.projects, data.habits, data.invoices, data.expenses].some((list) => list.length > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      
      {/* Welcome & Global KPI */}
      <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr] items-start pb-12 border-b border-border/50">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Vantage OS</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{format(new Date(), 'EEEE, MMMM do')}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tighter leading-tight">Command your work with clarity.</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">Vantage brings your goals, projects, habits, and business operations into one local-first operating system. Start with what matters and keep the rest in view.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => navigate('/weekly-hub')} className="vantage-button-primary shadow-2xl flex items-center justify-center gap-2">
              <CalendarRange size={16} /> Open Weekly Hub
            </button>
            <button onClick={() => navigate('/goals')} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-muted transition-colors">
              Create your first goal
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="vantage-card p-6 bg-muted/80 border-border">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">Quick start</p>
            <h2 className="mt-4 text-xl font-black tracking-tight">Build your first operating rhythm</h2>
            <p className="mt-2 text-sm text-muted-foreground">Add a goal, set a task, and define a daily ritual to see Vantage come alive.</p>
            <div className="mt-6 grid gap-2 text-sm">
              <button onClick={() => navigate('/tasks')} className="rounded-xl border border-border bg-background px-4 py-3 text-left font-semibold hover:bg-muted transition">Add a task</button>
              <button onClick={() => navigate('/habits')} className="rounded-xl border border-border bg-background px-4 py-3 text-left font-semibold hover:bg-muted transition">Add a habit</button>
              <button onClick={() => navigate('/projects')} className="rounded-xl border border-border bg-background px-4 py-3 text-left font-semibold hover:bg-muted transition">Add a project</button>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Weekly Completion" value={`${weekProgress}%`} icon={Activity} progress={weekProgress} />
        <MetricCard label="Ritual Consistency" value={`${habitProgress}%`} icon={Zap} progress={habitProgress} />
        <MetricCard label="Strategic Pillars" value={activeGoals.length} icon={ShieldCheck} />
        <MetricCard label="Mission Critical" value={todayTasks.length} icon={Target} />
      </div>

      {!hasWorkspaceData && (
        <section className="vantage-card border-dashed border-2 border-border/60 p-8 text-center">
          <h2 className="text-2xl font-black tracking-tight">Your Vantage workspace is ready.</h2>
          <p className="mt-3 text-sm text-muted-foreground">There is no data yet, but everything is set up. Start with one goal, one project, or one habit to see the dashboard fill in.</p>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Main Content: Trends & Pillars */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Strategic Momentum Chart */}
          <section className="vantage-card space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                <TrendingUp size={24} className="text-primary" /> Strategic Momentum
              </h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="w-4 h-1 bg-muted rounded-full" />)}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-6 h-48 items-end">
              {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((day, i) => {
                const dayTasks = data.tasks.filter(t => t.due_date === format(day, 'yyyy-MM-dd'));
                const dayDone = dayTasks.filter(t => t.status === 'done').length;
                const ratio = dayTasks.length > 0 ? (dayDone / dayTasks.length) : 0;
                const active = isToday(day);
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-3 group">
                    <div className="relative w-full flex-1 flex flex-col justify-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(ratio * 100, 8)}%` }}
                        className={cn(
                          "w-full rounded-2xl transition-all duration-500 shadow-sm",
                          active ? "bg-primary" : "bg-muted-foreground/10 group-hover:bg-muted-foreground/20"
                        )}
                      />
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-primary" : "text-muted-foreground opacity-40")}>
                      {format(day, 'EEE')}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Goal Horizons */}
          <section className="space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
              <ShieldCheck size={24} className="text-primary" /> Goal Horizons
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeGoals.map(goal => {
                const gTasks = data.tasks.filter(t => t.goal_id === goal.id);
                const doneTasks = gTasks.filter(t => t.status === 'done').length;
                const progress = gTasks.length > 0 ? Math.round((doneTasks / gTasks.length) * 100) : 0;

                return (
                  <div key={goal.id} className="vantage-card group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strategic Pillar</p>
                        <h4 className="font-black text-lg tracking-tight uppercase italic">{goal.title}</h4>
                      </div>
                      <span className="text-2xl font-black tracking-tighter">{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar: Financials & Daily Action */}
        <div className="space-y-12">
          
          {/* Executive Financials */}
          <section className="vantage-card bg-primary text-primary-foreground !p-8 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-xl font-black tracking-tight flex items-center justify-between border-b border-white/10 pb-4">
              Capital <Wallet size={20} />
            </h3>
            <div className="space-y-6">
              <FinanceItem label="Profitability" value={`₹${((financialStats.revenue - financialStats.expenses)/1000).toFixed(1)}k`} highlighted />
              <FinanceItem label="Total Revenue" value={`₹${(financialStats.revenue/1000).toFixed(1)}k`} />
              <FinanceItem label="Awaiting" value={`₹${(financialStats.pending/1000).toFixed(1)}k`} />
            </div>
            <button onClick={() => navigate('/business')} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              Manage Business Hub
            </button>
          </section>

          {/* Daily Mission Critical */}
          <section className="vantage-card space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight">Mission Critical</h3>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Zap size={14} />
              </div>
            </div>
            <div className="space-y-2">
              {todayTasks.length > 0 ? todayTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-all cursor-pointer group">
                  <div className="w-1.5 h-6 bg-primary/10 rounded-full group-hover:bg-primary transition-all" />
                  <span className="font-bold text-sm truncate flex-1">{task.title}</span>
                  <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              )) : (
                <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                  Mission Accomplished
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, progress }) {
  return (
    <div className="vantage-card relative overflow-hidden group">
      {progress !== undefined && (
        <div className="absolute inset-0 bg-primary opacity-[0.02] group-hover:opacity-[0.05] transition-opacity" />
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-2xl bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="text-4xl font-black tracking-tighter leading-none">{value}</div>
    </div>
  );
}

function FinanceItem({ label, value, highlighted }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{label}</span>
      <span className={cn("font-black tracking-tighter", highlighted ? "text-3xl" : "text-xl text-white/80")}>{value}</span>
    </div>
  );
}