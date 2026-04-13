import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Calculator,
  CircleDollarSign,
  Clock3,
  FolderOpen,
  Goal,
  LayoutGrid,
  Receipt,
  Target,
} from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { buildTodayFocusItems, formatCurrency, loadLifeOsSnapshot } from '@/lib/workspace';

const quickLinks = [
  {
    title: 'Daily Execution',
    description: 'Run tasks, habits, and schedule from one page.',
    to: '/daily',
    icon: Goal,
  },
  {
    title: 'Pipeline',
    description: 'Check active deals and move follow-ups faster.',
    to: '/pipeline',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Calendar',
    description: 'Protect time blocks before the day gets noisy.',
    to: '/calendar',
    icon: CalendarDays,
  },
  {
    title: 'Expenses',
    description: 'Track spend across software, travel, and freelancer ops.',
    to: '/expenses',
    icon: Receipt,
  },
  {
    title: 'TDS & Tax',
    description: 'Review TDS credits, advance tax, and FY planning.',
    to: '/tax',
    icon: Calculator,
  },
];

const stageLabels = {
  lead: 'Lead',
  proposal: 'Proposal',
  meeting: 'Meeting',
  contracted: 'Contracted',
  negotiating: 'Negotiating',
  closed: 'Closed',
  lost: 'Lost',
};

function formatDueLabel(value) {
  if (!value) {
    return 'No due date';
  }

  const parsed = parseISO(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'No due date';
  }

  return value.length > 10 ? format(parsed, 'd MMM, h:mm a') : format(parsed, 'd MMM');
}

function getPriorityTone(priority) {
  if (priority === 'high') {
    return 'text-rose-600 bg-rose-50 border-rose-100';
  }

  if (priority === 'medium') {
    return 'text-amber-700 bg-amber-50 border-amber-100';
  }

  return 'text-slate-600 bg-slate-50 border-slate-200';
}

