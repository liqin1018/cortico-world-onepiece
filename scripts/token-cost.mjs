import { readFileSync } from 'node:fs';
import DEF from '../src/index.js';

const prompt = readFileSync(new URL('../src/prompt/ENV_PROMPT.md', import.meta.url), 'utf8');
const describe = JSON.parse(readFileSync(new URL('../describe.json', import.meta.url), 'utf8'));
const tools = JSON.stringify(describe.tools ?? []);
const oneTool = JSON.stringify((describe.tools ?? [])[0] ?? {});

const cjk = (s) => (s.match(/[\u4e00-\u9fa5]/g) ?? []).length;
const est = (s) => Math.round(cjk(s) * 0.75 + (s.length - cjk(s)) * 0.3);

const lines = [
  ['环境提示词 ENV_PROMPT.md', prompt.length, est(prompt)],
  ['四个工具的 schema（describe.tools）', tools.length, est(tools)],
  ['其中单个工具平均', oneTool.length, est(oneTool)],
  ['工具名字+描述摘要（TOOL_SUMMARIES）', 260, est('x'.repeat(260))],
];

for (const [name, chars, tokens] of lines) {
  console.log(String(name).padEnd(34), String(chars).padStart(6), 'chars', String(tokens).padStart(5), 'tokens');
}

// 状态行
const state = {
  seed: 1, day: 23, campaign: { done: 20 }, captain: { bounty: 212_000_000, hull: 72, explored: [] },
  level: { value: 17 }, npcs: Array.from({ length: 60 }, (_, i) => ({ id: i, bounty: 1e8 })),
};
const { statusLine } = await import('../src/sea.js');
const { themeOf } = await import('../src/theme/index.js');
const status = statusLine(state, themeOf('onepiece'));
console.log('\n状态行：', status);
console.log('状态行 chars', status.length, '→ tokens', est(status));

// 一次推送事件
const event = '第 21 天 · 罗格镇「白烟」· 惨胜（船体 -14）· 赏金 2.1 亿 · 第 51/61 名';
console.log('\n推送事件样例：', event);
console.log('chars', event.length, '→ tokens', est(event));

const fixed = est(prompt) + est(tools);
console.log('\n常驻固定开销 ≈', fixed, 'tokens / 每次模型请求');
console.log('一天 6 次自动、约 3 次推送 ≈', fixed * 3 + est(event) * 3, 'tokens（只在这些时刻调模型）');
