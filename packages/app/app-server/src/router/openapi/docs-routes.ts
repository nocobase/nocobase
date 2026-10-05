import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Hono, type MiddlewareHandler } from 'hono';
import { describeRoute } from 'hono-openapi';
import { createMiddleware } from 'hono/factory';

import {
  ApiError,
  apiErrorHandler,
  apiNotFoundHandler,
  appErrorDomain,
} from '../api-error.js';
import type { ApiDocsService } from './service.js';

/** The Swagger UI files the page loads, with their content types. The build copies exactly these into `dist/swagger-ui`. */
export const swaggerUiAssets: Readonly<Record<string, string>> = Object.freeze({
  'swagger-ui-bundle.js': 'text/javascript; charset=utf-8',
  'swagger-ui.css': 'text/css; charset=utf-8',
  'favicon-32x32.png': 'image/png',
  'favicon-16x16.png': 'image/png',
});

/**
 * Where the Swagger UI files are read from: `dist/swagger-ui`, which the build fills, when this module runs from the
 * published `dist`; otherwise the `swagger-ui-dist` package, which a source checkout has installed as a development
 * dependency.
 */
function swaggerUiDirectory(): string | undefined {
  const built = fileURLToPath(new URL('../../swagger-ui/', import.meta.url));
  if (existsSync(path.join(built, 'swagger-ui-bundle.js'))) return built;
  try {
    return path.dirname(
      createRequire(import.meta.url).resolve('swagger-ui-dist/package.json'),
    );
  } catch {
    return undefined;
  }
}

const assetCache = new Map<string, Promise<Uint8Array>>();

function readAsset(name: string): Promise<Uint8Array> {
  let cached = assetCache.get(name);
  if (!cached) {
    const directory = swaggerUiDirectory();
    cached = directory
      ? readFile(path.join(directory, name)).then(
          (buffer) => new Uint8Array(buffer),
        )
      : Promise.reject(new Error('Swagger UI is not installed.'));
    assetCache.set(name, cached);
    cached.catch(() => assetCache.delete(name));
  }
  return cached;
}

const initializer = `window.ui = SwaggerUIBundle({
  url: '../swagger',
  dom_id: '#swagger-ui',
  deepLinking: true,
  // Keep what "Authorize" was given, such as an API key, across reloads of the page. A signed-in session needs
  // nothing here: the browser sends its cookie with every request the page makes to its own origin.
  persistAuthorization: true,
});
`;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!,
  );
}

// The page lives at /api/swagger/docs, so `docs/<file>` resolves to /api/swagger/docs/<file> and `../swagger` in the
// initializer to /api/swagger, under whatever base path the application is served at.
function page(title: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="icon" type="image/png" href="docs/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="docs/favicon-16x16.png" sizes="16x16" />
    <link rel="stylesheet" href="docs/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="docs/swagger-ui-bundle.js"></script>
    <script src="docs/initializer.js"></script>
  </body>
</html>
`;
}

function accessGuard(service: ApiDocsService): MiddlewareHandler {
  return createMiddleware(async (context, next) => {
    // Without any access check the application cannot tell who is asking, so the documentation does not exist.
    if (!service.hasAccessChecks()) return apiNotFoundHandler(context);
    if (!(await service.canRead(context))) {
      throw new ApiError({
        status: 'UNAUTHENTICATED',
        reason: 'API_DOCS_UNAUTHENTICATED',
        domain: appErrorDomain,
        message: 'Sign in or present an API key to read the API documentation.',
      });
    }
    await next();
  });
}

/**
 * `GET /swagger` (the OpenAPI document), `GET /swagger/docs` (Swagger UI) and the page's files, mounted under `/api`.
 * Every one is hidden from the document it serves and guarded by the service's access checks.
 */
export function createApiDocsRouter(service: ApiDocsService): Hono {
  const router = new Hono();
  router.onError(apiErrorHandler);
  const guard = accessGuard(service);

  router.get(
    '/swagger',
    // The documentation itself, not an operation of the API it documents.
    describeRoute({ hide: true }),
    guard,
    async (context) => {
      context.header('Cache-Control', 'no-store');
      return context.json(await service.getDocument());
    },
  );
  router.get(
    '/swagger/docs',
    // A browser page over the document above.
    describeRoute({ hide: true }),
    guard,
    async (context) => {
      const document = await service.getDocument();
      context.header('Cache-Control', 'no-store');
      return context.html(page(`${document.info.title} API`));
    },
  );
  router.get(
    '/swagger/docs/:file',
    // Static files of the Swagger UI page.
    describeRoute({ hide: true }),
    guard,
    async (context) => {
      const file = context.req.param('file');
      if (file === 'initializer.js') {
        return context.body(initializer, 200, {
          'Content-Type': 'text/javascript; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
      }
      const contentType = Object.hasOwn(swaggerUiAssets, file)
        ? swaggerUiAssets[file]
        : undefined;
      if (!contentType) return apiNotFoundHandler(context);
      let content: Uint8Array;
      try {
        content = await readAsset(file);
      } catch (error) {
        throw new ApiError({
          status: 'UNAVAILABLE',
          reason: 'API_DOCS_ASSETS_MISSING',
          domain: appErrorDomain,
          message: 'The Swagger UI files are not installed with this build.',
          cause: error,
        });
      }
      return context.body(content as Uint8Array<ArrayBuffer>, 200, {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      });
    },
  );
  return router;
}
