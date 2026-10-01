// What `hub deploy` and `hub upload` do, without the command line: build for the Hub, upload the archive, deploy the
// Release and wait. Exported for code that publishes without going through the command line, such as the Hub's own
// end-to-end tests.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import {
  buildArguments,
  describeTarget,
  readArchiveTarget,
  sameTarget,
} from './build.ts';
import { HubCliError, type DeploymentStatus } from './errors.ts';
import { HubClient, type BuildTarget } from './hub-client.ts';
import type { RemoteTarget } from './remotes.ts';

/** The archive `nocobase build --tar` writes, relative to the App root. */
export const DEFAULT_ARTIFACT: string = 'storage/exports/dist.tar.gz';

/** The largest archive the Hub's resumable upload accepts. */
export const MAX_ARTIFACT_SIZE: number = 2 * 1024 * 1024 * 1024;

/** How many earlier deployments of one Release and configuration a deployment under the default key steps past. */
const MAX_REDEPLOY_STEPS = 100;

export interface PublishOptions {
  readonly target: RemoteTarget;
  readonly apiKey: string;
  /** The App root: the build runs there and the default archive is found there. */
  readonly root: string;
  /** Where `file` and `config` resolve from. Defaults to the current directory. */
  readonly cwd?: string;
  /**
   * Builds the archive for the Hub, given the `nocobase build` options that target it. Present when the run builds;
   * absent to upload an archive that already exists.
   */
  readonly build?: (buildArguments: readonly string[]) => Promise<void>;
  /** An archive to upload instead of the one the build writes. */
  readonly file?: string;
  /** Deploy this Release instead of uploading. */
  readonly releaseId?: string;
  /** A runtime YAML configuration file to deploy with. */
  readonly config?: string;
  /** Deploy after uploading. */
  readonly deploy: boolean;
  /** Wait for the deployment to finish. Defaults to true. */
  readonly wait?: boolean;
  readonly idempotencyKey?: string;
  /**
   * Deadline for each request to the Hub and for the wait for a deployment, in seconds. Defaults to 600. The build
   * is not counted, nor is the archive transfer as a whole: each chunk is one request.
   */
  readonly timeout?: number;
  /** Called with one line at each step worth telling a person or an agent about. */
  readonly onProgress?: (message: string) => void;
}

/** What `hub upload` reports. */
export interface UploadResult {
  releaseId: string;
  /** SHA-256 of the archive, in hex. */
  checksum: string;
  /** Size of the archive in bytes. */
  size: number;
  /** The version the Hub recorded for the Release; absent when it reported none. */
  version: string | undefined;
  /** The Hub already had this archive and answered with its Release; nothing was uploaded now. */
  reused: boolean;
  idempotencyKey: string;
  /** The target the archive was built for; present when this run built it. */
  buildTarget?: BuildTarget;
}

/** What `hub deploy` reports. */
export interface DeployResult {
  releaseId: string;
  /** Present when this run uploaded the archive, as in `UploadResult`. */
  checksum?: string;
  size?: number;
  version?: string | undefined;
  /** The Hub answered with an earlier deployment for the same idempotency key; nothing was deployed now. */
  reused: boolean;
  operationId: string;
  operationStatus: DeploymentStatus;
  idempotencyKey: string;
  deploymentCreatedAt?: string;
  buildTarget?: BuildTarget;
}

/** A run's result, and the warning it earned when the Hub answered with earlier work instead of doing it now. */
export interface Published<TResult> {
  readonly result: TResult;
  readonly warning: string | undefined;
}

