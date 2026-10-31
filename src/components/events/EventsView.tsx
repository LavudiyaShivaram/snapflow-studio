import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Event, EventSession, EventType, EventStatus } from '../../lib/types';

export const EventsView: React.FC = () => {
  const { events, clients, sessions, addEvent, addSession, updateEvent, softDeleteRecord, activeTenant } = useTenant();

  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editStatus, setEditStatus] = useState<EventStatus>('confirmed');
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // New Event Form State
  const [formClientId, setFormClientId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formEventType, setFormEventType] = useState<EventType>('wedding');
  const [formStartDate, setFormStartDate] = useState('2026-11-28');
  const [formEndDate, setFormEndDate] = useState('2026-11-29');
  const [formVenue, setFormVenue] = useState('');
  const [formPrice, setFormPrice] = useState(8500);
  const [formNotes, setFormNotes] = useState('');

  // Dynamic Sessions in creation
  const [newSessions, setNewSessions] = useState<
    { title: string; date: string; start: string; end: string; reporting: string; venue: string; drone: boolean }[]
  >([
    {
      title: 'Ceremony Vows',
      date: '2026-11-28',
      start: '14:00',
      end: '16:30',
      reporting: '13:15',
      venue: '',
      drone: true,
    },
  ]);

  const currencySymbol = activeTenant?.currency_symbol || '₹';

  const filteredEvents = events.filter((e) => {
    if (selectedEventType === 'all') return true;
    return e.event_type === selectedEventType;
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formClientId) return;

    const createdEvent = await addEvent({
      client_id: formClientId,
      title: formTitle,
      event_type: formEventType,
      status: 'confirmed' as EventStatus,
      start_date: formStartDate,
      end_date: formEndDate,
      primary_venue_name: formVenue,
      total_package_price: Number(formPrice),
      lead_notes: formNotes,
    });

    // Create the sessions associated with this event
    for (const ses of newSessions) {
      if (ses.title) {
        await addSession({
          event_id: createdEvent.id,
          title: ses.title,
          session_date: ses.date || formStartDate,
          start_time: ses.start,
          end_time: ses.end,
          reporting_time: ses.reporting,
          venue_name: ses.venue || formVenue,
          is_drone_permitted: ses.drone,
        });
      }
    }

    setShowAddEventModal(false);
    setFormTitle('');
    setFormNotes('');
  };

  const addSessionRow = () => {
    setNewSessions((prev) => [
      ...prev,
      {
        title: 'Evening Reception Gala',
        date: formEndDate,
        start: '18:00',
        end: '23:30',
        reporting: '17:15',
        venue: formVenue,
        drone: false,
      },
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Production Registry · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <FolderKanban className="w-6 h-6 text-amber-400" />
            <span>Events & Multi-Day Shoots</span>
          </h1>
        </div>

        <button
          onClick={() => {
            if (clients.length > 0) setFormClientId(clients[0].id);
            setShowAddEventModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Booking</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Shoots' },
          { id: 'wedding', label: 'Weddings' },
          { id: 'reception', label: 'Receptions' },
          { id: 'haldi_mehendi', label: 'Haldi & Mehendi' },
          { id: 'pre_wedding', label: 'Pre-Wedding' },
          { id: 'corporate', label: 'Corporate' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedEventType(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
              selectedEventType === tab.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="space-y-4">
        {filteredEvents.map((evt) => {
          const client = clients.find((c) => c.id === evt.client_id);
          const evtSessions = sessions.filter((s) => s.event_id === evt.id);

          return (
            <div
              key={evt.id}
              className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-zinc-100">{evt.title}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-950 text-amber-400 border border-amber-500/20">
                      {evt.event_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-emerald-400">
                      {evt.status}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>Client: <span className="text-zinc-200">{client?.first_name} {client?.last_name}</span></span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{evt.start_date} to {evt.end_date}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{evt.primary_venue_name}</span>
                    </span>
                  </div>
                </div>

                {/* Financial Ledger Snapshot */}
                <div className="flex items-center gap-6 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase">Package Billed</div>
                    <div className="text-zinc-100 font-semibold tabular-nums text-sm">
                      {currencySymbol}{evt.total_package_price.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase">Collected</div>
                    <div className="text-emerald-400 font-semibold tabular-nums text-sm">
                      {currencySymbol}{evt.total_paid.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase">Balance Due</div>
                    <div className="text-amber-400 font-semibold tabular-nums text-sm">
                      {currencySymbol}{evt.outstanding_balance.toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(evt);
                      setEditStatus(evt.status);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-sans font-medium"
                  >
                    Manage Shoot
                  </button>
                </div>
              </div>

              {/* Ceremony Sessions List */}
              <div className="mt-4 space-y-2">
                <div className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-amber-400" />
                  <span>Ceremony Sessions ({evtSessions.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {evtSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-200 truncate">{session.title}</span>
                        {session.is_drone_permitted && (
                          <span className="text-[10px] font-mono text-amber-400">Drone</span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>Call: {session.reporting_time || session.start_time}</span>
                        <span>·</span>
                        <span>{session.start_time} - {session.end_time}</span>
                      </div>
                      <div className="text-[10px] text-zinc-300 mt-1 truncate">
                        {session.venue_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100">Schedule New Photography Booking</h3>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                <div className="font-semibold">No Clients Found</div>
                <p>
                  You need to register at least one client before creating a shoot booking. Please navigate to the
                  Client Relations tab to add your first client.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEventModal(false)}
                    className="px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Select Client *</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Event Category *</label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="wedding">Grand Wedding</option>
                    <option value="reception">Evening Reception</option>
                    <option value="haldi_mehendi">Haldi & Mehendi</option>
                    <option value="pre_wedding">Pre-Wedding Shoot</option>
                    <option value="corporate">Corporate Gala</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Event Master Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Vance & Hastings Nuptials"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Primary Venue Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Oheka Castle Estate"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Total Package Price ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Multi-Ceremony Sessions Builder */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Ceremony Sessions & Schedule</span>
                  <button
                    type="button"
                    onClick={addSessionRow}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-medium"
                  >
                    + Add Another Session
                  </button>
                </div>

                {newSessions.map((ses, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Session Title (e.g. First Look, Vows)"
                        value={ses.title}
                        onChange={(e) => {
                          const updated = [...newSessions];
                          updated[idx].title = e.target.value;
                          setNewSessions(updated);
                        }}
                        className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-100"
                      />
                      <input
                        type="date"
                        value={ses.date}
                        onChange={(e) => {
                          const updated = [...newSessions];
                          updated[idx].date = e.target.value;
                          setNewSessions(updated);
                        }}
                        className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono">
                      <input
                        type="time"
                        value={ses.reporting}
                        onChange={(e) => {
                          const updated = [...newSessions];
                          updated[idx].reporting = e.target.value;
                          setNewSessions(updated);
                        }}
                        className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-100"
                      />
                      <input
                        type="time"
                        value={ses.start}
                        onChange={(e) => {
                          const updated = [...newSessions];
                          updated[idx].start = e.target.value;
                          setNewSessions(updated);
                        }}
                        className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-100"
                      />
                      <input
                        type="time"
                        value={ses.end}
                        onChange={(e) => {
                          const updated = [...newSessions];
                          updated[idx].end = e.target.value;
                          setNewSessions(updated);
                        }}
                        className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-100"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                >
                  Confirm Shoot Booking
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Selected Event Details & Management Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div>
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                  Shoot Production Details
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mt-0.5">{selectedEvent.title}</h3>
                <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{selectedEvent.start_date} to {selectedEvent.end_date}</span>
                  <span>·</span>
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{selectedEvent.primary_venue_name}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Shoot Status</label>
                <div className="flex items-center gap-2">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as EventStatus)}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="inquiry">Inquiry</option>
                    <option value="quoted">Quoted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      await updateEvent(selectedEvent.id, { status: editStatus });
                      setSelectedEvent({ ...selectedEvent, status: editStatus });
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                  >
                    Update Status
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                <div className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">Financial Summary</div>
                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div>
                    <div className="text-zinc-400 text-[10px]">Package</div>
                    <div className="text-zinc-100 font-semibold">{currencySymbol}{selectedEvent.total_package_price.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-zinc-400 text-[10px]">Collected</div>
                    <div className="text-emerald-400 font-semibold">{currencySymbol}{selectedEvent.total_paid.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-zinc-400 text-[10px]">Outstanding</div>
                    <div className="text-amber-400 font-semibold">{currencySymbol}{selectedEvent.outstanding_balance.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {selectedEvent.lead_notes && (
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-300">
                  <div className="text-[10px] uppercase font-mono text-zinc-400 mb-1">Production Notes</div>
                  <p>{selectedEvent.lead_notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={async () => {
                    await softDeleteRecord('events', selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium"
                >
                  Archive Booking
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
