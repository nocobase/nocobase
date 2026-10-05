// Input and response schemas of the Hub routes. A route validates its path parameters, query, headers and JSON body
// with these before its handler runs, and declares them in the API document; the service keeps its own checks for
// rules that need the database, and reports them with its own reasons.
import { z } from 'zod';

import {
  HUB_API_KEY_SCOPES,
  type HubApiKeyScope,
} from '../../shared/api-keys.js';
import type {
  CreateHubAppInput,
  DeployHubAppInput,
  HubBuildTarget,
  HubDeploymentPhase,
  HubDeploymentStatus,
  HubObservedState,
  RollbackHubAppInput,
  UpdateHubConfigInput,
  UpdateHubSettingsInput,
} from '../tokens.js';
import type {
  CreatedHubApiKey,
  CreateHubApiKeyInput,
  HubApiKeyAppOption,
  HubApiKeySummary,
} from '../../shared/api-keys.js';
import type { JournalEntry } from '@nocobase/logging';
import type {
  AppDetailResponse,
  AppSummaryResponse,
  ConfigResponse,
  ConfigTemplateResponse,
  DeploymentAcceptedResponse,
  DeploymentListResponse,
  DeploymentResponse,
  DeploymentStatusResponse,
  HostStatusResponse,
  HubRoleResponse,
  LogMetaResponse,
  ReleaseSummaryResponse,
  ReleaseUploadResponse,
  ReusedReleaseUploadResponse,
  RollbackAcceptedResponse,
  SettingsResponse,
  StartedReleaseUploadResponse,
  UploadedReleaseResponse,
} from './responses.js';

const id: z.ZodString = z.string().min(1);

export const AppParams: z.ZodObject<{ appId: z.ZodString }> = z.object({
  appId: id.meta({ description: 'The App ID.' }),
});
export const ApiKeyParams: z.ZodObject<{ keyId: z.ZodString }> = z.object({
  keyId: id,
});
export const ReleaseParams: z.ZodObject<{
  appId: z.ZodString;
  releaseId: z.ZodString;
}> = z.object({ appId: id, releaseId: id });
export const UploadParams: z.ZodObject<{
  appId: z.ZodString;
  uploadId: z.ZodString;
}> = z.object({ appId: id, uploadId: id });
export const DeploymentParams: z.ZodObject<{
  appId: z.ZodString;
  deploymentId: z.ZodString;
}> = z.object({ appId: id, deploymentId: id });

const page: z.ZodDefault<z.ZodCoercedNumber> = z.coerce
  .number()
  .int()
  .min(1)
  .default(1);
const pageSize: z.ZodDefault<z.ZodCoercedNumber> = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(20);

/** Page-number paging, for the administrative tables. */
export const PageQuery: z.ZodObject<{
  page: z.ZodDefault<z.ZodCoercedNumber>;
  pageSize: z.ZodDefault<z.ZodCoercedNumber>;
}> = z.object({ page, pageSize });

export const ListAppsQuery: z.ZodObject<{
  page: z.ZodDefault<z.ZodCoercedNumber>;
  pageSize: z.ZodDefault<z.ZodCoercedNumber>;
  q: z.ZodOptional<z.ZodString>;
}> = z.object({
  page,
  pageSize,
  q: z.string().trim().max(100).optional().meta({
    description: 'Matches App IDs and names, case-insensitively.',
  }),
});

