/**
 * 今天吹什么风。
 *
 * 一天一个，按「存档种子 + 现实日期」算出来——同一天里读档、重开面板都是同一个，
 * 不会变成刷新就能重摇的骰子。
 *
 * 只影响自由航海：带回多少钱、船体掉多少、这一趟多长、路上多险。
 * **主线章节一点不受影响**——剧情是剧情，不该因为今天有雾就打不过 BOSS。
 *
 * 平均算下来略偏正面（各档收益均值约 +3%），是给「今天回来看看」一个由头，
 * 不是惩罚。顺风天适合刷航线，无风天适合推剧情，这就是它全部的用处。
 */
import { hashString } from './rng.js';

export const WEATHERS = [
  {
    id: 'calm', name: '风平浪静', icon: 'calm',
    note: '海面平得像一块摊开的布，帆偶尔才动一下。',
    berry: 1, damage: 1, sail: 1, risk: 0,
  },
  {
    id: 'fair', name: '顺风', icon: 'fair',
    note: '帆鼓得满满的，船自己就往前跑。',
    berry: 1.25, damage: 1, sail: 0.75, risk: 0,
  },
  {
    id: 'fog', name: '浓雾', icon: 'fog',
    note: '看不见三丈以外的东西，全靠耳朵和运气。',
    berry: 0.9, damage: 1.1, sail: 1.15, risk: 1,
  },
  {
    id: 'squall', name: '涌浪', icon: 'squall',
    note: '浪一个接一个砸在船首，甲板上站不稳。',
    berry: 1.15, damage: 1.3, sail: 1.1, risk: 1,
  },
  {
    id: 'dead', name: '无风', icon: 'dead',
    note: '帆垂下来，海面一点声音都没有。',
    berry: 0.85, damage: 1, sail: 1.4, risk: 0,
  },
];

const BY_ID = new Map(WEATHERS.map((w) => [w.id, w]));

/** 同一天、同一个种子 → 同一个天气。改日期才会变。 */
export function weatherOf(seed, dayKey) {
  const n = hashString(`${seed ?? 0}:weather:${dayKey ?? ''}`) >>> 0;
  return WEATHERS[n % WEATHERS.length];
}

export function weatherById(id) {
  return BY_ID.get(String(id)) ?? WEATHERS[0];
}

/** 给面板和状态行用的一句话。整句都很短，别在这里写散文。 */
export function weatherLine(w) {
  if (!w) return '';
  return `今天${w.name}`;
}
