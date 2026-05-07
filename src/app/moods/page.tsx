'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { MOODS } from '@/lib/const';
import { formatCN, formatTimeAgo } from '@/lib/dates';
import { cn } from '@/lib/utils';

type MoodRow = {
  id: number;
  mood: string;
  note: string;
  logDate: string;
  createdAt: number;
  authorId: number;
  authorName: string;
};

const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.key, m]));

function ymKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

export default function MoodsPage() {
  const t = useToast();
  const [list, setList] = useState<MoodRow[]>([]);
  const [mineToday, setMineToday] = useState<MoodRow | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [calendar, setCalendar] = useState<MoodRow[]>([]);
  const [loadingCal, setLoadingCal] = useState(true);

  async function loadList() {
    const r = await fetch('/api/moods').then((x) => x.json());
    if (r.ok) {
      setList(r.data.list);
      setMineToday(r.data.mineToday);
      if (r.data.mineToday) {
        setPicking(r.data.mineToday.mood);
        setNote(r.data.mineToday.note);
      }
    }
  }
  async function loadCalendar(y: number, m: number) {
    setLoadingCal(true);
    const r = await fetch(`/api/moods/calendar?month=${ymKey(y, m)}`).then((x) => x.json());
    if (r.ok) setCalendar(r.data.items);
    setLoadingCal(false);
  }

  useEffect(() => {
    loadList();
  }, []);
  useEffect(() => {
    loadCalendar(ym.y, ym.m);
  }, [ym.y, ym.m]);

  async function submit() {
    if (!picking) return t.push('选一个心情吧', 'error');
    setSubmitting(true);
    try {
      const res = await fetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: picking, note }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '失败', 'error');
        return;
      }
      t.push('已记录今日心情 ❤️', 'success');
      loadList();
      loadCalendar(ym.y, ym.m);
    } finally {
      setSubmitting(false);
    }
  }

  // calendar grid
  const grid = useMemo(() => {
    const first = new Date(ym.y, ym.m - 1, 1);
    const last = new Date(ym.y, ym.m, 0);
    const firstWd = first.getDay(); // 0=Sun
    const cells: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < firstWd; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const ds = `${ym.y}-${String(ym.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: ds, day: d });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [ym]);

  const byDate = useMemo(() => {
    const map = new Map<string, MoodRow[]>();
    for (const r of calendar) {
      const a = map.get(r.logDate) || [];
      a.push(r);
      map.set(r.logDate, a);
    }
    return map;
  }, [calendar]);

  function shift(delta: number) {
    let m = ym.m + delta;
    let y = ym.y;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setYm({ y, m });
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28 md:pb-10">
        <header className="mb-6">
          <h1 className="font-serif text-2xl">心情打卡</h1>
          <p className="text-text-muted text-sm mt-1">每天的心情，让两个人都看得见。</p>
        </header>

        <section className="card mb-6">
          <div className="text-text-muted text-sm mb-2">今天的心情</div>
          <div className="flex gap-2 sm:gap-3 mb-3 overflow-x-auto -mx-1 px-1 pb-1">
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setPicking(m.key)}
                className={cn(
                  'flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition',
                  picking === m.key
                    ? 'bg-accent/20 border-2 border-accent text-text-primary'
                    : 'bg-bg-elevated border-2 border-transparent text-text-muted hover:text-text-primary'
                )}
                style={picking === m.key ? { borderColor: m.color } : undefined}
              >
                <span className="text-2xl mb-0.5">{m.emoji}</span>
                <span className="text-[10px]">{m.label}</span>
              </button>
            ))}
          </div>
          <Textarea
            placeholder="今天有什么想分享的？(可选)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end mt-3">
            <Button onClick={submit} loading={submitting}>{mineToday ? '更新心情' : '打卡'}</Button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg">{ym.y} 年 {ym.m} 月</h2>
            <div className="flex gap-1">
              <button
                aria-label="上个月"
                onClick={() => shift(-1)}
                className="btn-ghost h-8 w-8 flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                aria-label="下个月"
                onClick={() => shift(1)}
                className="btn-ghost h-8 w-8 flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-text-subtle mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((c, i) =>
              c ? (
                <motion.div
                  key={c.date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.005, 0.2) }}
                  className="aspect-square rounded-lg bg-bg-card border border-[var(--border-soft)] p-1.5 flex flex-col"
                >
                  <div className="text-[10px] text-text-subtle">{c.day}</div>
                  <div className="flex-1 flex flex-col gap-0.5 justify-center items-center">
                    {(byDate.get(c.date) || []).slice(0, 2).map((m, idx) => {
                      const meta = MOOD_MAP[m.mood];
                      return (
                        <div
                          key={idx}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: meta?.color || '#a896c4' }}
                          title={`${m.authorName}: ${meta?.label}${m.note ? ' · ' + m.note : ''}`}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <div key={i} />
              )
            )}
          </div>
          {loadingCal && <div className="text-xs text-text-subtle mt-3">加载中…</div>}
        </section>

        <section className="mt-8">
          <h2 className="font-serif text-lg mb-3">最近的心情</h2>
          {list.length === 0 ? (
            <div className="text-text-muted text-sm">还没有心情记录。</div>
          ) : (
            <ul className="space-y-2">
              {list.map((m) => {
                const meta = MOOD_MAP[m.mood];
                return (
                  <li key={m.id} className="card flex items-center gap-3">
                    <span className="text-2xl">{meta?.emoji || '✨'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-serif">{m.authorName}</span>
                        <span className="text-text-muted"> · {m.logDate}</span>
                        <span className="text-text-subtle"> · {meta?.label || m.mood}</span>
                      </div>
                      {m.note && <div className="text-text-primary text-sm mt-0.5">{m.note}</div>}
                    </div>
                    <span className="text-xs text-text-subtle flex-shrink-0">{formatTimeAgo(m.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
