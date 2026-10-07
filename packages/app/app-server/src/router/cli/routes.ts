import { Hono, type Context } from 'hono';
import { z } from 'zod';

import {
  ApiError,
  apiErrorHandler,
  apiNotFoundHandler,
  appErrorDomain,
} from '../api-error.js';
import {
  apiErrorResponse,
  dataResponse,
  describeRoute,
} from '../openapi/describe.js';
import type { ApiDocsService } from '../openapi/service.js';
import type { CliService } from './service.js';
import { renderCliReference } from './reference.js';
import { cliRoute, type CliManifest } from './types.js';

const Identity = z.enum(['person', 'run']);

const CliParameterSchema = z
  .object({
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
      .optional()
      .meta({
        description:
          'Read from the environment when not given, the first found wins: a variable, or a field (dot-separated `path`) of the JSON file the variable `file` names.',
      }),
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
  })
  .meta({ ref: 'CliParameter' });

const CliCommandSchema = z
  .object({
    id: z.string().meta({
      description: 'The command words joined by `:`, such as `issue:get`.',
    }),
    summary: z.string(),
    description: z.string().optional(),
    operationId: z.string().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    path: z.string().meta({
      description:
        'The request path, the base path included, with `{name}` placeholders.',
    }),
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
  })
  .meta({ ref: 'CliCommand' });

const CliManifestSchema: z.ZodType<CliManifest> = z
  .object({
    version: z.number().int(),
    etag: z.string(),
    identity: z.object({
      kind: Identity,
      userId: z.string(),
      displayName: z.string(),
      runId: z.string().optional(),
      actions: z.array(z.string()).meta({
        description: 'The business actions the caller holds.',
      }),
    }),
    commands: z.array(CliCommandSchema),
    withheld: z
      .array(
        z
          .object({
            id: z.string(),
            summary: z.string(),
            reason: z.enum(['identity', 'action']),
            identities: z.array(Identity),
            action: z.string().optional(),
          })
          .meta({ ref: 'CliWithheldCommand' }),
      )
      .meta({
        description:
          'The commands the document describes that the caller is not offered: another identity’s, or naming an action it does not hold.',
      }),
  })
  .meta({ ref: 'CliManifest' });

const MANIFEST_OPERATION = 'cliGetManifest';
const REFERENCE_OPERATION = 'cliGetReference';

const bound = new WeakMap<ApiDocsService, CliService>();

/**
 * The manifest takes every credential that names a CLI identity: the document's own (a session, an API key) and each
 * scheme `addIdentityScheme()` names that the document declares, such as an agent's run token.
 */
function bindManifestSecurity(cli: CliService, docs: ApiDocsService): void {
  if (bound.get(docs) === cli) return;
  bound.set(docs, cli);
  cli.onChange(() => docs.invalidate());
  docs.addTransform((document) => {
    const operations = Object.values(document.paths ?? {})
      .map((item) => item?.get)
      .filter(
        (candidate) =>
          candidate?.operationId === MANIFEST_OPERATION ||
          candidate?.operationId === REFERENCE_OPERATION,
      );
    const declared = document.components?.securitySchemes ?? {};
    for (const operation of operations) {
      if (!operation) continue;
      const base = operation.security ?? document.security ?? [];
      const named = new Set(
        base.flatMap((requirement) => Object.keys(requirement)),
      );
      const extra = Object.keys(cli.identitySchemes())
        .filter((scheme) => scheme in declared && !named.has(scheme))
        .sort()
        .map((scheme) => ({ [scheme]: [] }));
      if (extra.length > 0) operation.security = [...base, ...extra];
    }
  });
}

/**
 * `GET /cli/manifest`, mounted under `/api`: the commands the caller may run, derived from the API document and
 * filtered by who calls. Without a caller resolver it answers `404 ROUTE_NOT_FOUND`, like a path that does not exist.
 */
export function createCliRouter(cli: CliService, docs: ApiDocsService): Hono {
  bindManifestSecurity(cli, docs);
  const router = new Hono();
  router.onError(apiErrorHandler);
  const manifestOf = async (context: Context): Promise<CliManifest> => {
    const caller = await cli.callerOf(context);
    if (!caller)
      throw new ApiError({
        status: 'UNAUTHENTICATED',
        reason: 'CLI_UNAUTHENTICATED',
        domain: appErrorDomain,
        message: 'Sign in, or present an API key or a run token.',
      });
    return cli.manifestFor(await docs.getDocument(), caller);
  };
  router.get(
    '/cli/manifest',
    describeRoute({
      tags: ['Cli'],
      summary: 'Get the command-line manifest',
      operationId: MANIFEST_OPERATION,
      description:
        "The commands the caller may run, derived from this document: each operation's `x-cli` extension, or its tag, path and method. A person signs in or presents an API key; an agent's run presents its run token. Answers an `etag`; a request whose `if-none-match` names the current one is answered `304` without a body.",
      responses: {
        200: dataResponse(CliManifestSchema),
        304: {
          description: 'The manifest has not changed since `if-none-match`.',
        },
        401: apiErrorResponse(
          401,
          'No credential the application recognizes (`CLI_UNAUTHENTICATED`).',
        ),
        404: apiErrorResponse(
          404,
          'The application recognizes no CLI callers (`ROUTE_NOT_FOUND`).',
        ),
        500: apiErrorResponse(500),
      },
      ...cliRoute(false),
    }),
    async (context) => {
      if (!cli.hasCallers()) return apiNotFoundHandler(context);
      const manifest = await manifestOf(context);
      context.header('etag', `"${manifest.etag}"`);
      context.header('cache-control', 'private, no-cache');
      const asked = context.req.header('if-none-match');
      if (
        asked &&
        asked.replace(/^W\//u, '').replaceAll('"', '') === manifest.etag
      )
        return context.body(null, 304);
      return context.json({ data: manifest });
    },
  );
  router.get(
    '/cli/llms.txt',
    describeRoute({
      tags: ['Cli'],
      summary: 'Get the command-line reference for agents',
      operationId: REFERENCE_OPERATION,
      description:
        'The commands the caller may run as compact Markdown an agent reads before using the CLI: how it answers, one line per command with its usage, summary and action, and the commands that need an action the caller does not hold. Takes the same credentials as the manifest.',
      responses: {
        200: {
          description: 'The reference.',
          content: { 'text/plain': { schema: { type: 'string' } } },
        },
        401: apiErrorResponse(
          401,
          'No credential the application recognizes (`CLI_UNAUTHENTICATED`).',
        ),
        404: apiErrorResponse(
          404,
          'The application recognizes no CLI callers (`ROUTE_NOT_FOUND`).',
        ),
        500: apiErrorResponse(500),
      },
      ...cliRoute(false),
    }),
    async (context) => {
      if (!cli.hasCallers()) return apiNotFoundHandler(context);
      const manifest = await manifestOf(context);
      context.header('cache-control', 'private, no-cache');
      return context.text(renderCliReference(manifest, cli.described()));
    },
  );
  return router;
}
