import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { fadeIn } from '../lib/animations';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
    >
      {/* Icon Container */}
      <motion.div
        className="mb-6 p-6 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20"
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 dark:text-primary-400" />
      </motion.div>

      {/* Content */}
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <motion.button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-2xl hover:shadow-glow transform hover:scale-105 active:scale-95 transition-all min-h-[48px]"
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
