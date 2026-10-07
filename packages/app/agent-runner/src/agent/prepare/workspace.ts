// Step `workspace`: locks the subject's work directory for the run and, when the run asks (`workspace.clean`), starts
// it over: its checkouts, the agent's home and the record of prepared directories go; a directory used in place is
// never touched.
import { cleanWorkspace, lockWorkspace } from '../../core/checkout.ts';
import type { PrepareStep } from './types.ts';

export const workspaceStep: PrepareStep = {
  name: 'workspace',
  failure: 'checkoutFailed',
  async run(context) {
    const lock = await lockWorkspace({
      paths: context.paths,
      appKey: context.registration.key,
      subjectKey: context.payload.subject.key,
    });
    context.onRelease(() => lock.release());
    context.workspace = lock;
    if (context.payload.workspace.clean === true) {
      context.log(`workspace: cleaning ${lock.workDir}`);
      await cleanWorkspace(lock.workDir);
      context.event({
        type: 'status',
        content: 'Started from a clean working directory.',
        meta: { phase: 'workspace', clean: true },
      });
    }
  },
};
