// Input schemas of the `/api/releases` routes, checked after a route's permission check and before its handler. The
// services keep the rules that need the database or a driver, and report them with their own reasons.
import type { JournalEntry } from '@nocobase/logging';
import { z } from 'zod';

import {
  BUSINESS_ACTIONS,
  BUSINESS_KEYS,
  PAGES,
  SETTINGS_KEYS,
} from '../../shared/access.js';
import {
  ACTOR_KINDS,
  APP_ACTIVATIONS,
  REGISTRY_SECRET_KEYS,
  type AppSummary,
  type AppVariablesMeta,
  type AppVariableView,
  type ConfigDocument,
  type EnvironmentDeclaredVariableView,
  type EnvironmentVariableView,
  type InitialAdminView,
  type ReleaseVariablesManifest,
  type SetAppVariableInput,
  type SetEnvironmentVariableInput,
  type DeploymentRequestView,
  type DeploymentView,
  type DriverSummary,
  type EnvironmentCheckResult,
  type EnvironmentRecord,
  type RegistryCheckResult,
  type RegistryRecord,
  type ReleaseView,
  type UploadTicketView,
  type CreateAppInput,
  type CreateDeploymentRequestInput,
  type DeployInput,
  type DeploymentRequestStatus,
  type EnvironmentCheckInput,
  type EnvironmentInput,
  type RegisterImageReleaseInput,
  type RegistryInput,
  type RollbackInput,
  type UpdateAppInput,
  type UpdateConfigInput,
} from '../../shared/releases.js';
import type { Caller } from '../access/caller.js';

const id = z.string().min(1);

export const EnvironmentParams: z.ZodType<{ environmentId: string }> = z.object(
  { environmentId: id },
);
export const RegistryParams: z.ZodType<{ registryId: string }> = z.object({
  registryId: id,
});
export const AppParams: z.ZodType<{ appId: string }> = z.object({ appId: id });
export const ReleaseParams: z.ZodType<{ appId: string; releaseId: string }> =
  z.object({ appId: id, releaseId: id });
export const DeploymentParams: z.ZodType<{
  appId: string;
  deploymentId: string;
}> = z.object({ appId: id, deploymentId: id });
export const RequestParams: z.ZodType<{ requestId: string }> = z.object({
  requestId: id,
});

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);

export interface Paging {
  page: number;
  pageSize: number;
}

/** `label=key=value`, repeatable: one value arrives as a string, several as an array. */
const labelFilter = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) =>
    value === undefined ? [] : Array.isArray(value) ? value : [value],
  );

export const ListAppsQuery: z.ZodType<
  Paging & { q?: string; environmentId?: string; label: string[] }
> = z.object({
  page,
  pageSize,
  q: z.string().trim().max(100).optional(),
  environmentId: z.string().optional(),
  label: labelFilter,
});

export const ListReleasesQuery: z.ZodType<Paging & { label: string[] }> =
  z.object({ page, pageSize, label: labelFilter });

export const PageQuery: z.ZodType<Paging> = z.object({ page, pageSize });

const REQUEST_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'deployed',
  'failed',
] as const satisfies readonly DeploymentRequestStatus[];

export const ListRequestsQuery: z.ZodType<
  Paging & {
    appId?: string;
    status?: DeploymentRequestStatus;
    awaitingMe?: 'true' | 'false';
  }
> = z.object({
  page,
  pageSize,
  appId: z.string().optional(),
  status: z.enum(REQUEST_STATUSES).optional(),
  awaitingMe: z.enum(['true', 'false']).optional(),
});

export const DeleteAppQuery: z.ZodType<{ confirm?: string }> = z.object({
  confirm: z.string().optional(),
});

const LOG_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] as const;

/**
 * A log read. `pageToken` is the `nextPageToken` of the previous read: a log is read forward from it, and reading from
 * the same token later returns what was appended since. A read returns one bounded chunk, so there is no `pageSize`.
 */
