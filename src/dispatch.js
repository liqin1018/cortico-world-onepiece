/**
 * 派遣：把一个人放上岸去办一件事，三章之后回来，带点东西。纯数据。
 *
 * 为什么按「章」而不是按分钟：这个玩法的时间尺度就是章节。
 * 用分钟的话，挂着自动冒险的人和手动点的人体验完全不一样；
 * 用章节，谁都得先推三章，代价和回报是一起到的。
 * （第七章那种「只剩自由航海」的阶段还有一条按天数的保底，见 tickDispatch。）
 *
 * 代价写清楚：人被派走的这几章，他的战力、被动、羁绊**全部不算**。
 * 所以派遣永远是一个「现在缺什么」的选择，而不是白拿。
 */
export const DISPATCH_CHAPTERS = 3;
/** 同时最多派两个人：再多，船上就没人了。 */
export const DISPATCH_MAX = 2;
/** 船上至少留几个人。 */
export const DISPATCH_KEEP = 3;

export const DISPATCH_TASKS = [
  {
    role: 'sword', label: '上岸砍木头',
    reward: { wood: 7, iron: 1 },
    note: '他砍树跟砍人一样利索，回来时浑身是木屑。',
  },
  {
    role: 'sniper', label: '去拆一艘废船',
    reward: { wood: 4, iron: 5 },
    note: '他说那船「还有救」，然后把能拆的都拆了。',
  },
  {
    role: 'cook', label: '去镇上采购',
    reward: { berries: 4_000_000, fatigue: -25 },
    note: '带回来三箱食材和一张比预计短很多的账单。',
  },
  {
    role: 'navigator', label: '去画海图',
    reward: { berries: 6_000_000, rare: 1 },
    note: '她把这一带的风和暗礁都记下来了，顺手卖了一份。',
  },
  {
    role: 'doctor', label: '去采药',
    reward: { hull: 30, wood: 2 },
    note: '背回来一筐草，还有几块能补船板的木头。',
  },
  {
    role: 'archaeologist', label: '去拓碑',
    reward: { rare: 3, training: 1 },
    note: '她在废墟里待了三天，回来时手上全是石灰。',
  },
  {
    role: 'shipwright', label: '去船坞打零工',
    reward: { wood: 5, iron: 5, hull: 20 },
    note: '修别人的船，顺便把剩下的好料带回来了。',
  },
  {
    role: 'musician', label: '去酒馆唱两天',
    reward: { berries: 3_000_000, training: 2 },
    note: '听众哭了一片，钱罐子也满了。',
  },
  {
    role: 'helmsman', label: '去护送商船',
    reward: { berries: 8_000_000, iron: 3 },
    note: '一趟护航，商队给的钱比说好的多。',
  },
  {
    role: 'warrior', label: '去比武',
    reward: { iron: 8, rare: 1 },
    note: '赢了一整条街的人，赌注里有两块好铁。',
  },
];

export function taskOfRole(role) {
  return DISPATCH_TASKS.find((t) => t.role === role) ?? null;
}

/** 贝利那部分随进度放大，材料保持整数——不然到后期「跑一趟」等于没跑。 */
export function dispatchReward(task, done = 0) {
  const k = 1 + done / 40;
  const out = {};
  for (const [id, n] of Object.entries(task?.reward ?? {})) {
    out[id] = id === 'berries' ? Math.round((n * k) / 1e5) * 1e5 : n;
  }
  return out;
}

// ── 派遣的存档操作（只改 state，不 import 任何东西） ────────────────────

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * 什么时候回来：推满 DISPATCH_CHAPTERS 章，**或者**过了 8 天。
 * 后一条是给「卡住了只能自由航海」的人留的门——不然人被派出去就永远回不来。
 */
export function dueAt(state) {
  return {
    until: (state.campaign?.done ?? 0) + DISPATCH_CHAPTERS,
    untilDay: (state.day ?? 1) + 8,
  };
}

export function returnedOf(state) {
  const done = state.campaign?.done ?? 0;
  const day = state.day ?? 1;
  return (state.dispatch ?? []).filter((d) => done >= d.until || day >= d.untilDay);
}

/** 回来的时候把东西发下去，并把 awayUntil 清掉。 */
export function collectDispatch(state, entry) {
  const task = taskOfRole(entry.role);
  const reward = dispatchReward(task, state.campaign?.done ?? 0);
  const got = [];
  for (const [id, n] of Object.entries(reward)) {
    if (!n) continue;
    if (id === 'berries') {
      state.captain.berries = Math.max(0, (state.captain.berries ?? 0) + n);
      got.push(`贝利 +${Math.round(n / 1e4)} 万`);
    } else if (id === 'training') {
      state.training = (state.training ?? 0) + n;
      got.push(`修行点 +${n}`);
    } else if (id === 'hull') {
      state.captain.hull = clamp((state.captain.hull ?? 0) + n, 0, 100);
      got.push(`船体 +${n}`);
    } else if (id === 'fatigue') {
      for (const m of state.crew ?? []) m.fatigue = clamp((m.fatigue ?? 0) + n, 0, 100);
      got.push('全员缓了一口气');
    } else {
      state.materials = state.materials ?? {};
      state.materials[id] = (state.materials[id] ?? 0) + n;
      got.push(`${id === 'wood' ? '木材' : id === 'iron' ? '铁材' : '稀有材料'} ×${n}`);
    }
  }
  const member = (state.crew ?? []).find((m) => m.id === entry.crewId);
  if (member) {
    delete member.awayUntil;
    member.fatigue = clamp((member.fatigue ?? 0) - 15, 0, 100);
  }
  state.dispatch = (state.dispatch ?? []).filter((d) => d.crewId !== entry.crewId);
  return { task, got, crewId: entry.crewId };
}

/** 每次推进之后调一次：该回来的都回来。 */
export function tickDispatch(state) {
  const out = [];
  for (const entry of returnedOf(state)) out.push(collectDispatch(state, entry));
  return out;
}

export function rewardText(reward) {
  const label = {
    berries: '贝利', wood: '木材', iron: '铁材', rare: '稀有材料',
    training: '修行点', hull: '船体', fatigue: '疲劳',
  };
  return Object.entries(reward ?? {})
    .filter(([, n]) => n)
    .map(([id, n]) => (id === 'hull' || id === 'fatigue'
      ? `${label[id]} ${n > 0 ? '+' : ''}${n}`
      : id === 'berries' ? `贝利 +${Math.round(n / 1e4)} 万` : `${label[id] ?? id} ×${n}`))
    .join(' · ');
}
