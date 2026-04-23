import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Plus,
  Flame,
  ListTodo,
  Calendar,
  Target,
  DollarSign,
  ChevronRight,
  Trophy,
  Sparkles,
  BriefcaseBusiness,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  loadLifeOsSnapshot,
  formatCurrency,
  getTodayProgress,
  getWeeklyData,
  getTodayCalendarBlocks,
  getUserName,
  getStreakStats,
  getMotivationMessage,
  getOpenInvoiceTotal,
  getActiveProjectsCount,
  getTodayOverdueCount,
  getWeeklyGoalProgress,
} from '@/lib/workspace';
import { dataClient } from '@/lib/dataClient';
import RevenueChart from '@/components/dashboard/RevenueChart';
import PipelineFunnel from '@/components/dashboard/PipelineFunnel';
import OutstandingInvoices from '@/components/dashboard/OutstandingInvoices';
import AgingDeals from '@/components/dashboard/AgingDeals';
import RevenueGoal from '@/components/dashboard/RevenueGoal';
import LifeOSWidget from '@/components/dashboard/LifeOSWidget';

const MOTIVATIONAL_QUOTES = [
  "The only way is forward. — Marcus Aurelius",
  "Small steps every day lead to big changes.",
  "Progress, not perfection.",
  "What gets scheduled gets done.",
  "Trust the process.",
  "Your future self will thank you.",
];

/* ────────────────────────── Animation helpers ────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};

/* ────────────────────────── Sub-components ────────────────────────── */

