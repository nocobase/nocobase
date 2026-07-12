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
import { buildRunObservabilityRollup } from '../services/observationRollup';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
    meta?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function expectString(value: unknown) {
  expect(typeof value).toBe('string');
  return String(value);
}

function getTime(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  return date.getTime();
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
    const response = await rootAgent.post('/agentGatewayApi:createRun').send({
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
      .post(`/agentGatewayApi:claimRun/${runner.nodeId}`)
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
      .post(`/agentGatewayApi:upsertAgentSession/${claim.runId}`)
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
      .post(`/agentGatewayApi:appendConversationEvents/${runId}`)
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

  it('appends, dedupes, preserves, and lists normalized conversation events by run and session', async () => {
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
              participant: {
                id: 'sub-agent:aquinas',
                type: 'sub-agent',
                name: 'Aquinas',
                parentId: 'agent:root',
                provider: 'codex',
              },
            },
          },
        ],
      }),
    );
    expect(appendResponse.status).toBe(200);
    const appended = getData(appendResponse).events as Array<Record<string, unknown>>;
    expect(appended).toHaveLength(2);
    expect(appended[0].sessionId).toBe(sessionId);
    expect(String(appended[0].contentText)).toContain('Authorization: Bearer CONVERSATION_TEXT_SECRET');
    expect(appended[0].contentJson).toMatchObject({
      token: 'CONVERSATION_JSON_SECRET',
      command: 'CONVERSATION_COMMAND_SECRET',
    });
    expect(JSON.stringify(appended[0])).toContain('CONVERSATION_TEXT_SECRET');
    expect(JSON.stringify(appended[0])).toContain('CONVERSATION_JSON_SECRET');
    expect(JSON.stringify(appended[0])).toContain('CONVERSATION_COMMAND_SECRET');
    const runAfterAppend = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    const firstTerminalActivityAt = getTime(runAfterAppend.get('terminalLastActivityAt'));
    expect(Number.isFinite(firstTerminalActivityAt)).toBe(true);

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
    const runAfterRetry = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(getTime(runAfterRetry.get('terminalLastActivityAt'))).toBe(firstTerminalActivityAt);

    const runListResponse = await rootAgent.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`);
    expect(runListResponse.status).toBe(200);
    const runEvents = runListResponse.body.data as Array<Record<string, unknown>>;
    expect(runEvents.map((event) => event.eventType)).toEqual(['agent.session.started', 'agent.message']);
    expect(runEvents[1]).toMatchObject({
      contentText: 'visible timeline message',
      correlationId: 'item-1',
      contentJson: {
        participant: {
          id: 'sub-agent:aquinas',
          type: 'sub-agent',
          name: 'Aquinas',
          parentId: 'agent:root',
          provider: 'codex',
        },
      },
    });

    const sessionListResponse = await rootAgent.get(`/agentGatewayApi:listSessionConversationEvents/${sessionId}`);
    expect(sessionListResponse.status).toBe(200);
    const sessionEvents = sessionListResponse.body.data as Array<Record<string, unknown>>;
    expect(sessionEvents).toHaveLength(2);
    expect(JSON.stringify(sessionEvents)).toContain('CONVERSATION_TEXT_SECRET');

    const orphanSession = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: 'codex',
        providerSessionId: 'orphan-conversation-thread',
        status: 'active',
      },
    });
    const orphanSessionListResponse = await rootAgent.get(
      `/agentGatewayApi:listSessionConversationEvents/${String(orphanSession.get('id'))}`,
    );
    expect(orphanSessionListResponse.status).toBe(404);
  });

  it('returns bounded latest pages, older cursors, and later same-timestamp ingests with lower UUIDs', async () => {
    const runner = await createRunner('cursor');
    const run = await createRun(runner, 'conversation-run-cursor');
    const runId = expectString(run.id);
    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        nodeId: runner.nodeId,
        provider: 'codex',
        providerSessionId: `cursor-session-${runId}`,
        rootRunId: runId,
        latestRunId: runId,
        status: 'active',
      },
    });
    const sessionId = expectString(session.get('id'));
    await app.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        agentSessionId: sessionId,
        agentSessionProvider: 'codex',
        agentSessionProviderId: `cursor-session-${runId}`,
      },
    });
    const repository = app.db.getRepository('agAgentConversationEvents');
    const timestamps = [
      new Date('2026-07-11T01:00:00.000Z'),
      new Date('2026-07-11T01:00:01.000Z'),
      new Date('2026-07-11T01:00:02.000Z'),
      new Date('2026-07-11T01:00:03.000Z'),
    ];
    const eventIds = [
      '80000000-0000-4000-8000-000000000001',
      '80000000-0000-4000-8000-000000000002',
      '80000000-0000-4000-8000-000000000003',
      '80000000-0000-4000-8000-000000000004',
    ];
    const createdIds: string[] = [];
    for (let index = 0; index < timestamps.length; index += 1) {
      const event = await app.db.sequelize.transaction(async (transaction) => {
        return await repository.create({
          values: {
            id: eventIds[index],
            sessionId,
            runId,
            source: index % 2 === 0 ? 'codex' : 'opencode',
            sequence: Math.floor(index / 2) + 1,
            eventType: 'agent.message',
            contentText: `cursor-event-${index + 1}`,
            contentJson: {},
          },
          transaction,
        });
      });
      const eventId = expectString(event.get('id'));
      createdIds.push(eventId);
      await app.db
        .getCollection('agAgentConversationEvents')
        .model.update({ createdAt: timestamps[index] }, { where: { id: eventId }, hooks: false });
    }

    const latestResponse = await rootAgent
      .get(`/agentGatewayApi:listRunConversationEvents/${runId}`)
      .query({ pageSize: 2 });
    expect(latestResponse.status).toBe(200);
    expect((latestResponse.body.data as Array<Record<string, unknown>>).map((event) => event.contentText)).toEqual([
      'cursor-event-3',
      'cursor-event-4',
    ]);
    expect(latestResponse.body.meta).toMatchObject({
      pageSize: 2,
      hasMoreBefore: true,
      hasMoreAfter: false,
    });
    const beforeCursor = expectString(latestResponse.body.meta?.beforeCursor);
    const afterCursor = expectString(latestResponse.body.meta?.afterCursor);
    const latestSessionResponse = await rootAgent
      .get(`/agentGatewayApi:listSessionConversationEvents/${sessionId}`)
      .query({ pageSize: 2 });
    expect(latestSessionResponse.status).toBe(200);
    expect(
      (latestSessionResponse.body.data as Array<Record<string, unknown>>).map((event) => event.contentText),
    ).toEqual(['cursor-event-3', 'cursor-event-4']);
    const sessionAfterCursor = expectString(latestSessionResponse.body.meta?.afterCursor);

    const olderResponse = await rootAgent
      .get(`/agentGatewayApi:listRunConversationEvents/${runId}`)
      .query({ pageSize: 2, beforeCursor });
    expect(olderResponse.status).toBe(200);
    expect((olderResponse.body.data as Array<Record<string, unknown>>).map((event) => event.contentText)).toEqual([
      'cursor-event-1',
      'cursor-event-2',
    ]);
    expect(olderResponse.body.meta).toMatchObject({
      pageSize: 2,
      hasMoreBefore: false,
    });

    const deltaIds: string[] = [];
    for (const [id, source, sequence] of [
      ['00000000-0000-4000-8000-000000000001', 'cloud-code', 0],
      ['00000000-0000-4000-8000-000000000002', 'codex', 3],
    ] as const) {
      const event = await app.db.sequelize.transaction(async (transaction) => {
        return await repository.create({
          values: {
            id,
            sessionId,
            runId,
            source,
            sequence,
            eventType: 'agent.message',
            contentText: `delta-${source}`,
            contentJson: {},
          },
          transaction,
        });
      });
      const eventId = expectString(event.get('id'));
      deltaIds.push(eventId);
      await app.db
        .getCollection('agAgentConversationEvents')
        .model.update({ createdAt: timestamps[3] }, { where: { id: eventId }, hooks: false });
    }

    const deltaResponse = await rootAgent
      .get(`/agentGatewayApi:listRunConversationEvents/${runId}`)
      .query({ pageSize: 10, afterCursor });
    expect(deltaResponse.status).toBe(200);
    const deltaEvents = deltaResponse.body.data as Array<Record<string, unknown>>;
    expect(deltaEvents.map((event) => event.id).sort()).toEqual([...deltaIds].sort());
    expect(deltaEvents.map((event) => event.contentText).sort()).toEqual(['delta-cloud-code', 'delta-codex']);
    expect(deltaResponse.body.meta).toMatchObject({
      hasMoreAfter: false,
    });

    const sessionDeltaResponse = await rootAgent
      .get(`/agentGatewayApi:listSessionConversationEvents/${sessionId}`)
      .query({ pageSize: 10, afterCursor: sessionAfterCursor });
    expect(sessionDeltaResponse.status).toBe(200);
    expect((sessionDeltaResponse.body.data as Array<Record<string, unknown>>).map((event) => event.id).sort()).toEqual(
      [...deltaIds].sort(),
    );

    expect(
      (await rootAgent.get(`/agentGatewayApi:listRunConversationEvents/${runId}`).query({ pageSize: 0 })).status,
    ).toBe(400);
    expect(
      (await rootAgent.get(`/agentGatewayApi:listRunConversationEvents/${runId}`).query({ afterCursor: 'bad' })).status,
    ).toBe(400);
    expect(
      (await rootAgent.get(`/agentGatewayApi:listRunConversationEvents/${runId}`).query({ beforeCursor, afterCursor }))
        .status,
    ).toBe(400);
  });

  it('keeps command events semantic in timeline text while preserving command details', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-command-text');
    const claim = await claimRun(runner, run.id);
    const rawCommandOutput = 'RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT';

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
          command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
          status: 'completed',
          exitCode: 0,
          participant: {
            id: 'sub-agent:aquinas',
            type: 'sub-agent',
            name: 'Aquinas',
          },
          stdout: 'RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT',
          stderr: 'RAW_COMMAND_STDERR_SHOULD_BE_TOOL_OUTPUT',
          aggregated_output: rawCommandOutput,
          durationMs: 1234,
        },
      }),
    );
    expect(appendResponse.status).toBe(200);
    const appended = getData(appendResponse).events as Array<Record<string, unknown>>;
    expect(appended[0]).toMatchObject({
      eventType: 'agent.command.completed',
      contentText: 'Command completed',
      contentJson: {
        participant: {
          id: 'sub-agent:aquinas',
          type: 'sub-agent',
          name: 'Aquinas',
        },
        status: 'completed',
        exitCode: 0,
        command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
        stdout: 'RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT',
        stderr: 'RAW_COMMAND_STDERR_SHOULD_BE_TOOL_OUTPUT',
        aggregated_output: rawCommandOutput,
        durationMs: 1234,
      },
    });
    expect(JSON.stringify(appended)).not.toContain('RAW_COMMAND_OUTPUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(appended)).toContain('RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT');
    expect(JSON.stringify(appended)).toContain('RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT');

    const storedEvent = await app.db.getRepository('agAgentConversationEvents').findOne({
      filterByTk: appended[0].id,
    });
    expect(storedEvent?.get('contentText')).toBe('Command completed');
    expect(storedEvent?.get('contentJson')).toMatchObject({
      status: 'completed',
      exitCode: 0,
      command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
      stdout: 'RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT',
      aggregated_output: rawCommandOutput,
      durationMs: 1234,
    });
    expect(JSON.stringify(storedEvent?.toJSON())).not.toContain('RAW_COMMAND_OUTPUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(storedEvent?.toJSON())).toContain('RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT');
    expect(JSON.stringify(storedEvent?.toJSON())).toContain('RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT');

    const runListResponse = await rootAgent.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`);
    expect(runListResponse.status).toBe(200);
    expect(runListResponse.body.data[0]).toMatchObject({
      eventType: 'agent.command.completed',
      contentText: 'Command completed',
      contentJson: {
        status: 'completed',
        exitCode: 0,
        command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
        stdout: 'RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT',
        aggregated_output: rawCommandOutput,
        durationMs: 1234,
      },
    });
    expect(JSON.stringify(runListResponse.body.data)).not.toContain('RAW_COMMAND_OUTPUT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(runListResponse.body.data)).toContain('RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT');
    expect(JSON.stringify(runListResponse.body.data)).toContain('RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT');

    await app.db.getRepository('agAgentConversationEvents').update({
      filterByTk: appended[0].id,
      values: {
        contentText: 'OLD_RAW_COMMAND_TEXT_SHOULD_NOT_BE_TIMELINE',
        contentJson: {
          status: 'failed',
          exitCode: 1,
          command: 'cat old.log',
          stdout: 'OLD_RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT',
          aggregated_output: 'OLD_RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT',
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
        command: 'cat old.log',
        stdout: 'OLD_RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT',
        aggregated_output: 'OLD_RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT',
      },
    });
    expect(JSON.stringify(oldRowRetryEvents)).not.toContain('OLD_RAW_COMMAND_TEXT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(oldRowRetryEvents)).toContain('OLD_RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT');
    expect(JSON.stringify(oldRowRetryEvents)).toContain('OLD_RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT');

    const oldRowListResponse = await rootAgent.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`);
    expect(oldRowListResponse.status).toBe(200);
    expect(oldRowListResponse.body.data[0]).toMatchObject({
      eventType: 'agent.command.completed',
      contentText: 'Command failed',
      contentJson: {
        status: 'failed',
        exitCode: 1,
        command: 'cat old.log',
        stdout: 'OLD_RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT',
        aggregated_output: 'OLD_RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT',
      },
    });
    expect(JSON.stringify(oldRowListResponse.body.data)).not.toContain('OLD_RAW_COMMAND_TEXT_SHOULD_NOT_BE_TIMELINE');
    expect(JSON.stringify(oldRowListResponse.body.data)).toContain('OLD_RAW_COMMAND_STDOUT_SHOULD_BE_TOOL_OUTPUT');
    expect(JSON.stringify(oldRowListResponse.body.data)).toContain(
      'OLD_RAW_COMMAND_AGGREGATED_OUTPUT_SHOULD_BE_TOOL_OUTPUT',
    );
  });

  it('accepts command output beyond the normal small contentJson limit', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-large-command-output');
    const claim = await claimRun(runner, run.id);
    const largeOutput = 'LARGE_COMMAND_OUTPUT_LINE\n'.repeat(2048);

    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.command.completed',
        providerEventId: 'item.completed:large-output-command',
        contentText: 'raw output should not become timeline text',
        contentJson: {
          command: 'node scripts/noisy-command.mjs',
          status: 'completed',
          exitCode: 0,
          output: largeOutput,
        },
      }),
    );

    expect(appendResponse.status).toBe(200);
    const appended = getData(appendResponse).events as Array<Record<string, unknown>>;
    expect(appended[0]).toMatchObject({
      eventType: 'agent.command.completed',
      contentText: 'Command completed',
      contentJson: {
        command: 'node scripts/noisy-command.mjs',
        output: largeOutput,
      },
    });

    const storedEvent = await app.db.getRepository('agAgentConversationEvents').findOne({
      filterByTk: appended[0].id,
    });
    expect(storedEvent?.get('contentJson')).toMatchObject({
      command: 'node scripts/noisy-command.mjs',
      output: largeOutput,
    });
  });

  it('accepts verbose transcript events beyond the normal small text and JSON limits', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-large-verbose-transcript');
    const claim = await claimRun(runner, run.id);
    const largeReasoningText = 'VISIBLE_REASONING_TRACE_LINE\n'.repeat(1024);
    const largeRawPayload = {
      type: 'unmapped.provider.event',
      payload: {
        output: 'RAW_PROVIDER_EVENT_LINE\n'.repeat(2048),
      },
    };

    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        events: [
          {
            source: 'codex',
            sequence: 1,
            eventType: 'agent.reasoning',
            providerEventId: 'reasoning:large',
            contentText: largeReasoningText,
            contentJson: {
              textKind: 'reasoning',
              rawProviderEvent: largeRawPayload,
            },
          },
          {
            source: 'codex',
            sequence: 2,
            eventType: 'agent.raw',
            providerEventId: 'raw:large',
            contentText: 'unmapped.provider.event',
            contentJson: {
              rawProviderEvent: largeRawPayload,
            },
          },
        ],
      }),
    );

    expect(appendResponse.status).toBe(200);
    const appended = getData(appendResponse).events as Array<Record<string, unknown>>;
    expect(appended).toHaveLength(2);
    expect(appended[0]).toMatchObject({
      eventType: 'agent.reasoning',
      contentText: largeReasoningText,
      contentJson: {
        textKind: 'reasoning',
        rawProviderEvent: largeRawPayload,
      },
    });
    expect(appended[1]).toMatchObject({
      eventType: 'agent.raw',
      contentJson: {
        rawProviderEvent: largeRawPayload,
      },
    });

    const runListResponse = await rootAgent.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`);
    expect(runListResponse.status).toBe(200);
    expect(runListResponse.body.data[0].contentText).toBe(largeReasoningText);
    expect(runListResponse.body.data[1].contentJson).toMatchObject({
      rawProviderEvent: largeRawPayload,
    });
  });

  it('preserves full tool call input and output for transcript rendering', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-tool-details');
    const claim = await claimRun(runner, run.id);
    const largeOutput = 'TOOL_OUTPUT_LINE\n'.repeat(2048);

    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        events: [
          {
            source: 'codex',
            sequence: 1,
            eventType: 'agent.tool.started',
            providerEventId: 'response_item:function_call:call-tool-details',
            correlationId: 'call-tool-details',
            contentText: 'exec_command',
            contentJson: {
              callId: 'call-tool-details',
              toolName: 'exec_command',
              input: {
                cmd: 'node scripts/run-suite.mjs --tasks tasks.yaml',
                workdir: '/root/work/myskills/skills/nb-opencode-ui-batch',
              },
              arguments: {
                cmd: 'node scripts/run-suite.mjs --tasks tasks.yaml',
              },
              command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
              env: {
                OPENAI_API_KEY: 'raw-key-is-accepted-for-internal-mvp',
              },
            },
          },
          {
            source: 'codex',
            sequence: 2,
            eventType: 'agent.tool.completed',
            providerEventId: 'response_item:function_call_output:call-tool-details',
            correlationId: 'call-tool-details',
            contentText: 'function_call_output',
            contentJson: {
              callId: 'call-tool-details',
              output: largeOutput,
              result: {
                exitCode: 0,
              },
            },
          },
        ],
      }),
    );

    expect(appendResponse.status).toBe(200);
    const appended = getData(appendResponse).events as Array<Record<string, unknown>>;
    expect(JSON.stringify(appended)).toContain('raw-key-is-accepted-for-internal-mvp');
    expect(appended[0]).toMatchObject({
      eventType: 'agent.tool.started',
      contentJson: {
        command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
        input: {
          cmd: 'node scripts/run-suite.mjs --tasks tasks.yaml',
          workdir: '/root/work/myskills/skills/nb-opencode-ui-batch',
        },
        env: {
          OPENAI_API_KEY: 'raw-key-is-accepted-for-internal-mvp',
        },
      },
    });
    expect(appended[1]).toMatchObject({
      eventType: 'agent.tool.completed',
      contentJson: {
        output: largeOutput,
      },
    });

    const toolCallsResponse = await rootAgent.get(`/agentGatewayApi:listRunToolCalls/${run.id}`);
    expect(toolCallsResponse.status).toBe(200);
    const toolCallsData = getData(toolCallsResponse) as {
      toolCalls?: Array<Record<string, unknown>>;
    };
    expect(toolCallsData.toolCalls).toHaveLength(1);
    expect(toolCallsData.toolCalls?.[0]).toMatchObject({
      status: 'succeeded',
      command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
      output: largeOutput,
      eventIds: [appended[0].id, appended[1].id],
    });
  });

  it('closes dangling running tool calls when a run has stalled', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-stalled-tool');
    const claim = await claimRun(runner, run.id);

    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        events: [
          {
            source: 'codex',
            sequence: 1,
            eventType: 'agent.command.started',
            providerEventId: 'item.started:item-stalled',
            correlationId: 'item-stalled',
            contentJson: {
              command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
              status: 'in_progress',
            },
          },
        ],
      }),
    );
    expect(appendResponse.status).toBe(200);

    await app.db.getRepository('agRuns').update({
      filterByTk: run.id,
      values: {
        status: 'stalled',
      },
    });

    const toolCallsResponse = await rootAgent.get(`/agentGatewayApi:listRunToolCalls/${run.id}`);
    expect(toolCallsResponse.status).toBe(200);
    const toolCallsData = getData(toolCallsResponse) as {
      toolCalls?: Array<Record<string, unknown>>;
      stats?: Record<string, unknown>;
    };
    expect(toolCallsData.toolCalls?.[0]).toMatchObject({
      status: 'unknown',
      command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
    });
    expect(toolCallsData.stats).toMatchObject({
      running: 0,
      unknown: 1,
    });
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

    const toolCallsResponse = await rootAgent.get(`/agentGatewayApi:listRunToolCalls/${run.id}`);
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

    const statsResponse = await rootAgent.get('/agentGatewayApi:listToolCallStats?limit=10');
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

  it('reads persisted tool stats without querying conversation events', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-persisted-tool-stats');
    const claim = await claimRun(runner, run.id);
    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        source: 'codex',
        sequence: 1,
        eventType: 'agent.command.completed',
        correlationId: 'persisted-tool-call',
        contentJson: {
          command: 'echo persisted',
          status: 'succeeded',
          exitCode: 0,
        },
      }),
    );
    expect(appendResponse.status).toBe(200);

    const conversationRepository = app.db.getRepository('agAgentConversationEvents');
    const persistedRun = await app.db.getRepository('agRuns').findOne({ filterByTk: run.id });
    const events = await conversationRepository.find({
      filter: {
        runId: run.id,
      },
      sort: ['createdAt', 'sequence'],
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: run.id,
      values: {
        observabilityRollupJson: buildRunObservabilityRollup(persistedRun, events, new Date()),
      },
    });

    const eventFindSpy = vi.spyOn(conversationRepository, 'find');
    const statsResponse = await rootAgent.get('/agentGatewayApi:listToolCallStats').query({ limit: 1 });

    expect(statsResponse.status).toBe(200);
    expect(eventFindSpy).not.toHaveBeenCalled();
    eventFindSpy.mockRestore();
    expect(getData(statsResponse)).toMatchObject({
      toolCallCount: 1,
      stats: {
        total: 1,
        succeeded: 1,
      },
      toolCalls: [],
      meta: {
        runLimit: 1,
        fallbackRunCount: 0,
        fallbackEventLimit: 100,
        fallbackEventCount: 0,
        fallbackEventsTruncated: false,
      },
    });
  });

  it('bounds legacy event fallback when persisted tool stats are unavailable', async () => {
    const runner = await createRunner();
    const run = await createRun(runner, 'conversation-run-bounded-tool-stats');
    const claim = await claimRun(runner, run.id);
    const appendResponse = await appendConversationEvents(
      runner,
      run.id,
      leaseValues(claim, {
        events: [
          {
            source: 'codex',
            sequence: 1,
            eventType: 'agent.command.completed',
            correlationId: 'bounded-tool-call-1',
            contentJson: {
              command: 'echo first',
              status: 'succeeded',
              exitCode: 0,
            },
          },
          {
            source: 'codex',
            sequence: 2,
            eventType: 'agent.command.failed',
            correlationId: 'bounded-tool-call-2',
            contentJson: {
              command: 'echo second',
              status: 'failed',
              exitCode: 1,
            },
          },
        ],
      }),
    );
    expect(appendResponse.status).toBe(200);

    const toolCallsResponse = await rootAgent
      .get(`/agentGatewayApi:listRunToolCalls/${run.id}`)
      .query({ eventLimit: 1 });
    expect(toolCallsResponse.status).toBe(200);
    expect(getData(toolCallsResponse)).toMatchObject({
      toolCalls: [
        expect.objectContaining({
          id: 'event-tool-bounded-tool-call-2',
          status: 'failed',
        }),
      ],
      meta: {
        eventLimit: 1,
        eventCount: 1,
        eventsTruncated: true,
      },
    });

    const conversationRepository = app.db.getRepository('agAgentConversationEvents');
    const eventFindSpy = vi.spyOn(conversationRepository, 'find');
    const statsResponse = await rootAgent.get('/agentGatewayApi:listToolCallStats').query({ limit: 1, eventLimit: 1 });

    expect(statsResponse.status).toBe(200);
    expect(eventFindSpy).toHaveBeenCalledTimes(1);
    expect(eventFindSpy.mock.calls[0]?.[0]).toMatchObject({
      limit: 2,
    });
    eventFindSpy.mockRestore();
    expect(getData(statsResponse)).toMatchObject({
      runCount: 1,
      toolCallCount: 1,
      meta: {
        runLimit: 1,
        fallbackRunCount: 1,
        fallbackEventLimit: 1,
        fallbackEventCount: 1,
        fallbackEventsTruncated: true,
      },
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

    const hiddenSessionResponse = await scopedReader.get(`/agentGatewayApi:listSessionConversationEvents/${sessionId}`);
    expect(hiddenSessionResponse.status).toBe(404);
    expect(JSON.stringify(hiddenSessionResponse.body)).not.toContain('scoped session message');

    const hiddenRunResponse = await scopedReader.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`);
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
    await app.db.sequelize.transaction(async (transaction) => {
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
        transaction,
      });
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

    const sessionResponse = await scopedReader.get(`/agentGatewayApi:listSessionConversationEvents/${sessionId}`);
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
      .post(`/agentGatewayApi:appendConversationEvents/${run.id}`)
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
    expect((await listOnlyAgent.get('/agentGatewayApi:listRuns')).status).toBe(200);
    expect((await listOnlyAgent.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`)).status).toBe(403);

    const messageReader = await createUserAgent('conversation-message-reader', ['agentGateway.readSessionMessages']);
    expect((await messageReader.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`)).status).toBe(200);

    const runAndMessageReader = await createUserAgent('conversation-run-message-reader', [
      'agentGateway.readRun',
      'agentGateway.readSessionMessages',
    ]);
    expect((await runAndMessageReader.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`)).status).toBe(200);

    const detailReader = await createUserAgent('conversation-detail-reader', ['agentGateway.readRunDetails']);
    const deniedResponse = await detailReader.get(`/agentGatewayApi:listRunConversationEvents/${run.id}`);
    expect(deniedResponse.status).toBe(403);

    const rawConversationSnippet = registerTestSnippet('agentGateway.test.rawConversationEvents', [
      'agAgentConversationEvents:list',
    ]);
    const rawConversationAgent = await createUserAgent('conversation-raw-reader', [rawConversationSnippet]);
    expect((await rawConversationAgent.get('/api/agAgentConversationEvents:list')).status).toBe(403);
  });
});
