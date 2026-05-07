'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type LightboxPhoto = { path: string; width: number; height: number };

interface Props {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export default function Lightbox({ photos, index, onClose, onIndexChange }: Props) {
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const current = photos[index];

  const next = useMemo(
    () => () => onIndexChange((index + 1) % photos.length),
    [index, onIndexChange, photos.length]
  );
  const prev = useMemo(
    () => () => onIndexChange((index - 1 + photos.length) % photos.length),
    [index, onIndexChange, photos.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, next, prev]);

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <button
          aria-label="关闭"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X size={20} />
        </button>
        {photos.length > 1 && (
          <>
            <button
              aria-label="上一张"
              className="hidden sm:flex absolute left-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              aria-label="下一张"
              className="hidden sm:flex absolute right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {index + 1} / {photos.length}
        </div>
        <motion.img
          key={current.path}
          src={current.path}
          alt=""
          className="lightbox-img pinch-zoom"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart == null) return;
            const dx = e.changedTouches[0].clientX - touchStart;
            if (Math.abs(dx) > 60) {
              if (dx < 0) next();
              else prev();
            }
            setTouchStart(null);
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
