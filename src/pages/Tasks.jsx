import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, CheckCircle2, Circle, Pencil, Trash2, GripVertical, Target } from 'lucide-react';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const PRIORITY_COLORS = { high: 'bg-red-100 text-red-600', medium: 'bg-amber-100 text-amber-600', low: 'bg-gray-100 text-gray-500' };

function TaskModal({ task, projects, goals, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(task || { title: '', project_id: '', goal_id: '', status: 'todo', priority: 'medium', due_date: '', estimated_time: '', notes: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-4">{task ? 'Edit Task' : 'New Task'}</h2>
        <div className="space-y-3">
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Est. Time (min)</label>
              <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="60" value={form.estimated_time} onChange={e => setForm({ ...form, estimated_time: e.target.value })} />
            </div>
          </div>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
            <option value="">— Link to Project —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.goal_id} onChange={e => setForm({ ...form, goal_id: e.target.value })}>
            <option value="">— Link to Goal —</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none h-16" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-between mt-5">
          {task && <button onClick={() => onDelete(task.id)} className="text-xs text-red-500 flex items-center gap-1 hover:underline"><Trash2 size={13} /> Delete</button>}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
            <button onClick={() => onSave(form)} className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [modal, setModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('todo');
  const [loading, setLoading] = useState(true);
  const [focusTask, setFocusTask] = useState(null);

  const load = async () => {
    const [t, p, g] = await Promise.all([
      dataClient.entities.Task.list('-created_date', 300),
      dataClient.entities.Project.list('-created_date', 100),
      dataClient.entities.Goal.list('-created_date', 100),
    ]);
    setTasks(t); setProjects(p); setGoals(g); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (form) => {
    if (form.id) await dataClient.entities.Task.update(form.id, form);
    else await dataClient.entities.Task.create(form);
    setModal(null); load();
  };

  const del = async (id) => {
    await dataClient.entities.Task.delete(id);
    setModal(null); load();
  };

  const toggle = async (task) => {
    await dataClient.entities.Task.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    load();
  };

  const filtered = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => {
    const po = { high: 0, medium: 1, low: 2 };
    return (po[a.priority] || 1) - (po[b.priority] || 1);
  });

  const [orderedTasks, setOrderedTasks] = useState([]);
  useEffect(() => { setOrderedTasks(sorted); }, [tasks, statusFilter]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedTasks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedTasks(items);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><CheckCircle2 size={20} className="text-primary" /> Tasks</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{tasks.filter(t => t.status !== 'done').length} pending · {tasks.filter(t => t.status === 'done').length} done</p>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"><Plus size={15} /> New Task</button>
      </div>

      <div className="flex gap-2">
        {['todo', 'in_progress', 'done', 'all'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{s.replace('_', ' ')}</button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
              {orderedTasks.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No tasks here.</p>}
              {orderedTasks.map((task, index) => {
                const linkedProject = projects.find(p => p.id === task.project_id);
                const linkedGoal = goals.find(g => g.id === task.goal_id);
                return (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-card border border-border rounded-xl flex items-center gap-3 px-4 py-3 transition-shadow ${snapshot.isDragging ? 'shadow-lg border-primary/30' : 'hover:shadow-sm'}`}
                      >
                        <div {...provided.dragHandleProps} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab flex-shrink-0">
                          <GripVertical size={15} />
                        </div>
                        <button onClick={() => toggle(task)} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                          {task.status === 'done' ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {linkedProject && <span className="text-xs text-muted-foreground">📁 {linkedProject.title}</span>}
                            {linkedGoal && <span className="text-xs text-muted-foreground">🎯 {linkedGoal.title}</span>}
                            {task.due_date && <span className="text-xs text-muted-foreground">📅 {format(new Date(task.due_date), 'd MMM')}</span>}
                            {task.estimated_time && <span className="text-xs text-muted-foreground">⏱ {task.estimated_time}m</span>}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                        {task.status !== 'done' && (
                          <button onClick={() => setFocusTask(task)} title="Focus Mode" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 flex-shrink-0 transition-colors">
                            <Target size={14} />
                          </button>
                        )}
                        <button onClick={() => setModal(task)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground flex-shrink-0"><Pencil size={14} /></button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {modal !== null && <TaskModal task={modal?.id ? modal : null} projects={projects} goals={goals} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
    </div>
  );
}