/** The levels a journal entry carries, lowest first. */
export const LOG_LEVELS: readonly [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * A log read. `pageToken` is the `nextPageToken` of the previous read: logs are a feed read forward from it, and
 * reading from the same token again returns what was appended since. A read returns what fits in one bounded chunk
 * of the journal, so there is no `pageSize`.
 */
export const LogQuery: z.ZodObject<{
  pageToken: z.ZodOptional<z.ZodString>;
  level: z.ZodOptional<z.ZodEnum<{ [K in LogLevel]: K }>>;
  source: z.ZodOptional<z.ZodString>;
  q: z.ZodOptional<z.ZodString>;
  since: z.ZodOptional<z.ZodISODateTime>;
  until: z.ZodOptional<z.ZodISODateTime>;
  fromStart: z.ZodOptional<z.ZodEnum<{ true: 'true'; false: 'false' }>>;
}> = z.object({
  pageToken: z.string().optional().meta({
    description:
      'The `nextPageToken` of the previous read; reading from the same token again returns what was written since.',
  }),
  level: z.enum(LOG_LEVELS).optional().meta({
    description: 'Only entries at this level or above.',
  }),
  source: z
    .string()
    .optional()
    .meta({ description: 'Only entries from this source.' }),
  q: z.string().optional().meta({ description: 'Text the entry contains.' }),
  // RFC 3339 in UTC (`Z`), the form journal entries are stored in.
  since: z.iso.datetime().optional().meta({
    description: 'RFC 3339 in UTC, such as `2026-01-01T00:00:00Z`.',
  }),
  until: z.iso.datetime().optional().meta({
    description: 'RFC 3339 in UTC, such as `2026-01-01T00:00:00Z`.',
  }),
  fromStart: z.enum(['true', 'false']).optional().meta({
    description:
      '`true` reads the retained history from its start rather than only its most recent part.',
  }),
});

type ConfigInputSchema = z.ZodObject<
  {
    mode: z.ZodEnum<{ file: 'file'; external: 'external' }>;
    content: z.ZodOptional<z.ZodString>;
  },
  z.core.$strict
>;

const configInput: ConfigInputSchema = z.strictObject({
  mode: z.enum(['file', 'external']).meta({
    description:
      '`file` writes `content` as the App’s `config.yml`; `external` leaves configuration to the App.',
  }),
  content: z
    .string()
    .optional()
    .meta({ description: 'The `config.yml` to deploy with, in `file` mode.' }),
});

export const CreateAppInput: z.ZodObject<
  {
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
  },
  z.core.$strict
> = z.strictObject({
  id: z.string().meta({
    description:
      'Letters, numbers, `_` and `-`, not starting with `__`; the App is served under `/<id>`.',
  }),
  name: z.string(),
  description: z.string().optional(),
}) satisfies z.ZodType<CreateHubAppInput>;

export const UpdateConfigInput: z.ZodObject<
  { content: z.ZodString },
  z.core.$strict
> = z.strictObject({
  content: z.string().meta({ description: 'The new `config.yml`.' }),
}) satisfies z.ZodType<UpdateHubConfigInput>;

export const UpdateSettingsInput: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    activation: z.ZodOptional<z.ZodEnum<{ lazy: 'lazy'; eager: 'eager' }>>;
  },
  z.core.$strict
> = z.strictObject({
  name: z.string().optional(),
  activation: z.enum(['lazy', 'eager']).optional(),
}) satisfies z.ZodType<UpdateHubSettingsInput>;

export const DeployInput: z.ZodObject<
  { releaseId: z.ZodString; config: z.ZodOptional<ConfigInputSchema> },
  z.core.$strict
> = z.strictObject({
  releaseId: id.meta({ description: 'The stored Release to deploy.' }),
  config: configInput.optional().meta({
    description:
      'The configuration to deploy with; the current one is kept when omitted.',
  }),
}) satisfies z.ZodType<Omit<DeployHubAppInput, 'idempotencyKey'>>;

export const RollbackInput: z.ZodObject<
  { deploymentId: z.ZodString; config: z.ZodOptional<ConfigInputSchema> },
  z.core.$strict
> = z.strictObject({
  deploymentId: id.meta({
    description: 'An earlier successful deployment, whose Release to restore.',
  }),
  config: configInput.optional().meta({
    description:
      'The configuration to restore with, in the target deployment’s mode; the target’s own when omitted.',
  }),
}) satisfies z.ZodType<RollbackHubAppInput>;

export const CreateApiKeyInput: z.ZodObject<
  {
    name: z.ZodString;
    appIds: z.ZodArray<z.ZodString>;
    allApps: z.ZodOptional<z.ZodBoolean>;
    scopes: z.ZodArray<z.ZodEnum<{ [K in HubApiKeyScope]: K }>>;
    expiresAt: z.ZodOptional<z.ZodNullable<z.ZodISODateTime>>;
  },
  z.core.$strict
