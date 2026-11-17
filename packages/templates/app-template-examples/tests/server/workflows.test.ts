import { parameterIdentity } from '@nocobase/lifecycle';
import { databaseManagerToken } from '@nocobase/db';
import type { OfficeWorkflowParameters } from '@nocobase/app-plugin-office-flows-example/client';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
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
  test('saves workflow-owned parameters and rejects unrelated groups', async ({
    testApp,
  }) => {
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const endpoint = (name: string) =>
      `/workflows/definitions/lifecycle.${name}/parameters?version=1`;
    const save = (name: string, values: unknown) =>
      session.fetch(endpoint(name), {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({
          kind: 'lifecycle',
          definition: name,
          values,
          expectedRevision: 0,
          requestId: `save-${name}`,
        }),
      });
    const values = {
      autoApproveLimit: 100,
      financeLimit: 1000,
    };
    const response = await save('expenses', values);
    expect(response.status).toBe(200);
    const read = async (name: string) =>
      (await (await session.fetch(endpoint(name))).json()) as {
        data: { groups: { key: string; revision: number; values: unknown }[] };
      };
    expect((await read('expenses')).data.groups[0]).toMatchObject({
      revision: 1,
      values,
    });
    expect((await read('tickets')).data.groups[0]).toMatchObject({
      revision: 0,
    });
    expect((await save('tickets', values)).status).toBe(400);
    expect((await save('orders', { paymentWindowMinutes: 9 })).status).toBe(
      200,
    );
    const runtime = testApp.application.container.resolve(
      lifecycleExampleServiceToken,
    ).runtime;
    expect(
      await runtime.resolveParameters('orders', {
        record: null,
        purpose: 'preview',
        transactionHandle: undefined,
      }),
    ).toMatchObject({ paymentWindowMinutes: 9 });
  });

  test('requires a concrete parameter version and rejects a cross-version draft', async ({
    testApp,
  }) => {
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    expect(
      (
        await session.fetch(
          '/workflows/definitions/lifecycle.expenses/parameters',
        )
      ).status,
    ).toBe(400);
    const response = await session.fetch(
      '/workflows/definitions/lifecycle.expenses/parameters?version=2',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({
          kind: 'lifecycle',
          definition: 'expenses',
          values: {},
          expectedRevision: 0,
          requestId: 'wrong-target',
        }),
      },
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { reason: 'PARAMETER_DEFINITION_MISMATCH' },
    });
  });

  test('reads an existing execution graph from its snapshot when current configuration is invalid', async ({
    testApp,
  }) => {
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const service = testApp.application.container.resolve(
      lifecycleExampleServiceToken,
    );
    const ticket = await service.createTicket(
      {
        subject: 'Snapshot',
        description: 'Original values',
        category: 'account',
        priority: 'high',
        failNotifications: 0,
      },
      'customer-li',
    );
    const database =
      testApp.application.container.resolve(databaseManagerToken);
    const previous = await database
      .repository('lifecycleExampleWorkflowParameters')
      .findOne({ filter: { id: 'lifecycle.tickets' } });
    const recordId = String(ticket.id);
    try {
      await database
        .repository('lifecycleExampleWorkflowParameters')
        .updateMany({
          filter: { id: 'lifecycle.tickets' },
          values: { values: { waitMinutes: 'invalid current value' } },
        });
      const response = await session.fetch(
        `/workflows/executions/lifecycle.tickets/${recordId}`,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        data: {
          parameters: { waitMinutes: 2 },
          view: { parameterValues: { waitMinutes: 2 } },
        },
      });
    } finally {
      await database
        .repository('lifecycleExampleWorkflowParameters')
        .updateMany({
          filter: { id: 'lifecycle.tickets' },
          values: { values: previous!.values },
        });
      await database
        .repository('lifecycleExampleTickets')
        .deleteMany({ filter: { id: Number(recordId) } });
      await database
        .repository('lifecycleExampleTransitions')
        .deleteMany({ filter: { lifecycle: 'tickets', recordId } });
      await database
        .repository('lifecycleExampleParameterSnapshots')
        .deleteMany({
          filter: { id: parameterIdentity('demo', 'tickets', recordId) },
        });
      await database.repository('lifecycleExampleParameterUsages').deleteMany({
        filter: { recordKey: parameterIdentity('demo', 'tickets', recordId) },
      });
    }
  });

  test('updates shared office departments through the parameter API and rejects stale or invalid writes', async ({
    testApp,
    request,
  }) => {
    const endpoint = (name: string) =>
      `/workflows/definitions/office.${name}/parameters?version=1`;
    expect((await request(endpoint('teamTasks'))).status).toBe(401);
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const read = async (name: string) =>
      (
        (await (await session.fetch(endpoint(name))).json()) as {
          data: OfficeWorkflowParameters;
        }
      ).data;
    const team = await read('teamTasks');
    const departments = team.organization!.departments.map((row, index) =>
      index === 0 ? { ...row, heads: ['xulei'] } : row,
    );
    const input = {
      kind: 'office',
      definition: 'teamTasks',
      values: team.values,
      expectedRevision: team.revision,
      organization: {
        departments,
        expectedRevision: team.organization!.revision,
      },
    };
    const save = (body: unknown) =>
      session.fetch(endpoint('teamTasks'), {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify(body),
      });
    expect((await save(input)).status).toBe(200);
    expect((await read('incoming')).organization?.departments).toEqual(
      departments,
    );
    expect((await save(input)).status).toBe(409);
    expect(
      (
        await save({
          ...input,
          organization: {
            ...input.organization,
            departments: [{ ...departments[0], clerks: ['unknown'] }],
          },
        })
      ).status,
    ).toBe(400);
    expect((await read('teamTasks')).revision).toBe(team.revision + 1);
  });

  test('requires authentication before validation and documents all fourteen workflows', async ({
    testApp,
    request,
  }) => {
    for (const path of [
      '/workflows/definitions/lifecycle.expenses/parameters?version=1',
      '/workflows/definitions/office.teamTasks/parameters?version=1',
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
    expect(data).toHaveLength(14);
    expect(data.filter((item) => item.source === 'lifecycle')).toHaveLength(8);
    expect(data.filter((item) => item.source === 'office')).toHaveLength(6);
    expect(data.map((item) => item.id)).toContain('office.executorTasks');
    for (const name of ['reviewerDemo', 'reviewerLiveDemo']) {
      expect(data.map((item) => item.name)).not.toContain(name);
      expect(
        (await session.fetch(`/workflows/definitions/lifecycle.${name}`))
          .status,
      ).toBe(404);
    }
    expect(new Set(data.map((item) => item.id)).size).toBe(14);
    expect(data.every((workflow) => workflow.executionCount === 0)).toBe(true);
    expect(data.every((workflow) => workflow.lastExecutedAt === null)).toBe(
      true,
    );
    for (const workflow of data) {
      const response = await session.fetch(
        `/workflows/definitions/${workflow.id}`,
      );
      expect(response.status).toBe(200);
      const definition = (
        (await response.json()) as { data: WorkflowDefinition }
      ).data;
      // The process is listed once, described by its latest version.
      expect(workflow.versions.at(-1)).toEqual({
        name: definition.definition.name,
        version: workflow.version,
      });
      expect(definition.description.name).toBe(definition.definition.name);
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

  test('denies members, separates read and write grants, and persists categories', async ({
    testApp,
    request,
  }) => {
    const credentials = {
      email: 'workflow-reader@example.com',
      password: 'correct horse battery staple',
    };
    const registered = await request('/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify({
        ...credentials,
        name: 'Workflow reader',
        username: 'workflowreader',
      }),
    });
    expect(registered.status).toBe(200);
    const member = await signIn(testApp, credentials);
    for (const path of [
      '/workflows/definitions/lifecycle.expenses/parameters?version=1',
      '/workflows/definitions/office.teamTasks/parameters?version=1',
      '/workflows/definitions',
      '/workflows/categories',
      '/workflows/executions?page=bad',
      '/workflows/definitions/lifecycle.expenses',
    ])
      expect((await member.fetch(path)).status).toBe(403);
    const authz = testApp.application.container.resolve(authorizationToken);
    await authz.permissionSets.create({
      key: 'workflow-reader',
      grants: [
        {
          resource: { type: 'settings', id: 'workflow-management' },
          actions: [{ action: 'read' }],
        },
      ],
    });
    await authz.permissionSets.assign({
      id: 'workflow-reader-assignment',
      permissionSet: 'workflow-reader',
      subject: { type: 'user', id: member.user.id },
    });
    expect((await member.fetch('/workflows/categories')).status).toBe(200);
    const input = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify({ title: 'Audit', sortOrder: 8 }),
    };
    expect((await member.fetch('/workflows/categories', input)).status).toBe(
      403,
    );
    expect(
      (
        await member.fetch(
          '/workflows/definitions/lifecycle.expenses/parameters?version=1',
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await member.fetch(
          '/workflows/definitions/lifecycle.expenses/parameters?version=1',
          {
            method: 'PUT',
            headers: input.headers,
            body: JSON.stringify({}),
          },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await member.fetch(
          '/workflows/definitions/office.teamTasks/parameters?version=1',
          { method: 'PUT', headers: input.headers, body: JSON.stringify({}) },
        )
      ).status,
    ).toBe(403);
    const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    expect(
      (
        await member.fetch('/workflows/categoryOrder', {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
          },
          body: JSON.stringify({ ids: [] }),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await admin.fetch('/workflows/categoryOrder', {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
          },
          body: JSON.stringify({ ids: ['missing'] }),
        })
      ).status,
    ).toBe(409);
    const created = await admin.fetch('/workflows/categories', input);
    expect(created.status).toBe(201);
    const { data: category } = (await created.json()) as {
      data: { id: string };
    };
    const assign = {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify({ categoryId: category.id }),
    };
    expect(
      (
        await member.fetch(
          '/workflows/definitions/lifecycle.expenses/category',
          assign,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await admin.fetch(
          '/workflows/definitions/lifecycle.expenses/category',
          assign,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await admin.fetch(
          '/workflows/definitions/lifecycle.missing/category',
          assign,
        )
      ).status,
    ).toBe(404);
    const before = (await (
      await admin.fetch('/workflows/definitions')
    ).json()) as { data: WorkflowSummary[] };
    expect(
      before.data.find((row) => row.id === 'lifecycle.expenses')?.categoryId,
    ).toBe(category.id);
    for (const keyword of ['Expense', '报销', ' EXPENSES ']) {
      const filtered = (await (
        await admin.fetch(
          `/workflows/definitions?q=${encodeURIComponent(keyword)}&category=${encodeURIComponent(category.id)}`,
        )
      ).json()) as { data: WorkflowSummary[] };
      expect(filtered.data.map((row) => row.id)).toEqual([
        'lifecycle.expenses',
      ]);
    }
    const otherCategory = (await (
      await admin.fetch(
        '/workflows/definitions?q=expenses&category=uncategorized',
      )
    ).json()) as { data: WorkflowSummary[] };
    expect(otherCategory.data).toEqual([]);
    const readCategory = async () => {
      const response = await admin.fetch(
        '/workflows/definitions/lifecycle.expenses',
      );
      expect(response.status).toBe(200);
      const result = (await response.json()) as { data: WorkflowDefinition };
      return result.data.workflow.categoryId;
    };
    expect(await readCategory()).toBe(category.id);
    expect(
      (
        await admin.fetch(
          '/workflows/definitions/lifecycle.expenses/category',
          {
            ...assign,
            body: JSON.stringify({ categoryId: null }),
          },
        )
      ).status,
    ).toBe(200);
    expect(await readCategory()).toBeNull();
    expect(
      (
        await admin.fetch(
          '/workflows/definitions/lifecycle.expenses/category',
          assign,
        )
      ).status,
    ).toBe(200);
    expect(await readCategory()).toBe(category.id);
    expect(
      (
        await member.fetch(`/workflows/categories/${category.id}`, {
          method: 'DELETE',
          headers: { origin: 'http://localhost' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await admin.fetch(`/workflows/categories/${category.id}`, {
          method: 'DELETE',
          headers: { origin: 'http://localhost' },
        })
      ).status,
    ).toBe(200);
    const after = (await (
      await admin.fetch('/workflows/definitions')
    ).json()) as { data: WorkflowSummary[] };
    expect(
      after.data.find((row) => row.id === 'lifecycle.expenses')?.categoryId,
    ).toBeNull();
    expect(await readCategory()).toBeNull();
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
        'expenses',
        {
          applicantId: 'lin',
          title: 'Travel expense',
          purpose: 'Customer visit',
          parameterContract: 1,
          amountCents: 1000000,
          items: [
            {
              category: 'transport',
              description: 'Travel',
              amountCents: 1000000,
              date: '2026-01-01',
            },
          ],
          approverId: null,
          failPayments: 0,
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
        },
        { actor: { id: 'lin' } },
      );
      ids.push(String(record.id));
    }
    const id = ids[0];
    await runtime.fire('expenses', id, 'submit', {
      actor: { id: 'lin' },
      requestId: 'workflow-submit',
    });
    await runtime.fire('expenses', id, 'withdraw', {
      actor: { id: 'lin' },
      requestId: 'workflow-withdraw',
    });
    await runtime.fire('expenses', id, 'submit', {
      actor: { id: 'lin' },
      requestId: 'workflow-submit-again',
    });
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const readPage = async (path: string) =>
      (await (await session.fetch(path)).json()) as WorkflowExecutionPage;
    const first = await readPage(
      '/workflows/executions?workflowId=lifecycle.expenses&page=1&pageSize=20',
    );
    expect(first.meta.total).toBe(105);
    const latestExecutionAt = '2026-01-01T01:44:00.000Z';
    const definition = (await (
      await session.fetch('/workflows/definitions/lifecycle.expenses')
    ).json()) as { data: WorkflowDefinition };
    expect(definition.data.workflow.lastExecutedAt).toBe(latestExecutionAt);
    const catalog = (await (
      await session.fetch('/workflows/definitions')
    ).json()) as { data: WorkflowSummary[] };
    expect(
      catalog.data.find((workflow) => workflow.id === 'lifecycle.expenses')
        ?.executionCount,
    ).toBe(first.meta.total);
    expect(
      catalog.data.find((workflow) => workflow.id === 'office.dataRequests')
        ?.executionCount,
    ).toBe(0);
    expect(
      catalog.data.find((workflow) => workflow.id === 'lifecycle.expenses')
        ?.lastExecutedAt,
    ).toBe(latestExecutionAt);
    expect(
      catalog.data.find((workflow) => workflow.id === 'office.dataRequests')
        ?.lastExecutedAt,
    ).toBeNull();
    expect(first.data).toHaveLength(20);
    expect(first.data[0].recordId).toBe(ids[104]);
    const last = await readPage(
      '/workflows/executions?workflowId=lifecycle.expenses&page=6&pageSize=20',
    );
    expect(last.data).toHaveLength(5);
    expect(last.data.at(-1)?.recordId).toBe(ids[0]);
    for (const keyword of [
      'expenses',
      'EXPENSE',
      '报销',
      ' lifecycle.expenses ',
    ]) {
      const filtered = await readPage(
        `/workflows/executions?q=${encodeURIComponent(keyword)}&page=6&pageSize=20`,
      );
      expect(filtered.meta.total).toBe(105);
      expect(filtered.data.map((row) => row.recordId)).toEqual(
        last.data.map((row) => row.recordId),
      );
    }
    const matchedDefinitions = (await (
      await session.fetch('/workflows/definitions?q=报销')
    ).json()) as { data: WorkflowSummary[] };
    expect(matchedDefinitions.data.map((row) => row.name)).toEqual(
      expect.arrayContaining(['expenses']),
    );
    expect(
      matchedDefinitions.data.every((row) => row.name === 'expenses'),
    ).toBe(true);
    const emptyDefinitions = (await (
      await session.fetch('/workflows/definitions?q=no-match')
    ).json()) as { data: WorkflowSummary[] };
    expect(emptyDefinitions.data).toEqual([]);
    const matched = await readPage(
      '/workflows/executions?q=报销&page=6&pageSize=20',
    );
    expect(matched).toEqual(last);
    const noMatches = await readPage('/workflows/executions?q=no-match');
    expect(noMatches.data).toEqual([]);
    expect(noMatches.meta.total).toBe(0);
    expect(
      (
        await session.fetch(
          '/workflows/executions?q=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        )
      ).status,
    ).toBe(400);
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
      '/workflows/executions?workflowId=lifecycle.expenses&order=oldest&page=6&pageSize=20',
    );
    expect(oldestFiltered.data.map((row) => row.recordId)).toEqual(
      ids.slice(100),
    );
    const empty = await readPage(
      '/workflows/executions?workflowId=office.dataRequests',
    );
    expect(empty.data).toEqual([]);
    const response = await session.fetch(
      `/workflows/executions/lifecycle.expenses/${id}`,
    );
    expect(response.status).toBe(200);
    const detail = (
      (await response.json()) as { data: WorkflowExecutionDetail }
    ).data;
    expect(detail.workflow.executionCount).toBe(105);
    expect(detail.view.record.id).toBe(id);
    expect(detail.view.state).toBe('awaitingManager');
    expect(
      detail.view.history.transitions.map((entry) => entry.transition),
    ).toEqual(['$create', 'submit', 'withdraw', 'submit']);
    expect(detail.view.history.transitions.map((entry) => entry.to)).toEqual([
      'draft',
      'awaitingManager',
      'draft',
      'awaitingManager',
    ]);
    expect(
      detail.description.parameterConfiguration?.groups.length,
    ).toBeGreaterThan(0);
  });
  test('lists two versions of one process once and tells their records apart by binding', async ({
    testApp,
  }) => {
    const runtime = testApp.application.container.resolve(
      lifecycleExampleServiceToken,
    ).runtime;
    const values = {
      applicantId: 'lin',
      title: 'Travel expense',
      purpose: 'Customer visit',
      parameterContract: 1,
      amountCents: 1000000,
      items: [
        {
          category: 'transport',
          description: 'Travel',
          amountCents: 1000000,
          date: '2026-01-01',
        },
      ],
      approverId: null,
      failPayments: 0,
    };
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const read = async <T>(path: string) => {
      const response = await session.fetch(path);
      return { status: response.status, body: (await response.json()) as T };
    };
    // Earlier tests in this file leave first-version records behind.
    const before = (
      await read<{ data: WorkflowDefinition }>(
        '/workflows/definitions/lifecycle.expenses?version=1',
      )
    ).body.data.definition.executionCount;
    const created: Record<string, string> = {};
    for (const [index, name] of [
      'expenses',
      'expenses-v2',
      'expenses-v2',
    ].entries()) {
      const { record } = await runtime.create(
        name,
        {
          ...values,
          createdAt: new Date(Date.UTC(2027, 0, 1, 0, index)).toISOString(),
        },
        { actor: { id: 'lin' } },
      );
      created[index] = String(record.id);
    }
    const catalog = await read<{ data: WorkflowSummary[] }>(
      '/workflows/definitions?q=expenses-v2',
    );
    // A version's own name finds its process, listed once with every
    // version's records.
    expect(catalog.body.data).toHaveLength(1);
    expect(catalog.body.data[0]).toMatchObject({
      id: 'lifecycle.expenses',
      name: 'expenses',
      version: 2,
      versions: [
        { name: 'expenses', version: 1 },
        { name: 'expenses-v2', version: 2 },
      ],
      executionCount: before + 3,
    });
    const latest = await read<{ data: WorkflowDefinition }>(
      '/workflows/definitions/lifecycle.expenses',
    );
    expect(latest.body.data.definition).toEqual({
      name: 'expenses-v2',
      version: 2,
      executionCount: 2,
    });
    expect(latest.body.data.description.states).toContain('awaitingAudit');
    const first = await read<{ data: WorkflowDefinition }>(
      '/workflows/definitions/lifecycle.expenses?version=1',
    );
    expect(first.body.data.definition).toEqual({
      name: 'expenses',
      version: 1,
      executionCount: before + 1,
    });
    expect(first.body.data.description.states).not.toContain('awaitingAudit');
    expect(first.body.data.workflow.executionCount).toBe(before + 3);
    // A link from before the process had versions names one version.
    const legacy = await read<{ data: WorkflowDefinition }>(
      '/workflows/definitions/lifecycle.expenses-v2',
    );
    expect(legacy.body.data.workflow.id).toBe('lifecycle.expenses');
    expect(legacy.body.data.definition.name).toBe('expenses-v2');
    expect(
      (await read('/workflows/definitions/lifecycle.expenses?version=3'))
        .status,
    ).toBe(404);
    const page = (query: string) =>
      read<WorkflowExecutionPage>(
        `/workflows/executions?workflowId=lifecycle.expenses${query}`,
      );
    const all = await page('');
    expect(all.body.meta.total).toBe(before + 3);
    expect(
      all.body.data
        .slice(0, 3)
        .map(({ recordId, definition, version }) => [
          recordId,
          definition,
          version,
        ]),
    ).toEqual([
      [created[2], 'expenses-v2', 2],
      [created[1], 'expenses-v2', 2],
      [created[0], 'expenses', 1],
    ]);
    const onlyFirst = await page('&version=1');
    expect(onlyFirst.body.meta.total).toBe(before + 1);
    expect(onlyFirst.body.data[0].recordId).toBe(created[0]);
    expect(onlyFirst.body.data.every(({ version }) => version === 1)).toBe(
      true,
    );
    const onlySecond = await page('&version=2');
    expect(onlySecond.body.meta.total).toBe(2);
    expect(onlySecond.body.data.map(({ recordId }) => recordId)).toEqual([
      created[2],
      created[1],
    ]);
    expect((await page('&version=3')).status).toBe(404);
    expect((await read('/workflows/executions?version=1')).status).toBe(400);
    // Each record opens with the version it is bound to, not the latest.
    const v1 = await read<{ data: WorkflowExecutionDetail }>(
      `/workflows/executions/lifecycle.expenses/${created[0]}`,
    );
    expect(v1.body.data.definition.name).toBe('expenses');
    expect(v1.body.data.description.name).toBe('expenses');
    const v2 = await read<{ data: WorkflowExecutionDetail }>(
      `/workflows/executions/lifecycle.expenses/${created[1]}`,
    );
    expect(v2.body.data.definition.name).toBe('expenses-v2');
    expect(v2.body.data.description.name).toBe('expenses-v2');
  });
});
