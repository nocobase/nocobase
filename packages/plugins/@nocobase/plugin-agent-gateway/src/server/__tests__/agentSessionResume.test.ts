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
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

describe('agent gateway agent session resume API', () => {
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

  async function seedEndedSession(
    options: {
      provider?: string;
      providerSessionId?: string | null;
      capabilitiesJson?: Record<string, unknown>;
      runStatus?: string;
      latestRunId?: string;
    } = {},
  ) {
    const now = new Date();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        id: options.latestRunId || randomUUID(),
        runCode: `resume-source-${randomUUID()}`,
        status: options.runStatus || 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        promptSnapshot: {
          text: 'Initial prompt',
        },
        executionPayloadJson: {
          commandKey: 'codex',
          profileKey: 'codex',
          args: ['exec', '--json', 'Initial prompt'],
          cwd: 'packages',
          timeoutMs: 12345,
        },
        sourceType: 'test',
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        completedAt: now,
        finishedAt: now,
      },
    });
    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: options.provider || 'codex',
        providerSessionId:
          options.providerSessionId === undefined ? 'codex-thread-resume-1' : options.providerSessionId,
        rootRunId: run.get('id'),
        latestRunId: run.get('id'),
        status: 'ended',
        capabilitiesJson: options.capabilitiesJson || {
          resumeWithMessage: true,
          detectSessionId: true,
        },
      },
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: run.get('id'),
      values: {
        agentSessionId: session.get('id'),
        agentSessionProvider: session.get('provider'),
        agentSessionProviderId: session.get('providerSessionId'),
      },
    });
    return {
      run,
      session,
    };
  }

  async function resumeSession(sessionId: unknown, body: Record<string, unknown>) {
    return await rootAgent.post(`/api/agent-gateway/agent-sessions/${sessionId}/resume`).send(body);
  }

  async function createEndedSessionRun(sessionId: unknown) {
    const now = new Date();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        id: randomUUID(),
        runCode: `resume-extra-source-${randomUUID()}`,
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        promptSnapshot: {
          text: 'Extra prompt',
        },
        executionPayloadJson: {
          commandKey: 'codex',
          profileKey: 'codex',
          args: ['exec', '--json', 'Extra prompt'],
          cwd: 'packages',
        },
        sourceType: 'test',
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        completedAt: now,
        finishedAt: now,
        agentSessionId: sessionId,
        agentSessionProvider: 'codex',
        agentSessionProviderId: 'codex-thread-resume-1',
      },
    });
    await app.db.getRepository('agAgentSessions').update({
      filterByTk: sessionId,
      values: {
        latestRunId: run.get('id'),
        status: 'ended',
      },
    });
    return run;
  }

  it('creates a continuation run with persisted idempotency, redacted preview, and user timeline event', async () => {
    const { run, session } = await seedEndedSession();
    const message = 'Continue with token=RESUME_SECRET and say "done"';
    const response = await resumeSession(session.get('id'), {
      message,
      resumedFromRunId: run.get('id'),
      idempotencyKey: 'resume-click-1',
    });

    expect(response.status).toBe(200);
    const result = getData(response);
    expect(result).toMatchObject({
      agentSessionId: session.get('id'),
      parentRunId: run.get('id'),
      resumedFromRunId: run.get('id'),
      deduped: false,
    });

    const continuation = await app.db.getRepository('agRuns').findOne({
      filterByTk: result.runId,
    });
    expect(continuation.get('status')).toBe('queued');
    expect(continuation.get('agentSessionId')).toBe(session.get('id'));
    expect(continuation.get('parentRunId')).toBe(run.get('id'));
    expect(continuation.get('resumedFromRunId')).toBe(run.get('id'));
    expect(continuation.get('continuationReason')).toBe('user-message');
    expect(continuation.get('continuationIdempotencyKey')).toBe('resume-click-1');
    expect(String(continuation.get('continuationRequestKey'))).toMatch(/^resume:.+:provided:[0-9a-f]{64}$/);
    expect(continuation.get('continuationMessagePreview')).toContain('[REDACTED]');
    expect(continuation.get('continuationMessageHash')).toMatch(/^[0-9a-f]{64}$/);
    expect(continuation.get('executionPayloadJson')).toMatchObject({
      mode: 'agent-session-resume',
      commandKey: 'codex',
      providerSessionId: 'codex-thread-resume-1',
      message,
      args: ['exec', 'resume', '--json', 'codex-thread-resume-1', message],
      cwd: 'packages',
      timeoutMs: 12345,
    });

    const refreshedSession = await app.db.getRepository('agAgentSessions').findOne({
      filterByTk: session.get('id'),
    });
    expect(refreshedSession.get('latestRunId')).toBe(result.runId);

    const conversationEvents = await app.db.getRepository('agAgentConversationEvents').find({
      filter: {
        runId: result.runId,
      },
    });
    expect(conversationEvents).toHaveLength(1);
    expect(conversationEvents[0].get('sessionId')).toBe(session.get('id'));
    expect(conversationEvents[0].get('eventType')).toBe('agent.user.message');
    expect(conversationEvents[0].get('contentText')).toContain('[REDACTED]');
    expect(JSON.stringify(conversationEvents[0].toJSON())).not.toContain('RESUME_SECRET');
  });

  it('dedupes duplicate resume requests by persisted continuationRequestKey', async () => {
    const { session } = await seedEndedSession();
    const first = await resumeSession(session.get('id'), {
      message: 'Continue once',
      idempotencyKey: 'same-resume-click',
    });
    const second = await resumeSession(session.get('id'), {
      message: 'Continue once',
      idempotencyKey: 'same-resume-click',
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(getData(second)).toMatchObject({
      runId: getData(first).runId,
      deduped: true,
    });
    const continuationCount = await app.db.getRepository('agRuns').count({
      filter: {
        agentSessionId: session.get('id'),
        continuationReason: 'user-message',
      },
    });
    expect(continuationCount).toBe(1);
  });

  it('does not return idempotent continuation runs hidden by run data-scope', async () => {
    const { run, session } = await seedEndedSession();
    const { agent: scopedAgent, roleName } = await createUserWithRole('resume-scoped-user', [
      'agentGateway.resumeAgentSession',
    ]);
    await grantRunScope(roleName, 'resume-visible-source-run-only', {
      runCode: run.get('runCode'),
    });

    const first = await scopedAgent.post(`/api/agent-gateway/agent-sessions/${session.get('id')}/resume`).send({
      message: 'Continue hidden once',
      idempotencyKey: 'same-hidden-resume-click',
    });
    expect(first.status).toBe(200);
    const firstResult = getData(first);

    const hiddenReplay = await scopedAgent.post(`/api/agent-gateway/agent-sessions/${session.get('id')}/resume`).send({
      message: 'Continue hidden once',
      idempotencyKey: 'same-hidden-resume-click',
    });
    expect(hiddenReplay.status).toBe(404);
    expect(JSON.stringify(hiddenReplay.body)).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
    expect(JSON.stringify(hiddenReplay.body)).not.toContain(String(firstResult.runId));
  });

  it('rejects idempotency key reuse with a different resume message', async () => {
    const { session } = await seedEndedSession();
    const first = await resumeSession(session.get('id'), {
      message: 'Continue once',
      idempotencyKey: 'same-resume-click-different-message',
    });
    const second = await resumeSession(session.get('id'), {
      message: 'Continue differently',
      idempotencyKey: 'same-resume-click-different-message',
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(JSON.stringify(second.body)).toContain('different resume message');
    const continuationCount = await app.db.getRepository('agRuns').count({
      filter: {
        agentSessionId: session.get('id'),
        continuationReason: 'user-message',
      },
    });
    expect(continuationCount).toBe(1);
  });

  it('rejects a new continuation from an older source run while a continuation is queued', async () => {
    const { run, session } = await seedEndedSession();
    const first = await resumeSession(session.get('id'), {
      message: 'Continue once',
      resumedFromRunId: run.get('id'),
      idempotencyKey: 'concurrent-resume-click-1',
    });
    const second = await resumeSession(session.get('id'), {
      message: 'Continue again',
      resumedFromRunId: run.get('id'),
      idempotencyKey: 'concurrent-resume-click-2',
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(JSON.stringify(second.body)).toContain('active continuation');
    const continuationCount = await app.db.getRepository('agRuns').count({
      filter: {
        agentSessionId: session.get('id'),
        continuationReason: 'user-message',
      },
    });
    expect(continuationCount).toBe(1);
  });

  it('allows an explicit resume from an older terminal run in the same session', async () => {
    const { run, session } = await seedEndedSession();
    const latestRun = await createEndedSessionRun(session.get('id'));
    const response = await resumeSession(session.get('id'), {
      message: 'Continue from the earlier run',
      resumedFromRunId: run.get('id'),
      idempotencyKey: 'explicit-older-source',
    });

    expect(response.status).toBe(200);
    const result = getData(response);
    expect(result).toMatchObject({
      agentSessionId: session.get('id'),
      parentRunId: run.get('id'),
      resumedFromRunId: run.get('id'),
      deduped: false,
    });
    expect(result.parentRunId).not.toBe(latestRun.get('id'));

    const continuation = await app.db.getRepository('agRuns').findOne({
      filterByTk: result.runId,
    });
    expect(continuation.get('parentRunId')).toBe(run.get('id'));
    expect(continuation.get('resumedFromRunId')).toBe(run.get('id'));
  });

  it('rejects idempotency key reuse with a different explicit source run', async () => {
    const { run, session } = await seedEndedSession();
    const latestRun = await createEndedSessionRun(session.get('id'));
    const first = await resumeSession(session.get('id'), {
      message: 'Continue once',
      resumedFromRunId: latestRun.get('id'),
      idempotencyKey: 'same-resume-click-different-source',
    });
    const second = await resumeSession(session.get('id'), {
      message: 'Continue once',
      resumedFromRunId: run.get('id'),
      idempotencyKey: 'same-resume-click-different-source',
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(JSON.stringify(second.body)).toContain('different resume source run');
    const continuationCount = await app.db.getRepository('agRuns').count({
      filter: {
        agentSessionId: session.get('id'),
        continuationReason: 'user-message',
      },
    });
    expect(continuationCount).toBe(1);
  });

  it('rejects missing idempotencyKey without creating a continuation run', async () => {
    const { session } = await seedEndedSession();
    const response = await resumeSession(session.get('id'), {
      message: 'Continue without key',
    });

    expect(response.status).toBe(400);
    const continuationCount = await app.db.getRepository('agRuns').count({
      filter: {
        agentSessionId: session.get('id'),
        continuationReason: 'user-message',
      },
    });
    expect(continuationCount).toBe(0);
  });

  it('rejects unsupported providers and missing provider session ids clearly', async () => {
    const unsupported = await seedEndedSession({
      provider: 'opencode',
      providerSessionId: 'opencode-session',
      capabilitiesJson: {
        resumeWithMessage: false,
      },
    });
    const unsupportedResponse = await resumeSession(unsupported.session.get('id'), {
      message: 'Continue',
      idempotencyKey: 'unsupported-provider',
    });
    expect(unsupportedResponse.status).toBe(409);

    const missingProviderSession = await seedEndedSession({
      providerSessionId: null,
    });
    const missingResponse = await resumeSession(missingProviderSession.session.get('id'), {
      message: 'Continue',
      idempotencyKey: 'missing-provider-session',
    });
    expect(missingResponse.status).toBe(409);
  });

  it('checks run visibility before exposing resume capability errors for hidden sessions', async () => {
    const visible = await seedEndedSession();
    const hiddenUnsupported = await seedEndedSession({
      provider: 'opencode',
      providerSessionId: 'hidden-opencode-session',
      capabilitiesJson: {
        resumeWithMessage: false,
      },
    });
    const { agent: scopedAgent, roleName } = await createUserWithRole('resume-hidden-unsupported-user', [
      'agentGateway.resumeAgentSession',
    ]);
    await grantRunScope(roleName, 'resume-hidden-unsupported-visible-source', {
      runCode: visible.run.get('runCode'),
    });

    const response = await scopedAgent
      .post(`/api/agent-gateway/agent-sessions/${hiddenUnsupported.session.get('id')}/resume`)
      .send({
        message: 'Continue hidden unsupported session',
        idempotencyKey: 'hidden-unsupported-resume',
      });

    expect(response.status).toBe(404);
    const responseBody = JSON.stringify(response.body);
    expect(responseBody).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
    expect(responseBody).not.toContain('provider does not support resume');
    expect(responseBody).not.toContain('does not support resume with message');
    expect(responseBody).not.toContain('provider session id');
  });

  it('checks target session visibility before explicit resume source mismatch errors', async () => {
    const visible = await seedEndedSession();
    const hidden = await seedEndedSession({
      providerSessionId: `hidden-mismatch-${randomUUID()}`,
    });
    const { agent: scopedAgent, roleName } = await createUserWithRole('resume-hidden-session-mismatch-user', [
      'agentGateway.resumeAgentSession',
    ]);
    await grantRunScope(roleName, 'resume-hidden-session-mismatch-visible-source', {
      runCode: visible.run.get('runCode'),
    });

    const response = await scopedAgent
      .post(`/api/agent-gateway/agent-sessions/${hidden.session.get('id')}/resume`)
      .send({
        message: 'Continue with visible run against hidden session',
        resumedFromRunId: visible.run.get('id'),
        idempotencyKey: 'hidden-session-visible-source-mismatch',
      });

    expect(response.status).toBe(404);
    const responseBody = JSON.stringify(response.body);
    expect(responseBody).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
    expect(responseBody).not.toContain('resumedFromRunId must belong to the agent session');
  });
});
