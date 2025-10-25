import React from 'react';
import { motion } from 'framer-motion';

export function BalanceSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-3xl p-6 sm:p-8 shadow-premium relative overflow-hidden">
      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        <div className="h-4 bg-white/20 rounded-lg w-24 animate-pulse" />
        <div className="h-12 bg-white/30 rounded-xl w-48 animate-pulse" />
        <div className="h-3 bg-white/20 rounded-lg w-32 animate-pulse" />
      </div>
    </div>
  );
}

export function TransactionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* Balance Card Skeleton */}
      <BalanceSkeleton />

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
          />
        ))}
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-40" />
        <TransactionSkeleton count={2} />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-premium border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="space-y-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3" />
      </div>
    </div>
  );
}
