import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, CheckCircle, XCircle, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateHandle, checkHandleAvailability } from '../services/handle';
import { slideUp, fadeIn } from '../lib/animations';
import { LoadingSpinner } from '../components/LoadingStates';
import { useToast } from '../components/Toast';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [handleError, setHandleError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState({ email: '', password: '', handle: '' });
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  };

  // Update password strength on change
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  // Check handle availability
  useEffect(() => {
    const checkHandle = async () => {
      if (handle.length < 3) {
        setHandleAvailable(null);
        setHandleError('');
        return;
      }

      const validation = validateHandle(handle);
      if (!validation.valid) {
        setHandleError(validation.error || '');
        setHandleAvailable(false);
        return;
      }

      setCheckingHandle(true);
      setHandleError('');

      try {
        const available = await checkHandleAvailability(handle);
        setHandleAvailable(available);
        if (!available) {
          setHandleError('Handle is already taken');
        }
      } catch (error) {
        setHandleError('Error checking handle');
      } finally {
        setCheckingHandle(false);
      }
    };

    const debounce = setTimeout(checkHandle, 500);
    return () => clearTimeout(debounce);
  }, [handle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setFormErrors({ email: '', password: '', handle: '' });
    
    // Validate
    let hasErrors = false;
    if (!email.includes('@')) {
      setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      hasErrors = true;
    }
    if (password.length < 8) {
      setFormErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      hasErrors = true;
    }
    if (!handleAvailable) {
      setFormErrors(prev => ({ ...prev, handle: 'Please choose an available handle' }));
      hasErrors = true;
    }
    
    if (hasErrors) {
      showToast('Please fix the errors below', 'error');
      return;
    }

    setLoading(true);

    const result = await signUp(email, password, handle);

    if (result.success) {
      showToast('🎉 Account created! Your wallet is ready!', 'success');
      // Add a small delay to show success before navigating
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      showToast(result.error || 'Signup failed', 'error');
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-accent-200 dark:bg-accent-900/20 rounded-full blur-3xl opacity-20"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-96 h-96 bg-primary-200 dark:bg-primary-900/20 rounded-full blur-3xl opacity-20"
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>
      
      <ToastContainer />
      
      <motion.div
        initial="initial"
        animate="animate"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Brand */}
        <motion.div variants={fadeIn} className="text-center mb-8">
          <Link to="/home" className="inline-block">
            <motion.div
              className="inline-flex items-center justify-center mb-4"
              whileHover={{ scale: 1.05, rotate: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="w-12 h-12 text-primary-500" />
            </motion.div>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            PYUSD Pay
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create your account & wallet
          </p>
        </motion.div>

        {/* Signup Card */}
        <motion.div
          variants={slideUp}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-premium p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Get Started
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your crypto payment account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                  required
                  autoComplete="email"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200`}
                  placeholder="you@example.com"
                />
              </div>
              {formErrors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500"
                >
                  {formErrors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormErrors(prev => ({ ...prev, password: '' }));
                  }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:text-primary-500"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500"
                >
                  {formErrors.password}
                </motion.p>
              )}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Password Strength:</span>
                    <span className={`font-medium ${passwordStrength <= 1 ? 'text-red-500' : passwordStrength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200 dark:bg-gray-600'}`}
                      />
                    ))}
                  </div>
                  <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <li className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                      • Uppercase & lowercase letters
                    </li>
                    <li className={/\d/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                      • Contains numbers
                    </li>
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Handle Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Handle
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value.toLowerCase());
                    setFormErrors(prev => ({ ...prev, handle: '' }));
                  }}
                  required
                  autoComplete="off"
                  className={`w-full pl-12 pr-28 py-3.5 rounded-2xl border ${handleError || formErrors.handle ? 'border-red-500' : handleAvailable ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200`}
                  placeholder="yourname"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  @pyusd
                </span>
                {checkingHandle && (
                  <div className="absolute right-28 top-1/2 -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
                {!checkingHandle && handleAvailable !== null && handle.length >= 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-28 top-1/2 -translate-y-1/2"
                  >
                    {handleAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </motion.div>
                )}
              </div>
              {(handleError || formErrors.handle) && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500"
                >
                  {handleError || formErrors.handle}
                </motion.p>
              )}
              {handleAvailable && !handleError && handle.length >= 3 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  {handle}@pyusd is available!
                </motion.p>
              )}
            </div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 border border-primary-100 dark:border-primary-800"
            >
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary-800 dark:text-primary-200">
                  A secure wallet will be automatically created and encrypted for you upon signup
                </p>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !handleAvailable}
              whileHover={{ scale: loading || !handleAvailable ? 1 : 1.02 }}
              whileTap={{ scale: loading || !handleAvailable ? 1 : 0.98 }}
              className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-2xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"
              />
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/"
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline inline-flex items-center gap-1 group"
              >
                Sign in
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={fadeIn}
          className="text-center mt-8 text-xs text-gray-500 dark:text-gray-400"
        >
          Secured by Arbitrum • Powered by PYUSD
        </motion.p>
      </motion.div>
    </div>
  );
}
