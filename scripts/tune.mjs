/**
 * 数值调参台：跑两种玩家，看卡关点和收尾。
 *   rush  ：一路硬推，不练级，也不修船（船烂了照样打）
 *   smart ：打不过就自由航海；船烂到 30 以下先修
 * 用法：node scripts/tune.mjs
 */
import {
  ARCS, TOTAL_CHAPTERS, chapterAt, fightChapter, resolveChapter,
  expFromFreeSail, grantExp, chapterExp,
} from '../src/campaign.js';

const mk = () => ({
  seed: 12345,
  day: 1,
  level: { value: 1, exp: 0, total: 0, need: 45 },
  captain: { bounty: 30_000_000, berries: 300_000, hull: 100, deeds: 0, explored: [] },
  campaign: { done: 0, attempts: 0, bosses: 0 },
  npcs: [],
  log: [],
});

const repairCost = (hull) => Math.ceil((100 - hull) * 15_000 / 1000) * 1000;

function freeSail(s) {
  grantExp(s, expFromFreeSail(s));
  s.captain.berries += 160_000;
  s.day += 1;
}

function run(strategy, limit = 1200) {
  const s = mk();
  let steps = 0;
  let sails = 0;
  let fails = 0;
  let repairs = 0;
  let repairSpend = 0;
  const failAt = [];
  while (s.campaign.done < TOTAL_CHAPTERS && steps < limit) {
    if (strategy === 'smart' && s.captain.hull < 30) {
      const cost = repairCost(s.captain.hull);
      if (s.captain.berries < cost) { freeSail(s); sails += 1; steps += 1; continue; }
      s.captain.berries -= cost;
      repairSpend += cost;
      s.captain.hull = 100;
      repairs += 1;
      steps += 1;
      continue;
    }
    const ch = chapterAt(s.campaign.done);
    const ratio = fightChapter(s, ch, { roll: 0.5, attempts: s.campaign.attempts }).ratio;
    if (strategy === 'smart' && ratio < 1.0) {
      freeSail(s);
      sails += 1;
      steps += 1;
      continue;
    }
    const r = resolveChapter(s);
    steps += 1;
    if (!r.cleared) {
      fails += 1;
      failAt.push(`${ch.arcName}:${ch.title}(${r.outcomeLabel},r=${r.ratio.toFixed(2)})`);
    }
  }
  return {
    steps, sails, repairs, repairSpend, fails, done: s.campaign.done, lv: s.level.value,
    bounty: s.captain.bounty, berries: s.captain.berries, hull: s.captain.hull, failAt,
  };
}

const rush = run('rush');
const smart = run('smart');
const fmt = (r) => `steps ${r.steps} | 练级 ${r.sails} | 修船 ${r.repairs} 次`
  + ` | Lv ${r.lv} | 赏金 ${(r.bounty / 1e8).toFixed(2)}亿 | 余额 ${Math.round(r.berries / 1e4)}万`
  + ` | 败走 ${r.fails}`;
console.log('RUSH ', fmt(rush));
console.log('SMART', fmt(smart));
console.log('  败在:', [...new Set(rush.failAt.map((x) => x.split('(')[0]))].slice(0, 12).join(' / ') || '无');

// 每道门：BOSS 难度
const rows = [];
let cum = 0;
for (let i = 0; i < ARCS.length; i++) {
  const arc = ARCS[i];
  cum += arc.chapters.length;
  if (!arc.gate) continue;
  const boss = chapterAt(cum - 1);
  rows.push(`${String(i).padStart(2)} ${arc.name}：BOSS 难度 ${boss.power}`);
}
console.log('\n门（BOSS 难度）:\n' + rows.join('\n'));

console.log('\n收尾等级（不练级）约 Lv', (() => {
  let t = 0;
  let lv = 1;
  for (let n = 1; n <= TOTAL_CHAPTERS; n++) {
    const ch = chapterAt(n - 1);
    t += chapterExp(n, 1, ch.isBoss);
  }
  const need = (l) => 45 + 5.5 * l;
  while (t >= need(lv) && lv < 99) { t -= need(lv); lv += 1; }
  return lv;
})());