function StreakHero({ streak, best, avg, percentToNext }) {
  let gradient = 'from-gray-400 to-gray-500';
  if (streak >= 30) gradient = 'from-yellow-400 to-orange-500';
  else if (streak >= 14) gradient = 'from-red-500 to-red-600';
  else if (streak >= 7) gradient = 'from-orange-500 to-red-500';
  else if (streak >= 1) gradient = 'from-orange-400 to-orange-500';

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentToNext / 100) * circumference;
  const gradientId = `streak-gradient-${Math.min(streak, 30)}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">

function StreakHero({ streak, best, avg, percentToNext }) {
  const gradient = useMemo(() => {
    if (streak >= 30) return 'from-yellow-400 to-orange-500';
    if (streak >= 14) return 'from-red-500 to-red-600';
    if (streak >= 7) return 'from-orange-500 to-red-500';
    if (streak >= 1) return 'from-orange-400 to-orange-500';
    return 'from-gray-400 to-gray-500';
  }, [streak]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentToNext / 100) * circumference;
  const gradientId = 'streak-ring-gradient'; // stable unique ID

  const stops = useMemo(() => {
    if (streak >= 30) return ['#fbbf24', '#f59e0b'];
    if (streak >= 14) return ['#dc2626', '#b91c1c'];
    if (streak >= 7) return ['#ea580c', '#c2410c'];
    return ['#fb923c', '#f97316'];
  }, [streak]);

  return (
    <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{streak} days</p>
            </div>
          </div>
          {streak >= 7 && (
            <div className="px-2 py-1 bg-yellow-100 rounded-full text-xs font-semibold text-yellow-700 flex items-center gap-1">
              <Trophy size={12} /> Best: {best}d
            </div>
          )}
        </div>

        {/* Progress ring */}
        <div className="relative flex items-center justify-center my-4">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={stops[0]} />
                <stop offset="100%" stopColor={stops[1]} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-900">{percentToNext}%</span>
            <span className="text-xs text-gray-500">to 30-day</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div>
            <span className="font-semibold">Best:</span> {best}d
          </div>
          <div>
            <span className="font-semibold">Average:</span> {avg}d
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-orange-600 font-medium">
              <Sparkles size={12} /> On fire!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TaskCheckItem({ item, onToggle }) {
  const isDone = item.record?.status === 'done' || item.completed;
  const isHabit = item.kind === 'habit';

  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${isDone ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-emerald-600"
        checked={isDone}
        onChange={() => onToggle(item)}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
        )}
      </div>
      {isHabit && (
        <Flame size={14} className="text-orange-500 flex-shrink-0" />
      )}
    </label>
  );
}

function FocusBoard({ items, onToggle, onQuickAdd }) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleQuickAdd = useCallback(() => {
    if (newTaskTitle.trim()) {
      onQuickAdd(newTaskTitle);
      setNewTaskTitle('');
      setShowQuickAdd(false);
    }
  }, [newTaskTitle, onQuickAdd]);

  const incompleteCount = items.filter(i => !i.completed).length;

  return (
    <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Today&apos;s Focus</p>
          <h3 className="font-semibold text-gray-900 mt-0.5">
            {incompleteCount} item{incompleteCount !== 1 ? 's' : ''} remaining
          </h3>
        </div>
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1 transition-colors"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {showQuickAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <input
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleQuickAdd}
              className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            >
              Add Task
            </button>
        <Link
          to="/daily"
          className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-gray-200 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View all in Today <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

function WeeklyMomentum({ weeklyData }) {
  const max = Math.max(...weeklyData.map(d => d.habitsDone + d.tasksDone), 1);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Weekly Momentum</p>
          <h3 className="font-semibold text-gray-900 mt-0.5">Last 7 days</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Tasks + Habits</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1 h-48 px-1">
        {weeklyData.map((day, i) => {
          const count = day.habitsDone + day.tasksDone;
          const height = Math.max((count / max) * 100, 4); // Min 4% height for visibility
          const isToday = day.date === todayStr;
          const dayName = format(new Date(day.date), 'EEE');
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
              {/* Count label (above bar) */}
              {count > 0 && (
                <span className="text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </span>
              )}
              
              {/* Bar container */}
              <div className="w-full flex items-end justify-center h-40">
                <div className="relative w-full max-w-[32px] flex flex-col justify-end">
                  <div
                    className={`w-full rounded-t-md transition-all duration-700 cursor-pointer relative ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
                    style={{
                      height: `${height}%`,
                      background: `linear-gradient(to top, ${count > 0 ? 'rgb(16, 185, 129)' : 'rgb(209, 213, 219)'} 0%, ${count > 0 ? 'rgb(5, 150, 105)' : 'rgb(229, 231, 235)'} 100%)`
                    }}
                    title={`${dayName}: ${count} completions`}
                  />
                </div>
              </div>
              
              {/* Day label */}
              <span className={`text-xs font-medium ${isToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                {dayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TodaySchedule({ blocks }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Today&apos;s Schedule</p>
          <h3 className="font-semibold text-gray-900 mt-0.5">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} scheduled
          </h3>
        </div>
        <Link
          to="/calendar"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View calendar
        </Link>
      </div>

      <div className="space-y-2">
        {blocks.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-gray-400 text-sm">No blocks scheduled</p>
            <Link to="/calendar" className="text-xs text-emerald-600 hover:underline mt-1 inline-block">
              Add time block
            </Link>
          </div>
        ) : (
          blocks.slice(0, 4).map((block) => {
            const startHour = parseInt(block.start_time.split(':')[0], 10);
            const period = startHour < 12 ? 'AM' : 'PM';
            const displayHour = startHour % 12 || 12;
            
            return (
              <div
                key={block.id}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
              >
                <div className="flex flex-col items-center min-w-[50px]">
                  <span className="text-sm font-bold text-gray-900">{displayHour}{period[0]}</span>
                  <span className="text-xs text-gray-500">{block.start_time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{block.title}</p>
                  <p className="text-xs text-gray-500">{block.end_time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {blocks.length > 4 && (
        <p className="text-xs text-gray-400 text-center mt-3">
          +{blocks.length - 4} more blocks
        </p>
      )}

      <Link
        to="/calendar"
        className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-gray-100 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
      >
        <Plus size={14} /> Add block
      </Link>
    </div>
  );
}

function QuickStatsRow({ tasksDue, projectsActive, invoiceTotal, streak }) {
  const stats = [
    { label: 'Tasks due', value: tasksDue, to: '/tasks', icon: ListTodo, color: 'text-blue-600' },
    { label: 'Projects', value: projectsActive, to: '/projects', icon: Target, color: 'text-purple-600' },
    { label: 'Unpaid', value: `₹${formatCurrency(invoiceTotal)}`, to: '/invoices', icon: DollarSign, color: 'text-amber-600' },
    { label: 'Streak', value: `${streak}d`, to: '/habits', icon: Flame, color: 'text-orange-600' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.label}
            to={stat.to}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Icon size={14} className={stat.color} />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">{stat.value}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function WeeklyGoalProgress({ weeklyProgress }) {
  const { done, total, percent } = weeklyProgress;
  const color = percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500';
  
  if (total === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Weekly Goal</p>
        <span className="text-sm font-bold text-gray-900">{done}/{total} tasks</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{percent}% complete</p>
    </div>
  );
}

function InlineQuickAdd({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text);
      setText('');
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
      >
        <Plus size={14} /> Quick add task...
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder="e.g., Call client tomorrow at 3pm"
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        autoFocus
      />
      <button
        onClick={handleAdd}
        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
      >
        Add
      </button>
      <button
        onClick={() => { setOpen(false); setText(''); }}
        className="px-3 py-2 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('syncplus-user') || '{}');

  useEffect(() => {
    loadLifeOsSnapshot().then((data) => {
      setSnapshot(data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load snapshot:', err);
      setError(err.message || 'Failed to load data');
      setLoading(false);
    });
  }, []);

  const data = useMemo(() => {
    if (!snapshot) return null;

    // Get all incomplete tasks and habits for today
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    
    const tasks = snapshot.tasks
      .filter(t => t.status !== 'done' && (!t.due_date || t.due_date === todayKey))
      .slice(0, 7)
      .map(t => ({ 
        id: `task-${t.id}`, 
        title: t.title, 
        kind: 'task', 
        record: t,
        completed: t.status === 'done',
        subtitle: t.due_date ? `Due ${t.due_date}` : ''
      }));

    const habits = snapshot.habits
      .filter(h => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const log = snapshot.habitLogs.find(l => l.habit_id === h.id && l.date === today);
        return !log?.completed;
      })
      .slice(0, 4)
      .map(h => ({ 
        id: `habit-${h.id}`, 
        title: h.name, 
        kind: 'habit', 
        record: h,
        completed: false 
      }));

    const items = [...tasks, ...habits];

    const streakStats = getStreakStats(snapshot.habits, snapshot.habitLogs);
    const progress = getTodayProgress(snapshot);
    const weekly = getWeeklyData(snapshot);
    const todayBlocks = getTodayCalendarBlocks(snapshot).slice(0, 4);
    const weeklyProgress = getWeeklyGoalProgress(snapshot);
    const overdueCount = getTodayOverdueCount(snapshot);

    return {
      userName: getUserName(snapshot),
      streak: streakStats.current,
      streakBest: streakStats.best,
      streakAvg: streakStats.avg,
      streakPercent: streakStats.percentToNext,
      progress,
      weekly,
      items,
      todayBlocks,
      weeklyProgress,
      overdueCount,
      invoiceTotal: getOpenInvoiceTotal(snapshot),
      projectsActive: getActiveProjectsCount(snapshot),
    };
  }, [snapshot]);

  const handleToggle = async (item) => {
    if (!item.record) return;

    try {
      if (item.kind === 'habit') {
        const today = format(new Date(), 'yyyy-MM-dd');
        const existing = snapshot.habitLogs.find(l => l.habit_id === item.record.id && l.date === today);
        
        if (existing) {
          await dataClient.entities.HabitLog.update(existing.id, { completed: !existing.completed });
        } else {
          await dataClient.entities.HabitLog.create({
            habit_id: item.record.id,
            date: today,
            completed: true,
          });
        }
      } else if (item.kind === 'task') {
        await dataClient.entities.Task.update(item.record.id, { 
          status: item.record.status === 'done' ? 'todo' : 'done' 
        });
      }

      const fresh = await loadLifeOsSnapshot();
      setSnapshot(fresh);
    } catch (e) {
      console.error('Failed to update:', e);
    }
  };

  const handleQuickAdd = async (title) => {
    try {
      // Simple task creation with today's date
      await dataClient.entities.Task.create({
        title,
        status: 'todo',
        due_date: format(new Date(), 'yyyy-MM-dd'),
      });
      const fresh = await loadLifeOsSnapshot();
      setSnapshot(fresh);
    } catch (e) {
      console.error('Failed to add task:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          Loading your command center...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Failed to load dashboard</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  const progressPercent = data.progress.totalHabits + data.progress.tasksDue > 0
    ? Math.round(((data.progress.habitsCompleted + data.progress.tasksDone) / 
       (data.progress.totalHabits + data.progress.tasksDue)) * 100)
    : 0;
  const motivation = getMotivationMessage(data.streak, progressPercent, data.overdueCount);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {greeting}, {data.userName}! 👋
              </h1>
              <p className="text-gray-600 mt-1 text-lg">{format(today, 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex items-center gap-3">
              {data.streak >= 7 && (
                <div className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-1">
                  🔥 {data.streak} day streak
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 italic max-w-2xl">&quot;{quote}&quot;</p>
          <p className="text-sm text-emerald-600 font-medium">{motivation}</p>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap gap-2 pt-2">
            <QuickStatsRow 
              tasksDue={(data.progress.tasksDue - data.progress.tasksDone) || 0}
              projectsActive={data.projectsActive}
              invoiceTotal={data.invoiceTotal}
              streak={data.streak}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Focus Board + Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <FocusBoard 
              items={data.items} 
              onToggle={handleToggle}
              onQuickAdd={handleQuickAdd}
            />
            
            <TodaySchedule blocks={data.todayBlocks} />
          </div>

          {/* Right Column - Streak + Momentum + Goals */}
          <div className="space-y-6">
            <StreakHero 
              streak={data.streak}
              best={data.streakBest}
              avg={data.streakAvg}
              percentToNext={data.streakPercent}
            />
            
            <WeeklyMomentum weeklyData={data.weekly} />
            
            <WeeklyGoalProgress weeklyProgress={data.weeklyProgress} />

            {/* Quick Links (compact) */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Access</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/habits" className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">
                  <Flame size={14} className="text-orange-500" /> Habits
                </Link>
                <Link to="/tasks" className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">
                  <ListTodo size={14} className="text-blue-500" /> Tasks
                </Link>
                <Link to="/calendar" className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">
                  <Calendar size={14} className="text-purple-500" /> Calendar
                </Link>
                <Link to="/journal" className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">
                  <Sparkles size={14} className="text-yellow-500" /> Journal
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
          SyncPlus • {format(today, 'MMMM yyyy')} • {data.items.length} item{data.items.length !== 1 ? 's' : ''} due today
        </div>
      </div>
    </div>
  );
}