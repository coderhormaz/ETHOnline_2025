import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center"
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-500`} />
    </motion.div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-card backdrop-blur-xl rounded-3xl p-8 shadow-premium">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <LoadingSpinner size="lg" />
    </div>
  );
}
