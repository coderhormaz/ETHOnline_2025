import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowRight, Zap, Shield, Wallet, QrCode, Globe, CheckCircle2, Sparkles } from 'lucide-react';
import { fadeIn, slideUp, staggerContainer } from '../lib/animations';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Wallet,
      title: 'Instant Wallet Creation',
      description: 'Your secure wallet is automatically created when you sign up. No complex setup or seed phrases to remember.',
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Transfers',
      description: 'Send and receive PYUSD instantly on Arbitrum. No waiting, no delays - just instant payments.',
      gradient: 'from-accent-500 to-accent-600',
    },
    {
      icon: QrCode,
      title: 'Simple Payment Handles',
      description: 'Get your unique @handle like @username@pyusd. Share it with anyone - no long wallet addresses needed.',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your private keys are encrypted with AES-256. We never have access to your funds - you\'re always in control.',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Globe,
      title: 'Built on Arbitrum',
      description: 'Powered by Arbitrum\'s fast and low-cost Layer 2 solution. Experience blockchain without the high fees.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: Sparkles,
      title: 'Beautiful Experience',
      description: 'Enjoy a premium, intuitive interface designed for everyone. Web3 payments made simple and delightful.',
      gradient: 'from-orange-500 to-red-600',
    },
  ];

  const stats = [
    { value: 'Instant', label: 'Transactions' },
    { value: '0.01+', label: 'Min. Amount' },
    { value: 'AES-256', label: 'Encryption' },
    { value: '24/7', label: 'Available' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  PYUSD Pay
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Instant Crypto Payments
                </p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-4"
            >
              <motion.button
                onClick={() => navigate('/')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                Sign In
              </motion.button>
              <motion.button
                onClick={() => navigate('/signup')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold bg-gradient-primary text-white rounded-xl hover:shadow-glow transition-all min-h-[44px] flex items-center gap-2"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
        {/* Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 -left-20 w-72 h-72 sm:w-96 sm:h-96 bg-primary-200 dark:bg-primary-900/20 rounded-full blur-3xl opacity-30"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 -right-20 w-96 h-96 sm:w-[500px] sm:h-[500px] bg-accent-200 dark:bg-accent-900/20 rounded-full blur-3xl opacity-30"
            animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                Powered by Arbitrum
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={slideUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
            >
              Crypto Payments
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Made Simple
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={slideUp}
              className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 sm:mb-12 leading-relaxed max-w-3xl mx-auto"
            >
              Send and receive PYUSD instantly with just an @handle. No complicated addresses, no waiting - just fast, secure blockchain payments that work like magic.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-gradient-primary text-white rounded-2xl hover:shadow-glow transition-all flex items-center justify-center gap-3 min-h-[56px]"
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border-2 border-gray-200 dark:border-gray-700 min-h-[56px]"
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                Sign In
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeIn}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mt-16 sm:mt-20"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-white/50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built for everyone, from crypto beginners to blockchain experts. Simple, secure, and lightning-fast.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700"
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Get Started in Seconds
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Three simple steps to start sending and receiving PYUSD
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: '01',
                title: 'Sign Up',
                description: 'Create your account with just an email. We\'ll automatically generate your secure wallet.',
                icon: '📧',
              },
              {
                step: '02',
                title: 'Get Your Handle',
                description: 'Choose your unique @handle. This is how people will send you payments - simple!',
                icon: '✨',
              },
              {
                step: '03',
                title: 'Start Transacting',
                description: 'Send, receive, and track PYUSD payments instantly. Show your QR code or share your handle.',
                icon: '🚀',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center"
              >
                {/* Step Number */}
                <div className="text-6xl sm:text-7xl font-bold text-gray-100 dark:text-gray-800 mb-4">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="text-5xl sm:text-6xl mb-6">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Connector Line (hidden on mobile, last item) */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-24 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-accent-300 dark:from-primary-700 dark:to-accent-700 -translate-x-1/2" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 sm:py-32 bg-gray-900 dark:bg-black text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full mb-6">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-300">
                  Military-Grade Security
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Your Security is Our Priority
              </h2>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                We use industry-leading encryption and security practices to keep your funds safe. Your private keys are encrypted with AES-256 and never leave your device unencrypted.
              </p>

              <div className="space-y-4">
                {[
                  'AES-256 encryption for private keys',
                  'Non-custodial - you control your funds',
                  'Row-Level Security on all data',
                  'Server-side transaction signing',
                  'Built on audited smart contracts',
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl p-8 sm:p-12 backdrop-blur-xl border border-white/10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl backdrop-blur">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold">Encrypted Storage</div>
                      <div className="text-sm text-gray-400">AES-256 bit encryption</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl backdrop-blur">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold">Non-Custodial</div>
                      <div className="text-sm text-gray-400">You control your keys</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl backdrop-blur">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Globe className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold">Blockchain Verified</div>
                      <div className="text-sm text-gray-400">Transparent & immutable</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary-500 to-accent-600 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                Join thousands of users already experiencing the future of payments. Create your free account in seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-white text-primary-600 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-xl min-h-[56px]"
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur rounded-2xl hover:bg-white/20 transition-all border-2 border-white/30 min-h-[56px]"
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  Sign In
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 dark:bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <div className="text-xl font-bold">PYUSD Pay</div>
                <div className="text-sm text-gray-400">Powered by Arbitrum</div>
              </div>
            </div>

            <div className="text-center md:text-right text-sm text-gray-400">
              <p>© 2025 PYUSD Pay. All rights reserved.</p>
              <p className="mt-1">Built for ETHOnline 2025</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
