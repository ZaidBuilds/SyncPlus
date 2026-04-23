import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Zap, CheckCircle2, Circle, Plus, Flame, Calendar, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const today = format(new Date(), 'yyyy-MM-dd');
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function QuickAddTask({ projects, onAdd }) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');

  const add = async () => {
    if (!title.trim()) return;
    await dataClient.entities.Task.create({ title, project_id: projectId || undefined, status: 'todo', priority: 'medium', due_date: today });
    setTitle(''); onAdd();
  };

  return (
    <div className="flex gap-2">
      <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Quick add a task for today..." value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
      <select className="border border-border rounded-lg px-2 py-2 text-sm bg-background" value={projectId} onChange={e => setProjectId(e.target.value)}>
        <option value="">No project</option>
        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
      <button onClick={add} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90"><Plus size={15} /></button>
    </div>
  );
}

export default function DailyExecution() {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [calBlocks, setCalBlocks] = useState([]);
  const [journalEntry, setJournalEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [t, h, hl, p, cb, je] = await Promise.all([
      dataClient.entities.Task.filter({ status: 'todo' }, '-created_date', 100),
      dataClient.entities.Habit.list('-created_date', 100),
      dataClient.entities.HabitLog.filter({ date: today }, '-created_date', 100),
      dataClient.entities.Project.list('-created_date', 100),
      dataClient.entities.CalendarBlock.filter({ date: today }, 'start_time', 20),
      dataClient.entities.JournalEntry.filter({ date: today }, '-created_date', 1),
    ]);
    setTasks(t); setHabits(h); setHabitLogs(hl); setProjects(p); setCalBlocks(cb);
    setJournalEntry(je.length > 0 ? je[0] : null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleTask = async (task) => {
    await dataClient.entities.Task.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    load();
  };

  const toggleHabit = async (habit) => {
    const existing = habitLogs.find(l => l.habit_id === habit.id && l.date === today);
    if (existing) await dataClient.entities.HabitLog.update(existing.id, { completed: !existing.completed });
    else await dataClient.entities.HabitLog.create({ habit_id: habit.id, date: today, completed: true });
    load();
  };

  const isHabitDone = (habitId) => habitLogs.find(l => l.habit_id === habitId)?.completed || false;

  const [todayTasks, setTodayTasks] = useState([]);
  useEffect(() => {
    const raw = tasks.filter(t => !t.due_date || t.due_date <= today).sort((a, b) => (PRIORITY_ORDER[a.priority] || 1) - (PRIORITY_ORDER[b.priority] || 1));
    setTodayTasks(raw);
  }, [tasks]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(todayTasks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setTodayTasks(items);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const top3 = todayTasks.filter(t => t.priority === 'high').slice(0, 3).concat(todayTasks.filter(t => t.priority !== 'high')).slice(0, 3);
  const doneTasks = tasks.filter(t => t.due_date === today && t.status === 'done');
  const habitsCompleted = habits.filter(h => isHabitDone(h.id)).length;

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2"><Zap size={20} className="text-yellow-500" /> Daily Execution</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMMM yyyy')} · {doneTasks.length} tasks done · {habitsCompleted}/{habits.length} habits</p>
      </div>

      {/* Top 3 Priority Tasks */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-yellow-50 dark:bg-yellow-900/10">
          <h2 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">⚡ Top 3 Priority Tasks</h2>
          <p className="text-xs text-muted-foreground">Focus on these first</p>
        </div>
        <div className="divide-y divide-border">
          {top3.length === 0 && <p className="text-sm text-muted-foreground px-5 py-4">No priority tasks. Add tasks to get started!</p>}
          {top3.map(task => (
            <div key={task.id} className="flex items-center gap-3 px-5 py-3">
              <button onClick={() => toggleTask(task)} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                {task.status === 'done' ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                {task.project_id && <p className="text-xs text-muted-foreground">{projects.find(p => p.id === task.project_id)?.title}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>{task.priority}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Pending Tasks */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Pending Tasks</h2>
          <span className="text-xs text-muted-foreground">{todayTasks.length} remaining</span>
        </div>
        <div className="p-4 space-y-2">
          <QuickAddTask projects={projects} onAdd={load} />
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="daily-tasks">
            {(provided) => (
              <div className="divide-y divide-border max-h-64 overflow-y-auto" {...provided.droppableProps} ref={provided.innerRef}>
                {todayTasks.slice(0, 20).map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 px-5 py-3 ${snapshot.isDragging ? 'bg-accent rounded-lg shadow-md' : ''}`}
                      >
                        <div {...provided.dragHandleProps} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab flex-shrink-0">
                          <GripVertical size={14} />
                        </div>
                        <button onClick={() => toggleTask(task)} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                          {task.status === 'done' ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
                        </button>
                        <p className={`text-sm flex-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                        {task.estimated_time && <span className="text-xs text-muted-foreground flex-shrink-0">{task.estimated_time}m</span>}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Habits */}
      {habits.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-1.5"><Flame size={14} className="text-orange-500" /> Today&apos;s Habits</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
            {habits.map(habit => {
              const done = isHabitDone(habit.id);
              return (
                <button key={habit.id} onClick={() => toggleHabit(habit)} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${done ? 'border-transparent text-white' : 'border-border bg-secondary hover:border-primary/40'}`} style={{ backgroundColor: done ? habit.color || '#6366f1' : undefined }}>
                  <CheckCircle2 size={15} className={done ? 'text-white' : 'text-muted-foreground'} />
                  <span className="text-xs font-medium truncate">{habit.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Blocks */}
      {calBlocks.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5"><Calendar size={14} /> Today&apos;s Schedule</h2>
            <Link to="/calendar" className="text-xs text-primary hover:underline">+ Add Block</Link>
          </div>
          <div className="divide-y divide-border">
            {calBlocks.map(block => (
              <div key={block.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{block.start_time} – {block.end_time}</span>
                <p className="text-sm font-medium flex-1">{block.title}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{block.type?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal CTA */}
      <Link to="/journal" className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 hover:shadow-sm transition-shadow">
        <div>
          <p className="text-sm font-semibold">{journalEntry ? '📝 Journal Entry Saved' : '📝 Write Today&apos;s Journal'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{journalEntry ? 'Tap to review or update' : 'Reflect on your day'}</p>
        </div>
        <span className="text-xs text-primary">→</span>
      </Link>
    </div>
  );
}
