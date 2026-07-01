/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

describe('agent gateway agent session lifecycle APIs', () => {
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
        nodeKey: `node-${profileKey}`,
        displayName: `Node ${profileKey}`,
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

  async function createRun(runCode: string, values: Record<string, unknown>) {
    const response = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode,
      sourceType: 'test',
      promptSnapshot: {
        text: runCode,
      },
      executionPayload: {
        commandKey: 'codex',
        args: ['exec', '--json', `Prompt for ${runCode}`],
      },
      ...values,
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

  async function upsertSession(
    runner: Awaited<ReturnType<typeof createRunner>>,
    claim: Record<string, unknown>,
    providerSessionId: string,
  ) {
    const response = await upsertSessionResponse(runner, claim, providerSessionId);
    expect(response.status).toBe(200);
    return getData(response);
  }

  async function upsertSessionResponse(
    runner: Awaited<ReturnType<typeof createRunner>>,
    claim: Record<string, unknown>,
    providerSessionId: string,
  ) {
    return await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${claim.runId}/agent-session:upsert`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
        provider: 'codex',
        providerSessionId,
        capabilities: {
          detectSessionId: true,
        },
        metadata: {
          source: 'test',
        },
      });
  }

  it('upserts a Codex session and links the claimed run without exposing lease secrets', async () => {
    const runner = await createRunner();
    const run = await createRun('session-run-1', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    const claim = await claimRun(runner, run.id);

    const result = await upsertSession(runner, claim, 'codex-thread-1');

    expect(result).toMatchObject({
      runId: run.id,
      provider: 'codex',
      providerSessionId: 'codex-thread-1',
      idempotent: false,
    });
    expect(JSON.stringify(result)).not.toContain(String(claim.claimToken));

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('agentSessionId')).toBeTruthy();
    expect(storedRun.get('agentSessionProvider')).toBe('codex');
    expect(storedRun.get('agentSessionProviderId')).toBe('codex-thread-1');

    const session = await app.db.getRepository('agAgentSessions').findOne({
      filterByTk: storedRun.get('agentSessionId'),
    });
    expect(session.get('provider')).toBe('codex');
    expect(session.get('providerSessionId')).toBe('codex-thread-1');
    expect(session.get('rootRunId')).toBe(run.id);
    expect(session.get('latestRunId')).toBe(run.id);

    const apiLogs = await app.db.getRepository('agApiCallLogs').find({
      filter: {
        runId: run.id,
      },
    });
    const upsertLog = apiLogs.find(
      (log) => log.get('path') === `/api/agent-gateway/nodes/${runner.nodeId}/runs/${run.id}/agent-session:upsert`,
    );
    expect(upsertLog).toBeTruthy();
    expect(upsertLog?.get('nodeId')).toBe(runner.nodeId);
    expect(upsertLog?.get('statusCode')).toBe(200);
    expect((upsertLog?.get('requestSummaryJson') as Record<string, unknown>).action).toBe('agent-session:upsert');
    expect(JSON.stringify(upsertLog?.toJSON())).not.toContain(String(claim.claimToken));
  });

  it('keeps session upsert idempotent and advances latestRunId for continuation runs', async () => {
    const runner = await createRunner();
    const firstRun = await createRun('session-run-root', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    const firstClaim = await claimRun(runner, firstRun.id);
    const firstResult = await upsertSession(runner, firstClaim, 'codex-thread-continuation');
    const repeatedResult = await upsertSession(runner, firstClaim, 'codex-thread-continuation');
    expect(repeatedResult).toMatchObject({
      idempotent: true,
    });

    const now = new Date();
    const continuationRun = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'session-run-continuation',
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        sourceType: 'test',
        promptSnapshot: {
          text: 'session-run-continuation',
        },
        executionPayloadJson: {
          commandKey: 'codex',
          args: ['exec', '--json', 'Prompt for session-run-continuation'],
        },
        requestedAt: now,
        queuedAt: now,
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
        parentRunId: firstRun.id,
        resumedFromRunId: firstRun.id,
        continuationReason: 'user-message',
        continuationRequestKey: 'continue-key-1',
      },
    });
    const continuationClaim = await claimRun(runner, continuationRun.get('id'));
    await upsertSession(runner, continuationClaim, 'codex-thread-continuation');

    const staleRootRetry = await upsertSession(runner, firstClaim, 'codex-thread-continuation');
    expect(staleRootRetry).toMatchObject({
      idempotent: true,
    });

    const session = await app.db.getRepository('agAgentSessions').findOne({
      filterByTk: (firstResult.session as Record<string, unknown>).id,
    });
    expect(session.get('rootRunId')).toBe(firstRun.id);
    expect(session.get('latestRunId')).toBe(continuationRun.get('id'));
  });

  it('uses the continuation parent as root when the first session detection happens on a child run', async () => {
    const runner = await createRunner();
    const parentRun = await createRun('session-parent-before-detection', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    const now = new Date();
    const continuationRun = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'session-child-first-detection',
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        sourceType: 'test',
        promptSnapshot: {
          text: 'session-child-first-detection',
        },
        executionPayloadJson: {
          commandKey: 'codex',
          args: ['exec', '--json', 'Prompt for session-child-first-detection'],
        },
        requestedAt: now,
        queuedAt: now,
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
        parentRunId: parentRun.id,
      },
    });
    const continuationClaim = await claimRun(runner, continuationRun.get('id'));
    await upsertSession(runner, continuationClaim, 'codex-thread-child-first');

    const session = await app.db.getRepository('agAgentSessions').findOne({
      filter: {
        provider: 'codex',
        providerSessionId: 'codex-thread-child-first',
      },
    });
    expect(session.get('rootRunId')).toBe(parentRun.id);
    expect(session.get('latestRunId')).toBe(continuationRun.get('id'));
  });

  it('resolves the original root when first session detection happens on a deeper continuation chain', async () => {
    const runner = await createRunner();
    const rootRun = await createRun('session-root-before-grandchild-detection', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    const now = new Date();
    const childRun = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'session-child-before-grandchild-detection',
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        sourceType: 'test',
        promptSnapshot: {
          text: 'session-child-before-grandchild-detection',
        },
        executionPayloadJson: {
          commandKey: 'codex',
          args: ['exec', '--json', 'Prompt for session-child-before-grandchild-detection'],
        },
        requestedAt: now,
        queuedAt: now,
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
        parentRunId: rootRun.id,
        resumedFromRunId: rootRun.id,
      },
    });
    const grandchildRun = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'session-grandchild-first-detection',
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        sourceType: 'test',
        promptSnapshot: {
          text: 'session-grandchild-first-detection',
        },
        executionPayloadJson: {
          commandKey: 'codex',
          args: ['exec', '--json', 'Prompt for session-grandchild-first-detection'],
        },
        requestedAt: now,
        queuedAt: now,
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
        parentRunId: childRun.get('id'),
        resumedFromRunId: childRun.get('id'),
      },
    });

    const grandchildClaim = await claimRun(runner, grandchildRun.get('id'));
    await upsertSession(runner, grandchildClaim, 'codex-thread-grandchild-first');

    const session = await app.db.getRepository('agAgentSessions').findOne({
      filter: {
        provider: 'codex',
        providerSessionId: 'codex-thread-grandchild-first',
      },
    });
    expect(session.get('rootRunId')).toBe(rootRun.id);
    expect(session.get('latestRunId')).toBe(grandchildRun.get('id'));
  });

  it('rejects linking an existing provider session to an unrelated run lineage', async () => {
    const runner = await createRunner();
    const firstRun = await createRun('session-link-guard-root', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    const firstClaim = await claimRun(runner, firstRun.id);
    const firstResult = await upsertSession(runner, firstClaim, 'codex-thread-link-guard');

    const unrelatedRun = await createRun('session-link-guard-unrelated', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    const unrelatedClaim = await claimRun(runner, unrelatedRun.id);
    const rejectedResponse = await upsertSessionResponse(runner, unrelatedClaim, 'codex-thread-link-guard');

    expect(rejectedResponse.status).toBe(409);
    expect(JSON.stringify(rejectedResponse.body)).toContain('Provider session already belongs to another run lineage');

    const storedUnrelatedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: unrelatedRun.id,
    });
    expect(storedUnrelatedRun.get('agentSessionId')).toBeFalsy();
    expect(storedUnrelatedRun.get('agentSessionProviderId')).toBeFalsy();

    const session = await app.db.getRepository('agAgentSessions').findOne({
      filterByTk: (firstResult.session as Record<string, unknown>).id,
    });
    expect(session.get('rootRunId')).toBe(firstRun.id);
    expect(session.get('latestRunId')).toBe(firstRun.id);
  });
});
