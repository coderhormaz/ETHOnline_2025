import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateHandle, checkHandleAvailability } from '../services/handle';
import { slideUp, fadeIn } from '../lib/animations';
import { LoadingSpinner } from '../components/LoadingStates';
import { useToast } from '../components/Toast';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [handleError, setHandleError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

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
    
    if (!handleAvailable) {
      showToast('Please choose an available handle', 'error');
      return;
    }

    setLoading(true);

    const result = await signUp(email, password, handle);

    if (result.success) {
      showToast('Account created! Welcome to PYUSD Pay 🎉', 'success');
      navigate('/dashboard');
    } else {
      showToast(result.error || 'Signup failed', 'error');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-12">
      <ToastContainer />
      
      <motion.div
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <motion.div variants={fadeIn} className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            PYUSD Pay
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your account & wallet
          </p>
        </motion.div>

        {/* Signup Card */}
        <motion.div
          variants={slideUp}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-premium p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Get Started
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Handle Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Handle
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  required
                  className="w-full pl-12 pr-24 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="yourname"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                  @pyusd
                </span>
                {checkingHandle && (
                  <div className="absolute right-24 top-1/2 -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
                {!checkingHandle && handleAvailable !== null && (
                  <div className="absolute right-24 top-1/2 -translate-y-1/2">
                    {handleAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {handleError && (
                <p className="mt-2 text-sm text-red-500">{handleError}</p>
              )}
              {handleAvailable && !handleError && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ Handle is available!
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4">
              <p className="text-xs text-primary-800 dark:text-primary-200">
                🔐 A secure wallet will be automatically created for you upon signup
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !handleAvailable}
              className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-2xl hover:shadow-glow transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/"
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
