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

import { EXTERNAL_IMPORT_LIMITS, EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY } from '../../shared/externalRunImport';
import PluginAgentGatewayServer from '../plugin';
import { cleanupAgentGatewayRetention } from '../services/retention';

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

function getCanonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => getCanonicalValue(entry));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const entry = (value as Record<string, unknown>)[key];
        if (entry !== undefined) {
          result[key] = getCanonicalValue(entry);
        }
        return result;
      }, {});
  }
  return value;
}

function getOperationPlanSha256(value: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(getCanonicalValue(value)))
    .digest('hex');
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
    const payload = {
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
    };
    const response = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
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

    const conversationResponse = await rootAgent.get(`/agentGatewayApi:listRunConversationEvents/${runId}`);
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

    const artifactsResponse = await rootAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`);
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

    const identity = await app.db.getRepository('agExternalRunIdentities').findOne({
      filter: {
        runId,
      },
    });
    expect(identity).toBeTruthy();
    expect(identity.toJSON()).toMatchObject({
      identityType: 'external-run-key',
      provider: 'codex',
      externalRunKey,
      runId,
    });
    const batch = await app.db.getRepository('agExternalImportBatches').findOne({
      filter: {
        runId,
        batchKey: 'initial',
      },
    });
    expect(batch).toBeTruthy();
    expect(batch.toJSON()).toMatchObject({
      status: 'completed',
      operationCount: 7,
      processedOperations: 7,
      attemptCount: 1,
      observationCountsJson: {
        conversationEvents: 4,
        runEvents: 1,
        artifacts: 2,
      },
    });
    expect(expectString(batch.get('payloadSha256'))).toHaveLength(64);
    expect(expectString(batch.get('operationPlanSha256'))).toHaveLength(64);
    expect(expectString(batch.get('finalizationSha256'))).toHaveLength(64);
    expect(batch.get('finalizationJson')).toMatchObject({
      expectedRunStatus: 'importing',
      runUpdateValues: {
        status: 'succeeded',
      },
    });

    const retryResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
    expect(retryResponse.status).toBe(200);
    expect(
      getData<{ runId: string; deduped: boolean; observations: Record<string, number> }>(retryResponse),
    ).toMatchObject({
      runId,
      deduped: true,
      observations: {
        conversationEvents: 4,
        runEvents: 1,
        artifacts: 2,
      },
    });
  });

  it('converges concurrent first imports on one run, identity, and completed batch', async () => {
    const payload = {
      externalRunKey: `concurrent-import-${randomUUID()}`,
      provider: 'generic-cli',
      status: 'running',
      logs: [
        {
          format: 'text',
          contentText: 'started concurrently',
        },
      ],
    };
    const responses = await Promise.all([
      rootAgent.post('/agentGatewayApi:importExternalRun').send(payload),
      rootAgent.post('/agentGatewayApi:importExternalRun').send(payload),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    const results = responses.map((response) =>
      getData<{ runId: string; runCode: string; deduped: boolean }>(response),
    );
    expect(new Set(results.map((result) => result.runId)).size).toBe(1);
    expect(results.map((result) => result.deduped).sort()).toEqual([false, true]);

    const runId = expectString(results[0].runId);
    expect(
      await app.db.getRepository('agRuns').count({
        filter: {
          id: runId,
        },
      }),
    ).toBe(1);
    expect(
      await app.db.getRepository('agExternalRunIdentities').count({
        filter: {
          runId,
        },
      }),
    ).toBe(1);
    expect(
      await app.db.getRepository('agExternalImportBatches').count({
        filter: {
          runId,
          batchKey: 'initial',
        },
      }),
    ).toBe(1);
    const batch = await app.db.getRepository('agExternalImportBatches').findOne({
      filter: {
        runId,
        batchKey: 'initial',
      },
    });
    expect(batch.toJSON()).toMatchObject({
      status: 'completed',
      processedOperations: 3,
      observationCountsJson: {
        conversationEvents: 1,
        runEvents: 1,
        artifacts: 1,
      },
    });
  });

  it('retries a final-only batch interrupted after its empty operation plan is persisted', async () => {
    const initialResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey: `final-only-retry-${randomUUID()}`,
      provider: 'generic-cli',
      status: 'running',
      logs: [
        {
          format: 'text',
          contentText: 'initial observation',
        },
      ],
    });
    expect(initialResponse.status).toBe(200);
    const runId = expectString(getData<{ runId: string }>(initialResponse).runId);
    const finalPayload = {
      batchKey: 'final-only-retry',
      provider: 'generic-cli',
      status: 'succeeded',
      resultSummary: {
        summary: 'finalized without observations',
      },
      logs: [],
      artifacts: [],
    };
    const batchRepository = app.db.getRepository('agExternalImportBatches');
    const originalBatchFindOne = batchRepository.findOne.bind(batchRepository);
    let interrupted = false;
    const batchFindSpy = vi.spyOn(batchRepository, 'findOne').mockImplementation(async (options) => {
      if (!interrupted && options.filterByTk) {
        interrupted = true;
        throw new Error('simulated final-only processing interruption');
      }
      return await originalBatchFindOne(options);
    });

    const failedResponse = await rootAgent
      .post(`/agentGatewayApi:appendExternalRunObservations/${runId}`)
      .send(finalPayload);
    batchFindSpy.mockRestore();
    expect(failedResponse.status).toBe(500);

    const failedBatch = await batchRepository.findOne({
      filter: {
        runId,
        batchKey: finalPayload.batchKey,
      },
    });
    expect(failedBatch.toJSON()).toMatchObject({
      status: 'failed',
      operationCount: 0,
      processedOperations: 0,
      operationPlanJson: {
        operations: [],
      },
    });

    const retryResponse = await rootAgent
      .post(`/agentGatewayApi:appendExternalRunObservations/${runId}`)
      .send(finalPayload);
    expect(retryResponse.status, JSON.stringify(retryResponse.body)).toBe(200);
    expect(
      getData<{ observations: Record<string, number>; run: Record<string, unknown> }>(retryResponse),
    ).toMatchObject({
      observations: {
        conversationEvents: 0,
        runEvents: 0,
        artifacts: 0,
      },
      run: {
        status: 'succeeded',
        resultSummaryJson: {
          summary: 'finalized without observations',
        },
      },
    });
    const completedBatch = await batchRepository.findOne({ filterByTk: failedBatch.get('id') });
    expect(completedBatch.toJSON()).toMatchObject({
      status: 'completed',
      operationCount: 0,
      processedOperations: 0,
      attemptCount: 2,
    });
    expect(completedBatch.get('operationPlanJson')).toBeNull();
  });

  it('keeps creators immutable and rejects changed batches or terminal status regressions', async () => {
    const importerUsername = `external-import-owner-${randomUUID()}`;
    const importAgent = await createUserAgent(importerUsername, ['agentGateway.importExternalRuns']);
    const importer = await app.db.getRepository('users').findOne({
      filter: {
        username: importerUsername,
      },
    });
    const externalRunKey = `status-import-${randomUUID()}`;
    const importResponse = await importAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey,
      provider: 'claude',
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
    const identity = await app.db.getRepository('agExternalRunIdentities').findOne({
      filter: {
        runId,
      },
    });
    expect(identity.toJSON()).toMatchObject({
      provider: 'claude-code',
      externalRunKey,
    });

    const finalPayload = {
      batchKey: 'final',
      provider: 'claude-code',
      status: 'succeeded',
      logs: [
        {
          format: 'text',
          contentText: 'finished',
        },
      ],
    };
    const appendResponse = await rootAgent
      .post(`/agentGatewayApi:appendExternalRunObservations/${runId}`)
      .send(finalPayload);
    expect(appendResponse.status).toBe(200);
    const retryResponse = await rootAgent
      .post(`/agentGatewayApi:appendExternalRunObservations/${runId}`)
      .send(finalPayload);
    expect(retryResponse.status).toBe(200);
    expect(getData<{ observations: Record<string, number> }>(retryResponse).observations).toEqual({
      conversationEvents: 1,
      runEvents: 1,
      artifacts: 1,
    });

    const changedBatchResponse = await rootAgent.post(`/agentGatewayApi:appendExternalRunObservations/${runId}`).send({
      ...finalPayload,
      logs: [
        {
          format: 'text',
          contentText: 'changed',
        },
      ],
    });
    expect(changedBatchResponse.status).toBe(409);

    const regressionResponse = await rootAgent.post(`/agentGatewayApi:appendExternalRunObservations/${runId}`).send({
      batchKey: 'regress',
      provider: 'claude-code',
      status: 'running',
      logs: [
        {
          format: 'text',
          contentText: 'must not reopen',
        },
      ],
    });
    expect(regressionResponse.status).toBe(409);

    const run = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(run.get('status')).toBe('succeeded');
    expect(String(run.get('requestedById'))).toBe(String(importer.get('id')));
    expect(
      await app.db.getRepository('agExternalImportBatches').count({
        filter: {
          runId,
        },
      }),
    ).toBe(2);
  });

  it('merges correlated tool lifecycle across batches and only closes dangling calls for terminal runs', async () => {
    const externalRunKey = `cross-batch-tool-${randomUUID()}`;
    const startedResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey,
      provider: 'codex',
      status: 'running',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: JSON.stringify({
            type: 'item.started',
            item: {
              id: 'cross-batch-command',
              type: 'command_execution',
              command: 'echo cross-batch',
              status: 'in_progress',
            },
          }),
        },
      ],
    });
    expect(startedResponse.status, JSON.stringify(startedResponse.body)).toBe(200);
    const runId = expectString(getData<{ runId: string }>(startedResponse).runId);

    let run = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(run.get('observabilityRollupJson')).toMatchObject({
      toolCallCount: 1,
      toolStatsJson: {
        total: 1,
        running: 1,
        unknown: 0,
      },
      toolLifecycleJson: {
        calls: [
          {
            correlationKey: 'cross-batch-command',
            kind: 'exec',
            status: 'running',
          },
        ],
      },
    });

    const completedResponse = await rootAgent.post(`/agentGatewayApi:appendExternalRunObservations/${runId}`).send({
      batchKey: 'complete-and-start-next',
      provider: 'codex',
      status: 'running',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: [
            JSON.stringify({
              type: 'item.completed',
              item: {
                id: 'cross-batch-command',
                type: 'command_execution',
                command: 'echo cross-batch',
                aggregated_output: 'done\n',
                exit_code: 0,
                status: 'completed',
              },
            }),
            JSON.stringify({
              type: 'item.started',
              item: {
                id: 'terminal-dangling-command',
                type: 'command_execution',
                command: 'sleep 1',
                status: 'in_progress',
              },
            }),
          ].join('\n'),
        },
      ],
    });
    expect(completedResponse.status, JSON.stringify(completedResponse.body)).toBe(200);

    run = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(run.get('observabilityRollupJson')).toMatchObject({
      toolCallCount: 2,
      toolStatsJson: {
        total: 2,
        succeeded: 1,
        running: 1,
        unknown: 0,
      },
    });

    const terminalResponse = await rootAgent.post(`/agentGatewayApi:appendExternalRunObservations/${runId}`).send({
      batchKey: 'terminalize',
      provider: 'codex',
      status: 'succeeded',
      logs: [
        {
          format: 'text',
          contentText: 'run finished',
        },
      ],
    });
    expect(terminalResponse.status, JSON.stringify(terminalResponse.body)).toBe(200);

    run = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(run.get('observabilityRollupJson')).toMatchObject({
      toolCallCount: 2,
      toolStatsJson: {
        total: 2,
        succeeded: 1,
        running: 0,
        unknown: 1,
      },
    });
  });

  it('commits each chunk rollup with batch progress when a later chunk fails', async () => {
    const externalRunKey = `partial-chunk-rollup-${randomUUID()}`;
    const initialResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey,
      provider: 'codex',
      status: 'running',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: [
            JSON.stringify({
              type: 'item.started',
              item: {
                id: 'partial-chunk-command',
                type: 'command_execution',
                command: 'echo partial',
                status: 'in_progress',
              },
            }),
            JSON.stringify({
              type: 'turn.completed',
              id: 'initial-turn',
              usage: {
                input_tokens: 80,
                output_tokens: 20,
                total_tokens: 100,
              },
            }),
          ].join('\n'),
        },
      ],
    });
    expect(initialResponse.status, JSON.stringify(initialResponse.body)).toBe(200);
    const runId = expectString(getData<{ runId: string }>(initialResponse).runId);

    const appendEvents = [
      {
        type: 'item.completed',
        item: {
          id: 'partial-chunk-command',
          type: 'command_execution',
          command: 'echo partial',
          aggregated_output: 'done\n',
          exit_code: 0,
          status: 'completed',
        },
      },
      {
        type: 'turn.completed',
        id: 'partial-turn',
        usage: {
          input_tokens: 15,
          output_tokens: 5,
          total_tokens: 20,
        },
      },
      ...Array.from({ length: 148 }, (_, index) => ({
        type: 'item.completed',
        item: {
          id: `partial-message-${index}`,
          type: 'agent_message',
          text: `partial event ${index}`,
        },
      })),
    ];
    const conversationRepository = app.db.getRepository('agAgentConversationEvents');
    const originalCreate = conversationRepository.create.bind(conversationRepository);
    const conversationWriteSpy = vi.spyOn(conversationRepository, 'create').mockImplementation(async (options) => {
      const values = options.values as Record<string, unknown>;
      if (values.sequence === 99) {
        throw new Error('simulated second chunk observation failure');
      }
      return await originalCreate(options);
    });
    const failedResponse = await rootAgent.post(`/agentGatewayApi:appendExternalRunObservations/${runId}`).send({
      batchKey: 'partial-failure',
      provider: 'codex',
      status: 'running',
      logs: [
        {
          format: 'codex-jsonl',
          contentText: appendEvents.map((event) => JSON.stringify(event)).join('\n'),
        },
      ],
    });
    conversationWriteSpy.mockRestore();
    expect(failedResponse.status).toBe(500);

    const failedBatch = await app.db.getRepository('agExternalImportBatches').findOne({
      filter: {
        runId,
        batchKey: 'partial-failure',
      },
    });
    expect(failedBatch.toJSON()).toMatchObject({
      status: 'failed',
      processedOperations: 100,
      observationCountsJson: {
        conversationEvents: 98,
        runEvents: 1,
        artifacts: 1,
      },
    });
    const run = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(run.get('observabilityRollupJson')).toMatchObject({
      tokenUsageJson: {
        inputTokens: 95,
        outputTokens: 25,
        totalTokens: 120,
      },
      toolCallCount: 1,
      toolStatsJson: {
        total: 1,
        succeeded: 1,
        running: 0,
        unknown: 0,
      },
      toolLifecycleJson: {
        calls: [
          {
            correlationKey: 'partial-chunk-command',
            kind: 'exec',
            status: 'succeeded',
          },
        ],
      },
    });

    const toolCallsResponse = await rootAgent.get(`/agentGatewayApi:listRunToolCalls/${runId}`);
    expect(toolCallsResponse.status).toBe(200);
    expect(getData<{ stats: Record<string, number> }>(toolCallsResponse).stats).toMatchObject({
      total: 1,
      succeeded: 1,
      unknown: 0,
    });
    const runsResponse = await rootAgent.get('/agentGatewayApi:listRuns');
    expect(runsResponse.status).toBe(200);
    expect(runsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: runId,
          tokenUsageJson: {
            inputTokens: 95,
            outputTokens: 25,
            totalTokens: 120,
          },
        }),
      ]),
    );
  });

  it('uses the final imported result summary as the authoritative token rollup', async () => {
    const externalRunKey = `result-summary-token-rollup-${randomUUID()}`;
    const initialResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey,
      provider: 'codex',
      status: 'succeeded',
      resultSummary: {
        tokenUsageJson: {
          inputTokens: 80,
          outputTokens: 20,
          totalTokens: 100,
        },
      },
      logs: [
        {
          format: 'text',
          contentText: 'initial result',
        },
      ],
    });
    expect(initialResponse.status, JSON.stringify(initialResponse.body)).toBe(200);
    const runId = expectString(getData<{ runId: string }>(initialResponse).runId);

    const appendResponse = await rootAgent.post(`/agentGatewayApi:appendExternalRunObservations/${runId}`).send({
      batchKey: 'updated-result-summary',
      provider: 'codex',
      status: 'succeeded',
      resultSummary: {
        tokenUsageJson: {
          inputTokens: 160,
          outputTokens: 40,
          totalTokens: 200,
        },
      },
      logs: [
        {
          format: 'text',
          contentText: 'updated result',
        },
      ],
    });
    expect(appendResponse.status, JSON.stringify(appendResponse.body)).toBe(200);

    const run = await app.db.getRepository('agRuns').findOne({ filterByTk: runId });
    expect(run.get('observabilityRollupJson')).toMatchObject({
      tokenUsageJson: {
        inputTokens: 160,
        outputTokens: 40,
        totalTokens: 200,
      },
    });
    const runsResponse = await rootAgent.get('/agentGatewayApi:listRuns');
    expect(runsResponse.status).toBe(200);
    expect(runsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: runId,
          tokenUsageJson: {
            inputTokens: 160,
            outputTokens: 40,
            totalTokens: 200,
          },
        }),
      ]),
    );
  });

  it('rejects oversized external import batches before creating persistent state', async () => {
    const runCount = await app.db.getRepository('agRuns').count({});
    const identityCount = await app.db.getRepository('agExternalRunIdentities').count({});
    const batchCount = await app.db.getRepository('agExternalImportBatches').count({});
    const cases = [
      {
        externalRunKey: `too-many-logs-${randomUUID()}`,
        provider: 'generic-cli',
        logs: Array.from({ length: EXTERNAL_IMPORT_LIMITS.maxLogs + 1 }, (_, index) => ({
          format: 'text',
          contentText: `log-${index}`,
        })),
      },
      {
        externalRunKey: `too-many-artifacts-${randomUUID()}`,
        provider: 'generic-cli',
        artifacts: Array.from({ length: EXTERNAL_IMPORT_LIMITS.maxArtifacts + 1 }, (_, index) => ({
          artifactKey: `artifact-${index}`,
          artifactType: 'text',
          contentText: `artifact-${index}`,
        })),
      },
      {
        externalRunKey: `too-many-events-${randomUUID()}`,
        provider: 'generic-cli',
        logs: [
          {
            format: 'text',
            contentText: Array.from(
              { length: EXTERNAL_IMPORT_LIMITS.maxNormalizedEvents + 1 },
              (_, index) => `event-${index}`,
            ).join('\n'),
          },
        ],
      },
      {
        externalRunKey: `payload-too-large-${randomUUID()}`,
        provider: 'generic-cli',
        contentText: 'x'.repeat(EXTERNAL_IMPORT_LIMITS.maxPayloadBytes + 1),
        format: 'text',
      },
    ];

    for (const payload of cases) {
      const response = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
      expect(response.status).toBe(413);
    }
    expect(await app.db.getRepository('agRuns').count({})).toBe(runCount);
    expect(await app.db.getRepository('agExternalRunIdentities').count({})).toBe(identityCount);
    expect(await app.db.getRepository('agExternalImportBatches').count({})).toBe(batchCount);
  });

  it('writes observation batches larger than one chunk and persists final progress', async () => {
    const lines = Array.from({ length: 150 }, (_, index) => `chunked-event-${index}`);
    const response = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey: `chunked-import-${randomUUID()}`,
      provider: 'generic-cli',
      status: 'succeeded',
      logs: [
        {
          format: 'text',
          contentText: lines.join('\n'),
        },
      ],
    });
    expect(response.status).toBe(200);
    const result = getData<{ runId: string; observations: Record<string, number> }>(response);
    const runId = expectString(result.runId);
    expect(result.observations).toEqual({
      conversationEvents: 150,
      runEvents: 1,
      artifacts: 1,
    });
    expect(
      await app.db.getRepository('agAgentConversationEvents').count({
        filter: {
          runId,
        },
      }),
    ).toBe(150);
    const batch = await app.db.getRepository('agExternalImportBatches').findOne({
      filter: {
        runId,
        batchKey: 'initial',
      },
    });
    expect(batch.toJSON()).toMatchObject({
      status: 'completed',
      operationCount: 152,
      processedOperations: 152,
      observationCountsJson: {
        conversationEvents: 150,
        runEvents: 1,
        artifacts: 1,
      },
    });
  });

  it('resumes a partially committed observation plan from the recorded operation boundary', async () => {
    const externalRunKey = `resumable-import-${randomUUID()}`;
    const lines = Array.from({ length: 150 }, (_, index) => `resumable-event-${index}`);
    const payload = {
      externalRunKey,
      provider: 'generic-cli',
      status: 'succeeded',
      logs: [
        {
          format: 'text',
          contentText: lines.join('\n'),
        },
      ],
    };
    const response = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
    expect(response.status).toBe(200);
    const runId = expectString(getData<{ runId: string }>(response).runId);
    const batch = await app.db.getRepository('agExternalImportBatches').findOne({
      filter: {
        runId,
        batchKey: 'initial',
      },
    });
    expect(batch.get('operationPlanJson')).toBeNull();
    const importedEvents = await app.db.getRepository('agAgentConversationEvents').find({
      filter: {
        runId,
      },
      sort: ['sequence'],
    });
    const source = expectString(importedEvents[0].get('source'));
    const storedPlan = {
      version: 1,
      operations: [
        ...Array.from({ length: 100 }, (_, index) => ({
          type: 'run-event',
          source: `already-processed-${index}`,
          sequence: index,
          eventType: 'already.processed',
          message: 'Already processed',
          payload: {},
        })),
        ...Array.from({ length: 52 }, (_, index) => {
          const sequence = index + 99;
          return {
            type: 'conversation-event',
            values: {
              source,
              sequence,
              eventType: 'agent.progress',
              providerEventId: null,
              correlationId: null,
              confidence: null,
              contentText: sequence === 99 ? 'stored-plan-event-98' : `resumable-event-${sequence - 1}`,
              contentJson: {
                textKind: 'progress',
              },
            },
          };
        }),
      ],
    };
    const operationPlanSha256 = getOperationPlanSha256(storedPlan);

    await app.db.getRepository('agAgentConversationEvents').destroy({
      filter: {
        runId,
        sequence: {
          $gt: 98,
        },
      },
    });
    await app.db.getRepository('agExternalImportBatches').update({
      filterByTk: batch.get('id'),
      values: {
        status: 'failed',
        processedOperations: 100,
        observationCountsJson: {
          conversationEvents: 98,
          runEvents: 1,
          artifacts: 1,
        },
        operationPlanSha256,
        operationPlanJson: storedPlan,
        completedAt: null,
      },
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status: 'importing',
        completedAt: null,
        finishedAt: null,
      },
    });

    const retryResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
    expect(retryResponse.status).toBe(200);
    expect(getData<{ observations: Record<string, number> }>(retryResponse).observations).toEqual({
      conversationEvents: 150,
      runEvents: 1,
      artifacts: 1,
    });
    expect(
      await app.db.getRepository('agAgentConversationEvents').count({
        filter: {
          runId,
        },
      }),
    ).toBe(150);
    const resumedStoredEvent = await app.db.getRepository('agAgentConversationEvents').findOne({
      filter: {
        runId,
        source,
        sequence: 99,
      },
    });
    expect(resumedStoredEvent.get('contentText')).toBe('stored-plan-event-98');
    const resumedBatch = await app.db.getRepository('agExternalImportBatches').findOne({
      filterByTk: batch.get('id'),
    });
    expect(resumedBatch.toJSON()).toMatchObject({
      status: 'completed',
      operationCount: 152,
      processedOperations: 152,
      attemptCount: 2,
      operationPlanSha256,
    });
    expect(resumedBatch.get('operationPlanJson')).toBeNull();
  });

  it('publishes terminal state and the business backlink only after every observation is committed', async () => {
    await seedBusinessCollection();
    const ticket = await createTicket('Resumable imported task');
    const externalRunKey = `atomic-finalization-${randomUUID()}`;
    const payload = {
      externalRunKey,
      provider: 'generic-cli',
      status: 'succeeded',
      sourceCollection: 'agExternalImportTickets',
      sourceRecordId: ticket.get('id'),
      outputAgentRunField: 'agentRun',
      resultSummary: {
        summary: 'final imported result',
        tokenUsageJson: {
          inputTokens: 90,
          outputTokens: 10,
          totalTokens: 100,
        },
      },
      logs: [
        {
          format: 'text',
          contentText: Array.from({ length: 150 }, (_, index) => `atomic-event-${index}`).join('\n'),
        },
      ],
    };
    const ticketRepository = app.db.getRepository('agExternalImportTickets');
    const relationUpdateSpy = vi
      .spyOn(ticketRepository, 'update')
      .mockRejectedValueOnce(new Error('simulated backlink write failure'));

    const failedResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
    relationUpdateSpy.mockRestore();
    expect(failedResponse.status).toBe(500);

    const identity = await app.db.getRepository('agExternalRunIdentities').findOne({
      filter: {
        externalRunKey,
      },
    });
    const runId = expectString(identity.get('runId'));
    const incompleteRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(incompleteRun.toJSON()).toMatchObject({
      status: 'importing',
      completedAt: null,
      finishedAt: null,
    });
    expect(incompleteRun.get('resultSummaryJson')).toBeNull();
    const unchangedTicket = await ticketRepository.findOne({
      filterByTk: ticket.get('id'),
    });
    expect(unchangedTicket.get('agentRunId')).toBeFalsy();
    const failedBatch = await app.db.getRepository('agExternalImportBatches').findOne({
      filter: {
        runId,
        batchKey: 'initial',
      },
    });
    expect(failedBatch.toJSON()).toMatchObject({
      status: 'failed',
      processedOperations: 100,
      relationUpdated: false,
    });
    expect(failedBatch.get('operationPlanJson')).toBeTruthy();
    expect(
      await app.db.getRepository('agAgentConversationEvents').count({
        filter: {
          runId,
        },
      }),
    ).toBe(98);

    const maintenanceResult = await cleanupAgentGatewayRetention(
      { db: app.db },
      {
        now: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    );
    expect(maintenanceResult.abandonedImportRuns).toBe(1);
    const abandonedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(abandonedRun.toJSON()).toMatchObject({
      status: 'abandoned',
      failedAt: expect.anything(),
      finishedAt: expect.anything(),
    });
    expect(abandonedRun.get('resultSummaryJson')).toBeNull();

    const retryResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
    expect(retryResponse.status, JSON.stringify(retryResponse.body)).toBe(200);
    expect(getData<{ relationUpdated: boolean; run: Record<string, unknown> }>(retryResponse)).toMatchObject({
      relationUpdated: true,
      run: {
        status: 'succeeded',
      },
    });
    const completedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(completedRun.toJSON()).toMatchObject({
      status: 'succeeded',
      completedAt: expect.anything(),
      finishedAt: expect.anything(),
      resultSummaryJson: {
        summary: 'final imported result',
        tokenUsageJson: {
          inputTokens: 90,
          outputTokens: 10,
          totalTokens: 100,
        },
      },
    });
    const updatedTicket = await ticketRepository.findOne({
      filterByTk: ticket.get('id'),
    });
    expect(updatedTicket.get('agentRunId')).toBe(runId);
    expect(
      await app.db.getRepository('agAgentConversationEvents').count({
        filter: {
          runId,
        },
      }),
    ).toBe(150);
  });

  it('cancels an incomplete import without allowing the canceled batch to revive the run', async () => {
    const externalRunKey = `cancel-import-${randomUUID()}`;
    const importResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey,
      provider: 'generic-cli',
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
    const finalPayload = {
      batchKey: 'final',
      provider: 'generic-cli',
      status: 'succeeded',
      logs: [
        {
          format: 'text',
          contentText: 'finished',
        },
      ],
    };
    const conversationRepository = app.db.getRepository('agAgentConversationEvents');
    const conversationWriteSpy = vi
      .spyOn(conversationRepository, 'create')
      .mockRejectedValueOnce(new Error('simulated observation write failure'));
    const failedResponse = await rootAgent
      .post(`/agentGatewayApi:appendExternalRunObservations/${runId}`)
      .send(finalPayload);
    conversationWriteSpy.mockRestore();
    expect(failedResponse.status).toBe(500);

    const cancelResponse = await rootAgent.post(`/agentGatewayApi:cancelRun/${runId}`).send({});
    expect(cancelResponse.status).toBe(200);
    expect(getData<{ status: string }>(cancelResponse).status).toBe('canceled');
    const batch = await app.db.getRepository('agExternalImportBatches').findOne({
      filter: {
        runId,
        batchKey: 'final',
      },
    });
    expect(batch.toJSON()).toMatchObject({
      status: 'failed',
      errorSummary: EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY,
    });

    const retryResponse = await rootAgent
      .post(`/agentGatewayApi:appendExternalRunObservations/${runId}`)
      .send(finalPayload);
    expect(retryResponse.status).toBe(409);
    expect(getErrorMessage(retryResponse)).toContain('cannot be resumed');
    const canceledRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(canceledRun.get('status')).toBe('canceled');
  });

  it('stops an in-flight multi-chunk import as soon as cancellation becomes visible', async () => {
    const importResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey: `cancel-in-flight-${randomUUID()}`,
      provider: 'generic-cli',
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
    const batchKey = 'cancel-between-chunks';
    const finalPayload = {
      batchKey,
      provider: 'generic-cli',
      status: 'succeeded',
      logs: [
        {
          format: 'text',
          contentText: Array.from({ length: 150 }, (_, index) => `cancel-event-${index}`).join('\n'),
        },
      ],
    };
    const runRepository = app.db.getRepository('agRuns');
    const batchRepository = app.db.getRepository('agExternalImportBatches');
    const originalRunFindOne = runRepository.findOne.bind(runRepository);
    const originalBatchUpdate = batchRepository.update.bind(batchRepository);
    let cancelBeforeNextChunk = false;
    const batchUpdateSpy = vi.spyOn(batchRepository, 'update').mockImplementation(async (options) => {
      const result = await originalBatchUpdate(options);
      const values = options.values as Record<string, unknown>;
      if (values.processedOperations === 100) {
        cancelBeforeNextChunk = true;
      }
      return result;
    });
    const runFindSpy = vi.spyOn(runRepository, 'findOne').mockImplementation(async (options) => {
      if (cancelBeforeNextChunk && String(options.filterByTk) === runId && options.transaction) {
        cancelBeforeNextChunk = false;
        const now = new Date();
        const queryInterface = app.db.sequelize.getQueryInterface();
        await queryInterface.bulkUpdate(
          app.db.getCollection('agRuns').model.getTableName(),
          {
            status: 'canceled',
            cancelRequested: true,
            cancelRequestedAt: now,
            canceledAt: now,
            finishedAt: now,
          },
          {
            id: runId,
          },
          {
            transaction: null,
          },
        );
        await queryInterface.bulkUpdate(
          app.db.getCollection('agExternalImportBatches').model.getTableName(),
          {
            status: 'failed',
            errorSummary: EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY,
            completedAt: null,
            lastAttemptAt: now,
          },
          {
            runId,
            batchKey,
          },
          {
            transaction: null,
          },
        );
      }
      return await originalRunFindOne(options);
    });

    const canceledResponse = await rootAgent
      .post(`/agentGatewayApi:appendExternalRunObservations/${runId}`)
      .send(finalPayload);
    runFindSpy.mockRestore();
    batchUpdateSpy.mockRestore();
    expect(canceledResponse.status).toBe(409);
    expect(getErrorMessage(canceledResponse)).toContain('cannot be resumed');

    const canceledBatch = await batchRepository.findOne({
      filter: {
        runId,
        batchKey,
      },
    });
    expect(canceledBatch.toJSON()).toMatchObject({
      status: 'failed',
      processedOperations: 100,
      errorSummary: EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY,
    });
    const eventCountAfterCancel = await app.db.getRepository('agAgentConversationEvents').count({
      filter: {
        runId,
      },
    });
    expect(eventCountAfterCancel).toBeLessThan(150);

    const retryResponse = await rootAgent
      .post(`/agentGatewayApi:appendExternalRunObservations/${runId}`)
      .send(finalPayload);
    expect(retryResponse.status).toBe(409);
    expect(
      await app.db.getRepository('agAgentConversationEvents').count({
        filter: {
          runId,
        },
      }),
    ).toBe(eventCountAfterCancel);
  });

  it('validates every observation before creating the run or updating a business backlink', async () => {
    await seedBusinessCollection();
    const ticket = await createTicket('Invalid imported task');
    const runCount = await app.db.getRepository('agRuns').count({});
    const identityCount = await app.db.getRepository('agExternalRunIdentities').count({});
    const batchCount = await app.db.getRepository('agExternalImportBatches').count({});
    const response = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey: `invalid-observation-${randomUUID()}`,
      provider: 'generic-cli',
      sourceCollection: 'agExternalImportTickets',
      sourceRecordId: ticket.get('id'),
      outputAgentRunField: 'agentRun',
      logs: [
        {
          format: 'text',
          contentText: Array.from({ length: 150 }, (_, index) => `valid-event-${index}`).join('\n'),
        },
      ],
      artifacts: [
        {
          artifactKey: 'missing-type',
          contentText: 'This invalid operation comes after the first observation chunk',
        },
      ],
    });
    expect(response.status).toBe(400);
    expect(getErrorMessage(response)).toContain('artifactType is required');
    expect(await app.db.getRepository('agRuns').count({})).toBe(runCount);
    expect(await app.db.getRepository('agExternalRunIdentities').count({})).toBe(identityCount);
    expect(await app.db.getRepository('agExternalImportBatches').count({})).toBe(batchCount);
    const unchangedTicket = await app.db.getRepository('agExternalImportTickets').findOne({
      filterByTk: ticket.get('id'),
    });
    expect(unchangedTicket.get('agentRunId')).toBeFalsy();
  });

  it('appends external observations only to imported runs', async () => {
    const importResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
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

    const appendResponse = await rootAgent.post(`/agentGatewayApi:appendExternalRunObservations/${runId}`).send({
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

    const artifactsResponse = await rootAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`);
    expect(artifactsResponse.status).toBe(200);
    expect(getListData(artifactsResponse)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactKey: expect.stringContaining('raw-log:generic-cli:text'),
        }),
      ]),
    );

    const runEventsResponse = await rootAgent.get(`/agentGatewayApi:listRunEvents/${runId}`);
    expect(runEventsResponse.status).toBe(200);

    const managedRunResponse = await rootAgent.post('/agentGatewayApi:createRun').send({
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
      .post(`/agentGatewayApi:appendExternalRunObservations/${managedRunId}`)
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
    const deniedResponse = await readOnlyAgent.post('/agentGatewayApi:importExternalRun').send({
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
    const allowedResponse = await importAgent.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey: `permission-import-${randomUUID()}`,
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

  it('requires a stable externalRunKey or runCode for idempotent imports', async () => {
    const runCount = await app.db.getRepository('agRuns').count({});
    const response = await rootAgent.post('/agentGatewayApi:importExternalRun').send({
      provider: 'generic-cli',
      logs: [
        {
          format: 'text',
          contentText: 'missing stable identity',
        },
      ],
    });
    expect(response.status).toBe(400);
    expect(getErrorMessage(response)).toContain('externalRunKey or runCode is required');
    expect(await app.db.getRepository('agRuns').count({})).toBe(runCount);

    const runCode = `stable-import-${randomUUID()}`;
    const payload = {
      runCode,
      provider: 'generic-cli',
      logs: [
        {
          format: 'text',
          contentText: 'stable run code identity',
        },
      ],
    };
    const firstResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
    const retryResponse = await rootAgent.post('/agentGatewayApi:importExternalRun').send(payload);
    expect(firstResponse.status).toBe(200);
    expect(retryResponse.status).toBe(200);
    expect(getData<{ runId: string }>(retryResponse).runId).toBe(getData<{ runId: string }>(firstResponse).runId);
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

    const response = await importAgent.post('/agentGatewayApi:importExternalRun').send({
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
    const identityCountBeforeDeniedImport = await app.db.getRepository('agExternalRunIdentities').count({});
    const batchCountBeforeDeniedImport = await app.db.getRepository('agExternalImportBatches').count({});
    const deniedResponse = await deniedAgent.post('/agentGatewayApi:importExternalRun').send({
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
    expect(await app.db.getRepository('agExternalRunIdentities').count({})).toBe(identityCountBeforeDeniedImport);
    expect(await app.db.getRepository('agExternalImportBatches').count({})).toBe(batchCountBeforeDeniedImport);
    const unchangedDeniedTicket = await app.db.getRepository('agExternalImportTickets').findOne({
      filterByTk: deniedTicket.get('id'),
    });
    expect(unchangedDeniedTicket.get('agentRunId')).toBeFalsy();
  });
});
