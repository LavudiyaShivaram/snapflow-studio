import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  AlertTriangle,
  Filter,
  CheckCircle2,
  Users,
  Video,
  Camera,
  Layers,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { EventSession } from '../../lib/types';

export const CalendarView: React.FC = () => {
  const { events, sessions, teamMembers, assignments, activeTenant } = useTenant();

  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-11-01'));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [filterTeamMember, setFilterTeamMember] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<EventSession | null>(null);

  // Month navigation
  const prevPeriod = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
      else next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const nextPeriod = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
      else next.setDate(next.getDate() + 7);
      return next;
    });
  };

  // Conflict Detection: Detect if a team member is booked on overlapping sessions
  const assignmentConflicts = useMemo(() => {
    const conflicts: { memberName: string; session1: string; session2: string; date: string }[] = [];

    // Group assignments by member and date
    const memberAssignments = new Map<string, typeof assignments>();
    assignments.forEach((asg) => {
      const session = sessions.find((s) => s.id === asg.session_id);
      if (!session) return;
      const key = `${asg.team_member_id}_${session.session_date}`;
      if (!memberAssignments.has(key)) {
        memberAssignments.set(key, []);
      }
      memberAssignments.get(key)!.push(asg);
    });

    // Check overlaps within same date
    memberAssignments.forEach((asgList) => {
      if (asgList.length < 2) return;
      for (let i = 0; i < asgList.length; i++) {
        for (let j = i + 1; j < asgList.length; j++) {
          const s1 = sessions.find((s) => s.id === asgList[i].session_id);
          const s2 = sessions.find((s) => s.id === asgList[j].session_id);
          if (s1 && s2) {
            // Check if times overlap
            const start1 = s1.start_time;
            const end1 = s1.end_time;
            const start2 = s2.start_time;
            const end2 = s2.end_time;

            if (start1 < end2 && start2 < end1) {
              const member = teamMembers.find((m) => m.id === asgList[i].team_member_id);
              conflicts.push({
                memberName: member?.name || 'Assigned Crew',
                session1: s1.title,
                session2: s2.title,
                date: s1.session_date,
              });
            }
          }
        }
      }
    });

    return conflicts;
  }, [assignments, sessions, teamMembers]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const parentEvent = events.find((e) => e.id === session.event_id);
      if (!parentEvent) return false;

      if (filterEventType !== 'all' && parentEvent.event_type !== filterEventType) {
        return false;
      }

      if (filterTeamMember !== 'all') {
        const hasMember = assignments.some(
          (a) => a.session_id === session.id && a.team_member_id === filterTeamMember
        );
        if (!hasMember) return false;
      }

      return true;
    });
  }, [sessions, events, filterEventType, filterTeamMember, assignments]);

  // Calendar days grid generator for Month View
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday

    // Previous month padding
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Trailing days
    const remaining = 35 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Shoot Run-Of-Show · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-amber-400" />
            <span>Master Production Calendar</span>
          </h1>
        </div>

        {/* View Mode Segmented Control & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'month' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'agenda' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Agenda
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-semibold px-2 text-zinc-200 min-w-[130px] text-center">
              {monthYearLabel}
            </span>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Detection Banner (if any) */}
      {assignmentConflicts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-300">Scheduling Conflict Detected</div>
            {assignmentConflicts.map((c, i) => (
              <div key={i} className="text-[11px] text-red-200/90 mt-0.5">
                {c.memberName} is scheduled for overlapping sessions on {c.date}: <span className="font-medium">"{c.session1}"</span> and <span className="font-medium">"{c.session2}"</span>.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Strip */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Event Type Filter */}
        <select
          value={filterEventType}
          onChange={(e) => setFilterEventType(e.target.value)}
          aria-label="Filter events by category"
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-amber-400"
        >
          <option value="all">All Event Types</option>
          <option value="wedding">Weddings</option>
          <option value="reception">Receptions</option>
          <option value="haldi_mehendi">Haldi & Mehendi</option>
          <option value="pre_wedding">Pre-Wedding Shoots</option>
          <option value="corporate">Corporate</option>
        </select>

        {/* Team Member Filter */}
        <select
          value={filterTeamMember}
          onChange={(e) => setFilterTeamMember(e.target.value)}
          aria-label="Filter events by assigned team member"
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-amber-400"
        >
          <option value="all">All Crew Personnel</option>
          {teamMembers.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name} ({tm.role})
            </option>
          ))}
        </select>

        <div className="ml-auto text-[11px] text-zinc-300 font-mono">
          Showing {filteredSessions.length} ceremony sessions
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/80 text-center text-xs font-mono font-medium text-zinc-400 py-2.5">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-850">
            {calendarDays.map((dayItem, index) => {
              const dayStr = dayItem.date.toISOString().split('T')[0];
              const daySessions = filteredSessions.filter((s) => s.session_date === dayStr);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                    dayItem.isCurrentMonth
                      ? 'bg-zinc-950 hover:bg-zinc-900/40'
                      : 'bg-zinc-950/40 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        dayItem.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>
                    {daySessions.length > 0 && (
                      <span className="text-[10px] font-mono text-amber-400">
                        {daySessions.length} shoot{daySessions.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1 overflow-y-auto max-h-[85px]">
                    {daySessions.map((session) => {
                      const parent = events.find((e) => e.id === session.event_id);
                      return (
                        <button
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className="w-full text-left p-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-amber-400/50 transition-colors text-xs group"
                        >
                          <div className="font-medium text-zinc-200 truncate group-hover:text-amber-300">
                            {session.title}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                            {session.start_time} - {session.end_time}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {parent?.title}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const parentEvent = events.find((e) => e.id === session.event_id);
            const sessionAssignments = assignments.filter((a) => a.session_id === session.id);

            return (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">{session.title}</div>
                    <div className="text-xs text-amber-400 font-medium mt-0.5">
                      Booking: {parentEvent?.title}
                    </div>
                  </div>
                  <div className="text-left md:text-right font-mono text-xs text-zinc-300">
                    <div className="text-zinc-200 font-semibold">{session.session_date}</div>
                    <div className="text-[11px] text-zinc-400">
                      Reporting: {session.reporting_time || session.start_time} · Shoot: {session.start_time} - {session.end_time}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{session.venue_name || 'Venue TBA'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{sessionAssignments.length} Crew Assigned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.is_drone_permitted ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>FAA Drone Authorized</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500">No Drone Permitted</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                  Ceremony Session Brief
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mt-0.5">
                  {selectedSession.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-zinc-400 hover:text-zinc-200 text-xs p-1"
              >
                Close (ESC)
              </button>
            </div>

            <div className="space-y-3 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Date & Hours</span>
                <span className="font-mono text-zinc-200">
                  {selectedSession.session_date} · {selectedSession.start_time} - {selectedSession.end_time}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Crew Call Time</span>
                <span className="font-mono text-amber-400">
                  {selectedSession.reporting_time || selectedSession.start_time} Prompt
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Venue</span>
                <span className="text-zinc-200">{selectedSession.venue_name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Dress Code</span>
                <span className="text-zinc-200">{selectedSession.dress_code || 'Smart Formal'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block mb-1">Director Notes</span>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  {selectedSession.special_instructions || 'Standard multi-angle coverage.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
