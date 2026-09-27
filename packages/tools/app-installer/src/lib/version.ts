interface Parsed {
  core: [number, number, number];
  prerelease: string[];
}

function parse(version: string): Parsed | undefined {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/u.exec(
    version.trim(),
  );
  if (!match) return undefined;
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

function compareIdentifiers(a: string, b: string): number {
  const numeric = /^\d+$/u;
  if (numeric.test(a) && numeric.test(b)) return Number(a) - Number(b);
  if (numeric.test(a)) return -1;
  if (numeric.test(b)) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Semantic version order: negative when `a` sorts first, positive when `b` does, zero when equal, and `undefined` when
 * either is not a version at all. A prerelease sorts below its release, and `1.0.0-beta.10` above `1.0.0-beta.9`.
 */
export function compareVersions(a: string, b: string): number | undefined {
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return undefined;
  for (let index = 0; index < 3; index += 1) {
    const difference = left.core[index] - right.core[index];
    if (difference !== 0) return difference;
  }
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    return right.prerelease.length - left.prerelease.length;
  }
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const x = left.prerelease[index];
    const y = right.prerelease[index];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const difference = compareIdentifiers(x, y);
    if (difference !== 0) return difference;
  }
  return 0;
}
