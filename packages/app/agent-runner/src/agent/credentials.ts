// The run's credential for the application's CLI: `RunPayload.cli.credential`, written as JSON to its `file` (relative
// to the working directory, 0600, in a 0700 directory). It is the only place the run's token is written. The CLI finds
// it by walking up from its working directory; the worker deletes it when the run ends, and orphan recovery deletes
// it too, so a killed worker does not leave a live token behind. The runner does not read what is inside, except to
// fill in `server` when the application left it out.
import { chmod, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { writeJsonAtomic } from '../lib/home.ts';
import type { RunCli } from '../protocol/index.ts';

export function credentialsPath(workDir: string, file: string): string {
  const resolved = path.resolve(workDir, file);
  const relative = path.relative(workDir, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error(
      `The CLI credential file ${file} is outside the working directory.`,
    );
  return resolved;
}

export async function writeRunCredentials(
  workDir: string,
  cli: RunCli,
  server: string,
): Promise<string> {
  const file = credentialsPath(workDir, cli.credential.file);
  const dir = path.dirname(file);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  if (dir !== workDir) await chmod(dir, 0o700);
  const content = { ...cli.credential.content };
  if (typeof content.server !== 'string' || content.server === '')
    content.server = server;
  await writeJsonAtomic(file, content, 0o600);
  return file;
}

export async function deleteRunCredentials(file: string): Promise<void> {
  await rm(file, { force: true });
}

/** What a policy must keep tools away from: the credential's directory, or the file when it sits at the top. */
export function credentialsGuard(workDir: string, file: string): string {
  const resolved = credentialsPath(workDir, file);
  const dir = path.dirname(resolved);
  return dir === workDir ? resolved : dir;
}
