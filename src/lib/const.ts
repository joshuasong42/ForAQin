// Public constants safe to import from anywhere (server + client)
export const TOGETHER_SINCE = '2025-09-20'; // 在一起的日子

export const HE = {
  name: '宋金钊',
  birthday: '2002-04-20',
  username: 'jinzhao',
  // gender: 'male'
} as const;

export const SHE = {
  name: '彭沁园',
  birthday: '1999-10-30',
  username: 'qinyuan',
  // gender: 'female'
} as const;

// Tab/Nav entries reused across the app
export const NAV_ITEMS = [
  { href: '/', label: '首页', icon: 'home' },
  { href: '/album', label: '相册', icon: 'image' },
  { href: '/messages', label: '留言', icon: 'message-circle' },
  { href: '/capsule', label: '胶囊', icon: 'hourglass' },
  { href: '/settings', label: '我们', icon: 'heart' },
] as const;

export const SECONDARY_NAV = [
  { href: '/anniversary', label: '纪念日', icon: 'calendar-heart' },
  { href: '/wishes', label: '心愿单', icon: 'sparkles' },
  { href: '/moods', label: '心情打卡', icon: 'smile' },
] as const;

// 深一档的莫兰迪点缀色（在亮底上有足够对比）
export const MOODS: Array<{ key: string; emoji: string; label: string; color: string }> = [
  { key: 'happy', emoji: '🥰', label: '开心', color: '#a86d6d' },
  { key: 'sweet', emoji: '🍯', label: '甜甜', color: '#8a6dab' },
  { key: 'soft', emoji: '☁️', label: '温柔', color: '#9579b8' },
  { key: 'tired', emoji: '😴', label: '累', color: '#6d8e75' },
  { key: 'miss', emoji: '🌙', label: '想你', color: '#8773a8' },
  { key: 'angry', emoji: '🔥', label: '生气气', color: '#a87862' },
];

// Default anniversaries seeded on first run.
// 已存在的 title 会跳过；颜色若是旧版浅色调，重启后会自动迁移到深一档莫兰迪。
// 仅保留与情侣相关的节日。
export const DEFAULT_ANNIVERSARIES = [
  // 我们俩的
  { title: '我们在一起', date: TOGETHER_SINCE, is_lunar: 0, repeat_yearly: 1, emoji: '💞', color: '#8a6dab' },
  { title: '宋金钊生日', date: HE.birthday, is_lunar: 0, repeat_yearly: 1, emoji: '🎂', color: '#6d8e75' },
  { title: '彭沁园生日', date: SHE.birthday, is_lunar: 0, repeat_yearly: 1, emoji: '🎂', color: '#a86d6d' },

  // 情侣相关节日（公历）
  { title: '情人节', date: '0000-02-14', is_lunar: 0, repeat_yearly: 1, emoji: '💝', color: '#a86d6d' },
  { title: '白色情人节', date: '0000-03-14', is_lunar: 0, repeat_yearly: 1, emoji: '🤍', color: '#9579b8' },
  { title: '520 表白日', date: '2024-05-20', is_lunar: 0, repeat_yearly: 1, emoji: '💌', color: '#9579b8' },
  { title: '平安夜', date: '2024-12-24', is_lunar: 0, repeat_yearly: 1, emoji: '🎄', color: '#6d8e75' },
  { title: '圣诞节', date: '0000-12-25', is_lunar: 0, repeat_yearly: 1, emoji: '🎁', color: '#a86d6d' },
  { title: '跨年夜', date: '2024-12-31', is_lunar: 0, repeat_yearly: 1, emoji: '🎆', color: '#8a6dab' },

  // 七夕（农历）
  { title: '七夕', date: '0000-07-07', is_lunar: 1, repeat_yearly: 1, emoji: '🌌', color: '#8a6dab' },
] as const;

// 已不再作为默认值的节日；启动时会从数据库里清理（仅当 title+date+is_lunar 完全匹配旧默认时才删，用户自定义的不动）。
export const REMOVED_DEFAULT_ANNIVERSARIES: Array<{ title: string; date: string; is_lunar: 0 | 1 }> = [
  { title: '元旦', date: '0000-01-01', is_lunar: 0 },
  { title: '妇女节', date: '0000-03-08', is_lunar: 0 },
  { title: '愚人节', date: '0000-04-01', is_lunar: 0 },
  { title: '劳动节', date: '0000-05-01', is_lunar: 0 },
  { title: '儿童节', date: '0000-06-01', is_lunar: 0 },
  { title: '国庆', date: '0000-10-01', is_lunar: 0 },
  { title: '万圣节', date: '0000-10-31', is_lunar: 0 },
  { title: '春节', date: '0000-01-01', is_lunar: 1 },
  { title: '元宵节', date: '0000-01-15', is_lunar: 1 },
  { title: '端午节', date: '0000-05-05', is_lunar: 1 },
  { title: '中秋节', date: '0000-08-15', is_lunar: 1 },
  { title: '重阳节', date: '0000-09-09', is_lunar: 1 },
];

// 旧浅色 → 新深色 映射，给数据库里既有的纪念日做迁移用
export const LEGACY_COLOR_MAP: Record<string, string> = {
  '#a896c4': '#8a6dab',
  '#d4a5a5': '#a86d6d',
  '#a5b8a5': '#6d8e75',
  '#c8b8d4': '#9579b8',
  '#b3a3c9': '#8773a8',
  '#d4a896': '#a87862',
};
