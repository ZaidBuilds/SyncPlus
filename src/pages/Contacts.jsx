import { useEffect, useState } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Plus, Search, Mail, Phone, X, Trash2, MessageSquare, Tag } from 'lucide-react';
import NotesList from '@/components/notes/NotesList';
import { cn } from '@/lib/utils';

const LEAD_SOURCES = ['instagram', 'whatsapp', 'referral', 'form', 'linkedin', 'cold_outreach', 'other'];
const SOURCE_LABELS = {
  instagram: '📸 Instagram', whatsapp: '💬 WhatsApp', referral: '🤝 Referral',
  form: '🌐 Web Form', linkedin: '💼 LinkedIn', cold_outreach: '📞 Cold Outreach', other: '📋 Other'
};

function ContactModal({ contact, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', notes: '',
    lead_source: 'other', gstin: '', pan: '', address: ''
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { if (contact) setForm({ ...form, ...contact }); }, [contact]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const openWhatsApp = () => {
    if (!form.phone) return;
    const num = form.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${num}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
      <div className="w-full max-w-lg h-full bg-card border-l border-border flex flex-col shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">{contact ? 'Edit Contact' : 'New Contact'}</h2>
          <div className="flex items-center gap-2">
            {contact && form.phone && (
              <button onClick={openWhatsApp} className="flex items-center gap-1 text-xs font-medium text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200 transition-colors">
                <MessageSquare size={12} /> WhatsApp
              </button>
            )}
            {contact && <button onClick={onDelete} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg"><Trash2 size={15} /></button>}
            <button onClick={onClose} className="text-muted-foreground hover:bg-secondary p-1.5 rounded-lg"><X size={16} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Basic Info */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phone / WhatsApp</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Company</label>
            <input value={form.company} onChange={e => set('company', e.target.value)}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Company name" />
          </div>

          {/* Lead Source */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Lead Source</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {LEAD_SOURCES.map(src => (
                <button key={src} onClick={() => set('lead_source', src)}
                  className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                    form.lead_source === src
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50')}>
                  {SOURCE_LABELS[src]}
                </button>
              ))}
            </div>
          </div>

          {/* Indian Compliance */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tax / Compliance (India)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">GSTIN</label>
                <input value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())}
                  className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                  placeholder="27AABCU9603R1ZX" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">PAN</label>
                <input value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())}
                  className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                  placeholder="ABCDE1234F" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Flat/Building, Street, City, State, PIN" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Any notes about this contact..." />
          </div>
          {contact && <NotesList contactId={contact.id} />}
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-border px-4 py-2 rounded-lg hover:bg-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name}
            className="flex-1 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => dataClient.entities.Contact.list('-created_date', 200).then(c => { setContacts(c); setLoading(false); });
  useEffect(() => { load(); }, []);

  const filtered = contacts.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchSource = sourceFilter === 'all' || c.lead_source === sourceFilter;
    return matchSearch && matchSource;
  });

  const onSave = async (data) => {
    if (editing) await dataClient.entities.Contact.update(editing.id, data);
    else await dataClient.entities.Contact.create(data);
    setModal(false);
    load();
  };
  const onDelete = async () => {
    if (editing) await dataClient.entities.Contact.delete(editing.id);
    setModal(false);
    load();
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const COLORS = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-green-100 text-green-600', 'bg-amber-100 text-amber-600', 'bg-pink-100 text-pink-600'];
  const color = (id) => COLORS[(id?.charCodeAt(0) || 0) % COLORS.length];

  const openWhatsApp = (e, phone) => {
    e.stopPropagation();
    const num = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${num}`, '_blank');
  };

  const openEmail = (e, email) => {
    e.stopPropagation();
    window.open(`mailto:${email}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{contacts.length} contacts</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-primary/90">
          <Plus size={15} /> New Contact
        </button>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="text-sm bg-card border border-border rounded-xl px-3 py-2 outline-none">
          <option value="all">All Sources</option>
          {LEAD_SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground px-5 py-4">No contacts found.</p>}
        {filtered.map(c => (
          <div key={c.id} onClick={() => { setEditing(c); setModal(true); }}
            className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/50 cursor-pointer transition-colors group">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${color(c.id)}`}>
              {initials(c.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{c.name}</p>
                {c.lead_source && c.lead_source !== 'other' && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">{SOURCE_LABELS[c.lead_source]}</span>
                )}
              </div>
              {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {c.phone && (
                <button onClick={e => openWhatsApp(e, c.phone)}
                  className="text-xs flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors">
                  <MessageSquare size={11} /> WhatsApp
                </button>
              )}
              {c.email && (
                <button onClick={e => openEmail(e, c.email)}
                  className="text-xs flex items-center gap-1 text-primary bg-primary/5 border border-primary/20 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                  <Mail size={11} /> Email
                </button>
              )}
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
              {c.email && <span className="flex items-center gap-1 truncate max-w-[160px]"><Mail size={11} />{c.email}</span>}
              {c.phone && <span className="flex items-center gap-1"><Phone size={11} />{c.phone}</span>}
            </div>
          </div>
        ))}
      </div>

      {modal && <ContactModal contact={editing} onSave={onSave} onDelete={onDelete} onClose={() => setModal(false)} />}
    </div>
  );
}
