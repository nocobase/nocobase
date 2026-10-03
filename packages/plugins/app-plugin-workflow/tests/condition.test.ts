import type { DatabaseManager } from '@nocobase/db';
import type { TestDatabase } from '@nocobase/db-testing';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  EXECUTION_STATUS,
  NODE_RUN_STATUS,
} from '../server/engine/constants.js';
import Dispatcher from '../server/engine/dispatcher.js';
import { createWorkflowRunServices } from '../server/engine/run-services.js';
import Processor from '../server/engine/processor.js';
import type { WorkflowInstructionClass } from '../server/instructions/base.js';
import {
  ConditionInstruction,
  validateConditionConfig,
} from '../server/instructions/condition/instruction.js';
import {
  coreInstructions,
  RunInstruction,
} from '../server/instructions/index.js';
import {
  createConditionInstruction,
  createRunInstruction,
  defineHandler,
  nodeDraft,
} from '../dsl/index.js';
import {
  defineTestInstruction,
  pendingInstruction,
} from './fixtures/instructions.js';
import {
  constantCondition,
  createModuleRoot,
  createWorkflowTestDatabase,
  createTestWorkflow,
  findRun,
  inputGreaterThan,
  listNodeRuns,
  readRun,
  removeModuleRoots,
  type TestNodeInput,
} from './helpers.js';

const echo: WorkflowInstructionClass = defineTestInstruction(
  'echo',
  async (instruction) => ({
    status: NODE_RUN_STATUS.RESOLVED,
    result: instruction.node.config.value ?? instruction.node.key,
  }),
);

const failing: WorkflowInstructionClass = defineTestInstruction(
  'failing',
  async () => ({
    status: NODE_RUN_STATUS.FAILED,
    result: 'rejected',
  }),
);

const instructions = new Map<string, WorkflowInstructionClass>([
  ...coreInstructions,
  ['echo', echo],
  ['failing', failing],
  ['pending', pendingInstruction],
]);

/**
 * Condition handlers the tests below branch on.
 *
 * A condition runs a module from the workflow's resource root, so these are
 * written to a temporary package and the dispatcher is pointed at it.
 */
const CONDITION_MODULES: Readonly<Record<string, string>> = {
  './always-true': constantCondition(true),
  './amount-over-100': inputGreaterThan('amount', 100),
  './amount-over-1000': inputGreaterThan('amount', 1000),
  './seed-is-42':
    'export async function run({ input, parameters, nodeResults }) {\n' +
    "  if (Object.keys(arguments[0]).join(',') !== 'input,parameters,nodeResults')\n" +
    "    throw new Error('condition bindings expose more than the run data');\n" +
    '  void input;\n  void parameters;\n' +
    '  return nodeResults.seed === 42;\n}\n',
  './returns-a-number':
    'export async function run({ input }) { return input.amount; }\n',
};

let moduleRoot = '';

const services = createWorkflowRunServices(new ServiceContainer());

function createDispatcher(database: DatabaseManager): Dispatcher {
  return new Dispatcher({
    database,
    instructions,
    services,
    resolveWorkflowResourceRoot: async (): Promise<string> => moduleRoot,
  });
}

