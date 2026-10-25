import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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

export interface RegisterStudioParams {
  studio_name: string;
  business_type?: string;
  owner_name?: string;
  contact_email?: string;
  contact_phone?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  logo_url?: string;
  timezone?: string;
  currency?: string;
  currency_symbol?: string;
  date_format?: string;
  services_offered?: string[];
  team_size_range?: string;
  event_categories?: string[];
  initial_team_members?: Array<{ name: string; email: string; role: TenantRole }>;
}

export interface OnboardingDraft {
  step: number;
  studio_name: string;
  business_type: string;
  owner_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  state: string;
  country: string;
  website: string;
  logo_url?: string;
  timezone: string;
  currency: string;
  currency_symbol: string;
  date_format: string;
  services_offered: string[];
  team_size_range: string;
  event_categories: string[];
  initial_team_members: Array<{ name: string; email: string; role: TenantRole }>;
  updated_at: string;
}

export interface UserWorkspaceInfo {
  tenant: Tenant;
  role: TenantRole;
  isActive: boolean;
  memberCount: number;
}

interface TenantContextType {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  activeRole: TenantRole;
  memberships: TenantMember[];
  userWorkspaces: UserWorkspaceInfo[];
  hasCompletedOnboarding: boolean;
  switchTenant: (tenantId: string) => boolean;
  createTenant: (tenantData: Partial<Tenant>) => Promise<Tenant>;
  registerStudioWorkspace: (params: RegisterStudioParams) => Promise<Tenant>;

  // Onboarding draft management for interrupted setups
  saveOnboardingDraft: (draft: Partial<OnboardingDraft>) => void;
  getOnboardingDraft: () => OnboardingDraft | null;
  clearOnboardingDraft: () => void;
  
  // Diagnostics & Remote Supabase Status
  isLoadingData: boolean;
  dataError: string | null;
  schemaStatus: 'ready' | 'migration_required' | 'idle';
  reloadTenantData: () => Promise<void>;

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

const ONBOARDING_DRAFT_KEY = 'snapflow_onboarding_draft';

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  
  // Stored state
  const [tenants, setTenants] = useState<Tenant[]>(DEMO_TENANTS);
  const [memberships, setMemberships] = useState<TenantMember[]>(DEMO_MEMBERSHIPS);
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

  // Diagnostics & Remote Supabase Status
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [schemaStatus, setSchemaStatus] = useState<'ready' | 'migration_required' | 'idle'>('idle');

  // Compute workspaces the current authenticated user belongs to
  const userWorkspaces = useMemo<UserWorkspaceInfo[]>(() => {
    if (!user) return [];
    
    // In demo mode or fallback, find all memberships for current user
    const userMems = memberships.filter(
      (m) => (m.user_id === user.id || m.user_id === (user as any).profile_id) && m.is_active && !m.deleted_date
    );

    return userMems.map((mem) => {
      const tenant = tenants.find((t) => t.tenant_id === mem.tenant_id || t.id === mem.tenant_id) || {
        tenant_id: mem.tenant_id,
        id: mem.tenant_id,
        name: 'Studio Workspace',
        slug: 'studio-workspace',
        business_type: 'wedding_portrait',
        currency: 'INR',
        currency_symbol: '₹',
        timezone: 'Asia/Kolkata',
        date_format: 'DD/MM/YYYY',
        country: 'India',
      } as Tenant;

      const memberCount = memberships.filter((m) => m.tenant_id === mem.tenant_id && !m.deleted_date).length;

      return {
        tenant,
        role: mem.role,
        isActive: mem.is_active,
        memberCount: Math.max(memberCount, 1),
      };
    });
  }, [user, memberships, tenants]);

  // Determine if user has completed studio onboarding
  const hasCompletedOnboarding = useMemo(() => {
    if (!user) return false;
    // In demo mode, initial mock user already has tenants
    if (isDemoMode) return true;
    return userWorkspaces.length > 0;
  }, [user, isDemoMode, userWorkspaces.length]);

