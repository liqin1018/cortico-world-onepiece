/**
 * 海贼王大冒险 · 一期（单机）。
 *
 * 一期只做一件事：让每天有一次「出海—回来—带事实」的循环。
 * 不联网、不找别的桌宠、不聊天，也没有服务器——所有结算都在本机按规则算。
 * 二期才接全球榜；一期的存档结构留好了位置（captain / npcs / log）。
 */
import { renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TOOL_SPECS, TOOL_SUMMARIES, EVENT_DESCRIPTIONS } from './tools.js';
import { themeOf, THEME_IDS } from './theme/index.js';
import {
  buildRoutes, startVoyage, settleVoyage, formatBounty, formatMoney, bountyLabel,
  titleOf, nextTitle, rankOf, sortedBoard, statusLine, npcInit, localDayKey,
} from './sea.js';
import {
  chapterAt, TOTAL_CHAPTERS, ARCS, progressOf, shipOf, expFromFreeSail,
  grantExp, expNeed, chapterPowerOf, FREE_SAIL_DAY,
} from './campaign.js';
import {
  resolveChapter, resolveVoid, choiceFor, applyChoice, gapLine, freeSailLoot, fatigueAll,
} from './battle.js';
import {
  powerOf, powerParts, equippedBlades, crewCap, voyageTimeMul, repairCostMul,
  berryMul, damageMul, fatigueMul, partsOf, shipBonus, activeCrew, activeBonds,
  bossRoundBonus, crewEffect, shipTierOf, levelForPower,
} from './collect.js';
import { CREW, crewById, CREW_ROLES, EFFECT_LABEL } from './crew.js';
import { SHIP_PARTS, partById, partCost } from './ship.js';
import {
  BLADES, bladeById, FRUITS, fruitById, HAKI, hakiCost, MATERIALS, MATERIAL_BY_ID,
} from './gear.js';
import { codexOf, claimCodex, codexLine } from './codex.js';
import { bondRows } from './bonds.js';
import {
  DISPATCH_TASKS, DISPATCH_MAX, DISPATCH_KEEP, DISPATCH_CHAPTERS,
  taskOfRole, dispatchReward, rewardText, tickDispatch, dueAt,
} from './dispatch.js';
import { storyPayload, MERRY_EVENT, PONEGLYPHS } from './story.js';
import { hashString } from './rng.js';
import { weatherOf } from './weather.js';
import { loadState, saveState, statePath, createState, DEFAULT_NPC_COUNT } from './state.js';

const ENV_PROMPT_FILE = fileURLToPath(new URL('./prompt/ENV_PROMPT.md', import.meta.url));
const PANEL_ID = 'sea';
const TICK_MS = 30_000;
const CATCHUP_MAX = 8;
const uid = 'onepiece';

/**
 * 授权表：动作 → 配置键 → 默认值 → 中文名。
 *
 * 只列「面板上能点、但工具够不到」的那几件。推章、自由航海、开关挂机
 * 本来就是她的，不在这里。吃果实是唯一默认关的——一辈子一颗，不可逆，
 * 这件事必须留在主人手里。
 */
const PERM = {
  repair: { cfg: 'allowRepair', on: true, label: '修船' },
  rest: { cfg: 'allowRest', on: true, label: '歇一晚' },
  upgrade: { cfg: 'allowUpgrade', on: true, label: '改装' },
  blade: { cfg: 'allowBlade', on: true, label: '买刀' },
  fruit: { cfg: 'allowFruit', on: false, label: '吃果实' },
  haki: { cfg: 'allowHaki', on: true, label: '练霸气' },
  dispatch: { cfg: 'allowDispatch', on: true, label: '派人上岸' },
};

/** 一天最多自己买一把刀、升两次改装，免得把家底一口气花光。 */
const GROW_DAY = { blade: 1, upgrade: 2 };

const clampInt = (value, min, max, fallback) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const CONFIG_GROUP = {
  id: `world:${uid}`,
  owner: `world:${uid}`,
  schema: {
    type: 'object',
    title: '海贼王大冒险',
    description: '剧情模式：三部 30 篇 119 章，她按篇章往前打；打不过就先自由航海练级。'
      + '这里调：用哪套名词、多久自己走一次、一天几次、什么时候开口、榜上有多少人、'
      + '哪几件事允许她自己动手。改完下一次行动就生效，不用重启。',
    properties: {
      [`worlds.${uid}.theme`]: {
        type: 'string',
        title: '用哪套名词',
        'x-options': 'theme',
        'x-hot': true,
        description: '海贼王大冒险是原版；无风带是换过皮的原创版本，规则和数值完全一样。'
          + '打算把扩展公开发布时，建议用后者——专有名词属于原作，公开传播有风险。',
      },
      [`worlds.${uid}.voyageMinutes`]: {
        type: 'number',
        title: '一趟出海多久',
        minimum: 1,
        maximum: 240,
        'x-suffix': '分钟',
        'x-hot': true,
        description: '默认 90。想马上看一轮完整循环，先填 1，一分钟就回来；看完记得调回去，'
          + '太短的话「她出海了」这件事就没有分量了。',
      },
      [`worlds.${uid}.difficulty`]: {
        type: 'string',
        title: '海域有多凶',
        'x-options': 'difficulty',
        'x-hot': true,
        description: '平静：风险整体低一档，适合刚开局；普通：原始概率；'
          + '凶险：更容易被俘，但成功时的赏金也更高。',
      },
      [`worlds.${uid}.npcCount`]: {
        type: 'integer',
        title: '榜上最多多少人',
        minimum: 4,
        maximum: 60,
        'x-suffix': '个',
        'x-hot': false,
        description: '默认 60，也就是名单全上。调小会按赏金从高到低均匀抽，'
          + '顶上那几个和垫底那几个都还在，只是中间少一些人。'
          + '改完到排行榜页点「重排榜单」当场生效，不用重开档。',
      },
      [`worlds.${uid}.auto`]: {
        type: 'boolean',
        title: '她自己去冒险',
        'x-hot': true,
        description: '打开之后到点她自己挑下一步：打得过就推剧情，打不过就先练级。'
          + '关掉就完全手动，只能你点。',
      },
      [`worlds.${uid}.autoMinutes`]: {
        type: 'integer',
        title: '多久走一次',
        minimum: 5,
        maximum: 720,
        'x-suffix': '分钟',
        'x-hot': false,
        description: '默认 30。挂机按这个节奏推进；一天的上限用完就停到第二天。',
      },
      [`worlds.${uid}.autoDailyCap`]: {
        type: 'integer',
        title: '一天最多几次',
        minimum: 1,
        maximum: 24,
        'x-suffix': '次',
        'x-hot': false,
        description: '默认 6。119 章按这个速度大约二十天走完；调太大剧情会变回刷数字。',
      },
      [`worlds.${uid}.notify`]: {
        type: 'string',
        title: '什么时候叫她说话',
        'x-options': 'notify',
        'x-hot': true,
        description: '静默模式只写日志、不花 token；要紧的事只在新篇章、BOSS、升级、被俘时开口。',
      },
      [`worlds.${uid}.portrait`]: {
        type: 'string',
        title: '悬赏令上画不画脸',
        'x-options': 'portrait',
        'x-hot': false,
        description: '默认「不画」——一张干净的通缉令，只有名字和金额。'
          + '想要一张脸可以切「剪影」，那是深色版画风，不保证像谁。',
      },
      // ── 授权：这几件事她自己能不能做 ───────────────────────────────
      // 面板上的按钮她够不到，只能等你去点。下面七个开关就是授权书：
      // 打勾的会进 sea_do 工具，她自己也能办；没打勾的，她会回一句
      // 「主人没让我动这个」，然后把面板指给你。
      [`worlds.${uid}.allowRepair`]: {
        type: 'boolean',
        title: '让她自己修船',
        'x-hot': true,
        description: '船体掉到六成以下、钱够，她自己会去修，不用等你点。'
          + '默认开——不修会沉，这条最不该等人。',
      },
      [`worlds.${uid}.allowRest`]: {
        type: 'boolean',
        title: '让她自己歇一晚',
        'x-hot': false,
        description: '全员疲劳过八成、钱够，她会自己掏钱睡一觉再出海，'
          + '顺便把当天的派遣回执收回来。默认开。',
      },
      [`worlds.${uid}.allowUpgrade`]: {
        type: 'boolean',
        title: '让她自己改装船',
        'x-hot': true,
        description: '钱和材料都够的时候，她会挑最便宜的那件升一级，一天最多两次。'
          + '默认开：改装是慢慢攒出来的，攒着不动等于没有。',
      },
      [`worlds.${uid}.allowBlade`]: {
        type: 'boolean',
        title: '让她自己买刀',
        'x-hot': true,
        description: '只买店里现成在卖的、而且不超过她手上六成现钱的刀，一天最多一把。'
          + 'BOSS 身上掉的、拍卖行那几把不碰。默认开。',
      },
      [`worlds.${uid}.allowHaki`]: {
        type: 'boolean',
        title: '让她自己练霸气',
        'x-hot': false,
        description: '修行点够了就往上点一级。不花贝利，只花修行点。默认开。',
      },
      [`worlds.${uid}.allowDispatch`]: {
        type: 'boolean',
        title: '让她自己派人上岸',
        'x-hot': false,
        description: '船上有闲人、木头或铁见底的时候，她派一个人去收材料。'
          + '默认开：这一趟不花钱，只是那人几章之内不算战力。',
      },
      [`worlds.${uid}.allowFruit`]: {
        type: 'boolean',
        title: '让她自己吃果实',
        'x-hot': true,
        description: '默认**关**。一个人一辈子只能吃一颗，吃错了换不回来——'
          + '这一件事留给你自己决定，她只会在旁边问「这颗要不要吃」。',
      },
    },
  },
};

export class SeaWorld {
  constructor(ctx) {
    // 框架按实例 id 归属工具与事件，必须等于定义的 id，否则挂载时直接判加载失败。
    this.id = uid;
    this.ctx = ctx;
    this.file = statePath(ctx.dataDir);
    this.state = null;
    this.host = null;
    this.timer = null;
    this.busy = false;
  }

  get theme() {
    return themeOf(this.ctx.cfg?.theme);
  }

  ensure() {
    if (!this.state) {
      this.state = loadState(this.file, {
        botName: this.ctx.botName,
        themeId: this.ctx.cfg?.theme,
        npcCount: this.ctx.cfg?.npcCount,
      });
    }
    return this.state;
  }

  save() {
    try {
      saveState(this.file, this.state);
    } catch (error) {
      this.host?.log?.warn?.(`onepiece: 存档没写下去：${error?.message ?? error}`);
    }
  }

  /**
   * 主人允许她做这件事吗？
   * 配置里没写就按默认值——老配置文件不会因为多了几个键就整块失效。
   */
  allowed(key) {
    const def = PERM[key];
    if (!def) return false;
    const v = this.ctx.cfg?.[def.cfg];
    return typeof v === 'boolean' ? v : def.on;
  }

  /** 今天自己动手的计数。日子翻篇就归零，不用迁移老档。 */
  permDay(s = this.ensure()) {
    if (!s.perm || s.perm.day !== s.day) s.perm = { day: s.day, blade: 0, upgrade: 0 };
    return s.perm;
  }

