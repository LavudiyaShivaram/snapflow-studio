/**
 * SNAPFLOW STUDIO - ROOT APPLICATION
 * Premium Multi-Tenant Photography Business Management SaaS
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SupabaseConfigModal } from './components/layout/SupabaseConfigModal';
import { StudioOnboardingWizard } from './components/onboarding/StudioOnboardingWizard';
import { WorkspaceSelectionModal } from './components/tenant/WorkspaceSelectionModal';
import { RegisterPage } from './components/auth/RegisterPage';
import { LoginForm } from './components/auth/LoginForm';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { ClientsView } from './components/clients/ClientsView';
import { EventsView } from './components/events/EventsView';
import { TeamView } from './components/team/TeamView';
import { CommercialView } from './components/commercial/CommercialView';
import { ProductionView } from './components/production/ProductionView';
import { TasksView } from './components/tasks/TasksView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { LandingPage } from './components/public/LandingPage';
import { CheckCircle2, AlertCircle, X, Sparkles, Building2, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user, loading, verificationStatus, dismissVerificationStatus } = useAuth();
  const { activeTenant, userWorkspaces, hasCompletedOnboarding, getOnboardingDraft, schemaStatus } = useTenant();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [dismissMigrationBanner, setDismissMigrationBanner] = useState(false);

  // If user has saved draft and hasn't finished setup
  const existingDraft = getOnboardingDraft();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span>Restoring Studio Session...</span>
        </div>
      </div>
    );
  }

  // 1. PUBLIC REGISTRATION VIEW
  if (activeTab === 'register') {
    return (
      <RegisterPage
        onNavigateToLogin={() => setActiveTab('login')}
        onSuccess={() => setActiveTab('dashboard')}
      />
    );
  }

  // 2. PUBLIC LOGIN VIEW
  if (activeTab === 'login') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
        <div className="w-full max-w-md">
          <LoginForm
            onSuccess={() => setActiveTab('dashboard')}
            onNavigateToRegister={() => setActiveTab('register')}
          />
          <div className="text-center mt-4">
            <button
              onClick={() => setActiveTab('public_landing')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. PUBLIC LANDING PAGE (When signed out or explicitly requested)
  if (!user || activeTab === 'public_landing') {
    return (
      <>
        <LandingPage
          onEnterStudio={() => setActiveTab('dashboard')}
          onOpenConfig={() => setConfigModalOpen(true)}
          onNavigateToRegister={() => setActiveTab('register')}
          onNavigateToLogin={() => setActiveTab('login')}
        />
        <SupabaseConfigModal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
        />
      </>
    );
  }

  // 4. INCOMPLETE ONBOARDING GUARD
  // If user is authenticated but has no studio workspace established,
  // do not display business dashboard. Show dedicated setup / resume view.
  if (!hasCompletedOnboarding && (!activeTenant || userWorkspaces.length === 0)) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-amber-500/20 selection:text-amber-200">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-semibold text-zinc-100 tracking-tight">
              {existingDraft ? 'Resume Studio Setup' : 'Create Your Photography Studio'}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {existingDraft
                ? `You have an in-progress setup for "${existingDraft.studio_name || 'your studio'}". Pick up where you left off.`
                : 'Your account is verified! Establish your dedicated multi-tenant photography workspace to access client management and shoot dispatch.'}
            </p>
          </div>

          <button
            onClick={() => setOnboardingOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs shadow-lg shadow-amber-500/10 transition-colors"
          >
            <span>{existingDraft ? 'Resume Setup Wizard' : 'Launch Studio Onboarding'}</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </button>

          <StudioOnboardingWizard
            isOpen={onboardingOpen}
            onClose={() => setOnboardingOpen(false)}
            onNavigateToBooking={() => setActiveTab('events')}
            onNavigateToTeam={() => setActiveTab('team')}
          />
        </div>
      </div>
    );
  }

  // 5. MAIN WORKSPACE VIEW (Active Tenant Dashboard)
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Email Verification Callback Banner (if token detected or error returned) */}
      {verificationStatus.status !== 'idle' && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
            verificationStatus.status === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            {verificationStatus.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{verificationStatus.message}</span>
            <button
              onClick={dismissVerificationStatus}
              className="ml-auto p-1 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Database Schema Initialization Notice */}
      {schemaStatus === 'migration_required' && !dismissMigrationBanner && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Supabase PostgreSQL Connected:</strong> The remote database requires initial schema setup (31 tables & RLS). Click to view and copy the SQL script to run in your Supabase SQL editor.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setConfigModalOpen(true)}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-[11px] transition-colors"
              >
                View & Copy SQL Migration
              </button>
              <button
                onClick={() => setDismissMigrationBanner(true)}
                className="p-1 hover:text-white transition-colors text-amber-400/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Zone Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConfigModal={() => setConfigModalOpen(true)}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onOpenWorkspaceModal={() => setWorkspaceModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Operations Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenOnboarding={() => setOnboardingOpen(true)}
          />
        </div>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={setActiveTab}
              onOpenNewEventModal={() => setActiveTab('events')}
              onOpenNewPaymentModal={() => setActiveTab('commercial')}
            />
          )}

          {activeTab === 'calendar' && <CalendarView />}

          {activeTab === 'clients' && <ClientsView />}

          {activeTab === 'events' && <EventsView />}

          {activeTab === 'team' && <TeamView />}

          {activeTab === 'commercial' && <CommercialView />}

          {activeTab === 'production' && <ProductionView />}

          {activeTab === 'tasks' && <TasksView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Supabase Schema & Connection Modal */}
      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />

      {/* Studio Provisioning Wizard */}
      <StudioOnboardingWizard
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onNavigateToBooking={() => setActiveTab('events')}
        onNavigateToTeam={() => setActiveTab('team')}
      />

      {/* Multi-Tenant Workspace Selection Modal */}
      <WorkspaceSelectionModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        onCreateNewStudio={() => setOnboardingOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <AppContent />
      </TenantProvider>
    </AuthProvider>
  );
}