function getProjectStatusTone(status) {
  if (status === 'in_progress') {
    return 'text-primary bg-primary/10 border-primary/15';
  }

  if (status === 'on_hold') {
    return 'text-amber-700 bg-amber-50 border-amber-100';
  }

  return 'text-slate-600 bg-slate-50 border-slate-200';
}

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const nextSnapshot = await loadLifeOsSnapshot();
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Could not load the dashboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardData = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    const today = startOfDay(new Date());
    const todayFocus = buildTodayFocusItems(snapshot).slice(0, 5);
    const openTasks = snapshot.tasks.filter((task) => task.status !== 'done');
    const overdueTasks = openTasks.filter(
      (task) => task.due_date && isBefore(parseISO(task.due_date), today)
    );
    const activeProjects = snapshot.projects
      .filter((project) => !['completed', 'cancelled'].includes(project.status))
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      })
      .slice(0, 3);
    const activeGoals = snapshot.goals
      .filter((goal) => goal.status === 'active')
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      })
      .slice(0, 3);
    const openDeals = snapshot.deals.filter((deal) => !['closed', 'lost'].includes(deal.stage));
    const overdueInvoices = snapshot.invoices.filter((invoice) => invoice.status === 'overdue');
    const outstandingInvoices = snapshot.invoices.filter((invoice) =>
      ['sent', 'overdue'].includes(invoice.status)
    );
    const upcomingBlocks = snapshot.calendarBlocks
      .filter((block) => block.date === format(today, 'yyyy-MM-dd'))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .slice(0, 4);
    const stageSummary = ['lead', 'proposal', 'meeting', 'negotiating', 'contracted'].map((stage) => {
      const deals = openDeals.filter((deal) => deal.stage === stage);
      return {
        stage,
        label: stageLabels[stage],
        count: deals.length,
        value: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      };
    });

    return {
      todayFocus,
      openTasks,
      overdueTasks,
      activeProjects,
      activeGoals,
      openDeals,
      overdueInvoices,
      outstandingInvoices,
      upcomingBlocks,
      stageSummary,
      totalPipelineValue: openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      totalOutstandingValue: outstandingInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0),
    };
  }, [snapshot]);

  if (loading) {
    return (
      <div className="page-frame">
        <div className="soft-panel flex min-h-[420px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Loading the command center...
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="page-frame">
        <div className="soft-panel p-8">
          <p className="section-label text-destructive">Dashboard</p>
          <h1 className="mt-4 font-display text-3xl font-semibold">The dashboard could not load.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-frame space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="soft-panel p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="section-label text-primary/80">Minimal Command Center</p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
                See what matters, then move fast.
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                A cleaner operating view for your day, your pipeline, and your money. No clutter,
                just the next things that need attention.
              </p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-secondary/40 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Today
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">{format(new Date(), 'EEEE')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{format(new Date(), 'd MMMM yyyy')}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-border/70 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Focus Queue
              </p>
              <p className="mt-3 text-3xl font-semibold">{dashboardData.todayFocus.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">high-signal items to move now</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Open Tasks
              </p>
              <p className="mt-3 text-3xl font-semibold">{dashboardData.openTasks.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {dashboardData.overdueTasks.length} already overdue
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Pipeline Value
              </p>
              <p className="mt-3 text-3xl font-semibold">
                Rs {formatCurrency(dashboardData.totalPipelineValue)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {dashboardData.openDeals.length} active deals
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Outstanding Cash
              </p>
              <p className="mt-3 text-3xl font-semibold">
                Rs {formatCurrency(dashboardData.totalOutstandingValue)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {dashboardData.overdueInvoices.length} overdue invoices
              </p>
            </div>
          </div>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-primary" />
            <p className="text-sm font-semibold">Quick Access</p>
          </div>
          <div className="mt-5 space-y-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-white px-4 py-4 transition-colors hover:bg-secondary/50"
                >
                  <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight size={16} className="mt-1 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="soft-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
            <div>
              <p className="section-label">Today</p>
              <h2 className="mt-2 text-2xl font-semibold">Next actions</h2>
            </div>
            <Link to="/daily" className="text-sm font-medium text-primary hover:underline">
              Open daily view
            </Link>
          </div>

          <div className="divide-y divide-border/70">
            {dashboardData.todayFocus.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">
                The queue is clear. Protect time for a strategic task or review your goals.
              </p>
            ) : (
              dashboardData.todayFocus.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.record?.priority && (
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getPriorityTone(item.record.priority)}`}
                        >
                          {item.record.priority}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {formatDueLabel(item.due)}
                    </p>
                    <Link to={item.link} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Open
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="soft-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
            <div>
              <p className="section-label">Schedule</p>
              <h2 className="mt-2 text-2xl font-semibold">Today on calendar</h2>
            </div>
            <Link to="/calendar" className="text-sm font-medium text-primary hover:underline">
              Open calendar
            </Link>
          </div>

          <div className="divide-y divide-border/70">
            {dashboardData.upcomingBlocks.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">
                No blocks scheduled yet. Add one protected work block before the day fills up.
              </p>
            ) : (
              dashboardData.upcomingBlocks.map((block) => (
                <div key={block.id} className="flex items-start gap-3 px-6 py-4">
                  <div className="rounded-2xl bg-secondary p-3 text-muted-foreground">
                    <Clock3 size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{block.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {block.start_time} - {block.end_time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr_1fr]">
        <div className="soft-panel p-6">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-primary" />
            <p className="text-sm font-semibold">Goals</p>
          </div>
          <div className="mt-5 space-y-3">
            {dashboardData.activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active goals yet.</p>
            ) : (
              dashboardData.activeGoals.map((goal) => (
                <div key={goal.id} className="rounded-[22px] border border-border/70 bg-white p-4">
                  <p className="text-sm font-semibold">{goal.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {goal.deadline ? `Due ${formatDueLabel(goal.deadline)}` : 'No deadline'}
                  </p>
                </div>
              ))
            )}
          </div>
          <Link to="/goals" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Open goals
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-primary" />
            <p className="text-sm font-semibold">Projects</p>
          </div>
          <div className="mt-5 space-y-3">
            {dashboardData.activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active projects yet.</p>
            ) : (
              dashboardData.activeProjects.map((project) => (
                <div key={project.id} className="rounded-[22px] border border-border/70 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{project.title}</p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getProjectStatusTone(project.status)}`}
                    >
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {project.deadline ? `Due ${formatDueLabel(project.deadline)}` : 'No deadline'}
                  </p>
                </div>
              ))
            )}
          </div>
          <Link
            to="/projects"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Open projects
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-2">
            <CircleDollarSign size={16} className="text-primary" />
            <p className="text-sm font-semibold">Pipeline and cash</p>
          </div>
          <div className="mt-5 space-y-3">
            {dashboardData.stageSummary.map((stage) => (
              <div
                key={stage.stage}
                className="flex items-center justify-between rounded-[22px] border border-border/70 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{stage.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stage.count} deals</p>
                </div>
                <p className="text-sm font-semibold">Rs {formatCurrency(stage.value)}</p>
              </div>
            ))}

            <div className="rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-4">
              <p className="text-sm font-semibold text-rose-700">
                {dashboardData.overdueInvoices.length} overdue invoice
                {dashboardData.overdueInvoices.length === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-sm text-rose-600">
                Clear collection pressure early to protect the week.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-4">
            <Link to="/pipeline" className="text-sm font-medium text-primary hover:underline">
              Open pipeline
            </Link>
            <Link to="/invoices" className="text-sm font-medium text-primary hover:underline">
              Open invoices
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
