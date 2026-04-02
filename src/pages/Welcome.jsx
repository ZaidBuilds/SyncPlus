import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getOnboardingState, getWorkspaceAreas, saveWorkspaceSetup } from '@/lib/workspace';
import { DEFAULT_WORKSPACE_AREAS, getAreaMeta } from '@/lib/workspaceSchema';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [visionStatement, setVisionStatement] = useState('');
  const [enabledPillars, setEnabledPillars] = useState(DEFAULT_WORKSPACE_AREAS.map((area) => area.id));
  const [landingPreference, setLandingPreference] = useState('/today');
  const [firstFocus, setFirstFocus] = useState('self');
  const [workEnabled, setWorkEnabled] = useState(true);
  const [areas, setAreas] = useState(DEFAULT_WORKSPACE_AREAS);

  useEffect(() => {
    let active = true;

    async function loadSetup() {
      const [storedAreas, onboarding] = await Promise.all([
        getWorkspaceAreas(),
        getOnboardingState(),
      ]);

      if (!active) {
        return;
      }

      setAreas(storedAreas);
      setEnabledPillars(onboarding.enabled_pillars);
      setLandingPreference(onboarding.landing_preference || '/today');
      setFirstFocus(onboarding.first_focus || 'self');
      setVisionStatement(onboarding.vision_statement || '');
      setWorkEnabled(onboarding.work_enabled ?? true);
      setFullName(
        user?.full_name && user.full_name !== 'Workspace Admin'
          ? user.full_name
          : ''
      );
      setLoading(false);
    }

    loadSetup();

    return () => {
      active = false;
    };
  }, [user]);

  const focusOptions = useMemo(
    () => areas.filter((area) => enabledPillars.includes(area.id)),
    [areas, enabledPillars]
  );

  const togglePillar = (areaId) => {
    setEnabledPillars((current) => {
      if (current.includes(areaId)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((pillar) => pillar !== areaId);
      }

      return [...current, areaId];
    });
  };

  const handleSubmit = async () => {
    setSaving(true);

    await saveWorkspaceSetup({
      enabled_pillars: enabledPillars,
      landing_preference: landingPreference,
      first_focus: enabledPillars.includes(firstFocus) ? firstFocus : enabledPillars[0],
      work_enabled: workEnabled,
      vision_statement: visionStatement.trim() || 'Build a calmer, stronger operating rhythm for life and work.',
      completed_at: new Date().toISOString(),
    });

    if (fullName.trim()) {
      setUser({
        ...user,
        full_name: fullName.trim(),
      });
    }

    setSaving(false);
    navigate(landingPreference || '/today', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel w-full max-w-sm rounded-3xl p-8 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Setting up your Life OS…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6">
      <div className="page-frame max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="soft-panel mesh-card p-8 md:p-10">
            <p className="section-label text-primary/80">SyncPlus</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground">
              Rebuild the system around the life you actually want to run.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              This setup turns SyncPlus into a live operating system for growth, execution, money,
              work, and review. Keep it lean. Only switch on the pillars you want to feel every day.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {areas.map((area) => {
                const meta = getAreaMeta(area.id);
                const enabled = enabledPillars.includes(area.id);

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => togglePillar(area.id)}
                    className={`rounded-[24px] border p-5 text-left transition-all ${
                      enabled
                        ? 'border-transparent bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.28)]'
                        : 'border-border/80 bg-white/50 hover:border-primary/30'
                    }`}
                    style={enabled ? { boxShadow: `0 20px 50px -30px ${meta.color}55` } : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: meta.color }}>
                          {meta.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{meta.blurb}</p>
                      </div>
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: enabled ? meta.color : '#cbd5e1' }}
                      >
                        <CheckCircle2 size={16} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-[28px] border border-white/70 bg-white/70 p-5">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles size={16} />
                <p className="text-sm font-semibold">What changes after setup</p>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <p>Vision becomes the place for long-range direction and future plans.</p>
                <p>Today becomes one queue for tasks, habits, money pressure, and follow-ups.</p>
                <p>Systems and Review hold the structure without forcing you through clutter.</p>
              </div>
            </div>
          </section>

          <section className="soft-panel p-8 md:p-10">
            <p className="section-label">Workspace Setup</p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Your Name
                </label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="What should the workspace call you?"
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Core Intent
                </label>
                <textarea
                  value={visionStatement}
                  onChange={(event) => setVisionStatement(event.target.value)}
                  rows={4}
                  placeholder="Example: Build a focused life with stronger health, sharper work, and calmer money."
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Start On
                  </label>
                  <div className="mt-2 flex gap-2">
                    {[
                      { value: '/today', label: 'Today' },
                      { value: '/vision', label: 'Vision' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLandingPreference(option.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          landingPreference === option.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-white text-foreground hover:bg-accent'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    First Focus
                  </label>
                  <select
                    value={firstFocus}
                    onChange={(event) => setFirstFocus(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    {focusOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-[24px] border border-border bg-secondary/40 p-4">
                <input
                  type="checkbox"
                  checked={workEnabled}
                  onChange={(event) => setWorkEnabled(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  <span className="block text-sm font-semibold">Include work and client operations</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    Keep pipeline, invoices, reminders, and delivery systems inside the same Life OS.
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? 'Building your workspace…' : 'Enter SyncPlus'}
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
