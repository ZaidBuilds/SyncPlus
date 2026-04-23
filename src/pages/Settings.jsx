import { useMemo, useState } from 'react';
import { Palette, ReceiptText, Save, Sparkles } from 'lucide-react';
import {
  DEFAULT_PERSONALIZATION,
  getPersonalization,
  savePersonalization,
} from '@/lib/personalization';

const INVOICE_TEMPLATES = [
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'executive', label: 'Executive' },
];

export default function Settings() {
  const initialState = useMemo(() => getPersonalization(), []);
  const [form, setForm] = useState(initialState);
  const [saved, setSaved] = useState(false);

  const set = (key, value) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setForm({ ...DEFAULT_PERSONALIZATION });
    setSaved(false);
  };

  const handleSave = () => {
    savePersonalization(form);
    setSaved(true);
  };

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-5">
      <section className="bg-white border border-border rounded-xl p-5 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="section-label text-primary/80">Settings</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              Personalize everything your way.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Set your business identity, invoice defaults, and payment details once so SyncPlus
              feels like your own freelancer operating system.
            </p>
          </div>
          <div className="rounded-[24px] border border-primary/15 bg-primary/5 px-5 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles size={16} />
              <p className="text-sm font-semibold">Personalize Workspace</p>
            </div>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              These settings directly power invoice templates, business defaults, and payment info.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-primary" />
            <p className="text-sm font-semibold">Brand and business identity</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Workspace name</label>
              <input value={form.workspace_name} onChange={(event) => set('workspace_name', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Brand tagline</label>
              <input value={form.brand_tagline} onChange={(event) => set('brand_tagline', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Business name</label>
              <input value={form.business_name} onChange={(event) => set('business_name', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Business email</label>
              <input value={form.business_email} onChange={(event) => set('business_email', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <input value={form.business_phone} onChange={(event) => set('business_phone', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">GSTIN</label>
              <input value={form.gstin} onChange={(event) => set('gstin', event.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">PAN</label>
              <input value={form.pan} onChange={(event) => set('pan', event.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Business address</label>
              <textarea value={form.business_address} onChange={(event) => set('business_address', event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2">
              <ReceiptText size={16} className="text-primary" />
              <p className="text-sm font-semibold">Invoice defaults</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Invoice prefix</label>
                <input value={form.invoice_prefix} onChange={(event) => set('invoice_prefix', event.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Default GST rate</label>
                <input type="number" value={form.default_gst_rate} onChange={(event) => set('default_gst_rate', Number(event.target.value || 0))} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Default invoice template</label>
                <select value={form.default_invoice_template} onChange={(event) => set('default_invoice_template', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25">
                  {INVOICE_TEMPLATES.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Default invoice note</label>
                <textarea value={form.default_invoice_note} onChange={(event) => set('default_invoice_note', event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <p className="text-sm font-semibold">Payment details</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Bank name</label>
                <input value={form.bank_name} onChange={(event) => set('bank_name', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Account number</label>
                <input value={form.account_number} onChange={(event) => set('account_number', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">IFSC</label>
                <input value={form.ifsc} onChange={(event) => set('ifsc', event.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">UPI ID</label>
                <input value={form.upi_id} onChange={(event) => set('upi_id', event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Save size={16} />
          Save personalization
        </button>
        <button type="button" onClick={reset} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
          Reset
        </button>
        {saved && <p className="self-center text-sm text-primary">Personalization saved.</p>}
      </section>
    </div>
  );
}
