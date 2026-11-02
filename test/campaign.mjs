/**
 * 剧情线：119 章能不能走完，门会不会卡死，反复硬打会不会变简单。
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import DEF from '../src/index.js';
import { chapterAt, TOTAL_CHAPTERS, hardenOf } from '../src/campaign.js';
import { powerOf } from '../src/collect.js';

const dir = mkdtempSync(join(tmpdir(), 'onepiece-campaign-'));
const host = { log: { info() {}, warn() {}, debug() {} }, pushEvent: async (e) => e };
const ctx = {
  id: 'onepiece', cfg: { ...DEF.defaults(), auto: false }, timezone: 'Asia/Shanghai', botName: '可颂',
  botDir: dir, packageDir: dir, dataDir: dir, repoRoot: dir,
  secret: () => '', storeSecret() {}, persist() {}, restart: async () => {},
};


/** 打不过的时候把手里有的先花掉：一次只升一样，模拟人在点按钮。 */
function spendOnce(world) {
  const s = world.state;
  for (const part of world.payload().ship.parts) {
    if (!part.maxed && part.canPay) return world.upgradePart(part.id).ok;
  }
  for (const blade of world.payload().gears.blades) {
    if (blade.canBuy) return world.buyBlade(blade.id).ok;
  }
  for (const h of world.payload().haki) {
    if (h.canLearn) return world.learnHaki(h.id).ok;
  }
  return false;
}

try {
  const world = DEF.create(ctx);
  await world.start(host);
  const s = world.state;

  const tally = {};
  let steps = 0;
  let grinds = 0;
  while (s.campaign.done < TOTAL_CHAPTERS && steps < 800) {
    steps += 1;
    // 船散架了先修；修不起就先去赚钱（这是自由航海的第二个用途）
    if (s.captain.hull <= 0) {
      const fix = world.repair(true);
      if (!fix.ok) { world.applyFreeSail(1); grinds += 1; continue; }
    }
    const p = world.payload().campaign;
    // 打不过的时候先想别的办法：改装、买刀、练霸气、练级，顺序就是这么排的。
    if (powerOf(s) / p.power < 1.0) {
      if (!spendOnce(world)) {
        grinds += 1;
        world.applyFreeSail(1);
        continue;
      }
    }
    const before = s.campaign.done;
    const out = world.applyChapter();
    tally[out.outcomeLabel] = (tally[out.outcomeLabel] ?? 0) + 1;
    assert.ok(s.campaign.done === before || s.campaign.done === before + 1, '进度一次只能动一格');
    if (!out.cleared) assert.equal(s.campaign.done, before, '没过却推进了进度');
    assert.ok(Number.isFinite(s.captain.bounty) && s.captain.bounty > 0, '赏金变成 NaN 了');
    assert.ok(Number.isFinite(s.level.value) && s.level.value >= 1, '等级变成 NaN 了');
    assert.ok(s.captain.hull >= 0 && s.captain.hull <= 100, `船体越界：${s.captain.hull}`);
  }

  assert.equal(s.campaign.done, TOTAL_CHAPTERS, `只走到 ${s.campaign.done}/${TOTAL_CHAPTERS}`);
  assert.ok(steps < 260, `走完全程用了 ${steps} 步，太磨了`);
  assert.ok(grinds >= 8, `只练级 ${grinds} 次——自由航海还是没用`);
  // 0.9.0 把升级曲线拉陡了：119 章走完大约 Lv53~60，上限 75。
  assert.ok(s.level.value >= 40 && s.level.value <= 75, `收尾等级不对：${s.level.value}`);
  assert.ok(s.captain.bounty > 20e8, `收尾赏金太低：${(s.captain.bounty / 1e8).toFixed(2)} 亿`);
  assert.ok(s.log.length <= 40, '日志没有截断');

  const last = chapterAt(TOTAL_CHAPTERS - 1);
  assert.equal(last.arcName, '拉夫德鲁');
  assert.equal(last.kind, 'b');

  // 战力被拉开时，败走不推进，也不清空
  const weak = DEF.create({ ...ctx, dataDir: mkdtempSync(join(tmpdir(), 'onepiece-weak-')) });
  await weak.start(host);
  weak.state.campaign.done = 60;
  weak.state.level = { value: 1, exp: 0, total: 0, need: 1 };
  const beforeDone = weak.state.campaign.done;
  const beforeBerries = weak.state.captain.berries;
  const bad = weak.applyChapter();
  assert.equal(bad.cleared, false, '1 级不该打过第 61 章');
  assert.equal(weak.state.campaign.done, beforeDone, '败走却推进了');
  assert.ok(weak.state.captain.berries <= beforeBerries, '败走不该赚钱');
  await weak.stop();

  // 门：第一下可能靠运气过，但硬打第二次开始越来越难
  const gate = chapterAt(55); // 司法岛 BOSS
  assert.ok(gate.gate, '第 56 章应该是门');
  assert.equal(hardenOf(gate, 0), 1);
  assert.ok(hardenOf(gate, 1) > 1.05, '失败一次之后难度没涨');
  assert.equal(hardenOf(gate, 3), hardenOf(gate, 9), '难度应该有上限');

  const gateWorld = DEF.create({ ...ctx, dataDir: mkdtempSync(join(tmpdir(), 'onepiece-gate-')) });
  await gateWorld.start(host);
  gateWorld.state.campaign.done = 55;
  gateWorld.state.level = { value: 44, exp: 0, total: 0, need: 1 };
  gateWorld.state.captain.hull = 100;
  const powers = [];
  for (let i = 0; i < 3; i++) {
    gateWorld.applyChapter();
    powers.push(gateWorld.payload().campaign.power);
  }
  assert.ok(powers[2] > powers[0], '连打三次，这一章没有变难');
  await gateWorld.stop();

  await world.stop();
  console.log(`campaign ok: ${steps} 步走完 119 章 / Lv${s.level.value} / ${(s.captain.bounty / 1e8).toFixed(1)} 亿 / 练级 ${grinds} 次 / ${JSON.stringify(tally)}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
