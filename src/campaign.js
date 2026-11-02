/**
 * 剧情线：三部 · 30 篇 · 119 章。
 *
 * 这里只有数据和纯函数，不碰文件、不认识 World。所有结算按规则在本机算，
 * 模型只负责把结果说成人话。改数值只改这个文件。
 *
 * 章节类型：s 航行 / t 交涉 / f 遭遇 / m 名场面 / b BOSS（每篇最后一章）
 */
import { chapterPower } from './collect.js';
import { shipTierByChapter, SHIP_TIERS } from './ship.js';

export const PARTS = [
  { id: 'east', label: '第一部 · 东海' },
  { id: 'grand', label: '第一部 · 伟大航路' },
  { id: 'new', label: '第二部 · 新世界' },
];

/** 每篇的难度基准，由「目标等级」反推：power = (10 + 3.2×L) / 1.43，再取整。 */
export const ARCS = [
  {
    id: 'dawn', part: 'east', name: '冒险的黎明', power: 13, boss: '亚尔丽塔', island: '风车村',
    chapters: [['风车村', 's'], ['第一个伙伴', 't'], ['铁棒', 'b']],
  },
  {
    id: 'orange', part: 'east', name: '橘子镇', power: 27, boss: '巴基', island: '橘子镇',
    chapters: [['被偷的航海图', 's'], ['巴基海贼团', 'f'], ['四分五裂', 'b']],
  },
  {
    id: 'syrup', part: 'east', name: '西罗布村', power: 35, boss: '克洛', island: '西罗布村',
    chapters: [['斜坡上的大宅', 's'], ['克拉巴特尔', 't'], ['黑猫海贼团', 'b']],
  },
  {
    id: 'baratie', part: 'east', name: '巴拉蒂', power: 46, boss: '克里克', island: '海上餐厅',
    chapters: [['海上餐厅', 's'], ['提督克里克', 'f'], ['鹰眼的刀', 'm'], ['决斗', 'b']],
  },
  {
    id: 'arlong', part: 'east', name: '阿龙公园', power: 54, boss: '阿龙', island: '可可亚西村',
    chapters: [['可可亚西', 's'], ['鱼人海贼团', 'f'], ['娜美的眼泪', 'm'], ['阿龙', 'b']],
  },
  {
    id: 'loguetown', part: 'east', name: '罗格镇', power: 59, boss: '斯摩格', island: '罗格镇',
    chapters: [['海贼王的故乡', 's'], ['处刑台', 'm'], ['白烟', 'b']],
  },
  {
    id: 'reverse', part: 'grand', name: '双子岬', power: 67, boss: '拉布', island: '颠倒山',
    chapters: [['颠倒山', 's'], ['鲸鱼', 'b']],
  },
  {
    id: 'whisky', part: 'grand', name: '威士忌山峰', power: 72, boss: 'Mr.5', island: '威士忌山峰',
    chapters: [['欢迎海贼', 't'], ['巴洛克工房', 'b']],
  },
  {
    id: 'littlegarden', part: 'grand', name: '小花园', power: 75, boss: 'Mr.3', island: '小花园',
    chapters: [['两个巨人', 's'], ['蜡', 'f'], ['一百年的决斗', 'b']],
  },
  {
    id: 'drum', part: 'grand', name: '磁鼓岛', power: 83, boss: '瓦波尔', island: '磁鼓岛',
    chapters: [['雪国', 's'], ['瓦波尔', 'f'], ['医生', 'm'], ['樱花', 'b']],
  },
  {
    id: 'alabasta', part: 'grand', name: '阿拉巴斯坦', power: 91, boss: '克洛克达尔', gate: true, island: '阿拉巴斯坦',
    chapters: [['沙漠', 's'], ['叛乱', 't'], ['雨宴', 'f'], ['地下', 'f'], ['克洛克达尔', 'b'], ['罗宾', 'm']],
  },
  {
    id: 'jaya', part: 'grand', name: '加雅', power: 96, boss: '贝拉米', island: '魔谷镇',
    chapters: [['酒馆', 't'], ['上升海流', 's'], ['贝拉米', 'b']],
  },
  {
    id: 'skypiea', part: 'grand', name: '空岛', power: 104, boss: '艾尼路', gate: true, island: '神之岛',
    chapters: [['云海', 's'], ['神官', 'f'], ['试炼', 't'], ['黄金钟', 'm'], ['雷', 'b']],
  },
  {
    id: 'longring', part: 'grand', name: '长环长岛', power: 112, boss: '福克西', island: '长环长岛',
    chapters: [['Davy Back', 't'], ['福克西', 'b']],
  },
  {
    id: 'water7', part: 'grand', name: '水之七岛', power: 115, boss: '卡库', island: '水之七岛',
    chapters: [['船坞', 's'], ['CP9', 'f'], ['梅丽号', 'm'], ['弗兰奇', 't'], ['卡库', 'b']],
  },
  {
    id: 'enies', part: 'grand', name: '司法岛', power: 123, boss: '路奇', gate: true, island: '司法岛',
    chapters: [['不夜城', 's'], ['烧旗', 'm'], ['CP9 全员', 'f'], ['罗宾', 't'], ['路奇', 'b']],
  },
  {
    id: 'thriller', part: 'grand', name: '恐怖三桅船', power: 131, boss: '莫利亚', island: '恐怖三桅船',
    chapters: [['迷雾', 's'], ['僵尸', 'f'], ['布鲁克', 't'], ['影子', 'b']],
  },
  {
    id: 'sabaody', part: 'grand', name: '香波地群岛', power: 136, boss: '巴索罗缪·熊', island: '香波地群岛',
    chapters: [['泡泡', 's'], ['天龙人', 't'], ['黄猿', 'f'], ['熊', 'b']],
  },
  {
    id: 'amazon', part: 'grand', name: '女人岛', power: 142, boss: '汉库克', island: '亚马逊百合',
    chapters: [['九蛇', 's'], ['竞技', 'f'], ['汉库克', 'b']],
  },
  {
    id: 'impel', part: 'grand', name: '因佩尔', power: 147, boss: '麦哲伦', island: '因佩尔',
    chapters: [['LEVEL 1', 's'], ['看守长', 'f'], ['艾斯', 'm'], ['毒', 'b']],
  },
  {
    id: 'marineford', part: 'grand', name: '马林梵多', power: 152, boss: '赤犬', gate: true, island: '马林梵多',
    chapters: [['处刑', 'm'], ['海军本部', 'f'], ['白胡子', 'm'], ['赤犬', 'f'], ['顶上', 'b']],
  },
  {
    id: 'fishman', part: 'new', name: '鱼人岛', power: 160, boss: '霍迪', island: '鱼人岛',
    chapters: [['一万米', 's'], ['霍迪', 'f'], ['甚平', 't'], ['方舟', 'b']],
  },
  {
    id: 'punk', part: 'new', name: '庞克哈萨德', power: 166, boss: '凯撒', island: '庞克哈萨德',
    chapters: [['冰火', 's'], ['凯撒', 'f'], ['毒气', 't'], ['SAD', 'b']],
  },
  {
    id: 'dressrosa', part: 'new', name: '德雷斯罗萨', power: 174, boss: '多弗朗明哥', island: '德雷斯罗萨',
    chapters: [['竞技场', 'f'], ['玩具', 's'], ['明哥', 'f'], ['萨博', 'm'], ['鸟笼', 't'], ['四档', 'b']],
  },
  {
    id: 'zou', part: 'new', name: '佐乌', power: 179, boss: '杰克', island: '佐乌',
    chapters: [['象背', 's'], ['毛皮族', 't'], ['杰克', 'b']],
  },
  {
    id: 'wholecake', part: 'new', name: '万国', power: 187, boss: '卡塔库栗', gate: true, island: '蛋糕岛',
    chapters: [['蛋糕岛', 's'], ['布琳', 't'], ['卡塔库栗', 'f'], ['茶会', 'm'], ['逃亡', 't'], ['糯糯', 'b']],
  },
  {
    id: 'wano', part: 'new', name: '和之国', power: 195, boss: '凯多', gate: true, island: '鬼岛',
    chapters: [['花之都', 's'], ['兔碗', 'f'], ['御田', 'm'], ['百兽', 'f'], ['鬼岛', 's'], ['五档', 'm'], ['凯多', 'b']],
  },
  {
    id: 'eggy', part: 'new', name: '蛋头岛', power: 203, boss: '五老星', island: '未来岛',
    chapters: [['未来岛', 's'], ['CP0', 'f'], ['贝加庞克', 't'], ['五老星', 'f'], ['母火', 'b']],
  },
  {
    id: 'elbaph', part: 'new', name: '艾尔帕布', power: 211, boss: '洛基', island: '巨人国',
    chapters: [['巨人国', 's'], ['试炼', 'f'], ['洛基', 't'], ['战船', 'b']],
  },
  {
    id: 'laugh', part: 'new', name: '拉夫德鲁', power: 216, boss: '世界的真相', gate: true, island: '拉夫德鲁',
    chapters: [['最后一块', 'm'], ['无风带', 's'], ['大秘宝', 'b']],
  },
];

