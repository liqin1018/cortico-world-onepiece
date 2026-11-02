/**
 * 授权测试：她到底能不能自己动手。
 *
 * 这一组只关心两件事：
 *  1. 开关关了，她一步也动不了（回绝要说得明白，不能装作做了）；
 *  2. 开关开了，她做的事和面板上点一下完全一样（花同样的钱、加同样的数值）。
 *
 * 顺带卡住两条底线：默认不许自己吃果实；自动挂机不许把家底一次花光。
 */
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import DEF from '../src/index.js';

const root = mkdtempSync(join(tmpdir(), 'op-act-'));
const host = { log: { info() {}, warn() {}, debug() {} }, pushEvent: async (e) => e };

function make(name, cfg = {}) {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  return DEF.create({
    id: 'onepiece',
    cfg: { ...DEF.defaults(), auto: false, notify: 'silent', ...cfg },
    timezone: 'Asia/Shanghai',
    botName: 'Coo',
    botDir: dir,
    packageDir: dir,
    dataDir: dir,
    repoRoot: dir,
    secret: () => '',
    storeSecret() {},
    persist() {},
    restart: async () => {},
  });
}

// ── 1. 默认值：只有吃果实是关着的 ─────────────────────────────────────────
{
  const w = make('default');
  await w.start(host);
  assert.equal(w.allowed('repair'), true);
  assert.equal(w.allowed('rest'), true);
  assert.equal(w.allowed('upgrade'), true);
  assert.equal(w.allowed('blade'), true);
  assert.equal(w.allowed('haki'), true);
  assert.equal(w.allowed('dispatch'), true);
  assert.equal(w.allowed('fruit'), false, '一辈子一颗的事，默认必须攥在主人手里');
  assert.equal(w.allowed('nope'), false, '不认识的键一律不许');
  await w.stop();
}

// ── 2. 关掉就是关掉：不许偷偷动手 ────────────────────────────────────────
{
  const w = make('deny', { allowRepair: false, allowUpgrade: false, allowFruit: false });
  await w.start(host);
  w.state.captain.hull = 20;
  const hull = w.state.captain.hull;
  const berries = w.state.captain.berries;

  const r = w.doAction('repair');
  assert.equal(r.ok, false);
  assert.equal(r.denied, true, '回绝要能被上层认出来');
  assert.match(r.message, /还没让我自己动/);
  assert.equal(w.state.captain.hull, hull, '回绝了就不该动船');
  assert.equal(w.state.captain.berries, berries, '回绝了就不该花钱');

  // 手里有果实也一样吃不了
  w.state.gears.fruits = ['gomu'];
  assert.equal(w.doAction('fruit').ok, false);
  assert.equal(w.state.gears.fruit, null, '没授权就不许吃，哪怕手里有');

  // 状态行要如实说「只能等主人点」
  const line = w.permLine();
  assert.match(line, /修船/);
  assert.match(line, /只能等主人点/);
  await w.stop();
}

// ── 3. 打开就能修，和面板点一下等价 ──────────────────────────────────────
{
  const w = make('repair-on', { allowRepair: true });
  await w.start(host);
  w.state.captain.hull = 20;
  w.state.captain.berries = 10_000_000;
  const before = w.state.captain.berries;
  const r = w.doAction('repair');
  assert.ok(r.ok, r.message);
  assert.equal(w.state.captain.hull, 100);
  assert.ok(w.state.captain.berries < before, '修船要花钱');
  assert.equal(w.state.captain.berries, before - w.repairCost({ captain: { hull: 20 } }), '花的是同一个价');
  await w.stop();
}

// ── 4. 自动挂机：半沉的船会先修，再谈推章 ────────────────────────────────
{
  const w = make('auto-repair', { allowRepair: true });
  await w.start(host);
  w.state.captain.hull = 40;
  w.state.captain.berries = 10_000_000;
  const out = w.stepAuto();
  assert.equal(out.kind, 'repair', `应该先修船，实际 ${out.kind}`);
  assert.equal(w.state.captain.hull, 100);
  await w.stop();
}

