/**
 * 把「她有多强」算出来。所有加成最后都收在这一个文件里，
 * 免得世界层、战斗层、面板各算一套，越算越对不上。
 *
 * 结构：基础战力（等级）× （1 + 船员 + 船 + 名刀 + 果实 + 霸气）
 * 用乘法而不是加法，是因为乘法的每一项都成比例，不会到了后期
 * 出现「加 20 点」等于没加的情况。
 *
 * 船员和船的档次是「按剧情白给」的，所以难度预期里算了它们；
 * 名刀、果实、霸气、改装件要花力气，算玩家赚到的余量。
 */
import { CREW, CREW_CAP, crewById } from './crew.js';
import { SHIP_PARTS, shipTierByChapter, shipTierById } from './ship.js';
import { BLADE_SLOTS, bladeById, fruitById } from './gear.js';
import { BONDS } from './bonds.js';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * 等级底子。带一点二次项：前面几级涨得慢，后面每一级更值钱。
 *
 * 0.9.0 把升级曲线拉陡之后（见 campaign.expNeed），如果还按 3.2 一级，
 * 35 章 Lv24 只有 87 点底子，打不动按 Lv31 写的对手。二次项是补偿，
 * 让「等级数字小了」和「战力没变弱」同时成立。
 */
export function levelBase(level) {
  const lv = Math.max(1, level ?? 1);
  return 10 + 3.4 * lv + 0.02 * lv * lv;
}

/** 反过来：要有这么多底子，得几级。建议卡要算「还差几级」。 */
export function levelForPower(power) {
  const p = Math.max(11, power);
  const a = 0.02;
  const b = 3.4;
  return Math.max(1, (-b + Math.sqrt(b * b - 4 * a * (10 - p))) / (2 * a));
}

// ── 船员 ────────────────────────────────────────────────────────────────

export function crewCap(shipTier) {
  return CREW_CAP[clamp((shipTier ?? 1) - 1, 0, CREW_CAP.length - 1)];
}

/**
 * 在船上的人。被派上岸的那几个不算——战力、被动、羁绊一起停，
 * 这是派遣唯一的代价，必须真的生效，否则派遣就是白拿。
 */
export function activeCrew(state) {
  const done = state?.campaign?.done ?? 0;
  return (state?.crew ?? []).filter((m) => !((m.awayUntil ?? -1) > done));
}

/** 两种调用方式都认：传数组（纯计算）、传 state（会过滤掉不在船上的人）。 */
function crewListOf(crewOrState) {
  if (Array.isArray(crewOrState)) return crewOrState;
  if (!crewOrState) return [];
  return activeCrew(crewOrState);
}

/** 疲劳最高让人少出三成力，不会归零——不然一次连战就废了。 */
export function crewBonus(crewOrState = []) {
  let sum = 0;
  for (const member of crewListOf(crewOrState)) {
    const def = crewById(member.id);
    if (!def) continue;
    const wear = 1 - 0.3 * (clamp(member.fatigue ?? 0, 0, 100) / 100);
    sum += def.weight * wear;
    if (def.effect === 'warrior') sum += 0.02 * wear;
  }
  return sum;
}

export function crewEffect(crewOrState = [], effect) {
  return crewListOf(crewOrState).some((m) => crewById(m.id)?.effect === effect);
}

// ── 羁绊 ────────────────────────────────────────────────────────────────

/** 两个人都得在船上（且没被派走），这层加成才成立。 */
export function activeBonds(state) {
  const ids = new Set(activeCrew(state).map((m) => m.id));
  return BONDS.filter((b) => ids.has(b.a) && ids.has(b.b));
}

export function bondValue(state, effect) {
  return activeBonds(state)
    .filter((b) => b.effect === effect)
    .reduce((sum, b) => sum + b.value, 0);
}

/** 羁绊只算「白给」的那部分也要进难度预期——两个人都按剧情上船。 */
export function bondValueOf(crewIds, effect) {
  const ids = new Set(crewIds ?? []);
  return BONDS.filter((b) => b.effect === effect && ids.has(b.a) && ids.has(b.b))
    .reduce((sum, b) => sum + b.value, 0);
}

// ── 船 ──────────────────────────────────────────────────────────────────

