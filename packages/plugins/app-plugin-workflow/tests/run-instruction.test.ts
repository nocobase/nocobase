import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { DatabaseManager } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import {
  createServiceToken,
  ServiceContainer,
} from '@nocobase/service-provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EXECUTION_REASON,
  EXECUTION_STATUS,
  NODE_RUN_STATUS,
} from '../server/engine/constants.js';
import Dispatcher from '../server/engine/dispatcher.js';
import { MAX_RESUME_ATTEMPTS } from '../server/engine/resume-requests.js';
import { coreInstructions } from '../server/instructions/index.js';
import type { WorkflowId, WorkflowQueueTask } from '../server/engine/types.js';
import { ConditionInstruction } from '../server/instructions/condition/instruction.js';
import type { WorkflowInstructionClass } from '../server/instructions/base.js';
import {
  assertWorkflowRunResult,
  RunInstruction,
  validateRunConfig,
} from '../server/instructions/run/instruction.js';
import { buildWorkflowArtifact } from '../build/artifact-builder.js';
import { LocalWorkflowArtifactStore } from '../server/loader/artifact-store.js';
import { pendingInstruction } from './fixtures/instructions.js';
import { createWorkflowRunServices } from '../server/engine/run-services.js';
import { asIdFilter } from '../server/engine/utils.js';
import {
  createWorkflowTestDatabase,
  createTestWorkflow,
  findRun,
  listNodeRuns,
  testStore,
} from './helpers.js';

const SOURCE_ROOT = fileURLToPath(
  new URL('./fixtures/run-scripts', import.meta.url),
);
const OUTSIDE_ROOT = fileURLToPath(
  new URL('./fixtures/outside', import.meta.url),
);
const container = new ServiceContainer();
const services = createWorkflowRunServices(container);
const roots: string[] = [];

function runInstructions(): Map<string, WorkflowInstructionClass> {
  return new Map<string, WorkflowInstructionClass>([['run', RunInstruction]]);
}

async function createArtifactRoot(
  modules: Readonly<Record<string, string>>,
): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'run-resource-'));
  roots.push(root);
  for (const [specifier, code] of Object.entries(modules)) {
    const target = path.join(root, `${specifier}.js`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, code);
  }
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  return root;
}

