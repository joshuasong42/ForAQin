import { TOGETHER_SINCE } from './const';

const SHANGHAI_TZ = 'Asia/Shanghai';

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** integer days difference, b - a (after both truncated to local midnight) */
export function daysBetween(a: Date | string | number, b: Date | string | number): number {
  const A = startOfDay(typeof a === 'string' || typeof a === 'number' ? new Date(a) : a);
  const B = startOfDay(typeof b === 'string' || typeof b === 'number' ? new Date(b) : b);
  const ms = B.getTime() - A.getTime();
  return Math.round(ms / 86400000);
}

/** 在一起的天数 (含今天 +1) */
export function daysTogether(now: Date = new Date()): number {
  return daysBetween(TOGETHER_SINCE, now) + 1;
}

/** 格式化为 '2026 年 5 月 7 日' */
export function formatCN(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return fmt.format(d);
}

export function formatYMD(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // -> '2026/05/07'  -> '2026-05-07'
  return fmt.format(d).replace(/\//g, '-');
}

export function formatTimeAgo(ts: number, now: Date = new Date()): string {
  const diff = now.getTime() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} 天前`;
  return formatCN(new Date(ts));
}

/**
 * 给定 'MM-DD'，返回从 fromDate 起的下一次发生日期（公历）。
 * 若已过今年，返回下一年。
 */
export function nextOccurrenceMD(monthDay: string, fromDate: Date = new Date()): Date {
  const [m, d] = monthDay.split('-').map((s) => Number.parseInt(s, 10));
  const yr = fromDate.getFullYear();
  let next = new Date(yr, m - 1, d, 0, 0, 0, 0);
  if (daysBetween(fromDate, next) < 0) {
    next = new Date(yr + 1, m - 1, d, 0, 0, 0, 0);
  }
  return next;
}

/** 给定 YYYY-MM-DD，返回 MM-DD */
export function ymdToMD(ymd: string): string {
  const parts = ymd.split('-');
  return `${parts[1]}-${parts[2]}`;
}

/** 距离下一次的天数 */
export function daysUntilNextMD(monthDay: string, fromDate: Date = new Date()): number {
  return daysBetween(fromDate, nextOccurrenceMD(monthDay, fromDate));
}

/** YYYY-MM-DD -> Date in local */
export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map((s) => Number.parseInt(s, 10));
  return new Date(y, m - 1, d);
}

/** for the unique log_date column - today in shanghai */
export function todayShanghai(): string {
  return formatYMD(new Date());
}

export const TZ = SHANGHAI_TZ;
