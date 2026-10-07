// Step `mounts`: the run's mounts, fetched once per content hash and copied to their targets in the subject's work
// directory (src/agent/mounts.ts). A run without mounts, or a payload from an application that sends none, places
// nothing.
import { placeMounts } from '../mounts.ts';
import type { PrepareStep } from './types.ts';

export const mountsStep: PrepareStep = {
  name: 'mounts',
  failure: 'setupFailed',
  async run(context) {
    const mounts = context.payload.mounts ?? [];
    if (mounts.length === 0) return;
    const workDir = context.workspace?.workDir;
    if (workDir === undefined) throw new Error('The workspace is not locked.');
    const result = await placeMounts({
      paths: context.paths,
      appKey: context.registration.key,
      workDir,
      mounts,
      client: context.client,
      log: context.log,
    });
    context.mounts = result.placed;
    context.event({
      type: 'status',
      content: `Mounts: ${result.placed.map((mount) => mount.name).join(', ')}`,
      meta: {
        phase: 'mounts',
        mounts: result.placed.map((mount) => ({
          name: mount.name,
          dir: mount.dir,
        })),
        fetched: result.fetched,
      },
    });
  },
};
