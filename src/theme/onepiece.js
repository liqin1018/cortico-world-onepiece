/**
 * 主题：海贼王大冒险。
 *
 * 所有专有名词都集中在这一个文件里——岛名、货币、机构名、称号、悬赏令用语。
 * 想换成原创皮，只改 `worlds.onepiece.theme` 到 `original`，或者照这个形状再写一份。
 * 规则、结算、面板、存档都不认识这些词，只认识 `theme.*`。
 */
export const onepiece = {
  id: 'onepiece',
  label: '海贼王大冒险',
  sea: '伟大航路',
  pirate: '海贼',
  navy: '世界政府',
  navyForce: '海军',
  navyOffice: '世界政府 · 海军本部',
  currency: '贝利',
  // 起手是 0：悬赏令上第一次印你的脸，是打完阿龙之后的事。
  startBounty: 0,
  startBerries: 800_000,

  islands: [
    { id: 'windmill', name: '风车村', region: '东海', note: '风车转得很慢，酒馆里没人查你的来历' },
    { id: 'orange', name: '橘子镇', region: '东海', note: '满坡的橘子，港口只有两条栈桥' },
    { id: 'loguetown', name: '罗格镇', region: '东海', note: '处刑台还立着，海贼都来这里看一眼' },
    { id: 'reverse', name: '颠倒山', region: '伟大航路', note: '运河从山顶倒着流，灯塔上有人打盹' },
    { id: 'whisky', name: '威士忌山', region: '伟大航路', note: '欢迎旅人的小镇，欢迎得有点过头' },
    { id: 'littlegarden', name: '小花园', region: '伟大航路', note: '巨兽踩出来的空地，草比人高' },
    { id: 'drum', name: '鼓磁岛', region: '伟大航路', note: '雪封的城堡，医生比士兵多' },
    { id: 'alabasta', name: '阿拉巴斯坦', region: '伟大航路', note: '沙子会吃掉脚印，王都夜里才凉' },
    { id: 'skypiea', name: '空岛', region: '伟大航路', note: '云上面还有一层土，遗迹没人认领' },
    { id: 'longring', name: '长环岛', region: '伟大航路', note: '潮水一天涨落三次，长堤被泡得发白' },
    { id: 'water7', name: '水之七都', region: '伟大航路', note: '造船之城，运河上漂着木屑' },
    { id: 'enies', name: '司法岛', region: '伟大航路', note: '永不天黑的法庭，门外就是深渊' },
    { id: 'thriller', name: '恐怖三桅船', region: '魔鬼三角', note: '雾里有艘比岛还大的船' },
    { id: 'sabaody', name: '香波地群岛', region: '红土大陆', note: '泡泡树底下什么都能买卖' },
    { id: 'fishman', name: '鱼人岛', region: '深海一万米', note: '光从水面上漏下来，像下不完的雨' },
    { id: 'dressrosa', name: '德雷斯罗萨', region: '新世界', note: '玩具在街上走，斗技场天天开' },
    { id: 'zou', name: '佐乌', region: '新世界', note: '整座岛在一头巨象背上，走路会晃' },
    { id: 'cakesland', name: '蛋糕岛', region: '新世界', note: '房子是甜的，规矩是硬的' },
    { id: 'wano', name: '和之国', region: '新世界', note: '刀比人多，花都比刀安静' },
  ],

  kinds: [
    {
      id: 'raid', label: '商路袭击', act: '抢了一支商船队', crime: '劫掠商船',
      desc: '蹲一条商路，等落单的船队', riskBias: 3,
    },
    {
      id: 'ruin', label: '遗迹探宝', act: '摸进了一座没人画进海图的遗迹', crime: '盗掘遗迹',
      desc: '钻进没人认领的洞，值钱的东西通常在最里面', riskBias: 2,
    },
    {
      id: 'navy', label: '海军巡逻区', act: '从军舰眼皮底下穿了过去', crime: '袭击海军',
      desc: '最近的海军航线，快，但要赌他们今天走哪条', riskBias: 5,
    },
    {
      id: 'righteous', label: '义贼行动', act: '替一岛的人出了头', crime: '煽动叛乱',
      desc: '有人的岛被欺负了，去不去由你', riskBias: 2,
    },
    {
      id: 'beast', label: '海兽讨伐', act: '把一头堵航道的大家伙赶走了', crime: '危害航道',
      desc: '海里的东西比军舰难讲道理', riskBias: 4,
    },
  ],

  titles: [
    { at: 0, label: '无名新人' },
    { at: 50_000_000, label: '超新星' },
    { at: 150_000_000, label: '问题海贼' },
    { at: 400_000_000, label: '大海贼' },
    { at: 800_000_000, label: '海上皇帝候补' },
    { at: 1_500_000_000, label: '传说' },
  ],

  epithets: [
    '独眼', '铁钩', '白鲸', '灰狼', '红帆', '断齿', '雾中', '黑火药',
    '三刀', '巨浪', '铜臂', '夜莺', '沙暴', '双枪', '老船长', '珊瑚',
    '冰海', '火酒', '铁锚', '无名',
  ],

  names: [
    '罗伊', '卡门', '奥尔加', '巴特', '伊莎', '杰克', '安妮', '多姆',
    '莲', '哈根', '赛斯', '莉拉', '阿吉', '贝拉', '莫尔', '尤娜',
    '斯温', '罗恩', '古斯', '卡洛',
  ],

  /**
   * 榜上的对手，按原作赏金。
   *
   * 有 roster 的主题，赏金不漂移——这些人本来就值这么多，会动的只有玩家。
   * 数据截至和之国 / 蛋头岛篇；新篇章再涨，改这里就行。
   */
  roster: [
    { name: '哥尔·D·罗杰', epithet: '海贼王', bounty: 5_564_800_000 },
    { name: '爱德华·纽盖特', epithet: '白胡子', bounty: 5_046_000_000 },
    { name: '凯多', epithet: '百兽', bounty: 4_611_100_000 },
    { name: '夏洛特·玲玲', epithet: '大妈', bounty: 4_388_000_000 },
    { name: '香克斯', epithet: '红发', bounty: 4_048_900_000 },
    { name: '马歇尔·D·蒂奇', epithet: '黑胡子', bounty: 3_996_000_000 },
    { name: '乔拉可尔·米霍克', epithet: '鹰眼', bounty: 3_590_000_000 },
    { name: '巴基', epithet: '千两小丑', bounty: 3_189_000_000 },
    { name: '蒙奇·D·路飞', epithet: '草帽', bounty: 3_000_000_000 },
    { name: '特拉法尔加·罗', epithet: '死亡外科医生', bounty: 3_000_000_000 },
    { name: '尤斯塔斯·基德', epithet: '船长', bounty: 3_000_000_000 },
    { name: '洛基', epithet: '诅咒的王子', bounty: 2_600_000_000 },
    { name: '沙·克洛克达尔', epithet: '沙鳄鱼', bounty: 1_965_000_000 },
    { name: '波雅·汉库克', epithet: '海贼女帝', bounty: 1_659_000_000 },
    { name: '烬', epithet: '炎灾', bounty: 1_390_000_000 },
    { name: '马尔科', epithet: '不死鸟', bounty: 1_374_000_000 },
    { name: '奎因', epithet: '疫灾', bounty: 1_320_000_000 },
    { name: '罗罗诺亚·索隆', epithet: '海贼猎人', bounty: 1_111_000_000 },
    { name: '甚平', epithet: '海侠', bounty: 1_100_000_000 },
    { name: '夏洛特·卡塔库栗', epithet: '千手', bounty: 1_057_000_000 },
    { name: '山治', epithet: '黑足', bounty: 1_032_000_000 },
    { name: '杰克', epithet: '旱灾', bounty: 1_000_000_000 },
    { name: '夏洛特·斯慕吉', epithet: '果汁', bounty: 932_000_000 },
    { name: '妮可·罗宾', epithet: '恶魔之子', bounty: 930_000_000 },
    { name: '夏洛特·克力架', epithet: '饼干', bounty: 860_000_000 },
    { name: '夏洛特·佩罗斯佩罗', epithet: '糖果', bounty: 700_000_000 },
    { name: '萨博', epithet: '炎帝', bounty: 602_000_000 },
    { name: '夏洛特·斯纳格', epithet: '甜点将星', bounty: 600_000_000 },
    { name: '波特卡斯·D·艾斯', epithet: '火拳', bounty: 550_000_000 },
    { name: '福兹·弗', epithet: '面具', bounty: 546_000_000 },
    { name: '青椒', epithet: '锥之青椒', bounty: 542_000_000 },
    { name: '乌索普', epithet: '神', bounty: 500_000_000 },
    { name: '黑玛丽亚', epithet: '蜘蛛', bounty: 480_000_000 },
    { name: '爱德华·威布尔', epithet: '白胡子二世', bounty: 480_000_000 },
    { name: '佐佐木', epithet: '装甲', bounty: 472_000_000 },
    { name: '乌尔缇', epithet: '头槌', bounty: 400_000_000 },
    { name: '弗兰奇', epithet: '铁人', bounty: 394_000_000 },
    { name: '布鲁克', epithet: '灵魂之王', bounty: 383_000_000 },
    { name: '佩德罗', epithet: '树', bounty: 382_000_000 },
    { name: '娜美', epithet: '小贼猫', bounty: 366_000_000 },
    { name: '卡彭·贝基', epithet: '匪帮', bounty: 350_000_000 },
    { name: '斯克拉奇曼·阿普', epithet: '海鸣', bounty: 350_000_000 },
    { name: '多弗朗明哥', epithet: '天夜叉', bounty: 340_000_000 },
    { name: '卡文迪许', epithet: '白马', bounty: 330_000_000 },
    { name: '巴兹尔·霍金斯', epithet: '魔术师', bounty: 320_000_000 },
    { name: '乔艾莉·波妮', epithet: '大胃女', bounty: 320_000_000 },
    { name: '莫利亚', epithet: '月光', bounty: 320_000_000 },
    { name: '凯撒·库朗', epithet: '主谋', bounty: 300_000_000 },
    { name: '巴索罗米·熊', epithet: '暴君', bounty: 296_000_000 },
    { name: '佩吉万', epithet: '棘背', bounty: 290_000_000 },
    { name: 'X·德雷克', epithet: '赤旗', bounty: 222_000_000 },
    { name: '巴托洛米奥', epithet: '食人鬼', bounty: 200_000_000 },
    { name: '基拉', epithet: '杀戮武人', bounty: 200_000_000 },
    { name: '贝拉米', epithet: '鬣狗', bounty: 195_000_000 },
    { name: '乌尔基', epithet: '怪僧', bounty: 108_000_000 },
    { name: '阿龙', epithet: '锯齿', bounty: 20_000_000 },
    { name: '克里克', epithet: '提督', bounty: 17_000_000 },
    { name: '克洛', epithet: '百计', bounty: 16_000_000 },
    { name: '亚尔丽塔', epithet: '铁棒', bounty: 5_000_000 },
    { name: '托尼托尼·乔巴', epithet: '宠物', bounty: 1_000 },
  ],

  poster: {
    office: '世界政府 · 海军本部',
    seal: '懸賞',
    footer: '死活不论',
    lead: '不论生死，一律照付',
  },

  scenes: {
    great: [
      '「{island}」这趟闹大了：你{act}，连{navy}的增援船都晚到一步。',
      '你{act}，还是在「{island}」最热闹的时候。消息传得比船快。',
    ],
    success: [
      '「{island}」这一趟没白跑：你{act}，货和名声都带回来了。',
      '你{act}，收工时天刚黑，船上没人少。',
    ],
    narrow: [
      '差点没回来。你在「{island}」{act}，人是齐的，货丢了一半。',
      '「{island}」这趟不顺：你{act}，脱身的时候船尾挨了一下。',
    ],
    failed: [
      '「{island}」栽了：你本来要{act}，结果被人提前盯上。',
      '你{act}没成，反倒把{navy}引来了，船挨了几炮才脱身。',
    ],
    captured: [
      '{navy}在「{island}」设了套。你{act}到一半，被按在甲板上铐走了。',
      '你在「{island}」{act}，退路被人堵死，{navy}把你拎上了押送船。',
    ],
  },
};
