/**
 * 数值模拟：一个「正常玩」的人从第一话推到拉夫德鲁要多少步。
 *
 * 玩法设定：
 *  - 打得过（战力 ≥ 难度）就推章节，打不过就去自由航海练级
 *  - 有钱有材料就升部件；刀店里有买得起的就买；修行点够就练霸气
 *  - 疲劳过高就歇一晚，船烂到 30 以下先修
 * 这不是最优解，是「不刻意钻研也能走完」的下限。
 */
import DEF from '../src/index.js';
import { gapLine } from '../src/battle.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'onepiece-balance-'));
const host = { log: { info() {}, warn() {}, debug() {} }, pushEvent: async (e) => e };
const ctx = {
  id: 'onepiece', cfg: { ...DEF.defaults(), auto: false, notify: 'silent', sim: true }, botName: 'Coo',
  botDir: dir, packageDir: dir, dataDir: dir, repoRoot: dir,
  secret: () => '', storeSecret() {}, persist() {}, restart: async () => {},
};

function spend(world) {
  const s = world.state;
  const stat = { upgrades: 0, buys: 0, haki: 0 };
  for (const part of world.payload().ship.parts) {
    if (!part.maxed && part.canPay && s.captain.berries > 4_000_000) {
      if (world.upgradePart(part.id).ok) stat.upgrades += 1;
    }
  }
  for (const blade of world.payload().gears.blades) {
    if (blade.canBuy && s.captain.berries > blade.price * 1.4) {
      if (world.buyBlade(blade.id).ok) stat.buys += 1;
    }
  }
  for (const h of world.payload().haki) {
    if (h.canLearn) {
      if (world.learnHaki(h.id).ok) stat.haki += 1;
    }
  }
  return stat;
}

function play(world, { maxSteps = 1500, lazy = false, hardPush = false } = {}) {
  const s = world.state;
  const stat = { steps: 0, chapters: 0, fails: 0, sails: 0, rests: 0, repairs: 0, upgrades: 0, buys: 0, haki: 0, bossWin: 0, bossLose: 0, choices: 0 };
  while (stat.steps < maxSteps && s.campaign.done < 119) {
    stat.steps += 1;
    if (!lazy) {
      const sp = spend(world);
      stat.upgrades += sp.upgrades;
      stat.buys += sp.buys;
      stat.haki += sp.haki;
    }

    if (!lazy && world.fatigueOf(s) > 72 && s.captain.berries > world.restCost(s) * 2) {
      if (world.rest(true).ok) stat.rests += 1;
    }
    // 模拟里不等真的三小时：被俘的押送时间直接跳过。
    if (s.blockedUntil) s.blockedUntil = null;
    if (s.captain.hull < 30) {
      const fixed = world.repair(true);
      if (fixed.ok) stat.repairs += 1;
    }

    const gap = gapLine(s);
    const threshold = hardPush ? 0.8 : lazy ? 0.93 : 0.98;
    if (gap.ratio < threshold) {
      world.applyFreeSail(1);
      stat.sails += 1;
      continue;
    }
    const idx = world.autoChoiceIndex(s);
    const out = world.sailChapter(idx == null ? null : idx + 1);
    if (idx != null) stat.choices += 1;
    if (!out.ok) { stat.fails += 1; world.applyFreeSail(1); stat.sails += 1; continue; }
    if (out.res.kind === 'boss') {
      if (out.res.cleared) stat.bossWin += 1; else stat.bossLose += 1;
    }
    if (out.res.cleared) stat.chapters += 1; else stat.fails += 1;
  }
  return stat;
}

async function run(label, opts) {
  const sub = mkdtempSync(join(dir, 'run-'));
  const world = DEF.create({ ...ctx, dataDir: sub });
  await world.start(host);
  const stat = play(world, opts);
  const s = world.state;
  const p = world.payload();
  console.log(`\n【${label}】`);
  console.log('步数', stat.steps, '| 推章', stat.chapters, '| 打输', stat.fails,
    '| BOSS 胜/负', `${stat.bossWin}/${stat.bossLose}`,
    '| 自由航海', stat.sails, '| 歇夜', stat.rests, '| 修船', stat.repairs);
  console.log('进度', `${s.campaign.done}/119`, '| Lv', s.level.value, '| 战力', p.level.power,
    '| 本章难度', p.campaign.power, '| 赏金', p.captain.bountyText, '| 天数', s.day);
  console.log('船员', p.crew.list.map((c) => c.short).join('、') || '无',
    '| 刀', p.gears.blades.filter((b) => b.owned).length + '/' + p.gears.bladeCount,
    '| 果实', p.gears.eaten?.name ?? '没吃',
    '| 改装', stat.upgrades, '| 买刀', stat.buys, '| 霸气', stat.haki,
    '| 图鉴', `${Math.round(p.codex.percent * 100)}%`);
  await world.stop();
}

try {
  await run('只推主线，不买不改装', { lazy: true });
  await run('正常玩：改装、买刀、练霸气', {});
  await run('硬推：战力不够也打', { hardPush: true });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
