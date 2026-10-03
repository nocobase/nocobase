import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { expect, it } from 'vitest';
import { createLogging, readJournal } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';
import Dispatcher from '../server/engine/dispatcher.js';
import { createWorkflowLogger } from '../server/engine/logger.js';
import { createWorkflowRunServices } from '../server/engine/run-services.js';
import { RunInstruction } from '../server/instructions/run/instruction.js';
import {
  createWorkflowTestDatabase,
  createTestWorkflow,
  findRun,
  testStore,
} from './helpers.js';

it('persists run-module logs and errors with execution identities without copying diagnostics into node records', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'workflow-logging-'));
  const testDatabase = await createWorkflowTestDatabase();
  const { database } = testDatabase;
  const logging = createLogging({
    file: { directory: path.join(root, 'logs') },
    console: { enabled: false },
  });
  try {
    await mkdir(path.join(root, 'server'));
    await writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    await writeFile(
      path.join(root, 'server', 'run.js'),
      `export function run(args, { logger }) { logger.info('Node diagnostic', { secret: 'hidden-value' }); throw new Error('Node failure'); }`,
    );
    const workflow = await createTestWorkflow(database, {
      key: 'log-test',
      nodes: [{ key: 'node', type: 'run', config: { module: './server/run' } }],
    });
    const dispatcher = new Dispatcher({
      database,
      instructions: new Map([['run', RunInstruction]]),
      resolveWorkflowResourceRoot: () => Promise.resolve(root),
      services: createWorkflowRunServices(new ServiceContainer()),
      logger: createWorkflowLogger(logging.getLogger('workflow')),
    });
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'logged-run', manually: true },
    );
    await dispatcher.drain();
    await logging.close();
    const execution = await findRun(database, 'logged-run');
    const records = await readJournal(path.join(root, 'logs'), {
      fromStart: true,
    });
    expect(
      records.entries.find((entry) => entry.msg === 'Node diagnostic'),
    ).toMatchObject({
      logger: 'workflow',
      workflowId: workflow.id,
      executionId: execution.id,
      nodeKey: 'node',
      secret: '[REDACTED]',
    });
    expect(JSON.stringify(records.entries)).toContain('Node failure');
    expect(JSON.stringify(records.entries)).toContain('stack');
    expect(JSON.stringify(records.entries)).not.toContain('hidden-value');
    const nodes = await testStore(database).nodeRuns.findMany({});
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.log).toBeNull();
  } finally {
    await logging.close();
    await testDatabase.destroy();
    await rm(root, { recursive: true, force: true });
  }
});
