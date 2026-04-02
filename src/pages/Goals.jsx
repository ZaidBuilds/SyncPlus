import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, Target, CheckCircle2, Archive, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

function GoalModal({ goal, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(goal || { title: '', description: '', target_value: '', deadline: '', status: 'active', type: 'personal' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-4">{goal ? 'Edit Goal' : 'New Goal'}</h2>
        <div className="space-y-3">
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Goal title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none h-20" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Target (e.g. ₹1,00,000 revenue)" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
              <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="personal">Personal</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex justify-between mt-5">
          {goal && <button onClick={() => onDelete(goal.id)} className="text-xs text-red-500 flex items-center gap-1 hover:underline"><Trash2 size={13} /> Delete</button>}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
            <button onClick={() => onSave(form)} className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [g, p, t] = await Promise.all([
      dataClient.entities.Goal.list('-created_date', 100),
      dataClient.entities.Project.list('-created_date', 200),
      dataClient.entities.Task.list('-created_date', 500),
    ]);
    setGoals(g); setProjects(p); setTasks(t); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (form) => {
    if (form.id) await dataClient.entities.Goal.update(form.id, form);
    else await dataClient.entities.Goal.create(form);
    setModal(null); load();
  };

  const del = async (id) => {
    await dataClient.entities.Goal.delete(id);
    setModal(null); load();
  };

  const getProgress = (goal) => {
    const gProjects = projects.filter(p => p.goal_id === goal.id);
    if (gProjects.length === 0) return 0;
    const completed = gProjects.filter(p => p.status === 'completed').length;
    return Math.round((completed / gProjects.length) * 100);
  };

  const filtered = goals.filter(g => filter === 'all' ? true : g.status === filter);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Target size={20} className="text-primary" /> Goals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your high-level outcomes</p>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"><Plus size={15} /> New Goal</button>
      </div>

      <div className="flex gap-2">
        {['active', 'completed', 'archived', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No goals yet. Create your first goal!</p>}
        {filtered.map(goal => {
          const progress = getProgress(goal);
          const gProjects = projects.filter(p => p.goal_id === goal.id);
          const gTasks = tasks.filter(t => t.goal_id === goal.id || gProjects.some(p => p.id === t.project_id));
          const doneTasks = gTasks.filter(t => t.status === 'done').length;
          return (
            <div key={goal.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{goal.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[goal.status]}`}>{goal.status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{goal.type}</span>
                  </div>
                  {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
                  {goal.target_value && <p className="text-xs text-primary font-medium mt-1">🎯 {goal.target_value}</p>}
                  <div className="flex items-center gap-4 mt-3">
                    {goal.deadline && <span className="text-xs text-muted-foreground">📅 {format(new Date(goal.deadline), 'd MMM yyyy')}</span>}
                    <span className="text-xs text-muted-foreground">{gProjects.length} projects · {doneTasks}/{gTasks.length} tasks</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
                <button onClick={() => setModal(goal)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modal !== null && <GoalModal goal={modal?.id ? modal : null} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
    </div>
  );
}
