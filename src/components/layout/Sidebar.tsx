import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FolderKanban,
  UserCheck,
  Receipt,
  Film,
  CheckSquare,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenOnboarding: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenOnboarding,
}) => {
  const { activeTenant, activeRole, events, tasks } = useTenant();

  const pendingTasksCount = tasks.filter((t) => !t.is_completed).length;
  const activeEventsCount = events.filter((e) => e.status === 'confirmed' || e.status === 'in_progress').length;

  const navItems = [
    { id: 'dashboard', label: 'Studio Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Shoots Calendar', icon: Calendar, badge: activeEventsCount ? `${activeEventsCount}` : undefined },
    { id: 'clients', label: 'Client CRM', icon: Users },
    { id: 'events', label: 'Events & Shoots', icon: FolderKanban },
    { id: 'team', label: 'Crew & Dispatch', icon: UserCheck },
    { id: 'commercial', label: 'Quotes & Finance', icon: Receipt },
    { id: 'production', label: 'Editing Pipeline', icon: Film },
    { id: 'tasks', label: 'Tasks & Checklists', icon: CheckSquare, badge: pendingTasksCount ? `${pendingTasksCount}` : undefined },
    { id: 'reports', label: 'Studio Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Studio Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-850 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      {/* Studio Header Card */}
      <div className="p-4 border-b border-zinc-900">
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="text-[11px] font-mono tracking-wider text-amber-400 uppercase">
            Active Workspace
          </div>
          <div className="text-sm font-semibold text-zinc-100 truncate mt-0.5">
            {activeTenant?.name}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="capitalize">{activeTenant?.business_type.replace('_', ' ')}</span>
            <span>·</span>
            <span className="uppercase text-amber-500/90 font-mono text-[10px]">
              {activeRole}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono tabular-nums text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Studio Upgrade & Quick Onboarding Link */}
      <div className="p-4 border-t border-zinc-900">
        <div className="p-3 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Pro Plan</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
            Unlimited shoot sessions, WhatsApp freelancer dispatch & 4K client galleries.
          </p>
          <button
            onClick={onOpenOnboarding}
            className="w-full py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-[11px] font-medium transition-colors border border-zinc-700/60"
          >
            Launch Another Studio
          </button>
        </div>
      </div>
    </aside>
  );
};
