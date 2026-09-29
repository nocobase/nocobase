import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import { createQueueManager, createSyncQueueConfig } from '@nocobase/queue';
import { buildApplicationWorkflows } from '../build/index.js';
import { WorkflowService } from '../server/service.js';
import { WorkflowRepository } from '../server/repositories/workflow-repository.js';
import { createTestDatabase, findRun, listNodeRuns } from './helpers.js';

it('builds, materializes and executes context handlers without argument mappings or result schemas', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-context-'));
  const database = await createTestDatabase();
  const queue = createQueueManager(createSyncQueueConfig());
  let service: WorkflowService | undefined;
  try {
    const sourceRoot = fileURLToPath(
      new URL('./fixtures/context-workflows', import.meta.url),
    );
    const resourceRoot = path.join(root, 'compiled');
    // Emit the actual fixture handlers; do not substitute synthetic runtime modules.
    for (const relative of [
      'workflow',
      'server/calculate',
      'server/check',
      'server/record',
    ]) {
      const source = await fs.readFile(
        path.join(sourceRoot, 'calculation', `${relative}.ts`),
        'utf8',
      );
      const target = path.join(resourceRoot, 'calculation', `${relative}.js`);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(
        target,
        ts.transpileModule(source, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      );
    }
    const distRoot = path.join(root, 'dist/workflows');
    const built = await buildApplicationWorkflows({
      sourceRoot,
      resourceRoot,
      distRoot,
    });
    const artifact = JSON.parse(
      await fs.readFile(path.join(built.artifacts[0], 'workflow.json'), 'utf8'),
    ) as {
      nodes: Array<{
        type: string;
        config: Record<string, unknown>;
        result?: unknown;
      }>;
    };
    for (const node of artifact.nodes.filter((node) => node.type === 'run')) {
      expect(Object.keys(node.config)).toEqual(['module']);
      expect(node).not.toHaveProperty('result');
    }
    service = new WorkflowService({
      database,
      queue,
      services: new ServiceContainer(),
      distRoot,
      artifactDisk: {
        driver: 'fs',
        location: path.join(root, 'store'),
        visibility: 'private',
      },
      production: true,
    });
    const repository = new WorkflowRepository(database, service);
    await repository.enable(path.basename(built.artifacts[0]));
    await repository.updateParameters(path.basename(built.artifacts[0]), {
      rate: 3,
      limit: 10,
    });
    await service.trigger(
      'calculation',
      { amount: 5 },
      { eventKey: 'context-yes' },
    );
    await expect
      .poll(async () => {
        const run = await findRun(database, 'context-yes');
        return (await listNodeRuns(database, String(run.id))).find(
          (node) => node.nodeKey === 'record',
        )?.result;
      })
      .toEqual({ total: 15, matched: true, snapshots: true });
    await service.trigger(
      'calculation',
      { amount: 1 },
      { eventKey: 'context-no' },
    );
    await expect
      .poll(async () => {
        const run = await findRun(database, 'context-no');
        return (await listNodeRuns(database, String(run.id))).map(
          (node) => node.nodeKey,
        );
      })
      .toEqual(['calculate', 'check', 'stop']);
  } finally {
    await service?.dispose();
    await queue.close();
    await database.destroy();
    await fs.rm(root, { recursive: true, force: true });
  }
}, 30_000);
