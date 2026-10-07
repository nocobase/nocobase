/**
 * Redaction on the server: what runners report about runs and jobs (events, summaries, failure details, job logs) is
 * redacted again before it is stored, with the protocol's redactor (`createRedactor` of `@nocobase/agent-protocol`).
 * The runner redacts first; this catches a runner that does not (an older one), and the secrets the server handed out.
 *
 * Those secrets are remembered here when a run or job is claimed (its variables and run token, a job's opened
 * variables, repository token and upload headers), in memory and for the most recent claims only: after a restart, or
 * on another instance, the common patterns still apply, and so does the runner's own redaction. Credentials this
 * plugin issues are recognised by their prefix in any case.
 */
import { createRedactor, type Redactor } from '@nocobase/agent-protocol';

export interface SecretMemory {
  /** The secrets handed out with a claim of `owner` (`run:<id>`, `job:<id>`), replacing earlier ones. */
  remember(owner: string, secrets: Iterable<string | null | undefined>): void;
  /** Forgets `owner`'s secrets once it ended. */
  forget(owner: string): void;
  /** A redactor for what `owner` reports: its secrets, when remembered, and the common patterns. */
  redactor(owner: string): Redactor;
}

/** How many claims' secrets are kept at once; the oldest go first. */
export const SECRET_MEMORY_LIMIT = 2000;

const patternsOnly = createRedactor();

export function createSecretMemory(
  limit: number = SECRET_MEMORY_LIMIT,
): SecretMemory {
  const redactors = new Map<string, Redactor>();
  return {
    remember(owner, secrets) {
      redactors.delete(owner);
      const redactor = createRedactor(secrets);
      if (redactor.secrets.length === 0) return;
      redactors.set(owner, redactor);
      while (redactors.size > limit) {
        const oldest = redactors.keys().next();
        if (oldest.done) break;
        redactors.delete(oldest.value);
      }
    },
    forget(owner) {
      redactors.delete(owner);
    },
    redactor: (owner) => redactors.get(owner) ?? patternsOnly,
  };
}

export const runSecretsKey = (runId: string): string => `run:${runId}`;
export const jobSecretsKey = (jobId: string): string => `job:${jobId}`;
