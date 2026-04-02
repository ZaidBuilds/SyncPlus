import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { BarChart2, RefreshCw, Sparkles, Target, Plus, Trash2, Check, Pencil } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { generateWeeklyReview } from '@/lib/localInsights';

export default function WeeklyReview() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weeklyPriority, setWeeklyPriority] = useState(null);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [prioritySaved, setPrioritySaved] = useState(false);

  const weekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  // Next week's Monday (always the planning target)
  const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
  const nextWeekStartStr = format(nextWeekStart, 'yyyy-MM-dd');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [t, h, hl, j, g, p, wp] = await Promise.all([
        dataClient.entities.Task.list('-updated_date', 500),
        dataClient.entities.Habit.list('-created_date', 100),
        dataClient.entities.HabitLog.list('-date', 500),
        dataClient.entities.JournalEntry.list('-date', 50),
        dataClient.entities.Goal.list('-created_date', 100),
        dataClient.entities.Project.list('-created_date', 200),
        dataClient.entities.WeeklyPriority.filter({ week_start: format(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd') }, '-created_date', 1),
      ]);
      setTasks(t); setHabits(h); setHabitLogs(hl); setJournalEntries(j); setGoals(g); setProjects(p);
      if (wp.length > 0) {
        setWeeklyPriority(wp[0]);
      } else {
        setWeeklyPriority({ week_start: format(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'), priorities: ['', '', ''], intention: '' });
      }
      setLoading(false);
    };
    load();
  }, []);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const weekTasks = tasks.filter(t => t.due_date >= weekStartStr && t.due_date <= weekEndStr);
  const doneTasks = weekTasks.filter(t => t.status === 'done');
  const weekHabitLogs = habitLogs.filter(l => l.date >= weekStartStr && l.date <= weekEndStr);
  const habitCompletionRate = weekHabitLogs.length > 0 ? Math.round((weekHabitLogs.filter(l => l.completed).length / (habits.length * 7)) * 100) : 0;
  const weekJournals = journalEntries.filter(j => j.date >= weekStartStr && j.date <= weekEndStr);
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;

  const tasksByDay = days.map(day => {
    const d = format(day, 'yyyy-MM-dd');
    return {
      day: format(day, 'EEE'),
      done: tasks.filter(t => t.due_date === d && t.status === 'done').length,
      total: tasks.filter(t => t.due_date === d).length,
    };
  });

  const habitsByDay = days.map(day => {
    const d = format(day, 'yyyy-MM-dd');
    const dayLogs = habitLogs.filter(l => l.date === d);
    return {
      day: format(day, 'EEE'),
      completed: dayLogs.filter(l => l.completed).length,
    };
  });

  const savePriorities = async () => {
    if (!weeklyPriority) return;
    setPriorityLoading(true);
    const data = { ...weeklyPriority, priorities: weeklyPriority.priorities.filter(p => p.trim()) };
    if (weeklyPriority.id) {
      await dataClient.entities.WeeklyPriority.update(weeklyPriority.id, data);
    } else {
      const created = await dataClient.entities.WeeklyPriority.create(data);
      setWeeklyPriority(prev => ({ ...prev, id: created.id }));
    }
    setPriorityLoading(false);
    setPrioritySaved(true);
    setTimeout(() => setPrioritySaved(false), 2500);
  };

  const updatePriority = (index, value) => {
    setWeeklyPriority(prev => {
      const updated = [...(prev.priorities || [])];
      updated[index] = value;
      return { ...prev, priorities: updated };
    });
  };

  const addPriority = () => {
    setWeeklyPriority(prev => ({ ...prev, priorities: [...(prev.priorities || []), ''] }));
  };

  const removePriority = (index) => {
    setWeeklyPriority(prev => ({ ...prev, priorities: prev.priorities.filter((_, i) => i !== index) }));
  };

  const generateAiReview = async () => {
    setAiLoading(true);
    try {
      setAiReview(generateWeeklyReview({
        tasks_done: doneTasks.length,
        tasks_total: weekTasks.length,
        habit_completion_rate: habitCompletionRate,
        journals_written: weekJournals.length,
        overdue_items: tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < weekEndStr).length,
      }));
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><BarChart2 size={20} className="text-primary" /> Weekly Review</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{format(weekStart, 'd MMM')} – {format(weekEnd, 'd MMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w + 1)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary">← Prev</button>
          {weekOffset > 0 && <button onClick={() => setWeekOffset(0)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">This Week</button>}
          {weekOffset > 0 && <button onClick={() => setWeekOffset(w => w - 1)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary">Next →</button>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tasks Done', value: `${doneTasks.length}/${weekTasks.length}`, color: 'text-green-600', sub: `${weekTasks.length > 0 ? Math.round((doneTasks.length/weekTasks.length)*100) : 0}% rate` },
          { label: 'Habit Rate', value: `${habitCompletionRate}%`, color: 'text-orange-500', sub: `${weekHabitLogs.filter(l=>l.completed).length} logs` },
          { label: 'Journal Days', value: `${weekJournals.length}/7`, color: 'text-blue-600', sub: 'entries written' },
          { label: 'Active Goals', value: activeGoals, color: 'text-purple-600', sub: `${completedProjects} projects done` },
        ].map(card => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Task completion chart */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Tasks Completed Per Day</h2>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={tasksByDay} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f5f5f5' }} />
              <Bar dataKey="done" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Done" />
              <Bar dataKey="total" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Habit chart */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Habits Completed Per Day</h2>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={habitsByDay} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f5f5f5' }} />
              <Bar dataKey="completed" fill="#f97316" radius={[4, 4, 0, 0]} name="Habits Done" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Journal mood summary */}
      {weekJournals.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">Mood This Week</h2>
          <div className="flex gap-2 flex-wrap">
            {weekJournals.map(j => (
              <div key={j.id} className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl text-xs">
                <span className="text-muted-foreground">{format(new Date(j.date), 'EEE d')}</span>
                <span>{ j.mood === 'amazing' ? '🔥' : j.mood === 'good' ? '😊' : j.mood === 'neutral' ? '😐' : j.mood === 'bad' ? '😔' : j.mood === 'stressed' ? '😤' : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Week Priorities */}
      {weeklyPriority && (
        <div className="bg-card border-2 border-primary/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-accent/40">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-primary" />
              <h2 className="text-sm font-semibold">Plan Next Week</h2>
              <span className="text-xs text-muted-foreground ml-1">{format(nextWeekStart, 'd MMM')} – {format(addWeeks(nextWeekStart, 0), 'd MMM')}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Define your top priorities before the week begins</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Weekly intention */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">🌟 Theme / Intention</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background placeholder-muted-foreground/50"
                placeholder="e.g. Ship the MVP, focus on health, reconnect with family..."
                value={weeklyPriority.intention || ''}
                onChange={e => setWeeklyPriority(prev => ({ ...prev, intention: e.target.value }))}
              />
            </div>

            {/* Priority list */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">🎯 Top Priorities</label>
              <div className="space-y-2">
                {(weeklyPriority.priorities || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <input
                      className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background placeholder-muted-foreground/50"
                      placeholder={`Priority ${i + 1}...`}
                      value={p}
                      onChange={e => updatePriority(i, e.target.value)}
                    />
                    {(weeklyPriority.priorities || []).length > 1 && (
                      <button onClick={() => removePriority(i)} className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {(weeklyPriority.priorities || []).length < 7 && (
                <button onClick={addPriority} className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Plus size={12} /> Add priority
                </button>
              )}
            </div>

            <button
              onClick={savePriorities}
              disabled={priorityLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${prioritySaved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:opacity-60`}
            >
              {prioritySaved ? <><Check size={14} /> Saved!</> : priorityLoading ? 'Saving...' : 'Save Priorities for Next Week'}
            </button>
          </div>
        </div>
      )}

      {/* Weekly Review */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-primary" />
            <h2 className="text-sm font-semibold">Weekly Coach</h2>
          </div>
          <button onClick={generateAiReview} disabled={aiLoading} className="flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} />
            {aiLoading ? 'Preparing...' : 'Generate Review'}
          </button>
        </div>
        {aiReview ? (
          <div className="divide-y divide-border">
            <div className="px-5 py-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{aiReview.overall_score}/10</span>
              <span className="text-sm text-muted-foreground">Overall week score</span>
            </div>
            {[{ icon: '✅', label: 'What Worked', val: aiReview.what_worked }, { icon: '⚠️', label: 'What to Improve', val: aiReview.what_to_improve }, { icon: '🎯', label: 'Next Week Focus', val: aiReview.next_week_focus }].map(row => (
              <div key={row.label} className="px-5 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">{row.icon} {row.label.toUpperCase()}</p>
                <p className="text-sm">{row.val}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-muted-foreground">Click "Generate Review" to get a local weekly analysis based on your current data.</p>
        )}
      </div>
    </div>
  );
}