{
  const w = make('auto-norepair', { allowRepair: false });
  await w.start(host);
  w.state.captain.hull = 40;
  w.state.captain.berries = 10_000_000;
  const out = w.stepAuto();
  assert.notEqual(out.kind, 'repair', '没授权就不许自己修');
  // 她照样会出海，打架还会掉血——这里只卡「没往上修」。
  assert.ok(w.state.captain.hull <= 40, `船体不该被修高，实际 ${w.state.captain.hull}`);
  await w.stop();
}

// ── 5. 买刀：预算线 + 一天一把 ──────────────────────────────────────────
{
  const w = make('blade', { allowBlade: true });
  await w.start(host);
  // 店里最便宜的一把 80 万；只肯花手上六成，所以 100 万不够。
  w.state.captain.berries = 1_000_000;
  assert.equal(w.doAction('blade').ok, false, '六成预算不够就不该买');

  w.state.captain.berries = 3_000_000;
  const buy = w.doAction('blade');
  assert.ok(buy.ok, buy.message);
  assert.equal((w.state.gears.blades ?? []).length, 1);

  const again = w.doAction('blade');
  assert.equal(again.ok, false, '一天只能自己买一把');
  assert.match(again.message, /今天已经买过/);

  // 日子翻篇，名额归零
  w.state.day += 1;
  w.state.captain.berries = 3_000_000;
  assert.equal(w.permDay(w.state).blade, 0, '新的一天要重新算');
  await w.stop();
}

// ── 6. 练霸气：修行点够就升，不花贝利 ───────────────────────────────────
{
  const w = make('haki', { allowHaki: true });
  await w.start(host);
  w.state.campaign.done = 50;
  w.state.training = 10;
  const berries = w.state.captain.berries;
  const r = w.doAction('haki');
  assert.ok(r.ok, r.message);
  assert.equal(w.state.haki.kenbun, 1);
  assert.equal(w.state.captain.berries, berries, '练霸气不花贝利');
  await w.stop();
}

// ── 7. 派人上岸：船尾得留够人，回绝要说清是哪一种 ──────────────────────
{
  const w = make('dispatch', { allowDispatch: true });
  await w.start(host);
  // 开局人少：不够派，这句话不能含糊成「没人能派」
  const r = w.doAction('dispatch');
  assert.equal(r.ok, false);
  assert.match(r.message, /开船|能派/);
  await w.stop();
}

// ── 7b. 押送中 / 已经有一条船在海上：都不该再跑自由航海 ────────────────
{
  const w = make('blocked-sail', {});
  await w.start(host);
  w.state.blockedUntil = new Date(Date.now() + 40 * 60_000).toISOString();
  const jail = w.freeSailNow(1);
  assert.equal(jail.ok, false, '押送中不该能出海');
  assert.match(jail.message, /押送船/);
  assert.equal(w.state.voyage, null, '被拒了就不该凭空多一条船');

  w.state.blockedUntil = null;
  // 工具派出去的那条船还在海上时，面板的「跑一趟」不能把它顶掉
  w.sailText(1);
  assert.ok(w.state.voyage, '起航没写成 voyage');
  const dup = w.freeSailNow(1);
  assert.equal(dup.ok, false, '已经有一条船在海上，不该再跑');
  assert.match(dup.message, /已经有一条船在海上/);
  await w.stop();
}

// ── 8. 打不过时先补装备，别一头撞死 ────────────────────────────────────
{
  const w = make('grow', { allowUpgrade: true });
  await w.start(host);
  // 攒够钱和材料，然后把血量/战力压到「打不过」的位置
  w.state.captain.berries = 5_000_000;
  w.state.materials = { wood: 99, iron: 99, rare: 9 };
  const grew = w.autoGrow(w.state);
  assert.ok(grew, '有钱有材料的时候该自己动手升一件');
  assert.ok(grew.ok);
  assert.equal(w.permDay(w.state).upgrade, 1);
  await w.stop();
}

console.log('perm ok: 默认值 / 回绝 / 修船 / 自动修船 / 买刀预算与日限 / 霸气 / 派遣 / 自动变强');
