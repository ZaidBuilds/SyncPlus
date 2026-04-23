import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Search, TrendingDown } from 'lucide-react';
import { dataClient } from '@/lib/dataClient';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'software',
  'marketing',
  'travel',
  'equipment',
  'contractor',
  'office',
  'taxes',
  'education',
  'other',
];

const PAYMENT_MODES = ['bank_transfer', 'upi', 'card', 'cash', 'other'];

function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

function ExpenseModal({ expense, onClose, onSave }) {
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    category: 'software',
    amount: '',
    payment_mode: 'upi',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        date: expense.date || format(new Date(), 'yyyy-MM-dd'),
        description: expense.description || '',
        category: expense.category || 'software',
        amount: expense.amount || '',
        payment_mode: expense.payment_mode || 'upi',
        notes: expense.notes || '',
      });
    }
  }, [expense]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      ...form,
      amount: Number(form.amount || 0),
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-xl rounded-[28px] border border-border bg-background shadow-2xl">
        <div className="border-b border-border px-6 py-5">
          <p className="text-sm font-semibold">{expense ? 'Edit expense' : 'New expense'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Track business spending so freelancer profit and tax visibility stay clean.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(event) => set('date', event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(event) => set('amount', event.target.value)}
              placeholder="3200"
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              placeholder="Meta ads, Figma, travel, software..."
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={form.category}
              onChange={(event) => set('category', event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment mode</label>
            <select
              value={form.payment_mode}
              onChange={(event) => set('payment_mode', event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              value={form.notes}
              onChange={(event) => set('notes', event.target.value)}
              rows={3}
              placeholder="Optional note for receipts, vendor, or reimbursement context."
              className="mt-1 w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-border px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.description || !form.amount}
            className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save expense'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () =>
    dataClient.entities.Expense.list('-date', 200).then((records) => {
      setExpenses(records);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesSearch =
          expense.description?.toLowerCase().includes(search.toLowerCase()) ||
          expense.notes?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'all' || expense.category === category;
        return matchesSearch && matchesCategory;
      }),
    [expenses, search, category]
  );

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const thisMonthKey = format(new Date(), 'yyyy-MM');
    const monthTotal = expenses
      .filter((expense) => expense.date?.startsWith(thisMonthKey))
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const topCategory = Object.entries(
      expenses.reduce((grouped, expense) => {
        grouped[expense.category] = (grouped[expense.category] || 0) + (expense.amount || 0);
        return grouped;
      }, {})
    ).sort((left, right) => right[1] - left[1])[0];

    return {
      total,
      monthTotal,
      topCategory: topCategory ? topCategory[0] : 'none',
    };
  }, [expenses]);

  const handleSave = async (payload) => {
    if (editing) {
      await dataClient.entities.Expense.update(editing.id, payload);
    } else {
      await dataClient.entities.Expense.create(payload);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Freelance Ops</p>
          <h1 className="mt-2 text-3xl font-semibold">Expenses</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track business spending like software, ads, travel, and contractor costs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={16} />
          Add expense
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Total tracked</p>
          <p className="mt-3 text-3xl font-semibold">{formatMoney(summary.total)}</p>
          <p className="mt-2 text-sm text-muted-foreground">All recorded freelancer expenses.</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">This month</p>
          <p className="mt-3 text-3xl font-semibold">{formatMoney(summary.monthTotal)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Current monthly spending load.</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Largest category</p>
          <p className="mt-3 text-3xl font-semibold capitalize">{summary.topCategory.replace('_', ' ')}</p>
          <p className="mt-2 text-sm text-muted-foreground">Biggest cost bucket right now.</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by description or note..."
              className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-border/70 bg-white">
          <div className="grid grid-cols-[1.1fr_0.7fr_0.55fr_0.55fr] border-b border-border/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <p>Description</p>
            <p>Category</p>
            <p>Date</p>
            <p className="text-right">Amount</p>
          </div>

          <div className="divide-y divide-border/70">
            {filteredExpenses.length === 0 && (
              <p className="px-5 py-10 text-sm text-muted-foreground">No expenses match the current filter.</p>
            )}

            {filteredExpenses.map((expense) => (
              <button
                key={expense.id}
                type="button"
                onClick={() => {
                  setEditing(expense);
                  setModalOpen(true);
                }}
                className="grid w-full grid-cols-[1.1fr_0.7fr_0.55fr_0.55fr] items-center px-5 py-4 text-left transition-colors hover:bg-secondary/40"
              >
                <div>
                  <p className="text-sm font-semibold">{expense.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {expense.notes || expense.payment_mode?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize', 'bg-secondary text-foreground')}>
                    {expense.category?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {expense.date ? format(new Date(expense.date), 'd MMM yyyy') : '-'}
                </p>
                <div className="flex items-center justify-end gap-2 text-sm font-semibold">
                  <TrendingDown size={14} className="text-rose-500" />
                  {formatMoney(expense.amount)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <ExpenseModal
          expense={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}