> = z.strictObject({
  name: z.string().trim().min(1).max(100),
  appIds: z.array(id).meta({ description: 'The Apps the key may publish to.' }),
  allApps: z.boolean().optional().meta({
    description:
      'Bind the key to every App its creator may use, now and later, instead of `appIds`.',
  }),
  scopes: z.array(z.enum(HUB_API_KEY_SCOPES)).min(1).meta({
    description:
      '`upload-release` uploads Releases; `deploy` deploys stored ones.',
  }),
  expiresAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .optional()
    .meta({ description: 'RFC 3339; the key never expires when omitted.' }),
}) satisfies z.ZodType<CreateHubApiKeyInput>;

export const StartUploadInput: z.ZodObject<
  { size: z.ZodNumber; sha256: z.ZodString },
  z.core.$strict
> = z.strictObject({
  size: z
    .number()
    .int()
    .positive()
    .meta({ description: 'The archive’s size in bytes.' }),
  sha256: z
    .string()
    .meta({ description: 'The archive’s lowercase SHA-256 hex digest.' }),
});

/** An optional `Idempotency-Key`; the service checks its format and answers `INVALID_IDEMPOTENCY_KEY`. */
export const IdempotencyHeaders: z.ZodObject<{
  'idempotency-key': z.ZodOptional<z.ZodString>;
}> = z.object({
  'idempotency-key': z.string().optional().meta({
    description:
      'Makes a retry safe: a repeated request with the same key answers the first one’s result.',
  }),
});

/**
 * The headers of a single-request Release upload. The content type and size are checked by the route, which answers
 * 415 and 413 for them, and the checksum and idempotency key by the service.
 */
export const ReleaseUploadHeaders: z.ZodObject<{
  'content-type': z.ZodOptional<z.ZodString>;
  'content-length': z.ZodOptional<z.ZodString>;
  'x-artifact-sha256': z.ZodOptional<z.ZodString>;
  'idempotency-key': z.ZodOptional<z.ZodString>;
}> = z.object({
  'content-type': z.string().optional(),
  'content-length': z
    .string()
    .regex(/^\d+$/, 'Content-Length must be a whole number of bytes.')
    .optional(),
  'x-artifact-sha256': z.string().optional().meta({
    description:
      'The archive’s lowercase SHA-256 hex digest; the upload is refused when the received bytes do not match it.',
  }),
  'idempotency-key': z.string().optional().meta({
    description:
      'Makes a retry safe: a repeated upload with the same key answers the Release the first one stored.',
  }),
});

/** The headers of one chunk of a resumable upload. */
export const UploadChunkHeaders: z.ZodObject<{
  'content-type': z.ZodOptional<z.ZodString>;
  'content-length': z.ZodString;
  'upload-offset': z.ZodString;
}> = z.object({
  'content-type': z.string().optional(),
  'content-length': z
    .string()
    .regex(/^[1-9]\d{0,15}$/, 'A chunk needs a positive Content-Length.')
    .meta({ description: 'The chunk’s length, at most `chunkSize` bytes.' }),
  'upload-offset': z
    .string()
    .regex(/^(?:0|[1-9]\d{0,15})$/, 'A chunk needs an Upload-Offset header.')
    .meta({
      description:
        'Where the chunk starts; it must equal the session’s current `offset`.',
    }),
});

// Response schemas. Each is typed by the view its route answers with (`responses.ts`), so a view and its documented
// schema cannot drift apart without failing the typecheck. A `Date` is sent as an RFC 3339 string and documented so.

