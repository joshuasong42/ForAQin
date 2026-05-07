'use client';

import { useState } from 'react';
import Lightbox from './Lightbox';
import { motion } from 'framer-motion';

export type GridPhoto = { path: string; width: number; height: number };

interface Props {
  photos: GridPhoto[];
  /** Tailwind cols string for desktop & mobile */
  cols?: string;
  className?: string;
}

export default function PhotoGrid({ photos, cols = 'grid-cols-3 md:grid-cols-4', className = '' }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className={`grid gap-1.5 ${cols} ${className}`}>
        {photos.map((p, i) => (
          <motion.button
            key={p.path}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="relative aspect-square overflow-hidden rounded-lg group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.path}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition group-hover:scale-105"
              draggable={false}
            />
          </motion.button>
        ))}
      </div>
      {openIdx !== null && (
        <Lightbox
          photos={photos}
          index={openIdx}
          onClose={() => setOpenIdx(null)}
          onIndexChange={(i) => setOpenIdx(i)}
        />
      )}
    </>
  );
}
