import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Flame,
  LayoutList,
  NotebookPen,
  Target,
} from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import QuickNote from '@/components/dashboard/QuickNote';
import { dataClient } from '@/lib/dataClient';
import {
  buildAreaSummary,
  buildTodayFocusItems,
  formatCurrency,
  getAreaMeta,
  getTodayJournalEntry,
  loadLifeOsSnapshot,
} from '@/lib/workspace';

function formatDueValue(value) {
  if (!value) {
    return 'No due time';
  }

  const date = parseISO(value);
  if (value.length > 10) {
    return format(date, 'd MMM · h:mm a');
  }

  return format(date, 'd MMM');
}

function FocusIcon({ kind }) {
  const iconMap = {
    task: Target,
    reminder: BellRing,
    invoice: CircleDollarSign,
    deal: BriefcaseBusiness,
    habit: Flame,
  };
  const Icon = iconMap[kind] || LayoutList;
  return <Icon size={16} />;
}

export default function Today() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const nextSnapshot = await loadLifeOsSnapshot();
      setSnapshot(nextSnapshot);
      setError(null);
    } catch (loadError) {
      setError(loadError?.message || 'Could not load Today.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const areaSummary = useMemo(
    () => (snapshot ? buildAreaSummary(snapshot) : []),
    [snapshot]
  );
  const focusItems = useMemo(
    () => (snapshot ? buildTodayFocusItems(snapshot) : []),
    [snapshot]
  );
  const journalEntry = useMemo(
    () => (snapshot ? getTodayJournalEntry(snapshot) : null),
    [snapshot]
  );

  const todayBlocks = useMemo(
    () =>
      snapshot
        ? snapshot.calendarBlocks
            .filter((block) => block.date === todayKey)
            .sort((left, right) => left.start_time.localeCompare(right.start_time))
        : [],
    [snapshot, todayKey]
  );

  const overview = useMemo(() => {
    if (!snapshot) {
      return {
        openInvoicesTotal: 0,
        overdueReminders: 0,
        openDeals: 0,
      };
    }

    return {
      openInvoicesTotal: snapshot.invoices
        .filter((invoice) => ['sent', 'overdue'].includes(invoice.status))
        .reduce((sum, invoice) => sum + (invoice.total || 0), 0),
      overdueReminders: snapshot.reminders.filter(
        (reminder) =>
          !reminder.is_done &&
          reminder.due_date &&
          parseISO(reminder.due_date) < startOfDay(new Date())
      ).length,
      openDeals: snapshot.deals.filter((deal) => !['closed', 'lost'].includes(deal.stage)).length,
    };
  }, [snapshot]);

  const topMoves = focusItems.slice(0, 3);

  const toggleTask = async (task) => {
    await dataClient.entities.Task.update(task.id, { status: 'done' });
    await refresh();
  };

  const toggleReminder = async (reminder) => {
    await dataClient.entities.Reminder.update(reminder.id, { is_done: true });
    await refresh();
  };

  const toggleHabit = async (habit) => {
    const existing = snapshot.habitLogs.find(
      (log) => log.habit_id === habit.id && log.date === todayKey
    );

    if (existing) {
      await dataClient.entities.HabitLog.update(existing.id, { completed: !existing.completed });
    } else {
      await dataClient.entities.HabitLog.create({
        habit_id: habit.id,
        date: todayKey,
        completed: true,
      });
    }

    await refresh();
  };

  const completeItem = async (item) => {
    if (item.kind === 'task') {
      await toggleTask(item.record);
      return;
    }

    if (item.kind === 'reminder') {
      await toggleReminder(item.record);
      return;
    }

    if (item.kind === 'habit') {
      await toggleHabit(item.record);
    }
  };

  if (loading) {
    return (
      <div className="p-5 max-w-5xl mx-auto space-y-5">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-border rounded-xl flex min-h-[420px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Loading today’s operating surface…
          </div>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="p-5 max-w-5xl mx-auto space-y-5">
        <div className="bg-white border border-border rounded-xl p-8">
          <p className="section-label text-destructive">Today</p>
          <h1 className="mt-4 font-display text-3xl font-semibold">The daily system could not load.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="bg-white border border-border rounded-xl p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="section-label text-primary/80">Live OS</p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
                Run the day before urgency steals the shape of it.
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {snapshot.onboarding.vision_statement}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/85 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Today
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">{format(new Date(), 'EEEE')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{format(new Date(), 'd MMMM yyyy')}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Queue
              </p>
              <p className="mt-3 text-3xl font-semibold">{focusItems.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">actions waiting to move</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Follow-Ups
              </p>
              <p className="mt-3 text-3xl font-semibold">{overview.overdueReminders}</p>
              <p className="mt-2 text-sm text-muted-foreground">already overdue in the system</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Money Pressure
              </p>
              <p className="mt-3 text-3xl font-semibold">₹{formatCurrency(overview.openInvoicesTotal)}</p>
              <p className="mt-2 text-sm text-muted-foreground">{overview.openDeals} active deals still open</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {topMoves.map((item) => {
              const area = getAreaMeta(item.area_id);

              return (
                <div
                  key={item.id}
                  className="rounded-[24px] border bg-white/85 p-5 shadow-sm"
                  style={{ borderColor: `${area.color}40` }}
                >
                  <div className="flex items-center gap-2" style={{ color: area.color }}>
                    <FocusIcon kind={item.kind} />
                    <p className="text-sm font-semibold">{area.label}</p>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.subtitle}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {formatDueValue(item.due)}
                    </p>
                    {['task', 'habit', 'reminder'].includes(item.kind) ? (
                      <button
                        type="button"
                        onClick={() => completeItem(item)}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <CheckCircle2 size={12} />
                        Done
                      </button>
                    ) : (
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Open
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Pillars</p>
                <h2 className="mt-2 text-xl font-semibold">What needs your energy today</h2>
              </div>
              <Link to="/goals" className="text-sm font-medium text-primary hover:underline">
                Open Goals
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {areaSummary.map((area) => (
                <div
                  key={area.id}
                  className="rounded-[22px] border bg-white/75 p-4"
                  style={{ borderColor: `${area.color}35` }}
                >
                  <p className="text-sm font-semibold" style={{ color: area.color }}>
                    {area.label}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border px-2.5 py-1">
                      {area.activeGoals} goals
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1">
                      {area.openTasks} open tasks
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1">
                      {area.activeHabits} habits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <div className="flex items-center gap-2">
              <NotebookPen size={16} className="text-primary" />
              <p className="text-sm font-semibold">Reflection status</p>
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {journalEntry ? 'Your daily reflection is already open.' : 'Close the loop before the day ends.'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {journalEntry
                ? 'You already have a journal entry for today. Use Review to tighten what worked and what needs adjustment.'
                : 'Write the day down while it is still honest. Reflection is part of the operating system, not an afterthought.'}
            </p>
            <Link
              to="/weekly-review"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Open Review
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
            <div>
              <p className="section-label">Unified Queue</p>
              <h2 className="mt-2 text-2xl font-semibold">Everything pulling on today</h2>
            </div>
            <Link to="/tasks" className="text-sm font-medium text-primary hover:underline">
              Open Tasks
            </Link>
          </div>
          <div className="divide-y divide-border">
            {focusItems.length === 0 && (
              <p className="px-6 py-8 text-sm text-muted-foreground">
                The queue is clear. Protect time for deep work or open Vision and raise the next meaningful target.
              </p>
            )}
            {focusItems.map((item) => {
              const area = getAreaMeta(item.area_id);
              const actionable = ['task', 'habit', 'reminder'].includes(item.kind);

              return (
                <div key={item.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: area.color }}
                  >
                    <FocusIcon kind={item.kind} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {area.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {formatDueValue(item.due)}
                    </p>
                    {actionable ? (
                      <button
                        type="button"
                        onClick={() => completeItem(item)}
                        className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
                      >
                        Mark done
                      </button>
                    ) : (
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Open
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <p className="section-label">Schedule</p>
                <h2 className="mt-2 text-2xl font-semibold">Time blocks</h2>
              </div>
              <Link to="/calendar" className="text-sm font-medium text-primary hover:underline">
                Open Calendar
              </Link>
            </div>
            <div className="divide-y divide-border">
              {todayBlocks.length === 0 && (
                <p className="px-6 py-8 text-sm text-muted-foreground">
                  No blocks are scheduled yet. Put one protected block on the calendar before adding more tasks.
                </p>
              )}
              {todayBlocks.map((block) => {
                const area = getAreaMeta(block.area_id);
                return (
                  <div key={block.id} className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} style={{ color: area.color }} />
                      <p className="text-sm font-semibold">
                        {block.start_time} - {block.end_time}
                      </p>
                    </div>
                    <p className="mt-2 text-sm">{block.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {area.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <QuickNote deals={snapshot.deals} contacts={snapshot.contacts} />
        </div>
      </section>
    </div>
  );
}
