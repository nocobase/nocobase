// Step `dirs`: the run's working directories, in its order. A repository is checked out (a bare cache and the
// subject's long-lived worktree on the run's branch, behind the push guard); a directory used in place must exist and
// is held for this run alone. Each gets a `checkout` event saying whether it was prepared fresh for the subject.
//
// Cloning, fetching and the submodules' update are retried on this runner when they fail for a passing cause, each
// retry a `status` event. One that keeps failing fails the run `prepareNetwork`, which the application queues again,
// or `checkoutFailed` for an application that does not announce it (`RunHeader.acceptedFailures`). Any failure that
// comes after a retry, such as credentials refused once the network came back, records how many retries were made and
// the last error.
import path from 'node:path';

import { prepareDirs, RepoAccessFailure } from '../../core/checkout.ts';
import { GitNetworkError } from '../../core/git-retry.ts';
import { acceptedFailure } from '../../protocol/index.ts';
import {
  PrepareError,
  type PrepareContext,
  type PrepareStep,
} from './types.ts';

async function prepare(
  context: PrepareContext,
  workDir: string,
): ReturnType<typeof prepareDirs> {
  let retries = 0;
  try {
    return await prepareDirs({
      paths: context.paths,
      appKey: context.registration.key,
      subjectKey: context.payload.subject.key,
      runId: context.payload.run.id,
      workDir,
      dirs: context.payload.workspace.dirs,
      ...(context.gitAuth === undefined ? {} : { auth: context.gitAuth }),
      log: context.log,
      retry: {
        ...context.gitRetry,
        onRetry: (retry) => {
          retries += 1;
          const seconds = Math.round(retry.delayMs / 1000);
          context.log(
            `checkout: ${retry.operation} failed on the network; retry ${retry.attempt} in ${seconds}s: ${retry.error}`,
          );
          context.event({
            type: 'status',
            content: `${retry.operation} failed on the network; retrying (${retry.attempt}) in ${seconds}s.`,
            meta: {
              phase: 'dirs',
              retry: retry.attempt,
              delayMs: retry.delayMs,
              error: retry.error,
            },
          });
          context.gitRetry?.onRetry?.(retry);
        },
      },
    });
  } catch (error) {
    // A repository whose credential the application could not issue says why, so the run is retried or not.
    if (error instanceof RepoAccessFailure && error.kind !== 'leaseLost')
      throw new PrepareError(
        error.kind === 'denied' ? 'repoAccessDenied' : 'repoAccessUnavailable',
        error.message,
      );
    if (error instanceof GitNetworkError)
      throw new PrepareError(
        acceptedFailure('prepareNetwork', context.payload.run.acceptedFailures),
        error.message,
        { retries, lastError: error.lastError },
      );
    if (retries === 0) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new PrepareError(
      'checkoutFailed',
      `${message}\n(after ${retries} ${retries === 1 ? 'retry' : 'retries'} on this runner)`,
      { retries, lastError: message },
    );
  }
}

export const dirsStep: PrepareStep = {
  name: 'dirs',
  failure: 'checkoutFailed',
  async run(context) {
    const workDir = context.workspace?.workDir;
    if (workDir === undefined) throw new Error('The workspace is not locked.');
    const prepared = await prepare(context, workDir);
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
