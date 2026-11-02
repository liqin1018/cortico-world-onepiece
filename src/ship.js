/**
 * 船与改装。纯数据 + 纯函数。
 *
 * 船的「档次」跟着剧情走（小帆船 → 梅丽号 → 阳光号 → 巨人战船），
 * 因为她走到哪，画面上就该是哪条船。档次不花玩家的钱。
 *
 * 花钱的是六个部件。部件不加等级、只加分项，这样面板好画、平衡也好算：
 * 帆影响时间、舵和装甲影响挨打、炮和装甲影响战力、厨房影响疲劳、船体影响修船。
 */
export const SHIP_TIERS = [
  {
    tier: 1, name: '小帆船', fromChapter: 1,
    note: '一块帆、一根桅杆，风大了会发抖', power: 0,
  },
  {
    tier: 2, name: '梅丽号', fromChapter: 10,
    note: '羊头船首，跟着她跑完了伟大航路前半', power: 0.02,
  },
  {
    tier: 3, name: '千里阳光号', fromChapter: 58,
    note: '狮头、草坪甲板，还能开出风来', power: 0.04,
  },
  {
    tier: 4, name: '巨人战船', fromChapter: 113,
    note: '艾尔帕布给的船，甲板比镇子还宽', power: 0.06,
  },
];

/**
 * 六个部件，每件 5 级。
 * power / damage / time / fatigue 都是「每级」的系数，正负号按语义走：
 * damage 是负数（减伤），time 是负数（更快），fatigue 是负数（更省力）。
 */
export const SHIP_PARTS = [
  {
    id: 'hull', name: '船体', max: 5, power: 0, damage: -0.03,
    desc: '多铺一层板，挨打的时候裂得慢一点',
    cost: { wood: 2, iron: 1 },
  },
  {
    id: 'sail', name: '帆', max: 5, power: 0, time: -0.05,
    desc: '帆好，跑得快，自由航海少等一会儿',
    cost: { wood: 2, iron: 0 },
  },
  {
    id: 'helm', name: '舵', max: 5, power: 0, damage: -0.03,
    desc: '转得动，才躲得开',
    cost: { wood: 1, iron: 1 },
  },
  {
    id: 'cannon', name: '炮', max: 5, power: 0.012, damage: 0,
    desc: '打起来的时候，这是最实在的东西',
    cost: { wood: 0, iron: 2 },
  },
  {
    id: 'galley', name: '厨房', max: 5, power: 0, fatigue: -0.08,
    desc: '吃得好，累得慢',
    cost: { wood: 2, iron: 1 },
  },
  {
    id: 'armor', name: '装甲', max: 5, power: 0.008, damage: -0.03,
    desc: '铁皮包边，又重又硬',
    cost: { wood: 1, iron: 2 },
  },
];

export const PART_MAX_TOTAL = SHIP_PARTS.reduce((n, p) => n + p.max, 0);

export function partById(id) {
  return SHIP_PARTS.find((p) => p.id === id) ?? null;
}

/** 第几章的下一章该是哪一档船。 */
export function shipTierByChapter(chapterNo) {
  let out = SHIP_TIERS[0];
  for (const s of SHIP_TIERS) if (chapterNo >= s.fromChapter) out = s;
  return out;
}

export function shipTierById(tier) {
  return SHIP_TIERS.find((s) => s.tier === tier) ?? SHIP_TIERS[0];
}

/** 升到 nextLevel 要花什么。tier 越高越贵，但差距不大。 */
export function partCost(part, nextLevel, tier = 1) {
  const row = part.cost ?? { wood: 1, iron: 1 };
  const lv = Math.max(1, nextLevel);
  const scale = 1 + 0.35 * (Math.max(1, tier) - 1);
  return {
    berries: Math.round((220_000 * lv * scale) / 10_000) * 10_000,
    wood: row.wood * lv,
    iron: row.iron * lv,
    rare: lv >= 4 && (part.id === 'cannon' || part.id === 'armor') ? 1 : 0,
  };
}

export function emptyParts() {
  const out = {};
  for (const p of SHIP_PARTS) out[p.id] = 0;
  return out;
}
