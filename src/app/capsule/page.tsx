'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Lock, Hourglass, Trash2 } from 'lucide-react';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/ui/Button';
import { Dialog, Confirm } from '@/components/ui/Dialog';
import { Input, Textarea } from '@/components/ui/Input';
import PhotoUploader, { UploadedPhoto } from '@/components/PhotoUploader';
import PhotoGrid from '@/components/PhotoGrid';
import { useToast } from '@/components/ui/Toast';
import { formatCN, daysBetween } from '@/lib/dates';

type CapsuleListItem = {
  id: number;
  title: string;
  unlockAt: number;
  authorId: number;
  authorName: string;
  createdAt: number;
  locked: boolean;
};

type CapsuleDetail = CapsuleListItem & {
  content?: string;
  photos?: { path: string; width: number; height: number }[];
};

type Me = { id: number };

function tomorrowYMD() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function CapsulePage() {
  const t = useToast();
  const [list, setList] = useState<CapsuleListItem[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockAt, setUnlockAt] = useState(tomorrowYMD());
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [open, setOpen] = useState<CapsuleDetail | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  async function load() {
    const [m, ls] = await Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/capsules').then((r) => r.json()),
    ]);
    if (m.ok) setMe(m.data);
    if (ls.ok) setList(ls.data);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (!title.trim() || !content.trim()) {
      t.push('请填写标题和内容', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), unlockAt, photos }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '保存失败', 'error');
        return;
      }
      t.push('胶囊已封存 ⏳', 'success');
      setCreating(false);
      setTitle('');
      setContent('');
      setPhotos([]);
      setUnlockAt(tomorrowYMD());
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function openCapsule(item: CapsuleListItem) {
    if (item.locked) {
      // open a teaser dialog showing locked countdown
      setOpen({ ...item });
      return;
    }
    const res = await fetch(`/api/capsules/${item.id}`).then((r) => r.json());
    if (!res.ok) {
      t.push(res.error || '加载失败', 'error');
      return;
    }
    setOpen(res.data);
  }

  async function remove(id: number) {
    const res = await fetch(`/api/capsules/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) {
      t.push(data.error || '删除失败', 'error');
      return;
    }
    t.push('已删除');
    setOpen(null);
    load();
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28 md:pb-10">
        <header className="mb-6">
          <h1 className="font-serif text-2xl">时光胶囊</h1>
          <p className="text-text-muted text-sm mt-1">
            封存一段心情、一封情书，到那一天才会自动解锁。
          </p>
        </header>

        {list === null ? (
          <div className="text-text-muted text-sm">加载中…</div>
        ) : list.length === 0 ? (
          <EmptyState
            title="还没有任何胶囊"
            description="把秘密、情书、未来想说的话先封存起来，等到约定的日期再打开。"
            icon={<Hourglass size={24} />}
          />
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {list.map((c) => {
                const days = daysBetween(new Date(), new Date(c.unlockAt));
                return (
                  <motion.li
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      onClick={() => openCapsule(c)}
                      className={`w-full text-left card hover:border-accent/40 transition relative overflow-hidden ${c.locked ? 'opacity-90' : ''}`}
                    >
                      {c.locked && (
                        <div className="absolute inset-0 bg-bg-base/70 backdrop-blur-[3px] flex flex-col items-center justify-center gap-1 z-10">
                          <Lock size={20} className="text-accent" />
                          <span className="text-sm text-text-muted">还需 {Math.max(days, 0)} 天</span>
                          <span className="text-xs text-text-subtle">{formatCN(c.unlockAt)} 解锁</span>
                        </div>
                      )}
                      <div className="text-xs text-text-muted mb-1">
                        来自 {c.authorName} · {formatCN(c.createdAt)}
                      </div>
                      <div className="font-serif text-lg">{c.title}</div>
                      <div className="text-xs text-text-subtle mt-2">解锁日 · {formatCN(c.unlockAt)}</div>
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </main>

      <button
        onClick={() => setCreating(true)}
        aria-label="封存胶囊"
        className="fixed right-5 bottom-20 md:bottom-8 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-rose flex items-center justify-center shadow-lg shadow-accent/40 active:scale-95 transition"
      >
        <Plus size={22} className="text-bg-base" />
      </button>

      {/* Create */}
      <Dialog open={creating} onClose={() => setCreating(false)} title="封存一颗时光胶囊">
        <div className="space-y-3">
          <Input label="标题" placeholder="给一年后的你" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label="解锁日期"
            type="date"
            value={unlockAt}
            min={tomorrowYMD()}
            onChange={(e) => setUnlockAt(e.target.value)}
          />
          <Textarea
            label="想说的话"
            placeholder="此刻的心情会在那天送达…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
          <PhotoUploader value={photos} onChange={setPhotos} max={9} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>取消</Button>
            <Button onClick={submit} loading={submitting}>封存</Button>
          </div>
        </div>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!open} onClose={() => setOpen(null)} title={open?.title || '胶囊'}>
        {open && (
          <div>
            <div className="text-xs text-text-muted mb-3">
              来自 {open.authorName} · 封存于 {formatCN(open.createdAt)} · 解锁日 {formatCN(open.unlockAt)}
            </div>
            {open.locked ? (
              <div className="py-8 text-center">
                <Lock size={28} className="mx-auto mb-3 text-accent" />
                <div className="text-text-primary mb-1">这颗胶囊还在沉睡</div>
                <div className="text-sm text-text-muted">
                  需要等到 {formatCN(open.unlockAt)} 才能打开哦。
                </div>
              </div>
            ) : (
              <>
                {open.content && (
                  <p className="whitespace-pre-wrap leading-loose text-text-primary mb-4">{open.content}</p>
                )}
                {open.photos && open.photos.length > 0 && (
                  <PhotoGrid photos={open.photos} cols="grid-cols-3" />
                )}
              </>
            )}
            {me?.id === open.authorId && (
              <div className="mt-5 pt-3 border-t border-[var(--border-soft)] flex justify-end">
                <button
                  onClick={() => setConfirmDel(open.id)}
                  className="text-sm text-text-muted hover:text-rose flex items-center gap-1"
                >
                  <Trash2 size={13} /> 删除胶囊
                </button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Confirm
        open={confirmDel != null}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel != null && remove(confirmDel)}
        danger
        title="删除这颗胶囊？"
        description="删除后将永远无法恢复。"
      />
    </>
  );
}
