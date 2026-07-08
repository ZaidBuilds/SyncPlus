import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataClient } from '@/lib/dataClient';
import { Plus, Search, TrendingUp, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import InvoiceModal from '@/components/invoices/InvoiceModal';

const STATUS_STYLES = {
  draft: 'border-foreground/20 text-muted-foreground',
  sent: 'border-foreground text-foreground font-black',
  paid: 'bg-foreground text-background font-black',
  overdue: 'border-red-500 text-red-500 font-black',
  cancelled: 'border-foreground/10 text-foreground/20',
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

  if (loading) return <div className="flex items-center justify-center h-full text-xs font-black uppercase tracking-widest">Loading Ledger...</div>;

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b-4 border-foreground pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-foreground text-background px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Financial Ledger</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{invoices.length} Registered Records</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">Invoices</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/settings" className="border-2 border-foreground px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-muted transition-all">
            Settings
          </Link>
          <button onClick={() => { setEditing(null); setModal(true); }} className="bg-foreground text-background px-8 py-3 font-black uppercase tracking-widest text-xs hover:invert transition-all flex items-center gap-2 shadow-lg">
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-foreground divide-x-4 divide-foreground">
        <div className="p-8 space-y-2">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue Collected</p>
          </div>
          <p className="text-5xl font-black tracking-tighter">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="p-8 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outstanding Receivables</p>
          </div>
          <p className="text-5xl font-black tracking-tighter opacity-40">₹{totalUnpaid.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="relative group">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="SEARCH LEDGER BY NUMBER OR CLIENT NAME..."
          className="w-full pl-12 pr-6 py-6 text-sm font-black uppercase tracking-widest bg-muted border-b-4 border-foreground outline-none focus:bg-background transition-all" 
        />
      </div>

      {/* Table */}
      <div className="border-4 border-foreground overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-foreground text-background">
              <th className="text-left text-[10px] font-black uppercase tracking-widest px-6 py-4">Ref Number</th>
              <th className="text-left text-[10px] font-black uppercase tracking-widest px-4 py-4">Strategic Partner</th>
              <th className="text-left text-[10px] font-black uppercase tracking-widest px-4 py-4 hidden md:table-cell">Issue Date</th>
              <th className="text-right text-[10px] font-black uppercase tracking-widest px-4 py-4">Amount</th>
              <th className="text-center text-[10px] font-black uppercase tracking-widest px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-foreground">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center text-xs font-black uppercase py-20 opacity-20">Zero records found in this cycle.</td></tr>
            )}
            {filtered.map(inv => (
              <tr key={inv.id} onClick={() => { setEditing(inv); setModal(true); }} className="hover:bg-muted cursor-pointer transition-all group">
                <td className="px-6 py-6 font-black tracking-tighter text-lg">{inv.invoice_number || '—'}</td>
                <td className="px-4 py-6 font-bold uppercase text-xs">{inv.contact_name || '—'}</td>
                <td className="px-4 py-6 text-xs font-bold opacity-40 hidden md:table-cell">{inv.issue_date ? format(new Date(inv.issue_date), 'MMM dd, yyyy') : '—'}</td>
                <td className="px-4 py-6 text-right font-black text-xl tracking-tighter">₹{(inv.total || 0).toLocaleString()}</td>
                <td className="px-6 py-6 text-center">
                  <span className={cn('text-[10px] font-black px-3 py-1 border-2 uppercase tracking-widest inline-block', STATUS_STYLES[inv.status] || STATUS_STYLES.draft)}>
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
