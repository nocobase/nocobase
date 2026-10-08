/**
 * Apps, releases and deployments. Adapted from the Hub plugin's service: uploads are deduplicated by checksum and made
 * idempotent by key, every deploy and rollback is an immutable deployment record with phases and a log, configuration
 * starts from the release's `config.example.yml` with generated secrets, and the runtime is reached only through the
 * environment's driver session.
 */
import { randomUUID, createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import type { AppRuntimeLogging } from '@nocobase/app-server/logging';
import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';
import {
  createDriveManager,
  type AppDriveDiskConfig,
  type NocoBaseDriveDisk,
} from '@nocobase/drive';
import {
  appendJournal,
  createDiagnosticLogger,
  pruneJournals,
  readJournal,
  reportLoggingFailure,
  type JournalPage,
  type JournalQuery,
  type Logger,
} from '@nocobase/logging';
import type { Knex } from 'knex';
import { parse as parseYaml } from 'yaml';

import { BUSINESS_ACTIONS, type AppAction } from '../../shared/access.js';
import { RESERVED_VARIABLE_NAMES } from '../../shared/releases.js';
import type {
  ActorKind,
  AppActivation,
  AppPage,
  AppSummary,
  AppView,
  ConfigDocument,
  ConfigMode,
  CreateAppInput,
  DeployInput,
  DeploymentArtifact,
  DeploymentPage,
  DeploymentPhase,
  DeploymentStatus,
  DeploymentView,
  EnvironmentRecord,
  Labels,
  AppVariablesMeta,
  EnvironmentDeclaredVariableView,
  AppVariableView,
  InitialAdminView,
  RegisterImageReleaseInput,
  ReleaseKind,
  ReleaseVariable,
  ReleaseVariablesManifest,
  ReleaseView,
  RollbackInput,
  RuntimeStatus,
  SetAppVariableInput,
  UpdateAppInput,
} from '../../shared/releases.js';
import {
  AccessGuard,
  SYSTEM_CALLER,
  actorOf,
  type Caller,
} from '../access/caller.js';
import {
  capabilitiesFor,
  type AppDeploymentSpec,
  type AppObservedStatus,
  type DeploymentEvent,
  type DriverSession,
  type ImageArtifact,
  type RegistryAuth,
} from '../drivers/types.js';
import { ReleasesError, forbidden, notFound } from '../errors.js';
import {
  RELEASE_VERSION_PATTERN,
  assertMountableAt,
  inspectArtifact,
  receiveArtifact,
  validateIdempotencyKey,
} from './artifact.js';
import {
  decodeDate,
  decodeLabels,
  decodeOptionalDate,
  decodeRecord,
  iso,
  matchesLabels,
  nullableNumber,
  nullableString,
} from './codec.js';
import {
  CONFIG_SECRET_PATHS,
  MAX_CONFIG_BYTES,
  assertConfigSize,
  ensureConfigSecrets,
  ensurePublicOrigin,
  validateYamlConfig,
  writeTextAtomic,
  type ConfigSecretSection,
} from './config-file.js';
import { maskConfig, restoreConfigSecrets } from './config-secrets.js';
import type { EnvironmentService } from './environments.js';
import type { ReleasesEventBus } from './events.js';
import type { RegistryService } from './registries.js';
import {
  ReleaseArtifactStore,
  normalizeImage,
  type ImageArtifactView,
} from './release-artifacts.js';
import { decryptText, encryptText, type ReleasesSecrets } from './secrets.js';
import {
  DEFAULT_INITIAL_ADMIN,
  INITIAL_ADMIN_PATHS,
  PUBLIC_ORIGIN_PATH,
  SAMPLE_DATA_PATH,
  appVariableView,
  assertVariableName,
  assertVariableValue,
  configValueAt,
  decodeVariablesManifest,
  generateVariable,
  hasRealValue,
  isSecretName,
  parseVariablesManifest,
  randomPassword,
  resolveVariables,
  type ResolvedVariables,
  type StoredAppVariable,
  type StoredEnvironmentVariable,
  type VariableStore,
} from './variables.js';
import {
  APP_ID_PATTERN,
  assertAppId,
  assertPagination,
  normalizeLabels,
  normalizeName,
  normalizeRuntimePolicy,
} from './validation.js';

const DEFAULT_STARTUP_WAIT_MS = 5_000;

export interface ReleasesServiceOptions {
  readonly database: DatabaseManager;
  readonly environments: EnvironmentService;
  readonly registries: RegistryService;
  readonly guard: AccessGuard;
  readonly events: ReleasesEventBus;
  readonly artifact: AppDriveDiskConfig;
  readonly dataDir: string;
  readonly maxArtifactBytes?: number;
  readonly logging?: {
    readonly deployments?: {
      readonly enabled?: boolean;
      readonly retentionDays?: number;
      readonly maxFileSizeMB?: number;
      readonly maxTotalSizeMB?: number;
    };
    readonly apps?: AppRuntimeLogging;
  };
  /** Paths this application serves itself, which no App may be mounted over (`/` + its public base path). */
  readonly reservedBasePath?: string;
  /** This application's origin, which an App served under a path of it takes as its own. */
  readonly publicOrigin?: string | null;
  /** The environments' and Apps' variables. */
  readonly variables: VariableStore;
  /** Seals what a deployment keeps of its variables and its first administrator. */
  readonly secrets?: ReleasesSecrets;
  readonly logger?: Logger;
}

/** An App row as the services use it. */
export interface AppRecord {
  readonly id: string;
  readonly environmentId: string;
  readonly name: string;
  readonly description: string | null;
  readonly currentDeploymentId: string | null;
  readonly enabled: boolean;
  readonly activation: AppActivation;
  readonly idleStopMinutes: number | null;
  readonly dormantAfterHours: number | null;
  readonly labels: Labels;
  /** The App this App is a preview of, removed with it. */
  readonly previewOf: string | null;
  readonly createdBy: string | null;
  readonly createdVia: ActorKind;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ReleaseRecord {
  readonly id: string;
  readonly appId: string;
  readonly kind: ReleaseKind;
  readonly version: string;
  /** The archive on the artifact disk; null for an image release. */
  readonly artifactKey: string | null;
  readonly checksum: string;
  readonly size: number | null;
  readonly configTemplate: string | null;
  readonly manifest: Record<string, unknown>;
  /** The build's variables manifest; null without one. */
  readonly variables: ReleaseVariablesManifest | null;
  readonly labels: Labels;
  readonly sourceReleaseId: string | null;
  readonly sourceCommit: string | null;
  readonly build: string | null;
  readonly createdBy: string | null;
  readonly createdVia: ActorKind;
  readonly createdAt: Date;
}

export interface DeploymentRecord {
  readonly id: string;
  readonly appId: string;
  readonly releaseId: string;
  readonly kind: 'deploy' | 'rollback';
  readonly rollbackTargetDeploymentId: string | null;
  readonly previousDeploymentId: string | null;
  readonly status: DeploymentStatus;
  readonly phase: DeploymentPhase;
  readonly configMode: ConfigMode;
  readonly configPath: string | null;
  readonly error: string | null;
  readonly actorId: string | null;
  readonly actorKind: ActorKind;
  readonly requestId: string | null;
  readonly artifactKind: DeploymentArtifact['kind'] | null;
  readonly imageRef: string | null;
  readonly imageDigest: string | null;
  readonly imagePlatform: string | null;
  /** The variables it runs with, sealed; null for one made before variables, or with none. */
  readonly env: string | null;
  readonly variablesFingerprint: string | null;
  /** The first administrator it generated, sealed; cleared once saved or expired. */
  readonly initialAdmin: string | null;
  readonly initialAdminExpiresAt: Date | null;
  readonly initialAdminSavedBy: string | null;
  readonly initialAdminSavedAt: Date | null;
  readonly createdAt: Date;
  readonly startedAt: Date | null;
  readonly finishedAt: Date | null;
}

export interface UploadReleaseInput {
  readonly stream: AsyncIterable<Uint8Array>;
  readonly checksum?: string;
  readonly idempotencyKey?: string;
  readonly labels?: Labels;
  /** The commit the archive was built from (a hash). */
  readonly sourceCommit?: string;
  /** The build that produced it, such as a CI run's URL or ID. */
  readonly build?: string;
  /** Deploy the release once stored, with this configuration when given. */
  readonly deploy?: {
    readonly config?: { readonly mode: ConfigMode; readonly content?: string };
  };
  /**
   * A release of another App this upload may be (staging's, for a production upload): when the archive's checksum is
   * that release's and the caller may view its App, that release is promoted into this App (`promoteRelease`, with
   * this upload's labels) instead of storing the upload as a release of its own. Not with `deploy`.
   */
  readonly promoteFrom?: { readonly appId: string; readonly releaseId: string };
}

export interface ListAppsOptions {
  readonly search?: string;
  readonly environmentId?: string;
  readonly labels?: Labels;
  readonly page?: number;
  readonly pageSize?: number;
}

/** What a deployment needs beyond the release, when the request service starts one after approval. */
export interface StartDeploymentOptions {
  readonly kind: 'deploy' | 'rollback';
  readonly rollbackTargetDeploymentId?: string | null;
  readonly requestId?: string | null;
}

export class ReleasesService {
  private readonly diagnostic: ReturnType<typeof createDiagnosticLogger>;
  private readonly disk: NocoBaseDriveDisk;
  private readonly artifacts: ReleaseArtifactStore;
  private readonly locks = new Map<string, Promise<unknown>>();
  private readonly sessions = new Map<string, Promise<DriverSession>>();
  private readonly running = new Set<Promise<unknown>>();
  /** The in-process run of each deployment under way, so a waiter also sees what finishing it announces. */
  private readonly runs = new Map<string, Promise<unknown>>();
  private restoring: Promise<void> | null = null;
  private closed = false;

  public constructor(private readonly options: ReleasesServiceOptions) {
    this.diagnostic = createDiagnosticLogger(options.logger);
    this.artifacts = new ReleaseArtifactStore(options.database);
    this.disk = createDriveManager({
      default: 'artifact',
      disks: { artifact: options.artifact },
    }).use('artifact');
  }

  // --- Apps ---------------------------------------------------------------------------------------------------

  public async listApps(
    caller: Caller,
    options: ListAppsOptions = {},
  ): Promise<AppPage> {
    const filter = await this.options.guard.appFilter(caller, 'view');
    if (!filter) throw forbidden();
    const requestedPage = options.page ?? 1;
    const pageSize = options.pageSize ?? 24;
    assertPagination(requestedPage, pageSize);
    const search = options.search?.trim() ?? '';
    if (search.length > 100)
      throw new ReleasesError(
        'Search must be 100 characters or fewer.',
        'INVALID_SEARCH',
        'INVALID_ARGUMENT',
      );
    const searchIds = search
      ? await this.findAppIdsBySearch(search)
      : undefined;
    let query = this.query()
      .selectFrom('relApps')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc');
    // An empty list matches nothing: `id IS NULL` never holds, and unlike a placeholder id it needs no value
    // (PostgreSQL refuses a NUL character in a text parameter) and suits any column type.
    if (searchIds)
      query = query.where((eb) =>
        searchIds.length > 0
          ? eb('id', 'in', [...searchIds])
          : eb('id', 'is', null),
      );
    if (options.environmentId)
      query = query.where('environmentId', '=', options.environmentId);
    const only = filter.only;
    if (only)
      query = query.where((eb) =>
        only.length > 0 ? eb('id', 'in', [...only]) : eb('id', 'is', null),
      );
    if (!filter.all) {
      const { createdBy, ids } = filter;
      query = query.where((eb) =>
        eb.or([
          eb('createdBy', 'in', [...createdBy]),
          ids.length > 0 ? eb('id', 'in', [...ids]) : eb('id', 'is', null),
        ]),
      );
    }
    // Labels are opaque JSON, matched here rather than in SQL.
    const rows = (await query.execute<Row>())
      .map(decodeApp)
      .filter((app) => matchesLabels(app.labels, options.labels));
    const total = rows.length;
    const page = Math.min(
      requestedPage,
      Math.max(1, Math.ceil(total / pageSize)),
    );
    const slice = rows.slice((page - 1) * pageSize, page * pageSize);
    return { items: await this.summarize(slice), total, page, pageSize };
  }

  public async getApp(caller: Caller, appId: string): Promise<AppSummary> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'view', app);
    const allowed: AppAction[] = [];
    for (const action of BUSINESS_ACTIONS['rel.apps'])
      if (
        action !== 'create' &&
        (await this.options.guard.canApp(caller, action, app))
      )
        allowed.push(action);
    const variables = await this.appVariablesOf(app).catch(() => null);
    return {
      ...(await this.summarize([app]))[0],
      allowed,
      ...(variables
        ? {
            variables: {
              missing: variables.resolved.missing.map((item) => item.name),
              changed: variables.resolved.changed,
            },
          }
        : {}),
    };
  }

  public async createApp(
    caller: Caller,
    input: CreateAppInput,
  ): Promise<AppSummary> {
    this.options.guard.requireCreate(caller);
    if (!input || typeof input.id !== 'string')
      throw new ReleasesError(
        'An App ID is required.',
        'INVALID_APP_ID',
        'INVALID_ARGUMENT',
      );
    const id = input.id.trim();
    assertAppId(id);
    const reserved = this.options.reservedBasePath ?? '';
    if (reserved && (reserved === `/${id}` || reserved.startsWith(`/${id}/`)))
      throw new ReleasesError(
        'App ID conflicts with this application’s own path.',
        'INVALID_APP_ID',
        'INVALID_ARGUMENT',
      );
    const name = normalizeName(input.name, 'INVALID_APP_NAME');
    const labels = normalizeLabels(input.labels);
    const previewOf = await this.previewTarget(caller, input.previewOf);
    if (typeof input.environmentId !== 'string')
      throw new ReleasesError(
        'Choose an environment.',
        'INVALID_ENVIRONMENT_ID',
        'INVALID_ARGUMENT',
      );
    const environment = await this.options.environments.record(
      input.environmentId,
    );
    // The environment's driver must be available to take an App.
    await this.options.environments.driverEnvironment(environment.id);
    // Left out, the idle stop and dormancy are the environment's defaults.
    const policy = normalizeRuntimePolicy(input, {
      activation: 'eager',
      idleStopMinutes: environment.defaultIdleStopMinutes,
      dormantAfterHours: environment.defaultDormantAfterHours,
    });
    const now = new Date();
    try {
      await this.withLock(`environment:${environment.id}`, async () => {
        if (await this.findApp(id))
          throw new ReleasesError(
            'Application ID is unavailable. Choose a different ID.',
            'APP_EXISTS',
            'ALREADY_EXISTS',
          );
        await this.assertEnvironmentCapacity(environment);
        await this.query()
          .insertInto('relApps')
          .values({
            id,
            environmentId: environment.id,
            name,
            description:
              typeof input.description === 'string' && input.description.trim()
                ? input.description.trim()
                : null,
            currentDeploymentId: null,
            enabled: false,
            activation: policy.activation,
            idleStopMinutes: policy.idleStopMinutes,
            dormantAfterHours: policy.dormantAfterHours,
            labels: JSON.stringify(labels),
            previewOf,
            createdBy: caller.userId,
            createdVia: caller.kind,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      });
    } catch (error) {
      if (!(error instanceof ReleasesError) && (await this.findApp(id)))
        throw new ReleasesError(
          'Application ID is unavailable. Choose a different ID.',
          'APP_EXISTS',
          'ALREADY_EXISTS',
        );
      throw error;
    }
    const app = await this.requireApp(id);
    await this.options.events.emit({
      type: 'app.created',
      app: appView(app),
      actor: actorOf(caller),
    });
    return (await this.summarize([app]))[0];
  }

  public async updateApp(
    caller: Caller,
    appId: string,
    input: UpdateAppInput,
  ): Promise<AppSummary> {
    return await this.withLock(`publish:${appId}`, async () => {
      const app = await this.requireApp(appId);
      await this.options.guard.requireApp(caller, 'configure', app);
      const values: Row = {};
      if (input.name !== undefined)
        values.name = normalizeName(input.name, 'INVALID_APP_NAME');
      if (input.description !== undefined)
        values.description =
          typeof input.description === 'string' && input.description.trim()
            ? input.description.trim()
            : null;
      const policy = normalizeRuntimePolicy(input, app);
      const policyChanged =
        policy.activation !== app.activation ||
        policy.idleStopMinutes !== app.idleStopMinutes ||
        policy.dormantAfterHours !== app.dormantAfterHours;
      if (policyChanged) Object.assign(values, policy);
      if (input.labels !== undefined)
        values.labels = JSON.stringify(normalizeLabels(input.labels));
      await this.updateApp_(appId, values);
      if (policyChanged && app.currentDeploymentId)
        await this.applyRuntimePolicy(app.environmentId);
      return (await this.summarize([await this.requireApp(appId)]))[0];
    });
  }

  /**
   * Sends an environment its desired set again after an App's runtime policy changed, when its driver honours the
   * policy; the runtime applies a policy change without restarting the App. A failure leaves the stored policy for the
   * next restore.
   */
  private async applyRuntimePolicy(environmentId: string): Promise<void> {
    try {
      const { driver, environment } =
        await this.options.environments.driverEnvironment(environmentId);
      if (!capabilitiesFor(driver, environment.config).onDemand) return;
      await (
        await this.session(environmentId)
      ).restore(await this.desiredSet(environmentId));
    } catch (error) {
      this.diagnostic.warn(
        'Failed to apply an App runtime policy; it applies on the next restore',
        error,
      );
    }
  }

  /** Removes the App, its releases, history and data. A person confirms by typing the App ID. */
  public async deleteApp(
    caller: Caller,
    appId: string,
    options: { readonly confirm?: string } = {},
  ): Promise<void> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'delete', app);
    if (
      (caller.kind === 'human' || caller.kind === 'key') &&
      options.confirm !== appId
    )
      throw new ReleasesError(
        'Type the application ID to confirm deletion.',
        'CONFIRMATION_REQUIRED',
        'FAILED_PRECONDITION',
      );
    await this.removeApp(app, caller);
  }

  // --- Releases -----------------------------------------------------------------------------------------------

  public async listReleases(
    caller: Caller,
    appId: string,
    options: { readonly labels?: Labels } = {},
  ): Promise<readonly ReleaseView[]> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'view', app);
    const rows = await this.query()
      .selectFrom('relReleases')
      .selectAll()
      .where('appId', '=', appId)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .execute<Row>();
    const releases = rows
      .map(decodeRelease)
      .filter((release) => matchesLabels(release.labels, options.labels));
    const images = await this.artifacts.imagesOf(
      releases.map((release) => release.id),
    );
    const context = releases.some((release) => release.variables)
      ? await this.variablesContext(app).catch(() => null)
      : null;
    return releases.map((release) => ({
      ...releaseView(release, images.get(release.id) ?? []),
      variables:
        release.variables && context
          ? {
              declared: release.variables.variables.filter(
                (variable) => !variable.runtime,
              ).length,
              required: release.variables.variables.filter(
                (variable) => variable.required,
              ).length,
              missing: this.resolveFor(release, context).missing.map(
                (variable) => variable.name,
              ),
            }
          : null,
    }));
  }

  public async getRelease(
    caller: Caller,
    appId: string,
    releaseId: string,
  ): Promise<ReleaseView> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'view', app);
    const release = await this.requireRelease(appId, releaseId);
    const images = await this.artifacts.imagesOf([release.id]);
    return releaseView(release, images.get(release.id) ?? []);
  }

  /**
   * Registers an image CI built and pushed, by digest, as a release of `version` (an image release, which Docker
   * environments pull). It needs `upload` on the App, as uploading an archive does. The same digest again answers its
   * release; an image for another platform joins the release of the same version, and another digest for a platform
   * that has one is refused (`IMAGE_CONFLICT`): a release's image never changes. Releases promoted from it get it too.
   */
  public async registerImageRelease(
    caller: Caller,
    appId: string,
    input: RegisterImageReleaseInput,
  ): Promise<ReleaseView> {
    const image = normalizeImage(input);
    const version = normalizeVersion(input.version);
    const labels = normalizeLabels(input.labels);
    const variables =
      input.variables === undefined
        ? null
        : parseVariablesManifest(input.variables);
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'upload', app);
    return await this.withLock(`publish:${appId}`, async () => {
      const byDigest = await this.query()
        .selectFrom('relReleaseArtifacts')
        .select('releaseId')
        .where('appId', '=', appId)
        .where('digest', '=', image.digest)
        .executeTakeFirst<Row>();
      const sameVersion = byDigest
        ? null
        : await this.query()
            .selectFrom('relReleases')
            .selectAll()
            .where('appId', '=', appId)
            .where('kind', '=', 'image')
            .where('version', '=', version)
            .executeTakeFirst<Row>();
      const existing = byDigest
        ? await this.requireRelease(appId, String(byDigest.releaseId))
        : sameVersion
          ? decodeRelease(sameVersion)
          : null;
      if (existing) {
        await this.options.database.transaction(async (connection) => {
          await this.artifacts.register(
            connection,
            existing,
            image,
            actorOf(caller),
          );
          // An image of another platform may bring the manifest the first one came without.
          if (variables && !existing.variables)
            await connection.query
              .updateTable('relReleases')
              .set({ variables: JSON.stringify(variables) })
              .where('id', '=', existing.id)
              .execute();
        });
        const images = await this.artifacts.imagesOf([existing.id]);
        return {
          ...releaseView(existing, images.get(existing.id) ?? []),
          reused: true,
        };
      }
      const release: ReleaseRecord = {
        id: randomUUID(),
        appId,
        kind: 'image',
        version,
        artifactKey: null,
        checksum: image.digest.replace(/^sha256:/u, ''),
        size: null,
        configTemplate: null,
        manifest: {},
        variables,
        labels,
        sourceReleaseId: null,
        sourceCommit: image.sourceCommit,
        build: normalizeBuild(input.build),
        createdBy: caller.userId,
        createdVia: caller.kind,
        createdAt: new Date(),
      };
      await this.options.database.transaction(async (connection) => {
        await connection.query
          .insertInto('relReleases')
          .values(encodeRelease(release))
          .execute();
        await connection.query
          .insertInto('relReleaseChecksums')
          .values({
            appId,
            checksum: release.checksum,
            releaseId: release.id,
            deploymentId: null,
            configFingerprint: null,
          })
          .execute();
        await this.artifacts.register(
          connection,
          release,
          image,
          actorOf(caller),
        );
        await connection.query
          .updateTable('relApps')
          .set({ updatedAt: new Date() })
          .where('id', '=', appId)
          .execute();
      });
      const images = await this.artifacts.imagesOf([release.id]);
      const view = releaseView(release, images.get(release.id) ?? []);
      await this.options.events.emit({
        type: 'release.created',
        app: appView(app),
        release: view,
        actor: actorOf(caller),
      });
      return { ...view, reused: false };
    });
  }

  /** The release's `config.example.yml`, which may hold sample credentials: `configure` only, its secrets masked. */
  public async readConfigTemplate(
    caller: Caller,
    appId: string,
    releaseId: string,
  ): Promise<string | null> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'configure', app);
    const template = (await this.requireRelease(appId, releaseId))
      .configTemplate;
    return template === null ? null : maskConfig(template).content;
  }

  /**
   * Stores an uploaded archive as a release. An archive already uploaded to the App (same checksum) answers with the
   * existing release; an idempotency key replays the first answer and refuses another archive. With `deploy`, the
   * release is deployed right away under the same rules as `deploy`.
   */
  public async uploadRelease(
    caller: Caller,
    appId: string,
    input: UploadReleaseInput,
  ): Promise<ReleaseView> {
    validateIdempotencyKey(input.idempotencyKey);
    const labels = normalizeLabels(input.labels);
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'upload', app);
    const environment = await this.options.environments.record(
      app.environmentId,
    );
    if (input.deploy) {
      if (input.deploy.config !== undefined)
        validateDeployConfig(input.deploy.config);
      await this.authorizeDeploy(caller, app, environment);
    }
    const configFingerprint =
      input.deploy?.config?.content !== undefined
        ? sha256(input.deploy.config.content)
        : null;
    const staged = await receiveArtifact(input.stream, {
      expectedChecksum: input.checksum,
      maxBytes: this.options.maxArtifactBytes,
    });
    try {
      const promoted = input.deploy
        ? null
        : await this.promotable(caller, input.promoteFrom, staged.checksum);
      if (promoted)
        return await this.promoteRelease(
          caller,
          promoted.appId,
          promoted.id,
          appId,
          { labels },
        );
      const metadata = await inspectArtifact(staged.path);
      assertMountableAt(metadata.manifest, `/${appId}`);
      return await this.withLock(`publish:${appId}`, async () => {
        const current = await this.requireApp(appId);
        const existing = await this.existingRelease(
          appId,
          staged.checksum,
          input.idempotencyKey,
          configFingerprint,
          Boolean(input.deploy),
        );
        if (existing) return existing;
        const id = randomUUID();
        const artifactKey = `${appId}/${id}.tar.gz`;
        const release: ReleaseRecord = {
          id,
          appId,
          kind: 'archive',
          version: metadata.version,
          artifactKey,
          checksum: staged.checksum,
          size: staged.size,
          configTemplate: metadata.configTemplate,
          manifest: metadata.manifest,
          variables: metadata.variables,
          labels,
          sourceReleaseId: null,
          sourceCommit: normalizeSourceCommit(input.sourceCommit),
          build: normalizeBuild(input.build),
          createdBy: caller.userId,
          createdVia: caller.kind,
          createdAt: new Date(),
        };
        if (input.deploy) await this.requireNoPendingDeployment(appId);
        // A release whose required variables are not all set is kept, and not deployed: once they are set, it
        // deploys by its ID without another upload.
        const missing = input.deploy
          ? await this.missingVariables(current, release, input.deploy.config)
          : [];
        const deployment =
          input.deploy && missing.length === 0
            ? await this.buildDeploymentRecord(current, release, caller, {
                kind: 'deploy',
                config: input.deploy.config,
              })
            : null;
        try {
          await this.disk.putStream(
            artifactKey,
            createReadStream(staged.path),
            {
              visibility: 'private',
              contentType: 'application/gzip',
            },
          );
          await this.options.database.transaction(async (connection) => {
            if (deployment)
              await this.requireNoPendingDeployment(appId, connection);
            await connection.query
              .insertInto('relReleases')
              .values(encodeRelease(release))
              .execute();
            await connection.query
              .insertInto('relReleaseChecksums')
              .values({
                appId,
                checksum: staged.checksum,
                releaseId: id,
                deploymentId: deployment?.id ?? null,
                configFingerprint,
              })
              .execute();
            if (input.idempotencyKey)
              await connection.query
                .insertInto('relUploadRequests')
                .values({
                  appId,
                  requestKey: input.idempotencyKey,
                  checksum: staged.checksum,
                  releaseId: id,
                })
                .execute();
            if (deployment)
              await connection.query
                .insertInto('relDeployments')
                .values(encodeDeployment(deployment))
                .execute();
            await connection.query
              .updateTable('relApps')
              .set({ updatedAt: new Date() })
              .where('id', '=', appId)
              .execute();
          });
        } catch (error) {
          await this.disk.delete(artifactKey).catch(() => undefined);
          if (deployment?.configPath)
            await rm(deployment.configPath, { force: true });
          // Another writer may have won the uniqueness race.
          const winner = await this.existingRelease(
            appId,
            staged.checksum,
            input.idempotencyKey,
            configFingerprint,
            Boolean(input.deploy),
          );
          if (winner) return winner;
          throw error;
        }
        const view = releaseView(release);
        await this.options.events.emit({
          type: 'release.created',
          app: appView(current),
          release: view,
          actor: actorOf(caller),
        });
        if (missing.length > 0)
          throw variablesMissing(current, release, missing);
        if (deployment) this.schedule(deployment);
        return { ...view, reused: false, deploymentId: deployment?.id ?? null };
      });
    } finally {
      await staged.dispose();
    }
  }

  /** The release an upload may be promoted from: the one named, when it holds the same bytes and the caller may see it. */
  private async promotable(
    caller: Caller,
    from: UploadReleaseInput['promoteFrom'],
    checksum: string,
  ): Promise<ReleaseRecord | null> {
    if (!from) return null;
    const release = await this.findRelease(from.appId, from.releaseId);
    if (!release || release.checksum !== checksum) return null;
    const source = await this.findApp(from.appId);
    if (!source || !(await this.options.guard.canApp(caller, 'view', source)))
      return null;
    return release;
  }

  /** Replaces a release's labels, for an application linking releases to its own records. */
  public async labelRelease(
    caller: Caller,
    appId: string,
    releaseId: string,
    labels: Labels,
  ): Promise<ReleaseView> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'upload', app);
    await this.requireRelease(appId, releaseId);
    await this.query()
      .updateTable('relReleases')
      .set({ labels: JSON.stringify(normalizeLabels(labels)) })
      .where('id', '=', releaseId)
      .where('appId', '=', appId)
      .execute();
    return releaseView(await this.requireRelease(appId, releaseId));
  }

  /**
   * Copies a release into another App (staging to production) without uploading it again. The same archive already
   * in the target App answers with that release.
   */
  public async promoteRelease(
    caller: Caller,
    sourceAppId: string,
    releaseId: string,
    targetAppId: string,
    options: { readonly labels?: Labels } = {},
  ): Promise<ReleaseView> {
    const source = await this.requireApp(sourceAppId);
    await this.options.guard.requireApp(caller, 'view', source);
    const target = await this.requireApp(targetAppId);
    await this.options.guard.requireApp(caller, 'upload', target);
    const release = await this.requireRelease(sourceAppId, releaseId);
    const labels = options.labels
      ? normalizeLabels(options.labels)
      : release.labels;
    assertMountableAt(release.manifest, `/${targetAppId}`);
    return await this.withLock(`publish:${targetAppId}`, async () => {
      const existing = await this.existingRelease(
        targetAppId,
        release.checksum,
      );
      if (existing) {
        // The release is there already; it gets the images of the release it was promoted from now, if it lacks them.
        await this.options.database.transaction((connection) =>
          this.artifacts.copy(connection, release.id, {
            id: existing.id,
            appId: targetAppId,
          }),
        );
        return existing;
      }
      const id = randomUUID();
      const artifactKey = release.artifactKey
        ? `${targetAppId}/${id}.tar.gz`
        : null;
      const copy: ReleaseRecord = {
        ...release,
        id,
        appId: targetAppId,
        artifactKey,
        labels,
        sourceReleaseId: release.id,
        createdBy: caller.userId,
        createdVia: caller.kind,
        createdAt: new Date(),
      };
      if (release.artifactKey && artifactKey)
        await this.disk.copy(release.artifactKey, artifactKey);
      try {
        await this.options.database.transaction(async (connection) => {
          await connection.query
            .insertInto('relReleases')
            .values(encodeRelease(copy))
            .execute();
          await connection.query
            .insertInto('relReleaseChecksums')
            .values({
              appId: targetAppId,
              checksum: copy.checksum,
              releaseId: id,
              deploymentId: null,
              configFingerprint: null,
            })
            .execute();
          await this.artifacts.copy(connection, release.id, {
            id,
            appId: targetAppId,
          });
        });
      } catch (error) {
        if (artifactKey)
          await this.disk.delete(artifactKey).catch(() => undefined);
        const winner = await this.existingRelease(
          targetAppId,
          release.checksum,
        );
        if (winner) return winner;
        throw error;
      }
      const images = await this.artifacts.imagesOf([id]);
      const view = releaseView(copy, images.get(id) ?? []);
      await this.options.events.emit({
        type: 'release.created',
        app: appView(target),
        release: view,
        actor: actorOf(caller),
      });
      return { ...view, reused: false };
    });
  }

  // --- Configuration ------------------------------------------------------------------------------------------

  /**
   * The App's `config.yml` with its secrets masked (`config-secrets.ts`). Their values never leave the server: the
   * runtime reads the stored file, and an operator who needs one reads it there.
   */
  public async readConfig(
    caller: Caller,
    appId: string,
  ): Promise<ConfigDocument> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'configure', app);
    const deployment = await this.currentDeployment(app);
    if (!deployment) return { mode: 'file', content: '', secrets: [] };
    if (deployment.configMode !== 'file')
      return { mode: deployment.configMode, content: null, secrets: [] };
    return configDocument((await this.readDeploymentConfig(deployment)) ?? '');
  }

  /**
   * Saves the running deployment's configuration and asks the runtime to reload it. Masked values keep the stored
   * secrets at their paths; `secretChanges` replace or remove secrets. Answers the saved configuration, masked.
   */
  public async updateConfig(
    caller: Caller,
    appId: string,
    content: string,
    options: { readonly secretChanges?: unknown } = {},
  ): Promise<ConfigDocument> {
    if (typeof content !== 'string')
      throw new ReleasesError(
        'Configuration content is required.',
        'INVALID_CONFIG_FILE',
        'INVALID_ARGUMENT',
      );
    assertConfigSize(content);
    return await this.withLock(appId, async () => {
      const app = await this.requireApp(appId);
      await this.options.guard.requireApp(caller, 'configure', app);
      const deployment = await this.currentDeployment(app);
      if (
        !deployment ||
        deployment.configMode !== 'file' ||
        !deployment.configPath
      )
        throw new ReleasesError(
          'Only an active file configuration can be edited.',
          'CONFIG_NOT_EDITABLE',
          'FAILED_PRECONDITION',
        );
      validateYamlConfig(content);
      const stored = await this.readDeploymentConfig(deployment);
      const restored = restoreConfigSecrets(
        content,
        stored,
        options.secretChanges,
      );
      assertConfigSize(restored);
      validateYamlConfig(restored);
      const release = await this.findRelease(appId, deployment.releaseId);
      const published = ensureConfigSecrets(restored, stored ?? undefined, {
        skip: declaredSecretSections(release?.variables ?? null),
      });
      await writeTextAtomic(deployment.configPath, published);
      const session = await this.session(app.environmentId);
      if (session.reloadConfig) {
        try {
          await session.reloadConfig(appId, published);
        } catch (error) {
          throw new ReleasesError(
            `Configuration was saved, but the runtime could not reload it: ${errorMessage(error)}`,
            'CONFIG_RELOAD_FAILED',
            'UNAVAILABLE',
          );
        }
      }
      return configDocument(published);
    });
  }

  // --- Deployments --------------------------------------------------------------------------------------------

  public async deploy(
    caller: Caller,
    appId: string,
    input: DeployInput,
  ): Promise<DeploymentView> {
    if (
      !input ||
      typeof input.releaseId !== 'string' ||
      !input.releaseId.trim()
    )
      throw new ReleasesError(
        'A release ID is required.',
        'INVALID_DEPLOYMENT_INPUT',
        'INVALID_ARGUMENT',
      );
    if (input.config !== undefined) validateDeployConfig(input.config);
    validateIdempotencyKey(input.idempotencyKey);
    const app = await this.requireApp(appId);
    const environment = await this.options.environments.record(
      app.environmentId,
    );
    await this.authorizeDeploy(caller, app, environment);
    const fingerprint = sha256(
      JSON.stringify({
        releaseId: input.releaseId,
        config: input.config ?? null,
      }),
    );
    return await this.withLock(`publish:${appId}`, async () => {
      if (input.idempotencyKey) {
        const replay = await this.replayDeployRequest(
          appId,
          input.idempotencyKey,
          fingerprint,
        );
        if (replay) return replay;
      }
      const release = await this.requireRelease(appId, input.releaseId);
      const deployment = await this.startDeployment(
        caller,
        await this.requireApp(appId),
        release,
        { kind: 'deploy' },
        input.config,
        input.idempotencyKey
          ? { key: input.idempotencyKey, fingerprint }
          : undefined,
      ).catch(async (error: unknown) => {
        if (input.idempotencyKey) {
          const winner = await this.replayDeployRequest(
            appId,
            input.idempotencyKey,
            fingerprint,
          );
          if (winner) return winner;
        }
        throw error;
      });
      return deployment;
    });
  }

  public async rollback(
    caller: Caller,
    appId: string,
    input: RollbackInput,
  ): Promise<DeploymentView> {
    if (!input || typeof input.deploymentId !== 'string')
      throw new ReleasesError(
        'A deployment ID is required.',
        'INVALID_ROLLBACK_TARGET',
        'INVALID_ARGUMENT',
      );
    const app = await this.requireApp(appId);
    const environment = await this.options.environments.record(
      app.environmentId,
    );
    await this.authorizeDeploy(caller, app, environment);
    return await this.withLock(`publish:${appId}`, async () => {
      const target = await this.requireRollbackTarget(
        appId,
        input.deploymentId,
      );
      const release = await this.requireRelease(appId, target.releaseId);
      return await this.startDeployment(
        caller,
        await this.requireApp(appId),
        release,
        {
          kind: 'rollback',
          rollbackTargetDeploymentId: target.id,
        },
      );
    });
  }

  /**
   * Starts a deployment the caller has already been authorized for: the deployment request service calls it when an
   * approver approves. Only people start deployments this way.
   */
  public async startApprovedDeployment(
    approver: Caller,
    appId: string,
    releaseId: string,
    options: StartDeploymentOptions,
  ): Promise<DeploymentView> {
    if (approver.kind !== 'human')
      throw forbidden(
        'Only a person can approve a deployment.',
        'HUMAN_REQUIRED',
      );
    return await this.withLock(`publish:${appId}`, async () => {
      const app = await this.requireApp(appId);
      if (options.kind === 'rollback' && options.rollbackTargetDeploymentId)
        await this.requireRollbackTarget(
          appId,
          options.rollbackTargetDeploymentId,
        );
      const release = await this.requireRelease(appId, releaseId);
      return await this.startDeployment(approver, app, release, options);
    });
  }

  public async listDeployments(
    caller: Caller,
    appId: string,
    options: { readonly page?: number; readonly pageSize?: number } = {},
  ): Promise<DeploymentPage> {
    const requestedPage = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    assertPagination(requestedPage, pageSize);
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'view', app);
    const count = await this.query()
      .selectFrom('relDeployments')
      .select((eb) => [eb.fn.countAll().as('total')])
      .where('appId', '=', appId)
      .executeTakeFirst<Row>();
    const total = Number(count?.total ?? 0);
    const page = Math.min(
      requestedPage,
      Math.max(1, Math.ceil(total / pageSize)),
    );
    const rows = await this.query()
      .selectFrom('relDeployments')
      .leftJoin(
        'relReleases as release',
        'relDeployments.releaseId',
        'release.id',
      )
      .selectAll('relDeployments')
      .select([
        'release.version as releaseVersion',
        'release.checksum as releaseChecksum',
      ])
      .where('relDeployments.appId', '=', appId)
      .orderBy('relDeployments.createdAt', 'desc')
      .orderBy('relDeployments.id', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute<Row>();
    return {
      items: rows.map((row) =>
        deploymentView(
          decodeDeployment(row),
          typeof row.releaseVersion === 'string'
            ? {
                version: row.releaseVersion,
                checksum: String(row.releaseChecksum),
              }
            : null,
        ),
      ),
      total,
      page,
      pageSize,
    };
  }

  /**
   * One deployment. Whoever may deploy the App reads it too, so CI holding only a deploying key can wait for the
   * result; it sees status and phase, never configuration or logs.
   */
  public async getDeployment(
    caller: Caller,
    appId: string,
    deploymentId: string,
  ): Promise<DeploymentView> {
    const app = await this.requireApp(appId);
    if (!(await this.options.guard.canApp(caller, 'view', app)))
      await this.options.guard.requireApp(caller, 'deploy', app);
    const deployment = await this.requireDeployment(appId, deploymentId);
    const release = await this.findRelease(appId, deployment.releaseId);
    return deploymentView(
      deployment,
      release ? { version: release.version, checksum: release.checksum } : null,
    );
  }

  /** Resolves once the deployment has finished, or with its current state at the timeout. */
  public async waitForDeployment(
    deploymentId: string,
    timeoutMs: number = 120_000,
  ): Promise<DeploymentView> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const row = await this.query()
        .selectFrom('relDeployments')
        .selectAll()
        .where('id', '=', deploymentId)
        .executeTakeFirst<Row>();
      if (!row)
        throw notFound('Deployment', 'DEPLOYMENT_NOT_FOUND', deploymentId);
      const deployment = decodeDeployment(row);
      const finished =
        deployment.status !== 'queued' && deployment.status !== 'deploying';
      if (finished || Date.now() >= deadline) {
        // A finished deployment's run still announces it (events, the request it settled); wait for that too, so a
        // waiter never sees the deployment done but its consequences pending.
        const run = finished ? this.runs.get(deploymentId) : undefined;
        if (run)
          await Promise.race([run, delay(Math.max(0, deadline - Date.now()))]);
        const release = await this.findRelease(
          deployment.appId,
          deployment.releaseId,
        );
        return deploymentView(
          deployment,
          release
            ? { version: release.version, checksum: release.checksum }
            : null,
        );
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
  }

  public async readLogs(
    caller: Caller,
    appId: string,
    query: JournalQuery = {},
    deploymentId?: string,
  ): Promise<
    JournalPage & { enabled: boolean; status?: string; phase?: string }
  > {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'read-logs', app);
    try {
      if (deploymentId) {
        const deployment = await this.requireDeployment(appId, deploymentId);
        const policy = this.options.logging?.deployments;
        const directory = path.dirname(
          this.deploymentLogPath(appId, deployment.id),
        );
        // A read never prunes: each deployment run prunes the journals when it finishes.
        const result = await readJournal(
          directory,
          query,
          `${deployment.id}.log`,
        );
        const lastPhase = result.entries.at(-1)?.phase;
        return {
          ...result,
          enabled: policy?.enabled !== false,
          status: deployment.status,
          phase: typeof lastPhase === 'string' ? lastPhase : deployment.phase,
        };
      }
      const { driver, environment } =
        await this.options.environments.driverEnvironment(app.environmentId);
      if (!capabilitiesFor(driver, environment.config).logs)
        return {
          entries: [],
          cursor: '',
          hasMore: false,
          available: false,
          reset: false,
          enabled: false,
        };
      const session = await this.session(app.environmentId);
      return { ...(await session.logs(appId, query)), enabled: true };
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid log cursor')
        throw new ReleasesError(
          error.message,
          'INVALID_LOG_CURSOR',
          'INVALID_ARGUMENT',
        );
      throw error;
    }
  }

  // --- Lifecycle ----------------------------------------------------------------------------------------------

  public async start(caller: Caller, appId: string): Promise<AppSummary> {
    return await this.withLock(appId, async () => {
      const app = await this.requireApp(appId);
      await this.options.guard.requireApp(caller, 'operate', app);
      const deployment = await this.currentDeployment(app);
      if (!deployment)
        throw new ReleasesError(
          'App must be deployed before it can be started.',
          'APP_NOT_DEPLOYED',
          'FAILED_PRECONDITION',
        );
      await this.updateApp_(appId, { enabled: true });
      try {
        const status = await (
          await this.session(app.environmentId)
        ).start(await this.deploymentSpec(app, deployment, 'running'));
        if (status.state === 'failed' || status.state === 'unknown')
          throw new Error(
            status.error ?? 'The runtime did not report the application.',
          );
      } catch (error) {
        await this.updateApp_(appId, { enabled: false });
        throw new ReleasesError(
          `Start failed: ${errorMessage(error)}`,
          'START_FAILED',
          'UNAVAILABLE',
        );
      }
      return (await this.summarize([await this.requireApp(appId)]))[0];
    });
  }

  public async stop(caller: Caller, appId: string): Promise<AppSummary> {
    return await this.withLock(appId, async () => {
      const app = await this.requireApp(appId);
      await this.options.guard.requireApp(caller, 'operate', app);
      if (!(await this.currentDeployment(app)))
        throw new ReleasesError(
          'App is not deployed.',
          'APP_NOT_DEPLOYED',
          'FAILED_PRECONDITION',
        );
      await this.updateApp_(appId, { enabled: false });
      try {
        await (await this.session(app.environmentId)).stop(appId);
      } catch (error) {
        await this.updateApp_(appId, { enabled: true });
        throw new ReleasesError(
          `Stop failed: ${errorMessage(error)}`,
          'STOP_FAILED',
          'UNAVAILABLE',
        );
      }
      return (await this.summarize([await this.requireApp(appId)]))[0];
    });
  }

  public async restart(caller: Caller, appId: string): Promise<AppSummary> {
    return await this.withLock(appId, async () => {
      const app = await this.requireApp(appId);
      await this.options.guard.requireApp(caller, 'operate', app);
      if (!(await this.currentDeployment(app)))
        throw new ReleasesError(
          'App is not deployed.',
          'APP_NOT_DEPLOYED',
          'FAILED_PRECONDITION',
        );
      try {
        const status = await (
          await this.session(app.environmentId)
        ).restart(appId);
        if (status.state !== 'running')
          throw new Error(
            status.error ?? 'The runtime did not report a running application.',
          );
      } catch (error) {
        throw new ReleasesError(
          `Restart failed: ${errorMessage(error)}`,
          'RESTART_FAILED',
          'UNAVAILABLE',
        );
      }
      return (await this.summarize([await this.requireApp(appId)]))[0];
    });
  }

  /**
   * At startup: finalises the deployments a restart caught `deploying` from what the target recorded, marks the others
   * failed, then sends every environment its desired set. An environment whose driver keeps
   * outcomes (`operation`) gets its set only after its deployments are finalised, so one that finished during the
   * restart is restored as the App's current deployment. Readers wait a little for all of it, so a fresh start does
   * not report every App as stopped or a finished deployment as still running.
   */
  public async restore(): Promise<void> {
    await this.clearExpiredInitialAdmins().catch((error: unknown) =>
      this.diagnostic.warn(
        'Failed to clear expired first administrators',
        error,
      ),
    );
    const interrupted = (
      await this.query()
        .selectFrom('relDeployments')
        .selectAll()
        .where('status', 'in', ['queued', 'deploying'])
        .execute<Row>()
    ).map(decodeDeployment);
    // A deployment the target recorded (the App Host's operation log) is finalised from what it reports; every other
    // one was cut short.
    const resumed = new Set<string>();
    const recorded = new Map<string, DeploymentRecord[]>();
    for (const deployment of interrupted) {
      if (deployment.status !== 'deploying') continue;
      const app = await this.findApp(deployment.appId);
      if (!app) continue;
      const session = await this.session(app.environmentId).catch(() => null);
      if (session?.operation) {
        resumed.add(deployment.id);
        this.logDeployment(
          deployment,
          'switching',
          'Restarted during the deployment; reading its outcome from the runtime',
        );
        recorded.set(app.environmentId, [
          ...(recorded.get(app.environmentId) ?? []),
          deployment,
        ]);
        continue;
      }
    }
    const cutShort = interrupted.filter(
      (deployment) => !resumed.has(deployment.id),
    );
    for (const deployment of cutShort)
      this.logDeployment(
        deployment,
        'completed',
        'Deployment interrupted by a restart',
        new Error('The application restarted before the deployment completed'),
      );
    if (cutShort.length)
      await this.query()
        .updateTable('relDeployments')
        .set({
          status: 'failed',
          phase: 'completed',
          error: 'Deployment was interrupted by a restart.',
          finishedAt: new Date(),
        })
        .where(
          'id',
          'in',
          cutShort.map((deployment) => deployment.id),
        )
        .execute();
    const environments = await this.query()
      .selectFrom('relApps')
      .select('environmentId')
      .distinct()
      .execute<Row>();
    const restoring = Promise.allSettled([
      ...environments.map(async (row) => {
        const environmentId = String(row.environmentId);
        const session = await this.session(environmentId);
        for (const deployment of recorded.get(environmentId) ?? [])
          await this.finaliseDeployment(deployment, () =>
            session.operation!({
              deploymentId: deployment.id,
              appId: deployment.appId,
            }),
          );
        await session.restore(await this.desiredSet(environmentId));
      }),
    ]).then((results) => {
      for (const result of results)
        if (result.status === 'rejected')
          this.diagnostic.error(
            'Failed to restore an environment',
            result.reason,
          );
    });
    const current = restoring.finally(() => {
      if (this.restoring === current) this.restoring = null;
    });
    this.restoring = current;
  }

  /** Closes a changed or removed environment's session; the next use opens it with the new settings. */
  public async environmentChanged(environmentId: string): Promise<void> {
    const session = this.sessions.get(environmentId);
    this.sessions.delete(environmentId);
    if (session) await (await session.catch(() => null))?.close();
    if (await this.countApps(environmentId)) {
      const reopened = await this.session(environmentId);
      await reopened.restore(await this.desiredSet(environmentId));
    }
  }

  public async countApps(environmentId: string): Promise<number> {
    const row = await this.query()
      .selectFrom('relApps')
      .select((eb) => [eb.fn.countAll().as('total')])
      .where('environmentId', '=', environmentId)
      .executeTakeFirst<Row>();
    return Number(row?.total ?? 0);
  }

  public async checkEnvironment(
    environmentId: string,
  ): Promise<{ ok: boolean; message?: string; details?: unknown }> {
    return await (await this.session(environmentId)).check();
  }

  public async shutdown(): Promise<void> {
    this.closed = true;
    await this.restoring?.catch(() => undefined);
    await Promise.allSettled([...this.running]);
    await Promise.allSettled(this.locks.values());
    for (const session of this.sessions.values())
      await (await session.catch(() => null))?.close().catch(() => undefined);
    this.sessions.clear();
  }

  /** The App record without access checks, for the other services; read on `conn` when given. */
  public async requireApp(
    appId: string,
    conn?: DatabaseConnection,
  ): Promise<AppRecord> {
    const app = await this.findApp(appId, conn);
    if (!app) throw notFound('App', 'APP_NOT_FOUND', appId);
    return app;
  }

  public async findApp(
    appId: string,
    conn?: DatabaseConnection,
  ): Promise<AppRecord | null> {
    const row = await (conn?.query ?? this.query())
      .selectFrom('relApps')
      .selectAll()
      .where('id', '=', appId)
      .executeTakeFirst<Row>();
    return row ? decodeApp(row) : null;
  }

  public async requireRelease(
    appId: string,
    releaseId: string,
  ): Promise<ReleaseRecord> {
    const release = await this.findRelease(appId, releaseId);
    if (!release) throw notFound('Release', 'RELEASE_NOT_FOUND', releaseId);
    return release;
  }

  public async requireRollbackTarget(
    appId: string,
    deploymentId: string,
  ): Promise<DeploymentRecord> {
    const target = await this.requireDeployment(appId, deploymentId);
    if (target.status !== 'succeeded')
      throw new ReleasesError(
        'Only a successful deployment can be rolled back to.',
        'INVALID_ROLLBACK_TARGET',
        'FAILED_PRECONDITION',
      );
    return target;
  }

  /**
   * The deploy rules: `deploy` on the App, and nobody deploys directly to a protected environment, which takes a
   * deployment request instead (`DeploymentRequestService.create`).
   */
  public async authorizeDeploy(
    caller: Caller,
    app: AppRecord,
    environment: EnvironmentRecord,
  ): Promise<void> {
    if (caller.kind === 'system') return;
    await this.options.guard.requireApp(caller, 'deploy', app);
    if (environment.protected)
      throw new ReleasesError(
        'This environment is protected: request the deployment, and an approver deploys it.',
        'APPROVAL_REQUIRED',
        'FAILED_PRECONDITION',
      );
  }

  // --- Variables ----------------------------------------------------------------------------------------------

  /**
   * The App's variables as a release declares them (the given one, else the App's most recent build: see
   * `declaringRelease`) and as a deployment of it would get them now. A secret's value never leaves the server.
   */
  public async listAppVariables(
    caller: Caller,
    appId: string,
    options: { readonly releaseId?: string } = {},
  ): Promise<{
    readonly items: readonly AppVariableView[];
    readonly meta: AppVariablesMeta;
  }> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'view', app);
    const release = options.releaseId
      ? await this.requireRelease(appId, options.releaseId)
      : await this.declaringRelease(app);
    const context = await this.variablesContext(app);
    const resolved = release
      ? this.resolveFor(release, context)
      : resolveVariables({
          manifest: null,
          environment: context.environmentVariables,
          app: context.appVariables,
          configFile: context.configFile,
          running: context.running,
        });
    const items = resolved.variables.map((variable) =>
      appVariableView(variable),
    );
    return {
      items,
      meta: {
        total: items.length,
        releaseId: release?.id ?? null,
        releaseVersion: release?.version ?? null,
        environmentId: app.environmentId,
        declared: Boolean(release?.variables),
        missing: resolved.missing.map((variable) => variable.name),
        changed: resolved.changed,
      },
    };
  }

  /**
   * Sets one of the App's variables. It reaches the App with its next deployment.
   */
  public async setAppVariable(
    caller: Caller,
    appId: string,
    name: string,
    input: SetAppVariableInput,
  ): Promise<AppVariableView> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'configure', app);
    assertVariableName(name);
    assertVariableValue(input?.value);
    const declared = (
      await this.declaringRelease(app)
    )?.variables?.variables.find((variable) => variable.name === name);
    await this.options.variables.setAppVariable(appId, name, {
      value: input.value,
      secret: input.secret ?? declared?.secret ?? isSecretName(name),
      by: caller.userId,
    });
    const { items } = await this.listAppVariables(SYSTEM_CALLER, appId);
    return items.find((item) => item.name === name)!;
  }

  public async unsetAppVariable(
    caller: Caller,
    appId: string,
    name: string,
  ): Promise<void> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'configure', app);
    if (!(await this.options.variables.unsetAppVariable(appId, name)))
      throw notFound('Variable', 'VARIABLE_NOT_FOUND', name);
  }

  /**
   * The variables the most recent build of each App of the environment declares (`declaringRelease`), merged by
   * name, with the Apps declaring each and those that require it and would get no value. Only Apps the caller may
   * view count. A secret's value never leaves the server; neither does any value here.
   */
  public async listEnvironmentDeclaredVariables(
    caller: Caller,
    environmentId: string,
  ): Promise<readonly EnvironmentDeclaredVariableView[]> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'read');
    await this.options.environments.record(environmentId);
    const rows = await this.query()
      .selectFrom('relApps')
      .selectAll()
      .where('environmentId', '=', environmentId)
      .orderBy('id', 'asc')
      .execute<Row>();
    const environmentValues = new Set(
      (await this.options.variables.environmentVariables(environmentId))
        .filter((variable) => variable.value !== null)
        .map((variable) => variable.name),
    );
    const merged = new Map<
      string,
      {
        description: string | null;
        secret: boolean;
        required: boolean;
        apps: string[];
        missingIn: string[];
      }
    >();
    for (const app of rows.map(decodeApp)) {
      if (!(await this.options.guard.canApp(caller, 'view', app))) continue;
      const release = await this.declaringRelease(app);
      if (!release?.variables) continue;
      const resolved = this.resolveFor(
        release,
        await this.variablesContext(app),
      );
      const missing = new Set(
        resolved.missing.map((variable) => variable.name),
      );
      for (const variable of release.variables.variables) {
        if (RESERVED_VARIABLE_NAMES.includes(variable.name)) continue;
        const entry = merged.get(variable.name) ?? {
          description: null,
          secret: false,
          required: false,
          apps: [],
          missingIn: [],
        };
        entry.description ??= variable.description ?? null;
        entry.secret ||= variable.secret;
        entry.required ||= variable.required;
        entry.apps.push(app.id);
        if (missing.has(variable.name)) entry.missingIn.push(app.id);
        merged.set(variable.name, entry);
      }
    }
    return [...merged.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, entry]) => ({
        name,
        description: entry.description,
        secret: entry.secret,
        required: entry.required,
        set: environmentValues.has(name),
        apps: entry.apps,
        missingIn: entry.missingIn,
      }));
  }

  /** The release's variables manifest, as the build wrote it (checked); null for a build without one. */
  public async readReleaseVariables(
    caller: Caller,
    appId: string,
    releaseId: string,
  ): Promise<ReleaseVariablesManifest | null> {
    const app = await this.requireApp(appId);
    await this.options.guard.requireApp(caller, 'view', app);
    return (await this.requireRelease(appId, releaseId)).variables;
  }

  /**
   * Refuses a deployment of the release while a variable it requires has no value, as a deployment itself would:
   * for a deployment request, before anybody is asked to approve it.
   */
  public async assertVariables(
    appId: string,
    releaseId: string,
  ): Promise<void> {
    const app = await this.requireApp(appId);
    const release = await this.requireRelease(appId, releaseId);
    const missing = await this.missingVariables(app, release);
    if (missing.length > 0) throw variablesMissing(app, release, missing);
  }

  /**
   * The first administrator the App's first deployment generated, for a person who may deploy it: until someone
   * says it is saved, and for 24 hours (a preview App's until the App goes).
   */
  public async readInitialAdmin(
    caller: Caller,
    appId: string,
  ): Promise<InitialAdminView> {
    const app = await this.requireApp(appId);
    await this.requireInitialAdminReader(caller, app);
    await this.clearExpiredInitialAdmins();
    const found = await this.initialAdminOf(app);
    if (!found)
      throw new ReleasesError(
        'This App has no first administrator to show: it was saved, it expired, or the application did not generate one.',
        'INITIAL_ADMIN_UNAVAILABLE',
        'NOT_FOUND',
      );
    return found;
  }

  /** Forgets the generated first administrator once someone has saved it. */
  public async dismissInitialAdmin(
    caller: Caller,
    appId: string,
  ): Promise<void> {
    const app = await this.requireApp(appId);
    await this.requireInitialAdminReader(caller, app);
    await this.query()
      .updateTable('relDeployments')
      .set({
        initialAdmin: null,
        initialAdminSavedBy: caller.userId,
        initialAdminSavedAt: new Date(),
      })
      .where('appId', '=', appId)
      .where('initialAdmin', 'is not', null)
      .execute();
  }

  /** Clears the first administrators whose 24 hours are over. */
  public async clearExpiredInitialAdmins(
    now: Date = new Date(),
  ): Promise<void> {
    await this.query()
      .updateTable('relDeployments')
      .set({ initialAdmin: null })
      .where('initialAdmin', 'is not', null)
      .where('initialAdminExpiresAt', 'is not', null)
      .where('initialAdminExpiresAt', '<=', now)
      .execute();
  }

  private async requireInitialAdminReader(
    caller: Caller,
    app: AppRecord,
  ): Promise<void> {
    // A password a person copies: never an agent's or a key's, whatever they may deploy.
    if (
      caller.kind !== 'human' &&
      caller.kind !== 'system' &&
      caller.kind !== 'rule'
    )
      throw forbidden(
        'Only a person can read the first administrator.',
        'HUMAN_REQUIRED',
      );
    await this.options.guard.requireApp(caller, 'deploy', app);
  }

  private async initialAdminOf(
    app: AppRecord,
  ): Promise<InitialAdminView | null> {
    const rows = await this.query()
      .selectFrom('relDeployments')
      .selectAll()
      .where('appId', '=', app.id)
      .where('initialAdmin', 'is not', null)
      .orderBy('createdAt', 'desc')
      .execute<Row>();
    const now = new Date();
    for (const deployment of rows.map(decodeDeployment)) {
      if (
        deployment.initialAdminExpiresAt &&
        deployment.initialAdminExpiresAt <= now
      )
        continue;
      const admin = this.openInitialAdmin(deployment);
      if (!admin) continue;
      return {
        deploymentId: deployment.id,
        ...admin,
        expiresAt: iso(deployment.initialAdminExpiresAt),
      };
    }
    return null;
  }

  private openInitialAdmin(deployment: DeploymentRecord): {
    readonly username: string;
    readonly email: string;
    readonly password: string;
  } | null {
    if (!deployment.initialAdmin) return null;
    try {
      const value = JSON.parse(
        decryptText(
          deployment.initialAdmin,
          [deployment.id],
          this.options.secrets,
          'initial-admin',
        ),
      ) as Record<string, unknown>;
      return typeof value.username === 'string' &&
        typeof value.email === 'string' &&
        typeof value.password === 'string'
        ? {
            username: value.username,
            email: value.email,
            password: value.password,
          }
        : null;
    } catch {
      return null;
    }
  }

  /** The variables a deployment runs with; none when they no longer open. */
  private openDeploymentEnv(
    deployment: DeploymentRecord,
  ): Record<string, string> {
    if (!deployment.env) return {};
    try {
      const value = JSON.parse(
        decryptText(
          deployment.env,
          [deployment.id],
          this.options.secrets,
          'deployment-env',
        ),
      ) as unknown;
      if (!value || typeof value !== 'object' || Array.isArray(value))
        return {};
      return Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      );
    } catch (error) {
      this.diagnostic.warn(
        `The variables of deployment ${deployment.id} could not be opened; it runs without them`,
        error,
      );
      return {};
    }
  }

  /** The release whose manifest describes the App now: the one it runs, else its newest. */
  /**
   * The App's most recent build, which declares what variables it has: its newest release (uploaded or promoted to
   * it) that carries a variables manifest; failing that the release it runs, else its newest.
   */
  private async declaringRelease(
    app: AppRecord,
  ): Promise<ReleaseRecord | null> {
    const rows = await this.query()
      .selectFrom('relReleases')
      .selectAll()
      .where('appId', '=', app.id)
      .where('variables', 'is not', null)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .execute<Row>();
    for (const row of rows) {
      const release = decodeRelease(row);
      if (release.variables) return release;
    }
    return this.releaseOfApp(app);
  }

  private async releaseOfApp(app: AppRecord): Promise<ReleaseRecord | null> {
    const current = await this.currentDeployment(app);
    if (current) {
      const release = await this.findRelease(app.id, current.releaseId);
      if (release) return release;
    }
    const row = await this.query()
      .selectFrom('relReleases')
      .selectAll()
      .where('appId', '=', app.id)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst<Row>();
    return row ? decodeRelease(row) : null;
  }

  /** What resolving an App's variables reads, once for every release it is resolved against. */
  private async variablesContext(app: AppRecord): Promise<VariablesContext> {
    const [environment, environmentVariables, appVariables] = await Promise.all(
      [
        this.options.environments.record(app.environmentId),
        this.options.variables.environmentVariables(app.environmentId),
        this.options.variables.appVariables(app.id),
      ],
    );
    const current = await this.currentDeployment(app);
    const content = current ? await this.readDeploymentConfig(current) : null;
    return {
      environment,
      environmentVariables,
      appVariables,
      configFile: content === null ? null : parseConfig(content),
      running: current ? this.openDeploymentEnv(current) : null,
      url: await this.appUrl(app),
      first: app.currentDeploymentId === null,
    };
  }

  /** Resolves the App's variables against a release, as a deployment of it would get them now (nothing generated). */
  private resolveFor(
    release: ReleaseRecord,
    context: VariablesContext,
    configFile?: unknown,
  ): ResolvedVariables {
    const file =
      configFile ??
      context.configFile ??
      (release.configTemplate ? parseConfig(release.configTemplate) : {});
    const plan = planGenerated(release.variables, context, file);
    return resolveVariables({
      manifest: release.variables,
      environment: context.environmentVariables,
      app: context.appVariables,
      configFile: file,
      generated: plan.computed,
      generatable: new Set([
        ...plan.persistent.keys(),
        ...plan.oneShot.keys(),
        ...(plan.initialAdmin ? [plan.initialAdmin.name] : []),
      ]),
      running: context.running,
    });
  }

  /** The required variables nothing would give a deployment of the release now. */
  private async missingVariables(
    app: AppRecord,
    release: ReleaseRecord,
    config?: { readonly mode: ConfigMode; readonly content?: string },
  ): Promise<readonly ReleaseVariable[]> {
    if (!release.variables) return [];
    const context = await this.variablesContext(app);
    return this.resolveFor(
      release,
      context,
      config?.content !== undefined ? parseConfig(config.content) : undefined,
    ).missing;
  }

  /** The variables summary of the single-App read: of its most recent build (`declaringRelease`). */
  private async appVariablesOf(
    app: AppRecord,
  ): Promise<{ readonly resolved: ResolvedVariables } | null> {
    const release = await this.declaringRelease(app);
    if (!release) return null;
    return {
      resolved: this.resolveFor(release, await this.variablesContext(app)),
    };
  }

  /**
   * What a deployment keeps of its variables: they are resolved against its configuration, a deployment missing a
   * required one is refused (`VARIABLES_MISSING`), secrets the build lets a deployment generate are generated once and
   * kept as the App's values, and a first deployment gets a first administrator of its own when nothing names one.
   */
  private async prepareVariables(
    app: AppRecord,
    release: ReleaseRecord,
    configFile: unknown,
    deploymentId: string,
  ): Promise<{
    readonly env: string | null;
    readonly variablesFingerprint: string | null;
    readonly initialAdmin: string | null;
    readonly initialAdminExpiresAt: Date | null;
  }> {
    let context = await this.variablesContext(app);
    const plan = planGenerated(release.variables, context, configFile);
    const missing = resolveVariables({
      manifest: release.variables,
      environment: context.environmentVariables,
      app: context.appVariables,
      configFile,
      generated: plan.computed,
      generatable: new Set([
        ...plan.persistent.keys(),
        ...plan.oneShot.keys(),
        ...(plan.initialAdmin ? [plan.initialAdmin.name] : []),
      ]),
    }).missing;
    if (missing.length > 0) throw variablesMissing(app, release, missing);
    if (plan.persistent.size > 0) {
      for (const [name, variable] of plan.persistent)
        await this.options.variables.setAppVariable(app.id, name, {
          value: generateVariable(variable.generate!),
          secret: variable.secret || isSecretName(name),
          generated: true,
          by: null,
        });
      context = {
        ...context,
        appVariables: await this.options.variables.appVariables(app.id),
      };
    }
    const generated: Record<string, string> = { ...plan.computed };
    for (const [name, variable] of plan.oneShot)
      generated[name] = generateVariable(variable.generate!);
    let initialAdmin: string | null = null;
    let initialAdminExpiresAt: Date | null = null;
    if (plan.initialAdmin) {
      const password =
        (await this.earlierInitialAdmin(app))?.password ?? randomPassword();
      generated[plan.initialAdmin.name] = password;
      const admin = {
        username: plan.initialAdmin.username,
        email: plan.initialAdmin.email,
        password,
      };
      initialAdmin = encryptText(
        JSON.stringify(admin),
        [deploymentId],
        this.options.secrets,
        'initial-admin',
      );
      // A preview App's goes with the preview; any other's is deleted after a day.
      initialAdminExpiresAt = app.previewOf
        ? null
        : new Date(Date.now() + INITIAL_ADMIN_TTL_MS);
    }
    const resolved = resolveVariables({
      manifest: release.variables,
      environment: context.environmentVariables,
      app: context.appVariables,
      configFile,
      generated,
    });
    const names = Object.keys(resolved.env);
    if (names.length > 0)
      this.logDeploymentVariables(app.id, deploymentId, resolved);
    return {
      env:
        names.length === 0
          ? null
          : encryptText(
              JSON.stringify(resolved.env),
              [deploymentId],
              this.options.secrets,
              'deployment-env',
            ),
      variablesFingerprint:
        release.variables || names.length > 0 ? resolved.fingerprint : null,
      initialAdmin,
      initialAdminExpiresAt,
    };
  }

  /**
   * The first administrator an earlier first deployment that did not succeed generated: the database it reached may
   * already hold it, so a retry keeps the same password.
   */
  private async earlierInitialAdmin(
    app: AppRecord,
  ): Promise<{ readonly password: string } | null> {
    if (app.currentDeploymentId) return null;
    const row = await this.query()
      .selectFrom('relDeployments')
      .selectAll()
      .where('appId', '=', app.id)
      .where('initialAdmin', 'is not', null)
      .orderBy('createdAt', 'desc')
      .executeTakeFirst<Row>();
    return row ? this.openInitialAdmin(decodeDeployment(row)) : null;
  }

  /** Records which variables a deployment got and from where; never their values. */
  private logDeploymentVariables(
    appId: string,
    deploymentId: string,
    resolved: ResolvedVariables,
  ): void {
    if (this.options.logging?.deployments?.enabled === false) return;
    const sources = resolved.variables
      .filter((variable) => variable.value !== undefined)
      .map((variable) => `${variable.name} (${variable.source})`);
    try {
      appendJournal(
        this.deploymentLogPath(appId, deploymentId),
        {
          time: new Date().toISOString(),
          level: 'info',
          appId,
          deploymentId,
          phase: 'queued',
          msg: `Variables: ${sources.join(', ')}`,
        },
        this.options.logging?.deployments?.maxFileSizeMB ?? 50,
      );
    } catch (error) {
      reportLoggingFailure('Failed to persist deployment log', error);
    }
  }

  /** The App a preview App previews: one the caller may see. */
  private async previewTarget(
    caller: Caller,
    previewOf: unknown,
  ): Promise<string | null> {
    if (previewOf === undefined || previewOf === null || previewOf === '')
      return null;
    const target =
      typeof previewOf === 'string' ? await this.findApp(previewOf) : null;
    if (!target || !(await this.options.guard.canApp(caller, 'view', target)))
      throw new ReleasesError(
        'previewOf names an App you may see.',
        'INVALID_PREVIEW_OF',
        'INVALID_ARGUMENT',
        {
          fieldViolations: [
            { field: 'previewOf', description: 'No such App.' },
          ],
        },
      );
    return target.id;
  }

  // --- Internals ----------------------------------------------------------------------------------------------

  private async startDeployment(
    caller: Caller,
    app: AppRecord,
    release: ReleaseRecord,
    options: StartDeploymentOptions,
    config?: { readonly mode: ConfigMode; readonly content?: string },
    idempotency?: { readonly key: string; readonly fingerprint: string },
  ): Promise<DeploymentView> {
    await this.requireNoPendingDeployment(app.id);
    const deployment = await this.buildDeploymentRecord(app, release, caller, {
      kind: options.kind,
      rollbackTargetDeploymentId: options.rollbackTargetDeploymentId ?? null,
      requestId: options.requestId ?? null,
      config,
    });
    try {
      await this.options.database.transaction(async (connection) => {
        await this.requireNoPendingDeployment(app.id, connection);
        await connection.query
          .insertInto('relDeployments')
          .values(encodeDeployment(deployment))
          .execute();
        if (idempotency)
          await connection.query
            .insertInto('relDeployRequests')
            .values({
              appId: app.id,
              requestKey: idempotency.key,
              fingerprint: idempotency.fingerprint,
              deploymentId: deployment.id,
            })
            .execute();
        await connection.query
          .updateTable('relApps')
          .set({ updatedAt: new Date() })
          .where('id', '=', app.id)
          .execute();
      });
    } catch (error) {
      if (deployment.configPath)
        await rm(deployment.configPath, { force: true });
      throw error;
    }
    this.schedule(deployment);
    return {
      ...deploymentView(deployment, {
        version: release.version,
        checksum: release.checksum,
      }),
      reused: false,
    };
  }

  private async replayDeployRequest(
    appId: string,
    requestKey: string,
    fingerprint: string,
  ): Promise<DeploymentView | null> {
    const existing = await this.query()
      .selectFrom('relDeployRequests')
      .selectAll()
      .where('appId', '=', appId)
      .where('requestKey', '=', requestKey)
      .executeTakeFirst<Row>();
    if (!existing) return null;
    if (existing.fingerprint !== fingerprint)
      throw new ReleasesError(
        'Idempotency key was used for another deployment.',
        'IDEMPOTENCY_CONFLICT',
        'ABORTED',
      );
    const deployment = await this.requireDeployment(
      appId,
      String(existing.deploymentId),
    );
    const release = await this.findRelease(appId, deployment.releaseId);
    return {
      ...deploymentView(
        deployment,
        release
          ? { version: release.version, checksum: release.checksum }
          : null,
      ),
      reused: true,
    };
  }

  private async existingRelease(
    appId: string,
    checksum: string,
    requestKey?: string,
    configFingerprint: string | null = null,
    requiresDeployment: boolean = false,
  ): Promise<ReleaseView | null> {
    const request = requestKey
      ? await this.query()
          .selectFrom('relUploadRequests')
          .selectAll()
          .where('appId', '=', appId)
          .where('requestKey', '=', requestKey)
          .executeTakeFirst<Row>()
      : undefined;
    if (request && request.checksum !== checksum)
      throw new ReleasesError(
        'Idempotency key was used for another artifact.',
        'IDEMPOTENCY_CONFLICT',
        'ABORTED',
      );
    const canonical = await this.query()
      .selectFrom('relReleaseChecksums')
      .selectAll()
      .where('appId', '=', appId)
      .where('checksum', '=', checksum)
      .executeTakeFirst<Row>();
    if (!canonical) return null;
    const deploymentId = nullableString(canonical.deploymentId);
    if (requiresDeployment && !deploymentId)
      throw new ReleasesError(
        `Release ${String(canonical.releaseId)} already exists without a deployment; deploy it by its release ID.`,
        'RELEASE_EXISTS',
        'ALREADY_EXISTS',
      );
    if (
      requiresDeployment &&
      nullableString(canonical.configFingerprint) !== configFingerprint
    )
      throw new ReleasesError(
        'This artifact was already uploaded with different configuration; deploy it by its release ID instead.',
        'IDEMPOTENCY_CONFLICT',
        'ABORTED',
      );
    if (requestKey && !request) {
      try {
        await this.query()
          .insertInto('relUploadRequests')
          .values({
            appId,
            requestKey,
            checksum,
            releaseId: canonical.releaseId,
          })
          .execute();
      } catch (error) {
        const winner = await this.query()
          .selectFrom('relUploadRequests')
          .selectAll()
          .where('appId', '=', appId)
          .where('requestKey', '=', requestKey)
          .executeTakeFirst<Row>();
        if (!winner) throw error;
        if (winner.checksum !== checksum)
          throw new ReleasesError(
            'Idempotency key was used for another artifact.',
            'IDEMPOTENCY_CONFLICT',
            'ABORTED',
          );
      }
    }
    const release = await this.requireRelease(
      appId,
      String(canonical.releaseId),
    );
    return { ...releaseView(release), reused: true, deploymentId };
  }

  private async assertEnvironmentCapacity(
    environment: EnvironmentRecord,
  ): Promise<void> {
    if (
      environment.maxApps !== null &&
      (await this.countApps(environment.id)) >= environment.maxApps
    )
      throw new ReleasesError(
        'This environment holds as many applications as it may.',
        'ENVIRONMENT_FULL',
        'FAILED_PRECONDITION',
      );
  }

  private async removeApp(app: AppRecord, caller: Caller): Promise<void> {
    await this.withLock(`publish:${app.id}`, () =>
      this.withLock(app.id, async () => {
        const current = await this.findApp(app.id);
        if (!current) return;
        const releases = await this.query()
          .selectFrom('relReleases')
          .select('artifactKey')
          .where('appId', '=', app.id)
          .execute<Row>();
        await (
          await this.session(app.environmentId)
        ).remove(app.id, { purgeData: true });
        await this.options.database.transaction(async (connection) => {
          for (const table of [
            'relReleaseArtifacts',
            'relReleaseChecksums',
            'relUploadRequests',
            'relDeployRequests',
            'relDeploymentRequests',
            'relUploadTickets',
            'relDeployments',
            'relReleases',
          ])
            await connection.query
              .deleteFrom(table)
              .where('appId', '=', app.id)
              .execute();
          await this.options.variables.removeApp(app.id, connection);
          await connection.query
            .deleteFrom('relApps')
            .where('id', '=', app.id)
            .execute();
        });
        await Promise.allSettled([
          ...releases
            .filter((row) => row.artifactKey)
            .map((row) => this.disk.delete(String(row.artifactKey))),
          rm(path.join(this.deploymentLogsDir(), app.id), {
            recursive: true,
            force: true,
          }),
          rm(path.join(this.configsDir(), app.id), {
            recursive: true,
            force: true,
          }),
        ]);
      }),
    );
    await this.options.events.emit({
      type: 'app.removed',
      app: appView(app),
      actor: actorOf(caller),
    });
  }

  private async summarize(apps: readonly AppRecord[]): Promise<AppSummary[]> {
    if (!apps.length) return [];
    if (this.restoring)
      await Promise.race([this.restoring, delay(DEFAULT_STARTUP_WAIT_MS)]);
    const ids = apps.map((app) => app.id);
    const [releases, pending, currentReleases] = await Promise.all([
      this.query()
        .selectFrom('relReleases')
        .select('appId')
        .distinct()
        .where('appId', 'in', ids)
        .execute<Row>(),
      this.query()
        .selectFrom('relDeployments')
        .select('appId')
        .distinct()
        .where('appId', 'in', ids)
        .where('status', 'in', ['queued', 'deploying'])
        .execute<Row>(),
      this.query()
        .selectFrom('relApps')
        .innerJoin(
          'relDeployments as current',
          'relApps.currentDeploymentId',
          'current.id',
        )
        .innerJoin('relReleases as release', 'current.releaseId', 'release.id')
        .select(['relApps.id as appId', 'release.version as version'])
        .where('relApps.id', 'in', ids)
        .execute<Row>(),
    ]);
    const released = new Set(releases.map((row) => String(row.appId)));
    const pendingApps = new Set(pending.map((row) => String(row.appId)));
    const versions = new Map(
      currentReleases.map((row) => [String(row.appId), String(row.version)]),
    );
    const environments = new Map<string, EnvironmentRecord | null>();
    const statuses = new Map<
      string,
      ReadonlyMap<string, AppObservedStatus> | Error
    >();
    const sessions = new Map<string, DriverSession | null>();
    for (const environmentId of new Set(apps.map((app) => app.environmentId))) {
      environments.set(
        environmentId,
        await this.options.environments.find(environmentId),
      );
      const environmentApps = apps.filter(
        (app) => app.environmentId === environmentId,
      );
      try {
        const session = await this.session(environmentId);
        sessions.set(environmentId, session);
        statuses.set(
          environmentId,
          await session.status(environmentApps.map((app) => app.id)),
        );
      } catch (error) {
        sessions.set(environmentId, null);
        statuses.set(
          environmentId,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
    return apps.map((app) => {
      const environment = environments.get(app.environmentId) ?? null;
      const status = statuses.get(app.environmentId);
      const session = sessions.get(app.environmentId) ?? null;
      return {
        app: appView(app),
        environment: {
          id: app.environmentId,
          name: environment?.name ?? app.environmentId,
          protected: environment?.protected ?? false,
          runsImages: environment
            ? this.options.environments.runsImages(environment)
            : false,
        },
        runtime: runtimeStatus(status, app.id),
        url: session ? session.url(app.id) : null,
        currentVersion: versions.get(app.id) ?? null,
        hasReleases: released.has(app.id),
        hasPendingDeployment: pendingApps.has(app.id),
      };
    });
  }

  private async findAppIdsBySearch(search: string): Promise<readonly string[]> {
    const connection = this.options.database.connection();
    const physical = await connection.collections.getPhysical('relApps');
    if (!physical) throw new Error('The releases schema is unavailable.');
    const knex = await connection.client<Knex>();
    // A raw query bypasses the repository that scopes a table to its schema, so name the schema here. The columns are
    // literals bound as identifiers; the only untrusted value is the bound search term.
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

  /** Opens (once) the driver session of an environment. */
  private session(environmentId: string): Promise<DriverSession> {
    if (this.closed)
      return Promise.reject(new Error('Release management is shut down.'));
    let session = this.sessions.get(environmentId);
    if (!session) {
      session = this.options.environments
        .driverEnvironment(environmentId)
        .then(({ driver, target }) =>
          driver.open(target, {
            desired: () => this.desiredSet(environmentId),
          }),
        );
      session.catch(() => {
        if (this.sessions.get(environmentId) === session)
          this.sessions.delete(environmentId);
      });
      this.sessions.set(environmentId, session);
    }
    return session;
  }

  private async desiredSet(
    environmentId: string,
  ): Promise<readonly AppDeploymentSpec[]> {
    const rows = await this.query()
      .selectFrom('relApps')
      .selectAll()
      .where('environmentId', '=', environmentId)
      .orderBy('id', 'asc')
      .execute<Row>();
    const specs: AppDeploymentSpec[] = [];
    for (const app of rows.map(decodeApp)) {
      const deployment = await this.currentDeployment(app);
      if (deployment) specs.push(await this.deploymentSpec(app, deployment));
    }
    return specs;
  }

  /**
   * The release's images a Docker environment pulls: those in its registry (by host and namespace) with the
   * registry's pull credentials, or every image of the release, pulled anonymously, when it names no registry. Null
   * for an environment that runs archives.
   */
  private async imagesFor(
    environmentId: string,
    releaseId: string,
  ): Promise<{
    readonly images: readonly ImageArtifact[];
    readonly auth: RegistryAuth | undefined;
    readonly registry: string | null;
  } | null> {
    const { environment, driver } =
      await this.options.environments.driverEnvironment(environmentId);
    if (capabilitiesFor(driver, environment.config).images !== true)
      return null;
    const pull = environment.registryId
      ? await this.options.registries.pullAuth(environment.registryId)
      : null;
    const prefix = pull
      ? `${pull.registry.host}/${pull.registry.namespace ? `${pull.registry.namespace}/` : ''}`
      : '';
    const images = (
      (await this.artifacts.imagesOf([releaseId])).get(releaseId) ?? []
    )
      .filter((image) => image.ref.startsWith(prefix))
      .map((image) => ({
        ref: image.ref,
        digest: image.digest,
        platform: image.platform,
      }));
    return {
      images,
      auth: pull?.auth,
      registry: pull?.registry.name ?? null,
    };
  }

  /**
   * Refuses a release the environment cannot run, before a deployment starts: an in-process environment runs release
   * archives, a Docker environment release images (from its registry when it names one).
   */
  private async assertRunnable(
    app: AppRecord,
    release: ReleaseRecord,
  ): Promise<void> {
    const found = await this.imagesFor(app.environmentId, release.id);
    if (found === null) {
      if (release.kind === 'archive') return;
      throw new ReleasesError(
        `This environment runs release archives in process; release ${release.version} is an image. Upload the archive (\`release upload\` in the CLI), or deploy the image to a Docker environment.`,
        'ARCHIVE_REQUIRED',
        'FAILED_PRECONDITION',
      );
    }
    if (found.images.length > 0) return;
    throw new ReleasesError(
      release.kind === 'archive'
        ? `This environment runs release images; release ${release.version} is an archive. Register the image your CI pushed (\`release image\` in the CLI), then deploy it.`
        : `Release ${release.version} has no image in this environment's registry (${found.registry ?? 'none'}).`,
      'IMAGE_REQUIRED',
      'FAILED_PRECONDITION',
    );
  }

  private async deploymentSpec(
    app: AppRecord,
    deployment: DeploymentRecord,
    desiredState: 'running' | 'stopped' = app.enabled ? 'running' : 'stopped',
  ): Promise<AppDeploymentSpec> {
    const release = await this.requireRelease(app.id, deployment.releaseId);
    const images = await this.imagesFor(app.environmentId, release.id).catch(
      () => null,
    );
    return {
      deploymentId: deployment.id,
      appId: app.id,
      kind: deployment.kind,
      release: {
        id: release.id,
        version: release.version,
        checksum: release.checksum,
      },
      ...(release.artifactKey
        ? {
            artifact: {
              key: release.artifactKey,
              checksum: release.checksum,
              version: release.version,
              size: release.size ?? 0,
              open: async () =>
                Readable.from(await this.disk.getStream(release.artifactKey!)),
            },
          }
        : {}),
      config:
        deployment.configMode === 'file'
          ? {
              mode: 'file',
              content: (await this.readDeploymentConfig(deployment)) ?? '',
              revision: deployment.id,
            }
          : { mode: 'external' },
      ...(deployment.env ? { env: this.openDeploymentEnv(deployment) } : {}),
      desiredState,
      activation: app.activation,
      idleStopMinutes: app.idleStopMinutes,
      dormantAfterHours: app.dormantAfterHours,
      ...(images
        ? {
            images: images.images,
            ...(images.auth ? { registryAuth: images.auth } : {}),
          }
        : {}),
    };
  }

  private async buildDeploymentRecord(
    app: AppRecord,
    release: ReleaseRecord,
    caller: Caller,
    options: StartDeploymentOptions & {
      readonly config?: {
        readonly mode: ConfigMode;
        readonly content?: string;
      };
    },
  ): Promise<DeploymentRecord> {
    await this.assertRunnable(app, release);
    const id = randomUUID();
    const current = await this.currentDeployment(app);
    let configMode: ConfigMode =
      options.config?.mode ?? current?.configMode ?? 'file';
    if (options.kind === 'rollback' && options.rollbackTargetDeploymentId) {
      const target = await this.requireDeployment(
        app.id,
        options.rollbackTargetDeploymentId,
      );
      configMode = target.configMode;
    }
    const content =
      configMode === 'file'
        ? await this.deploymentConfig(app, release, current, options.config)
        : null;
    const prepared = await this.prepareVariables(
      app,
      release,
      content === null ? {} : parseConfig(content),
      id,
    );
    let configPath: string | null = null;
    if (content !== null) {
      configPath = path.join(this.configsDir(), app.id, `${id}.yml`);
      await writeTextAtomic(configPath, content);
    }
    return {
      id,
      appId: app.id,
      releaseId: release.id,
      kind: options.kind,
      rollbackTargetDeploymentId: options.rollbackTargetDeploymentId ?? null,
      previousDeploymentId: app.currentDeploymentId,
      status: 'queued',
      phase: 'queued',
      configMode,
      configPath,
      error: null,
      actorId: caller.userId,
      actorKind: caller.kind,
      requestId: options.requestId ?? null,
      artifactKind: null,
      imageRef: null,
      imageDigest: null,
      imagePlatform: null,
      ...prepared,
      initialAdminSavedBy: null,
      initialAdminSavedAt: null,
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
    };
  }

  /**
   * The `config.yml` a deployment starts with: the caller's (its masked secrets keeping the stored values), else the
   * App's current one, else the release's template for a new App. A secret the build declares a variable for is left
   * to that variable; the others are generated into the file when missing, as is the public origin.
   */
  private async deploymentConfig(
    app: AppRecord,
    release: ReleaseRecord,
    current: DeploymentRecord | null,
    config:
      { readonly mode: ConfigMode; readonly content?: string } | undefined,
  ): Promise<string> {
    const currentContent = current
      ? await this.readDeploymentConfig(current)
      : null;
    // A release template initializes a new App; it never replaces configuration the App already uses. Content the
    // caller gives may carry masked secrets from `readConfig`, which keep the App's stored values.
    let content =
      config?.content !== undefined
        ? restoreConfigSecrets(config.content, currentContent)
        : (currentContent ?? release.configTemplate ?? '');
    content = ensureConfigSecrets(content, currentContent ?? undefined, {
      skip: declaredSecretSections(release.variables),
    });
    if (!declaresPath(release.variables, PUBLIC_ORIGIN_PATH))
      content = ensurePublicOrigin(content, await this.appUrl(app));
    validateYamlConfig(content);
    return content;
  }

  /** The App's public URL, absolute: one under a path of this application's origin takes that origin. */
  private async appUrl(app: AppRecord): Promise<string | null> {
    const url = await this.session(app.environmentId)
      .then((session) => session.url(app.id))
      .catch(() => null);
    if (!url) return null;
    if (/^https?:\/\//iu.test(url)) return url;
    if (!this.options.publicOrigin || !url.startsWith('/')) return null;
    try {
      return new URL(url, this.options.publicOrigin).toString();
    } catch {
      return null;
    }
  }

  private schedule(deployment: DeploymentRecord): void {
    this.logDeployment(deployment, 'queued', 'Deployment queued');
    const run = this.withLock(deployment.appId, () =>
      this.runDeployment(deployment.id),
    )
      .catch((error: unknown) =>
        this.diagnostic.error(
          `Deployment ${deployment.id} failed unexpectedly`,
          error,
        ),
      )
      .finally(() => {
        this.running.delete(run);
        if (this.runs.get(deployment.id) === run)
          this.runs.delete(deployment.id);
      });
    this.running.add(run);
    this.runs.set(deployment.id, run);
  }

  private async runDeployment(deploymentId: string): Promise<void> {
    const deployment = await this.requireDeploymentById(deploymentId);
    const app = await this.requireApp(deployment.appId);
    const release = await this.requireRelease(app.id, deployment.releaseId);
    const previous = await this.currentDeployment(app);
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
    let outcome: { ok: true } | { ok: false; error: string };
    try {
      this.logDeployment(deployment, 'resolving', 'Deployment started');
      const session = await this.session(app.environmentId);
      const logsEnabled = this.options.logging?.deployments?.enabled !== false;
      const spec = await this.deploymentSpec(
        { ...app, enabled: true },
        deployment,
        'running',
      );
      // A driver that runs no images runs the archive; one that does says what it ran (`DeploymentEvent.artifact`).
      if (spec.images === undefined)
        await this.updateDeployment(
          deploymentId,
          artifactColumns({ kind: 'tarball' }),
        );
      const observed = await session.apply(spec, (entry) => {
        if (typeof entry.sequence === 'number') {
          if (entry.sequence <= lastSequence) return;
          lastSequence = entry.sequence;
        }
        const artifact = deploymentArtifactOf(entry);
        if (artifact)
          phaseWrites = phaseWrites
            .then(() =>
              this.updateDeployment(deploymentId, artifactColumns(artifact)),
            )
            .catch((error: unknown) => {
              phaseError =
                error instanceof Error ? error : new Error(String(error));
            });
        if (typeof entry.phase === 'string') {
          const phase = entry.phase as DeploymentPhase;
          phaseWrites = phaseWrites
            .then(() => this.updateDeployment(deploymentId, { phase }))
            .catch((error: unknown) => {
              phaseError =
                error instanceof Error ? error : new Error(String(error));
            });
        }
        if (logsEnabled)
          this.appendDeploymentLog(deployment, {
            time: new Date().toISOString(),
            level: 'info',
            msg: '',
            ...entry,
            appId: app.id,
            deploymentId: deployment.id,
          });
      });
      await phaseWrites;
      if (phaseError) throw phaseError;
      if (observed.state === 'failed' || observed.state === 'unknown')
        throw new Error(
          observed.error ?? 'The runtime did not report the deployment.',
        );
      await this.markSucceeded(deployment, app.id, previous);
      outcome = { ok: true };
    } catch (error) {
      await phaseWrites.catch(() => undefined);
      outcome = { ok: false, error: errorMessage(error) };
      await this.markFailed(deployment, error);
    } finally {
      const policy = this.options.logging?.deployments;
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
    await this.emitOutcome(deployment, app, release, outcome);
  }

  private async markSucceeded(
    deployment: DeploymentRecord,
    appId: string,
    previous: DeploymentRecord | null,
  ): Promise<void> {
    this.logDeployment(deployment, 'completed', 'Deployment succeeded');
    const finishedAt = new Date();
    await this.options.database.transaction(async (connection) => {
      await connection.query
        .updateTable('relDeployments')
        .set({ status: 'succeeded', phase: 'completed', finishedAt })
        .where('id', '=', deployment.id)
        .execute();
      await connection.query
        .updateTable('relApps')
        .set({
          currentDeploymentId: deployment.id,
          enabled: true,
          updatedAt: finishedAt,
        })
        .where('id', '=', appId)
        .execute();
      await this.settleRequest(connection, deployment, 'deployed', finishedAt);
    });
    if (previous?.configPath && previous.id !== deployment.id)
      await rm(previous.configPath, { force: true }).catch(() => undefined);
  }

  private async markFailed(
    deployment: DeploymentRecord,
    error: unknown,
  ): Promise<void> {
    this.logDeployment(deployment, 'completed', 'Deployment failed', error);
    const finishedAt = new Date();
    await this.options.database.transaction(async (connection) => {
      await connection.query
        .updateTable('relDeployments')
        .set({
          status: 'failed',
          phase: 'completed',
          error: errorMessage(error),
          finishedAt,
        })
        .where('id', '=', deployment.id)
        .execute();
      await this.settleRequest(connection, deployment, 'failed', finishedAt);
    });
  }

  /**
   * An approved deployment request follows the deployment it started, in the same transaction that finishes the
   * deployment: a reader who sees the deployment finished never sees its request still `approved`.
   */
  private async settleRequest(
    connection: DatabaseConnection,
    deployment: DeploymentRecord,
    status: 'deployed' | 'failed',
    at: Date,
  ): Promise<void> {
    if (!deployment.requestId) return;
    await connection.query
      .updateTable('relDeploymentRequests')
      .set({ status, updatedAt: at })
      .where('id', '=', deployment.requestId)
      .where('status', '=', 'approved')
      .execute();
  }

  private async emitOutcome(
    deployment: DeploymentRecord,
    app: AppRecord,
    release: ReleaseRecord,
    outcome: { ok: true } | { ok: false; error: string },
  ): Promise<void> {
    const finished = await this.requireDeploymentById(deployment.id);
    const view = deploymentView(finished, {
      version: release.version,
      checksum: release.checksum,
    });
    const actor = { userId: deployment.actorId, kind: deployment.actorKind };
    const appAfter = (await this.findApp(app.id)) ?? app;
    await this.options.events.emit(
      outcome.ok
        ? {
            type:
              deployment.kind === 'rollback'
                ? 'deployment.rolledBack'
                : 'deployment.succeeded',
            app: appView(appAfter),
            deployment: view,
            release: releaseView(release),
            actor,
          }
        : {
            type: 'deployment.failed',
            app: appView(appAfter),
            deployment: view,
            release: releaseView(release),
            error: outcome.error,
            actor,
          },
    );
  }

  /**
   * Finalises a deployment the previous process left `deploying`, from the outcome the target recorded (a Host's
   * operation log). Resolves once the deployment is recorded.
   */
  private finaliseDeployment(
    deployment: DeploymentRecord,
    read: () => Promise<AppObservedStatus | null>,
  ): Promise<void> {
    const run = this.withLock(deployment.appId, async () => {
      let status: AppObservedStatus | null;
      try {
        status = await read();
      } catch (error) {
        status = {
          state: 'failed',
          version: null,
          deploymentId: deployment.id,
          startedAt: null,
          error: `Could not read the outcome: ${errorMessage(error)}`,
        };
      }
      const current = await this.requireDeploymentById(deployment.id);
      if (current.status !== 'deploying' && current.status !== 'queued') return;
      const app = await this.requireApp(deployment.appId);
      const release = await this.requireRelease(app.id, deployment.releaseId);
      let outcome: { ok: true } | { ok: false; error: string };
      if (status?.state === 'running') {
        const previous = deployment.previousDeploymentId
          ? await this.requireDeployment(
              app.id,
              deployment.previousDeploymentId,
            ).catch(() => null)
          : null;
        this.logDeployment(
          deployment,
          'switching',
          'The runtime reports the deployment finished',
        );
        await this.markSucceeded(deployment, app.id, previous);
        outcome = { ok: true };
      } else {
        const error = status
          ? (status.error ?? 'The deployment failed.')
          : 'Deployment was interrupted by a restart.';
        await this.markFailed(deployment, new Error(error));
        outcome = { ok: false, error };
      }
      await this.emitOutcome(deployment, app, release, outcome);
    })
      .catch((error: unknown) =>
        this.diagnostic.error(
          `Failed to finalise deployment ${deployment.id}`,
          error,
        ),
      )
      .finally(() => {
        this.running.delete(run);
        if (this.runs.get(deployment.id) === run)
          this.runs.delete(deployment.id);
      });
    this.running.add(run);
    this.runs.set(deployment.id, run);
    return run;
  }

  private async requireNoPendingDeployment(
    appId: string,
    connection?: DatabaseConnection,
  ): Promise<void> {
    const pending = await (connection?.query ?? this.query())
      .selectFrom('relDeployments')
      .select('id')
      .where('appId', '=', appId)
      .where('status', 'in', ['queued', 'deploying'])
      .executeTakeFirst<Row>();
    if (pending)
      throw new ReleasesError(
        'A deployment is already in progress.',
        'DEPLOYMENT_IN_PROGRESS',
        'FAILED_PRECONDITION',
      );
  }

  public async findRelease(
    appId: string,
    releaseId: string,
  ): Promise<ReleaseRecord | null> {
    const row = await this.query()
      .selectFrom('relReleases')
      .selectAll()
      .where('id', '=', releaseId)
      .where('appId', '=', appId)
      .executeTakeFirst<Row>();
    return row ? decodeRelease(row) : null;
  }

  private async requireDeployment(
    appId: string,
    deploymentId: string,
  ): Promise<DeploymentRecord> {
    const row = await this.query()
      .selectFrom('relDeployments')
      .selectAll()
      .where('appId', '=', appId)
      .where('id', '=', deploymentId)
      .executeTakeFirst<Row>();
    if (!row)
      throw notFound('Deployment', 'DEPLOYMENT_NOT_FOUND', deploymentId);
    return decodeDeployment(row);
  }

  private async requireDeploymentById(
    deploymentId: string,
  ): Promise<DeploymentRecord> {
    const row = await this.query()
      .selectFrom('relDeployments')
      .selectAll()
      .where('id', '=', deploymentId)
      .executeTakeFirst<Row>();
    if (!row)
      throw notFound('Deployment', 'DEPLOYMENT_NOT_FOUND', deploymentId);
    return decodeDeployment(row);
  }

  private async currentDeployment(
    app: AppRecord,
  ): Promise<DeploymentRecord | null> {
    return app.currentDeploymentId
      ? await this.requireDeployment(app.id, app.currentDeploymentId).catch(
          () => null,
        )
      : null;
  }

  private async readDeploymentConfig(
    deployment: DeploymentRecord,
  ): Promise<string | null> {
    if (deployment.configMode !== 'file' || !deployment.configPath) return null;
    try {
      return await readFile(deployment.configPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  private async updateDeployment(
    deploymentId: string,
    values: Row,
  ): Promise<void> {
    await this.query()
      .updateTable('relDeployments')
      .set(values)
      .where('id', '=', deploymentId)
      .execute();
  }

  private async updateApp_(appId: string, values: Row): Promise<void> {
    await this.query()
      .updateTable('relApps')
      .set({ ...values, updatedAt: new Date() })
      .where('id', '=', appId)
      .execute();
  }

  private deploymentLogsDir(): string {
    return path.join(this.options.dataDir, 'deployment-logs');
  }

  private configsDir(): string {
    return path.join(this.options.dataDir, 'app-configs');
  }

  private deploymentLogPath(appId: string, deploymentId: string): string {
    if (!APP_ID_PATTERN.test(appId) || !/^[a-zA-Z0-9_-]+$/.test(deploymentId))
      throw new ReleasesError(
        'Invalid log identity.',
        'INVALID_LOG_ID',
        'INVALID_ARGUMENT',
      );
    return path.join(this.deploymentLogsDir(), appId, `${deploymentId}.log`);
  }

  private logDeployment(
    deployment: DeploymentRecord,
    phase: string,
    msg: string,
    err?: unknown,
  ): void {
    if (this.options.logging?.deployments?.enabled === false) return;
    this.appendDeploymentLog(deployment, {
      time: new Date().toISOString(),
      level: err ? 'error' : 'info',
      appId: deployment.appId,
      deploymentId: deployment.id,
      phase,
      msg,
      ...(err ? { err: errorMessage(err) } : {}),
    });
  }

  private appendDeploymentLog(
    deployment: DeploymentRecord,
    entry: Parameters<typeof appendJournal>[1],
  ): void {
    try {
      appendJournal(
        this.deploymentLogPath(deployment.appId, deployment.id),
        entry,
        this.options.logging?.deployments?.maxFileSizeMB ?? 50,
      );
    } catch (error) {
      reportLoggingFailure('Failed to persist deployment log', error);
    }
  }

  private async withLock<T>(key: string, work: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(work);
    this.locks.set(key, current);
    try {
      return await current;
    } finally {
      if (this.locks.get(key) === current) this.locks.delete(key);
    }
  }

  private query(): DatabaseConnection['query'] {
    return this.options.database.connection().query;
  }
}

// --- Variables --------------------------------------------------------------------------------------------------

const INITIAL_ADMIN_TTL_MS = 24 * 60 * 60 * 1000;

interface VariablesContext {
  readonly environment: EnvironmentRecord;
  readonly environmentVariables: readonly StoredEnvironmentVariable[];
  readonly appVariables: readonly StoredAppVariable[];
  /** The configuration the App runs with now, parsed; null before its first deployment. */
  readonly configFile: unknown;
  /** What its running deployment got; null before its first. */
  readonly running: Readonly<Record<string, string>> | null;
  /** Its public URL, absolute. */
  readonly url: string | null;
  /** It has never been deployed. */
  readonly first: boolean;
}

/** What a deployment would generate, by variable. */
interface GenerationPlan {
  /** Secrets generated once and kept as the App's values. */
  readonly persistent: Map<string, ReleaseVariable>;
  /** Generated for the first start only. */
  readonly oneShot: Map<string, ReleaseVariable>;
  /** Derived each time: the public origin, sample data on a first deployment. */
  readonly computed: Record<string, string>;
  /** The first administrator's password variable, with the name and email it signs in with. */
  initialAdmin: {
    readonly name: string;
    readonly username: string;
    readonly email: string;
  } | null;
}

/** A variable's value from the App or the environment, when one of them sets it. */
function suppliedValue(
  context: VariablesContext,
  name: string,
): string | undefined {
  return (
    context.appVariables.find((variable) => variable.name === name)?.value ??
    context.environmentVariables.find((variable) => variable.name === name)
      ?.value ??
    undefined
  );
}

function planGenerated(
  manifest: ReleaseVariablesManifest | null,
  context: VariablesContext,
  configFile: unknown,
): GenerationPlan {
  const plan: GenerationPlan = {
    persistent: new Map(),
    oneShot: new Map(),
    computed: {},
    initialAdmin: null,
  };
  if (!manifest) return plan;
  /** A field of the first administrator: a variable's value, else the configuration's, else the default. */
  const adminField = (field: 'username' | 'email'): string => {
    const path = INITIAL_ADMIN_PATHS[field];
    const variable = manifest.variables.find((item) => item.path === path);
    const supplied = variable
      ? suppliedValue(context, variable.name)
      : undefined;
    if (supplied) return supplied;
    const configured = configValueAt(configFile, path);
    return typeof configured === 'string' && hasRealValue(configFile, path)
      ? configured
      : DEFAULT_INITIAL_ADMIN[field];
  };
  for (const variable of manifest.variables) {
    const { name } = variable;
    if (variable.runtime || RESERVED_VARIABLE_NAMES.includes(name)) continue;
    if (suppliedValue(context, name) !== undefined) continue;
    if (variable.path && hasRealValue(configFile, variable.path)) continue;
    if (variable.path === INITIAL_ADMIN_PATHS.password) {
      if (context.first)
        plan.initialAdmin = {
          name,
          username: adminField('username'),
          email: adminField('email'),
        };
      continue;
    }
    if (variable.path === PUBLIC_ORIGIN_PATH) {
      if (context.url) plan.computed[name] = new URL(context.url).origin;
      continue;
    }
    if (variable.path === SAMPLE_DATA_PATH) {
      if (context.first && context.environment.sampleDataOnFirstDeploy)
        plan.computed[name] = 'true';
      continue;
    }
    if (!variable.generate) continue;
    if (variable.firstStartOnly) {
      if (context.first) plan.oneShot.set(name, variable);
      continue;
    }
    plan.persistent.set(name, variable);
  }
  return plan;
}

/** The sections whose secret the build lets a deployment generate as a variable, which `config.yml` is then not given. */
function declaredSecretSections(
  manifest: ReleaseVariablesManifest | null,
): ConfigSecretSection[] {
  return (Object.keys(CONFIG_SECRET_PATHS) as ConfigSecretSection[]).filter(
    (section) => declaresPath(manifest, CONFIG_SECRET_PATHS[section]),
  );
}

function declaresPath(
  manifest: ReleaseVariablesManifest | null,
  path: string,
): boolean {
  return (
    manifest?.variables.some((variable) => variable.path === path) ?? false
  );
}

function parseConfig(content: string): unknown {
  try {
    return content.trim() === '' ? {} : (parseYaml(content) as unknown);
  } catch {
    return {};
  }
}

/** The refusal of a deployment whose required variables are not all set; it names them, never a value. */
export function variablesMissing(
  app: Pick<AppRecord, 'id' | 'environmentId'>,
  release: Pick<ReleaseRecord, 'id' | 'version'>,
  missing: readonly ReleaseVariable[],
): ReleasesError {
  const names = missing.map((variable) => variable.name);
  const subject =
    names.length === 1
      ? 'A required variable is'
      : `${names.length} required variables are`;
  return new ReleasesError(
    `${subject} not set for ${app.id} (release ${release.version}): ${names.join(', ')}. Set ${names.length === 1 ? 'it' : 'them'} in the App's or its environment's variables, then deploy again.`,
    'VARIABLES_MISSING',
    'FAILED_PRECONDITION',
    {
      metadata: {
        appId: app.id,
        environmentId: app.environmentId,
        releaseId: release.id,
        variables: missing.map((variable) => ({
          name: variable.name,
          description: variable.description ?? null,
          secret: variable.secret,
        })),
      },
    },
  );
}

// --- Views and codecs -------------------------------------------------------------------------------------------

/** A stored file configuration as it leaves the server: masked. */
function configDocument(content: string): ConfigDocument {
  const masked = maskConfig(content);
  return { mode: 'file', content: masked.content, secrets: masked.secrets };
}

export function appView(app: AppRecord): AppView {
  return {
    id: app.id,
    environmentId: app.environmentId,
    name: app.name,
    description: app.description,
    currentDeploymentId: app.currentDeploymentId,
    enabled: app.enabled,
    activation: app.activation,
    idleStopMinutes: app.idleStopMinutes,
    dormantAfterHours: app.dormantAfterHours,
    labels: app.labels,
    previewOf: app.previewOf,
    createdBy: app.createdBy,
    createdVia: app.createdVia,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export function releaseView(
  release: ReleaseRecord,
  images?: readonly ImageArtifactView[],
): ReleaseView {
  return {
    id: release.id,
    appId: release.appId,
    kind: release.kind,
    version: release.version,
    checksum: release.checksum,
    size: release.size,
    hasConfigTemplate: release.configTemplate !== null,
    labels: release.labels,
    sourceReleaseId: release.sourceReleaseId,
    sourceCommit: release.sourceCommit,
    build: release.build,
    ...(images
      ? {
          artifacts:
            release.kind === 'archive'
              ? [
                  {
                    kind: 'tarball' as const,
                    checksum: release.checksum,
                    size: release.size ?? 0,
                  },
                ]
              : images,
        }
      : {}),
    createdBy: release.createdBy,
    createdVia: release.createdVia,
    createdAt: release.createdAt.toISOString(),
  };
}

export function deploymentView(
  deployment: DeploymentRecord,
  release: { readonly version: string; readonly checksum: string } | null,
): DeploymentView {
  return {
    id: deployment.id,
    appId: deployment.appId,
    releaseId: deployment.releaseId,
    kind: deployment.kind,
    rollbackTargetDeploymentId: deployment.rollbackTargetDeploymentId,
    previousDeploymentId: deployment.previousDeploymentId,
    status: deployment.status,
    phase: deployment.phase,
    configMode: deployment.configMode,
    error: deployment.error,
    actorId: deployment.actorId,
    actorKind: deployment.actorKind,
    requestId: deployment.requestId,
    createdAt: deployment.createdAt.toISOString(),
    startedAt: iso(deployment.startedAt),
    finishedAt: iso(deployment.finishedAt),
    release,
    artifact: deploymentArtifact(deployment),
  };
}

/** What a deployment ran, from its columns. */
function deploymentArtifact(
  deployment: DeploymentRecord,
): DeploymentArtifact | null {
  switch (deployment.artifactKind) {
    case 'tarball':
      return { kind: 'tarball' };
    case 'image':
      return deployment.imageRef && deployment.imageDigest
        ? {
            kind: 'image',
            ref: deployment.imageRef,
            digest: deployment.imageDigest,
            platform: deployment.imagePlatform ?? '',
          }
        : null;
    default:
      return null;
  }
}

function artifactColumns(artifact: DeploymentArtifact): Row {
  return {
    artifactKind: artifact.kind,
    imageRef: artifact.kind === 'image' ? artifact.ref : null,
    imageDigest: artifact.kind === 'image' ? artifact.digest : null,
    imagePlatform: artifact.kind === 'image' ? artifact.platform : null,
  };
}

/** The artifact a driver's event reports, when it reports one. */
function deploymentArtifactOf(
  entry: DeploymentEvent,
): DeploymentArtifact | null {
  const artifact = entry.artifact as Record<string, unknown> | undefined;
  if (!artifact || typeof artifact !== 'object') return null;
  if (
    artifact.kind === 'image' &&
    typeof artifact.ref === 'string' &&
    typeof artifact.digest === 'string'
  )
    return {
      kind: 'image',
      ref: artifact.ref.slice(0, 500),
      digest: artifact.digest.slice(0, 80),
      platform:
        typeof artifact.platform === 'string'
          ? artifact.platform.slice(0, 64)
          : '',
    };
  return null;
}

function normalizeSourceCommit(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^[0-9a-f]{7,64}$/u.test(value))
    throw new ReleasesError(
      'The source commit is a commit hash.',
      'INVALID_SOURCE_COMMIT',
      'INVALID_ARGUMENT',
    );
  return value;
}

/** An image release's version, as CI names it (a semantic version, a date, a tag). */
function normalizeVersion(value: unknown): string {
  if (typeof value !== 'string' || !RELEASE_VERSION_PATTERN.test(value))
    throw new ReleasesError(
      'The version is letters, digits, dots, dashes, underscores and plus signs.',
      'INVALID_VERSION',
      'INVALID_ARGUMENT',
    );
  return value;
}

function normalizeBuild(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 255)
    throw new ReleasesError(
      'The build is text of at most 255 characters.',
      'INVALID_BUILD',
      'INVALID_ARGUMENT',
    );
  return value;
}

function runtimeStatus(
  status: ReadonlyMap<string, AppObservedStatus> | Error | undefined,
  appId: string,
): RuntimeStatus {
  if (!status || status instanceof Error)
    return {
      available: false,
      state: 'unknown',
      version: null,
      startedAt: null,
      error: status instanceof Error ? status.message : null,
      lastAccessedAt: null,
    };
  const item = status.get(appId);
  if (!item)
    return {
      available: true,
      state: 'stopped',
      version: null,
      startedAt: null,
      error: null,
      lastAccessedAt: null,
    };
  return {
    available: true,
    state: item.state,
    version: item.version,
    startedAt: item.startedAt,
    error: item.error,
    lastAccessedAt: item.lastAccessedAt ?? null,
  };
}

function decodeActorKind(value: unknown): ActorKind {
  return value === 'agent' ||
    value === 'key' ||
    value === 'rule' ||
    value === 'system'
    ? value
    : 'human';
}

export function decodeApp(row: Row): AppRecord {
  return {
    id: String(row.id),
    environmentId: String(row.environmentId),
    name: String(row.name),
    description: nullableString(row.description),
    currentDeploymentId: nullableString(row.currentDeploymentId),
    enabled: Boolean(row.enabled),
    activation: row.activation === 'onDemand' ? 'onDemand' : 'eager',
    idleStopMinutes: nullableNumber(row.idleStopMinutes),
    dormantAfterHours: nullableNumber(row.dormantAfterHours),
    labels: decodeLabels(row.labels),
    previewOf: nullableString(row.previewOf),
    createdBy: nullableString(row.createdBy),
    createdVia: decodeActorKind(row.createdVia),
    createdAt: decodeDate(row.createdAt),
    updatedAt: decodeDate(row.updatedAt),
  };
}

function decodeRelease(row: Row): ReleaseRecord {
  return {
    id: String(row.id),
    appId: String(row.appId),
    kind: row.kind === 'image' ? 'image' : 'archive',
    version: String(row.version),
    artifactKey: nullableString(row.artifactKey),
    checksum: String(row.checksum),
    size: nullableNumber(row.size),
    configTemplate: nullableString(row.configTemplate),
    manifest: decodeRecord(row.manifest),
    variables: decodeVariablesManifest(row.variables),
    labels: decodeLabels(row.labels),
    sourceReleaseId: nullableString(row.sourceReleaseId),
    sourceCommit: nullableString(row.sourceCommit),
    build: nullableString(row.build),
    createdBy: nullableString(row.createdBy),
    createdVia: decodeActorKind(row.createdVia),
    createdAt: decodeDate(row.createdAt),
  };
}

function encodeRelease(release: ReleaseRecord): Row {
  return {
    ...release,
    manifest: JSON.stringify(release.manifest),
    variables: release.variables ? JSON.stringify(release.variables) : null,
    labels: JSON.stringify(release.labels),
  };
}

function decodeDeployment(row: Row): DeploymentRecord {
  return {
    id: String(row.id),
    appId: String(row.appId),
    releaseId: String(row.releaseId),
    kind: row.kind === 'rollback' ? 'rollback' : 'deploy',
    rollbackTargetDeploymentId: nullableString(row.rollbackTargetDeploymentId),
    previousDeploymentId: nullableString(row.previousDeploymentId),
    status: String(row.status) as DeploymentStatus,
    phase: String(row.phase) as DeploymentPhase,
    configMode: row.configMode === 'external' ? 'external' : 'file',
    configPath: nullableString(row.configPath),
    error: nullableString(row.error),
    actorId: nullableString(row.actorId),
    actorKind: decodeActorKind(row.actorKind),
    requestId: nullableString(row.requestId),
    artifactKind:
      row.artifactKind === 'tarball' || row.artifactKind === 'image'
        ? row.artifactKind
        : null,
    imageRef: nullableString(row.imageRef),
    imageDigest: nullableString(row.imageDigest),
    imagePlatform: nullableString(row.imagePlatform),
    env: nullableString(row.env),
    variablesFingerprint: nullableString(row.variablesFingerprint),
    initialAdmin: nullableString(row.initialAdmin),
    initialAdminExpiresAt: decodeOptionalDate(row.initialAdminExpiresAt),
    initialAdminSavedBy: nullableString(row.initialAdminSavedBy),
    initialAdminSavedAt: decodeOptionalDate(row.initialAdminSavedAt),
    createdAt: decodeDate(row.createdAt),
    startedAt: decodeOptionalDate(row.startedAt),
    finishedAt: decodeOptionalDate(row.finishedAt),
  };
}

function encodeDeployment(deployment: DeploymentRecord): Row {
  return { ...deployment };
}

function validateDeployConfig(config: unknown): void {
  if (
    !config ||
    typeof config !== 'object' ||
    ((config as { mode?: unknown }).mode !== 'file' &&
      (config as { mode?: unknown }).mode !== 'external')
  )
    throw new ReleasesError(
      'Configuration mode must be file or external.',
      'INVALID_CONFIG_MODE',
      'INVALID_ARGUMENT',
    );
  const content = (config as { content?: unknown }).content;
  if (content !== undefined) {
    if (
      typeof content !== 'string' ||
      Buffer.byteLength(content) > MAX_CONFIG_BYTES
    )
      throw new ReleasesError(
        'Configuration content must be text of at most 1 MiB.',
        'INVALID_DEPLOYMENT_INPUT',
        'INVALID_ARGUMENT',
      );
    validateYamlConfig(content);
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms).unref?.();
  });
}
