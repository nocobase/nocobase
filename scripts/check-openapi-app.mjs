// Starts one application on SQLite test databases and writes what `scripts/check-openapi.mjs` needs to judge its API
// document: every `/api` route with its declaration (`inspectApiRoutes`), the problems `findApiDocumentSchemaProblems`
// finds, the document itself, and the commands it gives the application's CLI. Only app-server's generic functions are
// used, so a route any plugin contributes is judged the same way.
//
// It runs in a child process under tsx, because applications and workspace packages are TypeScript sources. Every
// package is resolved from the application's directory rather than from this file, so the same runner serves this
// repository's templates and an application assembled elsewhere, such as NocoBase 3 Pro's, which reaches this file
// through its `vendor/nocobase3` submodule.
//
// Usage (internal): node --import <tsx> scripts/check-openapi-app.mjs <request.json>
//
// The request is `{ appDir, connections?, config?, extend?, output }`. `extend` names a module whose default export
// receives the application's runtime definition and returns the one to start, which is how a caller adds plugins:
//
//   export default async (definition, { loadPackage, withPlugins, withConfigs }) => {
//     const { default: mail, mailConfig } = await loadPackage('packages/plugins/app-plugin-mail', './server');
//     return withConfigs(withPlugins(definition, [mail]), { mail: mailConfig });
//   };
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CONDITIONS = new Set(['import', 'node', 'default']);

function pickExport(target) {
  if (typeof target === 'string') return target;
  if (Array.isArray(target)) {
    for (const entry of target) {
      const picked = pickExport(entry);
      if (picked) return picked;
    }
    return undefined;
  }
  if (target && typeof target === 'object') {
    for (const [condition, value] of Object.entries(target)) {
      if (!CONDITIONS.has(condition)) continue;
      const picked = pickExport(value);
      if (picked) return picked;
    }
  }
  return undefined;
}

/**
 * The file a package directory exports at `subpath` (`.` or `./server`) under the `import` condition, as a file URL.
 */
export function resolvePackageExport(packageDir, subpath = '.') {
  const manifest = JSON.parse(
    readFileSync(path.join(packageDir, 'package.json'), 'utf8'),
  );
  let target;
  if (manifest.exports !== undefined) {
    const exportsMap =
      typeof manifest.exports === 'string' ||
      Object.keys(manifest.exports).every((key) => !key.startsWith('.'))
        ? { '.': manifest.exports }
        : manifest.exports;
    target = pickExport(exportsMap[subpath]);
  } else {
    target = subpath === '.' ? (manifest.module ?? manifest.main) : subpath;
  }
  if (!target) {
    throw new Error(
      `${manifest.name ?? packageDir} does not export ${subpath} under the import condition.`,
    );
  }
  return pathToFileURL(path.join(packageDir, target)).href;
}

/**
 * Resolves a bare specifier the way Node would from a module inside `fromDir`: the nearest `node_modules` holding the
 * package, then its `exports` entry for the subpath under the `import` condition.
 */
export function resolveFrom(fromDir, specifier) {
  const segments = specifier.split('/');
  const name = specifier.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : segments[0];
  const subpath = `.${specifier.slice(name.length)}`;
  for (let dir = path.resolve(fromDir); ; dir = path.dirname(dir)) {
    const packageDir = path.join(dir, 'node_modules', name);
    if (existsSync(path.join(packageDir, 'package.json'))) {
      return resolvePackageExport(packageDir, subpath);
    }
    if (path.dirname(dir) === dir) break;
  }
  throw new Error(`Cannot resolve ${specifier} from ${fromDir}.`);
}

