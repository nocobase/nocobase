// Codex's state directory for one workspace (`CODEX_HOME`), `<workDir>/.nocobase-runner/codex-home`: its sessions,
// history and logs stay with the task, so runs on the same subject can resume their thread, while the login and the
// person's settings come from the real `~/.codex` through links to `auth.json` and `config.toml`.
import { existsSync, lstatSync } from 'node:fs';
import { mkdir, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/** What the workspace's Codex home links from the real one. */
export const CODEX_HOME_LINKS: readonly string[] = ['auth.json', 'config.toml'];

/** Creates `dir` with links to the login and settings in `realCodexHome`. Returns `dir`. */
export async function prepareCodexHome(
  dir: string,
  realCodexHome: string = process.env.CODEX_HOME ??
    path.join(os.homedir(), '.codex'),
): Promise<string> {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  for (const entry of CODEX_HOME_LINKS) {
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
