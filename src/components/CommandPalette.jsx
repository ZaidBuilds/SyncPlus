import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, Plus, LayoutDashboard, CheckCircle2, Calendar, Target, DollarSign, BookOpen, BarChart3, Settings2, BriefcaseBusiness, ListTodo, FolderOpen, Flame } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Today', path: '/daily', icon: CheckCircle2 },
  { label: 'Habits', path: '/habits', icon: Flame },
  { label: 'Tasks', path: '/tasks', icon: ListTodo },
  { label: 'Calendar', path: '/calendar', icon: Calendar },
  { label: 'Projects', path: '/projects', icon: FolderOpen },
  { label: 'Goals', path: '/goals', icon: Target },
  { label: 'Pipeline', path: '/pipeline', icon: BriefcaseBusiness },
  { label: 'Money', path: '/invoices', icon: DollarSign },
  { label: 'Journal', path: '/journal', icon: BookOpen },
  { label: 'Review', path: '/weekly-review', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings2 },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
  };

  return (
    <>
      {/* Trigger hint */}
      <div className="fixed bottom-4 right-4 z-40 hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-500 shadow-lg backdrop-blur-sm">
        <span className="hidden lg:inline">Search</span>
        <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>
      </div>

      {/* Command Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div className="fixed inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <Command className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center border-b border-slate-100 px-3">
              <Search size={16} className="text-slate-400" />
              <Command.Input
                placeholder="Search or type a command..."
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                autoFocus
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-slate-500">
                No results found.
              </Command.Empty>
              <Command.Group heading="Navigation" className="mb-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.path}
                      onSelect={() => handleSelect(item.path)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 aria-selected:bg-slate-100"
                    >
                      <Icon size={16} className="text-slate-500" />
                      <span>{item.label}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
              <Command.Group heading="Actions" className="mb-2">
                <Command.Item
                  onSelect={() => { navigate('/tasks'); setOpen(false); }}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 aria-selected:bg-slate-100"
                >
                  <Plus size={16} className="text-slate-500" />
                  <span>Add new task</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => { navigate('/habits'); setOpen(false); }}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 aria-selected:bg-slate-100"
                >
                  <Plus size={16} className="text-slate-500" />
                  <span>Add new habit</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
            <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
              Use <kbd className="rounded bg-slate-100 px-1">↑↓</kbd> to navigate, <kbd className="rounded bg-slate-100 px-1">↵</kbd> to select, <kbd className="rounded bg-slate-100 px-1">esc</kbd> to close
            </div>
          </Command>
        </div>
      )}
    </>
  );
}