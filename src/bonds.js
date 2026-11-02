/**
 * 羁绊：两个人同时在船上，就会多出一种只属于他们的东西。纯数据。
 *
 * 为什么不是「第三个属性」：船员本身已经各带一条被动，再加一层数值就太肥了。
 * 羁绊只做「本来没有的那点意思」——两个人凑在一起才成立，少一个就断，
 * 被派上岸也断（这一点在 collect.js 里统一过滤）。
 *
 * 效果都落在 collect.js 的某个函数里，字段名就是那个函数认的键：
 *   boss3   BOSS「决着」回合战力
 *   bounty  赏金倍率
 *   loot    章节掉落 +n 份材料
 *   heal    每打完一章回多少船体
 *   capture 被俘概率倍率（负数是变少）
 */
export const BONDS = [
  {
    id: 'rival', a: 'zoro', b: 'sanji', name: '谁也不服谁', effect: 'boss3', value: 0.05,
    line: '一个往东一个往西，真打起来总站在同一边。',
  },
  {
    id: 'brain', a: 'nami', b: 'robin', name: '两个聪明人', effect: 'bounty', value: 0.06,
    line: '一个算得清账，一个读得懂石头。',
  },
  {
    id: 'gear', a: 'usopp', b: 'franky', name: '发明二人组', effect: 'loot', value: 1,
    line: '一个敢想，一个敢焊。船上的零件越来越多了。',
  },
  {
    id: 'party', a: 'chopper', b: 'brook', name: '宴会', effect: 'heal', value: 4,
    line: '有人拉琴，有人跟着跳，伤就好得快一点。',
  },
  {
    id: 'ends', a: 'jinbe', b: 'yamato', name: '海的两端', effect: 'capture', value: -0.2,
    line: '一个从海底来，一个从和之国来，都不怕被围。',
  },
];

export function bondById(id) {
  return BONDS.find((b) => b.id === id) ?? null;
}

/** 面板要的清单：每组都列出来，active 决定亮不亮。 */
export function bondRows(ids) {
  const have = new Set(ids ?? []);
  return BONDS.map((b) => ({
    ...b,
    active: have.has(b.a) && have.has(b.b),
  }));
}
