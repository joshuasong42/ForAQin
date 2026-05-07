'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Image as Img, MessageCircle, Hourglass, Sparkles, CalendarHeart, Smile } from 'lucide-react';
import NavBar from '@/components/NavBar';
import DaysCounter from '@/components/DaysCounter';
import CountdownCard from '@/components/CountdownCard';
import { useToast } from '@/components/ui/Toast';
import { TOGETHER_SINCE, HE, SHE, MOODS } from '@/lib/const';
import { daysUntilNextMD, ymdToMD, daysBetween, formatCN } from '@/lib/dates';

type Stats = {
  counts: { messages: number; photos: number; capsules: number; wishes: number; wishesDone: number; moods: number };
  todayMoods: Array<{ authorId: number; authorName: string; mood: string; note: string }>;
  loveCount: number;
  users: Array<{ id: number; username: string; name: string }>;
  me: { id: number; name: string; username: string };
};

const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.key, m]));

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useToast();

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => d.ok && setStats(d.data));
  }, []);

  // Establish my today's mood so we can display it
  const myMood = stats?.todayMoods.find((m) => m.authorId === stats.me.id);
  useEffect(() => {
    if (myMood && !picking) setPicking(myMood.mood);
  }, [myMood, picking]);

  const countdowns = useMemo(() => {
    const now = new Date();
    const items = [
      { emoji: '💞', title: '距离 520', days: daysUntilNextMD('05-20', now), color: '#a86d6d', subtitle: 'Our Galaxy 上线日' },
      { emoji: '🎂', title: `距离 ${SHE.name} 生日`, days: daysUntilNextMD(ymdToMD(SHE.birthday), now), color: '#8a6dab' },
      { emoji: '🎂', title: `距离 ${HE.name} 生日`, days: daysUntilNextMD(ymdToMD(HE.birthday), now), color: '#6d8e75' },
      {
        emoji: '🌌',
        title: '距离我们 1 周年',
        days: daysBetween(now, new Date(2026, 8, 20)) >= 0
          ? daysBetween(now, new Date(2026, 8, 20))
          : daysBetween(now, new Date(2027, 8, 20)),
        color: '#9579b8',
        subtitle: formatCN(new Date(2026, 8, 20)),
      },
      { emoji: '🎄', title: '距离平安夜', days: daysUntilNextMD('12-24', now), color: '#6d8e75' },
    ];
    return items;
  }, []);

  async function quickPunch(mood: string) {
    setPicking(mood);
    setSubmitting(true);
    try {
      const res = await fetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, note: '' }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '失败', 'error');
        return;
      }
      t.push('已记录今日心情 ❤️', 'success');
      // refetch
      const s = await fetch('/api/stats').then((r) => r.json());
      if (s.ok) setStats(s.data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-8 pb-28 md:pb-12">
        {/* Hero */}
        <section className="relative">
          <DaysCounter startDate={TOGETHER_SINCE} />
          <p className="text-center text-text-muted text-sm font-serif mt-4">
            自 {formatCN(TOGETHER_SINCE)} · 那天我们决定走完一辈子
          </p>
        </section>

        {/* Countdown rail */}
        <section className="mt-10">
          <h2 className="text-text-muted text-sm mb-3 font-serif tracking-wide">最近的小日子</h2>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-3 snap-x">
            {countdowns.map((c) => (
              <div key={c.title} className="snap-start">
                <CountdownCard {...c} />
              </div>
            ))}
          </div>
        </section>

        {/* 4 main entries */}
        <section className="mt-8 grid grid-cols-2 gap-3">
          <EntryTile href="/album" emoji="📷" title="时光相册" color="#8a6dab" icon={<Img size={18} />} />
          <EntryTile href="/messages" emoji="✉️" title="留言板" color="#a86d6d" icon={<MessageCircle size={18} />} />
          <EntryTile href="/capsule" emoji="⏳" title="时光胶囊" color="#6d8e75" icon={<Hourglass size={18} />} />
          <EntryTile href="/wishes" emoji="✨" title="心愿清单" color="#9579b8" icon={<Sparkles size={18} />} />
        </section>

        {/* Secondary entries */}
        <section className="mt-3 grid grid-cols-2 gap-3">
          <EntryTile href="/anniversary" emoji="📅" title="纪念日" color="#8773a8" icon={<CalendarHeart size={18} />} small />
          <EntryTile href="/moods" emoji="🌈" title="心情打卡" color="#a87862" icon={<Smile size={18} />} small />
        </section>

        {/* Today's mood quick check-in */}
        <section className="mt-8 card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-serif text-base">今日心情</div>
              <div className="text-text-muted text-xs">一秒打卡，让 TA 看到此刻的你</div>
            </div>
            <Link href="/moods" className="text-xs text-accent hover:underline">查看月历</Link>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto -mx-1 px-1 pb-1">
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => quickPunch(m.key)}
                disabled={submitting}
                className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition border-2 ${picking === m.key ? 'bg-accent/15' : 'bg-bg-elevated border-transparent hover:brightness-95'}`}
                style={picking === m.key ? { borderColor: m.color } : undefined}
                title={m.label}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[10px] text-text-muted">{m.label}</span>
              </button>
            ))}
          </div>
          {stats && stats.todayMoods.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {stats.users.map((u) => {
                const m = stats.todayMoods.find((x) => x.authorId === u.id);
                const meta = m ? MOOD_MAP[m.mood] : null;
                return (
                  <div key={u.id} className="bg-bg-elevated rounded-xl p-3 flex items-center gap-2">
                    <span className="text-2xl">{meta?.emoji || '💭'}</span>
                    <div className="text-sm min-w-0">
                      <div className="font-serif">{u.name}</div>
                      <div className="text-xs text-text-muted truncate">
                        {meta ? meta.label : '今天还没打卡'}
                        {m?.note && ` · ${m.note}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tiny love banner */}
        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center text-text-muted text-sm flex items-center justify-center gap-2"
          >
            <Heart size={14} className="text-rose" />
            <span>
              我们一起说过 <span className="text-accent font-display text-lg">{stats.loveCount}</span> 次「我爱你」
            </span>
          </motion.div>
        )}
      </main>
    </>
  );
}

function EntryTile({
  href,
  emoji,
  title,
  color,
  icon,
  small,
}: {
  href: string;
  emoji: string;
  title: string;
  color: string;
  icon: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative card overflow-hidden flex flex-col justify-between hover:border-accent/40 transition group ${small ? 'h-28' : 'h-36 sm:h-40'}`}
      style={{ borderColor: `${color}33` }}
    >
      <div
        className="absolute inset-0 opacity-30 group-hover:opacity-50 transition"
        style={{
          background: `radial-gradient(140px 90px at 100% 0%, ${color}55, transparent 70%)`,
        }}
      />
      <div className="relative flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-xs">{title}</span>
      </div>
      <div className="relative flex items-end justify-between">
        <span className="font-serif text-2xl text-text-primary">{title}</span>
        <span className="text-3xl">{emoji}</span>
      </div>
    </Link>
  );
}
