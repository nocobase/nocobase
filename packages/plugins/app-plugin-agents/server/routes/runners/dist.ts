/**
 * `/api/agents/dist`: the runner and the application's CLI as standalone tarballs (`DIST_ROUTES` of
 * `@nocobase/agent-protocol`, served from `distribution/`).
 *
 * Who may download: a runner by its key (self-update, and the CLI a run names), the install script by the one-time
 * registration token it was given (`HEADERS.registrationToken`; the token stays unused until the script registers
 * with it) or by a download token (`HEADERS.downloadToken`: the CLI for one platform, a few downloads within 30
 * minutes), or a signed-in person. Nothing here is public: the install script itself is, from `install.ts`.
 *
 * `POST /downloadTokens` mints a download token for any signed-in person (a session or a personal API key; scoped
 * keys are refused): it reaches nothing the person could not download themselves, and lets a machine where nobody is
 * signed in yet install the CLI, after which `acme login` signs it in as that person.
 */
import { Readable } from 'node:stream';

import {
  DistArtifactSchema,
  DistManifestSchema,
  HEADERS,
  ProtocolError,
  type DistArtifact,
} from '@nocobase/agent-protocol';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  cliRoute,
  describeRoute,
  resolver,
} from '@nocobase/app-server/router';
import type { Context, Hono, MiddlewareHandler } from 'hono';

import { z } from 'zod';

import type { Agents } from '../../composition.js';
import { domainRouter } from '../../kernel/http.js';
import { downloadSecurity, tags } from '../openapi.js';
import {
  DistFileParams,
  DistTargetParams,
  DistTargetQuery,
  DownloadTokenSchema,
} from '../schemas.js';
import type { AdminEnv } from './admin.js';

export interface DistRoutesOptions {
  /**
   * Lets a signed-in person through when the request carries neither a runner key nor a registration token; it
   * answers 401 itself otherwise. Without it only runners and the install script may download.
   */
  readonly authenticatePerson?: MiddlewareHandler;
  /**
   * Authenticates a person and sets `caller`, for minting a download token; without it no one can mint one. The route
   * contribution passes the people guard (scoped keys refused), tests a fake.
   */
  readonly person?: MiddlewareHandler<AdminEnv>;
}

/** `key=value` lines a POSIX shell reads without a JSON parser. Values never contain a newline. */
export function artifactEnv(artifact: DistArtifact): string {
  const parsed = DistArtifactSchema.parse(artifact);
  return [
    `product=${parsed.product}`,
    `version=${parsed.version}`,
    `target=${parsed.target}`,
    `url=${parsed.url}`,
    `sha256=${parsed.sha256}`,
    `size=${parsed.size}`,
    `channel=${parsed.channel}`,
    '',
  ].join('\n');
}

