import { Readable } from 'node:stream';
import {
  ApiError,
  appErrorDomain,
  defineApiRoutes,
  defineRootRoutes,
  defineRepositoryApiRoutes,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  dataResponse,
  describeRoute,
  type ApiErrorStatus,
  type AppRouteContribution,
  type RepositoryApiActions,
} from '@nocobase/app-server/router';
import { driveManagerToken } from '@nocobase/app-server/drive';
import {
  addBasePathToLocation,
  joinBasePath,
} from '@nocobase/app-server/support';
import type { RepositoryPolicy } from '@nocobase/db';
import type { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import {
  FileRepositoryError,
  normalizeAccessPath,
  normalizeFileRecord,
  validMime,
  type ServerFileRepository,
} from './repository.js';
import {
  contentUrlSchema,
  uploadManyBodySchema,
  uploadManyResultSchema,
  uploadOneBodySchema,
  uploadOneResultSchema,
} from './schemas.js';
import { serverFileRepositoryManagerToken } from './token.js';

export interface FileRepositoryApiActions extends RepositoryApiActions {
  readonly uploadOne?: { readonly maxSize?: number };
  readonly uploadMany?: { readonly maxSize?: number };
}
export interface FileRepositoryApiExposure<P = unknown> {
  readonly name: string;
  readonly collection?: string;
  readonly connection?: string;
  readonly disk: string;
  readonly accessPath?: string;
  readonly accessMode?: 'stream' | 'redirect';
  /**
   * The Policy every action of this exposure runs under, including uploads.
   *
   * `uploadOne` and `uploadMany` do not go through `defineRepositoryApiRoutes`
   * — they compose their own values and call the Repository directly — so what
   * they bind is derived from this one: the `create` scope and defaults are
   * inherited, and the field allowlist is replaced by the file columns, which
   * is the only thing a caller cannot influence here. See `uploadPolicy`.
   *
   * The public byte route under `accessPath` is the deliberate exception. It
   * serves anyone holding the UUID, has no authentication of its own, and is
   * unaffected by this Policy.
   */
  readonly policy: RepositoryPolicy | ((principal: P) => RepositoryPolicy);
  readonly actions: FileRepositoryApiActions;
}
export interface FileRepositoryRoutesApplication {
  readonly container: ServiceContainer;
  readonly publicBasePath?: string;
}
export interface DefineFileRepositoryApiRoutesOptions<P = unknown> {
  readonly repositories: readonly FileRepositoryApiExposure<P>[];
  /** Resolve the principal a Policy function receives. See `app-server`. */
  readonly principal?: (context: Context) => P | Promise<P>;
}

/**
 * The base Policy for the paths that neither write nor scope what they read:
 * the public byte route, and the middleware that decorates a CRUD response
 * with a content URL.
 *
 * `uploadPolicy` reads every file column whatever base it is handed, and none
 * of these paths writes, so granting nothing is the honest base. It also keeps
 * the application's principal resolver from running a second time on a request
 * the CRUD routes have already resolved it for.
 */
const unwritablePolicy: RepositoryPolicy = {
  read: false,
  create: false,
  update: false,
  delete: false,
};

/** Public first-version routes. Authentication and authorization are application-owned. */
export function defineFileRepositoryApiRoutes<P = unknown>(
  options: DefineFileRepositoryApiRoutesOptions<P>,
): readonly AppRouteContribution<FileRepositoryRoutesApplication>[] {
  const paths: string[] = [];
  const entries = options.repositories.map((entry) => {
    const accessPath = normalizeAccessPath(
      entry.accessPath ?? `/uploads/${entry.name}`,
    );
    if (
      paths.some(
        (path) =>
          path === accessPath ||
          path.startsWith(`${accessPath}/`) ||
          accessPath.startsWith(`${path}/`),
      )
    )
      throw new Error(`Conflicting file accessPath: ${accessPath}`);
    paths.push(accessPath);
    if (!entry.disk) throw new Error('File repository disk is required.');
    if (
      entry.accessMode !== undefined &&
      !['stream', 'redirect'].includes(entry.accessMode)
    )
      throw new Error('Invalid file accessMode.');
    const { uploadOne, uploadMany, ...actions } = entry.actions;
    for (const upload of [uploadOne, uploadMany]) {
      if (upload === undefined) continue;
      if (
        !upload ||
        typeof upload !== 'object' ||
        Object.keys(upload).some((key) => key !== 'maxSize')
      )
        throw new Error('Invalid upload action configuration.');
      if (
        upload.maxSize !== undefined &&
        (!Number.isSafeInteger(upload.maxSize) || upload.maxSize <= 0)
      )
        throw new Error('maxSize must be a positive safe integer.');
    }
    return { ...entry, accessPath, actions, uploadOne, uploadMany };
  });
  const crud = defineRepositoryApiRoutes<P>({
    principal: options.principal,
    repositories: entries.map(
      ({ name, collection, connection, policy, actions }) => ({
        name,
        collection,
        connection,
        policy,
        actions,
        // Added by the decoration middleware below to every record these endpoints return.
        computedFields: { contentUrl: contentUrlSchema },
      }),
    ),
  });
  const resolve = (
    app: FileRepositoryRoutesApplication,
    entry: (typeof entries)[number],
    policy: RepositoryPolicy,
  ): ServerFileRepository =>
    app.container
      .resolve(serverFileRepositoryManagerToken)
      .repository(entry.collection ?? entry.name, {
        connection: entry.connection,
        disk: entry.disk,
        accessPath: entry.accessPath,
        policy,
      });
  const urlFor =
    (app: FileRepositoryRoutesApplication, files: ServerFileRepository) =>
    (record: { id: string; ext: string }): string =>
      `${(app.publicBasePath ?? '').replace(/\/$/, '')}${files.getUrl(record)}`;
  return [
    defineApiRoutes(async (app: FileRepositoryRoutesApplication) => {
      const router = fileRouter();
      for (const entry of entries) {
        const files = resolve(app, entry, unwritablePolicy);
        const getUrl = urlFor(app, files);
        for (const action of Object.keys(entry.actions)) {
          // The same literal path the generated endpoint answers, so this
          // decoration runs exactly where the Repository route does.
          router.use(`/${entry.name}/${action}`, async (c, next) => {
            await files.validateCollection();
            await next();
            if (
              !c.res.ok ||
              ![
                'findMany',
                'findOne',
                'createOne',
                'updateOne',
                'deleteOne',
              ].includes(action)
            )
              return;
            if (
              c.res.headers
                .get('content-type')
                ?.includes('application/x-ndjson') &&
              c.res.body
            ) {
              c.res = new Response(decorateStream(c.res.body, getUrl), {
                status: c.res.status,
                headers: c.res.headers,
              });
            } else {
              const envelope = (await c.res.json()) as { data: unknown };
              c.res = Response.json(
                {
                  ...envelope,
                  data: decorate(
                    envelope.data,
                    getUrl,
                    action !== 'findOne' && action !== 'findMany',
                  ),
                },
                { status: c.res.status, headers: c.res.headers },
              );
            }
          });
        }
        for (const action of ['uploadOne', 'uploadMany'] as const) {
          const config = entry[action];
          if (config === undefined) continue;
          // Permission comes first: the principal and the exposure's `create` Policy are decided before the size
          // limit, the content type or the multipart body is looked at, so a refused caller learns nothing about its
          // input and nothing is ever written to storage on its behalf. The Repository that step binds reaches the
          // handler through the request's own Context, which every handler in the chain shares.
          const authorized = new WeakMap<Context, ServerFileRepository>();
          const maxSize =
            config.maxSize ?? (action === 'uploadOne' ? 5 : 20) * 1024 * 1024;
          router.post(
            `/${entry.name}/${action}`,
            async (c, next) => {
              // The exposure's own Policy governs an upload, so a Policy that reads the principal has to be built
              // here rather than when the router was.
              let policy: RepositoryPolicy;
              if (typeof entry.policy === 'function') {
                const principal = await options.principal?.(c);
                if (principal === undefined || principal === null)
                  throw uploadError(
                    'PERMISSION_DENIED',
                    'PRINCIPAL_REQUIRED',
                    'This endpoint requires a principal and none was resolved.',
                  );
                policy = entry.policy(principal);
              } else {
                policy = entry.policy;
              }
              // The Repository would refuse the row too, but only after the object had been stored and then removed
              // again. The reason is the Repository's own, so a client sees the same refusal either way.
              if (policy.create === false)
                throw new ApiError({
                  status: 'PERMISSION_DENIED',
                  reason: 'WRITE_FORBIDDEN',
                  domain: appErrorDomain,
                  message: 'create is forbidden by Policy.',
                });
              authorized.set(c, resolve(app, entry, policy));
              await next();
            },
            describeUpload(entry.name, action, maxSize),
            bodyLimit({
              maxSize,
              onError: (c) =>
                apiErrorHandler(
                  uploadError(
                    'INVALID_ARGUMENT',
                    'BODY_TOO_LARGE',
                    'Upload request body is too large.',
                    413,
                  ),
                  c,
                ),
            }),
            async (c) => {
              const writable = authorized.get(c);
              if (!writable)
                throw new Error('Upload reached its handler unauthorized.');
              if (
                !c.req
                  .header('content-type')
                  ?.toLowerCase()
                  .startsWith('multipart/form-data;')
              )
                throw uploadError(
                  'INVALID_ARGUMENT',
                  'UNSUPPORTED_MEDIA_TYPE',
                  'Expected multipart/form-data.',
                  415,
                );
              let body: Awaited<ReturnType<typeof c.req.parseBody>>;
              try {
                body = await c.req.parseBody({ all: true });
              } catch (cause) {
                throw uploadError(
                  'INVALID_ARGUMENT',
                  'INVALID_MULTIPART',
                  'Invalid multipart body.',
                  undefined,
                  cause,
                );
              }
              const value = body.file;
              if (action === 'uploadOne') {
                if (!(value instanceof File))
                  throw uploadError(
                    'INVALID_ARGUMENT',
                    'INVALID_FILE',
                    'Exactly one File is required.',
                  );
                // Every successful upload creates a file record.
                return c.json(
                  {
                    data: decorate(
                      await writable.uploadOne({ file: value }),
                      getUrl,
                      true,
                    ),
                  },
                  201,
                );
              }
              const uploads = Array.isArray(value)
                ? value
                : value === undefined
                  ? []
                  : [value];
              if (
                !uploads.length ||
                !uploads.every((file): file is File => file instanceof File)
              )
                throw uploadError(
                  'INVALID_ARGUMENT',
                  'INVALID_FILES',
                  'At least one File is required.',
                );
              return c.json(
                {
                  data: decorate(
                    await writable.uploadMany({ files: uploads as File[] }),
                    getUrl,
                    true,
                  ),
                },
                201,
              );
            },
          );
        }
      }
      router.route('/', await crud.createRouter(app));
      return router;
    }),
    defineRootRoutes((app: FileRepositoryRoutesApplication) => {
      const router = fileRouter();
      for (const entry of entries) {
        const files = resolve(app, entry, unwritablePolicy);
        router.get(`${entry.accessPath}/:file`, async (c) => {
          const match =
            /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\.([a-z0-9]{1,32}))?$/.exec(
              c.req.param('file'),
            );
          if (!match) return c.notFound();
          const record = await files.findOne({ filter: { id: match[1] } });
          if (!record || record.ext !== (match[2] ?? '')) return c.notFound();
          const disk = app.container
            .resolve(driveManagerToken)
            .use(record.disk);
          if (!(await disk.exists(record.key))) return c.notFound();
          c.header('Cache-Control', 'private, no-store');
          if (entry.accessMode === 'redirect') {
            const url = await files.getStorageUrl(record);
            const publicBasePath = app.publicBasePath ?? '';
            // Check the final target after the host rewrites root-relative redirects.
            const location = new URL(
              addBasePathToLocation(url, publicBasePath),
              c.req.url,
            );
            if (
              location.origin === new URL(c.req.url).origin &&
              entries.some((item) =>
                location.pathname.startsWith(
                  `${joinBasePath(publicBasePath, item.accessPath)}/`,
                ),
              )
            )
              throw new FileRepositoryError(
                'STORAGE_URL_UNAVAILABLE',
                'Storage URL points back to a file access route.',
              );
            return c.redirect(url, 302);
          }
          c.header('Content-Type', validMime(record.mimeType));
          c.header('Content-Length', String(record.size));
          c.header('X-Content-Type-Options', 'nosniff');
          c.header('Content-Security-Policy', "sandbox; default-src 'none'");
          c.header(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodeURIComponent(Buffer.from(record.filename).toString('utf8')).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)}`,
          );
          return c.body(
            Readable.toWeb(
              await disk.getStream(record.key),
            ) as ReadableStream<Uint8Array>,
          );
        });
      }
      return router;
    }),
  ];
}

/**
 * The API document's description of an upload endpoint. It sits with the exposure's data endpoints — the same tag and
 * the same `<exposure><Action>` operationId the framework gives them — because a caller thinks of it as one more
 * action of that exposure.
 */
function describeUpload(
  exposure: string,
  action: 'uploadOne' | 'uploadMany',
  maxSize: number,
): MiddlewareHandler {
  const one = action === 'uploadOne';
  return describeRoute({
    tags: [`${exposure.charAt(0).toUpperCase()}${exposure.slice(1)}`],
    summary: one
      ? `Upload a file to ${exposure}`
      : `Upload several files to ${exposure}`,
    operationId: `${exposure}${action.charAt(0).toUpperCase()}${action.slice(1)}`,
    description: `${one ? 'Stores one file and creates its file record.' : 'Stores every file and creates their file records in one write; if any of them fails, none is kept.'} The body is \`multipart/form-data\` of at most ${maxSize} bytes. The exposure's Policy decides whether the caller may create records, before the body is read. The record's \`contentUrl\` serves the content; that route is public to anyone holding the URL.`,
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: one ? uploadOneBodySchema : uploadManyBodySchema,
        },
      },
    },
    responses: {
      201: dataResponse(
        one ? uploadOneResultSchema : uploadManyResultSchema,
        one ? 'The created file record.' : 'The created file records.',
      ),
      ...apiErrorResponses,
      400: apiErrorResponse(
        400,
        `The body is not valid multipart (\`INVALID_MULTIPART\`) or ${one ? 'does not hold exactly one `file` (`INVALID_FILE`)' : 'holds no `file` or a `file` field that is not a file (`INVALID_FILES`)'}.`,
      ),
      403: apiErrorResponse(
        403,
        "The exposure's Policy does not allow creating records (`WRITE_FORBIDDEN`), or it depends on a principal and none was resolved (`PRINCIPAL_REQUIRED`).",
      ),
      413: apiErrorResponse(
        413,
        `The body exceeds ${maxSize} bytes (\`BODY_TOO_LARGE\`).`,
      ),
      415: apiErrorResponse(
        415,
        'The body is not `multipart/form-data` (`UNSUPPORTED_MEDIA_TYPE`).',
      ),
    },
  });
}