/**
 * 现在的船该是哪一档。**按剧情算，不读 state.ship.tier**——
 * 那个字段以前只在建号时写一次，从来没跟着剧情升过，
 * 结果玩家一直拿着小帆船的加成去打按阳光号算的难度（少 2%~6% 战力）。
 */
export function shipTierOf(state) {
  const no = Math.max(1, Math.min(999, (state?.campaign?.done ?? 0) + 1));
  return shipTierByChapter(no).tier;
}

export function shipOf(state) {
  const tier = shipTierOf(state);
  return { tier, ...shipTierById(tier), parts: state?.ship?.parts ?? {} };
}

export function shipBonus(ship) {
  const tier = shipTierById(ship?.tier ?? 1);
  let out = tier.power ?? 0;
  for (const part of SHIP_PARTS) {
    out += (part.power ?? 0) * (ship?.parts?.[part.id] ?? 0);
  }
  return out;
}

export function partsOf(ship) {
  return SHIP_PARTS.map((part) => ({
    ...part,
    level: ship?.parts?.[part.id] ?? 0,
  }));
}

// ── 收藏 ────────────────────────────────────────────────────────────────

/** 刀架上只有前三把算数——收藏可以很多，用得上的是三把。 */
export function equippedBlades(state) {
  return (state?.gears?.blades ?? [])
    .map(bladeById)
    .filter(Boolean)
    .sort((a, b) => b.power - a.power)
    .slice(0, BLADE_SLOTS);
}

export function bladeBonus(state) {
  return equippedBlades(state).reduce((sum, b) => sum + b.power, 0);
}

export function fruitOf(state) {
  return fruitById(state?.gears?.fruit);
}

export function fruitBonus(state) {
  return fruitOf(state)?.power ?? 0;
}

export function hakiLevel(state, id) {
  return clamp(state?.haki?.[id] ?? 0, 0, 5);
}

export function hakiBonus(state) {
  return hakiLevel(state, 'busou') * 0.012;
}

// ── 总战力 ──────────────────────────────────────────────────────────────

export function powerParts(state) {
  const level = state?.level?.value ?? 1;
  const base = levelBase(level);
  const crew = crewBonus(state);
  const ship = shipBonus({ tier: shipTierOf(state), parts: state?.ship?.parts });
  const blade = bladeBonus(state);
  const fruit = fruitBonus(state);
  const haki = hakiBonus(state);
  return {
    level, base, crew, ship, blade, fruit, haki,
    mul: 1 + crew + ship + blade + fruit + haki,
    power: Math.round(base * (1 + crew + ship + blade + fruit + haki)),
  };
}

export function powerOf(state) {
  return powerParts(state).power;
}

/**
 * 「一个正常玩家走到第 N 章时该有多少加成」。
 * 船员按剧情必到，船按剧情必换，这两项算进预期；
 * 名刀、果实、改装件不算——那是不花力气就没有的东西。
 *
 * 战斗难度 = 章节原难度 × 这个系数，所以比值和 0.3.2 完全一样，
 * 加了再多系统也不会把「墙」变成平地。
 */
/**
 * 难度里预留的「你得自己补」的缺口：两成。
 *
 * 之前难度 = 原难度 × 该位置的白给加成，等于照着玩家的镜子画：
 * 什么都不买、什么都不练，119 章里 111 章战力都够（平均比值 1.23）。
 * 于是「变强」这件事从头到尾没被需要过——点就是了。
 *
 * 0.9.0 先把缺口设成两成，配上拉陡的升级曲线又收回 12%：
 * 升级变慢本身已经在终局留下三成缺口（Lv53 打按 Lv79 写的对手），
 * 再叠两成就是死墙。现在这 12% 只负责中段——
 * ch35 比值 1.01、ch90 0.96、终局 0.76，最后一关要靠满收藏才过得去。
 * 那口气得用名刀（约 +10%）、改装（约 +7%）、霸气（约 +6%）去补。
 *
 * BOSS 章不加这个缺口：它们已经有 1.2 / 1.5 倍，再加就成死墙。
 */
export const GAP = 0.12;

/**
 * 前三个篇章不设缺口：新手连输两把就不知道该怎么办了，先让她赢得下来。
 * 第 4 到 20 章慢慢把缺口铺满，之后一直是 12%。
 */
