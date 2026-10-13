// Workspace clean and read-only completion share the full local-work protection. Caller holds the workspace lock.
import {
  cleanWorkspace,
  lockWorkspace,
  readWorkspaceMeta,
  removeWorkspace,
} from '../../core/checkout.ts';
import { workspaceKey, type PrepareStep } from './types.ts';

export const workspaceStep: PrepareStep = {
  name: 'workspace',
  failure: 'checkoutFailed',
  async run(context) {
    // A lock another run holds throws `WorkspaceBusyError`, which the worker reports as `workspaceBusy` (`stepFailure`).
    const lock = await lockWorkspace({
      paths: context.paths,
      appKey: context.registration.key,
      subjectKey: workspaceKey(context.payload),
    });
    context.onRelease(() => lock.release());
    // Releases run last first: the directory goes before its lock is released.
    if (context.payload.workspace.readOnly === true)
      context.onRelease(async () => {
        const meta = await readWorkspaceMeta(context.paths, lock.workDir);
        const removed =
          meta !== undefined &&
          (await removeWorkspace(
            context.paths,
            lock.workDir,
            meta ?? { repos: [] },
          ));
        context.log(
          `workspace: ${removed ? 'removed' : 'preserved'} the read-only ${lock.workDir}`,
        );
      });
    context.workspace = lock;
    if (context.payload.workspace.clean === true) {
      context.log(`workspace: cleaning ${lock.workDir}`);
      await cleanWorkspace(context.paths, lock.workDir);
      context.event({
        type: 'status',
        content: 'Started from a clean working directory.',
        meta: { phase: 'workspace', clean: true },
      });
    }
  },
};
