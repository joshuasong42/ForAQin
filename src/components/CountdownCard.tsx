'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  days: number;
  color?: string;
  className?: string;
}

export default function CountdownCard({ emoji, title, subtitle, days, color = '#a896c4', className }: Props) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        'min-w-[180px] sm:min-w-[200px] px-5 py-4 rounded-2xl glass flex-shrink-0',
        className
      )}
      style={{ borderColor: `${color}33` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xl">{emoji}</span>
        <span className="text-sm text-text-muted font-serif">{title}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-4xl leading-none" style={{ color }}>
          {days}
        </span>
        <span className="text-text-muted text-sm">天</span>
      </div>
      {subtitle && <div className="text-xs text-text-subtle mt-1.5">{subtitle}</div>}
    </motion.div>
  );
}