export function gapOf(chapterNo = 1) {
  const no = Math.max(1, chapterNo);
  if (no <= 3) return 0;
  if (no >= 20) return GAP;
  return GAP * ((no - 3) / 17);
}

export function expectedMul(chapterNo, opts = {}) {
  const crew = CREW.filter((c) => c.after < chapterNo).map((c) => ({ id: c.id, fatigue: 0 }));
  const tier = shipTierByChapter(chapterNo);
  const base = 1 + crewBonus(crew) + shipBonus({ tier: tier.tier, parts: {} });
  return opts.boss ? base : base + gapOf(chapterNo);
}

/**
 * 章节的「实际难度」＝原难度 × 这个位置该有的加成 × 缺口。
 * 反复硬打的加价（harden）不在这里，在 campaign.js 里叠——两处各管一件事。
 */
export function chapterPower(chapter) {
  if (!chapter) return 1;
  return Math.round(chapter.power * expectedMul(chapter.no, { boss: chapter.isBoss }));
}

// ── 风险与效率 ──────────────────────────────────────────────────────────

/** 被俘概率的倍率：果实怕海水，见闻色和舵手帮你躲。 */
export function captureMul(state) {
  let mul = 1;
  if (fruitOf(state)?.effect === 'dark') mul *= 1.6;
  mul *= 1 - 0.06 * hakiLevel(state, 'kenbun');
  if (crewEffect(state, 'helm')) mul *= 0.6;
  mul *= 1 + bondValue(state, 'capture');
  return clamp(mul, 0.2, 2.2);
}

/** 挨打时船体损伤的倍率。 */
export function damageMul(state) {
  const parts = state?.ship?.parts ?? {};
  let cut = 0;
  for (const part of SHIP_PARTS) cut += Math.abs(part.damage ?? 0) * (parts[part.id] ?? 0);
  cut = Math.min(0.45, cut);
  if (fruitOf(state)?.effect === 'rubber') cut += 0.2;
  return clamp(1 - cut, 0.35, 1);
}

/** 自由航海要等多久的倍率。 */
export function voyageTimeMul(state) {
  const sail = state?.ship?.parts?.sail ?? 0;
  let mul = 1 - 0.05 * sail;
  if (crewEffect(state, 'sail')) mul *= 0.85;
  return clamp(mul, 0.4, 1);
}

export function repairCostMul(state) {
  return crewEffect(state, 'dock') ? 0.7 : 1;
}

export function berryMul(state) {
  return fruitOf(state)?.effect === 'flower' ? 1.3 : 1;
}

/** 赏金倍率：暗暗果实涨得快，霸王色每级再抬 2%。 */
export function bountyMul(state) {
  let mul = 1 + 0.02 * hakiLevel(state, 'haoshoku');
  if (fruitOf(state)?.effect === 'dark') mul *= 1.15;
  mul *= 1 + bondValue(state, 'bounty');
  return mul;
}

/** 航海一次涨多少疲劳。 */
export function fatigueMul(state) {
  const galley = state?.ship?.parts?.galley ?? 0;
  let mul = 1 - 0.08 * galley;
  if (crewEffect(state, 'cook')) mul *= 0.7;
  if (fruitOf(state)?.effect === 'quake') mul *= 1.4;
  return clamp(mul, 0.2, 2);
}

/** 每打完一章自己回多少船体。 */
export function autoHullHeal(state) {
  let heal = 0;
  if (crewEffect(state, 'doctor')) heal += 6;
  if (fruitOf(state)?.effect === 'op') heal += 12;
  heal += bondValue(state, 'heal');
  return heal;
}

/** BOSS 三回合里，某一回合的额外战力（船员与果实）。 */
export function bossRoundBonus(state, roundIndex) {
  let bonus = 0;
  const last = roundIndex >= 2;
  if (last) {
    if (crewEffect(state, 'boss3')) bonus += 0.1;
    if (fruitOf(state)?.effect === 'flame') bonus += 0.08;
    bonus += bondValue(state, 'boss3');
  }
  // 霸王色是整场都在，不是只有最后一回合。
  bonus += 0.03 * hakiLevel(state, 'haoshoku');
  return bonus;
}
