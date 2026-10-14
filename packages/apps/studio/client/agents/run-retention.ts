/** Uses current policy; this is deliberately not a persisted cleanup receipt. */
export function isRunPastRetention(
  run:
    { readonly status: string; readonly finishedAt: string | null } | undefined,
  days: number,
  now = Date.now(),
): boolean {
  return (
    days > 0 &&
    Boolean(
      run &&
      ['completed', 'failed', 'cancelled'].includes(run.status) &&
      run.finishedAt &&
      Date.parse(run.finishedAt) < now - days * 86_400_000,
    )
  );
}

/** Call with the full unfiltered transcript, never an incremental or filtered page. */
export function hasClearedRunData(
  expired: boolean,
  events: readonly unknown[] | undefined,
  eventsFailed: boolean,
  briefError: unknown,
): boolean {
  return (
    expired &&
    events !== undefined &&
    events.length === 0 &&
    !eventsFailed &&
    typeof briefError === 'object' &&
    briefError !== null &&
    'status' in briefError &&
    briefError.status === 404
  );
}
