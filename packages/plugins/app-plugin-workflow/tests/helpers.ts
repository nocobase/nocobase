import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  type BuilderExecOptions,
  type BuilderResult,
  type CollectionBuilder,
  type DatabaseManager,
  type Row,
} from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';

import type {
  JsonObject,
  WorkflowDefinition,
  WorkflowId,
  WorkflowNodeRun,
  WorkflowRun,
} from '../server/engine/types.js';
import {
  asId,
  asIdFilter,
  loadRun,
  loadWorkflow,
  nowInstant,
  serializeJson,
} from '../server/engine/utils.js';
import {
  workflowCollectionSchemas,
  workflowStore,
  type WorkflowStore,
} from '../server/collections/index.js';

export async function createWorkflowCollections(
  builder: CollectionBuilder,
  options: BuilderExecOptions = {},
): Promise<BuilderResult> {
  return builder.createCollections(
    workflowCollectionSchemas.map(({ name, define }) => ({
      name,
      definition: define,
    })),
    options,
  );
}

export type TestNodeInput = {
  key: string;
  type: string;
  config?: JsonObject;
  upstreamKey?: string | null;
  downstreamKey?: string | null;
  branchKey?: string | null;
};

export type TestWorkflowInput = {
  key: string;
  enabled?: boolean;
  options?: JsonObject;
  nodes: TestNodeInput[];
};

/**
 * A database of its own on the dialect the environment selects, with the
 * workflow collections created. `destroy()` closes and drops it.
 */
export async function createWorkflowTestDatabase(): Promise<TestDatabase> {
  const testDatabase = await createTestDatabase();
  try {
    await createWorkflowCollections(testDatabase.database.builder());
  } catch (error) {
    await testDatabase.destroy();
    throw error;
  }
  return testDatabase;
}

/** A row a test knows must exist; `findOne` returns `undefined` rather than throwing. */
export async function requireRow(
  row: Promise<Row | undefined>,
  description: string,
): Promise<Row> {
  const found = await row;
  if (!found) {
    throw new Error(`${description} was not found`);
  }
  return found;
}

/** The workflow collections of a test database, the way the plugin reaches them. */
export function testStore(database: DatabaseManager): WorkflowStore {
  return workflowStore(database);
}

export async function createTestWorkflow(
  database: DatabaseManager,
  input: TestWorkflowInput,
): Promise<WorkflowDefinition> {
  const store = testStore(database);
  const created = await store.workflows.createOne({
    values: {
      key: input.key,
      title: input.key,
      enabled: input.enabled ?? true,
      current: true,
      inputSchema: serializeJson({ type: 'object' }),
      parametersSchema: serializeJson({}),
      parameterValues: serializeJson({}),
      options: serializeJson(input.options ?? {}),
    },
    select: (select) => select.fields('id'),
  });
  const workflowId = asId(created.record.id);

  const [firstNode, ...otherNodes] = input.nodes.map((node) => ({
    workflowId: asIdFilter(workflowId),
    key: node.key,
    title: node.key,
    type: node.type,
    config: serializeJson(node.config ?? {}),
    options: serializeJson({}),
    upstreamKey: node.upstreamKey ?? null,
    downstreamKey: node.downstreamKey ?? null,
    branchKey: node.branchKey ?? null,
  }));
  if (firstNode) {
    await store.nodes.createMany({ values: [firstNode, ...otherNodes] });
  }

  const workflow = await loadWorkflow(store, workflowId);
  if (!workflow) {
    throw new Error(`Failed to load workflow "${input.key}"`);
  }
  return workflow;
}

export async function findRun(
  database: DatabaseManager,
  eventKey: string,
): Promise<Row> {
  const row = await testStore(database).runs.findOne({ filter: { eventKey } });
  if (!row) {
    throw new Error(`Run "${eventKey}" was not found`);
  }
  return row;
}

