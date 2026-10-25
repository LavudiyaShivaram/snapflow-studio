import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Star,
  Copy,
  Check,
  MessageCircle,
  Briefcase,
  Camera,
  X,
  Search,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { TeamMember, TenantRole } from '../../lib/types';

export const TeamView: React.FC = () => {
  const { teamMembers, sessions, events, addTeamMember, activeTenant } = useTenant();

  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'freelancer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFreelancerForDispatch, setSelectedFreelancerForDispatch] = useState<TeamMember | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'photographer' as TenantRole,
    is_freelancer: true,
    day_rate: 850,
    hourly_rate: 100,
    gear_list: '',
    skills: 'Candid Photography, Drone Pilot',
  });

  const currencySymbol = activeTenant?.currency_symbol || '₹';

  const filteredMembers = teamMembers.filter((m) => {
    if (activeTab === 'staff' && m.is_freelancer) return false;
    if (activeTab === 'freelancer' && !m.is_freelancer) return false;

    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.gear_list && m.gear_list.toLowerCase().includes(q))
    );
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    await addTeamMember({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      role: formData.role,
      is_freelancer: formData.is_freelancer,
      day_rate: Number(formData.day_rate),
      hourly_rate: Number(formData.hourly_rate),
      gear_list: formData.gear_list || null,
      rating: 5.0,
      is_active: true,
      skills: formData.skills.split(',').map((s) => s.trim()),
    });

    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'photographer',
      is_freelancer: true,
      day_rate: 850,
      hourly_rate: 100,
      gear_list: '',
      skills: 'Candid Photography, Drone Pilot',
    });
  };

  const generateWhatsAppDispatch = (member: TeamMember, session = sessions[0], event = events[0]) => {
    return `Hi ${member.name}! 📸 SnapFlow Studio has a shoot opening for *${event?.title || 'Upcoming Wedding'}* on *${session?.session_date || 'Saturday'}*.
Call time is *${session?.reporting_time || '09:00'}* at *${session?.venue_name || 'Studio Estate'}*.
Agreed fee is *${currencySymbol}${member.day_rate || 800}*.
Please reply YES to confirm your dispatch!`;
  };

  const copyDispatchMessage = (member: TeamMember) => {
    const text = generateWhatsAppDispatch(member);
    navigator.clipboard.writeText(text);
    setCopiedMessageId(member.id);
    setTimeout(() => setCopiedMessageId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Talent & Dispatch Registry · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-amber-400" />
            <span>Crew Directory & Freelancer Dispatch</span>
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Crew Member</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Crew ({teamMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'staff'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Studio Staff ({teamMembers.filter((m) => !m.is_freelancer).length})
          </button>
          <button
            onClick={() => setActiveTab('freelancer')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'freelancer'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Freelancers ({teamMembers.filter((m) => m.is_freelancer).length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, skill, equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Crew Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">{member.name}</h3>
                  <div className="text-xs text-amber-400 font-medium capitalize mt-0.5">
                    {member.role} {member.is_freelancer ? '(Freelancer)' : '(Core Staff)'}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{member.rating || '5.0'}</span>
                </div>
              </div>

              {/* Rate Card */}
              <div className="mt-3 py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 block">DAY RATE</span>
                  <span className="text-zinc-100 font-semibold tabular-nums">
                    {currencySymbol}{member.day_rate || 0}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">HOURLY</span>
                  <span className="text-zinc-300 font-semibold tabular-nums">
                    {currencySymbol}{member.hourly_rate || 0}/hr
                  </span>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-3 space-y-1 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{member.phone}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
              </div>

              {/* Gear Inventory */}
              {member.gear_list && (
                <div className="mt-3 text-[11px] text-zinc-300 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
                  <span className="text-zinc-400 block mb-0.5 font-mono text-[10px] uppercase">Gear Kit</span>
                  <p className="line-clamp-2">{member.gear_list}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions: WhatsApp Dispatch */}
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400">
                STATUS: {member.is_active ? 'ACTIVE' : 'ON LEAVE'}
              </span>

              <button
                onClick={() => copyDispatchMessage(member)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-colors"
                title="Copy ready-to-send WhatsApp shoot booking message"
              >
                {copiedMessageId === member.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Brief!</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>WhatsApp Brief</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100">Add Crew or Freelancer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Julian Thorne"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Role Specialization *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as TenantRole })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="photographer">Lead Photographer</option>
                    <option value="videographer">Cinema Videographer</option>
                    <option value="editor">Post-Production Editor</option>
                    <option value="freelancer">Drone Operator / Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Employment Type</label>
                  <select
                    value={formData.is_freelancer ? 'freelance' : 'staff'}
                    onChange={(e) => setFormData({ ...formData, is_freelancer: e.target.value === 'freelance' })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="freelance">External Freelancer</option>
                    <option value="staff">Internal Studio Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Day Rate ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.day_rate}
                    onChange={(e) => setFormData({ ...formData, day_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Hourly Rate ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Phone Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Camera Gear & Equipment Kit</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sony A1, 35mm f/1.4 GM, Profoto A10 lights..."
                  value={formData.gear_list}
                  onChange={(e) => setFormData({ ...formData, gear_list: e.target.value })}
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
                  Save Crew Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
