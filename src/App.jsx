import { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import PageNotFound from '@/lib/PageNotFound';
import { queryClientInstance } from '@/lib/query-client';
import { ThemeProvider } from '@/lib/ThemeContext';
import { appRoutes, legacyRedirects } from '@/app/routes';

function LoadingScreen({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/75 p-8 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function AccessError({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/75 p-8 shadow-xl backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">SyncPlus</p>
        <h1 className="mt-4 text-3xl font-semibold">App connection issue</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message || 'The workspace could not complete its startup checks.'}
        </p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  } = useAuth();

  useEffect(() => {
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError, navigateToLogin]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen label="Preparing your workspace..." />;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === 'auth_required') {
    return <LoadingScreen label="Redirecting to sign in..." />;
  }

  if (authError) {
    return <AccessError message={authError.message} />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {appRoutes.map(({ path, component: Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
        {legacyRedirects.map(({ path, to }) => (
          <Route key={path} path={path} element={<Navigate replace to={to} />} />
        ))}
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}