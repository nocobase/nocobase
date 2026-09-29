import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, expect, it } from 'vitest';

import { WorkflowEngine } from '../../server/engine/index.js';
import { createWorkflowRunServices } from '../../server/engine/run-services.js';
import flow from '../dsl/fixtures/instruction-coverage/workflow.js';
import {
  createTestWorkflow,
  findRun,
  jobTrace,
  listNodeRuns,
} from '../helpers.js';
import {
  createIntegrationDatabase,
  createTestPrefix,
  dropEverything,
  migrate,
} from './helpers.js';

/**
 * The handler modules the fixture names.
 *
 * The fixture's `defineHandler()` type arguments describe these modules. Only
 * the module path reaches the definition; the engine loads the implementation
 * from the workflow's resource root at execution time.
 */
const RUNTIME_MODULES: Readonly<Record<string, string>> = {
  'initialize.js':
    'export async function run({ input }) { return { recorded: true, route: input.route }; }\n',
  'check.js':
    "export async function run({ input }) { return input.route === 'yes'; }\n",
  'record.js':
    'export async function run({ nodeResults }) { return { recorded: Boolean(nodeResults.initialize.recorded) }; }\n',
};

let database: Awaited<ReturnType<typeof createIntegrationDatabase>> | null =
  null;
let prefix = '';
let resourceRoot = '';

afterEach(async () => {
  if (database) {
    await dropEverything(database, prefix);
    await database.destroy();
    database = null;
  }
  if (resourceRoot) await rm(resourceRoot, { recursive: true, force: true });
});

async function runCoverageWorkflow(
  route: string,
  eventKey: string,
): Promise<void> {
  prefix = createTestPrefix();
  database = createIntegrationDatabase(prefix);
  await migrate(database, prefix);
  resourceRoot = await mkdtemp(path.join(os.tmpdir(), 'workflow-dsl-engine-'));
  const workflowRoot = path.join(
    resourceRoot,
    'instruction-coverage',
    'runtime',
  );
  await mkdir(workflowRoot, { recursive: true });
  for (const [name, code] of Object.entries(RUNTIME_MODULES))
    await writeFile(path.join(workflowRoot, name), code);

  const ir = flow.compile();
  const definition = await createTestWorkflow(database, {
    key: 'instruction-coverage',
    nodes: ir.nodes.map((node) => ({
      key: node.key,
      type: node.type,
      config: node.config,
      upstreamKey: node.upstreamKey,
      downstreamKey: node.downstreamKey,
      branchKey: node.branchKey,
    })),
  });
  const engine = new WorkflowEngine({
    database,
    developmentResourceRoot: resourceRoot,
    services: createWorkflowRunServices(new ServiceContainer()),
    timeoutReaper: false,
  });
  await engine.initialize();
  try {
    await engine.trigger(definition, { route }, { eventKey });
    await engine.idle;
  } finally {
    await engine.dispose();
  }
}

it('runs the DSL coverage definition through the real Workflow Engine', async () => {
  await runCoverageWorkflow('yes', 'dsl-engine-yes');
  const run = await findRun(database!, 'dsl-engine-yes');
  expect(await jobTrace(database!, String(run.id))).toEqual([
    'initialize',
    'route',
    'record',
  ]);
  // The handler receives upstream results through its workflow context.
  expect(
    (await listNodeRuns(database!, String(run.id))).find(
      (nodeRun) => nodeRun.nodeKey === 'record',
    )?.result,
  ).toEqual({ recorded: true });
});

it('takes the terminate branch when the condition module returns false', async () => {
  await runCoverageWorkflow('no', 'dsl-engine-no');
  const run = await findRun(database!, 'dsl-engine-no');
  expect(await jobTrace(database!, String(run.id))).toEqual([
    'initialize',
    'route',
    'stop',
  ]);
});