export function publish(
  options: PublishOptions & { deploy: false },
): Promise<Published<UploadResult>>;
export function publish(
  options: PublishOptions & { deploy: true },
): Promise<Published<DeployResult>>;
export async function publish(
  options: PublishOptions,
): Promise<Published<UploadResult | DeployResult>> {
  const cwd = options.cwd ?? process.cwd();
  const timeout = options.timeout ?? 600;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 86400)
    throw new HubCliError(
      'INVALID_TIMEOUT',
      'Timeout must be between 1 and 86400 seconds.',
      2,
    );
  if (
    options.idempotencyKey !== undefined &&
    !/^[A-Za-z0-9._:-]{1,128}$/.test(options.idempotencyKey)
  )
    throw new HubCliError(
      'INVALID_IDEMPOTENCY_KEY',
      'Idempotency key must contain 1–128 letters, digits, dots, underscores, colons or hyphens.',
      2,
    );
  const config =
    options.config === undefined
      ? undefined
      : await readConfig(path.resolve(cwd, options.config));

  if (options.releaseId !== undefined) {
    const client = new HubClient({ ...options, timeout });
    return await deployRelease(client, options, {
      releaseId: options.releaseId,
      config,
      timeout,
    });
  }

  // The build is not under the deadline: it can take minutes, and the deadline is for each request to the Hub.
  let builtFor: BuildTarget | undefined;
  if (options.build !== undefined) {
    const hubTarget = await new HubClient({
      ...options,
      timeout,
    }).getApp();
    if (hubTarget.buildTarget === null)
      throw new HubCliError(
        'BUILD_TARGET_UNAVAILABLE',
        'The Hub did not report the platform it runs Apps on, so the archive cannot be built for it. Build it yourself and deploy it with --file.',
        1,
      );
    builtFor = hubTarget.buildTarget;
    options.onProgress?.(`Building for ${describeTarget(builtFor)}…`);
    await options.build(buildArguments(builtFor));
  }

  const client = new HubClient({ ...options, timeout });
  const file =
    options.file === undefined
      ? path.resolve(options.root, DEFAULT_ARTIFACT)
      : path.resolve(cwd, options.file);
  const { size, checksum } = await describeArchive(file);
  if (builtFor === undefined) {
    // An archive this run did not build is checked here, so a wrong one fails before it is uploaded.
    const [archiveTarget, app] = await Promise.all([
      readArchiveTarget(file),
      client.getApp(),
    ]);
    if (
      archiveTarget !== undefined &&
      app.buildTarget !== null &&
      !sameTarget(archiveTarget, app.buildTarget)
    )
      throw new HubCliError(
        'BUILD_TARGET_MISMATCH',
        `The archive targets ${describeTarget(archiveTarget)}; the Hub runs ${describeTarget(app.buildTarget)}. Rebuild it, or deploy without --no-build or --file to build for the Hub.`,
        2,
      );
  }

  const uploadKey =
    options.deploy || options.idempotencyKey === undefined
      ? checksum
      : options.idempotencyKey;
  client.known.idempotencyKey = uploadKey;
  options.onProgress?.(
    `Uploading ${path.basename(file)} (${formatBytes(size)})…`,
  );
  const uploaded = await client.uploadRelease({
    file,
    size,
    checksum,
    idempotencyKey: uploadKey,
    onProgress: options.onProgress,
  });
  client.known.releaseId = uploaded.releaseId;
  if (!options.deploy) {
    const result: UploadResult = {
      releaseId: uploaded.releaseId,
      checksum,
      size,
      version: uploaded.version,
      reused: uploaded.reused,
      idempotencyKey: uploadKey,
      ...(builtFor === undefined ? {} : { buildTarget: builtFor }),
    };
    return { result, warning: undefined };
  }
  if (uploaded.reused)
    options.onProgress?.(
      `The Hub already has this archive as Release ${uploaded.releaseId}; deploying it.`,
    );
  const deployed = await deployRelease(client, options, {
    releaseId: uploaded.releaseId,
    config,
    timeout,
  });
  return {
    result: {
      ...deployed.result,
      checksum,
      size,
      version: uploaded.version,
      ...(builtFor === undefined ? {} : { buildTarget: builtFor }),
    },
    warning: deployed.warning,
  };
}

