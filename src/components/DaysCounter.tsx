'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  startDate: string; // YYYY-MM-DD - when 'we' began
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function diffParts(from: Date, to: Date) {
  // Days inclusive
  const a = new Date(from);
  a.setHours(0, 0, 0, 0);
  const b = new Date(to);
  b.setHours(0, 0, 0, 0);
  const days = Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;

  // hours/minutes/seconds since midnight today
  const h = to.getHours();
  const m = to.getMinutes();
  const s = to.getSeconds();
  return { days, h, m, s };
}

export default function DaysCounter({ startDate }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <div className="text-center py-12">
        <div className="font-display text-7xl text-text-muted">…</div>
      </div>
    );
  }

  const { days, h, m, s } = diffParts(new Date(startDate), now);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center select-none"
    >
      <div className="text-text-muted text-sm font-serif tracking-wide mb-1">我们已经在一起</div>
      <div className="flex items-baseline justify-center gap-2 sm:gap-3">
        <motion.span
          key={days}
          initial={{ scale: 0.96, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-display text-7xl sm:text-8xl text-gradient leading-none"
        >
          {days}
        </motion.span>
        <span className="font-serif text-2xl sm:text-3xl text-text-primary">天</span>
      </div>
      <div className="font-mono text-text-muted text-sm mt-2 tracking-widest">
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
    </motion.div>
  );
}
