import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CircleDollarSign,
  Layers3,
  ListTodo,
  Network,
  Target,
} from 'lucide-react';
import Contacts from '@/pages/Contacts';
import Goals from '@/pages/Goals';
import Habits from '@/pages/Habits';
import Invoices from '@/pages/Invoices';
import Pipeline from '@/pages/Pipeline';
import Projects from '@/pages/Projects';
import Reminders from '@/pages/Reminders';
import Tasks from '@/pages/Tasks';
import { buildAreaSummary, formatCurrency, getAreaMeta, loadLifeOsSnapshot } from '@/lib/workspace';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'goals', label: 'Goals' },
  { id: 'projects', label: 'Projects' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'habits', label: 'Habits' },
  { id: 'work', label: 'Work' },
  { id: 'money', label: 'Money' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'learning', label: 'Learning' },
];

function TabBar({ tab, setTab }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setTab(item.id)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            tab === item.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-white text-foreground hover:bg-accent'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default function Systems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentTab = tabs.some((item) => item.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'overview';

  const setTab = (nextTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', nextTab);
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
      setError(loadError?.message || 'Could not load Systems.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const areaSummary = useMemo(
    () => (snapshot ? buildAreaSummary(snapshot) : []),
    [snapshot]
  );

  if (loading) {
    return (
      <div className="page-frame">
        <div className="glass-panel flex min-h-[420px] items-center justify-center rounded-[32px]">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Loading the system map…
          </div>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="page-frame">
        <div className="soft-panel p-8">
          <p className="section-label text-destructive">Systems</p>
          <h1 className="mt-4 font-display text-3xl font-semibold">The systems layer could not load.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const counts = {
    goals: snapshot.goals.length,
    projects: snapshot.projects.length,
    tasks: snapshot.tasks.filter((task) => task.status !== 'done').length,
    habits: snapshot.habits.length,
    work: snapshot.deals.filter((deal) => !['closed', 'lost'].includes(deal.stage)).length,
    money: snapshot.invoices
      .filter((invoice) => ['sent', 'overdue'].includes(invoice.status))
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0),
    relationships: snapshot.contacts.length,
  };

  const learningPlans = snapshot.futurePlans.filter((plan) => plan.area_id === 'learning');
  const learningGoals = snapshot.goals.filter((goal) => goal.area_id === 'learning');
  const learningTasks = snapshot.tasks.filter((task) => task.area_id === 'learning' && task.status !== 'done');
  const relationshipGoals = snapshot.goals.filter((goal) => goal.area_id === 'relationships');
  const relationshipHabits = snapshot.habits.filter((habit) => habit.area_id === 'relationships');

  return (
    <div className="page-frame space-y-6">
      <section className="soft-panel mesh-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="section-label text-primary/80">Infrastructure Layer</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              Keep the engine clean so the day can stay simple.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Systems holds the underlying records and workflows that power Vision, Today, and Review.
              Edit here when the structure itself needs to change.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Current Stack
            </p>
            <p className="mt-2 text-xl font-semibold">{counts.goals} goals / {counts.projects} projects</p>
            <p className="mt-1 text-sm text-muted-foreground">{counts.tasks} open tasks / {counts.habits} habits</p>
          </div>
        </div>

        <div className="mt-6">
          <TabBar tab={currentTab} setTab={setTab} />
        </div>
      </section>

      {currentTab === 'overview' && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="soft-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <Target size={16} />
                <p className="text-sm font-semibold">Goals</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">{counts.goals}</p>
              <button type="button" onClick={() => setTab('goals')} className="mt-3 text-sm font-medium text-primary hover:underline">
                Open
              </button>
            </div>
            <div className="soft-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <Layers3 size={16} />
                <p className="text-sm font-semibold">Projects</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">{counts.projects}</p>
              <button type="button" onClick={() => setTab('projects')} className="mt-3 text-sm font-medium text-primary hover:underline">
                Open
              </button>
            </div>
            <div className="soft-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <ListTodo size={16} />
                <p className="text-sm font-semibold">Tasks</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">{counts.tasks}</p>
              <button type="button" onClick={() => setTab('tasks')} className="mt-3 text-sm font-medium text-primary hover:underline">
                Open
              </button>
            </div>
            <div className="soft-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <CircleDollarSign size={16} />
                <p className="text-sm font-semibold">Money</p>
              </div>
              <p className="mt-4 text-3xl font-semibold">₹{formatCurrency(counts.money)}</p>
              <button type="button" onClick={() => setTab('money')} className="mt-3 text-sm font-medium text-primary hover:underline">
                Open
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {areaSummary.map((area) => (
              <div
                key={area.id}
                className="soft-panel p-5"
                style={{ borderColor: `${area.color}30` }}
              >
                <p className="text-sm font-semibold" style={{ color: area.color }}>
                  {area.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{area.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border/70 px-2.5 py-1">{area.activeGoals} goals</span>
                  <span className="rounded-full border border-border/70 px-2.5 py-1">{area.openTasks} tasks</span>
                  <span className="rounded-full border border-border/70 px-2.5 py-1">{area.activeHabits} habits</span>
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="soft-panel p-6">
              <div className="flex items-center gap-2 text-primary">
                <BriefcaseBusiness size={16} />
                <p className="text-sm font-semibold">Operational pressure</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {counts.work} live deals are still open, and ₹{formatCurrency(counts.money)} is still waiting to be collected.
                Keep these systems clean so Today can stay focused.
              </p>
              <button type="button" onClick={() => setTab('work')} className="mt-4 text-sm font-semibold text-primary hover:underline">
                Open work systems
              </button>
            </div>

            <div className="soft-panel p-6">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen size={16} />
                <p className="text-sm font-semibold">Learning system</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {learningPlans.length} learning plans and {learningTasks.length} open learning tasks are currently in the system.
                Use Vision when you need to create or redesign the longer roadmap.
              </p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setTab('learning')} className="text-sm font-semibold text-primary hover:underline">
                  Open learning
                </button>
                <Link to="/vision?panel=planner" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Open planner
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {currentTab === 'goals' && <Goals />}
      {currentTab === 'projects' && <Projects />}
      {currentTab === 'tasks' && <Tasks />}
      {currentTab === 'habits' && <Habits />}

      {currentTab === 'work' && (
        <div className="space-y-6">
          <Pipeline />
          <Reminders />
        </div>
      )}

      {currentTab === 'money' && <Invoices />}

      {currentTab === 'relationships' && (
        <div className="space-y-6">
          <section className="soft-panel p-6">
            <div className="flex items-center gap-2">
              <Network size={16} className="text-primary" />
              <p className="text-sm font-semibold">Relationship layer</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This panel currently combines the contact system with any relationship-focused goals or habits already mapped into the workspace.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/70 px-2.5 py-1">
                {snapshot.contacts.length} contacts
              </span>
              <span className="rounded-full border border-border/70 px-2.5 py-1">
                {relationshipGoals.length} relationship goals
              </span>
              <span className="rounded-full border border-border/70 px-2.5 py-1">
                {relationshipHabits.length} relationship habits
              </span>
            </div>
          </section>
          <Contacts />
        </div>
      )}

      {currentTab === 'learning' && (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="soft-panel overflow-hidden">
            <div className="border-b border-border/70 px-6 py-5">
              <p className="section-label">Learning Plans</p>
              <h2 className="mt-2 text-2xl font-semibold">Roadmaps already in the system</h2>
            </div>

            <div className="divide-y divide-border/70">
              {learningPlans.length === 0 && (
                <p className="px-6 py-8 text-sm text-muted-foreground">
                  No learning-specific future plans exist yet. Use Vision to create one.
                </p>
              )}
              {learningPlans.map((plan) => {
                const area = getAreaMeta(plan.area_id);

                return (
                  <div key={plan.id} className="px-6 py-5">
                    <p className="text-sm font-semibold">{plan.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span
                        className="rounded-full px-2.5 py-1 font-semibold"
                        style={{ color: area.color, backgroundColor: `${area.color}12` }}
                      >
                        {area.label}
                      </span>
                      <span className="rounded-full border border-border/70 px-2.5 py-1 text-muted-foreground">
                        {plan.horizon}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="soft-panel p-6">
              <p className="text-sm font-semibold">Current learning workload</p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>{learningGoals.length} learning goals are active.</p>
                <p>{learningTasks.length} open tasks are tagged to the learning pillar.</p>
                <p>{snapshot.habits.filter((habit) => habit.area_id === 'learning').length} habits currently reinforce skill growth.</p>
              </div>
            </div>

            <div className="soft-panel p-6">
              <p className="text-sm font-semibold">Need a new roadmap?</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Use the embedded planner in Vision to turn a new skill ambition into a structured path with projects, tasks, and habits.
              </p>
              <Link to="/vision?panel=planner" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Open planner
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
