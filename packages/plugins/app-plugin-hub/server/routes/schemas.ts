// Input schemas of the Hub routes. A route validates its path parameters, query and JSON body with these before its
// handler runs; the service keeps its own checks for rules that need the database, and reports them with its own
// reasons.
import { z } from 'zod';

import {
  HUB_API_KEY_SCOPES,
  type HubApiKeyScope,
} from '../../shared/api-keys.js';
import type {
  CreateHubAppInput,
  DeployHubAppInput,
  RollbackHubAppInput,
  UpdateHubConfigInput,
  UpdateHubSettingsInput,
} from '../tokens.js';
import type { CreateHubApiKeyInput } from '../../shared/api-keys.js';

const id: z.ZodString = z.string().min(1);

export const AppParams: z.ZodObject<{ appId: z.ZodString }> = z.object({
  appId: id,
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
  q: z.string().trim().max(100).optional(),
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
  pageToken: z.string().optional(),
  level: z.enum(LOG_LEVELS).optional(),
  source: z.string().optional(),
  q: z.string().optional(),
  // RFC 3339 in UTC (`Z`), the form journal entries are stored in.
  since: z.iso.datetime().optional(),
  until: z.iso.datetime().optional(),
  fromStart: z.enum(['true', 'false']).optional(),
});

type ConfigInputSchema = z.ZodObject<
  {
    mode: z.ZodEnum<{ file: 'file'; external: 'external' }>;
    content: z.ZodOptional<z.ZodString>;
  },
  z.core.$strict
>;

const configInput: ConfigInputSchema = z.strictObject({
  mode: z.enum(['file', 'external']),
  content: z.string().optional(),
});

export const CreateAppInput: z.ZodObject<
  {
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
  },
  z.core.$strict
> = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
}) satisfies z.ZodType<CreateHubAppInput>;

export const UpdateConfigInput: z.ZodObject<
  { content: z.ZodString },
  z.core.$strict
> = z.strictObject({
  content: z.string(),
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
  releaseId: id,
  config: configInput.optional(),
}) satisfies z.ZodType<Omit<DeployHubAppInput, 'idempotencyKey'>>;

export const RollbackInput: z.ZodObject<
  { deploymentId: z.ZodString; config: z.ZodOptional<ConfigInputSchema> },
  z.core.$strict
> = z.strictObject({
  deploymentId: id,
  config: configInput.optional(),
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
  appIds: z.array(id),
  allApps: z.boolean().optional(),
  scopes: z.array(z.enum(HUB_API_KEY_SCOPES)).min(1),
  expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
}) satisfies z.ZodType<CreateHubApiKeyInput>;

export const StartUploadInput: z.ZodObject<
  { size: z.ZodNumber; sha256: z.ZodString },
  z.core.$strict
> = z.strictObject({
  size: z.number().int().positive(),
  sha256: z.string(),
});

/** An optional `Idempotency-Key`; the service checks its format and answers `INVALID_IDEMPOTENCY_KEY`. */
export const IdempotencyHeaders: z.ZodObject<{
  'idempotency-key': z.ZodOptional<z.ZodString>;
}> = z.object({
  'idempotency-key': z.string().optional(),
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
  'x-artifact-sha256': z.string().optional(),
  'idempotency-key': z.string().optional(),
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
    .regex(/^[1-9]\d{0,15}$/, 'A chunk needs a positive Content-Length.'),
  'upload-offset': z
    .string()
    .regex(/^(?:0|[1-9]\d{0,15})$/, 'A chunk needs an Upload-Offset header.'),
});
