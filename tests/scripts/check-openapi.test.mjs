import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { resolveFrom } from '../../scripts/check-openapi-app.mjs';
import {
  findOpenApiProblems,
  openApiFixes,
  runOpenApiCheck,
  templateTargets,
} from '../../scripts/check-openapi.mjs';

const operation = (operationId, extra = {}) => ({
  operationId,
  tags: ['Users'],
  summary: 'List users',
  responses: { 200: { description: 'OK' } },
  ...extra,
});

/** What `check-openapi-app.mjs` writes for an application whose API is fully declared. */
function cleanInspection() {
  return {
    routes: [
      {
        method: 'GET',
        path: '/api/users',
        declared: true,
        hidden: false,
        operationId: 'usersListUsers',
      },
      { method: 'GET', path: '/api/locales', declared: true, hidden: true },
    ],
    schemaProblems: [],
    document: {
      openapi: '3.1.0',
      info: { title: 'app', version: '0.0.0' },
      paths: { '/api/users': { get: operation('usersListUsers') } },
    },
  };
}

function messages(problems) {
  return problems.map(({ message }) => message);
}

test('pairs every kind of problem with how to fix it', () => {
  const inspection = cleanInspection();
  inspection.routes.push(
    { method: 'GET', path: '/api/a', declared: false, hidden: false },
    {
      method: 'ALL',
      path: '/api/b',
      declared: false,
      hidden: false,
      reason: 'A plain function handler cannot be described.',
    },
  );
  inspection.document.paths['/api/c'] = {
    get: operation(undefined, { tags: [] }),
    post: operation('usersListUsers'),
  };
  inspection.schemaProblems.push('#/$defs/User does not resolve.');
  assert.deepEqual(
    findOpenApiProblems(inspection).map(({ fix }) => fix),
    [
      openApiFixes.undeclared,
      openApiFixes.forwarded,
      openApiFixes.missing,
      openApiFixes.duplicate,
      openApiFixes.schema,
    ],
  );
});

test('finds nothing in a fully declared application', () => {
  assert.deepEqual(findOpenApiProblems(cleanInspection()), []);
});

test('reports an undeclared route, missing fields, duplicates and schema problems', () => {
  const inspection = cleanInspection();
  inspection.routes.push({
    method: 'POST',
    path: '/api/users/:userId/disable',
    declared: false,
    hidden: false,
  });
  inspection.document.paths['/api/users/{userId}'] = {
    // Path-level parameters are not an operation and must not be reported.
    parameters: [{ name: 'userId', in: 'path' }],
    get: operation(undefined, { tags: [], summary: ' ' }),
    delete: operation('usersListUsers'),
  };
  inspection.schemaProblems.push('#/$defs/User does not resolve.');

  assert.deepEqual(messages(findOpenApiProblems(inspection)), [
    'POST /api/users/:userId/disable: declares neither describeRoute({...}) nor describeRoute({ hide: true }).',
    'GET /api/users/{userId}: is documented without tags, summary, operationId.',
    'DELETE /api/users/{userId}: operationId usersListUsers is already used by GET /api/users.',
    'schema: #/$defs/User does not resolve.',
  ]);
});

test('requires a route that accepts a run token to declare its business action', () => {
  const inspection = cleanInspection();
  const run = [{ apiKeyAuth: [] }, { runToken: [] }];
  inspection.document.paths['/api/issues/{issueId}'] = {
    get: operation('issuesGet', {
      security: run,
      'x-cli': { action: 'pm.issues/view' },
    }),
    patch: operation('issuesUpdate', { security: run }),
    delete: operation('issuesDelete', { security: run, 'x-cli': false }),
    post: operation('issuesClose', { security: [{ apiKeyAuth: [] }] }),
  };

  const problems = findOpenApiProblems(inspection);
  assert.deepEqual(messages(problems), [
    'DELETE /api/issues/{issueId}: accepts a run token but declares no business action.',
    'PATCH /api/issues/{issueId}: accepts a run token but declares no business action.',
  ]);
  assert.equal(problems[0].fix, openApiFixes.runAction);
});

test('reports why a route counts as undeclared when the inspection says so', () => {
  const inspection = cleanInspection();
  inspection.routes.push({
    method: 'ALL',
    path: '/api/authorization/handWritten',
    declared: false,
    hidden: false,
    reason: 'A plain function handler cannot be described.',
  });

  assert.deepEqual(messages(findOpenApiProblems(inspection)), [
    'ALL /api/authorization/handWritten: A plain function handler cannot be described.',
  ]);
});

test('fails the run and lists the problems of each failing application', async () => {
  const failing = cleanInspection();
  failing.routes.push({
    method: 'GET',
    path: '/api/undeclared',
    declared: false,
    hidden: false,
  });
  const inspections = new Map([
    ['clean', cleanInspection()],
    ['failing', failing],
  ]);
  const logged = [];
  const errors = [];
  const code = await runOpenApiCheck(
    [
      { name: 'clean', appDir: '/apps/clean' },
      { name: 'failing', appDir: '/apps/failing' },
      { name: 'broken', appDir: '/apps/broken' },
    ],
    {
      inspect: async ({ name }) => {
        if (name === 'broken') throw new Error('the application did not start');
        return inspections.get(name);
      },
      log: (line) => logged.push(line),
      error: (line) => errors.push(line),
    },
  );

  assert.equal(code, 1);
  assert.ok(logged.includes('  ok: 2 routes, 1 documented operations'));
  assert.ok(errors.includes('  failing: 1 problem'));
  assert.ok(
    errors.includes(
      '    GET /api/undeclared: declares neither describeRoute({...}) nor describeRoute({ hide: true }).',
    ),
  );
  assert.ok(errors.includes(`      Fix: ${openApiFixes.undeclared}`));
  assert.ok(
    errors.includes(
      '    could not build the document: the application did not start',
    ),
  );
});

test('passes when every application is clean', async () => {
  const code = await runOpenApiCheck(
    [{ name: 'clean', appDir: '/apps/clean' }],
    {
      inspect: async () => cleanInspection(),
      log: () => undefined,
      error: () => undefined,
    },
  );
  assert.equal(code, 0);
});

test('checks the three application templates', () => {
  const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
  assert.deepEqual(
    templateTargets().map(({ name, appDir }) => [
      name,
      path.relative(root, appDir),
    ]),
    [
      ['default', 'packages/templates/app-template-default'],
      ['examples', 'packages/templates/app-template-examples'],
      ['hub', 'packages/templates/app-template-hub'],
    ],
  );
});

test('resolves a package from the application directory through its exports', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'check-openapi-resolve-'));
  try {
    const packageDir = path.join(root, 'node_modules/@scope/lib');
    await mkdir(packageDir, { recursive: true });
    await writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify({
        name: '@scope/lib',
        exports: {
          '.': { types: './index.d.ts', import: './index.ts' },
          './server': {
            types: './server.d.ts',
            node: { import: './server.ts' },
          },
        },
      }),
    );
    const appDir = path.join(root, 'apps/app');
    await mkdir(appDir, { recursive: true });

    assert.equal(
      fileURLToPath(resolveFrom(appDir, '@scope/lib')),
      path.join(packageDir, 'index.ts'),
    );
    assert.equal(
      fileURLToPath(resolveFrom(appDir, '@scope/lib/server')),
      path.join(packageDir, 'server.ts'),
    );
    assert.throws(
      () => resolveFrom(appDir, '@scope/lib/missing'),
      /does not export \.\/missing/,
    );
    assert.throws(
      () => resolveFrom(appDir, '@scope/absent'),
      /Cannot resolve @scope\/absent/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
