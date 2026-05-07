'use client';

import { motion } from 'framer-motion';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heart } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-text-muted">
          加载中…
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const r = useRouter();
  const sp = useSearchParams();
  const t = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      t.push('请填写用户名和密码', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        t.push(data.error || '登录失败', 'error');
        setLoading(false);
        return;
      }
      const next = sp.get('next') || '/';
      r.replace(next);
    } catch {
      t.push('网络错误', 'error');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm glass rounded-3xl p-7 sm:p-8"
      >
        <div className="flex justify-center mb-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-rose flex items-center justify-center shadow-xl shadow-accent/30"
          >
            <Heart fill="#ffffff" stroke="#ffffff" size={26} />
          </motion.div>
        </div>
        <h1 className="font-serif text-center text-2xl mb-1">Our Galaxy</h1>
        <p className="text-center text-sm text-text-muted mb-7">
          只属于宋金钊和彭沁园的小宇宙 ✨
        </p>
        <form className="space-y-4" onSubmit={submit}>
          <Input
            label="用户名"
            autoComplete="username"
            placeholder="jinzhao 或 qinyuan"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <Input
            label="密码"
            type="password"
            autoComplete="current-password"
            placeholder="你们的密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="lg" loading={loading} className="w-full">
            进入我们的宇宙
          </Button>
        </form>
        <p className="text-xs text-text-subtle text-center mt-6">
          忘记密码请联系另一半。
        </p>
      </motion.div>
    </main>
  );
}
