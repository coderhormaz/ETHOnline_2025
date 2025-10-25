import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Send, QrCode, Clock, Wallet } from 'lucide-react';

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/send', icon: Send, label: 'Send' },
  { path: '/receive', icon: QrCode, label: 'Receive' },
  { path: '/transactions', icon: Clock, label: 'History' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
];

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom"
    >
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl
                transition-all relative
                ${isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
                }
              `}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon */}
              <Icon 
                className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Label */}
              <span
                className={`text-xs font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

// Add safe area padding for devices with home indicator
export function MobileNavSpacer() {
  return <div className="h-20 md:hidden" />;
}
