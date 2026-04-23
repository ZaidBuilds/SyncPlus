import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { navigationItems } from '@/app/navigation';
import { useTheme } from '@/lib/ThemeContext';
import { CommandPalette } from './CommandPalette';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const routeMeta = navigationItems.find(item => item.path === location.pathname) || {
    label: 'Dashboard',
    section: 'Main',
    description: '',
    icon: null
  };

  const userInitials = (user?.full_name || 'SP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(chunk => chunk[0]?.toUpperCase() || '')
    .join('');

  // Keyboard shortcuts
  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') return;
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case 'd': navigate('/'); break;
        case 't': navigate('/tasks'); break;
        case 'h': navigate('/habits'); break;
        case 'c': navigate('/calendar'); break;
        case 'p': navigate('/projects'); break;
        case 'g': navigate('/goals'); break;
        default: break;
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, [navigate]);

  return (
    <div className="relative min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-slate-900 text-white transition-all duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ width: collapsed ? 60 : 240 }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-4 flex justify-between items-center">
            {!collapsed && <span className="font-bold text-lg">SyncPlus</span>}
            <div className="flex gap-1">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/10"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/10 lg:hidden"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-2 overflow-y-auto">
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="p-4 border-t border-white/10">
              <p className="text-xs text-slate-400">Local workspace mode</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={cn("min-h-screen transition-all", collapsed ? "lg:ml-16" : "lg:ml-60")}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-slate-200 p-2 lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {routeMeta.section || 'Main'}
                </p>
                <h2 className="text-xl font-semibold">{routeMeta.label || 'Dashboard'}</h2>
              </div>
            </div>

            {/* User info + Theme toggle */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white font-semibold">
                {userInitials || 'SP'}
              </div>
              <div className="pr-2">
                <p className="text-sm font-semibold">{user?.full_name || 'Workspace user'}</p>
                <p className="text-xs text-slate-500">{user?.email || 'Connected account'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

export default Layout;