const observedStates: { [K in HubObservedState]: K } = {
  pending: 'pending',
  running: 'running',
  stopped: 'stopped',
  failed: 'failed',
  unknown: 'unknown',
};
const deploymentStatuses: { [K in HubDeploymentStatus]: K } = {
  queued: 'queued',
  deploying: 'deploying',
  succeeded: 'succeeded',
  failed: 'failed',
  cancelled: 'cancelled',
};
const deploymentPhases: { [K in HubDeploymentPhase]: K } = {
  queued: 'queued',
  resolving: 'resolving',
  verifying: 'verifying',
  extracting: 'extracting',
  preparing: 'preparing',
  starting: 'starting',
  health_check: 'health_check',
  switching: 'switching',
  cleaning: 'cleaning',
  completed: 'completed',
};
const activation = z.enum(['lazy', 'eager']).meta({
  description:
    '`eager` starts the App with the Host; `lazy` starts it on its first request.',
});
const deploymentStatus = z.enum(deploymentStatuses).meta({
  description:
    'Where the deployment operation stands; `succeeded`, `failed` and `cancelled` are final.',
});
const deploymentPhase = z.enum(deploymentPhases).meta({
  description: 'The step the deployment operation is at.',
});
const nullableId = z.string().nullable();

export const BuildTargetSchema: z.ZodType<HubBuildTarget> = z
  .object({
    platform: z.string().meta({ description: 'Such as `linux` or `darwin`.' }),
    arch: z.string().meta({ description: 'Such as `x64` or `arm64`.' }),
    libc: z.enum(['glibc', 'musl']).nullable().meta({
      description: 'The C library on Linux; `null` on every other platform.',
    }),
    nodeAbi: z.number().int().nonnegative(),
    nodeMajor: z.number().int().nonnegative(),
  })
  .meta({
    ref: 'HubBuildTarget',
    description:
      'A platform in the shape `pnpm build` records as `nocobase.buildTarget` in an application’s `dist/package.json`.',
  });

const appSummaryShape = {
  app: z.object({
    id: z.string(),
    name: z.string(),
    updatedAt: z.date(),
    currentDeploymentId: nullableId,
  }),
  runtime: z.object({
    hostAvailable: z.boolean().meta({
      description: 'Whether the Host could be asked about the App.',
    }),
    state: z.enum(observedStates),
  }),
  currentVersion: z.string().nullable().meta({
    description: 'The version of the Release the App runs, if any.',
  }),
  hasReleases: z.boolean(),
  hasPendingDeployment: z.boolean().meta({
    description: 'Whether a deployment is queued or in progress.',
  }),
  enabled: z.boolean(),
  startupMode: activation,
};

export const AppSummarySchema: z.ZodType<AppSummaryResponse> = z
  .object(appSummaryShape)
  .meta({ ref: 'HubAppSummary', description: 'An App as it is listed.' });

export const AppDetailSchema: z.ZodType<AppDetailResponse> = z
  .object({
    ...appSummaryShape,
    deployment: z.object({
      desiredReleaseId: nullableId,
      observedReleaseId: nullableId,
      observedState: z.enum(observedStates),
      activation,
      basePath: z.string(),
      updatedAt: z.date(),
    }),
    hostUrl: z.string().nullable().meta({
      description:
        'The App’s public address on the Host, or `null` when the Host has none.',
    }),
    buildTarget: BuildTargetSchema.nullable().meta({
      description:
        'The Host’s platform, which uploaded archives must target; `null` while the Host status cannot be read.',
    }),
  })
  .meta({ ref: 'HubApp', description: 'An App with its deployment state.' });

const releaseShape = {
  id: z.string(),
  version: z.string(),
  checksum: z
    .string()
    .meta({ description: 'The archive’s lowercase SHA-256 hex digest.' }),
  size: z
    .number()
    .int()
    .nonnegative()
    .meta({ description: 'The archive’s size in bytes.' }),
  createdAt: z.date(),
  hasConfigTemplate: z.boolean().meta({
    description:
      'Whether the archive carries a configuration template, read from `configTemplate`.',
  }),
};

export const ReleaseSummarySchema: z.ZodType<ReleaseSummaryResponse> = z
  .object({
    ...releaseShape,
    buildTarget: BuildTargetSchema.nullable().meta({
      description:
        'The archive’s `nocobase.buildTarget`, or `null` when it records none.',
    }),
    running: z.boolean().meta({
      description:
        'Whether this is the Release of the App’s current deployment.',
    }),
    everDeployed: z.boolean().meta({
      description: 'Whether a deployment of this Release has ever succeeded.',
    }),
  })
  .meta({ ref: 'HubRelease', description: 'A stored Release of an App.' });

