'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export type UploadedPhoto = { path: string; width: number; height: number };

interface Props {
  value: UploadedPhoto[];
  onChange: (next: UploadedPhoto[]) => void;
  max?: number;
  accept?: string;
  className?: string;
}

export default function PhotoUploader({ value, onChange, max = 9, accept = 'image/*', className }: Props) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const t = useToast();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      t.push(`最多上传 ${max} 张`, 'error');
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    setBusy(true);
    try {
      const fd = new FormData();
      list.forEach((f) => fd.append('files', f));
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '上传失败', 'error');
        setBusy(false);
        return;
      }
      onChange([...value, ...(data.data.photos as UploadedPhoto[])]);
    } catch {
      t.push('网络错误', 'error');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  function remove(i: number) {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
  }

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-4 gap-2', className)}>
      {value.map((p, i) => (
        <motion.div
          key={p.path}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border-soft)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.path} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="remove"
          >
            <X size={13} />
          </button>
        </motion.div>
      ))}
      {value.length < max && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className={cn(
            'relative aspect-square rounded-xl border border-dashed border-[var(--border-soft-strong)] text-text-muted',
            'flex flex-col items-center justify-center gap-1 hover:border-accent hover:text-accent transition'
          )}
        >
          <ImagePlus size={20} />
          <span className="text-xs">{busy ? '上传中…' : '添加照片'}</span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        multiple
        accept={accept}
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
