/** 把 60 天连着跑一遍，看数值、日志、榜单和存档会不会崩。 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import DEF from '../src/index.js';
import { createState } from '../src/state.js';
import { settleVoyage } from '../src/sea.js';
import { themeOf } from '../src/theme/index.js';
import { hashString, mulberry32 } from '../src/rng.js';

const dir = mkdtempSync(join(tmpdir(), 'onepiece-sim-'));
const events = [];
const host = {
  log: { info() {}, warn() {}, debug() {} },
  pushEvent: async (e) => { events.push(e); return e; },
};

const ctx = (cfg) => ({
  id: 'onepiece', cfg, timezone: 'Asia/Shanghai', botName: 'Coo',
  botDir: dir, packageDir: dir, dataDir: dir, repoRoot: dir,
  secret: () => '', storeSecret() {}, persist() {}, restart: async () => {},
});

try {
  const cfg = { ...DEF.defaults(), voyageMinutes: 1 };
  const world = DEF.create(ctx(cfg));
  await world.start(host);

  const days = 60;
  for (let n = 0; n < days; n++) {
    if (world.state.blockedUntil) {
      world.state.blockedUntil = new Date(Date.now() - 1000).toISOString();
      await world.tick();
    }
    const before = world.state.day;
    const text = world.sailText((n % 3) + 1);
    assert.ok(world.state.voyage, `第 ${n + 1} 趟没起航：${text}`);
    world.state.voyage.endsAt = new Date(Date.now() - 1000).toISOString();
    await world.tick();
    assert.equal(world.state.day, before + 1, '每趟只该过一天');
    assert.ok(Number.isFinite(world.state.captain.bounty), '赏金变成了 NaN');
    // 0.9 起悬赏从 0 开始涨，地板就是 0：一条航线只值十几万，别再按老档的 500 万兜底。
    assert.ok(world.state.captain.bounty >= 0, '赏金变成负数');
    assert.ok(world.state.captain.hull >= 0 && world.state.captain.hull <= 100, '船体越界');
    assert.ok(world.state.captain.berries >= 0, '银币是负数');
    assert.ok(world.state.log.length <= 40, '日志没有截断');
    const rank = world.payload().rank;
    assert.ok(rank >= 1 && rank <= cfg.npcCount + 1, `名次越界：${rank}`);
  }

  assert.equal(world.state.day, days + 1);
  assert.ok(events.length >= days, `事件比航次还少：${events.length}`);
  for (const e of events) {
    assert.ok(e.text.length > 0 && e.text.length < 600, `事件太长：${e.text.length}`);
    assert.equal(e.origin, 'internal');
  }

  const payload = world.payload();
  assert.equal(payload.routes.length, 3);
  assert.equal(payload.log.length, 8);
  assert.ok(payload.captain.bountyText.includes('万') || payload.captain.bountyText.includes('亿'));

  const dayAfter = world.state.day;
  await world.stop();

  const again = DEF.create(ctx(cfg));
  await again.start(host);
  assert.equal(again.state.day, dayAfter, '重启后进度丢了');
  assert.equal(again.state.captain.bounty, world.state.captain.bounty);
  await again.stop();

  const d2 = mkdtempSync(join(tmpdir(), 'onepiece-sim2-'));
  const ctx2 = { ...ctx(cfg), dataDir: d2 };
  const alt = DEF.create({ ...ctx2, cfg: { ...cfg, theme: 'original' } });
  await alt.start(host);
  assert.equal(alt.theme.sea, '无风带');
  const altNames = new Set(themeOf('original').islands.map((i) => i.name));
  for (const r of alt.payload().routes) assert.ok(altNames.has(r.islandName), `跑错主题的岛：${r.islandName}`);
  await alt.stop();
  rmSync(d2, { recursive: true, force: true });

  assert.equal(world.state.npcs.length, 60, '名单应全部上榜');
  const roger = world.state.npcs.find((n) => n.name === '哥尔·D·罗杰');
  assert.equal(roger.bounty, 5_564_800_000, '罗杰的赏金被改动了');
  const beforeRoger = roger.bounty;
  if (world.state.blockedUntil) {
    world.state.blockedUntil = new Date(Date.now() - 1000).toISOString();
    await world.tick();
  }
  world.sailText(1);
  assert.ok(world.state.voyage, '第 61 趟没起航');
  world.state.voyage.endsAt = new Date(Date.now() - 1000).toISOString();
  await world.tick();
  assert.equal(roger.bounty, beforeRoger, '原作角色的赏金不该漂移');

  const d3 = mkdtempSync(join(tmpdir(), 'onepiece-sim-'));
  const quick = DEF.create({ ...ctx({ ...cfg, sim: true }), dataDir: d3 });
  await quick.start(host);
  const quickDay = quick.state.day;
  await quick.sailAction(1);
  assert.equal(quick.state.day, quickDay + 1, '模拟模式下起航没有立刻结算');
  assert.equal(quick.state.voyage, null, '模拟模式还留着在航的船');
  await quick.stop();
  rmSync(d3, { recursive: true, force: true });

  const d4 = mkdtempSync(join(tmpdir(), 'onepiece-finish-'));
  const manual = DEF.create({ ...ctx(cfg), dataDir: d4 });
  await manual.start(host);
  manual.sailText(1);
  assert.ok(manual.state.voyage);
  const done = await manual.finish();
  assert.equal(done.ok, true);
  assert.equal(manual.state.voyage, null, '收航没有结算');
  await manual.stop();
  rmSync(d4, { recursive: true, force: true });

  const s = createState({ botName: 'Coo', themeId: 'onepiece', npcCount: 12 });
  const risk = 3;
  const captAt = 0.04 + risk * 0.008;
  const failAt = captAt + 0.12 + risk * 0.01;
  const narrowAt = failAt + 0.22;
  const seen = new Set();
  for (let seed = 0; seed < 4000; seed++) {
    const roll = mulberry32(hashString(String(seed)) >>> 0)();
    seen.add(roll < captAt ? 'captured' : roll < failAt ? 'failed' : roll < narrowAt ? 'narrow' : roll > 0.9 ? 'great' : 'success');
  }
  assert.deepEqual([...seen].sort(), ['captured', 'failed', 'great', 'narrow', 'success'], '有结果分支永远抽不到');

  let captured = null;
  for (let seed = 0; seed < 5000; seed++) {
    const roll = mulberry32(hashString(String(seed)) >>> 0)();
    if (roll < captAt) { captured = seed; break; }
  }
  const theme = themeOf('onepiece');
  const before = { berries: s.captain.berries, bounty: s.captain.bounty };
  s.voyage = {
    routeId: 'test', islandId: 'alabasta', islandName: '阿拉巴斯坦', kindId: 'raid',
    kindLabel: '商路袭击', crime: '劫掠商船', act: '抢了一支商船队', risk,
    minutes: 90, startedAt: new Date().toISOString(), endsAt: new Date().toISOString(), themeId: 'onepiece',
  };
  const res = settleVoyage(s, theme, Date.now(), captured);
  assert.equal(res.entry.outcome, 'captured');
  assert.ok(s.blockedUntil, '被俘之后没有押送时间');
  assert.ok(s.captain.berries < before.berries, '被俘没有损失');
  assert.ok(s.captain.bounty >= before.bounty, '被俘不该掉赏金');

  console.log(`sim ok: ${days} 趟 / ${events.length} 条事件 / 赏金 ${world.payload().captain.bountyText} / 名次 ${world.payload().rank}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
