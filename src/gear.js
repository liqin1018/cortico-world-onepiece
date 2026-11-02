/**
 * 收藏：名刀、恶魔果实、霸气、材料。纯数据。
 *
 * 三样东西的区别：
 *  - 名刀：一个篇章一把，打完那一篇的 BOSS 必掉；另外两把在店里，一把在拍卖行。
 *  - 果实：只能吃一颗，吃了就改不回来，还会怕海水。所以它是个「选择」，不是「升级」。
 *  - 霸气：三种，按剧情解锁，用修行点往上堆。慢，但不会掉。
 *
 * 刀按原作的三档分级：良快刀五十工 / 大快刀二十一工 / 无上大快刀十二工。
 * 三十个篇章各挂一把，所以走完剧情正好收满三十把，另外三把要用钱买。
 * 收藏可以很多，刀架上只有最强的三把算战力（BLADE_SLOTS）。
 */

// ── 名刀 ────────────────────────────────────────────────────────────────

/**
 * gradeKey 只用来分组和排序，不给玩家看。
 * power 是「占基础战力的百分比」，只有装在刀架上的前三把才算。
 * from: 'shop' 花钱买 / 'auction' 拍卖行 / 其余是篇章 id，打完那一篇的 BOSS 必掉。
 */
export const BLADES = [
  // ── 良快刀五十工 ──────────────────────────────────────────────────────
  {
    id: 'kashu', name: '花州', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.0035, color: '#8fa3b0', from: 'shop', price: 800_000,
    note: '刀身偏轻，适合带着走远路。刀店老板说它是「新手的第一把好刀」。',
  },
  {
    id: 'sayo', name: '小夜', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.003, color: '#a9b4bd', from: 'dawn',
    note: '风车村铁匠打的，刃口还有一道没磨匀的白线。',
  },
  {
    id: 'namikiri', name: '波切', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.004, color: '#9aa7b2', from: 'orange',
    note: '从橘子镇的海贼手里夺来的，刀鞘上刻着别人的名字。',
  },
  {
    id: 'chidori', name: '千鸟', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.005, color: '#b8c3cb', from: 'syrup',
    note: '刃纹像一群受惊的鸟，快，但握久了手会麻。',
  },
  {
    id: 'shirauo', name: '银鱼', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.006, color: '#cfd6dc', from: 'baratie',
    note: '厨房后门捡的。巴拉蒂的厨子用它片鱼，比很多海贼的刀还快。',
  },
  {
    id: 'sameba', name: '鲨齿', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.007, color: '#8b9aa6', from: 'arlong',
    note: '阿龙公园的兵器库里挂着的，刀背有一排锯齿。',
  },
  {
    id: 'shigure', name: '时雨', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.008, color: '#a4b0ba', from: 'loguetown',
    note: '罗格镇的刀铺里唯一一把没有生锈的。雨下起来的时候最好用。',
  },
  {
    id: 'sandai', name: '三代鬼彻', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.01, color: '#b0705a', from: 'shop', price: 8_000_000,
    note: '妖刀。刀柄上缠的绳子换过三次，店里不保修。',
  },
  {
    id: 'murasame', name: '村雨', grade: '良快刀五十工', gradeKey: 'good',
    power: 0.009, color: '#93a1ac', from: 'reverse',
    note: '颠倒山下的沉船里捞上来的，泡了太久，刃口有点软。',
  },

  // ── 大快刀二十一工 ────────────────────────────────────────────────────
  {
    id: 'ryogetsu', name: '良月', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.011, color: '#e3e8ec', from: 'whisky',
    note: '威士忌山峰的赏金猎人送的。他说这刀只配挂在墙上。',
  },
  {
    id: 'daikoku', name: '大黑', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.012, color: '#4c5763', from: 'littlegarden',
    note: '巨人的刀，按人的身高改短过，重心还是偏。',
  },
  {
    id: 'yukibana', name: '雪花', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.013, color: '#eef2f5', from: 'drum',
    note: '磁鼓岛的雪化不了它，刃上永远结着一层薄霜。',
  },
  {
    id: 'sara', name: '沙罗', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.014, color: '#d8c9a6', from: 'alabasta',
    note: '王家墓室里的陪葬刀。刀镡是一朵开败的花。',
  },
  {
    id: 'shunrai', name: '春雷', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.015, color: '#bcc7cf', from: 'jaya',
    note: '加雅的上空打过一次没有云的雷，这把刀就是那时候落下来的。',
  },
  {
    id: 'kumogiri', name: '云切', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.016, color: '#dfe6ea', from: 'skypiea',
    note: '在云上砍过东西，刃口留着一层白，擦不掉。',
  },
  {
    id: 'hien', name: '飞燕', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.017, color: '#c8d2d9', from: 'longring',
    note: '轻得不像话，挥出去的时候几乎听不见风声。',
  },
  {
    id: 'souha', name: '沧波', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.018, color: '#7f8f9c', from: 'water7',
    note: '船匠送的。刀身有道弯，据说是为了在甲板上不挂帆绳。',
  },
  {
    id: 'kikoku', name: '鬼哭', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.019, color: '#5b4a52', from: 'enies',
    note: '司法岛底下那间屋子里挂着的，刀鞘会自己发出一点声音。',
  },
  {
    id: 'shusui', name: '秋水', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.02, color: '#3f4a56', from: 'thriller',
    note: '黑刀。握上去是凉的，像一块墓碑。',
  },
  {
    id: 'wado', name: '和道一文字', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.021, color: '#dfe4e8', from: 'sabaody',
    note: '白鞘，直刃。刀主把它当命，现在轮到你了。',
  },
  {
    id: 'enma', name: '阎魔', grade: '大快刀二十一工', gradeKey: 'great',
    power: 0.022, color: '#c8a24a', from: 'amazon',
    note: '会自己吸走霸气。拿得住的人不多。',
  },

  // ── 无上大快刀十二工 ──────────────────────────────────────────────────
  {
    id: 'murakumogiri', name: '丛云切', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.026, color: '#e6e9ec', from: 'impel',
    note: '太长，几乎不像刀。挥一次要半个甲板。',
  },
  {
    id: 'yasakani', name: '八尺琼', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.028, color: '#d9c98f', from: 'marineford',
    note: '刀镡上镶着三颗勾玉。顶上战争之后，它换了主人。',
  },
  {
    id: 'ame', name: '天羽羽斩', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.03, color: '#cfdae2', from: 'fishman',
    note: '在鱼人岛的珊瑚林里找到的，刀身有鳞片一样的花纹。',
  },
  {
    id: 'kumokiri', name: '蜘蛛切', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.032, color: '#5a616b', from: 'punk',
    note: '庞克哈萨德的实验室里冻着半截，解冻之后刃口自己合上了。',
  },
  {
    id: 'doujigiri', name: '童子切', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.034, color: '#e9edf0', from: 'dressrosa',
    note: '德雷斯罗萨的竞技场奖品。上一任主人只赢了它一次。',
  },
  {
    id: 'nanahoshi', name: '七星', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.036, color: '#b9c6cf', from: 'zou',
    note: '象背上的老铁匠打的，刃上真的敲了七颗星。',
  },
  {
    id: 'muramasa', name: '村正', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.038, color: '#8e3f3a', from: 'wholecake',
    note: '妖气比三代鬼彻重得多。拿它的人最后都想砍点什么。',
  },
  {
    id: 'shodai', name: '初代鬼彻', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.04, color: '#9c3f38', from: 'wano',
    note: '和三代同一脉，气息完全不同。它不响，但一直在。',
  },
  {
    id: 'ace', name: '艾斯', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.043, color: '#2f343d', from: 'eggy',
    note: '上一代海贼王的刀。握柄上有一道被烧过的痕迹。',
  },
  {
    id: 'kujira', name: '鲸落', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.046, color: '#dfe7ec', from: 'elbaph',
    note: '艾尔帕布的海底捞上来的。巨人们说，那是给「会来的人」留的。',
  },
  {
    id: 'rei', name: '黎明', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.048, color: '#f0d68a', from: 'laugh',
    note: '拉夫德鲁的那一块石头上插着它。拔出来的时候，天正好亮。',
  },
  {
    id: 'yoru', name: '黑刀夜', grade: '无上大快刀十二工', gradeKey: 'supreme',
    power: 0.038, color: '#2b2b30', from: 'auction', price: 18_000_000,
    note: '十字形，比人还高。拍卖行说它「只是装饰品」。',
  },
];

