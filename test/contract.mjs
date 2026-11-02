/** 契约自检：工具声明、面板、配置、提示词必须和运行时对得上。 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import DEF from '../src/index.js';
import { ARCS } from '../src/campaign.js';
import { BLADES, FRUITS } from '../src/gear.js';

const dir = mkdtempSync(join(tmpdir(), 'onepiece-contract-'));
const host = { log: { info() {}, warn() {}, debug() {} }, pushEvent: async (e) => e };

try {
  assert.equal(DEF.id, 'onepiece');
  assert.equal(DEF.label, '海贼王大冒险');

  // 收藏的规模：三十把刀分三档，十二把无上大快刀；十八颗果实。
  // 一个篇章一把刀——这是「打完那一篇的 BOSS 必掉」能成立的前提。
  assert.equal(BLADES.length, 33, `名刀应该是 33 把，现在是 ${BLADES.length}`);
  assert.equal(BLADES.filter((b) => b.gradeKey === 'supreme').length, 12, '无上大快刀应该是 12 把');
  assert.equal(BLADES.filter((b) => b.gradeKey === 'great').length, 12, '大快刀应该是 12 把');
  assert.equal(FRUITS.length, 18, `果实应该是 18 颗，现在是 ${FRUITS.length}`);
  for (const arc of ARCS) {
    const n = BLADES.filter((b) => b.from === arc.id).length;
    assert.equal(n, 1, `「${arc.name}」应该正好挂一把刀，现在 ${n} 把`);
  }
  for (const fruit of FRUITS) {
    assert.ok(['rubber', 'flower', 'flame', 'op', 'quake', 'dark'].includes(fruit.effect),
      `果实「${fruit.name}」的效果 ${fruit.effect} 没有对应的规则`);
  }
  const defaults = DEF.defaults();
  assert.equal(defaults.enabled, false);
  assert.equal(defaults.theme, 'onepiece');
  assert.equal(typeof defaults.voyageMinutes, 'number');

  const ctx = {
    id: 'onepiece',
    cfg: defaults,
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
  };
  const world = DEF.create(ctx);
  assert.equal(world.id, DEF.id, '实例 id 必须等于定义 id，否则框架判加载失败');
  await world.start(host);

  const tools = world.tools();
  assert.equal(tools.length, 4, '工具最多四个，多了就是每轮都在加钱');
  const described = DEF.describe.tools;
  assert.deepEqual(tools.map((t) => t.name), described.map((t) => t.name));
  for (const tool of tools) {
    const d = described.find((x) => x.name === tool.name);
    assert.deepEqual(tool.parameters, d.parameters, `${tool.name} 的参数和 describe 不一致`);
    assert.equal(typeof tool.handler, 'function');
  }

  const status = await tools.find((t) => t.name === 'sea_status').handler({});
  assert.match(status, /下一章/);
  assert.match(status, /自动冒险/);
  assert.match(status, /第 1 天/);
  const chronicle = await tools.find((t) => t.name === 'sea_chronicle').handler({ limit: 3 });
  assert.match(chronicle, /悬赏令/);

  // sea_do：动作名要能被识别，没授权的要明确回绝（默认不让她自己吃果实）。
  const doTool = tools.find((t) => t.name === 'sea_do');
  assert.match(await doTool.handler({ action: 'nope' }), /没有这个动作/);
  assert.match(await doTool.handler({ action: 'fruit' }), /还没让我自己动/);
  // 出生船是满的：修船不该花掉开局那点钱。
  assert.match(await doTool.handler({ action: 'repair' }), /不用修/);

  const ui = world.webUi('zh');
  assert.equal(ui.panels.length, 1);
  assert.equal(ui.panels[0].id, 'sea');
  assert.deepEqual(ui.panels[0].getMethods, ['state']);

  const props = ui.config[0].schema.properties;
  for (const key of [
    'theme', 'voyageMinutes', 'difficulty', 'npcCount', 'auto', 'autoMinutes', 'autoDailyCap', 'notify', 'portrait',
    // 授权：这七件事她能不能自己做，一个都不能少——少一个就等于悄悄收回一项权力。
    'allowRepair', 'allowRest', 'allowUpgrade', 'allowBlade', 'allowFruit', 'allowHaki', 'allowDispatch',
  ]) {
    assert.ok(props[`worlds.onepiece.${key}`], `缺配置项 ${key}`);
  }
  // 调试类开关一个都不该留：它们会绕过节奏，玩家一开就毁体验。
  for (const gone of ['instant', 'debug']) {
    assert.equal(props[`worlds.onepiece.${gone}`], undefined, `${gone} 这个调试开关不该出现在发布版里`);
  }

  assert.equal(DEF.configOptions('theme').length, 2);
  assert.equal(DEF.configOptions('difficulty').length, 3);
  assert.equal(DEF.configOptions('notify').length, 3);
  assert.equal(DEF.configOptions('portrait').length, 2);

  assert.equal(ui.promptDocs.length, 1);
  assert.ok(existsSync(ui.promptDocs[0].path), '环境提示词文件不存在');
  const prompt = readFileSync(ui.promptDocs[0].path, 'utf8');
  for (const v of ui.promptDocs[0].vars) {
    assert.ok(prompt.includes(`{{${v.name}}}`), `提示词里没有占位符 ${v.name}`);
  }
  assert.ok(prompt.length < 400, `提示词太长了：${prompt.length} 字`);

  const vars = world.envPromptVars();
  assert.match(vars['onepiece.status'], /第 1 天/);
  assert.equal(vars['onepiece.theme'], '伟大航路');

  const payload = await ui.invoke('sea', 'state', []);
  assert.equal(payload.routes.length, 3);
  assert.equal(payload.board.length, defaults.npcCount + 1);
  assert.equal(payload.rank, payload.board.find((r) => r.you).rank);
  assert.equal(payload.campaign.total, 119, '章节总数不对');
  assert.equal(payload.campaign.done, 0);
  assert.equal(payload.level.value, 1);
  assert.ok(payload.level.power > 0);
  assert.equal(typeof payload.auto.enabled, 'boolean');
  // 调试条连同开关一起删了：面板上永远不该出现「走一步」「跳过等待」这类东西。
  assert.equal(payload.debug, undefined, 'payload 里不该再有 debug 字段');
  // 海况：面板要画风向标，所以这两项必须在
  assert.ok(payload.weather?.id && payload.weather?.name, 'payload 没带海况');
  assert.ok(Number.isFinite(payload.weather.berry), '海况的收益浮动丢了');
  assert.ok(payload.ship.tier >= 1 && payload.ship.tier <= 4, '船的分级没给');
  assert.ok(payload.ship.name, '船没有名字');

  const first = await ui.invoke('sea', 'chapter', []);
  assert.equal(first.ok, true);
  const after = await ui.invoke('sea', 'state', []);
  assert.equal(after.campaign.done, 1, '打了一章进度没动');
  assert.ok(after.campaign.recent.length >= 1, '年代记里没有刚过的这一章');
  assert.ok(after.campaign.recent[0].title, '年代记的条目没有章名');
  assert.ok(after.log[0].chapterTitle, '日志条目没有章名');
  assert.ok(after.level.exp > 0 || after.level.value > 1, '打完一章没有经验');

  // 面板上的按钮最后都落成 invoke(方法名)。名字对不上不会报错，只会在界面上静默失败，
  // 所以这里把每个新方法都点一遍——参数故意给不存在的人，只要「有话回」就算接上了。
  const panel = world.webUi('zh').invoke;
  for (const method of ['event', 'dispatch', 'recall', 'void']) {
    const out = await panel('sea', method, ['nobody']);
    assert.equal(typeof out, 'object', `面板方法 ${method} 没有返回对象`);
    assert.equal(typeof out.ok, 'boolean', `面板方法 ${method} 没有 ok 字段`);
  }
  const sheet = world.payload();
  for (const key of ['story', 'bonds', 'advice']) {
    assert.ok(key in sheet, `面板数据缺 ${key}`);
  }
  assert.equal(sheet.story.total, 4, '历史正文应该是 4 块');
  assert.equal(sheet.bonds.length, 5, '羁绊应该是 5 组');
  assert.ok(sheet.advice.length <= 3, '建议最多三条');

  const client = readFileSync(new URL('../webui/client.js', import.meta.url), 'utf8');
  assert.match(client, /panels:\s*\{\s*sea:/);
  assert.match(client, /function mount\(ctx\)/);

  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.type, 'module');
  assert.ok(pkg.keywords.includes('cortico-world'));
  assert.equal(pkg.cortico.kind, 'world');
  assert.equal(pkg.cortico.api, 6);
  for (const field of ['main', 'icon', 'webUiClient', 'describe']) {
    const rel = field === 'main' ? pkg.main : pkg.cortico[field];
    assert.ok(existsSync(new URL(`../${rel}`, import.meta.url)), `${field} 指向的文件不存在：${rel}`);
  }

  await world.stop();
  console.log(`contract ok: ${tools.length} 工具 / 1 面板 / ${Object.keys(props).length} 配置项 / 119 章 / 提示词占位符齐全`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
