/**
 * The private npm registry's token on demand (`RUNNER_ROUTES.npmCredential`, the `npmCredentials` feature): a runner
 * asks for it only when an install of its run needs NocoBase's private registry (`NOCOBASE_NPM_REGISTRY`), because the
 * repository declares that registry or an `@nocobase/*` package was not found on the one it used.
 *
 * The answer is given only while the asking runner holds the run (`reports.holds`), for the attempt it names, under a
 * lease that has not run out, as for repository credentials (`git-credentials.ts`). The application gives the token
 * (`NpmCredentialProvider.issue`), outside any transaction, within `ISSUE_TIMEOUT_MS`; the first provider that has one
 * answers, and null means none is configured. A token handed out is added to the run's remembered secrets, so what the
 * run reports afterwards is redacted of it. Every answer is logged without the token, with why the runner asked, so a
 * person can tell which runs needed the private registry and for which package.
 */
import {
  ProtocolError,
  type NpmCredential,
  type NpmCredentialRequest,
} from '@nocobase/agent-protocol';

import type { Clock } from '../../kernel/clock.js';
import { runSecretsKey, type SecretMemory } from '../../kernel/redaction.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { Runner } from '../../../shared/runners.js';
import type { NpmCredentialRegistry } from './extensions.js';
import { ISSUE_TIMEOUT_MS } from './git-credentials.js';
import type { RunnerReports } from './lifecycle.js';
import { findRunRecord, toRun, type RunRecord } from './run.store.js';

export interface NpmCredentialService {
  issue(
    runner: Pick<Runner, 'id'>,
    runId: string,
    request: NpmCredentialRequest,
  ): Promise<NpmCredential>;
}

export interface NpmCredentialDeps {
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly reports: Pick<RunnerReports, 'holds'>;
  readonly providers: NpmCredentialRegistry;
  readonly secrets?: SecretMemory;
  /** One line per answer, never with the token. */
  readonly log?: (message: string) => void;
  readonly onError?: (message: string, error: unknown) => void;
  readonly timeoutMs?: number;
}

export function createNpmCredentialService(
  deps: NpmCredentialDeps,
): NpmCredentialService {
  const timeoutMs = deps.timeoutMs ?? ISSUE_TIMEOUT_MS;
  const log = deps.log ?? ((message: string) => console.info(message));

  async function held(
    runner: Pick<Runner, 'id'>,
    runId: string,
    attempt: number,
  ): Promise<RunRecord> {
    await deps.reports.holds(runner, runId);
    const run = await findRunRecord(deps.tx.read(), runId);
    if (!run) throw new ProtocolError('RUN_NOT_FOUND', 'No such run.');
    if (Number(run.attempt) !== attempt)
      throw new ProtocolError(
        'LEASE_LOST',
        `Attempt ${attempt} of the run is over; it is on attempt ${Number(run.attempt)}.`,
        { status: run.status },
      );
    if (
      run.leaseExpiresAt === null ||
      Date.parse(run.leaseExpiresAt) <= deps.clock.now().getTime()
    )
      throw new ProtocolError('LEASE_LOST', 'The run’s lease ran out.', {
        status: run.status,
      });
    return run;
  }

  async function ask(
    run: RunRecord,
    runner: Pick<Runner, 'id'>,
    request: NpmCredentialRequest,
  ): Promise<string | null> {
    for (const provider of deps.providers.list()) {
      const controller = new AbortController();
      let timer: NodeJS.Timeout | undefined;
      try {
        const token = await Promise.race([
          provider.issue({
            run: toRun(run),
            runnerId: runner.id,
            attempt: request.attempt,
            reason: request.reason,
            ...(request.package === undefined
              ? {}
              : { package: request.package }),
            signal: controller.signal,
          }),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new Error('The application did not answer in time.'));
            }, timeoutMs);
          }),
        ]);
        if (typeof token === 'string' && token !== '') return token;
      } catch (error) {
        deps.onError?.(
          `Agents could not get the npm registry token for run ${run.id} from ${provider.key}.`,
          error,
        );
        throw new ProtocolError(
          'INTERNAL_ERROR',
          'The application could not give the npm registry token just now.',
        );
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  }

  return {
    async issue(runner, runId, request) {
      const run = await held(runner, runId, request.attempt);
      const token = await ask(run, runner, request);
      // The run may have ended or moved on while the application answered: then nothing is handed out.
      await held(runner, runId, request.attempt);
      log(
        `npm credential ${token === null ? 'unconfigured' : 'issued'} run=${run.id} reason=${request.reason}${request.package === undefined ? '' : ` package=${request.package}`}`,
      );
      if (token !== null) deps.secrets?.add(runSecretsKey(run.id), [token]);
      return { token };
    },
  };
}
