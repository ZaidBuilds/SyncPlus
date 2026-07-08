import { useState, useEffect, useCallback } from 'react';
import { dataClient } from '@/lib/dataClient';
import { BookOpen, ChevronLeft, ChevronRight, Save, Check, Zap } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { motion } from 'framer-motion';

const MOODS = [
  { value: 'amazing', emoji: '🔥', label: 'Amazing', color: '#ef4444' },
  { value: 'good', emoji: '😊', label: 'Good', color: '#22c55e' },
  { value: 'neutral', emoji: '😐', label: 'Neutral', color: '#f59e0b' },
  { value: 'bad', emoji: '😔', label: 'Bad', color: '#6366f1' },
  { value: 'stressed', emoji: '😤', label: 'Stressed', color: '#ec4899' },
];

const ENERGY_LEVELS = [
  { value: 5, label: 'Peak', emoji: '⚡' },
  { value: 4, label: 'High', emoji: '🔋' },
  { value: 3, label: 'Medium', emoji: '🔄' },
  { value: 2, label: 'Low', emoji: '🪫' },
  { value: 1, label: 'Drained', emoji: '💤' },
];

const PROMPTS = [
  { key: 'gratitude', emoji: '🙏', label: 'What are you grateful for today?', placeholder: 'Three things you appreciate...' },
  { key: 'what_done', emoji: '✅', label: 'What did you accomplish?', placeholder: 'Tasks completed, wins big or small...' },
  { key: 'what_failed', emoji: '❌', label: "What didn't go well?", placeholder: 'Be honest — failures teach the most...' },
  { key: 'improvements', emoji: '💡', label: 'What will you do better tomorrow?', placeholder: 'One small improvement is enough...' },
];

export default function Journal() {
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entry, setEntry] = useState(null);
  const [form, setForm] = useState({ what_done: '', what_failed: '', improvements: '', gratitude: '', mood: '', energy: 3 });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentEntries, setRecentEntries] = useState([]);
  const [showStreak, setShowStreak] = useState(false);

  const load = useCallback(async (date) => {
    setLoading(true);
    setSaved(false);
    const [entries, recent] = await Promise.all([
      dataClient.entities.JournalEntry.filter({ date }, '-created_date', 1),
      dataClient.entities.JournalEntry.list('-date', 14),
    ]);
    setRecentEntries(recent);
    if (entries.length > 0) {
      setEntry(entries[0]);
      const e = entries[0];
      setForm({
        what_done: e.what_done || '',
        what_failed: e.what_failed || '',
        improvements: e.improvements || '',
        gratitude: e.gratitude || '',
        mood: e.mood || '',
        energy: e.energy || 3,
      });
    } else {
      setEntry(null);
      setForm({ what_done: '', what_failed: '', improvements: '', gratitude: '', mood: '', energy: 3 });
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

  // Calculate journal streak
  const getStreak = () => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (recentEntries.find(e => e.date === d)) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const getLast14Days = () => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
      const e = recentEntries.find(entry => entry.date === d);
      return { date: d, hasEntry: !!e, mood: e?.mood, isToday: d === format(new Date(), 'yyyy-MM-dd') };
    });
  };

  const getWordCount = () => {
    return [form.what_done, form.what_failed, form.improvements, form.gratitude]
      .join(' ')
      .split(/\s+/)
      .filter(w => w.length > 0).length;
  };

  const isToday = currentDate === format(new Date(), 'yyyy-MM-dd');
  const isFuture = currentDate > format(new Date(), 'yyyy-MM-dd');
  const streak = getStreak();
  const last14 = getLast14Days();
  const wordCount = getWordCount();
  const moodColor = MOODS.find(m => m.value === form.mood)?.color || '#94a3b8';

  return (
    <div className="p-5 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><BookOpen size={20} className="text-primary" /> Journal</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {streak > 0 && <span className="text-orange-500 font-semibold">🔥 {streak} day streak · </span>}
            Reflect, learn, grow
          </p>
        </div>
        {!isToday && <button onClick={() => setCurrentDate(format(new Date(), 'yyyy-MM-dd'))} className="text-xs text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-accent">← Today</button>}
      </div>

      {/* 14-Day Activity Strip */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last 14 Days</span>
          <span className="text-xs text-muted-foreground">{recentEntries.length} entries this period</span>
        </div>
        <div className="flex gap-1">
          {last14.map((d, i) => {
            const moodObj = MOODS.find(m => m.value === d.mood);
            return (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                key={d.date}
                onClick={() => setCurrentDate(d.date)}
                title={`${format(new Date(d.date), 'EEE d MMM')}${d.hasEntry ? ` — ${d.mood || 'logged'}` : ' — no entry'}`}
                className={`flex-1 h-8 rounded-md transition-all flex items-center justify-center text-xs ${
                  d.date === currentDate ? 'ring-2 ring-primary ring-offset-1' : ''
                } ${d.isToday ? 'border-2 border-primary/40' : ''}`}
                style={{
                  backgroundColor: d.hasEntry ? (moodObj?.color || '#6366f1') + '30' : '#f1f5f9',
                  borderColor: d.hasEntry ? (moodObj?.color || '#6366f1') : undefined,
                }}
              >
                {d.hasEntry ? (moodObj?.emoji || '📝') : ''}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

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
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">Can&apos;t journal the future 😄</div>
      ) : (
        <div className="space-y-3">
          {/* Mood — pick first */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">How are you feeling?</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <motion.button 
                  key={m.value} 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setForm({ ...form, mood: m.value })}
                  className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border-2 transition-all ${
                    form.mood === m.value 
                      ? 'text-white font-semibold shadow-lg' 
                      : 'border-border hover:border-primary/40 bg-background'
                  }`}
                  style={{ 
                    backgroundColor: form.mood === m.value ? m.color : undefined,
                    borderColor: form.mood === m.value ? m.color : undefined 
                  }}
                >
                  <span className="text-base">{m.emoji}</span> {m.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Energy Level */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              <Zap size={12} className="inline text-amber-500 mr-1" />
              Energy Level
            </p>
            <div className="flex gap-2">
              {ENERGY_LEVELS.map(e => (
                <motion.button 
                  key={e.value} 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setForm({ ...form, energy: e.value })}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all text-xs font-medium ${
                    form.energy === e.value 
                      ? 'border-amber-400 bg-amber-50 text-amber-700' 
                      : 'border-border hover:border-amber-200 bg-background text-muted-foreground'
                  }`}
                >
                  <span className="text-lg">{e.emoji}</span>
                  <span>{e.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Journal prompts */}
          {PROMPTS.map(({ key, emoji, label, placeholder }, index) => (
            <motion.div 
              key={key} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.15 + index * 0.05 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">{emoji} {label}</label>
              <textarea
                className="w-full bg-transparent text-sm resize-none outline-none placeholder-muted-foreground/50 leading-relaxed"
                rows={3}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
              />
            </motion.div>
          ))}

          {/* Word count + Save */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {wordCount > 0 && `${wordCount} words`}
              {form.mood && ` · mood: ${form.mood}`}
            </span>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={save} 
              disabled={saving}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
                saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              } disabled:opacity-60`}
            >
              {saved ? <><Check size={15} /> Saved!</> : saving ? 'Saving...' : <><Save size={15} /> {entry ? 'Update Entry' : 'Save Entry'}</>}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
