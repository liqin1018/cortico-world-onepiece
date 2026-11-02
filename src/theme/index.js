import { onepiece } from './onepiece.js';
import { original } from './original.js';

export const THEMES = { onepiece, original };
export const THEME_IDS = Object.keys(THEMES);

/** 找不到就回默认主题——存档里写着一个已经删掉的主题时，不能让整个扩展起不来。 */
export function themeOf(id) {
  return THEMES[id] ?? onepiece;
}
