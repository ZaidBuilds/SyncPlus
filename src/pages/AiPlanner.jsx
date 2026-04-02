import { useState } from 'react';
import AiProviderConfig from '@/components/ai-planner/AiProviderConfig';
import GoalInput from '@/components/ai-planner/GoalInput';
import PlanOutput from '@/components/ai-planner/PlanOutput';
import { callAiProvider } from '@/lib/aiProvider';

export default function AiPlanner() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goalText, setGoalText] = useState('');

  const handleGenerate = async ({ goal, provider, apiKey, model }) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setGoalText(goal);
    try {
      const result = await callAiProvider({ goal, provider, apiKey, model });
      setPlan(result);
    } catch (e) {
      setError(e.message || 'Something went wrong. Check your API key and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">🤖</span> AI Goal Planner
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enter a goal → AI breaks it into a learning path, projects & tasks → Execute to save them into your app.
        </p>
      </div>

      <AiProviderConfig />

      <GoalInput onGenerate={handleGenerate} loading={loading} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="bg-card border border-border rounded-xl px-5 py-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">AI is breaking down your goal...</p>
        </div>
      )}

      {plan && <PlanOutput plan={plan} goalText={goalText} />}
    </div>
  );
}