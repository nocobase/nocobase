/**
 * The queue as lanes, one per agent, kept apart from the components so a consumer can test it: what each agent runs
 * now, what it takes next in claim order, what waits for a person, and what it is assigned with nothing going on.
 */
import { fill, type AgentQueueLabels } from './labels.js';
import type {
  AgentQueueAgent,
  AgentQueueData,
  AgentQueueEntry,
  AgentQueueIssue,
  AgentQueueWait,
  AgentQueueWaitView,
} from './types.js';

/** One issue in a lane: where that agent stands on it. */
export interface AgentQueueItem {
  readonly issue: AgentQueueIssue;
  readonly entry: AgentQueueEntry;
  /** The viewer owns, created or follows the issue. */
  readonly mine: boolean;
  /** The agent waits for the viewer on it. */
  readonly forMe: boolean;
}

export interface AgentQueueLane {
  readonly agent: AgentQueueAgent;
  readonly running: readonly AgentQueueItem[];
  /** Queued, in the order the agent takes them: claim order, then the ones waiting for other issues. */
  readonly next: readonly AgentQueueItem[];
  readonly waiting: readonly AgentQueueItem[];
  readonly idle: readonly AgentQueueItem[];
  readonly mine: number;
  readonly forMe: number;
}

export interface AgentQueueTotals {
  readonly running: number;
  readonly queued: number;
  readonly waitingForMe: number;
}

/**
 * One lane per agent, every agent included. With `onlyMine`, only the issues the viewer owns, created or follows or
 * that wait for them, and only the agents with one. Lanes are ordered by activity: the most running first, then the
 * longest queue, then those waiting for a person, then those merely assigned, then by name.
 */
export function agentQueueLanes(
  data: Pick<AgentQueueData, 'rows' | 'agents'>,
  options: { readonly onlyMine?: boolean } = {},
): AgentQueueLane[] {
  const byAgent = new Map<
    string,
    {
      running: AgentQueueItem[];
      next: AgentQueueItem[];
      waiting: AgentQueueItem[];
      idle: AgentQueueItem[];
    }
  >();
  const of = (agentId: string) => {
    let lane = byAgent.get(agentId);
    if (!lane)
      byAgent.set(
        agentId,
        (lane = { running: [], next: [], waiting: [], idle: [] }),
      );
    return lane;
  };
  for (const row of data.rows)
    for (const entry of [row, ...row.others]) {
      const forMe = entry.waiting?.viewerDecides ?? false;
      if (options.onlyMine && !row.mine && !forMe) continue;
      const item = { issue: row.issue, entry, mine: row.mine, forMe };
      const lane = of(entry.agentId);
      if (entry.state === 'working') lane.running.push(item);
      else if (entry.state === 'queued') lane.next.push(item);
      else if (entry.state === 'waiting') lane.waiting.push(item);
      else lane.idle.push(item);
    }
  const order = (item: AgentQueueItem) =>
    item.entry.queue?.agentPosition ?? Number.POSITIVE_INFINITY;
  const lanes: AgentQueueLane[] = [];
  for (const agent of Object.values(data.agents)) {
    const lane = byAgent.get(agent.id) ?? {
      running: [],
      next: [],
      waiting: [],
      idle: [],
    };
    const all = [...lane.running, ...lane.next, ...lane.waiting, ...lane.idle];
    if (options.onlyMine && all.length === 0) continue;
    lanes.push({
      agent,
      running: lane.running,
      next: [...lane.next].sort((a, b) => order(a) - order(b)),
      waiting: [...lane.waiting].sort(
        (a, b) => Number(b.forMe) - Number(a.forMe),
      ),
      idle: lane.idle,
      mine: all.filter((item) => item.mine).length,
      forMe: all.filter((item) => item.forMe).length,
    });
  }
  return lanes.sort(
    (a, b) =>
      b.running.length - a.running.length ||
      b.next.length - a.next.length ||
      b.waiting.length - a.waiting.length ||
      b.idle.length - a.idle.length ||
      Number(a.agent.archived) - Number(b.agent.archived) ||
      a.agent.name.localeCompare(b.agent.name),
  );
}

export function agentQueueTotals(
  lanes: readonly AgentQueueLane[],
): AgentQueueTotals {
  return {
    running: lanes.reduce((sum, lane) => sum + lane.running.length, 0),
    queued: lanes.reduce((sum, lane) => sum + lane.next.length, 0),
    waitingForMe: lanes.reduce((sum, lane) => sum + lane.forMe, 0),
  };
}

