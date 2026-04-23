import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, IndianRupee, Plus } from 'lucide-react';
import { isBefore } from 'date-fns';

export default function TodaysFocusBar({ reminders, invoices, onNewDeal, onNewInvoice }) {
  const overdueReminders = reminders.filter(r => !r.is_done && isBefore(new Date(r.due_date), new Date()));
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const overdueInvoiceTotal = overdueInvoices.reduce((s, i) => s + (i.total || 0), 0);

  const hasFocus = overdueReminders.length > 0 || overdueInvoices.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick Actions */}
      <button onClick={onNewDeal}
        className="flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors">
        <Plus size={13} /> New Deal
      </button>
      <button onClick={onNewInvoice}
        className="flex items-center gap-1.5 text-xs font-medium border border-border bg-card px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
        <IndianRupee size={13} /> New Invoice
      </button>

      <div className="flex-1" />

      {/* Alert Pills */}
      {overdueReminders.length > 0 && (
        <Link to="/reminders" className="flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
          <Clock size={12} />
          {overdueReminders.length} overdue follow-up{overdueReminders.length > 1 ? 's' : ''}
        </Link>
      )}
      {overdueInvoices.length > 0 && (
        <Link to="/invoices" className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
          <AlertTriangle size={12} />
          <IndianRupee size={10} />{overdueInvoiceTotal.toLocaleString('en-IN')} overdue
        </Link>
      )}
      {!hasFocus && (
        <span className="text-xs text-muted-foreground">✅ You&apos;re all caught up today</span>
      )}
    </div>
  );
}
