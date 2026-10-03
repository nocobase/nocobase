import { afterEach, expect, it } from 'vitest';
import { workflowStore } from '../../server/collections/store.js';
import { materializeWorkflowSource } from '../../server/loader/source-materializer.js';
import flow from '../dsl/fixtures/instruction-coverage/workflow.js';
import {
  startIntegrationDatabase,
  type IntegrationDatabase,
} from './helpers.js';

let fixture: IntegrationDatabase | null = null;
afterEach(async () => {
  await fixture?.destroy();
  fixture = null;
});

it('materializes the DSL coverage workflow into SQLite workflow and node records', async () => {
  fixture = await startIntegrationDatabase();
  await fixture.migrate();
  const database = fixture.database;
  const result = await materializeWorkflowSource(
    {
      key: 'instruction-coverage',
      hash: 'dsl-demo-v1',
      filePath: 'workflow.ts',
      ir: flow.compile(),
    },
    workflowStore(database),
  );
  expect(result.action).toBe('created');
  const store = workflowStore(database);
  const workflow = await store.workflows.findOne({
    filter: { key: 'instruction-coverage' },
  });
  const nodes = await store.nodes.findMany({
    filter: { workflowId: workflow?.id },
    sort: (sort) => sort.field('id').asc(),
  });
  expect(workflow).toMatchObject({
    key: 'instruction-coverage',
    hash: 'dsl-demo-v1',
    title: 'Instruction coverage',
  });
  // The authored object schema reaches the row as the flat declaration map the
  // parameter editor and the value resolver both read.
  expect(
    typeof workflow?.parametersSchema === 'string'
      ? JSON.parse(workflow.parametersSchema)
      : workflow?.parametersSchema,
  ).toEqual({ limit: { type: 'number' } });
  expect(nodes.map((node) => node.type)).toEqual([
    'run',
    'condition',
    'terminate',
    'run',
  ]);
  expect(nodes.find((node) => node.key === 'stop')).toMatchObject({
    branchKey: 'no',
    upstreamKey: 'route',
  });
});

it('stores typed workflow options unchanged when materializing an artifact', async () => {
  const { workflow } = await import('../../dsl/index.js');
  const { buildWorkflowArtifact } =
    await import('../../build/artifact-builder.js');
  fixture = await startIntegrationDatabase();
  await fixture.migrate();
  const database = fixture.database;
  const options = { timeout: 0.5, stackLimit: 3 };
  const definition = workflow({ key: 'options', title: 'Options', options });
  const artifact = buildWorkflowArtifact({
    key: definition.key,
    flatIr: definition.compile(),
  });
  await materializeWorkflowSource(
    {
      key: definition.key,
      hash: artifact.digest,
      filePath: 'workflow.json',
      ir: artifact.workflow,
    },
    workflowStore(database),
  );
  const row = await workflowStore(database).workflows.findOne({
    filter: { key: definition.key },
  });
  expect(
    typeof row?.options === 'string' ? JSON.parse(row.options) : row?.options,
  ).toEqual(options);
});
