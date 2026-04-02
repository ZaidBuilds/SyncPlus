import { useState, useEffect, useCallback } from 'react';
import { dataClient } from '@/lib/dataClient';
import { BookOpen, ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

const MOODS = [
  { value: 'amazing', emoji: '🔥', label: 'Amazing' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'bad', emoji: '😔', label: 'Bad' },
  { value: 'stressed', emoji: '😤', label: 'Stressed' },
];

const PROMPTS = [
  { key: 'what_done', emoji: '✅', label: 'What did you accomplish?', placeholder: 'Tasks completed, wins big or small...' },
  { key: 'what_failed', emoji: '❌', label: "What didn't go well?", placeholder: 'Be honest — failures teach the most...' },
  { key: 'improvements', emoji: '💡', label: 'What will you do better tomorrow?', placeholder: 'One small improvement is enough...' },
];

export default function Journal() {
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entry, setEntry] = useState(null);
  const [form, setForm] = useState({ what_done: '', what_failed: '', improvements: '', mood: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (date) => {
    setLoading(true);
    setSaved(false);
    const entries = await dataClient.entities.JournalEntry.filter({ date }, '-created_date', 1);
    if (entries.length > 0) {
      setEntry(entries[0]);
      const e = entries[0];
      setForm({ what_done: e.what_done || '', what_failed: e.what_failed || '', improvements: e.improvements || '', mood: e.mood || '' });
    } else {
      setEntry(null);
      setForm({ what_done: '', what_failed: '', improvements: '', mood: '' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(currentDate); }, [currentDate, load]);

  const save = async () => {
    setSaving(true);
    const data = { ...form, date: currentDate };
    if (entry) await dataClient.entities.JournalEntry.update(entry.id, data);
    else {
      const created = await dataClient.entities.JournalEntry.create(data);
      setEntry(created);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isToday = currentDate === format(new Date(), 'yyyy-MM-dd');
  const isFuture = currentDate > format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="p-5 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><BookOpen size={20} className="text-primary" /> Journal</h1>
        {!isToday && <button onClick={() => setCurrentDate(format(new Date(), 'yyyy-MM-dd'))} className="text-xs text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-accent">← Today</button>}
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
        <button onClick={() => setCurrentDate(format(subDays(new Date(currentDate), 1), 'yyyy-MM-dd'))} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft size={16} /></button>
        <div className="text-center">
          <p className="text-sm font-bold">{isToday ? 'Today' : format(new Date(currentDate), 'EEEE')}</p>
          <p className="text-xs text-muted-foreground">{format(new Date(currentDate), 'd MMMM yyyy')}</p>
        </div>
        <button onClick={() => setCurrentDate(format(addDays(new Date(currentDate), 1), 'yyyy-MM-dd'))} className="p-1.5 rounded-lg hover:bg-secondary" disabled={isToday}>
          <ChevronRight size={16} className={isToday ? 'text-muted-foreground/30' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : isFuture ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">Can't journal the future 😄</div>
      ) : (
        <div className="space-y-3">
          {/* Mood — pick first */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">How are you feeling?</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setForm({ ...form, mood: m.value })}
                  className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-all ${form.mood === m.value ? 'border-primary bg-accent text-primary font-semibold scale-105' : 'border-border hover:border-primary/40'}`}>
                  <span className="text-base">{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Journal prompts */}
          {PROMPTS.map(({ key, emoji, label, placeholder }) => (
            <div key={key} className="bg-card border border-border rounded-xl p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">{emoji} {label}</label>
              <textarea
                className="w-full bg-transparent text-sm resize-none outline-none placeholder-muted-foreground/50 leading-relaxed"
                rows={3}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          {/* Save */}
          <button onClick={save} disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'} disabled:opacity-60`}>
            {saved ? <><Check size={15} /> Saved!</> : saving ? 'Saving...' : <><Save size={15} /> {entry ? 'Update Entry' : 'Save Entry'}</>}
          </button>
        </div>
      )}
    </div>
  );
}
