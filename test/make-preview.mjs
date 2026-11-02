/** 生成面板预览用的假数据，不装进应用也能看效果。 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import DEF from '../src/index.js';
import { expToReach } from '../src/campaign.js';

const dir = mkdtempSync(join(tmpdir(), 'onepiece-preview-'));
const host = { log: { info() {}, warn() {}, debug() {} }, pushEvent: async (e) => e };
const cfg = { ...DEF.defaults(), voyageMinutes: 1, auto: false, notify: 'silent', sim: true };
const ctx = {
  id: 'onepiece', cfg, timezone: 'Asia/Shanghai', botName: '可颂',
  botDir: dir, packageDir: dir, dataDir: dir, repoRoot: dir,
  secret: () => '', storeSecret() {}, persist() {}, restart: async () => {},
};

const world = DEF.create(ctx);
await world.start(host);

// 像一个正常玩家：打不过就先升点东西，实在不行去练级。
// 走到第 70 章上下——船员六个、刀有两把、改装买得起几件，截图才有东西看。
for (let i = 0; i < 900 && world.state.campaign.done < 70; i++) {
  const s = world.state;
  if (s.blockedUntil) s.blockedUntil = null;
  if (world.fatigueOf(s) > 70) world.rest(true);
  if (s.captain.hull < 40) world.repair(true);
  const p = world.payload();
  if (p.level.power / p.campaign.power < 1.05) {
    let spent = false;
    for (const part of p.ship.parts) {
      if (!part.maxed && part.canPay && s.captain.berries > 2_000_000) spent = world.upgradePart(part.id).ok || spent;
    }
    for (const h of p.haki) if (h.canLearn) spent = world.learnHaki(h.id).ok || spent;
    if (!spent) world.applyFreeSail(1);
    continue;
  }
  const idx = world.autoChoiceIndex(s);
  world.sailChapter(idx == null ? null : idx + 1);
}

// 补一点“看起来玩过一阵”的东西：两颗果实、几件改装、刀店的两把。
const s = world.state;
s.captain.berries = Math.max(s.captain.berries, 26_000_000);
s.materials = { wood: 14, iron: 9, rare: 4 };
for (const part of ['sail', 'cannon', 'galley']) world.upgradePart(part);
world.buyBlade('kashu');
world.buyBlade('sandai');
for (const h of ['kenbun', 'busou']) world.learnHaki(h);
s.gears.fruits = ['mera'];
world.eatFruit('mera');
// 截图用：船体留一点伤（看得出修船按钮），但别低到像坏了。
s.captain.hull = 72;
// 派遣：把乌索普放上岸，面板上才有「岸上」的样子；羁绊也就断了一组。
world.sendOut('usopp');

// 主预览里把梅丽那张纸收起来——它自己有单独一份截图。
world.ackEvent();
// 三份数据：在港（年代记 / 收藏 / 悬赏令用）、在海上、被押送。
const idle = world.payload();
writeFileSync(new URL('./preview-data.json', import.meta.url), `${JSON.stringify(idle, null, 2)}\n`, 'utf8');
// 同一份状态、只把调试条打开：用来对比「发布版长什么样」和「调试时长什么样」。
writeFileSync(
  new URL('./preview-data-debug.json', import.meta.url),
  `${JSON.stringify({ ...idle, debug: true }, null, 2)}\n`,
  'utf8',
);

world.state.voyage = {
  islandId: 'whiskey', islandName: '威士忌山', kindId: 'ruin', kindLabel: '遗迹探宝',
  risk: 4, minutes: 90, startedAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 42 * 60_000 + 18_000).toISOString(), themeId: 'onepiece',
};
const sailing = world.payload();
writeFileSync(new URL('./preview-data-voyage.json', import.meta.url), `${JSON.stringify(sailing, null, 2)}\n`, 'utf8');

world.state.voyage = null;
world.state.blockedUntil = new Date(Date.now() + 146 * 60_000).toISOString();
const locked = world.payload();
writeFileSync(new URL('./preview-data-blocked.json', import.meta.url), `${JSON.stringify(locked, null, 2)}\n`, 'utf8');

// 第四份：停在一道门的 BOSS 前面（抉择 + 三回合同时出现的样子）。
const dir2 = mkdtempSync(join(dir, 'boss-'));
const boss = DEF.create({ ...ctx, dataDir: dir2 });
await boss.start(host);
for (let i = 0; i < 400 && boss.state.campaign.done < 35; i++) {
  const b = boss.state;
  if (b.blockedUntil) b.blockedUntil = null;
  if (boss.fatigueOf(b) > 70) boss.rest(true);
  if (b.captain.hull < 40) boss.repair(true);
  const pp = boss.payload();
  if (pp.level.power / pp.campaign.power < 1.05) { boss.applyFreeSail(1); continue; }
  const idx = boss.autoChoiceIndex(b);
  boss.sailChapter(idx == null ? null : idx + 1);
}
boss.state.captain.hull = 68;
const bossData = boss.payload();
writeFileSync(new URL('./preview-data-boss.json', import.meta.url), `${JSON.stringify(bossData, null, 2)}\n`, 'utf8');
await boss.stop();

// 第五份：刚过司法岛、梅丽号那张纸还没收起来的样子。
const dir3 = mkdtempSync(join(dir, 'merry-'));
const merry = DEF.create({ ...ctx, dataDir: dir3 });
await merry.start(host);
{
  const m = merry.state;
  m.campaign.done = 56;
  m.campaign.attempts = 0;
  m.day = 58;
  m.level = { value: 38, exp: 0, total: expToReach(38), need: 200 };
  m.crew = ['zoro', 'usopp', 'sanji', 'nami', 'chopper', 'robin', 'franky', 'brook']
    .map((id) => ({ id, joinedDay: 1, fatigue: 8 }));
  m.captain.hull = 46;
  m.captain.berries = 30_000_000;
  m.materials = { wood: 9, iron: 6, rare: 2 };
  m.ship = { tier: 2, parts: { hull: 2, sail: 2, helm: 1, cannon: 1, galley: 0, armor: 0 } };
  m.captain.bounty = 380_000_000;
  // 用一次真的结算，让梅丽事件走完整条路（而不是手改状态）。
  merry.applyChapter(null);
  merry.save();
  const merryData = merry.payload();
  writeFileSync(new URL('./preview-data-merry.json', import.meta.url), `${JSON.stringify(merryData, null, 2)}\n`, 'utf8');
}
await merry.stop();

// 第六份：四块石碑凑齐、隐藏章开着的样子（收藏页要截这个）。
const dir4 = mkdtempSync(join(dir, 'void-'));
const vw = DEF.create({ ...ctx, dataDir: dir4 });
await vw.start(host);
{
  const v = vw.state;
  v.campaign.done = 118;
  v.day = 121;
  v.level = { value: 58, exp: 0, total: expToReach(58), need: 200 };
  v.crew = ['zoro', 'usopp', 'sanji', 'nami', 'chopper', 'robin', 'franky', 'brook', 'jinbe', 'yamato']
    .map((id) => ({ id, joinedDay: 1, fatigue: 12 }));
  v.story = {
    ...v.story, merryBurned: true, pending: null,
    poneglyphs: ['alabasta', 'skypiea', 'fishman', 'wano'], voidUnlocked: true, voidTries: 1,
  };
  v.captain.bounty = 2_100_000_000;
  v.captain.hull = 88;
  v.captain.berries = 240_000_000;
  v.materials = { wood: 12, iron: 8, rare: 5 };
  v.ship = { tier: 4, parts: { hull: 4, sail: 4, helm: 3, cannon: 4, galley: 3, armor: 3 } };
  v.gears = {
    blades: ['kashu', 'sandai', 'wado', 'shusui', 'enma', 'murakumogiri', 'shodai'],
    fruits: ['mera'], fruit: 'gomu',
  };
  v.haki = { kenbun: 4, busou: 5, haoshoku: 2 };
  v.training = 12;
  vw.save();
  const voidData = vw.payload();
  writeFileSync(new URL('./preview-data-void.json', import.meta.url), `${JSON.stringify(voidData, null, 2)}\n`, 'utf8');
}
await vw.stop();

await world.stop();
rmSync(dir, { recursive: true, force: true });
console.log('preview:', `第 ${idle.campaign.done} 章`, `Lv${idle.level.value}`, `战力 ${idle.level.power}`,
  `船员 ${idle.crew.count}`, `刀 ${idle.gears.blades.filter((b) => b.owned).length}`,
  `图鉴 ${Math.round(idle.codex.percent * 100)}%`);
