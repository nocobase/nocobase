import { chatIsRunning } from '../chat.js';
import type { ConversationSummary } from '../../shared/conversations.js';

/** The conversation list's groups, in order: what waits for the viewer, what an agent is working on, the rest. */
export type HistoryGroup = 'waiting' | 'running' | 'recent';

export const HISTORY_GROUPS: readonly HistoryGroup[] = [
  'waiting',
  'running',
  'recent',
];

/** A conversation's group: one that needs its owner (`needsYou`) first, then one with a run in progress, then recent. */
export function historyGroup(item: ConversationSummary): HistoryGroup {
  if (item.needsYou) return 'waiting';
  if (chatIsRunning(item)) return 'running';
  return 'recent';
}