  /** 「主人没让我动这个」——回绝也要把话说圆，别让她以为是自己做错了。 */
  denied(key) {
    const def = PERM[key];
    return {
      ok: false,
      denied: true,
      message: `这件事主人还没让我自己动（「${def.label}」）。`
        + '要我去做的话，去设置里把那个开关打开；现在得你在面板上点。',
    };
  }

  async start(host) {
    this.host = host;
    this.ensure();
    this.save();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => { void this.tick(); }, TICK_MS);
    this.timer.unref?.();
    await this.tick();
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.host = null;
  }

  /** 每半分钟看一眼：船靠岸了没有、押送船到了没有、自动冒险到点了没有。 */
  async tick() {
    if (this.busy || !this.state) return;
    const now = Date.now();
    this.busy = true;
    try {
      if (this.state.voyage && Date.parse(this.state.voyage.endsAt) <= now) {
        await this.settle(now);
      } else if (this.state.blockedUntil && Date.parse(this.state.blockedUntil) <= now) {
        this.state.blockedUntil = null;
        this.save();
        await this.push({
          type: 'onepiece.voyage',
          text: '（你从押送船上跑回来了。船还在，人也在，赏金没动。歇一会儿就能再出海。）',
        });
      }
      await this.autoRun(now);
    } finally {
      this.busy = false;
    }
  }

  async settle(now) {
    const theme = themeOf(this.state.voyage?.themeId ?? this.ctx.cfg?.theme);
    const seed = `${this.state.seed}:${this.state.day}:${this.state.voyage?.routeId}:${now}`;
    let result;
    try {
      result = settleVoyage(this.state, theme, now, seed);
    } catch (error) {
      this.host?.log?.warn?.(`onepiece: 结算失败：${error?.message ?? error}`);
      return;
    }
    this.save();
    await this.push({ type: 'onepiece.voyage', text: result.eventText, meta: { day: result.entry.day } });
    if (result.milestone) {
      const c = this.state.captain;
      await this.push({
        type: 'onepiece.milestone',
        text: `（海军本部换了新的悬赏令：${c.epithet}「${c.name}」 · ${c.crime} · `
          + `${formatBounty(c.bounty)} · ${result.milestone.title}。想说什么由你，不用念金额。）`,
        meta: { milestone: result.milestone.at },
      });
    }
  }

  async push(event) {
    try {
      await this.host?.pushEvent({ origin: 'internal', ...event });
    } catch (error) {
      this.host?.log?.warn?.(`onepiece: 事件没推出去：${error?.message ?? error}`);
    }
  }

  // ── 剧情：一章一章往前推 ──────────────────────────────────────────────

  /** 一行状态：天、等级、同伴、篇章位置、赏金、名次、船。 */
  headLine(s = this.ensure(), now = Date.now()) {
    const p = progressOf(s);
    const where = p.completed ? '拉夫德鲁' : `${p.arcName} ${p.chapterNo}/${p.chapterCount}`;
    const crew = (s.crew ?? []).length;
    return statusLine(s, this.theme, now, [
      `Lv${s.level.value}`, crew ? `同伴 ${crew}` : '单人', where, this.weather(now).name,
    ]);
  }

  /**
   * 今天的海况。按「种子 + 现实日期」算，同一天固定——
   * 读档、关掉再打开、甚至重开一档（种子会变）都不会靠刷新重摇。
   * 只影响自由航海，主线章节不看它。
   */
  weather(now = Date.now()) {
    const s = this.ensure();
    return weatherOf(s.seed, localDayKey(now));
  }

  /** 打一章，写日志、存盘。不推事件——推不推由调用方决定。 */
  applyChapter(choiceIndex = null) {
    const s = this.ensure();
    const beforeLevel = s.level.value;
    // 有抉择就先把它落下去：不落，这一章不该开打。
    const chosen = choiceIndex == null ? null : applyChoice(s, choiceIndex);
    const res = resolveChapter(s);
    const ch = res.chapter;
    const storyNotes = res.story?.notes ?? [];
    s.log.unshift({
      day: s.day,
      island: ch.island,
      kind: ch.isBoss ? 'BOSS' : ch.kindLabel,
      chapterTitle: ch.isBoss ? `${ch.title} · BOSS` : ch.title,
      outcome: res.outcome,
      outcomeLabel: res.outcomeLabel,
      scene: storyNotes.join('；'),
      bountyTo: s.captain.bounty,
      chapter: ch.no,
      choice: chosen?.option?.label ?? null,
      story: storyNotes,
    });
    s.log = s.log.slice(0, 40);
    const codex = claimCodex(s, this.theme).gained;
    this.save();
    return {
      ...res,
      chosen,
      codex,
      leveled: s.level.value > beforeLevel,
      level: s.level.value,
    };
  }

  /** 跑一趟自由航海：不安时间，立刻结算，用来练级和刷钱。 */
  applyFreeSail(index = 1) {
    const s = this.ensure();
    const theme = this.theme;
    const routes = buildRoutes(s, theme, this.ctx.cfg?.difficulty);
    const route = routes.find((r) => r.index === Number(index) || r.id === String(index)) ?? routes[0];
    const now = Date.now();
    const weather = this.weather(now);
    const minutes = Math.max(1, Math.round(route.minutes * voyageTimeMul(s) * weather.sail));
    s.voyage = startVoyage(s, route, now, { ...(this.ctx.cfg ?? {}), voyageMinutes: 1 }, theme);
    // 天气只改这一趟的险和收益，不动 route 本身。
    s.voyage.risk = Math.min(5, Math.max(1, route.risk + weather.risk));
    const res = settleVoyage(s, theme, now, `${s.seed}:${s.day}:${route.id}:${now}`, {
      damageMul: damageMul(s) * weather.damage,
      berryMul: berryMul(s) * weather.berry,
    });
    const gained = grantExp(s, expFromFreeSail(s));
    const loot = freeSailLoot(s, route);
    s.training = (s.training ?? 0) + 1;
    fatigueAll(s, Math.round(14 * fatigueMul(s)));
    // 派遣是按章算的，但卡住的人也可能靠天数把人等回来。
    const dispatchBack = tickDispatch(s);
    const codex = claimCodex(s, theme).gained;
    this.save();
    return {
      kind: 'free', ...res, minutes, loot, codex, dispatchBack,
      leveled: gained.levels > 0, level: s.level.value,
      training: s.training,
    };
  }

  autoConfig() {
    const cfg = this.ctx.cfg ?? {};
    const s = this.state;
    return {
      enabled: cfg.auto !== false && !s?.auto?.paused,
      paused: Boolean(s?.auto?.paused),
      minutes: clampInt(cfg.autoMinutes, 5, 720, 30),
      dailyCap: clampInt(cfg.autoDailyCap, 1, 24, 6),
      notify: ['important', 'always', 'silent'].includes(cfg.notify) ? cfg.notify : 'important',
    };
  }

  /** 自动冒险的当前状态：到点了没有、今天还剩几次。 */
  autoStatus(now = Date.now()) {
    const s = this.ensure();
    const cfg = this.autoConfig();
    const day = localDayKey(now);
    if (s.auto.day !== day) {
      s.auto.day = day;
      s.auto.runs = 0;
    }
    const last = s.auto.lastRunAt ? Date.parse(s.auto.lastRunAt) : now;
    const interval = cfg.minutes * 60_000;
    const left = Math.max(0, cfg.dailyCap - s.auto.runs);
    const nextAt = last + interval;
    return {
      ...cfg,
      runs: s.auto.runs,
      left,
      nextInMs: Math.max(0, nextAt - now),
      due: cfg.enabled && left > 0 && now >= nextAt && !this.state.voyage,
    };
  }

  /** 她自己在两三个都说得通的选项里挑一个：按种子定，不掷骰子，重开也不会变。 */
  autoChoiceIndex(s = this.ensure()) {
    const choice = choiceFor(s);
    if (!choice) return null;
    return (hashString(`${s.seed}:${choice.key}`) >>> 0) % choice.options.length;
  }

  /**
   * 自动模式下走一步：打得过就打下一章，打不过就先自由航海练级。
   * 这里只改 state，不推事件——推送统一由 autoRun 汇总，免得一晚上弹十条。
   */
  stepAuto() {
    const s = this.ensure();
    const now = Date.now();
    if (s.blockedUntil && Date.parse(s.blockedUntil) > now) return { kind: 'blocked' };
    // 船要散了这条线不看授权：先问一句，别默默沉在港口。
    if (s.captain.hull <= 0) {
      if (!this.allowed('repair')) return { kind: 'stuck', reason: '船要散了，可你没让我自己修' };
      const fixed = this.repair(true);
      if (!fixed.ok) return { kind: 'stuck', reason: '船要散了，又没钱修' };
    }
    // 半沉的船别硬开出去，顺手补一下——这一步不推章，只修船。
    if (this.allowed('repair') && s.captain.hull < 45 && s.captain.berries >= this.repairCost(s)) {
      const fixed = this.repair(true);
      if (fixed.ok) return { kind: 'repair', ...fixed };
    }
    // 人都累趴了就先歇一晚，硬撑着出海只会输。
    if (this.allowed('rest') && this.fatigueOf(s) > 78 && s.captain.berries > this.restCost(s)) {
      const rested = this.rest(true);
      if (rested.ok) return { kind: 'rest', ...rested };
    }
    const p = progressOf(s);
    const gap = gapLine(s);
    // 有余力、材料见底、还没派人：那就派一个。她缺木头的时候不会硬打。
    const sent = this.autoDispatch(s, gap);
    if (sent) return sent;
    // 打不过：先花一步把能补的补上（改装 / 买刀 / 练霸气），补不动才去练级。
    if (!p.completed && gap.ratio < 0.92) {
      const grew = this.autoGrow(s);
      if (grew) return { kind: 'grow', ...grew };
    }
    if (!p.completed && gap.ratio >= 0.98) {
      const res = this.applyChapter(this.autoChoiceIndex(s));
      // kind 必须最后写：res 里带着 'single' / 'boss'，展开会把它盖掉。
      return { ...res, fightKind: res.kind, kind: 'chapter' };
    }
    return this.applyFreeSail(1);
  }

  /**
   * 打不过的时候先花一步变强：改装 → 买刀 → 练霸气。
   * 一次只做一件，做完交回 stepAuto，下一轮再看还差多少。
   * 三样都做不了就返回 null，让她老老实实去自由航海练级。
   */
  autoGrow(s = this.ensure()) {
    for (const key of ['upgrade', 'blade', 'haki']) {
      if (!this.allowed(key)) continue;
      const out = this.doAction(key);
      if (out.ok) return out;
    }
    return null;
  }

  /**
   * 自动派一个人上岸：只在「打得过下一章、材料见底、船上还有闲人」的时候。
   * 这不是聪明，只是不让她在木头是 0 的时候还硬推主线。
   */
  autoDispatch(s, gap) {
    if (!this.allowed('dispatch')) return null;
    if (this.awayCount(s) >= 1) return null;
    if ((s.crew ?? []).length - this.awayCount(s) <= DISPATCH_KEEP + 1) return null;
    if (gap.ratio < 1.15) return null;
    const lowWood = (s.materials?.wood ?? 0) < 5;
    const lowIron = (s.materials?.iron ?? 0) < 5;
    if (!lowWood && !lowIron) return null;
    const member = this.bestDispatch(s);
    if (!member) return null;
    const out = this.sendOut(member.id);
    return out.ok ? { kind: 'dispatch', ...out } : null;
  }

  /** 到点就跑，最多补 CATCHUP_MAX 次；多出来的算错过，不掉东西。 */
  async autoRun(now = Date.now()) {
    const s = this.ensure();
    const st = this.autoStatus(now);
    if (!st.enabled || s.voyage) return null;
    if (s.blockedUntil && Date.parse(s.blockedUntil) > now) return null;
    if (!s.auto.lastRunAt) {
      s.auto.lastRunAt = new Date(now).toISOString();
      this.save();
      return null;
    }
    const interval = st.minutes * 60_000;
    const due = Math.floor((now - Date.parse(s.auto.lastRunAt)) / interval);
    if (due < 1) return null;

    const runs = Math.min(due, st.left, CATCHUP_MAX);
    const results = [];
    let cursor = Date.parse(s.auto.lastRunAt);
    for (let i = 0; i < runs; i++) {
      const out = this.stepAuto();
      results.push(out);
      cursor += interval;
      s.auto.runs += 1;
      s.auto.lastRunAt = new Date(cursor).toISOString();
      const jailed = s.blockedUntil && Date.parse(s.blockedUntil) > Date.now();
      if (out.kind === 'blocked' || out.kind === 'stuck' || jailed) break;
    }
    // 一次补不完就把时钟拨到现在，别让它一直追着补。
    if (due > runs) s.auto.lastRunAt = new Date(now).toISOString();
    this.save();
    await this.pushAuto(results);
    return results;
  }

  async pushAuto(results) {
    const st = this.autoConfig();
    if (st.notify === 'silent' || !results.length) return;
    const chapters = results.filter((r) => r.kind === 'chapter');
    const notable = chapters.length > 0
      || results.some((r) => r.leveled)
      || results.some((r) => r.outcome === 'captured');
    if (st.notify === 'important' && !notable) return;

    const parts = [];
    for (const r of results) {
      if (r.kind === 'chapter') {
        const tag = r.fightKind === 'boss' && r.rounds?.length
          ? `（${r.rounds.map((x) => (x.won ? '赢' : '输')).join('')}）`
          : '';
        parts.push(`${r.cleared ? '过了' : '卡在'}「${r.chapter.title}」${tag}`);
      } else if (r.kind === 'free') parts.push(`自己去跑了一趟${r.entry.island}`);
      else if (r.kind === 'rest') parts.push('在港里歇了一晚');
      else if (r.kind === 'blocked') parts.push('还被押在船上');
    }
    const s = this.state;
    const p = progressOf(s);
    const where = p.completed ? '已经到拉夫德鲁' : `现在在「${p.arcName}」第 ${p.chapterNo}/${p.chapterCount} 章`;
    await this.push({
      type: 'onepiece.voyage',
      text: `（你不在的这段时间，她自己走了 ${results.length} 趟：${parts.join('；')}。${where}，`
        + `Lv${s.level.value}，赏金 ${bountyLabel(s.captain.bounty)}，图鉴 ${Math.round(codexOf(s, this.theme).percent * 100)}%。`
        + '用你自己的口气说，不用逐条念。）',
    });
  }

  // ── 航程 ────────────────────────────────────────────────────────────────

  /** 船还在海上吗？返回剩余毫秒。过期的记录顺手清掉。 */
  sailWaitLeft(s = this.ensure(), now = Date.now()) {
    const until = s.campaign?.sailUntil;
    if (!until) return 0;
    const left = Date.parse(until) - now;
    if (left <= 0) {
      s.campaign.sailUntil = null;
      return 0;
    }
    return left;
  }

  /** 开快点要多少钱：大约一章收入的一倍半，越往后越贵。 */
  rushCost(s = this.ensure()) {
    const done = s.campaign?.done ?? 0;
    const ch = chapterAt(Math.max(0, Math.min(TOTAL_CHAPTERS - 1, done - 1)));
    return Math.max(10_000, Math.round((ch.power * 6000) / 1e4) * 1e4);
  }

  rushSail() {
    const s = this.ensure();
    const left = this.sailWaitLeft(s);
    if (left <= 0) return { ok: false, message: '船已经靠岸了，不用再花钱。' };
    const cost = this.rushCost(s);
    if (s.captain.berries < cost) {
      return { ok: false, message: `开快点要 ${formatMoney(cost)}，现在拿不出。` };
    }
    s.captain.berries -= cost;
    s.campaign.sailUntil = null;
    this.save();
    return { ok: true, message: `塞了 ${formatMoney(cost)} 给船工，帆吃满了风。` };
  }

  /** 今天还能跑几趟自由航海。 */
  sailFreeLeft(s = this.ensure()) {
    const today = localDayKey(Date.now());
    const used = s.freeSail?.day === today ? (s.freeSail.count ?? 0) : 0;
    return Math.max(0, FREE_SAIL_DAY - used);
  }

  /** 面板上的「跑一趟」：一天最多六趟，超了就得等明天。 */
  freeSailNow(index = 1) {
    const s = this.ensure();
    const now = Date.now();
    // 押送中出不了海——这条 sailChapter 一直守着，这里以前漏了。
    if (s.blockedUntil && Date.parse(s.blockedUntil) > now) {
      const mins = Math.max(1, Math.ceil((Date.parse(s.blockedUntil) - now) / 60_000));
      return { ok: false, message: `还出不了海：你在押送船上，约 ${mins} 分钟后靠岸。` };
    }
    // 已经有一条船在海上（工具派出去的那种），直接再跑会把它顶掉、白等一场。
    if (s.voyage) {
      return { ok: false, message: `已经有一条船在海上（${s.voyage.islandName}），先等它回来再跑。` };
    }
    const today = localDayKey(now);
    if (s.freeSail?.day !== today) s.freeSail = { day: today, count: 0 };
    if (s.freeSail.count >= FREE_SAIL_DAY) {
      return { ok: false, message: `今天已经跑了 ${FREE_SAIL_DAY} 趟，明天再出海。` };
    }
    s.freeSail.count += 1;
    const out = this.applyFreeSail(index);
    this.save();
    const text = out?.eventText ?? '回来了。';
    return {
      ok: true,
      ...out,
      message: `${text}（今天还剩 ${Math.max(0, FREE_SAIL_DAY - s.freeSail.count)} 趟）`,
    };
  }

  /** 手动推一章。卡着抉择的时候先不推进，把选项摆出来。 */
  sailChapter(choiceIndex = null) {
    const s = this.ensure();
    const now = Date.now();
    if (s.blockedUntil && Date.parse(s.blockedUntil) > now) {
      const mins = Math.max(1, Math.ceil((Date.parse(s.blockedUntil) - now) / 60_000));
      return { ok: false, message: `还动不了：你在押送船上，约 ${mins} 分钟后靠岸。` };
    }
    // 航程是真实时间。只有模拟脚本（cfg.sim，非玩家配置）才跳过——
    // 这个标记不出现在设置里，玩家碰不到，也就不存在「为了省一次等待
    // 顺手把整条节奏关掉」这种事了。
    const wait = this.ctx.cfg?.sim ? 0 : this.sailWaitLeft(s, now);
    if (wait > 0) {
      const mins = Math.max(1, Math.ceil(wait / 60_000));
      return {
        ok: false,
        needWait: true,
        remainMs: wait,
        message: `船还在往下一个岛开，约 ${mins} 分钟后到。等不及就花 ${formatMoney(this.rushCost(s))} 开快点。`,
      };
    }
    const p = progressOf(s);
    if (p.completed) {
      return { ok: false, message: '全篇已经走完了：拉夫德鲁。想继续就用自由航海刷赏金，或者重开一档。' };
    }
    if (s.captain.hull <= 0) {
      const fixed = this.repair(true);
      if (!fixed.ok) return { ok: false, message: '船体是 0，先把船修好才能出海。' };
    }
    const pending = choiceFor(s);
    if (pending && choiceIndex == null) {
      const lines = [`「${pending.title}」`, pending.prompt, ...pending.options.map((o, i) => `${i + 1}. ${o.label}（${o.hint}）`)];
      return {
        ok: false,
        needChoice: true,
        choice: {
          key: pending.key, kind: pending.kind, title: pending.title, prompt: pending.prompt,
          options: pending.options.map((o, i) => ({ index: i + 1, label: o.label, hint: o.hint })),
        },
        message: `${lines.filter(Boolean).join('\n')}\n要先拿主意：带 choice 填 1、2 或 3 再打。`,
      };
    }
    const res = this.applyChapter(choiceIndex == null ? null : Math.max(0, Number(choiceIndex) - 1));
    const ch = res.chapter;
    const lines = [
      `${p.arcName} ${p.chapterNo}/${p.chapterCount}「${ch.title}」：${res.outcomeLabel}。`,
    ];
    if (res.chosen) lines.push(`你选了「${res.chosen.option.label}」。`);
    if (res.kind === 'boss') {
      lines.push(res.rounds.map((r) => `${r.label} ${r.won ? '赢' : '输'}（${Math.round(r.margin * 100)} vs ${Math.round(r.need * 100)}）`).join(' · '));
      lines.push(res.cleared ? '赢了两回合，BOSS 过了。' : `只赢了 ${res.wins} 回合，BOSS 没过去。`);
    } else {
      lines.push(res.cleared
        ? `过了这一章，战力 ${res.power} / 难度 ${res.foe}。`
        : `没过。战力 ${res.power} / 难度 ${res.foe}，先去练练级再来。`);
    }
    lines.push(`经验 +${res.rewards.exp}${res.leveled ? `，升到 Lv${res.level}` : ''}；`
      + `贝利 ${res.rewards.berries >= 0 ? '+' : '-'}${formatMoney(Math.abs(res.rewards.berries))}。`);
    if (res.loot?.blade) lines.push(`BOSS 掉了一把刀：「${res.loot.blade.name}」（${res.loot.blade.grade}）。`);
    if (res.loot?.fruit) lines.push(`还捡到一颗${res.loot.fruit.name}。`);
    if (res.joined?.length) lines.push(`${res.joined.map((c) => c.short).join('、')}上船了。`);
    for (const note of res.story?.notes ?? []) lines.push(`${note}。`);
    if (res.story?.merry) lines.push(`${MERRY_EVENT.title}：${MERRY_EVENT.kicker}。这条船沉了，换乘阳光号。`);
    for (const back of res.dispatchBack ?? []) {
      lines.push(`${crewById(back.crewId)?.short ?? back.crewId}回来了，带回 ${back.got.join('、')}。`);
    }
    return { ok: true, message: lines.join('\n'), res };
  }

  async chapterAction(choiceIndex = null) {
    const out = this.sailChapter(choiceIndex);
    if (!out.ok) {
      if (out.needChoice) {
        await this.push({
          type: 'onepiece.milestone',
          text: `（前面有个岔口，用你的口气说出来两句就行，不用念选项。）\n${out.choice.prompt}`
            + `\n她正拿不定主意：${out.choice.options.map((o) => o.label).join(' / ')}。`,
        });
      }
      return out;
    }
    const r = out.res;
    const ch = r.chapter;
    const extra = [];
    if (r.kind === 'boss') {
      extra.push(`三回合：${r.rounds.map((x) => `${x.label}${x.won ? '赢' : '输'}`).join('、')}。`);
    }
    if (r.loot?.notes?.length) extra.push(`带回来：${r.loot.notes.join('、')}。`);
    if (r.joined?.length) extra.push(`${r.joined.map((c) => c.name).join('、')}上船了。`);
    await this.push({
      type: 'onepiece.voyage',
      text: `（剧情回执，不必逐字念。）\n${r.text}\n${r.chosen ? `她刚做的选择：${r.chosen.option.label}。` : ''}`
        + `${extra.join('')}${r.cleared ? '她过了这一章。' : '她没过，但什么都没丢，可以再来。'}用你自己的口气讲两句。`,
    });
    if (r.leveled) {
      await this.push({ type: 'onepiece.milestone', text: `（她升到 Lv${r.level} 了。不用报数字，说一句「好像变强了」之类就行。）` });
    }
    if (r.cleared && ch.isBoss) {
      await this.push({ type: 'onepiece.milestone', text: `（「${ch.arcName}」这一篇打完了，BOSS 是「${ch.boss}」。接下来是新的海域。）` });
    }
    if (r.story?.merry) {
      await this.push({
        type: 'onepiece.milestone',
        text: '（梅丽号沉了。那艘小船自己漂过来接人，然后停在海上，他们点了一把火。'
          + '现在换乘阳光号，船体修满。这件事她大概不会主动说——你可以在她安静的时候问一句。'
          + '不用复述上面这些细节，用你自己的口气。）',
      });
    }
    if (r.story?.poneglyph) {
      const stone = r.story.poneglyph;
      await this.push({
        type: 'onepiece.milestone',
        text: `（历史正文 +1：「${stone.name}」——${stone.where}。${stone.text}`
          + `现在 ${codexOf(this.state, this.theme).sections.find((x) => x.id === 'glyph')?.on ?? 0}/4 块。`
          + '她大概会想把它记下来。）',
      });
    }
    if (r.story?.voidUnlocked) {
      await this.push({
        type: 'onepiece.milestone',
        text: '（四块历史正文凑齐了。拉夫德鲁的海面上多了一条路——隐藏章「空白的一百年」开了。'
          + '她可以随时去读，输了不掉任何东西。）',
      });
    }
    if (r.dispatchBack?.length) {
      const backText = r.dispatchBack
        .map((b) => `${crewById(b.crewId)?.short ?? b.crewId}上岸回来了，带回 ${b.got.join('、')}`)
        .join('；');
      await this.push({
        type: 'onepiece.voyage',
        text: `（${backText}。顺口提一句就行，不用当成大事。）`,
      });
    }
    return out;
  }

  envPromptVars() {
    if (!this.state) return null;
    const theme = this.theme;
    return {
      'onepiece.theme': theme.sea,
      'onepiece.status': this.headLine(this.state),
    };
  }

  // ── 给模型的三只手 ──────────────────────────────────────────────────────

  statusText() {
    const s = this.ensure();
    const theme = this.theme;
    const now = Date.now();
    const p = progressOf(s);
    const head = this.headLine(s, now);
    const lines = [head];

    if (s.blockedUntil && Date.parse(s.blockedUntil) > now) {
      lines.push('你还在押送船上，靠岸之前动不了。');
    } else if (s.voyage) {
      const mins = Math.max(1, Math.ceil((Date.parse(s.voyage.endsAt) - now) / 60_000));
      lines.push(`你已经在海上：${s.voyage.kindLabel} · ${s.voyage.islandName}，约 ${mins} 分钟后回来。`);
    }

    if (p.completed) {
      lines.push('全篇走完了：拉夫德鲁。接下来只剩自由航海。');
    } else {
      const gap = gapLine(s);
      lines.push(`下一章：${p.arcName} ${p.chapterNo}/${p.chapterCount}「${p.chapterTitle}」（${p.kindLabel}）`
        + ` · 难度 ${gap.need}，你的战力 ${gap.mine}（${gap.label}）。`);
      if (p.isBoss) lines.push('这一章是 BOSS：打三个回合，赢两回合才算过。');
      const pending = choiceFor(s);
      if (pending) {
        lines.push(`先要拿主意「${pending.title}」：${pending.options.map((o, i) => `${i + 1}. ${o.label}`).join(' / ')}`);
        lines.push('定了以后 sea_sail 带 choice（1、2 或 3）再打；不带参数只会再问一次。');
      } else {
        lines.push('要推这一章就用 sea_sail，不用填参数。');
      }
    }

    const crew = s.crew ?? [];
    const crewText = crew.length ? crew.map((m) => crewById(m.id)?.short ?? m.id).join('、') : '还没有同伴';
    const partSum = SHIP_PARTS.reduce((n, part) => n + (s.ship?.parts?.[part.id] ?? 0), 0);
    lines.push(`船上：${crewText}（${crew.length} 人，疲劳 ${this.fatigueOf(s)}）· `
      + `${shipOf(s).name}（改装 ${partSum}/30）· 修行点 ${s.training ?? 0}`);
    const cx = codexOf(s, theme);
    lines.push(`收藏：名刀 ${(s.gears?.blades ?? []).length}/${BLADES.length} · `
      + `果实 ${[...(s.gears?.fruits ?? []), s.gears?.fruit].filter(Boolean).length}/${FRUITS.length} · `
      + `图鉴 ${Math.round(cx.percent * 100)}%（${cx.on}/${cx.total}）`);
    const story = storyPayload(s);
    const away = this.awayCount(s);
    lines.push(`历史正文 ${story.count}/${story.total}`
      + (story.voidDone ? ' · 隐藏章已读' : story.voidUnlocked ? ` · 隐藏章「${story.voidTitle}」开着（难度 ${story.voidPower}）` : '')
      + (away ? ` · ${away} 个人在岸上办事` : '')
      + (s.story?.pending ? ' · 有一件事等她收起来（面板上那张纸）' : ''));
    lines.push(this.permLine());

    const st = this.autoStatus(now);
    lines.push(st.enabled
      ? `自动冒险：开，每 ${st.minutes} 分钟一次，今天还剩 ${st.left} 次${st.due ? '，现在就该她动了' : ''}。`
      : '自动冒险：关，只能你点。');

    const routes = buildRoutes(s, theme, this.ctx.cfg?.difficulty);
    const routeLines = routes.map((r) => `${r.index}. ${r.kindLabel} · ${r.islandName} · 风险 ${r.risk}/5`);
    lines.push(`想自由航海（练级、刷钱）就带 route：\n${routeLines.join('\n')}`);
    return lines.join('\n');
  }

  /**
   * 一句「哪几件她够得着、哪几件得等主人点」。
   * 只在 sea_status 里出现，不进常驻提示词——它跟着配置变，写死会骗人。
   */
  permLine() {
    const can = [];
    const lock = [];
    for (const key of Object.keys(PERM)) {
      (this.allowed(key) ? can : lock).push(PERM[key].label);
    }
    if (!can.length) {
      return `这些事你都不能自己动（${lock.join('、')}）：只能等主人去面板上点。`;
    }
    const head = `港口里你能自己动手的：${can.join('、')}——用 sea_do，填对应的动作就行。`;
    return lock.length ? `${head}只能等主人点的：${lock.join('、')}。` : head;
  }

  sailText(routeArg) {
    const s = this.ensure();
    const theme = this.theme;
    const now = Date.now();
    if (s.blockedUntil && Date.parse(s.blockedUntil) <= now) s.blockedUntil = null;
    if (s.blockedUntil) {
      const mins = Math.max(1, Math.ceil((Date.parse(s.blockedUntil) - now) / 60_000));
      return `还出不了海：你在押送船上，约 ${mins} 分钟后靠岸。`;
    }
    if (s.voyage) {
      return `已经有一条船在海上（${s.voyage.kindLabel} · ${s.voyage.islandName}），先等它回来。`;
    }
    const routes = buildRoutes(s, theme, this.ctx.cfg?.difficulty);
    const index = Number(routeArg);
    const route = routes.find((r) => r.index === index || r.id === String(routeArg));
    if (!route) {
      return `没有第 ${routeArg} 条航线。今天只有 1、2、3。`;
    }
    const w = this.weather(now);
    s.voyage = startVoyage(s, route, now, {
      ...(this.ctx.cfg ?? {}),
      // 顺风少走一会儿，无风多漂一会儿。天数是玩的一部分，别让它变成空等。
      voyageMinutes: Math.max(1, Math.round((Number(this.ctx.cfg?.voyageMinutes) || route.minutes) * w.sail)),
    }, theme);
    s.voyage.risk = Math.min(5, Math.max(1, route.risk + w.risk));
    // 模拟脚本（cfg.sim）不等航程：它要在几秒里跑完 119 章，没有真实时间可等。
    // 这个标记不出现在配置里，玩家碰不到。
    if (this.ctx.cfg?.sim) s.voyage.endsAt = new Date(now).toISOString();
    this.save();
    if (this.ctx.cfg?.sim) {
      return `起航：${route.kindLabel} · ${route.islandName}。`;
    }
    const eta = new Date(Date.parse(s.voyage.endsAt));
    const hh = String(eta.getHours()).padStart(2, '0');
    const mm = String(eta.getMinutes()).padStart(2, '0');
    return `起航：${route.kindLabel} · ${route.islandName}。约 ${hh}:${mm} 回来，回来才有结果。`;
  }

  /** 工具和面板都走这里：模拟脚本里起航即结算。 */
  async sailAction(routeArg) {
    const message = this.sailText(routeArg);
    if (this.ctx.cfg?.sim && this.state?.voyage) {
      await this.finish();
      return `${message}\n（已经回来了，回执在她那儿。）`;
    }
    return message;
  }

  /** 面板上的「立刻返航」：不管配置，直接把这一趟跑完。 */
  async finish() {
    const s = this.ensure();
    if (!s.voyage) return { ok: false, message: '现在没有船在海上。' };
    s.voyage.endsAt = new Date().toISOString();
    this.save();
    if (this.busy) await new Promise((done) => setTimeout(done, 120));
    await this.tick();
    return { ok: true, message: '回来了，结果已经记进航海日志。' };
  }

  chronicleText(limitArg) {
    const s = this.ensure();
    const theme = this.theme;
    const c = s.captain;
    const p = progressOf(s);
    const limit = Math.min(10, Math.max(1, Number(limitArg) || 5));
    const head = `悬赏令：${c.epithet}「${c.name}」 · 罪名 ${c.crime} · ${bountyLabel(c.bounty)} · `
      + `${titleOf(c.bounty, theme)} · 第 ${rankOf(s)}/${s.npcs.length + 1} 名`;
    const where = p.completed
      ? '已经到拉夫德鲁'
      : `${p.partLabel} · ${p.arcName} 第 ${p.chapterNo}/${p.chapterCount} 章「${p.chapterTitle}」`;
    const line = `Lv${s.level.value} · 战力 ${powerOf(s)} · 海图 ${p.done}/${p.total} · ${where}`;
    const parts = SHIP_PARTS.reduce((n, part) => n + (s.ship?.parts?.[part.id] ?? 0), 0);
    const heap = `船上 ${(s.crew ?? []).length} 人（疲劳 ${this.fatigueOf(s)}）· 刀 ${(s.gears?.blades ?? []).length}/${BLADES.length}`
      + ` · 果实 ${s.gears?.fruit ? fruitById(s.gears.fruit)?.name ?? '一颗' : '没吃'}`
      + ` · 改装 ${parts}/30 · ${codexLine(s, theme)} · 修行 ${s.training ?? 0}`;
    if (!s.log.length) return `${head}\n${line}\n${heap}\n还没有出过海。`;
    const entries = s.log.slice(0, limit).map((e) => (e.chapter
      ? `第 ${e.day} 天 · ${e.chapterTitle ?? e.kind} · ${e.outcomeLabel}${e.choice ? ` · 选了「${e.choice}」` : ''}`
      : `第 ${e.day} 天 · ${e.island} · ${e.outcomeLabel} · 赏金 ${formatBounty(e.bountyTo)}`));
    return `${head}\n${line}\n${heap}\n${entries.join('\n')}`;
  }

  tools() {
    return TOOL_SPECS.map((spec) => {
      if (spec.name === 'sea_status') return { ...spec, handler: async () => this.statusText() };
      if (spec.name === 'sea_sail') {
        return {
          ...spec,
          handler: async (args = {}) => {
            if (args.auto === 'on' || args.auto === 'off') return this.toggleAuto(args.auto === 'on');
            if (args.route) return this.sailAction(args.route);
            const out = await this.chapterAction(args.choice);
            return out.message;
          },
        };
      }
      if (spec.name === 'sea_do') {
        return { ...spec, handler: async (args = {}) => this.doAction(args.action).message };
      }
      return { ...spec, handler: async (args = {}) => this.chronicleText(args.limit) };
    });
  }

  /** 她自己挂机 / 自己收手。只暂停，不改用户的配置开关。 */
  toggleAuto(on) {
    const s = this.ensure();
    const now = Date.now();
    s.auto.paused = !on;
    s.auto.lastRunAt = new Date(now).toISOString();
    this.save();
    const st = this.autoStatus(now);
    if (on && !st.enabled) {
      return '你想动，但配置里的「她自己去冒险」是关的——那得你自己去设置里打开。';
    }
    return on
      ? `好，继续自己走：每 ${st.minutes} 分钟一趟，今天还剩 ${st.left} 次。`
      : '那先歇着。接下来只有你点她才会动。';
  }

  // ── 面板 ────────────────────────────────────────────────────────────────

  /**
   * 「现在该做什么」——面板顶上一张小小的建议卡。
   * 只给三条，按轻重排：先别沉船，再别累死，然后才是变强。
   * 每条能带一个按钮，点了就等于替你做了那个决定（不替你选岔口）。
   */
  advice(s = this.ensure()) {
    const out = [];
    const gap = gapLine(s);
    const done = s.campaign?.done ?? 0;
    const c = s.captain;
    const p = progressOf(s);

    if (c.hull < 50) {
      const cost = this.repairCost(s);
      out.push({
        tone: c.hull < 25 ? 'warn' : 'info',
        text: `船体只剩 ${c.hull}。再挨两下就要在海上散架了。`,
        action: c.berries >= cost ? { method: 'repair', args: [], label: `修船（${formatMoney(cost)}）` } : null,
      });
    }

    const fatigue = this.fatigueOf(s);
    if (fatigue > 62) {
      const cost = this.restCost(s);
      out.push({
        tone: fatigue > 82 ? 'warn' : 'info',
        text: `全员疲劳 ${fatigue}，打起来只剩七成力。`,
        action: c.berries >= cost ? { method: 'rest', args: [], label: `歇一晚（${formatMoney(cost)}）` } : null,
      });
    }

    if (!p.completed && gap.ratio < 0.95) {
      // 自由航海一趟约 0.18 级，这里只做粗估，写「大约」。
      const mul = Math.max(0.2, powerParts(s).mul);
      const targetLv = Math.ceil(levelForPower(gap.need / mul));
      const runs = Math.max(1, Math.ceil((targetLv - s.level.value) / 0.18));
      const left = this.sailFreeLeft(s);
      out.push({
        tone: 'info',
        text: `下一章「${p.chapterTitle}」要 ${gap.need}，你只有 ${gap.mine}。`
          + `大约还差 ${runs} 趟自由航海（一天最多 ${FREE_SAIL_DAY} 趟），或者把船改装、刀、霸气补一补。`,
        action: left > 0
          ? { method: 'free', args: [1], label: `跑一趟（今天还剩 ${left} 趟）` }
          : null,
      });
    }

    // 材料够升、升级最划算的那一件。
    const tier = shipTierOf(s);
    let best = null;
    for (const part of partsOf(s.ship)) {
      if (part.level >= part.max) continue;
      const cost = partCost(part, part.level + 1, tier);
      const ok = c.berries >= cost.berries
        && (s.materials?.wood ?? 0) >= cost.wood
        && (s.materials?.iron ?? 0) >= cost.iron
        && (s.materials?.rare ?? 0) >= cost.rare;
      if (ok && (!best || cost.berries < best.cost)) best = { part, cost: cost.berries };
    }
    if (best) {
      out.push({
        tone: 'good',
        text: `${best.part.name}现在能升到 ${best.part.level + 1} 级（${best.part.desc}）。`,
        action: { method: 'upgrade', args: [best.part.id], label: `升${best.part.name}` },
      });
    }

    const haki = HAKI.find((h) => done >= h.unlockAt
      && (s.haki?.[h.id] ?? 0) < h.max
      && (s.training ?? 0) >= hakiCost((s.haki?.[h.id] ?? 0) + 1));
    if (haki) {
      out.push({
        tone: 'good',
        text: `修行点 ${s.training}，够把${haki.name}再上一层。`,
        action: { method: 'haki', args: [haki.id], label: `练${haki.name}` },
      });
    }

    const story = storyPayload(s);
    if (story.voidUnlocked && !story.voidDone) {
      out.push({
        tone: 'good',
        text: `四块历史正文凑齐了：隐藏章「${story.voidTitle}」在拉夫德鲁等你，难度 ${story.voidPower}。`,
        action: { method: 'void', args: [], label: '读那一页' },
      });
    } else if (!story.voidUnlocked && story.count > 0) {
      out.push({ tone: 'info', text: `历史正文 ${story.count}/${story.total}。剩下几块在别的篇章的 BOSS 身上。` });
    }

    return out.slice(0, 3);
  }

  payload() {
    const s = this.ensure();
    const theme = this.theme;
    const now = Date.now();
    const c = s.captain;
    const routes = buildRoutes(s, theme, this.ctx.cfg?.difficulty);
    const next = nextTitle(c.bounty, theme);
    const prev = theme.titles.filter((t) => t.at <= c.bounty).at(-1) ?? { at: 0 };
    const board = sortedBoard(s);
    const rank = board.find((r) => r.you)?.rank ?? 1;
    const repairCost = this.repairCost(s);
    const blocked = s.blockedUntil && Date.parse(s.blockedUntil) > now
      ? { minutes: Math.max(1, Math.ceil((Date.parse(s.blockedUntil) - now) / 60_000)) }
      : null;
    const parts = partsOf(s.ship);
    const partSum = parts.reduce((n, part) => n + part.level, 0);
    const pp = powerParts(s);
    const pending = choiceFor(s);
    const cx = codexOf(s, theme);
    const equipped = new Set(equippedBlades(s).map((b) => b.id));
    const waitLeft = this.sailWaitLeft(s, now);
    const sailUsed = s.freeSail?.day === localDayKey(now) ? (s.freeSail.count ?? 0) : 0;

    return {
      theme: { id: theme.id, label: theme.label, sea: theme.sea, currency: theme.currency, navy: theme.navy },
      day: s.day,
      // 面板据此在按钮旁边标「她也能自己点」，不用把开关画成第二块设置页。
      perm: Object.fromEntries(Object.keys(PERM).map((k) => [k, this.allowed(k)])),
      // 今天的海况：只影响自由航海，面板上给一条风向标。
      weather: (() => {
        const w = this.weather(now);
        return {
          id: w.id, name: w.name, note: w.note,
          berry: Math.round((w.berry - 1) * 100),
          damage: Math.round((w.damage - 1) * 100),
          sail: Math.round((w.sail - 1) * 100),
          risk: w.risk,
        };
      })(),
      status: this.headLine(s, now),
      level: {
        value: s.level.value,
        exp: s.level.exp,
        need: s.level.need,
        ratio: Math.min(1, s.level.exp / Math.max(1, s.level.need)),
        power: pp.power,
        parts: {
          base: Math.round(pp.base),
          crew: Math.round(pp.base * pp.crew),
          ship: Math.round(pp.base * pp.ship),
          blade: Math.round(pp.base * pp.blade),
          fruit: Math.round(pp.base * pp.fruit),
          haki: Math.round(pp.base * pp.haki),
        },
      },
      campaign: {
        ...progressOf(s),
        bosses: s.campaign.bosses ?? 0,
        // 航程：推完一章，船要开一会儿。面板拿这几个字段画倒计时和加速按钮。
        waitMs: waitLeft,
        waitText: waitLeft > 0
          ? `${Math.floor(waitLeft / 60_000)}:${String(Math.floor((waitLeft % 60_000) / 1000)).padStart(2, '0')}`
          : '',
        sailUntil: s.campaign.sailUntil ?? null,
        rushCost: this.rushCost(s),
        rushCostText: formatMoney(this.rushCost(s)),
        canRush: waitLeft > 0 && c.berries >= this.rushCost(s),
        // 面板画三回合预览时要用：决着那一回合的加成只落在决着上。
        roundBonus: [0, 1, 2].map((i) => Math.round(bossRoundBonus(s, i) * 1000) / 10),
        recent: s.log.filter((e) => e.chapter).slice(0, 6).map((e) => ({
          chapter: e.chapter, title: e.chapterTitle ?? e.kind, island: e.island,
          outcome: e.outcome, outcomeLabel: e.outcomeLabel, choice: e.choice ?? null,
        })),
      },
      choice: pending
        ? {
          key: pending.key,
          kind: pending.kind,
          title: pending.title,
          prompt: pending.prompt,
          options: pending.options.map((o, i) => ({ index: i + 1, label: o.label, hint: o.hint })),
        }
        : null,
      nextBonus: s.nextBonus
        ? {
          note: s.nextBonus.note,
          power: Math.round((s.nextBonus.power ?? 0) * 100),
          bounty: Math.round((s.nextBonus.bounty ?? 0) * 100),
          capture: Math.round((s.nextBonus.capture ?? 0) * 100),
        }
        : null,
      ship: {
        ...shipOf(s),
        parts: parts.map((part) => {
          const cost = partCost(part, part.level + 1, shipTierOf(s));
          return {
            id: part.id,
            name: part.name,
            level: part.level,
            max: part.max,
            desc: part.desc,
            maxed: part.level >= part.max,
            cost: { ...cost, text: `${formatMoney(cost.berries)} ${theme.currency} · 木 ${cost.wood} 铁 ${cost.iron}${cost.rare ? ` 稀有 ${cost.rare}` : ''}` },
            canPay: c.berries >= cost.berries
              && (s.materials?.wood ?? 0) >= cost.wood
              && (s.materials?.iron ?? 0) >= cost.iron
              && (s.materials?.rare ?? 0) >= cost.rare,
            effect: [
              part.power ? `战力 +${(part.power * 100).toFixed(1)}%/级` : null,
              part.damage ? `减伤 ${Math.abs(part.damage * 100).toFixed(0)}%/级` : null,
              part.time ? `航时 -${Math.abs(part.time * 100).toFixed(0)}%/级` : null,
              part.fatigue ? `疲劳 -${Math.abs(part.fatigue * 100).toFixed(0)}%/级` : null,
            ].filter(Boolean).join(' · '),
            preview: part.level >= part.max ? '到顶' : `升到 ${part.level + 1} 级`,
          };
        }),
        partSum,
        partMax: parts.reduce((n, part) => n + part.max, 0),
        bonusPct: Math.round(shipBonus({ tier: shipTierOf(s), parts: s.ship?.parts }) * 100),
      },
      crew: {
        list: (s.crew ?? []).map((m) => {
          const def = crewById(m.id);
          return {
            id: m.id,
            name: def?.name ?? m.id,
            short: def?.short ?? m.id,
            role: def?.role ?? '',
            roleLabel: CREW_ROLES[def?.role] ?? '',
            weight: Math.round((def?.weight ?? 0) * 1000) / 10,
            note: def?.line ?? '',
            fatigue: Math.round(m.fatigue ?? 0),
            joinedDay: m.joinedDay ?? 0,
            powerPct: Math.round((def?.weight ?? 0) * 100),
            effect: EFFECT_LABEL[def?.effect] ?? '',
            away: (m.awayUntil ?? -1) > (s.campaign?.done ?? 0),
            awayIn: Math.max(0, (m.awayUntil ?? 0) - (s.campaign?.done ?? 0)),
            task: (() => {
              const t = taskOfRole(def?.role);
              return t
                ? { label: t.label, note: t.note, reward: rewardText(dispatchReward(t, s.campaign?.done ?? 0)) }
                : null;
            })(),
          };
        }),
        cap: crewCap(shipOf(s).tier),
        count: (s.crew ?? []).length,
        away: this.awayCount(s),
        maxAway: DISPATCH_MAX,
        keep: DISPATCH_KEEP,
        dispatchChapters: DISPATCH_CHAPTERS,
        canSend: this.awayCount(s) < DISPATCH_MAX
          && (s.crew ?? []).length - this.awayCount(s) > DISPATCH_KEEP,
        avgFatigue: this.fatigueOf(s),
        restCost: this.restCost(s),
        restCostText: formatMoney(this.restCost(s)),
        nextJoin: CREW.find((x) => x.after > (s.campaign?.done ?? 0)) ?? null,
      },
      materials: MATERIALS.map((m) => ({ ...m, n: s.materials?.[m.id] ?? 0 })),
      gears: {
        blades: BLADES.map((b) => ({
          id: b.id, name: b.name, grade: b.grade, gradeKey: b.gradeKey,
          power: Math.round(b.power * 1000) / 10,
          color: b.color, note: b.note, from: b.from, price: b.price ?? 0,
          fromLabel: b.from === 'shop' ? '刀店'
            : b.from === 'auction' ? '拍卖行'
              : `${ARCS.find((a) => a.id === b.from)?.name ?? '某处'} · BOSS`,
          priceText: b.price ? formatMoney(b.price) : '',
          owned: (s.gears?.blades ?? []).includes(b.id),
          equipped: equipped.has(b.id),
          canBuy: Boolean(b.price) && !(s.gears?.blades ?? []).includes(b.id) && c.berries >= (b.price ?? 0),
        })),
        fruits: [...(s.gears?.fruits ?? [])].map((id) => {
          const f = fruitById(id);
          return f ? { id: f.id, name: f.name, tag: f.tag, power: Math.round(f.power * 100), color: f.color, upside: f.upside } : null;
        }).filter(Boolean),
        eaten: s.gears?.fruit ? (() => {
          const f = fruitById(s.gears.fruit);
          return f ? { id: f.id, name: f.name, tag: f.tag, power: Math.round(f.power * 100), color: f.color, upside: f.upside } : null;
        })() : null,
        bladeCount: BLADES.length,
        bladeOwned: BLADES.filter((b) => (s.gears?.blades ?? []).includes(b.id)).length,
        fruitCount: FRUITS.length,
        fruitSeen: FRUITS.filter((f) => [...(s.gears?.fruits ?? []), s.gears?.fruit].includes(f.id)).length,
        catalog: FRUITS.map((f) => ({
          id: f.id, name: f.name, tag: f.tag, upside: f.upside, color: f.color,
          seen: [...(s.gears?.fruits ?? []), s.gears?.fruit].filter(Boolean).includes(f.id),
        })),
      },
      haki: HAKI.map((h) => ({
        id: h.id, name: h.name, level: s.haki?.[h.id] ?? 0, max: h.max,
        unlockAt: h.unlockAt, per: h.per, note: h.note, color: h.color,
        unlocked: (s.campaign?.done ?? 0) >= h.unlockAt,
        cost: hakiCost((s.haki?.[h.id] ?? 0) + 1),
        maxed: (s.haki?.[h.id] ?? 0) >= h.max,
        canLearn: (s.campaign?.done ?? 0) >= h.unlockAt
          && (s.haki?.[h.id] ?? 0) < h.max
          && (s.training ?? 0) >= hakiCost((s.haki?.[h.id] ?? 0) + 1),
      })),
      training: s.training ?? 0,
      codex: cx,
      portrait: this.ctx.cfg?.portrait === 'silhouette' ? 'silhouette' : 'none',
      free: {
        cap: FREE_SAIL_DAY,
        used: sailUsed,
        left: Math.max(0, FREE_SAIL_DAY - sailUsed),
      },
      auto: (() => {
        const st = this.autoStatus(now);
        return {
          enabled: st.enabled, paused: st.paused, minutes: st.minutes,
          dailyCap: st.dailyCap, runs: st.runs, left: st.left,
          nextInMs: st.nextInMs, notify: st.notify,
        };
      })(),
      captain: {
        name: c.name,
        epithet: c.epithet,
        title: titleOf(c.bounty, theme),
        bounty: c.bounty,
        bountyText: bountyLabel(c.bounty),
        // 悬赏令上用原始数字：¥ 212,000,000-
        amountText: c.bounty > 0 ? `¥ ${c.bounty.toLocaleString('en-US')}-` : '未定价',
        berries: c.berries,
        berriesText: formatMoney(c.berries),
        hull: c.hull,
        crime: c.crime,
        renown: c.renown,
        explored: c.explored.length,
      },
      rank,
      total: s.npcs.length + 1,
      routes: routes.map((r) => ({
        id: r.id, index: r.index, kindId: r.kindId, kindLabel: r.kindLabel, islandName: r.islandName,
        region: r.region, desc: r.desc, risk: r.risk,
        minutes: Math.max(1, Math.round(r.minutes * voyageTimeMul(s))),
      })),
      voyage: s.voyage
        ? {
          islandName: s.voyage.islandName,
          kindLabel: s.voyage.kindLabel,
          endsAt: s.voyage.endsAt,
          minutes: s.voyage.minutes,
          remainMs: Math.max(0, Date.parse(s.voyage.endsAt) - now),
        }
        : null,
      blocked,
      repairCost,
      repairCostText: formatMoney(repairCost),
      board: board.map((r) => ({
        rank: r.rank, name: r.name, epithet: r.epithet, bounty: r.bounty,
        bountyText: formatBounty(r.bounty), you: r.you,
      })),
      log: s.log.slice(0, 8).map((e) => ({
        day: e.day, island: e.island, kind: e.kind, chapterTitle: e.chapterTitle ?? null,
        outcome: e.outcome, outcomeLabel: e.outcomeLabel, scene: e.scene,
        bountyText: formatBounty(e.bountyTo), choice: e.choice ?? null,
      })),
      story: storyPayload(s),
      event: s.story?.pending === MERRY_EVENT.id
        ? {
          id: MERRY_EVENT.id,
          kicker: MERRY_EVENT.kicker,
          title: MERRY_EVENT.title,
          lines: MERRY_EVENT.lines,
          note: MERRY_EVENT.note,
          boon: MERRY_EVENT.boon,
        }
        : null,
      bonds: bondRows(activeCrew(s).map((m) => m.id)).map((b) => ({
        id: b.id, name: b.name, active: b.active, line: b.line, effect: b.effect, value: b.value,
        a: crewById(b.a)?.short ?? b.a,
        b: crewById(b.b)?.short ?? b.b,
      })),
      advice: this.advice(s),
      next: next ? {
        title: next.label,
        needText: formatBounty(Math.max(0, next.at - c.bounty)),
        progress: Math.min(1, Math.max(0, (c.bounty - prev.at) / Math.max(1, next.at - prev.at))),
      } : null,
    };
  }

  /**
   * 测试：一键跳过所有等待。
   * 以后再加任何「要等」的玩法，都从这里给它开一扇门，别让人被时间锁死。
   */
  /** 测试：只在「被押送」时用，立刻上岸。 */
  /** 测试：重开一档。旧档改名留底，不会真的删掉。 */
  async restartRun() {
    this.ensure();
    const stamp = new Date().toISOString().replaceAll(':', '-');
    const backup = `${this.file}.old-${stamp}`;
    try {
      renameSync(this.file, backup);
    } catch {
      return { ok: false, message: '旧档没能改名，先不重开。' };
    }
    this.state = createState({
      botName: this.ctx.botName ?? '无名船长',
      themeId: this.theme.id,
      npcCount: this.ctx.cfg?.npcCount ?? DEFAULT_NPC_COUNT,
      now: Date.now(),
    });
    this.save();
    return { ok: true, message: `重开了一档。旧档留在 ${backup.split(/[\\/]/).pop()}。` };
  }

  repair(silent = false) {
    const s = this.ensure();
    const c = s.captain;
    if (c.hull >= 100) return { ok: false, message: '船是满的，不用修。' };
    const cost = this.repairCost(s);
    if (c.berries >= cost) {
      c.berries -= cost;
      c.hull = 100;
      this.save();
      return { ok: true, message: silent ? `自动修船，花了 ${formatMoney(cost)}。` : `修好了，花了 ${formatMoney(cost)} ${this.theme.currency}。` };
    }
    // 钱不够就修多少算多少。改装把钱花光了也不该被卡在港口出不去。
    const missing = 100 - c.hull;
    const canPay = Math.floor((c.berries / Math.max(1, cost)) * missing);
    if (canPay >= 8) {
      const spent = Math.round(cost * (canPay / missing));
      c.berries = Math.max(0, c.berries - spent);
      c.hull = Math.min(100, c.hull + canPay);
      this.save();
      return { ok: true, message: `钱不够修满，先补了 ${canPay} 点船体，花了 ${formatMoney(spent)}。` };
    }
    if (c.hull <= 0) {
      // 一分钱没有的时候，从旧船上拆几块板钉上——够离开港口，不够打赢。
      c.hull = 22;
      this.save();
      return { ok: true, message: '一分钱都没有了，从旧船上拆了几块板钉上，船体回到 22。' };
    }
    return { ok: false, message: `修满要 ${formatMoney(cost)} ${this.theme.currency}，还差 ${formatMoney(cost - c.berries)}。` };
  }

  repairCost(s = this.ensure()) {
    return Math.ceil(((100 - s.captain.hull) * 15_000 * repairCostMul(s)) / 1_000) * 1_000;
  }

  // ── 授权内的事：她自己也能办 ──────────────────────────────────────────────
  //
  // 面板上的按钮她够不到。下面这几个「挑一个最划算的」函数就是替她做眼，
  // doAction 是唯一入口：工具、面板、自动挂机三条路都从这里走，
  // 权限只判一次，免得改一处漏两处。

  /** 能升、材料够、最便宜的那件改装。没有就 null。 */
  bestUpgrade(s = this.ensure()) {
    const tier = shipTierOf(s);
    const c = s.captain;
    let best = null;
    for (const part of partsOf(s.ship)) {
      if (part.level >= part.max) continue;
      const cost = partCost(part, part.level + 1, tier);
      if (c.berries < cost.berries) continue;
      if ((s.materials?.wood ?? 0) < cost.wood) continue;
      if ((s.materials?.iron ?? 0) < cost.iron) continue;
      if ((s.materials?.rare ?? 0) < cost.rare) continue;
      if (!best || cost.berries < best.cost) best = { part, cost: cost.berries };
    }
    return best;
  }

  /**
   * 店里最划算的那把刀：只碰明码标价的（店两把 + 拍卖一把），
   * 而且不超过手上六成现钱——剩下的要留着修船、改装。
   * 按「每一万贝利换多少战力」横着比，贵的不一定划算。
   */
  bestBlade(s = this.ensure()) {
    const owned = new Set(s.gears?.blades ?? []);
    const budget = s.captain.berries * 0.6;
    let best = null;
    for (const blade of BLADES) {
      if (!blade.price || owned.has(blade.id)) continue;
      if (blade.price > budget) continue;
      const score = blade.power / blade.price;
      if (!best || score > best.score) best = { blade, score };
    }
    return best;
  }

  /** 修行点够、已解锁、还没点满的那一种霸气。 */
  bestHaki(s = this.ensure()) {
    const done = s.campaign?.done ?? 0;
    return HAKI.find((h) => done >= h.unlockAt
      && (s.haki?.[h.id] ?? 0) < h.max
      && (s.training ?? 0) >= hakiCost((s.haki?.[h.id] ?? 0) + 1)) ?? null;
  }

  /** 手里有果实、还没吃过，挑最强的那颗。 */
  bestFruit(s = this.ensure()) {
    if (s.gears?.fruit) return null;
    const list = (s.gears?.fruits ?? []).map((id) => fruitById(id)).filter(Boolean);
    if (!list.length) return null;
    return list.sort((a, b) => (b.power ?? 0) - (a.power ?? 0))[0];
  }

  /** 派谁上岸：优先能带材料回来的，船尾还得留够人。 */
  bestDispatch(s = this.ensure()) {
    if (this.awayCount(s) >= DISPATCH_MAX) return null;
    if ((s.crew ?? []).length - this.awayCount(s) <= DISPATCH_KEEP) return null;
    const free = activeCrew(s).filter((m) => m.awayUntil == null);
    if (!free.length) return null;
    const lowWood = (s.materials?.wood ?? 0) < 6;
    const lowIron = (s.materials?.iron ?? 0) < 6;
    const order = lowWood ? ['sniper', 'sword', 'warrior']
      : lowIron ? ['shipwright', 'sniper', 'helmsman']
        : ['sniper', 'shipwright', 'sword'];
    for (const role of order) {
      const member = free.find((m) => crewById(m.id)?.role === role);
      if (member) return member;
    }
    return free[0];
  }

  /**
   * 在港口办一件事。动作名就是 PERM 的键。
   * 返回的 message 是给她直接说出口的一句话，不是日志。
   */
  doAction(action) {
    const s = this.ensure();
    const key = String(action ?? '').trim();
    if (!PERM[key]) return { ok: false, message: `没有这个动作：${action}` };
    if (!this.allowed(key)) return this.denied(key);

    if (key === 'repair') return this.repair(true);
    if (key === 'rest') return this.rest(true);

    if (key === 'upgrade') {
      const day = this.permDay(s);
      if (day.upgrade >= GROW_DAY.upgrade) {
        return { ok: false, message: `今天已经自己升过 ${GROW_DAY.upgrade} 次改装，剩下的明天再说。` };
      }
      const best = this.bestUpgrade(s);
      if (!best) return { ok: false, message: '没有能升的部件：要么到顶了，要么材料或钱还差一点。' };
      const out = this.upgradePart(best.part.id);
      if (out.ok) { day.upgrade += 1; this.save(); }
      return out;
    }

    if (key === 'blade') {
      const day = this.permDay(s);
      if (day.blade >= GROW_DAY.blade) return { ok: false, message: '今天已经买过一把刀了，明天再看。' };
      const best = this.bestBlade(s);
      if (!best) return { ok: false, message: '店里没有买得起的刀——要留六成现钱修船，先攒点吧。' };
      const out = this.buyBlade(best.blade.id);
      if (out.ok) { day.blade += 1; this.save(); }
      return out;
    }

    if (key === 'fruit') {
      if (s.gears?.fruit) {
        return { ok: false, message: `已经吃过${fruitById(s.gears.fruit)?.name ?? '一颗'}了，一个人只能吃一颗。` };
      }
      const fruit = this.bestFruit(s);
      if (!fruit) return { ok: false, message: '船上没有果实。' };
      return this.eatFruit(fruit.id);
    }

    if (key === 'haki') {
      const haki = this.bestHaki(s);
      if (!haki) return { ok: false, message: '修行点还不够点下一级，或者已经点满了。' };
      return this.learnHaki(haki.id);
    }

    if (key === 'dispatch') {
      // 回绝要说清楚是哪一种：满员、留不够人、还是船上没人——三种话不一样。
      if (this.awayCount(s) >= DISPATCH_MAX) {
        return { ok: false, message: `已经有 ${DISPATCH_MAX} 个人在岸上办事了，先等谁回来。` };
      }
      if ((s.crew ?? []).length - this.awayCount(s) <= DISPATCH_KEEP) {
        return { ok: false, message: `船上得留 ${DISPATCH_KEEP} 个人开船，现在抽不出手。` };
      }
      const member = this.bestDispatch(s);
      if (!member) return { ok: false, message: '没有能派的人，等下一个同伴上船再说。' };
      return this.sendOut(member.id);
    }
  }

  // ── 船坞、船员、收藏 ────────────────────────────────────────────────────

  fatigueOf(s = this.ensure()) {
    const crew = s.crew ?? [];
    if (!crew.length) return 0;
    return Math.round(crew.reduce((n, m) => n + (m.fatigue ?? 0), 0) / crew.length);
  }

  restCost(s = this.ensure()) {
    return Math.max(30_000, 25_000 * Math.max(1, (s.crew ?? []).length));
  }

  /** 在港里歇一晚：花钱，清疲劳。她不睡觉的时候是打不动 BOSS 的。 */
  rest(silent = false) {
    const s = this.ensure();
    // 15 以下不值得睡：一晚上是全额的钱和一整天，换不回多少战力。
    // 之前卡在 4，疲劳十几个点的时候点一下，钱花了、日子也过去了。
    if (this.fatigueOf(s) < 15) {
      return { ok: false, message: `全员疲劳只有 ${this.fatigueOf(s)}，不值得花一晚。等累了再歇。` };
    }
    const cost = this.restCost(s);
    if (s.captain.berries < cost) {
      return { ok: false, message: `歇一晚要 ${formatMoney(cost)} ${this.theme.currency}，钱不够。` };
    }
    s.captain.berries -= cost;
    // 布鲁克在船上，这一晚就不是干睡。这条被动写了很久一直没接上，v0.6 补上。
    const music = crewEffect(s, 'music');
    fatigueAll(s, music ? -77 : -55);
    s.day += 1;
    const back = tickDispatch(s);
    this.save();
    const extra = back.length ? ` ${back.map((b) => `${crewById(b.crewId)?.short ?? b.crewId}回来了（${b.got.join('、')}）`).join('；')}。` : '';
    return {
      ok: true,
      message: (silent
        ? `在港里歇了一晚（${formatMoney(cost)}），疲劳回到 ${this.fatigueOf(s)}。`
        : `歇了一晚，花了 ${formatMoney(cost)} ${this.theme.currency}。全员疲劳 ${this.fatigueOf(s)}。`)
        + (music ? '有人拉了一晚上的琴，睡得比平时沉。' : '') + extra,
    };
  }

  // ── 派遣 ────────────────────────────────────────────────────────────────

  awayCount(s = this.ensure()) {
    return (s.dispatch ?? []).length;
  }

  /** 派一个人上岸。代价写清楚：这几章他的战力、被动、羁绊全不算。 */
  sendOut(crewId) {
    const s = this.ensure();
    const id = String(crewId ?? '');
    const member = (s.crew ?? []).find((m) => m.id === id);
    if (!member) return { ok: false, message: '船上没有这个人。' };
    const def = crewById(id);
    const task = taskOfRole(def?.role);
    if (!task) return { ok: false, message: `${def?.short ?? id}不知道该上岸做什么。` };
    if (member.awayUntil != null) return { ok: false, message: `${def.short}已经上岸了。` };
    if (this.awayCount(s) >= DISPATCH_MAX) {
      return { ok: false, message: `最多同时派 ${DISPATCH_MAX} 个人上岸，先等一个回来。` };
    }
    if ((s.crew ?? []).length - this.awayCount(s) <= DISPATCH_KEEP) {
      return { ok: false, message: `船上至少要留 ${DISPATCH_KEEP} 个人，不然没人开船。` };
    }
    const due = dueAt(s);
    member.awayUntil = due.until;
    s.dispatch = [...(s.dispatch ?? []), {
      crewId: id, role: def.role, since: s.campaign?.done ?? 0, ...due,
    }];
    this.save();
    const reward = dispatchReward(task, s.campaign?.done ?? 0);
    return {
      ok: true,
      message: `${def.short}${task.label}去了：${DISPATCH_CHAPTERS} 章之后回来，大约带回来 ${rewardText(reward)}。`
        + `这 ${DISPATCH_CHAPTERS} 章不算战力，羁绊也算断的。`,
    };
  }

  /** 点错了就喊回来。没有收获，人也白跑一趟。 */
  callBack(crewId) {
    const s = this.ensure();
    const id = String(crewId ?? '');
    const entry = (s.dispatch ?? []).find((d) => d.crewId === id);
    if (!entry) return { ok: false, message: '这个人没被派出去。' };
    const member = (s.crew ?? []).find((m) => m.id === id);
    if (member) {
      delete member.awayUntil;
      member.fatigue = Math.min(100, (member.fatigue ?? 0) + 8);
    }
    s.dispatch = (s.dispatch ?? []).filter((d) => d.crewId !== id);
    this.save();
    const def = crewById(id);
    return { ok: true, message: `${def?.short ?? id}被叫回来了。什么都没带，还白跑了一趟。` };
  }

  // ── 不可逆事件与隐藏章 ──────────────────────────────────────────────────

  /** 把那张纸收起来。剧情已经落过了，这里只是让面板别再摆着它。 */
  ackEvent() {
    const s = this.ensure();
    if (!s.story?.pending) return { ok: false, message: '现在没有要收起来的东西。' };
    s.story = { ...s.story, pending: null };
    this.save();
    return { ok: true, message: '收进航海日志了。她偶尔还会提起那条船。' };
  }

  /** 四块历史正文凑齐之后的隐藏章。不进主线进度，输了不掉东西。 */
  async voidChallenge() {
    const s = this.ensure();
    const out = resolveVoid(s);
    if (!out.ok) return out;
    this.save();
    const rounds = (out.rounds ?? []).map((r) => `${r.label}${r.won ? '赢' : '输'}`).join('、');
    await this.push({
      type: out.cleared ? 'onepiece.milestone' : 'onepiece.voyage',
      text: out.cleared
        ? `（隐藏章「${out.chapter.title}」过了：${rounds}。她读完了那一百年。贝利 +5 亿，赏金 +50%。`
          + '这件事她大概不会大声说，但你应该让她说点什么。）'
        : `（隐藏章「${out.chapter.title}」没过：${rounds}，只赢了 ${out.wins} 回合。什么都没丢，可以再来。`
          + '用你自己的口气说两句，别说「挑战失败」这种话。）',
    });
    return out;
  }

  /** 改装一个部件。材料够就能升，不用等。 */
  upgradePart(partId) {
    const s = this.ensure();
    const part = partById(String(partId));
    if (!part) return { ok: false, message: `没有这个部件：${partId}` };
    const lv = s.ship?.parts?.[part.id] ?? 0;
    if (lv >= part.max) return { ok: false, message: `${part.name}已经到顶了（${part.max} 级）。` };
    const cost = partCost(part, lv + 1, shipTierOf(s));
    const lack = [];
    if (s.captain.berries < cost.berries) {
      lack.push(`${formatMoney(cost.berries - s.captain.berries)} ${this.theme.currency}`);
    }
    for (const id of ['wood', 'iron', 'rare']) {
      const need = cost[id] ?? 0;
      const have = s.materials?.[id] ?? 0;
      if (have < need) lack.push(`${MATERIAL_BY_ID[id].name} ×${need - have}`);
    }
    if (lack.length) return { ok: false, message: `${part.name}升到 ${lv + 1} 级还差：${lack.join('、')}。` };

    s.captain.berries -= cost.berries;
    for (const id of ['wood', 'iron', 'rare']) {
      s.materials[id] = Math.max(0, (s.materials[id] ?? 0) - (cost[id] ?? 0));
    }
    s.ship.parts[part.id] = lv + 1;
    this.save();
    return { ok: true, message: `${part.name}升到 ${lv + 1} 级：${part.desc}。` };
  }

  /** 刀店和拍卖行。剩下的刀只能在 BOSS 身上拿。 */
  buyBlade(id) {
    const s = this.ensure();
    const blade = bladeById(String(id));
    if (!blade) return { ok: false, message: `没有这把刀：${id}` };
    if (!blade.price) {
      const arcName = ARCS.find((a) => a.id === blade.from)?.name ?? '别处';
      return { ok: false, message: `「${blade.name}」不卖。要它在「${arcName}」里自己拿。` };
    }
    if ((s.gears.blades ?? []).includes(blade.id)) {
      return { ok: false, message: `「${blade.name}」已经在刀架上了。` };
    }
    if (s.captain.berries < blade.price) {
      return { ok: false, message: `「${blade.name}」要 ${formatMoney(blade.price)} ${this.theme.currency}，还差 ${formatMoney(blade.price - s.captain.berries)}。` };
    }
    s.captain.berries -= blade.price;
    s.gears.blades = [...(s.gears.blades ?? []), blade.id];
    this.save();
    return { ok: true, message: `买下了「${blade.name}」（${blade.grade}，战力 +${Math.round(blade.power * 100)}%）。` };
  }

  /**
   * 吃果实。吃了就换不回来——一辈子只能吃一颗，这是原作规矩，
   * 也是这个玩法里唯一真正不可逆的东西。
   */
  eatFruit(id) {
    const s = this.ensure();
    if (s.gears.fruit) {
      const old = fruitById(s.gears.fruit);
      return { ok: false, message: `你已经吃过${old?.name ?? '一颗果实'}了。一个人只能吃一颗。` };
    }
    const fid = String(id ?? '');
    if (!(s.gears.fruits ?? []).includes(fid)) return { ok: false, message: '船上没有这颗果实。' };
    const fruit = fruitById(fid);
    s.gears.fruits = s.gears.fruits.filter((x) => x !== fid);
    s.gears.fruit = fid;
    s.gears.fruitDay = s.day;
    this.save();
    return {
      ok: true,
      message: `吃下了「${fruit.name}」：${fruit.upside}。代价是从今往后怕海水，被俘的机会更大。`,
    };
  }

  /** 多余的果实可以卖掉——反正只能吃一颗。 */
  sellFruit(id) {
    const s = this.ensure();
    const fid = String(id ?? '');
    if (!(s.gears.fruits ?? []).includes(fid)) return { ok: false, message: '船上没有这颗果实。' };
    const fruit = fruitById(fid);
    const price = 12_000_000 + Math.round((fruit?.power ?? 0) * 100) * 2_000_000;
    s.gears.fruits = s.gears.fruits.filter((x) => x !== fid);
    s.captain.berries += price;
    this.save();
    return { ok: true, message: `把「${fruit.name}」卖给了拍卖行，得 ${formatMoney(price)} ${this.theme.currency}。` };
  }

  /** 练霸气。用修行点，不用等。 */
  learnHaki(id) {
    const s = this.ensure();
    const def = HAKI.find((h) => h.id === String(id));
    if (!def) return { ok: false, message: `没有这种霸气：${id}` };
    const done = s.campaign?.done ?? 0;
    if (done < def.unlockAt) {
      return { ok: false, message: `${def.name}还没醒。要到第 ${def.unlockAt} 章之后（现在 ${done}）。` };
    }
    const lv = s.haki?.[def.id] ?? 0;
    if (lv >= def.max) return { ok: false, message: `${def.name}已经到 ${def.max} 级了。` };
    const cost = hakiCost(lv + 1);
    if ((s.training ?? 0) < cost) {
      return { ok: false, message: `${def.name}升到 ${lv + 1} 级要 ${cost} 点修行，现在只有 ${s.training ?? 0} 点。` };
    }
    s.training -= cost;
    s.haki[def.id] = lv + 1;
    this.save();
    return { ok: true, message: `${def.name}到 ${lv + 1} 级：${def.per}。` };
  }

  /**
   * 按当前配置重排榜单。名单是定数，重排不会污染进度，只会换掉榜上的人。
   * 配置改了「榜上最多多少人」之后，点一下这个就生效，不用重开档。
   */
  rebuildBoard() {
    const s = this.ensure();
    const want = Number.isFinite(this.ctx.cfg?.npcCount)
      ? this.ctx.cfg.npcCount
      : DEFAULT_NPC_COUNT;
    const before = s.npcs.length;
    s.npcs = npcInit(this.theme, want, s.seed >>> 0);
    s.npcSet = this.theme.id;
    s.npcCount = s.npcs.length;
    this.save();
    if (s.npcs.length === before) {
      return { ok: true, message: `榜上还是 ${s.npcs.length} 个人，配置里就是这么多。` };
    }
    return { ok: true, message: `榜单重排完了：${before} 人 → ${s.npcs.length} 人。` };
  }

  webUi() {
    const theme = this.theme;
    const s = this.state;
    const c = s?.captain;
    const p = s ? progressOf(s) : null;
    return {
      label: theme.label,
      lamps: [{
        label: '航海',
        state: s ? 'online' : 'offline',
        hint: s ? (s.voyage ? '船在海上' : p?.completed ? '已抵达拉夫德鲁' : `第 ${p?.arcNo ?? 1}/${ARCS.length} 篇`) : '还没起锚',
      }],
      badges: [
        { label: '等级', value: s ? `Lv${s.level.value}` : '—' },
        { label: '进度', value: s ? `${p.done}/${p.total}` : '—' },
        { label: '悬赏', value: c ? formatBounty(c.bounty) : '—' },
        { label: '名次', value: s ? `第 ${rankOf(s)}/${s.npcs.length + 1}` : '—' },
      ],
      panels: [{
        id: PANEL_ID,
        title: theme.label,
        description: '篇章进度、下一章、船员与船、悬赏令、排行榜，还有最近的航海日志。',
        getMethods: ['state'],
      }],
      invoke: async (panel, method, args = []) => {
        if (panel !== PANEL_ID) throw new Error(`未知面板：${panel}`);
        if (method === 'state') return this.payload();
        if (method === 'chapter') return this.chapterAction(args[0]);
        if (method === 'choose') return this.chapterAction(args[0]);
        if (method === 'upgrade') return this.upgradePart(args[0]);
        if (method === 'rest') return this.rest();
        if (method === 'buyBlade') return this.buyBlade(args[0]);
        if (method === 'eatFruit') return this.eatFruit(args[0]);
        if (method === 'sellFruit') return this.sellFruit(args[0]);
        if (method === 'haki') return this.learnHaki(args[0]);
        if (method === 'restart') return this.restartRun();
        if (method === 'sail') return this.sailAction(args[0]);
        if (method === 'free') return this.freeSailNow(args[0]);
        if (method === 'rush') return this.rushSail();
        if (method === 'auto') return this.toggleAuto(args[0] !== false);
        if (method === 'rebuild') return this.rebuildBoard();
        if (method === 'repair') return this.repair();
        if (method === 'dispatch') return this.sendOut(args[0]);
        if (method === 'recall') return this.callBack(args[0]);
        if (method === 'event') return this.ackEvent();
        if (method === 'void') return this.voidChallenge();
        throw new Error(`未知方法：${method}`);
      },
      config: [CONFIG_GROUP],
      promptDocs: [{
        key: `worlds.${uid}.envPrompt`,
        title: '海贼王大冒险 · 环境提示词',
        description: '只有一行状态：第几天、几级、在哪一篇第几章、赏金多少、排第几。不放日志，也不放选项——那些她要用工具自己看。',
        path: ENV_PROMPT_FILE,
        role: 'envPrompt',
        vars: [
          { name: 'onepiece.theme', description: '这片海叫什么。换主题时跟着变。' },
          { name: 'onepiece.status', description: '第几天、等级、所在篇章、赏金、名次、船体、在不在海上。' },
        ],
      }],
    };
  }
}

