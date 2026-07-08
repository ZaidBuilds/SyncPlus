import { useState } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { callAiProvider } from '@/lib/aiProvider';
import AiProviderConfig from '@/components/ai-planner/AiProviderConfig';
import GoalInput from '@/components/ai-planner/GoalInput';
import PlanOutput from '@/components/ai-planner/PlanOutput';

export default function AiPlanner() {
  const [step, setStep] = useState('idle'); // 'idle' | 'analyzing' | 'planning' | 'result'
  const [goalText, setGoalText] = useState('');
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const loading = step !== 'idle';

  const handleGenerate = async ({ goal, provider, apiKey, model }) => {
    const cleanGoal = String(goal || '').trim();
    if (!cleanGoal) return;

    setError('');
    setGoalText(cleanGoal);
    setPlan(null);

    setStep('analyzing');
    try {
      // Small staged UX: even if the call is fast, the UI feels deliberate.
      await new Promise((r) => setTimeout(r, 250));
      setStep('planning');

      const nextPlan = await callAiProvider({ goal: cleanGoal, provider, apiKey, model });
      setPlan(nextPlan);
      setStep('result');
    } catch (e) {
      setError(e?.message || 'AI generation failed. Check provider settings and try again.');
      setStep('idle');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 font-sans">
      {/* Apple-style Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border/50">
          <Sparkles size={12} className="text-primary" /> Vantage Intelligence System
        </div>
        <h1 className="text-5xl font-black tracking-tighter">AI Strategist</h1>
        <p className="text-muted-foreground text-sm font-medium max-w-lg mx-auto">
          Scale your vision from high-ground perspective to ground-level execution in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">
            AI Brain Settings
          </h3>
          <AiProviderConfig />

          {error && (
            <div className="vantage-card border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-sm font-semibold text-red-500">AI Error</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="vantage-card !p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <GoalInput onGenerate={handleGenerate} loading={loading} />
          </div>

          <AnimatePresence mode="wait">
            {(step === 'analyzing' || step === 'planning') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center space-y-4"
              >
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {step === 'analyzing' ? 'Analyzing objective and mapping constraints...' : 'Architecting project hierarchy and tasks...'}
                </p>
              </motion.div>
            )}

            {step === 'result' && plan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-primary/90">
                    Plan Generated
                  </p>
                </div>

                <PlanOutput plan={plan} goalText={goalText} areaId="learning" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}