export const UploadedReleaseSchema: z.ZodType<UploadedReleaseResponse> = z
  .object({
    ...releaseShape,
    releaseId: z.string().meta({ description: 'The same as `id`.' }),
    reused: z.boolean().meta({
      description:
        'True when the checksum or `Idempotency-Key` matched a Release stored by an earlier request, so nothing new was stored.',
    }),
  })
  .meta({
    ref: 'HubUploadedRelease',
    description:
      'The Release an upload became. Uploading never deploys; deploy it with `hubDeployApp`.',
  });

export const ReleaseUploadSchema: z.ZodType<ReleaseUploadResponse> = z
  .object({
    uploadId: z.string(),
    offset: z.number().int().nonnegative().meta({
      description:
        'Bytes received and durably stored; the next chunk starts here.',
    }),
    size: z
      .number()
      .int()
      .nonnegative()
      .meta({ description: 'The declared archive size.' }),
    expiresAt: z.date().meta({
      description: 'The last accepted chunk plus the session lifetime.',
    }),
    releaseId: z.string().optional().meta({
      description: 'The Release the upload became, once it has been completed.',
    }),
  })
  .meta({
    ref: 'HubReleaseUpload',
    description: 'A resumable upload session.',
  });

const startedUpload: z.ZodType<StartedReleaseUploadResponse> = z.object({
  uploadId: z.string(),
  offset: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  expiresAt: z.date(),
  releaseId: z.string().optional(),
  chunkSize: z.number().int().nonnegative().meta({
    description: 'The most bytes one chunk may carry.',
  }),
});
const reusedUpload: z.ZodType<ReusedReleaseUploadResponse> = z.object({
  offset: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  chunkSize: z.number().int().nonnegative(),
  releaseId: z.string().meta({
    description: 'The App’s Release that already has this checksum.',
  }),
  version: z.string(),
  reused: z.literal(true),
});
export const StartReleaseUploadSchema: z.ZodType<
  StartedReleaseUploadResponse | ReusedReleaseUploadResponse
> = z.union([startedUpload, reusedUpload]).meta({
  ref: 'HubReleaseUploadStart',
  description:
    'The session to send the archive to, or, when the App already has a Release with this checksum, that Release: then there is no `uploadId`, `offset` equals `size` and `reused` is true.',
});

export const ConfigTemplateSchema: z.ZodType<ConfigTemplateResponse> = z.object(
  {
    content: z.string().nullable().meta({
      description:
        'The configuration template the archive carries, or `null` when it has none.',
    }),
  },
);

export const ConfigSchema: z.ZodType<ConfigResponse> = z
  .object({
    mode: z.enum(['file', 'external']).meta({
      description:
        '`file` when the Hub manages the App’s `config.yml`; `external` when the App reads its configuration elsewhere.',
    }),
    content: z.string().nullable().meta({
      description:
        'The `config.yml` of the current deployment; empty before the first deployment and `null` in `external` mode.',
    }),
  })
  .meta({ ref: 'HubConfig', description: 'An App’s configuration.' });

export const SettingsSchema: z.ZodType<SettingsResponse> = z.object({
  name: z.string(),
  activation,
});

export const DeploymentSchema: z.ZodType<DeploymentResponse> = z
  .object({
    id: z.string(),
    releaseId: z.string(),
    kind: z.enum(['deploy', 'rollback']),
    status: deploymentStatus,
    phase: deploymentPhase,
    cacheHit: z.boolean().nullable().meta({
      description:
        'Whether the Host reused an extracted copy of the Release; `null` until known.',
    }),
    error: z.string().nullable(),
    createdAt: z.date(),
    config: z.object({ mode: z.enum(['file', 'external']) }),
  })
  .meta({ ref: 'HubDeployment', description: 'A deployment operation.' });