const KIND_LABEL = {
  s: '航行', t: '交涉', f: '遭遇', m: '名场面', b: 'BOSS',
};

/** 把 30 篇摊平成一条 119 章的线。 */
export const CHAPTERS = (() => {
  const out = [];
  ARCS.forEach((arc, arcIndex) => {
    arc.chapters.forEach(([title, kind], index) => {
      const t = arc.chapters.length === 1 ? 0 : index / (arc.chapters.length - 1);
      const isBoss = kind === 'b';
      out.push({
        arcIndex,
        index,
        arcId: arc.id,
        arcName: arc.name,
        part: arc.part,
        title,
        kind,
        kindLabel: KIND_LABEL[kind] ?? '航行',
        isBoss,
        gate: Boolean(arc.gate),
        // 章内从 0.82 爬到 1.12，BOSS 再抬一截；门（gate）再高 50%。
        // 0.5.0 的 50% 是靠「三回合的回合加成算整场」这个 bug 撑住的，
        // 0.6 修了 bug 之后门确实变硬——但真正的保险是另外两件事：
        // 等级上限抬到 120（练级永远有路）和重试加价会衰减（不会被锁死）。
        // 所以这里保留 50%：墙该是墙，只是现在撞墙的人有别的办法。
        power: Math.max(6, Math.round(arc.power * (isBoss ? (arc.gate ? 1.5 : 1.2) : 0.82 + 0.3 * t))),
        boss: arc.boss,
        island: arc.island,
        no: out.length + 1,
      });
    });
  });
  return out;
})();

