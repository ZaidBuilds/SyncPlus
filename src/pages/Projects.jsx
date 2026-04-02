import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

function ProjectModal({ project, goals, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(project || { title: '', description: '', goal_id: '', status: 'not_started', deadline: '', type: 'personal' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-4">{project ? 'Edit Project' : 'New Project'}</h2>
        <div className="space-y-3">
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Project title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none h-20" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.goal_id} onChange={e => setForm({ ...form, goal_id: e.target.value })}>
            <option value="">— Link to a Goal (optional) —</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="personal">Personal</option>
                <option value="professional">Professional</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
            <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-between mt-5">
          {project && <button onClick={() => onDelete(project.id)} className="text-xs text-red-500 flex items-center gap-1 hover:underline"><Trash2 size={13} /> Delete</button>}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary">Cancel</button>
            <button onClick={() => onSave(form)} className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [p, g, t] = await Promise.all([
      dataClient.entities.Project.list('-created_date', 200),
      dataClient.entities.Goal.list('-created_date', 100),
      dataClient.entities.Task.list('-created_date', 500),
    ]);
    setProjects(p); setGoals(g); setTasks(t); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (form) => {
    if (form.id) await dataClient.entities.Project.update(form.id, form);
    else await dataClient.entities.Project.create(form);
    setModal(null); load();
  };

  const del = async (id) => {
    await dataClient.entities.Project.delete(id);
    setModal(null); load();
  };

  const getProgress = (projectId) => {
    const pTasks = tasks.filter(t => t.project_id === projectId);
    if (pTasks.length === 0) return 0;
    return Math.round((pTasks.filter(t => t.status === 'done').length / pTasks.length) * 100);
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.type === filter);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><FolderOpen size={20} className="text-primary" /> Projects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Execution layer for your goals</p>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"><Plus size={15} /> New Project</button>
      </div>

      <div className="flex gap-2">
        {['all', 'personal', 'professional', 'internal'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{f}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center col-span-2">No projects yet.</p>}
        {filtered.map(project => {
          const progress = getProgress(project.id);
          const pTasks = tasks.filter(t => t.project_id === project.id);
          const linkedGoal = goals.find(g => g.id === project.goal_id);
          return (
            <div key={project.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold">{project.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>{project.status.replace('_', ' ')}</span>
                  </div>
                  {linkedGoal && <p className="text-xs text-primary mb-1">↗ {linkedGoal.title}</p>}
                  {project.description && <p className="text-xs text-muted-foreground mb-2">{project.description}</p>}
                  <p className="text-xs text-muted-foreground">{pTasks.filter(t => t.status === 'done').length}/{pTasks.length} tasks done</p>
                  {project.deadline && <p className="text-xs text-muted-foreground mt-0.5">📅 {format(new Date(project.deadline), 'd MMM yyyy')}</p>}
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
                <button onClick={() => setModal(project)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground flex-shrink-0"><Pencil size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modal !== null && <ProjectModal project={modal?.id ? modal : null} goals={goals} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
    </div>
  );
}
