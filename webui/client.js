// 海贼王大冒险 · 面板（浏览器端，纯 ESM，无依赖、无构建）
//
// 只往 ctx.root 里写，颜色跟宿主主题走；只有悬赏令、事件卡是固定的纸色——
// 那些是海军和旧纸，不该跟着界面换肤。
//
// 排版原则：宽屏两栏（中间隔开），窄屏回落成一栏。
// 所有「等」的地方都要有门，所有按钮都落回 ctx.invoke。

// 撕纸边：沿底边生成一段锯齿。用 px 而不是百分比，换高度时波形才不会变形。
function tearEdge(steps, amp, phase) {
  const pts = [];
  for (let i = steps; i >= 0; i--) {
    const x = Math.round((i / steps) * 1000) / 10;
    const w = (0.3 + 0.7 * Math.abs(Math.sin(i * phase))) * amp;
    pts.push(`${x}% calc(100% - ${w.toFixed(1)}px)`);
  }
  return `polygon(0 0, 100% 0, ${pts.join(', ')})`;
}
const TEAR_BANNER = tearEdge(22, 11, 1.9);
const TEAR_BAND = tearEdge(13, 8, 2.1);

const CSS = `
/* ── 复古航海：羊皮纸底、深褐描边、木牌 ─────────────────────────────────
   所有颜色都从这一组变量里出，别再写裸色值。 */
.op {
  --paper: #efe3c8; --paper-2: #f6eed9; --paper-3: #e6d5b2; --paper-4: #d8c39a;
  --brown: #6b4a2e; --brown-2: #8b5a2b; --brown-3: #4a3018;
  --ink: #33240f; --ink-soft: #5c452a; --ink-dim: #86694a;
  --red: #a5342a; --red-2: #8d2114; --gold: #b8891f; --gold-2: #d9a521;
  --line: rgba(107, 74, 46, .40); --line2: rgba(107, 74, 46, .22);
  --soft: rgba(139, 90, 43, .09);
  --mute: #5c452a; --dim: #86694a;
  --serif: 'Songti SC', 'SimSun', 'Noto Serif CJK SC', 'Source Han Serif SC', Georgia, serif;
  --type: 'Courier New', Courier, 'Nimbus Mono PS', 'Consolas', monospace;
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='.3' intercept='.76'/%3E%3CfeFuncG type='linear' slope='.3' intercept='.76'/%3E%3CfeFuncB type='linear' slope='.3' intercept='.76'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)'/%3E%3C/svg%3E");
  --fiber: repeating-linear-gradient(92deg, rgba(120, 88, 40, .045) 0 1px, transparent 1px 4px);

  position: relative; box-sizing: border-box; max-width: 1120px; padding: 13px 13px 15px;
  font-family: var(--serif); font-size: 13px; line-height: 1.62; color: var(--ink);
  background-color: var(--paper);
  background-image: var(--grain), radial-gradient(120% 70% at 50% 0%, rgba(255, 251, 238, .72), transparent 62%), var(--fiber);
  background-blend-mode: multiply, normal, normal;
  border-radius: 5px; box-shadow: inset 0 0 80px rgba(139, 90, 43, .15), inset 0 0 0 1px rgba(107, 74, 46, .22);
  --bg: #fbf3df; --accent: #8a5b12;
}
.op * { box-sizing: border-box; }
.op, .op button, .op input, .op select { font-family: var(--serif); }

.op-top { display: flex; align-items: center; gap: 11px; flex-wrap: wrap; margin-bottom: 10px; }
.op-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.op-mark { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; color: #3a2a0c;
  border: 2px solid var(--brown); background: radial-gradient(circle at 36% 28%, #f8e2a8, #c0942c 58%, #8a6516);
  box-shadow: inset 0 1px 0 rgba(255, 248, 220, .8), inset 0 -2px 4px rgba(80, 50, 15, .3), 0 1px 2px rgba(80, 50, 20, .25); }
.op-mark svg { width: 20px; height: 20px; }
.op-name { font-family: var(--serif); font-size: 19px; font-weight: 700; letter-spacing: .05em; line-height: 1.15; color: #2e2010; }
.op-sub { font-family: var(--type); font-size: 11.5px; color: var(--mute); }
.op-chips { margin-left: auto; display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.op-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 9px;
  border: 1px solid var(--line); border-radius: 2px 5px 3px 5px; background: rgba(255, 251, 238, .45);
  color: var(--mute); white-space: nowrap; font-family: var(--type); }
.op-chip svg { width: 13px; height: 13px; opacity: .85; }
.op-chip.gold { background: rgba(184, 137, 31, .16); color: #6d4c07; border-color: rgba(107, 74, 46, .45); }
.op-chip.red { background: rgba(165, 52, 42, .13); color: #8d2114; border-color: rgba(141, 33, 20, .4); }

.op-tabs { display: flex; gap: 3px; margin: 0 0 12px; padding: 4px; overflow-x: auto;
  border: 1px solid var(--line2); border-radius: 3px 9px 3px 9px; background: rgba(139, 90, 43, .09); }
.op-tab { border: 0; background: transparent; color: var(--mute); font: inherit; font-size: 12.5px; padding: 6px 12px;
  border-radius: 2px 5px 3px 5px; cursor: pointer; white-space: nowrap; letter-spacing: .02em; }
.op-tab:hover { color: var(--ink); background: rgba(255, 251, 238, .5); }
.op-tab.on { background: var(--bg); color: #2e2010; font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(107, 74, 46, .4), 0 1px 2px rgba(90, 60, 25, .18); }

.op-cols { display: grid; gap: 12px; grid-template-columns: minmax(0, 1.42fr) minmax(272px, 1fr); align-items: start; }
.op-col { min-width: 0; }
.op-col > * + * { margin-top: 10px; }
@media (max-width: 900px) {
  .op-slot .ring { width: 42px; height: 42px; }
  .op-slot .ring svg { width: 19px; height: 19px; }
  .op-slot .pc { font-size: 10px; }
  .op-slot .lb2 { font-size: 9.5px; }
}
@media (max-width: 720px) { .op-cols { grid-template-columns: minmax(0, 1fr); } }

/* 卡片：一张张纸，边角不齐，厚度靠内描边 */
.op-card { position: relative; padding: 13px 15px; color: var(--ink);
  border: 1px solid var(--line); border-radius: 3px 9px 4px 8px / 8px 4px 9px 3px;
  background-color: var(--paper-2);
  background-image: var(--grain), var(--fiber);
  background-blend-mode: multiply, normal;
  box-shadow: inset 0 0 0 1px rgba(255, 252, 240, .55), inset 0 1px 14px rgba(139, 90, 43, .07),
    0 1px 0 rgba(90, 60, 25, .07), 0 2px 5px rgba(90, 60, 25, .06); }
.op-card.flush { padding: 0; overflow: hidden; }
.op-sec { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.op-sec .t { font-size: 10.5px; letter-spacing: .18em; font-weight: 700; color: #6d4c07; }
.op-sec .r { flex: 1; height: 1px; background: linear-gradient(90deg, var(--line), transparent); }
.op-sec .n { font-size: 11px; color: var(--dim); white-space: nowrap; font-family: var(--type); }
.op-h3 { font-family: var(--serif); font-size: 19px; font-weight: 700; margin: 0; letter-spacing: .03em; color: #2b1d0c; }
.op-k { color: var(--mute); font-size: 11.5px; letter-spacing: .04em; }
.op-v { font-size: 15px; font-weight: 700; color: #2b1d0c; }
.op-muted { color: var(--dim); font-size: 11.5px; }
.op-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.op-empty { color: var(--dim); padding: 16px 0; font-size: 12px; }
.ic { display: block; }

/* 顶部横幅：一张撕下边的旧画 */
.op-banner { position: relative; overflow: hidden; min-height: 172px; color: #f5eddd;
  background: #0a2233; border-radius: 4px 4px 0 0;
  clip-path: ${TEAR_BANNER};
  filter: drop-shadow(0 3px 5px rgba(70, 45, 15, .38)); }
.op-banner .scene { position: absolute; inset: 0; width: 100%; height: 100%; }
.op-banner .body { position: relative; padding: 18px 20px 20px; max-width: 60%; }
.op-banner .kicker { font-size: 10px; letter-spacing: .26em; color: #e6c98c; font-weight: 700; }
.op-banner .title { font-family: var(--serif); font-size: 25px; font-weight: 700; letter-spacing: .04em;
  margin: 5px 0 4px; text-shadow: 0 1px 10px rgba(0, 0, 0, .4); }
.op-banner .meta { font-family: var(--type); font-size: 11.5px; color: rgba(245, 237, 221, .76); }
.op-banner .ship { position: absolute; right: 2px; bottom: 11px; width: 246px; max-width: 44%;
  filter: drop-shadow(0 9px 14px rgba(0, 0, 0, .38)); }
.op-banner .ship svg { display: block; width: 100%; height: auto; animation: op-bob 6s ease-in-out infinite; }
@keyframes op-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@media (prefers-reduced-motion: reduce) { .op-banner .ship svg { animation: none; } }
@media (max-width: 720px) {
  .op-banner .body { max-width: 100%; padding-bottom: 78px; }
  .op-banner .ship { width: 182px; opacity: .94; }
}
.op-trail { position: relative; height: 6px; margin-top: 15px; border-radius: 0;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, .22) 0 8px, rgba(255, 255, 255, 0) 8px 16px); }
.op-trail > i { position: absolute; left: 0; top: 0; bottom: 0;
  background: linear-gradient(90deg, #b8791a, #f3d189); box-shadow: 0 0 10px rgba(243, 209, 137, .45); }
.op-trail > b { position: absolute; top: 50%; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px;
  transform: rotate(45deg); background: #fff6e0; box-shadow: 0 0 0 2px rgba(255, 246, 224, .28); }

/* 按钮：一块块小木牌 */
.op-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  border: 1.5px solid var(--brown); color: #4a3018;
  background-image: linear-gradient(180deg, #f6e6c4, #e6d0a6);
  border-radius: 2px 6px 3px 6px; padding: 5px 12px; font: inherit; font-size: 12.5px; cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 251, 236, .8), inset 0 -2px 4px rgba(107, 74, 46, .16), 0 1px 2px rgba(90, 60, 25, .16); }
.op-btn:hover { background-image: linear-gradient(180deg, #fbf0d6, #ecd9b3); border-color: var(--brown-2); color: #33240f; }
.op-btn:active { box-shadow: inset 0 2px 5px rgba(107, 74, 46, .3); }
.op-btn[disabled] { opacity: .42; cursor: default; box-shadow: none; }
.op-btn svg { width: 14px; height: 14px; }
.op-btn.primary { border: 2px solid var(--brown-3); color: #35240b; font-weight: 700; letter-spacing: .02em;
  background-image: linear-gradient(180deg, #eccd7c, #c99c34);
  box-shadow: inset 0 2px 0 rgba(255, 246, 214, .65), inset 0 -3px 7px rgba(90, 60, 15, .38),
    0 2px 0 var(--brown-3), 0 3px 7px rgba(70, 45, 10, .25); }
.op-btn.primary:hover { background-image: linear-gradient(180deg, #f4dc96, #d4a93f); color: #33240f; }
.op-btn.primary[disabled] { background-image: none; background-color: var(--soft); border-color: var(--line);
  color: var(--dim); box-shadow: none; }
.op-btn.sm { padding: 2px 9px; font-size: 11.5px; }
.op-btn.wide { width: 100%; margin-top: 10px; padding: 7px 14px; }
.op-btn.ghost { border-style: dashed; color: var(--mute); background-image: none; background-color: transparent; box-shadow: none; }
.op-link { border: 0; background: transparent; color: #8a5b12; font: inherit; font-size: 12px;
  cursor: pointer; padding: 2px 4px; text-decoration: underline; text-underline-offset: 2px; }
.op-link:hover { color: #6d4c07; }

/* 主按钮：一块凸起的木牌 */
.op-cta { width: 100%; margin-top: 13px; padding: 11px 16px; border-radius: 3px 4px 3px 4px; font: inherit; font-size: 15px;
  font-weight: 700; letter-spacing: .05em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  color: #33240b; border: 2px solid var(--brown-3);
  background-image: linear-gradient(180deg, #eed18a, #c99c34);
  box-shadow: inset 0 2px 0 rgba(255, 247, 218, .68), inset 0 -4px 9px rgba(90, 60, 15, .34),
    0 3px 0 var(--brown-3), 0 6px 12px rgba(70, 45, 10, .24); }
.op-cta:hover { background-image: linear-gradient(180deg, #f6df9e, #d4a93f); }
.op-cta:active { transform: translateY(2px); box-shadow: inset 0 3px 8px rgba(90, 60, 15, .4), 0 1px 0 var(--brown-3); }
.op-cta.boss { color: #fbeee0; border-color: #46170e;
  background-image: linear-gradient(180deg, #c1472c, #8b2013);
  box-shadow: inset 0 2px 0 rgba(255, 214, 190, .38), inset 0 -4px 9px rgba(60, 12, 6, .45),
    0 3px 0 #46170e, 0 6px 14px rgba(90, 22, 12, .3); }
.op-cta.boss:hover { background-image: linear-gradient(180deg, #cf5334, #98261a); }
.op-cta.boss svg { animation: op-pulse 2.4s ease-in-out infinite; }
@keyframes op-pulse { 0%, 100% { opacity: .86; } 50% { opacity: 1; } }
.op-cta[disabled] { background-image: none; background-color: var(--soft); color: var(--dim); border-color: var(--line);
  box-shadow: none; cursor: default; transform: none; }
.op-cta svg { width: 18px; height: 18px; }
/* 航程中：主按钮变成一块「船在海上」的木牌，右边挂一个花钱的加速阀 */
.op-wait { display: flex; gap: 8px; margin-top: 13px; align-items: stretch; }
.op-wait .op-cta { margin-top: 0; flex: 1; font-size: 14px; letter-spacing: .02em;
  font-variant-numeric: tabular-nums; }
.op-wait .op-btn { flex: 0 0 auto; white-space: nowrap; }

/* 提示条 / 测试条 */
.op-note { margin-bottom: 10px; padding: 7px 12px; font-size: 12px; white-space: pre-line;
  border: 1px solid var(--line2); border-left: 3px solid var(--brown-2); border-radius: 2px 6px 3px 6px;
  background: rgba(255, 251, 238, .55); color: var(--mute); }
.op-note.warn { border-left-color: var(--red); background: rgba(165, 52, 42, .08); color: #7d2418; }

/* 对决条：一条绷紧的绳，两边的力气压在中间的交叉刀上 */
.op-duel { margin-top: 12px; }
.op-duel .nums { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 8px; margin-bottom: 6px; }
.op-duel .side { display: flex; align-items: center; gap: 5px; min-width: 0; }
.op-duel .side.me { justify-self: start; }
.op-duel .side.foe { justify-self: end; }
.op-duel .side .lb { font-size: 11px; color: var(--mute); white-space: nowrap; }
.op-duel .side b { font-family: var(--type); font-size: 19px; font-weight: 700; letter-spacing: .01em; line-height: 1.1; }
.op-duel .side svg { width: 14px; height: 14px; opacity: .6; }
.op-duel .me b { color: #7d5a10; }
.op-duel .foe b { color: var(--red); }
.op-duel .gap { justify-self: center; }
.op-duel .track { position: relative; height: 18px; overflow: visible;
  box-shadow: inset 0 0 0 1.5px var(--brown); background: #dfc9a0; border-radius: 0; }
.op-duel .track > i { position: absolute; top: 0; bottom: 0; }
.op-duel .track > i.me { left: 0;
  background: repeating-linear-gradient(0deg, #f4dc9a 0 3px, #e2c073 3px 6px);
  clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 100%, 0 100%); }
.op-duel .track > i.foe { right: 0;
  background: repeating-linear-gradient(135deg, #7f2015 0 4px, #a5342a 4px 8px);
  clip-path: polygon(7px 0, 100% 0, 100% 100%, 0 100%); }
.op-duel .track .clash { position: absolute; top: 50%; width: 28px; height: 28px; margin: -14px 0 0 -14px;
  border-radius: 50%; background: radial-gradient(circle at 36% 30%, #f8e2a8, #c0942c 58%, #7d5a12);
  border: 2px solid var(--brown-3); color: #2e2008; display: grid; place-items: center;
  box-shadow: inset 0 1px 0 rgba(255, 248, 220, .7), 0 1px 4px rgba(60, 35, 10, .45); }
.op-duel .track .clash svg { width: 16px; height: 16px; }
.op-duel .verdict { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 8px; font-size: 11.5px; color: var(--mute); }

/* BOSS 三回合：三条刻尺 */
.op-rounds { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; padding-top: 11px;
  border-top: 1px dashed var(--line); }
.op-round { display: grid; grid-template-columns: 58px 1fr 82px; gap: 10px; align-items: center; }
.op-round .rl { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--mute); font-weight: 700; }
.op-round .rl svg { width: 13px; height: 13px; opacity: .8; }
.op-round .gauge { position: relative; height: 10px; overflow: visible;
  background: repeating-linear-gradient(90deg, rgba(107, 74, 46, .28) 0 1px, transparent 1px 11px), #e2cea6;
  box-shadow: inset 0 0 0 1.5px rgba(107, 74, 46, .55); }
.op-round .gauge > i { position: absolute; left: 0; top: 0; bottom: 0;
  background: linear-gradient(90deg, #8d2114, #c9603f); }
.op-round .gauge > i.win { background: linear-gradient(90deg, #2c6b45, #5aa877); }
.op-round .gauge > em { position: absolute; top: -4px; bottom: -4px; width: 2px; background: var(--gold); opacity: .95; }
.op-round .gauge > em::after { content: ''; position: absolute; left: -3px; top: -3px; width: 8px; height: 8px;
  transform: rotate(45deg); background: var(--gold); box-shadow: 0 0 0 1px rgba(80, 50, 10, .5); }
.op-round .num { font-family: var(--type); font-size: 11.5px; color: var(--dim); text-align: right; white-space: nowrap; }
.op-round .num b { font-size: 13px; color: var(--ink); }
.op-bonus { display: inline-block; margin-left: 4px; font-size: 10px; padding: 0 5px;
  border: 1px solid rgba(44, 107, 69, .4); background: rgba(44, 107, 69, .13); color: #2c6b45; }

/* 词条 / 标记 */
.op-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; padding: 1px 7px;
  border: 1px solid var(--line); border-radius: 1px 4px 2px 4px; background: rgba(255, 251, 238, .5);
  color: var(--mute); white-space: nowrap; }
.op-tag.great { background: rgba(184, 137, 31, .2); color: #6d4c07; border-color: rgba(184, 137, 31, .5); }
.op-tag.success { background: rgba(44, 107, 69, .14); color: #2c6b45; border-color: rgba(44, 107, 69, .38); }
.op-tag.narrow { background: rgba(183, 121, 31, .17); color: #8a5b12; border-color: rgba(183, 121, 31, .42); }
.op-tag.failed, .op-tag.captured { background: rgba(165, 52, 42, .13); color: var(--red); border-color: rgba(165, 52, 42, .38); }
.op-tag.game { background: rgba(139, 90, 43, .14); color: #6d4c07; border-color: rgba(139, 90, 43, .35); }

/* 建议 */
.op-advice { display: flex; flex-direction: column; gap: 6px; }
.op-adv { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 2px 5px 3px 5px;
  background: rgba(139, 90, 43, .07); border: 1px solid var(--line2); }
.op-adv .dot { width: 6px; height: 6px; border-radius: 50%; flex: 0 0 auto; background: var(--brown-2); }
.op-adv.warn .dot { background: var(--red); }
.op-adv.good .dot { background: #2c6b45; }
.op-adv .tx { flex: 1; min-width: 0; font-size: 12px; color: var(--mute); }
.op-adv .btn { flex: 0 0 auto; }

/* 战力：五枚徽章 */
.op-slots { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 10px; }
.op-slot { text-align: center; }
.op-slot .ring { position: relative; width: 48px; height: 48px; margin: 0 auto; border-radius: 50%;
  display: grid; place-items: center; color: #7a5f3e; border: 2px solid var(--brown);
  background: radial-gradient(circle at 36% 28%, #f7ecd2, #ddc8a0 56%, #b8a074);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .65), inset 0 -2px 5px rgba(107, 74, 46, .32), 0 1px 2px rgba(80, 50, 20, .18); }
.op-slot .ring::after { content: ''; position: absolute; inset: 3px; border-radius: 50%;
  border: 1px dashed rgba(107, 74, 46, .38); pointer-events: none; }
.op-slot .ring svg { width: 22px; height: 22px; opacity: .55; position: relative; z-index: 1; }
.op-slot.on .ring { color: #4a3018;
  background: radial-gradient(circle at 36% 26%, #ffecb8, #d9a521 56%, #a8781a);
  box-shadow: inset 0 1px 0 rgba(255, 248, 220, .85), inset 0 -2px 5px rgba(90, 55, 10, .42),
    0 0 0 2px rgba(184, 137, 31, .2), 0 1px 3px rgba(80, 50, 20, .28); }
.op-slot.on .ring svg { opacity: .95; }
.op-slot .pc { font-family: var(--type); font-size: 11.5px; font-weight: 700; margin-top: 4px; color: var(--mute); }
.op-slot.on .pc { color: #6d4c07; }
.op-slot .lb2 { font-size: 10px; color: var(--dim); letter-spacing: .06em; }
.op-base { display: flex; align-items: baseline; gap: 8px; margin-top: 10px; padding-top: 9px; border-top: 1px dashed var(--line); }
.op-base b { font-family: var(--type); font-size: 28px; font-weight: 700; letter-spacing: .01em; color: #2b1d0c; }

/* 挂机 */
.op-pips { display: flex; gap: 4px; margin-top: 9px; }
.op-pips i { height: 6px; flex: 1; background: rgba(107, 74, 46, .2); box-shadow: inset 0 0 0 1px rgba(107, 74, 46, .25); }
.op-pips i.on { background: linear-gradient(180deg, #e8c877, #c0942c); box-shadow: inset 0 0 0 1px rgba(90, 60, 20, .4); }

/* 航线卡：上半张画、下半张纸 */
.op-routes { display: grid; grid-template-columns: repeat(auto-fit, minmax(238px, 1fr)); gap: 11px; }
.op-route { position: relative; overflow: hidden; color: var(--ink);
  border: 1.5px solid var(--brown); border-radius: 2px 6px 3px 7px;
  background-color: var(--paper-2); background-image: var(--grain); background-blend-mode: multiply;
  box-shadow: inset 0 0 0 1px rgba(255, 252, 240, .5), 0 2px 5px rgba(70, 45, 15, .14); }
.op-route.high { border-color: #7d1d13; box-shadow: inset 0 0 0 1px rgba(255, 220, 200, .3), 0 0 0 2px rgba(141, 33, 20, .16), 0 2px 8px rgba(141, 33, 20, .3); }
.op-route .band { position: relative; height: 96px; clip-path: ${TEAR_BAND}; }
.op-route .band svg { display: block; width: 100%; height: 100%; }
.op-route .band .kind { position: absolute; left: 10px; bottom: 12px; font-size: 9.5px; letter-spacing: .2em;
  color: rgba(255, 246, 230, .88); text-shadow: 0 1px 4px rgba(0, 0, 0, .6); font-weight: 700; }
.op-route .body { position: relative; padding: 9px 12px 11px; }
.op-route .body::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 7px;
  background: linear-gradient(180deg, rgba(60, 35, 10, .28), transparent); pointer-events: none; }
.op-route h4 { margin: 0; font-family: var(--serif); font-size: 15px; font-weight: 700; letter-spacing: .03em; color: #2b1d0c; }
.op-route .where { color: var(--dim); font-size: 11px; margin-top: 1px; }
.op-route p { margin: 6px 0 8px; color: var(--mute); font-size: 12px; min-height: 30px; }
.op-route .foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }

/* 危险度：一块红漆木牌 */
.op-risk { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px 2px 6px; white-space: nowrap;
  color: #fbeee0; border: 1.5px solid #46170e; border-radius: 1px 4px 2px 4px;
  background-image: linear-gradient(180deg, #b03d28, #8b2013);
  box-shadow: inset 0 1px 0 rgba(255, 210, 190, .3), inset 0 -2px 4px rgba(60, 12, 6, .4), 0 1px 2px rgba(60, 20, 10, .3); }
.op-risk svg { width: 16px; height: 16px; }
.op-risk .lb { font-size: 10.5px; font-weight: 700; letter-spacing: .08em; }
.op-risk .stars { display: inline-flex; gap: 2px; margin-left: 1px; }
.op-risk .stars i { width: 5px; height: 5px; background: rgba(255, 236, 220, .32); }
.op-risk .stars i.on { background: #ffe6b8; }

/* 船坞 */
.op-stage { position: relative; overflow: hidden; min-height: 232px; border: 1.5px solid var(--brown);
  border-radius: 2px 6px 3px 6px; background: linear-gradient(180deg, #07202f, #0d3b54 58%, #14536d);
  box-shadow: inset 0 0 0 1px rgba(255, 235, 200, .12), inset 0 0 60px rgba(0, 0, 0, .35); }
.op-stage .sky { position: absolute; inset: 0; width: 100%; height: 100%; }
.op-stage .shipbox { position: relative; width: 84%; max-width: 450px; margin: 20px auto 6px;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, .4)); }
.op-stage .shipbox > .art svg { display: block; width: 100%; height: auto; }
.op-stage .cap { position: absolute; left: 13px; top: 11px; font-size: 9.5px; letter-spacing: .22em;
  color: rgba(255, 240, 214, .6); font-weight: 700; }
/* 交互点：黄铜齿轮 */
.op-hot { position: absolute; transform: translate(-50%, -50%); width: 28px; height: 28px; padding: 0;
  border-radius: 50%; border: 1.5px solid var(--brown-3); color: #2e2008; cursor: pointer;
  display: grid; place-items: center;
  background: radial-gradient(circle at 36% 30%, #f8e2a8, #c0942c 58%, #7d5a12);
  box-shadow: inset 0 1px 0 rgba(255, 248, 220, .75), inset 0 -2px 4px rgba(80, 50, 10, .4), 0 1px 4px rgba(0, 0, 0, .5);
  transition: transform .16s ease, box-shadow .16s ease; }
.op-hot svg { width: 17px; height: 17px; opacity: .95; stroke-width: 1.9; }
.op-hot:hover { transform: translate(-50%, -50%) scale(1.22);
  box-shadow: inset 0 1px 0 rgba(255, 248, 220, .8), 0 0 14px rgba(255, 214, 120, .65), 0 1px 5px rgba(0, 0, 0, .5); }
.op-hot.on { background: radial-gradient(circle at 36% 30%, #fff0c0, #e0ad2c 58%, #a8781a);
  box-shadow: inset 0 1px 0 rgba(255, 252, 230, .9), 0 0 0 3px rgba(255, 214, 120, .32), 0 0 16px rgba(255, 214, 120, .6); }
.op-hot .tag { position: absolute; left: 50%; top: 100%; transform: translateX(-50%); margin-top: 4px;
  font-size: 9.5px; white-space: nowrap; padding: 1px 6px; border: 1px solid rgba(255, 235, 200, .35);
  background: rgba(6, 26, 38, .82); color: #ffedcf; opacity: 0; pointer-events: none; transition: opacity .15s; }
.op-hot:hover .tag, .op-hot.on .tag { opacity: 1; }

/* 六个部件：木牌 */
.op-parts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 10px; }
.op-parts.six { grid-template-columns: repeat(6, 1fr); }
@media (max-width: 900px) { .op-parts.six { grid-template-columns: repeat(3, 1fr); row-gap: 7px; } }
.op-part-mini { position: relative; text-align: left; border: 1.5px solid var(--brown); color: #4a3018;
  border-radius: 2px 5px 3px 5px; padding: 5px 7px; font: inherit; cursor: pointer;
  background-image: linear-gradient(180deg, #f4e4c4, #e4cea4);
  box-shadow: inset 0 1px 0 rgba(255, 251, 236, .8), inset 0 -2px 4px rgba(107, 74, 46, .14), 0 1px 2px rgba(80, 50, 20, .16); }
.op-part-mini:hover { background-image: linear-gradient(180deg, #fbefd4, #ead6ae); }
.op-part-mini.on { border-color: var(--brown-3); color: #2b1d0c;
  background-image: linear-gradient(180deg, #e7d0a2, #d6ba88);
  box-shadow: inset 0 2px 5px rgba(90, 60, 25, .32), 0 0 0 1px rgba(90, 60, 25, .18); }
.op-part-mini .nm { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; }
.op-part-mini .nm svg { width: 13px; height: 13px; opacity: .8; }
.op-part-mini .lv { font-family: var(--type); font-size: 10px; color: var(--dim); }
.op-part-mini.on .lv { color: #5c452a; }
.op-dots { display: inline-flex; gap: 2px; vertical-align: middle; }
.op-dots i { width: 5px; height: 5px; background: rgba(107, 74, 46, .22); box-shadow: inset 0 0 0 1px rgba(107, 74, 46, .3); }
.op-dots i.on { background: linear-gradient(180deg, #d9a521, #a8781a); box-shadow: none; }

.op-detail { margin-top: 10px; padding: 10px 12px; border-radius: 2px 6px 3px 6px;
  border: 1px solid var(--line2); background: rgba(139, 90, 43, .08); }
.op-detail .hd { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.op-detail .ef { font-size: 11.5px; color: var(--mute); margin-top: 4px; }
.op-detail .cost { font-family: var(--type); font-size: 11px; color: var(--dim); margin-top: 2px; }

/* 材料：皮革背包格 */
.op-bag { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 10px; }
.op-mat { position: relative; height: 64px; border: 1.5px solid var(--brown); border-radius: 2px 4px 2px 5px;
  background: linear-gradient(180deg, #efe0bd, #e0caa2);
  box-shadow: inset 0 2px 6px rgba(107, 74, 46, .22), inset 0 0 0 1px rgba(255, 251, 236, .5);
  display: grid; place-items: center; }
.op-mat.empty { border-style: dashed; border-color: rgba(107, 74, 46, .35); background: rgba(139, 90, 43, .05);
  box-shadow: none; opacity: .7; }
.op-mat svg { width: 34px; height: 34px; }
.op-mat .n { position: absolute; right: 5px; bottom: 2px; font-family: var(--type); font-size: 12px; font-weight: 700; color: #3a2a18; }
.op-mat .nm2 { position: absolute; left: 0; right: 0; top: 2px; text-align: center; font-size: 9.5px; color: var(--dim); letter-spacing: .1em; }

/* 羁绊：两张小通缉令，中间一根红绳 */
.op-bonds { display: grid; gap: 7px; margin-top: 10px; }
.op-bond { display: grid; grid-template-columns: 36px 30px 36px 1fr; align-items: center; gap: 6px;
  padding: 6px 8px; border-radius: 2px 5px 3px 5px; border: 1px solid var(--line2);
  background: rgba(139, 90, 43, .05); }
.op-bond .face { width: 34px; height: 40px; display: grid; place-items: center; position: relative;
  border: 2px solid var(--brown); border-radius: 0; background: linear-gradient(180deg, #f7eed6, #e8d7b2);
  color: #3a2a18; font-family: var(--serif); font-weight: 700; font-size: 15px;
  box-shadow: inset 0 0 0 2px rgba(107, 74, 46, .28), inset 0 0 10px rgba(139, 90, 43, .18); }
.op-bond .face::after { content: ''; position: absolute; left: 50%; top: 3px; width: 3px; height: 3px;
  margin-left: -1.5px; border-radius: 50%; background: rgba(107, 74, 46, .5); }
.op-bond .link { position: relative; height: 3px; border-radius: 2px; background: rgba(107, 74, 46, .25); }
.op-bond .link::before, .op-bond .link::after { content: ''; position: absolute; top: -2.5px; width: 8px; height: 8px;
  border-radius: 50%; background: #cbb488; }
.op-bond .link::before { left: -2px; } .op-bond .link::after { right: -2px; }
.op-bond.on .link { background: repeating-linear-gradient(115deg, #a5342a 0 3px, #8d2114 3px 6px);
  box-shadow: 0 0 6px rgba(165, 52, 42, .5); }
.op-bond.on .link::before, .op-bond.on .link::after { background: #8d2114; box-shadow: 0 0 4px rgba(165, 52, 42, .6); }
.op-bond .meta { min-width: 0; }
.op-bond .meta b { display: block; font-size: 12px; font-weight: 700; color: #2b1d0c; }
.op-bond .meta em { display: block; font-style: normal; font-size: 10.5px; color: var(--dim); }
.op-bond:not(.on) { opacity: .6; }

/* 头像排 */
.op-faces { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 10px; }
.op-face { width: 27px; height: 27px; display: grid; place-items: center; font-size: 11px; font-weight: 700;
  color: #3a2a18; border: 1.5px solid var(--brown); border-radius: 0;
  background: linear-gradient(180deg, #f7eed6, #e5d2ac); box-shadow: inset 0 0 0 1px rgba(107, 74, 46, .22); }
.op-face.away { opacity: .4; }

/* 船员 */
.op-crew { display: grid; grid-template-columns: repeat(auto-fit, minmax(212px, 1fr)); gap: 8px; margin-top: 10px; }
.op-mate { display: flex; gap: 9px; align-items: flex-start; border: 1px solid var(--line2); border-radius: 2px 5px 3px 5px;
  padding: 8px 9px; background: rgba(139, 90, 43, .045); }
.op-mate.away { opacity: .6; }
.op-mate .av { flex: 0 0 auto; width: 34px; height: 40px; display: grid; place-items: center; font-size: 14px;
  font-weight: 700; color: #3a2a18; border: 2px solid var(--brown); background: linear-gradient(180deg, #f7eed6, #e8d7b2);
  box-shadow: inset 0 0 0 2px rgba(107, 74, 46, .22); }
.op-mate .nm { font-size: 13px; font-weight: 700; color: #2b1d0c; }
.op-mate .rl { font-size: 10.5px; color: var(--dim); }
.op-mate .ef { font-size: 10.5px; color: var(--mute); margin-top: 2px; }
.op-mate .bar { height: 4px; background: rgba(107, 74, 46, .18); margin-top: 5px; overflow: hidden; }
.op-mate .bar > i { display: block; height: 100%; background: #3f7a4a; }
.op-mate .bar > i.worn { background: #c0942c; }
.op-mate .bar > i.hot { background: #a5342a; }
.op-mate .away-tag { display: inline-block; margin-left: 5px; font-size: 9.5px; padding: 0 5px;
  border: 1px solid rgba(183, 121, 31, .5); background: rgba(183, 121, 31, .16); color: #8a5b12; }

/* 收藏 */
.op-shelf { display: grid; grid-template-columns: repeat(auto-fill, minmax(98px, 1fr)); gap: 6px; margin-top: 10px; }
.op-blade { position: relative; border: 1px solid var(--line2); border-radius: 2px 5px 3px 5px; padding: 6px 6px 5px;
  text-align: center; background: rgba(255, 251, 238, .35); font: inherit; color: inherit; cursor: default; }
.op-blade.owned { border-color: rgba(184, 137, 31, .55);
  background-image: linear-gradient(180deg, rgba(217, 165, 33, .12), transparent); }
.op-blade.equipped { box-shadow: inset 0 0 0 1px rgba(217, 165, 33, .7); }
.op-blade .art svg { width: 100%; height: 58px; }
.op-blade .nm { font-size: 11.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.op-blade .gd { font-size: 9.5px; color: var(--dim); }
.op-blade .pw { font-family: var(--type); font-size: 10px; color: #6d4c07; }
.op-blade .src { font-size: 9px; color: var(--dim); line-height: 1.25; margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.op-blade .eq { position: absolute; top: 4px; right: 4px; font-size: 9px; padding: 0 5px;
  background: #b8891f; color: #2e2008; border: 1px solid var(--brown); }
.op-blade button { width: 100%; margin-top: 4px; padding: 2px 4px; font-size: 10.5px; }
.op-grade-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
.op-grade { border: 1px solid var(--line2); background: rgba(139, 90, 43, .06); color: var(--mute); font: inherit;
  font-size: 11px; padding: 2px 9px; border-radius: 1px 4px 2px 4px; cursor: pointer; }
.op-grade.on { border-color: var(--brown); color: #4a3018; background: rgba(217, 165, 33, .18); font-weight: 700; }

.op-fruits { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 6px; margin-top: 10px; }
.op-fruit { text-align: center; padding: 6px 4px 5px; border: 1px solid transparent; border-radius: 2px 5px 3px 5px; }
.op-fruit.seen { border-color: var(--line2); background: rgba(139, 90, 43, .07); }
.op-fruit .art svg { width: 50px; height: 50px; margin: 0 auto; }
.op-fruit .nm { font-size: 11px; font-weight: 700; margin-top: 2px; }
.op-fruit .tg { font-size: 9.5px; color: var(--dim); }
.op-fruit.dim { opacity: .42; }
.op-fruit.eaten { border-color: rgba(184, 137, 31, .6); background: rgba(217, 165, 33, .14); }
.op-fruit button { width: 100%; margin-top: 4px; padding: 2px 4px; font-size: 10.5px; }

.op-haki { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line2); }
.op-haki:first-of-type { border-top: 0; }
.op-haki .nm { width: 58px; font-size: 12.5px; font-weight: 700; }
.op-haki .pip { display: inline-flex; gap: 3px; }
.op-haki .pip i { width: 11px; height: 11px; background: rgba(107, 74, 46, .2); box-shadow: inset 0 0 0 1px rgba(107, 74, 46, .3); }
.op-haki .pip i.on { background: linear-gradient(180deg, #d9a521, #a8781a); box-shadow: none; }
.op-haki .per { font-family: var(--type); font-size: 10.5px; color: var(--dim); }

/* 图鉴 */
.op-glyphs { display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); gap: 7px; margin-top: 10px; }
.op-glyph { border: 1px solid var(--line2); border-radius: 2px 5px 3px 5px; padding: 7px; text-align: center; }
.op-glyph.on { border-color: rgba(183, 121, 31, .55); background: rgba(183, 121, 31, .08); }
.op-glyph .art svg { width: 100%; height: 62px; }
.op-glyph .nm { font-size: 11.5px; font-weight: 700; margin-top: 2px; }
.op-glyph .wh { font-size: 9.5px; color: var(--dim); }
.op-glyph .ln { font-size: 10.5px; color: var(--mute); margin-top: 3px; min-height: 42px; }
.op-void { margin-top: 9px; padding: 10px 12px; border-radius: 2px 6px 3px 6px; border: 1.5px solid rgba(141, 33, 20, .55);
  background: rgba(165, 52, 42, .08); }
.op-void.locked { border: 1px dashed var(--line); background: transparent; opacity: .75; }
.op-cx-sec { margin-top: 10px; }
.op-cx-hd { display: flex; align-items: baseline; justify-content: space-between; font-size: 11px; color: var(--mute); margin-bottom: 5px; }
.op-cx-items { display: flex; flex-wrap: wrap; gap: 4px; }
.op-cx-item { font-size: 10.5px; padding: 1px 7px; border: 1px solid var(--line2); color: var(--dim);
  border-radius: 1px 4px 2px 4px; }
.op-cx-item.on { color: var(--ink); border-color: rgba(184, 137, 31, .45); background: rgba(217, 165, 33, .12); }
.op-cx-item small { opacity: .6; margin-left: 3px; }

/* 不可逆的那几件事：一块旧皮 */
.op-event { position: relative; overflow: hidden; border-radius: 2px 8px 3px 8px; padding: 16px 18px 14px; color: #f3e9d6;
  background-image: linear-gradient(160deg, #1b120c 0%, #2a1c12 45%, #34241a 100%);
  box-shadow: inset 0 0 0 1px rgba(214, 181, 120, .3), inset 0 0 40px rgba(0, 0, 0, .3), 0 4px 14px rgba(30, 18, 8, .22); }
.op-event .kick { font-size: 10px; letter-spacing: .3em; color: #c9a86a; font-weight: 700; }
.op-event .ttl { font-family: var(--serif); font-size: 25px; font-weight: 700; letter-spacing: .08em; margin: 4px 0 9px; }
.op-event p { margin: 0 0 6px; font-size: 13px; line-height: 1.8; color: rgba(243, 233, 214, .92); }
.op-event .rule { height: 1px; background: linear-gradient(90deg, rgba(201, 168, 106, .55), transparent); margin: 11px 0 9px; }
.op-event .boon { font-size: 11.5px; color: #e6cf9a; }
.op-event .btn { margin-top: 11px; border-color: rgba(214, 181, 120, .55); background-image: none;
  background-color: transparent; color: #f3e9d6; box-shadow: none; }
.op-event .btn:hover { background-color: rgba(214, 181, 120, .16); border-color: #d6b578; color: #fff; }

/* 抉择：一张贴在墙上的告示 */
.op-choice { border: 1.5px solid rgba(141, 33, 20, .45); border-radius: 2px 7px 3px 7px; padding: 12px 14px;
  background-image: linear-gradient(180deg, rgba(217, 165, 33, .12), rgba(217, 165, 33, .04)); }
.op-choice .t { font-size: 16px; font-weight: 700; color: #2b1d0c; }
.op-choice .p { color: var(--mute); font-size: 12px; margin: 3px 0 9px; }
.op-choice .opt { display: block; width: 100%; text-align: left; margin-top: 6px; padding: 7px 11px;
  border: 1px solid var(--line); border-radius: 2px 5px 3px 5px; background: var(--bg); color: inherit;
  font: inherit; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255, 251, 236, .7); }
.op-choice .opt:hover { border-color: var(--brown); background: #fdf6e6; }
.op-choice .opt b { font-weight: 700; font-size: 12.5px; }
.op-choice .opt span { display: block; color: var(--dim); font-size: 11px; margin-top: 1px; }

/* 日志 */
.op-log { display: flex; flex-direction: column; }
.op-entry { display: grid; grid-template-columns: 26px 1fr auto; gap: 9px; align-items: start; padding: 6px 0;
  border-top: 1px dashed var(--line2); }
.op-entry:first-child { border-top: 0; padding-top: 2px; }
.op-entry .ic2 { width: 26px; height: 26px; display: grid; place-items: center;
  border: 1px solid var(--line); background: rgba(139, 90, 43, .08); color: var(--mute); border-radius: 1px 4px 2px 4px; }
.op-entry .ic2 svg { width: 15px; height: 15px; }
.op-entry .ic2.great { background: rgba(217, 165, 33, .2); color: #6d4c07; border-color: rgba(184, 137, 31, .5); }
.op-entry .ic2.success { background: rgba(44, 107, 69, .14); color: #2c6b45; border-color: rgba(44, 107, 69, .4); }
.op-entry .ic2.narrow { background: rgba(183, 121, 31, .16); color: #8a5b12; }
.op-entry .ic2.failed, .op-entry .ic2.captured { background: rgba(165, 52, 42, .14); color: var(--red); border-color: rgba(165, 52, 42, .4); }
.op-entry .hd { display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; font-size: 12.5px; }
.op-entry .sub { font-size: 11px; color: var(--dim); margin-top: 1px; }
.op-entry .day { font-family: var(--type); font-size: 10px; color: var(--dim); white-space: nowrap; }

/* 排行榜 */
.op-line { display: grid; grid-template-columns: 42px 1fr auto; gap: 10px; align-items: baseline; padding: 5px 9px;
  font-size: 12.5px; font-family: var(--type); }
.op-line.me { background: rgba(217, 165, 33, .16); font-weight: 700; box-shadow: inset 0 0 0 1px rgba(184, 137, 31, .4); }
.op-line.g1 { background: linear-gradient(90deg, rgba(217, 165, 33, .2), transparent); }
.op-line.g2 { background: linear-gradient(90deg, rgba(140, 150, 165, .18), transparent); }
.op-line.g3 { background: linear-gradient(90deg, rgba(176, 116, 66, .18), transparent); }
.op-line .rk { color: var(--dim); font-size: 11.5px; text-align: right; }
.op-board { display: flex; flex-direction: column; gap: 1px; }

/* ── 悬赏令：一张真正做旧的纸 ─────────────────────────────────────────── */
.op-poster-wrap { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 700px) { .op-poster-wrap { grid-template-columns: minmax(0, 1fr); } }
.op-poster { position: relative; padding: 16px 15px 14px; color: #2b2118; transform: rotate(-.35deg);
  background-image:
    radial-gradient(140% 100% at 14% -6%, rgba(255, 251, 232, .96), transparent 58%),
    radial-gradient(90% 70% at 96% 104%, rgba(126, 88, 36, .3), transparent 62%),
    radial-gradient(60% 40% at 8% 78%, rgba(150, 105, 45, .18), transparent 70%),
    repeating-linear-gradient(91deg, rgba(120, 90, 40, .05) 0 1px, transparent 1px 4px),
    var(--grain),
    linear-gradient(158deg, #f8f0d8 0%, #ecdcb6 55%, #dcc59a 100%);
  background-blend-mode: normal, normal, normal, normal, multiply, normal;
  box-shadow: 0 4px 16px rgba(70, 45, 10, .2), inset 0 0 46px rgba(140, 100, 40, .2);
  clip-path: polygon(0.7% 0.9%, 11% 0.3%, 26% 1.2%, 42% 0.2%, 60% 1%, 77% 0.3%, 93% 1.1%, 99.3% 1.7%,
    99.6% 17%, 99% 35%, 99.7% 53%, 99.1% 70%, 99.6% 87%, 99% 98.9%, 85% 99.5%, 68% 98.7%,
    52% 99.6%, 35% 98.8%, 19% 99.5%, 1.2% 99%, 1% 81%, 0.3% 63%, 0.9% 45%, 0.2% 27%, 0.8% 11%); }
.op-poster .crease { position: absolute; pointer-events: none; }
.op-poster .crease.v { left: 34%; top: 2%; width: 1px; height: 96%;
  background: linear-gradient(180deg, transparent, rgba(120, 85, 40, .22) 18%, rgba(255, 250, 232, .5) 20%, rgba(120, 85, 40, .14) 22%, transparent 70%); }
.op-poster .crease.h { left: 2%; top: 46%; height: 1px; width: 96%;
  background: linear-gradient(90deg, transparent, rgba(120, 85, 40, .18) 22%, rgba(255, 250, 232, .45) 24%, rgba(120, 85, 40, .1) 26%, transparent 80%); }
.op-poster .inner { position: relative; z-index: 1; border: 2.5px solid #241a12; padding: 8px 10px 10px; text-align: center; }
.op-poster .wanted { margin: 0 0 6px; line-height: 0; }
.op-poster .wanted svg { width: 100%; height: auto; display: block; }
.op-poster .frame { position: relative; border: 2.5px solid #241a12; padding: 0; background: #e9dcbe; overflow: hidden; }
.op-poster .frame .art svg { display: block; width: 100%; height: auto; }
.op-poster .frame::before, .op-poster .frame::after { content: ''; position: absolute; width: 24px; height: 24px;
  border: 2px solid rgba(36, 26, 18, .5); z-index: 2; }
.op-poster .frame::before { left: -1px; top: -1px; border-right: 0; border-bottom: 0; }
.op-poster .frame::after { right: -1px; bottom: -1px; border-left: 0; border-top: 0; }
.op-poster .doa { display: inline-block; margin-top: 8px; padding: 3px 12px 2px;
  border: 2.5px solid #241a12; font-family: var(--serif); font-size: 11.5px; font-weight: 700;
  letter-spacing: .22em; transform: rotate(-1.6deg); color: #241a12; }
.op-poster .name { font-family: var(--serif); font-size: 46px; font-weight: 700; letter-spacing: .04em;
  line-height: 1.02; margin-top: 4px; color: #1f1710; overflow-wrap: anywhere;
  text-shadow: 0 1px 0 rgba(255, 250, 232, .6), 0 -1px 0 rgba(70, 45, 10, .18); }
.op-poster .epi { font-size: 10.5px; color: #6b5233; margin-top: 3px; letter-spacing: .04em; }
.op-poster .amount-wrap { margin-top: 8px; }
.op-poster .rule2 { height: 2.5px; background: #241a12; margin: 4px 0; }
.op-poster .amount { font-family: var(--type); font-size: 26px; font-weight: 700; white-space: nowrap;
  letter-spacing: -.01em; font-variant-numeric: tabular-nums; color: #1b140d; }
.op-poster .unit { font-size: 9px; letter-spacing: .24em; color: #6b5233; margin-top: 3px; }
.op-poster .marine { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 9px;
  color: #4a3a24; opacity: .85; }
.op-poster .marine svg { width: 36px; height: 36px; }
.op-poster .marine .txt { text-align: left; line-height: 1.1; }
.op-poster .marine b { font-family: var(--serif); font-size: 11px; letter-spacing: .3em; display: block; }
.op-poster .marine i { font-style: normal; font-size: 8px; letter-spacing: .18em; opacity: .8; display: block; }
.op-poster .seal { position: absolute; top: 92px; right: 2px; z-index: 3; width: 84px; height: 84px;
  transform: rotate(15deg); pointer-events: none; }
.op-poster .seal svg { width: 100%; height: 100%; display: block; }
.op-poster .stain { position: absolute; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, rgba(150, 105, 45, .18), rgba(150, 105, 45, .05) 55%, transparent 72%); }
.op-poster .speck { position: absolute; width: 2px; height: 2px; background: rgba(80, 55, 25, .25); pointer-events: none; }
`;


