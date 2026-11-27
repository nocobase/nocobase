import type { ModelMessage } from 'ai';

/**
 * The model input of a turn with only the latest `turns` earlier turns of the conversation, besides the current one.
 * A turn starts at a person's message and holds everything after it until the next one: the answer, its tool calls
 * and their results, so a call and its result are always kept or dropped together. Without a limit, or with no more
 * turns than it allows, the history is unchanged.
 */
export function keepRecentTurns(
  history: ModelMessage[],
  turns: number | undefined,
): ModelMessage[] {
  if (turns === undefined) return history;
  const starts: number[] = [];
  history.forEach((message, index) => {
    if (message.role === 'user') starts.push(index);
  });
  // The current turn is the last one; `turns` earlier ones stay before it.
  if (starts.length <= turns + 1) return history;
  const from = starts[starts.length - 1 - turns];
  // Instructions placed before the first turn (system messages) stay; only earlier turns are dropped.
  const leading = history
    .slice(0, starts[0])
    .filter((message) => message.role === 'system');
  return [...leading, ...history.slice(from)];
}