export const LogQuery: z.ZodType<{
  pageToken?: string;
  level?: (typeof LOG_LEVELS)[number];
  source?: string;
  q?: string;
  since?: string;
  until?: string;
  fromStart?: 'true' | 'false';
}> = z.object({
  pageToken: z.string().optional(),
  level: z.enum(LOG_LEVELS).optional(),
  source: z.string().optional(),
  q: z.string().optional(),
  since: z.iso.datetime({ offset: true }).optional(),
  until: z.iso.datetime({ offset: true }).optional(),
  fromStart: z.enum(['true', 'false']).optional(),
});

const labels = z.record(z.string(), z.string());
// A driver's settings and credentials follow the schema the driver itself declares, which the service checks.
const driverObject = z.record(z.string(), z.unknown());
const nullableCount = z.number().nullable();

const environmentFields = {
  name: z.string(),
  config: driverObject.optional(),
  secret: driverObject.nullable().optional(),
  secretChanges: driverObject.optional(),
  publicUrl: z.string().nullable().optional(),
  protected: z.boolean().optional().meta({
    description:
      'Every deployment goes through a deployment request an approver approves; nothing deploys directly.',
  }),
  approvers: z.array(z.string()).optional(),
  maxApps: nullableCount.optional(),
  defaultIdleStopMinutes: nullableCount.optional(),
  defaultDormantAfterHours: nullableCount.optional(),
  registryId: z.string().nullable().optional(),
  sampleDataOnFirstDeploy: z.boolean().optional().meta({
    description:
      'An App’s first deployment here loads its sample data (`APP_SAMPLE_DATA=true`).',
  }),
};

export const CreateEnvironmentBody: z.ZodType<
  EnvironmentInput & { id: string; driver: string; name: string }
> = z.strictObject({ ...environmentFields, id, driver: z.string() });

export const UpdateEnvironmentBody: z.ZodType<EnvironmentInput> =
  z.strictObject({
    ...environmentFields,
    name: environmentFields.name.optional(),
    driver: z.string().optional(),
  });

export const CheckEnvironmentBody: z.ZodType<EnvironmentCheckInput> =
  z.strictObject({
    id: z.string().optional(),
    name: z.string().optional(),
    driver: z.string(),
    config: driverObject.optional(),
    secret: driverObject.nullable().optional(),
    secretChanges: driverObject.optional(),
    publicUrl: z.string().nullable().optional(),
  });

const registryFields = {
  name: z.string().optional(),
  url: z.string().optional(),
  namespace: z.string().nullable().optional(),
  pullUsername: z.string().nullable().optional(),
  secretChanges: z
    .partialRecord(z.enum(REGISTRY_SECRET_KEYS), z.string().nullable())
    .optional(),
};

export const CreateRegistryBody: z.ZodType<
  RegistryInput & { id: string; name: string; url: string }
> = z.strictObject({
  ...registryFields,
  id,
  name: z.string(),
  url: z.string(),
});

export const UpdateRegistryBody: z.ZodType<RegistryInput> =
  z.strictObject(registryFields);

/** Unsaved settings to try; `id` names the stored registry whose passwords fill the gaps. */
export const CheckRegistryBody: z.ZodType<RegistryInput> = z.strictObject({
  ...registryFields,
  id: z.string().optional(),
});

const runtimePolicy = {
  activation: z.enum(APP_ACTIVATIONS).optional(),
  idleStopMinutes: nullableCount.optional(),
  dormantAfterHours: nullableCount.optional(),
};

export const CreateAppBody: z.ZodType<CreateAppInput> = z.strictObject({
  id,
  name: z.string(),
  environmentId: z.string(),
  description: z.string().optional(),
  labels: labels.optional(),
  previewOf: z.string().optional().meta({
    description: 'Makes it a preview App of that App, removed with it.',
  }),
  ...runtimePolicy,
});

export const UpdateAppBody: z.ZodType<UpdateAppInput> = z.strictObject({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  labels: labels.optional(),
  ...runtimePolicy,
});

