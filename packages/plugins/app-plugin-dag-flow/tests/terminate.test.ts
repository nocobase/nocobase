import type { DatabaseManager } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  EXECUTION_STATUS,
  NODE_RUN_STATUS,
} from '../server/engine/constants.js';
import Dispatcher from '../server/engine/dispatcher.js';
import { createWorkflowRunServices } from '../server/engine/run-services.js';
import type { WorkflowInstructionClass } from '../server/instructions/base.js';
import {
  coreInstructions,
  TerminateInstruction,
  validateTerminateConfig,
} from '../server/instructions/index.js';
import { defineTestInstruction } from './fixtures/instructions.js';
import {
  constantCondition,
  createModuleRoot,
  createWorkflowTestDatabase,
  createTestWorkflow,
  findRun,
  listNodeRuns,
  removeModuleRoots,
} from './helpers.js';

const echo: WorkflowInstructionClass = defineTestInstruction(
  'echo',
  async (instruction) => ({
    status: NODE_RUN_STATUS.RESOLVED,
    result: instruction.node.config.value ?? instruction.node.key,
  }),
);
const customTerminator: WorkflowInstructionClass = defineTestInstruction(
  'custom-terminator',
  async () => ({
    status: NODE_RUN_STATUS.RESOLVED,
    result: { source: 'custom' },
    terminated: true,
  }),
);

const instructions = new Map<string, WorkflowInstructionClass>([
  ...coreInstructions,
  ['custom-terminator', customTerminator],
  ['echo', echo],
]);

const CONDITION_MODULES: Readonly<Record<string, string>> = {
  './always-true': constantCondition(true),
  './always-false': constantCondition(false),
};
const services = createWorkflowRunServices(new ServiceContainer());
let moduleRoot = '';

function createDispatcher(database: DatabaseManager): Dispatcher {
  return new Dispatcher({
    database,
    instructions,
    services,
    resolveWorkflowResourceRoot: async (): Promise<string> => moduleRoot,
  });
}

