'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, Confirm } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PhotoUploader, { UploadedPhoto } from '@/components/PhotoUploader';
import PhotoGrid from '@/components/PhotoGrid';
import EmptyState from '@/components/EmptyState';
import NavBar from '@/components/NavBar';
import { useToast } from '@/components/ui/Toast';
import { formatTimeAgo } from '@/lib/dates';

type Msg = {
  id: number;
  content: string;
  createdAt: number;
  authorId: number;
  authorName: string;
  authorUsername: string;
  photos: { path: string; width: number; height: number }[];
};

type Me = { id: number; name: string; username: string };

export default function MessagesPage() {
  const t = useToast();
  const [list, setList] = useState<Msg[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  async function load() {
    const [mRes, msRes] = await Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/messages').then((r) => r.json()),
    ]);
    if (mRes.ok) setMe(mRes.data);
    if (msRes.ok) setList(msRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (!content.trim() && photos.length === 0) {
      t.push('写点什么或加张图', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), photos }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '发布失败', 'error');
        return;
      }
      t.push('已发送 💌', 'success');
      setComposing(false);
      setContent('');
      setPhotos([]);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: number) {
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) {
      t.push(data.error || '删除失败', 'error');
      return;
    }
    setList((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
    t.push('已删除');
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28 md:pb-10">
        <header className="mb-6">
          <h1 className="font-serif text-2xl">留言板</h1>
          <p className="text-text-muted text-sm mt-1">想对你说的每一句话，都会留在这里。</p>
        </header>

        {list === null ? (
          <div className="text-text-muted text-sm">加载中…</div>
        ) : list.length === 0 ? (
          <EmptyState
            title="还没有任何留言"
            description="点击右下角的 + 写下你想对她/他说的话吧。"
          />
        ) : (
          <ul className="space-y-5">
            <AnimatePresence>
              {list.map((m) => {
                const isMine = me?.id === m.authorId;
                return (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex md:items-start gap-2.5 ${isMine ? 'md:flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`hidden md:flex h-9 w-9 rounded-full items-center justify-center text-sm font-serif text-bg-base flex-shrink-0 ${isMine ? 'bg-accent' : 'bg-rose'}`}
                      aria-hidden
                    >
                      {m.authorName?.slice(-1) || '?'}
                    </div>
                    <div className={`max-w-[88%] md:max-w-[78%] ${isMine ? 'md:text-right' : ''}`}>
                      <div className="text-xs text-text-muted mb-1 flex items-center gap-2 flex-wrap md:justify-start" style={isMine ? { justifyContent: 'flex-end' } : undefined}>
                        <span className={`font-serif ${isMine ? 'text-accent' : 'text-rose'}`}>{m.authorName}</span>
                        <span className="text-text-subtle">·</span>
                        <span>{formatTimeAgo(m.createdAt)}</span>
                      </div>
                      <div className={`relative inline-block text-left rounded-2xl px-4 py-3 leading-relaxed ${isMine ? 'bg-accent/15 border border-accent/30' : 'bg-bg-card border border-[var(--border-soft)]'}`}>
                        {m.content && <p className="whitespace-pre-wrap text-text-primary">{m.content}</p>}
                        {m.photos.length > 0 && (
                          <div className="mt-2 -mx-1">
                            <PhotoGrid photos={m.photos} cols="grid-cols-3" />
                          </div>
                        )}
                        {isMine && (
                          <button
                            onClick={() => setConfirmDelete(m.id)}
                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-bg-elevated text-text-muted hover:text-rose hover:bg-bg-base border border-[var(--border-soft)] opacity-70 hover:opacity-100 transition"
                            aria-label="删除"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </main>

      {/* Floating compose button */}
      <button
        onClick={() => setComposing(true)}
        aria-label="写留言"
        className="fixed right-5 bottom-20 md:bottom-8 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-rose flex items-center justify-center shadow-lg shadow-accent/40 active:scale-95 transition"
      >
        <Plus size={22} className="text-bg-base" />
      </button>

      <Dialog
        open={composing}
        onClose={() => setComposing(false)}
        title="写一条新的留言"
      >
        <Textarea
          placeholder="今天有什么想对你说的呢…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
        />
        <div className="mt-3">
          <PhotoUploader value={photos} onChange={setPhotos} max={9} />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={() => setComposing(false)}>取消</Button>
          <Button onClick={submit} loading={submitting}>发送 💌</Button>
        </div>
      </Dialog>

      <Confirm
        open={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete != null && remove(confirmDelete)}
        title="删除这条留言？"
        description="删除后将无法恢复，照片也会一并被移除。"
        danger
      />
    </>
  );
}