export const DeploymentListItemSchema: z.ZodType<DeploymentListResponse> = z
  .object({
    id: z.string(),
    releaseId: z.string(),
    kind: z.enum(['deploy', 'rollback']),
    status: deploymentStatus,
    phase: deploymentPhase,
    cacheHit: z.boolean().nullable(),
    error: z.string().nullable(),
    createdAt: z.date(),
    config: z.object({ mode: z.enum(['file', 'external']) }),
    finishedAt: z.date().nullable(),
    release: z
      .object({ version: z.string(), checksum: z.string() })
      .nullable()
      .meta({ description: 'The deployed Release, or `null` once removed.' }),
  })
  .meta({
    ref: 'HubDeploymentListItem',
    description: 'A deployment as the history lists it.',
  });

export const DeploymentAcceptedSchema: z.ZodType<DeploymentAcceptedResponse> =
  z.object({
    id: z.string(),
    operationId: z.string().meta({
      description:
        'The deployment to follow with `hubGetDeploymentStatus`; the same as `id`.',
    }),
    status: deploymentStatus,
    reused: z.boolean().meta({
      description:
        'True when the `Idempotency-Key` matched an earlier request, whose operation this is. The App may run another Release by now.',
    }),
    createdAt: z.date(),
  });

export const RollbackAcceptedSchema: z.ZodType<RollbackAcceptedResponse> =
  z.object({
    id: z.string(),
    operationId: z.string().meta({ description: 'The same as `id`.' }),
    status: deploymentStatus,
  });

export const DeploymentStatusSchema: z.ZodType<DeploymentStatusResponse> =
  z.object({
    operationId: z.string(),
    releaseId: z.string(),
    status: deploymentStatus,
    phase: deploymentPhase,
  });

export const LogEntrySchema: z.ZodType<JournalEntry> = z
  .looseObject({
    time: z.string().meta({ description: 'RFC 3339, in UTC.' }),
    level: z.union([z.string(), z.number()]),
    msg: z.string(),
  })
  .meta({
    ref: 'HubLogEntry',
    description:
      'One journal entry, with whatever further fields the logger recorded. Secrets are redacted when the entry is written.',
  });

export const LogMetaSchema: z.ZodType<LogMetaResponse> = z
  .object({
    nextPageToken: z.string().meta({
      description:
        'Pass it back as `pageToken` to read on. It is always returned, because a log grows: reading from it later returns what was written since.',
    }),
    hasMore: z.boolean().meta({
      description: 'Whether more entries are already there to read.',
    }),
    available: z.boolean().meta({
      description: 'Whether the log exists yet.',
    }),
    reset: z.boolean().meta({
      description:
        'True when `pageToken` could not be continued, such as an expired checkpoint, and the read started again; drop what was read before.',
    }),
    enabled: z.boolean().meta({
      description: 'Whether the log is being written at all.',
    }),
    status: z.string().optional().meta({
      description: 'The deployment’s status, for a deployment log.',
    }),
    phase: z.string().optional().meta({
      description: 'The deployment’s phase, for a deployment log.',
    }),
  })
  .meta({ ref: 'HubLogMeta' });

export const RoleSchema: z.ZodType<HubRoleResponse> = z.object({
  key: z.string(),
  title: z
    .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
    .optional()
    .meta({
      description: 'A display title, or a translation key with its namespace.',
    }),
  grants: z.array(
    z.object({
      resource: z.object({ type: z.string(), id: z.string() }),
      actions: z.array(z.string()),
    }),
  ),
});

