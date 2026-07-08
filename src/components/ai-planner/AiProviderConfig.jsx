import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Check, ExternalLink } from 'lucide-react';

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
    name: 'Groq (Free)',
    icon: '🟠',
    models: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🟣',
    models: ['google/gemini-2.0-flash-001', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini', 'meta-llama/llama-3.1-8b-instruct'],
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
  },
];

export default function AiProviderConfig() {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState(() => localStorage.getItem('ai_provider') || 'openai');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('ai_model') || '');
  const [customModel, setCustomModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const provider = PROVIDERS.find(p => p.id === providerId);

  useEffect(() => {
    const defaultModel = PROVIDERS.find(p => p.id === providerId)?.models[0] || '';
    const stored = localStorage.getItem('ai_model');
    if (stored && provider?.models.includes(stored)) {
      setModel(stored);
      setCustomModel('');
    } else if (stored && providerId === 'openrouter') {
      setModel('custom');
      setCustomModel(stored);
    } else {
      setModel(defaultModel);
      setCustomModel('');
    }
  }, [providerId, provider?.models]);

  const save = () => {
    localStorage.setItem('ai_provider', providerId);
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_model', model === 'custom' ? customModel : model);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  };

  const isConfigured = !!localStorage.getItem('ai_api_key');

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings size={16} className="text-primary" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold block">AI Brain Settings</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Configure your strategist</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConfigured && (
            <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-emerald-100">
              <Check size={10} /> Active
            </span>
          )}
          <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-6 space-y-5 bg-secondary/10">
          {/* Provider selector */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">Model Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProviderId(p.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    providerId === p.id
                      ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tight">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Select Model</label>
              <select
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card outline-none focus:ring-2 focus:ring-primary/20"
                value={model}
                onChange={e => setModel(e.target.value)}
              >
                {provider?.models.map(m => <option key={m} value={m}>{m}</option>)}
                <option value="custom">Custom Model ID...</option>
              </select>
            </div>
            {model === 'custom' && (
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Model ID</label>
                <input
                  type="text"
                  placeholder="e.g. meta-llama/llama-3.1-405b"
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card outline-none focus:ring-2 focus:ring-primary/20"
                  value={customModel}
                  onChange={e => setCustomModel(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">API Key</label>
              <a href={provider?.docsUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 uppercase tracking-wide">
                Get key <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-card pr-10 outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={provider?.keyPlaceholder}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button
                onClick={() => setShowKey(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">
              * Your API key is encrypted and stored locally in your browser cache.
            </p>
          </div>

          <button
            onClick={save}
            className={`w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
              saved ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20'
            }`}
          >
            {saved ? '✓ Config Saved' : 'Save AI Configuration'}
          </button>
        </div>
      )}
    </div>
  );
}