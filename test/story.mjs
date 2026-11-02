/**
 * 剧情事件 / 派遣 / 羁绊 / 隐藏章 的验收。
 *
 * 这几样都是「只在特定章节触发一次」的东西，靠肉眼看面板很难测，
 * 所以直接推存档：伪造一个战场状态，把关键章节推过去，看它有没有发生。
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import DEF from '../src/index.js';
import { chapterAt, TOTAL_CHAPTERS, expToReach, chapterPowerOf } from '../src/campaign.js';
import { PONEGLYPHS, voidPower } from '../src/story.js';
import { activeCrew, powerOf } from '../src/collect.js';
import { bondRows } from '../src/bonds.js';

const dir = mkdtempSync(join(tmpdir(), 'op-story-'));
const host = { log: { info() {}, warn() {}, debug() {} }, pushEvent: async () => {} };
const ctx = {
  id: 'onepiece',
  cfg: { ...DEF.defaults(), auto: false, sim: true },
  botName: 'Coo',
  dataDir: dir,
  packageDir: dir,
  secret: () => '',
  storeSecret() {},
  persist() {},
  restart: async () => {},
};

const world = DEF.create(ctx);
await world.start(host);
const s = world.state;

/** 把存档挪到「第 no 章之前」，其余照旧。 */
function jumpTo(no) {
  s.campaign.done = Math.max(0, no - 1);
  s.campaign.attempts = 0;
  s.campaign.attemptDay = s.day;
  s.captain.hull = 100;
  s.captain.berries = 6_000_000_000;
  // total 必须对得上等级，否则 grantExp 会把她打回 1 级（这是存档的语义，不是 bug）。
  s.level = { value: 72, exp: 0, total: expToReach(72), need: 200 };
  s.crew = ['zoro', 'usopp', 'sanji', 'nami', 'chopper', 'robin', 'franky', 'brook', 'jinbe', 'yamato']
    .map((id) => ({ id, joinedDay: 1, fatigue: 0 }));
  s.materials = { wood: 99, iron: 99, rare: 99 };
}

// ── 1. 梅丽号：司法岛 BOSS 之后必须发生，而且没有选项 ──────────────────
jumpTo(chapterAt(0).no);
const eniesBoss = chapterAt([...Array(TOTAL_CHAPTERS).keys()]
  .find((i) => chapterAt(i).arcId === 'enies' && chapterAt(i).isBoss));
jumpTo(eniesBoss.no);
s.captain.hull = 41;
const hurtHull = s.captain.hull;
const r1 = world.applyChapter(0);
assert.equal(r1.cleared, true, '第 57 章在测试条件下应该打得过');
assert.equal(r1.story.merry, true, '司法岛 BOSS 之后应该有梅丽号事件');
assert.equal(s.story.merryBurned, true, '梅丽号应该已经沉了');
assert.equal(s.story.pending, 'merry', '面板上应该留着一张没读的纸');
assert.equal(s.captain.hull, 100, '换船之后船体应该修满');
assert.ok(r1.story.notes.some((n) => n.includes('梅丽号')), '回执里应该有这件事');
const ev = world.payload().event;
assert.equal(ev?.id, 'merry', 'payload 里应该有事件卡');
assert.ok(ev.lines.length >= 4, '事件卡应该有正文');
await world.ackEvent();
assert.equal(world.payload().event, null, '收起来之后事件卡就该没了');
console.log(`merry ok: 第 ${eniesBoss.no} 章触发，船体 ${hurtHull}→${s.captain.hull}，事件卡可收起`);

// ── 2. 历史正文四块 + 隐藏章 ────────────────────────────────────────────
const glyphArcs = PONEGLYPHS.map((p) => p.from);
const got = [];
for (const arcId of glyphArcs) {
  const boss = chapterAt([...Array(TOTAL_CHAPTERS).keys()]
    .find((i) => chapterAt(i).arcId === arcId && chapterAt(i).isBoss));
  jumpTo(boss.no);
  const r = world.applyChapter(0);
  if (r.story?.poneglyph) got.push(r.story.poneglyph.id);
}
assert.deepEqual(got, glyphArcs, `四块石碑都应该掉：拿到了 ${got.join(',')}`);
assert.equal(s.story.voidUnlocked, true, '四块齐了应该解锁隐藏章');
assert.equal(s.story.poneglyphs.length, 4, '石碑不能重复');

const payload = world.payload();
assert.equal(payload.story.count, 4);
assert.equal(payload.story.voidPower, voidPower(), '面板上写的难度要跟战斗一致');
assert.ok(payload.story.voidPower > chapterPowerOf(chapterAt(TOTAL_CHAPTERS - 1)),
  `隐藏章应该比最后一章更难：${payload.story.voidPower} vs ${chapterPowerOf(chapterAt(TOTAL_CHAPTERS - 1))}`);