export const BLADE_SLOTS = 3;

export function bladeById(id) {
  return BLADES.find((b) => b.id === id) ?? null;
}

/** 这一篇的 BOSS 会掉哪把。通常只有一把，返回数组是为了以后能加。 */
export function bladesForArc(arcId) {
  return BLADES.filter((b) => b.from === arcId);
}

/** 三档的展示顺序和一句话说明。 */
export const BLADE_GRADES = [
  { key: 'supreme', label: '无上大快刀十二工', short: '无上', note: '世上只有十二把。' },
  { key: 'great', label: '大快刀二十一工', short: '大快刀', note: '名刀里的名刀。' },
  { key: 'good', label: '良快刀五十工', short: '良快刀', note: '好刀，但还排不上号。' },
];

// ── 恶魔果实 ────────────────────────────────────────────────────────────

/**
 * 一颗只能吃一颗。吃了会怕海水：被俘概率上涨。
 * power 同样按基础战力的百分比算。
 *
 * effect 只有六种，因为它们各自连着一条真的会生效的规则（见 collect.js）：
 *  rubber 挨打船体损伤 -20% / flower 贝利 +30% / flame 决着 +8%
 *  op 每章回 12 船体 / quake 疲劳 +40% / dark 赏金 +15% 但被俘 ×1.6
 * 新加的果实都挂在这六种上——不再加新规则，面板说得到就做得到。
 */
