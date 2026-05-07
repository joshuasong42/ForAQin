// Minimal type declarations for lunar-javascript - only the parts we use.
declare module 'lunar-javascript' {
  export interface SolarLike {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): LunarLike;
  }
  export interface LunarLike {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): SolarLike;
  }
  export const Solar: {
    fromYmd(year: number, month: number, day: number): SolarLike;
  };
  export const Lunar: {
    fromYmd(year: number, month: number, day: number): LunarLike;
  };
}
