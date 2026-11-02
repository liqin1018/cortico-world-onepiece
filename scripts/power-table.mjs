/**
 * 算难度表：先按「一路推、每章都过」算出等级轨迹，
 * 再把每篇的难度定在「该篇中段战力 ÷ 1.20」。
 * 门口的 BOSS 单独抬到 1.55，做出「打不过，先去练级」的墙。
 */
import { ARCS, expNeed, chapterExp } from '../src/campaign.js';

const GATES = new Set(['alabasta', 'skypiea', 'enies', 'marineford', 'cakesland', 'wano', 'laughtale']);

let total = 0;
let lv = 1;
let no = 0;
const rows = [];
for (let i = 0; i < ARCS.length; i++) {
  const arc = ARCS[i];
  const levels = [];
  for (let k = 0; k < arc.chapters.length; k++) {
    no += 1;
    const isBoss = arc.chapters[k][1] === 'b';
    const exp = chapterExp(no, 1, isBoss);
    total += exp;
    while (lv < 99 && total >= expNeed(lv)) { total -= expNeed(lv); lv += 1; }
    levels.push(lv);
  }
  const mid = levels[Math.floor(levels.length / 2)];
  const power = 10 + 3.2 * mid;
  rows.push({
    i, id: arc.id, name: arc.name, gate: GATES.has(arc.id),
    lvStart: levels[0], lvEnd: levels.at(-1),
    mid, playerPower: Math.round(power),
    arcPower: Math.round(power / 1.2),
  });
}

console.log('i  id             lv范围   中段Lv 战力  → 篇基准');
for (const r of rows) {
  console.log(
    String(r.i).padStart(2), r.id.padEnd(14), `${String(r.lvStart).padStart(2)}-${String(r.lvEnd).padStart(2)}`.padEnd(8),
    String(r.mid).padStart(4), String(r.playerPower).padStart(5), '→', String(r.arcPower).padStart(4),
    r.gate ? 'GATE' : '',
  );
}
console.log('\n收尾 Lv', lv, '（假设每章都过、不练级）');
console.log('\n可以直接贴进 ARCS 的 power：');
console.log(rows.map((r) => `${r.id}: ${r.arcPower}`).join('\n'));