// ── 小工具 ──────────────────────────────────────────────────────────────

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  }
  for (const kid of kids) {
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

function art(markup) {
  return el('div', { class: 'art', html: markup });
}

/** 在线图标。统一 24 的格子、描边、不填充，颜色跟着 currentColor 走。 */
const ICONS = {
  sword: '<path d="M3.6 20.4 20.4 3.6"/><path d="M20.4 20.4 3.6 3.6"/><path d="M15.8 3.6h4.6v4.6"/><path d="M3.6 15.8v4.6h4.6"/>',
  skull: '<path d="M12 3.2c-4.3 0-7 2.9-7 6.6 0 2.1.9 3.5 2.2 4.5V17h9.6v-2.7c1.3-1 2.2-2.4 2.2-4.5 0-3.7-2.7-6.6-7-6.6Z"/><circle cx="9.2" cy="10" r="1.3"/><circle cx="14.8" cy="10" r="1.3"/><path d="M10.2 17v3.4M13.8 17v3.4"/>',
  chest: '<rect x="3.2" y="9.5" width="17.6" height="10.5" rx="2"/><path d="M3.2 9.5c0-2.2 1.8-4 4-4h9.6c2.2 0 4 1.8 4 4"/><path d="M9.4 9.5V20M14.6 9.5V20"/><circle cx="12" cy="13.4" r="1.1"/>',
  scroll: '<path d="M6.2 4.2h11.6v12.6a3.2 3.2 0 0 0 3.2 3.2H8.2a3.2 3.2 0 0 1-3.2-3.2V5.2a1 1 0 0 1 1.2-1Z"/><path d="M8.4 8.4h7.2M8.4 11.4h7.2M8.4 14.4h4.6"/>',
  sail: '<path d="M12 3v15.4"/><path d="M12 4.2l7.6 11H12"/><path d="M12 4.2L5 15.2h7"/><path d="M4 19h16"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M9 9.4h6M12 9.4v6.2M9.6 12.4h4.8"/>',
  anchor: '<circle cx="12" cy="5" r="2.1"/><path d="M12 7.1v12.4M6.2 11.2h11.6"/><path d="M5 15c1.8 3 4 4.4 7 4.4s5.2-1.4 7-4.4"/>',
  compass: '<circle cx="12" cy="12" r="8.4"/><path d="M15.4 8.6l-1.9 4.9-4.9 1.9 1.9-4.9 4.9-1.9Z"/>',
  flame: '<path d="M12 3c1.5 4 5 5.6 5 9.4A5 5 0 0 1 7 13c0-1.6.7-2.7 1.6-3.8C9.8 11 11 11.5 11 11.5 11 8 12 5 12 3Z"/>',
  eye: '<path d="M2.6 12S6 6.6 12 6.6 21.4 12 21.4 12 18 17.4 12 17.4 2.6 12 2.6 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  shield: '<path d="M12 3l7 3v5.8c0 4.2-2.9 7.2-7 9.2-4.1-2-7-5-7-9.2V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
  fruit: '<circle cx="12" cy="14" r="6"/><path d="M12 8c0-2 1.5-3.6 3.6-3.6"/><path d="M8.4 12c1-1.2 2.2-1.8 3.6-1.8"/>',
  haki: '<path d="M4 16c2.5-4 5.5-6 8-6s5.5 2 8 6"/><path d="M7.4 19c1.7-2.6 3.2-4 4.6-4s2.9 1.4 4.6 4"/>',
  star: '<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9 6.7 19.8l1.1-5.9L3.5 9.8l5.9-.8L12 3.6Z"/>',
  check: '<path d="M4.6 12.6l4.6 4.6L19.4 7"/>',
  cross: '<path d="M5.4 5.4l13.2 13.2M18.6 5.4L5.4 18.6"/>',
  book: '<path d="M4 5.6C6.5 4.1 9.5 4.1 12 5.6c2.5-1.5 5.5-1.5 8 0v13.2c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0V5.6Z"/><path d="M12 5.6v13.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  boat: '<path d="M3.4 13.4h17.2l-2.6 5.2H6L3.4 13.4Z"/><path d="M6.6 13.4V8.6l5.4-4.2 5.4 4.2v4.8"/>',
  flag: '<path d="M6 21V4"/><path d="M6 5h11l-2 3.4L17 12H6"/>',
  skullFlag: '<path d="M6 21V3.6"/><path d="M6 4.4h11.4l-1.8 3.6 1.8 3.6H6"/><circle cx="10.4" cy="8" r=".8"/><circle cx="13.4" cy="8" r=".8"/>',
  plank: '<rect x="3" y="7.4" width="18" height="9.2" rx="1"/><path d="M3 12h18"/><path d="M7.6 7.4v9.2M16.4 7.4v9.2"/>',
  helm: '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8.2"/><path d="M12 3.8v4.2M12 16v4.2M3.8 12h4.2M16 12h4.2M6.2 6.2l3 3M14.8 14.8l3 3M17.8 6.2l-3 3M9.2 14.8l-3 3"/>',
  cannon: '<path d="M4.4 13.6h10.4l4.8-3.2v6.6l-4.8-1H4.4z"/><circle cx="8.2" cy="18.4" r="1.9"/><circle cx="14" cy="18.4" r="1.9"/>',
  pot: '<path d="M5 10.4h14v6.2a2.6 2.6 0 0 1-2.6 2.6h-8.8A2.6 2.6 0 0 1 5 16.6z"/><path d="M3.6 10.4h16.8"/><path d="M9 7.8c0-1.5 1.3-2.4 3-2.4s3 .9 3 2.4"/>',
};

function ico(name, size = 16) {
  return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor"
    stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;
}

function iconEl(name, size = 16) {
  return el('span', { class: 'icx', html: ico(name, size) });
}

function remainText(ms) {
  if (ms <= 0) return '正在靠岸';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) return `${Math.floor(m / 60)} 小时 ${m % 60} 分`;
  return m > 0 ? `${m} 分 ${String(s).padStart(2, '0')} 秒` : `${s} 秒`;
}

function seedOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BOND_EFFECT = {
  boss3: 'BOSS 决着 +5%',
  bounty: '赏金 +6%',
  loot: '掉落 +1',
  heal: '每章回 4 点船体',
  capture: '被俘 -20%',
};

const ROUND_LABEL = [['试探', 'eye'], ['交锋', 'sword'], ['决着', 'flame']];

// ── 画船 ────────────────────────────────────────────────────────────────
// 四档：小帆船 / 梅丽号 / 阳光号 / 巨人战船。按剧情进度换。
// 260×140 的画布里，海面在 y=100 以下，桅杆从 y≈100 往上长。

const WAVE = `
  <path d="M0 104 Q26 97 52 104 T104 104 T156 104 T208 104 T260 104 V140 H0 Z" fill="#0f4763" opacity=".55"/>
  <path d="M0 116 Q30 110 60 116 T120 116 T180 116 T240 116 T300 116 V140 H0 Z" fill="#082a3f" opacity=".6"/>
  <g stroke="#cfe6ef" stroke-width="1.2" opacity=".22" fill="none">
    <path d="M18 122 q8 -4 16 0"/><path d="M58 130 q9 -4 18 0"/><path d="M126 126 q8 -4 16 0"/>
    <path d="M188 132 q9 -4 18 0"/><path d="M232 120 q8 -4 16 0"/>
  </g>`;