export const UpdateConfigBody: z.ZodType<UpdateConfigInput> = z.strictObject({
  content: z.string(),
  secretChanges: z
    .array(
      z.strictObject({
        path: z.array(z.union([z.string(), z.number().int().min(0)])),
        value: z.string().nullable(),
      }),
    )
    .optional(),
});

export const LabelReleaseBody: z.ZodType<{ labels: Record<string, string> }> =
  z.strictObject({ labels });

const generator = z.enum(['secret', 'secretKeys', 'password']);

/** A build's variables manifest, as `pnpm build` writes it; the service checks names and bounds. */
const variablesManifest = z
  .object({
    schemaVersion: z.literal(1),
    app: z
      .object({
        name: z.string().optional(),
        version: z.string().optional(),
      })
      .optional(),
    generatedAt: z.string().optional(),
    variables: z.array(
      z.object({
        name: z.string(),
        path: z.string().optional(),
        type: z.string().optional(),
        description: z.string().optional(),
        secret: z.boolean(),
        required: z.boolean(),
        hasDefault: z.boolean().optional(),
        exampleProvided: z.boolean().optional(),
        firstStartOnly: z.boolean(),
        generate: generator.nullable(),
        runtime: z.boolean().optional(),
      }),
    ),
  })
  .meta({ ref: 'ReleasesVariablesManifest' });

/** `POST /apps/{appId}/imageReleases`: the image, and whether to deploy it once registered. */
export type RegisterImageReleaseRequest = RegisterImageReleaseInput & {
  readonly deploy?: boolean;
};

export const RegisterImageReleaseBody: z.ZodType<RegisterImageReleaseRequest> =
  z.strictObject({
    deploy: z.boolean().optional().meta({
      description:
        'Deploy it once registered; the answer then names the deployment (`deploymentId`).',
    }),
    version: z.string(),
    ref: z.string(),
    digest: z.string(),
    platform: z.string().optional(),
    sourceCommit: z.string().optional(),
    build: z.string().optional(),
    labels: labels.optional(),
    variables: variablesManifest.optional().meta({
      description:
        'The build’s variables manifest (`dist/variables.json`), which an image carries no other way; `--variables-file dist/variables.json` on the command line.',
    }),
  });

export const PromoteBody: z.ZodType<{
  toAppId: string;
  labels?: Record<string, string>;
}> = z.strictObject({ toAppId: id, labels: labels.optional() });

export const CreateUploadTicketBody: z.ZodType<{
  deploy?: boolean;
  ttlSeconds?: number;
}> = z.strictObject({
  deploy: z.boolean().optional(),
  ttlSeconds: z.number().int().optional(),
});

export const DeployQuery: z.ZodType<{ wait?: 'true' | 'false' }> = z.object({
  wait: z.enum(['true', 'false']).optional().meta({
    description:
      'Wait up to 100 seconds for the deployment to finish, and answer it then.',
  }),
});

export const DeployBody: z.ZodType<DeployInput> = z.strictObject({
  releaseId: id,
  config: z
    .strictObject({
      mode: z.enum(['file', 'external']),
      content: z.string().optional(),
    })
    .optional(),
  idempotencyKey: z.string().optional(),
});

export const RollbackBody: z.ZodType<RollbackInput> = z.strictObject({
  deploymentId: id,
});

export const IdempotencyHeaders: z.ZodType<{ 'idempotency-key'?: string }> =
  z.object({ 'idempotency-key': z.string().optional() });

export const CreateRequestBody: z.ZodType<CreateDeploymentRequestInput> =
  z.strictObject({
    releaseId: z.string().optional(),
    rollbackToDeploymentId: z.string().optional(),
    note: z.string().optional(),
    labels: labels.optional(),
  });

export const ApproveRequestBody: z.ZodType<{
  note?: string;
  confirm?: string;
}> = z.strictObject({
  note: z.string().optional(),
  confirm: z.string().optional(),
});

export const RejectRequestBody: z.ZodType<{ note?: string }> = z.strictObject({
  note: z.string().optional(),
});

export const EmptyBody: z.ZodType<Record<string, never>> = z.strictObject({});

