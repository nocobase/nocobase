import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseEnv } from 'node:util';

export interface PublishingOptions {
  hub?: string;
  'api-key'?: string;
  'app-id'?: string;
  file?: string;
  config?: string;
  'release-id'?: string;
  'idempotency-key'?: string;
  deploy?: boolean;
  wait?: boolean;
  timeout?: number;
  /**
   * Called with one line at each step worth telling a person or an agent about while the command runs: the upload
   * starting, the deployment being accepted, and each change of deployment status while it waits. Not a flag.
   */
  onProgress?: (message: string) => void;
}

export type ReleaseOperation = 'upload' | 'deploy';

/** A deployment status the Hub reports. Anything else is an unconfirmed result. */
export type DeploymentStatus =
  'queued' | 'deploying' | 'succeeded' | 'failed' | 'cancelled';

/**
 * What a run had established when it failed: enough to retry with the same idempotency key, or to find the deployment
 * in Hub. Present only on a failure after the request to Hub was prepared.
 */
export interface PublishingErrorDetails {
  idempotencyKey?: string;
  releaseId?: string;
  operationId?: string;
  operationStatus?: DeploymentStatus;
}

export class PublishingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly exitCode: number,
    public readonly details?: PublishingErrorDetails | undefined,
  ) {
    super(message);
  }
}

/** What an upload reports: `hub upload`, and `hub deploy` without `--release-id`. */
export interface ReleaseUploadResult {
  releaseId: string;
  /** SHA-256 of the archive, in hex. */
  checksum: string;
  /** Size of the archive in bytes. */
  size: number;
  /** The version the Hub recorded for the Release; absent when it reported none. */
  version: string | undefined;
  /** The Hub answered with an existing Release, and its deployment when the upload deploys, instead of creating one. */
  reused: boolean;
  /** The deployment the upload started; `null` for an upload that does not deploy. */
  operationId: string | null;
  idempotencyKey: string;
  /** The deployment's last status; present only when the command checked it. */
  operationStatus?: DeploymentStatus;
}

/** What deploying a Release already on the Hub reports: `hub deploy --release-id`. */
export interface ReleaseDeployResult {
  releaseId: string;
  operationId: string;
  operationStatus: DeploymentStatus;
  idempotencyKey: string;
  /** Present when the Hub answered with an earlier deployment for the same retry identity. */
  reused?: true;
  /** When the Hub created the deployment; present when it reported it. */
  deploymentCreatedAt?: string;
}

/** A publishing run's result, and the warning it earned when the Hub reused an earlier deployment. */
export interface PublishedRelease<TResult> {
  readonly result: TResult;
  readonly warning: string | undefined;
}

/** The archive `nocobase build --tar` writes, relative to the App root. */
export const DEFAULT_ARTIFACT: string = 'storage/exports/dist.tar.gz';

const UNCONFIRMED_DEPLOYMENT =
  'Deployment result cannot be confirmed. Check the deployment in Hub before retrying with the same idempotency key.';

/**
 * HTTP-only tooling. It never initializes the application or reads Hub storage.
 *
 * `root` is the App root: its `.env` is read, and the default artifact is found there. A path the caller passes in
 * `file` or `config` resolves from `cwd` instead, as any command-line path does.
 */
export async function publishToHub(
  operation: 'upload' | 'deploy',
  options: PublishingOptions,
  root: string,
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): Promise<Record<string, unknown>> {
  const { result, warning } = await publishRelease(
    operation,
    options,
    root,
    env,
    cwd,
  );
  return warning === undefined ? { ...result } : { ...result, warning };
}

/**
 * `publishToHub` with a typed result, and with the warning about a reused deployment kept apart from it. The hub
 * commands report through this: the result becomes the command's result and the warning one of its warnings.
 */
