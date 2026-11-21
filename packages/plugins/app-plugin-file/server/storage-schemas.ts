import { z } from 'zod';

import type { CheckResult, DiskDescription } from './storage.js';
import type { FileUsageDescription } from './usages.js';

// Schemas of the file storage routes in the API document at `/api/swagger/docs`. The responses are annotated with the
// types the handlers build, so the document cannot drift from what is sent.

export const DiskParams: z.ZodObject<{ disk: z.ZodString }> = z.object({
  disk: z
    .string()
    .min(1)
    .max(255)
    .meta({ description: 'The disk name, a key of `drive.disks`.' }),
});

const source = z
  .enum(['code', 'config', 'default'])
  .meta({
    description:
      "Where the current value comes from: the application's code (`code`), its configuration files or environment (`config`), or Drive's own default (`default`).",
  });

const text = z.union([
  z.string(),
  z.object({
    key: z.string(),
    ns: z.string().optional(),
    defaultValue: z.string().optional(),
  }),
]);

const checkStepSchema = z.object({
  step: z.enum(['write', 'read', 'url', 'delete']),
  status: z.enum(['passed', 'failed', 'skipped']),
  detail: z.string().nullable().meta({
    description:
      "What the step found: the temporary file's key (`write`), the bytes compared (`read`), or how files are downloaded (`url`: `APPLICATION`, `PUBLIC` or `SIGNED`). For `CONFIG_INCOMPLETE`, the missing settings.",
  }),
  reason: z.string().nullable().meta({
    description:
      'A fixed code naming what failed: `CONFIG_INCOMPLETE`, `DISK_UNAVAILABLE`, `WRITE_FAILED`, `READ_FAILED`, `CONTENT_MISMATCH`, `URL_FAILED` or `DELETE_FAILED`.',
  }),
  errorName: z.string().nullable().meta({
    description:
      "The failing error's own name or code, such as `AccessDenied`. Never its message.",
  }),
});

export const CheckResultSchema: z.ZodType<CheckResult> = z
  .object({
    disk: z.string(),
    ok: z.boolean().meta({ description: 'Whether every step passed.' }),
    checkedAt: z.string().meta({ description: 'ISO 8601 time of the check.' }),
    steps: z.array(checkStepSchema),
  })
  .meta({ ref: 'FileStorageCheckResult' });

const diskSchema: z.ZodType<
  DiskDescription & { readonly lastCheck: CheckResult | null }
> = z.object({
  name: z.string(),
  driver: z.enum(['fs', 's3', 'oss', 'custom']),
  location: z
    .object({
      path: z.string().nullable(),
      outsideApp: z.boolean(),
      bucket: z.string().nullable(),
      region: z.string().nullable(),
      endpointHost: z.string().nullable(),
    })
    .meta({
      description:
        'A summary of where files are stored. A local directory is relative to the application directory; one outside it is only flagged. No credentials and no absolute path are ever included.',
    }),
  visibility: z.enum(['public', 'private']).nullable(),
  maxFileSizeMb: z.number().int(),
  urls: z.enum(['application', 'public', 'signed']).meta({
    description:
      'How files are downloaded: served by the application, at a public URL, or at a signed URL.',
  }),
  isDefault: z.boolean(),
  complete: z.boolean(),
  problems: z.array(
    z.enum([
      'LOCATION_MISSING',
      'BUCKET_MISSING',
      'REGION_MISSING',
      'CREDENTIALS_MISSING',
      'NOT_LOADED',
    ]),
  ),
  sources: z.object({
    driver: source,
    location: source,
    visibility: source,
    maxFileSizeMb: source,
  }),
  lastCheck: CheckResultSchema.nullable().meta({
    description:
      'The latest check on this application instance since it started, or null.',
  }),
});

const usageSchema: z.ZodType<
  FileUsageDescription & {
    readonly stats: { readonly files: number; readonly bytes: number } | null;
  }
> = z.object({
  id: z.string(),
  title: text,
  plugin: z.string().nullable(),
  collection: z.string(),
  connection: z.string().nullable(),
  disk: z.string().meta({ description: 'The disk new files go to.' }),
  diskSource: z.enum(['name', 'default', 'config']),
  configPath: z.string().nullable(),
  followsDefault: z.boolean(),
  download: z.enum(['authenticated', 'public']).meta({
    description:
      "`authenticated`: through the plugin's own routes, which check permission. `public`: through a public content URL anyone holding it can open.",
  }),
  stats: z
    .object({ files: z.number().int(), bytes: z.number() })
    .nullable()
    .meta({
      description:
        'How many records the file Collection holds and their total size in bytes; null when they could not be counted.',
    }),
});

export interface FileStorageView {
  readonly defaultDisk: string;
  readonly disks: readonly (DiskDescription & {
    readonly lastCheck: CheckResult | null;
  })[];
  readonly usages: readonly (FileUsageDescription & {
    readonly stats: { readonly files: number; readonly bytes: number } | null;
  })[];
}

export const FileStorageSchema: z.ZodType<FileStorageView> = z
  .object({
    defaultDisk: z.string(),
    disks: z.array(diskSchema),
    usages: z.array(usageSchema),
  })
  .meta({ ref: 'FileStorage' });