export const ONEPIECE = {
  id: uid,
  label: '海贼王大冒险',
  defaults: () => ({
    enabled: false,
    theme: 'onepiece',
    voyageMinutes: 90,
    difficulty: 'normal',
    npcCount: 60,
    auto: true,
    autoMinutes: 30,
    autoDailyCap: 6,
    notify: 'important',
    portrait: 'none',
    // 授权默认值只写在 PERM 一处，别两边各抄一份——抄了迟早对不上。
    ...Object.fromEntries(Object.entries(PERM).map(([, v]) => [v.cfg, v.on])),
  }),
  configOptions: (kind) => {
    if (kind === 'theme') {
      return THEME_IDS.map((id) => ({
        value: id,
        label: id === 'onepiece' ? '海贼王大冒险（原版）' : '无风带（原创皮）',
      }));
    }
    if (kind === 'portrait') {
      return [
        { value: 'none', label: '不画（一张干净的通缉令）' },
        { value: 'silhouette', label: '剪影（深色版画风）' },
      ];
    }
    if (kind === 'notify') {
      return [
        { value: 'important', label: '只在要紧的事开口' },
        { value: 'always', label: '每次都说' },
        { value: 'silent', label: '一声不吭（只写日志）' },
      ];
    }
    if (kind === 'difficulty') {
      return [
        { value: 'calm', label: '平静' },
        { value: 'normal', label: '普通' },
        { value: 'rough', label: '凶险' },
      ];
    }
    return [];
  },
  create: (ctx) => new SeaWorld(ctx),
  describe: {
    tools: TOOL_SPECS.map((spec) => ({
      name: spec.name,
      description: spec.description,
      parameters: spec.parameters,
      tags: spec.tags,
      summary: TOOL_SUMMARIES[spec.name],
    })),
    events: EVENT_DESCRIPTIONS,
  },
};

export default ONEPIECE;
