import { expect, it } from 'vitest';
import flow from './fixtures/instruction-coverage/workflow.js';
import { materializeWorkflowSource } from '../../server/loader/source-materializer.js';

it('projects the DSL Flat IR through the production materializer shape', async () => {
  const workflows: Array<Record<string, unknown>> = [];
  const nodes: Array<Record<string, unknown>> = [];
  const store = {
    workflows: {
      findMany: async () => workflows,
      createOne: async ({ values }: { values: Record<string, unknown> }) => {
        const record = { id: 7, ...values };
        workflows.push(record);
        return { record };
      },
    },
    nodes: {
      createMany: async ({
        values,
      }: {
        values: Array<Record<string, unknown>>;
      }) => {
        nodes.push(...values);
      },
    },
  } as never;
  const result = await materializeWorkflowSource(
    {
      key: 'instruction-coverage',
      hash: 'demo-hash',
      filePath: 'workflow.ts',
      ir: flow.compile(),
    },
    store,
  );
  expect(result.action).toBe('created');
  expect(nodes.map((node) => node.type)).toEqual([
    'run',
    'condition',
    'terminate',
    'run',
  ]);
  expect(nodes.find((node) => node.key === 'stop')).toMatchObject({
    upstreamKey: 'route',
    branchKey: 'no',
  });
});
