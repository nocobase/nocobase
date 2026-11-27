import type { RecordDetail, TransitionEntry } from './api.js';

/** The transitions drawn for the current run, independent of retained audit history. */
export function currentRoundTransitions(
  detail: Pick<RecordDetail, 'history' | 'roundStartedVersion'>,
): readonly TransitionEntry[] {
  const { history, roundStartedVersion = 0 } = detail;
  return history.transitions.filter(
    (entry) => entry.version >= roundStartedVersion,
  );
}

export function visitedStates(history: readonly TransitionEntry[]): string[] {
  return history.flatMap((entry) =>
    entry.from ? [entry.from, entry.to] : [entry.to],
  );
}