/** 船体的木纹：一段一段的波浪线，按 pattern 平铺。 */
function woodDefs(id) {
  return `<defs><pattern id="opGrain${id}" width="30" height="10" patternUnits="userSpaceOnUse">
    <path d="M0 2.4 q7.5 -1.8 15 0 t15 0" stroke="#2f1d10" stroke-width=".8" fill="none" opacity=".55"/>
    <path d="M0 6.6 q7.5 1.8 15 0 t15 0" stroke="#2f1d10" stroke-width=".7" fill="none" opacity=".4"/>
    <path d="M4 9 q7 -1.2 14 0" stroke="#f6e8cd" stroke-width=".6" fill="none" opacity=".18"/>
  </pattern></defs>`;
}

function flagSmall(x, y) {
  return `<path d="M${x} ${y} v-13" stroke="#4a3220" stroke-width="1.6"/>
    <path d="M${x + .6} ${y - 13} h11 l-1.6 3 1.6 3 h-11 z" fill="#2b2118"/>
    <circle cx="${x + 5.4}" cy="${y - 10.4}" r="1.5" fill="#f0e4c8"/>
    <path d="M${x + 3.8} ${y - 8.2} l3.2 0" stroke="#f0e4c8" stroke-width=".8"/>`;
}

function shipTier1(sea = true) {
  return `<svg viewBox="0 0 260 140" role="img" aria-label="小帆船">
    ${woodDefs(1)}
    ${sea ? WAVE : ''}
    <path d="M102 104 H164 L158 122 Q140 128 130 128 Q116 128 106 122 Z" fill="#7d5230"/>
    <path d="M102 104 H164 L158 122 Q140 128 130 128 Q116 128 106 122 Z" fill="url(#opGrain1)" opacity=".55"/>
    <path d="M102 104 H164 L163 110 H104 Z" fill="#9c6b3f"/>
    <path d="M106 112 H160" stroke="#5c3b23" stroke-width="1.4" opacity=".5"/>
    <rect x="129" y="54" width="3.6" height="51" rx="1.8" fill="#6b4a2e"/>
    <path d="M133 58 L133 101 L161 98 Z" fill="#f6efe1"/>
    <path d="M133 58 L133 101 L161 98 Z" fill="none" stroke="#d9cbb0" stroke-width="1"/>
    <path d="M133 52 L150 57 L133 62 Z" fill="#b8402c"/>
    <path d="M134 60 L134 99" stroke="#e2d6bd" stroke-width="1" opacity=".8"/>
    <path d="M108 108 H152" stroke="#6b4a2e" stroke-width="1.2" opacity=".35"/>
    <circle cx="150" cy="112" r="2.4" fill="#e8c86a" opacity=".8"/>
    ${flagSmall(140, 53)}
  </svg>`;
}

function shipTier2(sea = true) {
  return `<svg viewBox="0 0 260 140" role="img" aria-label="梅丽号">
    ${woodDefs(2)}
    ${sea ? WAVE : ''}
    <path d="M70 96 H198 L190 122 Q166 130 134 130 Q102 130 80 122 Z" fill="#8a5a33"/>
    <path d="M70 96 H198 L190 122 Q166 130 134 130 Q102 130 80 122 Z" fill="url(#opGrain2)" opacity=".55"/>
    <path d="M70 96 H198 L195 103 H73 Z" fill="#a9743f"/>
    <path d="M78 103 H192" stroke="#6b4a2e" stroke-width="1" opacity=".4"/>
    <path d="M84 110 H100 M110 110 H126 M136 110 H152 M162 110 H178" stroke="#5c3b23" stroke-width="2" opacity=".25"/>
    <path d="M70 96 Q54 92 54 81 Q54 71 65 71 Q74 71 76 80 L78 94 Z" fill="#f4ead6" stroke="#c9b184" stroke-width="1"/>
    <circle cx="59" cy="81" r="2.5" fill="#2b2118"/><circle cx="67" cy="79" r="2.3" fill="#2b2118"/>
    <path d="M53 72 Q57 65 62 72 M66 70 Q70 63 75 70" stroke="#c9b184" stroke-width="1.5" fill="none"/>
    <rect x="106" y="28" width="3.6" height="68" rx="1.8" fill="#6b4a2e"/>
    <rect x="154" y="50" width="3.2" height="46" rx="1.6" fill="#6b4a2e"/>
    <path d="M110 34 H146 V80 H110 Z" fill="#f6efe1" stroke="#d9cbb0" stroke-width="1"/>
    <path d="M110 34 H146" stroke="#e3d7be" stroke-width="1"/>
    <path d="M158 56 L158 96 L184 92 Z" fill="#f6efe1" stroke="#d9cbb0" stroke-width="1"/>
    <path d="M158 56 L184 92" stroke="#e3d7be" stroke-width="1" opacity=".7"/>
    <circle cx="128" cy="56" r="6" fill="none" stroke="#a8863f" stroke-width="1.3"/>
    <circle cx="128" cy="54" r="1.5" fill="#a8863f"/>
    <path d="M110 28 L134 35 L110 42 Z" fill="#b8402c"/>
    <path d="M112 78 H144" stroke="#6b4a2e" stroke-width="1.2" opacity=".3"/>
    ${flagSmall(138, 30)}
  </svg>`;
}

function shipTier3(sea = true) {
  return `<svg viewBox="0 0 260 140" role="img" aria-label="千里阳光号">
    ${woodDefs(3)}
    ${sea ? WAVE : ''}
    <path d="M42 90 H216 L206 124 Q170 134 128 134 Q86 134 56 124 Z" fill="#8a5a33"/>
    <path d="M42 90 H216 L206 124 Q170 134 128 134 Q86 134 56 124 Z" fill="url(#opGrain3)" opacity=".55"/>
    <path d="M42 90 H216 L212 97 H46 Z" fill="#3f7a4a"/>
    <path d="M52 97 H206" stroke="#2f5c37" stroke-width="1" opacity=".5"/>
    <path d="M188 78 H216 V90 H188 Z" fill="#a9743f"/>
    <path d="M42 90 Q24 82 26 66 Q28 54 40 54 Q52 54 54 66 L56 88 Z" fill="#e7c14a" stroke="#b98f24" stroke-width="1"/>
    <path d="M26 58 L20 48 L30 52 M38 50 L40 39 L46 48 M52 54 L60 48 L60 58" fill="#e7c14a" stroke="#b98f24" stroke-width="1.3"/>
    <circle cx="36" cy="68" r="3.2" fill="#2b2118"/><circle cx="46" cy="66" r="3" fill="#2b2118"/>
    <path d="M38 76 Q42 80 48 76" stroke="#8a6a3a" stroke-width="1.5" fill="none"/>
    <rect x="96" y="14" width="4.2" height="76" rx="2" fill="#6b4a2e"/>
    <rect x="146" y="32" width="3.8" height="58" rx="2" fill="#6b4a2e"/>
    <rect x="184" y="50" width="3.2" height="40" rx="1.6" fill="#6b4a2e"/>
    <path d="M100 20 H142 V80 H100 Z" fill="#f6efe1" stroke="#d9cbb0" stroke-width="1"/>
    <circle cx="121" cy="44" r="10" fill="#e7c14a" opacity=".9"/>
    <path d="M121 33 L124 41 L132 41 L125 47 L128 55 L121 50 L114 55 L117 47 L110 41 L118 41 Z" fill="#c07a2a" opacity=".5"/>
    <path d="M150 38 L150 90 L182 86 Z" fill="#f6efe1" stroke="#d9cbb0" stroke-width="1"/>
    <path d="M188 56 L188 90 L212 88 Z" fill="#f6efe1" stroke="#d9cbb0" stroke-width="1"/>
    <path d="M100 14 L126 21 L100 28 Z" fill="#b8402c"/>
    <circle cx="208" cy="106" r="9" fill="none" stroke="#6b4a2e" stroke-width="2.2"/>
    <path d="M199 106 H217 M208 97 V115" stroke="#6b4a2e" stroke-width="1.3"/>
    <path d="M160 100 h34" stroke="#5c3b23" stroke-width="2" opacity=".3"/>
    ${flagSmall(132, 16)}
  </svg>`;
}

function shipTier4(sea = true) {
  return `<svg viewBox="0 0 260 140" role="img" aria-label="巨人战船">
    ${woodDefs(4)}
    ${sea ? WAVE : ''}
    <path d="M16 84 H244 L232 126 Q186 136 128 136 Q72 136 32 126 Z" fill="#4a3220"/>
    <path d="M16 84 H244 L232 126 Q186 136 128 136 Q72 136 32 126 Z" fill="url(#opGrain4)" opacity=".55"/>
    <path d="M16 84 H244 L241 92 H19 Z" fill="#6b4a2e"/>
    <path d="M26 100 H236" stroke="#2f2115" stroke-width="1.4" opacity=".45"/>
    <g fill="#8a5f38" opacity=".8">
      <circle cx="56" cy="106" r="4"/><circle cx="86" cy="108" r="4"/><circle cx="170" cy="108" r="4"/><circle cx="200" cy="106" r="4"/>
    </g>
    <path d="M16 84 Q0 72 4 56 Q8 42 22 44 Q36 46 36 60 L40 82 Z" fill="#d9cbb0" stroke="#8a6a3a" stroke-width="1"/>
    <circle cx="16" cy="56" r="2.6" fill="#2b2118"/><circle cx="26" cy="54" r="2.4" fill="#2b2118"/>
    <path d="M10 66 Q20 72 30 66" stroke="#8a6a3a" stroke-width="1.3" fill="none"/>
    <path d="M4 48 L0 38 L10 44 M18 42 L20 32 L26 42" fill="#d9cbb0" stroke="#8a6a3a" stroke-width="1.1"/>
    <rect x="208" y="64" width="34" height="20" fill="#5a3a22"/>
    <rect x="212" y="68" width="26" height="12" fill="#7a5230"/>
    <rect x="64" y="12" width="4.6" height="72" rx="2" fill="#3d291a"/>
    <rect x="108" y="6" width="4.6" height="78" rx="2" fill="#3d291a"/>
    <rect x="150" y="14" width="4.2" height="70" rx="2" fill="#3d291a"/>
    <rect x="190" y="28" width="3.8" height="56" rx="1.8" fill="#3d291a"/>
    <path d="M69 18 H103 V76 H69 Z" fill="#efe6d2" stroke="#b7a488" stroke-width="1"/>
    <path d="M113 12 H145 V76 H113 Z" fill="#efe6d2" stroke="#b7a488" stroke-width="1"/>
    <path d="M155 20 L155 80 L186 76 Z" fill="#efe6d2" stroke="#b7a488" stroke-width="1"/>
    <path d="M69 12 L94 19 L69 26 Z" fill="#8e2b1e"/>
    <path d="M113 6 L140 13 L113 20 Z" fill="#8e2b1e"/>
    <path d="M155 14 L178 20 L155 26 Z" fill="#8e2b1e"/>
    <circle cx="129" cy="40" r="8" fill="none" stroke="#8a6a3a" stroke-width="1.3"/>
    <path d="M123 40 H135 M129 34 V46" stroke="#8a6a3a" stroke-width="1.3"/>
    ${flagSmall(100, 14)}
  </svg>`;
}

const SHIP_ART = [shipTier1, shipTier2, shipTier3, shipTier4];

function shipArt(tier, sea = true) {
  return (SHIP_ART[Math.min(4, Math.max(1, tier)) - 1] ?? shipTier1)(sea);
}

/** 横幅里的海。画布按横幅的比例做（900×170），slice 之后太阳不会变成椭圆。 */
function bannerScene() {
  return `<svg class="scene" viewBox="0 0 900 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="opSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#04161f"/><stop offset=".46" stop-color="#0c3349"/><stop offset=".76" stop-color="#1b6079"/><stop offset="1" stop-color="#2b8199"/>
      </linearGradient>
      <radialGradient id="opSun" cx=".42" cy=".36" r=".64">
        <stop offset="0" stop-color="#fff7d6"/><stop offset=".58" stop-color="#f8dc93"/><stop offset="1" stop-color="#dfa746"/>
      </radialGradient>
      <radialGradient id="opGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".46"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <linearGradient id="opHaze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd98a" stop-opacity="0"/><stop offset="1" stop-color="#ffd98a" stop-opacity=".16"/>
      </linearGradient>
    </defs>
    <rect width="900" height="170" fill="url(#opSky)"/>
    <ellipse cx="618" cy="118" rx="210" ry="46" fill="url(#opHaze)"/>
    <circle cx="612" cy="52" r="78" fill="url(#opGlow)"/>
    <circle cx="612" cy="52" r="27" fill="url(#opSun)"/>
    <circle cx="612" cy="52" r="35" fill="none" stroke="#ffe9b0" stroke-opacity=".14"/>
    <g fill="#08202f" opacity=".4">
      <rect x="526" y="58" width="192" height="4" rx="2"/><rect x="556" y="70" width="132" height="3" rx="1.5"/>
    </g>
    <g fill="#cfe3ee" opacity=".13">
      <path d="M60 34 q16 -13 34 -3 q13 -8 26 3 q-20 9 -60 0Z"/>
      <path d="M300 26 q14 -10 30 0 q12 -6 22 2 q-22 8 -52 -2Z"/>
      <path d="M760 74 q18 -11 38 0 q13 -6 24 3 q-28 10 -62 -3Z"/>
    </g>
    <g stroke="#dce9f0" stroke-opacity=".32" fill="none" stroke-width="1.3">
      <path d="M420 44 q5 -4 10 0 q5 -4 10 0"/>
      <path d="M452 56 q4 -3 8 0 q4 -3 8 0"/>
    </g>
    <path d="M0 112 C40 102 66 98 96 103 C122 108 150 110 178 114 L178 170 L0 170 Z" fill="#0a2b3e"/>
    <path d="M88 104 C94 86 102 78 110 74" stroke="#0a2b3e" stroke-width="3" fill="none"/>
    <path d="M110 74 q13 -8 24 -2 q-13 9 -24 7 q-9 6 -15 2 q7 -6 15 -7Z" fill="#0a2b3e"/>
    <path d="M0 118 Q45 110 90 118 T180 118 T270 118 T360 118 T450 118 T540 118 T630 118 T720 118 T810 118 T900 118 V170 H0 Z" fill="#0b334a" opacity=".94"/>
    <path d="M0 136 Q55 126 110 136 T220 136 T330 136 T440 136 T550 136 T660 136 T770 136 T880 136 T990 136 V170 H0 Z" fill="#072334"/>
    <path d="M0 120 H900" stroke="#b9dfe8" stroke-opacity=".14" stroke-width="1.2"/>
    <g stroke="#ffe3a6" stroke-opacity=".24" stroke-width="3" stroke-linecap="round">
      <path d="M590 130 h44"/><path d="M600 141 h26"/><path d="M584 152 h54"/><path d="M598 162 h30"/>
    </g>
    <g stroke="#cfe6ef" stroke-opacity=".18" stroke-width="1.2" fill="none">
      <path d="M120 128 q10 -4 20 0"/><path d="M230 148 q11 -4 22 0"/><path d="M340 134 q10 -4 20 0"/><path d="M470 158 q11 -4 22 0"/>
    </g>
  </svg>`;
}

/** 船坞的舞台：比横幅亮一点，船是主角。 */
function stageScene() {
  return `<svg class="sky" viewBox="0 0 520 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="opStage" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0b2b41"/><stop offset=".6" stop-color="#124a66"/><stop offset="1" stop-color="#1a6883"/>
      </linearGradient>
    </defs>
    <defs>
      <radialGradient id="opLamp"><stop offset="0" stop-color="#ffdf9e" stop-opacity=".5"/>
        <stop offset="1" stop-color="#ffdf9e" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="520" height="240" fill="url(#opStage)"/>
    <circle cx="72" cy="40" r="15" fill="#f2d692" opacity=".5"/>
    <circle cx="72" cy="40" r="26" fill="none" stroke="#f2d692" stroke-opacity=".1"/>
    <g fill="#f6ecd6">
      <circle cx="160" cy="28" r="1.2" opacity=".5"/><circle cx="204" cy="46" r="1" opacity=".38"/>
      <circle cx="268" cy="22" r="1.1" opacity=".44"/><circle cx="330" cy="38" r=".9" opacity=".3"/>
      <circle cx="386" cy="20" r="1.2" opacity=".42"/><circle cx="440" cy="44" r="1" opacity=".34"/>
      <circle cx="480" cy="26" r="1.1" opacity=".4"/><circle cx="120" cy="58" r=".9" opacity=".3"/>
      <circle cx="352" cy="62" r="1" opacity=".26"/><circle cx="238" cy="58" r=".8" opacity=".24"/>
    </g>
    <ellipse cx="436" cy="176" rx="80" ry="34" fill="url(#opLamp)"/>
    <g fill="#cfe3ee" opacity=".1">
      <path d="M300 44 q16 -12 34 -2 q14 -8 26 2 q-22 9 -60 0Z"/>
      <path d="M404 78 q12 -8 24 0 q10 -5 18 2 q-18 6 -42 -2Z"/>
    </g>
    <path d="M0 186 Q44 176 88 186 T176 186 T264 186 T352 186 T440 186 T528 186 V240 H0 Z" fill="#0b344b" opacity=".9"/>
    <path d="M0 196 Q44 188 88 196 T176 196 T264 196 T352 196 T440 196 T528 196" fill="none"
      stroke="#8fc4d6" stroke-opacity=".16" stroke-width="1.3"/>
    <path d="M0 208 Q52 198 104 208 T208 208 T312 208 T416 208 T520 208 V240 H0 Z" fill="#062231"/>
    <g stroke="#cfe6ef" stroke-opacity=".18" stroke-width="1.4" fill="none">
      <path d="M44 198 q10 -4 20 0"/><path d="M150 216 q10 -4 20 0"/><path d="M300 200 q10 -4 20 0"/><path d="M420 218 q10 -4 20 0"/>
    </g>
  </svg>`;
}

// ── 风向 ────────────────────────────────────────────────────────────────
// 一条 44×26 的小图：顺风是朝右的弧线，无风拉成一条直线，雾是三横。
// 只当标记用，不做动画——面板上已经有足够多会动的东西了。

function weatherArt(id) {
  const tint = {
    calm: '#7f9aa8', fair: '#6f9a6a', fog: '#8e8e86', squall: '#7d6a8f', dead: '#a08a5f',
  }[id] ?? '#8a7a5f';
  let body = '';
  if (id === 'dead') {
    body = `<path d="M4 17 L40 17" stroke="${tint}" stroke-width="1.6" fill="none" opacity=".55"/>
      <path d="M20 8 L20 17" stroke="${tint}" stroke-width="1.2" opacity=".5"/>`;
  } else if (id === 'fog') {
    body = `<g stroke="${tint}" stroke-width="1.5" fill="none" opacity=".65">
      <path d="M5 10 H39"/><path d="M8 15 H36"/><path d="M11 20 H33"/></g>`;
  } else {
    // 一条弧线加一个朝右的箭镞：一眼看出「风往那边吹」。
    body = `<g stroke="${tint}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 17 Q 14 8 23 15 T 36 13"/>
      <path d="M32 8 L 38 12 L 31 16"/></g>`;
  }
  return `<svg viewBox="0 0 44 26" width="44" height="26" aria-hidden="true">${body}</svg>`;
}

