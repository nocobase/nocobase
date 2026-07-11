/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';

import { MockServer, createMockServer } from '@nocobase/test';

import PluginAgentGatewayServer from '../plugin';
import { buildRunObservabilityRollup } from '../services/observationRollup';
import { AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE, cleanupAgentGatewayRetention } from '../services/retention';

function getExternalConversationSource(provider: string, format: string, batchKey: string, logIndex: number) {
  const source = ['external', provider, format, batchKey, String(logIndex)].join(':');
  return `${source}:${createHash('sha256').update(source).digest('hex').slice(0, 16)}`;
}

describe('agent gateway retention', () => {
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
    rootAgent = await app.agent().login(rootUser);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('deletes only expired observations and bounds each cleanup batch', async () => {
    const now = new Date('2026-07-11T00:00:00.000Z');
    const oldDate = new Date('2025-01-01T00:00:00.000Z');
    const recentDate = new Date('2026-07-10T00:00:00.000Z');
    const run = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'retention-run',
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 2,
        cancelRequested: false,
      },
    });
    const runId = run.get('id');
    const oldEvent = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agRunEvents').create({
        values: {
          runId,
          claimAttempt: 1,
          source: 'retention-test',
          sequence: 1,
          eventType: 'old.event',
          emittedAt: oldDate,
        },
        transaction,
      });
    });
    const secondOldEvent = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agRunEvents').create({
        values: {
          runId,
          claimAttempt: 1,
          source: 'retention-test',
          sequence: 2,
          eventType: 'old.event.2',
          emittedAt: oldDate,
        },
        transaction,
      });
    });
    const recentEvent = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agRunEvents').create({
        values: {
          runId,
          claimAttempt: 1,
          source: 'retention-test',
          sequence: 3,
          eventType: 'recent.event',
          emittedAt: recentDate,
        },
        transaction,
      });
    });
    await app.db
      .getCollection('agRunEvents')
      .model.update(
        { createdAt: oldDate },
        { where: { id: [oldEvent.get('id'), secondOldEvent.get('id')] }, hooks: false },
      );
    await app.db
      .getCollection('agRunEvents')
      .model.update({ createdAt: recentDate }, { where: { id: recentEvent.get('id') }, hooks: false });

    const oldArtifact = await app.db.getRepository('agRunArtifacts').create({
      values: {
        runId,
        claimAttempt: 1,
        artifactKey: 'old-artifact',
        artifactType: 'text',
      },
    });
    const recentArtifact = await app.db.getRepository('agRunArtifacts').create({
      values: {
        runId,
        claimAttempt: 1,
        artifactKey: 'recent-artifact',
        artifactType: 'text',
      },
    });
    await app.db
      .getCollection('agRunArtifacts')
      .model.update({ createdAt: oldDate }, { where: { id: oldArtifact.get('id') } });
    await app.db
      .getCollection('agRunArtifacts')
      .model.update({ createdAt: recentDate }, { where: { id: recentArtifact.get('id') } });

    const first = await cleanupAgentGatewayRetention({ db: app.db }, { now, batchSize: 1, maxBatchesPerCollection: 1 });
    expect(first.deletedByCollection.agRunEvents).toBe(1);
    expect(first.deletedByCollection.agRunArtifacts).toBe(1);
    expect(first.hasMore).toBe(true);
    expect(first.hasMoreByCollection.agRunEvents).toBe(true);
    expect(await app.db.getRepository('agRunEvents').count()).toBe(2);
    expect(await app.db.getRepository('agRunArtifacts').count()).toBe(1);

    const second = await cleanupAgentGatewayRetention(
      { db: app.db },
      { now, batchSize: 1, maxBatchesPerCollection: 10 },
    );
    expect(second.deletedByCollection.agRunEvents).toBe(1);
    expect(second.hasMore).toBe(false);
    expect(await app.db.getRepository('agRunEvents').count()).toBe(1);
    expect(await app.db.getRepository('agRunArtifacts').count()).toBe(1);
  });

  it('keeps expired observations for non-terminal runs', async () => {
    const now = new Date('2026-07-11T00:00:00.000Z');
    const oldDate = new Date('2025-01-01T00:00:00.000Z');
    const run = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'retention-active-run',
        status: 'running',
        claimAttempt: 1,
        leaseVersion: 2,
        cancelRequested: false,
      },
    });
    const runId = run.get('id');
    const event = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agRunEvents').create({
        values: {
          runId,
          claimAttempt: 1,
          source: 'retention-test',
          sequence: 1,
          eventType: 'old.active.event',
          emittedAt: oldDate,
        },
        transaction,
      });
    });
    const artifact = await app.db.getRepository('agRunArtifacts').create({
      values: {
        runId,
        claimAttempt: 1,
        artifactKey: 'old-active-artifact',
        artifactType: 'text',
      },
    });
    await app.db
      .getCollection('agRunEvents')
      .model.update({ createdAt: oldDate }, { where: { id: event.get('id') }, hooks: false });
    await app.db
      .getCollection('agRunArtifacts')
      .model.update({ createdAt: oldDate }, { where: { id: artifact.get('id') } });

    const result = await cleanupAgentGatewayRetention({ db: app.db }, { now });
    expect(result.deletedByCollection.agRunEvents).toBe(0);
    expect(result.deletedByCollection.agRunArtifacts).toBe(0);
    expect(await app.db.getRepository('agRunEvents').count()).toBe(1);
    expect(await app.db.getRepository('agRunArtifacts').count()).toBe(1);
  });

  it('materializes token and tool statistics before deleting expired conversation events', async () => {
    const now = new Date('2026-07-11T00:00:00.000Z');
    const oldDate = new Date('2025-01-01T00:00:00.000Z');
    const run = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'retention-statistics-run',
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 2,
        cancelRequested: false,
      },
    });
    const runId = run.get('id');
    const events = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agAgentConversationEvents').createMany({
        records: [
          {
            runId,
            source: 'codex',
            sequence: 1,
            eventType: 'agent.message',
            contentText: 'ordinary transcript content',
          },
          {
            runId,
            source: 'codex',
            sequence: 2,
            eventType: 'agent.command.completed',
            providerEventId: 'retained-command',
            contentJson: {
              status: 'succeeded',
              exitCode: 0,
            },
          },
          {
            runId,
            source: 'codex',
            sequence: 3,
            eventType: 'agent.turn.completed',
            providerEventId: 'retained-token-usage',
            contentJson: {
              usage: {
                input_tokens: 100,
                output_tokens: 20,
              },
            },
          },
          {
            runId,
            source: 'terminal-live',
            sequence: 4,
            eventType: 'agent.message',
            contentText: 'exec\nyarn test\nsucceeded in 10ms\n\ntokens used\n120',
          },
        ],
        transaction,
      });
    });
    await app.db.getCollection('agAgentConversationEvents').model.update(
      { createdAt: oldDate },
      {
        where: {
          id: events.map((event) => event.get('id')),
        },
        hooks: false,
      },
    );

    const result = await cleanupAgentGatewayRetention({ db: app.db }, { now });
    expect(result.deletedByCollection.agAgentConversationEvents).toBe(4);
    expect(await app.db.getRepository('agAgentConversationEvents').count({ filter: { runId } })).toBe(0);

    const retainedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(retainedRun.get('observabilityRollupJson')).toMatchObject({
      version: 1,
      sourceEventCount: 3,
      tokenUsageJson: {
        inputTokens: 100,
        outputTokens: 20,
        totalTokens: 120,
      },
      toolCallCount: 2,
      toolStatsJson: {
        total: 2,
        succeeded: 2,
      },
    });

    const statsResponse = await rootAgent.get('/api/agent-gateway/tool-calls:stats').query({ limit: 10 });
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.data).toMatchObject({
      runCount: 1,
      toolCallCount: 2,
      stats: {
        total: 2,
        succeeded: 2,
      },
      runs: [
        {
          runId,
          toolCallCount: 2,
        },
      ],
      toolCalls: [],
    });

    const runsResponse = await rootAgent.get('/api/agent-gateway/runs:list');
    expect(runsResponse.status).toBe(200);
    expect(runsResponse.body.data[0]).not.toHaveProperty('observabilityRollupJson');
    expect(runsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: runId,
          tokenUsageJson: {
            inputTokens: 100,
            outputTokens: 20,
            totalTokens: 120,
          },
        }),
      ]),
    );
  });

  it('materializes large conversation rollups through bounded event pages', async () => {
    const now = new Date('2026-07-11T00:00:00.000Z');
    const oldDate = new Date('2025-01-01T00:00:00.000Z');
    const run = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'retention-paged-rollup-run',
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 2,
        cancelRequested: false,
      },
    });
    const runId = run.get('id');
    const events = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agAgentConversationEvents').createMany({
        records: Array.from({ length: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE + 1 }, (_, index) => ({
          runId,
          source: 'codex',
          sequence: index + 1,
          eventType: 'agent.command.completed',
          providerEventId: `retention-paged-command-${index}`,
          correlationId: `retention-paged-command-${index}`,
          contentJson: {
            status: 'succeeded',
            exitCode: 0,
          },
        })),
        transaction,
      });
    });
    await app.db.getCollection('agAgentConversationEvents').model.update(
      { createdAt: oldDate },
      {
        where: {
          id: events.map((event) => event.get('id')),
        },
        hooks: false,
      },
    );

    const conversationRepository = app.db.getRepository('agAgentConversationEvents');
    const eventFindSpy = vi.spyOn(conversationRepository, 'find');
    const result = await cleanupAgentGatewayRetention({ db: app.db }, { now });
    const rollupFindOptions = eventFindSpy.mock.calls
      .map(([options]) => options as { limit?: number; offset?: number; sort?: string[] })
      .filter((options) => options.sort?.join(',') === 'createdAt,sequence,id');

    expect(result.deletedByCollection.agAgentConversationEvents).toBe(AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE + 1);
    expect(rollupFindOptions).toHaveLength(2);
    expect(rollupFindOptions).toEqual([
      expect.objectContaining({
        limit: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE,
        offset: 0,
      }),
      expect.objectContaining({
        limit: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE,
        offset: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE,
      }),
    ]);
    eventFindSpy.mockRestore();

    const retainedRun = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(retainedRun.get('observabilityRollupJson')).toMatchObject({
      sourceEventCount: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE + 1,
      toolCallCount: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE + 1,
      toolStatsJson: {
        total: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE + 1,
        succeeded: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE + 1,
      },
    });
  });

  it('increments retained token and tool statistics when a terminal imported run receives another batch', async () => {
    const now = new Date('2026-07-11T23:00:00.000Z');
    const oldDate = new Date('2025-01-01T00:00:00.000Z');
    const sharedEventDate = new Date('2026-07-11T22:00:00.000Z');
    const historicalEventId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';
    const appendedEventIds = ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'];
    const appendBatchKey = 'incremental';
    const appendSource = getExternalConversationSource('codex', 'codex-jsonl', appendBatchKey, 0);
    const externalRunKey = `retention-incremental-${randomUUID()}`;
    const initialResponse = await rootAgent.post('/api/agent-gateway/external-runs:import').send({
      externalRunKey,
      provider: 'codex',
      status: 'succeeded',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: [
            JSON.stringify({
              type: 'item.completed',
              item: {
                id: 'retention-command-1',
                type: 'command_execution',
                command: 'echo first',
                aggregated_output: 'first\n',
                exit_code: 0,
                status: 'completed',
              },
            }),
            JSON.stringify({
              type: 'turn.completed',
              id: 'retention-turn-1',
              usage: {
                input_tokens: 100,
                output_tokens: 20,
              },
            }),
          ].join('\n'),
        },
      ],
    });
    expect(initialResponse.status).toBe(200);
    expect(initialResponse.body.data.run).toMatchObject({
      tokenUsageJson: {
        inputTokens: 100,
        outputTokens: 20,
        totalTokens: 120,
      },
    });
    const runId = String(initialResponse.body.data.runId);
    const historicalEvent = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agAgentConversationEvents').create({
        values: {
          id: historicalEventId,
          runId,
          source: appendSource,
          sequence: 99,
          eventType: 'agent.turn.completed',
          providerEventId: 'historical-retained-turn',
          contentJson: {
            usage: {
              input_tokens: 7,
              output_tokens: 3,
            },
          },
        },
        transaction,
      });
    });
    await app.db.getCollection('agAgentConversationEvents').model.update(
      { createdAt: sharedEventDate },
      {
        where: {
          id: historicalEvent.get('id'),
        },
        hooks: false,
      },
    );
    const runBeforeAppend = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    const eventsBeforeAppend = await app.db.getRepository('agAgentConversationEvents').find({
      filter: {
        runId,
      },
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        observabilityRollupJson: buildRunObservabilityRollup(runBeforeAppend, eventsBeforeAppend, sharedEventDate),
      },
    });
    const rolledUpRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(rolledUpRun.get('observabilityRollupJson')).toMatchObject({
      sourceEventCount: 3,
      tokenUsageJson: {
        inputTokens: 107,
        outputTokens: 23,
        totalTokens: 130,
      },
      toolStatsJson: {
        total: 1,
        succeeded: 1,
      },
      eventWatermarkJson: {
        createdAt: expect.any(String),
      },
    });

    app.db.on('agAgentConversationEvents.beforeCreate', (event) => {
      if (event.get('source') !== appendSource) {
        return;
      }
      const sequence = Number(event.get('sequence'));
      const eventId = appendedEventIds[sequence - 1];
      if (!eventId) {
        return;
      }
      event.set('id', eventId);
      event.set('createdAt', sharedEventDate);
    });

    const appendResponse = await rootAgent.post(`/api/agent-gateway/external-runs/${runId}/observations:append`).send({
      batchKey: appendBatchKey,
      provider: 'codex',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: [
            JSON.stringify({
              type: 'item.completed',
              item: {
                id: 'retention-command-2',
                type: 'command_execution',
                command: 'echo second',
                aggregated_output: 'second\n',
                exit_code: 0,
                status: 'completed',
              },
            }),
            JSON.stringify({
              type: 'turn.completed',
              id: 'retention-turn-2',
              usage: {
                input_tokens: 30,
                output_tokens: 10,
              },
            }),
          ].join('\n'),
        },
      ],
    });
    expect(appendResponse.status, JSON.stringify(appendResponse.body)).toBe(200);

    const accumulatedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(accumulatedRun.get('observabilityRollupJson')).toMatchObject({
      sourceEventCount: 5,
      tokenUsageJson: {
        inputTokens: 137,
        outputTokens: 33,
        totalTokens: 170,
      },
      toolCallCount: 2,
      toolStatsJson: {
        total: 2,
        succeeded: 2,
      },
      eventWatermarkJson: {
        externalImportBatchId: expect.any(String),
      },
    });
    const sharedTimestampEvents = await app.db.getRepository('agAgentConversationEvents').find({
      filter: {
        runId,
        source: appendSource,
      },
      sort: ['sequence'],
    });
    expect(sharedTimestampEvents).toHaveLength(3);
    expect(sharedTimestampEvents.map((event) => new Date(String(event.get('createdAt'))).toISOString())).toEqual([
      sharedEventDate.toISOString(),
      sharedEventDate.toISOString(),
      sharedEventDate.toISOString(),
    ]);
    expect(appendedEventIds.every((eventId) => eventId < historicalEventId)).toBe(true);

    const statsResponse = await rootAgent.get('/api/agent-gateway/tool-calls:stats').query({ limit: 10 });
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.data).toMatchObject({
      toolCallCount: 2,
      stats: {
        total: 2,
        succeeded: 2,
      },
      runs: [
        {
          runId,
          toolCallCount: 2,
        },
      ],
    });
    const runsResponse = await rootAgent.get('/api/agent-gateway/runs:list');
    expect(runsResponse.status).toBe(200);
    expect(runsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: runId,
          tokenUsageJson: {
            inputTokens: 137,
            outputTokens: 33,
            totalTokens: 170,
          },
        }),
      ]),
    );

    const appendedEvents = await app.db.getRepository('agAgentConversationEvents').find({
      filter: {
        runId,
      },
    });
    await app.db.getCollection('agAgentConversationEvents').model.update(
      { createdAt: oldDate },
      {
        where: {
          id: appendedEvents.map((event) => event.get('id')),
        },
        hooks: false,
      },
    );
    const secondRetention = await cleanupAgentGatewayRetention({ db: app.db }, { now });
    expect(secondRetention.deletedByCollection.agAgentConversationEvents).toBe(5);
    const retainedAccumulatedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(retainedAccumulatedRun.get('observabilityRollupJson')).toMatchObject({
      sourceEventCount: 5,
      tokenUsageJson: {
        totalTokens: 170,
      },
      toolStatsJson: {
        total: 2,
      },
    });
  });

  it('completes a correlated tool from a later batch after its source events were retained away', async () => {
    const now = new Date('2026-07-11T23:00:00.000Z');
    const oldDate = new Date('2025-01-01T00:00:00.000Z');
    const externalRunKey = `retention-cross-batch-tool-${randomUUID()}`;
    const initialResponse = await rootAgent.post('/api/agent-gateway/external-runs:import').send({
      externalRunKey,
      provider: 'codex',
      status: 'succeeded',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: JSON.stringify({
            type: 'item.started',
            item: {
              id: 'retained-cross-batch-command',
              type: 'command_execution',
              command: 'echo retained',
              status: 'in_progress',
            },
          }),
        },
      ],
    });
    expect(initialResponse.status, JSON.stringify(initialResponse.body)).toBe(200);
    const runId = String(initialResponse.body.data.runId);
    let run = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(run.get('observabilityRollupJson')).toMatchObject({
      toolCallCount: 1,
      toolStatsJson: {
        total: 1,
        unknown: 1,
      },
      toolLifecycleJson: {
        calls: [
          {
            correlationKey: 'retained-cross-batch-command',
            status: 'unknown',
          },
        ],
      },
    });

    const events = await app.db.getRepository('agAgentConversationEvents').find({
      filter: { runId },
    });
    await app.db.getCollection('agAgentConversationEvents').model.update(
      { createdAt: oldDate },
      {
        where: {
          id: events.map((event) => event.get('id')),
        },
        hooks: false,
      },
    );
    const retention = await cleanupAgentGatewayRetention({ db: app.db }, { now });
    expect(retention.deletedByCollection.agAgentConversationEvents).toBe(events.length);

    const appendResponse = await rootAgent.post(`/api/agent-gateway/external-runs/${runId}/observations:append`).send({
      batchKey: 'complete-after-retention',
      provider: 'codex',
      status: 'succeeded',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: JSON.stringify({
            type: 'item.completed',
            item: {
              id: 'retained-cross-batch-command',
              type: 'command_execution',
              command: 'echo retained',
              aggregated_output: 'retained\n',
              exit_code: 0,
              status: 'completed',
            },
          }),
        },
      ],
    });
    expect(appendResponse.status, JSON.stringify(appendResponse.body)).toBe(200);

    run = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(run.get('observabilityRollupJson')).toMatchObject({
      toolCallCount: 1,
      toolStatsJson: {
        total: 1,
        succeeded: 1,
        unknown: 0,
      },
      toolLifecycleJson: {
        calls: [
          {
            correlationKey: 'retained-cross-batch-command',
            status: 'succeeded',
          },
        ],
      },
    });
  });

  it('advances orphan importing-run cleanup past a protected first page', async () => {
    const now = new Date('2026-07-11T23:00:00.000Z');
    const oldDate = new Date('2025-01-01T00:00:00.000Z');
    const protectedRunId = '00000000-0000-4000-8000-000000000001';
    const orphanRunIds = ['00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003'];
    const runs = await app.db.getRepository('agRuns').createMany({
      records: [protectedRunId, ...orphanRunIds].map((id, index) => ({
        id,
        runCode: `orphan-importing-${index + 1}`,
        sourceType: 'external-import',
        status: 'importing',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
      })),
    });
    await app.db.getCollection('agRuns').model.update(
      { updatedAt: oldDate },
      {
        where: {
          id: runs.map((run) => run.get('id')),
        },
      },
    );
    const orphanEvents = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agAgentConversationEvents').createMany({
        records: orphanRunIds.flatMap((runId, index) => [
          {
            runId,
            source: 'codex',
            sequence: 1,
            eventType: 'agent.command.started',
            providerEventId: `orphan-command-${index + 1}`,
            correlationId: `orphan-command-${index + 1}`,
            contentJson: {
              command: `echo orphan-${index + 1}`,
              status: 'in_progress',
            },
          },
          {
            runId,
            source: 'terminal-live',
            sequence: 2,
            eventType: 'agent.message',
            contentText: 'tokens used\n42',
          },
        ]),
        transaction,
      });
    });
    await app.db.getCollection('agAgentConversationEvents').model.update(
      { createdAt: oldDate },
      {
        where: {
          id: orphanEvents.map((event) => event.get('id')),
        },
        hooks: false,
      },
    );
    const identity = await app.db.getRepository('agExternalRunIdentities').create({
      values: {
        id: randomUUID(),
        identityKey: 'protected-orphan-import-identity',
        identityType: 'external-run-key',
        provider: 'codex',
        externalRunKey: 'protected-orphan-import',
        runCode: 'orphan-importing-1',
        runId: protectedRunId,
      },
    });
    await app.db.getRepository('agExternalImportBatches').create({
      values: {
        id: randomUUID(),
        batchIdentityKey: 'protected-orphan-import-batch',
        identityId: identity.get('id'),
        runId: protectedRunId,
        batchKey: 'initial',
        payloadSha256: 'payload',
        operationPlanSha256: 'plan',
        operationCount: 1,
        status: 'processing',
        processedOperations: 0,
        attemptCount: 1,
        lastAttemptAt: now,
      },
    });

    const first = await cleanupAgentGatewayRetention({ db: app.db }, { now, batchSize: 1, maxBatchesPerCollection: 1 });
    expect(first.abandonedImportRuns).toBe(0);
    expect(first.hasMore).toBe(true);
    const runsAfterFirst = await app.db.getRepository('agRuns').find({
      filter: {
        id: {
          $in: [protectedRunId, ...orphanRunIds],
        },
      },
      sort: ['id'],
    });
    expect(new Date(String(runsAfterFirst[0].get('updatedAt'))).toISOString()).toBe(now.toISOString());
    expect(
      runsAfterFirst
        .slice(1)
        .every((run) => new Date(String(run.get('updatedAt'))).getTime() < now.getTime() - 60 * 60 * 1000),
    ).toBe(true);

    const second = await cleanupAgentGatewayRetention(
      { db: app.db },
      { now, batchSize: 1, maxBatchesPerCollection: 1 },
    );
    expect(second.abandonedImportRuns).toBe(1);
    expect(second.hasMore).toBe(true);

    const third = await cleanupAgentGatewayRetention({ db: app.db }, { now, batchSize: 1, maxBatchesPerCollection: 1 });
    expect(third.abandonedImportRuns).toBe(1);
    expect(third.hasMore).toBe(true);

    const final = await cleanupAgentGatewayRetention({ db: app.db }, { now });
    expect(final.abandonedImportRuns).toBe(0);
    expect(final.hasMore).toBe(false);

    const retainedRuns = await app.db.getRepository('agRuns').find({
      filter: {
        id: {
          $in: [protectedRunId, ...orphanRunIds],
        },
      },
      sort: ['id'],
    });
    expect(retainedRuns.map((run) => run.get('status'))).toEqual(['importing', 'abandoned', 'abandoned']);
    for (const abandonedRun of retainedRuns.slice(1)) {
      expect(abandonedRun.get('observabilityRollupJson')).toMatchObject({
        tokenUsageJson: {
          totalTokens: 42,
        },
        toolCallCount: 1,
        toolStatsJson: {
          total: 1,
          running: 0,
          unknown: 1,
        },
      });
    }
    expect(
      await app.db.getRepository('agAgentConversationEvents').count({
        filter: {
          runId: {
            $in: orphanRunIds,
          },
        },
      }),
    ).toBe(0);
  });

  it('recovers interrupted import ledgers and expires old terminal ledgers', async () => {
    const now = new Date('2026-07-11T00:00:00.000Z');
    const oldDate = new Date('2025-01-01T00:00:00.000Z');
    const run = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'retention-import-ledger-run',
        status: 'importing',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        sourceType: 'external-import',
      },
    });
    const runId = run.get('id');
    const partialEvents = await app.db.sequelize.transaction(async (transaction) => {
      return await app.db.getRepository('agAgentConversationEvents').createMany({
        records: [
          {
            runId,
            source: 'codex',
            sequence: 1,
            eventType: 'agent.command.started',
            providerEventId: 'retention-interrupted-command',
            correlationId: 'retention-interrupted-command',
            contentJson: {
              command: 'echo interrupted',
              status: 'in_progress',
            },
          },
          {
            runId,
            source: 'terminal-live',
            sequence: 2,
            eventType: 'agent.message',
            contentText: 'tokens used\n24',
          },
        ],
        transaction,
      });
    });
    await app.db.getCollection('agAgentConversationEvents').model.update(
      { createdAt: oldDate },
      {
        where: {
          id: partialEvents.map((event) => event.get('id')),
        },
        hooks: false,
      },
    );
    const identity = await app.db.getRepository('agExternalRunIdentities').create({
      values: {
        identityKey: 'retention-import-ledger-identity',
        identityType: 'run-code',
        provider: 'generic-cli',
        runCode: 'retention-import-ledger-run',
        runId,
      },
    });
    const commonValues = {
      identityId: identity.get('id'),
      runId,
      payloadSha256: 'a'.repeat(64),
      operationPlanSha256: 'b'.repeat(64),
      operationCount: 1,
      processedOperations: 0,
      attemptCount: 1,
      observationCountsJson: {
        conversationEvents: 0,
        runEvents: 0,
        artifacts: 0,
      },
      relationUpdated: false,
      lastAttemptAt: oldDate,
    };
    const interruptedBatch = await app.db.getRepository('agExternalImportBatches').create({
      values: {
        ...commonValues,
        batchIdentityKey: 'retention-interrupted-batch',
        batchKey: 'interrupted',
        status: 'processing',
      },
    });
    const completedBatch = await app.db.getRepository('agExternalImportBatches').create({
      values: {
        ...commonValues,
        batchIdentityKey: 'retention-completed-batch',
        batchKey: 'completed',
        status: 'completed',
        processedOperations: 1,
        completedAt: oldDate,
      },
    });
    await app.db.getCollection('agExternalImportBatches').model.update(
      { createdAt: oldDate, updatedAt: oldDate },
      {
        where: {
          id: [interruptedBatch.get('id'), completedBatch.get('id')],
        },
        silent: true,
      },
    );
    const storedCompletedBatch = await app.db.getRepository('agExternalImportBatches').findOne({
      filterByTk: completedBatch.get('id'),
    });
    expect(new Date(String(storedCompletedBatch.get('updatedAt'))).toISOString()).toBe(oldDate.toISOString());

    const result = await cleanupAgentGatewayRetention({ db: app.db }, { now });
    expect(result.recoveredImportBatches).toBe(1);
    expect(result.deletedByCollection.agExternalImportBatches).toBe(1);
    const recoveredBatch = await app.db.getRepository('agExternalImportBatches').findOne({
      filterByTk: interruptedBatch.get('id'),
    });
    expect(recoveredBatch.toJSON()).toMatchObject({
      status: 'failed',
      errorSummary: expect.stringContaining('retry the same payload'),
    });
    const abandonedRun = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(abandonedRun.get('status')).toBe('abandoned');
    expect(abandonedRun.get('observabilityRollupJson')).toMatchObject({
      tokenUsageJson: {
        totalTokens: 24,
      },
      toolCallCount: 1,
      toolStatsJson: {
        total: 1,
        running: 0,
        unknown: 1,
      },
    });
    expect(
      await app.db.getRepository('agExternalImportBatches').findOne({
        filterByTk: completedBatch.get('id'),
      }),
    ).toBeNull();
  });
});
