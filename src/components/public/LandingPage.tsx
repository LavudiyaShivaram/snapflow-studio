import React, { useState } from 'react';
import {
  Camera,
  Film,
  Calendar,
  Receipt,
  Users,
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Database,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_PLANS } from '../../lib/mockData';
import { LoginForm } from '../auth/LoginForm';

interface LandingPageProps {
  onEnterStudio: () => void;
  onOpenConfig: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterStudio,
  onOpenConfig,
}) => {
  const { user, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setResetSuccessMessage(null);

    if (authMode === 'reset') {
      const { error, message } = await resetPasswordForEmail(email);
      if (error) {
        setAuthError(error);
        return;
      }
      setResetSuccessMessage(message || 'Password reset email dispatched.');
      return;
    }

    if (authMode === 'login') {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setAuthError(error);
        return;
      }
    } else {
      const { error } = await signUpWithEmail(email, password, fullName);
      if (error) {
        setAuthError(error);
        return;
      }
    }

    setAuthModalOpen(false);
    onEnterStudio();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Bar Contract (Strict 1-row, 3-zone layout) */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-850 px-6 py-4">
        <div className="flex items-center justify-between gap-8 max-w-7xl mx-auto">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/10">
              <Camera className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-lg font-display font-semibold tracking-tight text-zinc-100 whitespace-nowrap">
              SnapFlow <span className="text-amber-400 font-normal">Studio</span>
            </span>
          </div>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-200 transition-colors whitespace-nowrap">
              Features
            </a>
            <a href="#multi-tenant" className="hover:text-zinc-200 transition-colors whitespace-nowrap">
              Multi-Tenant Architecture
            </a>
            <a href="#pipeline" className="hover:text-zinc-200 transition-colors whitespace-nowrap">
              Post-Production
            </a>
            <a href="#pricing" className="hover:text-zinc-200 transition-colors whitespace-nowrap">
              Pricing Plans
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenConfig}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 font-mono transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Database Schema</span>
            </button>
            <button
              onClick={() => {
                if (user) onEnterStudio();
                else setAuthModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/10 whitespace-nowrap"
            >
              {user ? 'Enter Studio Workspace' : 'Sign In / Register'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Cinematic Dark Creative Aesthetic) */}
      <section className="relative px-6 pt-16 pb-20 overflow-hidden border-b border-zinc-850">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <span>PostgreSQL Multi-Tenant SaaS Engine</span>
              <span>·</span>
              <span>RLS Row-Level Security</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-zinc-100 leading-[1.08] text-balance">
              The operating system for premium wedding cinema & photography studios.
            </h1>

            <p className="text-base text-zinc-400 leading-relaxed max-w-xl">
              Architected for multi-crew photography agencies. Strict tenant isolation, multi-ceremony session schedules, automated WhatsApp crew dispatch, quotation ledgers, and delivery pipelines.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  if (user) onEnterStudio();
                  else {
                    setAuthMode('register');
                    setAuthModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm shadow-xl shadow-amber-500/15 transition-all"
              >
                <span>Launch Your Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onEnterStudio}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 text-sm font-medium transition-colors"
              >
                <span>Explore Live Demo Studios</span>
              </button>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>31 Database Tables</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PostgreSQL RLS Enforced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Data Leaks</span>
              </div>
            </div>
          </div>

          {/* Cinematic Studio Visual Container */}
          <div className="lg:col-span-5">
            <div className="relative p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-semibold text-xs text-zinc-200">Royal Wedding Photography</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Multi-Crew Dispatch</span>
              </div>

              {/* Sample Shoot Card with 3D Depth */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">The Vance & Hastings Nuptials</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Oheka Castle Estate · 280 Guests</div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-amber-400">$14,500</span>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
                  <div className="p-2 rounded bg-zinc-900/60 flex items-center justify-between">
                    <span>10:00 - First Look & Bridal Suite</span>
                    <span className="text-zinc-400">Sony A1 (Julian)</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 flex items-center justify-between">
                    <span>14:30 - Terrace Vows & Fireworks</span>
                    <span className="text-amber-400">FAA Drone (Darius)</span>
                  </div>
                </div>
              </div>

              {/* Cashflow Snapshot */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase block">Settled Milestone</span>
                  <span className="text-emerald-400 font-bold text-sm tabular-nums">+$7,500</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase block">Crew Payouts</span>
                  <span className="text-red-400 font-bold text-sm tabular-nums">-$1,630</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Feature Pillars */}
      <section id="features" className="py-20 px-6 border-b border-zinc-850">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Purpose-Built Architecture
            </span>
            <h2 className="text-3xl font-display font-semibold text-zinc-100">
              Engineered specifically for high-end wedding & commercial media teams.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">Multi-Ceremony Sessions</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Weddings aren't single-hour events. Schedule multi-day breakdowns: Haldi, Sangeet, Vows, and Receptions with individual call times, venue addresses, and drone clearance permits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">WhatsApp Freelancer Dispatch</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dispatch external second shooters and licensed drone pilots in seconds. Generate pre-formatted, one-click WhatsApp briefs with call times, locations, and agreed rates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">Shoot-Level Gross Margins</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Never guess your profitability. Track equipment rentals, travel expenses, and crew payouts directly against each booking package price to calculate real net margins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-20 px-6 border-b border-zinc-850 bg-zinc-950">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Subscription Ready
            </span>
            <h2 className="text-3xl font-display font-semibold text-zinc-100">
              Transparent plans that scale with your production volume.
            </h2>
            <p className="text-xs text-zinc-400">All plans include isolated workspace and PostgreSQL database security.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEMO_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between ${
                  plan.slug === 'studio-pro'
                    ? 'bg-zinc-900/80 border-amber-500/40 shadow-2xl shadow-amber-500/5'
                    : 'bg-zinc-900/40 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-100 text-base">{plan.name}</h3>
                    {plan.slug === 'studio-pro' && (
                      <span className="text-[10px] font-mono text-amber-400 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-3 font-mono">
                    <span className="text-3xl font-bold text-zinc-100 tabular-nums">
                      ${plan.price_monthly}
                    </span>
                    <span className="text-zinc-400 text-xs"> / month</span>
                  </div>
                  <p className="mt-2 text-zinc-400 text-xs leading-relaxed">{plan.description}</p>

                  <div className="mt-6 pt-4 border-t border-zinc-800 space-y-2 text-xs text-zinc-300">
                    <div>· Max {plan.max_active_events} Active Event Bookings</div>
                    <div>· Up to {plan.max_team_members} Team Crew Accounts</div>
                    <div>· {plan.storage_limit_gb} GB Cloud Storage</div>
                    <div>· {plan.has_client_galleries ? '4K Client Web Galleries' : 'Standard Delivery'}</div>
                    <div>· {plan.has_freelancer_dispatch ? 'WhatsApp Freelancer Dispatch' : 'Basic Roster'}</div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={onEnterStudio}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/10"
                  >
                    Start with {plan.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-850 text-xs text-zinc-300 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div>© 2026 SnapFlow Studio. Premium Multi-Tenant Photography Business Management SaaS.</div>
        <div className="flex items-center gap-6">
          <button onClick={onOpenConfig} className="text-zinc-400 hover:text-zinc-200">
            PostgreSQL Migrations
          </button>
          <button onClick={onEnterStudio} className="text-amber-400 hover:underline">
            Launch Workspace
          </button>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            {/* Modal Close Button */}
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {authMode === 'login' ? (
              <LoginForm
                onSuccess={() => {
                  setAuthModalOpen(false);
                  onEnterStudio();
                }}
                onNavigateToRegister={() => setAuthMode('register')}
                onNavigateToReset={() => setAuthMode('reset')}
              />
            ) : (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-4">
                <div className="pb-2 border-b border-zinc-800">
                  <h3 className="text-base font-semibold text-zinc-100">
                    {authMode === 'register' ? 'Register Photography Studio' : 'Reset Account Password'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {authMode === 'register'
                      ? 'Create your studio owner credentials.'
                      : 'Enter your studio email to receive recovery instructions.'}
                  </p>
                </div>

                {authError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    {authError}
                  </div>
                )}

                {resetSuccessMessage && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    {resetSuccessMessage}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-zinc-400 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Julian Thorne"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-zinc-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="photographer@studio.com"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className="block text-zinc-400 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs shadow-lg shadow-amber-500/10 transition-colors"
                  >
                    {authMode === 'register' ? 'Create Studio Account' : 'Dispatch Reset Link'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-amber-400 hover:underline text-xs"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
