// Codex's state directory for one workspace (`CODEX_HOME`), `<workDir>/.nocobase-runner/codex-home`: its sessions,
// history and logs stay with the task, so runs on the same subject can resume their thread, while the login and the
// person's settings come from the real `~/.codex` through links to `auth.json` and `config.toml`.
import { existsSync, lstatSync } from 'node:fs';
import { mkdir, symlink, readdir, cp } from 'node:fs/promises';
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

/** Copy only the selected conversation rollout, never authentication/configuration or other conversations. */
export async function migrateCodexConversation(
  target: string,
  source: string,
  sessionId: string | undefined,
): Promise<void> {
  if (sessionId === undefined || !/^[a-zA-Z0-9-]+$/u.test(sessionId)) return;
  const walk = async (dir: string, relative: string): Promise<void> => {
    const entries = await readdir(dir, { withFileTypes: true }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      },
    );
    for (const entry of entries) {
      const child = path.join(dir, entry.name);
      const suffix = path.join(relative, entry.name);
      if (entry.isDirectory()) await walk(child, suffix);
      else if (
        entry.isFile() &&
        entry.name.endsWith('.jsonl') &&
        entry.name.includes(sessionId)
      ) {
        const destination = path.join(target, suffix);
        await mkdir(path.dirname(destination), {
          recursive: true,
          mode: 0o700,
        });
        await cp(child, destination, { force: false, errorOnExist: false });
      }
    }
  };
  for (const folder of ['sessions', 'archived_sessions'])
    await walk(path.join(source, folder), folder);
}
