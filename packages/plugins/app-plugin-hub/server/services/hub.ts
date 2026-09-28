import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { receiveArtifact, validateIdempotencyKey } from './artifact-upload.js';
import { isPlaceholderSecret } from '@nocobase/app-server/config';
import type { HubApiKeyService } from './api-keys.js';

import { normalizeRuntimeLogging } from '@nocobase/app-server/logging';
import {
  appendJournal,
  readJournal,
  pruneJournals,
  normalizeFileOptions,
  createDiagnosticLogger,
  reportLoggingFailure,
  type Logger,
  type JournalPage,
  type JournalQuery,
} from '@nocobase/logging';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type {
  DeploymentLogListener,
  HostDeploymentSet,
  HostDeploymentSpec,
  HostManagementService,
  HostStatus,
} from '@nocobase/app-host/management';
import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';
import {
  createDriveManager,
  type AppDriveDiskConfig,
  type NocoBaseDriveDisk,
} from '@nocobase/drive';
import type { Knex } from 'knex';
import type { AppHostSupervisorInfo } from '@nocobase/app-host/supervisor';
import { normalizeBasePath } from '@nocobase/app-server/support';
import { x as extractTar } from 'tar';
import {
  parse as parseYaml,
  parseDocument as parseYamlDocument,
  stringify as stringifyYaml,
} from 'yaml';

import type { HubPluginConfig } from '../config.js';
import type {
  CreateHubAppInput,
  CreateHubReleaseInput,
  DeployHubAppInput,
  HubAppDetail,
  HubAppSummary,
  HubAppRecord,
  HubAppPage,
  HubConfigBinding,
  HubConfigDocument,
  HubConfigMode,
  HubDeploymentRecord,
  HubDeploymentListItem,
  HubDeploymentPage,
  HubRuntimeStatus,
  HubReleaseRecord,
  ListHubAppsOptions,
  RollbackHubAppInput,
  HubService,
  SaveHubConfigInput,
  UpdateHubConfigInput,
  UpdateHubSettingsInput,
} from '../tokens.js';

const AUTH_SECRET_BYTES = 32;
const APP_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const RELEASE_VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._+-]{0,254}$/;
const CONFIG_TEMPLATE_PATHS = [
  'config.example.yml',
  'config.example.yaml',
] as const;
const ARTIFACT_MANIFEST_PATHS = ['dist/package.json', 'package.json'] as const;
const EMBEDDED_ENTRY_PATH = 'dist/server/embedded.js';
/**
 * How long a read waits for startup restoration before answering with what the Host knows so far.
 *
 * Restoration starts every eager App in turn, so it lasts as long as the slowest one takes to come up — or forever,
 * when one hangs on its database. Readers wait a little so the catalog does not flash every App as stopped in the
 * first moments after a Hub restart, then answer anyway; an App the Host has not reached yet is reported as pending
 * rather than stopped, and the client keeps polling until the picture settles.
 */
const DEFAULT_STARTUP_RESTORATION_WAIT_MS = 5_000;

export interface DefaultHubServiceOptions {
  readonly apiKeys?: Pick<HubApiKeyService, 'removeAppKeys'>;

  readonly logger?: Logger;
  readonly database: DatabaseManager;
  readonly config: HubPluginConfig;
  readonly hostController: HubHostController;
  readonly publicBasePath?: string;
  /** Upper bound on how long reads wait for startup restoration. Defaults to five seconds. */
  readonly startupRestorationWaitMs?: number;
}

export interface HubHostController {
  getInfo(): Pick<AppHostSupervisorInfo, 'status' | 'targetUrl'>;
  onReady(listener: () => void): () => void;
  restoreDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<{ readonly status: HostStatus }>;
  ensureStarted(): Promise<URL>;
  applyDeploymentSet(
    deploymentSet: HostDeploymentSet,
  ): Promise<{ readonly status: HostStatus }>;
  applyDeployment(
    deployment: HostDeploymentSpec,
    listener?: DeploymentLogListener,
  ): Promise<HostStatus>;
  startDeployment(deployment: HostDeploymentSpec): Promise<HostStatus>;
  stopDeployment(appId: string): Promise<HostStatus>;
  removeDeployment(appId: string): Promise<HostStatus>;
  getManagementClient(): Promise<HostManagementService>;
}

export class HubError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 503,
  ) {
    super(message);
    this.name = 'HubError';
  }
}

export class DefaultHubService implements HubService {
  private readonly diagnostic: ReturnType<typeof createDiagnosticLogger>;
  private readonly disk: NocoBaseDriveDisk;
  private readonly hostController: HubHostController;
  private readonly locks = new Map<string, Promise<unknown>>();
  private revision = 0;
  private currentHostUrl: string | null = null;
  private startupReconciliation: Promise<void> | null = null;
  private unsubscribeHostReady: (() => void) | undefined;

  public constructor(private readonly options: DefaultHubServiceOptions) {
    this.diagnostic = createDiagnosticLogger(options.logger);
    const drive = createDriveManager({
      default: 'artifact',
      disks: { artifact: options.config.artifact },
    });
    this.disk = drive.use('artifact');
    this.hostController = options.hostController;
  }

  public async prepare(): Promise<void> {
    await mkdir(path.dirname(this.options.config.host.configPath), {
      recursive: true,
      mode: 0o700,
    });
    const deployments = this.options.config.logging?.deployments;
    if (deployments?.maxSizeMB !== undefined)
      reportLoggingFailure(
        'hub.logging.deployments.maxSizeMB is deprecated; use maxFileSizeMB',
      );
    normalizeFileOptions({
      retentionDays: deployments?.retentionDays ?? 30,
      maxFileSizeMB: deployments?.maxSizeMB ?? deployments?.maxFileSizeMB ?? 50,
      maxTotalSizeMB: deployments?.maxTotalSizeMB ?? 1024,
    });
    normalizeFileOptions(
      normalizeRuntimeLogging(this.options.config.logging?.apps).file ?? {},
    );
    await this.writeHostConfig();
  }

  private deploymentLogsDir(): string {
    return (
      this.options.config.logging?.deployments?.directory ??
      path.join(
        path.dirname(this.options.config.host.configPath),
        'deployment-logs',
      )
    );
  }

  private desiredConfigsDir(): string {
    return (
      this.options.config.desiredConfigsDir ??
      path.join(
        path.dirname(this.options.config.host.configPath),
        'app-configs',
      )
    );
  }

  private desiredConfigPath(appId: string, deploymentId: string): string {
    return path.join(this.desiredConfigsDir(), appId, `${deploymentId}.yml`);
  }

  private deploymentLogPath(appId: string, deploymentId: string): string {
    if (!APP_ID_PATTERN.test(appId) || !APP_ID_PATTERN.test(deploymentId))
      throw new HubError('Invalid log identity.', 'INVALID_LOG_ID', 400);
    return path.join(this.deploymentLogsDir(), appId, `${deploymentId}.log`);
  }

  private logDeployment(
    deployment: HubDeploymentRecord,
    phase: string,
    msg: string,
    err?: unknown,
  ): void {
    const policy = this.options.config.logging?.deployments;
    if (policy?.enabled === false) return;
    this.appendDeploymentLog(deployment, {
      time: new Date().toISOString(),
      level: err ? 'error' : 'info',
      appId: deployment.appId,
      deploymentId: deployment.id,
      phase,
      msg,
      ...(err ? { err } : {}),
    });
  }

  private appendDeploymentLog(
    deployment: HubDeploymentRecord,
    entry: Parameters<typeof appendJournal>[1],
  ): void {
    try {
      appendJournal(
        this.deploymentLogPath(deployment.appId, deployment.id),
        entry,
        this.options.config.logging?.deployments?.maxSizeMB ??
          this.options.config.logging?.deployments?.maxFileSizeMB ??
          50,
      );
    } catch (error) {
      reportLoggingFailure('Failed to persist deployment log', error);
    }
  }

