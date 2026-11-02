/**
 * 打一场：普通章节一掷定输赢，BOSS 是三回合。
 *
 * 为什么 BOSS 要三回合：一掷的 BOSS 只有一个数字，看不出「差点就赢」。
 * 三回合能给到「试探输了、交锋赢了、决着差一点」这种东西，
 * 而且「赢两回合才算过」本身就是一个更像决斗的判定。
 * 数值上，parity（战力＝难度）时大约八成能过——比小兵紧，但不是墙。
 *
 * 这里也负责把结果写进存档：奖励、材料、船员上船、收藏掉落、疲劳。
 */
import {
  chapterAt, TOTAL_CHAPTERS, ARCS, OUTCOMES, outcomeOf, rewardsOf,
  chapterPowerOf, grantExp, campaignAttempts, hardenOf, sailDelayMin,
} from './campaign.js';
import {
  powerOf, captureMul, damageMul, berryMul, bountyMul, fatigueMul, autoHullHeal,
  bossRoundBonus, crewEffect, bondValue, shipTierOf,
} from './collect.js';
import { BLADES, FRUITS, HAKI_BY_ID, MATERIAL_BY_ID, bladesForArc } from './gear.js';
import { CREW, crewById } from './crew.js';
import { CHOICES, BOSS_STANCE, BOSS_TAUNTS } from './choices.js';
import { storyOnClear, storyDefaults, voidChapter } from './story.js';
import { tickDispatch } from './dispatch.js';
import { hashString, mulberry32 } from './rng.js';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// ── BOSS 三回合 ──────────────────────────────────────────────────────────

/**
 * 三个回合，三道越来越高的线：试探 0.90、交锋 0.96、决着 1.04。
 * 赢两回合才算过，所以「过 BOSS」的门槛落在 0.96——和 0.3.x 的单掷门槛一致，
 * 手感不变；但多出来的那两条线让「差一点」变成一个看得见的数字，
 * 而不是一个笼统的「惨胜」。
 */
export const BOSS_ROUNDS = [
  { key: 'probe', label: '试探', need: 0.9 },
  { key: 'clash', label: '交锋', need: 0.96 },
  { key: 'finish', label: '决着', need: 1.04 },
];

export function chapterRng(state, chapter, attempt, salt = 0) {
  const seed = hashString(`${state.seed}:${chapter.no}:${attempt}:${state.campaign?.done ?? 0}:${state.day ?? 1}:${salt}`) >>> 0;
  return mulberry32(seed)();
}

/** 普通章节：一掷。 */
export function fightChapter(state, chapter, opts = {}) {
  const power = Math.round(powerOf(state) * (1 + (opts.powerBonus ?? 0)));
  const variance = 0.88 + (opts.roll ?? 0.5) * 0.24;
  const foe = chapterPowerOf(chapter, opts.attempts ?? 0);
  const ratio = (power * variance) / Math.max(1, foe);
  const outcome = outcomeOf(ratio);
  const rule = OUTCOMES[outcome];
  return {
    kind: 'single',
    chapter, power, foe, ratio, outcome,
    outcomeLabel: rule.label,
    rounds: [],
    wins: outcome === 'great' ? 3 : outcome === 'success' ? 2 : outcome === 'narrow' ? 1 : 0,
    cleared: outcome === 'great' || outcome === 'success' || outcome === 'narrow',
  };
}

