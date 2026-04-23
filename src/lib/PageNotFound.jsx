import { Link, useLocation } from 'react-router-dom';
import { Compass, Home, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const pageName = location.pathname === '/' ? 'home' : location.pathname.replace('/', '');

  return (
    <div className="page-frame flex min-h-screen items-center justify-center">
      <div className="soft-panel mesh-card w-full max-w-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 text-primary">
          <div className="rounded-2xl border border-primary/10 bg-primary/10 p-3">
            <Compass size={22} />
          </div>
          <p className="section-label text-primary/75">404 route</p>
        </div>

        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">
          The page &quot;{pageName}&quot; could not be found.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          The link may be outdated or the route may not exist in this version of the app.
        </p>

        {isAuthenticated && user?.role === 'admin' && (
          <div className="mt-6 rounded-[24px] border border-orange-200 bg-orange-50/80 p-5">
            <div className="flex items-center gap-2 text-orange-700">
              <Sparkles size={16} />
              <p className="text-sm font-semibold">Admin note</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-orange-700/90">
              You are using local workspace mode, so this is a routing issue rather than an auth or backend issue.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            <Home size={16} />
            Return to dashboard
          </Link>
          <Link
            to="/daily"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/75 px-5 py-3 text-sm font-medium text-foreground"
          >
            Open daily execution
          </Link>
        </div>
      </div>
    </div>
  );
}
