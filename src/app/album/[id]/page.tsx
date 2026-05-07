'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import PhotoGrid from '@/components/PhotoGrid';
import { Confirm } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatCN } from '@/lib/dates';

type Entry = {
  id: number;
  title: string;
  content: string;
  takenAt: number;
  authorId: number;
  authorName: string;
  photos: { path: string; width: number; height: number }[];
};
type Me = { id: number };

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const r = useRouter();
  const t = useToast();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        fetch(`/api/album/${params.id}`).then((x) => x.json()),
        fetch('/api/auth/me').then((x) => x.json()),
      ]);
      if (a.ok) setEntry(a.data);
      if (b.ok) setMe(b.data);
      setLoading(false);
    })();
  }, [params.id]);

  async function remove() {
    const res = await fetch(`/api/album/${params.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) {
      t.push(data.error || '删除失败', 'error');
      return;
    }
    t.push('已删除');
    r.replace('/album');
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28 md:pb-10">
        <Link href="/album" className="inline-flex items-center gap-1 text-text-muted hover:text-text-primary text-sm mb-4">
          <ChevronLeft size={16} /> 返回相册
        </Link>
        {loading ? (
          <div className="text-text-muted text-sm">加载中…</div>
        ) : !entry ? (
          <div className="text-text-muted text-sm">未找到</div>
        ) : (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-text-muted text-xs mb-2">
              <Calendar size={13} />
              <span>{formatCN(entry.takenAt)}</span>
              <span className="text-text-subtle">· 由 {entry.authorName} 添加</span>
            </div>
            <h1 className="font-serif text-3xl mb-3">{entry.title}</h1>
            {entry.content && (
              <p className="text-text-primary leading-loose whitespace-pre-wrap mb-6">{entry.content}</p>
            )}
            {entry.photos.length > 0 && (
              <PhotoGrid photos={entry.photos} cols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4" />
            )}
            {me?.id === entry.authorId && (
              <div className="mt-8 pt-4 border-t border-[var(--border-soft)] flex justify-end">
                <Button variant="ghost" onClick={() => setConfirmDel(true)}>
                  <Trash2 size={14} /> 删除这段时光
                </Button>
              </div>
            )}
          </motion.article>
        )}
      </main>
      <Confirm
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={remove}
        danger
        title="删除这段时光？"
        description="这条相册及其所有照片将被永久删除。"
      />
    </>
  );
}
