// @vitest-environment node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';
import type { DatabaseManager, Row } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { ServiceContainer } from '@nocobase/service-provider';

import { WorkflowLoader } from '../server/loader/loader.js';
import { LocalWorkflowArtifactStore } from '../server/loader/artifact-store.js';
import { buildApplicationWorkflows } from '../build/index.js';
import { loadWorkflowSourcePackages } from '../build/dev-source.js';
import { WorkflowSourceCheckError } from '../build/source-issues.js';
import { coreInstructions } from '../server/instructions/index.js';
import { WorkflowRepository } from '../server/repositories/workflow-repository.js';
import { workflowStore } from '../server/collections/store.js';
import { WorkflowService } from '../server/service.js';
import {
  WORKFLOW_COLLECTIONS,
  workflowCollectionSchemas,
} from '../server/collections/index.js';
import { findRun, listNodeRuns } from './helpers.js';
import { echoInstruction } from './fixtures/instructions.js';
import { InlineJobExecutor } from './fixtures/inline-job-executor.js';

const authoringEntry = fileURLToPath(new URL('../index.ts', import.meta.url));
const roots: string[] = [];
const testDatabases: TestDatabase[] = [];
/** The Database Manager of each test database, in creation order. */
const databases: DatabaseManager[] = [];
const services: WorkflowService[] = [];