/** The plugin's namespace, which is the domain of the reasons it defines. */
const FILE_ERROR_DOMAIN = 'file';

function uploadError(
  status: ApiErrorStatus,
  reason: string,
  message: string,
  httpStatus?: 413 | 415,
  cause?: unknown,
): ApiError {
  return new ApiError({
    status,
    reason,
    domain: FILE_ERROR_DOMAIN,
    message,
    ...(httpStatus === undefined ? {} : { httpStatus }),
    ...(cause === undefined ? {} : { cause }),
  });
}

/**
 * The canonical status of each `FileRepositoryError`. Anything not listed is a
 * server-side failure and answers `INTERNAL`, keeping its reason.
 */
const fileErrorStatus: Readonly<Record<string, ApiErrorStatus>> = {
  // The caller sent something that is not a file.
  INVALID_FILE: 'INVALID_ARGUMENT',
  INVALID_FILES: 'INVALID_ARGUMENT',
  // The disk could not produce a URL to redirect to. Usually a storage outage;
  // a storage URL that loops back into a file route is a misconfiguration
  // reported the same way, because the caller can do nothing but retry later.
  STORAGE_URL_UNAVAILABLE: 'UNAVAILABLE',
  // The rest are not the caller's to fix, so they are `INTERNAL`:
  // INVALID_FILE_COLLECTION — the Collection behind the exposure lacks the
  // file columns, a server misconfiguration rather than a state a request
  // could change; INVALID_FILE_METADATA — a stored or reported size is
  // corrupt; FILE_CLEANUP_FAILED — the upload failed and so did removing its
  // objects; FILE_COMMIT_UNCERTAIN — the record may have been written, so it
  // is not `UNAVAILABLE`: retrying could store the file twice.
};