export async function listNodeRuns(
  database: DatabaseManager,
  runId: WorkflowId,
): Promise<
  Array<
    Pick<WorkflowNodeRun, 'nodeKey' | 'status' | 'result'> & { error?: string }
  >
> {
  const rows = await testStore(database).nodeRuns.findMany({
    filter: { workflowRunId: asIdFilter(runId) },
    select: (select) => select.fields('nodeKey', 'status', 'result', 'error'),
    sort: (sort) => sort.field('id').asc(),
  });
  return rows.map((row) => ({
    nodeKey: String(row.nodeKey),
    status: Number(row.status),
    result: row.result,
    ...(row.error == null ? {} : { error: String(row.error) }),
  }));
}

export type TestRunInput = {
  workflowId: WorkflowId;
  workflowKey: string;
  eventKey: string;
  status?: number | null;
  dispatched?: boolean;
  startedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  input?: unknown;
  hash?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
};

/** Inserts a run row directly, which is how a test stages "what a crashed process left behind". */
export async function insertTestRun(
  database: DatabaseManager,
  input: TestRunInput,
): Promise<WorkflowId> {
  const created = await testStore(database).runs.createOne({
    values: {
      workflowId: asIdFilter(input.workflowId),
      workflowKey: input.workflowKey,
      hash: input.hash ?? null,
      eventKey: input.eventKey,
      input: serializeJson(input.input ?? {}),
      parameters: serializeJson({}),
      status: input.status ?? null,
      dispatched: input.dispatched ?? false,
      stack: serializeJson([]),
      output: serializeJson(null),
      startedAt: input.startedAt ?? null,
      expiresAt: input.expiresAt ?? null,
      createdAt: input.createdAt ?? nowInstant(),
      manually: false,
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
    },
    select: (select) => select.fields('id'),
  });
  return asId(created.record.id);
}

/** Reads a run hydrated the way the engine sees it, so JSON columns are values and not text. */
export async function readRun(
  database: DatabaseManager,
  id: WorkflowId,
): Promise<WorkflowRun> {
  const run = await loadRun(testStore(database), id);
  if (!run) {
    throw new Error(`Run "${id}" was not found`);
  }
  return run;
}

/** Node keys of a run's node runs, in insertion order — the shape most path assertions want. */
export async function jobTrace(
  database: DatabaseManager,
  runId: WorkflowId,
): Promise<string[]> {
  const nodeRuns = await listNodeRuns(database, runId);
  return nodeRuns.map((nodeRun) => nodeRun.nodeKey);
}

export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for a condition');
}

const moduleRoots: string[] = [];

/**
 * Write handler modules into a throwaway package and return its root.
 *
 * Run and condition nodes both load their handler from the workflow's resource
 * root, so a test that exercises either one needs real files on disk. Keys are
 * package-relative specifiers without an extension, exactly as a node config
 * names them.
 */
export async function createModuleRoot(
  modules: Readonly<Record<string, string>>,
): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-modules-'));
  moduleRoots.push(root);
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  for (const [specifier, code] of Object.entries(modules)) {
    const target = path.join(root, `${specifier.replace(/^\.\//, '')}.js`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, code);
  }
  return root;
}

/** Remove every module root this file created. Call from `afterEach`. */
export async function removeModuleRoots(): Promise<void> {
  await Promise.all(
    moduleRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
}

/** A condition handler module that returns a fixed answer. */
export function constantCondition(value: boolean): string {
  return `export async function run() { return ${String(value)}; }\n`;
}

/** A condition handler module that compares one input field with a value. */
export function inputEquals(field: string, value: string): string {
  return `export async function run({ input }) { return input[${JSON.stringify(field)}] === ${JSON.stringify(value)}; }\n`;
}

/** A condition handler module that compares one input field against a limit. */
export function inputGreaterThan(field: string, limit: number): string {
  return `export async function run({ input }) { return Number(input[${JSON.stringify(field)}]) > ${limit}; }\n`;
}
