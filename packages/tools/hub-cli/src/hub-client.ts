// The Hub's HTTP API, as hub-cli uses it. Every call is scoped to one App: `<Hub URL>/api/hub/apps/<App ID>/…`, with the
// API key as a bearer token.
import { open } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

import {
  HubCliError,
  type DeploymentStatus,
  type HubCliErrorDetails,
} from './errors.ts';
import { isRecord, type RemoteTarget } from './remotes.ts';

/** The platform an archive is built for, in the shape `pnpm build` records as `nocobase.buildTarget`. */
export interface BuildTarget {
  readonly platform: string;
  readonly arch: string;
  readonly libc: 'glibc' | 'musl' | null;
  readonly nodeAbi: number;
  readonly nodeMajor: number;
}

export interface AppInfo {
  /** What the Hub's Host runs Apps on; `null` when the Hub could not tell. */
  readonly buildTarget: BuildTarget | null;
  /** The version of the Release the App's current deployment runs; `null` before the first deployment. */
  readonly currentVersion: string | null;
  /** The Release the Host reports running, `null` when none is. */
  readonly runningReleaseId: string | null;
  /** What the Host reports for the App, such as `running` or `stopped`; `null` when the Hub could not tell. */
  readonly state: string | null;
}

/** A Release as `hub releases` reports it. */
export interface ReleaseInfo {
  readonly releaseId: string;
  readonly version: string;
  readonly checksum: string;
  readonly size: number;
  readonly uploadedAt: string;
  readonly buildTarget: BuildTarget | null;
  /** This Release is what the App's current deployment runs. */
  readonly running: boolean;
  /** Some deployment of this Release succeeded. */
  readonly everDeployed: boolean;
}

/** A deployment as `hub status` reports it. */
export interface DeploymentInfo {
  readonly operationId: string;
  readonly releaseId: string;
  readonly version: string | null;
  readonly kind: string;
  readonly status: DeploymentStatus;
  readonly createdAt: string;
  readonly finishedAt: string | null;
}

export interface UploadedRelease {
  readonly releaseId: string;
  readonly version: string | undefined;
  /** The Hub already had this archive and answered with its Release. */
  readonly reused: boolean;
}

export interface StartedDeployment {
  readonly operationId: string;
  readonly status: DeploymentStatus;
  /** The Hub answered with an earlier deployment for the same idempotency key. */
  readonly reused: boolean;
  readonly createdAt: string | undefined;
}

interface UploadSession {
  readonly uploadId: string;
  readonly offset: number;
  readonly chunkSize: number;
}

/** Failures after which a chunk is sent again from the offset the Hub reports. */
const RESUMABLE = new Set([
  'RESULT_UNKNOWN',
  'HUB_UNREACHABLE',
  'INVALID_HUB_RESPONSE',
  'TIMEOUT',
  'UPLOAD_OFFSET_MISMATCH',
]);

/** Consecutive failed chunks after which the upload gives up; the session stays for the next run to resume. */
const MAX_CHUNK_FAILURES = 5;

/** A request the Hub answered with an error. `offset` is what an upload error reports as the offset to go on from. */
class HubRejection extends HubCliError {
  constructor(
    code: string,
    message: string,
    exitCode: number,
    details: HubCliErrorDetails | undefined,
    readonly offset: number | undefined,
  ) {
    super(code, message, exitCode, details);
  }
}

export interface HubClientOptions {
  readonly target: RemoteTarget;
  readonly apiKey: string;
  /**
   * Deadline for each request to the Hub, in seconds. An upload of many chunks may take longer as a whole; each
   * chunk is one request.
   */
  readonly timeout: number;
}

export class HubClient {
  /** What the run has established so far. Every failure carries it. */
  readonly known: HubCliErrorDetails = {};
  /** `<Hub URL>/api/hub/apps/<App ID>`, without a trailing slash: the Hub routes the App itself there. */
  readonly #base: string;
  readonly #hub: string;
  readonly #apiKey: string;
  readonly #timeout: number;

  constructor(options: HubClientOptions) {
    this.#apiKey = options.apiKey;
    this.#timeout = options.timeout;
    this.#hub = options.target.hub;
    this.#base = `${options.target.hub}/api/hub/apps/${encodeURIComponent(options.target.appId)}`;
  }

  failure(code: string, message: string, exitCode: number): HubCliError {
    return new HubCliError(code, message, exitCode, this.#details());
  }

  #details(): HubCliErrorDetails | undefined {
    return Object.keys(this.known).length > 0 ? { ...this.known } : undefined;
  }

