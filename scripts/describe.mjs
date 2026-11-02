/** 从定义生成 describe.json，保证工具声明和运行时是同一份。 */
import { readFileSync, writeFileSync } from 'node:fs';
import { ONEPIECE } from '../src/world.js';

const prompt = readFileSync(new URL('../src/prompt/ENV_PROMPT.md', import.meta.url), 'utf8');

const out = {
  tools: ONEPIECE.describe.tools,
  events: ONEPIECE.describe.events,
  prompts: [
    {
      key: 'worlds.onepiece.envPrompt',
      title: '海贼王大冒险 · 环境提示词',
      role: 'envPrompt',
      content: prompt,
    },
  ],
};

writeFileSync(new URL('../describe.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`describe.json: ${out.tools.length} 个工具，${out.events.length} 个事件，1 段提示词`);
