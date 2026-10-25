import React from 'react';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  Plus,
  Shield,
  Users,
  MapPin,
  Clock,
  Sparkles,
  X,
  Camera,
} from 'lucide-react';
import { useTenant, UserWorkspaceInfo } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

interface WorkspaceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNewStudio: () => void;
}

export const WorkspaceSelectionModal: React.FC<WorkspaceSelectionModalProps> = ({
  isOpen,
  onClose,
  onCreateNewStudio,
}) => {
  const { userWorkspaces, activeTenant, switchTenant } = useTenant();
  const { user, isDemoMode } = useAuth();

  if (!isOpen) return null;

  const currentTenantId = activeTenant?.tenant_id || activeTenant?.id;

  const handleSelectWorkspace = (workspace: UserWorkspaceInfo) => {
    const targetId = workspace.tenant.tenant_id || workspace.tenant.id;
    if (targetId) {
      switchTenant(targetId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto font-sans selection:bg-amber-500/20 selection:text-amber-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-zinc-100 tracking-tight">
                Select Photography Workspace
              </h2>
              <p className="text-xs text-zinc-400">
                You have authorized access to {userWorkspaces.length} studio {userWorkspaces.length === 1 ? 'workspace' : 'workspaces'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspaces List */}
        <div className="py-5 space-y-3">
          {userWorkspaces.map((workspace) => {
            const wsTenant = workspace.tenant;
            const wsTenantId = wsTenant.tenant_id || wsTenant.id;
            const isCurrent = wsTenantId === currentTenantId;

            return (
              <div
                key={wsTenantId}
                onClick={() => handleSelectWorkspace(workspace)}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-500/5'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Studio Logo / Badge */}
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-center shrink-0 overflow-hidden">
                    {wsTenant.logo_url ? (
                      <img
                        src={wsTenant.logo_url}
                        alt={wsTenant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100 truncate">
                        {wsTenant.name}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Active Workspace
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="capitalize text-zinc-300 font-medium">{workspace.role}</span>
                      </div>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        <span>{wsTenant.city || 'Mumbai'}, {wsTenant.country || 'India'}</span>
                      </div>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-zinc-400" />
                        <span>{workspace.memberCount} crew</span>
                      </div>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-zinc-400">{wsTenant.currency || 'INR'} ({wsTenant.currency_symbol || '₹'})</span>
                    </div>
                  </div>
                </div>

                {/* Switch Action */}
                <div className="shrink-0">
                  {isCurrent ? (
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Selected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-zinc-100 transition-colors">
                      <span className="hidden sm:inline">Switch</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-zinc-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewStudio();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Another Studio</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/10"
          >
            Continue in Active Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
