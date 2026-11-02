/**
 * 名场面抉择。纯数据。
 *
 * 每一处都是「两三个都说得通」的选项，没有正确答案：
 * 有的换钱，有的换战力，有的换一个以后再用的东西。
 * 选完就写进存档，不会重来——这是这个模式里唯一不可逆的东西之一。
 *
 * fx 的字段（在 battle.js 里落地）：
 *   nextPower    下一战战力 +x（打完就消耗）
 *   nextBounty   下一战赏金 ×(1+x)
 *   captureRisk  下一战被俘概率 +x（可以是负数）
 *   berries / hull / fatigue / training / material / haki / codex
 *   flag         记一个标签，留给后面的剧情读
 */

const AGGRESSIVE = { nextPower: 0.1, hull: -16 };
const STEADY = { nextPower: 0.04, training: 1 };
const TRICKY = { nextBounty: 0.3, captureRisk: 0.1 };

/** key 是「篇章 id:章内序号」。 */
export const CHOICES = {
  'baratie:2': {
    title: '鹰眼的刀',
    prompt: '那个男人把刀收回鞘里，说「你还不配让我认真」。',
    options: [
      { label: '挡在她前面，接下这一刀', hint: '下一战 +10%，船体 -16', fx: AGGRESSIVE },
      { label: '先带人退回餐厅', hint: '下一战 +4%，修行 +1', fx: STEADY },
      { label: '记下他出刀的路数', hint: '下一战赏金 +30%，被俘风险 +10%', fx: TRICKY },
    ],
  },
  'arlong:2': {
    title: '娜美的眼泪',
    prompt: '她蹲在纸钱堆里，说「帮我毁了那间屋子」。',
    options: [
      { label: '把阿龙公园拆了', hint: '声望 +3，船体 -12', fx: { renown: 3, hull: -12 } },
      { label: '先把她带走，账以后再算', hint: '疲劳 -30，修行 +2', fx: { fatigue: -30, training: 2 } },
      { label: '让她自己动手', hint: '下一战 +6%，声望 +1', fx: { nextPower: 0.06, renown: 1 } },
    ],
  },
  'loguetown:1': {
    title: '处刑台',
    prompt: '海贼王死的那块木板还在。台下有人在笑。',
    options: [
      { label: '走上去，站一会儿', hint: '赏金 +8%，声望 +2', fx: { nextBounty: 0.25, renown: 2 } },
      { label: '在下面看一眼就走', hint: '修行 +2', fx: { training: 2 } },
      { label: '把台子砸了', hint: '下一战 +8%，海军盯上你', fx: { nextPower: 0.08, captureRisk: 0.08 } },
    ],
  },
  'drum:2': {
    title: '医生',
    prompt: '老太婆说：「船医我给你，但你要把她当人看。」',
    options: [
      { label: '答应，并且当场立字据', hint: '乔巴疲劳减半，修行 +2', fx: { training: 2, fatigue: -20 } },
      { label: '先把城堡里的药搬空', hint: '稀有材料 ×2', fx: { material: { rare: 2 } } },
      { label: '问她樱花什么时候开', hint: '声望 +2，图鉴 +1', fx: { renown: 2 } },
    ],
  },
  'alabasta:5': {
    title: '罗宾',
    prompt: '她坐在废墟上，问：「我可以上船吗？」',
    options: [
      { label: '让她上船', hint: '立刻多一个船员（考古学家）', fx: { recruit: 'robin', codex: true } },
      { label: '先问她叫什么名字', hint: '修行 +3，声望 +2', fx: { training: 3, renown: 2 } },
      { label: '拒绝', hint: '贝利 +800 万（她留下的东西）', fx: { berries: 8_000_000 } },
    ],
  },
  'skypiea:3': {
    title: '黄金钟',
    prompt: '钟就在那儿。敲一下，整片云海都听得见。',
    options: [
      { label: '敲响它', hint: '赏金 +10%，声望 +3', fx: { nextBounty: 0.35, renown: 3 } },
      { label: '把黄金搬走', hint: '贝利 +2000 万', fx: { berries: 20_000_000 } },
      { label: '什么都不动，转身走', hint: '修行 +3，见闻色进度 +1', fx: { training: 3, haki: 'kenbun' } },
    ],
  },
  'water7:2': {
    title: '梅丽号',
    prompt: '船匠摸了摸龙骨，摇头：「她撑不到下一座岛了。」',
    options: [
      { label: '修到底，多少钱都修', hint: '船体回满，贝利 -1500 万', fx: { hull: 100, berries: -15_000_000 } },
      { label: '让她退役，办一场葬礼', hint: '修行 +4，声望 +2', fx: { training: 4, renown: 2 } },
      { label: '先把这一趟跑完再说', hint: '木材 ×6、铁材 ×4', fx: { material: { wood: 6, iron: 4 } } },
    ],
  },
  'enies:1': {
    title: '烧旗',
    prompt: '那面旗一烧，就等于跟整个世界政府宣战。',
    options: [
      { label: '烧', hint: '赏金 +15%，被俘风险 +12%', fx: { nextBounty: 0.5, captureRisk: 0.12, flag: 'burned' } },
      { label: '不烧，从后门进去', hint: '下一战 +6%，修行 +2', fx: { nextPower: 0.06, training: 2 } },
    ],
  },
  'impel:2': {
    title: '艾斯',
    prompt: '他还活着，但只剩几天。牢门是开的——这明显是个套。',
    options: [
      { label: '进去', hint: '下一战 +14%，船体 -25', fx: { nextPower: 0.14, hull: -25 } },
      { label: '记下牢房号，先出去', hint: '修行 +4', fx: { training: 4 } },
    ],
  },
  'marineford:0': {
    title: '处刑',
    prompt: '倒计时开始了。台下全是海军，台上是你认识的人。',
    options: [
      { label: '从正面冲进去', hint: '下一战 +12%，被俘风险 +15%', fx: { nextPower: 0.12, captureRisk: 0.15 } },
      { label: '等一个空档', hint: '下一战 +5%，修行 +2', fx: { nextPower: 0.05, training: 2 } },
      { label: '先撤，保住船', hint: '船体 +30，贝利 +500 万', fx: { hull: 30, berries: 5_000_000 } },
    ],
  },
  'marineford:2': {
    title: '白胡子',
    prompt: '那个男人站着，背后一片海。他说：「你也想上那艘船？」',
    options: [
      { label: '说想', hint: '声望 +4，赏金 +12%', fx: { renown: 4, nextBounty: 0.4 } },
      { label: '说不用，我自己有船', hint: '修行 +4，下一战 +6%', fx: { training: 4, nextPower: 0.06 } },
    ],
  },
  'dressrosa:3': {
    title: '萨博',
    prompt: '他递过来一个烧了一半的果实，说「吃不吃随你」。',
    options: [
      { label: '接过来，吃掉', hint: '立刻获得一颗恶魔果实', fx: { fruit: true } },
      { label: '拿去拍卖', hint: '贝利 +3500 万', fx: { berries: 35_000_000 } },
      { label: '还给他，问一句「你弟弟呢」', hint: '声望 +3，修行 +3', fx: { renown: 3, training: 3 } },
    ],
  },
  'wholecake:3': {
    title: '茶会',
    prompt: '一屋子的人都在笑。蛋糕上插着一把刀。',
    options: [
      { label: '把桌子掀了', hint: '下一战 +12%，船体 -20', fx: { nextPower: 0.12, hull: -20 } },
      { label: '趁乱去拿历史正文', hint: '稀有材料 ×3，图鉴 +1', fx: { material: { rare: 3 } } },
      { label: '坐下，把蛋糕吃完', hint: '赏金 +10%，疲劳 -40', fx: { nextBounty: 0.3, fatigue: -40 } },
    ],
  },
  'wano:2': {
    title: '御田',
    prompt: '日记只剩最后几页。再往后翻，就是他死的那一天。',
    options: [
      { label: '翻到最后一页', hint: '修行 +5，图鉴 +1', fx: { training: 5 } },
      { label: '合上，不看了', hint: '声望 +3，下一战 +6%', fx: { renown: 3, nextPower: 0.06 } },
      { label: '把日记烧了', hint: '赏金 +18%，被俘风险 +10%', fx: { nextBounty: 0.55, captureRisk: 0.1 } },
    ],
  },
  'wano:5': {
    title: '五档',
    prompt: '身体开始不听使唤地笑。这个形态，用一次少活一点。',
    options: [
      { label: '开到五档', hint: 'BOSS 战 +20%，之后疲劳 +50', fx: { nextPower: 0.2, fatigue: 50 } },
      { label: '用武装色硬顶', hint: '修行 +4，船体 -15', fx: { training: 4, hull: -15 } },
      { label: '拖到天亮，让别人先上', hint: '疲劳 -40，声望 -1', fx: { fatigue: -40, renown: -1 } },
    ],
  },
  'laugh:0': {
    title: '最后一块',
    prompt: '石碑上写着这个世界的来历。读完它，就再也回不去了。',
    options: [
      { label: '读', hint: '图鉴 +1，修行 +8', fx: { training: 8, flag: 'read' } },
      { label: '拓一份，把石头留下', hint: '稀有材料 ×5，声望 +2', fx: { material: { rare: 5 }, renown: 2 } },
      { label: '不看，直接去找大秘宝', hint: '下一战 +15%', fx: { nextPower: 0.15, flag: 'skip' } },
    ],
  },
};

