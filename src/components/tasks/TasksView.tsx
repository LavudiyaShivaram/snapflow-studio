import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Clock,
  AlertCircle,
  Calendar,
  X,
  Filter,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Task } from '../../lib/types';

export const TasksView: React.FC = () => {
  const { tasks, events, toggleTask, activeTenant } = useTenant();

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'pending' && t.is_completed) return false;
    if (filterStatus === 'completed' && !t.is_completed) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Pre-Shoot Protocol & Logistics · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            <span>Tasks, Gear Checks & Reminders</span>
          </h1>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pending Actions ({tasks.filter((t) => !t.is_completed).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === 'completed' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Completed ({tasks.filter((t) => t.is_completed).length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({tasks.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs bg-zinc-900/30 rounded-xl border border-zinc-850">
            No matching tasks found. All checklists up to date!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const evt = events.find((e) => e.id === task.event_id);
            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  task.is_completed
                    ? 'bg-zinc-950/40 border-zinc-850/60 opacity-60'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-amber-400 hover:text-amber-300 shrink-0"
                >
                  {task.is_completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-sm font-medium ${
                        task.is_completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        task.priority === 'urgent'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : task.priority === 'high'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{task.description}</p>
                  )}

                  <div className="mt-2.5 flex items-center gap-3 text-xs text-zinc-300 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Due: {task.due_date}</span>
                    </span>
                    {evt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">Shoot: {evt.title}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