describe('condition instruction', () => {
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

  it('enters the yes branch and returns to the common successor', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'single-branch',
      nodes: [
        {
          key: 'check',
          type: 'condition',
          config: { module: './amount-over-100' },
          downstreamKey: 'after',
        },
        {
          key: 'onYes',
          type: 'echo',
          config: { value: 'yes-branch' },
          upstreamKey: 'check',
          branchKey: 'yes',
        },
        {
          key: 'after',
          type: 'echo',
          config: { value: 'after' },
          upstreamKey: 'check',
        },
      ],
    });

    const dispatcher = createDispatcher(database);
    await dispatcher.trigger(
      workflow,
      { amount: 500 },
      { eventKey: 'yes', manually: true },
    );

    const run = await findRun(database, 'yes');
    expect(run.status).toBe(EXECUTION_STATUS.RESOLVED);
    expect(await listNodeRuns(database, run.id as number)).toEqual([
      { nodeKey: 'check', status: NODE_RUN_STATUS.RESOLVED, result: true },
      {
        nodeKey: 'onYes',
        status: NODE_RUN_STATUS.RESOLVED,
        result: 'yes-branch',
      },
      { nodeKey: 'after', status: NODE_RUN_STATUS.RESOLVED, result: 'after' },
    ]);
  });

  it('falls through to the downstream node when the matching branch is not declared', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'missing-branch',
      nodes: [
        {
          key: 'check',
          type: 'condition',
          config: { module: './amount-over-100' },
          downstreamKey: 'after',
        },
        { key: 'onYes', type: 'echo', upstreamKey: 'check', branchKey: 'yes' },
        {
          key: 'after',
          type: 'echo',
          config: { value: 'after' },
          upstreamKey: 'check',
        },
      ],
    });

    const dispatcher = createDispatcher(database);
    await dispatcher.trigger(
      workflow,
      { amount: 1 },
      { eventKey: 'no', manually: true },
    );

    const run = await findRun(database, 'no');
    expect(run.status).toBe(EXECUTION_STATUS.RESOLVED);
    expect(await listNodeRuns(database, run.id as number)).toEqual([
      { nodeKey: 'check', status: NODE_RUN_STATUS.RESOLVED, result: false },
      { nodeKey: 'after', status: NODE_RUN_STATUS.RESOLVED, result: 'after' },
    ]);
  });

  it('picks the no branch when it is declared', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'both-branches',
      nodes: [
        {
          key: 'check',
          type: 'condition',
          config: { module: './amount-over-100' },
          downstreamKey: 'after',
        },
        {
          key: 'onYes',
          type: 'echo',
          config: { value: 'high' },
          upstreamKey: 'check',
          branchKey: 'yes',
        },
        {
          key: 'onNo',
          type: 'echo',
          config: { value: 'low' },
          upstreamKey: 'check',
          branchKey: 'no',
        },
        {
          key: 'after',
          type: 'echo',
          config: { value: 'after' },
          upstreamKey: 'check',
        },
      ],
    });

    const dispatcher = createDispatcher(database);
    await dispatcher.trigger(
      workflow,
      { amount: 1 },
      { eventKey: 'low', manually: true },
    );

    const run = await findRun(database, 'low');
    expect(
      (await listNodeRuns(database, run.id as number)).map(
        (nodeRun) => nodeRun.nodeKey,
      ),
    ).toEqual(['check', 'onNo', 'after']);
  });

  it('recalls through several levels of nested branches', async () => {
    // check (yes) -> inner (yes) -> deep ; inner.next = afterInner ; check.next = afterCheck
    const nodes: TestNodeInput[] = [
      {
        key: 'check',
        type: 'condition',
        config: { module: './amount-over-100' },
        downstreamKey: 'afterCheck',
      },
      {
        key: 'inner',
        type: 'condition',
        config: { module: './amount-over-1000' },
        upstreamKey: 'check',
        branchKey: 'yes',
        downstreamKey: 'afterInner',
      },
      {
        key: 'deep',
        type: 'echo',
        config: { value: 'deep' },
        upstreamKey: 'inner',
        branchKey: 'yes',
      },
      {
        key: 'afterInner',
        type: 'echo',
        config: { value: 'after-inner' },
        upstreamKey: 'inner',
      },
      {
        key: 'afterCheck',
        type: 'echo',
        config: { value: 'after-check' },
        upstreamKey: 'check',
      },
    ];
    const workflow = await createTestWorkflow(database, {
      key: 'nested',
      nodes,
    });

    const dispatcher = createDispatcher(database);
    await dispatcher.trigger(
      workflow,
      { amount: 5000 },
      { eventKey: 'nested', manually: true },
    );

    const run = await findRun(database, 'nested');
    expect(run.status).toBe(EXECUTION_STATUS.RESOLVED);
    expect(
      (await listNodeRuns(database, run.id as number)).map(
        (nodeRun) => nodeRun.nodeKey,
      ),
    ).toEqual(['check', 'inner', 'deep', 'afterInner', 'afterCheck']);
  });

  it('bubbles a rejected branch nodeRun up instead of continuing downstream', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'rejected-branch',
      nodes: [
        {
          key: 'check',
          type: 'condition',
          config: { module: './always-true' },
          downstreamKey: 'after',
        },
        {
          key: 'onYes',
          type: 'failing',
          upstreamKey: 'check',
          branchKey: 'yes',
        },
        { key: 'after', type: 'echo', upstreamKey: 'check' },
      ],
    });

    const dispatcher = createDispatcher(database);
    await dispatcher.trigger(
      workflow,
      { amount: 1 },
      { eventKey: 'rejected', manually: true },
    );

    const run = await findRun(database, 'rejected');
    expect(run.status).toBe(EXECUTION_STATUS.FAILED);
    expect(await listNodeRuns(database, run.id as number)).toEqual([
      { nodeKey: 'check', status: NODE_RUN_STATUS.RESOLVED, result: true },
      {
        nodeKey: 'onYes',
        status: NODE_RUN_STATUS.FAILED,
        result: null,
        error: 'rejected',
      },
    ]);
  });

  it('keeps nested conditions resolved while waiting and resumes each successor once', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'waiting-branch',
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
          key: 'wait',
          type: 'pending',
          upstreamKey: 'inner',
          branchKey: 'yes',
        },
        { key: 'afterInner', type: 'echo', upstreamKey: 'inner' },
        { key: 'afterOuter', type: 'echo', upstreamKey: 'outer' },
      ],
    });
    await createDispatcher(database).trigger(
      workflow,
      {},
      { eventKey: 'waiting', manually: true },
    );
    const row = await findRun(database, 'waiting');
    expect(row.status).toBe(EXECUTION_STATUS.STARTED);
    expect(await listNodeRuns(database, row.id as number)).toEqual([
      { nodeKey: 'outer', status: NODE_RUN_STATUS.RESOLVED, result: true },
      { nodeKey: 'inner', status: NODE_RUN_STATUS.RESOLVED, result: true },
      { nodeKey: 'wait', status: NODE_RUN_STATUS.PENDING, result: null },
    ]);
    const processor = new Processor({
      database,
      workflow,
      execution: await readRun(database, row.id as number),
      instructions,
      workflowResourceRoot: null,
    });
    await processor.prepare();
    const before = processor.execution.nodeRuns!.filter(
      (item) => item.nodeKey !== 'wait',
    );
    const waiting = processor.execution.nodeRuns!.find(
      (item) => item.nodeKey === 'wait',
    )!;
    await processor.resume(waiting);
    expect((await readRun(database, row.id as number)).status).toBe(
      EXECUTION_STATUS.RESOLVED,
    );
    expect(
      (await listNodeRuns(database, row.id as number)).map(
        (item) => item.nodeKey,
      ),
    ).toEqual(['outer', 'inner', 'wait', 'afterInner', 'afterOuter']);
    await processor.prepare();
    expect(
      processor.execution.nodeRuns!.filter((item) =>
        ['outer', 'inner'].includes(item.nodeKey),
      ),
    ).toEqual(before);
  });

  it.each([
    NODE_RUN_STATUS.FAILED,
    NODE_RUN_STATUS.ERROR,
    NODE_RUN_STATUS.ABORTED,
  ])(
    'propagates nested branch status %s without changing condition results',
    async (status) => {
      const workflow = await createTestWorkflow(database, {
        key: 'nested-failure',
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
            key: 'fail',
            type: 'failure',
            upstreamKey: 'inner',
            branchKey: 'yes',
          },
          { key: 'afterInner', type: 'echo', upstreamKey: 'inner' },
          { key: 'afterOuter', type: 'echo', upstreamKey: 'outer' },
        ],
      });
      const registry = new Map(instructions);
      registry.set(
        'failure',
        defineTestInstruction('failure', async () => ({
          status,
          error: 'branch failure',
        })),
      );
      await new Dispatcher({
        database,
        instructions: registry,
        services,
        resolveWorkflowResourceRoot: async (): Promise<string> => moduleRoot,
      }).trigger(workflow, {}, { eventKey: 'failure', manually: true });
      const run = await findRun(database, 'failure');
      expect(run.status).toBe(Processor.StatusMap[status]);
      expect(await listNodeRuns(database, run.id as number)).toEqual([
        { nodeKey: 'outer', status: NODE_RUN_STATUS.RESOLVED, result: true },
        { nodeKey: 'inner', status: NODE_RUN_STATUS.RESOLVED, result: true },
        { nodeKey: 'fail', status, result: null, error: 'branch failure' },
      ]);
    },
  );

  it('reports an invalid config as an ERROR nodeRun', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'bad-config',
      nodes: [
        {
          key: 'check',
          type: 'condition',
          config: { module: 'not-a-relative-specifier' },
        },
      ],
    });

    const dispatcher = createDispatcher(database);
    await dispatcher.trigger(
      workflow,
      { amount: 1 },
      { eventKey: 'bad', manually: true },
    );

    const run = await findRun(database, 'bad');
    expect(run.status).toBe(EXECUTION_STATUS.ERROR);
    const nodeRuns = await listNodeRuns(database, run.id as number);
    expect(nodeRuns[0].status).toBe(NODE_RUN_STATUS.ERROR);
  });

  it('uses prior node results without exposing Processor scope objects', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'node-result-binding',
      nodes: [
        {
          key: 'seed',
          type: 'echo',
          config: { value: 42 },
          downstreamKey: 'check',
        },
        {
          key: 'check',
          type: 'condition',
          config: { module: './seed-is-42' },
          upstreamKey: 'seed',
        },
        {
          key: 'matched',
          type: 'echo',
          upstreamKey: 'check',
          branchKey: 'yes',
        },
      ],
    });
    const dispatcher = createDispatcher(database);
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'node-result', manually: true },
    );
    const run = await findRun(database, 'node-result');
    expect(
      (await listNodeRuns(database, run.id as number)).map(
        (nodeRun) => nodeRun.nodeKey,
      ),
    ).toEqual(['seed', 'check', 'matched']);
  });

  it('records a non-boolean condition result as ERROR', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'non-boolean',
      nodes: [
        {
          key: 'check',
          type: 'condition',
          config: { module: './returns-a-number' },
        },
      ],
    });
    const dispatcher = createDispatcher(database);
    await dispatcher.trigger(
      workflow,
      { amount: 1 },
      { eventKey: 'non-boolean', manually: true },
    );
    const run = await findRun(database, 'non-boolean');
    expect(run.status).toBe(EXECUTION_STATUS.ERROR);
    expect((await listNodeRuns(database, run.id as number))[0]).toMatchObject({
      status: NODE_RUN_STATUS.ERROR,
    });
  });
});

