/** Directories on a person's computer, as they read them: their home directory is `~`. */

/** `path` with the home directory written as `~`. */
export function displayPath(path: string, home: string | null): string {
  if (!home) return path;
  if (path === home) return '~';
  return path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

/** Whether `path` is one of `roots` or inside one. */
export function isWithin(roots: readonly string[], path: string): boolean {
  return roots.some(
    (root) =>
      path === root || path.startsWith(root.endsWith('/') ? root : `${root}/`),
  );
}

/** Whether a computer's bridge allows all of its owner's home directory, as it does unless started with `--root`. */
export function wholeHome(computer: {
  readonly roots: readonly string[];
  readonly home: string | null;
}): boolean {
  return computer.roots.length === 1 && computer.roots[0] === computer.home;
}
