import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Check } from 'lucide-react';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🟢',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '🔵',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'groq',
    name: 'Groq (Open Source / Free)',
    icon: '🟠',
    models: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
  },
];

export default function AiProviderConfig() {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState(() => localStorage.getItem('ai_provider') || 'openai');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('ai_model') || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const provider = PROVIDERS.find(p => p.id === providerId);

  useEffect(() => {
    const defaultModel = PROVIDERS.find(p => p.id === providerId)?.models[0] || '';
    const stored = localStorage.getItem('ai_model');
    setModel(stored && provider?.models.includes(stored) ? stored : defaultModel);
  }, [providerId]);

  const save = () => {
    localStorage.setItem('ai_provider', providerId);
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_model', model);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  };

  const isConfigured = !!localStorage.getItem('ai_api_key');

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium">AI Provider Settings</span>
          {isConfigured && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <Check size={10} /> Configured
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-border p-5 space-y-4">
          {/* Provider selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Provider</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProviderId(p.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    providerId === p.id
                      ? 'border-primary bg-accent text-primary'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="text-xs">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Model</label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              {provider?.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">API Key</label>
              <a href={provider?.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                Get free key →
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background pr-10"
                placeholder={provider?.keyPlaceholder}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button
                onClick={() => setShowKey(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stored locally in your browser. Never sent to our servers.</p>
          </div>

          <button
            onClick={save}
            className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
              saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}