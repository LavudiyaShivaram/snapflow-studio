import React, { useState } from 'react';
import { Camera, ChevronDown, Plus, Database, UserCheck, Shield, ExternalLink } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { getSupabaseConfigStatus } from '../../lib/supabase';

interface HeaderProps {
  onOpenConfigModal: () => void;
  onOpenOnboarding: () => void;
  onOpenWorkspaceModal?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConfigModal,
  onOpenOnboarding,
  onOpenWorkspaceModal,
  activeTab,
  setActiveTab,
}) => {
  const { tenants, activeTenant, switchTenant, activeRole } = useTenant();
  const { user, signOut, switchDemoUser } = useAuth();
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const configStatus = getSupabaseConfigStatus();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-6 py-3.5">
      <div className="flex items-center justify-between gap-8 max-w-7xl mx-auto">
        {/* Zone 1: Brand Wordmark (Single text element with iconic camera aperture) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/10">
            <Camera className="w-4 h-4 text-zinc-950" />
          </div>
          <span className="text-lg font-display font-semibold tracking-tight text-zinc-100 whitespace-nowrap">
            SnapFlow <span className="text-amber-400 font-normal">Studio</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links (Single-line whitespace-nowrap) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`transition-colors whitespace-nowrap ${
              activeTab === 'dashboard' ? 'text-amber-400 font-semibold' : 'hover:text-zinc-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`transition-colors whitespace-nowrap ${
              activeTab === 'calendar' ? 'text-amber-400 font-semibold' : 'hover:text-zinc-200'
            }`}
          >
            Shoots Calendar
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`transition-colors whitespace-nowrap ${
              activeTab === 'events' ? 'text-amber-400 font-semibold' : 'hover:text-zinc-200'
            }`}
          >
            Events & Bookings
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`transition-colors whitespace-nowrap ${
              activeTab === 'commercial' ? 'text-amber-400 font-semibold' : 'hover:text-zinc-200'
            }`}
          >
            Quotes & Finance
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`transition-colors whitespace-nowrap ${
              activeTab === 'production' ? 'text-amber-400 font-semibold' : 'hover:text-zinc-200'
            }`}
          >
            Editing Pipeline
          </button>
        </nav>

        {/* Zone 3: Primary Action & Workspace Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Supabase Connection Status Badge / Modal Trigger */}
          <button
            onClick={onOpenConfigModal}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-xs font-mono transition-colors text-zinc-300"
            title="Inspect Supabase PostgreSQL connection & migrations"
          >
            <Database className={`w-3.5 h-3.5 ${configStatus.isConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="hidden md:inline">
              {configStatus.isConfigured ? 'Supabase Live' : 'Supabase (Demo Mode)'}
            </span>
          </button>

          {/* Active Studio Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setTenantMenuOpen(!tenantMenuOpen);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="max-w-[140px] truncate text-left font-sans">
                {activeTenant?.name || 'Select Studio'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>

            {tenantMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 z-50">
                <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                  Photography Workspaces
                </div>
                <div className="space-y-1">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        switchTenant(t.id);
                        setTenantMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                        activeTenant?.id === t.id
                          ? 'bg-amber-500/10 text-amber-300 font-medium'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium truncate">{t.name}</div>
                        <div className="text-[11px] text-zinc-300">
                          {t.city} · {t.currency_symbol} {t.currency}
                        </div>
                      </div>
                      {activeTenant?.id === t.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-zinc-800 my-1 pt-1 space-y-1">
                  {onOpenWorkspaceModal && (
                    <button
                      onClick={() => {
                        setTenantMenuOpen(false);
                        onOpenWorkspaceModal();
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <span>View All Workspaces</span>
                      <span className="text-[10px] font-mono text-zinc-500">({tenants.length})</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setTenantMenuOpen(false);
                      onOpenOnboarding();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Studio
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setTenantMenuOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-[11px]">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="hidden xl:inline text-xs font-medium max-w-[100px] truncate">
                {user?.full_name?.split(' ')[0]}
              </span>
              <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-mono">
                {activeRole}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <div className="font-semibold text-zinc-100 truncate">{user?.full_name}</div>
                  <div className="text-[11px] text-zinc-400 truncate">{user?.email}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-400">
                    <Shield className="w-3 h-3" />
                    <span>Role: {activeRole.toUpperCase()}</span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">
                    Simulate Persona
                  </div>
                  <button
                    onClick={() => {
                      switchDemoUser('usr-001');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-left hover:bg-zinc-800 text-zinc-300"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Alexander (Owner)</span>
                  </button>
                  <button
                    onClick={() => {
                      switchDemoUser('usr-002');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-left hover:bg-zinc-800 text-zinc-300"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Clara (Manager)</span>
                  </button>
                </div>

                <div className="border-t border-zinc-800 pt-1">
                  <button
                    onClick={() => {
                      setActiveTab('public_landing');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-left hover:bg-zinc-800 text-zinc-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Public Landing Page</span>
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-left text-red-400 hover:bg-red-500/10"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
