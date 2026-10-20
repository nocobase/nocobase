// Task code is shared; all run-owned files live outside the checkout.
import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  taskWorkDir,
  cleanWorkspace,
  readWorkspaceMeta,
  writeWorkspaceMeta,
} from '../../core/checkout.ts';
import { registerWorkspaceUse } from '../../core/workspace-use.ts';
import { workspaceKey, type PrepareStep } from './types.ts';

export const workspaceStep: PrepareStep = {
  name: 'workspace',
  failure: 'checkoutFailed',
  async run(context) {
    const workDir = taskWorkDir(
      context.paths,
      context.registration.key,
      workspaceKey(context.payload),
    );
    if (context.payload.workspace.clean === true)
      await cleanWorkspace(context.paths, workDir);
    await mkdir(workDir, { recursive: true, mode: 0o700 });
    const release = await registerWorkspaceUse(
      context.paths,
      workDir,
      context.payload.run.id,
    );
    context.workspace = { workDir, release };
    context.onRelease(release);
    context.privateDir = path.join(
      context.paths.runsDir,
      'private',
      `${context.payload.run.id}-${context.payload.run.attempt}-${randomUUID()}`,
    );
    await mkdir(context.privateDir, { recursive: true, mode: 0o700 });
    context.onRelease(() =>
      rm(context.privateDir!, { recursive: true, force: true }),
    );
    const meta = await readWorkspaceMeta(context.paths, workDir);
    await writeWorkspaceMeta(context.paths, workDir, {
      ...meta,
      appKey: context.registration.key,
      subjectKey: workspaceKey(context.payload),
      repos: meta?.repos ?? [],
      lastRunId: context.payload.run.id,
      lastUsedAt: new Date().toISOString(),
    });
  },
};
