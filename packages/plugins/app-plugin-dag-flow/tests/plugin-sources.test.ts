// @vitest-environment node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { ServiceContainer } from '@nocobase/service-provider';

import {
  buildWorkflowArtifact,
  writeWorkflowArtifact,
} from '../build/artifact-builder.js';
import { workflowCollectionSchemas } from '../server/collections/index.js';
import { WorkflowService } from '../server/service.js';
import {
  pluginWorkflowSources,
  WorkflowSourceList,
  type WorkflowSourceContribution,
} from '../server/sources.js';
import { InlineJobExecutor } from './fixtures/inline-job-executor.js';

const authoringEntry = fileURLToPath(new URL('../index.ts', import.meta.url));
const roots: string[] = [];
const testDatabases: TestDatabase[] = [];
const services: WorkflowService[] = [];

afterEach(async () => {
  await Promise.all(services.splice(0).map((service) => service.dispose()));
  await Promise.all(
    testDatabases.splice(0).map((testDatabase) => testDatabase.destroy()),
  );
  await Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

async function temporaryRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-plugin-'));
  roots.push(root);
  return root;
}

async function writeSource(
  sourceRoot: string,
  key: string,
  title: string,
): Promise<void> {
  const packageRoot = path.join(sourceRoot, key);
  await fs.mkdir(packageRoot, { recursive: true });
  await fs.writeFile(
    path.join(packageRoot, 'workflow.ts'),
    [
      `import { defineWorkflow, TerminateInstruction } from ${JSON.stringify(authoringEntry)};`,
      `export default defineWorkflow({`,
      `  title: ${JSON.stringify(title)},`,
      `  nodes: [TerminateInstruction.create({ key: 'done', config: { outcome: 'success' } })],`,
      `});`,
      '',
    ].join('\n'),
  );
}

async function writeArtifact(
  distRoot: string,
  key: string,
  title: string,
): Promise<string> {
  const built = buildWorkflowArtifact({
    key,
    flatIr: {
      title,
      inputSchema: { type: 'object' },
      start: 'run',
      nodes: [
        {
          key: 'run',
          title: 'Run',
          type: 'run',
          config: { module: './server/run' },
          upstreamKey: null,
          downstreamKey: null,
          branchKey: null,
        },
      ],
    },
    resourceFiles: new Map([
      ['server/run.js', 'export function run() { return null; }'],
    ]),
  });
  await writeWorkflowArtifact(built, distRoot);
  return built.digest;
}

async function createService(
  root: string,
  production: boolean,
  sources: readonly WorkflowSourceContribution[],
): Promise<WorkflowService> {
  const testDatabase = await createTestDatabase();
  testDatabases.push(testDatabase);
  await testDatabase.database.builder().createCollections(
    workflowCollectionSchemas.map(({ name, define }) => ({
      name,
      definition: define,
    })),
  );
  const service = new WorkflowService({
    database: testDatabase.database,
    executor: new InlineJobExecutor(),
    services: new ServiceContainer(),
    sourceRoot: path.join(root, 'workflows'),
    distRoot: path.join(root, 'dist/workflows'),
    sources: () => sources,
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

describe('workflows contributed by plugins', () => {
  it('discovers a plugin source next to the application in development', async () => {
    const root = await temporaryRoot();
    const plugin = path.join(root, 'plugin');
    await writeSource(path.join(root, 'workflows'), 'own', 'Own');
    await writeSource(path.join(plugin, 'workflows'), 'shipped', 'Shipped');
    const service = await createService(root, false, [
      pluginWorkflowSources({ owner: '@acme/plugin', baseDir: plugin }),
    ]);

    const artifacts = await service.discoverArtifacts();

    expect(artifacts.map((artifact) => artifact.key)).toEqual([
      'own',
      'shipped',
    ]);
    expect(
      artifacts.find((artifact) => artifact.key === 'shipped'),
    ).toMatchObject({ origin: 'source', workflow: { title: 'Shipped' } });
  });

  it('reads only built Artifacts of a plugin in production', async () => {
    const root = await temporaryRoot();
    const plugin = path.join(root, 'plugin');
    await writeSource(path.join(plugin, 'workflows'), 'shipped', 'Source');
    const digest = await writeArtifact(
      path.join(plugin, 'dist/workflows'),
      'shipped',
      'Built',
    );
    const service = await createService(root, true, [
      pluginWorkflowSources({ owner: '@acme/plugin', baseDir: plugin }),
    ]);

    expect(await service.discoverArtifacts()).toMatchObject([
      { key: 'shipped', digest, workflow: { title: 'Built' } },
    ]);
    await expect(
      service.ensureArtifactMaterialized(digest),
    ).resolves.toBeDefined();
  });

  it('refuses a workflow key both the application and a plugin offer', async () => {
    const root = await temporaryRoot();
    const plugin = path.join(root, 'plugin');
    await writeArtifact(path.join(root, 'dist/workflows'), 'shared', 'Own');
    await writeArtifact(
      path.join(plugin, 'dist/workflows'),
      'shared',
      'Shipped',
    );
    const service = await createService(root, true, [
      pluginWorkflowSources({ owner: '@acme/plugin', baseDir: plugin }),
    ]);

    await expect(service.discoverArtifacts()).rejects.toThrow(
      'Workflow "shared" is offered by both the application and @acme/plugin',
    );
  });

  it('refuses a key two plugin sources offer in development', async () => {
    const root = await temporaryRoot();
    for (const name of ['first', 'second'])
      await writeSource(
        path.join(root, name, 'workflows'),
        'shared',
        `From ${name}`,
      );
    const service = await createService(root, false, [
      pluginWorkflowSources({
        owner: '@acme/first',
        baseDir: path.join(root, 'first'),
      }),
      pluginWorkflowSources({
        owner: '@acme/second',
        baseDir: path.join(root, 'second'),
      }),
    ]);

    await expect(service.discoverArtifacts()).rejects.toThrow(
      'offered by both @acme/first and @acme/second',
    );
  });
});

describe('pluginWorkflowSources', () => {
  it('offers sources from a checkout and Artifacts below its dist directory', () => {
    expect(
      pluginWorkflowSources({
        owner: '@acme/plugin',
        baseDir: '/packages/plugin',
        directory: 'flows',
      }),
    ).toEqual({
      owner: '@acme/plugin',
      sourceRoot: path.join('/packages/plugin', 'flows'),
      distRoot: path.join('/packages/plugin', 'dist', 'flows'),
    });
  });

  it('offers only Artifacts when the plugin runs from its dist directory', () => {
    expect(
      pluginWorkflowSources({
        owner: '@acme/plugin',
        baseDir: '/node_modules/@acme/plugin/dist',
      }),
    ).toEqual({
      owner: '@acme/plugin',
      distRoot: path.join('/node_modules/@acme/plugin/dist', 'workflows'),
    });
  });
});

describe('WorkflowSourceList', () => {
  it('refuses a second registration from the same package', () => {
    const list = new WorkflowSourceList();
    list.add({ owner: '@acme/plugin', distRoot: '/a' });

    expect(() => list.add({ owner: '@acme/plugin', distRoot: '/b' })).toThrow(
      'already registered',
    );
    expect(list.list()).toEqual([{ owner: '@acme/plugin', distRoot: '/a' }]);
  });
});