/**
 * The headers of a release upload. The content type is checked by the route, which answers 415; the checksum,
 * idempotency key, source commit and build by the service.
 */
export const UploadHeaders: z.ZodType<{
  'content-type'?: string;
  'content-length'?: string;
  'x-artifact-sha256'?: string;
  'idempotency-key'?: string;
  'x-release-deploy'?: 'true' | 'false';
  'x-release-labels'?: string;
  'x-release-source-commit'?: string;
  'x-release-build'?: string;
}> = z.object({
  'content-type': z.string().optional(),
  'content-length': z.string().regex(/^\d+$/).optional(),
  'x-artifact-sha256': z.string().optional(),
  'idempotency-key': z.string().optional(),
  'x-release-deploy': z.enum(['true', 'false']).optional(),
  'x-release-labels': z.string().optional(),
  'x-release-source-commit': z.string().optional(),
  'x-release-build': z.string().optional(),
});

// --- Response schemas, typed against the views the services return. ---

const dateTime = z.string().meta({ format: 'date-time' });
const nullableDateTime = dateTime.nullable();
const outputLabels = z
  .record(z.string(), z.string())
  .meta({ ref: 'ReleasesLabels', description: 'Opaque key/value labels.' });
const actorKind = z.enum(ACTOR_KINDS).meta({ ref: 'ReleasesActorKind' });
const translatedTitle = z.object({ key: z.string(), ns: z.string() });
const configPath = z.array(z.union([z.string(), z.number().int()]));

/** `page`, `pageSize` and `total` of a paged list. */
export const ReleasesPageMeta: z.ZodType<{
  page: number;
  pageSize: number;
  total: number;
}> = z
  .object({ page: z.number(), pageSize: z.number(), total: z.number() })
  .meta({ ref: 'ReleasesPageMeta' });

/** `total` of a bounded list, which does not page. */
export const ReleasesTotalMeta: z.ZodType<{ total: number }> = z
  .object({ total: z.number() })
  .meta({ ref: 'ReleasesTotalMeta' });

const scope = z.union([
  z.enum(['all', 'none']),
  z.object({ users: z.array(z.string()) }),
]);

export const ReleasesCallerSchema: z.ZodType<
  Pick<Caller, 'userId' | 'kind' | 'permissions'>
> = z.object({
  userId: z.string().nullable(),
  kind: actorKind,
  permissions: z.object({
    scopes: z
      .record(z.enum(BUSINESS_KEYS.map(({ key }) => key)), scope)
      .meta({ description: 'How far each business action reaches.' }),
    settings: z.record(
      z.enum(SETTINGS_KEYS.map(({ key }) => key)),
      z.boolean(),
    ),
    pages: z.record(z.enum(PAGES), z.boolean()),
  }),
});

const capabilities = z
  .object({
    onDemand: z.boolean(),
    logs: z.boolean(),
    urlModes: z.array(z.enum(['path', 'subdomain'])),
    images: z.boolean(),
  })
  .meta({ ref: 'ReleasesDriverCapabilities' });

export const ReleasesDriverSchema: z.ZodType<DriverSummary> = z.object({
  kind: z.string(),
  title: translatedTitle,
  configSchema: z
    .record(z.string(), z.unknown())
    .meta({ description: 'The JSON Schema of the driver settings.' }),
  secretSchema: z
    .record(z.string(), z.unknown())
    .nullable()
    .meta({ description: 'The JSON Schema of the driver credentials.' }),
  capabilities,
  variants: z
    .object({
      key: z.string(),
      capabilities: z.record(z.string(), capabilities),
    })
    .nullable(),
  facts: z
    .record(z.string(), z.unknown())
    .nullable()
    .meta({ description: 'How the application configured the driver itself.' }),
});

