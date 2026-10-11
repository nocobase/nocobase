// Step `workspace`: locks the subject's work directory for the run and, when the run asks (`workspace.clean`), starts
// it over: its checkouts, its tmp and Codex home, and the record of prepared directories go; a directory used in place is
// never touched.
import {
  cleanWorkspace,
  lockWorkspace,
  WorkspaceBusyError,
} from '../../core/checkout.ts';
import { acceptedFailure } from '../../protocol/index.ts';
import { PrepareError, type PrepareStep } from './types.ts';

export const workspaceStep: PrepareStep = {
  name: 'workspace',
  failure: 'checkoutFailed',
  async run(context) {
    const lock = await lockWorkspace({
      paths: context.paths,
      appKey: context.registration.key,
      subjectKey: context.payload.subject.key,
    }).catch((error: unknown) => {
      if (error instanceof WorkspaceBusyError)
        throw new PrepareError(
          acceptedFailure(
            'workspaceBusy',
            context.payload.run.acceptedFailures,
          ),
          error.message,
        );
      throw error;
    });
    context.onRelease(() => lock.release());
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
