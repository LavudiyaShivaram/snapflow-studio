import React from 'react';
import {
  Calendar,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Film,
  UserCheck,
  Plus,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewEventModal: () => void;
  onOpenNewPaymentModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewEventModal,
  onOpenNewPaymentModal,
}) => {
  const {
    activeTenant,
    events,
    sessions,
    assignments,
    payments,
    expenses,
    editingProjects,
    tasks,
  } = useTenant();

  const currencySymbol = activeTenant?.currency_symbol || '₹';

  // Financial aggregates
  const totalContracted = events.reduce((sum, e) => sum + e.total_package_price, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = events.reduce((sum, e) => sum + e.outstanding_balance, 0);
  const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const netOperatingProfit = totalCollected - totalExpenses;
  const grossMarginPercent =
    totalCollected > 0 ? Math.round((netOperatingProfit / totalCollected) * 100) : 0;

  // Operational metrics
  const pendingAssignments = assignments.filter((a) => a.status === 'requested');
  const activeEditing = editingProjects.filter((ep) => ep.current_stage !== 'completed');
  const pendingTasks = tasks.filter((t) => !t.is_completed);

  // Shoots timeline calculation
  const today = '2026-10-25'; // Simulated timeline base date matching system context
  const upcomingEvents = [...events].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Studio Banner & Executive Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Studio Command Center · {activeTenant?.city}
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-semibold text-zinc-100 tracking-tight">
            {activeTenant?.name}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time multi-crew production schedule, client receivables, and post-production ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenNewPaymentModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={onOpenNewEventModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Shoot</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip (Tabular Figures, Single-Elevation) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
            Total Contracted
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-zinc-100 mt-1">
            {currencySymbol}
            {totalContracted.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-300 mt-1.5">
            Across {events.length} confirmed bookings
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
            Collected Revenue
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {currencySymbol}
            {totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-300 mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>{Math.round((totalCollected / (totalContracted || 1)) * 100)}% settled</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
            Outstanding Receivables
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            {currencySymbol}
            {totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-300 mt-1.5">
            Pending milestone due dates
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
            Operating Net Margin
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-zinc-100 mt-1">
            {grossMarginPercent}%
          </div>
          <div className="text-[11px] text-zinc-300 mt-1.5">
            After {currencySymbol}{totalExpenses.toLocaleString()} gear & crew payouts
          </div>
        </div>
      </div>

      {/* Operational Attention Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Shoots & Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Upcoming Shoots & Multi-Ceremony Sessions</span>
            </h2>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>View Full Calendar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map((evt) => {
              const evtSessions = sessions.filter((s) => s.event_id === evt.id);
              return (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/60">
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">{evt.title}</div>
                      <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                        <span>{evt.primary_venue_name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{evt.event_type.replace('_', ' ')}</span>
                        <span aria-hidden="true">·</span>
                        <span>{evt.estimated_guest_count || 150} Guests</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right font-mono text-xs tabular-nums text-zinc-300">
                      <div>{evt.start_date}</div>
                      <div className="text-[11px] text-zinc-300 mt-0.5">
                        {currencySymbol}{evt.total_paid.toLocaleString()} of {currencySymbol}{evt.total_package_price.toLocaleString()} paid
                      </div>
                    </div>
                  </div>

                  {/* Multi-Ceremony Session Breakdown */}
                  {evtSessions.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider">
                        Ceremony Sessions Breakdown
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {evtSessions.map((ses) => (
                          <div
                            key={ses.id}
                            className="p-2 rounded bg-zinc-950/60 border border-zinc-800/60 text-xs flex items-center justify-between"
                          >
                            <div className="truncate pr-2">
                              <div className="font-medium text-zinc-200 truncate">{ses.title}</div>
                              <div className="text-[11px] text-zinc-400">
                                Call Time: {ses.reporting_time || ses.start_time} · {ses.start_time} - {ses.end_time}
                              </div>
                            </div>
                            {ses.is_drone_permitted && (
                              <span className="text-[10px] text-amber-400/90 font-mono shrink-0">
                                Drone Authorized
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Action Column: Crew Dispatch & Editing Turnaround */}
        <div className="space-y-6">
          {/* Pending Freelancer Dispatches */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-mono">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Crew Dispatch & Staffing</span>
              </h3>
              <button
                onClick={() => onNavigateTab('team')}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Manage
              </button>
            </div>

            {pendingAssignments.length === 0 ? (
              <p className="text-xs text-zinc-300 py-3">All shoot positions confirmed.</p>
            ) : (
              <div className="space-y-2">
                {pendingAssignments.map((pa) => (
                  <div
                    key={pa.id}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-amber-500/20 text-xs"
                  >
                    <div className="font-medium text-zinc-200">
                      Requested: {pa.role_assigned.toUpperCase()}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Fee: {currencySymbol}{pa.agreed_payout} · Call: {pa.call_time}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => onNavigateTab('team')}
                        className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-medium"
                      >
                        Copy WhatsApp Dispatch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post-Production Deadlines */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-mono">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>Editing & Delivery Pipeline</span>
              </h3>
              <button
                onClick={() => onNavigateTab('production')}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Full Pipeline
              </button>
            </div>

            <div className="space-y-2.5">
              {activeEditing.map((ep) => {
                const epEvent = events.find((e) => e.id === ep.event_id);
                return (
                  <div key={ep.id} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                    <div className="font-medium text-zinc-200 truncate">
                      {epEvent?.title || 'Wedding Film & Master Album'}
                    </div>
                    <div className="text-[11px] text-amber-400/90 capitalize mt-0.5">
                      Stage: {ep.current_stage.replace('_', ' ')}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between font-mono">
                      <span>Due: {ep.deadline_date}</span>
                      <span>{ep.revision_count} Revisions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Studio Checklists & Tasks */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Immediate Shoot Prep ({pendingTasks.length})</span>
              </h3>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-[11px] text-amber-400 hover:underline"
              >
                All Tasks
              </button>
            </div>

            <div className="space-y-2">
              {pendingTasks.slice(0, 3).map((tsk) => (
                <div
                  key={tsk.id}
                  className="p-2 rounded bg-zinc-950/80 border border-zinc-800/80 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <div className="font-medium text-zinc-200 truncate">{tsk.title}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">Due: {tsk.due_date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