export const ReleasesEnvironmentSchema: z.ZodType<EnvironmentRecord> = z
  .object({
    id: z.string(),
    name: z.string(),
    driver: z.string(),
    config: z
      .record(z.string(), z.unknown())
      .meta({ description: 'Driver settings without credentials.' }),
    hasSecret: z.boolean(),
    secretKeys: z.array(z.string()),
    publicUrl: z.string().nullable(),
    protected: z.boolean(),
    approvers: z.array(z.string()),
    maxApps: z.number().nullable(),
    defaultIdleStopMinutes: z.number().nullable(),
    defaultDormantAfterHours: z.number().nullable(),
    registryId: z.string().nullable(),
    sampleDataOnFirstDeploy: z.boolean().meta({
      description:
        'An App’s first deployment here loads its sample data (`APP_SAMPLE_DATA=true`).',
    }),
    capabilities: z
      .object({
        archives: z.boolean().meta({
          description: 'It runs release archives uploaded to it.',
        }),
        images: z.boolean().meta({
          description:
            'It runs release images CI registers, not uploaded archives.',
        }),
        onDemand: z.boolean().meta({
          description:
            'It honours an App’s runtime policy (started by a request, stopped when idle).',
        }),
      })
      .meta({
        description:
          'What the environment runs, from its driver and settings; nothing when the driver is missing.',
      }),
    createdAt: dateTime,
    updatedAt: dateTime,
  })
  .meta({ ref: 'ReleasesEnvironment' });

export const ReleasesEnvironmentCheckSchema: z.ZodType<EnvironmentCheckResult> =
  z.object({
    ok: z.boolean(),
    message: z.string().optional(),
    details: z
      .unknown()
      .optional()
      .meta({ description: 'What the driver reported, in its own shape.' }),
  });

export const ReleasesRegistrySchema: z.ZodType<RegistryRecord> = z
  .object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    host: z.string(),
    namespace: z.string().nullable(),
    pullUsername: z.string().nullable(),
    secretKeys: z.array(z.string()),
    environmentIds: z.array(z.string()),
    createdAt: dateTime,
    updatedAt: dateTime,
  })
  .meta({ ref: 'ReleasesRegistry' });

export const ReleasesRegistryCheckSchema: z.ZodType<RegistryCheckResult> =
  z.object({
    ok: z.boolean(),
    message: z.string().optional(),
    details: z
      .object({
        anonymous: z.boolean().optional(),
        pull: z.enum(['ok', 'failed', 'notSet']).optional(),
      })
      .optional(),
  });

const appView = z
  .object({
    id: z.string(),
    environmentId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    currentDeploymentId: z.string().nullable(),
    enabled: z.boolean(),
    activation: z.enum(['eager', 'onDemand']),
    idleStopMinutes: z.number().nullable(),
    dormantAfterHours: z.number().nullable(),
    labels: outputLabels,
    previewOf: z.string().nullable().meta({
      description:
        'The App this App is a preview of, removed with it; null for any other App.',
    }),
    createdBy: z.string().nullable(),
    createdVia: actorKind,
    createdAt: dateTime,
    updatedAt: dateTime,
  })
  .meta({ ref: 'ReleasesAppView' });

export const ReleasesAppSchema: z.ZodType<AppSummary> = z
  .object({
    app: appView,
    environment: z.object({
      id: z.string(),
      name: z.string(),
      protected: z.boolean(),
      runsImages: z.boolean(),
    }),
    runtime: z.object({
      available: z.boolean(),
      state: z.enum([
        'pending',
        'running',
        'starting',
        'stopped',
        'dormant',
        'failed',
        'unknown',
      ]),
      version: z.string().nullable(),
      startedAt: nullableDateTime,
      error: z.string().nullable(),
      lastAccessedAt: nullableDateTime,
    }),
    url: z.string().nullable(),
    currentVersion: z.string().nullable(),
    hasReleases: z.boolean(),
    hasPendingDeployment: z.boolean(),
    allowed: z.array(z.enum(BUSINESS_ACTIONS['rel.apps'])).optional().meta({
      description:
        'What the caller may do on this App; only the single-App read answers it.',
    }),
    variables: z
      .object({
        missing: z.array(z.string()),
        changed: z.boolean(),
      })
      .optional()
      .meta({
        description:
          'The current release’s required variables nothing supplies, and whether a value changed since the running deployment; only the single-App read answers it.',
      }),
  })
  .meta({ ref: 'ReleasesApp' });