export const FRUITS = [
  {
    id: 'gomu', name: '橡胶果实', color: '#b5453a', power: 0.04, weight: 3,
    effect: 'rubber', tag: '钝击免疫',
    note: '身体能拉长，打不坏，也怕刀。',
    upside: '挨打时船体损伤 -20%',
  },
  {
    id: 'bari', name: '屏障果实', color: '#6f8f5a', power: 0.035, weight: 2,
    effect: 'rubber', tag: '绝对防御',
    note: '手指一交叉，前面就多一堵看不见的墙。',
    upside: '挨打时船体损伤 -20%',
  },
  {
    id: 'hie', name: '冰冻果实', color: '#5f9fc0', power: 0.055, weight: 1,
    effect: 'rubber', tag: '冰甲',
    note: '把海水冻成路，把伤口冻上。冷得连自己都迟钝。',
    upside: '挨打时船体损伤 -20%',
  },
  {
    id: 'hana', name: '花花果实', color: '#c96b9a', power: 0.03, weight: 3,
    effect: 'flower', tag: '分身',
    note: '在身上开花，眼睛可以长在别人的墙上。',
    upside: '交涉与探索拿到的贝利 +30%',
  },
  {
    id: 'suna', name: '沙沙果实', color: '#c8a25c', power: 0.04, weight: 2,
    effect: 'flower', tag: '干枯',
    note: '碰到的东西都会干掉。包括人。',
    upside: '交涉与探索拿到的贝利 +30%',
  },
  {
    id: 'ito', name: '线线果实', color: '#a8a2b8', power: 0.045, weight: 2,
    effect: 'flower', tag: '操线',
    note: '看不见的线拴在人身上，他们就跟着走。',
    upside: '交涉与探索拿到的贝利 +30%',
  },
  {
    id: 'mera', name: '烧烧果实', color: '#d8622a', power: 0.06, weight: 2,
    effect: 'flame', tag: '火',
    note: '身体变成火。海水照旧不认人。',
    upside: 'BOSS 战「决着」回合 +8%',
  },
  {
    id: 'magu', name: '岩浆果实', color: '#b3401f', power: 0.07, weight: 1,
    effect: 'flame', tag: '熔岩',
    note: '连火都能烧掉的火。',
    upside: 'BOSS 战「决着」回合 +8%',
  },
  {
    id: 'pika', name: '闪闪果实', color: '#e6c451', power: 0.055, weight: 1,
    effect: 'flame', tag: '光',
    note: '变成光，脚踩在地上像踩在镜子上。',
    upside: 'BOSS 战「决着」回合 +8%',
  },
  {
    id: 'ope', name: '手术果实', color: '#4f8fa8', power: 0.03, weight: 2,
    effect: 'op', tag: '领域',
    note: '在自己的圈子里，可以切开任何东西。',
    upside: '每打完一章自动回 12 点船体',
  },
  {
    id: 'yomi', name: '黄泉果实', color: '#6b6a86', power: 0.035, weight: 1,
    effect: 'op', tag: '再生',
    note: '死过一次的人才知道它怎么用。',
    upside: '每打完一章自动回 12 点船体',
  },
  {
    id: 'chiyu', name: '治愈果实', color: '#7fae8a', power: 0.025, weight: 2,
    effect: 'op', tag: '治疗',
    note: '眼泪能治伤，代价是自己的寿命。',
    upside: '每打完一章自动回 12 点船体',
  },
  {
    id: 'gura', name: '震震果实', color: '#cfc3a5', power: 0.08, weight: 1,
    effect: 'quake', tag: '震',
    note: '一拳能让海面立起来。用的人也会被震到。',
    upside: '战力 +8%，但疲劳增长 +40%',
  },
  {
    id: 'zushi', name: '重重果实', color: '#8f7fa8', power: 0.05, weight: 2,
    effect: 'quake', tag: '重力',
    note: '碰一下，那东西就变得比船还重。',
    upside: '战力 +5%，但疲劳增长 +40%',
  },
  {
    id: 'baku', name: '爆爆果实', color: '#c46a3f', power: 0.06, weight: 1,
    effect: 'quake', tag: '爆破',
    note: '碰到的东西都能变成炸弹，包括自己。',
    upside: '战力 +6%，但疲劳增长 +40%',
  },
  {
    id: 'yami', name: '暗暗果实', color: '#3f3b52', power: 0.05, weight: 1,
    effect: 'dark', tag: '引力',
    note: '能把东西吸进去，包括光。代价是疼。',
    upside: '赏金 +15%，但被俘概率 ×1.6',
  },
  {
    id: 'kage', name: '影影果实', color: '#4a4458', power: 0.045, weight: 2,
    effect: 'dark', tag: '影子',
    note: '剪下来的影子会替你干活，也会替你挨打。',
    upside: '赏金 +15%，但被俘概率 ×1.6',
  },
  {
    id: 'doa', name: '门门果实', color: '#5b6a7a', power: 0.04, weight: 2,
    effect: 'dark', tag: '开门',
    note: '空气里开一扇门，走过去是另一个地方。',
    upside: '赏金 +15%，但被俘概率 ×1.6',
  },
];

