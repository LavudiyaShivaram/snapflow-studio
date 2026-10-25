import React, { useState, useEffect } from 'react';
import {
  Camera,
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  Users,
  Calendar,
  Sparkles,
  Upload,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Shield,
  Clock,
  Coins,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTenant, RegisterStudioParams, OnboardingDraft } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { TenantRole } from '../../lib/types';

interface StudioOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToBooking?: () => void;
  onNavigateToTeam?: () => void;
}

const BUSINESS_TYPES = [
  { id: 'wedding_portrait', label: 'Wedding & Portrait Cinema', desc: 'Full-service wedding cinematography & photography houses' },
  { id: 'commercial', label: 'Commercial & Editorial Studio', desc: 'Fashion, corporate campaigns, and advertising production' },
  { id: 'event_media', label: 'Live Events & Drone Media', desc: 'High-volume concerts, festivals, corporate conventions' },
  { id: 'boutique', label: 'Boutique Independent Creative', desc: 'Solo principals, destination storytellers & documentary artists' },
];

const AVAILABLE_SERVICES = [
  'Wedding Photography',
  'Cinematic Films',
  'Pre-Wedding Shoots',
  'Drone Aerial Coverage',
  'Studio Portraits',
  'Commercial & Corporate',
  'Same-Day Edits',
  'Luxury Flushmount Albums',
];

const DEFAULT_CATEGORIES = [
  'Weddings',
  'Pre-Wedding',
  'Receptions',
  'Sangeet & Mehendi',
  'Corporate & Commercial',
  'Private Portraits',
];

