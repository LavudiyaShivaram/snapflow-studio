import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  FileText,
  Calendar,
  X,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Client } from '../../lib/types';

export const ClientsView: React.FC = () => {
  const { clients, events, payments, quotations, addClient, updateClient, softDeleteRecord, activeTenant } = useTenant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    partner_first_name: '',
    partner_last_name: '',
    phone: '',
    city: '',
    notes: '',
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // New Client Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    partner_first_name: '',
    partner_last_name: '',
    email: '',
    phone: '',
    city: activeTenant?.city || '',
    source: 'Referral',
    notes: '',
  });

  const currencySymbol = activeTenant?.currency_symbol || '₹';

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const partnerName = `${c.partner_first_name || ''} ${c.partner_last_name || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      partnerName.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.email) return;

    await addClient({
      first_name: formData.first_name,
      last_name: formData.last_name,
      partner_first_name: formData.partner_first_name || null,
      partner_last_name: formData.partner_last_name || null,
      email: formData.email,
      phone: formData.phone || null,
      city: formData.city || null,
      source: formData.source,
      notes: formData.notes,
    });

    setShowAddModal(false);
    setFormData({
      first_name: '',
      last_name: '',
      partner_first_name: '',
      partner_last_name: '',
      email: '',
      phone: '',
      city: activeTenant?.city || '',
      source: 'Referral',
      notes: '',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Client Relations & CRM · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Client Directory & Histories</span>
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search & Counter Strip */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by client or partner name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="text-xs font-mono text-zinc-400">
          Total: <span className="text-zinc-100 font-semibold">{filteredClients.length}</span> Clients
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientEvents = events.filter((e) => e.client_id === client.id);
          const clientPayments = payments.filter((p) => p.client_id === client.id);
          const totalSpent = clientPayments.reduce((sum, p) => sum + p.amount, 0);

          return (
            <div
              key={client.id}
              className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-sm">
                      {client.first_name} {client.last_name}
                    </h3>
                    {client.partner_first_name && (
                      <div className="text-xs text-amber-400/90 font-medium mt-0.5">
                        & {client.partner_first_name} {client.partner_last_name}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {client.source || 'Direct'}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{client.city}</span>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <p className="mt-3 text-[11px] text-zinc-300 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-850 line-clamp-2">
                    {client.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-zinc-400 text-[10px] block">LIFETIME BOOKINGS</span>
                  <span className="text-zinc-200 font-semibold">{clientEvents.length} Shoots</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 text-[10px] block">TOTAL BILLED</span>
                  <span className="text-amber-400 font-semibold tabular-nums">
                    {currencySymbol}{totalSpent.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedClient(client)}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs transition-colors"
                >
                  History
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100">Add New Studio Client</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Primary First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Primary Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Partner First Name</label>
                  <input
                    type="text"
                    value={formData.partner_first_name}
                    onChange={(e) => setFormData({ ...formData, partner_first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Partner Last Name</label>
                  <input
                    type="text"
                    value={formData.partner_last_name}
                    onChange={(e) => setFormData({ ...formData, partner_last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Acquisition Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Referral">Referral / Word of Mouth</option>
                    <option value="Instagram">Instagram / TikTok</option>
                    <option value="WeddingWire">WeddingWire / The Knot</option>
                    <option value="Website">Studio Website</option>
                    <option value="Planner">Wedding Planner Referral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Initial Brief / Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special requests, wedding venues, style preferences..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Full History Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div>
                <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                  Client Profile & Ledger
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mt-0.5">
                  {selectedClient.first_name} {selectedClient.last_name}
                  {selectedClient.partner_first_name && (
                    <span className="text-zinc-400 font-normal">
                      {' '}
                      & {selectedClient.partner_first_name} {selectedClient.partner_last_name}
                    </span>
                  )}
                </h3>
                <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                  <span>{selectedClient.email}</span>
                  <span>·</span>
                  <span>{selectedClient.phone || 'No phone'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bookings with this Client */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Associated Shoot Bookings</span>
              </h4>
              {events
                .filter((e) => e.client_id === selectedClient.id)
                .map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200">{evt.title}</div>
                      <div className="text-zinc-400 mt-0.5">
                        {evt.start_date} · {evt.primary_venue_name}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-amber-400 font-semibold">
                        {currencySymbol}{evt.total_package_price.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-zinc-300">
                        Paid: {currencySymbol}{evt.total_paid.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Payments History */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payment Records</span>
              </h4>
              {payments
                .filter((p) => p.client_id === selectedClient.id)
                .map((pay) => (
                  <div
                    key={pay.id}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs flex items-center justify-between font-mono"
                  >
                    <div>
                      <span className="text-zinc-200 font-medium capitalize">{pay.payment_stage.replace('_', ' ')}</span>
                      <span className="text-zinc-400 text-[11px] ml-2">via {pay.payment_method}</span>
                      <div className="text-zinc-400 text-[10px] mt-0.5">{pay.notes || pay.reference_number}</div>
                    </div>
                    <div className="text-emerald-400 font-semibold">
                      +{currencySymbol}{pay.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>

            {isEditingSelected ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedClient) return;
                  const updated = await updateClient(selectedClient.id, editFormData);
                  setSelectedClient(updated);
                  setIsEditingSelected(false);
                }}
                className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
              >
                <div className="font-semibold text-zinc-200">Edit Client Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Partner First Name</label>
                    <input
                      type="text"
                      value={editFormData.partner_first_name}
                      onChange={(e) => setEditFormData({ ...editFormData, partner_first_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Partner Last Name</label>
                    <input
                      type="text"
                      value={editFormData.partner_last_name}
                      onChange={(e) => setEditFormData({ ...editFormData, partner_last_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">City</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">CRM Notes</label>
                  <textarea
                    rows={2}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSelected(false)}
                    className="px-3 py-1 rounded bg-zinc-800 text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : null}

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                {!isEditingSelected && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditFormData({
                        first_name: selectedClient.first_name,
                        last_name: selectedClient.last_name,
                        partner_first_name: selectedClient.partner_first_name || '',
                        partner_last_name: selectedClient.partner_last_name || '',
                        phone: selectedClient.phone || '',
                        city: selectedClient.city || '',
                        notes: selectedClient.notes || '',
                      });
                      setIsEditingSelected(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-amber-400 text-xs font-medium"
                  >
                    Edit Client
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await softDeleteRecord('clients', selectedClient.id);
                    setSelectedClient(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20"
                >
                  Archive Client
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedClient(null);
                  setIsEditingSelected(false);
                }}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
