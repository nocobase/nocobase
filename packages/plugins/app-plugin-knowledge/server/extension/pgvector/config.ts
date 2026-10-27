import { z } from 'zod';
import type { JsonObject } from '../../../shared/indexing.js';
import type { ParsedIndexingSettings } from '../../indexing/types.js';
import { canonicalJson, sha256 } from '../../indexing/vector.js';
import { embeddingSchema, parseWith } from '../sqlite-vec/config.js';

export interface PgIndexingConfig {
  readonly url?: string;
  readonly host?: string;
  readonly port?: number;
  readonly database?: string;
  readonly user?: string;
  readonly password?: string;
  readonly schema: string;
  readonly table: string;
  readonly ssl?:
    | false
    | {
        readonly rejectUnauthorized: boolean;
        readonly ca?: string;
        readonly cert?: string;
        readonly key?: string;
      };
}
const connectionSchema = z
  .object({
    url: z
      .url()
      .refine((value) => {
        const url = URL.parse(value);
        if (!url || !['postgres:', 'postgresql:'].includes(url.protocol))
          return false;
        try {
          decodeURIComponent(url.pathname);
          decodeURIComponent(url.username);
          return true;
        } catch {
          return false;
        }
      })
      .optional(),
    host: z.string().trim().min(1).optional(),
    port: z.number().int().min(1).max(65535).optional(),
    database: z.string().trim().min(1).optional(),
    user: z.string().trim().min(1).optional(),
    password: z.string().optional(),
    schema: z
      .string()
      .regex(/^[a-z_][a-z0-9_]{0,62}$/)
      .default('public'),
    table: z
      .string()
      .regex(/^[a-z][a-z0-9_]{0,19}$/)
      .default('knowledge'),
    ssl: z
      .union([
        z.literal(false),
        z
          .object({
            rejectUnauthorized: z.boolean().default(true),
            ca: z.string().optional(),
            cert: z.string().optional(),
            key: z.string().optional(),
          })
          .strict(),
      ])
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.url && URL.canParse(value.url)) {
      const url = new URL(value.url);
      // Locator fields must not silently resolve from process-wide PG* defaults.
      const host = url.searchParams.get('host') ?? url.hostname;
      const user = url.searchParams.get('user') ?? url.username;
      const port = url.searchParams.get('port') ?? (url.port || '5432');
      if (
        !host ||
        !user ||
        !/^[0-9]+$/.test(port) ||
        Number(port) < 1 ||
        Number(port) > 65535
      )
        ctx.addIssue({
          code: 'custom',
          path: ['url'],
          message:
            'The connection URL must specify a host, user and valid port.',
        });
      for (const field of [
        'host',
        'port',
        'database',
        'user',
        'password',
      ] as const) {
        if (value[field] !== undefined)
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: 'Use either a URL or separate connection fields.',
          });
      }
    } else {
      for (const field of ['host', 'database', 'user'] as const) {
        if (!value[field])
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: 'A connection value is required.',
          });
      }
    }
  });
export function pgConfiguration(value: JsonObject): PgIndexingConfig {
  const config = parseWith(connectionSchema, value);
  return config.url ? config : { ...config, port: config.port ?? 5432 };
}
export function parsePgConfig(value: JsonObject): JsonObject {
  return { ...pgConfiguration(value) };
}
export function parsePgSettings(value: JsonObject): ParsedIndexingSettings {
  const options = parseWith(
    z
      .object({
        // Accept and discard the former page option; it never selects storage.
        table: z
          .string()
          .regex(/^[a-z][a-z0-9_]{0,19}$/)
          .optional(),
        embedding: embeddingSchema,
      })
      .strict(),
    value,
  );
  return {
    options: { embedding: options.embedding },
    input: {
      kind: 'embedding',
      model: options.embedding,
      encoding: 'kb-chunk-text-v1',
    },
  };
}
export function pgResourceIdentity(value: JsonObject): string {
  const config = pgConfiguration(value);
  if (config.url) {
    const url = new URL(config.url);
    return sha256(
      canonicalJson({
        host: url.searchParams.get('host') ?? url.hostname,
        port: String(
          Number(url.searchParams.get('port') ?? (url.port || '5432')),
        ),
        database:
          decodeURIComponent(url.pathname.slice(1)) ||
          (url.searchParams.get('user') ?? decodeURIComponent(url.username)),
        user: url.searchParams.get('user') ?? decodeURIComponent(url.username),
        schema: config.schema,
        table: config.table,
      }),
    );
  }
  return sha256(
    canonicalJson({
      host: config.host!,
      port: String(config.port),
      database: config.database!,
      user: config.user!,
      schema: config.schema,
      table: config.table,
    }),
  );
}