afterEach(async () => {
  await Promise.all(services.splice(0).map((service) => service.dispose()));
  databases.splice(0);
  await Promise.all(
    testDatabases.splice(0).map((testDatabase) => testDatabase.destroy()),
  );
  await Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

async function application(): Promise<{ root: string; sourceRoot: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-dev-source-'));
  roots.push(root);
  return { root, sourceRoot: path.join(root, 'workflows') };
}

async function writePackage(
  sourceRoot: string,
  key: string,
  definition: string,
): Promise<string> {
  const packageRoot = path.join(sourceRoot, key);
  await fs.mkdir(packageRoot, { recursive: true });
  await fs.writeFile(path.join(packageRoot, 'workflow.ts'), definition);
  return packageRoot;
}

function terminatingWorkflow(title: string): string {
  return [
    `import { defineWorkflow, TerminateInstruction } from ${JSON.stringify(authoringEntry)};`,
    `export default defineWorkflow({`,
    `  title: ${JSON.stringify(title)},`,
    `  nodes: [`,
    `    TerminateInstruction.create({ key: 'done', config: { outcome: 'success' } }),`,
    `  ],`,
    `});`,
    '',
  ].join('\n');
}

async function createService(
  root: string,
  production: boolean,
): Promise<WorkflowService> {
  const testDatabase = await createTestDatabase();
  testDatabases.push(testDatabase);
  const { database } = testDatabase;
  databases.push(database);
  await database.builder().createCollections(
    workflowCollectionSchemas.map(({ name, define }) => ({
      name,
      definition: define,
    })),
  );
  const service = new WorkflowService({
    database,
    executor: new InlineJobExecutor(),
    services: new ServiceContainer(),
    sourceRoot: path.join(root, 'workflows'),
    distRoot: path.join(root, 'dist/workflows'),
    artifactDisk: {
      driver: 'fs',
      location: path.join(root, 'storage/private'),
      visibility: 'private',
    },
    production,
  });
  services.push(service);
  return service;
}

describe('development workflow source discovery', () => {
  it('keeps source previews addressable after form edits and pins materialized ids to their original revision', async () => {
    const { root, sourceRoot } = await application();
    const packageRoot = await writePackage(
      sourceRoot,
      'sample',
      terminatingWorkflow('Sample').replace(
        'title: ',
        "client: { inputForm: './client/form.tsx' }, title: ",
      ),
    );
    await fs.mkdir(path.join(packageRoot, 'client'));
    const form = path.join(packageRoot, 'client/form.tsx');
    await fs.writeFile(
      form,
      'export default function Form() { return "first"; }',
    );
    const service = await createService(root, false);
    const database = databases.at(-1)!;
    const repository = new WorkflowRepository(database, service);
    const first = await repository.getSource('sample');
    expect(first.id).toBeNull();
    await fs.writeFile(
      form,
      'export default function Form() { return "second"; }',
    );
    const second = await repository.getSource('sample');
    expect(second.hash).not.toBe(first.hash);
    await expect(repository.get(first.hash!)).rejects.toThrow('was not found');
    expect(await repository.sourceRevisions('sample')).toMatchObject([
      { hash: second.hash },
    ]);
    expect(await workflowStore(database).workflows.count()).toBe(0);
    const published = await repository.enable(second.hash!);
    await fs.writeFile(
      form,
      'export default function Form() { return "third"; }',
    );
    const third = await repository.getSource('sample');
    expect(third.hash).not.toBe(second.hash);
    expect(third.id).toBeNull();
    expect(await repository.get(published.id!)).toMatchObject({
      hash: second.hash,
    });
    await expect(repository.enable(first.hash!)).rejects.toThrow();
    // No in-memory old-hash mapping is needed when the development server restarts.
    const restarted = await createService(root, false);
    expect(
      await new WorkflowRepository(databases.at(-1)!, restarted).getSource(
        'sample',
      ),
    ).toMatchObject({ hash: third.hash });
    await fs.rm(packageRoot, { recursive: true });
    await expect(repository.getSource('sample')).rejects.toThrow(
      'was not found',
    );
  });

  it('retains and restores both versions of compiled forms after source deletion', async () => {
    const { root, sourceRoot } = await application();
    const packageRoot = await writePackage(
      sourceRoot,
      'sample',
      terminatingWorkflow('Sample').replace(
        'title: ',
        "client: { inputForm: './client/form.tsx', parameterForm: './client/form.tsx' }, title: ",
      ),
    );
    await fs.mkdir(path.join(packageRoot, 'client'));
    const form = path.join(packageRoot, 'client/form.tsx');
    await fs.writeFile(
      form,
      'export default function Form() { return "snapshot-one"; }',
    );
    const service = await createService(root, false);
    const database = databases.at(-1)!;
    const repository = new WorkflowRepository(database, service);
    const first = await repository.getSource('sample');
    const old = await repository.enable(first.hash!);
    await fs.writeFile(
      form,
      'export default function Form() { return "snapshot-two"; }',
    );
    const second = await repository.getSource('sample');
    const current = await repository.enable(second.hash!);
    expect(current.id).not.toBe(old.id);
    expect(current.hash).not.toBe(old.hash);
    // The revision persists the authored form paths alone; the materialized
    // form itself is addressed by that revision's Artifact hash.
    expect((await repository.get(old.id!)).client).toEqual({
      inputForm: './client/form.tsx',
      parameterForm: './client/form.tsx',
    });
    const clientDir = path.join(root, 'dist/client');
    const readForm = async (hash: string): Promise<string> => {
      const base = path.join(clientDir, 'assets/workflow-artifacts', hash);
      const manifest = JSON.parse(
        await fs.readFile(path.join(base, 'client/manifest.json'), 'utf8'),
      ) as {
        entries: Record<string, { js: string }>;
      };
      return fs.readFile(
        path.join(base, manifest.entries['workflow.inputForm'].js),
        'utf8',
      );
    };
    expect(await readForm(old.hash!)).toContain('snapshot-one');
    expect(await readForm(current.hash!)).toContain('snapshot-two');
    await fs.rm(packageRoot, { recursive: true });
    await fs.rm(clientDir, { recursive: true });
    const restarted = new WorkflowLoader({
      database,
      artifactStore: new LocalWorkflowArtifactStore({
        storeRoot: path.join(root, 'storage/private'),
      }),
      distRoot: path.join(root, 'dist/workflows'),
      clientDir,
      source: {
        root: sourceRoot,
        instructions: () => coreInstructions,
      },
    });
    await restarted.synchronizeDeploymentArtifacts();
    expect(await readForm(old.hash!)).toContain('snapshot-one');
    expect(await readForm(current.hash!)).toContain('snapshot-two');
    expect(await repository.get(old.id!)).toMatchObject({ hash: old.hash });
  });

  it('does not materialize or enable a version when its public resources cannot be published', async () => {
    const { root, sourceRoot } = await application();
    const packageRoot = await writePackage(
      sourceRoot,
      'sample',
      terminatingWorkflow('Sample').replace(
        'title: ',
        "client: { inputForm: './client/form.tsx' }, title: ",
      ),
    );
    await fs.mkdir(path.join(packageRoot, 'client'));
    await fs.writeFile(
      path.join(packageRoot, 'client/form.tsx'),
      'export default function Form() { return "form"; }',
    );
    const service = await createService(root, false);
    const repository = new WorkflowRepository(databases.at(-1)!, service);
    const candidate = await repository.getSource('sample');
    await fs.mkdir(path.join(root, 'dist'), { recursive: true });
    await fs.writeFile(path.join(root, 'dist/client'), 'not a directory');
    await expect(repository.enable(candidate.hash!)).rejects.toThrow();
    expect(await workflowStore(databases.at(-1)!).workflows.count()).toBe(0);
    await fs.rm(path.join(root, 'dist/client'));
    const enabled = await repository.enable(candidate.hash!);
    expect(enabled.id).toBeTruthy();
  });

  it('keeps a stored version usable when the current source cannot build', async () => {
    const { root, sourceRoot } = await application();
    const packageRoot = await writePackage(
      sourceRoot,
      'sample',
      terminatingWorkflow('Saved'),
    );
    const service = await createService(root, false);
    const repository = new WorkflowRepository(databases.at(-1)!, service);
    const candidate = await repository.getSource('sample');
    const saved = await repository.enable(candidate.hash!);
    await fs.writeFile(
      path.join(packageRoot, 'workflow.ts'),
      'this is not valid TypeScript',
    );
    await expect(repository.getSource('sample')).rejects.toThrow();
    await expect(repository.get(saved.id!)).resolves.toMatchObject({
      hash: saved.hash,
    });
    await expect(repository.revisions(saved.id!)).resolves.toHaveLength(1);
    await expect(repository.getParameters(saved.id!)).resolves.toMatchObject({
      id: saved.id,
    });
    await expect(service.trigger('sample', {})).resolves.toMatchObject({
      status: 'accepted',
    });
  });

  // Compiles the workflows with TypeScript, which takes most of the default timeout on a loaded CI runner.
  it(
    'matches a build that collects the same source resources',
    { timeout: 120_000 },
    async () => {
      const { root, sourceRoot } = await application();
      await writePackage(sourceRoot, 'sample', terminatingWorkflow('Sample'));
      const distRoot = path.join(root, 'dist/workflows');

      await buildApplicationWorkflows({ sourceRoot, distRoot });
      const [built] = await fs.readdir(path.join(distRoot, 'sample'));
      const [loaded] = await loadWorkflowSourcePackages(sourceRoot, {
        instructions: coreInstructions,
      });

      // Both paths collect the same source files here. A production build uses
      // compiled resources and has a different digest.
      expect(loaded.digest).toBe(built);
      expect(loaded.key).toBe('sample');
      expect(loaded.directory).toBe(
        await fs.realpath(path.join(sourceRoot, 'sample')),
      );
    },
  );

  it('treats a missing source root as an application with no workflows', async () => {
    const { sourceRoot } = await application();

    await expect(
      loadWorkflowSourcePackages(sourceRoot, {
        instructions: coreInstructions,
      }),
    ).resolves.toEqual([]);
  });

  it('reports a semantic issue instead of compiling it', async () => {
    const { sourceRoot } = await application();
    await writePackage(
      sourceRoot,
      'broken',
      [
        `import { defineWorkflow } from ${JSON.stringify(authoringEntry)};`,
        `export default defineWorkflow({`,
        `  title: 'Broken',`,
        `  nodes: [{ key: 'nope', type: 'not-an-instruction', config: {} }],`,
        `});`,
        '',
      ].join('\n'),
    );

    await expect(
      loadWorkflowSourcePackages(sourceRoot, {
        instructions: coreInstructions,
      }),
    ).rejects.toBeInstanceOf(WorkflowSourceCheckError);
  });

  it('validates against instructions a plugin registered at runtime', async () => {
    const { sourceRoot } = await application();
    await writePackage(
      sourceRoot,
      'extended',
      [
        `import { defineWorkflow } from ${JSON.stringify(authoringEntry)};`,
        `export default defineWorkflow({`,
        `  title: 'Extended',`,
        `  nodes: [{ key: 'say', type: 'echo', config: { value: 'hi' } }],`,
        `});`,
        '',
      ].join('\n'),
    );

    await expect(
      loadWorkflowSourcePackages(sourceRoot, {
        instructions: coreInstructions,
      }),
    ).rejects.toBeInstanceOf(WorkflowSourceCheckError);
    await expect(
      loadWorkflowSourcePackages(sourceRoot, {
        instructions: new Map([
          ...coreInstructions,
          [echoInstruction.type, echoInstruction],
        ]),
      }),
    ).resolves.toHaveLength(1);
  });
});

describe('development workflow loading', () => {
  it('re-evaluates typed workflows that reuse a handler type', async () => {
    const { root, sourceRoot } = await application();
    const definition = (title: string): string => `
      import { workflow, defineHandler, createRunInstruction, createConditionInstruction } from ${JSON.stringify(authoringEntry)};
      import type { run } from './server/run.js';
      const handler = defineHandler<typeof run>('./server/run');
      const flow = workflow({ key: 'sample', title: ${JSON.stringify(title)} })
        .addNode(createRunInstruction({ key: 'run' }).run(handler))
        .addNode(createConditionInstruction({ key: 'check' }).check(handler).branch({}));
      export default flow.finalize();
    `;
    const packageRoot = await writePackage(
      sourceRoot,
      'sample',
      definition('First'),
    );
    await fs.mkdir(path.join(packageRoot, 'server'));
    await fs.writeFile(
      path.join(packageRoot, 'package.json'),
      '{"type":"module"}',
    );
    await fs.writeFile(
      path.join(packageRoot, 'server/run.js'),
      'export function run() { return true; }',
    );
    const service = await createService(root, false);

    const [before] = await service.discoverArtifacts();
    expect(before.workflow.title).toBe('First');
    for (const title of ['Second revision', 'Third revision']) {
      await writePackage(sourceRoot, 'sample', definition(title));
      const [after] = await service.discoverArtifacts();
      expect(after.workflow.title).toBe(title);
      expect(after.digest).not.toBe(before.digest);
      expect(after.workflow.nodes.map((node) => node.config)).toEqual([
        { module: './server/run' },
        { module: './server/run' },
      ]);
    }
  });

  it('executes each materialized version from its own stored handler after source deletion', async () => {
    const { root, sourceRoot } = await application();
    const packageRoot = await writePackage(
      sourceRoot,
      'sample',
      `
      import { workflow, defineHandler, createRunInstruction } from ${JSON.stringify(authoringEntry)};
      import type { run } from './server/run.js';
      const flow = workflow({ key: 'sample', title: 'Snapshot' })
        .addNode(createRunInstruction({ key: 'run' }).run(defineHandler<typeof run>('./server/run')));
      export default flow.finalize();
    `,
    );
    await fs.mkdir(path.join(packageRoot, 'server'));
    await fs.writeFile(
      path.join(packageRoot, 'package.json'),
      '{"type":"module"}',
    );
    const handler = path.join(packageRoot, 'server/run.js');
    const marker = path.join(root, 'handler-loaded');
    const handlerSource = (value: string): string => `
      import { appendFileSync } from 'node:fs';
      appendFileSync(${JSON.stringify(marker)}, ${JSON.stringify(value)} + '\\n');
      export function run() { return ${JSON.stringify(value)}; }
    `;
    await fs.writeFile(handler, handlerSource('original'));
    const service = await createService(root, false);
    const database = databases.at(-1)!;
    const [first] = await service.discoverArtifacts();
    const oldId = await service.ensureArtifactMaterialized(first.digest);
    await fs.writeFile(handler, handlerSource('updated'));
    const [second] = await service.discoverArtifacts();
    const newId = await service.ensureArtifactMaterialized(second.digest);
    await expect(fs.access(marker)).rejects.toMatchObject({ code: 'ENOENT' });
    await fs.rm(packageRoot, { recursive: true });
    for (const [id, expected] of [
      [oldId!, 'original'],
      [newId!, 'updated'],
    ] as const) {
      await service.triggerRevision(
        id,
        {},
        { manually: true, eventKey: expected },
      );
      await expect
        .poll(async () => {
          const run = await findRun(database, expected);
          return (await listNodeRuns(database, String(run.id)))[0]?.result;
        })
        .toBe(expected);
      expect(await fs.readFile(marker, 'utf8')).toContain(expected);
    }
  });

  it('discovers source without a build and picks up an edit in the same process', async () => {
    const { root, sourceRoot } = await application();
    await writePackage(sourceRoot, 'sample', terminatingWorkflow('First'));
    const service = await createService(root, false);

    const before = await service.discoverArtifacts();
    expect(before).toHaveLength(1);
    expect(before[0].workflow.title).toBe('First');

    await writePackage(sourceRoot, 'sample', terminatingWorkflow('Second'));

    const after = await service.discoverArtifacts();
    expect(after[0].workflow.title).toBe('Second');
    expect(after[0].digest).not.toBe(before[0].digest);
  });

  it('persists a source revision in the Artifact store', async () => {
    const { root, sourceRoot } = await application();
    await writePackage(sourceRoot, 'sample', terminatingWorkflow('Sample'));
    const service = await createService(root, false);
    const [artifact] = await service.discoverArtifacts();

    const workflowId = await service.ensureArtifactMaterialized(
      artifact.digest,
    );

    expect(workflowId).toBeDefined();
    const rows = await databases[databases.length - 1]
      .query()
      .selectFrom(WORKFLOW_COLLECTIONS.workflows)
      .selectAll()
      .execute<Row>();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: 'sample', hash: artifact.digest });
    expect(
      await fs.readdir(path.join(root, 'storage/private/workflows/sample')),
    ).toEqual([artifact.digest]);
  });

  it('runs a materialized source snapshot', async () => {
    const { root, sourceRoot } = await application();
    await writePackage(sourceRoot, 'sample', terminatingWorkflow('Sample'));
    const service = await createService(root, false);
    const [artifact] = await service.discoverArtifacts();
    const workflowId = await service.ensureArtifactMaterialized(
      artifact.digest,
    );
    if (workflowId === undefined)
      throw new Error('Source revision was not materialized');

    await expect(
      service.triggerRevision(workflowId, {}, { manually: true }),
    ).resolves.toMatchObject({ status: 'accepted' });
  });

  it('runs the stored snapshot after the source package is removed', async () => {
    const { root, sourceRoot } = await application();
    await writePackage(sourceRoot, 'sample', terminatingWorkflow('Sample'));
    const service = await createService(root, false);
    const [artifact] = await service.discoverArtifacts();
    const workflowId = await service.ensureArtifactMaterialized(
      artifact.digest,
    );
    if (workflowId === undefined)
      throw new Error('Source revision was not materialized');
    await fs.rm(path.join(sourceRoot, 'sample'), { recursive: true });

    await expect(
      service.triggerRevision(workflowId, {}, { manually: true }),
    ).resolves.toMatchObject({ status: 'accepted' });
  });

  // Compiles the workflows with TypeScript, which takes most of the default timeout on a loaded CI runner.
  it(
    'reads built Artifacts and never the source when production',
    { timeout: 120_000 },
    async () => {
      const { root, sourceRoot } = await application();
      await writePackage(sourceRoot, 'sample', terminatingWorkflow('Source'));
      await buildApplicationWorkflows({
        sourceRoot,
        distRoot: path.join(root, 'dist/workflows'),
      });
      await writePackage(sourceRoot, 'sample', terminatingWorkflow('Edited'));
      const service = await createService(root, true);

      const discovered = await service.discoverArtifacts();

      expect(discovered).toHaveLength(1);
      expect(discovered[0].workflow.title).toBe('Source');
      expect(discovered[0].origin).toBe('dist');
    },
  );

  // Compiles the workflows with TypeScript, which takes most of the default timeout on a loaded CI runner.
  it(
    'prefers source over a stale built Artifact for the same key',
    { timeout: 120_000 },
    async () => {
      const { root, sourceRoot } = await application();
      await writePackage(sourceRoot, 'sample', terminatingWorkflow('Stale'));
      await writePackage(
        sourceRoot,
        'built-only',
        terminatingWorkflow('Built'),
      );
      await buildApplicationWorkflows({
        sourceRoot,
        distRoot: path.join(root, 'dist/workflows'),
      });
      await fs.rm(path.join(sourceRoot, 'built-only'), { recursive: true });
      await writePackage(sourceRoot, 'sample', terminatingWorkflow('Fresh'));
      const service = await createService(root, false);

      const discovered = await service.discoverArtifacts();

      expect(
        discovered.map((artifact) => [
          artifact.key,
          artifact.workflow.title,
          artifact.origin,
        ]),
      ).toEqual([
        ['built-only', 'Built', 'dist'],
        ['sample', 'Fresh', 'source'],
      ]);
    },
  );
});
