// Step `dirs`: the run's working directories, in its order. A repository is checked out (a bare cache and the
// subject's long-lived worktree on the run's branch, behind the push guard); a directory used in place must exist and
// is held for this run alone. Each gets a `checkout` event saying whether it was prepared fresh for the subject.
import path from 'node:path';

import { prepareDirs, RepoAccessFailure } from '../../core/checkout.ts';
import { PrepareError, type PrepareStep } from './types.ts';

export const dirsStep: PrepareStep = {
  name: 'dirs',
  failure: 'checkoutFailed',
  async run(context) {
    const workDir = context.workspace?.workDir;
    if (workDir === undefined) throw new Error('The workspace is not locked.');
    const prepared = await prepareDirs({
      paths: context.paths,
      appKey: context.registration.key,
      subjectKey: context.payload.subject.key,
      workDir,
      dirs: context.payload.workspace.dirs,
      ...(context.gitAuth === undefined ? {} : { auth: context.gitAuth }),
      log: context.log,
    }).catch((error: unknown) => {
      // A repository whose credential the application could not issue says why, so the run is retried or not.
      if (error instanceof RepoAccessFailure && error.kind !== 'leaseLost')
        throw new PrepareError(
          error.kind === 'denied'
            ? 'repoAccessDenied'
            : 'repoAccessUnavailable',
          error.message,
        );
      throw error;
    });
    context.onRelease(() => prepared.release());
    context.dirs = prepared.dirs;
    for (const dir of prepared.dirs) {
      const where =
        dir.kind === 'repo' ? path.relative(workDir, dir.dir) : dir.dir;
      context.event({
        type: 'checkout',
        content:
          dir.repo === undefined
            ? `${dir.dir} (used in place)`
            : `${dir.repo.url} at ${where} on ${dir.repo.branch}`,
        meta: {
          kind: dir.kind,
          path: where,
          primary: dir.primary,
          fresh: dir.fresh,
          ...(dir.repo === undefined
            ? {}
            : { url: dir.repo.url, branch: dir.repo.branch }),
        },
      });
    }
  },
};
