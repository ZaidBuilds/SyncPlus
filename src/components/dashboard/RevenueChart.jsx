import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfMonth, subMonths } from 'date-fns';
import { IndianRupee } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-primary flex items-center gap-0.5"><IndianRupee size={10} />{payload[0].value?.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ invoices }) {
  const data = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM yy'), revenue: 0 };
    });

    invoices.filter(inv => inv.status === 'paid' && inv.paid_date).forEach(inv => {
      const key = inv.paid_date?.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) m.revenue += inv.total || 0;
    });

    // Also count by issue_date if no paid_date
    invoices.filter(inv => inv.status === 'paid' && !inv.paid_date && inv.issue_date).forEach(inv => {
      const key = inv.issue_date?.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) m.revenue += inv.total || 0;
    });

    return months;
  }, [invoices]);

  const totalRevenue = data.reduce((s, m) => s + m.revenue, 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">Revenue (6 months)</h2>
        <span className="text-sm font-semibold text-green-600 flex items-center gap-0.5">
          <IndianRupee size={13} />{totalRevenue.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5' }} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}