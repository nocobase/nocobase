/**
 * The viewer just did something on an issue's page that starts an agent's work there, such as handing it over: the
 * open page looks for the new run at once instead of at its slow pace (`pages/issues/detail/use-live-issue.ts`).
 */
const listeners = new Map<string, Set<() => void>>();

export function wakeIssue(issueId: string): void {
  for (const wake of listeners.get(issueId) ?? []) wake();
}

/** Calls `wake` whenever the issue is woken; returns what stops it. */
export function onIssueWake(issueId: string, wake: () => void): () => void {
  let wakes = listeners.get(issueId);
  if (!wakes) listeners.set(issueId, (wakes = new Set()));
  wakes.add(wake);
  return () => {
    wakes.delete(wake);
    if (wakes.size === 0) listeners.delete(issueId);
  };
}
