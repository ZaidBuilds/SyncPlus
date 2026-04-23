import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, Flame, Check, Pencil, Trash2, X } from 'lucide-react';
import { format, subDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

function HabitModal({ habit, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(habit || { name: '', description: '', frequency: 'daily', color: '#6366f1' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{habit ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose}><X size={16} className="text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <input autoFocus className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="e.g. Morning run, Read 30 min..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="flex gap-3">
            <select className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Color</label>
              <input type="color" className="w-9 h-9 border border-border rounded-lg cursor-pointer" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-4">
          {habit && <button onClick={() => onDelete(habit.id)} className="text-xs text-red-500 flex items-center gap-1"><Trash2 size={12} /> Delete</button>}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-secondary">Cancel</button>
            <button onClick={() => onSave(form)} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [h, l] = await Promise.all([
      dataClient.entities.Habit.list('-created_date', 100),
      dataClient.entities.HabitLog.list('-date', 1000),
    ]);
    setHabits(h); setLogs(l); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (form) => {
    if (form.id) await dataClient.entities.Habit.update(form.id, form);
    else await dataClient.entities.Habit.create(form);
    setModal(null); load();
  };

  const del = async (id) => {
    await dataClient.entities.Habit.delete(id);
    setModal(null); load();
  };

  const toggle = async (habit) => {
    const existing = logs.find(l => l.habit_id === habit.id && l.date === today);
    if (existing) {
      await dataClient.entities.HabitLog.update(existing.id, { completed: !existing.completed });
    } else {
      await dataClient.entities.HabitLog.create({ habit_id: habit.id, date: today, completed: true });
    }
    load();
  };

  const getStreak = (habitId) => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = logs.find(l => l.habit_id === habitId && l.date === d && l.completed);
      if (log) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const getLast21Days = (habitId) => {
    return Array.from({ length: 21 }, (_, i) => {
      const d = format(subDays(new Date(), 20 - i), 'yyyy-MM-dd');
      const log = logs.find(l => l.habit_id === habitId && l.date === d);
      return { date: d, done: log?.completed || false, isToday: d === today };
    });
  };

  const isDoneToday = (habitId) => logs.find(l => l.habit_id === habitId && l.date === today)?.completed || false;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const completedToday = habits.filter(h => isDoneToday(h.id)).length;

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Flame size={20} className="text-orange-500" /> Habits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMMM')} · {completedToday}/{habits.length} done today</p>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90">
          <Plus size={14} /> New Habit
        </button>
      </div>

      {/* Daily progress */}
      {habits.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Today&apos;s Progress</span>
            <span className="text-sm font-bold text-orange-500">{Math.round((completedToday / habits.length) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${(completedToday / habits.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Habit list — just open and mark */}
      <div className="space-y-2">
        {habits.length === 0 && (
          <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
            <Flame size={32} className="text-orange-300 mx-auto mb-3" />
            <p className="text-sm font-medium">No habits yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Add habits once — they&apos;ll appear here every day automatically.</p>
            <button onClick={() => setModal({})} className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">+ Add your first habit</button>
          </div>
        )}
        {habits.map(habit => {
          const done = isDoneToday(habit.id);
          const streak = getStreak(habit.id);
          const last21 = getLast21Days(habit.id);
          return (
            <div key={habit.id} className={`bg-card border rounded-xl p-4 transition-all ${done ? 'border-transparent' : 'border-border'}`} style={{ borderColor: done ? habit.color || '#6366f1' : undefined, boxShadow: done ? `0 0 0 1px ${habit.color || '#6366f1'}20` : undefined }}>
              <div className="flex items-center gap-3">
                {/* Big check button */}
                <button
                  onClick={() => toggle(habit)}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 border-2"
                  style={{
                    backgroundColor: done ? (habit.color || '#6366f1') : 'transparent',
                    borderColor: habit.color || '#6366f1',
                  }}
                >
                  <Check size={18} className={done ? 'text-white' : 'text-muted-foreground'} />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${done ? 'line-through text-muted-foreground' : ''}`}>{habit.name}</p>
                    {streak > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-orange-500">
                        <Flame size={11} /> {streak}
                      </span>
                    )}
                  </div>
                  {/* 21-day streak grid */}
                  <div className="flex gap-0.5 mt-2">
                    {last21.map((d, i) => (
                      <div
                        key={i}
                        title={d.date}
                        className={`h-3 rounded-sm flex-1 transition-all ${d.isToday ? 'ring-1 ring-offset-1' : ''}`}
                        style={{
                          backgroundColor: d.done ? (habit.color || '#6366f1') : '#e5e7eb',
                          ringColor: habit.color || '#6366f1',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button onClick={() => setModal(habit)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground flex-shrink-0">
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal !== null && <HabitModal habit={modal?.id ? modal : null} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
    </div>
  );
}
