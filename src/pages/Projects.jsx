import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, FolderOpen, Pencil, Trash2, LayoutGrid, List, Clock, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
};

const STATUS_DOT = {
  not_started: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  on_hold: 'bg-amber-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const KANBAN_COLUMNS = [
  { key: 'not_started', label: 'Not Started', emoji: '⬜' },
  { key: 'in_progress', label: 'In Progress', emoji: '🔵' },
  { key: 'on_hold', label: 'On Hold', emoji: '🟡' },
  { key: 'completed', label: 'Completed', emoji: '✅' },
];

function ProjectModal({ project, goals, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(project || { title: '', description: '', goal_id: '', status: 'not_started', deadline: '', type: 'personal' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl" 
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-4">{project ? 'Edit Project' : 'New Project'}</h2>
        <div className="space-y-3">
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Project title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} onKeyDown={e => e.key === 'Enter' && onSave(form)} />
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
      </motion.div>
    </div>
  );
}

function ProjectCard({ project, tasks, goals, onClick, index }) {
  const progress = (() => {
    const pTasks = tasks.filter(t => t.project_id === project.id);
    if (pTasks.length === 0) return 0;
    return Math.round((pTasks.filter(t => t.status === 'done').length / pTasks.length) * 100);
  })();
  const pTasks = tasks.filter(t => t.project_id === project.id);
  const linkedGoal = goals.find(g => g.id === project.goal_id);
  const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold">{project.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[project.status]}`}>{project.status.replace('_', ' ')}</span>
          </div>
          {linkedGoal && <p className="text-xs text-primary mb-1 font-medium">↗ {linkedGoal.title}</p>}
          {project.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{project.description}</p>}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><CheckCircle2 size={11} /> {pTasks.filter(t => t.status === 'done').length}/{pTasks.length}</span>
            {daysLeft !== null && (
              <span className={`flex items-center gap-1 ${daysLeft < 0 ? 'text-red-500' : daysLeft < 7 ? 'text-amber-500' : ''}`}>
                <Clock size={11} /> {daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d`}
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${progress}%` }} 
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-primary rounded-full" 
              />
            </div>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"><Pencil size={14} /></button>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'kanban'
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

  const updateStatus = async (projectId, newStatus) => {
    await dataClient.entities.Project.update(projectId, { status: newStatus });
    load();
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.type === filter);
  const inProgressCount = projects.filter(p => p.status === 'in_progress').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><FolderOpen size={20} className="text-primary" /> Projects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{inProgressCount} in progress · {completedCount} completed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${viewMode === 'grid' ? 'bg-card shadow-sm font-medium' : 'text-muted-foreground'}`}>
              <LayoutGrid size={13} /> Grid
            </button>
            <button onClick={() => setViewMode('kanban')} className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${viewMode === 'kanban' ? 'bg-card shadow-sm font-medium' : 'text-muted-foreground'}`}>
              <List size={13} /> Board
            </button>
          </div>
          <button onClick={() => setModal({})} className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"><Plus size={15} /> New Project</button>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="flex gap-2">
          {['all', 'personal', 'professional', 'internal'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{f}</button>
          ))}
        </div>
      )}

      {viewMode === 'grid' ? (
        // GRID VIEW
        <div className="grid sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-2 bg-card border border-dashed border-border rounded-xl p-10 text-center">
                <FolderOpen size={32} className="text-primary/30 mx-auto mb-3" />
                <p className="text-sm font-medium">No projects yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Projects are the execution layer for your goals.</p>
                <button onClick={() => setModal({})} className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">+ Create Project</button>
              </motion.div>
            )}
            {filtered.map((project, index) => (
              <ProjectCard key={project.id} project={project} tasks={tasks} goals={goals} onClick={() => setModal(project)} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        // KANBAN VIEW
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(col => {
            const colProjects = projects.filter(p => p.status === col.key);
            return (
              <div 
                key={col.key} 
                className="min-w-[260px] flex-1 bg-secondary/50 rounded-xl p-3"
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={e => {
                  e.preventDefault();
                  const projectId = e.dataTransfer.getData('text/plain');
                  if (projectId) updateStatus(projectId, col.key);
                }}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${STATUS_DOT[col.key]}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{colProjects.length}</span>
                </div>
                <div className="space-y-2">
                  {colProjects.map((project, index) => {
                    const pTasks = tasks.filter(t => t.project_id === project.id);
                    const progress = pTasks.length > 0 ? Math.round((pTasks.filter(t => t.status === 'done').length / pTasks.length) * 100) : 0;
                    const linkedGoal = goals.find(g => g.id === project.goal_id);
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={project.id}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', project.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => setModal(project)}
                        className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all"
                      >
                        <p className="text-sm font-medium mb-1">{project.title}</p>
                        {linkedGoal && <p className="text-xs text-primary mb-1">↗ {linkedGoal.title}</p>}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{pTasks.filter(t => t.status === 'done').length}/{pTasks.length} tasks</span>
                          {project.deadline && <span>📅 {format(new Date(project.deadline), 'd MMM')}</span>}
                        </div>
                        {pTasks.length > 0 && (
                          <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  {colProjects.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Drop projects here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && <ProjectModal project={modal?.id ? modal : null} goals={goals} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
    </div>
  );
}
