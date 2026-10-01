import type { CommandSuggestion } from '@nocobase/app-cli';

/** A deployment status the Hub reports. Anything else is an unconfirmed result. */
export type DeploymentStatus =
  'queued' | 'deploying' | 'succeeded' | 'failed' | 'cancelled';

/**
 * What a run had established when it failed: enough to retry with the same idempotency key, or to find the deployment
 * in Hub. Present only on a failure after the request to Hub was prepared.
 */
export interface HubCliErrorDetails {
  remote?: string;
  idempotencyKey?: string;
  releaseId?: string;
  operationId?: string;
  operationStatus?: DeploymentStatus;
}

/**
 * A failure the library reports on purpose. Its message is always a fixed string or built from values the caller
 * supplied, never from a response body, so it is safe to print; the commands turn it into a `CommandError`.
 */
export class HubCliError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly exitCode: number,
    public readonly details?: HubCliErrorDetails | undefined,
    public readonly suggestions?: readonly CommandSuggestion[] | undefined,
  ) {
    super(message);
  }
}
