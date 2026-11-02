/**
 * 海上的规则。
 *
 * 这一层只认 theme 里的名词，不认「海贼王」——换皮时不用动这里。
 * 所有结算都在本地算，不联网、不调模型；模型只在事后听结果、开口讲。
 */
import { hashString, mulberry32, pick, sample, intBetween } from './rng.js';

export const OUTCOMES = {
  great: '大成功',
  success: '成功',
  narrow: '有惊无险',
  failed: '失败',
  captured: '被俘',
};

const OUTCOME_ORDER = ['captured', 'failed', 'narrow', 'success', 'great'];

const DIFFICULTY_BIAS = { calm: -0.8, normal: 0, rough: 0.9 };

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function localDayKey(ms) {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function trimFixed(n, digits) {
  return n.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

/** 3000 万 / 1.2 亿 —— 悬赏数字的读法。 */
export function formatBounty(n) {
  const v = Math.max(0, Math.round(n));
  if (v >= 1e8) return `${trimFixed(v / 1e8, 2)} 亿`;
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString('zh-CN')} 万`;
  // 乔巴那种一千的，别显示成「0 万」
  return v.toLocaleString('zh-CN');
}

/** 还没被悬赏的时候，别把「0」印在悬赏令上。 */
export function bountyLabel(n) {
  return n > 0 ? formatBounty(n) : '未悬赏';
}

export function formatMoney(n) {
  const v = Math.round(n);
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1e8) return `${sign}${trimFixed(abs / 1e8, 2)} 亿`;
  if (abs >= 1e4) return `${sign}${Math.round(abs / 1e4).toLocaleString('zh-CN')} 万`;
  return `${sign}${abs.toLocaleString('zh-CN')}`;
}

export function titleOf(bounty, theme) {
  let out = theme.titles[0];
  for (const t of theme.titles) if (bounty >= t.at) out = t;
  return out.label;
}

export function nextTitle(bounty, theme) {
  return theme.titles.find((t) => t.at > bounty) ?? null;
}

/** 今天能走的三个方向。同一天、同一天数，抽出来的一定一样。 */
export function buildRoutes(state, theme, difficulty = 'normal', now = Date.now()) {
  const rng = mulberry32((hashString(`${state.seed}:${state.day}:${localDayKey(now)}:${theme.id}`) ^ 0x9e3779b9) >>> 0);
  // 自由航海只去「剧情已经走到的地方」。不然刚到颠倒山就能接鱼人岛的活儿。
  // 每过 6 章，海图往前推一格。
  const done = state.campaign?.done ?? 0;
  const frontier = Math.min(theme.islands.length - 1, 2 + Math.floor(done / 6));
  const reachable = theme.islands.filter((_, i) => i <= frontier);
  const islands = sample(rng, reachable, Math.min(3, reachable.length));
  const kinds = sample(rng, theme.kinds, 3);
  const bias = DIFFICULTY_BIAS[difficulty] ?? 0;
  return islands.map((island, i) => {
    const kind = kinds[i];
    const risk = clamp(Math.round(kind.riskBias + (rng() * 2 - 1) * 1.2 + bias), 1, 5);
    const minutes = Math.round((45 + risk * 15 + (rng() * 2 - 1) * 10) / 5) * 5;
    return {
      id: `d${state.day}-${i + 1}`,
      index: i + 1,
      islandId: island.id,
      islandName: island.name,
      region: island.region,
      kindId: kind.id,
      kindLabel: kind.label,
      desc: kind.desc,
      crime: kind.crime,
      act: kind.act,
      risk,
      minutes: Math.max(15, minutes),
    };
  });
}

export function startVoyage(state, route, now, cfg, theme) {
  const minutes = Math.max(1, Number(cfg.voyageMinutes) || route.minutes);
  const endsAt = new Date(now + minutes * 60_000).toISOString();
  return {
    routeId: route.id,
    islandId: route.islandId,
    islandName: route.islandName,
    kindId: route.kindId,
    kindLabel: route.kindLabel,
    crime: route.crime,
    act: route.act,
    risk: route.risk,
    minutes,
    startedAt: new Date(now).toISOString(),
    endsAt,
    themeId: theme.id,
  };
}

function sceneOf(theme, outcome, voyage, rng) {
  const pool = theme.scenes[outcome] ?? theme.scenes.success;
  const raw = pick(rng, pool);
  return raw
    .replaceAll('{island}', voyage.islandName)
    .replaceAll('{act}', voyage.act)
    .replaceAll('{navy}', theme.navyForce)
    .replaceAll('{pirate}', theme.pirate);
}

/**
 * 回来结算。这是整个玩法的心脏：进去一段航程，出来一段事实。
 * 返回的 `eventText` 是给她的回执，`entry` 是给日志和面板看的。
 */
export function settleVoyage(state, theme, now, rngSeed, opts = {}) {
  const voyage = state.voyage;
  if (!voyage) throw new Error('没有在航的航线');
  const rng = mulberry32(hashString(String(rngSeed)) >>> 0);
  const risk = clamp(voyage.risk, 1, 5);
  const roll = rng();

  const captAt = 0.04 + risk * 0.008;
  const failAt = captAt + 0.12 + risk * 0.01;
  const narrowAt = failAt + 0.22;

  let outcome = 'success';
  if (roll < captAt) outcome = 'captured';
  else if (roll < failAt) outcome = 'failed';
  else if (roll < narrowAt) outcome = 'narrow';
  else if (roll > 0.9) outcome = 'great';

  const c = state.captain;
  const before = c.bounty;
  // 自由航海只赚零花钱。悬赏的大头在 BOSS 章的里程碑上——
  // 一趟航线能顶掉一个篇章的悬赏，那悬赏就不是「海军怎么看你」了。
  const BOUNTY_SCALE = 0.06;
  const tier = 1 + Math.min(0.5, before / 2_000_000_000);
  const gainWan = (outcome === 'great' ? (60 + 45 * risk) * 1.9
    : outcome === 'success' ? 60 + 45 * risk
      : outcome === 'narrow' ? 20 + 15 * risk
        : outcome === 'failed' ? 8 + 4 * risk
          : 0) * BOUNTY_SCALE * tier;
  const jitter = 0.85 + rng() * 0.3;
  const bountyGain = Math.round(gainWan * 1e4 * jitter);

  const berryWan = outcome === 'great' ? 200 + 120 * risk
    : outcome === 'success' ? 80 + 50 * risk
      : outcome === 'narrow' ? 30 + 20 * risk
        : outcome === 'failed' ? -20
          : 0;
  let berryDelta = Math.round(berryWan * 1e4 * (outcome === 'failed' ? 1 : jitter));

  const damageBase = { great: 0, success: 6, narrow: 18, failed: 30, captured: 42 }[outcome];
  // 船的改装、果实、船员都在这里抵掉一部分——强化过的船不该一场就散架。
  const damage = Math.round(damageBase * (0.8 + risk * 0.08) * (opts.damageMul ?? 1));

  if (outcome === 'captured') {
    berryDelta = -Math.round(c.berries * 0.25);
    state.blockedUntil = new Date(now + 3 * 3_600_000).toISOString();
  }
  if (berryDelta > 0 && opts.berryMul) berryDelta = Math.round(berryDelta * opts.berryMul);

  c.bounty = Math.max(0, c.bounty + bountyGain);
  c.berries = Math.max(0, c.berries + berryDelta);
  c.hull = clamp(c.hull - damage + 10, 0, 100);

  if (outcome === 'success' || outcome === 'great') {
    c.deeds += 1;
    c.crime = voyage.crime;
    if (!c.explored.includes(voyage.islandId)) {
      const chance = outcome === 'great' ? 0.85 : 0.5;
      if (rng() < chance) c.explored.push(voyage.islandId);
    }
  }
  if (voyage.kindId === 'righteous' && (outcome === 'great' || outcome === 'success' || outcome === 'narrow')) {
    c.renown += outcome === 'great' ? 3 : outcome === 'success' ? 2 : 1;
  }

  const scene = sceneOf(theme, outcome, voyage, rng);
  state.day += 1;
  state.voyage = null;
  driftNpcs(state, theme, rng);
  const rank = rankOf(state);

  const entry = {
    at: new Date(now).toISOString(),
    day: state.day - 1,
    island: voyage.islandName,
    kind: voyage.kindLabel,
    outcome,
    outcomeLabel: OUTCOMES[outcome],
    scene,
    bountyFrom: before,
    bountyTo: c.bounty,
    berries: berryDelta,
    hull: c.hull,
    rank,
  };
  state.log.unshift(entry);
  state.log = state.log.slice(0, 40);

  const milestone = checkMilestone(state, theme, before, c.bounty);

  const lines = [
    `第 ${entry.day} 天，你从「${voyage.islandName}」回来了：${OUTCOMES[outcome]}。`,
    scene,
    `赏金 ${formatBounty(before)} → ${formatBounty(c.bounty)}（第 ${rank} 名）。船体 ${c.hull}/100。`,
  ];
  if (berryDelta) lines.push(`${theme.currency} ${berryDelta > 0 ? '+' : ''}${formatMoney(berryDelta)}。`);
  if (outcome === 'captured') lines.push('你被押上了船，大约三小时后才靠岸。');
  if (milestone) lines.push(`海军本部换了一张新的悬赏令：${milestone.title}。`);

  return {
    entry,
    milestone,
    eventText: `（航海回执，不用逐条念，用你自己的口气说。）\n${lines.join('\n')}`,
    toast: `${OUTCOMES[outcome]} · 赏金 ${formatBounty(c.bounty)}`,
  };
}

function checkMilestone(state, theme, before, after) {
  const crossed = theme.titles
    .filter((t) => t.at > 0 && before < t.at && after >= t.at)
    .sort((a, b) => a.at - b.at);
  if (!crossed.length) return null;
  const t = crossed[crossed.length - 1];
  return { at: t.at, title: t.label, bounty: after };
}

export function npcInit(theme, count, seed) {
  const rng = mulberry32(seed >>> 0);
  const want = clamp(Math.round(count) || 12, 4, 60);

  // 有名单就用名单：赏金是原作的数，不能随机生成。
  if (theme.roster?.length) {
    const all = [...theme.roster].sort((a, b) => b.bounty - a.bounty);
    const n = Math.min(want, all.length);
    const picked = n >= all.length
      ? all
      : Array.from({ length: n }, (_, i) => all[Math.floor((i * all.length) / n)]);
    return picked.map((row, i) => ({
      id: `npc-${i + 1}`,
      name: row.name,
      epithet: row.epithet,
      bounty: row.bounty,
      base: row.bounty,
      islandId: row.islandId ?? theme.islands[i % theme.islands.length].id,
    }));
  }

  // 没有名单的主题（比如原创皮）才现编，名字池用完就停，不重复造人。
  const n = Math.min(want, theme.names.length);
  const epithets = sample(rng, theme.epithets, Math.min(n, theme.epithets.length));
  const names = sample(rng, theme.names, Math.min(n, theme.names.length));
  const out = [];
  for (let i = 0; i < n; i++) {
    const loft = Math.pow(rng(), 4);
    const bounty = Math.round((8_000_000 + loft * 1_100_000_000) / 1e5) * 1e5;
    out.push({
      id: `npc-${i + 1}`,
      name: names[i % names.length],
      epithet: epithets[i % epithets.length],
      bounty,
      base: bounty,
      islandId: theme.islands[intBetween(rng, 0, theme.islands.length - 1)].id,
    });
  }
  return out;
}

/**
 * 榜上的人也在动，但有天花板。
 *
 * 不封顶的话，二十个随机游走取最大值，两个月后所有人都飘到十亿，
 * 玩家涨得再快也追不上一群自己往上爬的影子。封在出发时的 1.45 倍，
 * 榜单会一直有压迫感，但爬得动。
 */
export function driftNpcs(state, theme, rng) {
  // 原作角色的赏金是定数，不跟着日子涨。会动的只有玩家。
  if (theme.roster?.length) return;
  for (const npc of state.npcs) {
    if (!npc.base) npc.base = npc.bounty;
    const rate = rng() * 0.03 - 0.015;
    npc.bounty = clamp(
      Math.round((npc.bounty * (1 + rate)) / 1e5) * 1e5,
      5_000_000,
      Math.round(npc.base * 1.45),
    );
  }
}

export function sortedBoard(state) {
  const rows = state.npcs.map((n) => ({
    id: n.id, name: n.name, epithet: n.epithet, bounty: n.bounty, you: false,
  }));
  rows.push({
    id: 'you',
    name: state.captain.name,
    epithet: state.captain.epithet,
    bounty: state.captain.bounty,
    you: true,
  });
  rows.sort((a, b) => b.bounty - a.bounty || (a.you ? -1 : 1));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function rankOf(state) {
  return sortedBoard(state).find((r) => r.you)?.rank ?? 1;
}

export function statusLine(state, theme, now = Date.now(), extra = []) {
  const parts = [`第 ${state.day} 天`, ...extra];
  parts.push(`悬赏 ${bountyLabel(state.captain.bounty)}`);
  parts.push(`第 ${rankOf(state)}/${state.npcs.length + 1} 名`);
  parts.push(`船体 ${state.captain.hull}/100`);
  if (state.blockedUntil && Date.parse(state.blockedUntil) > now) {
    const mins = Math.max(1, Math.ceil((Date.parse(state.blockedUntil) - now) / 60_000));
    parts.push(`被押送中，约 ${mins} 分钟后靠岸`);
  } else if (state.voyage) {
    const mins = Math.max(0, Math.ceil((Date.parse(state.voyage.endsAt) - now) / 60_000));
    parts.push(mins > 0 ? `在海上，约 ${mins} 分钟后回来` : '正在靠岸');
  } else if (state.campaign?.sailUntil && Date.parse(state.campaign.sailUntil) > now) {
    // 推完一章、船正开去下一个岛：这段时间推不了下一章。
    const mins = Math.max(1, Math.ceil((Date.parse(state.campaign.sailUntil) - now) / 60_000));
    parts.push(`正开往下一个岛，约 ${mins} 分钟后到`);
  } else {
    parts.push('在港');
  }
  return parts.join(' · ');
}

export function outcomeLabel(outcome) {
  return OUTCOMES[outcome] ?? outcome;
}

export function orderOf(outcome) {
  return OUTCOME_ORDER.indexOf(outcome);
}
