// @vitest-environment node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseManager } from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  buildWorkflowArtifact,
  writeWorkflowArtifact,
} from '../build/artifact-builder.js';
import { WorkflowService } from '../server/service.js';
import { WorkflowRepository } from '../server/repositories/workflow-repository.js';
import { WorkflowRunRepository } from '../server/repositories/workflow-run-repository.js';
import {
  workflowCollectionSchemas,
  workflowStore,
} from '../server/collections/index.js';
import { asId, asIdFilter } from '../server/engine/utils.js';
import { requireRow } from './helpers.js';
import { InlineJobExecutor } from './fixtures/inline-job-executor.js';

const roots: string[] = [];
const databases: TestDatabase[] = [];
async function createWorkflowCollections(
  database: DatabaseManager,
): Promise<void> {
  await database.builder().createCollections(
    workflowCollectionSchemas.map(({ name, define }) => ({
      name,
      definition: define,
    })),
  );
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.destroy()));
  await Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});
async function fixture(): Promise<{
  root: string;
  distRoot: string;
  storeRoot: string;
  database: DatabaseManager;
}> {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'app-workflow-startup-'),
  );
  roots.push(root);
  const testDatabase = await createTestDatabase();
  databases.push(testDatabase);
  const { database } = testDatabase;
  await createWorkflowCollections(database);
  return {
    root,
    distRoot: path.join(root, 'dist/workflows'),
    storeRoot: path.join(root, 'storage/private'),
    database,
  };
}
async function emit(
  distRoot: string,
  title: string,
  withClient = false,
): Promise<string> {
  const node = {
    key: 'run',
    title: 'Run',
    type: 'run',
    config: { module: './server/run' },
    upstreamKey: null,
    downstreamKey: null,
    branchKey: null,
  };
  const flatIr = {
    title,
    inputSchema: { type: 'object' as const },
    parameters: { label: { type: 'string' as const } },
    ...(withClient ? { client: { parameterForm: './client/form' } } : {}),
    start: 'run',
    nodes: [node],
  };
  const built = buildWorkflowArtifact({
    key: 'sample',
    flatIr,
    resourceFiles: new Map<string, string>([
      [
        'server/run.js',
        `export function run(){ return ${JSON.stringify(title)}; }`,
      ],
      ...(withClient
        ? ([
            [
              'client/form.js',
              'export default function Form() { return null; }',
            ],
            [
              'client/manifest.json',
              JSON.stringify({
                formatVersion: 1,
                hostAbi: 1,
                entries: {
                  'workflow.parameterForm': { js: 'client/form.js', css: [] },
                },
                files: ['client/form.js'],
              }),
            ],
          ] satisfies [string, string][])
        : []),
    ]),
  });
  await writeWorkflowArtifact(built, distRoot);
  return built.digest;
}
function createService(
  f: Awaited<ReturnType<typeof fixture>>,
  production: boolean = true,
) {
  return new WorkflowService({
    database: f.database,
    executor: new InlineJobExecutor(),
    services: new ServiceContainer(),
    sourceRoot: path.join(f.root, 'workflows'),
    distRoot: f.distRoot,
    artifactDisk: {
      driver: 'fs',
      location: f.storeRoot,
      visibility: 'private',
    },
    production,
  });
}
describe('application workflow Artifact lazy synchronization', () => {
  it('does not select a current revision when reading parameters or rejecting a parameter save', async () => {
    const f = await fixture();
    const digest = await emit(f.distRoot, 'parameters');
    const service = createService(f);
    const repository = new WorkflowRepository(f.database, service);
    try {
      await repository.getParameters(digest);
      await repository.getParameters(digest);
      await expect(
        repository.updateParameters(digest, { label: false }),
      ).rejects.toThrow();
      const rows = await workflowStore(f.database).workflows.findMany();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ current: null, enabled: false });
    } finally {
      await service.dispose();
    }
  });

  it('does not select a current revision for the first manual run', async () => {
    const f = await fixture();
    const digest = await emit(f.distRoot, 'manual');
    const service = createService(f);
    try {
      await new WorkflowRunRepository(f.database, service).run(
        digest,
        {},
        { eventKey: 'first-manual' },
      );
      const rows = await workflowStore(f.database).workflows.findMany();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ current: null, enabled: false });
    } finally {
      await service.dispose();
    }
  });

  it('rejects materialization until client resources are successfully published', async () => {
    const f = await fixture();
    const digest = await emit(f.distRoot, 'server-only', true);
    const assets = path.join(f.root, 'dist/client/assets');
    await fs.mkdir(assets, { recursive: true });
    // A file blocks the public artifact directory, but private storage is usable.
    await fs.writeFile(path.join(assets, 'workflow-artifacts'), 'blocked');
    const service = createService(f);
    try {
      await expect(service.synchronizeDeploymentArtifacts()).rejects.toThrow();
      await expect(
        service.ensureArtifactMaterialized(digest),
      ).rejects.toThrow();
      expect(await workflowStore(f.database).workflows.count()).toBe(0);
      await fs.rm(path.join(assets, 'workflow-artifacts'));
      const id = await service.ensureArtifactMaterialized(digest);
      expect(id).toBeDefined();
      expect(await service.ensureArtifactMaterialized(digest)).toBe(id);
      expect(
        await workflowStore(f.database).workflows.findOne({
          filter: { hash: digest },
        }),
      ).toMatchObject({ current: null, enabled: false });
      await new WorkflowRepository(f.database, service).enable(digest);
      await service.trigger('sample', {}, { eventKey: 'client-unavailable' });
      const run = await requireRow(
        workflowStore(f.database).runs.findOne({
          filter: { eventKey: 'client-unavailable' },
        }),
        'The server run',
      );
      await vi.waitFor(async () => {
        expect(
          await workflowStore(f.database).nodeRuns.findOne({
            filter: { workflowRunId: asIdFilter(asId(run.id)) },
          }),
        ).toMatchObject({ result: 'server-only' });
      });
    } finally {
      await service.dispose();
    }
  });

  it('persists startup artifacts and publishes forms before the first enable materializes a revision', async () => {
    const f = await fixture();
    const digest = await emit(f.distRoot, 'v1', true);
    const service = createService(f);
    const repository = new WorkflowRepository(f.database, service);
    const store = workflowStore(f.database);
    try {
      await service.synchronizeDeploymentArtifacts();
      await service.synchronizeDeploymentArtifacts();
      expect(await store.workflows.exists()).toBe(false);
      expect(await store.nodes.exists()).toBe(false);
      await expect(
        fs.readFile(
          path.join(f.storeRoot, 'workflows/sample', digest, 'workflow.json'),
          'utf8',
        ),
      ).resolves.toContain('v1');
      await expect(
        fs.readFile(
          path.join(
            f.root,
            'dist/client/assets/workflow-artifacts',
            digest,
            'client/form.js',
          ),
          'utf8',
        ),
      ).resolves.toContain('export default');
      expect((await repository.list()).data).toEqual([
        expect.objectContaining({ id: null, hash: digest, enabled: false }),
      ]);

      await repository.enable(digest);
      await repository.enable(digest);
      expect(await store.workflows.findMany()).toHaveLength(1);
      expect(await store.nodes.findMany()).toHaveLength(1);
      expect(
        await store.workflows.findOne({ filter: { hash: digest } }),
      ).toMatchObject({
        current: true,
        enabled: true,
      });
    } finally {
      await service.dispose();
    }
  });

  it('keeps a deployed new version unmaterialized and restores the enabled historical client on restart', async () => {
    const f = await fixture();
    const v1 = await emit(f.distRoot, 'v1', true);
    const first = createService(f);
    try {
      await new WorkflowRepository(f.database, first).enable(v1);
    } finally {
      await first.dispose();
    }
    const clientRoot = path.join(
      f.root,
      'dist/client/assets/workflow-artifacts',
    );
    await fs.rm(clientRoot, { recursive: true, force: true });
    const v2 = await emit(f.distRoot, 'v2', true);
    const upgraded = createService(f);
    try {
      await upgraded.synchronizeDeploymentArtifacts();
      const rows = await workflowStore(f.database).workflows.findMany();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ hash: v1, current: true, enabled: true });
      for (const digest of [v1, v2]) {
        await expect(
          fs.readFile(path.join(clientRoot, digest, 'client/form.js'), 'utf8'),
        ).resolves.toContain('export default');
      }
      await expect(
        fs.readFile(
          path.join(f.storeRoot, 'workflows/sample', v2, 'workflow.json'),
          'utf8',
        ),
      ).resolves.toContain('v2');
    } finally {
      await upgraded.dispose();
    }
  });

  it('names the way out when the enabled hash is absent from the build', async () => {
    const f = await fixture();
    const v1 = await emit(f.distRoot, 'v1');
    const service = createService(f);
    const repository = new WorkflowRepository(f.database, service);
    await repository.enable(v1);
    // A database carried over from an earlier build points at a hash this
    // build never produced, so neither dist nor the Artifact store has it.
    const stale = 'f'.repeat(64);
    await workflowStore(f.database).workflows.updateMany({
      filter: { key: 'sample' },
      values: { hash: stale },
    });
    try {
      await expect(service.trigger('sample', {})).rejects.toThrow(
        new RegExp(
          `Workflow Artifact sample/${stale} is missing from this build.*Enable new version.*POST /api/workflows/<hash>/enable`,
        ),
      );
    } finally {
      await service.dispose();
    }
  });

  it('uses stored resources even when development source has different handlers', async () => {
    const f = await fixture();
    const digest = await emit(f.distRoot, 'artifact');
    const sourcePackage = path.join(f.root, 'workflows/sample/server');
    await fs.mkdir(sourcePackage, { recursive: true });
    await fs.writeFile(
      path.join(sourcePackage, 'run.ts'),
      'export function run() { return "source"; }',
    );
    const service = createService(f, false);
    const repository = new WorkflowRepository(f.database, service);
    await repository.enable(digest);

    await service.trigger('sample', {}, { eventKey: 'development-source' });

    const run = await requireRow(
      workflowStore(f.database).runs.findOne({
        filter: { eventKey: 'development-source' },
        select: (select) => select.fields('id'),
      }),
      'The development-source run',
    );
    const nodeRun = await vi.waitFor(async () => {
      const row = await requireRow(
        workflowStore(f.database).nodeRuns.findOne({
          filter: { workflowRunId: asIdFilter(asId(run.id)) },
          select: (select) => select.fields('result'),
        }),
        'Its node run',
      );
      expect(row.result).not.toBeNull();
      return row;
    });
    expect(nodeRun.result).toBe('artifact');
    await service.dispose();
  });

  it('materializes parameter settings as the first disabled current revision', async () => {
    const f = await fixture();
    const hash = await emit(f.distRoot, 'parameters');
    const service = createService(f);
    const repository = new WorkflowRepository(f.database, service);

    await expect(
      repository.updateParameters(hash, { label: 'configured' }),
    ).resolves.toMatchObject({ values: { label: 'configured' } });

    const revision = await requireRow(
      workflowStore(f.database).workflows.findOne({
        filter: { key: 'sample' },
      }),
      'The materialized revision',
    );
    expect(revision).toMatchObject({
      hash,
      version: 'version-1',
      current: true,
      enabled: false,
    });
    expect(revision.parameterValues).toEqual({
      label: 'configured',
    });
    await expect(repository.get(hash)).resolves.toMatchObject({
      id: String(revision.id),
      parameterValues: { label: 'configured' },
    });
    await service.dispose();
  });

  it('materializes revisions on demand without changing the current revision', async () => {
    const f = await fixture();
    const v1 = await emit(f.distRoot, 'v1');
    const firstService = createService(f);
    const firstRepository = new WorkflowRepository(f.database, firstService);
    const discovered = await firstRepository.list();
    expect(discovered.data).toEqual([
      expect.objectContaining({
        id: null,
        key: 'sample',
        enabled: false,
        hash: v1,
      }),
    ]);
    expect(await workflowStore(f.database).workflows.exists()).toBe(false);
    await firstRepository.enable(v1);
    const first = await requireRow(
      workflowStore(f.database).workflows.findOne({
        filter: { key: 'sample' },
      }),
      'The first revision',
    );
    expect(first.hash).toBe(v1);
    expect(Boolean(first.enabled)).toBe(true);
    expect(
      await fs.readdir(path.join(f.storeRoot, 'workflows/sample', v1)),
    ).toEqual(expect.arrayContaining(['workflow.json', 'server']));
    await fs.rm(path.join(f.storeRoot, 'workflows/sample', v1), {
      recursive: true,
    });
    const firstRuns = new WorkflowRunRepository(f.database, firstService);
    await expect(
      firstRuns.run(first.id as string, {}, { eventKey: 'recovered-run' }),
    ).resolves.toMatchObject({ eventKey: 'recovered-run' });
    await expect(
      fs.readdir(path.join(f.storeRoot, 'workflows/sample', v1)),
    ).resolves.toEqual(expect.arrayContaining(['workflow.json', 'server']));
    await firstRepository.setStatus(first.id as string, false);
    await expect(firstRepository.enable(v1)).resolves.toMatchObject({
      id: String(first.id),
      enabled: true,
      hash: v1,
    });
    await firstRepository.setStatus(first.id as string, false);
    await expect(
      firstRepository.enable(first.id as string),
    ).resolves.toMatchObject({ id: String(first.id), enabled: true, hash: v1 });
    await firstService.trigger('sample', {}, { eventKey: 'artifact-run' });
    const run = await requireRow(
      workflowStore(f.database).runs.findOne({
        filter: { eventKey: 'artifact-run' },
      }),
      'The artifact-run run',
    );
    expect(run.hash).toBe(v1);
    const nodeRun = await vi.waitFor(async () => {
      const row = await requireRow(
        workflowStore(f.database).nodeRuns.findOne({
          filter: { workflowRunId: asIdFilter(asId(run.id)) },
          select: (select) => select.fields('result'),
        }),
        'Its node run',
      );
      expect(row.result).not.toBeNull();
      return row;
    });
    expect(nodeRun.result).toBe('v1');
    await firstService.dispose();

    const v2 = await emit(f.distRoot, 'v2');
    const upgradeService = createService(f);
    const upgradeRepository = new WorkflowRunRepository(
      f.database,
      upgradeService,
    );
    await upgradeService.trigger('sample', {}, { eventKey: 'artifact-v2' });
    const automatic = await requireRow(
      workflowStore(f.database).runs.findOne({
        filter: { eventKey: 'artifact-v2' },
      }),
      'The artifact-v2 run',
    );
    expect(automatic.hash).toBe(v1);
    expect(
      await workflowStore(f.database).workflows.findMany({
        filter: { key: 'sample' },
      }),
    ).toHaveLength(1);

    const manual = await upgradeRepository.run(
      v2,
      {},
      {
        eventKey: 'manual-v2',
      },
    );
    // Saving another revision's parameters must preserve the enabled current version.
    await new WorkflowRepository(f.database, upgradeService).updateParameters(
      v2,
      { label: 'next-version' },
    );
    const revisions = await workflowStore(f.database).workflows.findMany({
      filter: { key: 'sample' },
      sort: (sort) => sort.field('id').asc(),
    });
    expect(revisions).toHaveLength(2);
    expect(revisions[0].hash).toBe(v1);
    expect(Boolean(revisions[0].enabled)).toBe(true);
    expect(Boolean(revisions[0].current)).toBe(true);
    expect(revisions[1].hash).toBe(v2);
    expect(Boolean(revisions[1].enabled)).toBe(false);
    expect(Boolean(revisions[1].current)).toBe(false);
    expect(revisions[1].parameterValues).toEqual({ label: 'next-version' });
    expect(manual).toMatchObject({
      workflowId: String(revisions[1].id),
      workflowVersion: 'version-2',
      eventKey: 'manual-v2',
    });
    const manualRow = await requireRow(
      workflowStore(f.database).runs.findOne({
        filter: { eventKey: 'manual-v2' },
      }),
      'The manual-v2 run',
    );
    expect(Boolean(manualRow.manually)).toBe(true);
    expect(manualRow.hash).toBe(v2);
    await upgradeService.dispose();
  });
  it('does not inspect deployment for an unknown trigger and validates deployment only on discovery', async () => {
    const f = await fixture();
    const missing = createService(f);
    const missingRepository = new WorkflowRepository(f.database, missing);
    await expect(missing.trigger('sample', {})).resolves.toEqual({
      status: 'skipped',
      reason: 'not-found',
    });
    await expect(missingRepository.list()).resolves.toMatchObject({ data: [] });
    await missing.dispose();

    const digest = await emit(f.distRoot, 'bad');
    await fs.writeFile(
      path.join(f.distRoot, 'sample', digest, 'workflow.json'),
      '{}',
    );
    const tampered = createService(f);
    const tamperedRepository = new WorkflowRepository(f.database, tampered);
    await expect(tamperedRepository.list()).rejects.toThrow(
      /invalid workflow.json/,
    );
    await tampered.dispose();

    await fs.mkdir(path.join(f.distRoot, 'sample', 'a'.repeat(64)), {
      recursive: true,
    });
    const multiple = createService(f);
    const multipleRepository = new WorkflowRepository(f.database, multiple);
    await expect(multipleRepository.list()).rejects.toThrow(
      /exactly one digest/,
    );
    await multiple.dispose();
  });
});
