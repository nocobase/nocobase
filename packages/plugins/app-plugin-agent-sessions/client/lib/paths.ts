/**
 * Directories on a person's computer, as they read them: their home directory is `~`. A path is the computer's own,
 * written as its system writes them: `C:\Users\me\code` on Windows, which also ignores case, `/home/me/code` elsewhere.
 */

/** The separator of the system `path` was written on. */
export function separatorOf(path: string): '/' | '\\' {
  return /^[A-Za-z]:[\\/]|^\\\\/u.test(path) ? '\\' : '/';
}

/** Whether `path` is `root` or inside it. */
function under(path: string, root: string): boolean {
  const separator = separatorOf(root);
  const fold = (value: string): string =>
    separator === '\\' ? value.toLowerCase() : value;
  const base = root.endsWith(separator) ? root : `${root}${separator}`;
  return fold(path) === fold(root) || fold(path).startsWith(fold(base));
}

/** `path` with the home directory written as `~`. */
export function displayPath(path: string, home: string | null): string {
  if (!home || !under(path, home)) return path;
  return path.length <= home.length ? '~' : `~${path.slice(home.length)}`;
}

/** Whether `path` is one of `roots` or inside one. */
export function isWithin(roots: readonly string[], path: string): boolean {
  return roots.some((root) => under(path, root));
}

/** The folder `name` in `dir`. */
export function joinPath(dir: string, name: string): string {
  const separator = separatorOf(dir);
  return dir.endsWith(separator)
    ? `${dir}${name}`
    : `${dir}${separator}${name}`;
}

/** The directory above `dir`, or undefined at the top of its drive or system. */
export function parentOf(dir: string): string | undefined {
  const separator = separatorOf(dir);
  const trimmed = dir.length > 1 ? dir.replace(/[\\/]+$/u, '') : dir;
  const top = separator === '\\' ? /^[A-Za-z]:$/u : /^$/u;
  if (dir === '/' || top.test(trimmed)) return undefined;
  const cut = trimmed.lastIndexOf(separator);
  if (cut < 0) return undefined;
  const parent = trimmed.slice(0, cut);
  return top.test(parent) || parent === '' ? `${parent}${separator}` : parent;
}

/** Whether a computer's bridge allows all of its owner's home directory, as it does unless started with `--root`. */
export function wholeHome(computer: {
  readonly roots: readonly string[];
  readonly home: string | null;
}): boolean {
  return computer.roots.length === 1 && computer.roots[0] === computer.home;
}
