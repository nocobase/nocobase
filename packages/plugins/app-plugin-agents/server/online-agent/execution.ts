/** Shared native occupancy projection; callers supply their already-authorized persisted row. */
export function nativeExecutionStatus(
  call: { state?: unknown; closing?: unknown } | null | undefined,
  active: boolean,
): 'running' | 'idle' {
  return active ||
    call?.state === 'running' ||
    call?.state === 'waitingApproval' ||
    call?.closing
    ? 'running'
    : 'idle';
}
