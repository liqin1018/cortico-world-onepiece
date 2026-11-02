/**
 * 四个工具，不多了。
 *
 * 每个工具声明都会常驻上下文，多一个就多一份每轮的钱。
 * 所以这里只留：看一眼、出一条船、在港口办一件事、翻一次旧账。
 *
 * sea_do 是 v0.11 加的：之前修船、改装、买刀、吃果实、练霸气、派人上岸
 * 只有面板能点，她伸不到手。这四件事合在一个工具里，用一个 enum 分，
 * 比开四个工具省将近 400 token/轮。
 */
export const TOOL_SPECS = [
  {
    name: 'sea_status',
    description: '看现在在哪一篇哪一章、下一章是什么、等级与战力、自动冒险开没开，以及今天的自由航海航线。想推进剧情、或者被问到「到哪了」时先看这个。',
    tags: ['read'],
    parameters: { type: 'object', additionalProperties: false, properties: {} },
  },
  {
    name: 'sea_sail',
    description: '往前走一步。不填参数＝打下一章剧情，立刻出结果（BOSS 是三回合）；route 填 1–3 是自由航海（练级、刷钱，要等一会儿回来）；auto 填 on/off 让她自己挂机或收手；choice 填 1–3 是岔路口的选择。',
    tags: ['write'],
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        route: {
          type: 'integer',
          minimum: 1,
          maximum: 3,
          description: '自由航海的航线编号，1 到 3；不填就是推剧情。',
        },
        auto: {
          type: 'string',
          enum: ['on', 'off'],
          description: 'on 让她自己按节奏走，off 让她先停下来。',
        },
        choice: {
          type: 'integer',
          minimum: 1,
          maximum: 3,
          description: '名场面或 BOSS 战之前的选择，填 1–3。不确定选项是什么就先看 sea_status。',
        },
      },
    },
  },
  {
    name: 'sea_do',
    description: '在港口办一件事：repair 修船、rest 歇一晚、upgrade 改装船、blade 买刀、fruit 吃果实、haki 练霸气、dispatch 派人上岸。不用指定哪件，会自动挑最划算的；钱或材料不够会说差多少。主人没授权的会被回绝，照实转述。',
    tags: ['write'],
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: {
          type: 'string',
          enum: ['repair', 'rest', 'upgrade', 'blade', 'fruit', 'haki', 'dispatch'],
          description: '要办的事，见工具说明。',
        },
      },
    },
  },
  {
    name: 'sea_chronicle',
    description: '翻最近的航海日志：过了哪几章、结果如何，还有现在那张悬赏令和名次。想回忆上次干了什么、或者要跟人吹牛时用。',
    tags: ['read'],
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          description: '看最近几条，默认 5。',
        },
      },
    },
  },
];

/** 给 describe.json 和市场卡片看的一句话。运行时用不到。 */
export const TOOL_SUMMARIES = {
  sea_status: {
    zh: '看篇章进度、下一章、等级战力和自动冒险状态。',
    en: 'Reads the story progress, next chapter, level and auto state.',
  },
  sea_sail: {
    zh: '推一章剧情、跑一趟自由航海，或开关自动冒险。',
    en: 'Clears a story chapter, takes a free voyage, or toggles auto.',
  },
  sea_do: {
    zh: '在港口修船、改装、买刀、吃果实、练霸气或派人上岸。',
    en: 'Repairs, upgrades, shops, eats a fruit, trains haki, or sends a crew member ashore.',
  },
  sea_chronicle: {
    zh: '翻最近的航海日志和当前的悬赏令。',
    en: 'Reads recent log entries and the current wanted poster.',
  },
};

export const EVENT_DESCRIPTIONS = [
  {
    type: 'onepiece.voyage',
    description: {
      zh: '一趟航行结束时的回执：去了哪、结果如何、赏金和船体变成多少。她据此用自己的口气讲这一段。',
      en: 'A receipt when a voyage ends: where she went, how it went, and the new bounty and hull.',
    },
  },
  {
    type: 'onepiece.milestone',
    description: {
      zh: '赏金跨过一个大关（1 亿、3 亿……）时换的新悬赏令，附新的称号。',
      en: 'A new wanted poster when the bounty crosses a major mark, with a new title.',
    },
  },
];