async function main() {
  const request = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const appDir = path.resolve(request.appDir);
  const load = (specifier) => import(resolveFrom(appDir, specifier));

  process.env.AUTH_SECRET ??=
    'openapi-check-auth-secret-at-least-32-characters';

  const [
    { inspectApiRoutes, findApiDocumentSchemaProblems, apiDocsToken, cliToken },
    { defineStandaloneServer },
    { resolveAppRuntime, startApplicationInScope },
    { defineServerPlugins },
    { createTestApp },
    { default: appRuntime },
    { createApp },
  ] = await Promise.all([
    load('@nocobase/app-server/router'),
    load('@nocobase/app-server/node'),
    load('@nocobase/app-server/runtime'),
    load('@nocobase/app-server/plugins'),
    load('@nocobase/app-testing/server'),
    import(pathToFileURL(path.join(appDir, 'server/runtime.ts')).href),
    import(pathToFileURL(path.join(appDir, 'server/app.ts')).href),
  ]);

  const helpers = {
    /** Imports a package as the application resolves it. */
    load,
    /** Imports what a package directory exports at `subpath`, such as a workspace plugin the application does not list. */
    loadPackage: (packageDir, subpath = '.') =>
      import(resolvePackageExport(path.resolve(packageDir), subpath)),
    /** The definition with `plugins` appended to the application's own server plugins. */
    withPlugins: (definition, plugins) => ({
      ...definition,
      plugins: defineServerPlugins([...definition.plugins.plugins, ...plugins]),
    }),
    /** The definition with configuration sections added to its defaults, each a `defineAppConfig` factory. */
    withConfigs: (definition, configs) => {
      const base = definition.defaultConfigs;
      const factory = (runtime) => ({
        ...base?.(runtime),
        ...Object.fromEntries(
          Object.entries(configs).map(([key, configure]) => [
            key,
            configure(runtime),
          ]),
        ),
      });
      const sections = new Map(base?.sections ?? []);
      for (const [key, configure] of Object.entries(configs)) {
        if (configure.rules) sections.set(key, configure.rules);
      }
      return {
        ...definition,
        defaultConfigs: Object.assign(factory, { sections }),
      };
    },
  };

  let definition = appRuntime;
  if (request.extend) {
    const { default: extend } = await import(
      pathToFileURL(path.resolve(request.extend)).href
    );
    definition = await extend(definition, helpers);
  }

  // The same composition as the application's `server/embedded.ts`, with the runtime definition swapped for the
  // extended one. A standalone proxy, such as the Hub's, forwards outside `/api` and does not change the document.
  const standalone = defineStandaloneServer({
    rootDir: appDir,
    appRuntime: definition,
    createServer: async (scope) =>
      startApplicationInScope(
        scope,
        createApp(await resolveAppRuntime(definition, scope)),
      ),
  });

  let app;
  try {
    app = await createTestApp({
      createServer: standalone.create,
      connections: request.connections ?? ['main'],
      config: {
        auth: { secret: process.env.AUTH_SECRET },
        // The Hub plugin would otherwise start its host; the document does not depend on it.
        hub: { host: { enabled: false } },
        // Keep the report readable: startup information is noise here, and log files would outlive the run.
        logging: { level: 'error', file: { enabled: false } },
        ...request.config,
      },
      server: { env: { DB_MIGRATIONS_AUTO_RUN: 'true' } },
    });
    const { application } = app;
    const routes = inspectApiRoutes(application);
    const document = await application.container
      .resolve(apiDocsToken)
      .getDocument();

    // Every command the document gives the application's CLI, with the application's exclusions applied: what
    // `scripts/gen-cli-reference.mjs` documents.
    const cli = application.container.has(cliToken)
      ? application.container.resolve(cliToken)
      : undefined;

    writeFileSync(
      request.output,
      `${JSON.stringify({
        routes,
        schemaProblems: findApiDocumentSchemaProblems(document),
        document,
        cliCommands: cli ? cli.commandsOf(document) : [],
        cliDescription: cli ? cli.described() : {},
      })}\n`,
    );
  } finally {
    await app?.close();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  // Exit explicitly: a plugin may leave a timer or a handle behind once the application has closed.
  main().then(
    () => process.exit(0),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
}
