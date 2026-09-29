const FORBIDDEN_SCOPE_CHARACTERS = /[:\\\s]/u;
const SCOPED_PACKAGE_NAME = /^@([^/]+)\/([^/]+)$/u;

/**
 * A scope names a BullMQ queue and a state file, so it may contain neither `:`
 * nor whitespace nor a path separator. The one `/` allowed is the separator of
 * an npm scoped package name, which is what consumers pass by convention; the
 * memory adapter encodes it before building a file name.
 */
export function assertValidScope(scope: string): void {
  const segments = typeof scope === 'string' ? scopeSegments(scope) : undefined;
  if (
    !segments ||
    FORBIDDEN_SCOPE_CHARACTERS.test(scope) ||
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..',
    )
  ) {
    throw new Error(
      `Invalid jobs scope ${JSON.stringify(scope)}: use a package name without ":", whitespace or path separators other than the one in "@scope/name".`,
    );
  }
}

function scopeSegments(scope: string): string[] | undefined {
  if (!scope.includes('/')) return [scope];
  const match = SCOPED_PACKAGE_NAME.exec(scope);
  return match ? [match[1], match[2]] : undefined;
}
