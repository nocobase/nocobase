/**
 * Repository credentials on demand (`RUNNER_ROUTES.gitCredential`, the `gitCredentials` feature): a runner asks for the
 * credential of one of its run's repositories whenever git needs one, instead of keeping the one a claim handed out
 * for the whole run, which a long run outlives.
 *
 * The answer is given only while the asking runner holds the run (`reports.holds`), for the attempt it names, under a
 * lease that has not run out, and for a URL the claim listed in `RunGit.onDemand` (`agRuns.gitCredentialUrls`),
 * compared exactly: case, a trailing `.git` and anything else the runner sends must match what it was given. Anything
 * else is refused, so a run that ended, went back to the queue or was taken by another attempt gets nothing.
 *
 * The application issues the credential (`RepoAccessProvider.issue`), outside any transaction, within
 * `ISSUE_TIMEOUT_MS`; whether a cached one is still good enough is its decision. Every credential handed out is added
 * to the run's remembered secrets, so what the run reports afterwards is redacted of it too. A failure is answered
 * with a reason the runner can act on and a message safe to show: `REPO_ACCESS_UNAVAILABLE` (try again later) or
 * `REPO_ACCESS_DENIED` (the application will not issue one).
 */
import {
  ProtocolError,
  type GitCredential,
  type GitCredentialRequest,
} from '@nocobase/agent-protocol';

import type { Clock } from '../../kernel/clock.js';
import { runSecretsKey, type SecretMemory } from '../../kernel/redaction.js';
import type { TxRunner } from '../../kernel/tx.js';
import { stringArray } from '../../kernel/values.js';
import type { Runner } from '../../../shared/runners.js';
import {
  RepoAccessError,
  type RepoAccessRegistry,
  type RepoCredentialGrant,
} from './extensions.js';
import type { RunnerReports } from './lifecycle.js';
import { findRunRecord, toRun, type RunRecord } from './run.store.js';

/** How long the server waits for the application to issue a credential before answering `REPO_ACCESS_UNAVAILABLE`. */
export const ISSUE_TIMEOUT_MS = 15_000;

export interface GitCredentialService {
  issue(
    runner: Pick<Runner, 'id'>,
    runId: string,
    request: GitCredentialRequest,
  ): Promise<GitCredential>;
}

export interface GitCredentialDeps {
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly reports: Pick<RunnerReports, 'holds'>;
  readonly repoAccess: RepoAccessRegistry;
  readonly secrets?: SecretMemory;
  /** Told what went wrong when a provider failed in a way it did not explain (`RepoAccessError`). */
  readonly onError?: (message: string, error: unknown) => void;
  readonly timeoutMs?: number;
}

/** The URLs a claim listed for on-demand credentials, as stored on the run. */
export function gitCredentialUrls(
  run: Pick<RunRecord, 'gitCredentialUrls'>,
): string[] {
  return stringArray(run.gitCredentialUrls);
}

export function createGitCredentialService(
  deps: GitCredentialDeps,
): GitCredentialService {
  const timeoutMs = deps.timeoutMs ?? ISSUE_TIMEOUT_MS;

  const lost = (message: string, status: string) =>
    new ProtocolError('LEASE_LOST', message, { status });

  async function withTimeout(
    issue: (signal: AbortSignal) => Promise<RepoCredentialGrant | null>,
  ): Promise<RepoCredentialGrant | null> {
    const controller = new AbortController();
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(
          new RepoAccessError(
            'unavailable',
            'The application did not issue a credential in time.',
          ),
        );
      }, timeoutMs);
    });
    try {
      return await Promise.race([issue(controller.signal), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  function checked(grant: RepoCredentialGrant, now: Date): RepoCredentialGrant {
    const expires = Date.parse(grant.expiresAt);
    if (
      typeof grant.username !== 'string' ||
      grant.username === '' ||
      typeof grant.password !== 'string' ||
      grant.password === '' ||
      Number.isNaN(expires) ||
      expires <= now.getTime()
    )
      throw new RepoAccessError(
        'unavailable',
        'The application issued a credential that is incomplete or already expired.',
      );
    return grant;
  }

  return {
    async issue(runner, runId, request) {
      await deps.reports.holds(runner, runId);
      const run = await findRunRecord(deps.tx.read(), runId);
      if (!run) throw new ProtocolError('RUN_NOT_FOUND', 'No such run.');
      const now = deps.clock.now();
      if (Number(run.attempt) !== request.attempt)
        throw lost(
          `Attempt ${request.attempt} of the run is over; it is on attempt ${Number(run.attempt)}.`,
          run.status,
        );
      if (
        run.leaseExpiresAt === null ||
        Date.parse(run.leaseExpiresAt) <= now.getTime()
      )
        throw lost('The run’s lease ran out.', run.status);
      if (!gitCredentialUrls(run).includes(request.url))
        throw new ProtocolError(
          'INVALID_REQUEST',
          'This repository is not one the run asks credentials for on demand.',
          { url: request.url },
        );

      const providers = deps.repoAccess
        .list()
        .filter((provider) => provider.issue !== undefined);
      try {
        for (const provider of providers) {
          const grant = await withTimeout((signal) =>
            provider.issue!({
              run: toRun(run),
              runnerId: runner.id,
              attempt: request.attempt,
              url: request.url,
              refresh: request.refresh === true,
              signal,
            }),
          );
          if (!grant) continue;
          const { username, password, expiresAt } = checked(grant, now);
          deps.secrets?.add(runSecretsKey(run.id), [password]);
          return { username, password, expiresAt };
        }
      } catch (error) {
        if (error instanceof RepoAccessError)
          throw new ProtocolError(
            error.kind === 'denied'
              ? 'REPO_ACCESS_DENIED'
              : 'REPO_ACCESS_UNAVAILABLE',
            error.message,
            { url: request.url },
          );
        deps.onError?.(
          `Agents could not issue a repository credential for run ${run.id}.`,
          error,
        );
        throw new ProtocolError(
          'REPO_ACCESS_UNAVAILABLE',
          'The application could not issue a credential for this repository.',
          { url: request.url },
        );
      }
      throw new ProtocolError(
        'REPO_ACCESS_DENIED',
        'The application issues no credential for this repository.',
        { url: request.url },
      );
    },
  };
}
