import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Shield,
  CreditCard,
  UserPlus,
  Check,
  Copy,
  Sparkles,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { DEMO_PLANS } from '../../lib/mockData';

export const SettingsView: React.FC = () => {
  const { activeTenant, activeRole, memberships, updateTenantInfo } = useTenant();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'billing'>('general');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('photographer');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // General settings state
  const [studioName, setStudioName] = useState(activeTenant?.name || '');
  const [currency, setCurrency] = useState(activeTenant?.currency || 'INR');
  const [timezone, setTimezone] = useState(activeTenant?.timezone || 'Asia/Kolkata');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    setIsSaving(true);
    try {
      const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
      await updateTenantInfo(activeTenant.tenant_id || activeTenant.id!, {
        name: studioName,
        currency,
        currency_symbol: currencySymbol,
        timezone,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update studio settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setInviteEmail('');
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Studio Administration · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-amber-400" />
            <span>Studio Settings & Access Control</span>
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-850 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'general' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          General & Business Profile
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'team' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Memberships & RBAC Permissions
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'billing' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Subscription & Plan Limits
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl text-xs">
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              <span>Studio Profile</span>
            </h3>

            <div>
              <label className="block text-zinc-400 mb-1">Studio Brand Name</label>
              <input
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Operating Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  <option value="AUD">AUD ($ - Australian Dollar)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Asia/Kolkata">India Standard Time (IST - Asia/Kolkata)</option>
                  <option value="America/New_York">Eastern Time (America/New_York)</option>
                  <option value="America/Chicago">Central Time (America/Chicago)</option>
                  <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                  <option value="Europe/London">London (GMT/BST - Europe/London)</option>
                  <option value="Europe/Paris">Central European Time (Paris - Europe/Paris)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-colors flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved Changes</span>
                  </>
                ) : (
                  <span>Update Studio Settings</span>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Team & RBAC Permissions */}
      {activeTab === 'team' && (
        <div className="space-y-6 max-w-3xl text-xs">
          {/* Invite Section */}
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Invite Teammate to {activeTenant?.name}</span>
            </h3>

            <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="colleague@photography.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="manager">Studio Manager</option>
                <option value="photographer">Photographer</option>
                <option value="videographer">Videographer</option>
                <option value="editor">Editor</option>
                <option value="freelancer">Freelancer</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shrink-0"
              >
                {inviteSuccess ? 'Invitation Sent!' : 'Send Invite'}
              </button>
            </form>
          </div>

          {/* Active Members Table */}
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Active Studio Members</span>
            </h3>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-100">{user?.full_name}</div>
                  <div className="text-zinc-400 text-[11px]">{user?.email}</div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-amber-400 uppercase font-semibold text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {activeRole}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing & Subscription */}
      {activeTab === 'billing' && (
        <div className="space-y-6 text-xs">
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400">Current Subscription</span>
                <h3 className="text-lg font-semibold text-zinc-100 mt-0.5">Studio Pro Plan</h3>
                <p className="text-zinc-400 text-xs mt-1">
                  Active billing period through November 30, 2026. Auto-renew enabled.
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-2xl font-bold text-amber-400 tabular-nums">$129</span>
                <span className="text-zinc-400"> / month</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`p-5 rounded-xl border flex flex-col justify-between ${
                  plan.slug === 'studio-pro'
                    ? 'bg-zinc-900/80 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-zinc-950 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-zinc-100 text-sm">{plan.name}</h4>
                    {plan.slug === 'studio-pro' && (
                      <span className="text-[10px] font-mono text-amber-400 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-mono">
                    <span className="text-xl font-bold text-zinc-100 tabular-nums">${plan.price_monthly}</span>
                    <span className="text-zinc-400 text-xs"> /mo</span>
                  </div>
                  <p className="mt-2 text-zinc-400 text-xs leading-relaxed">{plan.description}</p>

                  <div className="mt-4 pt-3 border-t border-zinc-850 space-y-1.5 text-zinc-300">
                    <div>· Max {plan.max_active_events} Active Bookings</div>
                    <div>· Up to {plan.max_team_members} Crew Accounts</div>
                    <div>· {plan.storage_limit_gb} GB Cloud Storage</div>
                    <div>· {plan.has_freelancer_dispatch ? 'WhatsApp Dispatch' : 'Standard Roster'}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    disabled={plan.slug === 'studio-pro'}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                      plan.slug === 'studio-pro'
                        ? 'bg-zinc-800 text-zinc-400 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                    }`}
                  >
                    {plan.slug === 'studio-pro' ? 'Active Plan' : 'Select Plan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
