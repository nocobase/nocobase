// Builds the API document of each application template and fails when it is incomplete: a `/api` route that declares
// neither `describeRoute({...})` nor `describeRoute({ hide: true })` (as `findUndeclaredApiRoutes` reports it), a
// documented operation without `tags`, `summary` or `operationId`, an `operationId` two operations share, and a schema
// reference `findApiDocumentSchemaProblems` cannot resolve.
//
// Each application starts the way its tests start it — its own runtime, providers and plugins on SQLite test
// databases, so no database server is needed — in a child process that `scripts/check-openapi-app.mjs` runs under tsx.
// There is no stored snapshot to compare against: the check judges the document the current sources produce.
//
// Usage:
//   node scripts/check-openapi.mjs                 # every template
//   node scripts/check-openapi.mjs default hub     # the named templates only
//
// Another repository reuses the check by importing `runOpenApiCheck` and passing its own targets, each an application
// directory plus an optional `extend` module that adds plugins to it. NocoBase 3 Pro does this through its
// `vendor/nocobase3` submodule, checking the OSS default template with its commercial plugins added.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { resolveFrom } from './check-openapi-app.mjs';

const repositoryRoot = path.resolve(
  fileURLToPath(new URL('..', import.meta.url)),
);
const runnerPath = fileURLToPath(
  new URL('./check-openapi-app.mjs', import.meta.url),
);

const httpMethods = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

/** The application templates this repository checks, by name. */
export function templateTargets(root = repositoryRoot) {
  const template = (name) =>
    path.join(root, 'packages/templates', `app-template-${name}`);
  return [
    { name: 'default', appDir: template('default') },
    // `externalCrm` is an external connection: the application reads it but does not own it, so it keeps the
    // configuration the template gives it.
    {
      name: 'examples',
      appDir: template('examples'),
      connections: ['main', 'analytics'],
    },
    { name: 'hub', appDir: template('hub') },
  ];
}

/** Every documented operation in the document, as `{ operation, operationId, tags, summary }`. */
export function documentOperations(document) {
  return Object.entries(document?.paths ?? {}).flatMap(([route, item]) =>
    httpMethods.flatMap((method) => {
      const operation = item?.[method];
      if (!operation || typeof operation !== 'object') return [];
      return [
        {
          operation: `${method.toUpperCase()} ${route}`,
          operationId: operation.operationId,
          tags: operation.tags,
          summary: operation.summary,
        },
      ];
    }),
  );
}

const SPEC =
  'packages/app/app-skills/skills/nocobase-app-development/references/http-api.md';

/** How to fix each kind of problem, printed under it so a failing run says what to change, not only what is wrong. */
export const openApiFixes = Object.freeze({
  undeclared:
    'Add describeRoute({ tags, summary, operationId, responses }) to the route, after its authentication and ' +
    'permission middleware and before its apiValidator(...) calls, with tags the plugin name in PascalCase and an ' +
    'operationId of namespace + verb + resource. Only a route the specification lets you hide (the application ' +
    'shell, a browser-only flow, the docs routes, a transport endpoint, an unconfigured fallback) takes ' +
    'describeRoute({ hide: true }) instead, with a comment saying why.',
  forwarded:
    'A runtime dispatcher forwards this path to something the document cannot describe. Register a Hono router ' +
    'whose routes declare describeRoute(...) instead: through authz.routes.add(path, createRouteHandler(router)) ' +
    "for the authorization plugin, or apiDocs.addApiRouter({ owner, prefix, scope, router }) for a plugin's own " +
    'dispatcher. A route declared outside the forwarded path is never reached: move it under that path or delete it.',
  missing:
    'Complete its describeRoute(...): tags is the plugin name in PascalCase, summary an English verb phrase, and ' +
    'operationId namespace + verb + resource in camelCase, such as hubDeployApp.',
  duplicate:
    'Rename one of the two operationIds. They are unique across the application, so start each with the namespace ' +
    'of the plugin that owns the route.',
  schema:
    'A $ref points nowhere or a component has a generated name. Give a schema that several routes share a unique ' +
    ".meta({ ref: '<PluginName><Thing>' }) and do not reuse a ref for two different schemas; run " +
    "findApiDocumentSchemaProblems(document) in the plugin's tests to see the same list.",
});

/**
 * The problems in one application's inspection, each `{ message, fix }`: what is wrong, then what to change.
 * `inspection` is what `check-openapi-app.mjs` writes: `{ routes, schemaProblems, document }`.
 */
