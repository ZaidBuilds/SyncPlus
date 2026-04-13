import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataClient } from '@/lib/dataClient';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import InvoiceModal from '@/components/invoices/InvoiceModal';

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-sky-100 text-sky-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => dataClient.entities.Invoice.list('-created_date', 200).then(i => { setInvoices(i); setLoading(false); });
  useEffect(() => { load(); }, []);

  const filtered = invoices.filter(i =>
    i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalUnpaid = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0);

  const onSave = async (data) => {
    if (editing) await dataClient.entities.Invoice.update(editing.id, data);
    else await dataClient.entities.Invoice.create(data);
    setModal(false);
    load();
  };
  const onDelete = async () => {
    if (editing) await dataClient.entities.Invoice.delete(editing.id);
    setModal(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Invoices</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{invoices.length} invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/settings" className="text-sm font-medium border border-border px-3 py-2 rounded-lg hover:bg-secondary">
            Personalize
          </Link>
          <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-primary/90">
            <Plus size={15} /> New Invoice
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Collected</p>
          <p className="text-xl font-semibold mt-1 text-green-600">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Outstanding</p>
          <p className="text-xl font-semibold mt-1 text-amber-600">${totalUnpaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search invoices…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Invoice</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Client</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 hidden sm:table-cell">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 hidden sm:table-cell">Due</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No invoices yet.</td></tr>
            )}
            {filtered.map(inv => (
              <tr key={inv.id} onClick={() => { setEditing(inv); setModal(true); }} className="hover:bg-secondary/40 cursor-pointer transition-colors">
                <td className="px-5 py-3 font-medium">{inv.invoice_number || '—'}</td>
                <td className="px-3 py-3 text-muted-foreground">{inv.contact_name || '—'}</td>
                <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">{inv.issue_date ? format(new Date(inv.issue_date), 'MMM d') : '—'}</td>
                <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">{inv.due_date ? format(new Date(inv.due_date), 'MMM d') : '—'}</td>
                <td className="px-3 py-3 text-right font-medium">${(inv.total || 0).toLocaleString()}</td>
                <td className="px-3 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[inv.status] || STATUS_STYLES.draft)}>
                    {inv.status || 'draft'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <InvoiceModal invoice={editing} onSave={onSave} onDelete={onDelete} onClose={() => setModal(false)} />}
    </div>
  );
}