describe('validateConditionConfig', () => {
  it('accepts a static package-relative handler module', () => {
    expect(validateConditionConfig({ module: './server/check' })).toBeNull();
  });

  it('requires a module', () => {
    expect(validateConditionConfig({})).toMatchObject({
      module: expect.any(String),
    });
  });

  it('rejects the fields the expression engine used to accept', () => {
    for (const field of [
      'expression',
      'engine',
      'rejectOnFalse',
      'calculation',
    ]) {
      expect(
        validateConditionConfig({ module: './check', [field]: {} }),
      ).toMatchObject({
        [field]: expect.any(String),
      });
    }
  });

  it('rejects a module a published version could not audit or contain', () => {
    for (const module of [
      'check',
      '../outside/check',
      './check.js',
      './{{$input.module}}',
      './check?query',
      '',
    ]) {
      expect(validateConditionConfig({ module })).not.toBeNull();
    }
  });
});

describe('instruction registry', () => {
  it('exposes the built-in instructions through the core registry', () => {
    expect(coreInstructions.get('condition')).toBe(ConditionInstruction);
    expect(ConditionInstruction.branching).toBe(true);
    expect(coreInstructions.has('terminate')).toBe(true);
    expect(coreInstructions.get('run')).toBe(RunInstruction);
  });

  // The authoring builder derives a node's branch structure from the node
  // itself rather than from a table of known types, which is what lets an
  // application add its own. These two descriptions of the built-in nodes
  // therefore have to keep agreeing on their own.
  it('builds authoring nodes that match the registered instruction classes', () => {
    const act = defineHandler<() => Promise<void>>('./server/act');
    const condition = nodeDraft(
      createConditionInstruction({ key: 'decide' })
        .check(defineHandler<() => Promise<boolean>>('./server/decide'))
        .branch({
          yes: [createRunInstruction({ key: 'yes-step' }).run(act)],
          no: [createRunInstruction({ key: 'no-step' }).run(act)],
        }),
    );
    expect(condition.type).toBe(ConditionInstruction.type);
    expect(Object.keys(condition.branches ?? {}).sort()).toEqual(
      [...ConditionInstruction.branches].sort(),
    );

    const run = nodeDraft(createRunInstruction({ key: 'act' }).run(act));
    expect(run.type).toBe(RunInstruction.type);
    expect(run.branches).toBeUndefined();
  });
});

