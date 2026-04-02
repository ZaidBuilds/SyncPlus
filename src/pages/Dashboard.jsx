import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  FileText,
  IndianRupee,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { dataClient } from '@/lib/dataClient';
import AiFollowupPanel from '@/components/dashboard/AiFollowupPanel';
import AgingDeals from '@/components/dashboard/AgingDeals';
import LeadSourceChart from '@/components/dashboard/LeadSourceChart';
import LifeOSWidget from '@/components/dashboard/LifeOSWidget';
import OutstandingInvoices from '@/components/dashboard/OutstandingInvoices';
import PipelineFunnel from '@/components/dashboard/PipelineFunnel';
import QuickNote from '@/components/dashboard/QuickNote';
import RevenueChart from '@/components/dashboard/RevenueChart';
import RevenueGoal from '@/components/dashboard/RevenueGoal';
import TodaysFocusBar from '@/components/dashboard/TodaysFocusBar';

const stageColors = {
  lead: 'bg-slate-100 text-slate-700',
  proposal: 'bg-amber-100 text-amber-700',
  meeting: 'bg-sky-100 text-sky-700',
  contracted: 'bg-teal-100 text-teal-700',
  negotiating: 'bg-orange-100 text-orange-700',
  closed: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-700',
};

function formatCurrency(value) {
  return (value || 0).toLocaleString('en-IN');
}

function KpiCard({ to, icon: Icon, label, value, helper, tone }) {
  const Wrapper = to ? Link : 'div';

  return (
    <Wrapper
      to={to}
      className="rounded-[24px] border border-white/70 bg-white/88 p-4 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.28)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
        </div>
        <span className={`rounded-2xl p-3 ${tone}`}>
          <Icon size={18} />
        </span>
      </div>
    </Wrapper>
  );
}

