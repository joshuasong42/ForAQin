'use client';

import { Heart, Image as Img, MessageCircle, Hourglass, Home, CalendarHeart, Sparkles, Smile, Settings as Cog } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, SECONDARY_NAV } from '@/lib/const';

const ICON_MAP: Record<string, typeof Heart> = {
  home: Home,
  image: Img,
  'message-circle': MessageCircle,
  hourglass: Hourglass,
  heart: Heart,
  'calendar-heart': CalendarHeart,
  sparkles: Sparkles,
  smile: Smile,
  settings: Cog,
};

export default function NavBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  return (
    <>
      {/* PC top bar */}
      <header className="hidden md:block sticky top-0 z-40 backdrop-blur-md bg-bg-base/70 border-b border-[var(--border-soft)]">
        <div className="mx-auto max-w-5xl flex items-center gap-6 px-6 h-16">
          <Link href="/" className="font-display text-xl text-gradient">
            520 · Our Galaxy
          </Link>
          <nav className="flex items-center gap-1">
            {[...NAV_ITEMS, ...SECONDARY_NAV].map((item) => {
              const I = ICON_MAP[item.icon] || Heart;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm transition',
                    active ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <I size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-bg-base/85 border-t border-[var(--border-soft)] pb-safe">
        <div className="flex items-stretch justify-around h-14">
          {NAV_ITEMS.map((item) => {
            const I = ICON_MAP[item.icon] || Heart;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center text-[11px] gap-0.5 transition',
                  active ? 'text-accent' : 'text-text-muted'
                )}
              >
                <I size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
