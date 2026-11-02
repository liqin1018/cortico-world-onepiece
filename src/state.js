/**
 * 存档。只有一个 json，写在部署的 data 目录里。
 *
 * 原则：坏了就重来，别让整个扩展起不来。读不懂的旧文件改名留底，不删。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { hashString, mulberry32, pick } from './rng.js';
import { npcInit, localDayKey } from './sea.js';
import { themeOf } from './theme/index.js';
import { expNeed, expToReach, levelFromExp, levelForProgress, CHAPTERS } from './campaign.js';
import { CREW } from './crew.js';
import { emptyParts, shipTierByChapter } from './ship.js';
import { BLADES, emptyMaterials } from './gear.js';
import { ARC_END } from './codex.js';
import { storyDefaults, PONEGLYPHS } from './story.js';

export const STATE_VERSION = 6;

/** 榜单默认人数：名单里有多少人就上多少人。 */
export const DEFAULT_NPC_COUNT = 60;

export function statePath(dataDir) {
  return join(dataDir, 'onepiece.json');
}

/** v0.4 / v0.5 的那些字段。新档和迁移共用一份，免得两边长歪。 */
export function progressExtras(done = 0) {
  const tier = shipTierByChapter(done + 1).tier;
  return {
    crew: CREW.filter((c) => c.after <= done).map((c) => ({ id: c.id, joinedDay: 1, fatigue: 0 })),
    materials: { ...emptyMaterials(), wood: 2, iron: 1 },
    ship: { tier, parts: emptyParts() },
    gears: { blades: [], fruits: [], fruit: null },
    haki: { kenbun: 0, busou: 0, haoshoku: 0 },
    training: 0,
    choices: {},
    nextBonus: null,
    codexTier: 0,
    story: storyDefaults(),
    dispatch: [],
  };
}

export function createState({ botName, themeId, npcCount, now = Date.now() }) {
  const theme = themeOf(themeId);
  const seed = hashString(`${botName}:${now}:${Math.random()}`) >>> 0;
  const rng = mulberry32(seed);
  const npcs = npcInit(theme, npcCount, seed);
  return {
    version: STATE_VERSION,
    seed,
    createdAt: new Date(now).toISOString(),
    day: 1,
    captain: {
      name: botName || '无名船长',
      epithet: pick(rng, theme.epithets),
      bounty: theme.startBounty,
      berries: theme.startBerries,
      hull: 100,
      deeds: 0,
      renown: 0,
      explored: [theme.islands[0].id, theme.islands[0].name],
      crime: '初出茅庐',
    },
    voyage: null,
    blockedUntil: null,
    npcs,
    npcSet: theme.id,
    npcCount: npcs.length,
    level: { value: 1, exp: 0, total: 0, need: expNeed(1) },
    campaign: { done: 0, attempts: 0, bosses: 0 },
    auto: { lastRunAt: null, day: localDayKey(now), runs: 0 },
    log: [],
    ...progressExtras(0),
  };
}

function looksHealthy(state) {
  return Boolean(
    state
    && Number.isFinite(state.version)
    && state.version >= 1
    && state.captain
    && Number.isFinite(state.captain.bounty)
    && Array.isArray(state.npcs)
    && Array.isArray(state.log)
    && Number.isFinite(state.day),
  );
}

