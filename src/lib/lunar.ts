// 农历换算工具，依赖 lunar-javascript（npm 上稳定库）
// 任何错误回退为公历计算，避免崩溃。

import { Solar, Lunar } from 'lunar-javascript';
import { daysBetween, parseYMD } from './dates';

export type SolarDate = { year: number; month: number; day: number };
export type LunarDate = { year: number; month: number; day: number };

/** 公历 -> 农历 */
export function solarToLunar(date: Date): LunarDate | null {
  try {
    const s = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const l = s.getLunar();
    return { year: l.getYear(), month: l.getMonth(), day: l.getDay() };
  } catch {
    return null;
  }
}

/** 农历 (lunarMonth, lunarDay) 在某年的公历日期 */
export function lunarToSolar(year: number, lunarMonth: number, lunarDay: number): Date | null {
  try {
    const l = Lunar.fromYmd(year, lunarMonth, lunarDay);
    const s = l.getSolar();
    return new Date(s.getYear(), s.getMonth() - 1, s.getDay());
  } catch {
    return null;
  }
}

/** 距离下一次农历日期 */
export function nextLunarOccurrence(
  lunarMonth: number,
  lunarDay: number,
  fromDate: Date = new Date()
): Date | null {
  const yr = fromDate.getFullYear();
  let candidate = lunarToSolar(yr, lunarMonth, lunarDay);
  if (!candidate || daysBetween(fromDate, candidate) < 0) {
    candidate = lunarToSolar(yr + 1, lunarMonth, lunarDay);
  }
  if (!candidate || daysBetween(fromDate, candidate) < 0) {
    candidate = lunarToSolar(yr + 2, lunarMonth, lunarDay);
  }
  return candidate;
}

/**
 * 通用 helper: 给 anniversaries 表里一行算出距离下一次的天数 + 公历日期。
 * date 字段格式：
 *   公历 (is_lunar=0): 'YYYY-MM-DD' 或 '0000-MM-DD' 都可以，年份会被忽略
 *   农历 (is_lunar=1): 'YYYY-MM-DD' 中的 MM/DD 表示农历月日，年份忽略
 */
export function daysUntilAnniversary(
  date: string,
  isLunar: 0 | 1,
  fromDate: Date = new Date()
): { days: number; nextDate: Date } | null {
  const parts = date.split('-');
  if (parts.length !== 3) return null;
  const month = Number.parseInt(parts[1], 10);
  const day = Number.parseInt(parts[2], 10);

  let nextDate: Date | null = null;
  if (isLunar === 1) {
    nextDate = nextLunarOccurrence(month, day, fromDate);
  } else {
    const yr = fromDate.getFullYear();
    let candidate = new Date(yr, month - 1, day);
    if (daysBetween(fromDate, candidate) < 0) {
      candidate = new Date(yr + 1, month - 1, day);
    }
    nextDate = candidate;
  }
  if (!nextDate) {
    // fallback: parse the original ymd as a literal one-time date
    nextDate = parseYMD(date);
  }
  return { days: daysBetween(fromDate, nextDate), nextDate };
}
