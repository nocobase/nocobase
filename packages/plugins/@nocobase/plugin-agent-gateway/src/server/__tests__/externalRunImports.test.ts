/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { MockServer, createMockServer } from '@nocobase/test';

import PluginAgentGatewayServer from '../plugin';

interface ResponseLike {
  status: number;
  body: {
    data?: unknown;
    errors?: Array<{
      message?: string;
    }>;
  };
}

function getData<T = Record<string, unknown>>(response: ResponseLike): T {
  return (response.body.data || response.body || {}) as T;
}

function getListData<T = Record<string, unknown>>(response: ResponseLike): T[] {
  const data = response.body.data || response.body || [];
  return (Array.isArray(data) ? data : []) as T[];
}

function getErrorMessage(response: ResponseLike) {
  return response.body.errors?.[0]?.message || '';
}

function expectString(value: unknown) {
  expect(typeof value).toBe('string');
  return String(value);
}

describe('agent gateway external run imports', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'system-settings',
        'field-sort',
        'users',
        'departments',
        'auth',
        'acl',
        'data-source-manager',
        'error-handler',
        [PluginAgentGatewayServer, { packageName: '@nocobase/plugin-agent-gateway' }],
      ],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    expect(rootUser).toBeTruthy();
    rootAgent = await app.agent().login(rootUser);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  async function createUserAgent(username: string, snippets: string[]) {
    const roleName = `${username}-role`;
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets,
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username,
        roles: [roleName],
      },
    });
    return await app.agent().login(user);
  }

  async function createUserWithRole(username: string, roleName: string) {
    const user = await app.db.getRepository('users').create({
      values: {
        username,
        roles: [roleName],
      },
    });
    return await app.agent().login(user);
  }

  async function seedBusinessCollection() {
    app.db.collection({
      name: 'agExternalImportTickets',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'agentRun', target: 'agRuns', foreignKey: 'agentRunId' },
      ],
    });
    await app.db.sync();
  }

  async function createTicket(title: string) {
    return await app.db.getRepository('agExternalImportTickets').create({
      values: {
        title,
      },
    });
  }

  async function grantCollectionActions(
    roleName: string,
    collectionName: string,
    actionNames: string[],
    fieldsByAction: Record<string, string[]> = {},
  ) {
    const response = await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: collectionName,
        usingActionsConfig: true,
        actions: actionNames.map((name) => ({
          name,
          ...(fieldsByAction[name] ? { fields: fieldsByAction[name] } : {}),
        })),
      },
    });
    expect(response.status).toBe(200);
  }

  function createCodexJsonl() {
    return [
      JSON.stringify({
        type: 'thread.started',
        thread_id: 'codex-import-thread-1',
      }),
      JSON.stringify({
        type: 'item.completed',
        item: {
          id: 'command-1',
          type: 'command_execution',
          command: 'echo imported',
          aggregated_output: 'imported\n',
          exit_code: 0,
          status: 'completed',
        },
      }),
      JSON.stringify({
        type: 'item.completed',
        item: {
          id: 'message-1',
          type: 'agent_message',
          text: 'Imported task complete',
        },
      }),
    ].join('\n');
  }

  it('imports Codex JSONL into run details, transcript events, and artifacts idempotently', async () => {
    const externalRunKey = `codex-import-${randomUUID()}`;
    const response = await rootAgent.post('/api/agent-gateway/external-runs:import').send({
      externalRunKey,
      provider: 'codex',
      title: 'Imported Codex build',
      instruction: 'Build a customer portal',
      status: 'succeeded',
      providerSessionId: 'codex-import-thread-1',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: createCodexJsonl(),
        },
      ],
      artifacts: [
        {
          artifactKey: 'imported-report',
          artifactType: 'text',
          mimeType: 'text/markdown',
          contentText: '# Imported report',
          metadata: {
            kind: 'report',
          },
        },
      ],
    });
    expect(response.status).toBe(200);
    const importResult = getData<{
      runId: string;
      deduped: boolean;
      observations: Record<string, number>;
      run: Record<string, unknown>;
    }>(response);
    const runId = expectString(importResult.runId);
    expect(importResult.deduped).toBe(false);
    expect(importResult.observations).toMatchObject({
      conversationEvents: 4,
      artifacts: 2,
    });
    expect(importResult.run).toMatchObject({
      status: 'succeeded',
      sourceType: 'external-import',
      agentProvider: 'codex',
      agentSessionProvider: 'codex',
      agentSessionProviderId: 'codex-import-thread-1',
    });
    expect(JSON.stringify(importResult.run)).not.toContain('promptSnapshot');
    expect(JSON.stringify(importResult.run)).not.toContain('executionPayloadJson');

    const conversationResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/conversation-events:list`);
    expect(conversationResponse.status).toBe(200);
    const conversationEvents = getListData(conversationResponse);
    expect(conversationEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        'agent.user.message',
        'agent.session.started',
        'agent.command.completed',
        'agent.message',
      ]),
    );

    const artifactsResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/artifacts:list`);
    expect(artifactsResponse.status).toBe(200);
    const artifacts = getListData(artifactsResponse);
    expect(artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactKey: expect.stringContaining('raw-log:codex:codex-jsonl'),
          artifactType: 'log',
        }),
        expect.objectContaining({
          artifactKey: 'imported-report',
          artifactType: 'text',
        }),
      ]),
    );

    const retryResponse = await rootAgent.post('/api/agent-gateway/external-runs:import').send({
      externalRunKey,
      provider: 'codex',
      title: 'Imported Codex build',
      instruction: 'Build a customer portal',
      status: 'succeeded',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: createCodexJsonl(),
        },
      ],
    });
    expect(retryResponse.status).toBe(200);
    expect(getData<{ runId: string; deduped: boolean }>(retryResponse)).toMatchObject({
      runId,
      deduped: true,
    });
  });

  it('appends external observations only to imported runs', async () => {
    const importResponse = await rootAgent.post('/api/agent-gateway/external-runs:import').send({
      externalRunKey: `text-import-${randomUUID()}`,
      provider: 'generic-cli',
      format: 'text',
      title: 'Imported text run',
      status: 'running',
      logs: [
        {
          format: 'text',
          contentText: 'started',
        },
      ],
    });
    expect(importResponse.status).toBe(200);
    const runId = expectString(getData<{ runId: string }>(importResponse).runId);

    const appendResponse = await rootAgent.post(`/api/agent-gateway/external-runs/${runId}/observations:append`).send({
      batchKey: 'final',
      provider: 'generic-cli',
      status: 'succeeded',
      logs: [
        {
          format: 'text',
          contentText: 'finished',
        },
      ],
      resultSummary: {
        imported: true,
      },
    });
    expect(appendResponse.status, JSON.stringify(appendResponse.body)).toBe(200);
    expect(getData<{ run: Record<string, unknown> }>(appendResponse).run).toMatchObject({
      status: 'succeeded',
    });

    const artifactsResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/artifacts:list`);
    expect(artifactsResponse.status).toBe(200);
    expect(getListData(artifactsResponse)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactKey: expect.stringContaining('raw-log:generic-cli:text'),
        }),
      ]),
    );

    const runEventsResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/events:list`);
    expect(runEventsResponse.status).toBe(200);

    const managedRunResponse = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode: `managed-${randomUUID()}`,
      sourceType: 'manual',
      promptSnapshot: {
        renderedPrompt: 'managed',
      },
      executionPayload: {
        provider: 'codex',
        prompt: 'managed',
      },
    });
    expect(managedRunResponse.status).toBe(200);
    const managedRunId = expectString(getData<{ id: string }>(managedRunResponse).id);
    const deniedAppendResponse = await rootAgent
      .post(`/api/agent-gateway/external-runs/${managedRunId}/observations:append`)
      .send({
        batchKey: 'denied',
        logs: [
          {
            format: 'text',
            contentText: 'not allowed',
          },
        ],
      });
    expect(deniedAppendResponse.status).toBe(409);
  });

  it('requires external import permission', async () => {
    const readOnlyAgent = await createUserAgent('external-import-read-only', ['agentGateway.readRuns']);
    const deniedResponse = await readOnlyAgent.post('/api/agent-gateway/external-runs:import').send({
      provider: 'codex',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: createCodexJsonl(),
        },
      ],
    });
    expect(deniedResponse.status).toBe(403);

    const importAgent = await createUserAgent('external-import-user', ['agentGateway.importExternalRuns']);
    const allowedResponse = await importAgent.post('/api/agent-gateway/external-runs:import').send({
      provider: 'codex',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: createCodexJsonl(),
        },
      ],
    });
    expect(allowedResponse.status).toBe(200);
    expect(getData<{ runId: unknown }>(allowedResponse).runId).toBeTruthy();
  });

  it('writes back imported runs to business records only with collection update permission', async () => {
    await seedBusinessCollection();
    const roleName = 'external-import-business-writer';
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.importExternalRuns'],
      },
    });
    await grantCollectionActions(roleName, 'agExternalImportTickets', ['view', 'update'], {
      view: ['title', 'agentRun', 'agentRunId'],
      update: ['agentRun', 'agentRunId'],
    });
    const importAgent = await createUserWithRole('external-import-business-writer-user', roleName);
    const ticket = await createTicket('Imported business task');

    const response = await importAgent.post('/api/agent-gateway/external-runs:import').send({
      externalRunKey: `business-import-${randomUUID()}`,
      provider: 'opencode',
      title: 'Imported business task',
      status: 'succeeded',
      sourceCollection: 'agExternalImportTickets',
      sourceRecordId: ticket.get('id'),
      outputAgentRunField: 'agentRun',
      logs: [
        {
          format: 'text',
          contentText: 'business import finished',
        },
      ],
    });
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    const runId = expectString(getData<{ runId: string }>(response).runId);
    expect(getData<{ relationUpdated: boolean }>(response).relationUpdated).toBe(true);

    const updatedTicket = await app.db.getRepository('agExternalImportTickets').findOne({
      filterByTk: ticket.get('id'),
    });
    expect(updatedTicket.get('agentRunId')).toBe(runId);

    const deniedAgent = await createUserAgent('external-import-no-business-write', ['agentGateway.importExternalRuns']);
    const deniedTicket = await createTicket('Denied business task');
    const runCountBeforeDeniedImport = await app.db.getRepository('agRuns').count({});
    const deniedResponse = await deniedAgent.post('/api/agent-gateway/external-runs:import').send({
      externalRunKey: `business-denied-${randomUUID()}`,
      provider: 'codex',
      status: 'succeeded',
      sourceCollection: 'agExternalImportTickets',
      sourceRecordId: deniedTicket.get('id'),
      outputAgentRunField: 'agentRun',
      logs: [
        {
          format: 'text',
          contentText: 'should roll back',
        },
      ],
    });
    expect(deniedResponse.status).toBe(403);
    expect(getErrorMessage(deniedResponse)).toContain('No permission to view collection: agExternalImportTickets');
    expect(await app.db.getRepository('agRuns').count({})).toBe(runCountBeforeDeniedImport);
    const unchangedDeniedTicket = await app.db.getRepository('agExternalImportTickets').findOne({
      filterByTk: deniedTicket.get('id'),
    });
    expect(unchangedDeniedTicket.get('agentRunId')).toBeFalsy();
  });
});
