'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar } from 'lucide-react';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input, Textarea } from '@/components/ui/Input';
import PhotoUploader, { UploadedPhoto } from '@/components/PhotoUploader';
import { useToast } from '@/components/ui/Toast';
import { formatCN } from '@/lib/dates';

type Entry = {
  id: number;
  title: string;
  content: string;
  takenAt: number;
  createdAt: number;
  authorId: number;
  authorName: string;
  photos: { path: string; width: number; height: number }[];
};

function todayYMD() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function AlbumPage() {
  const t = useToast();
  const [list, setList] = useState<Entry[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [takenAt, setTakenAt] = useState(todayYMD());
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  async function load() {
    const r = await fetch('/api/album').then((x) => x.json());
    if (r.ok) setList(r.data);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (!title.trim()) {
      t.push('请填写标题', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), takenAt, photos }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '保存失败', 'error');
        return;
      }
      t.push('已添加 📷', 'success');
      setCreating(false);
      setTitle('');
      setContent('');
      setPhotos([]);
      setTakenAt(todayYMD());
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28 md:pb-10">
        <header className="mb-6">
          <h1 className="font-serif text-2xl">时光相册</h1>
          <p className="text-text-muted text-sm mt-1">把每一段甜蜜的时光，都装进相册里。</p>
        </header>

        {list === null ? (
          <div className="text-text-muted text-sm">加载中…</div>
        ) : list.length === 0 ? (
          <EmptyState
            title="还没有相册"
            description="按下右下角的 + 添加第一段时光吧。"
          />
        ) : (
          <ol className="relative ml-3 sm:ml-4 border-l border-accent/30 space-y-7">
            {list.map((e, i) => (
              <motion.li
                key={e.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="pl-5"
              >
                <span className="absolute -left-[7px] mt-1.5 w-3.5 h-3.5 rounded-full bg-accent shadow-md shadow-accent/40 border-4 border-bg-base" />
                <Link href={`/album/${e.id}`} className="block group">
                  <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                    <Calendar size={12} />
                    <span>{formatCN(e.takenAt)}</span>
                    <span className="text-text-subtle">· {e.authorName}</span>
                  </div>
                  <h2 className="font-serif text-lg text-text-primary group-hover:text-accent transition mb-1">
                    {e.title}
                  </h2>
                  {e.content && (
                    <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-2">{e.content}</p>
                  )}
                  {e.photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2">
                      {e.photos.slice(0, 4).map((p) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={p.path}
                          src={p.path}
                          alt=""
                          loading="lazy"
                          className="aspect-square w-full object-cover rounded-md"
                        />
                      ))}
                      {e.photos.length > 4 && (
                        <div className="aspect-square rounded-md bg-bg-elevated text-text-muted flex items-center justify-center text-sm">
                          +{e.photos.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              </motion.li>
            ))}
          </ol>
        )}
      </main>

      <button
        onClick={() => setCreating(true)}
        aria-label="添加"
        className="fixed right-5 bottom-20 md:bottom-8 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-rose flex items-center justify-center shadow-lg shadow-accent/40 active:scale-95 transition"
      >
        <Plus size={22} className="text-bg-base" />
      </button>

      <Dialog open={creating} onClose={() => setCreating(false)} title="新的时光">
        <div className="space-y-3">
          <Input label="标题" placeholder="一起去看了海" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="日期 (拍摄当天)" type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
          <Textarea
            label="想说点什么 (可选)"
            placeholder="那天阳光好好…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <PhotoUploader value={photos} onChange={setPhotos} max={12} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>取消</Button>
            <Button onClick={submit} loading={submitting}>保存</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
