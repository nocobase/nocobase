import { Readable } from 'node:stream';

import {
  DIST_ACCEPT_NPM,
  DIST_TARGET_PATTERN,
  distAccepts,
  DistArtifactSchema,
  DistManifestSchema,
  DistNpmPackageSchema,
  DistResolutionSchema,
  HEADERS,
  isDistNpmPackage,
  ProtocolError,
  type DistArtifact,
  UNIVERSAL_TARGET,
  type DistNpmPackage,
  type DistResolution,
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

import { distributionRouter } from './http.js';
import type { DistService } from './artifacts.js';
import type { DownloadTokenService } from './download-tokens.js';

import {
  DistFileParams,
  DistTargetParams,
  DistTargetQuery,
  DownloadTokenSchema,
} from './schemas.js';

export type Admission = (context: Context) => Promise<boolean>;
export interface DistributionRoutesOptions {
  readonly artifacts: DistService;
  /** Explicit allowed products, or 'all' when the host intentionally serves every configured product. */
  readonly products: readonly string[] | 'all';
  readonly admissions?: readonly Admission[];
  readonly fallback?: MiddlewareHandler;
  readonly mint?: {
    readonly guard: MiddlewareHandler;
    readonly tokens: DownloadTokenService;
    readonly createdBy: (context: Context) => string | null;
  };
  readonly openapi?: Partial<
    Record<
      'mint' | 'manifest' | 'resolve' | 'file',
      import('@nocobase/app-server/router').DescribeRouteOptions
    >
  >;
  readonly unauthorizedMessage?: string;
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
    // Only for the universal tarball, so the answer for a tarball built for the platform stays as it was.
    ...(parsed.universal === true ? ['universal=true'] : []),
    '',
  ].join('\n');
}

/** The same lines for an npm answer, led by `kind=npm`; only a caller that sent `accept=npm` reads them. */
export function npmPackageEnv(npm: DistNpmPackage): string {
  const parsed = DistNpmPackageSchema.parse(npm);
  return [
    `kind=${parsed.kind}`,
    `product=${parsed.product}`,
    `version=${parsed.version}`,
    `package=${parsed.package}`,
    `channel=${parsed.channel}`,
    '',
  ].join('\n');
}

/** `artifactEnv` or `npmPackageEnv`, whichever the answer is. */
export function resolutionEnv(resolution: DistResolution): string {
  return isDistNpmPackage(resolution)
    ? npmPackageEnv(resolution)
    : artifactEnv(resolution);
}

/** A token authorizes before file lookup, then binds/counts the actual artifact's platform. */
export function downloadTokenAdmission(
  tokens: DownloadTokenService,
  artifacts: DistService,
): Admission {
  /** What a download token is asked for on this request: the manifest, a platform, or a tarball (which counts). */
  return async (context) => {
    const token = context.req.header(HEADERS.downloadToken);
    if (!token) return false;
    const { product, target, version, file } = context.req.param() as Partial<
      Record<'product' | 'target' | 'version' | 'file', string>
    >;
    if (version !== undefined && file !== undefined && product !== undefined) {
      // Checked before the file is looked up, so an invalid token learns nothing about which files there are.
      await tokens.admit(token, { product });
      const found = await artifacts.file(product, version, file);
      // The universal tarball serves every platform, so it downloads under whichever one the token is bound to.
      await tokens.admit(token, {
        product,
        ...(found.target === UNIVERSAL_TARGET ? {} : { target: found.target }),
        download: true,
      });
      return true;
    }
    await tokens.admit(token, {
      ...(product === undefined ? {} : { product }),
      ...(target === undefined ? {} : { target }),
    });
    return true;
  };
}