export function findOpenApiProblems(inspection) {
  const problems = [];
  for (const route of inspection.routes ?? []) {
    if (!route.declared) {
      // A route registered as undeclared, or one declared where its dispatcher never forwards, says why itself.
      problems.push(
        route.reason
          ? {
              message: `${route.method} ${route.path}: ${route.reason}`,
              fix: openApiFixes.forwarded,
            }
          : {
              message: `${route.method} ${route.path}: declares neither describeRoute({...}) nor describeRoute({ hide: true }).`,
              fix: openApiFixes.undeclared,
            },
      );
    }
  }
  const seen = new Map();
  for (const { operation, operationId, tags, summary } of documentOperations(
    inspection.document,
  )) {
    const missing = [
      ...(Array.isArray(tags) && tags.length > 0 ? [] : ['tags']),
      ...(typeof summary === 'string' && summary.trim() ? [] : ['summary']),
      ...(typeof operationId === 'string' && operationId
        ? []
        : ['operationId']),
    ];
    if (missing.length > 0) {
      problems.push({
        message: `${operation}: is documented without ${missing.join(', ')}.`,
        fix: openApiFixes.missing,
      });
    }
    if (typeof operationId !== 'string' || !operationId) continue;
    const first = seen.get(operationId);
    if (first) {
      problems.push({
        message: `${operation}: operationId ${operationId} is already used by ${first}.`,
        fix: openApiFixes.duplicate,
      });
    } else {
      seen.set(operationId, operation);
    }
  }
  for (const problem of inspection.schemaProblems ?? []) {
    problems.push({ message: `schema: ${problem}`, fix: openApiFixes.schema });
  }
  return problems;
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      ...options,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });
}

/**
 * Starts the target's application in a child process and returns its inspection. Output from the application goes to
 * this process's stderr and stdout; the inspection travels through a file.
 */
export async function inspectApplication(target, { cwd = process.cwd() } = {}) {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'nocobase-openapi-check-'),
  );
  try {
    const requestPath = path.join(directory, 'request.json');
    const output = path.join(directory, 'inspection.json');
    await writeFile(
      requestPath,
      JSON.stringify({
        appDir: target.appDir,
        connections: target.connections,
        config: target.config,
        extend: target.extend,
        output,
      }),
    );
    const code = await run(
      process.execPath,
      ['--import', resolveFrom(target.appDir, 'tsx'), runnerPath, requestPath],
      {
        cwd,
        env: {
          ...process.env,
          // The check runs on SQLite whatever the environment selects for the test suites.
          NOCOBASE_TEST_DB_DIALECT: 'sqlite',
          NODE_ENV: process.env.NODE_ENV ?? 'test',
        },
      },
    );
    if (code !== 0) {
      throw new Error(
        `the application did not start (exit code ${code}); see the output above.`,
      );
    }
    return JSON.parse(await readFile(output, 'utf8'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

/**
 * Checks every target and prints a report; resolves to the process exit code. A target is
 * `{ name, appDir, connections?, config?, extend? }`: the application directory (holding `server/runtime.ts` and
 * `server/app.ts`), the connections that get a test database (`['main']` by default), further configuration, and a
 * module whose default export adds plugins, as `check-openapi-app.mjs` describes.
 */
export async function runOpenApiCheck(
  targets,
  {
    inspect = inspectApplication,
    log = console.log,
    rerun = 'node scripts/check-openapi.mjs <default|examples|hub>',
    error = console.error,
  } = {},
) {
  let failed = false;
  for (const target of targets) {
    log(
      `Checking the API document of ${target.name} (${path.relative(process.cwd(), target.appDir) || '.'})`,
    );
    let problems;
    let inspection;
    try {
      inspection = await inspect(target);
      problems = findOpenApiProblems(inspection);
    } catch (cause) {
      problems = [
        {
          message: `could not build the document: ${cause instanceof Error ? cause.message : String(cause)}`,
          fix: 'Fix the start-up error printed above; the check starts the application on SQLite test databases the way its tests do.',
        },
      ];
    }
    if (problems.length === 0) {
      const operations = documentOperations(inspection.document).length;
      log(
        `  ok: ${inspection.routes.length} routes, ${operations} documented operations`,
      );
      continue;
    }
    failed = true;
    error(
      `  ${target.name}: ${problems.length} problem${problems.length === 1 ? '' : 's'}`,
    );
    for (const { message, fix } of problems) {
      error(`    ${message}`);
      error(`      Fix: ${fix}`);
    }
  }
  if (failed) {
    error(
      `\nThe rules are in ${SPEC} ("API documentation"). Re-run the check with \`${rerun}\`.`,
    );
  }
  return failed ? 1 : 0;
}

async function main(argv) {
  const all = templateTargets();
  const names = argv.filter((argument) => !argument.startsWith('-'));
  const unknown = names.filter(
    (name) => !all.some((target) => target.name === name),
  );
  if (unknown.length > 0) {
    console.error(
      `Unknown template ${unknown.join(', ')}; expected ${all.map(({ name }) => name).join(', ')}.`,
    );
    return 2;
  }
  return runOpenApiCheck(
    names.length > 0 ? all.filter(({ name }) => names.includes(name)) : all,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = await main(process.argv.slice(2));
}