/** BOSS：三回合，同一次掷骰摊到三条线上，赢两回合才算过。 */
export function fightBoss(state, chapter, opts = {}) {
  const base = powerOf(state);
  // 账面战力不带回合加成——「决着 +10%」只在决着那一回合生效。
  // 早先的写法把它加进整场，等于三条线一起降，三回合变成走过场，是 bug。
  const power = Math.round(base * (1 + (opts.powerBonus ?? 0)));
  const variance = 0.88 + (opts.roll ?? 0.5) * 0.24;
  const foe = chapterPowerOf(chapter, opts.attempts ?? 0);
  const master = (power * variance) / Math.max(1, foe);
  const rounds = [];
  let wins = 0;
  let hull = 0;

  BOSS_ROUNDS.forEach((round, i) => {
    // 越往后她越熟（+1.2%/回合），再加上这一回合专属的加成。
    const margin = master * (1 + 0.012 * i) * (1 + bossRoundBonus(state, i));
    const won = margin >= round.need;
    if (won) wins += 1;
    // 每回合都要付点船体，赢的回合付得少。三回合加起来跟一场普通仗差不多。
    hull += won ? -1 : -6;
    rounds.push({
      key: round.key,
      label: round.label,
      margin,
      need: round.need,
      won,
      hull,
    });
  });

  // 只有「一回合都没赢、而且差得远」才会被俘。0.8 太容易摸到——
  // 难度留了两成缺口之后，0.8 的战力比会经常出现，被俘就从意外变成了日常。
  const outcome = wins >= 3 ? 'great' : wins === 2 ? 'success' : (wins === 0 && master < 0.72) ? 'captured' : 'failed';
  return {
    kind: 'boss',
    chapter, power, foe, ratio: master, outcome,
    outcomeLabel: OUTCOMES[outcome].label,
    rounds, wins,
    cleared: wins >= 2,
  };
}

// ── 抉择 ─────────────────────────────────────────────────────────────────

/** 当前这一章是不是卡着一个抉择。 */
export function choiceFor(state) {
  const done = state.campaign?.done ?? 0;
  if (done >= TOTAL_CHAPTERS) return null;
  const ch = chapterAt(done);
  const key = `${ch.arcId}:${ch.index}`;
  if (state.choices?.[key]) return null;
  if (ch.isBoss) {
    const taunt = BOSS_TAUNTS[ch.arcId];
    if (!taunt) return null;
    return { key, kind: 'boss', title: `${ch.boss} · 怎么打`, prompt: taunt, options: BOSS_STANCE };
  }
  const scene = CHOICES[key];
  if (!scene) return null;
  return { key, kind: 'scene', title: scene.title, prompt: scene.prompt, options: scene.options };
}

export function addMaterials(state, delta = {}) {
  if (!state.materials) state.materials = { wood: 0, iron: 0, rare: 0 };
  const got = [];
  for (const [id, n] of Object.entries(delta)) {
    if (!n) continue;
    state.materials[id] = Math.max(0, (state.materials[id] ?? 0) + n);
    if (n > 0) got.push(`${MATERIAL_BY_ID[id]?.name ?? id} ×${n}`);
  }
  return got;
}

export function fatigueAll(state, amount) {
  for (const m of state.crew ?? []) {
    m.fatigue = clamp((m.fatigue ?? 0) + amount, 0, 100);
  }
}

/**
 * 自由航海带回来的东西。分「干什么」而不是「去哪」：
 * 抢商路是木头（拆船），跑海军巡逻是铁，摸遗迹是稀有材料。
 */
export function freeSailLoot(state, route, rng = Math.random) {
  const kind = route?.kindId;
  const delta = { wood: 0, iron: 0, rare: 0 };
  if (kind === 'raid') delta.wood = 2 + Math.floor(rng() * 2);
  else if (kind === 'ruin') {
    delta.wood = 1;
    if (rng() < 0.35) delta.rare = 1;
  } else if (kind === 'navy') delta.iron = 2 + Math.floor(rng() * 2);
  else if (kind === 'righteous') {
    delta.wood = 1;
    delta.iron = 1;
  } else {
    delta.iron = 1 + Math.floor(rng() * 2);
    if (rng() < 0.22) delta.rare = 1;
  }
  const extra = (crewEffect(state, 'loot') ? 1 : 0) + bondValue(state, 'loot');
  if (extra) {
    delta.wood += extra;
    delta.iron += extra;
  }
  const got = addMaterials(state, delta);
  return { delta, notes: got };
}

