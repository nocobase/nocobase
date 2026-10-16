/** Classify actual failed operations, including wrapped filesystem and subprocess errors. */
export function isDiskFull(
  error: unknown,
  seen: Set<unknown> = new Set<unknown>(),
): boolean {
  if (typeof error === 'string')
    return /\bENOSPC\b|no space left on device/iu.test(error);
  if (!error || typeof error !== 'object' || seen.has(error)) return false;
  seen.add(error);
  const value = error as {
    code?: unknown;
    message?: unknown;
    stderr?: unknown;
    cause?: unknown;
  };
  return (
    value.code === 'ENOSPC' ||
    isDiskFull(value.message, seen) ||
    isDiskFull(value.stderr, seen) ||
    isDiskFull(value.cause, seen)
  );
}
