import React, { useState } from 'react';
import {
  Film,
  CheckCircle2,
  Clock,
  HardDrive,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { EditingStage, EditingProject } from '../../lib/types';

const STAGES: { id: EditingStage; label: string; step: number }[] = [
  { id: 'backup_verified', label: 'Media Backup', step: 1 },
  { id: 'photo_selection', label: 'Photo Culling', step: 2 },
  { id: 'photo_retouching', label: 'Color & Retouch', step: 3 },
  { id: 'video_teaser', label: 'Video Teaser', step: 4 },
  { id: 'video_feature', label: 'Feature Film', step: 5 },
  { id: 'album_design', label: 'Album Layout', step: 6 },
  { id: 'client_review', label: 'Client Review', step: 7 },
  { id: 'revisions', label: 'Revisions', step: 8 },
  { id: 'completed', label: 'Master Delivered', step: 9 },
];

export const ProductionView: React.FC = () => {
  const { editingProjects, events, teamMembers, updateEditingStage, activeTenant } = useTenant();

  const [selectedProject, setSelectedProject] = useState<EditingProject | null>(
    editingProjects[0] || null
  );

  const getStageIndex = (stage: EditingStage) => {
    return STAGES.findIndex((s) => s.id === stage);
  };

  const advanceStage = async (project: EditingProject) => {
    const currentIndex = getStageIndex(project.current_stage);
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1].id;
      await updateEditingStage(project.id, nextStage);
      if (selectedProject?.id === project.id) {
        setSelectedProject({ ...project, current_stage: nextStage });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Post-Production Engine · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <Film className="w-6 h-6 text-amber-400" />
            <span>Editing Pipeline & Client Deliverables</span>
          </h1>
        </div>
      </div>

      {/* Pipeline Stage Bar */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-3">
          Standard 9-Stage Post-Production Workflow
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1 text-[11px] font-mono">
          {STAGES.map((s) => (
            <div
              key={s.id}
              className="p-2 rounded bg-zinc-950/80 border border-zinc-850 text-center"
            >
              <span className="text-amber-400 block text-[10px]">0{s.step}</span>
              <span className="text-zinc-300 font-sans truncate block">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editing Projects Cards */}
      <div className="space-y-4">
        {editingProjects.map((project) => {
          const evt = events.find((e) => e.id === project.event_id);
          const editor = teamMembers.find((m) => m.id === project.lead_editor_id);
          const currentStageIndex = getStageIndex(project.current_stage);

          return (
            <div
              key={project.id}
              className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-zinc-100">{evt?.title || 'Wedding Film'}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {project.current_stage.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>Lead Editor: <span className="text-zinc-200">{editor?.name || 'Assigned Editor'}</span></span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Target Delivery: {project.deadline_date}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{project.revision_count} Revisions Logged</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => advanceStage(project)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors"
                  >
                    <span>Advance Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-300"
                    style={{ width: `${((currentStageIndex + 1) / STAGES.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Production Metadata Strip */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {project.color_grade_notes && (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-300">
                    <span className="text-zinc-400 block text-[10px] font-mono uppercase mb-0.5">
                      Color Grading & LUT Profile
                    </span>
                    <p className="line-clamp-2">{project.color_grade_notes}</p>
                  </div>
                )}

                {project.backup_disk_label && (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-300 flex items-center justify-between font-mono">
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase">Cold Storage Archive</span>
                      <span className="text-zinc-200">{project.backup_disk_label}</span>
                    </div>
                    <HardDrive className="w-4 h-4 text-amber-400" />
                  </div>
                )}
              </div>

              {/* Deliverable Links */}
              {project.deliverables && project.deliverables.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    Published Client Delivery Links
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {project.deliverables.map((del) => (
                      <div
                        key={del.id}
                        className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800 text-xs flex items-center justify-between"
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium text-zinc-200 truncate">{del.title}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            Type: {del.deliverable_type.replace('_', ' ')} · Status: {del.status}
                          </div>
                        </div>
                        {del.delivery_url && (
                          <a
                            href={del.delivery_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-amber-400 hover:text-amber-300 shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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
  );
};