// ── 航线插画 ────────────────────────────────────────────────────────────
// 五种航线各一张 320×110 的剪影。不用画细，远远一看知道是什么地方就行。

function routeScene(kindId) {
  const sky = `<defs><linearGradient id="rs-${kindId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a4b63"/><stop offset=".62" stop-color="#2a7c96"/><stop offset="1" stop-color="#3d9db4"/></linearGradient>
      <radialGradient id="rh-${kindId}"><stop offset="0" stop-color="#ffdf9e" stop-opacity=".38"/><stop offset="1" stop-color="#ffdf9e" stop-opacity="0"/></radialGradient></defs>
    <rect width="320" height="110" fill="url(#rs-${kindId})"/>
    <ellipse cx="238" cy="70" rx="96" ry="30" fill="url(#rh-${kindId})"/>`;
  const sea = `<path d="M0 76 Q40 70 80 76 T160 76 T240 76 T320 76 V110 H0 Z" fill="#123f57"/>
    <path d="M0 90 Q50 84 100 90 T200 90 T300 90 T400 90 V110 H0 Z" fill="#0a2c3e"/>
    <path d="M0 77 H320" stroke="#bfe4ee" stroke-opacity=".18"/>`;

  if (kindId === 'raid') {
    return `<svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sky}${sea}
      <circle cx="252" cy="30" r="14" fill="#efd9a3" opacity=".55"/>
      <path d="M60 66 h56 l-6 14 h-44 z" fill="#20150e"/><path d="M74 46 v20" stroke="#20150e" stroke-width="2"/>
      <path d="M76 48 l22 16 H76 Z" fill="#20150e"/><path d="M88 44 v22" stroke="#20150e" stroke-width="1.4"/>
      <g fill="#20150e"><rect x="150" y="60" width="16" height="18" rx="2"/><rect x="170" y="62" width="14" height="16" rx="2"/></g>
      <path d="M140 74 h58" stroke="#20150e" stroke-width="2"/>
      <path d="M212 60 l10 -16 10 16 z" fill="#20150e" opacity=".8"/>
    </svg>`;
  }
  if (kindId === 'ruin') {
    return `<svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sky}${sea}
      <path d="M0 78 L46 54 L96 78 Z" fill="#0c2c3e"/>
      <g fill="#20150e">
        <path d="M108 78 V44 h10 v34 z"/><path d="M186 78 V44 h10 v34 z"/>
        <path d="M108 44 h88 v10 h-88 z"/><path d="M104 36 h96 v8 h-96 z"/>
        <path d="M132 78 V58 a12 12 0 0 1 24 0 v20 z" fill="#061f2f"/>
      </g>
      <circle cx="152" cy="66" r="3" fill="#e8b64a" opacity=".85"/>
      <g stroke="#20150e" stroke-width="2" opacity=".7"><path d="M118 84 h12M126 90 h12M180 84 h12"/></g>
    </svg>`;
  }
  if (kindId === 'navy') {
    return `<svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sky}${sea}
      <circle cx="66" cy="28" r="12" fill="#efd9a3" opacity=".45"/>
      <path d="M150 70 h86 l-8 14 h-70 z" fill="#20150e"/>
      <path d="M172 40 v32 M206 48 v22" stroke="#20150e" stroke-width="2"/>
      <path d="M174 42 h26 v18 h-26 z" fill="#20150e"/><path d="M210 50 l16 12 -16 2 z" fill="#20150e"/>
      <path d="M150 36 v-12 h14" stroke="#20150e" stroke-width="2" fill="none"/>
      <path d="M164 24 h10 v7 h-10 z" fill="#20150e"/>
      <g stroke="#cfe6ef" stroke-opacity=".28" fill="none" stroke-width="1.2"><path d="M40 40 q6 -4 12 0"/><path d="M78 52 q5 -3 10 0"/></g>
    </svg>`;
  }
  if (kindId === 'beast') {
    return `<svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sky}${sea}
      <path d="M0 76 Q28 68 52 76 T104 76 V84 Q76 78 48 84 T0 84 Z" fill="#0b2f43"/>
      <path d="M170 86 C176 60 190 44 214 40 C232 37 244 44 246 56 C248 68 238 78 222 80 C246 78 262 86 268 96 C240 98 196 98 170 86 Z" fill="#14202a"/>
      <path d="M214 40 C210 30 214 22 224 20" stroke="#14202a" stroke-width="4" fill="none"/>
      <circle cx="228" cy="52" r="2.4" fill="#e8d9b4"/><path d="M240 58 q6 4 2 9" stroke="#e8d9b4" stroke-width="1.6" fill="none"/>
    </svg>`;
  }
  // righteous：岛上的村子
  return `<svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sky}${sea}
    <path d="M0 78 L40 58 L84 78 Z" fill="#0d3145"/>
    <g fill="#20150e">
      <path d="M96 78 V56 l16 -12 16 12 v22 z"/><path d="M134 78 V62 l12 -9 12 9 v16 z"/>
      <path d="M168 78 V52 l18 -13 18 13 v26 z"/>
    </g>
    <g fill="#e8b64a" opacity=".8"><rect x="106" y="62" width="6" height="6"/><rect x="176" y="58" width="6" height="6"/></g>
    <path d="M206 78 V40" stroke="#20150e" stroke-width="2.2"/>
    <path d="M207 40 h20 l-3 5 3 5 h-20 z" fill="#b8402c"/>
    <path d="M250 78 q10 -18 22 0" stroke="#20150e" stroke-width="2" fill="none"/>
  </svg>`;
}

// ── 悬赏令上那张图 ──────────────────────────────────────────────────────
// 不画脸：只画剪影 + 网点，像一张旧海报上拓下来的。
// 这样既不会「恶心」，也不怕画不像。

function stencilPortrait(name, epithet) {
  const h = seedOf(`${name}|${epithet}`);
  const hat = (h >>> 1) % 3;
  const beard = (h >>> 5) % 3;

  const hatArt = [
    // 草帽
    `<ellipse cx="100" cy="57" rx="62" ry="9.5"/><path d="M66 57 C68 28 132 28 134 57 Z"/>
     <path d="M66 49 C84 44 116 44 134 49" fill="none" stroke="#efe0bf" stroke-width="3.4" opacity=".62"/>`,
    // 船长帽
    `<path d="M38 59 C50 31 150 31 162 59 C138 50 62 50 38 59 Z"/>
     <path d="M60 50 C64 25 136 25 140 50 Z"/>
     <circle cx="100" cy="45" r="6.2" fill="#efe0bf" opacity=".8"/>`,
    // 头巾
    `<path d="M64 55 C68 30 132 30 136 55 C116 47 84 47 64 55 Z"/>
     <circle cx="137" cy="52" r="5"/>`,
  ][hat];

  const beardArt = [
    '',
    `<path d="M78 110 C84 126 116 126 122 110 C112 117 88 117 78 110 Z"/>`,
    `<path d="M72 104 C78 142 122 142 128 104 C120 123 80 123 72 104 Z"/>`,
  ][beard];

  return `<svg viewBox="0 0 200 232" role="img" aria-label="悬赏令画像">
    <defs>
      <pattern id="opDot" width="6.2" height="6.2" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
        <circle cx="3.1" cy="3.1" r="1.45" fill="#2b2118" opacity=".3"/>
      </pattern>
      <!-- 老旧打印机的失真：横向轻微位移 + 一点毛边 -->
      <filter id="opInk" x="-4%" y="-4%" width="108%" height="108%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55 0.9" numOctaves="2" seed="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <radialGradient id="opVig" cx=".5" cy=".42" r=".78">
        <stop offset=".55" stop-color="#8a6a3a" stop-opacity="0"/>
        <stop offset="1" stop-color="#6b4a2e" stop-opacity=".3"/>
      </radialGradient>
      <clipPath id="opClip"><rect x="0" y="0" width="200" height="232"/></clipPath>
    </defs>
    <rect width="200" height="232" fill="#efe0bf"/>
    <rect width="200" height="232" fill="url(#opDot)"/>
    <g clip-path="url(#opClip)">
      <!-- 背景圆环压暗一档 -->
      <circle cx="100" cy="84" r="57" fill="#8d3a33" opacity=".13"/>
      <circle cx="100" cy="84" r="57" fill="none" stroke="#8d3a33" stroke-opacity=".22"/>
      <circle cx="100" cy="84" r="50" fill="none" stroke="#8d3a33" stroke-opacity=".12"/>
      <g fill="#241a12" filter="url(#opInk)">
        <path d="M12 232 C18 174 54 144 100 144 C146 144 182 174 188 232 Z"/>
        <path d="M88 116 h24 v34 h-24 z"/>
        <ellipse cx="100" cy="85" rx="35" ry="41"/>
        <ellipse cx="64" cy="90" rx="6" ry="9"/><ellipse cx="136" cy="90" rx="6" ry="9"/>
        ${hatArt}
        ${beardArt}
      </g>
      <!-- 敞开的领口：把头和肩膀分开，不然是一团黑 -->
      <path d="M100 146 L113 178 L100 200 L87 178 Z" fill="#efe0bf"/>
      <path d="M100 146 L113 178 L100 200 L87 178 Z" fill="none" stroke="#241a12" stroke-width="2.4" opacity=".45"/>
      <!-- 缺墨的横道：像滚过一次坏掉的滚筒 -->
      <g fill="#efe0bf" opacity=".5">
        <rect x="0" y="61" width="200" height="1.6"/>
        <rect x="0" y="118" width="200" height="1.1"/>
        <rect x="0" y="176" width="200" height="1.9"/>
      </g>
      <rect width="200" height="232" fill="url(#opVig)"/>
      <rect y="204" width="200" height="28" fill="#241a12" opacity=".08"/>
    </g>
  </svg>`;
}

// ── 画刀 / 果实 / 石碑 ──────────────────────────────────────────────────

/** 刀：三档画法不同——良快刀直一点，大快刀有弧度，无上大快刀带金饰。 */
function bladeArt(color, dim, gradeKey = 'good') {
  const op = dim ? '.22' : '1';
  const guard = gradeKey === 'supreme'
    ? `<ellipse cx="60" cy="63" rx="13" ry="4" fill="#b8862c"/><circle cx="52" cy="63" r="2" fill="#f0cd79"/>
       <circle cx="68" cy="63" r="2" fill="#f0cd79"/>`
    : gradeKey === 'great'
      ? `<ellipse cx="60" cy="63" rx="10.5" ry="3.4" fill="#3a2c20"/>`
      : `<rect x="51" y="61" width="18" height="4" rx="2" fill="#3a2c20"/>`;
  const curve = gradeKey === 'good' ? 0 : 2.4;
  return `<svg viewBox="0 0 120 108" role="img" aria-label="刀">
    <g transform="rotate(-38 60 54)" opacity="${op}">
      <path d="M57 6 C${63 + curve} 26 ${64 + curve} 44 62 60 H55 C53 44 ${54 + curve} 26 57 6 Z" fill="${color}"/>
      <path d="M60 8 C${63 + curve * .6} 28 ${64 + curve * .6} 44 62.6 58" stroke="#ffffff" stroke-width="1.1" opacity=".5" fill="none"/>
      <path d="M55 6 L62 6 L58.4 1.4 Z" fill="#ffffff" opacity=".6"/>
      ${guard}
      <rect x="54.5" y="67" width="11" height="29" rx="5" fill="#2b2118"/>
      <g stroke="#b98f24" stroke-width="1.5" opacity=".85">
        <path d="M56 72 L64 76 M56 79 L64 83 M56 86 L64 90"/>
      </g>
      <circle cx="60" cy="99" r="2.6" fill="#b98f24" opacity=".8"/>
    </g>
  </svg>`;
}

function fruitArt(color, dim) {
  const op = dim ? '.3' : '1';
  return `<svg viewBox="0 0 120 120" role="img" aria-label="恶魔果实" style="opacity:${op}">
    <circle cx="60" cy="68" r="41" fill="${color}"/>
    <circle cx="60" cy="68" r="41" fill="none" stroke="#2b2118" stroke-width="1.4" opacity=".22"/>
    <g stroke="#2b2118" fill="none" stroke-width="3.2" opacity=".45" stroke-linecap="round">
      <path d="M60 34 C38 46 40 62 60 70 C80 78 82 94 60 100"/>
      <path d="M80 50 C66 54 62 66 74 74"/>
      <path d="M40 54 C54 58 58 68 46 76"/>
      <path d="M70 36 C62 46 66 54 74 56"/>
    </g>
    <ellipse cx="46" cy="52" rx="9" ry="5.6" fill="#ffffff" opacity=".3" transform="rotate(-28 46 52)"/>
    <ellipse cx="74" cy="88" rx="6" ry="3.4" fill="#000000" opacity=".12" transform="rotate(20 74 88)"/>
    <path d="M60 27 C62 17 70 13 78 15" stroke="#4a7a3a" stroke-width="4.6" fill="none" stroke-linecap="round"/>
    <path d="M78 15 C88 9 98 15 94 23 C86 27 78 23 78 15 Z" fill="#4a7a3a"/>
  </svg>`;
}

function glyphArt(on) {
  const body = on ? '#3d4148' : '#4a4d52';
  const ink = on ? '#e0c68d' : '#7b8088';
  const line = on ? 1 : 0.45;
  return `<svg viewBox="0 0 120 104" role="img" aria-label="历史正文">
    <path d="M36 14 h48 l10 8 v66 l-10 8 h-48 l-10 -8 v-66 z" fill="${body}"/>
    <path d="M36 14 h48 l10 8 v66 l-10 8 h-48 l-10 -8 v-66 z" fill="none" stroke="#2b2118" stroke-width="1.4" opacity=".35"/>
    <path d="M44 22 h32 v56 h-32 z" fill="none" stroke="${ink}" stroke-width="1.2" opacity="${line * 0.55}"/>
    <g stroke="${ink}" stroke-width="2.6" stroke-linecap="round" opacity="${line}">
      <path d="M50 32 h20"/><path d="M50 40 h13"/><path d="M56 40 v16"/>
      <path d="M50 62 h20"/><path d="M64 62 v10"/>
    </g>
    <g fill="${ink}" opacity="${line * 0.8}">
      <circle cx="50" cy="70" r="1.6"/><circle cx="56" cy="70" r="1.6"/>
    </g>
  </svg>`;
}

/** 材料图标：手绘的粗描边，圆木 / 铁锭 / 稀有晶石。 */
function matArt(id, color) {
  const ink = '#3a2a18';
  if (id === 'wood') {
    return `<svg viewBox="0 0 40 40" aria-hidden="true">
      <g stroke="${ink}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
        <rect x="5" y="13" width="29" height="15" rx="6.5" fill="${color}"/>
        <ellipse cx="9.8" cy="20.5" rx="4.4" ry="7.4" fill="#cf9f62"/>
        <ellipse cx="9.8" cy="20.5" rx="2.2" ry="3.8" fill="none" stroke-width="1.2"/>
        <ellipse cx="9.8" cy="20.5" rx=".7" ry="1.3" fill="${ink}" stroke="none"/>
        <path d="M18.6 17.6h12.6M18.6 23.4h12.6" stroke-width="1" opacity=".5"/>
        <path d="M22.4 15.8v9.4" stroke-width=".9" opacity=".38"/>
      </g>
    </svg>`;
  }
  if (id === 'iron') {
    return `<svg viewBox="0 0 40 40" aria-hidden="true">
      <g stroke="${ink}" stroke-width="1.8" stroke-linejoin="round">
        <path d="M9.4 26h21.2l-2.8 6.2H12.2z" fill="${color}"/>
        <path d="M12 18.6h16l3 7.2H9z" fill="#a9b4bf"/>
        <path d="M15.2 12.2h9.6l2.4 6.2H12.8z" fill="#c6cfd7"/>
        <path d="M12.4 31.6h15.2" stroke-width="1.1" opacity=".7"/>
        <path d="M15.4 21.6h9.2" stroke-width="1" opacity=".55"/>
      </g>
    </svg>`;
  }
  return `<svg viewBox="0 0 40 40" aria-hidden="true">
    <g stroke="${ink}" stroke-width="1.8" stroke-linejoin="round">
      <path d="M20 5.6 29.4 13l-3.2 15 -12.2 5 -7-11 4-12z" fill="${color}"/>
      <path d="M20 5.6 29.4 13l-6.2 4-8.2-6z" fill="#f0d374"/>
      <path d="M20 5.6 15 11l4.4 6 3.8-6z" fill="#fff0bb" opacity=".75" stroke="none"/>
      <circle cx="21.2" cy="20.4" r="3.1" fill="#fff6cf" stroke-width="1.2"/>
    </g>
  </svg>`;
}

// ── 面板 ────────────────────────────────────────────────────────────────

