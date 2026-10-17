// Codex's state directory (`CODEX_HOME`) is outside disposable attempt worktrees: its sessions,
// history and logs stay with the task, so runs on the same subject can resume their thread, while the login and the
// person's settings come from the real `~/.codex` through links to `auth.json` and `config.toml`. Its downloaded
// plugin bundles (`plugins/`) and plugin catalog (`cache/`) are linked from the real home too, so a new workspace does
// not download them again; a workspace home that already has its own directory there keeps it.
import { existsSync, lstatSync } from 'node:fs';
import { mkdir, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/** The files the workspace's Codex home links from the real one, when the real one has them. */
export const CODEX_HOME_LINKS: readonly string[] = ['auth.json', 'config.toml'];

/** The directories the workspace's Codex home shares with the real one, created there when missing. */
export const CODEX_HOME_SHARED_DIRS: readonly string[] = ['plugins', 'cache'];

/** Creates `dir` with links to the login, settings and plugin caches in `realCodexHome`. Returns `dir`. */
export async function prepareCodexHome(
  dir: string,
  realCodexHome: string = process.env.CODEX_HOME ??
    path.join(os.homedir(), '.codex'),
): Promise<string> {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  for (const entry of CODEX_HOME_SHARED_DIRS)
    await mkdir(path.join(realCodexHome, entry), {
      recursive: true,
      mode: 0o700,
    });
  for (const entry of [...CODEX_HOME_LINKS, ...CODEX_HOME_SHARED_DIRS]) {
    const source = path.join(realCodexHome, entry);
    const target = path.join(dir, entry);
    if (!existsSync(source)) continue;
    try {
      lstatSync(target);
      continue;
    } catch {
      // Not there yet.
    }
    await symlink(source, target);
  }
  return dir;
}
