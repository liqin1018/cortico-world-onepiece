/**
 * 存档升级检查：老档（12 个对手）升上来之后，榜单要变成整份名单，
 * 但天数、赏金、船体、日志一个都不能丢。
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createState, loadState, saveState, STATE_VERSION } from '../src/state.js';

const dir = mkdtempSync(join(tmpdir(), 'onepiece-migrate-'));
const file = join(dir, 'onepiece.json');
const opts = { botName: 'Coo', themeId: 'onepiece', npcCount: 12 };

try {
  // 造一个 v1 老档：榜单只有 12 个人，没有 npcCount 字段。
  const old = createState({ ...opts, now: Date.now() - 86_400_000 });
  old.version = 1;
  old.day = 7;
  old.captain.bounty = 38_084_208;
  old.captain.hull = 64;
  old.captain.explored = ['alabasta', 'drum'];
  old.log = [{ day: 6, text: '抢了一支商船队' }];
  old.npcs = old.npcs.slice(0, 12);
  delete old.npcCount;
  assert.equal(old.npcs.length, 12);
  saveState(file, old);

  // 配置里还是旧的 12，也要按整份名单重建。
  const up = loadState(file, opts);
  assert.equal(up.version, STATE_VERSION, '版本没升上来');
  assert.equal(up.npcs.length, 60, `升级后榜单应该 60 人，实际 ${up.npcs.length}`);
  assert.equal(up.npcCount, 60, 'npcCount 没跟着更新');
  assert.equal(up.day, 7, '天数丢了');
  assert.equal(up.captain.bounty, 38_084_208, '赏金丢了');
  assert.equal(up.captain.hull, 64, '船体丢了');
  assert.equal(up.captain.explored.length, 2, '探索记录丢了');
  assert.equal(up.log.length, 1, '日志丢了');
  const names = up.npcs.map((n) => n.name);
  assert.equal(new Set(names).size, names.length, '榜单里有重复的人');
  assert.ok(names.includes('哥尔·D·罗杰'), '名单里没有罗杰');
  assert.ok(names.includes('托尼托尼·乔巴'), '名单里没有乔巴');
  assert.ok(up.level && up.level.value >= 1, '升级后没有等级');
  assert.equal(up.campaign.done, 0, '老档不该凭空有进度');
  assert.ok(up.auto && typeof up.auto === 'object', '升级后没有自动冒险状态');

  // v2（有等级之前）的档：等级按赏金折算，别让她变回 1 级
  const v2 = { ...up, version: 2 };
  delete v2.level;
  delete v2.campaign;
  delete v2.auto;
  saveState(file, v2);
  const fromV2 = loadState(file, opts);
  assert.equal(fromV2.version, STATE_VERSION);
  assert.ok(fromV2.level.value >= 5, `按赏金折算的等级不对：${fromV2.level.value}`);
  assert.ok(fromV2.level.total > 0, '等级和经验对不上，下次加经验会掉级');
  assert.equal(fromV2.campaign.done, 0);

  // 已经是 v2、用户自己把榜单调小时，不能反手又给他长回去。
  up.version = STATE_VERSION;
  saveState(file, up);
  const small = { ...up, npcs: up.npcs.slice(0, 12), npcCount: 12 };
  saveState(file, small);
  const kept = loadState(file, { ...opts, npcCount: 12 });
  assert.equal(kept.npcs.length, 12, '已升级的存档被强行改人数');

  // 坏档：改名留底，重新开一局，不能把扩展卡死。
  writeFileSync(file, '{ 这不是 json', 'utf8');
  const fresh = loadState(file, opts);
  assert.equal(fresh.version, STATE_VERSION);
  assert.equal(fresh.day, 1, '坏档没有重新开一局');
  const kept2 = readdirSync(dir).filter((name) => name.includes('.broken-'));
  assert.equal(kept2.length, 1, '坏档没有留底');

  console.log(`migrate ok: v1(12人) → v${STATE_VERSION}(${up.npcs.length}人)，进度无损`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
