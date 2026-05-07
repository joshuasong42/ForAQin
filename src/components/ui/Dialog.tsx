'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** PC uses centered dialog, mobile uses bottom sheet by default */
  variant?: 'dialog' | 'sheet' | 'auto';
  className?: string;
}

export function Dialog({ open, onClose, title, children, variant = 'auto', className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={cn(
              'relative bg-bg-card border border-[var(--border-soft)] shadow-2xl w-full',
              variant === 'dialog'
                ? 'sm:max-w-lg rounded-2xl p-5 mx-4 max-h-[90vh] overflow-auto'
                : variant === 'sheet'
                  ? 'rounded-t-2xl p-5 max-h-[90vh] overflow-auto pb-safe'
                  : 'rounded-t-2xl sm:rounded-2xl p-5 sm:max-w-lg sm:mx-4 max-h-[90vh] overflow-auto pb-safe sm:pb-5',
              className
            )}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-semibold text-text-primary">{title}</div>
              <button
                aria-label="close"
                onClick={onClose}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated"
              >
                <X size={18} />
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  danger?: boolean;
}

export function Confirm({ open, onClose, onConfirm, title = '确认操作', description = '确定要继续吗？', danger }: ConfirmProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} variant="dialog">
      <p className="text-text-muted text-sm mb-5">{description}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost h-10 px-4">取消</button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn('h-10 px-4 rounded-xl font-medium', danger ? 'bg-rose/80 text-bg-base hover:bg-rose' : 'btn-primary')}
        >
          确定
        </button>
      </div>
    </Dialog>
  );
}
