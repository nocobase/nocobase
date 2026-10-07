/**
 * Run defaults: the tool policy an agent starts from, and how long a failed attempt waits before the next.
 */
import type { FailureReason, ToolPolicy } from '@nocobase/agent-protocol';

import { DEFAULT_TOOL_POLICY } from '../../../shared/agents.js';
import type { AgentCliSource } from './cli-package.js';

/** The application CLI a run exposes to its agent (`RunPayload.cli`). */
export interface AgentCli {
  readonly name: string;
  readonly package: AgentCliSource;
  /** Relative to the run's working directory. */
  readonly credentialFile: string;
}

/**
 * The CLI an agent talks to the application with, as the application configures it (`agents.cli`). Only `name` is
 * needed, the application's id when it is left out: the runner installs the CLI from the tarball this application
 * serves for its platform (`served`, see `cli-package.ts`) unless `package` names an npm package and version, a tarball,
 * or `preinstalled` where runners already have it, and the run's token goes in `.<name>/run.json` unless
 * `credentialFile` says otherwise.
 */
export function resolveAgentCli(
  configured: Partial<AgentCli> | undefined,
  app: { readonly id: string },
): AgentCli {
  const name = configured?.name ?? app.id;
  return {
    name,
    package: configured?.package ?? { kind: 'served' },
    credentialFile: configured?.credentialFile ?? `.${name}/run.json`,
  };
}

export { DEFAULT_TOOL_POLICY };

/** The agent's overrides over the defaults. */
export function toolPolicyFor(
  overrides: Partial<ToolPolicy> | null,
): ToolPolicy {
  return { ...DEFAULT_TOOL_POLICY, ...(overrides ?? {}) };
}

/** Failures of the runner itself retry at once, elsewhere; the tool's own failures back off. */
const IMMEDIATE: readonly FailureReason[] = [
  'runnerOffline',
  'leaseExpired',
  'startTimeout',
];

/** How long before attempt `attempt + 1` may start, after attempt `attempt` failed for `reason`. */
export function retryDelayMs(reason: FailureReason, attempt: number): number {
  if (IMMEDIATE.includes(reason)) return 0;
  return Math.min(10 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1));
}

/** Claims that failed to assemble a run's payload before the run fails `setupFailed`. */
export const MAX_CLAIM_FAILURES: number = 3;

/** How long a run token lives at most; it is revoked as soon as the run leaves its runner. */
export const RUN_TOKEN_TTL_MS: number = 7 * 24 * 60 * 60_000;