export const TOTAL_CHAPTERS = CHAPTERS.length;

export function chapterAt(globalIndex) {
  return CHAPTERS[Math.max(0, Math.min(TOTAL_CHAPTERS - 1, globalIndex))];
}

/**
 * 推完这一章，船开去下一个岛要多久（分钟，真实时间）。
 *
 * 0.9 之前点一下就到下一章，一个晚上能从风车村点到阿拉巴斯坦——
 * 剧情是一个字一个字写的，不该被点成一串数字。
 * 普通章节 5~9 分钟，BOSS 章 9~13 分钟，越往后海域越大。
 * 这是唯一一条「不能靠攒资源跳过」的节奏，所以给了一个花钱的加速阀（见 world.rushSail）。
 */
export function sailDelayMin(chapter) {
  const no = chapter?.no ?? 1;
  return (chapter?.isBoss ? 9 : 5) + Math.min(4, Math.floor(no / 30));
}

export function partLabel(partId) {
  return PARTS.find((p) => p.id === partId)?.label ?? '';
}

/**
 * 船随剧情换样：小帆船 → 梅丽号 → 阳光号 → 巨人战船。
 * 档次不由玩家买，走到那一章自己就换了；能花钱的是六个部件（见 ship.js）。
 */
export const SHIPS = SHIP_TIERS;

export function shipOf(state) {
  const chapterNo = Math.min(TOTAL_CHAPTERS, (state.campaign?.done ?? 0) + 1);
  const current = shipTierByChapter(chapterNo);
  const next = SHIP_TIERS.find((s) => s.fromChapter > chapterNo) ?? null;
  return {
    tier: current.tier,
    name: current.name,
    note: current.note,
    nextName: next?.name ?? null,
    nextArc: next ? chapterAt(next.fromChapter - 1).arcName : null,
    nextChapter: next?.fromChapter ?? null,
  };
}

// ── 成长 ──────────────────────────────────────────────────────────────────

/**
 * 等级上限。119 章推完大约 Lv53（只走主线），带上自由航海和修行也就 58~62，
 * 留十几级给练级党。0.8 时代这个数是 120，结局直接顶到 92 级——
 * 数字大得像另一部漫画。
 */
export const LEVEL_CAP = 75;

/**
 * 升级所需经验。
 *
 * 0.8 是纯线性 `45 + 5.5L`，而章节经验是 `60 + 1.15n`，两条线斜率比正好 4.8，
 * 于是**等级 ≈ 章号**：35 章 = Lv31，119 章 = Lv79。等级不是长出来的，是走过场。
 *
 * 现在加了二次项：前期还是 1 章 1 级（新手要有快感），
 * 中段 2~3 章一级，终局 4~5 章一级。35 章 Lv24，119 章 Lv53。
 */
