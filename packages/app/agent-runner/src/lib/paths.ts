import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';

/** Whether `target` is `root` or inside it, after resolving symbolic links of the part that exists. */
export function isInside(root: string, target: string): boolean {
  const realRoot = realpathOrSelf(root);
  const realTarget = realpathOfExistingPrefix(path.resolve(root, target));
  const relative = path.relative(realRoot, realTarget);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
}

function realpathOrSelf(file: string): string {
  try {
    return realpathSync(file);
  } catch {
    return path.resolve(file);
  }
}

function realpathOfExistingPrefix(file: string): string {
  let current = file;
  const rest: string[] = [];
  while (!existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    rest.unshift(path.basename(current));
    current = parent;
  }
  return path.join(realpathOrSelf(current), ...rest);
}
