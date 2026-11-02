/**
 * 海况测试：一天一个，不靠刷新重摇，也不许偷偷改主线。
 *
 * 天气是这套东西里唯一「玩家控制不了」的变量，所以它必须满足两条：
 *  1. 同一天读档、重开面板，结果一样；
 *  2. 它只能动自由航海，不能把主线变成看天吃饭。
 */
import assert from 'node:assert/strict';
import { WEATHERS, weatherOf, weatherById, weatherLine } from '../src/weather.js';

assert.equal(WEATHERS.length, 5, '海况档数变了要同步面板文案');

// 1) 每一档都得说得出话，数值也得是数
for (const w of WEATHERS) {
  assert.ok(w.id && w.name && w.note, `${w.id} 缺名字或描述`);
  for (const k of ['berry', 'damage', 'sail']) {
    assert.ok(Number.isFinite(w[k]) && w[k] > 0, `${w.name} 的 ${k} 不是正数`);
  }
  assert.ok(w.risk >= 0 && w.risk <= 1, `${w.name} 的风险加成过大，会把自由航海变成送死`);
  assert.ok(w.berry >= 0.8 && w.berry <= 1.3, `${w.name} 的收益浮动超出 ±30%`);
}

// 2) 同一天、同一个种子 → 同一个天气（读档不会重摇）
for (const key of ['2026-11-02', '2026-01-01', '2027-06-15']) {
  const a = weatherOf(424242, key);
  const b = weatherOf(424242, key);
  assert.equal(a.id, b.id, `${key} 的天气不稳定`);
}

// 3) 换日期确实会变，而且不是一天一换地循环两种
const seen = new Set();
for (let i = 0; i < 60; i++) seen.add(weatherOf(20261102, `2026-11-${i}`).id);
assert.ok(seen.size >= 3, `60 天里只出现 ${seen.size} 种天气，分布太差`);

// 4) 换种子也会变——重开一档不该沿用上辈子的天气
const bySeed = new Set();
for (let i = 0; i < 60; i++) bySeed.add(weatherOf(i * 7919, '2026-11-02').id);
assert.ok(bySeed.size >= 3, '不同存档在同一天应该有不同的海');

// 5) 顺风是「钱多、路短」，无风是「路长」，涌浪是「伤重」——方向不能反
const fair = weatherById('fair');
assert.ok(fair.berry > 1 && fair.sail < 1, '顺风该多赚少走');
const dead = weatherById('dead');
assert.ok(dead.sail > 1 && dead.berry < 1, '无风该多漂少吃');
const squall = weatherById('squall');
assert.ok(squall.damage > 1, '涌浪该更伤船');
assert.equal(weatherById('nope').id, 'calm', '认不出来的 id 要落到最温和的那档');

// 6) 状态行那两个字
assert.equal(weatherLine(fair), '今天顺风');
assert.equal(weatherLine(null), '');

console.log(`weather ok: ${WEATHERS.length} 档 / 同一天稳定 / 60 天 ${seen.size} 种 / 换种子会变`);
