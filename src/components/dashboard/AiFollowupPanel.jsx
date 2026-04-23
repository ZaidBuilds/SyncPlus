import { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle } from 'lucide-react';
import { generateFollowupSuggestions } from '@/lib/localInsights';

export default function AiFollowupPanel({ deals }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const staleDeals = deals.filter(d => {
    if (['closed', 'lost'].includes(d.stage)) return false;
    if (!d.last_activity_date) return true;
    const daysSince = (Date.now() - new Date(d.last_activity_date)) / (1000 * 60 * 60 * 24);
    return daysSince >= 3;
  });

  const generate = async () => {
    setLoading(true);
    try {
      setSuggestions(generateFollowupSuggestions(staleDeals));
    } finally {
      setLoading(false);
    }
  };

  const urgencyColor = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    low: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-primary" />
          <h2 className="text-sm font-semibold">Follow-up Suggestions</h2>
          {staleDeals.length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 font-medium px-1.5 py-0.5 rounded-full">{staleDeals.length} stale</span>
          )}
        </div>
        <button onClick={generate} disabled={loading || staleDeals.length === 0}
          className="flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Preparing…' : 'Generate'}
        </button>
      </div>

      <div className="divide-y divide-border">
        {!suggestions && !loading && staleDeals.length === 0 && (
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
            <CheckCircle size={15} className="text-green-500" />
            All deals are active — no follow-ups needed!
          </div>
        )}
        {!suggestions && !loading && staleDeals.length > 0 && (
          <p className="px-5 py-4 text-sm text-muted-foreground">
            {staleDeals.length} deal{staleDeals.length > 1 ? 's' : ''} haven&apos;t been touched in 3+ days. Generate a local action list to move them forward.
          </p>
        )}
        {loading && (
          <div className="px-5 py-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Generating follow-up ideas…
          </div>
        )}
        {suggestions?.map((s, i) => (
          <div key={i} className="px-5 py-3.5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{s.deal_title}</p>
              <p className="text-sm mt-0.5">{s.action}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${urgencyColor[s.urgency] || urgencyColor.low}`}>
              {s.urgency}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
