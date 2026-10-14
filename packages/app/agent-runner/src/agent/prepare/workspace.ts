// Every attempt has a private directory. Its lock protects cleanup only; repositories never hold a task lock.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  acquireLock,
  RUNNER_DIR,
  writeWorkspaceMeta,
} from '../../core/checkout.ts';
import { runWorkDir } from '../../core/run-worktrees.ts';
import { workspaceKey, type PrepareStep } from './types.ts';

export const workspaceStep: PrepareStep = {
  name: 'workspace',
  failure: 'checkoutFailed',
  async run(context) {
    const workDir = runWorkDir(
      context.paths,
      context.registration.key,
      workspaceKey(context.payload),
      context.payload.run.id,
      context.payload.run.attempt,
      context.payload.workspace.readOnly === true,
    );
    const lock = await acquireLock(`${workDir}.lock`);
    context.workspace = { workDir, release: () => lock.release() };
    context.onRelease(() => lock.release());
    await mkdir(path.join(workDir, RUNNER_DIR), {
      recursive: true,
      mode: 0o700,
    });
    await writeWorkspaceMeta(context.paths, workDir, {
      appKey: context.registration.key,
      subjectKey: workspaceKey(context.payload),
      repos: [],
      lastRunId: context.payload.run.id,
      lastUsedAt: new Date().toISOString(),
      runAttempt: true,
      runWorktrees: context.payload.workspace.dirs.some(
        (dir) => dir.kind === 'repo',
      ),
      readOnly: context.payload.workspace.readOnly === true,
    });
  },
};