describe('run instruction', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;

  beforeEach(async () => {
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
  });

  afterEach(async () => {
    await testDatabase.destroy();
    await Promise.all(
      roots
        .splice(0)
        .map((root) => fs.rm(root, { recursive: true, force: true })),
    );
  });

  async function runSingleNode(
    key: string,
    config: Record<string, unknown>,
    modules: Readonly<Record<string, string>>,
    context: unknown = {},
  ): Promise<{
    status: unknown;
    nodeRuns: Awaited<ReturnType<typeof listNodeRuns>>;
  }> {
    const resourceRoot = await createArtifactRoot(modules);
    const workflow = await createTestWorkflow(database, {
      key,
      nodes: [{ key: 'run', type: 'run', config }],
    });
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
      resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
      services,
    });
    await dispatcher.trigger(workflow, context, {
      eventKey: key,
      manually: true,
    });
    await dispatcher.drain();
    const execution = await findRun(database, key);
    return {
      status: execution.status,
      nodeRuns: await listNodeRuns(database, execution.id as number),
    };
  }

  it('resumes a historical run from the artifact pinned on its execution', async () => {
    const artifactRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'run-pin-artifact-'),
    );
    roots.push(artifactRoot);
    const store = new LocalWorkflowArtifactStore({
      storeRoot: path.join(artifactRoot, 'private'),
    });
    const makeArtifact = async (version: 'v1' | 'v2'): Promise<string> => {
      const definition = {
        title: version,
        inputSchema: { type: 'object' as const },
        nodes: [],
      };
      const built = buildWorkflowArtifact({
        key: 'pin-artifact',
        flatIr: { ...definition, start: null, nodes: [] },
        resourceFiles: new Map([
          [
            'server/run.js',
            `export function run(){ return ${JSON.stringify(version)}; }`,
          ],
        ]),
      });
      const stage = path.join(artifactRoot, `stage-${version}`);
      for (const [file, content] of built.files) {
        const target = path.join(stage, file);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, content);
      }
      await store.commit('pin-artifact', built.digest, stage);
      return built.digest;
    };
    const [v1Hash, v2Hash] = await Promise.all([
      makeArtifact('v1'),
      makeArtifact('v2'),
    ]);
    const workflow = await createTestWorkflow(database, {
      key: 'pin-artifact',
      nodes: [
        { key: 'hold', type: 'pending', downstreamKey: 'run' },
        {
          key: 'run',
          type: 'run',
          config: { module: './server/run' },
          upstreamKey: 'hold',
        },
      ],
    });
    await testStore(database).workflows.updateMany({
      filter: { id: asIdFilter(workflow.id) },
      values: { hash: v1Hash },
    });
    workflow.hash = v1Hash;
    const dispatcher = new Dispatcher({
      database,
      instructions: new Map<string, WorkflowInstructionClass>([
        ['pending', pendingInstruction],
        ['run', RunInstruction],
      ]),
      resolveWorkflowResourceRoot: (_workflow, execution) =>
        execution.hash
          ? store.materialize(execution.workflowKey, execution.hash)
          : Promise.resolve(null),
      services,
    });

    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'pinned', manually: true },
    );
    const execution = await findRun(database, 'pinned');
    const pending = await testStore(database).nodeRuns.findOne({
      filter: {
        workflowRunId: asIdFilter(execution.id),
        nodeKey: 'hold',
      },
      select: (select) => select.fields('id'),
    });
    await testStore(database).workflows.updateMany({
      filter: { id: asIdFilter(workflow.id) },
      values: { hash: v2Hash },
    });
    await dispatcher.dispatch({
      executionId: execution.id,
      nodeRunId: pending.id as number,
    });

    await dispatcher.drain();
    await expect(
      listNodeRuns(database, execution.id as number),
    ).resolves.toEqual([
      { nodeKey: 'hold', status: NODE_RUN_STATUS.RESOLVED, result: null },
      { nodeKey: 'run', status: NODE_RUN_STATUS.RESOLVED, result: 'v1' },
    ]);
  });

  it('resolves args and stores JSON-compatible results', async () => {
    const { status, nodeRuns } = await runSingleNode(
      'args',
      {
        module: './server/record-step',
        args: { orderId: '{{$input.order.id}}' },
      },
      {
        './server/record-step':
          'export const run = (args) => ({ orderId: args.orderId, values: [1, null, false] });',
      },
      { order: { id: 7 } },
    );
    expect(status).toBe(EXECUTION_STATUS.RESOLVED);
    expect(nodeRuns[0]).toMatchObject({
      status: NODE_RUN_STATUS.RESOLVED,
      result: { orderId: 7, values: [1, null, false] },
    });
  });

  it('normalizes undefined and rejects non-JSON results', async () => {
    const empty = await runSingleNode(
      'undefined-result',
      { module: './empty' },
      { './empty': 'export const run = () => undefined;' },
    );
    expect(empty.nodeRuns[0].result).toBeNull();

    const invalid = await runSingleNode(
      'invalid-result',
      { module: './invalid' },
      { './invalid': 'export const run = () => ({ total: 10n });' },
    );
    expect(invalid.status).toBe(EXECUTION_STATUS.ERROR);
    expect(invalid.nodeRuns[0].error).toMatch(/BigInt/);
  });

  it('passes services, signal, and contextual logger in frozen options', async () => {
    const { nodeRuns } = await runSingleNode(
      'services',
      { module: './services' },
      {
        './services':
          'export const run = (_args, options) => ({ keys: Object.keys(options).sort(), runId: options.runId, idempotencyKey: options.idempotencyKey, frozen: Object.isFrozen(options), serviceKeys: Object.keys(options.services).sort(), servicesFrozen: Object.isFrozen(options.services), signal: options.signal instanceof AbortSignal, logger: typeof options.logger.info });',
      },
    );
    expect(nodeRuns[0].result).toEqual({
      keys: ['idempotencyKey', 'logger', 'runId', 'services', 'signal'],
      runId: expect.any(String),
      // The node run and the execution it belongs to.
      idempotencyKey: expect.stringMatching(/^\d+@\d{4}-\d\d-\d\dT[\d:.]+Z$/),
      frozen: true,
      serviceKeys: ['has', 'resolve'],
      servicesFrozen: true,
      signal: true,
      logger: 'function',
    });
  });

  it('resolves application services by their original tokens', () => {
    const token = createServiceToken<{ readonly value: string }>(
      '@nocobase/app-plugin-workflow/tests/service',
    );
    const bound = { value: 'resolved' };
    const testContainer = new ServiceContainer();
    testContainer.instance(token, bound);

    const runServices = createWorkflowRunServices(testContainer);

    expect(runServices.has(token)).toBe(true);
    expect(runServices.resolve(token)).toBe(bound);
    expect(runServices).not.toHaveProperty('instance');
    expect(runServices).not.toHaveProperty('singleton');
  });

  it('aborts a 5s Run node when the workflow timeout is 2s', async () => {
    const resourceRoot = await createArtifactRoot({
      './slow':
        'import { setTimeout as sleep } from "node:timers/promises"; export const run = async (_args, options) => { await sleep(5000, undefined, { signal: options.signal }); return "finished"; };',
    });
    const workflow = await createTestWorkflow(database, {
      key: 'aborted',
      options: { timeout: 2 },
      nodes: [{ key: 'run', type: 'run', config: { module: './slow' } }],
    });
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
      resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
      services,
    });
    const startedAt = performance.now();
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'aborted', manually: true },
    );
    await dispatcher.drain();
    const elapsedMs = performance.now() - startedAt;
    const execution = await findRun(database, 'aborted');

    expect(execution).toMatchObject({
      status: EXECUTION_STATUS.ABORTED,
      reason: EXECUTION_REASON.TIMEOUT,
    });
    await expect(
      listNodeRuns(database, execution.id as number),
    ).resolves.toEqual([
      {
        nodeKey: 'run',
        status: NODE_RUN_STATUS.ABORTED,
        result: null,
        error: 'The operation was aborted',
      },
    ]);
    expect(elapsedMs).toBeGreaterThanOrEqual(1_500);
    expect(elapsedMs).toBeLessThan(4_000);
  });

  it('logs metadata without args or result values', async () => {
    const resourceRoot = await createArtifactRoot({
      './safe': 'export const run = () => ({ confidential: "result" });',
    });
    const workflow = await createTestWorkflow(database, {
      key: 'safe-log',
      nodes: [
        {
          key: 'run',
          type: 'run',
          config: { module: './safe', args: { secret: 'hidden' } },
        },
      ],
    });
    const info = vi.fn();
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
      resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
      services,
      logger: { debug: vi.fn(), info, warn: vi.fn(), error: vi.fn() },
    });
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'safe-log', manually: true },
    );
    await dispatcher.drain();
    const serialized = JSON.stringify(info.mock.calls);
    expect(serialized).toContain('durationMs');
    expect(serialized).not.toContain('hidden');
    expect(serialized).not.toContain('confidential');
  });

  it('loads an extensionless module from an explicit source root', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'source',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'number' } },
      },
      nodes: [
        {
          key: 'run',
          type: 'run',
          config: { module: './echo-args', args: { id: '{{$input.id}}' } },
        },
      ],
    });
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
      resolveWorkflowResourceRoot: () => Promise.resolve(SOURCE_ROOT),
      services,
    });
    await dispatcher.trigger(
      workflow,
      { id: 1 },
      { eventKey: 'source', manually: true },
    );
    await dispatcher.drain();
    const execution = await findRun(database, 'source');
    expect(
      (await listNodeRuns(database, execution.id as number))[0].result,
    ).toEqual({
      received: { id: 1 },
    });
  });

  it('rejects a source symlink that escapes the workflow root', async () => {
    const link = path.join(SOURCE_ROOT, 'escaped.mjs');
    await fs.rm(link, { force: true });
    await fs.symlink(path.join(OUTSIDE_ROOT, 'secret.mjs'), link);
    try {
      const workflow = await createTestWorkflow(database, {
        key: 'escaped',
        nodes: [{ key: 'run', type: 'run', config: { module: './escaped' } }],
      });
      const dispatcher = new Dispatcher({
        database,
        instructions: runInstructions(),
        resolveWorkflowResourceRoot: () => Promise.resolve(SOURCE_ROOT),
      });
      await dispatcher.trigger(
        workflow,
        {},
        { eventKey: 'escaped', manually: true },
      );
      await dispatcher.drain();
      expect((await findRun(database, 'escaped')).status).toBe(
        EXECUTION_STATUS.ERROR,
      );
    } finally {
      await fs.rm(link, { force: true });
    }
  });

  it('fails clearly without a resource root', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'unbound',
      nodes: [{ key: 'run', type: 'run', config: { module: './missing' } }],
    });
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
    });
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'unbound', manually: true },
    );
    await dispatcher.drain();
    const execution = await findRun(database, 'unbound');
    expect(execution.status).toBe(EXECUTION_STATUS.ERROR);
    expect(
      (await listNodeRuns(database, execution.id as number))[0].error,
    ).toMatch(/no workflow resource root/);
  });

  it('publishes completion for the same attempt and resumes a condition branch', async () => {
    const resourceRoot = await createArtifactRoot({
      './value': 'export function run() { return 42; }',
      './take-branch': 'export function run() { return true; }',
    });
    const workflow = await createTestWorkflow(database, {
      key: 'queued-branch',
      nodes: [
        {
          key: 'condition',
          type: 'condition',
          config: { module: './take-branch' },
          downstreamKey: 'after',
        },
        {
          key: 'run',
          type: 'run',
          config: { module: './value' },
          upstreamKey: 'condition',
          branchKey: 'yes',
        },
        { key: 'after', type: 'pending', upstreamKey: 'condition' },
      ],
    });
    const tasks: WorkflowQueueTask[] = [];
    const dispatcher = new Dispatcher({
      database,
      instructions: new Map<string, WorkflowInstructionClass>([
        ['run', RunInstruction],
        ['condition', ConditionInstruction],
        ['pending', pendingInstruction],
      ]),
      resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
      services,
      queue: {
        publish: async (task) => {
          tasks.push(task);
        },
      },
    });
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'queued-branch', manually: true },
    );
    await dispatcher.drain();
    const execution = await findRun(database, 'queued-branch');
    expect(execution.status).toBe(EXECUTION_STATUS.STARTED);
    // The script has finished, but its outcome is only a request until the
    // Processor applies it: the node run is still pending.
    expect(await listNodeRuns(database, execution.id)).toEqual([
      { nodeKey: 'condition', status: NODE_RUN_STATUS.RESOLVED, result: true },
      { nodeKey: 'run', status: NODE_RUN_STATUS.PENDING, result: null },
    ]);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      executionId: execution.id,
      nodeRunId: expect.anything(),
      resumeRequestId: expect.anything(),
    });
    await dispatcher.dispatch(tasks[0]);
    await dispatcher.dispatch(tasks[0]);
    expect(await listNodeRuns(database, execution.id)).toEqual([
      { nodeKey: 'condition', status: NODE_RUN_STATUS.RESOLVED, result: true },
      { nodeKey: 'run', status: NODE_RUN_STATUS.RESOLVED, result: 42 },
      { nodeKey: 'after', status: NODE_RUN_STATUS.PENDING, result: null },
    ]);
  });

  it('yields before invoking code and resumes downstream with its result', async () => {
    const release = Promise.withResolvers<void>();
    const info = vi.fn();
    const resourceRoot = await createArtifactRoot({
      './slow':
        'export async function run(args, { services, logger }) { logger.info("started"); await services.resolve(); return args; }',
      './next': 'export function run(args) { return args; }',
    });
    const workflow = await createTestWorkflow(database, {
      key: 'yield',
      nodes: [
        {
          key: 'run',
          type: 'run',
          config: { module: './slow', args: { id: 7 } },
          downstreamKey: 'next',
        },
        {
          key: 'next',
          type: 'run',
          config: {
            module: './next',
            args: { previous: '{{$nodeResults.run.id}}' },
          },
          upstreamKey: 'run',
        },
      ],
    });
    const resolve = vi.fn(() => release.promise);
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
      resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
      services: { has: () => true, resolve: <T>() => resolve() as T },
      logger: { debug: vi.fn(), info, warn: vi.fn(), error: vi.fn() },
    });
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'yield', manually: true },
    );
    expect(resolve).not.toHaveBeenCalled();
    const execution = await findRun(database, 'yield');
    expect(execution.status).toBe(EXECUTION_STATUS.STARTED);
    expect(await listNodeRuns(database, execution.id)).toEqual([
      { nodeKey: 'run', status: NODE_RUN_STATUS.PENDING, result: null },
    ]);
    release.resolve();
    await dispatcher.drain();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect((await findRun(database, 'yield')).status).toBe(
      EXECUTION_STATUS.RESOLVED,
    );
    expect(await listNodeRuns(database, execution.id)).toEqual([
      { nodeKey: 'run', status: NODE_RUN_STATUS.RESOLVED, result: { id: 7 } },
      {
        nodeKey: 'next',
        status: NODE_RUN_STATUS.RESOLVED,
        result: { previous: 7 },
      },
    ]);
    expect(dispatcher.idle).toBe(true);
  });

  describe('durable background work', () => {
    /** A Dispatcher whose deliveries are recorded and never made: a worker about to stop. */
    function stoppingWorker(resourceRoot: string) {
      const tasks: WorkflowQueueTask[] = [];
      const dispatcher = new Dispatcher({
        database,
        instructions: new Map(coreInstructions),
        resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
        services,
        queue: { publish: async (task) => void tasks.push(task) },
      });
      return { dispatcher, tasks };
    }

    /** The Dispatcher of the process that starts after the first one stopped. */
    function nextWorker(resourceRoot: string) {
      return new Dispatcher({
        database,
        instructions: new Map(coreInstructions),
        resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
        services,
      });
    }

    async function backgroundRequest(runId: WorkflowId) {
      const row = await testStore(database).resumeRequests.findOne({
        filter: { workflowRunId: asIdFilter(runId), instructionType: 'run' },
      });
      if (!row) throw new Error('No background request');
      return row;
    }

    it('runs a script whose worker stopped after the checkpoint and before starting it', async () => {
      type Calls = { __durableCalls?: string[] };
      const scope = globalThis as Calls;
      scope.__durableCalls = [];
      const resourceRoot = await createArtifactRoot({
        './value':
          'export function run(_args, options) { globalThis.__durableCalls.push(options.idempotencyKey); return 42; }',
      });
      const workflow = await createTestWorkflow(database, {
        key: 'stopped-before-script',
        nodes: [
          { key: 'hold', type: 'wait', downstreamKey: 'run' },
          {
            key: 'run',
            type: 'run',
            config: { module: './value' },
            upstreamKey: 'hold',
            downstreamKey: 'done',
          },
          { key: 'done', type: 'terminate', config: {}, upstreamKey: 'run' },
        ],
      });
      const first = stoppingWorker(resourceRoot);
      await first.dispatcher.trigger(
        workflow,
        {},
        { eventKey: 'stopped-before-script', manually: true },
      );
      const execution = await findRun(database, 'stopped-before-script');
      const [hold] = await testStore(database).nodeRuns.findMany({
        filter: { workflowRunId: asIdFilter(execution.id) },
      });
      const receipt = await first.dispatcher.resumeRequests.submit({
        runId: execution.id,
        nodeRunId: hold.id as number,
        nodeKey: 'hold',
        instructionType: 'wait',
        idempotencyKey: 'decision',
        payload: {
          status: NODE_RUN_STATUS.RESOLVED,
          result: null,
          error: null,
        },
      });
      if (receipt.status !== 'accepted') throw new Error('Not accepted');
      // The wait is applied and the run node stored as pending; the delivery of
      // its script is the last thing the worker does before it stops.
      await first.dispatcher.dispatch(first.tasks.at(-1)!);
      await first.dispatcher.drain();
      expect(await listNodeRuns(database, execution.id)).toEqual([
        { nodeKey: 'hold', status: NODE_RUN_STATUS.RESOLVED, result: null },
        { nodeKey: 'run', status: NODE_RUN_STATUS.PENDING, result: null },
      ]);
      expect(await backgroundRequest(execution.id)).toMatchObject({
        state: 'executing',
        claimToken: null,
      });
      expect(scope.__durableCalls).toEqual([]);

      const second = nextWorker(resourceRoot);
      expect(await second.recover()).toBe(1);
      await second.drain();

      expect(scope.__durableCalls).toHaveLength(1);
      expect(await listNodeRuns(database, execution.id)).toEqual([
        { nodeKey: 'hold', status: NODE_RUN_STATUS.RESOLVED, result: null },
        { nodeKey: 'run', status: NODE_RUN_STATUS.RESOLVED, result: 42 },
        { nodeKey: 'done', status: NODE_RUN_STATUS.RESOLVED, result: null },
      ]);
      expect((await findRun(database, 'stopped-before-script')).status).toBe(
        EXECUTION_STATUS.RESOLVED,
      );
      expect(await backgroundRequest(execution.id)).toMatchObject({
        state: 'consumed',
      });
      delete scope.__durableCalls;
    });

    it('runs a script again, under the same key, when its worker stopped while running it', async () => {
      type Calls = { __rerunKeys?: string[] };
      const scope = globalThis as Calls;
      scope.__rerunKeys = [];
      const resourceRoot = await createArtifactRoot({
        './value':
          'export function run(_args, options) { globalThis.__rerunKeys.push(options.idempotencyKey); return 7; }',
      });
      const workflow = await createTestWorkflow(database, {
        key: 'stopped-in-script',
        nodes: [{ key: 'run', type: 'run', config: { module: './value' } }],
      });
      const first = stoppingWorker(resourceRoot);
      await first.dispatcher.trigger(
        workflow,
        {},
        { eventKey: 'stopped-in-script', manually: true },
      );
      await first.dispatcher.drain();
      const execution = await findRun(database, 'stopped-in-script');
      const request = await backgroundRequest(execution.id);
      // Claimed by a worker that then stopped renewing the claim.
      await testStore(database).resumeRequests.updateMany({
        filter: { id: request.id as number },
        values: {
          claimToken: 'stopped-worker',
          claimedAt: '2020-01-01T00:00:00.000Z',
          attempts: 1,
        },
      });

      const second = nextWorker(resourceRoot);
      expect(await second.recoverResumeRequests({ gracePeriod: 0 })).toBe(1);
      await second.drain();

      expect(scope.__rerunKeys).toEqual([request.idempotencyKey]);
      expect(await listNodeRuns(database, execution.id)).toEqual([
        { nodeKey: 'run', status: NODE_RUN_STATUS.RESOLVED, result: 7 },
      ]);
      delete scope.__rerunKeys;
    });

    it('runs a script later when its worker could not prepare it, instead of applying an empty result', async () => {
      type Calls = { __preparedCalls?: number };
      const scope = globalThis as Calls;
      scope.__preparedCalls = 0;
      const resourceRoot = await createArtifactRoot({
        './value':
          'export function run() { globalThis.__preparedCalls += 1; return 9; }',
      });
      const workflow = await createTestWorkflow(database, {
        key: 'unprepared-script',
        nodes: [{ key: 'run', type: 'run', config: { module: './value' } }],
      });
      const first = stoppingWorker(resourceRoot);
      await first.dispatcher.trigger(
        workflow,
        {},
        { eventKey: 'unprepared-script', manually: true },
      );
      await first.dispatcher.drain();
      const execution = await findRun(database, 'unprepared-script');

      // The next worker fails once to load what the script needs.
      let unavailable = true;
      const second = new Dispatcher({
        database,
        instructions: new Map(coreInstructions),
        resolveWorkflowResourceRoot: () => {
          if (!unavailable) return Promise.resolve(resourceRoot);
          unavailable = false;
          return Promise.reject(new Error('storage unavailable'));
        },
        services,
      });
      await second.recoverResumeRequests({ gracePeriod: 0 });
      await second.drain();

      // The script never ran, so there is no result to apply: the work waits
      // to be run again, with the attempt counted.
      expect(scope.__preparedCalls).toBe(0);
      expect(await backgroundRequest(execution.id)).toMatchObject({
        state: 'executing',
        claimToken: null,
        claimedAt: null,
        attempts: 1,
      });
      expect(await listNodeRuns(database, execution.id)).toEqual([
        { nodeKey: 'run', status: NODE_RUN_STATUS.PENDING, result: null },
      ]);

      await second.recoverResumeRequests({ gracePeriod: 0 });
      await second.drain();
      expect(scope.__preparedCalls).toBe(1);
      expect(await listNodeRuns(database, execution.id)).toEqual([
        { nodeKey: 'run', status: NODE_RUN_STATUS.RESOLVED, result: 9 },
      ]);
      expect((await findRun(database, 'unprepared-script')).status).toBe(
        EXECUTION_STATUS.RESOLVED,
      );
      delete scope.__preparedCalls;
    });

    it('fails the node instead of starting a script that was interrupted too often', async () => {
      type Calls = { __exhaustedCalls?: number };
      const scope = globalThis as Calls;
      scope.__exhaustedCalls = 0;
      const resourceRoot = await createArtifactRoot({
        './value':
          'export function run() { globalThis.__exhaustedCalls += 1; return 1; }',
      });
      const workflow = await createTestWorkflow(database, {
        key: 'interrupted-script',
        nodes: [{ key: 'run', type: 'run', config: { module: './value' } }],
      });
      const first = stoppingWorker(resourceRoot);
      await first.dispatcher.trigger(
        workflow,
        {},
        { eventKey: 'interrupted-script', manually: true },
      );
      await first.dispatcher.drain();
      const execution = await findRun(database, 'interrupted-script');
      const request = await backgroundRequest(execution.id);
      await testStore(database).resumeRequests.updateMany({
        filter: { id: request.id as number },
        values: { attempts: MAX_RESUME_ATTEMPTS },
      });

      const second = nextWorker(resourceRoot);
      await second.recoverResumeRequests({ gracePeriod: 0 });
      await second.drain();

      expect(scope.__exhaustedCalls).toBe(0);
      const finished = await findRun(database, 'interrupted-script');
      expect(finished.status).toBe(EXECUTION_STATUS.ERROR);
      const [nodeRun] = await testStore(database).nodeRuns.findMany({
        filter: { workflowRunId: asIdFilter(execution.id) },
      });
      expect(nodeRun).toMatchObject({
        status: NODE_RUN_STATUS.ERROR,
        error: expect.stringContaining('interrupted 5 times'),
      });
      delete scope.__exhaustedCalls;
    });
  });

  it('keeps a replaced execution from completing the node an overwriting rerun restarted', async () => {
    type Gates = { __rerunCalls?: number; __rerunGates?: Promise<void>[] };
    const scope = globalThis as Gates;
    const releases: Array<() => void> = [];
    scope.__rerunCalls = 0;
    scope.__rerunGates = [0, 1].map(
      () => new Promise<void>((resolve) => void releases.push(resolve)),
    );
    const resourceRoot = await createArtifactRoot({
      './gated': `export async function run() {
        const call = (globalThis.__rerunCalls += 1);
        await globalThis.__rerunGates[call - 1];
        return call === 1 ? 'old' : 'new';
      }`,
    });
    const workflow = await createTestWorkflow(database, {
      key: 'rerun-race',
      nodes: [{ key: 'run', type: 'run', config: { module: './gated' } }],
    });
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
      resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
      services,
      logger,
    });
    try {
      await dispatcher.trigger(
        workflow,
        {},
        { eventKey: 'rerun-race', manually: true },
      );
      await vi.waitFor(() => expect(scope.__rerunCalls).toBe(1));
      const execution = await findRun(database, 'rerun-race');
      const [before] = await testStore(database).nodeRuns.findMany({
        filter: { workflowRunId: asIdFilter(execution.id) },
      });

      // The node is run again under the same id while the first script is
      // still working, and the second script starts.
      await dispatcher.dispatch({
        executionId: execution.id,
        rerun: { nodeKey: 'run', overwrite: true },
      });
      await vi.waitFor(() => expect(scope.__rerunCalls).toBe(2));
      const [restarted] = await testStore(database).nodeRuns.findMany({
        filter: { workflowRunId: asIdFilter(execution.id) },
      });
      expect(restarted.id).toBe(before.id);
      expect(restarted.status).toBe(NODE_RUN_STATUS.PENDING);

      // The rerun refused the first execution's request in its checkpoint.
      const requests = await testStore(database).resumeRequests.findMany({
        filter: { workflowRunId: asIdFilter(execution.id) },
        sort: (sort) => sort.field('createdAt').asc(),
        select: (select) => select.fields('state', 'reason'),
      });
      expect(requests).toEqual([
        { state: 'rejected', reason: 'stale' },
        { state: 'executing', reason: null },
      ]);

      // The first script finishes while the second execution waits: its result
      // belongs to the execution that was replaced and is dropped.
      releases[0]();
      await vi.waitFor(() =>
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('the result is dropped'),
          expect.anything(),
        ),
      );
      expect(await listNodeRuns(database, execution.id)).toEqual([
        { nodeKey: 'run', status: NODE_RUN_STATUS.PENDING, result: null },
      ]);

      releases[1]();
      await dispatcher.drain();
      expect(await listNodeRuns(database, execution.id)).toEqual([
        { nodeKey: 'run', status: NODE_RUN_STATUS.RESOLVED, result: 'new' },
      ]);
      expect((await findRun(database, 'rerun-race')).status).toBe(
        EXECUTION_STATUS.RESOLVED,
      );
    } finally {
      releases.forEach((release) => release());
      await dispatcher.drain();
      delete scope.__rerunCalls;
      delete scope.__rerunGates;
    }
  });

  it('refuses a recorded result whose execution is not the one pending', async () => {
    const resourceRoot = await createArtifactRoot({
      './value': 'export function run() { return 42; }',
    });
    const workflow = await createTestWorkflow(database, {
      key: 'foreign-execution',
      nodes: [{ key: 'run', type: 'run', config: { module: './value' } }],
    });
    const tasks: WorkflowQueueTask[] = [];
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
      resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
      services,
      queue: { publish: async (task) => void tasks.push(task) },
    });
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'foreign-execution', manually: true },
    );
    await dispatcher.drain();
    expect(tasks).toHaveLength(1);
    const requestId = tasks[0].resumeRequestId as number;
    // The recorded result claims an earlier execution of the same node run,
    // as one reported just before a rerun restarted it would.
    const request = await testStore(database).resumeRequests.findOne({
      filter: { id: requestId },
    });
    await testStore(database).resumeRequests.updateMany({
      filter: { id: requestId },
      values: {
        payload: {
          ...(request?.payload as object),
          startedAt: '2020-01-01T00:00:00.000Z',
        },
      },
    });

    await dispatcher.dispatch(tasks[0]);
    expect(
      await testStore(database).resumeRequests.findOne({
        filter: { id: requestId },
        select: (select) => select.fields('state', 'reason', 'slot'),
      }),
    ).toEqual({ state: 'rejected', reason: 'stale', slot: null });
    const execution = await findRun(database, 'foreign-execution');
    expect(execution.status).toBe(EXECUTION_STATUS.STARTED);
    expect(await listNodeRuns(database, execution.id)).toEqual([
      { nodeKey: 'run', status: NODE_RUN_STATUS.PENDING, result: null },
    ]);
  });

  it('does not start a script whose node could not be stored as pending', async () => {
    const resourceRoot = await createArtifactRoot({
      './value':
        'globalThis.__lostCheckpointCalls = (globalThis.__lostCheckpointCalls ?? 0) + 1; export function run() { return 1; }',
    });
    const workflow = await createTestWorkflow(database, {
      key: 'lost-checkpoint',
      nodes: [{ key: 'run', type: 'run', config: { module: './value' } }],
    });
    const dispatcher = new Dispatcher({
      database,
      instructions: runInstructions(),
      resolveWorkflowResourceRoot: () => Promise.resolve(resourceRoot),
      services,
    });
    const original = database.transaction.bind(database);
    let calls = 0;
    vi.spyOn(database, 'transaction').mockImplementation((async (
      ...args: Parameters<typeof original>
    ) => {
      calls += 1;
      // The first transaction creates the run, the second is the checkpoint.
      if (calls === 2) throw new Error('database unavailable');
      return original(...args);
    }) as typeof original);
    await dispatcher.trigger(
      workflow,
      {},
      { eventKey: 'lost-checkpoint', manually: true },
    );
    await dispatcher.drain();
    expect(
      (globalThis as { __lostCheckpointCalls?: number }).__lostCheckpointCalls,
    ).toBeUndefined();
    // The failure is the run's: it ends as an error rather than hanging.
    expect((await findRun(database, 'lost-checkpoint')).status).toBe(
      EXECUTION_STATUS.ERROR,
    );
  });
});

describe('validateRunConfig', () => {
  it('accepts an extensionless relative module and object args', () => {
    expect(
      validateRunConfig({
        module: './server/record-step',
        args: { id: '{{$input.id}}' },
      }),
    ).toBeNull();
  });

  it('rejects missing, templated, unsafe, and extension-bearing modules', () => {
    expect(validateRunConfig({})).toMatchObject({ module: expect.any(String) });
    for (const module of [
      './server/{{$parameters.name}}',
      '../outside',
      './server/file.ts',
      'server/bare',
      './server/../outside',
    ]) {
      expect(validateRunConfig({ module })).toMatchObject({
        module: expect.any(String),
      });
    }
    expect(validateRunConfig({ module: './valid', args: [] })).toMatchObject({
      args: expect.any(String),
    });
  });
});

describe('assertWorkflowRunResult', () => {
  it('accepts JSON values and repeated non-circular references', () => {
    const shared = { id: 1 };
    expect(() =>
      assertWorkflowRunResult({
        values: [1, null, false],
        left: shared,
        right: shared,
      }),
    ).not.toThrow();
  });
});
