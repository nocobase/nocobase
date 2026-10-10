import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildAgentEnv } from '../env.ts';

/**
 * Discover host capabilities without reading a project's settings or inheriting daemon secrets. `env` is the
 * environment a run gets from the runner (`detectionEnv`), so detection sees the keys and proxies a run will have; the
 * runner's whitelist alone when absent.
 */
export async function withDetectionEnvironment<T>(
  signal: AbortSignal | undefined,
  detect: (cwd: string, env: Record<string, string>) => Promise<T>,
  env?: Record<string, string>,
): Promise<T> {
  signal?.throwIfAborted();
  const cwd = await mkdtemp(path.join(tmpdir(), 'nocobase-model-detection-'));
  try {
    signal?.throwIfAborted();
    return await detect(cwd, env ?? buildAgentEnv({ source: process.env }));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}