export const ReleasesConfigSchema: z.ZodType<ConfigDocument> = z
  .object({
    mode: z.enum(['file', 'external']),
    content: z.string().nullable().meta({
      description:
        '`config.yml` with every secret value masked; null for an external configuration.',
    }),
    secrets: z.array(z.object({ path: configPath })),
  })
  .meta({ ref: 'ReleasesConfig' });

export const ReleasesConfigTemplateSchema: z.ZodType<{
  content: string | null;
}> = z.object({
  content: z
    .string()
    .nullable()
    .meta({ description: 'The release’s configuration template, if any.' }),
});

const releaseArtifact = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('tarball'),
    checksum: z.string(),
    size: z.number(),
  }),
  z.object({
    kind: z.literal('oci-image'),
    id: z.string(),
    ref: z.string(),
    digest: z.string(),
    platform: z.string(),
    sourceCommit: z.string().nullable(),
    createdBy: z.string().nullable(),
    createdVia: actorKind,
    createdAt: dateTime,
  }),
]);

export const ReleasesReleaseSchema: z.ZodType<ReleaseView> = z
  .object({
    id: z.string(),
    appId: z.string(),
    kind: z.enum(['archive', 'image']),
    version: z.string(),
    checksum: z.string(),
    size: z.number().nullable(),
    hasConfigTemplate: z.boolean(),
    labels: outputLabels,
    sourceReleaseId: z.string().nullable(),
    sourceCommit: z.string().nullable(),
    build: z.string().nullable(),
    artifacts: z.array(releaseArtifact).optional(),
    variables: z
      .object({
        declared: z.number(),
        required: z.number(),
        missing: z.array(z.string()),
      })
      .nullable()
      .optional()
      .meta({
        description:
          'How many variables its manifest declares and requires, and the required ones nothing supplies in its App; null without a manifest. Answered by the release list.',
      }),
    createdBy: z.string().nullable(),
    createdVia: actorKind,
    createdAt: dateTime,
    reused: z.boolean().optional(),
    deploymentId: z.string().nullable().optional(),
  })
  .meta({ ref: 'ReleasesRelease' });

export const ReleasesUploadTicketSchema: z.ZodType<UploadTicketView> = z.object(
  {
    id: z.string(),
    appId: z.string(),
    token: z.string().meta({
      description:
        'Shown once. Send it as `Authorization: Bearer <token>` on the upload request.',
    }),
    path: z.string().meta({
      description: 'The upload endpoint, relative to `/api`.',
    }),
    deploy: z.boolean(),
    expiresAt: dateTime,
  },
);

const deploymentPhase = z.enum([
  'queued',
  'resolving',
  'verifying',
  'extracting',
  'preparing',
  'starting',
  'health_check',
  'switching',
  'cleaning',
  'completed',
]);

export const ReleasesDeploymentSchema: z.ZodType<DeploymentView> = z
  .object({
    id: z.string(),
    appId: z.string(),
    releaseId: z.string(),
    kind: z.enum(['deploy', 'rollback']),
    rollbackTargetDeploymentId: z.string().nullable(),
    previousDeploymentId: z.string().nullable(),
    status: z.enum(['queued', 'deploying', 'succeeded', 'failed']),
    phase: deploymentPhase,
    configMode: z.enum(['file', 'external']),
    error: z.string().nullable(),
    actorId: z.string().nullable(),
    actorKind,
    requestId: z.string().nullable(),
    createdAt: dateTime,
    startedAt: nullableDateTime,
    finishedAt: nullableDateTime,
    release: z.object({ version: z.string(), checksum: z.string() }).nullable(),
    artifact: z
      .discriminatedUnion('kind', [
        z.object({ kind: z.literal('tarball') }),
        z.object({
          kind: z.literal('image'),
          ref: z.string(),
          digest: z.string(),
          platform: z.string(),
        }),
      ])
      .nullable(),
    reused: z.boolean().optional(),
  })
  .meta({ ref: 'ReleasesDeployment' });

