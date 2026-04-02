import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import AiProviderConfig from '@/components/ai-planner/AiProviderConfig';
import GoalInput from '@/components/ai-planner/GoalInput';
import PlanOutput from '@/components/ai-planner/PlanOutput';
import Goals from '@/pages/Goals';
import { dataClient } from '@/lib/dataClient';
import { callAiProvider } from '@/lib/aiProvider';
import { buildAreaSummary, getAreaMeta, loadLifeOsSnapshot } from '@/lib/workspace';

function FuturePlanModal({ plan, areas, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
    plan || {
      title: '',
      description: '',
      horizon: '90 days',
      status: 'active',
      area_id: areas[0]?.id || 'self',
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{plan ? 'Edit future plan' : 'New future plan'}</h2>
          {plan && (
            <button
              type="button"
              onClick={() => onDelete(plan.id)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
            >
              <Trash2 size={12} />
              Delete
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="What are you building toward?"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={4}
            placeholder="Describe the direction clearly enough that future work can be judged against it."
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.area_id}
              onChange={(event) => setForm((current) => ({ ...current, area_id: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label}
                </option>
              ))}
            </select>
            <input
              value={form.horizon}
              onChange={(event) => setForm((current) => ({ ...current, horizon: event.target.value }))}
              placeholder="90 days / 12 months / 3 years"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelTabs({ panel, setPanel }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'goals', label: 'Goals' },
    { id: 'planner', label: 'Planner' },
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

export default function Vision() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState(null);
  const [goalText, setGoalText] = useState('');
  const [plannerAreaId, setPlannerAreaId] = useState('learning');
  const [editingPlan, setEditingPlan] = useState(null);

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
      setPlannerAreaId((current) =>
        nextSnapshot.enabledAreaIds.includes(current)
          ? current
          : nextSnapshot.onboarding.first_focus || nextSnapshot.enabledAreaIds[0] || 'learning'
      );
      setError(null);
    } catch (loadError) {
      setError(loadError?.message || 'Could not load Vision.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleGenerate = async ({ goal, provider, apiKey, model }) => {
    setPlannerLoading(true);
    setPlannerError(null);
    setPlan(null);
    setGoalText(goal);

    try {
      const result = await callAiProvider({ goal, provider, apiKey, model });
      setPlan(result);
    } catch (generationError) {
      setPlannerError(generationError.message || 'The planner could not generate a roadmap.');
    } finally {
      setPlannerLoading(false);
    }
  };

  const areaSummary = useMemo(
    () => (snapshot ? buildAreaSummary(snapshot) : []),
    [snapshot]
  );

  const activeGoalsByArea = useMemo(() => {
    if (!snapshot) {
      return {};
    }

    return snapshot.goals
      .filter((goal) => goal.status === 'active')
      .reduce((accumulator, goal) => {
        const key = goal.area_id || 'self';
        if (!accumulator[key]) {
          accumulator[key] = [];
        }
        accumulator[key].push(goal);
        return accumulator;
      }, {});
  }, [snapshot]);

  const saveFuturePlan = async (form) => {
    if (form.id) {
      await dataClient.entities.FuturePlan.update(form.id, form);
    } else {
      await dataClient.entities.FuturePlan.create(form);
    }

    setEditingPlan(null);
    await refresh();
  };

  const deleteFuturePlan = async (planId) => {
    await dataClient.entities.FuturePlan.delete(planId);
    setEditingPlan(null);
    await refresh();
  };

  if (loading) {
    return (
      <div className="page-frame">
        <div className="glass-panel flex min-h-[420px] items-center justify-center rounded-[32px]">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Mapping your direction layer…
          </div>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="page-frame">
        <div className="soft-panel p-8">
          <p className="section-label text-destructive">Vision</p>
          <h1 className="mt-4 font-display text-3xl font-semibold">The direction layer could not load.</h1>
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
            <p className="section-label text-primary/80">Direction Layer</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
              Build the future clearly enough that today can align with it.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {snapshot.onboarding.vision_statement}
            </p>
          </div>

          <div className="rounded-[26px] border border-white/70 bg-white/85 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              First Focus
            </p>
            <p className="mt-2 text-xl font-semibold">
              {getAreaMeta(snapshot.onboarding.first_focus).label}
            </p>
            <Link to="/welcome" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Reopen setup
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {snapshot.enabledAreas.map((area) => (
            <span
              key={area.id}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: `${area.color}40`, color: area.color, backgroundColor: `${area.color}12` }}
            >
              {area.label}
            </span>
          ))}
        </div>

        <div className="mt-6">
          <PanelTabs panel={panel} setPanel={setPanel} />
        </div>
      </section>

      {panel === 'goals' && <Goals />}

      {panel === 'planner' && (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="soft-panel p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <p className="text-sm font-semibold">Embedded Planner</p>
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Turn an ambition into projects, tasks, and habits.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The planner now belongs inside Vision so long-range direction and execution design live in
              the same place.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {snapshot.enabledAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setPlannerAreaId(area.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    plannerAreaId === area.id
                      ? 'text-white'
                      : 'bg-white text-foreground hover:bg-accent'
                  }`}
                  style={
                    plannerAreaId === area.id
                      ? { backgroundColor: area.color, borderColor: area.color }
                      : { borderColor: `${area.color}35` }
                  }
                >
                  {area.label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-5">
              <AiProviderConfig />
              <GoalInput onGenerate={handleGenerate} loading={plannerLoading} />
            </div>
          </div>

          <div className="space-y-5">
            {plannerError && (
              <div className="rounded-[24px] border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
                {plannerError}
              </div>
            )}

            {plannerLoading && (
              <div className="soft-panel flex min-h-[220px] items-center justify-center p-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  Building the roadmap…
                </div>
              </div>
            )}

            {plan && (
              <PlanOutput
                plan={plan}
                goalText={goalText}
                areaId={plannerAreaId}
                onSaved={refresh}
              />
            )}

            {!plannerLoading && !plan && (
              <div className="soft-panel p-6">
                <p className="text-sm font-semibold">Start with one sharp outcome.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pick the pillar first, then write the goal clearly enough that the planner can turn it
                  into an execution path worth following.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {panel === 'overview' && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {areaSummary.map((area) => (
              <div
                key={area.id}
                className="soft-panel p-5"
                style={{ borderColor: `${area.color}30` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: area.color }}>
                      {area.label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{area.blurb}</p>
                  </div>
                  <Compass size={18} style={{ color: area.color }} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[18px] bg-secondary/60 p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Goals</p>
                    <p className="mt-2 text-xl font-semibold">{area.activeGoals}</p>
                  </div>
                  <div className="rounded-[18px] bg-secondary/60 p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Future</p>
                    <p className="mt-2 text-xl font-semibold">{area.futurePlans}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="soft-panel overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-6 py-5">
                <div>
                  <p className="section-label">Future Plans</p>
                  <h2 className="mt-2 text-2xl font-semibold">Longer horizons worth protecting</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPlan({})}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus size={14} />
                  New plan
                </button>
              </div>

              <div className="divide-y divide-border/70">
                {snapshot.futurePlans.length === 0 && (
                  <p className="px-6 py-8 text-sm text-muted-foreground">
                    Add a future plan so the system remembers what the next few months or years are supposed to build toward.
                  </p>
                )}
                {snapshot.futurePlans.map((futurePlan) => {
                  const area = getAreaMeta(futurePlan.area_id);

                  return (
                    <div key={futurePlan.id} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{futurePlan.title}</p>
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                              style={{ color: area.color, backgroundColor: `${area.color}12` }}
                            >
                              {area.label}
                            </span>
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {futurePlan.horizon}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {futurePlan.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingPlan(futurePlan)}
                          className="rounded-full border border-border bg-white p-2 text-muted-foreground hover:bg-accent"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="soft-panel overflow-hidden">
              <div className="border-b border-border/70 px-6 py-5">
                <p className="section-label">Active Outcomes</p>
                <h2 className="mt-2 text-2xl font-semibold">What the current quarter is trying to move</h2>
              </div>

              <div className="divide-y divide-border/70">
                {snapshot.enabledAreas.map((area) => {
                  const goals = activeGoalsByArea[area.id] || [];

                  return (
                    <div key={area.id} className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Target size={15} style={{ color: area.color }} />
                        <p className="text-sm font-semibold" style={{ color: area.color }}>
                          {area.label}
                        </p>
                      </div>

                      {goals.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No active goals here yet. If this pillar matters now, define one concrete outcome.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {goals.map((goal) => (
                            <div key={goal.id} className="rounded-[20px] bg-secondary/45 p-4">
                              <p className="text-sm font-semibold">{goal.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {goal.target_value && (
                                  <span className="rounded-full border border-border/70 px-2.5 py-1">
                                    {goal.target_value}
                                  </span>
                                )}
                                {goal.deadline && (
                                  <span className="rounded-full border border-border/70 px-2.5 py-1">
                                    Due {goal.deadline}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border/70 px-6 py-4">
                <Link to="/vision?panel=goals" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  Manage goals in detail
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {editingPlan !== null && (
        <FuturePlanModal
          plan={editingPlan?.id ? editingPlan : null}
          areas={snapshot.enabledAreas}
          onClose={() => setEditingPlan(null)}
          onSave={saveFuturePlan}
          onDelete={deleteFuturePlan}
        />
      )}
    </div>
  );
}
