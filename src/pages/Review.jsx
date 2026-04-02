import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarCheck2, NotebookPen, Sparkles, Target } from 'lucide-react';
import Journal from '@/pages/Journal';
import WeeklyReview from '@/pages/WeeklyReview';
import { generateWeeklyReview } from '@/lib/localInsights';
import { getWeeklyMetrics, loadLifeOsSnapshot } from '@/lib/workspace';

function PanelTabs({ panel, setPanel }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'daily', label: 'Daily Reflection' },
    { id: 'weekly', label: 'Weekly Review' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setPanel(tab.id)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            panel === tab.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-white text-foreground hover:bg-accent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function Review() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const panel = searchParams.get('panel') || 'overview';

  const setPanel = (nextPanel) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextPanel === 'overview') {
      nextParams.delete('panel');
    } else {
      nextParams.set('panel', nextPanel);
    }
    setSearchParams(nextParams);
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const nextSnapshot = await loadLifeOsSnapshot();
      setSnapshot(nextSnapshot);
      setError(null);
    } catch (loadError) {
      setError(loadError?.message || 'Could not load Review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const weeklyMetrics = useMemo(
    () => (snapshot ? getWeeklyMetrics(snapshot) : null),
    [snapshot]
  );

  const weeklyCoach = useMemo(() => {
    if (!weeklyMetrics) {
      return null;
    }

    return generateWeeklyReview({
      tasks_done: weeklyMetrics.tasksDone,
      tasks_total: weeklyMetrics.tasks.length,
      habit_completion_rate: weeklyMetrics.habitCompletionRate,
      journals_written: weeklyMetrics.journalEntries.length,
      overdue_items: weeklyMetrics.overdueItems,
    });
  }, [weeklyMetrics]);

  const latestPriority = snapshot?.weeklyPriorities?.[0] || null;
  const recentEntries = snapshot?.journalEntries?.slice(0, 3) || [];

  if (loading) {
    return (
      <div className="page-frame">
        <div className="glass-panel flex min-h-[420px] items-center justify-center rounded-[32px]">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Loading the review loop…
          </div>
        </div>
      </div>
    );
  }

  if (error || !snapshot || !weeklyMetrics || !weeklyCoach) {
    return (
      <div className="page-frame">
        <div className="soft-panel p-8">
          <p className="section-label text-destructive">Review</p>
          <h1 className="mt-4 font-display text-3xl font-semibold">The review loop could not load.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-frame space-y-6">
      <section className="soft-panel mesh-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="section-label text-primary/80">Reflection Layer</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              Review the cycle before you start another one.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Daily reflection and weekly review now live together so the system can learn from itself.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              This Week
            </p>
            <p className="mt-2 text-xl font-semibold">
              {weeklyMetrics.tasksDone}/{weeklyMetrics.tasks.length} tasks closed
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {weeklyMetrics.habitCompletionRate}% habit rate
            </p>
          </div>
        </div>

        <div className="mt-6">
          <PanelTabs panel={panel} setPanel={setPanel} />
        </div>
      </section>

      {panel === 'daily' && <Journal />}
      {panel === 'weekly' && <WeeklyReview />}

      {panel === 'overview' && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="soft-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <CalendarCheck2 size={16} />
                <p className="text-sm font-semibold">Tasks</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">{weeklyMetrics.tasksDone}</p>
              <p className="mt-2 text-sm text-muted-foreground">done this week</p>
            </div>
            <div className="soft-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <Target size={16} />
                <p className="text-sm font-semibold">Habits</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">{weeklyMetrics.habitCompletionRate}%</p>
              <p className="mt-2 text-sm text-muted-foreground">weekly completion rate</p>
            </div>
            <div className="soft-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <NotebookPen size={16} />
                <p className="text-sm font-semibold">Journal</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">{weeklyMetrics.journalEntries.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">entries written this week</p>
            </div>
            <div className="soft-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen size={16} />
                <p className="text-sm font-semibold">Overdue</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">{weeklyMetrics.overdueItems}</p>
              <p className="mt-2 text-sm text-muted-foreground">items still dragging behind</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="soft-panel p-6">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles size={16} />
                <p className="text-sm font-semibold">Local Weekly Coach</p>
              </div>
              <div className="mt-5 space-y-5 text-sm leading-6 text-muted-foreground">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">What worked</p>
                  <p className="mt-2">{weeklyCoach.what_worked}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">What to improve</p>
                  <p className="mt-2">{weeklyCoach.what_to_improve}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground">Next week focus</p>
                  <p className="mt-2">{weeklyCoach.next_week_focus}</p>
                </div>
              </div>
              <button type="button" onClick={() => setPanel('weekly')} className="mt-5 text-sm font-semibold text-primary hover:underline">
                Open weekly review
              </button>
            </div>

            <div className="space-y-6">
              <div className="soft-panel p-6">
                <p className="text-sm font-semibold">Latest journal entries</p>
                <div className="mt-4 space-y-3">
                  {recentEntries.length === 0 && (
                    <p className="text-sm text-muted-foreground">No reflection entries yet.</p>
                  )}
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="rounded-[20px] bg-secondary/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {entry.date}
                      </p>
                      <p className="mt-2 text-sm">{entry.what_done}</p>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setPanel('daily')} className="mt-4 text-sm font-semibold text-primary hover:underline">
                  Open daily reflection
                </button>
              </div>

              <div className="soft-panel p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Target size={16} />
                  <p className="text-sm font-semibold">Next Week Intention</p>
                </div>
                {latestPriority ? (
                  <>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{latestPriority.intention}</p>
                    <div className="mt-4 space-y-2">
                      {(latestPriority.priorities || []).map((priority, index) => (
                        <div key={priority || index} className="rounded-[18px] bg-secondary/50 px-4 py-3 text-sm">
                          {priority}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No next-week priorities are saved yet. Use the weekly review panel to define them.
                  </p>
                )}
                <Link to="/review?panel=weekly" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  Edit next week priorities
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
