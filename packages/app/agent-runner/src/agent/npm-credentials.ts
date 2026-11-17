// The private npm registry's token for a run, asked for from the application (`RUNNER_ROUTES.npmCredential`) the first
// time the run's npm launcher (npm-launcher.ts) needs it, through the run's credential socket (git-credentials.ts
// `serveGitCredentials`, action `npmToken`), and kept in the worker's memory until the run ends: one request per run at
// most, whatever the answer. The token goes to the run's redactor as it arrives; the launcher writes it only into the
// run's npm directory (`npmDir`), which the worker removes when the run ends.
import { rm } from 'node:fs/promises';
import path from 'node:path';

import {
  NpmCredentialSchema,
  RUNNER_ROUTES,
  routePath,
  type NpmCredentialReason,
} from '../protocol/index.ts';
import { ApiError, type ApiClient } from '../lib/http.ts';
import { LOST_CODES } from '../core/lease.ts';

/** How long the worker waits for the application's answer. */
export const NPM_TOKEN_TIMEOUT_MS = 30_000;

export interface NpmTokenSourceOptions {
  client: ApiClient;
  runId: string;
  attempt: number;
  onSecret: (secret: string) => void;
  onLost: (code: string) => void;
  log?: (message: string) => void;
  timeoutMs?: number;
}

export class NpmTokenSource {
  private readonly options: NpmTokenSourceOptions;
  private answer: Promise<string | null> | undefined;
  private closed = false;

  constructor(options: NpmTokenSourceOptions) {
    this.options = options;
  }

  /** The token, or null when the application has none; asked for once per run. Throws when it could not ask. */
  get(reason: NpmCredentialReason, pkg?: string): Promise<string | null> {
    if (this.closed)
      return Promise.reject(new Error('The run is no longer this runner’s.'));
    this.answer ??= this.fetch(reason, pkg).catch((error: unknown) => {
      // A failure is not kept: the next install asks again.
      this.answer = undefined;
      throw error;
    });
    return this.answer;
  }

  close(): void {
    this.closed = true;
    this.answer = undefined;
  }

  private async fetch(
    reason: NpmCredentialReason,
    pkg: string | undefined,
  ): Promise<string | null> {
    const { client, runId, attempt } = this.options;
    try {
      const { token } = await client.post(
        routePath(RUNNER_ROUTES.npmCredential, { runId }),
        { attempt, reason, ...(pkg === undefined ? {} : { package: pkg }) },
        NpmCredentialSchema,
        { timeoutMs: this.options.timeoutMs ?? NPM_TOKEN_TIMEOUT_MS },
      );
      if (token !== null) this.options.onSecret(token);
      this.options.log?.(
        `npm credential: ${token === null ? 'none configured' : 'issued'} (${reason}${pkg === undefined ? '' : ` ${pkg}`})`,
      );
      return token;
    } catch (error) {
      if (error instanceof ApiError && LOST_CODES.has(error.reason)) {
        this.close();
        this.options.onLost(error.reason);
      }
      throw new Error(
        `The application did not give the token: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
}

/** The run's npm directory (npm-launcher.ts), in the runner's part of the run's private directory. */
export function npmDir(runnerDir: string): string {
  return path.join(runnerDir, 'npm');
}

/** Removes the run's npm directory, and every configuration and token the launcher left in it. */
export async function removeNpmDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