/** The state a lane's header shows: its most active one. */
export function laneState(
  lane: AgentQueueLane,
): 'working' | 'queued' | 'waiting' | 'idle' {
  if (lane.running.length > 0) return 'working';
  if (lane.next.length > 0) return 'queued';
  if (lane.waiting.length > 0) return 'waiting';
  return 'idle';
}

/**
 * How long since `at`, compact and localized: `m:ss` under an hour ("4:07"), then hours and minutes ("2 hr 5 min"),
 * then days and hours.
 */
export function elapsed(
  at: string,
  locale: string | undefined,
  now: number,
): string {
  const total = Math.max(0, Math.floor((now - Date.parse(at)) / 1000));
  const unit = (value: number, name: 'minute' | 'hour' | 'day') =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: name,
      unitDisplay: 'short',
    }).format(value);
  if (total < 3600)
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  const minutes = Math.floor(total / 60);
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return minutes % 60
      ? `${unit(hours, 'hour')} ${unit(minutes % 60, 'minute')}`
      : unit(hours, 'hour');
  const days = Math.floor(hours / 24);
  return hours % 24
    ? `${unit(days, 'day')} ${unit(hours % 24, 'hour')}`
    : unit(days, 'day');
}

/** How long ago `at` was, in words ("3 hours ago"): in minutes under an hour, then hours, then days. */
export function ago(
  at: string,
  locale: string | undefined,
  now: number,
): string {
  const minutes = Math.round((Date.parse(at) - now) / 60_000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(minutes) < 60) return format.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(hours, 'hour');
  return format.format(Math.round(hours / 24), 'day');
}

/** Why an idle item is idle, in words; null without a reason. */
export function idleText(
  labels: AgentQueueLabels,
  item: AgentQueueItem,
  locale: string | undefined,
  now: number,
): string | null {
  const idle = item.entry.idle;
  if (!idle) return null;
  if (idle.reason === 'lastRun' && idle.lastRun)
    return fill(labels.idle.lastRun[idle.lastRun.status], {
      time: ago(idle.lastRun.at, locale, now),
    });
  if (idle.reason === 'lastRun') return null;
  return labels.idle[idle.reason];
}

/** Words a wait: the consumer's own (`AgentQueueProps.formatWait`), or the reason code itself. */
export type AgentQueueFormatWait = (
  wait: AgentQueueWait,
  agent: AgentQueueAgent,
) => AgentQueueWaitView;

/**
 * Why a queued item waits, in words: what blocks it, else its wait as `formatWait` words it, else its reason code, which
 * the item never interprets.
 */
export function waitView(
  labels: AgentQueueLabels,
  item: AgentQueueItem,
  agent: AgentQueueAgent,
  formatWait?: AgentQueueFormatWait,
): AgentQueueWaitView | null {
  const { entry } = item;
  if (entry.blockedBy)
    return {
      text:
        entry.blockedBy.length > 0
          ? fill(labels.queue.blockedBy, {
              issues: entry.blockedBy
                .map((blocker) => blocker.identifier)
                .join(', '),
            })
          : fill(labels.queue.blockedCount, {
              count: item.issue.blockedCount,
            }),
    };
  const wait = entry.queue;
  if (!wait) return null;
  return formatWait ? formatWait(wait, agent) : { text: wait.reason };
}

/** Who a waiting item waits for: the viewer as "you", first. */
export function waitingForNames(
  labels: AgentQueueLabels,
  item: AgentQueueItem,
  viewerId: string | null,
): string {
  const people = item.entry.waiting?.waitingFor ?? [];
  const names = people.map((person) =>
    person.userId === viewerId
      ? labels.wait.you
      : (person.name ?? person.userId),
  );
  const mine = people.findIndex((person) => person.userId === viewerId);
  if (mine > 0) names.unshift(...names.splice(mine, 1));
  return names.join(', ');
}

/** What a running item last reported, in words. */
export function activityText(
  labels: AgentQueueLabels,
  item: AgentQueueItem,
): string {
  const run = item.entry.run;
  if (!run || run.id === null) return labels.run.hidden;
  const activity = run.lastActivity;
  if (!activity) return labels.run.noActivity;
  if (activity.type === 'toolUse')
    return (
      fill(labels.run.toolUse, { tool: activity.tool ?? '' }) +
      (activity.text ? ` — ${activity.text}` : '')
    );
  if (activity.type === 'error')
    return fill(labels.run.error, { text: activity.text ?? '' });
  return activity.text ?? activity.type;
}