function ActivityPanel({ title, subtitle, actionLabel, to, children }) {
  return (
    <div className="soft-panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {to && (
          <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {actionLabel}
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className="divide-y divide-border/70">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const [dealList, contactList, invoiceList, reminderList] = await Promise.all([
          dataClient.entities.Deal.list('-created_date', 200),
          dataClient.entities.Contact.list('-created_date', 200),
          dataClient.entities.Invoice.list('-created_date', 200),
          dataClient.entities.Reminder.list('due_date', 200),
        ]);

        if (!active) {
          return;
        }

        setDeals(dealList);
        setContacts(contactList);
        setInvoices(invoiceList);
        setReminders(reminderList);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError?.message || 'Could not load the dashboard.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const overview = useMemo(() => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const openDeals = deals.filter((deal) => !['closed', 'lost'].includes(deal.stage));
    const closedDeals = deals.filter((deal) => deal.stage === 'closed');
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
    const openInvoices = invoices.filter((invoice) => ['sent', 'overdue'].includes(invoice.status));
    const activeReminders = reminders.filter((reminder) => !reminder.is_done && reminder.due_date);
    const overdueReminders = activeReminders.filter((reminder) =>
      isBefore(new Date(reminder.due_date), now)
    );
    const upcomingReminders = activeReminders
      .filter((reminder) => isAfter(new Date(reminder.due_date), now))
      .slice(0, 5);
    const dueToday = activeReminders.filter((reminder) => {
      const dueDate = new Date(reminder.due_date);
      return dueDate >= dayStart && dueDate <= new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    });

    return {
      openDeals,
      pipelineValue: openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      wonValue: closedDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      collectedTotal: paidInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0),
      outstandingTotal: openInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0),
      overdueInvoiceCount: invoices.filter((invoice) => invoice.status === 'overdue').length,
      activeReminders,
      overdueReminders,
      upcomingReminders,
      dueToday,
      recentDeals: deals.slice(0, 5),
      newLeads: deals.filter((deal) => deal.stage === 'lead').length,
      winRate: deals.length > 0 ? Math.round((closedDeals.length / deals.length) * 100) : 0,
    };
  }, [deals, invoices, reminders]);

  if (loading) {
    return (
      <div className="page-frame">
        <div className="glass-panel flex min-h-[420px] items-center justify-center rounded-[32px]">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Building your workspace overview...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-frame">
        <div className="soft-panel p-8">
          <p className="section-label text-destructive">Dashboard</p>
          <h1 className="mt-4 font-display text-3xl font-semibold">The overview could not be loaded.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-frame space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="soft-panel mesh-card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="section-label text-primary/80">Command deck</p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">
                See what needs movement before the day gets noisy.
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                SyncPlus keeps your focus system and your client pipeline in one view so work, follow-ups,
                and cash flow stop competing for attention.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Today</p>
              <p className="mt-2 font-display text-2xl font-semibold">{format(new Date(), 'EEEE')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{format(new Date(), 'd MMMM yyyy')}</p>
            </div>
          </div>

          <div className="mt-6">
            <TodaysFocusBar
              reminders={reminders}
              invoices={invoices}
              onNewDeal={() => navigate('/pipeline')}
              onNewInvoice={() => navigate('/invoices')}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <KpiCard
              to="/pipeline"
              icon={TrendingUp}
              label="Pipeline value"
              value={
                <span className="inline-flex items-center gap-1">
                  <IndianRupee size={18} />
                  {formatCurrency(overview.pipelineValue)}
                </span>
              }
              helper={`${overview.openDeals.length} live deals across the board`}
              tone="bg-primary/10 text-primary"
            />
            <KpiCard
              to="/contacts"
              icon={Users}
              label="Contacts"
              value={contacts.length}
              helper={`${overview.newLeads} leads still in early-stage discovery`}
              tone="bg-sky-100 text-sky-700"
            />
            <KpiCard
              to="/invoices"
              icon={IndianRupee}
              label="Collected"
              value={
                <span className="inline-flex items-center gap-1">
                  <IndianRupee size={18} />
                  {formatCurrency(overview.collectedTotal)}
                </span>
              }
              helper={`${overview.overdueInvoiceCount} overdue invoice${overview.overdueInvoiceCount === 1 ? '' : 's'} need attention`}
              tone="bg-emerald-100 text-emerald-700"
            />
            <KpiCard
              to="/reminders"
              icon={Bell}
              label="Pending follow-ups"
              value={overview.activeReminders.length}
              helper={`${overview.overdueReminders.length} overdue, ${overview.dueToday.length} due today`}
              tone="bg-orange-100 text-orange-700"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[24px] border border-white/70 bg-white/74 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BriefcaseBusiness size={16} className="text-primary" />
                Pipeline momentum
              </div>
              <p className="mt-3 text-3xl font-semibold">{overview.winRate}%</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Current close ratio based on total deals already tracked in the system.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/74 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Target size={16} className="text-orange-500" />
                Cash still to collect
              </div>
              <p className="mt-3 inline-flex items-center gap-1 text-3xl font-semibold">
                <IndianRupee size={22} />
                {formatCurrency(overview.outstandingTotal)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Outstanding invoices are already visible here so collections do not slip behind delivery.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/74 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText size={16} className="text-sky-600" />
                Won business
              </div>
              <p className="mt-3 inline-flex items-center gap-1 text-3xl font-semibold">
                <IndianRupee size={22} />
                {formatCurrency(overview.wonValue)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Total value already closed, useful for measuring pipeline quality against actual conversion.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <ActivityPanel
            title="Recent deals"
            subtitle="Fresh movement happening across the pipeline"
            actionLabel="Open pipeline"
            to="/pipeline"
          >
            {overview.recentDeals.length === 0 && (
              <p className="px-5 py-5 text-sm text-muted-foreground">No deals have been added yet.</p>
            )}
            {overview.recentDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{deal.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {deal.contact_name || 'No contact linked'}
                  </p>
                </div>
                <div className="text-right">
                  {deal.value > 0 && (
                    <p className="inline-flex items-center justify-end gap-1 text-sm font-semibold">
                      <IndianRupee size={13} />
                      {formatCurrency(deal.value)}
                    </p>
                  )}
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stageColors[deal.stage]}`}>
                    {deal.stage}
                  </span>
                </div>
              </div>
            ))}
          </ActivityPanel>

          <ActivityPanel
            title="Upcoming follow-ups"
            subtitle="What is scheduled next so nothing goes stale"
            actionLabel="Open reminders"
            to="/reminders"
          >
            {overview.upcomingReminders.length === 0 && (
              <p className="px-5 py-5 text-sm text-muted-foreground">No upcoming reminders scheduled.</p>
            )}
            {overview.upcomingReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{reminder.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {reminder.notes || 'Follow-up reminder'}
                  </p>
                </div>
                <p className="text-right text-xs font-medium text-muted-foreground">
                  {format(new Date(reminder.due_date), 'd MMM, h:mm a')}
                </p>
              </div>
            ))}
          </ActivityPanel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueChart invoices={invoices} />
        <RevenueGoal collected={overview.collectedTotal} />
      </section>

      <section>
        <LifeOSWidget />
      </section>

      <section>
        <QuickNote deals={deals} contacts={contacts} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <PipelineFunnel deals={deals} />
        <LeadSourceChart deals={deals} contacts={contacts} />
        <OutstandingInvoices invoices={invoices} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AgingDeals deals={deals} />
        <AiFollowupPanel deals={deals} />
      </section>
    </div>
  );
}
