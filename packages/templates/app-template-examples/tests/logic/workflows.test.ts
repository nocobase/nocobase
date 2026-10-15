// @vitest-environment node
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { lifecycleExampleServiceToken } from '@nocobase/app-plugin-lifecycle-example/server';
import { describe, expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';
import type {
  WorkflowDefinition,
  WorkflowExecutionDetail,
  WorkflowExecutionPage,
  WorkflowSummary,
} from '../../shared/workflows.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
  },
});

describe('workflow management through the registered application routes', () => {
  test('requires authentication before validation and documents all sixteen workflows', async ({
    testApp,
    request,
  }) => {
    for (const path of [
      '/workflows/definitions',
      '/workflows/definitions/invalid',
      '/workflows/executions?page=bad',
      '/workflows/executions/invalid/bad',
    ])
      expect((await request(path)).status).toBe(401);
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const catalog = await session.fetch('/workflows/definitions');
    expect(catalog.status).toBe(200);
    const { data } = (await catalog.json()) as { data: WorkflowSummary[] };
    expect(data).toHaveLength(16);
    expect(data.filter((item) => item.source === 'lifecycle')).toHaveLength(10);
    expect(data.filter((item) => item.source === 'office')).toHaveLength(6);
    expect(data.map((item) => item.id)).toContain('office.executorTasks');
    expect(new Set(data.map((item) => item.id)).size).toBe(16);
    expect(data.every((workflow) => workflow.executionCount === 0)).toBe(true);
    for (const workflow of data) {
      const response = await session.fetch(
        `/workflows/definitions/${workflow.id}`,
      );
      expect(response.status).toBe(200);
      const definition = (
        (await response.json()) as { data: WorkflowDefinition }
      ).data;
      expect(definition.description.name).toBe(workflow.name);
      expect(definition.description.states).toHaveLength(workflow.states);
      expect(definition.description.transitions).toHaveLength(
        workflow.transitions,
      );
    }
    expect(
      (await session.fetch('/workflows/definitions/lifecycle.missing')).status,
    ).toBe(404);
    expect(
      (await session.fetch('/workflows/executions?workflowId=office.missing'))
        .status,
    ).toBe(404);
    expect((await session.fetch('/workflows/executions?page=0')).status).toBe(
      400,
    );
    expect(
      (await session.fetch('/workflows/executions/lifecycle.tickets/bad'))
        .status,
    ).toBe(400);
    expect(
      (await session.fetch('/workflows/executions/lifecycle.tickets/999999'))
        .status,
    ).toBe(404);
  });

  test('pages beyond one hundred records and returns creation, loops and parameter bindings', async ({
    testApp,
  }) => {
    const service = testApp.application.container.resolve(
      lifecycleExampleServiceToken,
    );
    const runtime = service.runtime;
    const ids: string[] = [];
    for (let index = 0; index < 105; index += 1) {
      const { record } = await runtime.create(
        'reviewerDemo',
        {
          applicantId: 'lin',
          candidates: [],
          decidedBy: null,
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
        },
        { actor: { id: 'lin' } },
      );
      ids.push(String(record.id));
    }
    const id = ids[0];
    await runtime.fire('reviewerDemo', id, 'submit', {
      actor: { id: 'lin' },
      requestId: 'workflow-submit',
    });
    await runtime.fire('reviewerDemo', id, 'withdraw', {
      actor: { id: 'lin' },
      requestId: 'workflow-withdraw',
    });
    await runtime.fire('reviewerDemo', id, 'submit', {
      actor: { id: 'lin' },
      requestId: 'workflow-submit-again',
    });
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const readPage = async (path: string) =>
      (await (await session.fetch(path)).json()) as WorkflowExecutionPage;
    const first = await readPage(
      '/workflows/executions?workflowId=lifecycle.reviewerDemo&page=1&pageSize=20',
    );
    expect(first.meta.total).toBe(105);
    const catalog = (await (
      await session.fetch('/workflows/definitions')
    ).json()) as { data: WorkflowSummary[] };
    expect(
      catalog.data.find((workflow) => workflow.id === 'lifecycle.reviewerDemo')
        ?.executionCount,
    ).toBe(first.meta.total);
    expect(
      catalog.data.find((workflow) => workflow.id === 'office.dataRequests')
        ?.executionCount,
    ).toBe(0);
    expect(first.data).toHaveLength(20);
    expect(first.data[0].recordId).toBe(ids[104]);
    const last = await readPage(
      '/workflows/executions?workflowId=lifecycle.reviewerDemo&page=6&pageSize=20',
    );
    expect(last.data).toHaveLength(5);
    expect(last.data.at(-1)?.recordId).toBe(ids[0]);
    const all = await readPage('/workflows/executions?page=6&pageSize=20');
    expect(all.meta.total).toBe(105);
    expect(all.data.map((item) => item.recordId)).toEqual(
      last.data.map((item) => item.recordId),
    );
    const oldest = await readPage(
      '/workflows/executions?order=oldest&pageSize=20',
    );
    expect(oldest.data[0].recordId).toBe(ids[0]);
    expect(oldest.data.at(-1)?.recordId).toBe(ids[19]);
    const oldestFiltered = await readPage(
      '/workflows/executions?workflowId=lifecycle.reviewerDemo&order=oldest&page=6&pageSize=20',
    );
    expect(oldestFiltered.data.map((row) => row.recordId)).toEqual(
      ids.slice(100),
    );
    const empty = await readPage(
      '/workflows/executions?workflowId=office.dataRequests',
    );
    expect(empty.data).toEqual([]);
    const response = await session.fetch(
      `/workflows/executions/lifecycle.reviewerDemo/${id}`,
    );
    expect(response.status).toBe(200);
    const detail = (
      (await response.json()) as { data: WorkflowExecutionDetail }
    ).data;
    expect(detail.workflow.executionCount).toBe(105);
    expect(detail.view.record.id).toBe(id);
    expect(detail.view.state).toBe('review');
    expect(
      detail.view.history.transitions.map((entry) => entry.transition),
    ).toEqual(['$create', 'submit', 'withdraw', 'submit']);
    expect(detail.view.history.transitions.map((entry) => entry.to)).toEqual([
      'draft',
      'review',
      'draft',
      'review',
    ]);
    expect(
      detail.description.parameterConfiguration?.groups.length,
    ).toBeGreaterThan(0);
  });
});
