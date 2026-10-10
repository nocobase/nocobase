import { describe, expect, it, vi } from 'vitest';

import {
  createWorkflowEventKey,
  shouldPollRuns,
  workflowApi,
} from '../client/workflow-management/data.js';
import { createLayoutCacheKey } from '../client/workflow-management/graph/layout-cache.js';
import { layoutWithElk } from '../client/workflow-management/graph/elk-layout.js';
import { configureWorkflowClient } from '../client/workflow-management/runtime.js';
import { createLayoutInput, projectWorkflowGraph } from '../client/index.js';

describe('workflow management', () => {
  it('routes vertical condition branches orthogonally in fixed visual order', async () => {
    const graph = projectWorkflowGraph({
      title: 'Amount routing example',
      inputSchema: { type: 'object' },
      nodes: [
        {
          key: 'checkAmount',
          type: 'condition',
          config: {},
          branches: {
            yes: [{ key: 'approvalPath', type: 'run', config: {} }],
            no: [{ key: 'directPath', type: 'run', config: {} }],
          },
        },
        { key: 'summarize', type: 'run', config: {} },
      ],
    });
    const result = await layoutWithElk(createLayoutInput(graph));
    const route = (branchKey: string) => {
      const edge = graph.edges.find(
        (candidate) =>
          candidate.source === 'node:checkAmount' &&
          candidate.branchKey === branchKey,
      );
      return result.routes.find((candidate) => candidate.id === edge?.id);
    };
    const noRoute = route('no');
    const yesRoute = route('yes');
    expect(noRoute?.points.length).toBeGreaterThanOrEqual(2);
    expect(yesRoute?.points.length).toBeGreaterThanOrEqual(2);
    expect(noRoute!.points[0].x).toBeLessThan(yesRoute!.points[0].x);
    for (const edgeRoute of result.routes) {
      for (let index = 1; index < edgeRoute.points.length; index += 1) {
        const previous = edgeRoute.points[index - 1];
        const point = edgeRoute.points[index];
        expect(point.x === previous.x || point.y === previous.y).toBe(true);
      }
    }
  });

  it('merges empty condition branches at the successor input port', async () => {
    const graph = projectWorkflowGraph({
      title: 'Empty branch example',
      inputSchema: { type: 'object' },
      nodes: [
        {
          key: 'checkAmount',
          type: 'condition',
          config: {},
          branches: { yes: [], no: [] },
        },
        { key: 'summarize', type: 'run', config: {} },
      ],
    });
    const result = await layoutWithElk(createLayoutInput(graph));
    const incomingRoutes = graph.edges
      .filter((edge) => edge.target === 'node:summarize')
      .map((edge) => result.routes.find((route) => route.id === edge.id));
    expect(incomingRoutes).toHaveLength(2);
    const endpoints = incomingRoutes.map((route) => route?.points.at(-1));
    expect(endpoints[0]).toEqual(endpoints[1]);
    const successor = result.positions.find(
      (position) => position.id === 'node:summarize',
    );
    expect(endpoints[0]).toEqual({
      x: successor!.x + 120,
      y: successor!.y,
    });
  });

  it('uses compact spacing between vertical workflow layers', async () => {
    const graph = projectWorkflowGraph({
      title: 'Linear example',
      inputSchema: { type: 'object' },
      nodes: [
        { key: 'first', type: 'run', config: {} },
        { key: 'second', type: 'run', config: {} },
      ],
    });
    const result = await layoutWithElk(createLayoutInput(graph));
    const position = (id: string) =>
      result.positions.find((candidate) => candidate.id === id)!;
    expect(position('node:second').y - position('node:first').y - 88).toBe(56);
  });

  it('scopes the layout cache to the definition', () => {
    expect(
      createLayoutCacheKey({
        workflowId: '1',
        hash: 'v7',
        direction: 'RIGHT',
        dimensions: '220x80',
      }),
    ).toBe('1:v7:RIGHT:220x80:1');
  });

  it('polls only non-terminal runs', () => {
    expect(
      shouldPollRuns([
        {
          id: '1',
          workflowId: '1',
          workflowKey: 'x',
          eventKey: 'e',
          status: 0,
          createdAt: '',
        },
      ]),
    ).toBe(true);
    expect(
      shouldPollRuns([
        {
          id: '1',
          workflowId: '1',
          workflowKey: 'x',
          eventKey: 'e',
          status: 1,
          createdAt: '',
        },
      ]),
    ).toBe(false);
  });

  it('uses the application client for workflow API requests', async () => {
    const request = vi.fn().mockResolvedValue({ data: { id: 'run-1' } });
    configureWorkflowClient({ request });

    await expect(
      workflowApi.execute('workflow-1', { approved: true }, 'event-1'),
    ).resolves.toEqual({ id: 'run-1' });
    expect(request).toHaveBeenCalledWith({
      headers: { 'event-key': 'event-1' },
      json: { input: { approved: true } },
      method: 'POST',
      path: '/workflows/workflow-1/run',
    });
  });

  it('deduplicates concurrent workflow reads', async () => {
    let resolveRequest: ((value: { data: [] }) => void) | undefined;
    const request = vi.fn(
      () =>
        new Promise<{ data: [] }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    configureWorkflowClient({ request });

    const first = workflowApi.workflows();
    const second = workflowApi.workflows();
    expect(request).toHaveBeenCalledOnce();
    resolveRequest?.({ data: [] });
    await expect(Promise.all([first, second])).resolves.toEqual([[], []]);
  });

  it('creates an event key when randomUUID is unavailable', () => {
    expect(createWorkflowEventKey(() => 'event-1')).toBe('event-1');
    expect(createWorkflowEventKey(null)).toMatch(/^manual-[a-z0-9]+-/);
  });
});