export const ReleasesDeploymentRequestSchema: z.ZodType<DeploymentRequestView> =
  z
    .object({
      id: z.string(),
      appId: z.string(),
      environmentId: z.string(),
      releaseId: z.string(),
      releaseChecksum: z.string(),
      kind: z.enum(['deploy', 'rollback']),
      rollbackTargetDeploymentId: z.string().nullable(),
      status: z.enum(REQUEST_STATUSES),
      note: z.string().nullable(),
      labels: outputLabels,
      requestedBy: z.string().nullable(),
      requestedVia: actorKind,
      decidedBy: z.string().nullable(),
      decidedAt: nullableDateTime,
      decisionNote: z.string().nullable(),
      deploymentId: z.string().nullable(),
      createdAt: dateTime,
      updatedAt: dateTime,
      release: z
        .object({
          version: z.string(),
          sourceCommit: z.string().nullable(),
          build: z.string().nullable(),
        })
        .nullable()
        .optional()
        .meta({
          description:
            'What the request deploys; answered by the request reads, null when the release is gone.',
        }),
      environment: z
        .object({ name: z.string(), protected: z.boolean() })
        .nullable()
        .optional()
        .meta({
          description:
            'Where it deploys; answered by the request reads, null when the environment is gone.',
        }),
      decidable: z.boolean().optional().meta({
        description:
          'Whether the caller may approve or reject it now; answered by the request reads.',
      }),
    })
    .meta({ ref: 'ReleasesDeploymentRequest' });

/** One log entry: `time`, `level` and `msg`, plus whatever fields the source logged. */
export const ReleasesLogEntrySchema: z.ZodType<JournalEntry> = z
  .looseObject({
    time: dateTime,
    level: z.union([z.string(), z.number()]),
    msg: z.string(),
  })
  .meta({ ref: 'ReleasesLogEntry' });

export const ReleasesLogMeta: z.ZodType<{
  nextPageToken: string;
  hasMore: boolean;
  available: boolean;
  reset: boolean;
  enabled: boolean;
  status?: string;
  phase?: string;
}> = z
  .object({
    nextPageToken: z.string().meta({
      description:
        'Read on from here; reading the same token later returns what was appended since.',
    }),
    hasMore: z
      .boolean()
      .meta({ description: 'More is already there to read now.' }),
    available: z
      .boolean()
      .meta({ description: 'Whether there is a log to read.' }),
    reset: z.boolean().meta({
      description: 'The log was rotated or truncated since the token.',
    }),
    enabled: z
      .boolean()
      .meta({ description: 'Whether the log is kept at all.' }),
    status: z
      .string()
      .optional()
      .meta({ description: 'A deployment log: the deployment status.' }),
    phase: z
      .string()
      .optional()
      .meta({ description: 'A deployment log: the last phase it reached.' }),
  })
  .meta({ ref: 'ReleasesLogMeta' });

// --- Variables --------------------------------------------------------------------------------------------------

export const VariableParams: z.ZodType<{ name: string }> = z.object({
  name: z.string().min(1).max(128),
});

export const EnvironmentVariableParams: z.ZodType<{
  environmentId: string;
  name: string;
}> = z.object({ environmentId: id, name: z.string().min(1).max(128) });

export const AppVariableParams: z.ZodType<{ appId: string; name: string }> =
  z.object({ appId: id, name: z.string().min(1).max(128) });

export const SetEnvironmentVariableBody: z.ZodType<SetEnvironmentVariableInput> =
  z.strictObject({
    value: z.string().meta({ description: 'The value; at most 64 KiB.' }),
    secret: z.boolean().optional().meta({
      description:
        'Never shown again once set. Inferred from the name when left out (`…_PASSWORD`, `…_SECRET`, `…_TOKEN`, `…_KEY`).',
    }),
    description: z.string().nullable().optional(),
  });