  async getApp(): Promise<AppInfo> {
    const data = await this.#request('', { method: 'GET' }, false);
    const deployment = isRecord(data.deployment) ? data.deployment : {};
    const runtime = isRecord(data.runtime) ? data.runtime : {};
    return {
      buildTarget: parseBuildTarget(data.buildTarget),
      currentVersion: optionalString(data.currentVersion),
      runningReleaseId: optionalString(deployment.observedReleaseId),
      state:
        optionalString(deployment.observedState) ??
        optionalString(runtime.state),
    };
  }

  /** The App's Releases, newest first. */
  async listReleases(limit: number): Promise<ReleaseInfo[]> {
    const data = await this.#requestAny(
      `releases?limit=${String(limit)}`,
      { method: 'GET' },
      false,
    );
    if (!Array.isArray(data))
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an unreadable Release list.',
        3,
      );
    return data.map((item) => this.#release(item));
  }

  async getRelease(releaseId: string): Promise<ReleaseInfo> {
    return this.#release(
      await this.#request(
        `releases/${encodeURIComponent(releaseId)}`,
        { method: 'GET' },
        false,
      ),
    );
  }

  /** The App's most recent deployments, newest first. */
  async listDeployments(pageSize: number): Promise<DeploymentInfo[]> {
    const data = await this.#request(
      `deployments?page=1&pageSize=${String(pageSize)}`,
      { method: 'GET' },
      false,
    );
    if (!Array.isArray(data.items))
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an unreadable deployment list.',
        3,
      );
    return data.items.map((item: unknown) => this.#deployment(item));
  }

  #release(value: unknown): ReleaseInfo {
    if (
      !isRecord(value) ||
      !isIdentifier(value.id) ||
      typeof value.version !== 'string' ||
      typeof value.checksum !== 'string' ||
      typeof value.size !== 'number' ||
      typeof value.createdAt !== 'string'
    )
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an unreadable Release.',
        3,
      );
    return {
      releaseId: value.id,
      version: value.version,
      checksum: value.checksum,
      size: value.size,
      uploadedAt: value.createdAt,
      buildTarget: parseBuildTarget(value.buildTarget),
      running: value.running === true,
      everDeployed: value.everDeployed === true,
    };
  }

  #deployment(value: unknown): DeploymentInfo {
    if (
      !isRecord(value) ||
      !isIdentifier(value.id) ||
      !isIdentifier(value.releaseId) ||
      !isDeploymentStatus(value.status) ||
      typeof value.createdAt !== 'string'
    )
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an unreadable deployment.',
        3,
      );
    return {
      operationId: value.id,
      releaseId: value.releaseId,
      version: isRecord(value.release)
        ? optionalString(value.release.version)
        : null,
      kind: typeof value.kind === 'string' ? value.kind : 'deploy',
      status: value.status,
      createdAt: value.createdAt,
      finishedAt: optionalString(value.finishedAt),
    };
  }

  /**
   * Uploads an archive through the Hub's resumable upload: a session, then the archive in order, chunk by chunk, then
   * completion. A lost chunk is resent from the offset the Hub reports, and a session left unfinished by an earlier run
   * for the same archive is resumed. The Hub answers at once, without a session, when it already has the archive.
   */
  async uploadRelease(input: {
    file: string;
    size: number;
    checksum: string;
    idempotencyKey: string;
    onProgress?: ((message: string) => void) | undefined;
  }): Promise<UploadedRelease> {
    const started = await this.#request(
      'releases/uploads',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ size: input.size, sha256: input.checksum }),
      },
      false,
    );
    if (isRecord(started.release)) return this.#uploaded(started.release);
    let session = this.#session(started.upload);
    if (session.offset > 0)
      input.onProgress?.(
        `Resuming an earlier upload at ${String(Math.floor((session.offset / input.size) * 100))}%.`,
      );
    const handle = await open(input.file, 'r');
    try {
      // Consecutive failures, of a chunk or of the read that finds where to go on after one. Only a chunk that
      // arrives resets it, so a chunk the Hub keeps refusing is not retried for as long as the reads succeed.
      let failures = 0;
      // Whether the Hub's offset has to be read before the next chunk: after a failure that did not report it.
      let stale = false;
      let reported = Math.floor((session.offset / input.size) * 10);
      while (session.offset < input.size) {
        try {
          if (stale) {
            // The Hub keeps only whole chunks, so its offset says where to go on.
            session = {
              ...session,
              offset: this.#session(
                await this.#request(
                  `releases/uploads/${session.uploadId}`,
                  { method: 'GET' },
                  false,
                ),
                session,
              ).offset,
            };
            stale = false;
            continue;
          }
          const length = Math.min(
            session.chunkSize,
            input.size - session.offset,
          );
          const chunk = Buffer.alloc(length);
          const { bytesRead } = await handle.read(
            chunk,
            0,
            length,
            session.offset,
          );
          if (bytesRead !== length)
            throw this.failure(
              'INVALID_ARTIFACT',
              'The archive changed while it was being uploaded.',
              2,
            );
          const next = await this.#request(
            `releases/uploads/${session.uploadId}`,
            {
              method: 'PUT',
              headers: {
                'content-type': 'application/octet-stream',
                'content-length': String(length),
                'upload-offset': String(session.offset),
              },
              body: chunk,
            },
            true,
          );
          session = { ...session, offset: this.#session(next, session).offset };
          failures = 0;
        } catch (error) {
          if (!(error instanceof HubCliError) || !RESUMABLE.has(error.code))
            throw error;
          failures += 1;
          if (failures > MAX_CHUNK_FAILURES) throw error;
          if (error instanceof HubRejection && error.offset !== undefined) {
            // An offset mismatch says where the Hub is; go on from there without asking again.
            session = { ...session, offset: error.offset };
            stale = false;
          } else {
            await delay(1000 * failures);
            stale = true;
          }
        }
        const tenth = Math.floor((session.offset / input.size) * 10);
        if (tenth > reported && session.offset < input.size) {
          reported = tenth;
          input.onProgress?.(`Uploaded ${String(tenth * 10)}%…`);
        }
      }
    } finally {
      await handle.close();
    }
    // A completion whose answer is lost, or that outlasts one request's deadline while the Hub verifies a large
    // archive, is sent again: the Hub answers a completed session with its Release.
    for (let attempt = 1; ; attempt += 1) {
      try {
        return this.#uploaded(
          await this.#request(
            `releases/uploads/${session.uploadId}/complete`,
            {
              method: 'POST',
              headers: { 'idempotency-key': input.idempotencyKey },
            },
            true,
          ),
        );
      } catch (error) {
        if (
          !(error instanceof HubCliError) ||
          (error.code !== 'RESULT_UNKNOWN' && error.code !== 'TIMEOUT') ||
          attempt >= 3
        )
          throw error;
      }
    }
  }

  #uploaded(data: Record<string, unknown>): UploadedRelease {
    const releaseId = data.releaseId;
    if (!isIdentifier(releaseId))
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub did not return a Release ID.',
        3,
      );
    return {
      releaseId,
      version: typeof data.version === 'string' ? data.version : undefined,
      reused: data.reused === true,
    };
  }

  #session(value: unknown, previous?: UploadSession): UploadSession {
    if (
      !isRecord(value) ||
      typeof value.offset !== 'number' ||
      !Number.isSafeInteger(value.offset) ||
      value.offset < 0
    )
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an unreadable upload session.',
        3,
      );
    const uploadId = previous?.uploadId ?? value.uploadId;
    const chunkSize = previous?.chunkSize ?? value.chunkSize;
    if (
      !isIdentifier(uploadId) ||
      typeof chunkSize !== 'number' ||
      !Number.isSafeInteger(chunkSize) ||
      chunkSize < 1
    )
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an unreadable upload session.',
        3,
      );
    return { uploadId, offset: value.offset, chunkSize };
  }

  async deploy(input: {
    releaseId: string;
    config: string | undefined;
    idempotencyKey: string;
  }): Promise<StartedDeployment> {
    const data = await this.#request(
      'deploy',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': input.idempotencyKey,
        },
        body: JSON.stringify({
          releaseId: input.releaseId,
          ...(input.config === undefined
            ? {}
            : { config: { mode: 'file', content: input.config } }),
        }),
      },
      true,
    );
    const operationId = data.operationId;
    if (!isIdentifier(operationId))
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub did not return a deployment ID.',
        3,
      );
    const status = data.status;
    if (!isDeploymentStatus(status))
      throw this.failure('RESULT_UNKNOWN', UNCONFIRMED_DEPLOYMENT, 3);
    return {
      operationId,
      status,
      reused: data.reused === true,
      createdAt:
        typeof data.createdAt === 'string' && data.createdAt
          ? data.createdAt
          : undefined,
    };
  }

  async deploymentStatus(operationId: string): Promise<DeploymentStatus> {
    const data = await this.#request(
      `deployments/${encodeURIComponent(operationId)}/status`,
      { method: 'GET' },
      true,
    );
    if (!isDeploymentStatus(data.status))
      throw this.failure('RESULT_UNKNOWN', UNCONFIRMED_DEPLOYMENT, 3);
    return data.status;
  }

  /**
   * `changes` says whether the request changes something on the Hub. A connection failure on one that does leaves its
   * outcome unknown; on a read it only means the Hub was not reached. Each request has its own deadline.
   */
  async #request(
    relative: string,
    init: RequestInit,
    changes: boolean,
  ): Promise<Record<string, unknown>> {
    const data = await this.#requestAny(relative, init, changes);
    if (!isRecord(data))
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub response is missing its result; the outcome is unknown. Check Hub before retrying with the same idempotency key.',
        3,
      );
    return data;
  }

  async #requestAny(
    relative: string,
    init: RequestInit,
    changes: boolean,
  ): Promise<unknown> {
    let response: Response;
    const signal = AbortSignal.timeout(this.#timeout * 1000);
    try {
      response = await fetch(
        relative ? `${this.#base}/${relative}` : this.#base,
        {
          ...init,
          signal,
          redirect: 'error',
          headers: { ...init.headers, authorization: `Bearer ${this.#apiKey}` },
        },
      );
    } catch {
      if (signal.aborted)
        throw this.failure(
          'TIMEOUT',
          `The Hub did not answer within ${String(this.#timeout)} seconds${changes ? '; the outcome is unknown. Check Hub before retrying with the same idempotency key, or raise --timeout' : '. Check the remote URL and the network, or raise --timeout'}.`,
          3,
        );
      throw changes
        ? this.failure(
            'RESULT_UNKNOWN',
            'Hub could not confirm the result. Retry with the same idempotency key.',
            3,
          )
        : this.failure(
            'HUB_UNREACHABLE',
            'Hub could not be reached. Check the remote URL and the network.',
            1,
          );
    }
    let payload: unknown;
    let readable = true;
    try {
      payload = await response.json();
    } catch {
      readable = false;
    }
    const error =
      !response.ok && isRecord(payload) && isRecord(payload.error)
        ? payload.error
        : undefined;
    const hubCode =
      typeof error?.code === 'string' && /^[A-Z0-9_]+$/.test(error.code)
        ? error.code
        : undefined;
    // The Hub names what it did not find. A 404 that names nothing came from whatever else answers at that address,
    // such as a mistyped mount path, so nothing reached the Hub.
    if (response.status === 404 && hubCode === undefined)
      throw this.failure(
        'HUB_NOT_FOUND',
        `No Hub API answered at ${this.#hub} (404). Check the remote URL.`,
        1,
      );
    if (!readable)
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an unreadable response; the result is unknown.',
        3,
      );
    if (!response.ok) {
      const code = hubCode ?? 'HUB_REQUEST_FAILED';
      const offset = error?.offset;
      // Do not echo raw response text: proxies and remote exceptions can contain credentials.
      throw new HubRejection(
        code,
        `Hub rejected the request (${response.status}, ${code}).`,
        1,
        this.#details(),
        typeof offset === 'number' &&
          Number.isSafeInteger(offset) &&
          offset >= 0
          ? offset
          : undefined,
      );
    }
    if (!isRecord(payload) || payload.data === undefined)
      throw this.failure(
        'INVALID_HUB_RESPONSE',
        'Hub response is missing its result; the outcome is unknown. Check Hub before retrying with the same idempotency key.',
        3,
      );
    return payload.data;
  }
}

const UNCONFIRMED_DEPLOYMENT =
  'Deployment result cannot be confirmed. Check the deployment in Hub before retrying with the same idempotency key.';

export function parseBuildTarget(value: unknown): BuildTarget | null {
  if (
    !isRecord(value) ||
    typeof value.platform !== 'string' ||
    typeof value.arch !== 'string' ||
    typeof value.nodeMajor !== 'number'
  )
    return null;
  return {
    platform: value.platform,
    arch: value.arch,
    libc: value.libc === 'musl' || value.libc === 'glibc' ? value.libc : null,
    nodeAbi: typeof value.nodeAbi === 'number' ? value.nodeAbi : 0,
    nodeMajor: value.nodeMajor,
  };
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value);
}

export function isDeploymentStatus(
  status: unknown,
): status is DeploymentStatus {
  return (
    status === 'queued' ||
    status === 'deploying' ||
    status === 'succeeded' ||
    status === 'failed' ||
    status === 'cancelled'
  );
}