describe('programmatic trigger', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;

  beforeEach(async () => {
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('accepts events raised by application business logic', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'manual-only',
      nodes: [{ key: 'only', type: 'echo', config: { value: 1 } }],
    });
    const dispatcher = createDispatcher(database);

    await dispatcher.trigger(
      workflow,
      { amount: 1 },
      { eventKey: 'custom-event' },
    );

    expect((await findRun(database, 'custom-event')).status).toBe(
      EXECUTION_STATUS.RESOLVED,
    );
  });
});

describe('Processor.getBranches', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;

  beforeEach(async () => {
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('orders branches by branchKey as plain strings, not numerically (D4)', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'branch-order',
      nodes: [
        {
          key: 'check',
          type: 'condition',
          config: { module: './always-true' },
        },
        { key: 'b10', type: 'echo', upstreamKey: 'check', branchKey: 'b10' },
        { key: 'b9', type: 'echo', upstreamKey: 'check', branchKey: 'b9' },
        { key: 'b2', type: 'echo', upstreamKey: 'check', branchKey: 'b2' },
      ],
    });
    const processor = new Processor({
      database,
      workflow,
      execution: {
        id: 1,
        workflowId: workflow.id,
        workflowKey: workflow.key,
        eventKey: 'ordering',
        input: {},
        parameters: {},
        status: EXECUTION_STATUS.STARTED,
        dispatched: true,
        parentRunId: null,
        stack: [],
        output: null,
        startedAt: null,
        expiresAt: null,
        createdAt: new Date().toISOString(),
        manually: true,
        reason: null,
      },
      instructions,
    });
    await processor.prepare();

    const check = processor.nodesMap.get('check');
    expect(check).toBeDefined();
    // Numeric collation would give b2, b9, b10.
    expect(processor.getBranches(check!).map((node) => node.branchKey)).toEqual(
      ['b10', 'b2', 'b9'],
    );
  });
});
