import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Send, QrCode, Clock, Sparkles, Wallet, User, Shield } from 'lucide-react';

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/send', icon: Send, label: 'Send' },
  { path: '/receive', icon: QrCode, label: 'Receive' },
  { path: '/transactions', icon: Clock, label: 'History' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/security', icon: Shield, label: 'Security' },
];

export function DesktopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Sparkles className="w-8 h-8 text-primary-500" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PYUSD Pay
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Crypto Payments
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all relative group
                ${isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
              `}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Icon */}
              <Icon 
                className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Label */}
              <span
                className={`text-sm font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Built on Arbitrum
        </p>
      </div>
    </motion.aside>
  );
}

// Add padding for desktop layout to account for sidebar
export function DesktopNavSpacer() {
  return <div className="hidden md:block md:w-64" />;
}
