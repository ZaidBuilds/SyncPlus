
const SOURCE_CONFIG = {
  whatsapp: { label: 'WhatsApp', color: '#22c55e' },
  instagram: { label: 'Instagram', color: '#ec4899' },
  referral: { label: 'Referral', color: '#6366f1' },
  form: { label: 'Web Form', color: '#0ea5e9' },
  linkedin: { label: 'LinkedIn', color: '#0284c7' },
  cold_outreach: { label: 'Cold Outreach', color: '#f59e0b' },
  other: { label: 'Other', color: '#94a3b8' },
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export default function LeadSourceChart({ deals, contacts }) {
  const all = [...deals, ...contacts];
  const counts = {};
  all.forEach(item => {
    const src = item.lead_source || 'other';
    counts[src] = (counts[src] || 0) + 1;
  });

  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: SOURCE_CONFIG[key]?.label || key,
      value,
      color: SOURCE_CONFIG[key]?.color || '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-1">Lead Sources</h2>
        <p className="text-xs text-muted-foreground">No leads with source data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">Lead Sources</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{total} total leads tracked</p>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <div className="flex-1 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{d.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: d.color }} />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{d.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}