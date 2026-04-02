import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Menu, X } from 'lucide-react';
import { getRouteMeta, navigationSections } from '@/app/navigation';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

function SidebarLink({ item, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex items-start gap-3 rounded-2xl px-3 py-3 transition-all duration-200',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_20px_40px_-26px_rgba(20,184,166,0.55)]'
            : 'text-sidebar-foreground/74 hover:bg-white/10 hover:text-sidebar-foreground'
        )
      }
    >
      <span className="mt-0.5 rounded-xl bg-black/10 p-2 ring-1 ring-black/5">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{item.label}</span>
        <span className="mt-1 block text-xs leading-5 opacity-80">{item.description}</span>
      </span>
    </NavLink>
  );
}

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const routeMeta = getRouteMeta(location.pathname);
  const RouteIcon = routeMeta.icon;

  const userInitials = useMemo(() => {
    const name = user?.full_name || user?.email || 'SP';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() || '')
      .join('');
  }, [user]);

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_left_top,rgba(15,118,110,0.08),transparent_24%),radial-gradient(circle_at_right_top,rgba(249,115,22,0.08),transparent_20%)]" />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[300px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-4">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/60">
                  SyncPlus
                </p>
                <h1 className="mt-3 font-display text-2xl font-semibold">
                  Your original command center for life and client work.
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-white/10 p-2 text-sidebar-foreground/70 lg:hidden"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-sidebar-foreground/70">
              Dashboard, planning, daily execution, pipeline, invoicing, and reminders all stay available as separate tools again.
            </p>
          </div>

          <div className="space-y-5">
            {navigationSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/50">
                  {section.label}
                </p>
                <nav className="mt-2 space-y-1.5">
                  {section.items.map((item) => (
                    <SidebarLink key={item.path} item={item} onClick={() => setMobileOpen(false)} />
                  ))}
                </nav>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-sidebar-primary">Local workspace mode</p>
            <p className="mt-2 text-xs leading-5 text-sidebar-foreground/70">
              Base44 stays removed. The original multi-page product structure is now active on local data.
            </p>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-col lg:pl-[300px]">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="mt-1 rounded-2xl border border-border bg-white/70 p-3 shadow-sm lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="section-label text-primary/75">{routeMeta.section}</p>
                <div className="mt-2 flex items-start gap-3">
                  <div className="rounded-2xl border border-primary/10 bg-primary/10 p-3 text-primary">
                    <RouteIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl font-semibold">{routeMeta.label}</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {routeMeta.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <div className="rounded-full border border-border bg-white/75 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  {format(new Date(), 'EEEE, d MMM yyyy')}
                </div>
                <div className="flex items-center gap-3 rounded-full border border-border bg-white/75 px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {userInitials || 'SP'}
                  </div>
                  <div className="pr-2">
                    <p className="text-sm font-semibold">{user?.full_name || 'Workspace user'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || 'Connected account'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
