import type { DatabaseManager } from '@nocobase/db';
import type { TestDatabase } from '@nocobase/db-testing';
import { ServiceContainer } from '@nocobase/service-provider';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  createJobExecutorService,
  type JobExecutor,
  type ManagedJobExecutorService,
} from '@nocobase/jobs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  EXECUTION_REASON,
  EXECUTION_STATUS,
  NODE_RUN_STATUS,
} from '../server/engine/constants.js';
import WorkflowEngine from '../server/engine/engine.js';
import { createWorkflowRunServices } from '../server/engine/run-services.js';
import {
  asId,
  asIdFilter,
  loadWorkflow,
  serializeJson,
} from '../server/engine/utils.js';
import type {
  JsonObject,
  WorkflowId,
  WorkflowEngineOptions,
} from '../server/engine/types.js';
import type { WorkflowInstructionClass } from '../server/instructions/base.js';
import { ConditionInstruction } from '../server/instructions/condition/instruction.js';
import {
  createCounterInstruction,
  createFailingInstruction,
  createSlowInstruction,
  createTraceInstruction,
  echoInstruction,
  errorResumeInstruction,
  pendingInstruction,
} from './fixtures/instructions.js';
import {
  constantCondition,
  createModuleRoot,
  createWorkflowTestDatabase,
  createTestWorkflow,
  inputEquals,
  insertTestRun,
  jobTrace,
  listNodeRuns,
  readRun,
  removeModuleRoots,
  testStore,
  type TestWorkflowInput,
  waitFor,
} from './helpers.js';

type RuntimeOverrides = Omit<Partial<WorkflowEngineOptions>, 'database'>;

/**
 * Condition handlers these workflows branch on.
 *
 * A condition runs a module from the workflow's resource root, and the engine
 * resolves that root as `<developmentResourceRoot>/<workflow key>`, so each
 * workflow with a condition gets its own copy under its own key.
 */
const CONDITION_WORKFLOW_KEYS: readonly string[] = [
  'branching',
  'empty-branch',
  'nested',
  'failing-branch',
  'nested-failing-branch',
  'suspending-branch',
  'resume-error-branch',
];

function conditionModules(): Record<string, string> {
  const modules: Record<string, string> = {};
  for (const key of CONDITION_WORKFLOW_KEYS) {
    modules[`./${key}/mode-is-yes`] = inputEquals('mode', 'yes');
    modules[`./${key}/deep-is-yes`] = inputEquals('deep', 'yes');
    modules[`./${key}/always-true`] = constantCondition(true);
  }
  return modules;
}

function equals(field: string, right: string): JsonObject {
  if (right !== 'yes') throw new Error(`No condition module for "${right}"`);
  return { module: field === 'input.deep' ? './deep-is-yes' : './mode-is-yes' };
}

function defineWorkflow(input: TestWorkflowInput): TestWorkflowInput {
  return input;
}

