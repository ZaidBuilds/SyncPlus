import { ExternalLink, Mail, HardDrive, MessageSquare, Instagram, Linkedin, Zap, Globe, CheckCircle, Clock } from 'lucide-react';

const INTEGRATIONS = [
  {
    category: 'Communication',
    items: [
      { name: 'Gmail', desc: 'Send emails directly from SyncPlus', icon: Mail, status: 'available', color: 'bg-red-50 text-red-500', link: 'https://mail.google.com' },
      { name: 'WhatsApp', desc: 'Open WhatsApp chat with clients', icon: MessageSquare, status: 'available', color: 'bg-green-50 text-green-500', link: 'https://web.whatsapp.com' },
    ]
  },
  {
    category: 'Storage & Docs',
    items: [
      { name: 'Google Drive', desc: 'Store and share client documents', icon: HardDrive, status: 'available', color: 'bg-blue-50 text-blue-500', link: 'https://drive.google.com' },
      { name: 'Notion', desc: 'Link proposals and project docs', icon: Globe, status: 'coming_soon', color: 'bg-gray-50 text-gray-500' },
    ]
  },
  {
    category: 'Lead Generation',
    items: [
      { name: 'Instagram DM', desc: 'Track leads from Instagram DMs', icon: Instagram, status: 'coming_soon', color: 'bg-pink-50 text-pink-500' },
      { name: 'LinkedIn', desc: 'Import leads from LinkedIn outreach', icon: Linkedin, status: 'coming_soon', color: 'bg-blue-50 text-blue-600' },
    ]
  },
  {
    category: 'Payments',
    items: [
      { name: 'Razorpay', desc: 'Generate payment links & track payments', icon: Zap, status: 'coming_soon', color: 'bg-indigo-50 text-indigo-500' },
      { name: 'UPI / PhonePe', desc: 'Share UPI ID directly in invoices', icon: Zap, status: 'manual', color: 'bg-purple-50 text-purple-500' },
    ]
  },
  {
    category: 'Automation',
    items: [
      { name: 'Zapier', desc: 'Connect SyncPlus to 5000+ apps', icon: Zap, status: 'coming_soon', color: 'bg-orange-50 text-orange-500' },
      { name: 'Make (Integromat)', desc: 'Advanced workflow automation', icon: Zap, status: 'coming_soon', color: 'bg-purple-50 text-purple-500' },
    ]
  },
];

const STATUS_BADGE = {
  available: { label: 'Available', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  coming_soon: { label: 'Coming Soon', class: 'bg-amber-100 text-amber-700', icon: Clock },
  manual: { label: 'Manual', class: 'bg-blue-100 text-blue-700', icon: CheckCircle },
};

export default function Integrations() {
  const openLink = (link) => { if (link) window.open(link, '_blank'); };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Connect your favourite tools to SyncPlus</p>
      </div>

      <div className="space-y-7">
        {INTEGRATIONS.map(group => (
          <div key={group.category}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group.category}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {group.items.map(item => {
                const badge = STATUS_BADGE[item.status];
                const BadgeIcon = badge.icon;
                return (
                  <div key={item.name}
                    className={`bg-card border border-border rounded-xl p-4 flex items-start gap-4 ${item.link ? 'cursor-pointer hover:shadow-sm transition-shadow group' : ''}`}
                    onClick={() => openLink(item.link)}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badge.class}`}>
                          <BadgeIcon size={10} />{badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    {item.link && <ExternalLink size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold">Request an Integration</h3>
        <p className="text-xs text-muted-foreground mt-1">Need a tool that's not listed? We're building more integrations every week.</p>
        <a href="mailto:hello@syncplus.app" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:underline">
          <Mail size={12} /> Request integration →
        </a>
      </div>
    </div>
  );
}