  public async readLogs(
    appId: string,
    query: JournalQuery = {},
    deploymentId?: string,
  ): Promise<
    JournalPage & { enabled: boolean; status?: string; phase?: string }
  > {
    await this.requireApp(appId);
    if (!APP_ID_PATTERN.test(appId))
      throw new HubError('Invalid app ID.', 'INVALID_APP_ID', 400);
    const deployment = deploymentId
      ? await this.getDeployment(appId, deploymentId)
      : undefined;
    const policy = deployment
      ? this.options.config.logging?.deployments
      : normalizeRuntimeLogging(this.options.config.logging?.apps).file;
    const directory = deployment
      ? path.dirname(this.deploymentLogPath(appId, deployment.id))
      : path.join(
          this.options.config.host.appVolumesDir,
          appId,
          'storage',
          'logs',
        );
    try {
      const base = deployment
        ? path.join(this.deploymentLogsDir())
        : this.options.config.host.appVolumesDir;
      try {
        const canonicalBase = await realpath(base);
        const expected = path.join(
          canonicalBase,
          path.relative(base, directory),
        );
        if ((await realpath(directory)) !== expected)
          throw new HubError(
            'Invalid log directory.',
            'INVALID_LOG_DIRECTORY',
            400,
          );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      await pruneJournals(
        directory,
        {
          retentionDays: policy?.retentionDays ?? (deployment ? 30 : 7),
          maxSizeMB: deployment
            ? (this.options.config.logging?.deployments?.maxTotalSizeMB ?? 1024)
            : (normalizeRuntimeLogging(this.options.config.logging?.apps).file
                ?.maxTotalSizeMB ??
              policy?.maxSizeMB ??
              500),
        },
        deployment && ['queued', 'deploying'].includes(deployment.status)
          ? `${deployment.id}.log`
          : undefined,
      );
      const result = await readJournal(
        directory,
        query,
        deployment ? `${deployment.id}.log` : undefined,
      );
      return {
        ...result,
        enabled: policy?.enabled !== false,
        ...(deployment
          ? {
              status: deployment.status,
              phase:
                typeof result.entries.at(-1)?.phase === 'string'
                  ? (result.entries.at(-1)!.phase as string)
                  : deployment.phase,
            }
          : {}),
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid log cursor')
        throw new HubError(error.message, 'INVALID_LOG_CURSOR', 400);
      throw error;
    }
  }

  public async listApps(): Promise<readonly HubAppSummary[]> {
    const apps = await this.query()
      .selectFrom('hubApps')
      .leftJoin(
        'hubAppDeployments as current',
        'hubApps.currentDeploymentId',
        'current.id',
      )
      .leftJoin('hubAppReleases as release', 'current.releaseId', 'release.id')
      .selectAll('hubApps')
      .select('release.version as currentVersion')
      .orderBy('hubApps.createdAt', 'desc')
      .orderBy('hubApps.id', 'desc')
      .execute<Row>();
    return await this.summarizeApps(apps);
  }

  public async listAppsPage(
    options: ListHubAppsOptions = {},
  ): Promise<HubAppPage> {
    const requestedPage = options.page ?? 1;
    const pageSize = options.pageSize ?? 24;
    if (
      !Number.isSafeInteger(requestedPage) ||
      requestedPage < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      throw new HubError(
        'Page must be a positive integer and pageSize must be between 1 and 100.',
        'INVALID_PAGINATION',
        400,
      );
    }
    const search = options.search?.trim() ?? '';
    if (search.length > 100) {
      throw new HubError(
        'Search must be 100 characters or fewer.',
        'INVALID_SEARCH',
        400,
      );
    }
    const matchingIds = search
      ? await this.findAppIdsBySearch(search)
      : undefined;
    if (matchingIds && matchingIds.length === 0) {
      return { items: [], total: 0, page: 1, pageSize };
    }

    let countQuery = this.query()
      .selectFrom('hubApps')
      .select((eb) => [eb.fn.countAll().as('total')]);
    if (matchingIds) {
      countQuery = countQuery.where('id', 'in', matchingIds);
    }
    if (options.createdBy !== undefined) {
      countQuery = countQuery.where('createdBy', '=', options.createdBy);
    }
    const count = await countQuery.executeTakeFirstOrThrow();
    const total = Number(count.total);
    const page = Math.min(
      requestedPage,
      Math.max(1, Math.ceil(total / pageSize)),
    );
    let appsQuery = this.query()
      .selectFrom('hubApps')
      .leftJoin(
        'hubAppDeployments as current',
        'hubApps.currentDeploymentId',
        'current.id',
      )
      .leftJoin('hubAppReleases as release', 'current.releaseId', 'release.id')
      .selectAll('hubApps')
      .select('release.version as currentVersion')
      .orderBy('hubApps.createdAt', 'desc')
      .orderBy('hubApps.id', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    if (matchingIds) {
      appsQuery = appsQuery.where('hubApps.id', 'in', matchingIds);
    }
    if (options.createdBy !== undefined) {
      appsQuery = appsQuery.where('hubApps.createdBy', '=', options.createdBy);
    }
    const apps = await appsQuery.execute<Row>();
    return {
      items: await this.summarizeApps(apps),
      total,
      page,
      pageSize,
    };
  }

  private async summarizeApps(
    apps: readonly Row[],
  ): Promise<readonly HubAppSummary[]> {
    if (!apps.length) return [];
    const [releases, pending] = await Promise.all([
      this.query()
        .selectFrom('hubAppReleases')
        .select('appId')
        .distinct()
        .where(
          'appId',
          'in',
          apps.map((row) => String(row.id)),
        )
        .execute<Row>(),
      this.query()
        .selectFrom('hubAppDeployments')
        .select('appId')
        .distinct()
        .where(
          'appId',
          'in',
          apps.map((row) => String(row.id)),
        )
        .where('status', 'in', ['queued', 'deploying'])
        .execute<Row>(),
    ]);
    const releasedApps = new Set(releases.map((row) => row.appId));
    const pendingApps = new Set(pending.map((row) => row.appId));
    const status = this.hostStatus();
    return await Promise.all(
      apps.map(async (row): Promise<HubAppSummary> => {
        const app = decodeApp(row);
        return {
          app,
          runtime: await this.runtimeStatus(app.id, status),
          currentVersion:
            typeof row.currentVersion === 'string' ? row.currentVersion : null,
          hasReleases: releasedApps.has(app.id),
          hasPendingDeployment: pendingApps.has(app.id),
          enabled: app.enabled,
          startupMode: app.startupMode,
        };
      }),
    );
  }

  private async findAppIdsBySearch(search: string): Promise<readonly string[]> {
    const connection = this.options.database.connection();
    const physical = await connection.collections.getPhysical('hubApps');
    if (!physical) {
      throw new Error('Hub App schema is unavailable');
    }
    const knex = await connection.client<Knex>();
    // A raw query bypasses the Repository, which is what normally scopes a table to the Collection's schema; without
    // this the search fails on PostgreSQL whenever the application runs in a schema other than the connection default.
    // The searched columns are literals rather than anything derived from the request, and knex binds them as
    // identifiers, so the only untrusted value here is the bound search term.
    const rows = await knex(physical.tableName)
      .withSchema(physical.schema)
      .select('id')
      .whereRaw('lower(??) like lower(?) or lower(??) like lower(?)', [
        'id',
        `%${search}%`,
        'name',
        `%${search}%`,
      ]);
    return (rows as Array<Record<string, unknown>>).map((row) =>
      String(row['id']),
    );
  }

  public async getApp(appId: string): Promise<HubAppDetail> {
    return await this.detail(await this.requireApp(appId));
  }

  public async createApp(
    input: CreateHubAppInput,
    createdBy?: string,
  ): Promise<HubAppDetail> {
    const id = input.id.trim();
    const name = input.name.trim();
    if (!APP_ID_PATTERN.test(id)) {
      throw new HubError(
        'App ID may contain only letters, numbers, underscores, and hyphens.',
        'INVALID_APP_ID',
        422,
      );
    }
    // Managed App Host reserves the /__ namespace for listener-owned routes.
    if (id.startsWith('__')) {
      throw new HubError(
        'App IDs beginning with "__" are reserved by App Host.',
        'INVALID_APP_ID',
        422,
      );
    }
    const basePath = `/${id}`;
    const publicBasePath = normalizeBasePath(this.options.publicBasePath ?? '');
    if (
      publicBasePath === basePath ||
      publicBasePath.startsWith(`${basePath}/`)
    ) {
      throw new HubError(
        'App ID conflicts with the Hub public base path.',
        'INVALID_APP_ID',
        422,
      );
    }
    if (!name) {
      throw new HubError('App name is required.', 'INVALID_APP_NAME', 422);
    }
    if (await this.findApp(id)) {
      throw new HubError(
        'Application ID is unavailable. Choose a different ID; application names may be repeated.',
        'APP_EXISTS',
        409,
      );
    }
    const now = new Date();
    const app: HubAppRecord = {
      id,
      name,
      description: input.description?.trim() || null,
      currentDeploymentId: null,
      enabled: false,
      basePath: `/${id}`,
      backend: 'in-process',
      startupMode: 'eager',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await this.options.database.transaction(async (connection) => {
        if (createdBy) {
          await lockUserForAdministration(connection, createdBy);
          const owner = await connection.query
            .selectFrom('user')
            .select('disabledAt')
            .where('id', '=', createdBy)
            .executeTakeFirst();
          if (!owner || owner.disabledAt != null)
            throw new HubError(
              'The application owner is unavailable.',
              'APP_OWNER_UNAVAILABLE',
              409,
            );
        }
        await connection.query
          .insertInto('hubApps')
          .values({ ...encodeApp(app), createdBy: createdBy ?? null })
          .execute();
      });
    } catch (reason) {
      // A concurrent creator can claim the same ID after the initial check.
      if (await this.findApp(id)) {
        throw new HubError(
          'Application ID is unavailable. Choose a different ID; application names may be repeated.',
          'APP_EXISTS',
          409,
        );
      }
      throw reason;
    }
    return await this.detail(app);
  }

  public async listReleases(
    appId: string,
  ): Promise<readonly HubReleaseRecord[]> {
    await this.requireApp(appId);
    const rows = await this.query()
      .selectFrom('hubAppReleases')
      .selectAll()
      .where('appId', '=', appId)
      .orderBy('createdAt', 'desc')
      .execute<Row>();
    return rows.map(decodeRelease);
  }

  public async getRelease(
    appId: string,
    releaseId: string,
  ): Promise<HubReleaseRecord> {
    const row = await this.query()
      .selectFrom('hubAppReleases')
      .selectAll()
      .where('id', '=', releaseId)
      .where('appId', '=', appId)
      .executeTakeFirst<Row>();
    if (!row) {
      throw new HubError('Release not found.', 'RELEASE_NOT_FOUND', 404);
    }
    return decodeRelease(row);
  }

  public async createRelease(
    appId: string,
    input: CreateHubReleaseInput,
  ): Promise<HubReleaseRecord> {
    validateIdempotencyKey(input.idempotencyKey);
    await this.requireApp(appId);
    const shouldDeploy = input.deploymentIntent === 'explicit';
    if (input.config !== undefined) {
      if (!shouldDeploy)
        throw new HubError(
          'Configuration requires deployment.',
          'CONFIG_REQUIRES_DEPLOY',
          400,
        );
      if (
        !input.config ||
        input.config.mode !== 'file' ||
        typeof input.config.content !== 'string' ||
        !input.config.content.trim() ||
        Buffer.byteLength(input.config.content) > 1024 * 1024
      )
        throw new HubError(
          'A non-empty file configuration of at most 1 MiB is required.',
          'INVALID_DEPLOYMENT_INPUT',
          400,
        );
    }
    const configFingerprint = input.config
      ? sha256(new TextEncoder().encode(input.config.content))
      : null;
    if (input.waitForDeployment && !shouldDeploy)
      throw new HubError(
        'Waiting requires a deployment. Use --deploy with --wait.',
        'WAIT_REQUIRES_DEPLOY',
        400,
      );
    if (shouldDeploy) await input.authorizeDeployment?.();
    const staged = await receiveArtifact(
      input.stream ?? Readable.from(input.bytes ? [input.bytes] : []),
      input.checksum,
    );
    try {
      const metadata = await inspectArtifact(staged.path);
      assertMountableAt(metadata.manifest, `/${appId}`);
      return await this.withLock(`publish:${appId}`, async () => {
        const current = await this.requireApp(appId);
        const existing = await this.existingRelease(
          appId,
          staged.checksum,
          input.idempotencyKey,
          configFingerprint,
          shouldDeploy,
        );
        if (existing) return existing;
        const id = randomUUID();
        const artifactKey = `${appId}/${id}.tar.gz`;
        const release: HubReleaseRecord = {
          id,
          appId,
          artifactKey,
          ...metadata,
          checksum: staged.checksum,
          size: staged.size,
          createdAt: new Date(),
        };
        if (shouldDeploy) await this.requireNoPendingDeployment(appId);
        const deployment = shouldDeploy
          ? await this.buildDeploymentRecord(
              current,
              release,
              'deploy',
              null,
              input.config,
            )
          : null;
        try {
          await this.disk.putStream(
            artifactKey,
            createReadStream(staged.path),
            { visibility: 'private', contentType: 'application/gzip' },
          );
          await this.options.database.transaction(async (connection) => {
            await connection.query
              .updateTable('hubApps')
              .set({ updatedAt: new Date() })
              .where('id', '=', appId)
              .execute();
            if (deployment)
              await this.requireNoPendingDeployment(appId, connection);
            await connection.query
              .insertInto('hubAppReleases')
              .values(encodeRelease(release))
              .execute();
            await connection.query
              .insertInto('hubReleaseChecksums')
              .values({
                appId,
                checksum: staged.checksum,
                releaseId: id,
                operationId: deployment?.id ?? null,
                configFingerprint,
              })
              .execute();
            if (input.idempotencyKey)
              await connection.query
                .insertInto('hubReleaseRequests')
                .values({
                  appId,
                  requestKey: input.idempotencyKey,
                  checksum: staged.checksum,
                  releaseId: id,
                })
                .execute();
            if (deployment)
              await connection.query
                .insertInto('hubAppDeployments')
                .values(encodeDeployment(deployment))
                .execute();
          });
        } catch (error) {
          await this.disk.delete(artifactKey);
          if (deployment?.config.path)
            await rm(deployment.config.path, { force: true });
          // A second Hub writer may have won the database uniqueness race.
          const winner = await this.existingRelease(
            appId,
            staged.checksum,
            input.idempotencyKey,
            configFingerprint,
            shouldDeploy,
          );
          if (winner) return winner;
          throw error;
        }
        if (deployment) this.schedule(deployment);
        return {
          ...release,
          reused: false,
          operationId: deployment?.id ?? null,
        };
      });
    } finally {
      await staged.dispose();
    }
  }

  private async existingRelease(
    appId: string,
    checksum: string,
    requestKey?: string,
    configFingerprint: string | null = null,
    requiresDeployment: boolean = false,
  ): Promise<HubReleaseRecord | null> {
    const request = requestKey
      ? await this.query()
          .selectFrom('hubReleaseRequests')
          .selectAll()
          .where('appId', '=', appId)
          .where('requestKey', '=', requestKey)
          .executeTakeFirst()
      : undefined;
    if (request && request.checksum !== checksum)
      throw new HubError(
        'Idempotency key was used for another artifact.',
        'IDEMPOTENCY_CONFLICT',
        409,
      );
    const canonical = await this.query()
      .selectFrom('hubReleaseChecksums')
      .selectAll()
      .where('appId', '=', appId)
      .where('checksum', '=', checksum)
      .executeTakeFirst();
    if (!canonical) return null;
    if (requiresDeployment && !canonical.operationId)
      throw new HubError(
        `Release ${String(canonical.releaseId)} already exists without a publishing deployment. Use hub deploy --release-id ${String(canonical.releaseId)} to deploy it.`,
        'NO_DEPLOYMENT',
        409,
      );
    if (requiresDeployment && canonical.configFingerprint !== configFingerprint)
      throw new HubError(
        'This artifact was already uploaded with different configuration. Use hub deploy --release-id to change configuration.',
        'IDEMPOTENCY_CONFLICT',
        409,
      );
    if (requestKey && !request) {
      try {
        await this.query()
          .insertInto('hubReleaseRequests')
          .values({
            appId,
            requestKey,
            checksum,
            releaseId: canonical.releaseId,
          })
          .execute();
      } catch (error) {
        const winner = await this.query()
          .selectFrom('hubReleaseRequests')
          .selectAll()
          .where('appId', '=', appId)
          .where('requestKey', '=', requestKey)
          .executeTakeFirst();
        if (!winner) throw error;
        if (winner.checksum !== checksum)
          throw new HubError(
            'Idempotency key was used for another artifact.',
            'IDEMPOTENCY_CONFLICT',
            409,
          );
      }
    }
    return {
      ...(await this.getRelease(appId, String(canonical.releaseId))),
      reused: true,
      operationId:
        typeof canonical.operationId === 'string'
          ? canonical.operationId
          : null,
    };
  }

  public async readConfig(appId: string): Promise<HubConfigDocument> {
    const app = await this.requireApp(appId);
    const deployment = await this.currentDeployment(app);
    if (!deployment) return { mode: 'file', content: '' };
    if (deployment.config.mode !== 'file') {
      return { mode: deployment.config.mode, content: null };
    }
    const configPath = this.configPath(deployment);
    try {
      return {
        mode: 'file',
        content: await readFile(configPath, 'utf8'),
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { mode: 'file', content: '' };
      }
      throw error;
    }
  }

  public async updateConfig(
    appId: string,
    input: UpdateHubConfigInput,
  ): Promise<HubConfigDocument> {
    return await this.withLock(appId, async () => {
      const app = await this.requireApp(appId);
      const deployment = await this.currentDeployment(app);
      if (!deployment || deployment.config.mode !== 'file') {
        throw new HubError(
          'Only active Config file configuration can be edited by Hub.',
          'CONFIG_NOT_EDITABLE',
          409,
        );
      }
      // `readConfig` answers an absent file with empty content, so the editor opens on an App whose `config.yml`
      // is gone and the save that follows has to write one rather than fail on reading what is not there.
      let currentContent: string | undefined;
      try {
        currentContent = await readFile(this.configPath(deployment), 'utf8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      validateYamlConfig(input.content);
      const publishedContent = ensureConfigSecrets(
        input.content,
        currentContent,
      );
      await writeTextAtomic(this.configPath(deployment), publishedContent);
      try {
        const management = await this.hostController.getManagementClient();
        await management.publishAppConfig(appId, publishedContent);
      } catch (error) {
        throw new HubError(
          `Configuration was saved, but runtime configuration reload failed: ${error instanceof Error ? error.message : String(error)}`,
          'CONFIG_RELOAD_FAILED',
          503,
        );
      }
      return await this.readConfig(appId);
    });
  }

  public async deploy(
    appId: string,
    input: DeployHubAppInput,
  ): Promise<HubDeploymentRecord> {
    if (
      !input ||
      typeof input.releaseId !== 'string' ||
      !input.releaseId.trim() ||
      (input.config !== undefined &&
        (!input.config ||
          (input.config.mode !== 'file' && input.config.mode !== 'external') ||
          (input.config.content !== undefined &&
            typeof input.config.content !== 'string')))
    ) {
      throw new HubError(
        'A Release ID and valid deployment configuration are required.',
        'INVALID_DEPLOYMENT_INPUT',
        400,
      );
    }
    validateIdempotencyKey(input.idempotencyKey);
    const fingerprint = sha256(
      new TextEncoder().encode(
        JSON.stringify({
          releaseId: input.releaseId,
          config: input.config
            ? { mode: input.config.mode, content: input.config.content ?? null }
            : null,
        }),
      ),
    );
    return this.withLock(`publish:${appId}`, async () => {
      const app = await this.requireApp(appId);
      const existing = input.idempotencyKey
        ? await this.query()
            .selectFrom('hubDeploymentRequests')
            .selectAll()
            .where('appId', '=', appId)
            .where('requestKey', '=', input.idempotencyKey)
            .executeTakeFirst()
        : undefined;
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          throw new HubError(
            'Idempotency key was used for another deployment.',
            'IDEMPOTENCY_CONFLICT',
            409,
          );
        return {
          ...(await this.getDeployment(appId, String(existing.deploymentId))),
          reused: true,
        };
      }
      await this.requireNoPendingDeployment(appId);
      const release = await this.getRelease(appId, input.releaseId);
      const deployment = await this.buildDeploymentRecord(
        app,
        release,
        'deploy',
        null,
        input.config,
      );
      try {
        await this.options.database.transaction(async (connection) => {
          await connection.query
            .updateTable('hubApps')
            .set({ updatedAt: new Date() })
            .where('id', '=', appId)
            .execute();
          await this.requireNoPendingDeployment(appId, connection);
          await connection.query
            .insertInto('hubAppDeployments')
            .values(encodeDeployment(deployment))
            .execute();
          if (input.idempotencyKey)
            await connection.query
              .insertInto('hubDeploymentRequests')
              .values({
                appId,
                requestKey: input.idempotencyKey,
                fingerprint,
                deploymentId: deployment.id,
              })
              .execute();
        });
      } catch (error) {
        if (deployment.config.path)
          await rm(deployment.config.path, { force: true });
        const winner = input.idempotencyKey
          ? await this.query()
              .selectFrom('hubDeploymentRequests')
              .selectAll()
              .where('appId', '=', appId)
              .where('requestKey', '=', input.idempotencyKey)
              .executeTakeFirst()
          : undefined;
        if (winner) {
          if (winner.fingerprint !== fingerprint)
            throw new HubError(
              'Idempotency key was used for another deployment.',
              'IDEMPOTENCY_CONFLICT',
              409,
            );
          return {
            ...(await this.getDeployment(appId, String(winner.deploymentId))),
            reused: true,
          };
        }
        throw error;
      }
      this.schedule(deployment);
      return { ...deployment, reused: false };
    });
  }

  private async requireNoPendingDeployment(
    appId: string,
    connection?: DatabaseConnection,
  ): Promise<void> {
    const pending = await (connection?.query ?? this.query())
      .selectFrom('hubAppDeployments')
      .select('id')
      .where('appId', '=', appId)
      .where('status', 'in', ['queued', 'deploying'])
      .executeTakeFirst();
    if (pending)
      throw new HubError(
        'A deployment is already in progress.',
        'DEPLOYMENT_IN_PROGRESS',
        409,
      );
  }

  public async rollback(
    appId: string,
    input: RollbackHubAppInput,
  ): Promise<HubDeploymentRecord> {
    return this.withLock(`publish:${appId}`, async () => {
      const app = await this.requireApp(appId);
      await this.requireNoPendingDeployment(appId);
      const target = await this.getDeployment(appId, input.deploymentId);
      if (target.status !== 'succeeded') {
        throw new HubError(
          'Only a successful deployment can be rolled back to.',
          'INVALID_ROLLBACK_TARGET',
          409,
        );
      }
      const release = await this.getRelease(appId, target.releaseId);
      if (input.config && input.config.mode !== target.config.mode) {
        throw new HubError(
          'Rollback configuration mode must match the target deployment.',
          'ROLLBACK_CONFIG_MODE_MISMATCH',
          409,
        );
      }
      const deployment = await this.createDeploymentRecord(
        app,
        release,
        'rollback',
        target.id,
        input.config ?? { mode: target.config.mode },
        target.config,
      );
      this.schedule(deployment);
      return deployment;
    });
  }

  public async updateSettings(
    appId: string,
    input: UpdateHubSettingsInput,
  ): Promise<HubAppDetail> {
    return await this.withLock(`publish:${appId}`, async () => {
      if (input.activation !== undefined) assertActivation(input.activation);
      if (
        input.name !== undefined &&
        (typeof input.name !== 'string' ||
          !input.name.trim() ||
          input.name.trim().length > 255)
      ) {
        throw new HubError(
          'Application name must contain 1 to 255 characters.',
          'INVALID_APP_NAME',
          422,
        );
      }
      await this.awaitStartupRestoration();
      await this.requireApp(appId);
      await this.updateApp(appId, {
        ...(input.activation === undefined
          ? {}
          : { startupMode: input.activation }),
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
      });
      return await this.getApp(appId);
    });
  }

  public async start(appId: string): Promise<HubAppDetail> {
    return await this.withLock(appId, async () => {
      const app = await this.requireApp(appId);
      const deployment = await this.currentDeployment(app);
      if (!deployment) {
        throw new HubError(
          'App must be deployed before it can be started.',
          'APP_NOT_DEPLOYED',
          409,
        );
      }
      await this.updateApp(appId, { enabled: true });
      try {
        // A manual Start activates now but preserves the saved policy used on
        // the next Hub restart.
        const spec = await this.createDeploymentSpec(
          app,
          deployment,
          'running',
        );
        const hostStatus = await this.hostController.startDeployment(spec);
        const status = hostStatus.deployments.find(
          (candidate) => candidate.appId === appId,
        );
        if (!status || status.observedState === 'failed') {
          throw new Error(
            status?.error ?? 'Host did not report deployment status.',
          );
        }
      } catch (error) {
        await this.updateApp(appId, { enabled: false });
        throw new HubError(
          `Start failed: ${error instanceof Error ? error.message : String(error)}`,
          'START_FAILED',
          503,
        );
      }
      return await this.getApp(appId);
    });
  }

  public async stop(appId: string): Promise<HubAppDetail> {
    return await this.withLock(appId, async () => {
      const app = await this.requireApp(appId);
      if (!(await this.currentDeployment(app))) {
        throw new HubError('App is not deployed.', 'APP_NOT_DEPLOYED', 409);
      }
      await this.updateApp(appId, { enabled: false });
      try {
        await this.hostController.stopDeployment(appId);
      } catch (error) {
        await this.updateApp(appId, { enabled: true });
        throw new HubError(
          `Stop failed: ${error instanceof Error ? error.message : String(error)}`,
          'STOP_FAILED',
          503,
        );
      }
      return await this.getApp(appId);
    });
  }

  public async restart(appId: string): Promise<HubAppDetail> {
    return await this.withLock(appId, async () => {
      const app = await this.requireApp(appId);
      const deployment = await this.currentDeployment(app);
      if (!deployment) {
        throw new HubError('App is not deployed.', 'APP_NOT_DEPLOYED', 409);
      }
      const runtime = await this.runtimeStatus(appId);
      if (runtime.state !== 'running') {
        throw new HubError(
          'App must be running before it can be restarted.',
          'APP_NOT_RUNNING',
          409,
        );
      }
      try {
        const status = await (
          await this.hostController.getManagementClient()
        ).restartApp(appId);
        const observed = status.deployments.find(
          (item) => item.appId === appId,
        );
        if (observed?.observedState !== 'running') {
          throw new Error(
            observed?.error ?? 'Host did not report a running application.',
          );
        }
      } catch (error) {
        throw new HubError(
          `Restart failed: ${error instanceof Error ? error.message : String(error)}`,
          'RESTART_FAILED',
          503,
        );
      }
      return await this.getApp(appId);
    });
  }

  public async remove(appId: string): Promise<void> {
    await this.withLock(`publish:${appId}`, () =>
      this.withLock(appId, async () => {
        const app = await this.requireApp(appId);
        const releases = await this.listReleases(appId);
        await this.hostController.removeDeployment(appId);
        await this.options.apiKeys?.removeAppKeys(appId);
        await this.options.database.transaction(async (connection) => {
          for (const table of [
            'hubReleaseChecksums',
            'hubReleaseRequests',
            'hubDeploymentRequests',
          ])
            await connection.query
              .deleteFrom(table)
              .where('appId', '=', appId)
              .execute();
          await connection.query
            .deleteFrom('hubAppReleases')
            .where('appId', '=', appId)
            .execute();
          await connection.query
            .deleteFrom('hubAppDeployments')
            .where('appId', '=', appId)
            .execute();
          await connection.query
            .deleteFrom('hubApps')
            .where('id', '=', app.id)
            .execute();
        });
        await Promise.allSettled([
          ...releases.map((release) => this.disk.delete(release.artifactKey)),
          rm(path.dirname(this.deploymentLogPath(appId, 'cleanup')), {
            recursive: true,
            force: true,
          }),
          rm(path.join(this.desiredConfigsDir(), appId), {
            recursive: true,
            force: true,
          }),
        ]);
      }),
    );
  }

  public async refresh(appId: string): Promise<HubAppDetail> {
    await this.requireApp(appId);
    return await this.getApp(appId);
  }

  public async hostStatus(): Promise<HostStatus> {
    await this.awaitStartupRestoration();
    return await (await this.hostController.getManagementClient()).getStatus();
  }

  /**
   * Wait for startup restoration, but only up to the configured bound.
   *
   * Resolves `true` when no restoration is running or it finished in time, `false` when it is still going and the
   * caller should answer with the Host's current picture instead of blocking on it.
   */
  private async awaitStartupRestoration(): Promise<boolean> {
    const restoration = this.startupReconciliation;
    if (!restoration) return true;
    const waitMs =
      this.options.startupRestorationWaitMs ??
      DEFAULT_STARTUP_RESTORATION_WAIT_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        restoration.then(() => true),
        new Promise<boolean>((resolve) => {
          timer = setTimeout(() => resolve(false), waitMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private isRestoringStartupState(): boolean {
    return this.startupReconciliation !== null;
  }

  public async restoreDesiredState(): Promise<void> {
    await this.prepare();
    const recoveredAt = new Date();
    const interrupted = await this.query()
      .selectFrom('hubAppDeployments')
      .selectAll()
      .where('status', 'in', ['queued', 'deploying'])
      .execute<Row>();
    for (const row of interrupted)
      this.logDeployment(
        decodeDeployment(row),
        'completed',
        'Deployment interrupted by a Hub restart',
        new Error('Hub restarted before deployment completion'),
      );
    await this.query()
      .updateTable('hubAppDeployments')
      .set({
        status: 'failed',
        phase: 'completed',
        error: 'Deployment was interrupted by a Hub restart.',
        finishedAt: recoveredAt,
      })
      .where('status', 'in', ['queued', 'deploying'])
      .execute();
    this.currentHostUrl = (
      await this.hostController.ensureStarted()
    ).toString();
    this.unsubscribeHostReady ??= this.hostController.onReady(() => {
      this.scheduleRestoration();
    });
    this.scheduleRestoration();
  }

  private scheduleRestoration(): void {
    const restoration = this.createDeploymentSet()
      .then((deploymentSet) =>
        this.hostController.restoreDeploymentSet(deploymentSet),
      )
      .then(() => undefined)
      .catch((error: unknown) =>
        this.diagnostic.error('Failed to restore app-host applications', error),
      )
      .finally(() => {
        if (this.startupReconciliation === restoration)
          this.startupReconciliation = null;
      });
    this.startupReconciliation = restoration;
  }

  public async createDeploymentSet(): Promise<HostDeploymentSet> {
    const rows = await this.query()
      .selectFrom('hubApps')
      .selectAll()
      .orderBy('id', 'asc')
      .execute<Row>();
    const specs: HostDeploymentSpec[] = [];
    for (const row of rows) {
      const app = decodeApp(row);
      const deployment = await this.currentDeployment(app);
      if (!deployment) continue;
      specs.push(await this.createDeploymentSpec(app, deployment));
    }
    this.revision += 1;
    return { revision: this.revision, deployments: specs };
  }

  private async createDeploymentSpec(
    app: HubAppRecord,
    deployment: HubDeploymentRecord,
    desiredState: 'running' | 'stopped' = app.enabled ? 'running' : 'stopped',
  ): Promise<HostDeploymentSpec> {
    const release = await this.getRelease(app.id, deployment.releaseId);
    return {
      // Host deployment identity is stable per App. Hub deployment IDs are
      // immutable operation-history identities and must not replace it.
      id: app.id,
      operationId: deployment.id,
      logging: this.options.config.logging?.apps,
      appId: app.id,
      artifact: {
        key: release.artifactKey,
        appId: app.id,
        version: release.version,
        checksum: release.checksum,
      },
      desiredState,
      backend: app.backend,
      activation: app.startupMode,
      basePath: app.basePath,
      config:
        deployment.config.mode === 'file'
          ? {
              provider: 'file',
              revision: deployment.id,
              content: await readFile(this.configPath(deployment), 'utf8'),
            }
          : undefined,
    };
  }

  public hostUrl(): string | null {
    return this.options.config.publicHostUrl ?? this.currentHostUrl;
  }

  public getHostProxyTarget(): URL | null {
    if (!this.options.config.host.enabled) return null;
    const info = this.hostController.getInfo();
    return info.status === 'ready' && info.targetUrl
      ? new URL(info.targetUrl)
      : null;
  }

  public async shutdown(): Promise<void> {
    this.unsubscribeHostReady?.();
    this.unsubscribeHostReady = undefined;
    await this.startupReconciliation;
    await Promise.allSettled(this.locks.values());
    this.currentHostUrl = null;
  }

  private query(): DatabaseConnection['query'] {
    return this.options.database.connection().query;
  }

  private async detail(app: HubAppRecord): Promise<HubAppDetail> {
    const current = await this.currentDeployment(app);
    const [release, pending, currentRelease] = await Promise.all([
      this.query()
        .selectFrom('hubAppReleases')
        .select('id')
        .where('appId', '=', app.id)
        .limit(1)
        .executeTakeFirst<Row>(),
      this.query()
        .selectFrom('hubAppDeployments')
        .select('id')
        .where('appId', '=', app.id)
        .where('status', 'in', ['queued', 'deploying'])
        .limit(1)
        .executeTakeFirst<Row>(),
      current
        ? this.query()
            .selectFrom('hubAppReleases')
            .select('version')
            .where('id', '=', current.releaseId)
            .executeTakeFirst<Row>()
        : undefined,
    ]);
    const runtime = await this.runtimeStatus(app.id);
    return {
      app,
      hasReleases: Boolean(release),
      hasPendingDeployment: Boolean(pending),
      currentVersion:
        typeof currentRelease?.version === 'string'
          ? currentRelease.version
          : null,
      deployment: {
        desiredReleaseId: current?.releaseId ?? null,
        observedReleaseId: current?.releaseId ?? null,
        desiredState: app.enabled ? 'running' : 'stopped',
        observedState: runtime.state,
        activation: app.startupMode,
        basePath: app.basePath,
        config: current?.config ?? { mode: 'file' },
        error: runtime.error,
        updatedAt: current?.finishedAt ?? app.updatedAt,
      },
      runtime,
      hostUrl: this.hostUrl(),
    };
  }

  private async findApp(appId: string): Promise<HubAppRecord | null> {
    const row = await this.query()
      .selectFrom('hubApps')
      .selectAll()
      .where('id', '=', appId)
      .executeTakeFirst<Row>();
    return row ? decodeApp(row) : null;
  }

  private async requireApp(appId: string): Promise<HubAppRecord> {
    const app = await this.findApp(appId);
    if (!app) throw new HubError('App not found.', 'APP_NOT_FOUND', 404);
    return app;
  }

  public async listDeployments(
    appId: string,
    options: { page?: number; pageSize?: number } = {},
  ): Promise<HubDeploymentPage> {
    const requestedPage = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    if (
      !Number.isSafeInteger(requestedPage) ||
      requestedPage < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      throw new HubError(
        'Page must be a positive integer and pageSize must be between 1 and 100.',
        'INVALID_PAGINATION',
        400,
      );
    }
    await this.requireApp(appId);
    const count = await this.query()
      .selectFrom('hubAppDeployments')
      .select((eb) => [eb.fn.countAll().as('total')])
      .where('appId', '=', appId)
      .executeTakeFirstOrThrow();
    const total = Number(count.total);
    const page = Math.min(
      requestedPage,
      Math.max(1, Math.ceil(total / pageSize)),
    );
    const rows = await this.query()
      .selectFrom('hubAppDeployments')
      .leftJoin(
        'hubAppReleases as release',
        'hubAppDeployments.releaseId',
        'release.id',
      )
      .selectAll('hubAppDeployments')
      .select([
        'release.version as releaseVersion',
        'release.checksum as releaseChecksum',
      ])
      .where('hubAppDeployments.appId', '=', appId)
      .orderBy('hubAppDeployments.createdAt', 'desc')
      .orderBy('hubAppDeployments.id', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute<Row>();
    const items: HubDeploymentListItem[] = rows.map((row) => ({
      ...decodeDeployment(row),
      release:
        typeof row.releaseVersion === 'string'
          ? {
              version: row.releaseVersion,
              checksum: String(row.releaseChecksum),
            }
          : null,
    }));
    return { items, total, page, pageSize };
  }

  public async getDeployment(
    appId: string,
    deploymentId: string,
  ): Promise<HubDeploymentRecord> {
    const row = await this.query()
      .selectFrom('hubAppDeployments')
      .selectAll()
      .where('appId', '=', appId)
      .where('id', '=', deploymentId)
      .executeTakeFirst<Row>();
    if (!row) {
      throw new HubError('Deployment not found.', 'DEPLOYMENT_NOT_FOUND', 404);
    }
    return decodeDeployment(row);
  }

  private async updateDeployment(
    deploymentId: string,
    values: Partial<HubDeploymentRecord>,
  ): Promise<void> {
    await this.query()
      .updateTable('hubAppDeployments')
      .set(encodePartialDeployment(values))
      .where('id', '=', deploymentId)
      .execute();
  }

  private async updateApp(
    appId: string,
    values: Partial<HubAppRecord>,
  ): Promise<void> {
    await this.query()
      .updateTable('hubApps')
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where('id', '=', appId)
      .execute();
  }

  private configPath(deployment: HubDeploymentRecord): string {
    return (
      deployment.config.path ??
      path.join(
        this.options.config.host.appVolumesDir,
        deployment.appId,
        'config.yml',
      )
    );
  }

  private async currentDeployment(
    app: HubAppRecord,
  ): Promise<HubDeploymentRecord | null> {
    return app.currentDeploymentId
      ? await this.getDeployment(app.id, app.currentDeploymentId)
      : null;
  }

  private async runtimeStatus(
    appId: string,
    snapshot?: Promise<HostStatus>,
  ): Promise<HubRuntimeStatus> {
    try {
      const status = await (snapshot ?? this.hostStatus());
      const item = status.deployments.find(
        (candidate) => candidate.appId === appId,
      );
      if (!item)
        return {
          hostAvailable: true,
          // The Host knows nothing about this App yet. During startup restoration that means it simply has not been
          // reached in the eager start sequence, so it is pending rather than stopped.
          state: this.isRestoringStartupState() ? 'pending' : 'stopped',
          version: null,
          startedAt: null,
          lastAccessedAt: null,
          activeRequests: 0,
          hostRevision: status.reconciledRevision,
          error: null,
        };
      return {
        hostAvailable: true,
        state: item.app?.state === 'active' ? 'running' : item.observedState,
        version: item.app?.desiredVersion ?? null,
        startedAt: item.app?.createdAt ?? null,
        lastAccessedAt: item.app?.lastAccessedAt ?? null,
        activeRequests: item.app?.activeRequests ?? 0,
        hostRevision: item.revision,
        error:
          item.app?.state === 'active'
            ? (item.app.lastError ?? null)
            : (item.error ?? item.app?.lastError ?? null),
      };
    } catch (error) {
      return {
        hostAvailable: false,
        state: 'unknown',
        version: null,
        startedAt: null,
        lastAccessedAt: null,
        activeRequests: 0,
        hostRevision: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async createDeploymentRecord(
    app: HubAppRecord,
    release: HubReleaseRecord,
    kind: 'deploy' | 'rollback',
    rollbackTargetDeploymentId: string | null,
    configInput?: SaveHubConfigInput,
    configBinding?: HubConfigBinding,
  ): Promise<HubDeploymentRecord> {
    const deployment = await this.buildDeploymentRecord(
      app,
      release,
      kind,
      rollbackTargetDeploymentId,
      configInput,
      configBinding,
    );
    await this.query()
      .insertInto('hubAppDeployments')
      .values(encodeDeployment(deployment))
      .execute();
    return deployment;
  }

  private async buildDeploymentRecord(
    app: HubAppRecord,
    release: HubReleaseRecord,
    kind: 'deploy' | 'rollback',
    rollbackTargetDeploymentId: string | null,
    configInput?: SaveHubConfigInput,
    configBinding?: HubConfigBinding,
  ): Promise<HubDeploymentRecord> {
    const id = randomUUID();
    const config = await this.prepareDeploymentConfig(
      app,
      release,
      id,
      configInput,
      configBinding,
    );
    const deployment: HubDeploymentRecord = {
      id,
      appId: app.id,
      releaseId: release.id,
      kind,
      rollbackTargetDeploymentId,
      previousDeploymentId: app.currentDeploymentId,
      status: 'queued',
      phase: 'queued',
      config,
      cacheHit: null,
      hostRevision: null,
      error: null,
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
    };
    return deployment;
  }

  private async prepareDeploymentConfig(
    app: HubAppRecord,
    release: HubReleaseRecord,
    deploymentId: string,
    input?: SaveHubConfigInput,
    binding?: HubConfigBinding,
  ): Promise<HubConfigBinding> {
    const active = app.currentDeploymentId
      ? await this.getDeployment(app.id, app.currentDeploymentId)
      : null;
    const mode = binding?.mode ?? input?.mode ?? active?.config.mode ?? 'file';
    assertConfigMode(mode);
    if (mode === 'external') return { mode };
    let content = input?.content;
    let currentContent: string | undefined;
    if (app.currentDeploymentId) {
      const current = await this.getDeployment(app.id, app.currentDeploymentId);
      if (current.config.mode === 'file') {
        try {
          currentContent = await readFile(this.configPath(current), 'utf8');
          content ??= currentContent;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      }
    }
    // A Release template initializes a new App; it must never replace a
    // configuration that the App is already using.
    content ??= release.configTemplate ?? undefined;
    content ??= '';
    content = ensureConfigSecrets(content, currentContent);
    validateYamlConfig(content);
    const configPath = path.join(this.desiredConfigPath(app.id, deploymentId));
    await writeTextAtomic(configPath, content);
    return { mode: 'file', path: configPath };
  }

  private schedule(deployment: HubDeploymentRecord): void {
    this.logDeployment(deployment, 'queued', 'Deployment queued');
    void this.withLock(deployment.appId, () =>
      this.runDeployment(deployment.id),
    ).catch(() => undefined);
  }

  private async getDeploymentById(
    deploymentId: string,
  ): Promise<HubDeploymentRecord> {
    const row = await this.query()
      .selectFrom('hubAppDeployments')
      .selectAll()
      .where('id', '=', deploymentId)
      .executeTakeFirst<Row>();
    if (!row)
      throw new HubError('Deployment not found.', 'DEPLOYMENT_NOT_FOUND', 404);
    return decodeDeployment(row);
  }

  private async runDeployment(deploymentId: string): Promise<void> {
    const deployment = await this.getDeploymentById(deploymentId);
    const app = await this.requireApp(deployment.appId);
    const previous = await this.currentDeployment(app);
    let rejectedByHost = false;
    let phaseWrites = Promise.resolve();
    let lastSequence = 0;
    let phaseError: Error | undefined;
    await this.updateDeployment(deploymentId, {
      status: 'deploying',
      phase: 'resolving',
      startedAt: new Date(),
      error: null,
      previousDeploymentId: app.currentDeploymentId,
    });
    try {
      this.logDeployment(deployment, 'resolving', 'Deployment started');
      const hostStatus = await this.hostController.applyDeployment(
        await this.createDeploymentSpec(
          { ...app, enabled: true },
          deployment,
          'running',
        ),
        this.options.config.logging?.deployments?.enabled === false
          ? undefined
          : (entry) => {
              if (typeof entry.sequence === 'number') {
                if (entry.sequence <= lastSequence) return;
                lastSequence = entry.sequence;
              }
              if (typeof entry.phase === 'string') {
                const phase = entry.phase as HubDeploymentRecord['phase'];
                phaseWrites = phaseWrites
                  .then(() => this.updateDeployment(deploymentId, { phase }))
                  .then(() => undefined)
                  .catch((error: unknown) => {
                    phaseError =
                      error instanceof Error ? error : new Error(String(error));
                  });
              }
              this.appendDeploymentLog(deployment, {
                ...entry,
                appId: app.id,
                deploymentId: deployment.id,
              });
            },
      );
      await phaseWrites;
      if (phaseError) throw phaseError;
      const observed = hostStatus.deployments.find(
        (candidate) => candidate.appId === app.id,
      );
      if (!observed || observed.observedState === 'failed') {
        rejectedByHost = observed?.observedState === 'failed' && !observed.app;
        throw new Error(
          observed?.error ?? 'Host did not report deployment status.',
        );
      }
      this.logDeployment(deployment, 'completed', 'Deployment succeeded');
      const finishedAt = new Date();
      await this.options.database.transaction(async (connection) => {
        await connection.query
          .updateTable('hubAppDeployments')
          .set({
            status: 'succeeded',
            phase: 'completed',
            cacheHit: observed.cacheHit,
            hostRevision: observed.revision,
            finishedAt,
          })
          .where('id', '=', deploymentId)
          .execute();
        await connection.query
          .updateTable('hubApps')
          .set({
            currentDeploymentId: deploymentId,
            enabled: true,
            updatedAt: finishedAt,
          })
          .where('id', '=', app.id)
          .execute();
      });
      if (previous) await this.removeDeploymentConfig(previous);
    } catch (error) {
      await phaseWrites.catch(() => undefined);
      try {
        this.logDeployment(deployment, 'completed', 'Deployment failed', error);
      } catch (logError) {
        reportLoggingFailure(
          'Failed to persist deployment failure log',
          logError,
        );
      }
      await this.updateDeployment(deploymentId, {
        status: 'failed',
        phase: 'completed',
        error: error instanceof Error ? error.message : String(error),
        finishedAt: new Date(),
      });
      // An IPC failure can occur after activation. Keep the candidate file
      // unless the host has explicitly reported that the deployment failed.
      if (rejectedByHost) await this.removeDeploymentConfig(deployment);
    } finally {
      const policy = this.options.config.logging?.deployments;
      await pruneJournals(
        path.dirname(this.deploymentLogPath(app.id, deployment.id)),
        {
          retentionDays: policy?.retentionDays ?? 30,
          maxSizeMB: policy?.maxTotalSizeMB ?? 1024,
        },
        `${deployment.id}.log`,
      ).catch((error: unknown) =>
        reportLoggingFailure('Deployment log cleanup failed', error),
      );
    }
  }

  private async removeDeploymentConfig(
    deployment: HubDeploymentRecord,
  ): Promise<void> {
    if (deployment.config.mode !== 'file') return;
    const ownedPath = path.join(
      this.desiredConfigPath(deployment.appId, deployment.id),
    );
    if (deployment.config.path !== ownedPath) return;
    // Cleanup must not turn a successful deployment into a failed one.
    await rm(ownedPath, { force: true }).catch(() => undefined);
  }

  private async writeHostConfig(): Promise<void> {
    const document = {
      host: {
        mode: 'managed',
        ...(this.options.config.host.logging
          ? { logging: this.options.config.host.logging }
          : {}),
        server: { host: '127.0.0.1', port: 3000 },
        artifact: normalizeArtifactConfig(this.options.config.artifact),
        appRevisionsDir: this.options.config.host.appRevisionsDir,
        appVolumesDir: this.options.config.host.appVolumesDir,
      },
    };
    await writeStructuredConfigAtomic(
      this.options.config.host.configPath,
      document,
    );
  }

  private async withLock<T>(appId: string, work: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(appId) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(work);
    this.locks.set(appId, current);
    try {
      return await current;
    } finally {
      if (this.locks.get(appId) === current) this.locks.delete(appId);
    }
  }
}

function normalizeArtifactConfig(
  artifact: AppDriveDiskConfig,
): AppDriveDiskConfig {
  return artifact.driver === 'fs'
    ? { ...artifact, location: path.resolve(artifact.location) }
    : artifact;
}

/**
 * A build from before relocatable builds records the mount path its client was compiled for, and serves pages whose
 * asset URLs all miss anywhere else. The Hub mounts every application at `/<appId>`, so such a build is refused unless
 * it was built for exactly that path. A current build records `relocatable` and runs at any path; a build too old to
 * record either is let through, as it always was, since nothing says where it belongs.
 */
function assertMountableAt(
  manifest: Record<string, unknown>,
  basePath: string,
): void {
  const nocobase = isRecord(manifest.nocobase) ? manifest.nocobase : undefined;
  if (!nocobase || nocobase.relocatable === true) return;
  const builtFor = nocobase.basePath;
  if (typeof builtFor !== 'string') return;
  if (normalizeBasePath(builtFor) === normalizeBasePath(basePath)) return;
  throw new HubError(
    `The artifact was built for the base path ${normalizeBasePath(builtFor) || '/'}, but the Hub mounts this application at ${basePath}. Build it again with a current @nocobase/app-cli, which runs at any path.`,
    'BASE_PATH_MISMATCH',
    422,
  );
}

async function inspectArtifact(archivePath: string): Promise<{
  readonly version: string;
  readonly configTemplate: string | null;
  readonly manifest: Record<string, unknown>;
}> {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-hub-artifact-'),
  );
  try {
    // tar invokes filter from stream callbacks, outside the extraction promise.
    // Skip rejected entries and throw only after extraction has settled so that
    // callers can handle the error and temporary files can be cleaned safely.
    let validationError: HubError | undefined;
    await extractTar({
      cwd: directory,
      file: archivePath,
      gzip: true,
      preservePaths: false,
      strict: true,
      filter: (entryPath, entry): boolean => {
        if (validationError) return false;
        const normalized = path.posix.normalize(
          entryPath.replaceAll('\\', '/'),
        );
        if (
          path.posix.isAbsolute(normalized) ||
          normalized === '..' ||
          normalized.startsWith('../')
        ) {
          validationError = new HubError(
            `Artifact contains unsafe path "${entryPath}".`,
            'UNSAFE_ARTIFACT',
            422,
          );
          return false;
        }
        const selected =
          ARTIFACT_MANIFEST_PATHS.includes(
            normalized as (typeof ARTIFACT_MANIFEST_PATHS)[number],
          ) ||
          CONFIG_TEMPLATE_PATHS.includes(
            normalized as (typeof CONFIG_TEMPLATE_PATHS)[number],
          ) ||
          normalized === EMBEDDED_ENTRY_PATH;
        if (
          selected &&
          (!('type' in entry ? entry.type === 'File' : entry.isFile()) ||
            entry.size > 16 * 1024 * 1024)
        ) {
          validationError = new HubError(
            'Artifact metadata and entry point must be regular files no larger than 16 MiB.',
            'INVALID_ARTIFACT',
            422,
          );
          return false;
        }
        return selected;
      },
    });
    if (validationError) throw validationError;
    const manifestPath = await findArtifactManifest(directory);
    await assertRegularArtifactFile(directory, EMBEDDED_ENTRY_PATH);
    const packageMetadata = JSON.parse(
      await readFile(path.join(directory, manifestPath), 'utf8'),
    ) as Record<string, unknown>;
    const appMetadata = isRecord(packageMetadata.app)
      ? packageMetadata.app
      : undefined;
    const rawVersion = appMetadata?.version ?? packageMetadata.version;
    if (
      typeof rawVersion !== 'string' ||
      !RELEASE_VERSION_PATTERN.test(rawVersion)
    ) {
      throw new HubError(
        'Artifact package.json must contain a valid version.',
        'INVALID_ARTIFACT_VERSION',
        422,
      );
    }
    const configTemplateFile = await readConfigTemplate(
      directory,
      CONFIG_TEMPLATE_PATHS,
    );
    const configTemplate = configTemplateFile?.content ?? null;
    if (configTemplateFile) {
      validateYamlConfig(configTemplateFile.content);
    }
    return { version: rawVersion, configTemplate, manifest: packageMetadata };
  } catch (error) {
    if (error instanceof HubError) throw error;
    throw new HubError(
      `Invalid release artifact: ${error instanceof Error ? error.message : String(error)}`,
      'INVALID_ARTIFACT',
      422,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function findArtifactManifest(directory: string): Promise<string> {
  for (const manifestPath of ARTIFACT_MANIFEST_PATHS) {
    try {
      const stats = await lstat(path.join(directory, manifestPath));
      if (!stats.isFile()) {
        throw new HubError(
          `Artifact entry "${manifestPath}" must be a regular file.`,
          'INVALID_ARTIFACT',
          422,
        );
      }
      return manifestPath;
    } catch (error) {
      if (
        error instanceof HubError ||
        (error as NodeJS.ErrnoException).code !== 'ENOENT'
      ) {
        throw error;
      }
    }
  }
  throw new HubError(
    'Artifact must contain dist/package.json or package.json.',
    'INVALID_ARTIFACT',
    422,
  );
}

async function writeStructuredConfigAtomic(
  filePath: string,
  content: Record<string, unknown>,
): Promise<void> {
  await writeTextAtomic(filePath, serializeConfigDocument(filePath, content));
}

async function writeTextAtomic(
  filePath: string,
  content: string,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  await chmod(path.dirname(filePath), 0o700);
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, ensureTrailingNewline(content), {
      mode: 0o600,
      flag: 'wx',
    });
    await chmod(temporary, 0o600);
    await rename(temporary, filePath);
  } finally {
    await rm(temporary, { force: true });
  }
}

function serializeConfigDocument(
  filePath: string,
  content: Record<string, unknown>,
): string {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.json') return `${JSON.stringify(content, null, 2)}\n`;
  if (extension === '.yml' || extension === '.yaml') {
    return stringifyYaml(content);
  }
  throw new HubError(
    `Unsupported config file extension "${extension || '(none)'}".`,
    'UNSUPPORTED_CONFIG_FILE',
    422,
  );
}

async function readOptionalArtifactText(
  directory: string,
  relativePath: string,
): Promise<string | null> {
  const filePath = path.join(directory, relativePath);
  try {
    const stats = await lstat(filePath);
    if (!stats.isFile()) {
      throw new HubError(
        `Artifact entry "${relativePath}" must be a regular file.`,
        'INVALID_ARTIFACT',
        422,
      );
    }
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function readConfigTemplate(
  directory: string,
  relativePaths: readonly string[],
): Promise<{ readonly path: string; readonly content: string } | null> {
  const matches: { path: string; content: string }[] = [];
  for (const relativePath of relativePaths) {
    const content = await readOptionalArtifactText(directory, relativePath);
    if (content !== null) matches.push({ path: relativePath, content });
  }
  if (matches.length > 1) {
    throw new HubError(
      `Release artifact must contain at most one config example; found ${matches.map((match) => match.path).join(', ')}.`,
      'INVALID_ARTIFACT',
      422,
    );
  }
  return matches[0] ?? null;
}

function validateYamlConfig(content: string): void {
  try {
    const value: unknown =
      content.trim() === '' ? {} : (parseYaml(content) as unknown);
    if (!isRecord(value)) throw new Error('the YAML root must be an object');
  } catch (error) {
    throw new HubError(
      `Invalid config.yml: ${error instanceof Error ? error.message : String(error)}`,
      'INVALID_CONFIG_FILE',
      422,
    );
  }
}

function ensureConfigSecrets(
  content: string,
  fallbackContent?: string,
): string {
  const document = parseYamlDocument(content);
  if (document.errors.length > 0) {
    throw new HubError(
      `Invalid config.yml: ${document.errors[0]?.message ?? 'Invalid YAML.'}`,
      'INVALID_CONFIG_FILE',
      422,
    );
  }
  const value: unknown =
    content.trim() === '' ? {} : (document.toJS() as unknown);
  if (!isRecord(value)) {
    throw new HubError(
      'Invalid config.yml: the YAML root must be an object.',
      'INVALID_CONFIG_FILE',
      422,
    );
  }

  const previous: unknown = fallbackContent ? parseYaml(fallbackContent) : {};
  let changed = false;
  for (const key of ['auth', 'session'] as const) {
    const section = value[key];
    const oldSection = isRecord(previous) ? previous[key] : undefined;
    const oldSecret = isRecord(oldSection) ? oldSection.secret : undefined;
    const fallback =
      typeof oldSecret === 'string' &&
      oldSecret.trim().length > 0 &&
      !isPlaceholderSecret(oldSecret)
        ? oldSecret
        : undefined;
    if (section !== undefined && !isRecord(section)) continue;
    const secret = isRecord(section) ? section.secret : undefined;
    if (
      typeof secret === 'string' &&
      secret.trim().length > 0 &&
      !isPlaceholderSecret(secret)
    )
      continue;
    // Preserve invalid non-string values for the runtime's configuration errors.
    if (secret !== undefined && typeof secret !== 'string') continue;
    document.setIn([key, 'secret'], fallback ?? generateAuthSecret());
    changed = true;
  }
  return changed ? ensureTrailingNewline(document.toString()) : content;
}

function generateAuthSecret(): string {
  return randomBytes(AUTH_SECRET_BYTES).toString('base64url');
}

function assertConfigMode(mode: unknown): asserts mode is HubConfigMode {
  if (mode !== 'file' && mode !== 'external') {
    throw new HubError(
      'Configuration mode must be file or external.',
      'INVALID_CONFIG_MODE',
      422,
    );
  }
}

function assertActivation(
  activation: unknown,
): asserts activation is 'lazy' | 'eager' {
  if (activation !== 'lazy' && activation !== 'eager') {
    throw new HubError(
      'Activation policy must be lazy or eager.',
      'INVALID_ACTIVATION_POLICY',
      422,
    );
  }
}

async function assertRegularArtifactFile(
  directory: string,
  relativePath: string,
): Promise<void> {
  const stats = await lstat(path.join(directory, relativePath));
  if (!stats.isFile()) {
    throw new HubError(
      `Artifact entry "${relativePath}" must be a regular file.`,
      'INVALID_ARTIFACT',
      422,
    );
  }
}

function ensureTrailingNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`;
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function decodeApp(row: Row): HubAppRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    description: nullableString(row.description),
    currentDeploymentId: nullableString(row.currentDeploymentId),
    enabled: Boolean(row.enabled),
    basePath: String(row.basePath),
    backend: 'in-process',
    startupMode: row.startupMode === 'lazy' ? 'lazy' : 'eager',
    createdAt: decodeDate(row.createdAt),
    updatedAt: decodeDate(row.updatedAt),
  };
}

function decodeRelease(row: Row): HubReleaseRecord {
  return {
    id: String(row.id),
    appId: String(row.appId),
    version: String(row.version),
    artifactKey: String(row.artifactKey),
    checksum: String(row.checksum),
    size: Number(row.size),
    configTemplate: nullableString(row.configTemplate),
    manifest: decodeNullableRecord(row.manifest),
    createdAt: decodeDate(row.createdAt),
  };
}

function decodeDeployment(row: Row): HubDeploymentRecord {
  return {
    id: String(row.id),
    appId: String(row.appId),
    releaseId: String(row.releaseId),
    kind: row.kind === 'rollback' ? 'rollback' : 'deploy',
    rollbackTargetDeploymentId: nullableString(row.rollbackTargetDeploymentId),
    previousDeploymentId: nullableString(row.previousDeploymentId),
    status: String(row.status) as HubDeploymentRecord['status'],
    phase: String(row.phase) as HubDeploymentRecord['phase'],
    config: decodeConfigBinding(row.config),
    cacheHit: row.cacheHit == null ? null : Boolean(row.cacheHit),
    hostRevision: row.hostRevision == null ? null : Number(row.hostRevision),
    error: nullableString(row.error),
    createdAt: decodeDate(row.createdAt),
    startedAt: row.startedAt == null ? null : decodeDate(row.startedAt),
    finishedAt: row.finishedAt == null ? null : decodeDate(row.finishedAt),
  };
}

function encodeRelease(release: HubReleaseRecord): Row {
  return {
    ...release,
    manifest: release.manifest ? JSON.stringify(release.manifest) : null,
  };
}

function encodeApp(app: HubAppRecord): Row {
  return { ...app };
}

function encodeDeployment(deployment: HubDeploymentRecord): Row {
  return { ...deployment, config: JSON.stringify(deployment.config) };
}

function encodePartialDeployment(values: Partial<HubDeploymentRecord>): Row {
  return {
    ...values,
    ...(values.config ? { config: JSON.stringify(values.config) } : {}),
  };
}

function decodeJson(value: unknown): unknown {
  return typeof value === 'string' ? (JSON.parse(value) as unknown) : value;
}

function decodeNullableRecord(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  const decoded = decodeJson(value);
  return isRecord(decoded) ? decoded : null;
}

function decodeConfigBinding(value: unknown): HubConfigBinding {
  const decoded = decodeJson(value);
  if (!isRecord(decoded)) return { mode: 'file' };
  if (decoded.mode === 'external') {
    return { mode: 'external' };
  }
  if (decoded.mode === 'file' || decoded.provider === 'file') {
    return {
      mode: 'file',
      ...(typeof decoded.path === 'string' ? { path: decoded.path } : {}),
    };
  }
  return { mode: 'file' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  throw new Error('Expected a scalar database value.');
}

function decodeDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string' && /^\d+$/u.test(value)) {
    return new Date(Number(value));
  }
  return new Date(String(value));
}