describe('workflow runtime', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  const runtimes: WorkflowEngine[] = [];
  let jobsStoragePath = '';
  const jobServices: ManagedJobExecutorService[] = [];
  let moduleRoot = '';
  const services = createWorkflowRunServices(new ServiceContainer());

  function buildRuntime(
    instructions: Map<string, WorkflowInstructionClass>,
    overrides: RuntimeOverrides = {},
  ): WorkflowEngine {
    const runtime = new WorkflowEngine({
      database,
      services,
      developmentResourceRoot: moduleRoot,
      ...overrides,
    });
    for (const instruction of instructions.values()) {
      runtime.registerInstruction(instruction);
    }
    runtimes.push(runtime);
    return runtime;
  }

  async function initializeRuntime(
    instructions: Map<string, WorkflowInstructionClass>,
    overrides: RuntimeOverrides = {},
  ): Promise<WorkflowEngine> {
    const runtime = buildRuntime(instructions, overrides);
    await runtime.initialize();
    return runtime;
  }

  /**
   * An executor of its own service, standing in for one process. Services
   * share the state directory, so a later one reads what an earlier one wrote
   * when it shut down.
   */
  function createExecutor(): JobExecutor {
    const jobs = createJobExecutorService(undefined, {
      appName: 'workflow-runtime',
      storagePath: jobsStoragePath,
    });
    jobServices.push(jobs);
    return jobs.getJobExecutor('@nocobase/app-plugin-workflow');
  }

  async function runIdOf(eventKey: string): Promise<WorkflowId> {
    const id = await testStore(database)
      .runs.findOne({
        filter: { eventKey },
        select: (select) => select.fields('id'),
      })
      .then((row) => (row ? asId(row.id) : null));
    if (id == null) {
      throw new Error(`Run "${eventKey}" was not created`);
    }
    return id;
  }

  async function nodeRunIdOf(
    runId: WorkflowId,
    nodeKey: string,
  ): Promise<WorkflowId> {
    const id = await testStore(database)
      .nodeRuns.findOne({
        filter: { workflowRunId: asIdFilter(runId), nodeKey },
        select: (select) => select.fields('id'),
      })
      .then((row) => (row ? asId(row.id) : null));
    if (id == null) {
      throw new Error(`Node run of node "${nodeKey}" was not created`);
    }
    return id;
  }

  beforeEach(async () => {
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
    moduleRoot = await createModuleRoot(conditionModules());
    jobsStoragePath = await mkdtemp(path.join(tmpdir(), 'workflow-runtime-'));
  });

  afterEach(async () => {
    await Promise.allSettled(runtimes.map((runtime) => runtime.dispose()));
    runtimes.length = 0;
    await Promise.allSettled(jobServices.map((jobs) => jobs.shutdown()));
    jobServices.length = 0;
    await rm(jobsStoragePath, { recursive: true, force: true });
    await testDatabase.destroy();
    await removeModuleRoots();
  });

  describe('assembly', () => {
    it('uses one workflow-definition trigger interface for internal calls', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'invocation',
          nodes: [{ key: 'only', type: 'echo', config: { value: 'ok' } }],
        }),
      );
      await testStore(database).workflows.updateMany({
        filter: { id: asIdFilter(workflow.id) },
        values: {
          inputSchema: serializeJson({
            type: 'object',
            required: ['enabled'],
            properties: { enabled: { type: 'boolean' } },
            additionalProperties: false,
          }),
        },
      });
      const runtime = buildRuntime(new Map([['echo', echoInstruction]]));
      await runtime.initialize();
      await runtime.trigger(
        { ...workflow, inputSchema: { type: 'object' } },
        { enabled: true },
        { eventKey: 'once' },
      );
      await expect(
        readRun(database, await runIdOf('once')),
      ).resolves.toMatchObject({
        workflowId: String(workflow.id),
        input: { enabled: true },
      });
    });

    it('pins revision, input and parameter snapshots before a new current revision appears', async () => {
      const first = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'pinned',
          nodes: [{ key: 'only', type: 'echo' }],
        }),
      );
      await testStore(database).workflows.updateMany({
        filter: { id: asIdFilter(first.id) },
        values: {
          inputSchema: serializeJson({
            type: 'object',
            required: ['falseValue', 'zero', 'empty', 'nested'],
            properties: {
              falseValue: { type: 'boolean' },
              zero: { type: 'number' },
              empty: { type: 'string' },
              nested: {
                type: 'object',
                properties: { value: { type: 'number' } },
              },
            },
          }),
          parametersSchema: serializeJson({
            limit: { type: 'number', default: 3 },
          }),
        },
      });
      const runtime = await initializeRuntime(
        new Map([['echo', echoInstruction]]),
      );
      const context = {
        falseValue: false,
        zero: 0,
        empty: '',
        nested: { value: 0 },
      };
      const pinned = await loadWorkflow(testStore(database), first.id);
      if (!pinned) throw new Error('Pinned workflow was not found');
      await runtime.trigger(pinned, context, { eventKey: 'pinned-event' });
      await testStore(database).workflows.updateMany({
        filter: { id: asIdFilter(first.id) },
        values: { current: null },
      });
      const second = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'pinned',
          nodes: [{ key: 'replacement', type: 'echo' }],
        }),
      );
      await testStore(database).workflows.updateMany({
        filter: { id: asIdFilter(second.id) },
        values: {
          parametersSchema: serializeJson({
            limit: { type: 'number', default: 9 },
          }),
        },
      });
      const runId = await runIdOf('pinned-event');
      await expect(readRun(database, runId)).resolves.toMatchObject({
        workflowId: String(first.id),
        input: context,
        parameters: { limit: 3 },
      });
    });
    it('registers core and application instructions', () => {
      const runtime = buildRuntime(new Map([['echo', echoInstruction]]));
      expect(runtime.instructions.get('condition')).toBe(ConditionInstruction);
      expect(runtime.instructions.get('echo')).toBe(echoInstruction);
    });

    it('registers application instructions', async () => {
      const runtime = buildRuntime(new Map());

      runtime.registerInstruction(echoInstruction);
      expect(runtime.instructions.get('echo')).toBe(echoInstruction);
      expect(() => runtime.registerInstruction(echoInstruction)).toThrow(
        'Workflow instruction "echo" is already registered.',
      );

      await runtime.initialize();
      const slowInstruction = createSlowInstruction(1);
      expect(() => runtime.registerInstruction(slowInstruction)).not.toThrow();
      expect(runtime.instructions.get('slow')).toBe(slowInstruction);
    });

    it('drains in-flight work when disposed', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'draining',
          nodes: [{ key: 'slow', type: 'slow' }],
        }),
      );
      const runtime = buildRuntime(
        new Map([['slow', createSlowInstruction(60)]]),
      );
      await runtime.initialize();

      const runId = await insertTestRun(database, {
        workflowId: workflow.id,
        workflowKey: workflow.key,
        eventKey: 'drain-me',
      });
      // Not awaited on purpose: `dispose()` has to drain the dispatcher and
      // wait for it, otherwise the run is abandoned half-finished.
      void runtime.dispatch({ executionId: runId });
      await runtime.dispose();

      expect(runtime.idle).toBe(true);
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.RESOLVED,
      });
    });

    it('re-publishes runs a previous process left undispatched when it starts', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'recoverable',
          nodes: [
            { key: 'only', type: 'echo', config: { value: 'recovered' } },
          ],
        }),
      );
      const runId = await insertTestRun(database, {
        workflowId: workflow.id,
        workflowKey: workflow.key,
        eventKey: 'left-behind',
        createdAt: new Date(Date.now() - 60_000).toISOString(),
      });

      await initializeRuntime(new Map([['echo', echoInstruction]]));

      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.RESOLVED,
        output: 'recovered',
      });
    });

    it('honours recoverGracePeriod so a run the previous process just created is left alone', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'too-fresh',
          nodes: [{ key: 'only', type: 'echo' }],
        }),
      );
      const runId = await insertTestRun(database, {
        workflowId: workflow.id,
        workflowKey: workflow.key,
        eventKey: 'fresh',
      });

      await initializeRuntime(new Map([['echo', echoInstruction]]), {
        recoverGracePeriod: 60_000,
      });

      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: null,
      });
      await expect(listNodeRuns(database, runId)).resolves.toEqual([]);
    });

    it('manually executes a disabled workflow inline', async () => {
      const workflow = await createTestWorkflow(database, {
        key: 'manual-only',
        enabled: false,
        nodes: [{ key: 'only', type: 'echo', config: { value: 'manual' } }],
      });
      const runtime = await initializeRuntime(
        new Map([['echo', echoInstruction]]),
      );

      await runtime.trigger(
        workflow,
        {},
        { eventKey: 'by-hand', manually: true },
      );
      await expect(
        readRun(database, await runIdOf('by-hand')),
      ).resolves.toMatchObject({
        status: EXECUTION_STATUS.RESOLVED,
        output: 'manual',
      });
    });
  });

  describe('execution paths', () => {
    it('runs a linear sequence node by node', async () => {
      const trace: string[] = [];
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'linear',
          nodes: [
            { key: 'first', type: 'trace', downstreamKey: 'second' },
            {
              key: 'second',
              type: 'trace',
              upstreamKey: 'first',
              downstreamKey: 'third',
            },
            { key: 'third', type: 'trace', upstreamKey: 'second' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['trace', createTraceInstruction(trace)]]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'linear-1' });

      const runId = await runIdOf('linear-1');
      expect(trace).toEqual(['first', 'second', 'third']);
      await expect(jobTrace(database, runId)).resolves.toEqual([
        'first',
        'second',
        'third',
      ]);
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.RESOLVED,
        output: 'third',
      });
    });

    it('enters the matching branch and comes back out to the common successor', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'branching',
          nodes: [
            {
              key: 'gate',
              type: 'condition',
              config: equals('input.mode', 'yes'),
              downstreamKey: 'after',
            },
            {
              key: 'yes1',
              type: 'trace',
              upstreamKey: 'gate',
              branchKey: 'yes',
              downstreamKey: 'yes2',
            },
            { key: 'yes2', type: 'trace', upstreamKey: 'yes1' },
            { key: 'no1', type: 'trace', upstreamKey: 'gate', branchKey: 'no' },
            { key: 'after', type: 'trace', upstreamKey: 'gate' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['trace', createTraceInstruction([])]]),
      );

      await runtime.trigger(
        workflow,
        { mode: 'yes' },
        { eventKey: 'branch-yes' },
      );
      await runtime.trigger(
        workflow,
        { mode: 'no' },
        { eventKey: 'branch-no' },
      );

      // Recall preserves the original condition nodeRun instead of appending one.
      await expect(
        jobTrace(database, await runIdOf('branch-yes')),
      ).resolves.toEqual(['gate', 'yes1', 'yes2', 'after']);
      await expect(
        jobTrace(database, await runIdOf('branch-no')),
      ).resolves.toEqual(['gate', 'no1', 'after']);
      await expect(
        readRun(database, await runIdOf('branch-no')),
      ).resolves.toMatchObject({
        status: EXECUTION_STATUS.RESOLVED,
        output: 'after',
      });
    });

    it('falls through to the common successor when the chosen branch is not declared', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'empty-branch',
          nodes: [
            {
              key: 'gate',
              type: 'condition',
              config: equals('input.mode', 'yes'),
              downstreamKey: 'after',
            },
            {
              key: 'yes1',
              type: 'trace',
              upstreamKey: 'gate',
              branchKey: 'yes',
            },
            { key: 'after', type: 'trace', upstreamKey: 'gate' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['trace', createTraceInstruction([])]]),
      );

      await runtime.trigger(workflow, { mode: 'no' }, { eventKey: 'empty-no' });

      await expect(
        jobTrace(database, await runIdOf('empty-no')),
      ).resolves.toEqual(['gate', 'after']);
    });

    it('recalls through nested branches back to the outer common successor', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'nested',
          nodes: [
            { key: 'start', type: 'trace', downstreamKey: 'outer' },
            {
              key: 'outer',
              type: 'condition',
              config: equals('input.mode', 'yes'),
              upstreamKey: 'start',
              downstreamKey: 'tail',
            },
            {
              key: 'inner',
              type: 'condition',
              config: equals('input.deep', 'yes'),
              upstreamKey: 'outer',
              branchKey: 'yes',
            },
            {
              key: 'leaf1',
              type: 'trace',
              upstreamKey: 'inner',
              branchKey: 'yes',
              downstreamKey: 'leaf2',
            },
            { key: 'leaf2', type: 'trace', upstreamKey: 'leaf1' },
            { key: 'tail', type: 'trace', upstreamKey: 'outer' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['trace', createTraceInstruction([])]]),
      );

      await runtime.trigger(
        workflow,
        { mode: 'yes', deep: 'yes' },
        { eventKey: 'nested-deep' },
      );
      await runtime.trigger(
        workflow,
        { mode: 'yes', deep: 'no' },
        { eventKey: 'nested-shallow' },
      );

      // Two levels of recall preserve the completed conditions before `tail` runs.
      await expect(
        jobTrace(database, await runIdOf('nested-deep')),
      ).resolves.toEqual(['start', 'outer', 'inner', 'leaf1', 'leaf2', 'tail']);
      // The inner condition has no `no` branch and no downstream of its own, so
      // it ends the outer branch immediately.
      await expect(
        jobTrace(database, await runIdOf('nested-shallow')),
      ).resolves.toEqual(['start', 'outer', 'inner', 'tail']);
      await expect(
        readRun(database, await runIdOf('nested-deep')),
      ).resolves.toMatchObject({
        status: EXECUTION_STATUS.RESOLVED,
        output: 'tail',
      });
    });

    it('bubbles a failed branch nodeRun out through the parent condition and stops the run', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'failing-branch',
          nodes: [
            {
              key: 'gate',
              type: 'condition',
              config: { module: './always-true' },
              downstreamKey: 'after',
            },
            { key: 'bad', type: 'fail', upstreamKey: 'gate', branchKey: 'yes' },
            { key: 'after', type: 'trace', upstreamKey: 'gate' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([
          ['trace', createTraceInstruction([])],
          ['fail', createFailingInstruction()],
        ]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'branch-fail' });

      const runId = await runIdOf('branch-fail');
      const nodeRuns = await listNodeRuns(database, runId);
      expect(nodeRuns.map((nodeRun) => nodeRun.nodeKey)).toEqual([
        'gate',
        'bad',
      ]);
      expect(
        nodeRuns.find((nodeRun) => nodeRun.nodeKey === 'gate'),
      ).toMatchObject({
        status: NODE_RUN_STATUS.RESOLVED,
        result: true,
      });
      expect(
        nodeRuns.find((nodeRun) => nodeRun.nodeKey === 'bad'),
      ).toMatchObject({
        status: NODE_RUN_STATUS.FAILED,
        error: 'Failed at bad',
      });
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.FAILED,
      });
    });

    it('preserves condition results and records the original nested branch error', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'nested-failing-branch',
          nodes: [
            {
              key: 'outer',
              type: 'condition',
              config: { module: './always-true' },
            },
            {
              key: 'inner',
              type: 'condition',
              config: { module: './always-true' },
              upstreamKey: 'outer',
              branchKey: 'yes',
            },
            {
              key: 'bad',
              type: 'fail',
              upstreamKey: 'inner',
              branchKey: 'yes',
            },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['fail', createFailingInstruction(NODE_RUN_STATUS.ERROR)]]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'nested-branch-fail' });

      const nodeRuns = await listNodeRuns(
        database,
        await runIdOf('nested-branch-fail'),
      );
      expect(
        nodeRuns.find((nodeRun) => nodeRun.nodeKey === 'bad'),
      ).toMatchObject({
        status: NODE_RUN_STATUS.ERROR,
        error: 'Failed at bad',
      });
      expect(
        nodeRuns.find((nodeRun) => nodeRun.nodeKey === 'inner'),
      ).toMatchObject({
        status: NODE_RUN_STATUS.RESOLVED,
        result: true,
      });
      expect(
        nodeRuns.find((nodeRun) => nodeRun.nodeKey === 'outer'),
      ).toMatchObject({
        status: NODE_RUN_STATUS.RESOLVED,
        result: true,
      });
    });

    it('suspends on a PENDING nodeRun and finishes when the nodeRun is dispatched again', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'suspending',
          nodes: [
            { key: 'before', type: 'trace', downstreamKey: 'hold' },
            {
              key: 'hold',
              type: 'pending',
              upstreamKey: 'before',
              downstreamKey: 'after',
            },
            { key: 'after', type: 'trace', upstreamKey: 'hold' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([
          ['trace', createTraceInstruction([])],
          ['pending', pendingInstruction],
        ]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'suspend-1' });
      const runId = await runIdOf('suspend-1');
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.STARTED,
      });
      await expect(jobTrace(database, runId)).resolves.toEqual([
        'before',
        'hold',
      ]);

      // What an external system does while the nodeRun waits: write the answer onto
      // the pending nodeRun, then hand the nodeRun back to the dispatcher.
      const nodeRunId = await nodeRunIdOf(runId, 'hold');
      await testStore(database).nodeRuns.updateMany({
        filter: { id: asIdFilter(nodeRunId) },
        values: { result: serializeJson('approved') },
      });

      await runtime.dispatcher.dispatch({ executionId: runId, nodeRunId });

      const nodeRuns = await listNodeRuns(database, runId);
      // `hold` keeps its original row: a resume updates the pending nodeRun in place.
      expect(nodeRuns.map((nodeRun) => nodeRun.nodeKey)).toEqual([
        'before',
        'hold',
        'after',
      ]);
      expect(nodeRuns[1]).toMatchObject({
        status: NODE_RUN_STATUS.RESOLVED,
        result: 'approved',
      });
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.RESOLVED,
      });
    });

    it('keeps a run started while a PENDING nodeRun waits inside a branch, then exits through the branch', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'suspending-branch',
          nodes: [
            {
              key: 'gate',
              type: 'condition',
              config: { module: './always-true' },
              downstreamKey: 'after',
            },
            {
              key: 'hold',
              type: 'pending',
              upstreamKey: 'gate',
              branchKey: 'yes',
            },
            { key: 'after', type: 'trace', upstreamKey: 'gate' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([
          ['trace', createTraceInstruction([])],
          ['pending', pendingInstruction],
        ]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'suspend-branch' });
      const runId = await runIdOf('suspend-branch');
      const gateNodeRunId = await nodeRunIdOf(runId, 'gate');
      // Only the suspended branch node remains pending; the judgment is complete.
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.STARTED,
      });
      await expect(jobTrace(database, runId)).resolves.toEqual([
        'gate',
        'hold',
      ]);
      expect(
        (await listNodeRuns(database, runId)).find(
          (nodeRun) => nodeRun.nodeKey === 'gate',
        ),
      ).toMatchObject({ status: NODE_RUN_STATUS.RESOLVED });

      await runtime.dispatcher.dispatch({
        executionId: runId,
        nodeRunId: await nodeRunIdOf(runId, 'hold'),
      });

      await expect(jobTrace(database, runId)).resolves.toEqual([
        'gate',
        'hold',
        'after',
      ]);
      expect(await nodeRunIdOf(runId, 'gate')).toBe(gateNodeRunId);
      expect(
        (await listNodeRuns(database, runId)).find(
          (nodeRun) => nodeRun.nodeKey === 'gate',
        ),
      ).toMatchObject({ status: NODE_RUN_STATUS.RESOLVED });
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.RESOLVED,
      });
    });

    it('ends the run when a suspended main-flow nodeRun resumes with an error', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'resume-error',
          nodes: [
            { key: 'hold', type: 'error-resume', downstreamKey: 'after' },
            { key: 'after', type: 'trace', upstreamKey: 'hold' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([
          ['trace', createTraceInstruction([])],
          ['error-resume', errorResumeInstruction],
        ]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'resume-error-1' });
      const runId = await runIdOf('resume-error-1');
      await runtime.dispatcher.dispatch({
        executionId: runId,
        nodeRunId: await nodeRunIdOf(runId, 'hold'),
      });

      // `after` must not run: an errored resume ends the run where it stands.
      await expect(jobTrace(database, runId)).resolves.toEqual(['hold']);
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.ERROR,
      });
    });

    it('ends the run when a suspended nodeRun inside a branch resumes with an error', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'resume-error-branch',
          nodes: [
            {
              key: 'gate',
              type: 'condition',
              config: { module: './always-true' },
              downstreamKey: 'after',
            },
            {
              key: 'hold',
              type: 'error-resume',
              upstreamKey: 'gate',
              branchKey: 'yes',
            },
            { key: 'after', type: 'trace', upstreamKey: 'gate' },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([
          ['trace', createTraceInstruction([])],
          ['error-resume', errorResumeInstruction],
        ]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'resume-error-2' });
      const runId = await runIdOf('resume-error-2');
      await runtime.dispatcher.dispatch({
        executionId: runId,
        nodeRunId: await nodeRunIdOf(runId, 'hold'),
      });

      // The condition propagates the branch error without changing its own result.
      const nodeRuns = await listNodeRuns(database, runId);
      expect(nodeRuns.map((nodeRun) => nodeRun.nodeKey)).toEqual([
        'gate',
        'hold',
      ]);
      expect(
        nodeRuns.find((nodeRun) => nodeRun.nodeKey === 'gate'),
      ).toMatchObject({
        status: NODE_RUN_STATUS.RESOLVED,
        result: true,
      });
      expect(
        nodeRuns.find((nodeRun) => nodeRun.nodeKey === 'hold'),
      ).toMatchObject({
        status: NODE_RUN_STATUS.ERROR,
        error: 'Resume failed',
      });
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.ERROR,
      });
    });
  });

  describe('queue round trip', () => {
    it('carries a triggered run through the jobs executor and back into the processor', async () => {
      const executor = createExecutor();
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'queued',
          nodes: [
            {
              key: 'only',
              type: 'echo',
              config: { value: 'through-the-queue' },
            },
          ],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['echo', echoInstruction]]),
        { executor },
      );

      // Not synchronous, so `trigger()` only publishes; the worker does the work.
      await runtime.trigger(workflow, {}, { eventKey: 'queued-1' });
      const runId = await runIdOf('queued-1');

      await waitFor(
        async () =>
          (await readRun(database, runId)).status === EXECUTION_STATUS.RESOLVED,
      );
      await expect(readRun(database, runId)).resolves.toMatchObject({
        output: 'through-the-queue',
      });
    });

    it('picks up a task the previous process persisted but never consumed', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'queued-restart',
          nodes: [
            { key: 'only', type: 'echo', config: { value: 'after-restart' } },
          ],
        }),
      );
      const runId = await insertTestRun(database, {
        workflowId: workflow.id,
        workflowKey: workflow.key,
        eventKey: 'queued-restart-1',
      });

      // A publisher-only process: its executor never consumes, so the task is
      // still pending when the process shuts down and writes its state.
      const publisherExecutor = createExecutor();
      const publisher = buildRuntime(new Map([['echo', echoInstruction]]), {
        executor: publisherExecutor,
      });
      await publisherExecutor.setup({ consume: false });
      await publisher.enqueue({ executionId: runId });
      await publisher.dispose();
      await expect(readRun(database, runId)).resolves.toMatchObject({
        status: EXECUTION_STATUS.QUEUEING,
      });

      // The grace period keeps recover() away from this fresh run, so only the
      // persisted task can carry it to the processor.
      await initializeRuntime(new Map([['echo', echoInstruction]]), {
        executor: createExecutor(),
        recoverGracePeriod: 60_000,
      });
      await waitFor(
        async () =>
          (await readRun(database, runId)).status === EXECUTION_STATUS.RESOLVED,
      );
      await expect(readRun(database, runId)).resolves.toMatchObject({
        output: 'after-restart',
      });
    });
  });

  describe('timeout', () => {
    it('aborts a run that outlives its timeout while it is still executing', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'timing-out',
          options: { timeout: 0.03 },
          nodes: [{ key: 'slow', type: 'slow' }],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['slow', createSlowInstruction(300)]]),
        {
          timeoutReaper: false,
        },
      );

      await runtime.trigger(workflow, {}, { eventKey: 'timeout-live' });

      await expect(
        readRun(database, await runIdOf('timeout-live')),
      ).resolves.toMatchObject({
        status: EXECUTION_STATUS.ABORTED,
        reason: EXECUTION_REASON.TIMEOUT,
      });
    });

    it('reclaims a run a previous process left expired, once the reaper is running', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'expired',
          nodes: [{ key: 'hold', type: 'pending' }],
        }),
      );
      const runId = await insertTestRun(database, {
        workflowId: workflow.id,
        workflowKey: workflow.key,
        eventKey: 'expired-1',
        status: EXECUTION_STATUS.STARTED,
        dispatched: true,
        startedAt: new Date(Date.now() - 120_000).toISOString(),
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      });
      await testStore(database).nodeRuns.createOne({
        values: {
          workflowRunId: asIdFilter(runId),
          nodeId: asIdFilter(workflow.nodes[0].id),
          nodeKey: 'hold',
          status: NODE_RUN_STATUS.PENDING,
          meta: serializeJson(null),
          result: serializeJson(null),
          startedAt: new Date(Date.now() - 120_000).toISOString(),
        },
      });

      await initializeRuntime(new Map([['pending', pendingInstruction]]), {
        timeoutReaperIntervalMs: 5,
      });

      await waitFor(
        async () =>
          (await readRun(database, runId)).status === EXECUTION_STATUS.ABORTED,
      );
      await expect(readRun(database, runId)).resolves.toMatchObject({
        reason: EXECUTION_REASON.TIMEOUT,
      });
      await expect(listNodeRuns(database, runId)).resolves.toEqual([
        {
          nodeKey: 'hold',
          status: NODE_RUN_STATUS.ABORTED,
          result: null,
          error: 'Workflow execution timed out',
        },
      ]);
    });

    it('exposes the sweep directly, and reports 0 when the reaper is switched off', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'sweepable',
          nodes: [{ key: 'only', type: 'echo' }],
        }),
      );
      await insertTestRun(database, {
        workflowId: workflow.id,
        workflowKey: workflow.key,
        eventKey: 'sweepable-1',
        status: EXECUTION_STATUS.STARTED,
        dispatched: true,
        startedAt: new Date(Date.now() - 120_000).toISOString(),
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      });

      const disabled = buildRuntime(new Map([['echo', echoInstruction]]), {
        timeoutReaper: false,
      });
      await expect(disabled.sweepTimeouts()).resolves.toBe(0);

      const runtime = buildRuntime(new Map([['echo', echoInstruction]]));
      await expect(runtime.sweepTimeouts()).resolves.toBe(1);
      await expect(runtime.sweepTimeouts()).resolves.toBe(0);
    });
  });

  describe('rerun', () => {
    type SuspendedRun = {
      runtime: WorkflowEngine;
      runId: WorkflowId;
      counter: WorkflowInstructionClass & { readonly calls: () => number };
    };

    async function stageSuspendedRun(): Promise<SuspendedRun> {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'rerunnable',
          nodes: [
            { key: 'counted', type: 'counter', downstreamKey: 'hold' },
            { key: 'hold', type: 'pending', upstreamKey: 'counted' },
          ],
        }),
      );
      const counter = createCounterInstruction();
      const runtime = await initializeRuntime(
        new Map([
          ['counter', counter],
          ['pending', pendingInstruction],
        ]),
      );
      await runtime.trigger(workflow, {}, { eventKey: 'rerun-1' });
      const runId = await runIdOf('rerun-1');
      // A re-run only applies to a run that is still STARTED, which is what the
      // pending node keeps it as.
      await expect(listNodeRuns(database, runId)).resolves.toEqual([
        { nodeKey: 'counted', status: NODE_RUN_STATUS.RESOLVED, result: 1 },
        { nodeKey: 'hold', status: NODE_RUN_STATUS.PENDING, result: null },
      ]);
      return { runtime, runId, counter };
    }

    it('appends a new nodeRun when a node is re-run without overwrite', async () => {
      const { runtime, runId, counter } = await stageSuspendedRun();

      await runtime.dispatcher.dispatch({
        executionId: runId,
        rerun: { nodeKey: 'counted' },
      });

      expect(counter.calls()).toBe(2);
      await expect(listNodeRuns(database, runId)).resolves.toEqual([
        { nodeKey: 'counted', status: NODE_RUN_STATUS.RESOLVED, result: 1 },
        { nodeKey: 'hold', status: NODE_RUN_STATUS.PENDING, result: null },
        { nodeKey: 'counted', status: NODE_RUN_STATUS.RESOLVED, result: 2 },
        { nodeKey: 'hold', status: NODE_RUN_STATUS.PENDING, result: null },
      ]);
    });

    it('replaces the target nodeRun when a node is re-run with overwrite', async () => {
      const { runtime, runId } = await stageSuspendedRun();

      await runtime.dispatcher.dispatch({
        executionId: runId,
        rerun: { nodeKey: 'counted', overwrite: true },
      });

      // Only the node named by the re-run is overwritten; nodes downstream of it
      // still append, because their repetition is what a re-run is meant to show.
      await expect(listNodeRuns(database, runId)).resolves.toEqual([
        { nodeKey: 'counted', status: NODE_RUN_STATUS.RESOLVED, result: 2 },
        { nodeKey: 'hold', status: NODE_RUN_STATUS.PENDING, result: null },
        { nodeKey: 'hold', status: NODE_RUN_STATUS.PENDING, result: null },
      ]);
    });
  });

  describe('stack limit', () => {
    it('rejects a nested trigger beyond the default stackLimit of 1', async () => {
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'stack-default',
          nodes: [{ key: 'only', type: 'echo' }],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['echo', echoInstruction]]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'stack-default-0' });
      const first = await runIdOf('stack-default-0');

      await expect(
        runtime.trigger(
          workflow,
          {},
          {
            eventKey: 'stack-default-1',
            parentRunId: first,
          },
        ),
      ).rejects.toThrow(/not valid/);

      // A run that is not on the stack does not count towards the limit.
      await runtime.trigger(workflow, {}, { eventKey: 'stack-default-2' });
      await expect(
        readRun(database, await runIdOf('stack-default-2')),
      ).resolves.toMatchObject({ status: EXECUTION_STATUS.RESOLVED });
    });

    it('allows nesting up to the configured stackLimit and rejects the one past it', async () => {
      const failures: unknown[] = [];
      const workflow = await createTestWorkflow(
        database,
        defineWorkflow({
          key: 'stack-limited',
          options: { stackLimit: 2 },
          nodes: [{ key: 'only', type: 'echo' }],
        }),
      );
      const runtime = await initializeRuntime(
        new Map([['echo', echoInstruction]]),
      );

      await runtime.trigger(workflow, {}, { eventKey: 'stack-0' });
      const first = await runIdOf('stack-0');
      await runtime.trigger(
        workflow,
        {},
        { eventKey: 'stack-1', parentRunId: first },
      );
      const second = await runIdOf('stack-1');
      await expect(readRun(database, second)).resolves.toMatchObject({
        stack: [first],
      });

      await expect(
        runtime.trigger(
          workflow,
          {},
          {
            eventKey: 'stack-2',
            parentRunId: second,
            onTriggerFail: (_workflow, _context, _options, error) => {
              failures.push(error);
            },
          },
        ),
      ).rejects.toThrow(/not valid/);

      expect(failures).toHaveLength(1);
      await expect(
        testStore(database).runs.exists({ filter: { eventKey: 'stack-2' } }),
      ).resolves.toBe(false);
    });
  });
});
