/**
 * SNAPFLOW STUDIO - TYPE DEFINITIONS
 * Mirrors exact PostgreSQL schema from supabase/migrations/
 * All entities feature primary key suffixed with table name (<entity>_id),
 * full audit columns (inserted_by, inserted_date, updated_by, updated_date, deleted_by, deleted_date),
 * and complete soft-delete enforcement.
 */

export interface BaseAuditEntity {
  inserted_by?: string | null;
  inserted_date?: string;
  updated_by?: string | null;
  updated_date?: string;
  deleted_by?: string | null;
  deleted_date?: string | null;
  // Aliases for frontend convenience
  created_at?: string;
  updated_at?: string;
}

export type TenantRole = 'owner' | 'manager' | 'photographer' | 'videographer' | 'editor' | 'freelancer';

export type EventType =
  | 'wedding'
  | 'reception'
  | 'engagement'
  | 'pre_wedding'
  | 'haldi_mehendi'
  | 'birthday'
  | 'corporate'
  | 'portrait_commercial'
  | 'custom';

export type EventStatus =
  | 'inquiry'
  | 'quoted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'archived'
  | 'canceled';

export type AssignmentStatus = 'draft' | 'requested' | 'confirmed' | 'declined' | 'completed';

export type EditingStage =
  | 'backup_verified'
  | 'photo_selection'
  | 'photo_retouching'
  | 'video_teaser'
  | 'video_feature'
  | 'album_design'
  | 'client_review'
  | 'revisions'
  | 'completed';

export interface Profile extends BaseAuditEntity {
  profile_id: string;
  id: string; // Compatibility alias
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone?: string | null;
  timezone: string;
  is_platform_admin: boolean;
}

export interface Tenant extends BaseAuditEntity {
  tenant_id: string;
  id: string; // Compatibility alias
  name: string;
  slug: string;
  business_type: string;
  logo_url?: string | null;
  currency: string;
  currency_symbol: string;
  timezone: string;
  date_format: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
}

export interface TenantMember extends BaseAuditEntity {
  tenant_member_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  is_active: boolean;
  title?: string | null;
  hourly_rate?: number;
  day_rate?: number;
  user?: Profile;
  tenant?: Tenant;
}

export interface TenantInvitation extends BaseAuditEntity {
  tenant_invitation_id: string;
  id: string;
  tenant_id: string;
  email: string;
  role: TenantRole;
  token: string;
  expires_at: string;
  accepted_at?: string | null;
}

export interface TenantSettings extends BaseAuditEntity {
  tenant_setting_id: string;
  id: string;
  tenant_id: string;
  booking_lead_buffer_days: number;
  default_deposit_percentage: number;
  tax_rate: number;
  tax_label: string;
  invoice_footer_note?: string;
  brand_primary_color: string;
  brand_dark_theme: boolean;
  require_drone_permit_ack: boolean;
  enable_client_portal: boolean;
  auto_remind_days_before_shoot: number;
}

export interface SubscriptionPlan extends BaseAuditEntity {
  subscription_plan_id: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  max_active_events: number;
  max_team_members: number;
  storage_limit_gb: number;
  has_client_galleries: boolean;
  has_freelancer_dispatch: boolean;
  has_custom_branding: boolean;
}

export interface TenantSubscription extends BaseAuditEntity {
  tenant_subscription_id: string;
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  billing_interval: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  plan?: SubscriptionPlan;
}

export interface AuditLog extends BaseAuditEntity {
  audit_log_id: string;
  id: string;
  tenant_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string | null;
}

export interface Client extends BaseAuditEntity {
  client_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  first_name: string;
  last_name: string;
  partner_first_name?: string | null;
  partner_last_name?: string | null;
  email: string;
  phone?: string | null;
  alternate_phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  source?: string | null;
  notes?: string | null;
  is_archived: boolean;
}

export interface EventSession extends BaseAuditEntity {
  event_session_id: string;
  id: string;
  tenant_id: string;
  event_id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  reporting_time?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  dress_code?: string | null;
  is_drone_permitted: boolean;
  special_instructions?: string | null;
  assignments?: TeamAssignment[];
}

export interface EventRequirement extends BaseAuditEntity {
  event_requirement_id: string;
  id: string;
  tenant_id: string;
  event_id: string;
  session_id?: string | null;
  role_type: TenantRole;
  quantity_required: number;
  budget_per_head?: number;
  notes?: string;
}

export interface EventChecklist extends BaseAuditEntity {
  event_checklist_id: string;
  id: string;
  tenant_id: string;
  event_id: string;
  title: string;
  category: string;
  is_completed: boolean;
  assigned_to?: string | null;
  completed_at?: string | null;
}

export interface Event extends BaseAuditEntity {
  event_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  client_id: string;
  title: string;
  event_type: EventType;
  status: EventStatus;
  start_date: string;
  end_date: string;
  primary_venue_name?: string | null;
  primary_venue_address?: string | null;
  primary_venue_city?: string | null;
  estimated_guest_count?: number | null;
  total_package_price: number;
  total_paid: number;
  outstanding_balance: number;
  lead_notes?: string | null;
  contract_signed_at?: string | null;
  client?: Client;
  sessions?: EventSession[];
  requirements?: EventRequirement[];
  checklists?: EventChecklist[];
  payments?: Payment[];
}

