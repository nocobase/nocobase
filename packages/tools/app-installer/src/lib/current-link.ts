import { readlink, rename, rm, symlink } from 'node:fs/promises';
import type { Layout } from './layout.ts';

/**
 * Points `current` at a release in one step: the new link is created beside it and renamed over it, so `current`
 * always names a complete release and never goes missing in between.
 */
export async function switchCurrent(
  layout: Layout,
  linkTarget: string,
): Promise<void> {
  const temporary = `${layout.current}.${process.pid}.tmp`;
  await rm(temporary, { force: true });
  await symlink(linkTarget, temporary, 'dir');
  await rename(temporary, layout.current);
}

export async function readCurrent(layout: Layout): Promise<string | undefined> {
  try {
    return await readlink(layout.current);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}