export const FRUIT_BY_ID = Object.fromEntries(FRUITS.map((f) => [f.id, f]));

export function fruitById(id) {
  return FRUIT_BY_ID[id] ?? null;
}

// ── 霸气 ────────────────────────────────────────────────────────────────

export const HAKI = [
  {
    id: 'kenbun', name: '见闻色', color: '#7fa8c9', max: 5, unlockAt: 45,
    note: '能听见别人下一步要做什么。',
    per: '每级被俘概率 -6%',
  },
  {
    id: 'busou', name: '武装色', color: '#5a5f6a', max: 5, unlockAt: 68,
    note: '把气缠在身上，能打到不该能打到的东西。',
    per: '每级战力 +1.2%',
  },
  {
    id: 'haoshoku', name: '霸王色', color: '#b8453f', max: 5, unlockAt: 77,
    note: '天生的。站着不动，弱的人自己会倒。',
    per: '每级赏金 +2%，BOSS 战 +3%',
  },
];

export const HAKI_BY_ID = Object.fromEntries(HAKI.map((h) => [h.id, h]));

/** 升到 level 级要多少修行点。 */
export function hakiCost(level) {
  return Math.max(1, level) * 2;
}

// ── 材料 ────────────────────────────────────────────────────────────────

export const MATERIALS = [
  { id: 'wood', name: '木材', color: '#a9743f', note: '好木头都长在不好砍的地方。' },
  { id: 'iron', name: '铁材', color: '#7d8794', note: '从沉船和军舰上拆下来的。' },
  { id: 'rare', name: '稀有材料', color: '#b98f24', note: '宝树亚当的枝、海楼石碎块，都算。' },
];

export const MATERIAL_BY_ID = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

export function emptyMaterials() {
  return { wood: 0, iron: 0, rare: 0 };
}