type HostDeployment = HostStatusResponse['deployments'][number];
type HostAppSnapshot = NonNullable<HostDeployment['app']>;
const backendKinds: { [K in HostAppSnapshot['backend']]: K } = {
  'in-process': 'in-process',
  worker: 'worker',
  process: 'process',
  'external-service': 'external-service',
};
const appSnapshot: z.ZodType<HostAppSnapshot> = z.object({
  id: z.string(),
  appName: z.string().optional(),
  version: z.number().int().nonnegative(),
  basePath: z.string(),
  backend: z.enum(backendKinds),
  configVersion: z.string(),
  desiredVersion: z.string(),
  codeVersion: z.string(),
  isolation: z.enum(backendKinds),
  tier: z.enum({
    cold: 'cold',
    warm: 'warm',
    hot: 'hot',
    dedicated: 'dedicated',
  } satisfies { [K in HostAppSnapshot['tier']]: K }),
  state: z.enum({
    creating: 'creating',
    active: 'active',
    draining: 'draining',
    destroying: 'destroying',
    destroyed: 'destroyed',
    failed: 'failed',
  } satisfies { [K in HostAppSnapshot['state']]: K }),
  endpoint: z.object({
    kind: z.enum(['in-process', 'local-http', 'external-http']),
    host: z.string().optional(),
    port: z.number().int().nonnegative().optional(),
    url: z.string().optional(),
    pid: z.number().int().nonnegative().optional(),
    workerId: z.string().optional(),
  }),
  activeRequests: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastAccessedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  disposerCount: z.number().int().nonnegative(),
});

export const HostStatusSchema: z.ZodType<HostStatusResponse> = z
  .object({
    mode: z.enum(['standalone', 'managed']).meta({
      description:
        '`managed` when the Hub runs the Host as its own process; `standalone` when it attaches to one running elsewhere.',
    }),
    runtime: BuildTargetSchema,
    ready: z.boolean(),
    desiredRevision: z.number().int().nonnegative(),
    reconciledRevision: z.number().int().nonnegative().meta({
      description:
        'The deployment set revision the Host has applied; it trails `desiredRevision` while a change is in progress.',
    }),
    deployments: z
      .array(
        z.object({
          id: z.string(),
          appId: z.string(),
          desiredState: z.enum(['running', 'stopped']),
          observedState: z.enum(['pending', 'running', 'stopped', 'failed']),
          revision: z.number().int().nonnegative(),
          cacheHit: z.boolean().nullable(),
          app: appSnapshot.nullable().meta({
            description: 'The running application instance, if there is one.',
          }),
          error: z.string().nullable(),
        }),
      )
      .meta({
        description: 'The deployments on the Host of Apps the caller may read.',
      }),
  })
  .meta({ ref: 'HubHostStatus', description: 'The App Host’s state.' });

export const ApiKeySchema: z.ZodType<HubApiKeySummary> = z
  .object({
    id: z.string(),
    name: z.string(),
    prefix: z.string().meta({
      description: 'The start of the secret, to recognize the key by.',
    }),
    apps: z.array(z.object({ id: z.string(), name: z.string() })).meta({
      description: 'The bound Apps the caller can still read.',
    }),
    allApps: z.boolean().meta({
      description: 'Whether the key is bound to every App its creator may use.',
    }),
    scopes: z.array(z.enum(HUB_API_KEY_SCOPES)),
    status: z.enum(['active', 'disabled', 'expired']),
    canCopy: z.boolean().meta({
      description:
        'Whether the caller may read the secret again with `hubRevealApiKey`.',
    }),
    createdBy: z.string(),
    creatorName: z.string(),
    createdAt: z.string().meta({ description: 'RFC 3339.' }),
    expiresAt: z.string().nullable().meta({ description: 'RFC 3339.' }),
    lastUsedAt: z.string().nullable().meta({ description: 'RFC 3339.' }),
  })
  .meta({
    ref: 'HubApiKey',
    description: 'A publishing key, without its secret.',
  });

export const ApiKeyAppOptionSchema: z.ZodType<HubApiKeyAppOption> = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.array(z.enum(HUB_API_KEY_SCOPES)).meta({
    description: 'The scopes the caller may grant a key for this App.',
  }),
});

export const CreatedApiKeySchema: z.ZodType<CreatedHubApiKey> = z.object({
  key: ApiKeySchema,
  secret: z.string().meta({
    description:
      'The secret, `hub_app_…`, sent as `Authorization: Bearer <secret>`.',
  }),
});

export const ApiKeySecretSchema: z.ZodType<{ readonly secret: string }> =
  z.object({ secret: z.string() });