function toFileApiError(error: FileRepositoryError): ApiError {
  return new ApiError({
    status: fileErrorStatus[error.code] ?? 'INTERNAL',
    reason: error.code,
    domain: FILE_ERROR_DOMAIN,
    message: error.message,
    cause: error,
  });
}

/**
 * Answer what this plugin recognizes in the standard error body, so it does so
 * even when mounted on its own; rethrow anything else to the application.
 */
function fileRouter(): Hono {
  const router = new Hono();
  router.onError((error, c) =>
    apiErrorHandler(
      error instanceof FileRepositoryError ? toFileApiError(error) : error,
      c,
    ),
  );
  return router;
}

type UrlBuilder = (record: { id: string; ext: string }) => string;
function decorate(
  value: unknown,
  getUrl: UrlBuilder,
  mutationResult: boolean = false,
): unknown {
  if (Array.isArray(value))
    return value.map((record) => decorate(record, getUrl));
  if (!value || typeof value !== 'object') return value;
  // Only mutation responses wrap records; collections may use these field names.
  if (mutationResult && 'record' in value)
    return { ...value, record: decorate(value.record, getUrl) };
  if (mutationResult && 'records' in value)
    return { ...value, records: decorate(value.records, getUrl) };
  const record = normalizeFileRecord(value as Record<string, unknown>);
  if (typeof record.id === 'string' && typeof record.ext === 'string')
    return {
      ...record,
      contentUrl: getUrl({ id: record.id, ext: record.ext }),
    };
  return record;
}
function decorateStream(
  body: ReadableStream<Uint8Array>,
  getUrl: UrlBuilder,
): ReadableStream<Uint8Array> {
  let pending = '';
  const decoder = new TextDecoder();
  return body
    .pipeThrough(
      new TransformStream<Uint8Array, string>({
        transform(chunk, controller) {
          controller.enqueue(decoder.decode(chunk, { stream: true }));
        },
        flush(controller) {
          controller.enqueue(decoder.decode());
        },
      }),
    )
    .pipeThrough(
      new TransformStream<string, string>({
        transform(chunk, controller) {
          pending += chunk;
          let newline: number;
          while ((newline = pending.indexOf('\n')) !== -1) {
            const line = pending.slice(0, newline);
            pending = pending.slice(newline + 1);
            if (!line) continue;
            const frame = JSON.parse(line) as { type: string; data?: unknown };
            controller.enqueue(
              JSON.stringify(
                frame.type === 'record'
                  ? { ...frame, data: decorate(frame.data, getUrl) }
                  : frame,
              ) + '\n',
            );
          }
        },
        flush(controller) {
          if (pending) controller.enqueue(pending);
        },
      }),
    )
    .pipeThrough(new TextEncoderStream());
}
