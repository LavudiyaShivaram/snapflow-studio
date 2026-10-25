import React, { useState } from 'react';
import {
  Camera,
  Check,
  ArrowRight,
  ArrowLeft,
  Building,
  Globe,
  Users,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

interface StudioOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudioOnboarding: React.FC<StudioOnboardingProps> = ({
  isOpen,
  onClose,
}) => {
  const { createTenant, addClient, addEvent } = useTenant();
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);

  // Form State
  const [studioName, setStudioName] = useState('Apex Fine Art Cinema');
  const [ownerName, setOwnerName] = useState(user?.full_name || 'Marcus Thorne');
  const [contactEmail, setContactEmail] = useState(user?.email || 'contact@apexcinema.com');
  const [contactPhone, setContactPhone] = useState('+91 98200 78900');
  const [address, setAddress] = useState('452 Marine Drive, Nariman Point');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [businessType, setBusinessType] = useState('wedding_portrait');
  const [firstClientName, setFirstClientName] = useState('Victoria Sterling');
  const [firstClientEmail, setFirstClientEmail] = useState('victoria@sterling.com');
  const [firstShootTitle, setFirstShootTitle] = useState('Sterling & Dupont Winter Vows');
  const [firstShootPrice, setFirstShootPrice] = useState(125000);

  if (!isOpen) return null;

  const handleFinishOnboarding = async () => {
    // 1. Create tenant and owner membership
    const newTenant = await createTenant({
      name: studioName,
      business_type: businessType,
      currency,
      currency_symbol: currencySymbol,
      timezone,
      date_format: dateFormat,
      phone: contactPhone,
      email: contactEmail,
      address,
      city: 'Mumbai',
      country: 'India',
    });

    // 2. Create the first client and booking
    if (firstClientName && firstClientEmail) {
      const names = firstClientName.split(' ');
      const client = await addClient({
        first_name: names[0] || 'Client',
        last_name: names.slice(1).join(' ') || 'VIP',
        email: firstClientEmail,
        phone: '+1 (555) 901-2244',
        city: 'New York',
        source: 'Website',
      });

      await addEvent({
        client_id: client.id,
        title: firstShootTitle,
        event_type: 'wedding',
        status: 'confirmed',
        start_date: '2026-12-18',
        end_date: '2026-12-19',
        primary_venue_name: 'St. Regis Grand Ballroom',
        total_package_price: Number(firstShootPrice),
        lead_notes: 'Initial launch booking created during studio setup.',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/10">
              <Camera className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                Multi-Tenant Studio Provisioning
              </div>
              <h2 className="text-base font-semibold text-zinc-100">Create New Photography Workspace</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="py-4 border-b border-zinc-800/80">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={step >= 1 ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
              01 Studio Identity
            </span>
            <span>·</span>
            <span className={step >= 2 ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
              02 Regional & Currency
            </span>
            <span>·</span>
            <span className={step >= 3 ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
              03 First Booking
            </span>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="py-6 text-xs space-y-4 flex-1">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-zinc-400 mb-1">Photography Studio Name *</label>
                <input
                  type="text"
                  required
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="e.g. Royal Wedding Photography, Moments Studio"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Studio Founder / Director Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Studio Primary Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Studio Business Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Primary Production Specialty</label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'wedding_portrait', label: 'Luxury Wedding & Bridal' },
                    { id: 'commercial', label: 'Commercial & Editorial' },
                    { id: 'event_media', label: 'Corporate Cinema' },
                  ].map((bt) => (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => setBusinessType(bt.id)}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        businessType === bt.id
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Operating Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      if (e.target.value === 'USD' || e.target.value === 'CAD') setCurrencySymbol('$');
                      else if (e.target.value === 'GBP') setCurrencySymbol('£');
                      else if (e.target.value === 'EUR') setCurrencySymbol('€');
                      else if (e.target.value === 'INR') setCurrencySymbol('₹');
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - United States Dollar)</option>
                    <option value="GBP">GBP (£ - British Pound Sterling)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Default Business Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - Indian Standard Time)</option>
                    <option value="America/New_York">America/New_York (Eastern)</option>
                    <option value="America/Chicago">America/Chicago (Central)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                    <option value="Europe/London">Europe/London (UK)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Date Format Preference</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDateFormat('MM/DD/YYYY')}
                    className={`p-3 rounded-xl border text-left ${
                      dateFormat === 'MM/DD/YYYY'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-zinc-200">MM/DD/YYYY</div>
                    <div className="text-[11px] text-zinc-500">United States & Canada</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFormat('DD/MM/YYYY')}
                    className={`p-3 rounded-xl border text-left ${
                      dateFormat === 'DD/MM/YYYY'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-zinc-200">DD/MM/YYYY</div>
                    <div className="text-[11px] text-zinc-500">UK, Europe & International</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Bootstrap Your Production Ledger</span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1">
                  We'll automatically initialize your studio workspace with your first flagship booking.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={firstClientName}
                    onChange={(e) => setFirstClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Client Email *</label>
                  <input
                    type="email"
                    required
                    value={firstClientEmail}
                    onChange={(e) => setFirstClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Shoot / Wedding Title *</label>
                <input
                  type="text"
                  required
                  value={firstShootTitle}
                  onChange={(e) => setFirstShootTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Contracted Package Value ({currencySymbol}) *</label>
                <input
                  type="number"
                  required
                  value={firstShootPrice}
                  onChange={(e) => setFirstShootPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-750 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishOnboarding}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs shadow-lg shadow-amber-500/10 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Launch Studio Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
