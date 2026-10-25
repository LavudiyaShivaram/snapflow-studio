import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Loader2,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToReset?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateToRegister,
  onNavigateToReset,
}) => {
  const { signInWithEmail, isDemoMode, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    clearAuthError();

    // Client-side validation
    if (!email.trim()) {
      setErrorMessage('Please enter your studio email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email format (e.g. photographer@studio.com).');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signInWithEmail(email.trim(), password);

      if (error) {
        // Human-friendly error translation
        if (error.includes('Invalid login credentials') || error.includes('invalid_grant')) {
          setErrorMessage('Incorrect email or password. Please verify your credentials and try again.');
        } else if (error.includes('Email not confirmed')) {
          setErrorMessage('Your studio email has not been confirmed yet. Please verify your inbox.');
        } else if (error.includes('Too many requests')) {
          setErrorMessage('Too many consecutive sign-in attempts. Please wait 60 seconds before retrying.');
        } else {
          setErrorMessage(error);
        }
      } else {
        // Success
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to the authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signInWithEmail(demoEmail, 'password123');
      if (error) {
        setErrorMessage(error);
      } else if (onSuccess) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6">
      {/* Studio Brand Header */}
      <div className="space-y-1.5 text-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 font-bold mx-auto mb-3 shadow-lg shadow-amber-500/15">
          <Camera className="w-5 h-5 text-zinc-950" />
        </div>
        <h2 className="text-xl font-display font-semibold text-zinc-100 tracking-tight">
          Sign In to SnapFlow Studio
        </h2>
        <p className="text-xs text-zinc-400">
          Enter your photography business credentials to access your workspace.
        </p>
      </div>

      {/* Error Callout Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-red-300">Authentication Failed</span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Quick Demo Credentials Panel */}
      <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-850 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-400/90">
          <span>Demonstration Studio Accounts</span>
          <span>1-Click Test</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoSignIn('alexander@royalweddingphoto.com', 'Studio Owner')}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-left transition-colors truncate group focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <div className="font-medium text-xs text-zinc-200 truncate group-hover:text-amber-300">
              Alexander Sterling
            </div>
            <div className="text-[10px] font-mono text-amber-400/90">Owner Persona</div>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDemoSignIn('clara@royalweddingphoto.com', 'Studio Manager')}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-left transition-colors truncate group focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <div className="font-medium text-xs text-zinc-200 truncate group-hover:text-amber-300">
              Clara Oswald
            </div>
            <div className="text-[10px] font-mono text-zinc-400">Manager Persona</div>
          </button>
        </div>
      </div>

      {/* Main Sign-In Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Email Input */}
        <div>
          <label htmlFor="login-email" className="block text-zinc-300 font-medium mb-1.5">
            Studio Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="director@royalweddingphoto.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Password Input with Visibility Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-zinc-300 font-medium">
              Password
            </label>
            {onNavigateToReset && (
              <button
                type="button"
                onClick={onNavigateToReset}
                className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-zinc-950 font-semibold text-xs shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      {onNavigateToRegister && (
        <div className="pt-2 border-t border-zinc-850 text-center">
          <p className="text-xs text-zinc-400">
            Need to register a new photography business?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Create Studio Account
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
