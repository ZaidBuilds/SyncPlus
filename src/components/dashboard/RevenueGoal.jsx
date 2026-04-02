import { useState } from 'react';
import { Target, Pencil, Check } from 'lucide-react';
import { IndianRupee } from 'lucide-react';

export default function RevenueGoal({ collected }) {
  const stored = parseInt(localStorage.getItem('monthly_goal') || '0');
  const [goal, setGoal] = useState(stored);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(stored || '');

  const save = () => {
    const val = parseInt(input) || 0;
    setGoal(val);
    localStorage.setItem('monthly_goal', val);
    setEditing(false);
  };

  const pct = goal > 0 ? Math.min(Math.round((collected / goal) * 100), 100) : 0;
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-primary' : pct >= 30 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-primary" />
          <span className="text-sm font-semibold">Monthly Goal</span>
        </div>
        {!editing ? (
          <button onClick={() => { setInput(goal || ''); setEditing(true); }}
            className="text-muted-foreground hover:text-foreground p-1 rounded">
            <Pencil size={13} />
          </button>
        ) : (
          <button onClick={save} className="text-green-600 hover:text-green-700 p-1 rounded">
            <Check size={13} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5">
          <IndianRupee size={14} className="text-muted-foreground" />
          <input autoFocus type="number" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="flex-1 text-sm bg-secondary border border-border rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Set monthly target" />
        </div>
      ) : goal === 0 ? (
        <p className="text-xs text-muted-foreground">Click ✏️ to set your monthly revenue target</p>
      ) : (
        <>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <IndianRupee size={10} />{collected.toLocaleString('en-IN')} collected
            </span>
            <span className="text-xs font-semibold">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-0.5">
            Target: <IndianRupee size={10} />{goal.toLocaleString('en-IN')}
            {pct >= 100 && <span className="ml-1 text-emerald-600 font-medium">🎉 Goal hit!</span>}
          </p>
        </>
      )}
    </div>
  );
}