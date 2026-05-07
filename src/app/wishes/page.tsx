'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Sparkles } from 'lucide-react';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/ui/Button';
import { Dialog, Confirm } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import PhotoUploader, { UploadedPhoto } from '@/components/PhotoUploader';
import { useToast } from '@/components/ui/Toast';
import { formatCN } from '@/lib/dates';

type Wish = {
  id: number;
  content: string;
  completed: number;
  completedAt: number | null;
  coverPhoto: string | null;
  createdAt: number;
  authorId: number;
  authorName: string;
};

type Me = { id: number };

export default function WishesPage() {
  const t = useToast();
  const [list, setList] = useState<Wish[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [creating, setCreating] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState<Wish | null>(null);
  const [completePhoto, setCompletePhoto] = useState<UploadedPhoto[]>([]);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  async function load() {
    const [m, ls] = await Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/wishes').then((r) => r.json()),
    ]);
    if (m.ok) setMe(m.data);
    if (ls.ok) setList(ls.data);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!content.trim()) return t.push('请填写心愿', 'error');
    setSubmitting(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '失败', 'error');
        return;
      }
      t.push('已添加 ✨', 'success');
      setCreating(false);
      setContent('');
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function complete() {
    if (!completing) return;
    const cover = completePhoto[0]?.path || null;
    const res = await fetch(`/api/wishes/${completing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true, coverPhoto: cover }),
    });
    const data = await res.json();
    if (!data.ok) {
      t.push(data.error || '失败', 'error');
      return;
    }
    t.push('已实现 🎉', 'success');
    setCompleting(null);
    setCompletePhoto([]);
    load();
  }

  async function uncomplete(id: number) {
    const res = await fetch(`/api/wishes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: false, coverPhoto: null }),
    });
    const data = await res.json();
    if (!data.ok) {
      t.push(data.error || '失败', 'error');
      return;
    }
    load();
  }

  async function remove(id: number) {
    const res = await fetch(`/api/wishes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) {
      t.push(data.error || '失败', 'error');
      return;
    }
    t.push('已删除');
    load();
  }

  const pending = list?.filter((w) => w.completed === 0) || [];
  const done = list?.filter((w) => w.completed === 1) || [];

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28 md:pb-10">
        <header className="mb-6">
          <h1 className="font-serif text-2xl">心愿清单</h1>
          <p className="text-text-muted text-sm mt-1">想一起做的事，一件一件地实现。</p>
        </header>

        {list === null ? (
          <div className="text-text-muted text-sm">加载中…</div>
        ) : list.length === 0 ? (
          <EmptyState title="还没有心愿" description="想到什么就先写下来吧～" icon={<Sparkles size={22} />} />
        ) : (
          <div className="space-y-7">
            <Section title="想一起做的" count={pending.length}>
              <ul className="space-y-2">
                <AnimatePresence>
                  {pending.map((w) => (
                    <motion.li
                      key={w.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      className="card flex items-center gap-3"
                    >
                      <button
                        onClick={() => setCompleting(w)}
                        className="w-6 h-6 rounded-full border-2 border-accent/40 hover:bg-accent/10 hover:border-accent flex-shrink-0"
                        aria-label="完成"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-text-primary">{w.content}</div>
                        <div className="text-xs text-text-subtle mt-0.5">由 {w.authorName} · {formatCN(w.createdAt)}</div>
                      </div>
                      {me?.id === w.authorId && (
                        <button
                          onClick={() => setConfirmDel(w.id)}
                          className="p-1.5 rounded-md text-text-muted hover:text-rose"
                          aria-label="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </Section>

            <Section title="已经一起做了" count={done.length}>
              {done.length === 0 ? (
                <div className="text-text-muted text-sm pl-4">还没有完成的心愿，加油！</div>
              ) : (
                <ul className="grid sm:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {done.map((w) => (
                      <motion.li
                        key={w.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="card relative"
                      >
                        {w.coverPhoto && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.coverPhoto}
                            alt=""
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="flex items-start gap-2">
                          <span className="text-sage mt-0.5"><Check size={16} /></span>
                          <div className="flex-1 min-w-0">
                            <div className="text-text-primary">{w.content}</div>
                            <div className="text-xs text-text-subtle mt-1">
                              {w.completedAt && `${formatCN(w.completedAt)} 完成 · `}
                              由 {w.authorName} 添加
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => uncomplete(w.id)}
                            className="text-xs text-text-subtle hover:text-text-muted px-2 py-1 rounded"
                          >
                            取消完成
                          </button>
                          {me?.id === w.authorId && (
                            <button
                              onClick={() => setConfirmDel(w.id)}
                              className="p-1.5 rounded text-text-subtle hover:text-rose"
                              aria-label="删除"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </Section>
          </div>
        )}
      </main>

      <button
        onClick={() => setCreating(true)}
        aria-label="新心愿"
        className="fixed right-5 bottom-20 md:bottom-8 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-rose flex items-center justify-center shadow-lg shadow-accent/40 active:scale-95 transition"
      >
        <Plus size={22} className="text-bg-base" />
      </button>

      <Dialog open={creating} onClose={() => setCreating(false)} title="新增心愿">
        <Input placeholder="一起去看烟花～" value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setCreating(false)}>取消</Button>
          <Button onClick={add} loading={submitting}>添加</Button>
        </div>
      </Dialog>

      <Dialog
        open={!!completing}
        onClose={() => {
          setCompleting(null);
          setCompletePhoto([]);
        }}
        title="完成这个心愿"
      >
        {completing && (
          <div>
            <p className="text-text-primary mb-3">{completing.content}</p>
            <p className="text-sm text-text-muted mb-3">
              （可选）上传一张完成时的照片，让这一刻被永远记住 ✨
            </p>
            <PhotoUploader value={completePhoto} onChange={setCompletePhoto} max={1} />
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={() => { setCompleting(null); setCompletePhoto([]); }}>
                取消
              </Button>
              <Button onClick={complete}>完成 🎉</Button>
            </div>
          </div>
        )}
      </Dialog>

      <Confirm
        open={confirmDel != null}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel != null && remove(confirmDel)}
        danger
        title="删除这个心愿？"
      />
    </>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-lg mb-3 flex items-center gap-2">
        <span>{title}</span>
        <span className="text-xs text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">{count}</span>
      </h2>
      {children}
    </section>
  );
}
