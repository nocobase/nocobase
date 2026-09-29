// @vitest-environment node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sqlite from '@nocobase/db-sqlite';
import { createDatabaseManager, type DatabaseManager } from '@nocobase/db';
import {
  createQueueManager,
  createSyncQueueConfig,
  type NocoBaseQueueManager,
} from '@nocobase/queue';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, expect, it, vi } from 'vitest';

import { buildApplicationWorkflows } from '../build/index.js';
import { workflowStore } from '../server/collections/index.js';
import { asId, asIdFilter } from '../server/engine/utils.js';
import { WorkflowRepository } from '../server/repositories/workflow-repository.js';
import { WorkflowService } from '../server/service.js';
import { createWorkflowCollections, requireRow } from './helpers.js';

/**
 * One application, authored with the typed builder, taken the whole way.
 *
 * The other DSL tests stop at `compile()` or start from a hand-written flat IR
 * and a row inserted straight into the database. This one covers the seam
 * between them: `workflow build` evaluates and typechecks the definition in a
 * child process, writes an Artifact, and the server then discovers that
 * Artifact, materializes it, and executes the handler modules it names.
 */
const dslEntry = fileURLToPath(new URL('../dsl/index.ts', import.meta.url));
const packageModules = fileURLToPath(
  new URL('../node_modules', import.meta.url),
);

const roots: string[] = [];
const databases: DatabaseManager[] = [];
const queues: NocoBaseQueueManager[] = [];

