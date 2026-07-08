import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { X, Trash2, Plus, Download, Palette, CheckCircle, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { getPersonalization } from '@/lib/personalization';
import { cn } from '@/lib/utils';

const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
const GST_RATES = [0, 5, 12, 18, 28];
const TEMPLATES = [
  { value: 'vantage_elite', label: 'Vantage Elite (B&W)' },
  { value: 'classic', label: 'Classic Corporate' },
  { value: 'minimal', label: 'Minimalist' },
];

const INR = (v) => `INR ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function InvoiceModal({ invoice, onSave, _onDelete, onClose }) {
  const personalization = getPersonalization();
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const [form, setForm] = useState({
    invoice_number: `${personalization.invoice_prefix || 'VTG'}-${Date.now().toString().slice(-5)}`,
    invoice_template: personalization.default_invoice_template || 'vantage_elite',
    contact_name: '', contact_gstin: '', client_pan: '', client_address: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    paid_date: '', status: 'draft', currency: 'INR',
    from_name: personalization.business_name || '', from_email: personalization.business_email || '', from_address: personalization.business_address || '', from_gstin: personalization.gstin || '', from_pan: personalization.pan || '',
    line_items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    gst_rate: personalization.default_gst_rate || 18, is_igst: false, cgst: 0, sgst: 0, igst: 0,
    subtotal: 0, total: 0, payment_link: personalization.upi_id ? `upi://pay?pa=${personalization.upi_id}` : '', 
    notes: personalization.default_invoice_note || [
      personalization.bank_name && `Bank: ${personalization.bank_name}`, 
      personalization.account_number && `A/C: ${personalization.account_number}`, 
      personalization.ifsc && `IFSC: ${personalization.ifsc}`
    ].filter(Boolean).join(' · '),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invoice) {
      setForm({ ...form, ...invoice });
    }
  }, [invoice]);

  const updateLine = (i, k, v) => {
    const lines = [...form.line_items];
    lines[i] = { ...lines[i], [k]: v };
    if (k === 'quantity' || k === 'unit_price') {
      lines[i].total = (parseFloat(lines[i].quantity) || 0) * (parseFloat(lines[i].unit_price) || 0);
    }
    const subtotal = lines.reduce((s, l) => s + (l.total || 0), 0);
    const gstAmount = subtotal * (form.gst_rate / 100);
    setForm(f => ({ 
      ...f, 
      line_items: lines, 
      subtotal, 
      total: subtotal + gstAmount,
      cgst: f.is_igst ? 0 : gstAmount / 2,
      sgst: f.is_igst ? 0 : gstAmount / 2,
      igst: f.is_igst ? gstAmount : 0
    }));
  };

  const handleDownload = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 60;

    // Vantage Elite Style
    if (form.invoice_template === 'vantage_elite') {
      // Top Border
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 20, 'F');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(40);
      doc.text('INVOICE', 40, y + 30);
      
      // Invoice Meta
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`NUMBER: ${form.invoice_number}`, pageWidth - 40, y + 10, { align: 'right' });
      doc.text(`DATE: ${form.issue_date}`, pageWidth - 40, y + 25, { align: 'right' });
      doc.text(`DUE: ${form.due_date}`, pageWidth - 40, y + 40, { align: 'right' });

      y += 100;

      // Addresses
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(2);
      doc.line(40, y, pageWidth - 40, y);
      
      y += 30;
      doc.setFontSize(8);
      doc.text('ISSUED BY', 40, y);
      doc.text('BILLED TO', pageWidth / 2 + 20, y);
      
      y += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(form.from_name || 'Vantage User', 40, y);
      doc.text(form.contact_name || 'Valued Client', pageWidth / 2 + 20, y);
      
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const fromDetails = [form.from_email, form.from_address, form.from_gstin && `GST: ${form.from_gstin}`].filter(Boolean);
      doc.text(fromDetails.join('\n'), 40, y);
      
      const toDetails = [form.client_address, form.contact_gstin && `GST: ${form.contact_gstin}`].filter(Boolean);
      doc.text(toDetails.join('\n'), pageWidth / 2 + 20, y);

      y += 100;

      // Table Header
      doc.setFillColor(0, 0, 0);
      doc.rect(40, y, pageWidth - 80, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION', 50, y + 16);
      doc.text('QTY', 380, y + 16, { align: 'right' });
      doc.text('PRICE', 460, y + 16, { align: 'right' });
      doc.text('TOTAL', 545, y + 16, { align: 'right' });

      y += 25;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      // Items
      form.line_items.forEach((item, i) => {
        y += 25;
        doc.text(item.description || 'Service Rendered', 50, y);
        doc.text(String(item.quantity), 380, y, { align: 'right' });
        doc.text(Number(item.unit_price).toFixed(2), 460, y, { align: 'right' });
        doc.text(Number(item.total).toFixed(2), 545, y, { align: 'right' });
        doc.setDrawColor(240, 240, 240);
        doc.line(40, y + 8, pageWidth - 40, y + 8);
      });

      y += 50;

      // Totals
      const finalY = y;
      doc.setFont('helvetica', 'bold');
      doc.text('SUBTOTAL', 440, finalY, { align: 'right' });
      doc.text(Number(form.subtotal).toFixed(2), 545, finalY, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.text(`TAX (${form.gst_rate}%)`, 440, finalY + 20, { align: 'right' });
      doc.text(Number(form.total - form.subtotal).toFixed(2), 545, finalY + 20, { align: 'right' });

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 440, finalY + 50, { align: 'right' });
      doc.text(INR(form.total), 545, finalY + 50, { align: 'right' });

      // Footer / Notes
      if (form.notes) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('NOTES & PAYMENT', 40, finalY + 100);
        doc.text(doc.splitTextToSize(form.notes, 300), 40, finalY + 115);
      }

      doc.save(`Vantage_Invoice_${form.invoice_number}.pdf`);
    } else {
      // Fallback for other templates (simplified for now)
      doc.text('Standard Invoice Layout', 40, 40);
      doc.save(`Invoice_${form.invoice_number}.pdf`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border-4 border-foreground w-full max-w-5xl h-[90vh] flex flex-col shadow-[20px_20px_0px_rgba(0,0,0,1)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b-4 border-foreground bg-foreground text-background">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Invoice Engine</h2>
            <div className="flex border-2 border-background overflow-hidden">
              <button 
                onClick={() => setActiveTab('edit')} 
                className={cn("px-4 py-1 text-[10px] font-black uppercase tracking-widest", activeTab === 'edit' ? "bg-background text-foreground" : "hover:bg-background/10")}
              >
                Edit
              </button>
              <button 
                onClick={() => setActiveTab('preview')} 
                className={cn("px-4 py-1 text-[10px] font-black uppercase tracking-widest", activeTab === 'preview' ? "bg-background text-foreground" : "hover:bg-background/10")}
              >
                Preview
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleDownload} className="bg-background text-foreground px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] hover:invert transition-all flex items-center gap-2">
              <Download size={14} /> Download PDF
            </button>
            <button onClick={onClose} className="p-1 hover:rotate-90 transition-all"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'edit' ? (
            /* Editing Sidebar */
            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              
              {/* Top Row: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Invoice Number</label>
                  <input value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} className="w-full border-b-4 border-foreground p-2 font-black text-xl outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border-b-4 border-foreground p-2 font-black text-xl outline-none bg-transparent appearance-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Issue Date</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm({...form, issue_date: e.target.value})} className="w-full border-b-4 border-foreground p-2 font-black text-xl outline-none" />
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14} /> Billing To</h3>
                  <input placeholder="Client Name" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="w-full border-b-2 border-foreground/20 p-2 font-bold outline-none focus:border-foreground" />
                  <textarea placeholder="Client Address" value={form.client_address} onChange={e => setForm({...form, client_address: e.target.value})} className="w-full border-b-2 border-foreground/20 p-2 font-bold outline-none focus:border-foreground resize-none" rows={3} />
                  <input placeholder="Client GST (Optional)" value={form.contact_gstin} onChange={e => setForm({...form, contact_gstin: e.target.value})} className="w-full border-b-2 border-foreground/20 p-2 font-bold outline-none focus:border-foreground" />
                </section>

                <section className="bg-muted p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Palette size={14} /> Style & Tax</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black opacity-60 block mb-1">Template</label>
                      <select value={form.invoice_template} onChange={e => setForm({...form, invoice_template: e.target.value})} className="w-full bg-background border-2 border-foreground p-2 font-black text-xs">
                        {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black opacity-60 block mb-1">Tax Rate (GST %)</label>
                      <select value={form.gst_rate} onChange={e => setForm({...form, gst_rate: Number(e.target.value)})} className="w-full bg-background border-2 border-foreground p-2 font-black text-xs">
                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                  </div>
                </section>
              </div>

              {/* Line Items */}
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b-4 border-foreground pb-2">
                  <h3 className="text-sm font-black uppercase tracking-widest">Line Items</h3>
                  <button onClick={() => setForm({...form, line_items: [...form.line_items, {description: '', quantity: 1, unit_price: 0, total: 0}]})} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                    <Plus size={12} /> Add Item
                  </button>
                </div>
                <div className="space-y-4">
                  {form.line_items.map((item, i) => (
                    <div key={i} className="flex items-end gap-4 group">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black opacity-40 uppercase">Description</label>
                        <input value={item.description} onChange={e => updateLine(i, 'description', e.target.value)} className="w-full border-b-2 border-foreground p-2 text-sm font-bold outline-none" placeholder="e.g. UX Design System" />
                      </div>
                      <div className="w-20 space-y-1">
                        <label className="text-[9px] font-black opacity-40 uppercase">Qty</label>
                        <input type="number" value={item.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="w-full border-b-2 border-foreground p-2 text-sm font-bold text-center outline-none" />
                      </div>
                      <div className="w-32 space-y-1">
                        <label className="text-[9px] font-black opacity-40 uppercase">Price (INR)</label>
                        <input type="number" value={item.unit_price} onChange={e => updateLine(i, 'unit_price', e.target.value)} className="w-full border-b-2 border-foreground p-2 text-sm font-bold text-right outline-none" />
                      </div>
                      <button onClick={() => setForm({...form, line_items: form.line_items.filter((_, idx) => idx !== i)})} className="mb-2 p-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Notes */}
              <section className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Bank Details & Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border-4 border-foreground p-4 font-bold text-sm outline-none bg-muted" rows={3} placeholder="Bank: HDFC · A/C: 1234..." />
              </section>

            </div>
          ) : (
            /* Visual Preview */
            <div className="flex-1 bg-muted p-12 flex justify-center overflow-y-auto">
              <div className="w-[595pt] h-[842pt] bg-white shadow-2xl p-20 text-black flex flex-col scale-[0.8] origin-top">
                {/* Visual rendering of the 'vantage_elite' template */}
                <div className="h-4 bg-black w-full mb-12" />
                <div className="flex justify-between items-start mb-16">
                  <h1 className="text-6xl font-black tracking-tighter">INVOICE</h1>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-black">NUMBER: {form.invoice_number}</p>
                    <p className="text-xs font-black">DATE: {form.issue_date}</p>
                    <p className="text-xs font-black">DUE: {form.due_date}</p>
                  </div>
                </div>

                <div className="h-0.5 bg-black w-full mb-8" />
                <div className="grid grid-cols-2 mb-16">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 mb-2">ISSUED BY</p>
                    <p className="text-lg font-black uppercase">{form.from_name || 'VANTAGE USER'}</p>
                    <p className="text-sm opacity-60">{form.from_email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 mb-2">BILLED TO</p>
                    <p className="text-lg font-black uppercase">{form.contact_name || 'VALUED CLIENT'}</p>
                    <p className="text-sm opacity-60 whitespace-pre-wrap">{form.client_address}</p>
                  </div>
                </div>

                <div className="bg-black text-white px-4 py-2 grid grid-cols-4 font-black text-[10px] mb-4">
                  <span>DESCRIPTION</span>
                  <span className="text-center">QTY</span>
                  <span className="text-right">PRICE</span>
                  <span className="text-right">TOTAL</span>
                </div>
                
                <div className="flex-1 space-y-4">
                  {form.line_items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-4 text-sm font-bold border-b border-gray-100 pb-2">
                      <span>{item.description || 'Service Rendered'}</span>
                      <span className="text-center">{item.quantity}</span>
                      <span className="text-right">{Number(item.unit_price).toFixed(2)}</span>
                      <span className="text-right">{Number(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-12 space-y-2 border-t-2 border-black pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold opacity-40 uppercase">Subtotal</span>
                    <span className="font-black">{Number(form.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold opacity-40 uppercase">Tax ({form.gst_rate}%)</span>
                    <span className="font-black">{Number(form.total - form.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-4xl font-black pt-4">
                    <span>TOTAL</span>
                    <span>{INR(form.total)}</span>
                  </div>
                </div>

                {form.notes && (
                  <div className="mt-12 text-[9px] opacity-40 font-bold uppercase tracking-widest leading-relaxed">
                    {form.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t-4 border-foreground bg-muted flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Saved locally in Vantage Database</span>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-foreground hover:bg-foreground hover:text-background transition-all">Discard</button>
            <button 
              onClick={async () => {
                setSaving(true);
                await onSave(form);
                setSaving(false);
              }} 
              disabled={saving}
              className="bg-foreground text-background px-12 py-3 text-[10px] font-black uppercase tracking-[0.3em] hover:invert transition-all disabled:opacity-50"
            >
              {saving ? 'Processing...' : 'Save & Lock Invoice'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
