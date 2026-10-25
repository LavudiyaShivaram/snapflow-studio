import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  Tenant,
  TenantMember,
  TenantRole,
  Client,
  Event,
  EventSession,
  TeamMember,
  TeamAssignment,
  Package,
  Quotation,
  Payment,
  Expense,
  EditingProject,
  EditingStage,
  Task,
  MessageTemplate,
} from '../lib/types';
import {
  DEMO_TENANTS,
  DEMO_MEMBERSHIPS,
  DEMO_CLIENTS,
  DEMO_EVENTS,
  DEMO_SESSIONS,
  DEMO_TEAM_MEMBERS,
  DEMO_ASSIGNMENTS,
  DEMO_PACKAGES,
  DEMO_QUOTATIONS,
  DEMO_PAYMENTS,
  DEMO_EXPENSES,
  DEMO_EDITING_PROJECTS,
  DEMO_TASKS,
  DEMO_TEMPLATES,
} from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface TenantContextType {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  activeRole: TenantRole;
  memberships: TenantMember[];
  switchTenant: (tenantId: string) => void;
  createTenant: (tenantData: Partial<Tenant>) => Promise<Tenant>;
  
  // Isolated data scoped strictly to activeTenant.tenant_id and NOT soft-deleted
  clients: Client[];
  events: Event[];
  sessions: EventSession[];
  teamMembers: TeamMember[];
  assignments: TeamAssignment[];
  packages: Package[];
  quotations: Quotation[];
  payments: Payment[];
  expenses: Expense[];
  editingProjects: EditingProject[];
  tasks: Task[];
  templates: MessageTemplate[];

  // Mutations
  addClient: (clientData: Omit<Client, 'client_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'is_archived'>) => Promise<Client>;
  addEvent: (eventData: Omit<Event, 'event_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'total_paid' | 'outstanding_balance'>) => Promise<Event>;
  addSession: (sessionData: Omit<EventSession, 'event_session_id' | 'id' | 'tenant_id' | 'created_at'>) => Promise<EventSession>;
  addTeamMember: (memberData: Omit<TeamMember, 'team_member_id' | 'id' | 'tenant_id' | 'created_at'>) => Promise<TeamMember>;
  assignCrew: (assignmentData: Omit<TeamAssignment, 'team_assignment_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => Promise<TeamAssignment>;
  recordPayment: (paymentData: Omit<Payment, 'payment_id' | 'id' | 'tenant_id' | 'created_at'>) => Promise<Payment>;
  recordExpense: (expenseData: Omit<Expense, 'expense_id' | 'id' | 'tenant_id' | 'created_at'>) => Promise<Expense>;
  updateEditingStage: (projectId: string, stage: EditingStage) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  createQuotation: (quoteData: Omit<Quotation, 'quotation_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => Promise<Quotation>;
  softDeleteRecord: (entityType: 'clients' | 'events' | 'sessions' | 'team_members' | 'tasks' | 'payments' | 'expenses' | 'packages' | 'quotations', entityId: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Stored state
  const [tenants, setTenants] = useState<Tenant[]>(DEMO_TENANTS);
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return localStorage.getItem('snapflow_active_tenant_id') || DEMO_TENANTS[0].tenant_id || DEMO_TENANTS[0].id!;
  });

  // Database-backed or local state
  const [allClients, setAllClients] = useState<Client[]>(DEMO_CLIENTS);
  const [allEvents, setAllEvents] = useState<Event[]>(DEMO_EVENTS);
  const [allSessions, setAllSessions] = useState<EventSession[]>(DEMO_SESSIONS);
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>(DEMO_TEAM_MEMBERS);
  const [allAssignments, setAllAssignments] = useState<TeamAssignment[]>(DEMO_ASSIGNMENTS);
  const [allPackages, setAllPackages] = useState<Package[]>(DEMO_PACKAGES);
  const [allQuotations, setAllQuotations] = useState<Quotation[]>(DEMO_QUOTATIONS);
  const [allPayments, setAllPayments] = useState<Payment[]>(DEMO_PAYMENTS);
  const [allExpenses, setAllExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [allEditingProjects, setAllEditingProjects] = useState<EditingProject[]>(DEMO_EDITING_PROJECTS);
  const [allTasks, setAllTasks] = useState<Task[]>(DEMO_TASKS);
  const [allTemplates] = useState<MessageTemplate[]>(DEMO_TEMPLATES);

  // Active Tenant resolution
  const activeTenant = useMemo(() => {
    return tenants.find((t) => (t.tenant_id === activeTenantId || t.id === activeTenantId)) || tenants[0] || null;
  }, [tenants, activeTenantId]);

  const activeTenantKey = activeTenant?.tenant_id || activeTenant?.id;

  // Active user's role in active tenant
  const activeRole: TenantRole = useMemo(() => {
    if (!user || !activeTenantKey) return 'photographer';
    const membership = DEMO_MEMBERSHIPS.find(
      (m) => m.tenant_id === activeTenantKey && m.user_id === user.id
    );
    return membership ? membership.role : 'owner';
  }, [user, activeTenantKey]);

  const switchTenant = (tenantId: string) => {
    const target = tenants.find((t) => t.tenant_id === tenantId || t.id === tenantId);
    if (target) {
      const resolvedId = target.tenant_id || target.id!;
      setActiveTenantId(resolvedId);
      localStorage.setItem('snapflow_active_tenant_id', resolvedId);
    }
  };

  const createTenant = async (tenantData: Partial<Tenant>): Promise<Tenant> => {
    const newId = `tenant-${Date.now()}`;
    const now = new Date().toISOString();
    const newTenant: Tenant = {
      tenant_id: newId,
      id: newId,
      name: tenantData.name || 'New Photography Studio',
      slug: (tenantData.name || 'new-studio').toLowerCase().replace(/\s+/g, '-'),
      business_type: tenantData.business_type || 'wedding_portrait',
      currency: tenantData.currency || 'INR',
      currency_symbol: tenantData.currency_symbol || '₹',
      timezone: tenantData.timezone || 'Asia/Kolkata',
      date_format: tenantData.date_format || 'DD/MM/YYYY',
      phone: tenantData.phone || '',
      email: tenantData.email || '',
      website: tenantData.website || '',
      address: tenantData.address || '',
      city: tenantData.city || 'Mumbai',
      country: tenantData.country || 'India',
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('tenants').insert([newTenant]);
        if (user) {
          await supabase.from('tenant_members').insert([
            {
              tenant_member_id: `tm-mem-${Date.now()}`,
              tenant_id: newId,
              user_id: user.id,
              role: 'owner',
              is_active: true,
              inserted_by: user.id,
              inserted_date: now,
              updated_by: user.id,
              updated_date: now,
            },
          ]);
        }
      } catch (err) {
        console.warn('Supabase tenant creation fallback:', err);
      }
    }

    setTenants((prev) => [...prev, newTenant]);
    setActiveTenantId(newId);
    localStorage.setItem('snapflow_active_tenant_id', newId);
    return newTenant;
  };

  // STRICT TENANT ISOLATION & SOFT-DELETE FILTERS:
  // Zero records from another tenant or soft-deleted records (deleted_date IS NOT NULL) are allowed into the workspace scope
  const clients = useMemo(() => {
    return allClients.filter((c) => c.tenant_id === activeTenantKey && !c.is_archived && !c.deleted_date);
  }, [allClients, activeTenantKey]);

  const events = useMemo(() => {
    return allEvents.filter((e) => e.tenant_id === activeTenantKey && !e.deleted_date);
  }, [allEvents, activeTenantKey]);

  const sessions = useMemo(() => {
    return allSessions.filter((s) => s.tenant_id === activeTenantKey && !s.deleted_date);
  }, [allSessions, activeTenantKey]);

  const teamMembers = useMemo(() => {
    return allTeamMembers.filter((tm) => tm.tenant_id === activeTenantKey && !tm.deleted_date);
  }, [allTeamMembers, activeTenantKey]);

  const assignments = useMemo(() => {
    return allAssignments.filter((a) => a.tenant_id === activeTenantKey && !a.deleted_date);
  }, [allAssignments, activeTenantKey]);

  const packages = useMemo(() => {
    return allPackages.filter((p) => p.tenant_id === activeTenantKey && !p.deleted_date);
  }, [allPackages, activeTenantKey]);

  const quotations = useMemo(() => {
    return allQuotations.filter((q) => q.tenant_id === activeTenantKey && !q.deleted_date);
  }, [allQuotations, activeTenantKey]);

  const payments = useMemo(() => {
    return allPayments.filter((p) => p.tenant_id === activeTenantKey && !p.deleted_date);
  }, [allPayments, activeTenantKey]);

  const expenses = useMemo(() => {
    return allExpenses.filter((ex) => ex.tenant_id === activeTenantKey && !ex.deleted_date);
  }, [allExpenses, activeTenantKey]);

  const editingProjects = useMemo(() => {
    return allEditingProjects.filter((ep) => ep.tenant_id === activeTenantKey && !ep.deleted_date);
  }, [allEditingProjects, activeTenantKey]);

  const tasks = useMemo(() => {
    return allTasks.filter((t) => t.tenant_id === activeTenantKey && !t.deleted_date);
  }, [allTasks, activeTenantKey]);

  const templates = useMemo(() => {
    return allTemplates.filter((tpl) => tpl.tenant_id === activeTenantKey && !tpl.deleted_date);
  }, [allTemplates, activeTenantKey]);

  // Mutations with suffixed primary keys & full audit columns
  const addClient = async (clientData: Omit<Client, 'client_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'is_archived'>): Promise<Client> => {
    if (!activeTenantKey) throw new Error('No active studio selected');
    const newId = `c1111111-${Date.now().toString().slice(-12)}`;
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      client_id: newId,
      id: newId,
      tenant_id: activeTenantKey,
      is_archived: false,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('clients').insert([newClient]);
      } catch (err) {
        console.warn('Supabase client insert error:', err);
      }
    }

    setAllClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const addEvent = async (eventData: Omit<Event, 'event_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'total_paid' | 'outstanding_balance'>): Promise<Event> => {
    if (!activeTenantKey) throw new Error('No active studio selected');
    const newId = `e1111111-${Date.now().toString().slice(-12)}`;
    const now = new Date().toISOString();
    const newEvent: Event = {
      ...eventData,
      event_id: newId,
      id: newId,
      tenant_id: activeTenantKey,
      total_paid: 0,
      outstanding_balance: eventData.total_package_price,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('events').insert([newEvent]);
      } catch (err) {
        console.warn('Supabase event insert error:', err);
      }
    }

    setAllEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  const addSession = async (sessionData: Omit<EventSession, 'event_session_id' | 'id' | 'tenant_id' | 'created_at'>): Promise<EventSession> => {
    if (!activeTenantKey) throw new Error('No active studio selected');
    const newId = `s1111111-${Date.now().toString().slice(-12)}`;
    const now = new Date().toISOString();
    const newSession: EventSession = {
      ...sessionData,
      event_session_id: newId,
      id: newId,
      tenant_id: activeTenantKey,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('event_sessions').insert([newSession]);
      } catch (err) {
        console.warn('Supabase session insert error:', err);
      }
    }

    setAllSessions((prev) => [...prev, newSession]);
    return newSession;
  };

  const addTeamMember = async (memberData: Omit<TeamMember, 'team_member_id' | 'id' | 'tenant_id' | 'created_at'>): Promise<TeamMember> => {
    if (!activeTenantKey) throw new Error('No active studio selected');
    const newId = `tm111111-${Date.now().toString().slice(-12)}`;
    const now = new Date().toISOString();
    const newMember: TeamMember = {
      ...memberData,
      team_member_id: newId,
      id: newId,
      tenant_id: activeTenantKey,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('team_members').insert([newMember]);
      } catch (err) {
        console.warn('Supabase member insert error:', err);
      }
    }

    setAllTeamMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  const assignCrew = async (assignmentData: Omit<TeamAssignment, 'team_assignment_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<TeamAssignment> => {
    if (!activeTenantKey) throw new Error('No active studio selected');
    const newId = `ta111111-${Date.now().toString().slice(-12)}`;
    const now = new Date().toISOString();
    const newAssignment: TeamAssignment = {
      ...assignmentData,
      team_assignment_id: newId,
      id: newId,
      tenant_id: activeTenantKey,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('team_assignments').insert([newAssignment]);
      } catch (err) {
        console.warn('Supabase assignment insert error:', err);
      }
    }

    setAllAssignments((prev) => [...prev, newAssignment]);
    return newAssignment;
  };

  const recordPayment = async (paymentData: Omit<Payment, 'payment_id' | 'id' | 'tenant_id' | 'created_at'>): Promise<Payment> => {
    if (!activeTenantKey) throw new Error('No active studio selected');
    const newId = `pay1111-${Date.now().toString().slice(-12)}`;
    const now = new Date().toISOString();
    const newPayment: Payment = {
      ...paymentData,
      payment_id: newId,
      id: newId,
      tenant_id: activeTenantKey,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('payments').insert([newPayment]);
      } catch (err) {
        console.warn('Supabase payment insert error:', err);
      }
    }

    setAllPayments((prev) => [newPayment, ...prev]);

    // Recalculate event paid total
    setAllEvents((prev) =>
      prev.map((e) => {
        if ((e.event_id === paymentData.event_id || e.id === paymentData.event_id) && e.tenant_id === activeTenantKey) {
          const updatedPaid = e.total_paid + paymentData.amount;
          return {
            ...e,
            total_paid: updatedPaid,
            outstanding_balance: Math.max(0, e.total_package_price - updatedPaid),
            updated_date: now,
          };
        }
        return e;
      })
    );

    return newPayment;
  };

  const recordExpense = async (expenseData: Omit<Expense, 'expense_id' | 'id' | 'tenant_id' | 'created_at'>): Promise<Expense> => {
    if (!activeTenantKey) throw new Error('No active studio selected');
    const newId = `exp1111-${Date.now().toString().slice(-12)}`;
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expenseData,
      expense_id: newId,
      id: newId,
      tenant_id: activeTenantKey,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('expenses').insert([newExpense]);
      } catch (err) {
        console.warn('Supabase expense insert error:', err);
      }
    }

    setAllExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const updateEditingStage = async (projectId: string, stage: EditingStage): Promise<void> => {
    const now = new Date().toISOString();
    setAllEditingProjects((prev) =>
      prev.map((ep) => ((ep.editing_project_id === projectId || ep.id === projectId) ? { ...ep, current_stage: stage, revision_count: ep.revision_count + 1, updated_date: now } : ep))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('editing_projects').update({ current_stage: stage, updated_date: now }).eq('editing_project_id', projectId);
      } catch (err) {
        console.warn('Supabase editing project update error:', err);
      }
    }
  };

  const toggleTask = async (taskId: string): Promise<void> => {
    const now = new Date().toISOString();
    setAllTasks((prev) =>
      prev.map((t) =>
        (t.task_id === taskId || t.id === taskId)
          ? {
              ...t,
              is_completed: !t.is_completed,
              completed_at: !t.is_completed ? now : null,
              updated_date: now,
            }
          : t
      )
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const target = allTasks.find((t) => t.task_id === taskId || t.id === taskId);
        if (target) {
          await supabase.from('tasks').update({ is_completed: !target.is_completed, updated_date: now }).eq('task_id', taskId);
        }
      } catch (err) {
        console.warn('Supabase task toggle error:', err);
      }
    }
  };

  const createQuotation = async (quoteData: Omit<Quotation, 'quotation_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Quotation> => {
    if (!activeTenantKey) throw new Error('No active studio selected');
    const newId = `q-${Date.now()}`;
    const now = new Date().toISOString();
    const newQuote: Quotation = {
      ...quoteData,
      quotation_id: newId,
      id: newId,
      tenant_id: activeTenantKey,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
      deleted_by: null,
      deleted_date: null,
      created_at: now,
      updated_at: now,
    };

    setAllQuotations((prev) => [newQuote, ...prev]);
    return newQuote;
  };

  // Dedicated Soft-Delete Function
  // Permanently eliminates hard deletes from the application lifecycle
  const softDeleteRecord = async (
    entityType: 'clients' | 'events' | 'sessions' | 'team_members' | 'tasks' | 'payments' | 'expenses' | 'packages' | 'quotations',
    entityId: string
  ): Promise<void> => {
    const now = new Date().toISOString();
    const deletedBy = user?.id || null;

    if (entityType === 'clients') {
      setAllClients((prev) =>
        prev.map((c) => ((c.client_id === entityId || c.id === entityId) ? { ...c, deleted_date: now, deleted_by: deletedBy, is_archived: true } : c))
      );
    } else if (entityType === 'events') {
      setAllEvents((prev) =>
        prev.map((e) => ((e.event_id === entityId || e.id === entityId) ? { ...e, deleted_date: now, deleted_by: deletedBy, status: 'archived' } : e))
      );
    } else if (entityType === 'sessions') {
      setAllSessions((prev) =>
        prev.map((s) => ((s.event_session_id === entityId || s.id === entityId) ? { ...s, deleted_date: now, deleted_by: deletedBy } : s))
      );
    } else if (entityType === 'team_members') {
      setAllTeamMembers((prev) =>
        prev.map((tm) => ((tm.team_member_id === entityId || tm.id === entityId) ? { ...tm, deleted_date: now, deleted_by: deletedBy, is_active: false } : tm))
      );
    } else if (entityType === 'tasks') {
      setAllTasks((prev) =>
        prev.map((t) => ((t.task_id === entityId || t.id === entityId) ? { ...t, deleted_date: now, deleted_by: deletedBy } : t))
      );
    } else if (entityType === 'payments') {
      setAllPayments((prev) =>
        prev.map((p) => ((p.payment_id === entityId || p.id === entityId) ? { ...p, deleted_date: now, deleted_by: deletedBy } : p))
      );
    } else if (entityType === 'expenses') {
      setAllExpenses((prev) =>
        prev.map((ex) => ((ex.expense_id === entityId || ex.id === entityId) ? { ...ex, deleted_date: now, deleted_by: deletedBy } : ex))
      );
    } else if (entityType === 'packages') {
      setAllPackages((prev) =>
        prev.map((p) => ((p.package_id === entityId || p.id === entityId) ? { ...p, deleted_date: now, deleted_by: deletedBy, is_active: false } : p))
      );
    } else if (entityType === 'quotations') {
      setAllQuotations((prev) =>
        prev.map((q) => ((q.quotation_id === entityId || q.id === entityId) ? { ...q, deleted_date: now, deleted_by: deletedBy } : q))
      );
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const pkCol = `${entityType.replace(/s$/, '')}_id`;
        await supabase.from(entityType).update({ deleted_date: now, deleted_by: deletedBy }).eq(pkCol, entityId);
      } catch (err) {
        console.warn(`Supabase soft-delete error on ${entityType}:`, err);
      }
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        activeTenant,
        activeRole,
        memberships: DEMO_MEMBERSHIPS,
        switchTenant,
        createTenant,
        clients,
        events,
        sessions,
        teamMembers,
        assignments,
        packages,
        quotations,
        payments,
        expenses,
        editingProjects,
        tasks,
        templates,
        addClient,
        addEvent,
        addSession,
        addTeamMember,
        assignCrew,
        recordPayment,
        recordExpense,
        updateEditingStage,
        toggleTask,
        createQuotation,
        softDeleteRecord,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within a TenantProvider');
  return context;
};
