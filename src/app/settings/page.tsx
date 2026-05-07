'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, LogOut, Lock, Image as Img, MessageCircle, Hourglass, Sparkles, Smile } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { formatCN, daysTogether } from '@/lib/dates';
import { TOGETHER_SINCE } from '@/lib/const';

type Stats = {
  counts: { messages: number; photos: number; capsules: number; wishes: number; wishesDone: number; moods: number; earliestMessage: number | null };
  loveCount: number;
  users: Array<{ id: number; username: string; name: string; avatar?: string | null }>;
  me: { id: number; name: string; username: string };
};

export default function SettingsPage() {
  const t = useToast();
  const r = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [pendingLove, setPendingLove] = useState(0);
  const [showHearts, setShowHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    const r = await fetch('/api/stats').then((x) => x.json());
    if (r.ok) setStats(r.data);
  }
  useEffect(() => {
    load();
  }, []);

  async function changePassword() {
    if (!oldPassword || !newPassword) return t.push('请填写完整', 'error');
    if (newPassword.length < 6) return t.push('新密码至少 6 位', 'error');
    setPwdLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '失败', 'error');
        return;
      }
      t.push('密码已更新');
      setShowPwd(false);
      setOldPassword('');
      setNewPassword('');
    } finally {
      setPwdLoading(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    r.replace('/login');
  }

  function handleLove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setShowHearts((p) => [...p, { id, x, y }]);
    setTimeout(() => setShowHearts((p) => p.filter((h) => h.id !== id)), 900);

    setStats((p) => (p ? { ...p, loveCount: p.loveCount + 1 } : p));
    setPendingLove((p) => p + 1);

    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flushLove, 800);
  }

  async function flushLove() {
    setPendingLove((p) => {
      if (p === 0) return 0;
      const delta = p;
      // fire and forget
      fetch('/api/love', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok) setStats((s) => (s ? { ...s, loveCount: d.data.count } : s));
        })
        .catch(() => {});
      return 0;
    });
  }

  // flush on unmount
  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushLove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 pb-28 md:pb-10">
        <header className="mb-6">
          <h1 className="font-serif text-2xl">我们</h1>
          <p className="text-text-muted text-sm mt-1">
            已经在一起 <span className="text-accent">{daysTogether()}</span> 天了 ✨
          </p>
        </header>

        {/* Avatars */}
        <section className="card mb-5">
          <div className="flex items-center justify-around py-4">
            {stats?.users.map((u, i) => (
              <div key={u.id} className="flex flex-col items-center gap-2 min-w-0">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-serif ${i === 0 ? 'bg-accent text-bg-base' : 'bg-rose text-bg-base'}`}
                >
                  {u.name.slice(-1)}
                </motion.div>
                <div className="font-serif">{u.name}</div>
                <div className="text-xs text-text-subtle">@{u.username}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Love counter */}
        <section className="card mb-5 text-center">
          <div className="text-text-muted text-sm font-serif">我爱你 · 累计</div>
          <motion.div
            key={stats?.loveCount}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            className="font-display text-6xl my-3 text-gradient"
          >
            {stats?.loveCount ?? 0}
          </motion.div>
          <button
            onClick={handleLove}
            className="relative mx-auto block w-32 h-32 rounded-full bg-gradient-to-br from-accent to-rose shadow-2xl shadow-accent/40 hover:shadow-accent/60 transition active:scale-95"
            aria-label="点击加 1"
          >
            <motion.span
              key={stats?.loveCount}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 0.95, 1.05, 1] }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 flex items-center justify-center text-bg-base"
            >
              <Heart size={56} fill="#ffffff" />
            </motion.span>
            <AnimatePresence>
              {showHearts.map((h) => (
                <motion.span
                  key={h.id}
                  initial={{ y: 0, opacity: 1, scale: 0.6 }}
                  animate={{ y: -90, opacity: 0, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: h.x - 12,
                    top: h.y - 12,
                    pointerEvents: 'none',
                  }}
                >
                  <Heart size={22} fill="#d4a5a5" stroke="#d4a5a5" />
                </motion.span>
              ))}
            </AnimatePresence>
          </button>
          <p className="text-text-subtle text-xs mt-3">两个人都点这颗心，会一起累加。</p>
        </section>

        {/* Stats */}
        <section className="card mb-5">
          <h2 className="font-serif text-base mb-3">我们的足迹</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<MessageCircle size={14} />} label="留言" value={stats?.counts.messages} />
            <Stat icon={<Img size={14} />} label="照片" value={stats?.counts.photos} />
            <Stat icon={<Hourglass size={14} />} label="胶囊" value={stats?.counts.capsules} />
            <Stat icon={<Sparkles size={14} />} label="心愿" value={stats?.counts.wishes} />
            <Stat icon={<Sparkles size={14} />} label="已实现" value={stats?.counts.wishesDone} />
            <Stat icon={<Smile size={14} />} label="心情打卡" value={stats?.counts.moods} />
          </div>
          {stats?.counts.earliestMessage && (
            <div className="text-xs text-text-subtle mt-4">
              第一条留言于 {formatCN(stats.counts.earliestMessage)} 来到这里。
            </div>
          )}
          <div className="text-xs text-text-subtle mt-1">
            在一起开始于 {formatCN(TOGETHER_SINCE)}
          </div>
        </section>

        {/* Actions */}
        <section className="card">
          <button
            onClick={() => setShowPwd(true)}
            className="w-full flex items-center justify-between py-3 text-text-primary hover:text-accent transition"
          >
            <div className="flex items-center gap-3">
              <Lock size={16} />
              <span>修改密码</span>
            </div>
            <span className="text-text-muted text-sm">›</span>
          </button>
          <div className="divider my-2" />
          <button
            onClick={logout}
            className="w-full flex items-center justify-between py-3 text-rose hover:opacity-80"
          >
            <div className="flex items-center gap-3">
              <LogOut size={16} />
              <span>退出登录</span>
            </div>
            <span className="text-rose/60 text-sm">›</span>
          </button>
        </section>

        <p className="text-center text-text-subtle text-xs mt-10 font-serif">
          愿这个小宇宙陪我们一直一直。
        </p>
      </main>

      <Dialog open={showPwd} onClose={() => setShowPwd(false)} title="修改密码">
        <div className="space-y-3">
          <Input
            label="原密码"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            label="新密码 (至少 6 位)"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setShowPwd(false)}>取消</Button>
            <Button onClick={changePassword} loading={pwdLoading}>保存</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value?: number }) {
  return (
    <div className="bg-bg-elevated rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-display text-2xl text-text-primary">{value ?? '—'}</div>
    </div>
  );
}