export function loadState(file, opts) {
  if (!existsSync(file)) return createState(opts);
  try {
    const state = JSON.parse(readFileSync(file, 'utf8'));
    if (!looksHealthy(state)) throw new Error('存档结构不对');
    if (!state.captain.explored) state.captain.explored = [];
    if (typeof state.captain.renown !== 'number') state.captain.renown = 0;

    const theme = themeOf(opts.themeId);
    const want = Number.isFinite(opts.npcCount) ? opts.npcCount : DEFAULT_NPC_COUNT;

    // v2：榜单从「12 个随机对手」换成整份名单。升级只换榜单，
    // 天数、赏金、船体、日志、探索记录一律不动。
    const upgraded = state.version < 2;
    const themeChanged = state.npcSet !== theme.id;
    const empty = !Array.isArray(state.npcs) || state.npcs.length === 0;
    if (upgraded || themeChanged || empty) {
      const size = upgraded && theme.roster?.length ? theme.roster.length : want;
      state.npcs = npcInit(theme, size, state.seed >>> 0);
      state.npcSet = theme.id;
      state.npcCount = state.npcs.length;
    }

    // v3：剧情、等级、自动冒险。老档的等级按已有赏金折算，别让她「变回 1 级」。
    if (state.version < 3) {
      const bounty = Number.isFinite(state.captain?.bounty) ? state.captain.bounty : 0;
      const guess = Math.min(60, Math.max(1, Math.round(bounty / 6_000_000)));
      state.level = { value: guess, exp: 0, total: expToReach(guess), need: expNeed(guess) };
      state.campaign = { done: 0, attempts: 0, bosses: 0 };
      state.auto = { lastRunAt: null, day: localDayKey(Date.now()), runs: 0 };
    }
    // v4：难度整体抬过一轮（章节难度翻倍、失败不再给经验）。
    // 老档按「剧情进度应有的等级」对齐，不然一进门就是打不过。
    if (state.version < 4) {
      const lv = levelForProgress(state.campaign?.done ?? 0);
      if (!state.level || state.level.value < lv) {
        state.level = { value: lv, exp: 0, total: expToReach(lv), need: expNeed(lv) };
      }
    }
    // v5：船员 / 船坞 / 收藏 / 抉择。
    // 老档按进度把「本来就该有的」补齐：该上船的都在，打过的 BOSS 掉过的刀都在。
    // 材料、改装件、霸气、修行点是新东西，从零开始——那些要重新花力气。
    if (state.version < 5) {
      const done = state.campaign?.done ?? 0;
      const ext = progressExtras(done);
      if (!Array.isArray(state.crew) || !state.crew.length) state.crew = ext.crew;
      state.materials = { ...ext.materials, ...(state.materials ?? {}) };
      state.ship = { tier: ext.ship.tier, parts: { ...ext.ship.parts, ...(state.ship?.parts ?? {}) } };
      const blades = (state.gears?.blades ?? []).slice();
      for (const blade of BLADES) {
        const end = ARC_END[blade.from];
        if (end != null && end <= done && !blades.includes(blade.id)) blades.push(blade.id);
      }
      state.gears = {
        blades,
        fruits: state.gears?.fruits ?? [],
        fruit: state.gears?.fruit ?? null,
      };
      state.haki = { kenbun: 0, busou: 0, haoshoku: 0, ...(state.haki ?? {}) };
      state.training = state.training ?? 0;
      state.choices = state.choices ?? {};
      state.nextBonus = null;
      state.codexTier = state.codexTier ?? 0;
    }
    // v6：羁绊、派遣、历史正文、梅丽号。
    // 老档按「走到哪一章」把石碑补齐——打过的 BOSS 掉过的东西就应该在。
    // 梅丽号按同一把尺子算：过了司法岛，它就已经沉了，不再补演一遍。
    if (state.version < 6) {
      const done = state.campaign?.done ?? 0;
      const stones = [];
      for (const stone of PONEGLYPHS) {
        const boss = CHAPTERS.find((c) => c.isBoss && c.arcId === stone.from);
        if (boss && boss.no <= done && !stones.includes(stone.id)) stones.push(stone.id);
      }
      const merryBoss = CHAPTERS.find((c) => c.isBoss && c.arcId === 'enies');
      state.story = {
        ...storyDefaults(),
        merryBurned: Boolean(merryBoss && merryBoss.no <= done),
        poneglyphs: stones,
        voidUnlocked: stones.length >= PONEGLYPHS.length,
        pending: null,
      };
      state.dispatch = [];
    }
    // 兜底：手改过、或者从更早的测试版留下来的残缺字段，补成能跑的形状。
    state.crew = Array.isArray(state.crew) ? state.crew : [];
    state.materials = { wood: 0, iron: 0, rare: 0, ...(state.materials ?? {}) };
    state.ship = state.ship ?? { tier: 1, parts: emptyParts() };
    // 档次按剧情重算：老版本只写一次，越往后差得越多。
    state.ship.tier = shipTierByChapter((state.campaign?.done ?? 0) + 1).tier;
    state.gears = { blades: [], fruits: [], fruit: null, ...(state.gears ?? {}) };
    state.haki = { kenbun: 0, busou: 0, haoshoku: 0, ...(state.haki ?? {}) };
    state.choices = state.choices ?? {};
    state.story = { ...storyDefaults(), ...(state.story ?? {}) };
    state.dispatch = Array.isArray(state.dispatch) ? state.dispatch : [];
    // 派遣记录指向的人如果不在船上（手改过存档），这条记录就是脏的，扔掉。
    state.dispatch = state.dispatch.filter(
      (d) => state.crew.some((m) => m.id === d.crewId) && Number.isFinite(d.until),
    );
    // awayUntil 没有对应派遣记录的，也清掉——不然那个人会永远不在船上。
    for (const member of state.crew) {
      if (member.awayUntil != null && !state.dispatch.some((d) => d.crewId === member.id)) {
        delete member.awayUntil;
      }
    }
    state.version = STATE_VERSION;
    return state;
  } catch {
    const broken = `${file}.broken-${new Date().toISOString().replaceAll(':', '-')}`;
    try { renameSync(file, broken); } catch { /* 留不下就算了，别挡住启动 */ }
    return createState(opts);
  }
}

export function saveState(file, state) {
  const dir = dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  renameSync(tmp, file);
}
