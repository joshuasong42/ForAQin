'use client';

import { useEffect, useRef } from 'react';

/**
 * 暮光紫调色板 + 慢速漂浮的微星点 + 偶尔闪过的流星。
 * 全 canvas + requestAnimationFrame，节能无 DOM 抖动。
 */
export default function StarfieldBg() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let stars: Array<{ x: number; y: number; r: number; a: number; s: number; tw: number }> = [];
    let shooting: { x: number; y: number; vx: number; vy: number; life: number } | null = null;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // density: ~1 star per 5500 px²
      const count = Math.min(220, Math.floor((w * h) / 5500));
      stars = new Array(count).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * 0.6 + 0.3,
        s: Math.random() * 0.04 + 0.005,
        tw: Math.random() * Math.PI * 2,
      }));
    }

    function maybeShoot() {
      if (shooting) return;
      if (Math.random() < 0.0025) {
        const startX = Math.random() * w * 0.6;
        const startY = Math.random() * h * 0.4;
        shooting = {
          x: startX,
          y: startY,
          vx: 4 + Math.random() * 2,
          vy: 2 + Math.random() * 1.5,
          life: 1,
        };
      }
    }

    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // 柔光底（暮光紫 + 鼠尾草绿混合，做成像晨雾）
      const grad = ctx.createRadialGradient(w * 0.2, h * 0.1, 0, w * 0.2, h * 0.1, Math.max(w, h));
      grad.addColorStop(0, 'rgba(168, 150, 196, 0.10)');
      grad.addColorStop(1, 'rgba(168, 150, 196, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 微尘：在亮底上用深一点的暮光紫小点
      for (const star of stars) {
        star.tw += star.s;
        const alpha = (star.a + Math.sin(star.tw) * 0.25) * 0.55;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 109, 171, ${Math.max(0, alpha)})`;
        ctx.fill();
        // soft drift
        star.y -= 0.02;
        if (star.y < -2) {
          star.y = h + 2;
          star.x = Math.random() * w;
        }
      }

      maybeShoot();
      if (shooting) {
        const trailLen = 90;
        const grad2 = ctx.createLinearGradient(
          shooting.x,
          shooting.y,
          shooting.x - shooting.vx * trailLen * 0.18,
          shooting.y - shooting.vy * trailLen * 0.18
        );
        grad2.addColorStop(0, `rgba(201, 139, 139, ${shooting.life * 0.7})`);
        grad2.addColorStop(1, 'rgba(201, 139, 139, 0)');
        ctx.strokeStyle = grad2;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(
          shooting.x - shooting.vx * trailLen * 0.18,
          shooting.y - shooting.vy * trailLen * 0.18
        );
        ctx.stroke();
        shooting.x += shooting.vx;
        shooting.y += shooting.vy;
        shooting.life -= 0.012;
        if (shooting.life <= 0 || shooting.x > w + 20 || shooting.y > h + 20) shooting = null;
      }

      raf = requestAnimationFrame(frame);
    }

    let raf = 0;
    resize();
    frame();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="starfield" aria-hidden />;
}
