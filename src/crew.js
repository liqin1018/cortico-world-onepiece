/**
 * 船员。纯数据，不认识存档、不认识 World。
 *
 * `after` 是「第几章打完上船」——用章节号而不是篇章 id，
 * 是为了让这个文件不依赖 campaign.js（依赖会绕成一个圈）。
 * 每个角色给一份 weight（战力权重，占基础战力的百分比）和一条被动。
 *
 * 设计上的取舍：船员是「按剧情白给」的，不需要抽卡也不需要花钱。
 * 所以战力预期里算了他们——难度跟着涨，玩家不会因为多几个人就变无敌。
 * 真正让人变强的是名刀、果实、霸气、船的改装，那些才是要花力气的。
 */
/** 被动的一句话说明，面板上直接显示，免得玩家去猜。 */
export const EFFECT_LABEL = {
  boss3: 'BOSS「决着」回合 +10%',
  sail: '自由航海时间 -15%',
  loot: '材料掉落 +1',
  cook: '疲劳增长 -30%',
  doctor: '每章回 6 点船体',
  lore: '稀有材料概率翻倍',
  dock: '修船费用 -30%',
  music: '休整多回四成疲劳',
  helm: '被俘概率 -40%',
  warrior: '战力 +2%',
};

export const CREW_ROLES = {  sword: '剑士',
  navigator: '航海士',
  sniper: '狙击手',
  cook: '厨师',
  doctor: '船医',
  archaeologist: '考古学家',
  shipwright: '船匠',
  musician: '音乐家',
  helmsman: '舵手',
  warrior: '战士',
};

/**
 * effect 的语义（在 collect.js 里实现）：
 * boss3     BOSS 战「决着」那回合战力 +10%
 * sail      自由航海时间 -15%
 * loot      材料掉落 +1
 * cook      疲劳增长 -30%
 * doctor    每打完一章回 6 点船体
 * lore      稀有材料概率翻倍
 * dock      修船费用 -30%
 * music     休整时多回 40% 疲劳（免费）
 * helm      被俘概率 -40%
 * warrior   战力 +2%
 */
export const CREW = [
  {
    id: 'zoro', name: '罗罗诺亚·索隆', short: '索隆', role: 'sword',
    after: 3, weight: 0.07, effect: 'boss3',
    line: '三把刀挂在腰上，睡觉的时候也在练。',
  },
  {
    id: 'usopp', name: '乌索普', short: '乌索普', role: 'sniper',
    after: 9, weight: 0.03, effect: 'loot',
    line: '弹弓打得准，故事讲得更准。',
  },
  {
    id: 'sanji', name: '山治', short: '山治', role: 'cook',
    after: 13, weight: 0.06, effect: 'cook',
    line: '只用手做菜，只用脚踢人。',
  },
  {
    id: 'nami', name: '娜美', short: '娜美', role: 'navigator',
    after: 17, weight: 0.035, effect: 'sail',
    line: '看得懂云，也看得懂账本。',
  },
  {
    id: 'chopper', name: '托尼托尼·乔巴', short: '乔巴', role: 'doctor',
    after: 31, weight: 0.035, effect: 'doctor',
    line: '一只蓝鼻子的驯鹿，会开药也会挨骂。',
  },
  {
    id: 'robin', name: '妮可·罗宾', short: '罗宾', role: 'archaeologist',
    after: 37, weight: 0.05, effect: 'lore',
    line: '世界上唯一还会读历史正文的人。',
  },
  {
    id: 'franky', name: '弗兰奇', short: '弗兰奇', role: 'shipwright',
    after: 57, weight: 0.045, effect: 'dock',
    line: '半个人是铁做的，修船比说话快。',
  },
  {
    id: 'brook', name: '布鲁克', short: '布鲁克', role: 'musician',
    after: 61, weight: 0.04, effect: 'music',
    line: '一把骨头，一把小提琴，一句「哟嚯嚯」。',
  },
  {
    id: 'jinbe', name: '甚平', short: '甚平', role: 'helmsman',
    after: 81, weight: 0.06, effect: 'helm',
    line: '在海里比在岸上还稳。',
  },
  {
    id: 'yamato', name: '大和', short: '大和', role: 'warrior',
    after: 107, weight: 0.06, effect: 'warrior',
    line: '把「光月御田」四个字背在身上的人。',
  },
];

/** 船上的位置有限：小船挤不下十个人。 */
export const CREW_CAP = [3, 5, 8, 10];

export function crewById(id) {
  return CREW.find((c) => c.id === id) ?? null;
}

/** 到第 done 章为止，谁该在船上了。 */
export function crewJoined(done) {
  return CREW.filter((c) => c.after <= done);
}
