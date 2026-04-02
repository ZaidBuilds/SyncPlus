import { useEffect, useState } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, Check, Bell, Calendar, X, Trash2 } from 'lucide-react';
import { format, isBefore, isAfter, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

function ReminderModal({ reminder, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ title: '', due_date: '', notes: '', is_auto: false });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (reminder) setForm({ ...reminder, due_date: reminder.due_date ? format(new Date(reminder.due_date), "yyyy-MM-dd'T'HH:mm") : '' });
  }, [reminder]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">{reminder ? 'Edit Reminder' : 'New Reminder'}</h2>
          <div className="flex items-center gap-2">
            {reminder && <button onClick={onDelete} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg"><Trash2 size={15} /></button>}
            <button onClick={onClose} className="text-muted-foreground hover:bg-secondary p-1.5 rounded-lg"><X size={16} /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Follow up with John…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Due Date & Time</label>
            <input type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Optional context..." />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-border px-4 py-2 rounded-lg hover:bg-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.title || !form.due_date}
            className="flex-1 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('upcoming');

  const load = () => dataClient.entities.Reminder.list('due_date', 200).then(r => { setReminders(r); setLoading(false); });
  useEffect(() => { load(); }, []);

  const toggle = async (r) => {
    await dataClient.entities.Reminder.update(r.id, { is_done: !r.is_done });
    load();
  };
  const onSave = async (data) => {
    if (editing) await dataClient.entities.Reminder.update(editing.id, data);
    else await dataClient.entities.Reminder.create(data);
    setModal(false);
    load();
  };
  const onDelete = async () => {
    if (editing) await dataClient.entities.Reminder.delete(editing.id);
    setModal(false);
    load();
  };

  const now = new Date();
  const filtered = reminders.filter(r => {
    if (filter === 'upcoming') return !r.is_done && isAfter(new Date(r.due_date), now);
    if (filter === 'overdue') return !r.is_done && isBefore(new Date(r.due_date), now);
    if (filter === 'done') return r.is_done;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Reminders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{reminders.filter(r=>!r.is_done).length} pending</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-primary/90">
          <Plus size={15} /> New Reminder
        </button>
      </div>

      <div className="flex gap-1 mb-4 bg-secondary rounded-xl p-1">
        {['upcoming', 'overdue', 'done', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors capitalize',
              filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No reminders here.</p>}
        {filtered.map(r => {
          const overdue = !r.is_done && isBefore(new Date(r.due_date), now);
          return (
            <div key={r.id} className={cn('bg-card border rounded-xl px-4 py-3 flex items-start gap-3 transition-opacity', r.is_done ? 'opacity-50' : '', overdue ? 'border-red-200 bg-red-50/30' : 'border-border')}>
              <button onClick={() => toggle(r)} className={cn('mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                r.is_done ? 'bg-green-500 border-green-500' : overdue ? 'border-red-400 hover:border-red-500' : 'border-border hover:border-primary')}>
                {r.is_done && <Check size={10} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0" onClick={() => { setEditing(r); setModal(true); }}>
                <p className={cn('text-sm font-medium cursor-pointer', r.is_done && 'line-through')}>{r.title}</p>
                {r.notes && <p className="text-xs text-muted-foreground mt-0.5">{r.notes}</p>}
                <div className="flex items-center gap-1 mt-1">
                  <Calendar size={10} className={overdue ? 'text-red-500' : 'text-muted-foreground'} />
                  <span className={cn('text-xs', overdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                    {format(new Date(r.due_date), 'MMM d, h:mm a')}
                    {overdue && ' · Overdue'}
                  </span>
                  {r.is_auto && <span className="ml-1 text-xs bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground">auto</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && <ReminderModal reminder={editing} onSave={onSave} onDelete={onDelete} onClose={() => setModal(false)} />}
    </div>
  );
}