export function publishRelease(
  operation: 'upload',
  options: PublishingOptions,
  root: string,
  env?: NodeJS.ProcessEnv,
  cwd?: string,
): Promise<PublishedRelease<ReleaseUploadResult>>;
export function publishRelease(
  operation: 'deploy',
  options: PublishingOptions,
  root: string,
  env?: NodeJS.ProcessEnv,
  cwd?: string,
): Promise<PublishedRelease<ReleaseDeployResult>>;
export function publishRelease(
  operation: ReleaseOperation,
  options: PublishingOptions,
  root: string,
  env?: NodeJS.ProcessEnv,
  cwd?: string,
): Promise<PublishedRelease<ReleaseUploadResult | ReleaseDeployResult>>;
export async function publishRelease(
  operation: ReleaseOperation,
  options: PublishingOptions,
  root: string,
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): Promise<PublishedRelease<ReleaseUploadResult | ReleaseDeployResult>> {
  // Parse locally so application configuration never mutates the CLI process environment.
  let fileEnv: NodeJS.ProcessEnv = {};
  try {
    fileEnv = parseEnv(await readFile(path.join(root, '.env'), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      throw new PublishingError(
        'INVALID_ENV_FILE',
        'Cannot read the App root .env file.',
        2,
      );
  }
  const hub = options.hub ?? env.HUB_URL ?? fileEnv.HUB_URL;
  const apiKey = options['api-key'] ?? env.HUB_API_KEY ?? fileEnv.HUB_API_KEY;
  const appId = options['app-id'] ?? env.HUB_APP_ID ?? fileEnv.HUB_APP_ID;
  if (!hub || !apiKey || !appId)
    throw new PublishingError(
      'MISSING_CONFIGURATION',
      'Provide --hub, --app-id and --api-key, or set HUB_URL, HUB_APP_ID and HUB_API_KEY in the environment or App root .env file.',
      2,
    );
  if (!/^[A-Za-z0-9_-]+$/.test(appId) || /[\r\n]/.test(apiKey))
    throw new PublishingError(
      'INVALID_CONFIGURATION',
      'Invalid App ID or API key.',
      2,
    );
  let base: URL;
  try {
    base = new URL(hub);
  } catch {
    throw new PublishingError(
      'INVALID_HUB_URL',
      'Hub URL must be an absolute HTTP(S) application URL.',
      2,
    );
  }
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new PublishingError(
      'INVALID_HUB_URL',
      'Hub URL must be HTTP(S), without credentials, query or fragment.',
      2,
    );
  const wait =
    options.wait ?? (operation === 'deploy' || options.deploy === true);
  const timeout = options.timeout ?? 600;
  if (!Number.isFinite(timeout) || timeout <= 0 || timeout > 86400)
    throw new PublishingError(
      'INVALID_TIMEOUT',
      'Timeout must be between 1 and 86400 seconds.',
      2,
    );
  if (operation === 'upload' && options.wait && !options.deploy)
    throw new PublishingError(
      'WAIT_REQUIRES_DEPLOY',
      'Use --deploy with --wait when uploading.',
      2,
    );
  if (
    options['idempotency-key'] !== undefined &&
    !/^[A-Za-z0-9._:-]{1,128}$/.test(options['idempotency-key'])
  )
    throw new PublishingError(
      'INVALID_IDEMPOTENCY_KEY',
      'Idempotency key must contain 1–128 letters, digits, dots, underscores, colons or hyphens.',
      2,
    );
  if (operation === 'upload' && options.config !== undefined && !options.deploy)
    throw new PublishingError(
      'CONFIG_REQUIRES_DEPLOY',
      'Use --deploy with --config when uploading.',
      2,
    );
  let config: { mode: 'file'; content: string } | undefined;
  if (options.config !== undefined) {
    try {
      if (!options.config.trim()) throw new Error('Empty path');
      const filename = path.resolve(cwd, options.config);
      const info = await stat(filename);
      if (!info.isFile() || info.size < 1 || info.size > 1024 * 1024)
        throw new Error('Invalid size');
      const content = new TextDecoder('utf-8', { fatal: true }).decode(
        await readFile(filename),
      );
      if (!content.trim() || Buffer.byteLength(content) > 1024 * 1024)
        throw new Error('Invalid content');
      config = { mode: 'file', content };
    } catch {
      throw new PublishingError(
        'INVALID_CONFIG_FILE',
        'Configuration must be a readable, non-empty UTF-8 file of at most 1 MiB.',
        2,
      );
    }
  }
  // What the run has established so far. A failure from here on carries it, so the caller can retry with the same
  // idempotency key or find the deployment in Hub.
  const known: PublishingErrorDetails = {};
  const failure = (
    code: string,
    message: string,
    exitCode: number,
  ): PublishingError =>
    new PublishingError(
      code,
      message,
      exitCode,
      Object.keys(known).length > 0 ? { ...known } : undefined,
    );
  base.pathname = `${base.pathname.replace(/\/$/, '')}/api/hub/apps/${encodeURIComponent(appId)}/`;
  const signal = AbortSignal.timeout(timeout * 1000);
  const request = async (
    relative: string,
    init: RequestInit,
  ): Promise<Record<string, unknown>> => {
    let response: Response;
    try {
      response = await fetch(new URL(relative, base), {
        ...init,
        signal,
        redirect: 'error',
        headers: { ...init.headers, authorization: `Bearer ${apiKey}` },
      });
    } catch {
      throw failure(
        'RESULT_UNKNOWN',
        'Hub could not confirm the result. Retry with the same idempotency key.',
        3,
      );
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an unreadable response; the result is unknown.',
        3,
      );
    }
    if (!response.ok) {
      const error =
        isRecord(payload) && isRecord(payload.error)
          ? payload.error
          : undefined;
      const code =
        typeof error?.code === 'string' && /^[A-Z0-9_]+$/.test(error.code)
          ? error.code
          : 'HUB_REQUEST_FAILED';
      // Do not echo raw response text: proxies and remote exceptions can contain credentials.
      throw failure(
        code,
        `Hub rejected the request (${response.status}, ${code}).`,
        1,
      );
    }
    if (!isRecord(payload) || !isRecord(payload.data))
      throw failure(
        'INVALID_HUB_RESPONSE',
        'Hub response is missing its result; the outcome is unknown. Check Hub before retrying with the same idempotency key.',
        3,
      );
    return payload.data;
  };
  let result: ReleaseUploadResult | ReleaseDeployResult;
  if (operation === 'upload') {
    const file =
      options.file === undefined
        ? path.resolve(root, DEFAULT_ARTIFACT)
        : path.resolve(cwd, options.file);
    let size: number;
    let checksum: string;
    try {
      const info = await stat(file);
      if (!info.isFile() || info.size < 1 || info.size > 256 * 1024 * 1024)
        throw new Error('Invalid file');
      size = info.size;
      const hash = createHash('sha256');
      for await (const chunk of createReadStream(file))
        hash.update(chunk as Uint8Array);
      checksum = hash.digest('hex');
    } catch {
      throw new PublishingError(
        'INVALID_ARTIFACT',
        'Artifact must be a readable file between 1 byte and 256 MiB. Run pnpm build --tar first, or pass --file.',
        2,
      );
    }
    const requestKey = options['idempotency-key'] ?? checksum;
    known.idempotencyKey = requestKey;
    const stream = createReadStream(file);
    // A bounded UTF-8 configuration prefix keeps the archive streaming and unchanged.
    const configBytes = config
      ? Buffer.from(config.content, 'utf8')
      : undefined;
    const body = configBytes
      ? Readable.from(
          (async function* () {
            yield configBytes;
            yield* stream;
          })(),
        )
      : stream;
    // Observe errors before fetch starts, including on an unconsumed config body.
    const streamsFinished = Promise.allSettled(
      [...new Set([stream, body])].map((uploadStream) =>
        finished(uploadStream, { cleanup: true }),
      ),
    );
    let data: Record<string, unknown>;
    options.onProgress?.(
      `Uploading ${path.basename(file)} (${formatBytes(size)})…`,
    );
    try {
      const init: RequestInit & { duplex: 'half' } = {
        method: 'POST',
        duplex: 'half',
        body: body,
        headers: {
          'content-type': configBytes
            ? 'application/vnd.nocobase.release-upload.v1'
            : 'application/gzip',
          'content-length': String(size + (configBytes?.byteLength ?? 0)),
          ...(configBytes
            ? { 'x-hub-config-length': String(configBytes.byteLength) }
            : {}),
          'x-artifact-sha256': checksum,
          'idempotency-key': requestKey,
          ...(options.deploy ? { 'x-hub-deployment-intent': 'explicit' } : {}),
          ...(wait ? { 'x-hub-wait': 'true' } : {}),
        },
      };
      data = await request('releases', init);
    } finally {
      body.destroy();
      stream.destroy();
      // destroy() can return before the pending file open and close complete.
      // Cleanup errors must not replace the classified Hub request result.
      await streamsFinished;
    }
    const releaseId = data.releaseId;
    if (!isIdentifier(releaseId))
      throw failure(
        'INVALID_HUB_RESPONSE',
        'Hub did not return a Release ID.',
        3,
      );
    known.releaseId = releaseId;
    const operationId = data.operationId;
    if (
      (options.deploy && operationId === undefined) ||
      (operationId != null && !isIdentifier(operationId))
    )
      throw failure(
        'INVALID_HUB_RESPONSE',
        'Hub returned an invalid deployment ID; the result is unknown.',
        3,
      );
    if (options.deploy && operationId == null)
      throw failure(
        'NO_DEPLOYMENT',
        'Hub did not confirm a deployment. Use hub deploy --release-id to deploy an existing Release.',
        1,
      );
    if (isIdentifier(operationId)) known.operationId = operationId;
    result = {
      releaseId,
      checksum,
      size,
      version: typeof data.version === 'string' ? data.version : undefined,
      reused: data.reused === true,
      operationId: isIdentifier(operationId) ? operationId : null,
      idempotencyKey: requestKey,
    };
  } else {
    const releaseId = options['release-id'];
    if (!releaseId)
      throw new PublishingError('MISSING_RELEASE', 'Provide --release-id.', 2);
    const requestKey =
      options['idempotency-key'] ??
      createHash('sha256')
        .update(
          `${appId}:${releaseId}${config ? ':' + createHash('sha256').update(config.content).digest('hex') : ''}`,
        )
        .digest('hex');
    known.idempotencyKey = requestKey;
    known.releaseId = releaseId;
    const data = await request('deploy', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': requestKey,
      },
      body: JSON.stringify({
        releaseId,
        ...(config ? { config } : {}),
      }),
    });
    const operationId = data.operationId;
    if (!isIdentifier(operationId))
      throw failure(
        'INVALID_HUB_RESPONSE',
        'Hub did not return a deployment ID.',
        3,
      );
    known.operationId = operationId;
    const status = data.status;
    if (!isDeploymentStatus(status))
      throw failure('RESULT_UNKNOWN', UNCONFIRMED_DEPLOYMENT, 3);
    known.operationStatus = status;
    if (status === 'failed' || status === 'cancelled')
      throw failure(
        'DEPLOYMENT_FAILED',
        `Deployment ${operationId} ${status}. Use a new idempotency key to retry deployment.`,
        1,
      );
    const createdAt = data.createdAt;
    result = {
      releaseId,
      operationId,
      operationStatus: status,
      idempotencyKey: requestKey,
      ...(data.reused === true ? { reused: true as const } : {}),
      ...(typeof createdAt === 'string' && createdAt
        ? { deploymentCreatedAt: createdAt }
        : {}),
    };
  }
  // Reusing an operation confirms its identity, not that it can still succeed.
  const checkUploadRetry =
    operation === 'upload' && options.deploy && result.reused === true;
  if (wait || checkUploadRetry) {
    const operationId = result.operationId;
    if (typeof operationId !== 'string')
      throw failure(
        'NO_DEPLOYMENT',
        'Release already exists without a deployment. Use hub deploy --release-id to deploy it.',
        1,
      );
    if (wait) {
      options.onProgress?.(
        `Waiting for deployment ${operationId} (up to ${timeout}s)…`,
      );
    }
    let reported: DeploymentStatus | undefined;
    while (true) {
      const state = await request(
        `deployments/${encodeURIComponent(operationId)}/status`,
        { method: 'GET' },
      );
      const status = state.status;
      if (!isDeploymentStatus(status))
        throw failure('RESULT_UNKNOWN', UNCONFIRMED_DEPLOYMENT, 3);
      if (status !== reported) {
        options.onProgress?.(`Deployment ${operationId}: ${status}`);
        reported = status;
      }
      result.operationStatus = status;
      known.operationStatus = status;
      if (status === 'succeeded') break;
      if (status === 'failed' || status === 'cancelled')
        throw failure(
          'DEPLOYMENT_FAILED',
          `Deployment ${operationId} ${status}. Inspect it in Hub.`,
          1,
        );
      if (!wait) break;
      try {
        await delay(1000, undefined, { signal });
      } catch {
        throw failure(
          'WAIT_TIMEOUT',
          'Timed out waiting for deployment. The deployment may still complete.',
          3,
        );
      }
    }
  }
  // A reused operation is history: this command did not deploy anything now, and the App may be
  // running another Release. Reusing a retry identity is deliberate, so this warns rather than fails.
  const warning =
    result.reused === true &&
    (operation === 'deploy' || options.deploy === true)
      ? operation === 'deploy'
        ? 'Hub reused an earlier deployment for this Release and configuration; nothing was deployed now. Pass a new --idempotency-key to deploy again.'
        : 'Hub reused an existing Release and its deployment; nothing was deployed now. Pass a new --idempotency-key to publish again.'
      : undefined;
  return { result, warning };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value);
}

function isDeploymentStatus(status: unknown): status is DeploymentStatus {
  return (
    status === 'queued' ||
    status === 'deploying' ||
    status === 'succeeded' ||
    status === 'failed' ||
    status === 'cancelled'
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}
