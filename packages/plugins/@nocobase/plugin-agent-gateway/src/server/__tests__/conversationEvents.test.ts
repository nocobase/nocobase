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
import { createNodeToken, toStoredTokenFields } from '../security';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function expectString(value: unknown) {
  expect(typeof value).toBe('string');
  return String(value);
}

describe('agent gateway conversation event APIs', () => {
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

  async function createRunner(profileKey = 'codex') {
    const nodeToken = createNodeToken();
    const now = new Date();
    const node = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey: `conversation-node-${profileKey}-${Date.now()}`,
        displayName: `Conversation Node ${profileKey}`,
        status: 'active',
        authMode: 'node-token',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: {
          maxConcurrency: 2,
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const nodeId = String(node.get('id'));
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId,
        profileKey,
        displayName: profileKey,
        agentType: 'code',
        driver: 'exec',
        status: 'active',
        capabilitiesJson: {
          maxConcurrency: 2,
        },
      },
    });

    return {
      nodeId,
      nodeToken: nodeToken.token,
      profileId: String(profile.get('id')),
      profileKey,
    };
  }

  async function createRun(runner: Awaited<ReturnType<typeof createRunner>>, runCode: string) {
    const response = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode,
      sourceType: 'test',
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
      promptSnapshot: {
        text: runCode,
      },
      executionPayload: {
        commandKey: 'codex',
        args: ['exec', '--json', `Prompt for ${runCode}`],
      },
    });
    expect(response.status).toBe(200);
    return getData(response);
  }

  async function claimRun(runner: Awaited<ReturnType<typeof createRunner>>, runId: unknown) {
    const response = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs:claim`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        profileKey: runner.profileKey,
        runId,
      });
    expect(response.status).toBe(200);
    return getData(response);
  }

  function leaseValues(claim: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
    return {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      ...overrides,
    };
  }

  async function upsertSession(
    runner: Awaited<ReturnType<typeof createRunner>>,
    claim: Record<string, unknown>,
    providerSessionId: string,
  ) {
    const response = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${claim.runId}/agent-session:upsert`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(
        leaseValues(claim, {
          provider: 'codex',
          providerSessionId,
          capabilities: {
            detectSessionId: true,
          },
        }),
      );
    expect(response.status).toBe(200);
    return getData(response);
  }

  async function appendConversationEvents(
    runner: Awaited<ReturnType<typeof createRunner>>,
    runId: unknown,
    values: Record<string, unknown>,
  ) {
    return await app
      .agent()
      .post(`/api/agent-gateway/runs/${runId}/conversation-events:append`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(values);
  }

  function registerTestSnippet(name: string, actions: string[]) {
    app.acl.registerSnippet({
      name,
      actions,
    });
    return name;
  }

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

  it('appends, dedupes, redacts, and lists normalized conversation events by run and session', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-1');
    const claim = await claimRun(runner, run.id);
    const sessionResult = await upsertSession(runner, claim, 'codex-conversation-thread-1');
    const session = sessionResult.session as Record<string, unknown>;
    const sessionId = expectString(session.id);

    const mismatchedSessionResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.message',
        sessionId: randomUUID(),
      }),
    );
    expect(mismatchedSessionResponse.status).toBe(400);

    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        events: [
          {
            source: 'codex',
            sequence: 1,
            eventType: 'agent.session.started',
            providerEventId: 'thread.started:codex-conversation-thread-1',
            contentText: 'Authorization: Bearer CONVERSATION_TEXT_SECRET',
            contentJson: {
              token: 'CONVERSATION_JSON_SECRET',
              command: 'CONVERSATION_COMMAND_SECRET',
            },
          },
          {
            source: 'codex',
            sequence: 2,
            eventType: 'agent.message',
            providerEventId: 'item.completed:item-1',
            correlationId: 'item-1',
            confidence: 0.9,
            contentText: 'visible timeline message',
            contentJson: {
              note: 'safe',
            },
          },
        ],
      }),
    );
    expect(appendResponse.status).toBe(200);
    const appended = getData(appendResponse).events as Array<Record<string, unknown>>;
    expect(appended).toHaveLength(2);
    expect(appended[0].sessionId).toBe(sessionId);
    expect(String(appended[0].contentText)).toContain('Authorization: [REDACTED]');
    expect(JSON.stringify(appended[0])).not.toContain('CONVERSATION_TEXT_SECRET');
    expect(appended[0].contentJson).toMatchObject({
      token: '[REDACTED]',
      command: '[REDACTED]',
    });
    expect(JSON.stringify(appended[0])).not.toContain('CONVERSATION_JSON_SECRET');
    expect(JSON.stringify(appended[0])).not.toContain('CONVERSATION_COMMAND_SECRET');

    const retryResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 99,
        eventType: 'agent.session.started',
        providerEventId: 'thread.started:codex-conversation-thread-1',
        contentText: 'changed retry text',
      }),
    );
    expect(retryResponse.status).toBe(200);
    const retryEvents = getData(retryResponse).events as Array<Record<string, unknown>>;
    expect(retryEvents[0]).toMatchObject({
      id: appended[0].id,
      idempotent: true,
    });
    expect(await app.db.getRepository('agAgentConversationEvents').count({ filter: { runId: run.id } })).toBe(2);

    const runListResponse = await rootAgent.get(`/api/agent-gateway/runs/${run.id}/conversation-events:list`);
    expect(runListResponse.status).toBe(200);
    const runEvents = runListResponse.body.data as Array<Record<string, unknown>>;
    expect(runEvents.map((event) => event.eventType)).toEqual(['agent.session.started', 'agent.message']);
    expect(runEvents[1]).toMatchObject({
      contentText: 'visible timeline message',
      correlationId: 'item-1',
    });

    const sessionListResponse = await rootAgent.get(
      `/api/agent-gateway/agent-sessions/${sessionId}/conversation-events:list`,
    );
    expect(sessionListResponse.status).toBe(200);
    const sessionEvents = sessionListResponse.body.data as Array<Record<string, unknown>>;
    expect(sessionEvents).toHaveLength(2);
    expect(JSON.stringify(sessionEvents)).not.toContain('CONVERSATION_TEXT_SECRET');

    const orphanSession = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: 'codex',
        providerSessionId: 'orphan-conversation-thread',
        status: 'active',
      },
    });
    const orphanSessionListResponse = await rootAgent.get(
      `/api/agent-gateway/agent-sessions/${String(orphanSession.get('id'))}/conversation-events:list`,
    );
    expect(orphanSessionListResponse.status).toBe(404);
  });

  it('downgrades command events to semantic timeline text', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-command-text');
    const claim = await claimRun(runner, run.id);

    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.command.completed',
        providerEventId: 'item.completed:command-1',
        contentText: 'RAW_COMMAND_OUTPUT_SHOULD_NOT_BE_TIMELINE',
        contentJson: {
          status: 'completed',
          exitCode: 0,
          stdout: 'RAW_COMMAND_STDOUT_SHOULD_NOT_BE_TIMELINE',
          aggregated_output: 'RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_NOT_BE_TIMELINE',
        },
      }),
    );
    expect(appendResponse.status).toBe(200);
    const appended = getData(appendResponse).events as Array<Record<string, unknown>>;
    expect(appended[0]).toMatchObject({
      eventType: 'agent.command.completed',
      contentText: 'Command completed',
      contentJson: {
        status: 'completed',
        exitCode: 0,
      },
    });
    expect(JSON.stringify(appended)).not.toContain('RAW_COMMAND_OUTPUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(appended)).not.toContain('RAW_COMMAND_STDOUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(appended)).not.toContain('RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_NOT_BE_TIMELINE');

    const storedEvent = await app.db.getRepository('agAgentConversationEvents').findOne({
      filterByTk: appended[0].id,
    });
    expect(storedEvent?.get('contentText')).toBe('Command completed');
    expect(storedEvent?.get('contentJson')).toMatchObject({
      status: 'completed',
      exitCode: 0,
    });
    expect(JSON.stringify(storedEvent?.toJSON())).not.toContain('RAW_COMMAND_OUTPUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(storedEvent?.toJSON())).not.toContain('RAW_COMMAND_STDOUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(storedEvent?.toJSON())).not.toContain('RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_NOT_BE_TIMELINE');

    const runListResponse = await rootAgent.get(`/api/agent-gateway/runs/${run.id}/conversation-events:list`);
    expect(runListResponse.status).toBe(200);
    expect(runListResponse.body.data[0]).toMatchObject({
      eventType: 'agent.command.completed',
      contentText: 'Command completed',
      contentJson: {
        status: 'completed',
        exitCode: 0,
      },
    });
    expect(JSON.stringify(runListResponse.body.data)).not.toContain('RAW_COMMAND_OUTPUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(runListResponse.body.data)).not.toContain('RAW_COMMAND_STDOUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(runListResponse.body.data)).not.toContain(
      'RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_NOT_BE_TIMELINE',
    );

    await app.db.getRepository('agAgentConversationEvents').update({
      filterByTk: appended[0].id,
      values: {
        contentText: 'OLD_RAW_COMMAND_TEXT_SHOULD_NOT_BE_TIMELINE',
        contentJson: {
          status: 'failed',
          exitCode: 1,
          stdout: 'OLD_RAW_COMMAND_STDOUT_SHOULD_NOT_BE_TIMELINE',
          aggregated_output: 'OLD_RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_NOT_BE_TIMELINE',
        },
      },
    });

    const oldRowRetryResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 99,
        eventType: 'agent.command.completed',
        providerEventId: 'item.completed:command-1',
        contentText: 'retry raw command output',
      }),
    );
    expect(oldRowRetryResponse.status).toBe(200);
    const oldRowRetryEvents = getData(oldRowRetryResponse).events as Array<Record<string, unknown>>;
    expect(oldRowRetryEvents[0]).toMatchObject({
      id: appended[0].id,
      idempotent: true,
      contentText: 'Command failed',
      contentJson: {
        status: 'failed',
        exitCode: 1,
      },
    });
    expect(JSON.stringify(oldRowRetryEvents)).not.toContain('OLD_RAW_COMMAND_TEXT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(oldRowRetryEvents)).not.toContain('OLD_RAW_COMMAND_STDOUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(oldRowRetryEvents)).not.toContain('OLD_RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_NOT_BE_TIMELINE');

    const oldRowListResponse = await rootAgent.get(`/api/agent-gateway/runs/${run.id}/conversation-events:list`);
    expect(oldRowListResponse.status).toBe(200);
    expect(oldRowListResponse.body.data[0]).toMatchObject({
      eventType: 'agent.command.completed',
      contentText: 'Command failed',
      contentJson: {
        status: 'failed',
        exitCode: 1,
      },
    });
    expect(JSON.stringify(oldRowListResponse.body.data)).not.toContain('OLD_RAW_COMMAND_TEXT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(oldRowListResponse.body.data)).not.toContain('OLD_RAW_COMMAND_STDOUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(oldRowListResponse.body.data)).not.toContain(
      'OLD_RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_NOT_BE_TIMELINE',
    );
  });

  it('derives parsed tool calls and stats from conversation events', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-tool-stats');
    const claim = await claimRun(runner, run.id);

    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        events: [
          {
            source: 'terminal-live',
            sequence: 1,
            eventType: 'agent.message',
            contentText:
              'Preparing the task.\n\nexec\nnb test agentTranscript\nfailed in 12ms with exit code 1\n\nContinuing with a fix.',
            contentJson: {
              live: true,
              stream: 'terminal',
            },
          },
          {
            source: 'codex',
            sequence: 2,
            eventType: 'agent.command.completed',
            providerEventId: 'item.completed:tool-stats-command',
            contentJson: {
              status: 'succeeded',
              exitCode: 0,
            },
          },
        ],
      }),
    );
    expect(appendResponse.status).toBe(200);

    const toolCallsResponse = await rootAgent.get(`/api/agent-gateway/runs/${run.id}/tool-calls:list`);
    expect(toolCallsResponse.status).toBe(200);
    const toolCallsData = getData(toolCallsResponse) as {
      toolCalls?: Array<Record<string, unknown>>;
      stats?: Record<string, unknown>;
    };
    expect(toolCallsData.toolCalls).toHaveLength(2);
    expect(toolCallsData.toolCalls?.[0]).toMatchObject({
      kind: 'exec',
      status: 'failed',
      command: 'nb test agentTranscript',
      exitCode: 1,
    });
    expect(toolCallsData.stats).toMatchObject({
      total: 2,
      failed: 1,
      succeeded: 1,
    });

    const statsResponse = await rootAgent.get('/api/agent-gateway/tool-calls:stats?limit=10');
    expect(statsResponse.status).toBe(200);
    const statsData = getData(statsResponse) as {
      toolCallCount?: number;
      runs?: Array<Record<string, unknown>>;
      stats?: Record<string, unknown>;
    };
    expect(statsData.toolCallCount).toBeGreaterThanOrEqual(2);
    expect(statsData.stats).toMatchObject({
      failed: expect.any(Number),
      succeeded: expect.any(Number),
    });
    expect(statsData.runs?.find((item) => item.runId === run.id)).toMatchObject({
      runCode: 'conversation-run-tool-stats',
      toolCallCount: 2,
    });
  });

  it('applies scoped run visibility to session-level conversation reads', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-scoped-hidden');
    const claim = await claimRun(runner, run.id);
    const sessionResult = await upsertSession(runner, claim, 'codex-conversation-thread-scoped');
    const session = sessionResult.session as Record<string, unknown>;
    const sessionId = expectString(session.id);

    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.message',
        contentText: 'scoped session message',
      }),
    );
    expect(appendResponse.status).toBe(200);

    const readDetailsSnippet = registerTestSnippet('agentGateway.test.readDetailsOnly', [
      'agentGateway:readRunDetails',
    ]);
    const { agent: scopedReader, roleName } = await createUserWithRole('conversation-scoped-reader', [
      readDetailsSnippet,
      'agentGateway.readSessionMessages',
    ]);
    const scopeResponse = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: 'agRuns',
        name: 'conversation-hidden-runs',
        scope: {
          runCode: 'conversation-run-other',
        },
      },
    });
    expect(scopeResponse.status).toBe(200);
    await rootAgent.resource('roles.resources', roleName).create({
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

    const hiddenSessionResponse = await scopedReader.get(
      `/api/agent-gateway/agent-sessions/${sessionId}/conversation-events:list`,
    );
    expect(hiddenSessionResponse.status).toBe(404);
    expect(JSON.stringify(hiddenSessionResponse.body)).not.toContain('scoped session message');

    const hiddenRunResponse = await scopedReader.get(`/api/agent-gateway/runs/${run.id}/conversation-events:list`);
    expect(hiddenRunResponse.status).toBe(404);
    expect(JSON.stringify(hiddenRunResponse.body)).not.toContain('scoped session message');
  });

  it('filters session-level conversation events to the readable runs in that session', async () => {
    const runner = await createRunner();
    const visibleRun = await createRun(runner, 'conversation-run-scoped-visible');
    const claim = await claimRun(runner, visibleRun.id);
    const sessionResult = await upsertSession(runner, claim, 'codex-conversation-thread-partial-scope');
    const session = sessionResult.session as Record<string, unknown>;
    const sessionId = expectString(session.id);

    const visibleAppendResponse = await appendConversationEvents(
      runner,
      visibleRun.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.message',
        contentText: 'visible scoped session message',
      }),
    );
    expect(visibleAppendResponse.status).toBe(200);

    const hiddenRun = await app.db.getRepository('agRuns').create({
      values: {
        id: randomUUID(),
        runCode: `conversation-run-scoped-hidden-${randomUUID()}`,
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        sourceType: 'test',
        promptSnapshot: {
          text: 'Hidden scoped prompt',
        },
        executionPayloadJson: {
          commandKey: 'codex',
        },
        requestedAt: new Date(),
        queuedAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
        finishedAt: new Date(),
        agentSessionId: sessionId,
        agentSessionProvider: 'codex',
        agentSessionProviderId: 'codex-conversation-thread-partial-scope',
      },
    });
    await app.db.getRepository('agAgentConversationEvents').create({
      values: {
        id: randomUUID(),
        sessionId,
        runId: hiddenRun.get('id'),
        source: 'codex',
        sequence: 1,
        eventType: 'agent.message',
        providerEventId: `hidden:${hiddenRun.get('id')}`,
        contentText: 'hidden scoped session message',
        contentJson: {},
      },
    });

    const readDetailsSnippet = registerTestSnippet('agentGateway.test.readDetailsOnlyPartialScope', [
      'agentGateway:readRunDetails',
    ]);
    const { agent: scopedReader, roleName } = await createUserWithRole('conversation-partial-scoped-reader', [
      readDetailsSnippet,
      'agentGateway.readSessionMessages',
    ]);
    const scopeResponse = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: 'agRuns',
        name: 'conversation-visible-runs',
        scope: {
          runCode: 'conversation-run-scoped-visible',
        },
      },
    });
    expect(scopeResponse.status).toBe(200);
    await rootAgent.resource('roles.resources', roleName).create({
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

    const sessionResponse = await scopedReader.get(
      `/api/agent-gateway/agent-sessions/${sessionId}/conversation-events:list`,
    );
    expect(sessionResponse.status).toBe(200);
    expect(JSON.stringify(sessionResponse.body.data)).toContain('visible scoped session message');
    expect(JSON.stringify(sessionResponse.body.data)).not.toContain('hidden scoped session message');
  });

  it('rejects conversation event writes without a valid active node lease', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-lease');
    const claim = await claimRun(runner, run.id);

    const missingNodeTokenResponse = await app
      .agent()
      .post(`/api/agent-gateway/runs/${run.id}/conversation-events:append`)
      .send(
        leaseValues(claim, {
          source: 'codex',
          sequence: 1,
          eventType: 'agent.message',
        }),
      );
    expect(missingNodeTokenResponse.status).toBe(401);

    const wrongClaimTokenResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        claimToken: 'ag_claim_wrong',
        source: 'codex',
        sequence: 1,
        eventType: 'agent.message',
      }),
    );
    expect(wrongClaimTokenResponse.status).toBe(409);
    expect(getData(wrongClaimTokenResponse)).toMatchObject({
      code: 'lease_lost',
    });

    await app.db.getRepository('agRuns').update({
      filterByTk: run.id,
      values: {
        leaseVersion: Number(claim.leaseVersion) + 2,
      },
    });
    const staleButCurrentClaimResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'terminal-live',
        sequence: 1,
        eventType: 'agent.message',
        contentText: 'live output written after heartbeat advanced the lease',
      }),
    );
    expect(staleButCurrentClaimResponse.status).toBe(200);

    const futureLeaseResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        leaseVersion: Number(claim.leaseVersion) + 99,
        source: 'terminal-live',
        sequence: 2,
        eventType: 'agent.message',
      }),
    );
    expect(futureLeaseResponse.status).toBe(409);

    await app.db.getRepository('agRuns').update({
      filterByTk: run.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });
    const expiredLeaseResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.message',
      }),
    );
    expect(expiredLeaseResponse.status).toBe(409);

    const otherRunner = await createRunner('codex-other');
    const otherNodeResponse = await appendConversationEvents(
      otherRunner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.message',
      }),
    );
    expect(otherNodeResponse.status).toBe(409);
    expect(await app.db.getRepository('agAgentConversationEvents').count({ filter: { runId: run.id } })).toBe(1);
  });

  it('enforces readSessionMessages and blocks raw collection bypasses', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-permission');
    const claim = await claimRun(runner, run.id);
    await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.message',
        contentText: 'permission visible message',
      }),
    );

    const listOnlyAgent = await createUserAgent('conversation-list-only', ['agentGateway.readRuns']);
    expect((await listOnlyAgent.get('/api/agent-gateway/runs:list')).status).toBe(200);
    expect((await listOnlyAgent.get(`/api/agent-gateway/runs/${run.id}/conversation-events:list`)).status).toBe(403);

    const messageReader = await createUserAgent('conversation-message-reader', ['agentGateway.readSessionMessages']);
    expect((await messageReader.get(`/api/agent-gateway/runs/${run.id}/conversation-events:list`)).status).toBe(200);

    const runAndMessageReader = await createUserAgent('conversation-run-message-reader', [
      'agentGateway.readRun',
      'agentGateway.readSessionMessages',
    ]);
    expect((await runAndMessageReader.get(`/api/agent-gateway/runs/${run.id}/conversation-events:list`)).status).toBe(
      200,
    );

    const detailReader = await createUserAgent('conversation-detail-reader', ['agentGateway.readRunDetails']);
    const deniedResponse = await detailReader.get(`/api/agent-gateway/runs/${run.id}/conversation-events:list`);
    expect(deniedResponse.status).toBe(403);

    const rawConversationSnippet = registerTestSnippet('agentGateway.test.rawConversationEvents', [
      'agAgentConversationEvents:list',
    ]);
    const rawConversationAgent = await createUserAgent('conversation-raw-reader', [rawConversationSnippet]);
    expect((await rawConversationAgent.get('/api/agAgentConversationEvents:list')).status).toBe(403);
  });
});
