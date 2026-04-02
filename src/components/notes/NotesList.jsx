import { useEffect, useState } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_ICONS = { note: '📝', email: '📧', whatsapp: '💬', call: '📞', meeting: '🤝' };

export default function NotesList({ dealId, contactId }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [type, setType] = useState('note');

  const load = () => {
    const filter = dealId ? { deal_id: dealId } : { contact_id: contactId };
    dataClient.entities.Note.filter(filter, '-created_date', 30).then(setNotes);
  };

  useEffect(() => { load(); }, [dealId, contactId]);

  const add = async () => {
    if (!text.trim()) return;
    const data = { content: text, type };
    if (dealId) data.deal_id = dealId;
    if (contactId) data.contact_id = contactId;
    await dataClient.entities.Note.create(data);
    setText('');
    load();
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <MessageSquare size={13} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Activity</span>
      </div>
      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {notes.length === 0 && <p className="text-xs text-muted-foreground">No activity yet.</p>}
        {notes.map(n => (
          <div key={n.id} className="bg-secondary/60 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">{TYPE_ICONS[n.type]}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(n.created_date), 'MMM d, h:mm a')}</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{n.content}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <select value={type} onChange={e => setType(e.target.value)}
          className="text-xs bg-secondary border border-border rounded-lg px-2 py-1.5 outline-none">
          {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
        </select>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a note…"
          className="flex-1 text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/30" />
        <button onClick={add} className="bg-primary text-primary-foreground p-1.5 rounded-lg hover:bg-primary/90">
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