export function createDistRoutes(
  services: Pick<Agents, 'runners' | 'dist' | 'downloadTokens'>,
  options: DistRoutesOptions = {},
): Hono {
  const router = domainRouter();

  /** What a download token is asked for on this request: the manifest, a platform, or a tarball (which counts). */
  const admitDownloadToken = async (
    context: Context,
    token: string,
  ): Promise<void> => {
    const { product, target, version, file } = context.req.param() as Partial<
      Record<'product' | 'target' | 'version' | 'file', string>
    >;
    if (version !== undefined && file !== undefined && product !== undefined) {
      // Checked before the file is looked up, so an invalid token learns nothing about which files there are.
      await services.downloadTokens.admit(token, { product });
      const found = await services.dist.file(product, version, file);
      await services.downloadTokens.admit(token, {
        product,
        target: found.target,
        download: true,
      });
      return;
    }
    await services.downloadTokens.admit(token, {
      ...(product === undefined ? {} : { product }),
      ...(target === undefined ? {} : { target }),
    });
  };

  // Downloads read only: a runner key is checked without counting as the runner being seen.
  const allowed: MiddlewareHandler = async (context, next) => {
    const runnerKey = context.req.header(HEADERS.runnerKey);
    if (runnerKey) {
      await services.runners.authenticate(runnerKey, { touch: false });
      return next();
    }
    const downloadToken = context.req.header(HEADERS.downloadToken);
    if (downloadToken) {
      await admitDownloadToken(context, downloadToken);
      return next();
    }
    const token = context.req.header(HEADERS.registrationToken);
    if (token) {
      if (!(await services.runners.isRegistrationTokenUsable(token)))
        throw new ProtocolError(
          'REGISTRATION_TOKEN_INVALID',
          'The registration token is unknown, used or expired. Create a new one with "Add runtime".',
        );
      return next();
    }
    if (options.authenticatePerson)
      return options.authenticatePerson(context, next);
    throw new ProtocolError(
      'UNAUTHORIZED',
      'Send a runner key, a registration token, a download token, or sign in.',
    );
  };

  const downloadErrors = {
    401: apiErrorResponse(
      401,
      'No runner key, registration token, download token or signed-in person, or one that is not valid (`UNAUTHORIZED`, `REGISTRATION_TOKEN_INVALID`, `DOWNLOAD_TOKEN_INVALID`, `RUNNER_KEY_INVALID`).',
    ),
    500: apiErrorResponse(500),
  };
  const credentials =
    'A runner (its key), the install script (an unused registration token, or a download token for its platform) or a signed-in person may download.';

  if (options.person !== undefined) {
    const person = options.person;
    router.post(
      '/downloadTokens',
      person as unknown as MiddlewareHandler,
      describeRoute({
        tags,
        summary: 'Create a CLI download token',
        operationId: 'agentsCreateDistDownloadToken',
        // Minted by the page that shows the install prompt; a signed-in CLI has no use for one.
        ...cliRoute(false),
        description:
          'A short-lived token the install script downloads the application CLI with (`curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <token>`) on a machine where nobody is signed in yet; it is shown only in this answer. It downloads only the CLI, for the platform of its first request, a few times within 30 minutes, and registers no runner. Any signed-in person may create one: it reaches nothing they could not download themselves. Scoped API keys are refused (`SCOPED_KEY_FORBIDDEN`).',
        responses: {
          201: dataResponse(DownloadTokenSchema, 'Created.'),
          ...apiErrorResponses,
        },
      }),
      async (context) => {
        const caller = (context as unknown as Context<AdminEnv>).get('caller');
        return context.json(
          { data: await services.downloadTokens.create(caller.userId) },
          201,
        );
      },
    );
  }

  router.get(
    '/manifest',
    allowed,
    describeRoute({
      tags,
      summary: 'Get the distribution manifest',
      operationId: 'agentsGetDistManifest',
      // Plumbing: the runner, its install script and `acme` itself download from here.
      ...cliRoute(false),
      description: `Every version of the runner and the CLI the application serves, per platform. ${credentials}`,
      security: downloadSecurity,
      responses: {
        200: dataResponse(DistManifestSchema),
        ...downloadErrors,
      },
    }),
    async (context) => context.json({ data: await services.dist.manifest() }),
  );

  router.get(
    '/products/:product/targets/:target',
    allowed,
    describeRoute({
      tags,
      summary: "Resolve a product's current artifact for a platform",
      operationId: 'agentsResolveDistArtifact',
      // Plumbing: the runner, its install script and `acme` itself download from here.
      ...cliRoute(false),
      description: `The current version of \`product\` (the application's CLI, which carries the runner, or \`nocobase-runner\`) for \`target\` (such as \`darwin-arm64\` or \`linux-x64\`), with its download path and SHA-256. \`format=env\` answers the same as \`key=value\` lines a POSIX shell reads, as the install script does. Never cached. ${credentials}`,
      security: downloadSecurity,
      responses: {
        200: {
          description:
            'The artifact: `{ data }` in JSON, or with `format=env` the lines `product=`, `version=`, `target=`, `url=`, `sha256=`, `size=` and `channel=` as `text/plain`.',
          content: {
            'application/json': {
              schema: resolver(z.object({ data: DistArtifactSchema })),
            },
            'text/plain': {
              schema: {
                type: 'string',
                description: 'One `key=value` line per field.',
              },
            },
          },
        },
        404: apiErrorResponse(
          404,
          'The product is not served, or not for this platform (`PRODUCT_NOT_FOUND`, `PLATFORM_UNSUPPORTED`).',
        ),
        ...downloadErrors,
      },
    }),
    apiValidator('param', DistTargetParams),
    apiValidator('query', DistTargetQuery),
    async (context) => {
      const { product, target } = context.req.valid('param');
      const artifact = await services.dist.resolve(product, target);
      if (context.req.valid('query').format === 'env')
        return context.text(artifactEnv(artifact), 200, {
          'cache-control': 'no-store',
        });
      return context.json({ data: artifact }, 200, {
        'cache-control': 'no-store',
      });
    },
  );

  router.get(
    '/products/:product/versions/:version/files/:file',
    allowed,
    describeRoute({
      tags,
      summary: 'Download a distribution file',
      operationId: 'agentsDownloadDistFile',
      // Plumbing: the runner, its install script and `acme` itself download from here.
      ...cliRoute(false),
      description: `A tarball the manifest lists, as \`application/gzip\`, with its SHA-256 in \`x-checksum-sha256\`. Immutable, so it may be cached. ${credentials}`,
      security: downloadSecurity,
      responses: {
        200: {
          description: 'The file.',
          headers: {
            'x-checksum-sha256': {
              description: "The file's SHA-256, in hex.",
              schema: { type: 'string' },
            },
          },
          content: {
            'application/gzip': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        404: apiErrorResponse(
          404,
          'The manifest lists no such file (`DIST_FILE_NOT_FOUND`).',
        ),
        ...downloadErrors,
      },
    }),
    apiValidator('param', DistFileParams),
    async (context) => {
      const { product, version, file: name } = context.req.valid('param');
      const file = await services.dist.file(product, version, name);
      const stream = Readable.toWeb(file.open()) as ReadableStream<Uint8Array>;
      return context.body(stream, 200, {
        'content-type': 'application/gzip',
        'content-length': String(file.size),
        'x-checksum-sha256': file.sha256,
        'cache-control': 'private, max-age=31536000, immutable',
      });
    },
  );

  return router;
}
