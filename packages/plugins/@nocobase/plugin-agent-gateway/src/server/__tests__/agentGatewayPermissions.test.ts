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

import { normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import PluginAgentGatewayServer from '../plugin';

interface ResponseLike {
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

describe('agent gateway permission matrix', () => {
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
    return (await createUserWithRole(username, snippets)).agent;
  }

  async function createUserWithRole(username: string, snippets: string[]) {
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
    return {
      agent: await app.agent().login(user),
      roleName,
    };
  }

  async function grantRunScope(roleName: string, scopeName: string, scope: Record<string, unknown>) {
    const scopeResponse = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: 'agRuns',
        name: scopeName,
        scope,
      },
    });
    expect(scopeResponse.status).toBe(200);
    const roleResourceResponse = await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: 'agRuns',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            scope: scopeResponse.body.data.id,
          },
        ],
      },
    });
    expect(roleResourceResponse.status).toBe(200);
  }

  async function seedRun(
    options: { status?: string; terminal?: boolean; sessionStatus?: string; runCode?: string } = {},
  ) {
    const now = new Date();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        id: randomUUID(),
        runCode: options.runCode || `permission-run-${randomUUID()}`,
        status: options.status || 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        sourceType: 'test',
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        finishedAt: options.status === 'running' ? null : now,
        promptSnapshot: {
          text: 'permission prompt',
        },
        executionPayloadJson: {
          executionPolicyKey: 'codex',
          cwd: '.',
        },
        provider: 'codex',
        capabilitiesSnapshotJson: normalizeAgentProviderCapabilities('codex'),
        executionPolicyKey: 'codex',
        ...(options.terminal
          ? {
              terminalBackend: 'tmux',
              terminalSessionName: `ag-run-${randomUUID()}`,
              terminalStatus: 'active',
            }
          : {}),
      },
    });
    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: 'codex',
        providerSessionId: `thread-${randomUUID()}`,
        rootRunId: run.get('id'),
        latestRunId: run.get('id'),
        status: options.sessionStatus || 'ended',
        capabilitiesJson: {
          resumeWithMessage: true,
          interrupt: true,
          terminate: true,
          liveSemanticMessage: false,
          stdinMessage: false,
        },
      },
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: run.get('id'),
      values: {
        agentSessionId: session.get('id'),
        agentSessionProviderId: session.get('providerSessionId'),
      },
    });
    await app.db.sequelize.transaction(async (transaction) => {
      await app.db.getRepository('agAgentConversationEvents').create({
        values: {
          id: randomUUID(),
          sessionId: session.get('id'),
          runId: run.get('id'),
          sequence: 1,
          eventType: 'agent.message',
          source: 'codex',
          contentText: 'visible session message',
        },
        transaction,
      });
      await app.db.getRepository('agRunEvents').create({
        values: {
          id: randomUUID(),
          runId: run.get('id'),
          claimAttempt: 1,
          source: 'runner',
          sequence: 1,
          level: 'info',
          eventType: 'log',
          message: 'raw log',
        },
        transaction,
      });
    });
    await app.db.getRepository('agRunArtifacts').create({
      values: {
        id: randomUUID(),
        runId: run.get('id'),
        claimAttempt: 1,
        artifactKey: 'main',
        artifactType: 'text',
        contentText: 'artifact',
      },
    });
    return {
      runId: String(run.get('id')),
      runCode: String(run.get('runCode')),
      sessionId: String(session.get('id')),
    };
  }

  it('does not let dispatch-only roles create runs directly', async () => {
    const dispatchAgent = await createUserAgent('agent-gateway-dispatch-no-direct-create', [
      'agentGateway.dispatchRun',
    ]);
    const deniedResponse = await dispatchAgent.post('/agentGatewayApi:createRun').send({
      runCode: 'dispatch-direct-create-denied',
      sourceType: 'manual',
      promptSnapshot: {
        text: 'must not queue',
      },
      provider: 'codex',
      capabilitiesSnapshotJson: normalizeAgentProviderCapabilities('codex'),
      executionPolicyKey: 'codex',
      executionPayloadJson: {
        executionPolicyKey: 'codex',
        task: 'must-not-queue',
        cwd: '.',
      },
    });
    expect(deniedResponse.status).toBe(403);
    expect(JSON.stringify(deniedResponse.body)).toContain('Agent Gateway management permission required');
    expect(await app.db.getRepository('agRuns').count({})).toBe(0);

    const managerAgent = await createUserAgent('agent-gateway-manage-direct-create', ['agentGateway.manage']);
    const allowedResponse = await managerAgent.post('/agentGatewayApi:createRun').send({
      runCode: 'manage-direct-create-allowed',
      sourceType: 'manual',
      promptSnapshot: {
        text: 'queue from management API',
      },
      provider: 'codex',
      capabilitiesSnapshotJson: normalizeAgentProviderCapabilities('codex'),
      executionPolicyKey: 'codex',
      executionPayloadJson: {
        executionPolicyKey: 'codex',
        task: 'queue',
        cwd: '.',
      },
    });
    expect(allowedResponse.status).toBe(200);
    expect(await app.db.getRepository('agRuns').count({})).toBe(1);
  });

  it('enforces list-only and detail-only restricted roles', async () => {
    const { runId } = await seedRun();
    const listOnlyAgent = await createUserAgent('agent-gateway-list-only', ['agentGateway.readRuns']);
    expect((await listOnlyAgent.get('/agentGatewayApi:listRuns')).status).toBe(200);
    expect((await listOnlyAgent.get(`/agentGatewayApi:getRun/${runId}`)).status).toBe(403);

    const detailOnlyAgent = await createUserAgent('agent-gateway-detail-only', [
      'agentGateway.readRuns',
      'agentGateway.readRunDetails',
    ]);
    const detailResponse = await detailOnlyAgent.get(`/agentGatewayApi:getRun/${runId}`);
    expect(detailResponse.status).toBe(200);
    expect(getData(detailResponse)).toMatchObject({
      agentGatewayActionPermissionsJson: {
        resumeAgentSession: false,
        readSessionMessages: false,
        readTerminal: false,
        readArtifacts: false,
        readRawLogs: false,
      },
      agentGatewayControlActionsJson: {
        interruptRun: false,
        terminateRun: false,
      },
    });
    const standardListResponse = await listOnlyAgent.get('/agRuns:list');
    expect(standardListResponse.status).toBe(200);
    const standardReadAgent = await createUserAgent('agent-gateway-standard-read', ['agentGateway.readRun']);
    const standardGetResponse = await standardReadAgent.get(`/agRuns:get/${runId}`);
    expect(standardGetResponse.status).toBe(200);
    for (const internalField of [
      'claimAttempt',
      'leaseVersion',
      'claimTokenHash',
      'claimTokenLast4',
      'claimExpiresAt',
      'terminalSessionName',
      'promptSnapshot',
      'executionPayloadJson',
    ]) {
      expect(JSON.stringify(standardListResponse.body)).not.toContain(`"${internalField}"`);
      expect(JSON.stringify(standardGetResponse.body)).not.toContain(`"${internalField}"`);
    }
    expect((await detailOnlyAgent.get(`/agentGatewayApi:listRunConversationEvents/${runId}`)).status).toBe(403);
    expect((await detailOnlyAgent.get(`/agentGatewayApi:getTerminalSnapshot/${runId}`)).status).toBe(403);
    expect((await detailOnlyAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`)).status).toBe(403);
    expect((await detailOnlyAgent.get(`/agentGatewayApi:listRunEvents/${runId}`)).status).toBe(403);
  });

  it('keeps cancel-only action permissions executable for visible runs', async () => {
    const visible = await seedRun({
      runCode: 'permission-cancel-visible-run',
      status: 'running',
      terminal: true,
      sessionStatus: 'active',
    });
    const hidden = await seedRun({
      runCode: 'permission-cancel-hidden-run',
      status: 'running',
      terminal: true,
      sessionStatus: 'active',
    });
    const { agent: cancelAgent, roleName } = await createUserWithRole('agent-gateway-cancel-only-visible', [
      'agentGateway.readRuns',
      'agentGateway.cancelRun',
    ]);
    await grantRunScope(roleName, 'agent-gateway-cancel-visible-runs', {
      runCode: visible.runCode,
    });

    const listResponse = await cancelAgent.get('/agentGatewayApi:listRuns');
    expect(listResponse.status).toBe(200);
    expect(JSON.stringify(listResponse.body)).toContain(visible.runId);
    expect(JSON.stringify(listResponse.body)).not.toContain(hidden.runId);
    expect(JSON.stringify(listResponse.body)).toContain('"cancelRun":true');
    expect(JSON.stringify(listResponse.body)).toContain('"interruptRun":false');
    expect(JSON.stringify(listResponse.body)).toContain('"terminateRun":false');

    const cancelResponse = await cancelAgent.post(`/agentGatewayApi:cancelRun/${visible.runId}`).send({});
    expect(cancelResponse.status).toBe(200);
    expect(getData(cancelResponse)).toMatchObject({
      status: 'canceling',
      cancelRequested: true,
    });

    const hiddenCancelResponse = await cancelAgent.post(`/agentGatewayApi:cancelRun/${hidden.runId}`).send({});
    expect(hiddenCancelResponse.status).toBe(404);
    expect(JSON.stringify(hiddenCancelResponse.body)).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
  });

  it('allows only the matching read snippets for session, terminal, artifacts, and raw logs', async () => {
    const { runId, sessionId } = await seedRun();
    const sessionAgent = await createUserAgent('agent-gateway-session-reader', ['agentGateway.readSessionMessages']);
    expect((await sessionAgent.get(`/agentGatewayApi:listRunConversationEvents/${runId}`)).status).toBe(200);
    expect((await sessionAgent.get(`/agentGatewayApi:listSessionConversationEvents/${sessionId}`)).status).toBe(200);
    expect((await sessionAgent.get(`/agentGatewayApi:getTerminalSnapshot/${runId}`)).status).toBe(403);

    const terminalAgent = await createUserAgent('agent-gateway-terminal-reader', ['agentGateway.readTerminal']);
    expect((await terminalAgent.get(`/agentGatewayApi:getTerminalSnapshot/${runId}`)).status).toBe(200);
    expect((await terminalAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`)).status).toBe(403);

    const artifactsAgent = await createUserAgent('agent-gateway-artifact-reader', ['agentGateway.readArtifacts']);
    expect((await artifactsAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`)).status).toBe(200);
    expect((await artifactsAgent.get(`/agentGatewayApi:listRunEvents/${runId}`)).status).toBe(403);

    const rawLogsAgent = await createUserAgent('agent-gateway-raw-reader', ['agentGateway.readRawLogs']);
    expect((await rawLogsAgent.get(`/agentGatewayApi:listRunEvents/${runId}`)).status).toBe(200);
    expect((await rawLogsAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`)).status).toBe(403);
  });

  it('enforces resume, semantic message, interrupt, terminate, and raw-write permissions', async () => {
    const ended = await seedRun();
    const resumeAgent = await createUserAgent('agent-gateway-resume-user', ['agentGateway.resumeAgentSession']);
    const resumeResponse = await resumeAgent.post(`/agentGatewayApi:resumeAgentSession/${ended.sessionId}`).send({
      message: 'continue',
      idempotencyKey: 'permission-resume',
    });
    expect(resumeResponse.status).toBe(200);
    expect(getData(resumeResponse)).toMatchObject({
      agentSessionId: ended.sessionId,
    });

    const messageAgent = await createUserAgent('agent-gateway-message-user', ['agentGateway.messageAgentSession']);
    const messageResponse = await messageAgent.post(`/agentGatewayApi:messageAgentSession/${ended.sessionId}`).send({
      message: 'live message',
    });
    expect(messageResponse.status).toBe(409);
    expect(JSON.stringify(messageResponse.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');

    const active = await seedRun({ status: 'running', terminal: true, sessionStatus: 'active' });
    const interruptAgent = await createUserAgent('agent-gateway-interrupt-matrix', ['agentGateway.interruptRun']);
    expect(
      (
        await interruptAgent.post(`/agentGatewayApi:interruptTerminal/${active.runId}`).send({
          idempotencyKey: 'permission-interrupt',
        })
      ).status,
    ).toBe(200);
    const terminateAgent = await createUserAgent('agent-gateway-terminate-matrix', ['agentGateway.terminateRun']);
    expect(
      (
        await terminateAgent.post(`/agentGatewayApi:terminateTerminal/${active.runId}`).send({
          idempotencyKey: 'permission-terminate',
        })
      ).status,
    ).toBe(200);

    const rawAgent = await createUserAgent('agent-gateway-raw-matrix', ['agentGateway.writeTerminalRaw']);
    const rawResponse = await rawAgent.post(`/agentGatewayApi:sendTerminalInput/${active.runId}`).send({
      input: 'must-not-write',
    });
    expect(rawResponse.status).toBe(403);
    expect(JSON.stringify(rawResponse.body)).toContain('TERMINAL_RAW_WRITE_DISABLED');
  });

  it('enforces run data-scope visibility in addition to permission snippets', async () => {
    const visible = await seedRun({
      runCode: 'permission-visible-run',
      status: 'running',
      terminal: true,
      sessionStatus: 'active',
    });
    const hidden = await seedRun({
      runCode: 'permission-hidden-run',
      status: 'running',
      terminal: true,
      sessionStatus: 'active',
    });
    const hiddenWithoutLatestRun = await seedRun({
      runCode: 'permission-hidden-no-latest-run',
      status: 'running',
      terminal: true,
      sessionStatus: 'active',
    });
    await app.db.getRepository('agAgentSessions').update({
      filterByTk: hiddenWithoutLatestRun.sessionId,
      values: {
        latestRunId: null,
      },
    });
    const hiddenEnded = await seedRun({
      runCode: 'permission-hidden-ended-run',
      status: 'succeeded',
      sessionStatus: 'ended',
    });
    const { agent: scopedAgent, roleName } = await createUserWithRole('agent-gateway-scoped', [
      'agentGateway.readRuns',
      'agentGateway.readRunDetails',
      'agentGateway.readSessionMessages',
      'agentGateway.readTerminal',
      'agentGateway.readArtifacts',
      'agentGateway.readRawLogs',
      'agentGateway.resumeAgentSession',
      'agentGateway.messageAgentSession',
      'agentGateway.interruptRun',
      'agentGateway.terminateRun',
      'agentGateway.cancelRun',
    ]);
    await grantRunScope(roleName, 'agent-gateway-visible-runs', {
      runCode: visible.runCode,
    });

    const listResponse = await scopedAgent.get('/agentGatewayApi:listRuns');
    expect(listResponse.status).toBe(200);
    expect(JSON.stringify(listResponse.body)).toContain(visible.runId);
    expect(JSON.stringify(listResponse.body)).not.toContain(hidden.runId);
    const standardScopedListResponse = await scopedAgent.get('/agRuns:list');
    expect(standardScopedListResponse.status).toBe(200);
    expect(JSON.stringify(standardScopedListResponse.body)).toContain(visible.runId);
    expect(JSON.stringify(standardScopedListResponse.body)).not.toContain(hidden.runId);

    expect((await scopedAgent.get(`/agentGatewayApi:getRun/${visible.runId}`)).status).toBe(200);
    expect((await scopedAgent.get(`/agentGatewayApi:getRun/${hidden.runId}`)).status).toBe(404);
    expect((await scopedAgent.get(`/agRuns:get/${visible.runId}`)).status).toBe(200);
    expect((await scopedAgent.get(`/agRuns:get/${hidden.runId}`)).status).toBe(404);
    expect((await scopedAgent.get(`/agentGatewayApi:getTerminalSnapshot/${hidden.runId}`)).status).toBe(404);
    const visibleStats = await scopedAgent.get(`/agentGatewayApi:getTerminalStreamStats?runId=${visible.runId}`);
    expect(visibleStats.status).toBe(200);
    expect(getData(visibleStats)).toMatchObject({
      activeBrowserSubscriptionsForRun: 0,
    });
    expect((await scopedAgent.get(`/agentGatewayApi:getTerminalStreamStats?runId=${hidden.runId}`)).status).toBe(404);
    expect((await scopedAgent.get('/agentGatewayApi:getTerminalStreamStats')).status).toBe(400);
    expect(
      (await scopedAgent.get(`/agentGatewayApi:getTerminalStreamStats?runId=${visible.runId}&nodeId=hidden-node-probe`))
        .status,
    ).toBe(403);
    const rootStats = await rootAgent.get('/agentGatewayApi:getTerminalStreamStats?nodeId=hidden-node-probe');
    expect(rootStats.status).toBe(200);
    expect(getData(rootStats)).toHaveProperty('activeConnections');
    expect((await scopedAgent.get(`/agentGatewayApi:listRunArtifacts/${hidden.runId}`)).status).toBe(404);
    expect((await scopedAgent.get(`/agentGatewayApi:listRunEvents/${hidden.runId}`)).status).toBe(404);
    const hiddenResumeResponse = await scopedAgent
      .post(`/agentGatewayApi:resumeAgentSession/${hiddenEnded.sessionId}`)
      .send({
        message: 'resume hidden source',
        idempotencyKey: 'hidden-source-resume',
        resumedFromRunId: hiddenEnded.runId,
      });
    expect(hiddenResumeResponse.status).toBe(404);
    expect(JSON.stringify(hiddenResumeResponse.body)).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
    const hiddenMessageResponse = await scopedAgent
      .post(`/agentGatewayApi:messageAgentSession/${hidden.sessionId}`)
      .send({
        message: 'message hidden latest run',
      });
    expect(hiddenMessageResponse.status).toBe(404);
    expect(JSON.stringify(hiddenMessageResponse.body)).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
    const hiddenNoLatestMessageResponse = await scopedAgent
      .post(`/agentGatewayApi:messageAgentSession/${hiddenWithoutLatestRun.sessionId}`)
      .send({
        message: 'message hidden session without latest run',
      });
    expect(hiddenNoLatestMessageResponse.status).toBe(404);
    const hiddenNoLatestMessageBody = JSON.stringify(hiddenNoLatestMessageResponse.body);
    expect(hiddenNoLatestMessageBody).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
    expect(hiddenNoLatestMessageBody).not.toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(hiddenNoLatestMessageBody).not.toContain('liveSemanticMessage');
    expect(hiddenNoLatestMessageBody).not.toContain('stdinMessage');
    const hiddenStreamTicketCountBefore = await app.db.getRepository('agTerminalStreamTickets').count({
      filter: {
        runId: hidden.runId,
      },
    });
    const hiddenStreamTicketResponse = await scopedAgent
      .post(`/agentGatewayApi:createTerminalStreamTicket/${hidden.runId}`)
      .send({});
    expect(hiddenStreamTicketResponse.status).toBe(404);
    expect(
      await app.db.getRepository('agTerminalStreamTickets').count({
        filter: {
          runId: hidden.runId,
        },
      }),
    ).toBe(hiddenStreamTicketCountBefore);
    const hiddenCancelResponse = await scopedAgent.post(`/agentGatewayApi:cancelRun/${hidden.runId}`).send({});
    expect(hiddenCancelResponse.status).toBe(404);
    expect(JSON.stringify(hiddenCancelResponse.body)).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
    const hiddenRunAfterCancel = await app.db.getRepository('agRuns').findOne({
      filterByTk: hidden.runId,
    });
    expect(hiddenRunAfterCancel?.get('status')).toBe('running');
    expect(hiddenRunAfterCancel?.get('cancelRequested')).toBe(false);
    expect(hiddenRunAfterCancel?.get('cancelRequestedAt')).toBeFalsy();
    expect((await scopedAgent.get(`/agentGatewayApi:listSessionConversationEvents/${hidden.sessionId}`)).status).toBe(
      404,
    );
    expect(
      (
        await scopedAgent.post(`/agentGatewayApi:interruptTerminal/${hidden.runId}`).send({
          idempotencyKey: 'hidden-interrupt',
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await scopedAgent.post(`/agentGatewayApi:terminateTerminal/${hidden.runId}`).send({
          idempotencyKey: 'hidden-terminate',
        })
      ).status,
    ).toBe(404);
    const hiddenRawWriteResponse = await scopedAgent.post(`/agentGatewayApi:sendTerminalInput/${hidden.runId}`).send({
      input: 'must-not-link-hidden-run',
    });
    expect(hiddenRawWriteResponse.status).toBe(403);
    expect(JSON.stringify(hiddenRawWriteResponse.body)).toContain('TERMINAL_RAW_WRITE_DISABLED');
    expect(
      await app.db.getRepository('agRunControlRequests').count({
        filter: {
          runId: hidden.runId,
        },
      }),
    ).toBe(0);
  });

  it('rejects denied control attempts without creating control requests', async () => {
    const active = await seedRun({ status: 'running', terminal: true, sessionStatus: 'active' });
    const readOnlyAgent = await createUserAgent('agent-gateway-denied-control', ['agentGateway.readRuns']);

    expect(
      (
        await readOnlyAgent.post(`/agentGatewayApi:interruptTerminal/${active.runId}`).send({
          idempotencyKey: 'denied-interrupt',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await readOnlyAgent.post(`/agentGatewayApi:terminateTerminal/${active.runId}`).send({
          idempotencyKey: 'denied-terminate',
        })
      ).status,
    ).toBe(403);
    expect(
      await app.db.getRepository('agRunControlRequests').count({
        filter: {
          runId: active.runId,
        },
      }),
    ).toBe(0);
  });
});
