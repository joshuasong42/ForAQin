'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import NavBar from '@/components/NavBar';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/ui/Button';
import { Dialog, Confirm } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatCN } from '@/lib/dates';
import { daysUntilAnniversary } from '@/lib/lunar';

type Ann = {
  id: number;
  title: string;
  date: string;
  isLunar: number;
  repeatYearly: number;
  emoji: string | null;
  color: string | null;
};

const COLORS = ['#a896c4', '#d4a5a5', '#a5b8a5', '#c8b8d4', '#b3a3c9', '#d4a896'];

export default function AnniversaryPage() {
  const t = useToast();
  const [list, setList] = useState<Ann[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [isLunar, setIsLunar] = useState(false);
  const [emoji, setEmoji] = useState('💞');
  const [color, setColor] = useState(COLORS[0]);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  async function load() {
    const r = await fetch('/api/anniversaries').then((x) => x.json());
    if (r.ok) setList(r.data);
  }
  useEffect(() => {
    load();
  }, []);

  const enriched = useMemo(() => {
    if (!list) return null;
    const now = new Date();
    return list
      .map((a) => {
        const u = daysUntilAnniversary(a.date, a.isLunar === 1 ? 1 : 0, now);
        return {
          ...a,
          daysUntil: u?.days ?? Number.POSITIVE_INFINITY,
          nextDate: u?.nextDate || null,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [list]);

  async function submit() {
    if (!title.trim()) return t.push('请填写名称', 'error');
    if (!date) return t.push('请选择日期', 'error');
    setSubmitting(true);
    try {
      const res = await fetch('/api/anniversaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date,
          isLunar,
          repeatYearly: true,
          emoji,
          color,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '保存失败', 'error');
        return;
      }
      t.push('已添加');
      setCreating(false);
      setTitle('');
      setDate('');
      setEmoji('💞');
      setIsLunar(false);
      setColor(COLORS[0]);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: number) {
    const res = await fetch(`/api/anniversaries?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) {
      t.push(data.error || '删除失败', 'error');
      return;
    }
    t.push('已删除');
    load();
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 pb-28 md:pb-10">
        <header className="mb-6">
          <h1 className="font-serif text-2xl">我们的纪念日</h1>
          <p className="text-text-muted text-sm mt-1">那些一起记得的、属于我们的日子。</p>
        </header>

        {enriched === null ? (
          <div className="text-text-muted text-sm">加载中…</div>
        ) : enriched.length === 0 ? (
          <EmptyState title="还没有纪念日" description="点击 + 添加第一个属于我们的日子。" />
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence>
              {enriched.map((a, i) => (
                <motion.li
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <div
                    className="card relative h-full"
                    style={{ borderColor: `${a.color || '#a896c4'}33` }}
                  >
                    <button
                      onClick={() => setConfirmDel(a.id)}
                      aria-label="删除"
                      className="absolute top-2 right-2 p-1 rounded-md text-text-subtle hover:text-rose hover:bg-bg-elevated opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="text-3xl mb-2">{a.emoji || '✨'}</div>
                    <div className="font-serif text-base text-text-primary mb-1">{a.title}</div>
                    <div className="text-xs text-text-muted mb-2">
                      {a.isLunar === 1 ? '农历 ' : ''}
                      {a.date.slice(5)}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-display text-3xl leading-none"
                        style={{ color: a.color || '#a896c4' }}
                      >
                        {a.daysUntil === 0 ? '今' : a.daysUntil}
                      </span>
                      <span className="text-text-muted text-xs">
                        {a.daysUntil === 0 ? '天 (就是今天)' : '天后'}
                      </span>
                    </div>
                    {a.nextDate && (
                      <div className="text-xs text-text-subtle mt-2">{formatCN(a.nextDate)}</div>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </main>

      <button
        onClick={() => setCreating(true)}
        aria-label="添加纪念日"
        className="fixed right-5 bottom-20 md:bottom-8 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-rose flex items-center justify-center shadow-lg shadow-accent/40 active:scale-95 transition"
      >
        <Plus size={22} className="text-bg-base" />
      </button>

      <Dialog open={creating} onClose={() => setCreating(false)} title="添加纪念日">
        <div className="space-y-3">
          <Input label="名称" placeholder="周年纪念日" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label={isLunar ? '日期 (按公历选，年份会忽略；勾选农历后系统会按你选的日期换算成农历每年重复)' : '日期 (年份会被忽略，每年此月日重复)'}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={isLunar}
              onChange={(e) => setIsLunar(e.target.checked)}
              className="accent-accent"
            />
            按农历计算
          </label>
          <div>
            <span className="block mb-1 text-sm text-text-muted">表情</span>
            <Input value={emoji} maxLength={4} onChange={(e) => setEmoji(e.target.value)} />
          </div>
          <div>
            <span className="block mb-1 text-sm text-text-muted">颜色</span>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-text-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>取消</Button>
            <Button onClick={submit} loading={submitting}>保存</Button>
          </div>
        </div>
      </Dialog>

      <Confirm
        open={confirmDel != null}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel != null && remove(confirmDel)}
        danger
        title="删除这个纪念日？"
        description="删除后无法恢复，但你可以重新添加。"
      />
    </>
  );
}
