/**
 * 主题：无风带（原创皮）。
 *
 * 结构、规则、数值和 `onepiece` 完全一样，只换名词。
 * 打算把扩展公开发布时，把 `worlds.onepiece.theme` 设成 `original`，
 * 或者把默认主题改成它——代码一行不用动。
 */
export const original = {
  id: 'original',
  label: '无风带：悬赏',
  sea: '无风带',
  pirate: '航海者',
  navy: '诸国海军',
  navyForce: '巡防舰',
  navyOffice: '诸国海军 · 悬赏司',
  currency: '银币',
  startBounty: 30_000_000,
  startBerries: 800_000,

  islands: [
    { id: 'white-sail', name: '白帆镇', region: '内海', note: '晒着渔网，酒馆里没人问你来路' },
    { id: 'salt-pier', name: '盐柱港', region: '内海', note: '盐柱从水里长出来，船要绕着走' },
    { id: 'grey-reef', name: '灰礁', region: '内海', note: '暗礁下面沉着好几条船' },
    { id: 'lighthouse', name: '灯塔群岛', region: '外海', note: '七座灯塔，只有三座还亮着' },
    { id: 'iron-tide', name: '铁潮湾', region: '外海', note: '潮水带着铁锈味，船坞日夜不熄火' },
    { id: 'mist-wood', name: '雾森', region: '外海', note: '树比雾还密，进去容易出来难' },
    { id: 'sand-crown', name: '沙冠城', region: '南岸', note: '城墙是沙压出来的，夜里才凉' },
    { id: 'cloud-terrace', name: '云台遗迹', region: '高地', note: '云在台阶下面走，没人认领这块地' },
    { id: 'dockyard', name: '造船坞', region: '中湾', note: '运河上漂着木屑和新船的漆味' },
    { id: 'long-bank', name: '长堤', region: '中湾', note: '潮水一天涨落三次，堤面被泡得发白' },
    { id: 'ship-grave', name: '黑礁船墓', region: '暗流区', note: '雾里有艘比镇子还大的旧船' },
    { id: 'exchange', name: '交易城', region: '中湾', note: '什么都能买卖，包括名字' },
    { id: 'deep-well', name: '深井城', region: '深海', note: '光从水面上漏下来，像下不完的雨' },
    { id: 'elephant-back', name: '象背原野', region: '远海', note: '整块地在一头巨兽背上，走路会晃' },
    { id: 'honey-port', name: '蜜糖港', region: '远海', note: '房子是甜的，规矩是硬的' },
    { id: 'frost-blade', name: '霜刃国', region: '远海', note: '刀比人多，雪比刀安静' },
  ],

  kinds: [
    {
      id: 'raid', label: '商路劫掠', act: '截了一支商船队', crime: '劫掠商船',
      desc: '蹲一条商路，等落单的船队', riskBias: 3,
    },
    {
      id: 'ruin', label: '遗迹探查', act: '摸进了一座没画进海图的遗迹', crime: '私掘遗迹',
      desc: '钻进没人认领的洞，值钱的东西通常在最里面', riskBias: 2,
    },
    {
      id: 'navy', label: '巡逻区穿越', act: '从巡防舰眼皮底下穿了过去', crime: '冲撞巡防',
      desc: '最近的航线，快，但要赌他们今天走哪条', riskBias: 5,
    },
    {
      id: 'righteous', label: '护岛行动', act: '替一岛的人出了头', crime: '聚众抗税',
      desc: '有人被欺负了，去不去由你', riskBias: 2,
    },
    {
      id: 'beast', label: '海兽驱除', act: '把一头堵航道的大家伙赶走了', crime: '扰乱航道',
      desc: '海里的东西比巡防舰难讲道理', riskBias: 4,
    },
  ],

  titles: [
    { at: 0, label: '无名者' },
    { at: 50_000_000, label: '新面孔' },
    { at: 150_000_000, label: '麻烦人物' },
    { at: 400_000_000, label: '大海客' },
    { at: 800_000_000, label: '传奇候补' },
    { at: 1_500_000_000, label: '传说' },
  ],

  epithets: [
    '灰帆', '铁锚', '白鲸', '灰狼', '红索', '断齿', '雾中', '黑火药',
    '三刀', '巨浪', '铜臂', '夜莺', '沙暴', '双枪', '老舵手', '珊瑚',
    '冰海', '火酒', '独眼', '无名',
  ],

  names: [
    '诺亚', '米拉', '奥尔', '巴特', '伊莎', '杰克', '安妮', '多姆',
    '莲', '哈根', '赛斯', '莉拉', '阿吉', '贝拉', '莫尔', '尤娜',
    '斯温', '罗恩', '古斯', '卡洛',
  ],

  poster: {
    office: '诸国海军 · 悬赏司',
    seal: '懸賞',
    footer: '死活不论',
    lead: '不论生死，一律照付',
  },

  scenes: {
    great: [
      '「{island}」这趟闹大了：你{act}，连{navy}的增援都晚到一步。',
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
