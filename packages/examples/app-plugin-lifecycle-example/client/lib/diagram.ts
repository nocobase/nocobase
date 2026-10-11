import type { RecordDetail } from './api.js';

/** Every state the record has been in, from its transition log. */
export function visitedStates(detail: RecordDetail): string[] {
  return detail.history.transitions.flatMap((entry) =>
    entry.from ? [entry.from, entry.to] : [entry.to],
  );
}
