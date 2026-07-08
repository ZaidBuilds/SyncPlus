import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { 
  Search, Plus, LayoutDashboard, CheckCircle2, Calendar, Target, DollarSign, 
  BookOpen, BarChart3, Settings2, BriefcaseBusiness, ListTodo, FolderOpen, 
  Flame, ArrowRight, Clock, Zap, Bell, Receipt, FileText
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, shortcut: 'D' },
  { label: 'Today', path: '/daily', icon: CheckCircle2, shortcut: '' },
  { label: 'Habits', path: '/habits', icon: Flame, shortcut: 'H' },
  { label: 'Tasks', path: '/tasks', icon: ListTodo, shortcut: 'T' },
  { label: 'Calendar', path: '/calendar', icon: Calendar, shortcut: 'C' },
  { label: 'Projects', path: '/projects', icon: FolderOpen, shortcut: 'P' },
  { label: 'Goals', path: '/goals', icon: Target, shortcut: 'G' },
  { label: 'Journal', path: '/journal', icon: BookOpen, shortcut: '' },
  { label: 'Pipeline', path: '/pipeline', icon: BriefcaseBusiness, shortcut: '' },
  { label: 'Invoices', path: '/invoices', icon: DollarSign, shortcut: '' },
  { label: 'Expenses', path: '/expenses', icon: Receipt, shortcut: '' },
  { label: 'Reminders', path: '/reminders', icon: Bell, shortcut: '' },
  { label: 'Weekly Review', path: '/weekly-review', icon: BarChart3, shortcut: '' },
  { label: 'Tax Center', path: '/tax', icon: FileText, shortcut: '' },
  { label: 'Settings', path: '/settings', icon: Settings2, shortcut: '' },
];

const QUICK_ACTIONS = [
  { label: 'New Task', path: '/tasks', icon: Plus, description: 'Create a new task' },
  { label: 'New Habit', path: '/habits', icon: Plus, description: 'Add a daily habit' },
  { label: 'New Project', path: '/projects', icon: Plus, description: 'Start a new project' },
  { label: 'New Goal', path: '/goals', icon: Plus, description: 'Set a new goal' },
  { label: 'Write in Journal', path: '/journal', icon: BookOpen, description: "Reflect on today" },
  { label: 'New Invoice', path: '/invoices', icon: DollarSign, description: 'Bill a client' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [recentPaths, setRecentPaths] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Load recent paths from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('vantage_recent_nav') || '[]');
      setRecentPaths(stored);
    } catch { /* ignore */ }
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
    
    // Track recent navigation
    try {
      const recent = JSON.parse(localStorage.getItem('vantage_recent_nav') || '[]');
      const updated = [path, ...recent.filter(p => p !== path)].slice(0, 5);
      localStorage.setItem('vantage_recent_nav', JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const recentNavItems = recentPaths
    .map(path => NAV_ITEMS.find(item => item.path === path))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <>
      {/* Trigger hint in bottom-right */}
      <button
        onClick={() => setOpen(true)} 
        className="fixed bottom-4 right-4 z-40 hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-500 shadow-lg backdrop-blur-sm hover:bg-white hover:shadow-xl transition-all cursor-pointer"
      >
        <Search size={13} />
        <span className="hidden lg:inline">Search or jump to...</span>
        <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] ml-1">⌘K</kbd>
      </button>

      {/* Command Dialog */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <Command className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden" loop>
            {/* Search Input */}
            <div className="flex items-center border-b border-slate-100 px-4">
              <Search size={16} className="text-slate-400 flex-shrink-0" />
              <Command.Input
                ref={inputRef}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-slate-400"
                autoFocus
              />
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">ESC</kbd>
            </div>
            
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-slate-400">
                No results found. Try a different search.
              </Command.Empty>

              {/* Recent */}
              {recentNavItems.length > 0 && (
                <Command.Group heading="Recent" className="mb-1">
                  {recentNavItems.map((item) => {
                    return (
                      <Command.Item
                        key={`recent-${item.path}`}
                        value={`recent ${item.label}`}
                        onSelect={() => handleSelect(item.path)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 aria-selected:bg-slate-100 transition-colors"
                      >
                        <Clock size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <ArrowRight size={12} className="text-slate-300" />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              )}

              {/* Quick Actions */}
              <Command.Group heading="Quick Actions" className="mb-1">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Command.Item
                      key={action.label}
                      value={action.label}
                      onSelect={() => handleSelect(action.path)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 aria-selected:bg-emerald-50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Icon size={13} className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{action.label}</span>
                        <span className="text-slate-400 ml-2 text-xs">{action.description}</span>
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              {/* Navigation */}
              <Command.Group heading="Navigate" className="mb-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.path}
                      value={item.label}
                      onSelect={() => handleSelect(item.path)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 aria-selected:bg-slate-100 transition-colors"
                    >
                      <Icon size={16} className="text-slate-400 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">{item.shortcut}</kbd>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>
            
            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span><kbd className="rounded bg-slate-100 px-1 py-0.5">↑↓</kbd> navigate</span>
                <span><kbd className="rounded bg-slate-100 px-1 py-0.5">↵</kbd> select</span>
                <span><kbd className="rounded bg-slate-100 px-1 py-0.5">esc</kbd> close</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap size={10} /> Vantage
              </div>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}