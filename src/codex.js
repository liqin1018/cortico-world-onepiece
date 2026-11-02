/**
 * 图鉴。算出来的，不存。
 *
 * 存档里只存「你做过什么」（去过的岛、上船的人、拿到的刀、做过的选择），
 * 图鉴是这些事实的一个视图——所以它永远不会和存档对不上，
 * 也不会因为改了图鉴的写法就要迁移老档。
 */
import { ARCS, TOTAL_CHAPTERS } from './campaign.js';
import { CREW } from './crew.js';
import { BLADES, FRUITS } from './gear.js';
import { SCENES } from './choices.js';
import { PONEGLYPHS, storyOf } from './story.js';

/** 每一篇的最后一章，用来判断「这个 BOSS 打过没有」。 */
export const ARC_END = (() => {
  const out = {};
  let n = 0;
  for (const arc of ARCS) {
    n += arc.chapters.length;
    out[arc.id] = n;
  }
  return out;
})();

function islandSeen(state, theme, island) {
  const list = state.captain?.explored ?? [];
  return list.includes(island.id) || list.includes(island.name);
}

export function codexOf(state, theme) {
  const done = state.campaign?.done ?? 0;
  const crew = new Set((state.crew ?? []).map((m) => m.id));
  const blades = new Set(state.gears?.blades ?? []);
  const fruits = new Set([...(state.gears?.fruits ?? []), state.gears?.fruit].filter(Boolean));
  const choices = state.choices ?? {};

  const islands = (theme?.islands ?? []).map((island) => ({
    id: `island:${island.id}`,
    name: island.name,
    sub: island.region,
    on: islandSeen(state, theme, island),
  }));

  const people = [
    ...CREW.map((c) => ({
      id: `crew:${c.id}`,
      name: c.short,
      sub: '同伴',
      on: crew.has(c.id),
    })),
    ...ARCS.map((arc) => ({
      id: `boss:${arc.id}`,
      name: arc.boss,
      sub: arc.name,
      on: done > (ARC_END[arc.id] ?? TOTAL_CHAPTERS),
    })),
  ];

  const bladeRows = BLADES.map((b) => ({
    id: `blade:${b.id}`,
    name: b.name,
    sub: b.grade,
    on: blades.has(b.id),
  }));

  const fruitRows = FRUITS.map((f) => ({
    id: `fruit:${f.id}`,
    name: f.name,
    sub: f.tag,
    on: fruits.has(f.id),
  }));

  const sceneRows = SCENES.map((s) => ({
    id: `scene:${s.id}`,
    name: s.title,
    sub: choices[s.id] ? '已走过' : '还没到',
    on: Boolean(choices[s.id]),
  }));

  const story = storyOf(state);
  const glyphRows = PONEGLYPHS.map((p) => ({
    id: `glyph:${p.id}`,
    name: p.name,
    sub: p.where,
    on: story.poneglyphs.includes(p.id),
  }));

  const eventRows = [
    { id: 'event:merry', name: '梅丽号', sub: '司法岛之后', on: story.merryBurned },
    { id: 'event:void', name: '空白的一百年', sub: '隐藏章', on: story.voidDone },
  ];

  const sections = [
    { id: 'island', label: '岛屿', items: islands },
    { id: 'people', label: '人物', items: people },
    { id: 'blade', label: '名刀', items: bladeRows },
    { id: 'fruit', label: '果实', items: fruitRows },
    { id: 'scene', label: '名场面', items: sceneRows },
    { id: 'glyph', label: '历史正文', items: glyphRows },
    { id: 'event', label: '事件', items: eventRows },
  ].map((s) => ({
    ...s,
    on: s.items.filter((i) => i.on).length,
    total: s.items.length,
  }));

  const on = sections.reduce((n, s) => n + s.on, 0);
  const total = sections.reduce((n, s) => n + s.total, 0);
  const percent = total ? on / total : 0;
  // 100% 单独给一档：之前 floor(0.999×4)=3，最后那一格永远差一点，很别扭。
  const milestone = percent >= 1 ? 4 : Math.min(3, Math.floor(percent * 4));
  return { sections, on, total, percent, milestone };
}

/**
 * 图鉴每过 25% 给一次东西。只在跨过门槛的那一次给，
 * 所以这里要拿「上次给的档位」比一比。
 */
export const CODEX_REWARDS = [
  { at: 1, training: 3, material: { wood: 4, iron: 2 } },
  { at: 2, training: 4, material: { rare: 2 } },
  { at: 3, training: 6, material: { rare: 3 } },
  { at: 4, training: 8, material: { rare: 5, iron: 6 } },
];

export function claimCodex(state, theme) {
  const cx = codexOf(state, theme);
  const have = state.codexTier ?? 0;
  if (cx.milestone <= have) return { cx, gained: null };
  state.codexTier = cx.milestone;
  const reward = CODEX_REWARDS[cx.milestone - 1];
  const notes = [];
  if (reward?.training) {
    state.training = (state.training ?? 0) + reward.training;
    notes.push(`修行点 +${reward.training}`);
  }
  for (const [id, n] of Object.entries(reward?.material ?? {})) {
    state.materials = state.materials ?? {};
    state.materials[id] = (state.materials[id] ?? 0) + n;
    notes.push(`${id === 'rare' ? '稀有材料' : id === 'wood' ? '木材' : '铁材'} ×${n}`);
  }
  return { cx, gained: { tier: cx.milestone, notes } };
}

/** 面板要的一段话：图鉴现在几成。 */
export function codexLine(state, theme) {
  const cx = codexOf(state, theme);
  return `图鉴 ${Math.round(cx.percent * 100)}%（${cx.on}/${cx.total}）`;
}