export const StudioOnboardingWizard: React.FC<StudioOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onNavigateToBooking,
  onNavigateToTeam,
}) => {
  const { registerStudioWorkspace, saveOnboardingDraft, getOnboardingDraft, clearOnboardingDraft } = useTenant();
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State: Step 1 (Business Info)
  const [studioName, setStudioName] = useState('Sterling Grand Studios');
  const [businessType, setBusinessType] = useState('wedding_portrait');
  const [ownerName, setOwnerName] = useState(user?.full_name || 'Alexander Sterling');
  const [contactEmail, setContactEmail] = useState(user?.email || 'principal@sterlinggrand.com');
  const [contactPhone, setContactPhone] = useState('+91 98200 78900');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [country, setCountry] = useState('India');
  const [website, setWebsite] = useState('https://sterlinggrand.in');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Form State: Step 2 (Preferences)
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [servicesOffered, setServicesOffered] = useState<string[]>([
    'Wedding Photography',
    'Cinematic Films',
    'Pre-Wedding Shoots',
    'Drone Aerial Coverage',
  ]);
  const [teamSizeRange, setTeamSizeRange] = useState('1-5');
  const [eventCategories, setEventCategories] = useState<string[]>([
    'Weddings',
    'Pre-Wedding',
    'Receptions',
    'Sangeet & Mehendi',
  ]);

  // Form State: Step 3 (Team Setup)
  const [teamInvites, setTeamInvites] = useState<Array<{ name: string; email: string; role: TenantRole }>>([
    { name: '', email: '', role: 'photographer' },
  ]);

  // Created Tenant result for Step 4
  const [createdTenantData, setCreatedTenantData] = useState<{ id: string; name: string } | null>(null);

  // Load saved draft on mount
  useEffect(() => {
    if (!isOpen) return;
    const draft = getOnboardingDraft();
    if (draft) {
      setHasDraft(true);
      if (draft.step && draft.step < 4) setStep(draft.step);
      if (draft.studio_name) setStudioName(draft.studio_name);
      if (draft.business_type) setBusinessType(draft.business_type);
      if (draft.owner_name) setOwnerName(draft.owner_name);
      if (draft.contact_email) setContactEmail(draft.contact_email);
      if (draft.contact_phone) setContactPhone(draft.contact_phone);
      if (draft.city) setCity(draft.city);
      if (draft.state) setState(draft.state);
      if (draft.country) setCountry(draft.country);
      if (draft.website) setWebsite(draft.website);
      if (draft.logo_url) setLogoUrl(draft.logo_url);
      if (draft.timezone) setTimezone(draft.timezone);
      if (draft.currency) setCurrency(draft.currency);
      if (draft.currency_symbol) setCurrencySymbol(draft.currency_symbol);
      if (draft.date_format) setDateFormat(draft.date_format);
      if (draft.services_offered) setServicesOffered(draft.services_offered);
      if (draft.team_size_range) setTeamSizeRange(draft.team_size_range);
      if (draft.event_categories) setEventCategories(draft.event_categories);
      if (draft.initial_team_members && draft.initial_team_members.length > 0) {
        setTeamInvites(draft.initial_team_members);
      }
    } else if (user) {
      if (user.full_name) setOwnerName(user.full_name);
      if (user.email) setContactEmail(user.email);
    }
  }, [isOpen]);

  // Persist draft on changes
  const saveCurrentProgress = (nextStep: number) => {
    saveOnboardingDraft({
      step: nextStep,
      studio_name: studioName,
      business_type: businessType,
      owner_name: ownerName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      city,
      state,
      country,
      website,
      logo_url: logoUrl || undefined,
      timezone,
      currency,
      currency_symbol: currencySymbol,
      date_format: dateFormat,
      services_offered: servicesOffered,
      team_size_range: teamSizeRange,
      event_categories: eventCategories,
      initial_team_members: teamInvites.filter((t) => t.email.trim() !== ''),
    });
  };

  if (!isOpen) return null;

  // Handle Logo Upload Preview
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Logo image size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setLogoUrl(uploadEvent.target?.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Services Offered
  const toggleService = (service: string) => {
    setServicesOffered((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  // Toggle Event Categories
  const toggleCategory = (cat: string) => {
    setEventCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Team Invite Rows
  const addInviteRow = () => {
    setTeamInvites((prev) => [...prev, { name: '', email: '', role: 'photographer' }]);
  };

  const removeInviteRow = (index: number) => {
    setTeamInvites((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateInviteRow = (index: number, field: 'name' | 'email' | 'role', value: any) => {
    setTeamInvites((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Navigation handlers
  const handleNextFromStep1 = () => {
    setErrorMessage(null);
    if (!studioName.trim() || studioName.trim().length < 2) {
      setErrorMessage('Please enter a valid studio name (minimum 2 characters).');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Please enter the studio principal or owner name.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMessage('Please provide a valid primary studio contact email.');
      return;
    }
    saveCurrentProgress(2);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setErrorMessage(null);
    if (servicesOffered.length === 0) {
      setErrorMessage('Please select at least one photography or cinema service.');
      return;
    }
    saveCurrentProgress(3);
    setStep(3);
  };

  // Final Tenant Provisioning Trigger (Atomic DB Transaction)
  const handleFinalSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const validInvites = teamInvites.filter((t) => t.email.trim() && t.email.includes('@'));

      const payload: RegisterStudioParams = {
        studio_name: studioName.trim(),
        business_type: businessType,
        owner_name: ownerName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        website: website.trim(),
        logo_url: logoUrl || undefined,
        timezone,
        currency,
        currency_symbol: currencySymbol,
        date_format: dateFormat,
        services_offered: servicesOffered,
        team_size_range: teamSizeRange,
        event_categories: eventCategories,
        initial_team_members: validInvites,
      };

      const created = await registerStudioWorkspace(payload);
      setCreatedTenantData({ id: created.tenant_id || created.id!, name: created.name });
      setStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to provision studio workspace. Please check your parameters and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[92vh] overflow-y-auto font-sans selection:bg-amber-500/20 selection:text-amber-200">
        {/* Top Header & Close */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/10">
              <Camera className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-zinc-100 tracking-tight">
                Studio Workspace Setup
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Step {step} of 4 · {step === 1 ? 'Business Identity' : step === 2 ? 'Studio Preferences' : step === 3 ? 'Crew Invitation' : 'Launch Ready'}
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

        {/* Step Progress Indicators */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? 'bg-amber-500'
                    : s < step
                    ? 'bg-emerald-500'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          {/* Interrupted Onboarding Resume Notice */}
          {hasDraft && step < 4 && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Resumed from saved draft. Your progress has been safely preserved.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearOnboardingDraft();
                  setHasDraft(false);
                }}
                className="text-[11px] underline hover:text-amber-200"
              >
                Reset
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* STEP 1: BUSINESS INFORMATION */}
        {step === 1 && (
          <div className="py-4 space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                1. Tell us about your photography & cinema studio
              </h3>
              <p className="text-xs text-zinc-400">
                This configures your tenant workspace name, branding, and legal invoicing identity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Studio Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Studio Business Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="e.g. Royal Wedding Cinema"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                />
              </div>

              {/* Business Type */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Business Specialization
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setBusinessType(type.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        businessType === type.id
                          ? 'bg-amber-500/10 border-amber-500/60 text-zinc-100'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="text-xs font-semibold">{type.label}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Owner Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Studio Founder / Owner Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Alexander Sterling"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              {/* Contact Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Primary Studio Email <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@royalweddingphoto.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Contact Phone (WhatsApp Dispatch)
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98200 78900"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              {/* Website / Portfolio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Website / Portfolio URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://royalweddingphoto.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              {/* Location: City, State, Country */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">State / Province</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              {/* Studio Logo Upload */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Studio Logo Brand Mark
                </label>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Studio Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Recommended: Transparent PNG or SVG, min. 400x400px (Max 2MB).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 flex items-center justify-end border-t border-zinc-800">
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/10"
              >
                <span>Continue to Studio Preferences</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS PREFERENCES */}
        {step === 2 && (
          <div className="py-4 space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                2. Regional & Production Preferences
              </h3>
              <p className="text-xs text-zinc-400">
                Defaults are pre-configured to Indian Standard Time (IST) and Indian Rupee (₹).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Currency */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">Operating Currency</label>
                <div className="flex items-center gap-2">
                  <select
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      if (e.target.value === 'INR') setCurrencySymbol('₹');
                      else if (e.target.value === 'USD') setCurrencySymbol('$');
                      else if (e.target.value === 'EUR') setCurrencySymbol('€');
                      else if (e.target.value === 'GBP') setCurrencySymbol('£');
                      else if (e.target.value === 'AED') setCurrencySymbol('AED');
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                  >
                    <option value="INR">INR — Indian Rupee (₹)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="GBP">GBP — British Pound (£)</option>
                    <option value="AED">AED — UAE Dirham</option>
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">Studio Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+05:30) — Default</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, UTC+04:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+08:00)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/10/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/25/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-25)</option>
                </select>
              </div>

              {/* Team Size Range */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">Team Size</label>
                <select
                  value={teamSizeRange}
                  onChange={(e) => setTeamSizeRange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40"
                >
                  <option value="1-5">1 - 5 photographers & editors</option>
                  <option value="6-15">6 - 15 crew members</option>
                  <option value="16-30">16 - 30 studio specialists</option>
                  <option value="30+">30+ multi-city agency</option>
                </select>
              </div>

              {/* Services Offered */}
              <div className="space-y-2 sm:col-span-2 pt-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Services Offered (Select all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AVAILABLE_SERVICES.map((srv) => {
                    const isSelected = servicesOffered.includes(srv);
                    return (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => toggleService(srv)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 font-medium'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="truncate">{srv}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Event Categories */}
              <div className="space-y-2 sm:col-span-2 pt-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Default Event Categories
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEFAULT_CATEGORIES.map((cat) => {
                    const isSelected = eventCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-zinc-850 border-amber-500/40 text-zinc-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNextFromStep2}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/10"
              >
                <span>Continue to Crew Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TEAM SETUP */}
        {step === 3 && (
          <div className="py-4 space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                3. Invite Your Photography Crew & Editors
              </h3>
              <p className="text-xs text-zinc-400">
                Dispatch invites to team members, managers, and editors. You can also skip this and add them anytime later.
              </p>
            </div>

            <div className="space-y-3">
              {teamInvites.map((invite, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 items-center"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Teammate Name"
                      value={invite.name}
                      onChange={(e) => updateInviteRow(index, 'name', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="email"
                      placeholder="colleague@studio.com"
                      value={invite.email}
                      onChange={(e) => updateInviteRow(index, 'email', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={invite.role}
                      onChange={(e) => updateInviteRow(index, 'role', e.target.value as TenantRole)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/80"
                    >
                      <option value="manager">Studio Manager</option>
                      <option value="photographer">Lead Photographer</option>
                      <option value="videographer">Cinematographer</option>
                      <option value="editor">Colorist / Editor</option>
                      <option value="freelancer">Freelancer Crew</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex justify-center">
                    {teamInvites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInviteRow(index)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addInviteRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Another Crew Member</span>
              </button>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Skip for Now
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-zinc-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>Creating Studio Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Launch Studio</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETION */}
        {step === 4 && (
          <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative inline-block">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 shadow-2xl shadow-amber-500/20 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Studio Logo" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-10 h-10 text-zinc-950" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center text-zinc-950">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-display font-semibold text-zinc-100 tracking-tight">
                Welcome to {createdTenantData?.name || studioName}!
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your dedicated photography SaaS workspace has been successfully created with atomic database isolation. You have been assigned as the verified <span className="text-amber-400 font-medium">Studio Owner</span>.
              </p>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto text-left font-mono text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-zinc-400 text-[10px] uppercase">Base Currency</div>
                <div className="text-zinc-200 font-semibold mt-1">{currency} ({currencySymbol})</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-zinc-400 text-[10px] uppercase">Timezone</div>
                <div className="text-zinc-200 font-semibold mt-1">IST (Asia/Kolkata)</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="text-zinc-400 text-[10px] uppercase">Role Assigned</div>
                <div className="text-amber-400 font-semibold mt-1">Studio Owner</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateToBooking) onNavigateToBooking();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
              >
                Create First Booking
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateToTeam) onNavigateToTeam();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
              >
                Manage Crew & Permissions
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/10"
              >
                Enter Studio Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
