import { ShieldAlert, SwitchCamera } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function UserNotRegisteredError() {
  const { logout } = useAuth();

  return (
    <div className="page-frame flex min-h-screen items-center justify-center">
      <div className="soft-panel mesh-card w-full max-w-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 text-orange-600">
          <div className="rounded-2xl border border-orange-200 bg-orange-100 p-3">
            <ShieldAlert size={22} />
          </div>
          <p className="section-label text-orange-600">Access restricted</p>
        </div>

        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">
          This account is not registered for SyncPlus.
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          The application loaded correctly, but your current user record does not have access to this workspace yet.
        </p>

        <div className="mt-6 rounded-[24px] border border-border bg-white/75 p-5">
          <p className="text-sm font-semibold">What to check</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li>Confirm you signed in with the intended email account.</li>
            <li>Ask the app administrator to add or invite this user.</li>
            <li>Try switching accounts if you manage more than one login.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => logout(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            <SwitchCamera size={16} />
            Try another account
          </button>
        </div>
      </div>
    </div>
  );
}