export function expNeed(level) {
  return Math.round(45 + 5.5 * level + 0.2 * level * level);
}

/** 升到 level 级一共要多少经验（含前面所有级）。老档换算用得上。 */
export function expToReach(level) {
  let total = 0;
  for (let l = 1; l < level; l++) total += expNeed(l);
  return total;
}

export function levelFromExp(totalExp) {  let level = 1;
  let rest = Math.max(0, Math.round(totalExp));
  while (level < LEVEL_CAP && rest >= expNeed(level)) {
    rest -= expNeed(level);
    level += 1;
  }
  return { level, exp: rest };
}

export function grantExp(state, amount) {
  const gain = Math.max(0, Math.round(amount));
  if (!gain) return { gained: 0, levels: 0 };
  const before = state.level?.value ?? 1;
  const total = (state.level?.total ?? 0) + gain;
  const { level, exp } = levelFromExp(total);
  state.level = { value: level, exp, total, need: expNeed(level) };
  return { gained: gain, levels: level - before };
}

/** 按「一路推到第 N 章」算，这时候该是几级。老档升级用。 */
export function levelForProgress(done) {
  let total = 0;
  for (let n = 1; n <= Math.min(done, TOTAL_CHAPTERS); n++) {
    const ch = chapterAt(n - 1);
    total += chapterExp(n, 1, ch.isBoss);
  }
  return levelFromExp(total).level;
}

/**
 * 自由航海也能练级，但一趟只给 0.18 级的经验——约等于半章。
 * 0.8 时这里是 0.55 级，一趟「跑一趟」按钮能顶两章，点 20 下就是 +11 级，
 * 那才是「战力升得太快」真正的漏洞。现在一天最多六趟，最多 +1.1 级。
 */
export const FREE_SAIL_DAY = 6;

export function expFromFreeSail(state) {
  return Math.round(40 + expNeed(state.level?.value ?? 1) * 0.18);
}

// ── 结算 ──────────────────────────────────────────────────────────────────

export const OUTCOMES = {
  great: { label: '碾压', exp: 1.25, berries: 1.35, bounty: 1.4, hull: 0 },
  success: { label: '胜', exp: 1, berries: 1, bounty: 1, hull: -4 },
  narrow: { label: '惨胜', exp: 0.8, berries: 0.7, bounty: 0.8, hull: -14 },
  failed: { label: '败走', exp: 0.05, berries: -0.15, bounty: 0.05, hull: -28 },
  captured: { label: '被俘', exp: 0.02, berries: -0.3, bounty: 0, hull: -22 },
};

export function outcomeOf(ratio) {
  if (ratio >= 1.6) return 'great';
  if (ratio >= 1.15) return 'success';
  if (ratio >= 0.95) return 'narrow';
  if (ratio >= 0.7) return 'failed';
  return 'captured';
}

export function progressOf(state) {
  const done = state.campaign?.done ?? 0;
  const chapter = chapterAt(done);
  const arcChapters = ARCS[chapter.arcIndex].chapters.length;
  return {
    done,
    total: TOTAL_CHAPTERS,
    arcIndex: chapter.arcIndex,
    arcNo: chapter.arcIndex + 1,
    arcName: chapter.arcName,
    partLabel: partLabel(chapter.part),
    chapterNo: chapter.index + 1,
    chapterCount: arcChapters,
    chapterTitle: chapter.title,
    kind: chapter.kind,
    kindLabel: chapter.kindLabel,
    power: chapterPowerOf(chapter, campaignAttempts(state)),
    basePower: chapterPower(chapter),
    gate: Boolean(chapter.gate),
    attempts: campaignAttempts(state),
    boss: chapter.boss,
    isBoss: chapter.isBoss,
    progress: done / TOTAL_CHAPTERS,
    arcProgress: chapter.index / Math.max(1, arcChapters - 1),
    completed: done >= TOTAL_CHAPTERS,
  };
}

/**
 * 同一道门反复硬打，对方会摸清套路：每失败一次 +8%，最多 +24%。
 *
 * v0.6 补了另一半：**这个加价会松**。隔三天没去打，attempts 归零。
 * 没有这一半的话，「等级到顶 + 打不过 + 越打越难」就是死锁——
 * 只推主线的人会在最后一关前面永远动不了。
 */
export const HARDEN_DECAY_DAYS = 3;

export function hardenOf(chapter, attempts = 0) {
  return chapter.gate ? 1 + 0.08 * Math.min(3, attempts) : 1;
}