describe('terminate instruction', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;

  beforeEach(async () => {
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
    moduleRoot = await createModuleRoot(CONDITION_MODULES);
  });

  afterEach(async () => {
    await testDatabase.destroy();
    await removeModuleRoots();
  });

  it('terminates a resolved workflow without running its downstream node', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'resolved-terminate',
      nodes: [
        { key: 'stop', type: 'terminate', downstreamKey: 'after' },
        {
          key: 'after',
          type: 'echo',
          config: { value: 'should-not-run' },
          upstreamKey: 'stop',
        },
      ],
    });

    await createDispatcher(database).trigger(
      workflow,
      {},
      { eventKey: 'resolved-terminate', manually: true },
    );

    const run = await findRun(database, 'resolved-terminate');
    expect(run.status).toBe(EXECUTION_STATUS.RESOLVED);
    expect(await listNodeRuns(database, run.id as number)).toEqual([
      { nodeKey: 'stop', status: NODE_RUN_STATUS.RESOLVED, result: null },
    ]);
  });

  it('can finish a workflow as failed', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'failed-terminate',
      nodes: [
        {
          key: 'stop',
          type: 'terminate',
          config: { outcome: 'failure' },
        },
      ],
    });

    await createDispatcher(database).trigger(
      workflow,
      {},
      { eventKey: 'failed-terminate', manually: true },
    );

    const run = await findRun(database, 'failed-terminate');
    expect(run.status).toBe(EXECUTION_STATUS.FAILED);
    expect(await listNodeRuns(database, run.id as number)).toEqual([
      { nodeKey: 'stop', status: NODE_RUN_STATUS.FAILED, result: null },
    ]);
  });

  it('honors terminated results from other instruction types', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'custom-terminator',
      nodes: [
        {
          key: 'customStop',
          type: 'custom-terminator',
          downstreamKey: 'after',
        },
        {
          key: 'after',
          type: 'echo',
          config: { value: 'should-not-run' },
          upstreamKey: 'customStop',
        },
      ],
    });

    await createDispatcher(database).trigger(
      workflow,
      {},
      { eventKey: 'custom-terminator', manually: true },
    );

    const run = await findRun(database, 'custom-terminator');
    expect(run.status).toBe(EXECUTION_STATUS.RESOLVED);
    expect(await listNodeRuns(database, run.id as number)).toEqual([
      {
        nodeKey: 'customStop',
        status: NODE_RUN_STATUS.RESOLVED,
        result: { source: 'custom' },
      },
    ]);
  });

  it('terminates from a condition branch without recalling the condition or running the common successor', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'branch-terminate',
      nodes: [
        {
          key: 'check',
          type: 'condition',
          config: { module: './always-false' },
          downstreamKey: 'after',
        },
        {
          key: 'stop',
          type: 'terminate',
          upstreamKey: 'check',
          branchKey: 'no',
        },
        {
          key: 'after',
          type: 'echo',
          config: { value: 'should-not-run' },
          upstreamKey: 'check',
        },
      ],
    });

    await createDispatcher(database).trigger(
      workflow,
      {},
      { eventKey: 'branch-terminate', manually: true },
    );

    const run = await findRun(database, 'branch-terminate');
    expect(run.status).toBe(EXECUTION_STATUS.RESOLVED);
    expect(await listNodeRuns(database, run.id as number)).toEqual([
      { nodeKey: 'check', status: NODE_RUN_STATUS.RESOLVED, result: false },
      { nodeKey: 'stop', status: NODE_RUN_STATUS.RESOLVED, result: null },
    ]);
  });

  it.each(['success', 'failure'] as const)(
    'preserves nested condition results when terminating with %s',
    async (outcome) => {
      const workflow = await createTestWorkflow(database, {
        key: 'nested-terminate',
        nodes: [
          {
            key: 'outer',
            type: 'condition',
            config: { module: './always-true' },
            downstreamKey: 'afterOuter',
          },
          {
            key: 'inner',
            type: 'condition',
            config: { module: './always-true' },
            upstreamKey: 'outer',
            branchKey: 'yes',
            downstreamKey: 'afterInner',
          },
          {
            key: 'stop',
            type: 'terminate',
            config: { outcome },
            upstreamKey: 'inner',
            branchKey: 'yes',
            downstreamKey: 'afterStop',
          },
          { key: 'afterStop', type: 'echo', upstreamKey: 'stop' },
          { key: 'afterInner', type: 'echo', upstreamKey: 'inner' },
          { key: 'afterOuter', type: 'echo', upstreamKey: 'outer' },
        ],
      });
      await createDispatcher(database).trigger(
        workflow,
        {},
        { eventKey: outcome, manually: true },
      );
      const run = await findRun(database, outcome);
      const status =
        outcome === 'success'
          ? NODE_RUN_STATUS.RESOLVED
          : NODE_RUN_STATUS.FAILED;
      expect(run.status).toBe(
        outcome === 'success'
          ? EXECUTION_STATUS.RESOLVED
          : EXECUTION_STATUS.FAILED,
      );
      expect(await listNodeRuns(database, run.id as number)).toEqual([
        { nodeKey: 'outer', status: NODE_RUN_STATUS.RESOLVED, result: true },
        { nodeKey: 'inner', status: NODE_RUN_STATUS.RESOLVED, result: true },
        { nodeKey: 'stop', status, result: null },
      ]);
    },
  );

  it('exposes a typed DSL expression and validates config', () => {
    expect(
      TerminateInstruction.create({ key: 'stop', config: {} }),
    ).toMatchObject({
      key: 'stop',
      type: 'terminate',
      config: {},
    });
    expect(validateTerminateConfig({})).toEqual([]);
    expect(validateTerminateConfig({ outcome: 'success' })).toEqual([]);
    expect(validateTerminateConfig({ outcome: 'failure' })).toEqual([]);
    expect(
      validateTerminateConfig({ outcome: 'unknown', extra: true }),
    ).toEqual([
      {
        path: 'config.extra',
        message: 'terminate config does not accept field "extra"',
      },
      {
        path: 'config.outcome',
        message: 'terminate config outcome must be "success" or "failure"',
      },
    ]);
  });
});