export function createDistributionRoutes(
  options: DistributionRoutesOptions,
): Hono {
  const products = options.products;
  if (products !== 'all' && !Array.isArray(products))
    throw new Error("products must explicitly be an array or 'all'.");
  const router = distributionRouter();
  const artifacts = options.artifacts;
  const allowed: MiddlewareHandler = async (context, next) => {
    for (const admission of options.admissions ?? []) {
      if (await admission(context)) return next();
    }
    if (options.fallback) return options.fallback(context, next);
    throw new ProtocolError(
      'UNAUTHORIZED',
      options.unauthorizedMessage ??
        'A download credential or sign-in is required.',
    );
  };
  const productAllowed: MiddlewareHandler = async (context, next) => {
    const product = context.req.param('product');
    if (
      product !== undefined &&
      products !== 'all' &&
      !products.includes(product)
    )
      throw new ProtocolError(
        'NOT_FOUND',
        `This application serves no ${product} on the ${artifacts.channel} channel. Build it with nocobase cli build.`,
      );
    return next();
  };
  const downloadErrors = {
    401: apiErrorResponse(
      401,
      'A required download credential or signed-in identity is missing or invalid.',
    ),
    500: apiErrorResponse(500),
  };
  if (options.mint !== undefined) {
    const mint = options.mint;
    router.post(
      '/downloadTokens',
      mint.guard,
      describeRoute(
        options.openapi?.mint ?? {
          tags: ['CliDistribution'],
          summary: 'Create a CLI download token',
          operationId: 'cliDistributionMint',
          ...cliRoute(false),
          responses: {
            201: dataResponse(DownloadTokenSchema),
            ...apiErrorResponses,
          },
        },
      ),
      async (context) => {
        return context.json(
          { data: await mint.tokens.create(mint.createdBy(context)) },
          201,
        );
      },
    );
  }

  router.get(
    '/manifest',
    allowed,
    productAllowed,
    describeRoute(
      options.openapi?.manifest ?? {
        tags: ['CliDistribution'],
        summary: 'Get the distribution manifest',
        operationId: 'cliDistributionManifest',
        ...cliRoute(false),
        responses: { 200: dataResponse(DistManifestSchema), ...downloadErrors },
      },
    ),
    async (context) => {
      const manifest = await artifacts.manifest();
      return context.json({
        data:
          products !== 'all'
            ? {
                ...manifest,
                products: Object.fromEntries(
                  Object.entries(manifest.products).filter(([product]) =>
                    products.includes(product),
                  ),
                ),
              }
            : manifest,
      });
    },
  );

  router.get(
    '/products/:product/targets/:target',
    allowed,
    productAllowed,
    describeRoute(
      options.openapi?.resolve ?? {
        tags: ['CliDistribution'],
        summary: 'Resolve a CLI artifact',
        operationId: 'cliDistributionResolve',
        ...cliRoute(false),
        responses: {
          200: {
            description: 'The resolved artifact or npm package.',
            content: {
              'application/json': {
                schema: resolver(z.object({ data: DistResolutionSchema })),
              },
              'text/plain': { schema: { type: 'string' } },
            },
          },
          404: apiErrorResponse(404),
          ...downloadErrors,
        },
      },
    ),
    apiValidator('param', DistTargetParams),
    apiValidator('query', DistTargetQuery),
    async (context) => {
      const { product, target } = context.req.valid('param');
      const query = context.req.valid('query');
      // An npm answer only to a caller that asked for it: everyone else is answered exactly as before it existed.
      const npm =
        distAccepts(query.accept, DIST_ACCEPT_NPM) &&
        DIST_TARGET_PATTERN.test(target)
          ? await artifacts.npmPackage(product)
          : null;
      const resolution: DistResolution =
        npm ?? (await artifacts.resolve(product, target));
      if (query.format === 'env')
        return context.text(resolutionEnv(resolution), 200, {
          'cache-control': 'no-store',
        });
      return context.json({ data: resolution }, 200, {
        'cache-control': 'no-store',
      });
    },
  );

  router.get(
    '/products/:product/versions/:version/files/:file',
    allowed,
    productAllowed,
    describeRoute(
      options.openapi?.file ?? {
        tags: ['CliDistribution'],
        summary: 'Download a CLI artifact',
        operationId: 'cliDistributionFile',
        ...cliRoute(false),
        responses: {
          200: {
            description: 'The artifact file.',
            content: {
              'application/gzip': {
                schema: { type: 'string', format: 'binary' },
              },
            },
            headers: {
              'x-checksum-sha256': {
                schema: { type: 'string' },
                description: 'The SHA-256 checksum.',
              },
            },
          },
          404: apiErrorResponse(404),
          ...downloadErrors,
        },
      },
    ),
    apiValidator('param', DistFileParams),
    async (context) => {
      const { product, version, file: name } = context.req.valid('param');
      const file = await artifacts.file(product, version, name);
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