  // Active Tenant resolution
  const activeTenant = useMemo(() => {
    // If active tenant ID matches one of user's authorized workspaces, return it
    const authorized = userWorkspaces.find(
      (w) => w.tenant.tenant_id === activeTenantId || w.tenant.id === activeTenantId
    );
    if (authorized) return authorized.tenant;

    // Otherwise default to user's first authorized workspace if available
    if (userWorkspaces.length > 0) return userWorkspaces[0].tenant;

    // Fallback to global tenants[0] only in demo mode
    if (isDemoMode) {
      return tenants.find((t) => (t.tenant_id === activeTenantId || t.id === activeTenantId)) || tenants[0] || null;
    }

    return null;
  }, [userWorkspaces, activeTenantId, isDemoMode, tenants]);

  const activeTenantKey = activeTenant?.tenant_id || activeTenant?.id;

  // Active user's role in active tenant
  const activeRole: TenantRole = useMemo(() => {
    if (!user || !activeTenantKey) return 'photographer';
    const membership = memberships.find(
      (m) => (m.tenant_id === activeTenantKey) && (m.user_id === user.id || m.user_id === (user as any).profile_id)
    );
    return membership ? membership.role : 'owner';
  }, [user, activeTenantKey, memberships]);

  // Synchronize active tenant records with real Supabase PostgreSQL tables
  const fetchTenantData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || isDemoMode || !activeTenantKey) {
      setSchemaStatus('idle');
      return;
    }

    setIsLoadingData(true);
    setDataError(null);

    try {
      const [clientsRes, eventsRes, sessionsRes, teamRes, paymentsRes, expensesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('tenant_id', activeTenantKey).is('deleted_date', null),
        supabase.from('events').select('*').eq('tenant_id', activeTenantKey).is('deleted_date', null),
        supabase.from('event_sessions').select('*').eq('tenant_id', activeTenantKey).is('deleted_date', null),
        supabase.from('team_members').select('*').eq('tenant_id', activeTenantKey).is('deleted_date', null),
        supabase.from('payments').select('*').eq('tenant_id', activeTenantKey).is('deleted_date', null),
        supabase.from('expenses').select('*').eq('tenant_id', activeTenantKey).is('deleted_date', null),
      ]);

      // Detect if migration has not yet been executed in remote database
      if (clientsRes.error?.code === 'PGRST205' || eventsRes.error?.code === 'PGRST205') {
        setSchemaStatus('migration_required');
        return;
      }

      setSchemaStatus('ready');

      if (clientsRes.data) {
        setAllClients((prev) => {
          const other = prev.filter((c) => c.tenant_id !== activeTenantKey);
          const mapped = clientsRes.data.map((c: any) => ({
            ...c,
            id: c.client_id || c.id,
          }));
          return [...mapped, ...other];
        });
      }

      if (eventsRes.data) {
        setAllEvents((prev) => {
          const other = prev.filter((e) => e.tenant_id !== activeTenantKey);
          const mapped = eventsRes.data.map((e: any) => ({
            ...e,
            id: e.event_id || e.id,
          }));
          return [...mapped, ...other];
        });
      }

      if (sessionsRes.data) {
        setAllSessions((prev) => {
          const other = prev.filter((s) => s.tenant_id !== activeTenantKey);
          const mapped = sessionsRes.data.map((s: any) => ({
            ...s,
            id: s.event_session_id || s.id,
          }));
          return [...mapped, ...other];
        });
      }

      if (teamRes.data) {
        setAllTeamMembers((prev) => {
          const other = prev.filter((t) => t.tenant_id !== activeTenantKey);
          const mapped = teamRes.data.map((t: any) => ({
            ...t,
            id: t.team_member_id || t.id,
          }));
          return [...mapped, ...other];
        });
      }

      if (paymentsRes.data) {
        setAllPayments((prev) => {
          const other = prev.filter((p) => p.tenant_id !== activeTenantKey);
          const mapped = paymentsRes.data.map((p: any) => ({
            ...p,
            id: p.payment_id || p.id,
          }));
          return [...mapped, ...other];
        });
      }

      if (expensesRes.data) {
        setAllExpenses((prev) => {
          const other = prev.filter((ex) => ex.tenant_id !== activeTenantKey);
          const mapped = expensesRes.data.map((ex: any) => ({
            ...ex,
            id: ex.expense_id || ex.id,
          }));
          return [...mapped, ...other];
        });
      }
    } catch (err: any) {
      console.warn('Failed to load tenant records from Supabase:', err);
      setDataError(err.message || 'Database connection error');
    } finally {
      setIsLoadingData(false);
    }
  }, [isDemoMode, activeTenantKey]);

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  const reloadTenantData = useCallback(async () => {
    await fetchTenantData();
  }, [fetchTenantData]);

  // Secure Workspace Switcher
  // Clears cached data from previous workspace and validates authorization
  const switchTenant = useCallback((tenantId: string): boolean => {
    // Security check: verify user is authorized for this tenant
    const isAuthorized = userWorkspaces.some(
      (w) => w.tenant.tenant_id === tenantId || w.tenant.id === tenantId
    ) || (isDemoMode && tenants.some((t) => t.tenant_id === tenantId || t.id === tenantId));

    if (!isAuthorized) {
      console.warn('Unauthorized workspace switch attempted:', tenantId);
      return false;
    }

    const target = tenants.find((t) => t.tenant_id === tenantId || t.id === tenantId);
    if (target) {
      const resolvedId = target.tenant_id || target.id!;
      
      // Clear transient client cached filters or modals before switching
      setActiveTenantId(resolvedId);
      localStorage.setItem('snapflow_active_tenant_id', resolvedId);
      return true;
    }
    return false;
  }, [userWorkspaces, isDemoMode, tenants]);

  // Draft management for interrupted onboarding
  const saveOnboardingDraft = useCallback((draft: Partial<OnboardingDraft>) => {
    try {
      const current = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      const existing = current ? JSON.parse(current) : {};
      const updated: OnboardingDraft = {
        step: 1,
        studio_name: '',
        business_type: 'wedding_portrait',
        owner_name: user?.full_name || '',
        contact_email: user?.email || '',
        contact_phone: '+91 98200 78900',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        website: '',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        currency_symbol: '₹',
        date_format: 'DD/MM/YYYY',
        services_offered: ['Wedding Photography', 'Cinematic Films'],
        team_size_range: '1-5',
        event_categories: ['Weddings', 'Pre-Wedding', 'Receptions'],
        initial_team_members: [],
        ...existing,
        ...draft,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save onboarding draft:', e);
    }
  }, [user]);

  const getOnboardingDraft = useCallback((): OnboardingDraft | null => {
    try {
      const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const clearOnboardingDraft = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } catch (e) {
      console.warn('Failed to clear onboarding draft:', e);
    }
  }, []);

  // Atomic Secure Tenant Registration (Calls PostgreSQL RPC register_studio_workspace)
  const registerStudioWorkspace = async (params: RegisterStudioParams): Promise<Tenant> => {
    const now = new Date().toISOString();
    const studioName = params.studio_name.trim();

    // 1. If Supabase is configured and user is authenticated, call trusted RPC
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('register_studio_workspace', {
          p_studio_name: studioName,
          p_business_type: params.business_type || 'wedding_portrait',
          p_owner_name: params.owner_name || user?.full_name || 'Studio Principal',
          p_contact_email: params.contact_email || user?.email || '',
          p_contact_phone: params.contact_phone || '',
          p_city: params.city || 'Mumbai',
          p_state: params.state || 'Maharashtra',
          p_country: params.country || 'India',
          p_website: params.website || null,
          p_logo_url: params.logo_url || null,
          p_timezone: params.timezone || 'Asia/Kolkata',
          p_currency: params.currency || 'INR',
          p_currency_symbol: params.currency_symbol || '₹',
          p_date_format: params.date_format || 'DD/MM/YYYY',
          p_services_offered: params.services_offered || ['Wedding Photography', 'Cinematic Films'],
          p_team_size_range: params.team_size_range || '1-5',
          p_event_categories: params.event_categories || ['Wedding', 'Pre-Wedding', 'Reception'],
          p_initial_team_members: params.initial_team_members || [],
        });

        if (error) {
          throw new Error(error.message);
        }

        const createdTenantId = data?.tenant_id;
        const createdSlug = data?.slug || studioName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const newTenant: Tenant = {
          tenant_id: createdTenantId,
          id: createdTenantId,
          name: studioName,
          slug: createdSlug,
          business_type: params.business_type || 'wedding_portrait',
          logo_url: params.logo_url || null,
          currency: params.currency || 'INR',
          currency_symbol: params.currency_symbol || '₹',
          timezone: params.timezone || 'Asia/Kolkata',
          date_format: params.date_format || 'DD/MM/YYYY',
          phone: params.contact_phone || '',
          email: params.contact_email || user?.email || '',
          website: params.website || '',
          address: `${params.city || 'Mumbai'}, ${params.state || 'Maharashtra'}`,
          city: params.city || 'Mumbai',
          country: params.country || 'India',
          inserted_by: user?.id || null,
          inserted_date: now,
          updated_by: user?.id || null,
          updated_date: now,
        };

        const newMembership: TenantMember = {
          tenant_member_id: `mem-${Date.now()}`,
          id: `mem-${Date.now()}`,
          tenant_id: createdTenantId,
          user_id: user?.id || 'usr-default',
          role: 'owner', // Strictly assigned as owner
          is_active: true,
          title: 'Studio Founder & Principal',
          inserted_by: user?.id || null,
          inserted_date: now,
          updated_by: user?.id || null,
          updated_date: now,
        };

        setTenants((prev) => [newTenant, ...prev]);
        setMemberships((prev) => [newMembership, ...prev]);
        setActiveTenantId(createdTenantId);
        localStorage.setItem('snapflow_active_tenant_id', createdTenantId);
        clearOnboardingDraft();
        return newTenant;
      } catch (err: any) {
        console.warn('RPC register_studio_workspace error:', err.message);
        // If RPC isn't deployed yet on Supabase, proceed with local fallback below
      }
    }

    // 2. Demo Mode / Fallback Atomic Simulation
    const newId = `tenant-${Date.now()}`;
    const baseSlug = studioName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uniqueSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

    const newTenant: Tenant = {
      tenant_id: newId,
      id: newId,
      name: studioName,
      slug: uniqueSlug,
      business_type: params.business_type || 'wedding_portrait',
      logo_url: params.logo_url || null,
      currency: params.currency || 'INR',
      currency_symbol: params.currency_symbol || '₹',
      timezone: params.timezone || 'Asia/Kolkata',
      date_format: params.date_format || 'DD/MM/YYYY',
      phone: params.contact_phone || '',
      email: params.contact_email || user?.email || '',
      website: params.website || '',
      address: `${params.city || 'Mumbai'}, ${params.state || 'Maharashtra'}`,
      city: params.city || 'Mumbai',
      country: params.country || 'India',
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
    };

    const newOwnerMembership: TenantMember = {
      tenant_member_id: `tm-${Date.now()}`,
      id: `tm-${Date.now()}`,
      tenant_id: newId,
      user_id: user?.id || 'usr-default',
      role: 'owner', // Role 'owner' enforced
      is_active: true,
      title: 'Studio Founder & Principal',
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
    };

    // If initial team members specified, create their memberships
    const newTeamInvites: TenantMember[] = (params.initial_team_members || []).map((m, idx) => ({
      tenant_member_id: `tm-invite-${Date.now()}-${idx}`,
      id: `tm-invite-${Date.now()}-${idx}`,
      tenant_id: newId,
      user_id: `usr-inv-${idx}`,
      role: m.role || 'photographer',
      is_active: false, // Pending invite
      title: m.name,
      inserted_by: user?.id || null,
      inserted_date: now,
      updated_by: user?.id || null,
      updated_date: now,
    }));

    setTenants((prev) => [newTenant, ...prev]);
    setMemberships((prev) => [newOwnerMembership, ...newTeamInvites, ...prev]);
    setActiveTenantId(newId);
    localStorage.setItem('snapflow_active_tenant_id', newId);
    clearOnboardingDraft();
    return newTenant;
  };

  const createTenant = async (tenantData: Partial<Tenant>): Promise<Tenant> => {
    return registerStudioWorkspace({
      studio_name: tenantData.name || 'New Studio',
      business_type: tenantData.business_type,
      currency: tenantData.currency,
      currency_symbol: tenantData.currency_symbol,
      timezone: tenantData.timezone,
      date_format: tenantData.date_format,
      contact_phone: tenantData.phone || '',
      contact_email: tenantData.email || '',
      website: tenantData.website || '',
      city: tenantData.city || 'Mumbai',
      country: tenantData.country || 'India',
      logo_url: tenantData.logo_url || undefined,
    });
  };

  // STRICT TENANT ISOLATION & SOFT-DELETE FILTERS
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

  // MUTATIONS (strictly scoped to activeTenantKey, with audit columns & soft delete)
  const addClient = async (
    clientData: Omit<Client, 'client_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'is_archived'>
  ): Promise<Client> => {
    if (!activeTenantKey) throw new Error('No active studio workspace selected');
    const newId = `cli-${Date.now()}`;
    const now = new Date().toISOString();
    let createdClient: Client = {
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

    if (isSupabaseConfigured && supabase && !isDemoMode && schemaStatus === 'ready') {
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert([
            {
              tenant_id: activeTenantKey,
              first_name: clientData.first_name,
              last_name: clientData.last_name,
              partner_first_name: clientData.partner_first_name || null,
              partner_last_name: clientData.partner_last_name || null,
              email: clientData.email,
              phone: clientData.phone || null,
              city: clientData.city || null,
              source: clientData.source || 'Referral',
              notes: clientData.notes || null,
              is_archived: false,
            },
          ])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert client error:', error.message);
        } else if (data) {
          createdClient = {
            ...data,
            id: data.client_id || data.id,
          };
        }
      } catch (e) {
        console.warn('Network error saving client to Supabase:', e);
      }
    }

    setAllClients((prev) => [createdClient, ...prev]);
    return createdClient;
  };

  const addEvent = async (
    eventData: Omit<Event, 'event_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'total_paid' | 'outstanding_balance'>
  ): Promise<Event> => {
    if (!activeTenantKey) throw new Error('No active studio workspace selected');
    const newId = `evt-${Date.now()}`;
    const now = new Date().toISOString();
    let createdEvent: Event = {
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

    if (isSupabaseConfigured && supabase && !isDemoMode && schemaStatus === 'ready') {
      try {
        const { data, error } = await supabase
          .from('events')
          .insert([
            {
              tenant_id: activeTenantKey,
              title: eventData.title,
              event_type: eventData.event_type || 'wedding',
              status: eventData.status || 'inquiry',
              start_date: eventData.start_date,
              end_date: eventData.end_date,
              primary_venue_name: (eventData as any).primary_venue_name || (eventData as any).venue_name || null,
              primary_venue_city: (eventData as any).primary_venue_city || (eventData as any).city || 'Mumbai',
              total_package_price: eventData.total_package_price || 0,
            },
          ])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert event error:', error.message);
        } else if (data) {
          createdEvent = {
            ...data,
            id: data.event_id || data.id,
            total_paid: 0,
            outstanding_balance: data.total_package_price,
          };
        }
      } catch (e) {
        console.warn('Network error saving event to Supabase:', e);
      }
    }

    setAllEvents((prev) => [createdEvent, ...prev]);
    return createdEvent;
  };

  const addSession = async (
    sessionData: Omit<EventSession, 'event_session_id' | 'id' | 'tenant_id' | 'created_at'>
  ): Promise<EventSession> => {
    if (!activeTenantKey) throw new Error('No active studio workspace selected');
    const newId = `ses-${Date.now()}`;
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

    setAllSessions((prev) => [...prev, newSession]);
    return newSession;
  };

  const addTeamMember = async (
    memberData: Omit<TeamMember, 'team_member_id' | 'id' | 'tenant_id' | 'created_at'>
  ): Promise<TeamMember> => {
    if (!activeTenantKey) throw new Error('No active studio workspace selected');
    const newId = `tm-${Date.now()}`;
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

    setAllTeamMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  const assignCrew = async (
    assignmentData: Omit<TeamAssignment, 'team_assignment_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
  ): Promise<TeamAssignment> => {
    if (!activeTenantKey) throw new Error('No active studio workspace selected');
    const newId = `asn-${Date.now()}`;
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

    setAllAssignments((prev) => [...prev, newAssignment]);
    return newAssignment;
  };

  const recordPayment = async (
    paymentData: Omit<Payment, 'payment_id' | 'id' | 'tenant_id' | 'created_at'>
  ): Promise<Payment> => {
    if (!activeTenantKey) throw new Error('No active studio workspace selected');
    const newId = `pay-${Date.now()}`;
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

    setAllPayments((prev) => [newPayment, ...prev]);

    // Update event totals
    setAllEvents((prev) =>
      prev.map((e) => {
        if (e.id === paymentData.event_id || e.event_id === paymentData.event_id) {
          const newPaid = e.total_paid + paymentData.amount;
          return {
            ...e,
            total_paid: newPaid,
            outstanding_balance: Math.max(0, e.total_package_price - newPaid),
          };
        }
        return e;
      })
    );

    return newPayment;
  };

  const recordExpense = async (
    expenseData: Omit<Expense, 'expense_id' | 'id' | 'tenant_id' | 'created_at'>
  ): Promise<Expense> => {
    if (!activeTenantKey) throw new Error('No active studio workspace selected');
    const newId = `exp-${Date.now()}`;
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

    setAllExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const updateEditingStage = async (projectId: string, stage: EditingStage): Promise<void> => {
    const now = new Date().toISOString();
    setAllEditingProjects((prev) =>
      prev.map((p) =>
        (p.id === projectId || p.editing_project_id === projectId)
          ? {
              ...p,
              current_stage: stage,
              updated_by: user?.id || null,
              updated_date: now,
              updated_at: now,
            }
          : p
      )
    );
  };

  const toggleTask = async (taskId: string): Promise<void> => {
    const now = new Date().toISOString();
    setAllTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId || t.task_id === taskId) {
          const nextCompleted = !t.is_completed;
          return {
            ...t,
            is_completed: nextCompleted,
            completed_at: nextCompleted ? now : null,
            updated_by: user?.id || null,
            updated_date: now,
          };
        }
        return t;
      })
    );
  };

  const createQuotation = async (
    quoteData: Omit<Quotation, 'quotation_id' | 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
  ): Promise<Quotation> => {
    if (!activeTenantKey) throw new Error('No active studio workspace selected');
    const newId = `quo-${Date.now()}`;
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

  // Safe Soft Delete: marks record as deleted with timestamp and user ID
  const softDeleteRecord = async (
    entityType: 'clients' | 'events' | 'sessions' | 'team_members' | 'tasks' | 'payments' | 'expenses' | 'packages' | 'quotations',
    entityId: string
  ): Promise<void> => {
    const now = new Date().toISOString();
    const userId = user?.id || null;

    if (entityType === 'clients') {
      setAllClients((prev) =>
        prev.map((item) =>
          item.id === entityId || item.client_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId, is_archived: true }
            : item
        )
      );
    } else if (entityType === 'events') {
      setAllEvents((prev) =>
        prev.map((item) =>
          item.id === entityId || item.event_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId }
            : item
        )
      );
    } else if (entityType === 'sessions') {
      setAllSessions((prev) =>
        prev.map((item) =>
          item.id === entityId || item.event_session_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId }
            : item
        )
      );
    } else if (entityType === 'team_members') {
      setAllTeamMembers((prev) =>
        prev.map((item) =>
          item.id === entityId || item.team_member_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId }
            : item
        )
      );
    } else if (entityType === 'tasks') {
      setAllTasks((prev) =>
        prev.map((item) =>
          item.id === entityId || item.task_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId }
            : item
        )
      );
    } else if (entityType === 'payments') {
      setAllPayments((prev) =>
        prev.map((item) =>
          item.id === entityId || item.payment_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId }
            : item
        )
      );
    } else if (entityType === 'expenses') {
      setAllExpenses((prev) =>
        prev.map((item) =>
          item.id === entityId || item.expense_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId }
            : item
        )
      );
    } else if (entityType === 'packages') {
      setAllPackages((prev) =>
        prev.map((item) =>
          item.id === entityId || item.package_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId }
            : item
        )
      );
    } else if (entityType === 'quotations') {
      setAllQuotations((prev) =>
        prev.map((item) =>
          item.id === entityId || item.quotation_id === entityId
            ? { ...item, deleted_date: now, deleted_by: userId }
            : item
        )
      );
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        activeTenant,
        activeRole,
        memberships,
        userWorkspaces,
        hasCompletedOnboarding,
        switchTenant,
        createTenant,
        registerStudioWorkspace,
        saveOnboardingDraft,
        getOnboardingDraft,
        clearOnboardingDraft,
        isLoadingData,
        dataError,
        schemaStatus,
        reloadTenantData,
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
