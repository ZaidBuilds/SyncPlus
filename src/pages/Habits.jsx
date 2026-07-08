import { useState, useEffect, useMemo } from 'react';
import { dataClient } from '@/lib/dataClient';
import { 
  Plus, Trash2, TrendingUp, Calendar, LayoutGrid, List, CheckCircle2, Circle
} from 'lucide-react';
import { format, eachDayOfInterval, startOfWeek, isToday, subDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const FREQUENCIES = ['daily', 'weekdays', 'weekends'];
const DAYS_TO_SHOW = 14;

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  
  // Date range for the tracker
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), DAYS_TO_SHOW - 1),
      end: new Date()
    });
  }, []);

  const load = async () => {
    const [h, l] = await Promise.all([
      dataClient.entities.Habit.list('-created_date', 100),
      dataClient.entities.HabitLog.list('-date', 1000)
    ]);
    setHabits(h);
    setHabitLogs(l);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleHabit = async (habitId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = habitLogs.find(l => l.habit_id === habitId && l.date === dateStr);
    
    if (existing) {
      await dataClient.entities.HabitLog.delete(existing.id);
    } else {
      await dataClient.entities.HabitLog.create({
        habit_id: habitId,
        date: dateStr,
        completed: true
      });
    }
    load();
  };

  const addHabit = async () => {
    const title = prompt('Enter habit name:');
    if (!title) return;
    await dataClient.entities.Habit.create({
      title,
      frequency: 'daily',
      goal_id: null,
      streak: 0
    });
    load();
  };

  const deleteHabit = async (id) => {
    if (!confirm('Archive this habit?')) return;
    await dataClient.entities.Habit.delete(id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-xs font-bold uppercase tracking-widest opacity-50">Synchronizing Rituals...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Apple-style Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Rituals</h1>
          <p className="text-sm text-muted-foreground font-medium">Daily compounding habits for strategic consistency.</p>
        </div>
        <div className="flex items-center gap-3 bg-muted/50 p-1 rounded-2xl">
          <button onClick={() => setView('grid')} className={cn("p-2 rounded-xl transition-all", view === 'grid' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setView('list')} className={cn("p-2 rounded-xl transition-all", view === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <List size={18} />
          </button>
          <div className="w-px h-4 bg-border/50 mx-1" />
          <button onClick={addHabit} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            <Plus size={16} /> New Ritual
          </button>
        </div>
      </div>

      {/* Main Tracker: Notion Style Database */}
      <div className="vantage-card overflow-hidden !p-0 border-none shadow-xl bg-white dark:bg-black/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/50">
                <th className="sticky left-0 bg-background/95 backdrop-blur-md z-10 p-6 text-left w-64 border-r border-border/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ritual Matrix</span>
                </th>
                {days.map(day => (
                  <th key={day.toString()} className="p-4 text-center min-w-[60px]">
                    <div className={cn("flex flex-col items-center gap-1", isToday(day) && "text-primary")}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{format(day, 'EEE')}</span>
                      <span className={cn("text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full", isToday(day) && "bg-primary text-primary-foreground shadow-lg")}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-6 text-right w-24">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {habits.map(habit => {
                const logs = habitLogs.filter(l => l.habit_id === habit.id);
                const score = Math.round((logs.filter(l => days.some(d => isSameDay(new Date(l.date), d))).length / DAYS_TO_SHOW) * 100);
                
                return (
                  <tr key={habit.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="sticky left-0 bg-background/95 backdrop-blur-md z-10 p-6 border-r border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("w-2 h-8 rounded-full", score > 70 ? "bg-emerald-500" : score > 30 ? "bg-amber-500" : "bg-red-500")} />
                          <span className="font-bold text-sm truncate">{habit.title}</span>
                        </div>
                        <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    {days.map(day => {
                      const isDone = habitLogs.some(l => l.habit_id === habit.id && l.date === format(day, 'yyyy-MM-dd'));
                      return (
                        <td key={day.toString()} className="p-2 text-center">
                          <button 
                            onClick={() => toggleHabit(habit.id, day)}
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90",
                              isDone 
                                ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20" 
                                : "bg-muted/30 text-muted-foreground/30 hover:bg-muted hover:text-muted-foreground"
                            )}
                          >
                            {isDone ? <CheckCircle2 size={18} strokeWidth={3} /> : <Circle size={18} strokeWidth={2} />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-black">{score}%</span>
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {habits.length === 0 && (
                <tr>
                  <td colSpan={DAYS_TO_SHOW + 2} className="p-20 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                    Your ritual matrix is empty. Initialize habits to track compounding growth.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Weekly Momentum */}
        <section className="vantage-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><TrendingUp size={20} /> Momentum</h3>
            <span className="text-[10px] font-black text-emerald-500 uppercase">+12%</span>
          </div>
          <div className="space-y-4">
            {habits.slice(0, 3).map(habit => {
              const logs = habitLogs.filter(l => l.habit_id === habit.id);
              const weeklyLogs = logs.filter(l => new Date(l.date) >= startOfWeek(new Date(), { weekStartsOn: 1 }));
              const progress = Math.round((weeklyLogs.length / 7) * 100);
              return (
                <div key={habit.id} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="truncate w-32">{habit.title}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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

        {/* Monthly Insight */}
        <section className="vantage-card bg-primary text-primary-foreground space-y-6 shadow-2xl">
          <h3 className="text-lg font-black uppercase tracking-tight">Strategic View</h3>
          <p className="text-sm opacity-80 leading-relaxed font-medium">
            You are currently maintaining a 74% consistency rate across your core rituals. Your strongest day is Tuesday. Focus on bridging the gap on weekends to maintain high-ground performance.
          </p>
          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-primary bg-white/20 flex items-center justify-center text-[10px] font-black">V</div>
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Strategic Rituals Active</span>
          </div>
        </section>

        {/* Heatmap Simulation */}
        <section className="vantage-card space-y-4">
          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Calendar size={20} /> Consistency</h3>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className={cn("aspect-square rounded-sm", Math.random() > 0.4 ? "bg-primary/20" : "bg-muted")} />
            ))}
          </div>
          <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-40">
            <span>Mar</span>
            <span>Apr</span>
          </div>
        </section>

      </div>

    </div>
  );
}