function mount(ctx) {
  const root = ctx.root;
  root.textContent = '';
  const style = document.createElement('style');
  style.textContent = CSS;
  root.append(style);

  const app = el('div', { class: 'op' });
  root.append(app);

  let data = null;
  let tab = 'story';
  let message = '';
  let messageWarn = false;
  let busy = false;
  let timer = null;
  let partPick = 'hull';
  let bladePick = 'all';

  /**
   * 面板上这几件她够不够得着，看配置里的七个开关（payload.perm）。
   * 只用来提示，不做按钮禁用——她做不了，你自己点就是了。
   */
  const PERM_LABEL = {
    repair: '修船', rest: '歇一晚', upgrade: '改装', blade: '买刀',
    fruit: '吃果实', haki: '练霸气', dispatch: '派人上岸',
  };
  function permText() {
    const p = data.perm ?? {};
    const can = [];
    const lock = [];
    for (const k of Object.keys(PERM_LABEL)) (p[k] ? can : lock).push(PERM_LABEL[k]);
    if (!can.length) return [['港口里的活她一样也动不了，全得你点。', '']];
    return [
      [`她能自己来：${can.join(' · ')}`, ''],
      lock.length ? [`要你点：${lock.join(' · ')}`, '2px'] : null,
    ].filter(Boolean);
  }

  /** 授权提示画成两行：上面是「她能来」，下面是「要你点」，别挤成一团。 */
  function permNote() {
    const rows = permText();
    return el('div', { class: 'op-muted', style: 'margin-top:7px' },
      ...rows.map(([text, gap]) => el('div', { style: gap ? `margin-top:${gap}` : null, text })));
  }

  const head = el('div', { class: 'op-top' });
  const tabs = el('div', { class: 'op-tabs' });
  const body = el('div');
  app.append(head, tabs, body);

  const TABS = [
    ['story', '年代记'],
    ['sea', '航海图'],
    ['ship', '船与船员'],
    ['poster', '悬赏令'],
    ['codex', '收藏'],
    ['board', '排行榜'],
    ['log', '航海日志'],
  ];

  function say(text, warn = false) {
    message = text || '';
    messageWarn = warn;
    render();
  }

  async function refresh() {
    try {
      data = await ctx.invoke('state');
      render();
    } catch (error) {
      say(`读不到航海图：${error && error.message ? error.message : error}`, true);
    }
  }

  async function act(method, ...args) {
    if (busy) return;
    busy = true;
    render();
    try {
      const out = await ctx.invoke(method, args);
      if (out && typeof out === 'object' && 'ok' in out) say(out.message || '', !out.ok);
      else say(String(out || ''));
      await refresh();
    } catch (error) {
      say(String(error && error.message ? error.message : error), true);
    } finally {
      busy = false;
      render();
    }
  }

  /**
   * 重开一档：整块面板上唯一一个不可逆的按钮，所以永远先问一句。
   * 后端会把旧档改名留底（restartRun），这句话要如实说。
   */
  function askRestart() {
    const ok = !globalThis.confirm
      || globalThis.confirm('旧档会改名留底，然后从风车村重开。钱、刀、果实、船员全部归零。继续？');
    if (ok) act('restart');
  }

  function renderHead() {
    const d = data;
    head.replaceChildren(
      el('div', { class: 'op-brand' },
        el('div', { class: 'op-mark', html: ico('compass', 19) }),
        el('div', {},
          el('div', { class: 'op-name', text: d ? d.theme.label : '海贼王大冒险' }),
          el('div', { class: 'op-sub', text: d
            ? `第 ${d.day} 天 · ${d.ship.name} · 同伴 ${d.crew.count} 人`
            : '正在起锚…' }),
        ),
      ),
      d ? el('div', { class: 'op-chips' },
        el('span', { class: 'op-chip', html: `${ico('shield', 13)}<span>船体 ${d.captain.hull}</span>` }),
        el('span', { class: 'op-chip', html: `${ico('coin', 13)}<span>${d.captain.berriesText}</span>` }),
        el('span', { class: 'op-chip gold', html: `${ico('skull', 13)}<span>${d.captain.bountyText}</span>` }),
        el('span', { class: 'op-chip', html: `${ico('flag', 13)}<span>第 ${d.rank}/${d.total}</span>` }),
      ) : null,
      // 重开不是调试功能，是玩家的正常出口：它不该跟着「显示调试按钮」一起消失。
      d ? el('button', {
        class: 'op-link', type: 'button', text: '重开一档',
        style: 'margin-left:2px', title: '旧档会改名留底，然后从风车村重开',
        onclick: askRestart,
      }) : null,
    );
    tabs.replaceChildren(...TABS.map(([id, label]) => el('button', {
      class: `op-tab${tab === id ? ' on' : ''}`,
      type: 'button',
      text: label,
      onclick: () => { tab = id; message = ''; render(); },
    })));
  }

  function notice() {
    return message ? el('div', { class: `op-note${messageWarn ? ' warn' : ''}`, text: message }) : null;
  }

  // ── 卡片 ──────────────────────────────────────────────────────────────

  function eventCard() {
    const e = data.event;
    if (!e) return null;
    return el('div', { class: 'op-event' },
      el('div', { class: 'kick', text: e.kicker }),
      el('div', { class: 'ttl', text: e.title }),
      ...e.lines.map((t) => el('p', { text: t })),
      el('div', { class: 'rule' }),
      el('div', { class: 'boon', text: e.note }),
      el('div', { class: 'boon', text: e.boon }),
      el('button', { class: 'op-btn btn', type: 'button', disabled: busy ? '1' : null, text: '记住这一天', onclick: () => act('event') }),
    );
  }

  function adviceCard() {
    const list = data.advice ?? [];
    if (!list.length) return null;
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-sec' },
        el('span', { class: 't', text: '现在能做的' }),
        el('span', { class: 'r' }),
        el('span', { class: 'n', text: '按轻重排' }),
      ),
      el('div', { class: 'op-advice' },
        ...list.map((a) => el('div', { class: `op-adv ${a.tone}` },
          el('i', { class: 'dot' }),
          el('div', { class: 'tx', text: a.text }),
          a.action
            ? el('button', {
              class: 'op-btn sm', type: 'button', disabled: busy ? '1' : null,
              text: a.action.label,
              onclick: () => act(a.action.method, ...(a.action.args ?? [])),
            })
            : null,
        )),
      ),
    );
  }

  function banner() {
    const c = data.campaign;
    const lv = data.level;
    const pct = Math.min(100, Math.round((c.done / Math.max(1, c.total)) * 100));
    return el('div', { class: 'op-banner' },
      el('div', { html: bannerScene() }),
      el('div', { class: 'body' },
        el('div', { class: 'kicker', text: c.partLabel }),
        el('div', { class: 'title', text: c.completed ? '拉夫德鲁' : c.arcName }),
        el('div', { class: 'meta', text: c.completed
          ? `Lv${lv.value} · 战力 ${lv.power} · 海图 ${c.done}/${c.total}`
          : `第 ${c.chapterNo}/${c.chapterCount} 章 · Lv${lv.value} · 战力 ${lv.power}` }),
        el('div', { class: 'trail' },
          el('i', { style: `width:${pct}%` }),
          el('b', { style: `left:${pct}%` }),
        ),
      ),
      el('div', { class: 'ship', html: shipArt(data.ship.tier, false) }),
    );
  }

  function duel() {
    const c = data.campaign;
    const lv = data.level;
    const ratio = lv.power / Math.max(1, c.power);
    const diff = lv.power - c.power;
    // 整条绳子按两边的力气分。不是「进度」——没有空的那一截。
    const share = Math.round((lv.power / Math.max(1, lv.power + c.power)) * 100);
    const label = ratio >= 1.35 ? '碾压' : ratio >= 1.05 ? '打得过' : ratio >= 0.95 ? '有点悬' : '打不过';
    const tone = ratio >= 1.35 ? 'great' : ratio >= 1.05 ? 'success' : ratio >= 0.95 ? 'narrow' : 'failed';
    return el('div', { class: 'op-duel' },
      el('div', { class: 'nums' },
        el('div', { class: 'side me' },
          el('span', { html: ico('sword', 14) }),
          el('span', { class: 'lb', text: '你的战力' }),
          el('b', { text: String(lv.power) })),
        el('div', { class: 'gap' },
          el('span', { class: `op-tag ${tone}`, text: diff >= 0 ? `领先 ${diff}` : `差 ${-diff}` })),
        el('div', { class: 'side foe' },
          el('b', { text: String(c.power) }),
          el('span', { class: 'lb', text: '这一章' }),
          el('span', { html: ico('skull', 14) })),
      ),
      el('div', { class: 'track' },
        el('i', { class: 'me', style: `width:${share}%` }),
        el('i', { class: 'foe', style: `width:${100 - share}%` }),
        el('span', { class: 'clash', style: `left:${Math.min(96, Math.max(4, share))}%`, html: ico('sword', 16) }),
      ),
      el('div', { class: 'verdict' },
        el('span', { class: `op-tag ${tone}`, text: label }),
        el('span', { text: ratio >= 1.04 ? '三回合都赢' : ratio >= 0.96 ? '赢两回合，够了' : ratio >= 0.9 ? '只赢一回合，差一点' : '一回合都难' }),
      ),
    );
  }

  function rounds() {
    const c = data.campaign;
    const lv = data.level;
    const ratio = lv.power / Math.max(1, c.power);
    const bonus = c.roundBonus ?? [0, 0, 0];
    return el('div', { class: 'op-rounds' },
      ...ROUND_LABEL.map(([name, icon], i) => {
        const need = [0.9, 0.96, 1.04][i];
        const margin = ratio * (1 + 0.012 * i) * (1 + (bonus[i] ?? 0) / 100);
        const win = margin >= need;
        const scale = Math.max(need * 1.25, margin);
        return el('div', { class: 'op-round' },
          el('span', { class: 'rl', html: `${ico(icon, 13)}<span>${name}</span>` }),
          el('div', { class: 'gauge' },
            el('i', { class: win ? 'win' : '', style: `width:${Math.min(100, Math.round((margin / scale) * 100))}%` }),
            el('em', { style: `left:${Math.round((need / scale) * 100)}%` }),
          ),
          el('span', { class: 'num' },
            el('b', { text: String(Math.round(margin * 100)) }),
            ` / ${Math.round(need * 100)}`,
            bonus[i] ? el('span', { class: 'op-bonus', text: `+${bonus[i]}%` }) : null,
          ),
        );
      }),
    );
  }

  function chapterCard() {
    const c = data.campaign;
    const lv = data.level;
    const ratio = c.completed ? 9 : lv.power / Math.max(1, c.power);
    const blocked = Boolean(data.voyage || data.blocked);
    const stuck = !c.completed && ratio < 0.95;
    const waiting = !c.completed && (c.waitMs ?? 0) > 0;
    const harden = c.attempts > 0 && c.gate ? Math.round((c.power / Math.max(1, c.basePower)) * 100 - 100) : 0;

    let action = null;
    if (c.completed) {
      action = data.story.voidUnlocked && !data.story.voidDone
        ? el('button', {
          class: 'op-cta boss', type: 'button', disabled: busy ? '1' : null,
          onclick: () => act('void'),
        }, el('span', { html: ico('book', 18) }), el('span', { text: `读那一页 · ${data.story.voidTitle}` }))
        : el('button', { class: 'op-cta', type: 'button', disabled: '1', text: data.story.voidDone ? '已抵达 · 那一页也读完了' : '已抵达' });
    } else if (data.choice) {
      action = el('button', { class: 'op-cta', type: 'button', disabled: '1', text: '先做上面那个选择' });
    } else if (waiting) {
      action = el('div', { class: 'op-wait' },
        el('button', {
          class: 'op-cta', type: 'button', disabled: '1',
          'data-sail': String(Date.now() + c.waitMs),
          text: `船在海上 · ${c.waitText}`,
        }),
        el('button', {
          class: 'op-btn', type: 'button', disabled: busy || !c.canRush ? '1' : null,
          text: `开快点（${c.rushCostText}）`,
          onclick: () => act('rush'),
        }),
      );
    } else if (stuck) {
      action = el('div', { style: 'display:flex;gap:8px;margin-top:13px' },
        el('button', {
          class: 'op-btn', type: 'button', style: 'flex:1;padding:10px', disabled: blocked ? '1' : null,
          text: '先去练级 →',
          onclick: () => { message = ''; tab = 'sea'; render(); },
        }),
        el('button', {
          class: 'op-btn', type: 'button', disabled: busy || blocked ? '1' : null,
          text: '硬打（多半会输）',
          onclick: () => act('chapter'),
        }),
      );
    } else {
      action = el('button', {
        class: `op-cta${c.isBoss ? ' boss' : ''}`, type: 'button', disabled: busy || blocked ? '1' : null,
        onclick: () => act('chapter'),
      },
      el('span', { html: ico(c.isBoss ? 'skull' : 'sail', 18) }),
      el('span', { text: data.blocked ? '先上岸' : c.isBoss ? `挑战 BOSS · ${c.boss}` : '继续冒险' }));
    }

    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('h3', { class: 'op-h3', text: c.completed ? '大秘宝' : `「${c.chapterTitle}」` }),
        el('span', { class: `op-tag ${c.isBoss ? 'narrow' : 'game'}`, text: c.completed ? '结局' : c.kindLabel }),
      ),
      el('div', { class: 'op-muted', style: 'margin-top:3px', text: c.completed
        ? '119 章都走完了。想继续就出海，或者重开一档。'
        : c.isBoss
          ? `这一篇的 BOSS：${c.boss}。三回合，赢两回合才算过。败走不掉进度，只损船和钱。`
          : `第 ${c.chapterNo}/${c.chapterCount} 章 · ${c.arcName}` }),
      harden > 0
        ? el('div', { class: 'op-muted', style: 'margin-top:3px', text: `同一个人打第三次，他已经摸清套路：这一章难度 +${harden}%` })
        : null,
      data.nextBonus
        ? el('div', { class: 'op-note', style: 'margin:9px 0 0', text: `「${data.nextBonus.note}」还在起作用：`
          + [
            data.nextBonus.power ? `下一战 +${data.nextBonus.power}%` : null,
            data.nextBonus.bounty ? `赏金 +${data.nextBonus.bounty}%` : null,
            data.nextBonus.capture ? `被俘 +${data.nextBonus.capture}%` : null,
          ].filter(Boolean).join(' · ') })
        : null,
      c.completed ? null : duel(),
      c.isBoss && !c.completed ? rounds() : null,
      action,
    );
  }

  function powerCard() {
    const p = data.level.parts;
    const base = Math.max(1, p.base);
    const slots = [
      ['船员', 'anchor', p.crew],
      ['船', 'boat', p.ship],
      ['名刀', 'sword', p.blade],
      ['果实', 'fruit', p.fruit],
      ['霸气', 'haki', p.haki],
    ];
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-sec' },
        el('span', { class: 't', text: '战力构成' }),
        el('span', { class: 'r' }),
        el('span', { class: 'n', text: `加成 +${Math.round((data.level.power / base - 1) * 100)}%` }),
      ),
      el('div', { class: 'op-base' },
        el('b', { text: String(data.level.power) }),
        el('div', {},
          el('div', { class: 'op-k', text: `等级底子 ${p.base} · Lv${data.level.value}` }),
          el('div', { class: 'op-muted', text: `下一章要 ${data.campaign.power}` }),
        ),
      ),
      el('div', { class: 'op-slots' },
        ...slots.map(([label, icon, value]) => el('div', { class: `op-slot${value > 0 ? ' on' : ''}` },
          el('div', { class: 'ring', html: ico(icon, 22) }),
          el('div', { class: 'pc', text: value > 0 ? `+${Math.round((value / base) * 100)}%` : '—' }),
          el('div', { class: 'lb2', text: label }),
        )),
      ),
      el('div', { class: 'op-muted', style: 'margin-top:9px', text: '槽位亮着就是在生效。名刀只算架上最强的三把；果实一辈子一颗。' }),
    );
  }

  function autoCard() {
    const a = data.auto;
    const dots = [];
    for (let i = 0; i < a.dailyCap; i++) dots.push(el('i', { class: i < a.runs ? 'on' : '' }));
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('div', {},
          el('div', { class: 'op-k', text: '自动冒险' }),
          el('div', { class: 'op-v', text: a.enabled ? '她在自己走' : '停下了' }),
        ),
        el('div', { style: 'text-align:right' },
          el('div', { class: 'op-k', text: '今天还剩' }),
          el('div', { class: 'op-v', text: `${a.left} 次` }),
        ),
      ),
      el('div', { class: 'op-pips' }, ...dots),
      el('div', { class: 'op-muted', style: 'margin-top:8px', 'data-auto': String(Date.now() + a.nextInMs), text: a.enabled
        ? `每 ${a.minutes} 分钟一次，下次 ${remainText(a.nextInMs)}。过了章节会推一条回执给她。`
        : '配置里关着，或者她自己喊停了。手动点也行。' }),
      el('button', {
        class: 'op-btn wide', type: 'button', disabled: busy ? '1' : null,
        text: a.enabled ? '让她先歇着' : '让她接着走',
        onclick: () => act('auto', !a.enabled),
      }),
      permNote(),
    );
  }

  /** 右栏的「船与船员」速览：一屏能看见船、六个部件、十个头像。 */
  function shipMini() {
    const s = data.ship;
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-sec' },
        el('span', { class: 't', text: '船与船员' }),
        el('span', { class: 'r' }),
        el('button', { class: 'op-link', type: 'button', text: '去船坞 →', onclick: () => { tab = 'ship'; render(); } }),
      ),
      el('div', { class: 'op-row' },
        el('div', {},
          el('div', { class: 'op-v', text: s.name }),
          el('div', { class: 'op-muted', text: `改装 ${s.partSum}/${s.partMax} · 加成 +${s.bonusPct}%` }),
        ),
        el('div', { style: 'text-align:right' },
          el('div', { class: 'op-k', text: '船体' }),
          el('div', { class: 'op-v', text: `${data.captain.hull}/100` }),
        ),
      ),
      el('div', { class: 'op-parts six', style: 'margin-top:9px' },
        ...s.parts.map((p) => el('div', { title: `${p.name} ${p.level}/${p.max}` },
          el('span', { class: 'op-dots' }, ...Array.from({ length: p.max }, (_, i) => el('i', { class: i < p.level ? 'on' : '' }))),
          el('div', { class: 'op-muted', style: 'font-size:9.5px;margin-top:2px', text: p.name }),
        )),
      ),
      el('div', { class: 'op-faces' },
        ...data.crew.list.map((m) => el('span', {
          class: `op-face${m.away ? ' away' : ''}`,
          title: `${m.short} · ${m.roleLabel} · 疲劳 ${m.fatigue}`,
          text: m.short.slice(0, 1),
        })),
      ),
    );
  }

  function recentCard() {
    const recent = data.campaign.recent ?? [];
    if (!recent.length) {
      return el('div', { class: 'op-card' },
        el('div', { class: 'op-sec' }, el('span', { class: 't', text: '年代记' }), el('span', { class: 'r' })),
        el('div', { class: 'op-empty', text: '还没有翻过第一页。点「继续冒险」，风车村就在前面。' }),
      );
    }
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-sec' },
        el('span', { class: 't', text: '年代记 · 最近几章' }),
        el('span', { class: 'r' }),
        el('button', { class: 'op-link', type: 'button', text: '全部 →', onclick: () => { tab = 'log'; render(); } }),
      ),
      logList(recent, false),
    );
  }

  /** 事件日志：按类型换图标，不是只换个颜色的点。 */
  function logList(list, withDay) {
    const wrap = el('div', { class: 'op-log' });
    for (const e of list) {
      const kind = String(e.kind || '');
      const boss = kind.includes('BOSS') || String(e.title || '').includes('BOSS');
      const icon = boss ? 'skull'
        : e.outcome === 'captured' ? 'anchor'
          : kind.includes('航行') ? 'sail'
            : kind.includes('剧情') ? 'scroll'
              : kind.includes('寻宝') ? 'chest'
                : 'sword';
      wrap.append(el('div', { class: 'op-entry' },
        el('div', { class: `ic2 ${e.outcome}`, html: ico(icon, 15) }),
        el('div', {},
          el('div', { class: 'hd' },
            el('span', { text: `${e.island} · ${e.chapterTitle || e.title || e.kind}` }),
            el('span', { class: `op-tag ${e.outcome}`, text: e.outcomeLabel }),
            e.choice ? el('span', { class: 'op-tag', text: `选：${e.choice}` }) : null,
          ),
          withDay && e.bountyText ? el('div', { class: 'sub', text: `赏金 ${e.bountyText}` }) : null,
        ),
        withDay ? el('span', { class: 'day', text: `第 ${e.day} 天` }) : null,
      ));
    }
    return wrap;
  }

  // ── 页：年代记 ────────────────────────────────────────────────────────

  function renderStory() {
    const nodes = [];
    const n = notice();
    if (n) nodes.push(n);
    const event = eventCard();
    if (event) nodes.push(event);
    const left = el('div', { class: 'op-col' }, banner());
    if (data.choice) left.append(choiceCard());
    left.append(chapterCard(), recentCard());
    const right = el('div', { class: 'op-col' });
    const advice = adviceCard();
    if (advice) right.append(advice);
    right.append(powerCard(), autoCard(), shipMini());
    nodes.push(el('div', { class: 'op-cols' }, left, right));
    return nodes;
  }

  function choiceCard() {
    const c = data.choice;
    return el('div', { class: 'op-choice' },
      el('div', { class: 't', text: c.title }),
      c.prompt ? el('div', { class: 'p', text: c.prompt }) : null,
      ...c.options.map((o) => el('button', {
        class: 'opt', type: 'button', disabled: busy ? '1' : null,
        onclick: () => act('choose', o.index),
      }, el('b', { text: `${o.index}. ${o.label}` }), el('span', { text: o.hint }))),
      el('div', { class: 'op-muted', style: 'margin-top:7px', text: '选完就定了，不会重来。' }),
    );
  }

  // ── 页：航海图 ────────────────────────────────────────────────────────

  function captainCard() {
    const c = data.captain;
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row', style: 'align-items:flex-start' },
        el('div', {},
          el('div', { class: 'op-k', text: '船长' }),
          el('div', { class: 'op-v', text: `${c.epithet}「${c.name}」` }),
          el('div', { class: 'op-muted', text: `${c.title} · 罪名 ${c.crime} · 去过 ${c.explored} 座岛` }),
        ),
        el('div', { style: 'text-align:right' },
          el('div', { class: 'op-k', text: '悬赏' }),
          el('div', { class: 'op-v', style: 'color:#9a6c10', text: c.bountyText }),
          el('div', { class: 'op-muted', text: `${c.berriesText} ${data.theme.currency}` }),
        ),
      ),
      el('div', { class: 'op-detail', style: 'margin-top:11px' },
        el('div', { class: 'hd' },
          el('span', { class: 'op-k', text: `船体 · ${data.ship.name}` }),
          el('span', { class: 'op-muted', text: `${c.hull}/100` }),
        ),
        el('div', { class: 'op-round', style: 'grid-template-columns:1fr;margin-top:5px' },
          el('div', { class: 'gauge', style: 'height:8px' },
            el('i', {
              class: c.hull < 35 ? '' : 'win',
              style: `width:${c.hull}%;background:${c.hull < 35 ? 'linear-gradient(90deg,#a5301f,#d9694f)' : c.hull < 70 ? 'linear-gradient(90deg,#b7791f,#e2b33c)' : ''}`,
            }),
          ),
        ),
        el('div', { class: 'op-muted', style: 'margin-top:6px', text: data.ship.note }),
      ),
      c.hull < 100
        ? el('button', {
          class: 'op-btn primary wide', type: 'button', disabled: busy ? '1' : null,
          text: `修船（${data.repairCostText} ${data.theme.currency}）`,
          onclick: () => act('repair'),
        })
        : null,
    );
  }

  /** 今天的海：风向标记 + 一句描述 + 对自由航海的加减。主线章节不看这个。 */
  function weatherCard() {
    const w = data.weather;
    if (!w) return null;
    const bits = [];
    if (w.berry) bits.push(`贝利 ${w.berry > 0 ? '+' : ''}${w.berry}%`);
    if (w.sail) bits.push(`航时 ${w.sail > 0 ? '+' : ''}${w.sail}%`);
    if (w.damage) bits.push(`船体损伤 ${w.damage > 0 ? '+' : ''}${w.damage}%`);
    if (w.risk) bits.push(`风险 +${w.risk}`);
    return el('div', { class: 'op-card', style: 'margin-top:10px' },
      el('div', { class: 'op-row' },
        el('div', { style: 'display:flex;align-items:center;gap:10px;min-width:0' },
          el('span', { style: 'flex:none;line-height:0', html: weatherArt(w.id) }),
          el('div', { style: 'min-width:0' },
            el('div', { class: 'op-k', text: `今天的海 · ${w.name}` }),
            el('div', { class: 'op-muted', text: w.note }),
          ),
        ),
      ),
      bits.length
        ? el('div', { class: 'op-muted', style: 'margin-top:6px', text: `自由航海：${bits.join(' · ')}。主线不受影响。` })
        : null,
    );
  }

  function renderSea() {
    const nodes = [];
    const n = notice();
    if (n) nodes.push(n);
    nodes.push(captainCard());
    const wc = weatherCard();
    if (wc) nodes.push(wc);

    if (data.blocked) {
      nodes.push(el('div', { class: 'op-card' },
        el('div', { class: 'op-k', text: '被押送中' }),
        el('div', { class: 'op-v', style: 'font-size:26px', text: `${data.blocked.minutes} 分钟后靠岸` }),
        el('div', { class: 'op-muted', text: '靠岸之前出不了海。船还在，赏金没动——这段航程是她的代价，等一会儿就好。' }),
      ));
    } else if (data.voyage) {
      const ends = Date.parse(data.voyage.endsAt);
      nodes.push(el('div', { class: 'op-card' },
        el('div', { class: 'op-k', text: '在海上' }),
        el('div', { class: 'op-v', text: `${data.voyage.kindLabel} · ${data.voyage.islandName}` }),
        el('div', { style: 'font-size:26px;font-weight:600;font-variant-numeric:tabular-nums', 'data-ends': String(ends), text: remainText(ends - Date.now()) }),
        el('div', { class: 'op-muted', text: '回来才有结果。她会在靠岸时收到航海回执。' }),
      ));
    } else {
      nodes.push(el('div', { class: 'op-sec', style: 'margin:14px 0 0' },
        el('span', { class: 't', text: '自由航海' }),
        el('span', { class: 'r' }),
        el('span', { class: 'n', text: '不推剧情，练级、刷钱、捡材料' }),
      ));
      nodes.push(el('div', { class: 'op-routes' },
        ...data.routes.map((route) => el('div', { class: `op-route${route.risk >= 4 ? ' high' : ''}` },
          el('div', { class: 'band' },
            el('div', { html: routeScene(route.kindId) }),
            el('div', { class: 'kind', text: route.region }),
          ),
          el('div', { class: 'body' },
            el('div', { class: 'op-row' }, el('h4', { text: route.kindLabel }), riskMark(route.risk)),
            el('div', { class: 'where', text: `${route.islandName} · 约 ${route.minutes} 分钟` }),
            el('p', { text: route.desc }),
            el('div', { class: 'foot' },
              el('span', { class: 'op-muted', style: 'margin-right:auto', text: route.risk >= 4 ? '风险高，收益也高' : `约 ${route.minutes} 分钟` }),
              el('button', { class: 'op-btn primary sm', type: 'button', disabled: busy ? '1' : null, text: '出海', onclick: () => act('sail', route.index) }),
            ),
          ),
        )),
      ));
    }
    return nodes;
  }

  /** 危险度：一块红漆木牌——骷髅、字、星，压在一起。 */
  function riskMark(risk) {
    const label = risk >= 4 ? '风险高' : risk >= 3 ? '风险一般' : '风险低';
    return el('span', { class: 'op-risk', title: `风险 ${risk}/5` },
      el('span', { html: ico('skull', 16) }),
      el('span', { class: 'lb', text: label }),
      el('span', { class: 'stars' }, ...Array.from({ length: 5 }, (_, i) => el('i', { class: i < risk ? 'on' : '' }))),
    );
  }

  // ── 页：船与船员 ──────────────────────────────────────────────────────

  const HOTSPOT = {
    armor: [12, 74], cannon: [25, 68], hull: [48, 82], galley: [62, 79], sail: [47, 31], helm: [80, 72],
  };

  const PART_ICON = {
    hull: 'plank', sail: 'sail', helm: 'helm', cannon: 'cannon', galley: 'pot', armor: 'shield',
  };

  function shipStage() {
    const s = data.ship;
    const picked = s.parts.find((p) => p.id === partPick) ?? s.parts[0];
    const box = el('div', { class: 'shipbox' }, el('div', { class: 'art', html: shipArt(s.tier, false) }));
    for (const part of s.parts) {
      const [x, y] = HOTSPOT[part.id] ?? [50, 50];
      box.append(el('button', {
        class: `op-hot${part.id === picked.id ? ' on' : ''}`, type: 'button',
        style: `left:${x}%;top:${y}%`, title: `${part.name} ${part.level}/${part.max}`,
        onclick: () => { partPick = part.id; render(); },
      }, el('span', { class: 'icx', html: ico('gear', 17) }),
      el('span', { class: 'tag', text: `${part.name} ${part.level}/${part.max}` })));
    }
    return el('div', {},
      el('div', { class: 'op-stage' },
        el('div', { html: stageScene() }),
        el('span', { class: 'cap', text: '点船上的部件' }),
        box,
      ),
      el('div', { class: 'op-parts' },
        ...s.parts.map((part) => el('button', {
          class: `op-part-mini${part.id === picked.id ? ' on' : ''}`, type: 'button',
          onclick: () => { partPick = part.id; render(); },
        },
        el('div', { class: 'nm' },
          el('span', { html: ico(PART_ICON[part.id] ?? 'plank', 13) }),
          el('span', { text: part.name })),
        el('div', { class: 'lv' },
          el('span', { class: 'op-dots' }, ...Array.from({ length: part.max }, (_, i) => el('i', { class: i < part.level ? 'on' : '' }))),
          ` ${part.level}/${part.max}`),
        )),
      ),
      el('div', { class: 'op-detail' },
        el('div', { class: 'hd' },
          el('div', { class: 'op-v', text: picked.name }),
          el('div', { class: 'op-muted', text: `${picked.level}/${picked.max}` }),
        ),
        el('div', { class: 'ef', text: picked.desc }),
        el('div', { class: 'ef', text: `效果：${picked.effect}` }),
        picked.maxed
          ? el('button', { class: 'op-btn wide', type: 'button', disabled: '1', text: '已经到顶' })
          : el('button', {
            class: 'op-btn primary wide', type: 'button', disabled: busy || !picked.canPay ? '1' : null,
            text: picked.preview, title: picked.cost.text,
            onclick: () => act('upgrade', picked.id),
          }),
        picked.maxed ? null : el('div', { class: 'cost', text: picked.cost.text }),
      ),
    );
  }

  function bagCard() {
    const items = data.materials;
    const slots = [];
    for (let i = 0; i < 6; i++) {
      const m = items[i];
      slots.push(m
        ? el('div', { class: 'op-mat' },
          el('div', { class: 'nm2', text: m.name }),
          el('div', { html: matArt(m.id, m.color) }),
          el('span', { class: 'n', text: String(m.n) }))
        : el('div', { class: 'op-mat empty' }));
    }
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-sec' },
        el('span', { class: 't', text: '材料' }),
        el('span', { class: 'r' }),
        el('span', { class: 'n', text: '章节与自由航海' }),
      ),
      el('div', { class: 'op-bag' }, ...slots),
    );
  }

  function bondsCard() {
    const list = data.bonds ?? [];
    const on = list.filter((b) => b.active).length;
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-sec' },
        el('span', { class: 't', text: '羁绊' }),
        el('span', { class: 'r' }),
        el('span', { class: 'n', text: `${on}/${list.length} 组成立` }),
      ),
      el('div', { class: 'op-bonds' },
        ...list.map((b) => el('div', { class: `op-bond${b.active ? ' on' : ''}` },
          el('span', { class: 'face', text: b.a.slice(0, 1) }),
          el('span', { class: 'link' }),
          el('span', { class: 'face', text: b.b.slice(0, 1) }),
          el('span', { class: 'meta' },
            el('b', { text: b.name }),
            el('em', { text: b.active ? BOND_EFFECT[b.effect] ?? '' : '两个人都在船上才亮' }),
          ),
        )),
      ),
      el('div', { class: 'op-muted', style: 'margin-top:8px', text: '被派上岸的人不算——羁绊会断，派之前看一眼。' }),
    );
  }

  function crewCard() {
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('div', {},
          el('div', { class: 'op-k', text: '船员' }),
          el('div', { class: 'op-v', text: `${data.crew.count} 人 · 疲劳 ${data.crew.avgFatigue}`
            + (data.crew.away ? ` · 岸上 ${data.crew.away}` : '') }),
        ),
        el('button', {
          class: 'op-btn sm', type: 'button', disabled: busy ? '1' : null,
          text: `歇一晚（${data.crew.restCostText}）`, onclick: () => act('rest'),
        }),
      ),
      el('div', { class: 'op-crew' },
        ...(data.crew.list.length
          ? data.crew.list.map((m) => el('div', { class: `op-mate${m.away ? ' away' : ''}` },
            el('div', { class: 'av', text: m.short.slice(0, 1) }),
            el('div', { style: 'min-width:0;flex:1' },
              el('div', { class: 'nm' },
                el('span', { text: m.short }),
                m.away ? el('span', { class: 'away-tag', text: `岸上 · ${m.awayIn} 章` }) : null,
              ),
              el('div', { class: 'rl', text: `${m.roleLabel} · 战力 +${m.powerPct}%` }),
              el('div', { class: 'ef', text: m.effect }),
              el('div', { class: 'bar' }, el('i', {
                class: m.fatigue > 70 ? 'hot' : m.fatigue > 40 ? 'worn' : '',
                style: `width:${100 - m.fatigue}%`,
              })),
              el('div', { class: 'op-muted', style: 'font-size:10.5px;margin-top:2px', text: m.away
                ? '这几章不算战力'
                : m.fatigue > 70 ? '快累趴了，只有七成力' : `疲劳 ${m.fatigue}/100` }),
              m.away
                ? el('button', {
                  class: 'op-btn sm', type: 'button', style: 'margin-top:5px;width:100%',
                  disabled: busy ? '1' : null, text: '叫回来', onclick: () => act('recall', m.id),
                })
                : m.task
                  ? el('button', {
                    class: 'op-btn sm', type: 'button', style: 'margin-top:5px;width:100%',
                    disabled: busy || !data.crew.canSend ? '1' : null,
                    title: `${m.task.note} 带回：${m.task.reward}`,
                    text: m.task.label, onclick: () => act('dispatch', m.id),
                  })
                  : null,
            ),
          ))
          : [el('div', { class: 'op-empty', text: '还没人上船。第一个同伴在第 3 章之后。' })]),
      ),
      el('div', { class: 'op-muted', style: 'margin-top:8px', text: data.crew.nextJoin
        ? `下一个同伴：${data.crew.nextJoin.short === data.crew.nextJoin.name
          ? data.crew.nextJoin.name
          : `${data.crew.nextJoin.short}（${data.crew.nextJoin.name}）`}，第 ${data.crew.nextJoin.after} 章之后上船。`
        : '该上船的都上船了。' }),
    );
  }

  function renderShip() {
    const nodes = [];
    const n = notice();
    if (n) nodes.push(n);
    const s = data.ship;
    nodes.push(el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('div', {},
          el('div', { class: 'op-k', text: `现在的船 · ${s.tier}/4 档` }),
          el('div', { class: 'op-v', style: 'font-size:17px', text: s.name }),
          el('div', { class: 'op-muted', text: `改装 ${s.partSum}/${s.partMax} · 加成 +${s.bonusPct}%`
            + (s.nextName ? ` · 下一艘 ${s.nextName}（${s.nextArc}）` : '') }),
        ),
        el('span', { class: 'op-tag game', text: `船体 ${data.captain.hull}` }),
      ),
      el('div', { class: 'op-muted', style: 'margin-top:4px', text: s.note }),
    ));
    nodes.push(el('div', { class: 'op-cols' },
      el('div', { class: 'op-col' }, shipStage()),
      el('div', { class: 'op-col' }, bagCard(), bondsCard()),
    ));
    nodes.push(crewCard());
    return nodes;
  }


