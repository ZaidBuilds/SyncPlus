import { Link } from 'react-router-dom';
import { AlertTriangle, IndianRupee, ArrowRight } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const STAGE_THRESHOLDS = { lead: 5, proposal: 7, meeting: 5, contracted: 10, negotiating: 7 };

export default function AgingDeals({ deals }) {
  const aging = deals
    .filter(d => !['closed', 'lost'].includes(d.stage))
    .map(d => {
      const days = d.last_activity_date
        ? differenceInDays(new Date(), new Date(d.last_activity_date))
        : differenceInDays(new Date(), new Date(d.created_date));
      const threshold = STAGE_THRESHOLDS[d.stage] || 7;
      return { ...d, days, threshold, isAging: days >= threshold };
    })
    .filter(d => d.isAging)
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);

  if (aging.length === 0) return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={14} className="text-amber-500" />
        <span className="text-sm font-semibold">Aging Deals</span>
      </div>
      <p className="text-xs text-muted-foreground">✅ No stale deals — pipeline is healthy!</p>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          <span className="text-sm font-semibold">Aging Deals</span>
          <span className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded-full">{aging.length}</span>
        </div>
        <Link to="/pipeline" className="text-xs text-primary flex items-center gap-1 hover:underline">
          Pipeline <ArrowRight size={11} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {aging.map(d => (
          <div key={d.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{d.title}</p>
              <p className="text-xs text-muted-foreground capitalize">{d.stage}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {d.value > 0 && (
                <p className="text-xs font-semibold flex items-center justify-end gap-0.5">
                  <IndianRupee size={10} />{d.value.toLocaleString('en-IN')}
                </p>
              )}
              <p className="text-xs font-medium text-red-500">{d.days}d inactive</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}