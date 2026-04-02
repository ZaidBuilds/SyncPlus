import { Link } from 'react-router-dom';
import { IndianRupee, ArrowRight, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function OutstandingInvoices({ invoices }) {
  const outstanding = invoices
    .filter(i => ['sent', 'overdue'].includes(i.status))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  const total = invoices
    .filter(i => ['sent', 'overdue'].includes(i.status))
    .reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold">Outstanding</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
            <IndianRupee size={10} />{total.toLocaleString('en-IN')} to collect
          </p>
        </div>
        <Link to="/invoices" className="text-xs text-primary flex items-center gap-1 hover:underline">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {outstanding.length === 0 && (
          <p className="text-sm text-muted-foreground px-5 py-4">No outstanding invoices 🎉</p>
        )}
        {outstanding.map(inv => {
          const daysLeft = inv.due_date ? differenceInDays(new Date(inv.due_date), new Date()) : null;
          const isOverdue = inv.status === 'overdue' || (daysLeft !== null && daysLeft < 0);
          return (
            <div key={inv.id} className="flex items-center justify-between px-5 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{inv.contact_name || '—'}</p>
                <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold flex items-center gap-0.5 justify-end">
                  <IndianRupee size={12} />{(inv.total || 0).toLocaleString('en-IN')}
                </p>
                {daysLeft !== null && (
                  <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `Due in ${daysLeft}d`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}