import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildAgentEnv } from '../env.ts';
import { writeHostTools } from '../host-tools.ts';

/**
 * Discover host capabilities without reading a project's settings or inheriting daemon secrets. `env` is the
 * environment a run gets from the runner (`detectionEnv`), so detection sees the keys and proxies a run will have; the
 * runner's whitelist alone when absent. With `guardHostCli`, the probe also gets the same `git`/`gh`/`glab` guards a
 * run gets, first on `PATH`, without a credential (none exists outside a run): a tool that depends on a login command
 * the guard refuses (Copilot calling `gh auth token`, for one) fails detection the same way it would fail the run,
 * instead of reporting ready. Off by default: it changes `PATH` and a native adapter's own tests assume it does not.
 */
export async function withDetectionEnvironment<T>(
  signal: AbortSignal | undefined,
  detect: (cwd: string, env: Record<string, string>) => Promise<T>,
  env?: Record<string, string>,
  options?: { readonly guardHostCli?: boolean },
): Promise<T> {
  signal?.throwIfAborted();
  const cwd = await mkdtemp(path.join(tmpdir(), 'nocobase-model-detection-'));
  try {
    signal?.throwIfAborted();
    const base = env ?? buildAgentEnv({ source: process.env });
    if (!options?.guardHostCli) return await detect(cwd, base);
    const binDir = path.join(cwd, 'bin');
    const helpersDir = path.join(cwd, 'helpers');
    const { wrapped } = await writeHostTools({
      binDir,
      helpersDir,
      searchPath: base.PATH,
    });
    const withGuards = wrapped.length
      ? { ...base, PATH: [binDir, base.PATH].filter(Boolean).join(path.delimiter) }
      : base;
    return await detect(cwd, withGuards);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}