/**
 * BOSS 战之前的三选一：怎么打。
 * 影响的是「三回合」里的战力与被俘风险，不影响奖励公式。
 */
export const BOSS_STANCE = [
  {
    key: 'push', label: '压上去，一口气打完',
    hint: '三回合战力 +10%，船体 -14', fx: { nextPower: 0.1, hull: -14 },
  },
  {
    key: 'hold', label: '稳住，先看他怎么出手',
    hint: '三回合战力 +4%，修行 +1', fx: { nextPower: 0.04, training: 1 },
  },
  {
    key: 'trick', label: '不硬拼，找他的破绽',
    hint: '赏金 +35%，被俘风险 +12%', fx: { nextBounty: 0.35, captureRisk: 0.12 },
  },
];

/** 门（gate）上的 BOSS 有额外的姿态选项；普通 BOSS 就用上面那三条。 */
export const BOSS_TAUNTS = {
  alabasta: '沙子在他脚边转，他说：「你连血都流不出来。」',
  skypiea: '雷在他身后排成一条线。「神，是不需要理由的。」',
  enies: '他把拇指插进西装口袋：「CP9 不是给人打的。」',
  marineford: '岩浆把甲板烧穿了一个洞。「正义，不需要解释。」',
  wholecake: '糯米从他肩上流下来。「你看见的未来，是我让你看见的。」',
  wano: '龙在天上盘着，整座鬼岛都在抖。「小鬼，你叫什么名字？」',
  laugh: '没有人在那里。整座岛只有一个声音：「你终于来了。」',
};

export function choiceKey(arcId, index) {
  return `${arcId}:${index}`;
}

export function choiceOf(arcId, index) {
  return CHOICES[choiceKey(arcId, index)] ?? null;
}

/** 图鉴里「名场面」那一栏的清单。 */
export const SCENES = Object.entries(CHOICES).map(([key, c]) => ({ id: key, title: c.title }));
