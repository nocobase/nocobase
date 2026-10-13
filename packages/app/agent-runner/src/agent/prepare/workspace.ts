// Step `workspace`: locks the subject's work directory for the run and, when the run asks (`workspace.clean`), starts
// it over: its checkouts, its tmp and Codex home, and the record of prepared directories go; a directory used in place is
// never touched. A read-only run's directory (`workspace.readOnly`) is removed once the run ends, while it still holds
// the lock: such a run pushes nothing, so nothing is lost, and the next read-only run of the subject checks it out again
// at the same path.
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
        if ((await context.beforeWorkspaceRemoval?.()) !== true) {
          context.log(
            `workspace: deferred read-only cleanup to GC: ${lock.workDir}`,
          );
          return;
        }
        const meta = await readWorkspaceMeta(context.paths, lock.workDir);
        await removeWorkspace(
          context.paths,
          lock.workDir,
          meta ?? { repos: [] },
        );
        context.log(`workspace: removed the read-only ${lock.workDir}`);
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
