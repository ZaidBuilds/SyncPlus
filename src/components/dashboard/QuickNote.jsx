import { useState, useEffect } from 'react';
import { dataClient } from '@/lib/dataClient';
import { StickyNote, Send, MessageSquare, Phone, Mail, Users } from 'lucide-react';

const TYPES = [
  { key: 'note', label: 'Note', icon: StickyNote },
  { key: 'call', label: 'Call', icon: Phone },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'meeting', label: 'Meeting', icon: Users },
];

export default function QuickNote({ deals, contacts }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('note');
  const [dealId, setDealId] = useState('');
  const [contactId, setContactId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const openDeals = deals.filter(d => !['closed', 'lost'].includes(d.stage));

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await dataClient.entities.Note.create({
      content: text.trim(),
      type,
      deal_id: dealId || undefined,
      contact_id: contactId || undefined,
    });
    // Update deal's last_activity_date if linked
    if (dealId) {
      await dataClient.entities.Deal.update(dealId, { last_activity_date: new Date().toISOString() });
    }
    setText('');
    setDealId('');
    setContactId('');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <StickyNote size={14} className="text-primary" />
        <span className="text-sm font-semibold">Quick Log</span>
        <span className="text-xs text-muted-foreground">— log a call, note, or WhatsApp without opening a deal</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Type selector */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setType(t.key)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  type === t.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}>
                <Icon size={11} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          placeholder={`Log a ${type}… (e.g. "Called Rahul, discussed pricing, follow up Friday")`}
          className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />

        {/* Link to deal/contact */}
        <div className="flex gap-2 flex-wrap">
          <select value={dealId} onChange={e => setDealId(e.target.value)}
            className="flex-1 min-w-[140px] text-sm bg-secondary border border-border rounded-lg px-3 py-1.5 outline-none text-muted-foreground">
            <option value="">Link to deal (optional)</option>
            {openDeals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
          <select value={contactId} onChange={e => setContactId(e.target.value)}
            className="flex-1 min-w-[140px] text-sm bg-secondary border border-border rounded-lg px-3 py-1.5 outline-none text-muted-foreground">
            <option value="">Link to contact (optional)</option>
            {contacts.slice(0, 50).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={handleSave} disabled={saving || !text.trim()}
            className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saved ? '✓ Saved!' : saving ? 'Saving…' : <><Send size={13} /> Log</>}
          </button>
        </div>
      </div>
    </div>
  );
}
