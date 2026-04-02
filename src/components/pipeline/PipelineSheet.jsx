import { IndianRupee, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STAGE_COLORS = {
  lead: 'bg-gray-100 text-gray-600',
  proposal: 'bg-amber-100 text-amber-700',
  meeting: 'bg-sky-100 text-sky-700',
  contracted: 'bg-green-100 text-green-700',
  negotiating: 'bg-purple-100 text-purple-700',
  closed: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-600',
};

export default function PipelineSheet({ deals, stages, sheetTab, setSheetTab, onEdit, onNew }) {
  const filtered = sheetTab === 'all' ? deals : deals.filter(d => d.stage === sheetTab);
  const tabs = [{ key: 'all', label: 'All Deals' }, ...stages];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sheet Tabs */}
      <div className="flex items-center gap-0 border-b border-border overflow-x-auto px-5 pt-2 flex-shrink-0 bg-background">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setSheetTab(tab.key)}
            className={cn(
              'px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
              sheetTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}>
            {tab.label}
            <span className="ml-1.5 text-muted-foreground">
              {tab.key === 'all' ? deals.length : deals.filter(d => d.stage === tab.key).length}
            </span>
          </button>
        ))}
        <button onClick={() => onNew(sheetTab === 'all' ? 'lead' : sheetTab)}
          className="ml-auto mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-secondary transition-colors flex-shrink-0">
          <Plus size={12} /> Add row
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur">
            <tr>
              {['Deal Title', 'Contact', 'Stage', 'Value (₹)', 'Source', 'Close Date', 'Last Activity'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-10 text-sm">No deals. Click "Add row" to create one.</td></tr>
            )}
            {filtered.map(deal => (
              <tr key={deal.id} onClick={() => onEdit(deal)}
                className="hover:bg-secondary/40 cursor-pointer transition-colors group">
                <td className="px-4 py-2.5 font-medium">{deal.title}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{deal.contact_name || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STAGE_COLORS[deal.stage])}>
                    {deal.stage}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-medium">
                  {deal.value ? (
                    <span className="flex items-center gap-0.5">
                      <IndianRupee size={11} />{deal.value.toLocaleString('en-IN')}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground capitalize">{deal.lead_source?.replace('_', ' ') || '—'}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {deal.expected_close_date ? format(new Date(deal.expected_close_date), 'dd MMM yyyy') : '—'}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {deal.last_activity_date ? format(new Date(deal.last_activity_date), 'dd MMM, h:mm a') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}