export interface TeamMember extends BaseAuditEntity {
  team_member_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  profile_id?: string | null;
  name: string;
  email?: string | null;
  phone: string;
  role: TenantRole;
  is_freelancer: boolean;
  hourly_rate?: number;
  day_rate?: number;
  portfolio_url?: string | null;
  gear_list?: string | null;
  rating?: number;
  notes?: string | null;
  is_active: boolean;
  skills?: string[];
}

export interface TeamMemberSkill extends BaseAuditEntity {
  team_member_skill_id: string;
  id: string;
  tenant_id: string;
  team_member_id: string;
  skill: string;
}

export interface TeamAssignment extends BaseAuditEntity {
  team_assignment_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  event_id: string;
  session_id: string;
  team_member_id: string;
  role_assigned: TenantRole;
  status: AssignmentStatus;
  agreed_payout: number;
  call_time?: string | null;
  reporting_location?: string | null;
  gear_notes?: string | null;
  confirmed_at?: string | null;
  team_member?: TeamMember;
  session?: EventSession;
  event?: Event;
}

export interface FreelancerRequest extends BaseAuditEntity {
  freelancer_request_id: string;
  id: string;
  tenant_id: string;
  session_id: string;
  team_member_id: string;
  offered_rate: number;
  message_text: string;
  dispatch_channel: 'whatsapp' | 'email' | 'sms' | 'call';
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  sent_at: string;
  responded_at?: string | null;
}

export interface TeamAvailability extends BaseAuditEntity {
  team_availability_id: string;
  id: string;
  tenant_id: string;
  team_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface TeamUnavailability extends BaseAuditEntity {
  team_unavailability_id: string;
  id: string;
  tenant_id: string;
  team_member_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface PackageItem extends BaseAuditEntity {
  package_item_id: string;
  id: string;
  tenant_id: string;
  package_id: string;
  item_title: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
}

export interface Package extends BaseAuditEntity {
  package_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  name: string;
  description?: string;
  base_price: number;
  is_active: boolean;
  recommended_for?: string;
  items?: PackageItem[];
}

export interface QuotationItem extends BaseAuditEntity {
  quotation_item_id: string;
  id: string;
  tenant_id: string;
  quotation_id: string;
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Quotation extends BaseAuditEntity {
  quotation_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  client_id: string;
  event_id?: string;
  quotation_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  valid_until: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  terms_conditions?: string;
  client?: Client;
  items?: QuotationItem[];
}

export interface Payment extends BaseAuditEntity {
  payment_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  event_id: string;
  client_id: string;
  amount: number;
  payment_method: 'bank_transfer' | 'credit_card' | 'cash' | 'stripe' | 'check' | 'upi';
  payment_stage: 'advance' | 'mid_payment' | 'shoot_day' | 'album_delivery' | 'final_settlement';
  reference_number?: string | null;
  paid_on: string;
  notes?: string | null;
  client?: Client;
  event?: Event;
}

export interface Expense extends BaseAuditEntity {
  expense_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  event_id?: string | null;
  category: 'freelancer_payout' | 'gear_rental' | 'travel_lodging' | 'props_location' | 'studio_overhead' | 'media_storage' | 'software_license';
  amount: number;
  recipient_name: string;
  incurred_on: string;
  receipt_url?: string | null;
  notes?: string | null;
  event?: Event;
}

export interface Deliverable extends BaseAuditEntity {
  deliverable_id: string;
  id: string;
  tenant_id: string;
  editing_project_id: string;
  title: string;
  deliverable_type: 'gallery_link' | 'video_link' | 'physical_album' | 'hard_drive' | 'print_box';
  delivery_url?: string;
  password_hash?: string;
  expires_at?: string;
  status: 'in_production' | 'review_pending' | 'client_approved' | 'dispatched';
  client_approved_at?: string;
}

export interface EditingProject extends BaseAuditEntity {
  editing_project_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  event_id: string;
  lead_editor_id?: string | null;
  current_stage: EditingStage;
  raw_storage_path?: string | null;
  backup_disk_label?: string | null;
  deadline_date: string;
  color_grade_notes?: string | null;
  client_feedback_notes?: string | null;
  revision_count: number;
  event?: Event;
  lead_editor?: TeamMember;
  deliverables?: Deliverable[];
}

export interface Task extends BaseAuditEntity {
  task_id: string;
  id: string; // Compatibility alias
  tenant_id: string;
  event_id?: string | null;
  assigned_to?: string | null;
  title: string;
  description?: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date: string;
  is_completed: boolean;
  completed_at?: string | null;
  event?: Event;
}

export interface NotificationItem extends BaseAuditEntity {
  notification_id: string;
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
}

export interface MessageTemplate extends BaseAuditEntity {
  message_template_id: string;
  id: string;
  tenant_id: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'sms';
  template_body: string;
}

export interface FileAsset extends BaseAuditEntity {
  file_asset_id: string;
  id: string;
  tenant_id: string;
  event_id?: string;
  client_id?: string;
  bucket_id: string;
  storage_path: string;
  filename: string;
  file_size_bytes: number;
  mime_type: string;
  is_private: boolean;
  uploaded_by?: string;
}
