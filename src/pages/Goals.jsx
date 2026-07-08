import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, Target, Pencil, Trash2, ChevronDown, ChevronUp, Clock, CheckCircle2, FolderOpen, ListTodo } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
};

const PROGRESS_GRADIENTS = {
  0: 'from-slate-200 to-slate-300',
  25: 'from-red-400 to-orange-400',
  50: 'from-orange-400 to-amber-400',
  75: 'from-amber-400 to-emerald-400',
  100: 'from-emerald-400 to-emerald-600',
};

function getGradient(progress) {
  if (progress >= 100) return PROGRESS_GRADIENTS[100];
  if (progress >= 75) return PROGRESS_GRADIENTS[75];
  if (progress >= 50) return PROGRESS_GRADIENTS[50];
  if (progress >= 25) return PROGRESS_GRADIENTS[25];
  return PROGRESS_GRADIENTS[0];
}

function GoalModal({ goal, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(goal || { title: '', description: '', target_value: '', current_value: '', deadline: '', status: 'active', type: 'personal', milestones: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl" 
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-4">{goal ? 'Edit Goal' : 'New Goal'}</h2>
        <div className="space-y-3">
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Goal title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none h-20" placeholder="Description — why does this matter?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="e.g. ₹1,00,000" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Current Progress</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="e.g. ₹25,000" value={form.current_value || ''} onChange={e => setForm({ ...form, current_value: e.target.value })} />
            </div>
          </div>
          <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none h-16" placeholder="Milestones (one per line)&#10;e.g. Launch MVP&#10;Get first 10 users&#10;Hit ₹50K revenue" value={form.milestones || ''} onChange={e => setForm({ ...form, milestones: e.target.value })} />
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
      </motion.div>
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
  const [expandedGoal, setExpandedGoal] = useState(null);

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

  // Overall stats
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const avgProgress = activeGoals.length > 0 ? Math.round(activeGoals.reduce((sum, g) => sum + getProgress(g), 0) / activeGoals.length) : 0;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Target size={20} className="text-primary" /> Goals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your high-level outcomes</p>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"><Plus size={15} /> New Goal</button>
      </div>

      {/* Overview Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{activeGoals.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Active Goals</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{completedGoals.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Completed</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{avgProgress}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">Avg. Progress</div>
          </motion.div>
        </div>
      )}

      <div className="flex gap-2">
        {['active', 'completed', 'archived', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
              <Target size={32} className="text-primary/30 mx-auto mb-3" />
              <p className="text-sm font-medium">No goals yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Set your first goal — everything flows from here.</p>
              <button onClick={() => setModal({})} className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">+ Create Goal</button>
            </motion.div>
          )}
          {filtered.map((goal, index) => {
            const progress = getProgress(goal);
            const gProjects = projects.filter(p => p.goal_id === goal.id);
            const gTasks = tasks.filter(t => t.goal_id === goal.id || gProjects.some(p => p.id === t.project_id));
            const doneTasks = gTasks.filter(t => t.status === 'done').length;
            const isExpanded = expandedGoal === goal.id;
            const milestones = (goal.milestones || '').split('\n').filter(m => m.trim());
            const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
            const gradient = getGradient(progress);

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                key={goal.id} 
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">{goal.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[goal.status]}`}>{goal.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{goal.type}</span>
                      </div>
                      {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
                      
                      {/* Target + Deadline Row */}
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        {goal.target_value && <span className="text-xs text-primary font-medium">🎯 {goal.target_value}</span>}
                        {goal.current_value && <span className="text-xs text-emerald-600 font-medium">📍 Current: {goal.current_value}</span>}
                        {daysLeft !== null && (
                          <span className={`text-xs font-medium flex items-center gap-1 ${daysLeft < 0 ? 'text-red-500' : daysLeft < 7 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            <Clock size={11} />
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground"><FolderOpen size={11} className="inline mr-0.5" />{gProjects.length} projects · <ListTodo size={11} className="inline mr-0.5" />{doneTasks}/{gTasks.length} tasks</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Progress</span>
                          <span className="text-xs font-bold" style={{ color: progress >= 75 ? '#16a34a' : progress >= 50 ? '#d97706' : '#6366f1' }}>{progress}%</span>
                        </div>
                        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${progress}%` }} 
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(milestones.length > 0 || gProjects.length > 0) && (
                        <button onClick={() => setExpandedGoal(isExpanded ? null : goal.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                      <button onClick={() => setModal(goal)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={14} /></button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
                        {/* Milestones */}
                        {milestones.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Milestones</p>
                            <div className="space-y-1.5">
                              {milestones.map((m, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <div className="w-5 h-5 rounded-full border-2 border-primary/30 flex items-center justify-center flex-shrink-0 text-xs text-primary font-bold">{i + 1}</div>
                                  <span>{m}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Linked Projects */}
                        {gProjects.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Linked Projects</p>
                            <div className="space-y-1">
                              {gProjects.map(p => (
                                <div key={p.id} className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 size={14} className={p.status === 'completed' ? 'text-green-500' : 'text-muted-foreground/40'} />
                                  <span className={p.status === 'completed' ? 'line-through text-muted-foreground' : ''}>{p.title}</span>
                                  <span className="text-xs text-muted-foreground ml-auto">{p.status.replace('_', ' ')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {modal !== null && <GoalModal goal={modal?.id ? modal : null} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
    </div>
  );
}
