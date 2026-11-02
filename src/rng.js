/**
 * 确定性随机。
 *
 * 同一天、同一天数、同一块海域，抽出来的三条航线必须一样——
 * 不然你刷新一下面板，昨天的航线就变了，日志对不上。
 */

export function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const between = (rng, lo, hi) => lo + (hi - lo) * rng();

export const intBetween = (rng, lo, hi) => Math.floor(between(rng, lo, hi + 1 - 1e-9));

export const pick = (rng, list) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/** 洗一副牌，不重复地取前 n 个。 */
export function sample(rng, list, n) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
