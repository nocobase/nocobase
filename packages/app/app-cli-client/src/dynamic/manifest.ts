// The command manifest of the current session (`GET /api/cli/manifest`): the commands the application's API document
// describes for the caller, each a request to one of its routes. Cached by etag in `<state dir>/cache/manifests/`: each fetch sends the
// cached etag (`If-None-Match`) and a 304 reuses the cached manifest. When the server cannot be reached, a cached
// manifest still serves `--help`; running a command needs the server anyway.
//
// The schema here is the client's reading of the wire format the server's `CliManifest` (`@nocobase/app-server/router`)
// writes; it ignores members it does not know, so a newer server does not break an older CLI.
import { createHash } from 'node:crypto';
import path from 'node:path';

import { readErrorBody } from '@nocobase/agent-protocol';
import { z } from 'zod';

import { appCliPaths, type AppCliPaths } from '../config.ts';
import { readJson, writeJsonAtomic } from '../lib/files.ts';
import { AppApiError, dataOf } from '../lib/http.ts';
import type {
  CliCommand,
  CliManifest,
  CliParameter,
} from '../parse/manifest.ts';
import { urlFor, type Session } from './session.ts';

export type {
  CliCommand,
  CliManifest,
  CliParameter,
  CliWithheldCommand,
} from '../parse/manifest.ts';

const Identity = z.enum(['person', 'run']);

export const CliParameterSchema: z.ZodType<CliParameter> = z.object({
  name: z.string(),
  field: z.string(),
  in: z.enum(['path', 'query', 'body', 'file']),
  position: z.number().int().optional(),
  type: z.enum([
    'string',
    'number',
    'integer',
    'boolean',
    'string[]',
    'number[]',
    'json',
  ]),
  required: z.boolean(),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
  default: z.unknown().optional(),
  alias: z.string().optional(),
  contentFile: z.boolean().optional(),
  prompt: z.boolean().optional(),
  fromEnv: z.string().optional(),
  env: z
    .array(
      z.union([z.string(), z.object({ file: z.string(), path: z.string() })]),
    )
    .optional(),
  upload: z
    .object({
      method: z.string(),
      path: z.string(),
      part: z.string(),
      field: z.string(),
      multiple: z.boolean(),
      maxBytes: z.number().int().optional(),
    })
    .optional(),
  ticket: z
    .object({
      maxBytes: z.number().int(),
      accept: z.array(z.string()).optional(),
      optional: z.boolean().optional(),
    })
    .optional(),
  changed: z
    .object({
      dir: z.string(),
      manifest: z.string(),
      maxBytes: z.number().int(),
      maxFiles: z.number().int(),
      accept: z.array(z.string()).optional(),
    })
    .optional(),
  binary: z.boolean().optional(),
  multiple: z.boolean().optional(),
});

export const CliCommandSchema: z.ZodType<CliCommand> = z.object({
  id: z.string().min(1),
  summary: z.string(),
  description: z.string().optional(),
  operationId: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string(),
  parameters: z.array(CliParameterSchema),
  body: z
    .object({
      media: z.enum(['application/json', 'multipart/form-data']),
      file: z.string().optional(),
      required: z.boolean().optional(),
    })
    .optional(),
  output: z.object({
    kind: z.enum(['data', 'list', 'empty', 'download']),
    columns: z.array(z.string()).optional(),
  }),
  confirm: z.string().optional(),
  examples: z.array(z.string()).optional(),
  identities: z.array(Identity),
  action: z.string().optional(),
});

export const CliManifestSchema: z.ZodType<CliManifest> = z.object({
  version: z.number().int(),
  etag: z.string().min(1),
  identity: z.object({
    kind: Identity,
    userId: z.string(),
    displayName: z.string(),
    runId: z.string().optional(),
    actions: z.array(z.string()).optional(),
  }),
  commands: z.array(CliCommandSchema),
  withheld: z
    .array(
      z.object({
        id: z.string(),
        summary: z.string(),
        reason: z.enum(['identity', 'action']),
        identities: z.array(Identity),
        action: z.string().optional(),
      }),
    )
    .optional(),
});

interface CachedManifest {
  readonly etag: string;
  readonly manifest: CliManifest;
}

export function manifestCacheFile(
  paths: AppCliPaths,
  session: Pick<Session, 'server' | 'cacheKey'>,
): string {
  const key = createHash('sha256')
    .update(`${session.server}\u0000${session.cacheKey}`)
    .digest('hex')
    .slice(0, 24);
  return path.join(paths.manifestCache, `${key}.json`);
}

/** The cached manifest of a session, without asking the server; undefined when none is cached. */
export async function readCachedManifest(
  session: Pick<Session, 'server' | 'cacheKey'>,
  paths: AppCliPaths = appCliPaths(),
): Promise<CliManifest | undefined> {
  const cached = await readJson<CachedManifest>(
    manifestCacheFile(paths, session),
  ).catch(() => undefined);
  const parsed = CliManifestSchema.safeParse(cached?.manifest);
  return parsed.success ? parsed.data : undefined;
}

export interface ManifestOptions {
  readonly paths?: AppCliPaths;
  /** Use the cached manifest when the server cannot be reached. */
  readonly offline?: boolean;
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

/** The session's manifest; `AppApiError` when the server refuses or cannot be reached (and nothing is cached). */
export async function loadManifest(
  session: Session,
  options: ManifestOptions = {},
): Promise<CliManifest> {
  const paths = options.paths ?? appCliPaths();
  const file = manifestCacheFile(paths, session);
  const cached = await readJson<CachedManifest>(file).catch(() => undefined);
  // A manifest cached by an older CLI is fetched again rather than misread.
  const usable =
    cached && CliManifestSchema.safeParse(cached.manifest).success
      ? cached
      : undefined;
  const url = urlFor(session.server, session.manifestPath);
  let response: Response;
  try {
    response = await (options.fetch ?? fetch)(url, {
      headers: {
        accept: 'application/json',
        ...session.headers,
        ...(usable ? { 'if-none-match': `"${usable.etag}"` } : {}),
      },
      signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    });
  } catch (error) {
    if (usable && options.offline) return usable.manifest;
    throw new AppApiError(
      0,
      'NETWORK',
      `Could not reach ${url.origin}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (response.status === 304 && usable) return usable.manifest;
  const text = await response.text().catch(() => '');
  let body: unknown;
  try {
    body = text === '' ? undefined : JSON.parse(text);
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const error = readErrorBody(body);
    if (error)
      throw new AppApiError(
        response.status,
        error.reason,
        error.message,
        error.metadata,
        error.status,
      );
    throw new AppApiError(
      response.status,
      `HTTP_${response.status}`,
      `GET ${url.pathname} answered ${response.status}`,
    );
  }
  const manifest = CliManifestSchema.parse(dataOf(body));
  await writeJsonAtomic(file, { etag: manifest.etag, manifest }, 0o600).catch(
    () => undefined,
  );
  return manifest;
}