/** 铅字 WANTED：位移滤镜把边缘啃出毛刺，再压一层浅色做凸版。 */
function wantedArt() {
  return `<svg viewBox="0 0 300 54" role="img" aria-label="WANTED">
    <defs>
      <filter id="opTypeRough" x="-8%" y="-40%" width="116%" height="180%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09 0.16" numOctaves="2" seed="11" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <g filter="url(#opTypeRough)">
      <text x="150" y="40" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="42" font-weight="700" letter-spacing="4.5" fill="#efe0bf" opacity=".7">WANTED</text>
      <text x="150" y="41.6" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="42" font-weight="700" letter-spacing="4.5" fill="#241a12">WANTED</text>
    </g>
  </svg>`;
}

/** 悬赏印：顺时针 15°，位移 + 模糊做出墨晕，再用几道纸色缺口啃掉边。 */
function sealArt() {
  const ink = '#a5342a';
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <filter id="opSealRough" x="-28%" y="-28%" width="156%" height="156%">
        <feTurbulence type="fractalNoise" baseFrequency="0.1 0.12" numOctaves="3" seed="5" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.8" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feGaussianBlur in="d" stdDeviation=".32"/>
      </filter>
    </defs>
    <g filter="url(#opSealRough)" opacity=".74">
      <rect x="15" y="15" width="70" height="70" rx="3" fill="${ink}" fill-opacity=".07" stroke="${ink}" stroke-width="4.4"/>
      <rect x="21.6" y="21.6" width="56.8" height="56.8" fill="none" stroke="${ink}" stroke-width="1" stroke-opacity=".5"/>
      <text x="50" y="47.5" text-anchor="middle" font-family="'Songti SC','SimSun',serif" font-size="26"
        font-weight="700" fill="${ink}">懸</text>
      <text x="50" y="74.5" text-anchor="middle" font-family="'Songti SC','SimSun',serif" font-size="26"
        font-weight="700" fill="${ink}">賞</text>
      <g fill="#f4ecd8" opacity=".6">
        <rect x="17" y="45" width="10" height="2.6" transform="rotate(-9 22 46)"/>
        <rect x="70" y="62" width="12" height="2.2" transform="rotate(13 76 63)"/>
        <rect x="43" y="11" width="8" height="2.2"/>
      </g>
    </g>
  </svg>`;
}

/** 海军徽：海鸥压在双锚上，外面一圈。 */
function marineCrest() {
  return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="24" cy="24" r="20.4" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="17.2" stroke-width=".7" stroke-dasharray="1.5 2.6" stroke-opacity=".7"/>
    <path d="M23.4 16.6c-3.2-4.4-7.6-6.6-12.2-6 .8 3.6 3.6 6.2 7.4 7.2 1.8.5 3.4.5 4.8.3"/>
    <path d="M24.6 16.6c3.2-4.4 7.6-6.6 12.2-6-.8 3.6-3.6 6.2-7.4 7.2-1.8.5-3.4.5-4.8.3"/>
    <path d="M24 16.4v5.4"/>
    <circle cx="24" cy="24" r="2"/>
    <path d="M17.8 30.6 30.2 36.4M30.2 30.6 17.8 36.4" stroke-width="1.2"/>
  </svg>`;
}

  // ── 页：悬赏令 ────────────────────────────────────────────────────────

  function posterCard() {
    const c = data.captain;
    return el('div', { class: 'op-poster' },
      el('span', { class: 'crease v' }),
      el('span', { class: 'crease h' }),
      el('span', { class: 'stain', style: 'left:4%;top:3%;width:132px;height:132px' }),
      el('span', { class: 'stain', style: 'right:0%;bottom:8%;width:164px;height:164px' }),
      el('span', { class: 'stain', style: 'left:26%;bottom:30%;width:96px;height:96px' }),
      el('div', { class: 'inner' },
        el('div', { class: 'wanted', html: wantedArt() }),
        el('div', { class: 'frame' }, art(stencilPortrait(c.name, c.epithet))),
        el('div', { class: 'doa', text: 'DEAD OR ALIVE' }),
        el('div', { class: 'name', text: c.name }),
        el('div', { class: 'epi', text: `「${c.epithet}」· ${c.crime}` }),
        el('div', { class: 'amount-wrap' },
          el('div', { class: 'rule2' }),
          el('div', { class: 'amount', text: c.amountText }),
          el('div', { class: 'rule2' }),
        ),
        el('div', { class: 'unit', text: data.theme.currency }),
        el('div', { class: 'marine' },
          el('span', { html: marineCrest() }),
          el('span', { class: 'txt' }, el('b', { text: 'MARINE' }), el('i', { text: '海軍本部' })),
        ),
      ),
      el('div', { class: 'seal', html: sealArt() }),
    );
  }

  function renderPoster() {
    const nodes = [];
    const n = notice();
    if (n) nodes.push(n);
    const c = data.captain;
    const next = data.next;
    const side = el('div', { class: 'op-col' },
      el('div', { class: 'op-card' },
        el('div', { class: 'op-sec' }, el('span', { class: 't', text: '现在的身份' }), el('span', { class: 'r' })),
        el('div', { class: 'op-v', style: 'font-size:20px', text: c.title }),
        el('div', { class: 'op-muted', text: `第 ${data.rank}/${data.total} 名 · 悬赏 ${c.bountyText}` }),
        el('div', { class: 'op-duel' },
          el('div', { class: 'nums' },
            el('div', { class: 'side me' }, el('span', { class: 'lb', text: '下一档' }), el('b', { style: 'font-size:13px', text: next ? next.title : '满级' })),
            el('div', { class: 'side foe' }, el('b', { style: 'font-size:13px', text: next ? `${Math.round((next.progress ?? 0) * 100)}%` : '—' })),
          ),
          el('div', { class: 'track', style: 'height:8px' },
            el('i', { class: 'me', style: `width:${Math.round((next ? next.progress : 1) * 100)}%` }),
          ),
        ),
        el('div', { class: 'op-muted', style: 'margin-top:6px', text: next ? `还差 ${next.needText} ${data.theme.currency}` : '已经是最高的称号' }),
      ),
      el('div', { class: 'op-card' },
        el('div', { class: 'op-sec' }, el('span', { class: 't', text: '这张纸' }), el('span', { class: 'r' })),
        el('div', { class: 'op-muted', text: '海军的编号、她的剪影、现在的罪名和金额。赏金跟着剧情涨；跨过 1 亿、3 亿、5 亿会换称号。' }),
        el('div', { class: 'op-muted', style: 'margin-top:6px', text: `船员 ${data.crew.count} 人没有被画上去——通缉令只认船长。` }),
        el('div', { class: 'op-muted', style: 'margin-top:6px', text: '画像是剪影加网点，不画脸——画不像比不画更难看。' }),
      ),
      el('div', { class: 'op-card' },
        el('div', { class: 'op-sec' }, el('span', { class: 't', text: '最近的赏金' }), el('span', { class: 'r' })),
        logList((data.campaign.recent ?? []).slice(0, 4), false),
      ),
    );
    nodes.push(el('div', { class: 'op-poster-wrap' }, posterCard(), side));
    return nodes;
  }

  // ── 页：收藏 ──────────────────────────────────────────────────────────

  function codexSummary() {
    const g = data.gears;
    const cx = data.codex;
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('div', {},
          el('div', { class: 'op-k', text: '图鉴' }),
          el('div', { class: 'op-v', style: 'font-size:22px', text: `${Math.round(cx.percent * 100)}%` }),
        ),
        el('div', { style: 'text-align:right' },
          el('div', { class: 'op-k', text: '已记录' }),
          el('div', { class: 'op-v', text: `${cx.on}/${cx.total}` }),
        ),
      ),
      el('div', { class: 'op-duel' },
        el('div', { class: 'track', style: 'height:8px' },
          el('i', { class: 'me', style: `width:${Math.round(cx.percent * 100)}%` }),
        ),
      ),
      el('div', { class: 'op-chips', style: 'margin:10px 0 0' },
        el('span', { class: 'op-chip', html: `${ico('sword', 13)}<span>名刀 ${g.bladeOwned}/${g.bladeCount}</span>` }),
        el('span', { class: 'op-chip', html: `${ico('fruit', 13)}<span>果实 ${g.fruitSeen}/${g.fruitCount}</span>` }),
        el('span', { class: 'op-chip', html: `${ico('book', 13)}<span>正文 ${data.story.count}/${data.story.total}</span>` }),
      ),
      el('div', { class: 'op-muted', style: 'margin-top:8px', text: '每过 25% 给一次修行点和材料。这张表没有时间限制，去过的岛、打过的人、拿过的刀都算。' }),
    );
  }

  function bladeCard() {
    const g = data.gears;
    const groups = [
      ['all', '全部', g.bladeCount, g.bladeOwned],
      ['supreme', '无上大快刀', 12, g.blades.filter((b) => b.gradeKey === 'supreme' && b.owned).length],
      ['great', '大快刀', 12, g.blades.filter((b) => b.gradeKey === 'great' && b.owned).length],
      ['good', '良快刀', 9, g.blades.filter((b) => b.gradeKey === 'good' && b.owned).length],
    ];
    const list = bladePick === 'all' ? g.blades : g.blades.filter((b) => b.gradeKey === bladePick);
    const equippedBonus = g.blades.filter((b) => b.equipped).reduce((n, b) => n + b.power, 0);
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('div', { class: 'op-k', text: '名刀 · 三百年来只有这些' }),
        el('div', { class: 'op-muted', text: `刀架算最强三把 · +${equippedBonus.toFixed(1)}%` }),
      ),
      el('div', { class: 'op-grade-tabs' },
        ...groups.map(([key, label, total, owned]) => el('button', {
          class: `op-grade${bladePick === key ? ' on' : ''}`, type: 'button',
          text: `${label} ${owned}/${total}`,
          onclick: () => { bladePick = key; render(); },
        })),
      ),
      el('div', { class: 'op-shelf' },
        ...list.map((b) => el('div', {
          class: `op-blade${b.owned ? ' owned' : ''}${b.equipped ? ' equipped' : ''}`,
          title: b.owned ? b.note : '还没到手',
        },
        b.equipped ? el('span', { class: 'eq', text: '在架' }) : null,
        art(bladeArt(b.color, !b.owned, b.gradeKey)),
        // 店里和拍卖行的名字是看得见的；BOSS 身上那把留个问号。
        el('div', { class: 'nm', text: b.owned || b.price ? b.name : '？？？' }),
        el('div', { class: 'gd', text: b.gradeKey === 'supreme' ? '无上大快刀' : b.gradeKey === 'great' ? '大快刀' : '良快刀' }),
        el('div', { class: 'pw', text: b.owned ? `+${b.power}%` : '未到手' }),
        el('div', { class: 'src', text: b.fromLabel }),
        b.owned
          ? null
          : b.price
            ? el('button', {
              class: 'op-btn sm', type: 'button', disabled: busy || !b.canBuy ? '1' : null,
              text: b.priceText, onclick: () => act('buyBlade', b.id),
            })
            : null,
        )),
      ),
      el('div', { class: 'op-muted', style: 'margin-top:8px', text: '三十个篇章的 BOSS 各带一把，打完必得；花州、三代鬼彻在刀店，黑刀夜在拍卖行。' }),
    );
  }

  function fruitCard() {
    const g = data.gears;
    const eaten = g.eaten;
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('div', { class: 'op-k', text: '恶魔果实 · 一个人只能吃一颗' }),
        el('div', { class: 'op-muted', text: eaten ? `已吃：${eaten.name}` : `${g.fruitSeen}/${g.fruitCount} 见过` }),
      ),
      eaten
        ? el('div', { class: 'op-detail', style: 'margin-top:9px' },
          el('div', { class: 'hd' },
            el('div', { style: 'display:flex;gap:9px;align-items:center' },
              el('div', { style: 'width:44px' }, art(fruitArt(eaten.color))),
              el('div', {},
                el('div', { class: 'op-v', text: eaten.name }),
                el('div', { class: 'op-muted', text: `${eaten.tag} · 战力 +${eaten.power}%` }),
              ),
            ),
            el('span', { class: 'op-tag narrow', text: '已吃' }),
          ),
          el('div', { class: 'ef', text: eaten.upside }),
          el('div', { class: 'ef', style: 'color:#a5301f', text: '代价：怕海水，被俘的机会更大。这个换不回来。' }),
        )
        : el('div', { class: 'op-muted', style: 'margin-top:6px', text: '果实从遗迹、BOSS 和拍卖行来。吃了会怕海水——所以它是个选择，不是升级。' }),

      g.fruits.length
        ? el('div', { style: 'margin-top:10px' },
          el('div', { class: 'op-k', text: '船上放着' }),
          el('div', { class: 'op-fruits', style: 'margin-top:5px' },
            ...g.fruits.map((f) => el('div', { class: 'op-fruit seen' },
              art(fruitArt(f.color)),
              el('div', { class: 'nm', text: f.name }),
              el('div', { class: 'tg', text: `${f.tag} · +${f.power}%` }),
              el('div', { class: 'tg', text: f.upside }),
              el('button', {
                class: 'op-btn sm', type: 'button', disabled: busy || Boolean(eaten) ? '1' : null,
                text: eaten ? '已经吃过' : '吃掉',
                onclick: () => {
                  const ok = !globalThis.confirm || globalThis.confirm(`吃下「${f.name}」之后不能再吃第二颗，也换不回来。确定？`);
                  if (ok) act('eatFruit', f.id);
                },
              }),
              el('button', {
                class: 'op-btn sm', type: 'button', style: 'margin-top:3px', disabled: busy ? '1' : null,
                text: '卖掉', onclick: () => act('sellFruit', f.id),
              }),
            )),
          ))
        : null,

      el('div', { class: 'op-fruits' },
        ...g.catalog.map((f) => el('div', {
          class: `op-fruit${f.seen ? ' seen' : ' dim'}${eaten && eaten.id === f.id ? ' eaten' : ''}`,
          title: f.seen ? f.upside : '还没见过',
        },
        art(fruitArt(f.color, !f.seen)),
        el('div', { class: 'nm', text: f.seen ? f.name : '？？？' }),
        el('div', { class: 'tg', text: f.seen ? (eaten && eaten.id === f.id ? '已吃' : f.tag) : '没见过' }),
        )),
      ),
    );
  }

  function hakiCard() {
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('div', { class: 'op-k', text: '霸气' }),
        el('div', { class: 'op-muted', text: `修行点 ${data.training}` }),
      ),
      ...data.haki.map((h) => el('div', { class: 'op-haki' },
        el('div', { class: 'nm', style: `color:${h.unlocked ? h.color : 'inherit'};opacity:${h.unlocked ? 1 : .45}`, text: h.name }),
        el('div', { style: 'flex:1;min-width:0' },
          el('div', { class: 'pip' }, ...Array.from({ length: h.max }, (_, i) => el('i', { style: i < h.level ? `background:${h.color}` : '' }))),
          el('div', { class: 'per', text: h.unlocked ? h.per : `第 ${h.unlockAt} 章之后才会醒` }),
        ),
        h.maxed
          ? el('span', { class: 'op-muted', text: '满' })
          : el('button', {
            class: 'op-btn sm', type: 'button', disabled: busy || !h.canLearn ? '1' : null,
            text: h.unlocked ? `${h.cost} 点` : '未解锁',
            onclick: () => act('haki', h.id),
          }),
      )),
      el('div', { class: 'op-muted', style: 'margin-top:7px', text: '修行点从章节和自由航海里来。霸气不会掉，慢慢堆就行。' }),
    );
  }

  function glyphCard() {
    const st = data.story;
    const rows = el('div', { class: 'op-glyphs' },
      ...st.poneglyphs.map((p) => el('div', { class: `op-glyph${p.on ? ' on' : ''}` },
        art(glyphArt(p.on)),
        el('div', { class: 'nm', text: p.on ? p.name : '？？？' }),
        el('div', { class: 'wh', text: p.on ? p.where : '还没找到' }),
        el('div', { class: 'ln', text: p.on ? p.text : p.line }),
      )),
    );
    const portal = st.voidDone
      ? el('div', { class: 'op-void' },
        el('div', { class: 'op-k', text: '空白的一百年 · 已读' }),
        el('div', { class: 'op-muted', text: '那一页她已经读完了。赏金、贝利、称号都拿到了。' }))
      : st.voidUnlocked
        ? el('div', { class: 'op-void' },
          el('div', { class: 'op-row' },
            el('div', {},
              el('div', { class: 'op-k', text: `隐藏章 · ${st.voidTitle}` }),
              el('div', { class: 'op-v', text: `${st.voidBoss} · 难度 ${st.voidPower}` })),
            el('div', { class: 'op-muted', text: `挑战 ${st.voidTries} 次` }),
          ),
          el('div', { class: 'op-muted', style: 'margin-top:3px', text: '三回合，赢两回合。比结局那一章硬，输了不掉任何东西。' }),
          el('button', {
            class: 'op-btn primary wide', type: 'button', disabled: busy ? '1' : null,
            text: '读那一页', onclick: () => act('void'),
          }))
        : el('div', { class: 'op-void locked' },
          el('div', { class: 'op-k', text: `隐藏章 · ${st.voidTitle}` }),
          el('div', { class: 'op-muted', style: 'margin-top:2px', text: `四块历史正文凑齐才开。现在 ${st.count}/${st.total}。` }));
    return el('div', { class: 'op-card' },
      el('div', { class: 'op-row' },
        el('div', { class: 'op-k', text: '历史正文' }),
        el('div', { class: 'op-muted', text: `${st.count}/${st.total} 块` }),
      ),
      rows,
      portal,
    );
  }

  function renderCodex() {
    const nodes = [];
    const n = notice();
    if (n) nodes.push(n);
    nodes.push(codexSummary());
    nodes.push(bladeCard());
    nodes.push(el('div', { class: 'op-cols' },
      el('div', { class: 'op-col' }, fruitCard()),
      el('div', { class: 'op-col' }, hakiCard(), glyphCard()),
    ));
    nodes.push(el('div', { class: 'op-card' },
      el('div', { class: 'op-sec' }, el('span', { class: 't', text: '图鉴条目' }), el('span', { class: 'r' })),
      ...data.codex.sections.map((sec) => el('div', { class: 'op-cx-sec' },
        el('div', { class: 'op-cx-hd' },
          el('span', { text: sec.label }),
          el('span', { text: `${sec.on}/${sec.total}` }),
        ),
        el('div', { class: 'op-cx-items' },
          ...sec.items.map((item) => el('span', { class: `op-cx-item${item.on ? ' on' : ''}` },
            item.on ? item.name : '？？？',
            item.on && item.sub ? el('small', { text: item.sub }) : null))),
      )),
    ));
    return nodes;
  }

  // ── 页：排行榜 / 日志 ─────────────────────────────────────────────────

  function renderBoard() {
    const nodes = [];
    const n = notice();
    if (n) nodes.push(n);
    const me = data.board.find((r) => r.you);
    if (me) {
      nodes.push(el('div', { class: 'op-card', style: 'padding:9px 11px' },
        el('div', { class: 'op-line me' },
          el('span', { class: 'rk', text: `#${me.rank}` }),
          el('span', { text: `${me.epithet}「${me.name}」 · 你` }),
          el('span', { text: me.bountyText }),
        ),
      ));
    }
    nodes.push(el('div', { class: 'op-muted', style: 'margin:10px 0 8px', text: `榜上 ${data.total} 位，赏金是原作的数；会变的只有你。` }));
    const list = el('div', { class: 'op-board' });
    for (const row of data.board) {
      const medal = row.rank === 1 ? 'g1' : row.rank === 2 ? 'g2' : row.rank === 3 ? 'g3' : '';
      list.append(el('div', { class: `op-line${row.you ? ' me' : ''}${medal ? ` ${medal}` : ''}` },
        el('span', { class: 'rk', text: `#${row.rank}` }),
        el('span', { text: `${row.epithet}「${row.name}」${row.you ? ' · 你' : ''}` }),
        el('span', { text: row.bountyText }),
      ));
    }
    nodes.push(el('div', { class: 'op-card', style: 'padding:8px' }, list));
    nodes.push(el('div', { style: 'margin-top:10px;display:flex;gap:8px;align-items:center' },
      el('button', { class: 'op-btn', type: 'button', disabled: busy ? '1' : null, text: '重排榜单', onclick: () => act('rebuild') }),
      el('span', { class: 'op-muted', text: `按配置里的人数重排，现在是 ${data.total - 1} 个对手。` }),
    ));
    return nodes;
  }

  function renderLog() {
    const nodes = [];
    const n = notice();
    if (n) nodes.push(n);
    if (!data.log.length) {
      nodes.push(el('div', { class: 'op-empty', text: '还没有出过海。点「继续冒险」，回来就有第一页。' }));
      return nodes;
    }
    nodes.push(el('div', { class: 'op-card' },
      el('div', { class: 'op-sec' },
        el('span', { class: 't', text: '航海日志' }),
        el('span', { class: 'r' }),
        el('span', { class: 'n', text: `最近 ${data.log.length} 条` }),
      ),
      logList(data.log, true),
    ));
    return nodes;
  }

  function render() {
    renderHead();
    if (!data) return;
    const map = {
      story: renderStory, sea: renderSea, ship: renderShip, poster: renderPoster,
      codex: renderCodex, board: renderBoard, log: renderLog,
    };
    body.replaceChildren(...(map[tab] ? map[tab]() : []));
    startClock();
  }

  function startClock() {
    if (timer) { timer.dispose(); timer = null; }
    if (tab !== 'sea' && tab !== 'story') return;
    timer = ctx.interval(() => {
      const node = body.querySelector('[data-ends]');
      if (node) node.textContent = remainText(Number(node.getAttribute('data-ends')) - Date.now());
      const sail = body.querySelector('[data-sail]');
      if (sail) {
        const left = Number(sail.getAttribute('data-sail')) - Date.now();
        if (left > 0) {
          const m = Math.floor(left / 60000);
          const sec = Math.floor((left % 60000) / 1000);
          sail.textContent = `船在海上 · ${m}:${String(sec).padStart(2, '0')}`;
        } else if (sail.getAttribute('data-done') !== '1') {
          // 靠岸了：换一次文案，顺手重新拉一遍，把「继续冒险」还给她。
          sail.setAttribute('data-done', '1');
          sail.textContent = '船靠岸了 · 点一下继续';
          refresh();
        }
      }
      const auto = body.querySelector('[data-auto]');
      if (auto && data?.auto?.enabled) {
        const at = Number(auto.getAttribute('data-auto'));
        auto.textContent = `每 ${data.auto.minutes} 分钟一次，下次 ${remainText(at - Date.now())}。过了章节会推一条回执给她。`;
      }
    }, 1000);
  }

  render();
  refresh();
  ctx.interval(() => { if (!busy) refresh(); }, 15000);
}

export const __art = { shipArt, portrait: stencilPortrait, bladeArt, fruitArt };
export default { panels: { sea: { mount } } };
