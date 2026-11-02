/** 自动冒险：到点走、有上限、离线补结算、静默不花 token。 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import DEF from '../src/index.js';
import { expToReach, expNeed } from '../src/campaign.js';

const dir = mkdtempSync(join(tmpdir(), 'onepiece-auto-'));
const events = [];
const host = { log: { info() {}, warn() {}, debug() {} }, pushEvent: async (e) => { events.push(e); return e; } };

function makeCtx(cfg) {
  return {
    id: 'onepiece', cfg: { ...DEF.defaults(), ...cfg }, timezone: 'Asia/Shanghai', botName: '可颂',
    botDir: dir, packageDir: dir, dataDir: dir, repoRoot: dir,
    secret: () => '', storeSecret() {}, persist() {}, restart: async () => {},
  };
}

try {
  // 1) 到点才走，一天有上限
  const w = DEF.create(makeCtx({ auto: true, autoMinutes: 30, autoDailyCap: 2, notify: 'silent' }));
  await w.start(host);
  const s = w.state;
  s.auto.lastRunAt = new Date(Date.now() - 3 * 3_600_000).toISOString();
  s.auto.runs = 0;
  await w.autoRun(Date.now());
  assert.equal(s.auto.runs, 2, `一天上限没生效：跑了 ${s.auto.runs} 次`);
  assert.equal(events.length, 0, '静默模式不该往她那儿推事件');
  assert.ok(s.campaign.done + s.log.length > 0, '自动跑完什么都没留下');
  await w.stop();

  // 2) 上限之内，离线补结算一次最多 8 次
  rmSync(join(dir, 'onepiece.json'), { force: true });
  const w2 = DEF.create(makeCtx({ auto: true, autoMinutes: 5, autoDailyCap: 24, notify: 'silent' }));
  await w2.start(host);
  // 给个高等级：不然中途有一趟打不过就去自由航海，掷出「被俘」会让循环提前 break，
  // 这条断言就成了掷骰子（0.9 加了难度缺口之后尤其容易）。
  w2.state.level = { value: 30, exp: 0, total: expToReach(30), need: expNeed(30) };
  w2.state.auto.lastRunAt = new Date(Date.now() - 6 * 3_600_000).toISOString();
  w2.state.auto.runs = 0;
  events.length = 0;
  await w2.autoRun(Date.now());
  assert.equal(w2.state.auto.runs, 8, `离线最多补 8 次，实际 ${w2.state.auto.runs}`);
  await w2.stop();

  // 3) 要紧的事才开口；普通自由航海不吭声
  rmSync(join(dir, 'onepiece.json'), { force: true });
  const w3 = DEF.create(makeCtx({ auto: true, autoMinutes: 30, autoDailyCap: 6, notify: 'important' }));
  await w3.start(host);
  events.length = 0;
  await w3.pushAuto([{ kind: 'free', entry: { island: '某岛', outcomeLabel: '成功' } }]);
  assert.equal(events.length, 0, '普通航次不该叫她');
  await w3.pushAuto([{ kind: 'chapter', cleared: true, chapter: { title: '风车村' }, outcomeLabel: '胜' }]);
  assert.equal(events.length, 1, '过了章节应该叫她一次');
  assert.match(events[0].text, /风车村/);
  await w3.stop();

  // 3.5) 汇总里得真的有东西。
  // stepAuto 的返回值里，applyChapter 自己带一个 kind（'single' / 'boss'），
  // 展开顺序写反就会把外层的 'chapter' 盖掉，于是汇总变成「走了 8 趟：。」。
  rmSync(join(dir, 'onepiece.json'), { force: true });
  const w3b = DEF.create(makeCtx({ auto: true, autoMinutes: 30, autoDailyCap: 6, notify: 'important' }));
  await w3b.start(host);
  events.length = 0;
  w3b.state.auto.lastRunAt = new Date(Date.now() - 8 * 30 * 60_000).toISOString();
  await w3b.autoRun();
  const summary = events.map((e) => e.text).join('\n');
  assert.ok(/过了「|卡在「|跑了一趟/.test(summary), `自动汇总里没有任何一步：${summary}`);
  assert.ok(!/趟：。/.test(summary), '汇总里「走了 N 趟：」后面是空的——stepAuto 的 kind 被覆盖了');
  await w3b.stop();

  // 4) 关掉自动就真的不动
  rmSync(join(dir, 'onepiece.json'), { force: true });
  const w4 = DEF.create(makeCtx({ auto: false }));
  await w4.start(host);
  w4.state.auto.lastRunAt = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const before = w4.state.campaign.done;
  await w4.autoRun(Date.now());
  assert.equal(w4.state.auto.runs, 0, '关了自动还在自己跑');
  assert.equal(w4.state.campaign.done, before);
  await w4.stop();

  // 5) 调试入口已经全删：panel invoke 不该再接受这几个方法
  //    「上岸」「走一步」「跳过等待」「立刻返航」都会绕过节奏，发布版一个不留。
  rmSync(join(dir, 'onepiece.json'), { force: true });
  const w5 = DEF.create(makeCtx({ auto: false }));
  await w5.start(host);
  w5.state.blockedUntil = new Date(Date.now() + 146 * 60_000).toISOString();
  assert.match(await w5.statusText(), /押送船上/);
  for (const gone of ['skip', 'step', 'unblock', 'finish']) {
    let threw = null;
    try {
      await w5.webUi('zh').invoke('sea', gone, []);
    } catch (e) {
      threw = e;
    }
    assert.ok(threw, `${gone} 这个调试入口还在，应该删掉了`);
  }
  assert.ok(w5.state.blockedUntil, '押送中的状态不该被谁清掉');
  await w5.stop();

  console.log('auto ok: 上限 / 补结算 8 次 / 静默不推 / 关掉不动 / 调试入口已删除');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
