import { motion } from 'framer-motion';
import { getRiskLabel, getRiskColor } from '../services/portfolio';

interface RiskBadgeProps {
  riskLevel: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ riskLevel, size = 'md' }: RiskBadgeProps) {
  const label = getRiskLabel(riskLevel);
  const colorClass = getRiskColor(riskLevel);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center justify-center font-semibold rounded-lg ${colorClass} ${sizeClasses[size]}`}
    >
      {label} Risk
    </motion.span>
  );
}