export const SetAppVariableBody: z.ZodType<SetAppVariableInput> =
  z.strictObject({
    value: z.string().meta({ description: 'The value; at most 64 KiB.' }),
    secret: z.boolean().optional().meta({
      description:
        'Never shown again once set. Taken from the release’s manifest, else from the name, when left out.',
    }),
  });

export const AppVariablesQuery: z.ZodType<{ releaseId?: string }> = z.object({
  releaseId: z.string().optional().meta({
    description:
      'Read the variables against this release; the running one (else the newest) when left out.',
  }),
});

const variableValue = {
  set: z.boolean(),
  value: z
    .string()
    .nullable()
    .meta({ description: 'Null for a secret, whose value is never returned.' }),
};

export const ReleasesEnvironmentVariableSchema: z.ZodType<EnvironmentVariableView> =
  z
    .object({
      name: z.string(),
      secret: z.boolean(),
      description: z.string().nullable(),
      ...variableValue,
      updatedBy: z.string().nullable(),
      updatedAt: dateTime,
    })
    .meta({ ref: 'ReleasesEnvironmentVariable' });

export const ReleasesEnvironmentDeclaredVariableSchema: z.ZodType<EnvironmentDeclaredVariableView> =
  z
    .object({
      name: z.string(),
      description: z.string().nullable(),
      secret: z.boolean(),
      required: z.boolean().meta({
        description: 'Some declaring build requires it.',
      }),
      set: z.boolean().meta({
        description: 'The environment sets a value.',
      }),
      apps: z.array(z.string()).meta({
        description: 'The Apps whose most recent build declares it.',
      }),
      missingIn: z.array(z.string()).meta({
        description:
          'The Apps that require it and get no value from anything, so a deployment of their build is refused.',
      }),
    })
    .meta({ ref: 'ReleasesEnvironmentDeclaredVariable' });

const variableSource = z
  .enum(['app', 'environment', 'configFile', 'generated', 'default', 'unset'])
  .meta({
    ref: 'ReleasesVariableSource',
    description:
      'Where the value comes from, strongest first: the App, the environment, the App’s config.yml (no variable), release management, the build’s defaults; unset when nothing gives one.',
  });

export const ReleasesAppVariableSchema: z.ZodType<AppVariableView> = z
  .object({
    name: z.string(),
    declared: z.boolean().meta({
      description: 'The release’s manifest declares it.',
    }),
    description: z.string().nullable(),
    secret: z.boolean(),
    required: z.boolean(),
    firstStartOnly: z.boolean(),
    generate: generator.nullable(),
    source: variableSource,
    value: z.string().nullable().meta({
      description: 'The value it takes; null for a secret or when unset.',
    }),
    missing: z.boolean(),
    changed: z.boolean().meta({
      description: 'Its value differs from what the running deployment got.',
    }),
    app: z.object({ ...variableValue, generated: z.boolean() }).nullable(),
    environment: z.object(variableValue).nullable(),
  })
  .meta({ ref: 'ReleasesAppVariable' });

export const ReleasesAppVariablesMeta: z.ZodType<AppVariablesMeta> = z.object({
  total: z.number(),
  releaseId: z.string().nullable().meta({
    description:
      'The release read: the one asked for, else the App’s most recent build (its newest release with a variables manifest), else the release it runs, else its newest.',
  }),
  releaseVersion: z.string().nullable(),
  environmentId: z.string(),
  declared: z.boolean(),
  missing: z.array(z.string()),
  changed: z.boolean(),
});

export const ReleasesVariablesManifestSchema: z.ZodType<ReleaseVariablesManifest | null> =
  variablesManifest.nullable();

export const ReleasesInitialAdminSchema: z.ZodType<InitialAdminView> = z
  .object({
    deploymentId: z.string(),
    username: z.string(),
    email: z.string(),
    password: z.string(),
    expiresAt: nullableDateTime.meta({
      description:
        'When it is deleted; null when it goes with the App (a preview App).',
    }),
  })
  .meta({ ref: 'ReleasesInitialAdmin' });
