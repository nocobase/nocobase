import type { ExecutionSnapshot } from '../../files/types.js';

/**
 * The messages of a turn with only the latest `turns` earlier turns of the conversation, besides the current one. A
 * turn starts at a person's message and holds everything after it until the next one: the answer, its tool calls and
 * their results, so a call and its result are always kept or dropped together. Instructions placed before the first
 * turn (system messages) stay. Without a limit, or with no more turns than it allows, the messages are unchanged.
 */
export function keepRecentTurns<T extends { readonly role: string }>(
  messages: T[],
  turns: number | undefined,
): T[] {
  if (turns === undefined) return messages;
  const starts: number[] = [];
  messages.forEach((message, index) => {
    if (message.role === 'user') starts.push(index);
  });
  // The current turn is the last one; `turns` earlier ones stay before it.
  if (starts.length <= turns + 1) return messages;
  const from = starts[starts.length - 1 - turns];
  const leading = messages
    .slice(0, starts[0])
    .filter((message) => message.role === 'system');
  return [...leading, ...messages.slice(from)];
}

/**
 * The execution snapshot a model call reads, limited to the kept turns before any file is prepared: the replay keeps
 * only those turns, and only their files are read, so a file of a dropped turn (deleted, unreadable or too large)
 * can no longer stop the current question. `original` stays whole: it is the stored conversation the answer joins.
 */
export function windowSnapshot(
  snapshot: ExecutionSnapshot,
  turns: number | undefined,
): ExecutionSnapshot {
  const replay = keepRecentTurns(snapshot.replay, turns);
  if (replay === snapshot.replay) return snapshot;
  const kept = new Set(replay.map((message) => message.id));
  return {
    original: snapshot.original,
    replay,
    files: snapshot.files.filter((file) => kept.has(file.messageId)),
  };
}
