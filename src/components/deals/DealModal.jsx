import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { dataClient } from '@/lib/dataClient';
import NotesList from '@/components/notes/NotesList';

const STAGES = ['lead', 'proposal', 'meeting', 'contracted', 'negotiating', 'closed', 'lost'];
const LEAD_SOURCES = ['instagram', 'whatsapp', 'referral', 'form', 'linkedin', 'cold_outreach', 'other'];
const SOURCE_LABELS = {
  instagram: '📸 Instagram', whatsapp: '💬 WhatsApp', referral: '🤝 Referral',
  form: '🌐 Web Form', linkedin: '💼 LinkedIn', cold_outreach: '📞 Cold Outreach', other: '📋 Other'
};

export default function DealModal({ deal, defaultStage, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: '', contact_name: '', value: '', currency: 'INR',
    stage: defaultStage || 'lead', expected_close_date: '', description: '', lead_source: 'other',
  });
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (deal) setForm({ ...deal, value: deal.value || '' });
    dataClient.entities.Contact.list('name', 100).then(setContacts);
  }, [deal]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, value: parseFloat(form.value) || 0 });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
      <div className="w-full max-w-lg h-full bg-card border-l border-border flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">{deal ? 'Edit Deal' : 'New Deal'}</h2>
          <div className="flex items-center gap-2">
            {deal && (
              <button onClick={onDelete} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors">
                <Trash2 size={15} />
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:bg-secondary p-1.5 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Deal Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Website redesign for Acme" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Stage</label>
              <select value={form.stage} onChange={e => set('stage', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30">
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Value (₹ INR)</label>
              <input type="number" value={form.value} onChange={e => set('value', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="0" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Lead Source</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {LEAD_SOURCES.map(src => (
                <button key={src} type="button" onClick={() => set('lead_source', src)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.lead_source === src
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}>
                  {SOURCE_LABELS[src]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Contact</label>
              <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                list="contacts-list"
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Contact name" />
              <datalist id="contacts-list">
                {contacts.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Close Date</label>
              <input type="date" value={form.expected_close_date || ''} onChange={e => set('expected_close_date', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Notes about this deal..." />
          </div>

          {/* Notes thread */}
          {deal && <NotesList dealId={deal.id} />}
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-border px-4 py-2 rounded-lg hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex-1 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Deal'}
          </button>
        </div>
      </div>
    </div>
  );
}