async function deployRelease(
  client: HubClient,
  options: PublishOptions,
  input: { releaseId: string; config: string | undefined; timeout: number },
): Promise<Published<DeployResult>> {
  const { releaseId, config } = input;
  let idempotencyKey =
    options.idempotencyKey ??
    createHash('sha256')
      .update(
        `${options.target.appId}:${releaseId}${config === undefined ? '' : ':' + createHash('sha256').update(config).digest('hex')}`,
      )
      .digest('hex');
  client.known.idempotencyKey = idempotencyKey;
  client.known.releaseId = releaseId;
  let started = await client.deploy({ releaseId, config, idempotencyKey });
  // The default key names the Release and configuration, so it also matches an earlier deployment of them that the
  // App has moved on from, as when rolling back. Each such deployment leads to the next key, derived from it, until
  // the Hub answers with the App's latest deployment or creates one: a retry walks the same keys and repeats nothing.
  if (options.idempotencyKey === undefined) {
    for (let step = 0; started.reused && step < MAX_REDEPLOY_STEPS; step++) {
      const [latest] = await client.listDeployments(1);
      if (latest === undefined || latest.operationId === started.operationId)
        break;
      idempotencyKey = createHash('sha256')
        .update(`${idempotencyKey}:${started.operationId}`)
        .digest('hex');
      client.known.idempotencyKey = idempotencyKey;
      started = await client.deploy({ releaseId, config, idempotencyKey });
    }
  }
  client.known.operationId = started.operationId;
  client.known.operationStatus = started.status;
  const result: DeployResult = {
    releaseId,
    reused: started.reused,
    operationId: started.operationId,
    operationStatus: started.status,
    idempotencyKey,
    ...(started.createdAt === undefined
      ? {}
      : { deploymentCreatedAt: started.createdAt }),
  };
  const wait = options.wait ?? true;
  // A reused deployment is checked once even without waiting: reusing confirms its identity, not that it succeeded.
  if (wait || started.reused) {
    if (wait)
      options.onProgress?.(
        `Waiting for deployment ${started.operationId} (up to ${String(input.timeout)}s)…`,
      );
    // The wait as a whole has the deadline; each status request has its own.
    const deadline = AbortSignal.timeout(input.timeout * 1000);
    let reported: DeploymentStatus | undefined;
    for (;;) {
      const status: DeploymentStatus = await client.deploymentStatus(
        started.operationId,
      );
      if (status !== reported) {
        options.onProgress?.(`Deployment ${started.operationId}: ${status}`);
        reported = status;
      }
      result.operationStatus = status;
      client.known.operationStatus = status;
      if (status === 'succeeded') break;
      if (status === 'failed' || status === 'cancelled')
        throw client.failure(
          'DEPLOYMENT_FAILED',
          `Deployment ${started.operationId} ${status}. Inspect it in Hub; deploy again with a new --idempotency-key.`,
          1,
        );
      if (!wait) break;
      try {
        await delay(1000, undefined, { signal: deadline });
      } catch {
        throw client.failure(
          'WAIT_TIMEOUT',
          'Timed out waiting for deployment. The deployment may still complete.',
          3,
        );
      }
    }
  }
  // A reused deployment is history: this run deployed nothing now. Under the default key it is the App's latest
  // deployment; under a given key the App may have moved on to another Release since.
  const warning = !started.reused
    ? undefined
    : options.idempotencyKey === undefined
      ? "The App's latest deployment already deploys this Release and configuration; nothing was deployed now. Pass a new --idempotency-key to deploy it again."
      : 'Hub reused an earlier deployment for this idempotency key; nothing was deployed now. Pass a new --idempotency-key to deploy again.';
  return { result, warning };
}

async function describeArchive(
  file: string,
): Promise<{ size: number; checksum: string }> {
  try {
    const info = await stat(file);
    if (!info.isFile() || info.size < 1 || info.size > MAX_ARTIFACT_SIZE)
      throw new Error('Invalid file');
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(file))
      hash.update(chunk as Uint8Array);
    return { size: info.size, checksum: hash.digest('hex') };
  } catch {
    throw new HubCliError(
      'INVALID_ARTIFACT',
      'The archive must be a readable file between 1 byte and 2 GiB. Deploy without --no-build to build it, or pass --file.',
      2,
    );
  }
}

async function readConfig(filename: string): Promise<string> {
  try {
    const info = await stat(filename);
    if (!info.isFile() || info.size < 1 || info.size > 1024 * 1024)
      throw new Error('Invalid size');
    const content = new TextDecoder('utf-8', { fatal: true }).decode(
      await readFile(filename),
    );
    if (!content.trim()) throw new Error('Empty');
    return content;
  } catch {
    throw new HubCliError(
      'INVALID_CONFIG_FILE',
      'Configuration must be a readable, non-empty UTF-8 file of at most 1 MiB.',
      2,
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}
