import React, { useState, useEffect } from 'react';
import {
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterPageProps {
  onSuccess?: () => void;
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const {
    signUpWithEmail,
    signInWithOAuth,
    resendVerificationEmail,
    clearAuthError,
  } = useAuth();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verification Pending Screen State
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Real-time password strength checks
  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    clearAuthError();

    // Field Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid studio email address.');
      return;
    }

    if (!hasMinLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must accept the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUpWithEmail(email.trim(), password, fullName.trim());

      if (result.error) {
        if (result.error.toLowerCase().includes('already registered') || result.error.toLowerCase().includes('already exists')) {
          setErrorMessage('An account with this email already exists. Please sign in instead.');
        } else if (result.error.toLowerCase().includes('rate limit')) {
          setErrorMessage('Too many signup attempts. Please wait 60 seconds before trying again.');
        } else {
          setErrorMessage(result.error);
        }
      } else if (result.requiresEmailConfirmation) {
        setRegisteredEmail(email.trim());
        setVerificationPending(true);
        setResendCooldown(60);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error encountered during registration. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsOAuthSubmitting(true);
    try {
      const { error } = await signInWithOAuth('google');
      if (error) {
        setErrorMessage(error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setIsOAuthSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess(null);
    try {
      const { error, message } = await resendVerificationEmail(registeredEmail);
      if (error) {
        setErrorMessage(error);
      } else {
        setResendSuccess(message || 'A fresh confirmation link has been sent to your email.');
        setResendCooldown(60);
      }
    } finally {
      setIsResending(false);
    }
  };

  // Dedicated Screen: Email Verification Pending
  if (verificationPending) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-amber-500/20 selection:text-amber-200">
        {/* Subtle Dark Studio Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-semibold text-zinc-100 tracking-tight">
              Check Your Studio Email
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We have dispatched a secure confirmation link to:
            </p>
            <div className="inline-block px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 font-mono text-xs text-amber-300">
              {registeredEmail}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-850 text-left space-y-2 text-xs text-zinc-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Click the verification link in the email to activate your account.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Once confirmed, you will be redirected to setup your studio workspace.</span>
            </div>
          </div>

          {resendSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendCooldown > 0 || isResending}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 disabled:bg-zinc-850 text-zinc-200 disabled:text-zinc-500 border border-zinc-700 text-xs font-medium transition-colors"
            >
              {isResending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>
                {resendCooldown > 0
                  ? `Resend link in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </span>
            </button>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Already verified? <span className="text-amber-400 font-medium">Sign in to your studio</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Cinematic Lighting Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-zinc-800/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/10">
              <Camera className="w-5 h-5 text-zinc-950" />
            </div>
            <div className="text-left">
              <span className="text-xl font-display font-semibold tracking-tight text-zinc-100">
                SnapFlow <span className="text-amber-400 font-normal">Studio</span>
              </span>
              <p className="text-[11px] font-mono text-zinc-400 tracking-wider uppercase">
                Enterprise Multi-Tenant SaaS
              </p>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-zinc-100 tracking-tight pt-2">
            Create Your Studio Account
          </h1>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            Manage weddings, crew dispatches, client billing, and post-production under your dedicated photography workspace.
          </p>
        </div>

        {/* Registration Card */}
        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Social Sign-In (Google OAuth) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isOAuthSubmitting}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-all shadow-sm"
          >
            {isOAuthSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.54 0 2.93.53 4.02 1.57l3.01-3.01C17.21 1.83 14.77 1 12 1 7.48 1 3.65 3.58 1.81 7.34l3.66 2.84C6.35 7.15 8.94 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.89c2.17-2 3.7-4.94 3.7-8.71z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.47 14.82c-.24-.72-.38-1.49-.38-2.32 0-.83.14-1.6.38-2.32L1.81 7.34C1.06 8.87.63 10.6.63 12.5s.43 3.63 1.18 5.16l3.66-2.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.72-2.89c-1.07.72-2.45 1.16-4.21 1.16-3.06 0-5.65-2.15-6.53-5.18L1.81 16.02C3.65 19.78 7.48 23 12 23z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <span className="relative px-3 bg-zinc-900 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Or Register with Studio Email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alexander Sterling"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Studio Email Address <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="principal@royalweddingphoto.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Password <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength checklist */}
              {password && (
                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>8+ Chars</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasLetters ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Letters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumbers ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Numbers</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Confirm Password <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full bg-zinc-950 border rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors ${
                    confirmPassword && !passwordsMatch
                      ? 'border-rose-700 focus:border-rose-500 focus:ring-rose-500/40'
                      : 'border-zinc-800 focus:border-amber-500/80 focus:ring-amber-500/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-rose-400">Passwords do not match.</p>
              )}
            </div>

            {/* Terms and Privacy Policy Acceptance */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500/40 focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <span className="text-xs text-zinc-400 leading-relaxed">
                  I accept the{' '}
                  <span className="text-zinc-200 font-medium">Terms of Service</span> and{' '}
                  <span className="text-zinc-200 font-medium">Privacy Policy</span>. I agree to receive essential studio dispatch and security notifications.
                </span>
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-zinc-950 font-semibold text-xs transition-colors shadow-lg shadow-amber-500/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Provisioning Studio Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Setup Studio</span>
                  <ArrowRight className="w-4 h-4 text-zinc-950" />
                </>
              )}
            </button>
          </form>

          {/* Toggle to Login */}
          <div className="pt-2 text-center text-xs text-zinc-400">
            Already have a studio workspace?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Security & Multi-Tenant Assurance Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>PostgreSQL RLS Protected</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>No Passwords Stored in App DB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