/** 现在还算数的失败次数。隔太久了就不算了。 */
export function campaignAttempts(state) {
  const attempts = state.campaign?.attempts ?? 0;
  if (!attempts) return 0;
  const day = state.day ?? 1;
  const last = state.campaign?.attemptDay ?? day;
  return day - last >= HARDEN_DECAY_DAYS ? 0 : attempts;
}

/** 面板和战斗都用这一个：章节实际要多少战力。 */
export function chapterPowerOf(chapter, attempts = 0) {
  return Math.round(chapterPower(chapter) * hardenOf(chapter, attempts));
}

/**
 * 一章给多少经验。只看「走到第几章」，**不跟难度挂钩**。
 * 之前是 (20 + 1.2×难度)，难度一涨经验跟着涨，等级永远追平难度——
 * 结果就是一路推主线战力永远够，自由航海变成摆设。
 */
export const EXP_BASE = 60;
export const EXP_SLOPE = 1.15;

export function chapterExp(no, mul = 1, isBoss = false) {
  return Math.round((EXP_BASE + EXP_SLOPE * no) * mul * (isBoss ? 2.4 : 1));
}

// ── 赏金 ────────────────────────────────────────────────────────────────

/**
 * 悬赏不是「打一场加一笔」，是「海军给你定多少」。
 *
 * 0.8 之前是 `难度 × 24 万` 累加：难度线性涨，累计就成了二次曲线，
 * 第 1 章给 264 万，到阿拉巴斯坦已经是 8.66 亿（原作 1 亿），
 * 打完比罗杰还高。悬赏是这本书里最不该通胀的数字。
 *
 * 现在只有 BOSS 章才「上一份新悬赏令」，而且是绝对值：
 * 打穿阿龙那一刻，从 70 万直接跳到 3000 万——里程碑要有声音。
 * 小章节给的零花钱按章号从 5 万爬到 15 万，全程加起来不到 900 万。
 */
export const BOUNTY_MILESTONES = {
  dawn: 300_000,
  orange: 800_000,
  syrup: 1_500_000,
  baratie: 4_000_000,
  arlong: 30_000_000,
  loguetown: 35_000_000,
  reverse: 36_000_000,
  whisky: 38_000_000,
  littlegarden: 42_000_000,
  drum: 50_000_000,
  alabasta: 100_000_000,
  jaya: 105_000_000,
  skypiea: 120_000_000,
  longring: 122_000_000,
  water7: 135_000_000,
  enies: 300_000_000,
  thriller: 310_000_000,
  sabaody: 320_000_000,
  amazon: 330_000_000,
  impel: 350_000_000,
  marineford: 400_000_000,
  fishman: 410_000_000,
  punk: 430_000_000,
  dressrosa: 500_000_000,
  zou: 510_000_000,
  wholecake: 1_500_000_000,
  wano: 3_000_000_000,
  eggy: 3_200_000_000,
  elbaph: 3_400_000_000,
  laugh: 5_000_000_000,
};

export function bountyMilestoneOf(chapter) {
  return BOUNTY_MILESTONES[chapter?.arcId] ?? 0;
}

/** 普通章节的零花钱：第 1 章 5 万，最后一章 15 万。 */
export function bountyTip(no = 1) {
  const t = Math.min(1, Math.max(0, no / TOTAL_CHAPTERS));
  return Math.round((50_000 + 100_000 * t) / 1e4) * 1e4;
}

/** 把结果落成具体奖励。clear 之后才给满额；败走只给一点点经验。 */
export function rewardsOf(state, chapter, outcome) {
  const rule = OUTCOMES[outcome];
  const bossMul = chapter.isBoss ? 3 : 1;
  const exp = chapterExp(chapter.no ?? 1, rule.exp, chapter.isBoss);
  const berries = Math.round(chapter.power * 4200 * rule.berries * bossMul / 1000) * 1000;

  const cleared = outcome !== 'failed' && outcome !== 'captured';
  let bounty = 0;
  let milestone = false;
  if (chapter.isBoss) {
    if (cleared) {
      const now = state?.captain?.bounty ?? 0;
      const target = bountyMilestoneOf(chapter);
      // 已经比这一档高了（刷自由航海刷上去的），就给一点确认费，别让这一章白打。
      bounty = target > now ? target - now : 200_000;
      milestone = true;
    }
  } else {
    bounty = Math.round(bountyTip(chapter.no ?? 1) * rule.bounty);
  }
  return { exp, berries, bounty, milestone };
}