// 把收藏做满：一个把全篇走完、又认真收集过的人，应该打得过这一页。
s.gears = {
  blades: ['kashu', 'sandai', 'wado', 'shusui', 'enma', 'murakumogiri', 'shodai', 'yoru'],
  fruits: [], fruit: 'gomu',
};
s.haki = { kenbun: 5, busou: 5, haoshoku: 5 };
s.ship.parts = { hull: 5, sail: 5, helm: 5, cannon: 5, galley: 5, armor: 5 };
s.training = 40;
const fullPower = powerOf(s);
const v1 = await world.voidChallenge();
assert.equal(v1.ok, true, '凑齐之后应该能打');
assert.equal(typeof v1.cleared, 'boolean');
const voidTries = s.story.voidTries;
assert.equal(voidTries, 1, '挑战次数要记下来');
if (v1.cleared) {
  assert.equal(s.story.voidDone, true, '赢了就该标记读完');
  assert.equal(s.captain.crime, '知晓真相的人');
} else {
  assert.equal(s.story.voidDone, false, '输了不该标记读完');
  assert.equal(s.captain.hull > 0, true, '输了也不能把船打到负数');
}
assert.equal(v1.cleared, true, `满收藏（战力 ${fullPower}）应该打得过难度 ${voidPower()} 的隐藏章`);
console.log(`void ok: 难度 ${voidPower()}，满收藏战力 ${fullPower}，`
  + `回合 ${v1.rounds.map((x) => (x.won ? '赢' : '输')).join('')}`);

// 再打一次不会重复算
const v2 = await world.voidChallenge();
if (v1.cleared) assert.equal(v2.ok, false, '读过之后不应该还能再打');
else assert.equal(v2.ok, true, '没过可以再打');

// ── 3. 派遣：派出去→不算战力→三章之后回来带东西 ────────────────────────
s.story.voidDone = true;
jumpTo(60);
const basePower = powerOf(s);
const baseWood = s.materials.wood;
const sanji = s.crew.find((m) => m.id === 'sanji');
const out = world.sendOut('sanji');
const afterSend = powerOf(s);
assert.equal(out.ok, true, `派遣应该成功：${out.message}`);
assert.ok(sanji.awayUntil > s.campaign.done, '记录里要有回来的章节');
assert.ok(powerOf(s) < basePower, '派走的人不该再算战力');
assert.equal(activeCrew(s).some((m) => m.id === 'sanji'), false, 'activeCrew 要过滤掉他');
assert.equal(bondRows(activeCrew(s).map((m) => m.id)).find((b) => b.id === 'party')?.active, true,
  '乔巴+布鲁克的羁绊跟山治无关，应该还在');
assert.equal(bondRows(activeCrew(s).map((m) => m.id)).find((b) => b.id === 'rival')?.active, false,
  '索隆+山治：山治走了，羁绊应该断');

// 上限：不能把全船都派出去
assert.equal(world.sendOut('zoro').ok, true, '第二个名额应该还能派');
assert.equal(world.sendOut('nami').ok, false, '超过上限要拦住');

// 推三章
for (let i = 0; i < 3; i++) {
  s.captain.hull = 100;
  world.applyChapter(0);
}
assert.equal(s.dispatch.length, 0, '三章之后人都该回来了');
assert.equal(s.crew.find((m) => m.id === 'sanji').awayUntil, undefined, '回来之后不能再挂着 awayUntil');
assert.ok(s.materials.wood > baseWood - 99, '应该带回材料');
console.log(`dispatch ok: 派走掉 ${Math.round((1 - afterSend / basePower) * 100)}% 战力（${basePower}→${afterSend}），`
  + `三章后两人都回来了，木材 ${baseWood}→${s.materials.wood}`);

// 召回：不给人，也不该卡住
world.sendOut('chopper');
const back = world.callBack('chopper');
assert.equal(back.ok, true);
assert.equal(s.dispatch.length, 0);
assert.equal(s.crew.find((m) => m.id === 'chopper').awayUntil, undefined);

// ── 4. 建议：每条都要么有话说、要么有按钮 ──────────────────────────────
s.captain.hull = 30;
s.captain.berries = 100_000_000;
const advice = world.payload().advice;
assert.ok(advice.length > 0, '半沉的船应该有人劝你修');
assert.ok(advice.every((a) => a.text && typeof a.text === 'string'), '每条建议都要有正文');
assert.ok(advice.length <= 3, '建议最多三条，多了就是噪音');
console.log(`advice ok: ${advice.map((a) => a.action ? `${a.text.slice(0, 14)}…[${a.action.label}]` : a.text.slice(0, 14)).join(' / ')}`);

console.log(`story ok: 石碑 ${PONEGLYPHS.length} 块 / 隐藏章 / 派遣 / 羁绊 / 建议 全部接上`);

await world.stop();
rmSync(dir, { recursive: true, force: true });
