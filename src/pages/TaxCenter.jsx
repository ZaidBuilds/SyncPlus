import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calculator, Landmark, Plus, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dataClient } from '@/lib/dataClient';

function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

function getCurrentFinancialYear(date = new Date()) {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const nextYearShort = String((year + 1) % 100).padStart(2, '0');
  return `${year}-${nextYearShort}`;
}

function TaxEntryModal({ kind, entry, onClose, onSave, defaultFinancialYear }) {
  const [form, setForm] = useState(
    kind === 'tds'
      ? {
          client_name: '',
          financial_year: defaultFinancialYear,
          quarter: 'Q1',
          amount: '',
          certificate_number: '',
          date_received: format(new Date(), 'yyyy-MM-dd'),
          notes: '',
        }
      : {
          financial_year: defaultFinancialYear,
          instalment: 'June',
          amount_paid: '',
          date_paid: format(new Date(), 'yyyy-MM-dd'),
          notes: '',
        }
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm({ ...entry });
    }
  }, [entry]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const payload =
      kind === 'tds'
        ? { ...form, amount: Number(form.amount || 0) }
        : { ...form, amount_paid: Number(form.amount_paid || 0) };
    await onSave(payload);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-xl rounded-[28px] border border-border bg-background shadow-2xl">
        <div className="border-b border-border px-6 py-5">
          <p className="text-sm font-semibold">{entry ? 'Edit record' : `New ${kind === 'tds' ? 'TDS entry' : 'advance tax payment'}`}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep freelancer tax tracking visible before filing season gets stressful.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          {kind === 'tds' ? (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Client</label>
                <input value={form.client_name || ''} onChange={(event) => set('client_name', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount</label>
                <input type="number" value={form.amount || ''} onChange={(event) => set('amount', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Financial year</label>
                <input value={form.financial_year || ''} onChange={(event) => set('financial_year', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Quarter</label>
                <select value={form.quarter || 'Q1'} onChange={(event) => set('quarter', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                    <option key={quarter} value={quarter}>
                      {quarter}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Certificate number</label>
                <input value={form.certificate_number || ''} onChange={(event) => set('certificate_number', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date received</label>
                <input type="date" value={form.date_received || ''} onChange={(event) => set('date_received', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Financial year</label>
                <input value={form.financial_year || ''} onChange={(event) => set('financial_year', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount paid</label>
                <input type="number" value={form.amount_paid || ''} onChange={(event) => set('amount_paid', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Instalment</label>
                <select value={form.instalment || 'June'} onChange={(event) => set('instalment', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25">
                  {['June', 'September', 'December', 'March', 'Self Assessment', 'Other'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date paid</label>
                <input type="date" value={form.date_paid || ''} onChange={(event) => set('date_paid', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={form.notes || ''} onChange={(event) => set('notes', event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
        </div>

        <div className="flex gap-3 border-t border-border px-6 py-5">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaxCenter() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tdsEntries, setTdsEntries] = useState([]);
  const [advanceTaxPayments, setAdvanceTaxPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const currentFinancialYear = getCurrentFinancialYear();

  const load = async () => {
    const [invoiceRecords, expenseRecords, tdsRecords, advanceTaxRecords] = await Promise.all([
      dataClient.entities.Invoice.list('-issue_date', 200),
      dataClient.entities.Expense.list('-date', 200),
      dataClient.entities.TdsEntry.list('-date_received', 200),
      dataClient.entities.AdvanceTaxPayment.list('-date_paid', 200),
    ]);

    setInvoices(invoiceRecords);
    setExpenses(expenseRecords);
    setTdsEntries(tdsRecords);
    setAdvanceTaxPayments(advanceTaxRecords);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const fyInvoices = invoices.filter(
      (invoice) =>
        invoice.status !== 'cancelled' &&
        invoice.status !== 'draft' &&
        invoice.issue_date &&
        getCurrentFinancialYear(new Date(invoice.issue_date)) === currentFinancialYear
    );
    const fyExpenses = expenses.filter(
      (expense) => expense.date && getCurrentFinancialYear(new Date(expense.date)) === currentFinancialYear
    );
    const fyRevenue = fyInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const fyExpenseTotal = fyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const presumptiveIncome = Math.round(fyRevenue * 0.5);
    const reserveTarget = Math.round(presumptiveIncome * 0.3);
    const tdsCredit = tdsEntries
      .filter((entry) => entry.financial_year === currentFinancialYear)
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const advanceTax = advanceTaxPayments
      .filter((entry) => entry.financial_year === currentFinancialYear)
      .reduce((sum, entry) => sum + (entry.amount_paid || 0), 0);

    return {
      fyRevenue,
      fyExpenseTotal,
      presumptiveIncome,
      reserveTarget,
      tdsCredit,
      advanceTax,
      taxCovered: tdsCredit + advanceTax,
    };
  }, [invoices, expenses, tdsEntries, advanceTaxPayments, currentFinancialYear]);

  const saveTds = async (payload) => {
    if (editing) {
      await dataClient.entities.TdsEntry.update(editing.id, payload);
    } else {
      await dataClient.entities.TdsEntry.create(payload);
    }
    setModal(null);
    setEditing(null);
    load();
  };

  const saveAdvanceTax = async (payload) => {
    if (editing) {
      await dataClient.entities.AdvanceTaxPayment.update(editing.id, payload);
    } else {
      await dataClient.entities.AdvanceTaxPayment.create(payload);
    }
    setModal(null);
    setEditing(null);
    load();
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Freelance Ops</p>
          <h1 className="mt-2 text-3xl font-semibold">TDS & Tax</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            A planning surface for Indian freelancer finances: TDS credits, advance tax, FY revenue,
            44ADA-style estimation, and the pressure points to review before filing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => { setEditing(null); setModal('tds'); }} className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-secondary">
            <Plus size={16} />
            Add TDS
          </button>
          <button type="button" onClick={() => { setEditing(null); setModal('advance-tax'); }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus size={16} />
            Add tax payment
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">FY revenue</p>
          <p className="mt-3 text-3xl font-semibold">{formatMoney(summary.fyRevenue)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{currentFinancialYear} billed revenue.</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">44ADA estimate</p>
          <p className="mt-3 text-3xl font-semibold">{formatMoney(summary.presumptiveIncome)}</p>
          <p className="mt-2 text-sm text-muted-foreground">50% planning estimate of taxable income.</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">TDS + advance tax</p>
          <p className="mt-3 text-3xl font-semibold">{formatMoney(summary.taxCovered)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Already covered for this financial year.</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Reserve target</p>
          <p className="mt-3 text-3xl font-semibold">{formatMoney(summary.reserveTarget)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Simple planning buffer, not legal advice.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <p className="section-label">Credits</p>
              <h2 className="mt-2 text-2xl font-semibold">TDS entries</h2>
            </div>
            <p className="text-sm text-muted-foreground">{currentFinancialYear}</p>
          </div>
          <div className="divide-y divide-border">
            {tdsEntries.length === 0 && (
              <p className="px-6 py-8 text-sm text-muted-foreground">No TDS entries yet.</p>
            )}
            {tdsEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => { setEditing(entry); setModal('tds'); }}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-secondary/40"
              >
                <div>
                  <p className="text-sm font-semibold">{entry.client_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.financial_year} · {entry.quarter} · {entry.certificate_number || 'No certificate number'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatMoney(entry.amount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.date_received ? format(new Date(entry.date_received), 'd MMM yyyy') : '-'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border px-6 py-5">
              <p className="section-label">Payments</p>
              <h2 className="mt-2 text-2xl font-semibold">Advance tax</h2>
            </div>
<div className="divide-y divide-border">
              {advanceTaxPayments.length === 0 && (
                <p className="px-6 py-8 text-sm text-muted-foreground">No advance tax payments yet.</p>
              )}
              {advanceTaxPayments.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => { setEditing(entry); setModal('advance-tax'); }}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-secondary/40"
                >
                  <div>
                    <p className="text-sm font-semibold">{entry.instalment}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.financial_year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatMoney(entry.amount_paid)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.date_paid ? format(new Date(entry.date_paid), 'd MMM yyyy') : '-'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-primary" />
              <p className="text-sm font-semibold">Freelancer tax stack</p>
            </div>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              <p>Expenses tracked: {formatMoney(summary.fyExpenseTotal)}</p>
              <p>TDS credit: {formatMoney(summary.tdsCredit)}</p>
              <p>Advance tax paid: {formatMoney(summary.advanceTax)}</p>
            </div>
            <div className="mt-5 flex gap-4">
              <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <ReceiptText size={14} />
                Open invoices
              </Link>
              <Link to="/expenses" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Landmark size={14} />
                Open expenses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {modal === 'tds' && (
        <TaxEntryModal
          kind="tds"
          entry={editing}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSave={saveTds}
          defaultFinancialYear={currentFinancialYear}
        />
      )}

      {modal === 'advance-tax' && (
        <TaxEntryModal
          kind="advance-tax"
          entry={editing}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSave={saveAdvanceTax}
          defaultFinancialYear={currentFinancialYear}
        />
      )}
    </div>
  );
}
