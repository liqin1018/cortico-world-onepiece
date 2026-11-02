/**
 * 剧情事件：不可逆的那几件。纯数据 + 几个只改 state 的小函数。
 *
 * 这里放两种东西：
 *  1. 历史正文四块——每块从一个特定篇章的 BOSS 身上掉，凑齐解锁隐藏挑战。
 *  2. 梅丽号。司法岛之后它沉了，换阳光号。不能拒绝，也没有选项，
 *     这是全篇唯一一个「你没得选」的桥段——所以它不该做成抉择卡，
 *     而应该是一张读完就收起来的纸。
 *
 * 为什么不做成 CHOICES 里的一个选项：选项的意思是「你可以不这样」。
 * 梅丽号不是选项。
 */
import { chapterAt, TOTAL_CHAPTERS, chapterPowerOf } from './campaign.js';
import { expectedMul } from './collect.js';

// ── 历史正文 ────────────────────────────────────────────────────────────

/**
 * from 是掉落的篇章 id。四块分别在：阿拉巴斯坦的地下、空岛的黄金钟、
 * 鱼人岛的森之海、和之国的光月——和原作一致。
 */
export const PONEGLYPHS = [
  {
    id: 'alabasta', from: 'alabasta', name: '地下的石碑', where: '阿拉巴斯坦 · 王家墓室',
    line: '石头埋在沙下面，字是刻进去的，不是写上去的。',
    text: '「……其一，指向海之尽头。」',
  },
  {
    id: 'skypiea', from: 'skypiea', name: '黄金钟下的石碑', where: '空岛 · 黄金钟',
    line: '钟响的时候，整片云海都在抖，石头上的字也在抖。',
    text: '「……其二，指向鲸鱼与月亮。」',
  },
  {
    id: 'fishman', from: 'fishman', name: '森之海的石碑', where: '鱼人岛 · 海之森',
    line: '一万米以下，光很慢，字看得很清楚。',
    text: '「……其三，指向被抹去的名字。」',
  },
  {
    id: 'wano', from: 'wano', name: '光月的石碑', where: '和之国 · 光月家',
    line: '石头上有一道刀痕，是有人想毁掉它，没成功。',
    text: '「……其四，指向约定的那一天。」',
  },
];

export function poneglyphById(id) {
  return PONEGLYPHS.find((p) => p.id === id) ?? null;
}

export function poneglyphOfArc(arcId) {
  return PONEGLYPHS.find((p) => p.from === arcId) ?? null;
}

// ── 梅丽号 ──────────────────────────────────────────────────────────────

/** 打完这一篇的 BOSS 就触发。之后甲板上换人了，但她会一直被提起。 */
export const MERRY_EVENT = {
  id: 'merry',
  afterArc: 'enies',
  title: '梅丽号',
  kicker: '司法岛之后',
  lines: [
    '她是在回程的路上断的。第一块板从船底开始，然后是龙骨。',
    '船匠说了一句「修不好了」，没有人接话。',
    '然后海面上有声音——那艘小船自己漂过来了，明明没有人掌舵。',
    '它把所有人接上船，然后停在原地，再也没有动。',
    '他们在海上点了一把火。火烧到桅杆的时候，风忽然停了一下。',
  ],
  note: '从今往后是阳光号。船体修满。',
  /** 永久效果写在 battle.js 里：被俘不再额外扣船体。 */
  boon: '梅丽的护佑：被俘时不再额外损失船体',
};

// ── 隐藏章：空白的一百年 ───────────────────────────────────────────────

export const VOID_NO = TOTAL_CHAPTERS + 1;
export const VOID_TITLE = '空白的一百年';
export const VOID_BOSS = '乔伊波伊';

/**
 * 四块凑齐才开。难度取「最后一章 ×1.18」——比全篇任何一章都硬，
 * 但不至于硬到只有把收藏做满的人才打得过。
 *
 * 这里用 power 反推：chapterPowerOf 会乘 expectedMul，所以先把目标值除回去，
 * 这样无论以后怎么调难度表，隐藏章都稳定地「比结局高 18%」。
 */
export function voidChapter() {
  const last = chapterAt(TOTAL_CHAPTERS - 1);
  const target = Math.round(chapterPowerOf(last) * 1.18);
  const mul = expectedMul(VOID_NO);
  return {
    arcIndex: last.arcIndex,
    index: 0,
    arcId: 'void',
    arcName: '拉夫德鲁',
    part: last.part,
    title: VOID_TITLE,
    kind: 'b',
    kindLabel: '隐藏章',
    isBoss: true,
    gate: true,
    power: Math.max(1, Math.round(target / mul)),
    boss: VOID_BOSS,
    island: '拉夫德鲁',
    no: VOID_NO,
  };
}

export function voidPower() {
  return chapterPowerOf(voidChapter(), 0);
}

// ── 存档形状与结算 ──────────────────────────────────────────────────────

export function storyDefaults() {
  return {
    merryBurned: false,
    poneglyphs: [],
    voidUnlocked: false,
    voidDone: false,
    voidTries: 0,
    pending: null,
  };
}

export function storyOf(state) {
  return { ...storyDefaults(), ...(state.story ?? {}) };
}

/**
 * 打完一章之后调用。返回这一章「额外发生的事」，没有就是空对象。
 * 只改 state，不碰别的模块——掉落和奖励还在 battle.js 里。
 */
export function storyOnClear(state, chapter) {
  const story = { ...storyDefaults(), ...(state.story ?? {}) };
  const out = { poneglyph: null, merry: false, voidUnlocked: false, notes: [] };

  // 四块石碑：打这一篇的 BOSS 必掉。
  if (chapter?.isBoss) {
    const stone = poneglyphOfArc(chapter.arcId);
    if (stone && !story.poneglyphs.includes(stone.id)) {
      story.poneglyphs = [...story.poneglyphs, stone.id];
      state.training = (state.training ?? 0) + 2;
      out.poneglyph = stone;
      out.notes.push(`历史正文「${stone.name}」（修行点 +2）`);
    }
  }

  // 梅丽号：司法岛之后，没有选项。
  if (chapter?.isBoss && chapter.arcId === MERRY_EVENT.afterArc && !story.merryBurned) {
    story.merryBurned = true;
    story.pending = MERRY_EVENT.id;
    if (state.captain) state.captain.hull = 100;
    out.merry = true;
    out.notes.push('梅丽号沉了，换乘阳光号（船体修满）');
  }

  if (story.poneglyphs.length >= PONEGLYPHS.length && !story.voidUnlocked) {
    story.voidUnlocked = true;
    out.voidUnlocked = true;
    out.notes.push('四块历史正文凑齐了：拉夫德鲁的海面上多了一条路');
  }

  state.story = story;
  return out;
}

/** 面板用的一份快照。 */
export function storyPayload(state) {
  const story = storyOf(state);
  const have = new Set(story.poneglyphs);
  return {
    merryBurned: story.merryBurned,
    pending: story.pending ?? null,
    poneglyphs: PONEGLYPHS.map((p) => ({
      id: p.id, name: p.name, where: p.where, line: p.line, text: p.text,
      on: have.has(p.id),
    })),
    count: story.poneglyphs.length,
    total: PONEGLYPHS.length,
    voidUnlocked: story.voidUnlocked,
    voidDone: story.voidDone,
    voidTries: story.voidTries ?? 0,
    voidPower: voidPower(),
    voidTitle: VOID_TITLE,
    voidBoss: VOID_BOSS,
  };
}