afterEach(async () => {
  await Promise.all(queues.splice(0).map((queue) => queue.close()));
  await Promise.all(databases.splice(0).map((database) => database.destroy()));
  await Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

const DEFINITION = `
import { Type } from '@sinclair/typebox';
import {
  createConditionInstruction,
  createRunInstruction,
  createTerminateInstruction,
  defineHandler,
  workflow,
  type ContextOf,
} from ${JSON.stringify(dslEntry)};

import type { run as total } from './server/total.js';
import type { run as approved } from './server/approved.js';
import type { run as record } from './server/record.js';

const source = workflow({
  key: 'quotation',
  title: 'Quotation',
  input: { schema: Type.Object({ amount: Type.Number() }) },
  parameters: { schema: Type.Object({ limit: Type.Number({ default: 10 }) }) },
});

const flow = source
  .addNode(
    createRunInstruction({ key: 'total', title: 'Total' }).run(
      defineHandler<typeof total>('./server/total'),
    ),
  )
  .addNode(
    createConditionInstruction({ key: 'approve', title: 'Approve' })
      .check(defineHandler<typeof approved>('./server/approved'))
      .yes([
        createRunInstruction({ key: 'record', title: 'Record' }).run(
          defineHandler<typeof record>('./server/record'),
        ),
      ])
      .no([createTerminateInstruction({ key: 'stop' }).outcome('success')]),
  );

// An interface rather than a type alias: the handlers this context describes
// are what the flow infers it from, and only a lazily resolved member list
// breaks that cycle.
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}

export default flow.finalize();
`;

/** Handler sources, as TypeScript beside the definition and as built output. */
const HANDLERS: Readonly<Record<string, { ts: string; js: string }>> = {
  total: {
    ts: `import type { FlowContext } from '../workflow.js';

export async function run({
  input,
  parameters,
}: FlowContext): Promise<{ total: number }> {
  return { total: input.amount * parameters.limit };
}
`,
    js: 'export async function run({ input, parameters }) { return { total: input.amount * parameters.limit }; }\n',
  },
  approved: {
    ts: `import type { FlowContext } from '../workflow.js';

export async function run({ nodeResults }: FlowContext): Promise<boolean> {
  return (nodeResults.total?.total ?? 0) > 100;
}
`,
    js: 'export async function run({ nodeResults }) { return (nodeResults.total?.total ?? 0) > 100; }\n',
  },
  record: {
    ts: `import type { FlowContext } from '../workflow.js';

export async function run({ nodeResults }: FlowContext): Promise<string> {
  return \`recorded:\${nodeResults.total?.total ?? 0}\`;
}
`,
    js: 'export async function run({ nodeResults }) { return `recorded:${nodeResults.total?.total ?? 0}`; }\n',
  },
};

async function application(): Promise<{
  root: string;
  sourceRoot: string;
  resourceRoot: string;
  distRoot: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-dsl-e2e-'));
  roots.push(root);
  const sourceRoot = path.join(root, 'workflows');
  const resourceRoot = path.join(root, 'dist/compiled/workflows');
  // A real application resolves its own dependencies; the definition imports
  // TypeBox the way an authored workflow does.
  await fs.symlink(packageModules, path.join(root, 'node_modules'), 'dir');
  const sourcePackage = path.join(sourceRoot, 'quotation');
  const compiledPackage = path.join(resourceRoot, 'quotation');
  await fs.mkdir(path.join(sourcePackage, 'server'), { recursive: true });
  await fs.mkdir(path.join(compiledPackage, 'server'), { recursive: true });
  await fs.writeFile(path.join(sourcePackage, 'workflow.ts'), DEFINITION);
  // The definition is evaluated from source; the server loads the output the
  // application's own TypeScript build produced, which is what `--resource-root`
  // points `workflow build` at.
  await fs.writeFile(
    path.join(compiledPackage, 'workflow.js'),
    'export default {};\n',
  );
  for (const [name, { ts, js }] of Object.entries(HANDLERS)) {
    await fs.writeFile(path.join(sourcePackage, `server/${name}.ts`), ts);
    await fs.writeFile(path.join(compiledPackage, `server/${name}.js`), js);
  }
  return {
    root,
    sourceRoot,
    resourceRoot,
    distRoot: path.join(root, 'dist/workflows'),
  };
}

function createService(app: Awaited<ReturnType<typeof application>>): {
  service: WorkflowService;
  database: DatabaseManager;
} {
  const database = createDatabaseManager({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  databases.push(database);
  const queue = createQueueManager(createSyncQueueConfig());
  queues.push(queue);
  return {
    database,
    service: new WorkflowService({
      database,
      queue,
      services: new ServiceContainer(),
      sourceRoot: app.sourceRoot,
      distRoot: app.distRoot,
      artifactDisk: {
        driver: 'fs',
        location: path.join(app.root, 'storage/private'),
        visibility: 'private',
      },
      production: true,
    }),
  };
}

it(
  'builds, deploys, materializes and executes a workflow authored with the builder',
  { timeout: 120_000 },
  async () => {
    const app = await application();
    const built = await buildApplicationWorkflows({
      sourceRoot: app.sourceRoot,
      resourceRoot: app.resourceRoot,
      distRoot: app.distRoot,
    });
    expect(built.packages).toBe(1);
    const artifact = JSON.parse(
      await fs.readFile(path.join(built.artifacts[0], 'workflow.json'), 'utf8'),
    ) as {
      key: string;
      start: string;
      parameters: Record<string, unknown>;
      nodes: { key: string; type: string; config: Record<string, unknown> }[];
    };
    // The builder's output survives evaluation and compilation unchanged: the
    // authored parameter object schema is lowered to the runtime declaration
    // map, and every node names a handler module rather than an expression.
    expect(artifact.key).toBe('quotation');
    expect(artifact.start).toBe('total');
    expect(artifact.parameters).toEqual({
      limit: { type: 'number', default: 10 },
    });
    expect(
      artifact.nodes.map(({ key, type, config }) => ({ key, type, config })),
    ).toEqual([
      { key: 'total', type: 'run', config: { module: './server/total' } },
      {
        key: 'approve',
        type: 'condition',
        config: { module: './server/approved' },
      },
      // Branches are flattened in branch-key order, so `no` precedes `yes`.
      { key: 'stop', type: 'terminate', config: { outcome: 'success' } },
      { key: 'record', type: 'run', config: { module: './server/record' } },
    ]);
    // The definition's own TypeScript never reaches the Artifact; only what the
    // application built does.
    await expect(
      fs.access(path.join(built.artifacts[0], 'server/total.ts')),
    ).rejects.toMatchObject({ code: 'ENOENT' });

    const { service, database } = createService(app);
    const store = workflowStore(database);
    await createWorkflowCollections(database.builder());
    try {
      await service.synchronizeDeploymentArtifacts();
      const repository = new WorkflowRepository(database, service);
      const [listed] = (await repository.list()).data;
      expect(listed).toMatchObject({ key: 'quotation', enabled: false });
      await repository.enable(listed.hash!);

      await service.trigger('quotation', { amount: 25 }, { eventKey: 'yes' });
      const accepted = await requireRow(
        store.runs.findOne({ filter: { eventKey: 'yes' } }),
        'The approved run',
      );
      await vi.waitFor(async () => {
        const nodeRuns = await store.nodeRuns.findMany({
          filter: { workflowRunId: asIdFilter(asId(accepted.id)) },
        });
        expect(
          Object.fromEntries(
            nodeRuns.map((nodeRun) => [nodeRun.nodeKey, nodeRun.result]),
          ),
        ).toEqual({
          total: { total: 250 },
          approve: true,
          record: 'recorded:250',
        });
      });

      // The other branch proves the condition handler decided it, rather than
      // the engine always walking the first block.
      await service.trigger('quotation', { amount: 1 }, { eventKey: 'no' });
      const rejected = await requireRow(
        store.runs.findOne({ filter: { eventKey: 'no' } }),
        'The rejected run',
      );
      await vi.waitFor(async () => {
        const nodeRuns = await store.nodeRuns.findMany({
          filter: { workflowRunId: asIdFilter(asId(rejected.id)) },
        });
        expect(nodeRuns.map((nodeRun) => nodeRun.nodeKey).sort()).toEqual([
          'approve',
          'stop',
          'total',
        ]);
      });
    } finally {
      await service.dispose();
    }
  },
);
