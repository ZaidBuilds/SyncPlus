import { IndianRupee } from 'lucide-react';

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-400' },
  { key: 'proposal', label: 'Proposal', color: 'bg-amber-400' },
  { key: 'meeting', label: 'Meeting', color: 'bg-sky-400' },
  { key: 'contracted', label: 'Contracted', color: 'bg-blue-500' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-purple-500' },
  { key: 'closed', label: 'Closed Won', color: 'bg-emerald-500' },
];

export default function PipelineFunnel({ deals }) {
  const total = deals.length || 1;
  const closed = deals.filter(d => d.stage === 'closed').length;
  const lead = deals.filter(d => d.stage === 'lead').length;
  const winRate = lead > 0 ? Math.round((closed / lead) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">Pipeline Funnel</h2>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Win rate</span>
          <span className="ml-1.5 text-sm font-semibold text-emerald-600">{winRate}%</span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {STAGES.map((stage) => {
          const count = deals.filter(d => d.stage === stage.key).length;
          const value = deals.filter(d => d.stage === stage.key).reduce((s, d) => s + (d.value || 0), 0);
          const pct = Math.round((count / total) * 100);
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{stage.label}</span>
              <div className="flex-1 h-5 bg-secondary rounded-md overflow-hidden relative">
                <div className={`h-full ${stage.color} rounded-md transition-all duration-500`} style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }} />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white mix-blend-multiply">
                  {count > 0 ? count : ''}
                </span>
              </div>
              <div className="text-right flex-shrink-0 w-24">
                {value > 0 ? (
                  <span className="text-xs text-muted-foreground flex items-center justify-end gap-0.5">
                    <IndianRupee size={9} />{value.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}