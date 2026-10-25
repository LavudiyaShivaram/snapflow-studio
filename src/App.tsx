/**
 * SNAPFLOW STUDIO - ROOT APPLICATION
 * Premium Multi-Tenant Photography Business Management SaaS
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SupabaseConfigModal } from './components/layout/SupabaseConfigModal';
import { StudioOnboarding } from './components/onboarding/StudioOnboarding';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { ClientsView } from './components/clients/ClientsView';
import { EventsView } from './components/events/EventsView';
import { TeamView } from './components/team/TeamView';
import { CommercialView } from './components/commercial/CommercialView';
import { ProductionView } from './components/production/ProductionView';
import { TasksView } from './components/tasks/TasksView';
import { ReportsView } from './components/reports/ReportsView';
import { useAuth } from './context/AuthContext';
import { SettingsView } from './components/settings/SettingsView';
import { LandingPage } from './components/public/LandingPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Quick Action Modals
  const [quickEventModalOpen, setQuickEventModalOpen] = useState(false);
  const [quickPaymentModalOpen, setQuickPaymentModalOpen] = useState(false);

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

  // If user signed out or explicitly navigated to public landing page
  if (!user || activeTab === 'public_landing') {
    return (
      <>
        <LandingPage
          onEnterStudio={() => setActiveTab('dashboard')}
          onOpenConfig={() => setConfigModalOpen(true)}
        />
        <SupabaseConfigModal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* 3-Zone Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConfigModal={() => setConfigModalOpen(true)}
        onOpenOnboarding={() => setOnboardingOpen(true)}
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
      <StudioOnboarding
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
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
