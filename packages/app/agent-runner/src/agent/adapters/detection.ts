import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildAgentEnv } from '../env.ts';

/** Discover host capabilities without reading a project's settings or inheriting daemon secrets. */
export async function withDetectionEnvironment<T>(
  signal: AbortSignal | undefined,
  detect: (cwd: string, env: Record<string, string>) => Promise<T>,
): Promise<T> {
  signal?.throwIfAborted();
  const cwd = await mkdtemp(path.join(tmpdir(), 'nocobase-model-detection-'));
  try {
    signal?.throwIfAborted();
    return await detect(cwd, buildAgentEnv({ source: process.env }));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}
