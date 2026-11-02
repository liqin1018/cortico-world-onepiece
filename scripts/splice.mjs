import { readFileSync, writeFileSync } from 'node:fs';

const p = 'webui/client.js';
let s = readFileSync(p, 'utf8');
const start = s.indexOf('// 悬赏令上的那张脸');
const end = s.indexOf('function mount(ctx) {');
if (start < 0 || end < 0) throw new Error('markers not found');
const block = readFileSync('C:/Users/Admin/AppData/Local/Temp/op-portrait3.mjs', 'utf8');
s = s.slice(0, start) + block + '\n' + s.slice(end);
writeFileSync(p, s, 'utf8');
console.log('portrait v2 spliced');