function randomUnownedFruit(state) {
  const owned = new Set([...(state.gears?.fruits ?? []), state.gears?.fruit].filter(Boolean));
  const pool = FRUITS.filter((f) => !owned.has(f.id));
  if (!pool.length) return null;
  const total = pool.reduce((n, f) => n + (f.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const f of pool) {
    roll -= f.weight ?? 1;
    if (roll <= 0) return f;
  }
  return pool.at(-1);
}

/**
 * 落一个选择。立刻生效的东西当场结算，战斗加成挂到 nextBonus 上，
 * 等下一次 resolveChapter 用掉。
 */
export function applyChoice(state, index = 0) {
  const choice = choiceFor(state);
  if (!choice) return null;
  const i = clamp(Math.round(Number(index)) || 0, 0, choice.options.length - 1);
  const opt = choice.options[i];
  const fx = opt.fx ?? {};
  const c = state.captain;
  const notes = [];

  if (!state.choices) state.choices = {};
  state.choices[choice.key] = { i, day: state.day, label: opt.label };

  if (fx.berries) {
    c.berries = Math.max(0, c.berries + fx.berries);
    notes.push(`贝利 ${fx.berries > 0 ? '+' : '-'}${Math.round(Math.abs(fx.berries) / 1e4)} 万`);
  }
  if (fx.hull) {
    if (fx.hull >= 100) { c.hull = 100; notes.push('船体修满'); }
    else {
      c.hull = clamp(c.hull + fx.hull, 0, 100);
      notes.push(`船体 ${fx.hull > 0 ? '+' : ''}${fx.hull}`);
    }
  }
  if (fx.renown) {
    c.renown = Math.max(0, (c.renown ?? 0) + fx.renown);
    notes.push(`声望 ${fx.renown > 0 ? '+' : ''}${fx.renown}`);
  }
  if (fx.training) {
    state.training = Math.max(0, (state.training ?? 0) + fx.training);
    notes.push(`修行点 +${fx.training}`);
  }
  if (fx.fatigue) {
    fatigueAll(state, fx.fatigue);
    notes.push(fx.fatigue > 0 ? `全员疲劳 +${fx.fatigue}` : `全员缓了一口气`);
  }
  if (fx.material) {
    const got = addMaterials(state, fx.material);
    if (got.length) notes.push(got.join('、'));
  }
  if (fx.haki && HAKI_BY_ID[fx.haki]) {
    state.haki = state.haki ?? {};
    const before = state.haki[fx.haki] ?? 0;
    state.haki[fx.haki] = clamp(before + 1, 0, 5);
    if (state.haki[fx.haki] > before) notes.push(`${HAKI_BY_ID[fx.haki].name} +1`);
  }
  if (fx.recruit) {
    const def = crewById(fx.recruit);
    state.crew = state.crew ?? [];
    if (def && !state.crew.some((m) => m.id === def.id)) {
      state.crew.push({ id: def.id, joinedDay: state.day, fatigue: 0 });
      notes.push(`${def.short}上船了`);
    }
  }
  if (fx.fruit) {
    const fruit = randomUnownedFruit(state);
    if (fruit) {
      state.gears = state.gears ?? {};
      state.gears.fruits = [...(state.gears.fruits ?? []), fruit.id];
      notes.push(`拿到一颗${fruit.name}`);
    }
  }

  const power = fx.nextPower ?? 0;
  const bounty = fx.nextBounty ?? 0;
  const capture = fx.captureRisk ?? 0;
  if (power || bounty || capture) {
    state.nextBonus = {
      power, bounty, capture, note: opt.label, chapter: (state.campaign?.done ?? 0) + 1,
    };
    if (power) notes.push(`下一战 +${Math.round(power * 100)}%`);
    if (bounty) notes.push(`下一战赏金 +${Math.round(bounty * 100)}%`);
    if (capture) notes.push(`下一战被俘风险 +${Math.round(capture * 100)}%`);
  }

  return {
    key: choice.key,
    title: choice.title,
    option: opt,
    notes,
    text: `「${choice.title}」你选了：${opt.label}${notes.length ? `（${notes.join('，')}）` : ''}。`,
  };
}

// ── 掉落 ─────────────────────────────────────────────────────────────────

function dropLoot(state, chapter, rng, cleared) {
  const out = { materials: [], blade: null, fruit: null, notes: [] };
  const arcId = chapter.arcId;
  const base = cleared ? (chapter.isBoss ? 3 : 1) : 0;
  if (base) {
    const bondLoot = bondValue(state, 'loot');
    const wood = base + Math.floor(rng() * 2) + bondLoot;
    const iron = (chapter.isBoss ? 2 : 0) + Math.floor(rng() * 2) + bondLoot;
    const delta = { wood, iron };
    // 罗宾在船上，稀有材料就不是运气问题了。
    const lore = crewEffect(state, 'lore');
    const rareChance = chapter.isBoss ? 0.9 : 0.18;
    if (rng() < (lore ? Math.min(1, rareChance * 2) : rareChance)) delta.rare = 1;
    const got = addMaterials(state, delta);
    out.materials = got;
    out.notes.push(...got);
  }

  if (cleared && chapter.isBoss) {
    // 一个篇章一把，打那篇的 BOSS 必掉。万一以后一章挂了两把，
    // 一次只掉最强的那把没到手的，剩下的留到以后。
    const owned = state.gears?.blades ?? [];
    const blade = bladesForArc(arcId)
      .filter((b) => !owned.includes(b.id))
      .sort((a, b) => b.power - a.power)[0] ?? null;
    if (blade) {
      state.gears = state.gears ?? {};
      state.gears.blades = [...(state.gears.blades ?? []), blade.id];
      out.blade = blade;
      out.notes.push(`得到名刀「${blade.name}」`);
    }
    if (rng() < 0.14) {
      const fruit = randomUnownedFruit(state);
      if (fruit) {
        state.gears = state.gears ?? {};
        state.gears.fruits = [...(state.gears.fruits ?? []), fruit.id];
        out.fruit = fruit;
        out.notes.push(`捡到一颗${fruit.name}`);
      }
    }
  }
  return out;
}

function joinCrew(state) {
  const done = state.campaign?.done ?? 0;
  state.crew = state.crew ?? [];
  const joined = [];
  for (const def of CREW) {
    if (def.after !== done) continue;
    if (state.crew.some((m) => m.id === def.id)) continue;
    state.crew.push({ id: def.id, joinedDay: state.day, fatigue: 0 });
    joined.push(def);
  }
  return joined;
}

// ── 主流程 ───────────────────────────────────────────────────────────────

/**
 * 结算一章，把结果写进 state。返回给 UI 和事件用的事实。
 * 败走 / 被俘不推进进度——但也不清空任何东西，只是这一章没过。
 */
export function resolveChapter(state, chapter = chapterAt(state.campaign?.done ?? 0), opts = {}) {
  // 隔了三天以上没来打，对方的警惕就松了：把过期的次数清掉再开始。
  const stale = (state.campaign?.attempts ?? 0) - campaignAttempts(state);
  if (stale > 0) state.campaign.attempts = campaignAttempts(state);
  const attempt = (state.campaign?.attempts ?? 0) + 1;
  const buff = state.nextBonus ?? {};
  const fx = opts.fx ?? {};
  const powerBonus = (buff.power ?? 0) + (fx.nextPower ?? 0);
  const captureAdd = (buff.capture ?? 0) + (fx.captureRisk ?? 0);
  const c = state.captain;

  const fight = chapter.isBoss
    ? fightBoss(state, chapter, {
      attempts: campaignAttempts(state),
      powerBonus,
      roll: chapterRng(state, chapter, attempt),
    })
    : fightChapter(state, chapter, {
      attempts: campaignAttempts(state),
      powerBonus,
      roll: chapterRng(state, chapter, attempt),
    });

  const rewards = rewardsOf(state, chapter, fight.outcome);
  const berryGain = Math.round(rewards.berries * berryMul(state));
  // 里程碑是海军定的价，霸王色、果实、抉择只影响那些零花钱。
  let bountyGain = rewards.milestone
    ? rewards.bounty
    : Math.round(rewards.bounty * bountyMul(state) * (1 + (buff.bounty ?? 0) + (fx.nextBounty ?? 0)));

  // 被俘：概率被果实 / 见闻色 / 舵手放大或收窄，这里只在「本来就要输」的时候掷一次。
  let captured = fight.outcome === 'captured';
  if (!captured && !fight.cleared && fight.outcome === 'failed') {
    const base = (chapter.isBoss ? 0.16 : 0.1) * captureMul(state) * (1 + captureAdd);
    if (opts.roll != null ? opts.roll < base : Math.random() < base) captured = true;
  }

  const damageBase = captured ? -22 : (OUTCOMES[fight.outcome].hull ?? 0);
  let hullDelta = Math.round(damageBase * damageMul(state));
  if (fight.kind === 'boss') {
    hullDelta = Math.round(fight.rounds.reduce((n, r) => n + r.hull, 0) * damageMul(state));
  }
  // 梅丽号沉了之后，海上总像有人在替她挡一下：被俘不再额外掉船体。
  if (captured && !state.story?.merryBurned) hullDelta -= 10;

  c.berries = Math.max(0, c.berries + berryGain);
  c.bounty = Math.max(0, c.bounty + (captured ? 0 : bountyGain));
  c.hull = clamp(c.hull + hullDelta + autoHullHeal(state), 0, 100);
  c.deeds = (c.deeds ?? 0) + (fight.cleared ? 1 : 0);
  if (!c.explored.includes(chapter.island)) c.explored.push(chapter.island);

  const level = grantExp(state, rewards.exp);
  state.day = (state.day ?? 1) + 1;
  state.campaign.attempts = attempt;
  state.campaign.attemptDay = state.day;
  // 每打一场都累，打赢的累得少一点。
  fatigueAll(state, Math.round((chapter.isBoss ? 22 : 12) * fatigueMul(state)));

  let loot = { materials: [], blade: null, fruit: null, notes: [] };
  let joined = [];
  let training = 0;
  let story = { poneglyph: null, merry: false, voidUnlocked: false, notes: [] };
  if (fight.cleared) {
    state.campaign.done = Math.min(TOTAL_CHAPTERS, (state.campaign.done ?? 0) + 1);
    state.campaign.attempts = 0;
    if (chapter.kind === 'b') state.campaign.bosses = (state.campaign.bosses ?? 0) + 1;
    loot = dropLoot(state, chapter, mulberry32(hashString(`${state.seed}:loot:${chapter.no}`) >>> 0), true);
    joined = joinCrew(state);
    training = chapter.isBoss ? 3 : 1;
    state.training = (state.training ?? 0) + training;
    // 历史正文、梅丽号这类不可逆的事，在「这一章过了」之后立刻发生。
    story = storyOnClear(state, chapter);
    // 打完了，人也缓一点
    fatigueAll(state, -6);
    // 船开往下一个岛，这段路要真的走（见 campaign.sailDelayMin）。
    const delay = sailDelayMin(chapter);
    state.campaign.sailUntil = new Date(Date.now() + delay * 60_000).toISOString();
    fight.sailDelay = delay;
  }
  if (captured) {
    state.blockedUntil = new Date(Date.now() + 3 * 3_600_000).toISOString();
  }
  state.nextBonus = null;
  // 船跟着剧情换档：存档里那个 tier 要跟得上，不然存下来的是一份假数据。
  if (state.ship) state.ship.tier = shipTierOf(state);
  // 被派上岸的人按「推了几章 / 过了几天」结算回来。
  const back = tickDispatch(state);

  return {
    ...fight,
    captured,
    rewards: { ...rewards, berries: berryGain, bounty: captured ? 0 : bountyGain },
    hullDelta,
    levels: level.levels,
    loot,
    joined,
    training,
    story,
    dispatchBack: back,
    text: factLine(state, chapter, fight, { berryGain, captured }),
  };
}

// ── 隐藏章：空白的一百年 ────────────────────────────────────────────────

/**
 * 四块历史正文凑齐之后才开的一战。不进主线进度，输了不掉任何东西，
 * 只是今天白过了。赢了给的钱和赏金都是「到这儿为止最多的一次」。
 */
export function resolveVoid(state) {
  const story = { ...storyDefaults(), ...(state.story ?? {}) };
  if (!story.voidUnlocked) return { ok: false, message: `历史正文只有 ${story.poneglyphs.length}/4 块，那一页还翻不开。` };
  if (story.voidDone) return { ok: false, message: '这一页已经读完了。' };

  const chapter = voidChapter();
  const attempt = (story.voidTries ?? 0) + 1;
  // 隐藏章不吃「反复硬打会变难」那一套：它是挑战，不是墙。
  const fight = fightBoss(state, chapter, { attempts: 0, roll: chapterRng(state, chapter, attempt) });
  const c = state.captain;
  const berryGain = fight.cleared ? 500_000_000 : 0;
  const bountyGain = fight.cleared ? Math.round(c.bounty * 0.5 / 1e5) * 1e5 : 0;

  c.berries = Math.max(0, c.berries + berryGain);
  c.bounty = Math.max(0, c.bounty + bountyGain);
  c.hull = clamp(c.hull + Math.round((fight.cleared ? -8 : -30) * damageMul(state)), 0, 100);
  state.day = (state.day ?? 1) + 1;
  state.story = { ...story, voidTries: attempt, voidDone: fight.cleared || story.voidDone };
  if (fight.cleared) {
    state.training = (state.training ?? 0) + 10;
    c.crime = '知晓真相的人';
    c.renown = (c.renown ?? 0) + 10;
  } else {
    fatigueAll(state, 25);
  }

  return {
    ok: true,
    cleared: fight.cleared,
    chapter,
    rounds: fight.rounds,
    wins: fight.wins,
    outcome: fight.outcome,
    outcomeLabel: fight.outcomeLabel,
    power: fight.power,
    foe: fight.foe,
    ratio: fight.ratio,
    rewards: { berries: berryGain, bounty: bountyGain, training: fight.cleared ? 10 : 0 },
    message: fight.cleared
      ? `三回合打完，${fight.wins} 胜。那一百年终于有人读完了：贝利 +5 亿，赏金 +50%。`
      : `只赢了 ${fight.wins} 回合。这一页还翻不开——什么都没丢，可以再来。`,
  };
}

/** 给模型的一句话事实，控制在 60 字以内。 */
export function factLine(state, chapter, fight, extra = {}) {
  const arc = `${chapter.arcName} ${chapter.index + 1}/${ARCS[chapter.arcIndex].chapters.length}`;
  const head = fight.cleared ? `过了「${chapter.title}」` : `卡在「${chapter.title}」`;
  const money = extra.berryGain > 0 ? `，贝利 +${Math.round(extra.berryGain / 10000)} 万` : '';
  return `${arc} · ${head}（${fight.outcomeLabel}）${money}，赏金 ${Math.round(state.captain.bounty / 1e4) / 100} 亿`;
}

/** 「还差多少战力」的一句话，面板和回执都用。 */
export function gapLine(state) {
  const chapter = chapterAt(state.campaign?.done ?? 0);
  const need = chapterPowerOf(chapter, campaignAttempts(state));
  const mine = powerOf(state);
  const ratio = mine / Math.max(1, need);
  return {
    mine, need, ratio,
    label: ratio >= 1.35 ? '碾压' : ratio >= 1.05 ? '打得过' : ratio >= 0.95 ? '有点悬' : '打不过',
  };
}
