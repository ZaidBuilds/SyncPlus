import { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { X, Trash2, Plus, Printer, CheckCircle, Link2, Download, Palette } from 'lucide-react';
import { format } from 'date-fns';
import { getPersonalization } from '@/lib/personalization';

const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
const GST_RATES = [0, 5, 12, 18, 28];
const TEMPLATES = [
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'executive', label: 'Executive' },
];

function getTemplateStyles(template) {
  if (template === 'minimal') {
    return { accent: [15, 23, 42], heading: 'MINIMAL INVOICE' };
  }

  if (template === 'executive') {
    return { accent: [37, 99, 235], heading: 'EXECUTIVE INVOICE' };
  }

  return { accent: [13, 148, 136], heading: 'TAX INVOICE' };
}
const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function InvoiceModal({ invoice, onSave, onDelete, onClose }) {
  const personalization = getPersonalization();
  const [form, setForm] = useState({
    invoice_number: `${personalization.invoice_prefix || 'INV'}-${Date.now().toString().slice(-5)}`,
    invoice_template: personalization.default_invoice_template || 'classic',
    contact_name: '', contact_gstin: '', client_pan: '', client_address: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '', paid_date: '', status: 'draft', currency: 'INR',
    from_name: personalization.business_name || '', from_email: personalization.business_email || '', from_address: personalization.business_address || '', from_gstin: personalization.gstin || '', from_pan: personalization.pan || '',
    line_items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    gst_rate: personalization.default_gst_rate || 18, is_igst: false, cgst: 0, sgst: 0, igst: 0,
    subtotal: 0, total: 0, payment_link: personalization.upi_id ? `upi://pay?pa=${personalization.upi_id}` : '', notes: personalization.default_invoice_note || [personalization.bank_name && `Bank: ${personalization.bank_name}`, personalization.account_number && `A/C: ${personalization.account_number}`, personalization.ifsc && `IFSC: ${personalization.ifsc}`, personalization.upi_id && `UPI: ${personalization.upi_id}`].filter(Boolean).join(' · '),
  });
  const [saving, setSaving] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    if (invoice) {
      setForm({
        invoice_template: personalization.default_invoice_template || 'classic',
        ...invoice,
        line_items: invoice.line_items?.length ? invoice.line_items : [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
      });
      return;
    }
  }, [invoice, personalization.default_invoice_template]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcTotals = (lines, gst_rate, is_igst) => {
    const subtotal = lines.reduce((s, l) => s + (l.total || 0), 0);
    const gstAmount = subtotal * ((parseFloat(gst_rate) || 0) / 100);
    const cgst = is_igst ? 0 : gstAmount / 2;
    const sgst = is_igst ? 0 : gstAmount / 2;
    const igst = is_igst ? gstAmount : 0;
    const total = subtotal + gstAmount;
    return { subtotal, cgst, sgst, igst, total };
  };

  const updateLine = (i, k, v) => {
    const lines = [...form.line_items];
    lines[i] = { ...lines[i], [k]: v };
    if (k === 'quantity' || k === 'unit_price') {
      lines[i].total = (parseFloat(lines[i].quantity) || 0) * (parseFloat(lines[i].unit_price) || 0);
    }
    const totals = calcTotals(lines, form.gst_rate, form.is_igst);
    setForm(f => ({ ...f, line_items: lines, ...totals }));
  };

  const addLine = () => {
    const lines = [...form.line_items, { description: '', quantity: 1, unit_price: 0, total: 0 }];
    setForm(f => ({ ...f, line_items: lines }));
  };

  const removeLine = (i) => {
    const lines = form.line_items.filter((_, idx) => idx !== i);
    const totals = calcTotals(lines, form.gst_rate, form.is_igst);
    setForm(f => ({ ...f, line_items: lines, ...totals }));
  };

  const recalcGst = (gst_rate, is_igst) => {
    const totals = calcTotals(form.line_items, gst_rate, is_igst);
    setForm(f => ({ ...f, gst_rate, is_igst, ...totals }));
  };

  const markPaid = () => {
    setForm(f => ({ ...f, status: 'paid', paid_date: format(new Date(), 'yyyy-MM-dd') }));
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    const template = getTemplateStyles(form.invoice_template);
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${form.invoice_number}</title>
      <style>
        body { font-family: -apple-system, Arial, sans-serif; padding: 48px; color: #111; font-size: 13px; border-top: 12px solid rgb(${template.accent.join(',')}); }
        h1 { font-size: 22px; margin: 0; } .subtitle { color: #666; font-size: 12px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 24px 0; }
        .label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { text-align: left; border-bottom: 2px solid #eee; padding: 8px 4px; font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; }
        td { padding: 10px 4px; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
        td:last-child, th:last-child { text-align: right; }
        .totals { margin-left: auto; width: 260px; }
        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .totals-total { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: 700; border-top: 2px solid #111; margin-top: 4px; }
        .badge { display: inline-block; background: #f0fdf4; color: #16a34a; padding: 2px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
        .payment-box { margin-top: 24px; padding: 16px; border: 1px solid #eee; border-radius: 8px; }
        @media print { button { display: none !important; } }
      </style>
    </head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  };

  const handleDownload = () => {
    const template = getTemplateStyles(form.invoice_template);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 44;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(...template.accent);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(template.heading, 40, y);
    y += 28;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Invoice #${form.invoice_number}`, 40, y);
    doc.text(`Issue: ${form.issue_date || '-'}`, 400, y);
    y += 28;

    doc.setFont('helvetica', 'bold');
    doc.text('From', 40, y);
    doc.text('Bill To', 300, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.text(
      doc.splitTextToSize(
        [form.from_name, form.from_email, form.from_address, `GSTIN: ${form.from_gstin || '-'}`, `PAN: ${form.from_pan || '-'}`].filter(Boolean).join('\n'),
        220
      ),
      40,
      y
    );
    doc.text(
      doc.splitTextToSize(
        [form.contact_name || '-', form.client_address || '-', `GSTIN: ${form.contact_gstin || '-'}`, `PAN: ${form.client_pan || '-'}`, `Due: ${form.due_date || '-'}`].join('\n'),
        220
      ),
      300,
      y
    );
    y += 110;

    doc.setFont('helvetica', 'bold');
    doc.text('Description', 40, y);
    doc.text('Qty', 340, y, { align: 'right' });
    doc.text('Rate', 435, y, { align: 'right' });
    doc.text('Total', 545, y, { align: 'right' });
    y += 12;
    doc.line(40, y, 545, y);
    y += 18;
    doc.setFont('helvetica', 'normal');

    form.line_items.forEach((line) => {
      const descriptionLines = doc.splitTextToSize(line.description || '-', 250);
      doc.text(descriptionLines, 40, y);
      doc.text(String(line.quantity || 0), 340, y, { align: 'right' });
      doc.text(INR(line.unit_price), 435, y, { align: 'right' });
      doc.text(INR(line.total), 545, y, { align: 'right' });
      y += Math.max(22, descriptionLines.length * 14);
    });

    y += 8;
    doc.line(330, y, 545, y);
    y += 20;
    doc.text('Subtotal', 430, y, { align: 'right' });
    doc.text(INR(form.subtotal), 545, y, { align: 'right' });
    y += 18;
    if (form.is_igst) {
      doc.text(`IGST (${form.gst_rate}%)`, 430, y, { align: 'right' });
      doc.text(INR(form.igst), 545, y, { align: 'right' });
      y += 18;
    } else if (Number(form.gst_rate) > 0) {
      doc.text(`CGST (${form.gst_rate / 2}%)`, 430, y, { align: 'right' });
      doc.text(INR(form.cgst), 545, y, { align: 'right' });
      y += 18;
      doc.text(`SGST (${form.gst_rate / 2}%)`, 430, y, { align: 'right' });
      doc.text(INR(form.sgst), 545, y, { align: 'right' });
      y += 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Total', 430, y, { align: 'right' });
    doc.text(INR(form.total), 545, y, { align: 'right' });

    if (form.payment_link || form.notes) {
      y += 34;
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize([form.payment_link && `Payment link: ${form.payment_link}`, form.notes].filter(Boolean).join('\n'), 505), 40, y);
    }

    doc.save(`${form.invoice_number || 'invoice'}-${form.invoice_template || 'classic'}.pdf`);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const { subtotal = 0, cgst = 0, sgst = 0, igst = 0, total = 0 } = form;
  const gstTotal = form.is_igst ? igst : cgst + sgst;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
      <div className="w-full max-w-2xl h-full bg-card border-l border-border flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">{invoice ? `Invoice ${invoice.invoice_number}` : 'New Invoice'}</h2>
          <div className="flex items-center gap-2">
            {form.status !== 'paid' && (
              <button onClick={markPaid} className="flex items-center gap-1 text-xs font-medium text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200 transition-colors">
                <CheckCircle size={13} /> Mark Paid
              </button>
            )}
            <button onClick={handleDownload} className="text-muted-foreground hover:bg-secondary p-1.5 rounded-lg" title="Download PDF">
              <Download size={15} />
            </button>
            <button onClick={handlePrint} className="text-muted-foreground hover:bg-secondary p-1.5 rounded-lg" title="Print / Save as PDF">
              <Printer size={15} />
            </button>
            {invoice && <button onClick={onDelete} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg"><Trash2 size={15} /></button>}
            <button onClick={onClose} className="text-muted-foreground hover:bg-secondary p-1.5 rounded-lg"><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5" ref={printRef}>
          {/* Invoice header for print */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{getTemplateStyles(form.invoice_template).heading}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <Palette size={11} />
                  {TEMPLATES.find((template) => template.value === form.invoice_template)?.label || 'Classic'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">#{form.invoice_number}</p>
            </div>
            <div className="text-right">
              {form.status === 'paid' && <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">PAID</span>}
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From (Your Details)</p>
              <input value={form.from_name} onChange={e => set('from_name', e.target.value)} placeholder="Your name / company"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={form.from_email} onChange={e => set('from_email', e.target.value)} placeholder="your@email.com"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={form.from_gstin} onChange={e => set('from_gstin', e.target.value)} placeholder="GSTIN (e.g. 27AABCU9603R1ZX)"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 uppercase" />
              <input value={form.from_pan} onChange={e => set('from_pan', e.target.value)} placeholder="PAN Number"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 uppercase" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill To</p>
              <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Client name"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={form.client_address} onChange={e => set('client_address', e.target.value)} placeholder="Client address"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={form.contact_gstin} onChange={e => set('contact_gstin', e.target.value)} placeholder="Client GSTIN (optional)"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 uppercase" />
              <input value={form.client_pan} onChange={e => set('client_pan', e.target.value)} placeholder="Client PAN (optional)"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 uppercase" />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Invoice #</label>
              <input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30">
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Issue Date</label>
              <input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Template</label>
              <select value={form.invoice_template} onChange={e => set('invoice_template', e.target.value)}
                className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30">
                {TEMPLATES.map(template => <option key={template.value} value={template.value}>{template.label}</option>)}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Line Items</p>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/60 border-b border-border">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-16">Qty</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Rate (₹)</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">Total</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {form.line_items.map((line, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                          placeholder="Item / service description"
                          className="w-full text-xs bg-transparent outline-none focus:bg-secondary/50 rounded px-1 py-0.5" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)}
                          className="w-full text-xs bg-transparent outline-none focus:bg-secondary/50 rounded px-1 py-0.5 text-right" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={line.unit_price} onChange={e => updateLine(i, 'unit_price', e.target.value)}
                          className="w-full text-xs bg-transparent outline-none focus:bg-secondary/50 rounded px-1 py-0.5 text-right" />
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium">₹{(line.total || 0).toLocaleString('en-IN')}</td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeLine(i)} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addLine} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-2 hover:bg-secondary/40 transition-colors border-t border-border">
                <Plus size={11} /> Add line item
              </button>
            </div>
          </div>

          {/* GST + Totals */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            {/* GST Config */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">GST</p>
              <div className="flex gap-2 items-center">
                <select value={form.gst_rate} onChange={e => recalcGst(e.target.value, form.is_igst)}
                  className="text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none">
                  {GST_RATES.map(r => <option key={r} value={r}>{r}% GST</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_igst} onChange={e => recalcGst(form.gst_rate, e.target.checked)} />
                  IGST (inter-state)
                </label>
              </div>
            </div>

            {/* Totals breakdown */}
            <div className="w-full sm:w-64 space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>{INR(subtotal)}</span>
              </div>
              {!form.is_igst && gstTotal > 0 && <>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>CGST ({form.gst_rate / 2}%)</span><span>{INR(cgst)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>SGST ({form.gst_rate / 2}%)</span><span>{INR(sgst)}</span>
                </div>
              </>}
              {form.is_igst && igst > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>IGST ({form.gst_rate}%)</span><span>{INR(igst)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
                <span>Total</span><span>{INR(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Link */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment Link (Razorpay / UPI)</label>
            <div className="relative mt-1">
              <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={form.payment_link} onChange={e => set('payment_link', e.target.value)}
                placeholder="https://rzp.io/l/..."
                className="w-full pl-8 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes / Bank Details</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full mt-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Bank: HDFC · A/C: 1234567890 · IFSC: HDFC0001234" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-border px-4 py-2 rounded-lg hover:bg-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
