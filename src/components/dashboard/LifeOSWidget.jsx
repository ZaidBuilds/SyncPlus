import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Flame, Target, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

export default function LifeOSWidget() {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dataClient.entities.Task.filter({ status: 'todo' }, '-created_date', 10),
      dataClient.entities.Habit.list('-created_date', 20),
      dataClient.entities.HabitLog.filter({ date: today }, '-created_date', 50),
      dataClient.entities.Goal.filter({ status: 'active' }, '-created_date', 5),
    ]).then(([t, h, hl, g]) => {
      setTasks(t); setHabits(h); setHabitLogs(hl); setGoals(g); setLoading(false);
    });
  }, []);

  const toggleTask = async (task) => {
    await dataClient.entities.Task.update(task.id, { status: 'done' });
    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const toggleHabit = async (habit) => {
    const existing = habitLogs.find(l => l.habit_id === habit.id);
    if (existing) {
      await dataClient.entities.HabitLog.update(existing.id, { completed: !existing.completed });
      setHabitLogs(prev => prev.map(l => l.habit_id === habit.id ? { ...l, completed: !l.completed } : l));
    } else {
      const created = await dataClient.entities.HabitLog.create({ habit_id: habit.id, date: today, completed: true });
      setHabitLogs(prev => [...prev, created]);
    }
  };

  const isHabitDone = (habitId) => habitLogs.find(l => l.habit_id === habitId)?.completed || false;

  if (loading) return <div className="bg-card border border-border rounded-xl p-5 animate-pulse h-40" />;

  const topTasks = tasks.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])).slice(0, 3);
  const habitsCompleted = habits.filter(h => isHabitDone(h.id)).length;

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {/* Today's Tasks */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s Tasks</h3>
          <Link to="/daily" className="text-xs text-primary flex items-center gap-1 hover:underline">All <ArrowRight size={11} /></Link>
        </div>
        <div className="divide-y divide-border">
          {topTasks.length === 0 && <p className="text-xs text-muted-foreground px-4 py-3">All caught up! 🎉</p>}
          {topTasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 px-4 py-2.5">
              <button onClick={() => toggleTask(task)} className="text-muted-foreground hover:text-green-500 flex-shrink-0 transition-colors">
                <Circle size={15} />
              </button>
              <span className="text-xs truncate">{task.title}</span>
              {task.priority === 'high' && <span className="text-xs text-red-500 flex-shrink-0">!</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Habits */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Flame size={12} className="text-orange-500" /> Habits
          </h3>
          <span className="text-xs text-muted-foreground">{habitsCompleted}/{habits.length}</span>
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          {habits.length === 0 && <p className="text-xs text-muted-foreground">No habits yet.</p>}
          {habits.slice(0, 6).map(habit => {
            const done = isHabitDone(habit.id);
            return (
              <button key={habit.id} onClick={() => toggleHabit(habit)} title={habit.name}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${done ? 'text-white border-transparent' : 'border-border bg-secondary hover:border-primary/40'}`}
                style={{ backgroundColor: done ? habit.color || '#6366f1' : undefined }}>
                <CheckCircle2 size={11} className={done ? 'text-white' : 'text-muted-foreground'} />
                <span className="truncate max-w-[80px]">{habit.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Goals */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Target size={12} className="text-primary" /> Goals
          </h3>
          <Link to="/goals" className="text-xs text-primary flex items-center gap-1 hover:underline">All <ArrowRight size={11} /></Link>
        </div>
        <div className="divide-y divide-border">
          {goals.length === 0 && <p className="text-xs text-muted-foreground px-4 py-3">No active goals.</p>}
          {goals.map(goal => (
            <div key={goal.id} className="px-4 py-2.5">
              <p className="text-xs font-medium truncate">{goal.title}</p>
              {goal.target_value && <p className="text-xs text-primary/70 mt-0.5 truncate">🎯 {goal.target_value}</p>}
              {goal.deadline && <p className="text-xs text-muted-foreground mt-0.5">📅 {format(new Date(goal.deadline), 'd MMM')}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
