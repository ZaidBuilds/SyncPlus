import { useState } from 'react';
import { Sparkles } from 'lucide-react';

const EXAMPLES = [
  'Become an AI/ML Engineer',
  'Launch a SaaS product',
  'Learn full-stack web development',
  'Get fit and run a marathon',
];

export default function GoalInput({ onGenerate, loading }) {
  const [goal, setGoal] = useState('');

  const handleSubmit = () => {
    if (!goal.trim()) return;
    const provider = localStorage.getItem('ai_provider') || 'openai';
    const apiKey = localStorage.getItem('ai_api_key') || '';
    const model = localStorage.getItem('ai_model') || '';
    if (!apiKey) {
      alert('Please configure your AI provider and API key first (click "AI Provider Settings" above).');
      return;
    }
    onGenerate({ goal: goal.trim(), provider, apiKey, model });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
        🎯 What&apos;s your goal?
      </label>
      <textarea
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background resize-none placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        rows={3}
        placeholder="e.g. I want to become an AI Engineer and land a job at a top tech company..."
        value={goal}
        onChange={e => setGoal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleSubmit()}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Try:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => setGoal(ex)}
            className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:bg-accent transition-all"
          >
            {ex}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || !goal.trim()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        <Sparkles size={14} />
        {loading ? 'Generating...' : 'Generate My Roadmap with AI'}
      </button>
    </div>
  );
}
