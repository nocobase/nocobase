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

interface TestRunner {
  nodeId: string;
  nodeToken: string;
  profileId: string;
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

describe('agent gateway run lifecycle APIs', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let queuedRunOffset = 0;

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
    queuedRunOffset = 0;

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

  async function createRunner(options: { nodeKey?: string; maxConcurrency?: number } = {}): Promise<TestRunner> {
    const nodeKey = options.nodeKey || 'node-1';
    const nodeToken = createNodeToken();
    const now = new Date();
    const node = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey,
        displayName: nodeKey,
        status: 'active',
        authMode: 'node-token',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: {
          maxConcurrency: options.maxConcurrency || 1,
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const nodeId = String(node.get('id'));
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId,
        profileKey: 'fake-success',
        displayName: 'Fake Success',
        agentType: 'code',
        driver: 'fake',
        status: 'active',
        capabilitiesJson: {
          maxConcurrency: options.maxConcurrency || 1,
        },
      },
    });

    return {
      nodeId,
      nodeToken: nodeToken.token,
      profileId: String(profile.get('id')),
    };
  }

  async function createRun(runCode: string, values: Record<string, unknown> = {}) {
    const response = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode,
      sourceType: 'test',
      promptSnapshot: {
        text: `Prompt for ${runCode}`,
      },
      executionPayload: {
        task: runCode,
      },
      ...values,
    });

    expect(response.status).toBe(200);
    return getData(response);
  }

  async function seedQueuedRun(runCode: string, values: Record<string, unknown> = {}) {
    queuedRunOffset += 1;
    const queuedAt = new Date(Date.now() + queuedRunOffset);
    return await app.db.getRepository('agRuns').create({
      values: {
        runCode,
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        requestedAt: queuedAt,
        queuedAt,
        ...values,
      },
    });
  }

  async function seedActiveRun(runCode: string, values: Record<string, unknown>) {
    const now = new Date();
    return await app.db.getRepository('agRuns').create({
      values: {
        runCode,
        status: 'running',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        requestedAt: now,
        queuedAt: now,
        claimedAt: now,
        startedAt: now,
        claimExpiresAt: new Date(now.getTime() + 60000),
        ...values,
      },
    });
  }

  async function claimRun(runner: TestRunner, values: Record<string, unknown> = {}) {
    return await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs:claim`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        profileKey: 'fake-success',
        capabilities: {
          maxConcurrency: 999,
        },
        ...values,
      });
  }

  async function runDaemonAction(runner: TestRunner, runId: unknown, action: string, values: Record<string, unknown>) {
    return await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/${action}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(values);
  }

  it('creates queued runs without exposing claim token hashes', async () => {
    const run = await createRun('run-create-1');

    expect(run.id).toBeTruthy();
    expect(run.runCode).toBe('run-create-1');
    expect(run.status).toBe('queued');
    expect(run.claimAttempt).toBe(0);
    expect(run.leaseVersion).toBe(0);
    expect(run.cancelRequested).toBe(false);
    expect(run).not.toHaveProperty('claimTokenHash');

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('promptSnapshot')).toMatchObject({
      text: 'Prompt for run-create-1',
    });
    expect(storedRun.get('queuedAt')).toBeTruthy();
  });

  it('claims a queued run once and enforces persisted node/profile concurrency', async () => {
    const runner = await createRunner();
    const firstRun = await createRun('run-claim-1', {
      agentProfileId: runner.profileId,
    });
    await createRun('run-claim-2', {
      agentProfileId: runner.profileId,
    });

    const claimResponse = await claimRun(runner);
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim.claimed).toBe(true);
    expect(claim.runId).toBe(firstRun.id);
    expect(String(claim.claimToken)).toMatch(/^ag_claim_/);
    expect(claim.claimAttempt).toBe(1);
    expect(claim.leaseVersion).toBe(1);
    expect(claim.nodeCapabilities).toMatchObject({
      maxConcurrency: 1,
    });
    expect(claim.profileCapabilities).toMatchObject({
      maxConcurrency: 1,
    });

    const claimedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: firstRun.id,
    });
    expect(claimedRun.get('status')).toBe('claimed');
    expect(claimedRun.get('nodeId')).toBe(runner.nodeId);
    expect(claimedRun.get('agentProfileId')).toBe(runner.profileId);
    expect(claimedRun.get('claimTokenHash')).not.toBe(claim.claimToken);
    expect(claimedRun.get('claimTokenLast4')).toBe(String(claim.claimToken).slice(-4));

    const secondClaimResponse = await claimRun(runner);
    const secondClaim = getData(secondClaimResponse);
    expect(secondClaimResponse.status).toBe(200);
    expect(secondClaim).toMatchObject({
      claimed: false,
      reason: 'node_concurrency_full',
    });
  });

  it('filters claim candidates by persisted node and profile eligibility before pagination', async () => {
    const otherRunner = await createRunner({
      nodeKey: 'node-other',
    });
    const runner = await createRunner({
      nodeKey: 'node-target',
    });

    for (let index = 0; index < 55; index += 1) {
      await seedQueuedRun(`run-other-node-${index}`, {
        nodeId: otherRunner.nodeId,
        agentProfileId: otherRunner.profileId,
      });
    }
    const claimableRun = await seedQueuedRun('run-target-after-global-page', {
      agentProfileId: runner.profileId,
    });

    const claimResponse = await claimRun(runner);
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim.claimed).toBe(true);
    expect(claim.runId).toBe(claimableRun.get('id'));
  });

  it('skips full profiles and claims later candidates for another active profile', async () => {
    const runner = await createRunner({
      nodeKey: 'node-profile-skip',
      maxConcurrency: 2,
    });
    await app.db.getRepository('agAgentProfiles').update({
      filterByTk: runner.profileId,
      values: {
        capabilitiesJson: {
          maxConcurrency: 1,
        },
      },
    });
    const secondaryProfile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId: runner.nodeId,
        profileKey: 'fake-secondary',
        displayName: 'Fake Secondary',
        agentType: 'code',
        driver: 'fake',
        status: 'active',
        capabilitiesJson: {
          maxConcurrency: 1,
        },
      },
    });
    await seedActiveRun('run-profile-primary-active', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    const blockedRun = await seedQueuedRun('run-profile-primary-blocked', {
      agentProfileId: runner.profileId,
    });
    const claimableRun = await seedQueuedRun('run-profile-secondary-claimable', {
      agentProfileId: String(secondaryProfile.get('id')),
    });

    const claimResponse = await claimRun(runner, {
      profileKey: '',
    });
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim.claimed).toBe(true);
    expect(claim.runId).toBe(claimableRun.get('id'));

    const blocked = await app.db.getRepository('agRuns').findOne({
      filterByTk: blockedRun.get('id'),
    });
    expect(blocked.get('status')).toBe('queued');
  });

  it('extends leases on heartbeat and rejects stale writers without mutation', async () => {
    const runner = await createRunner();
    const run = await createRun('run-heartbeat-1', {
      agentProfileId: runner.profileId,
    });
    const claim = getData(await claimRun(runner));

    const heartbeatResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      status: 'running',
    });
    const heartbeat = getData(heartbeatResponse);
    expect(heartbeatResponse.status).toBe(200);
    expect(heartbeat.status).toBe('running');
    expect(heartbeat.leaseVersion).toBe(2);
    expect(heartbeat.cancelRequested).toBe(false);

    const staleResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      status: 'running',
    });
    expect(staleResponse.status).toBe(409);
    expect(getData(staleResponse)).toMatchObject({
      code: 'lease_lost',
    });

    const wrongTokenResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: 'wrong-claim-token',
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      status: 'running',
    });
    expect(wrongTokenResponse.status).toBe(409);

    const downgradeResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      status: 'syncing_skills',
    });
    const downgrade = getData(downgradeResponse);
    expect(downgradeResponse.status).toBe(200);
    expect(downgrade.status).toBe('running');
    expect(downgrade.leaseVersion).toBe(3);

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('status')).toBe('running');
    expect(storedRun.get('leaseVersion')).toBe(3);
    expect(storedRun.get('lastRunHeartbeatAt')).toBeTruthy();
  });

  it('moves running runs through canceling and only cancels them after daemon ack', async () => {
    const runner = await createRunner();
    const run = await createRun('run-cancel-1', {
      agentProfileId: runner.profileId,
    });
    const claim = getData(await claimRun(runner));
    const heartbeat = getData(
      await runDaemonAction(runner, run.id, 'heartbeat', {
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
        status: 'running',
      }),
    );

    const cancelResponse = await rootAgent.post(`/api/agent-gateway/runs/${run.id}/cancel`).send({});
    const cancel = getData(cancelResponse);
    expect(cancelResponse.status).toBe(200);
    expect(cancel.status).toBe('canceling');
    expect(cancel.cancelRequested).toBe(true);
    expect(cancel.cancelRequestedAt).toBeTruthy();

    const completeWhileCancelingResponse = await runDaemonAction(runner, run.id, 'complete', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      resultSummary: {
        ok: true,
      },
    });
    expect(completeWhileCancelingResponse.status).toBe(409);

    const ackResponse = await runDaemonAction(runner, run.id, 'cancel-ack', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
    });
    const ack = getData(ackResponse);
    expect(ackResponse.status).toBe(200);
    expect(ack.status).toBe('canceled');
    expect(ack.leaseVersion).toBe(3);

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('status')).toBe('canceled');
    expect(storedRun.get('cancelAckAt')).toBeTruthy();
    expect(storedRun.get('canceledAt')).toBeTruthy();
    expect(storedRun.get('finishedAt')).toBeTruthy();

    const failAfterCancelResponse = await runDaemonAction(runner, run.id, 'fail', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: ack.leaseVersion,
      errorSummary: 'late failure',
    });
    expect(failAfterCancelResponse.status).toBe(409);
  });

  it('rejects terminal transitions that skip required active states', async () => {
    const runner = await createRunner();
    const run = await createRun('run-transition-guard-1', {
      agentProfileId: runner.profileId,
    });
    const claim = getData(await claimRun(runner));

    const completeBeforeRunningResponse = await runDaemonAction(runner, run.id, 'complete', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      resultSummary: {
        ok: true,
      },
    });
    expect(completeBeforeRunningResponse.status).toBe(409);

    const timeoutBeforeRunningResponse = await runDaemonAction(runner, run.id, 'timeout', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      errorSummary: 'timeout before process start',
    });
    expect(timeoutBeforeRunningResponse.status).toBe(409);

    const cancelAckBeforeCancelResponse = await runDaemonAction(runner, run.id, 'cancel-ack', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
    });
    expect(cancelAckBeforeCancelResponse.status).toBe(409);

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('status')).toBe('claimed');
    expect(storedRun.get('leaseVersion')).toBe(1);
    expect(storedRun.get('finishedAt')).toBeFalsy();
  });

  it('cancels queued runs immediately and excludes them from later claims', async () => {
    const runner = await createRunner();
    const run = await createRun('run-queued-cancel-1', {
      agentProfileId: runner.profileId,
    });

    const cancelResponse = await rootAgent.post(`/api/agent-gateway/runs/${run.id}/cancel`).send({});
    const cancel = getData(cancelResponse);
    expect(cancelResponse.status).toBe(200);
    expect(cancel.status).toBe('canceled');
    expect(cancel.finishedAt).toBeTruthy();

    const claimResponse = await claimRun(runner);
    const claim = getData(claimResponse);
    expect(claimResponse.status).toBe(200);
    expect(claim).toMatchObject({
      claimed: false,
      reason: 'no_claimable_run',
    });
  });

  it('marks expired leases abandoned and allows daemon-confirmed process timeout only from active leases', async () => {
    const runner = await createRunner();
    const abandonedRun = await createRun('run-abandon-1', {
      agentProfileId: runner.profileId,
    });
    await claimRun(runner);
    await app.db.getRepository('agRuns').update({
      filterByTk: abandonedRun.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const expireResponse = await rootAgent.post('/api/agent-gateway/runs:expire-leases').send({});
    const expire = getData(expireResponse);
    expect(expireResponse.status).toBe(200);
    expect(expire.abandonedCount).toBe(1);

    const abandoned = await app.db.getRepository('agRuns').findOne({
      filterByTk: abandonedRun.id,
    });
    expect(abandoned.get('status')).toBe('abandoned');
    expect(abandoned.get('finishedAt')).toBeTruthy();

    const timeoutRunner = await createRunner({
      nodeKey: 'node-timeout',
    });
    const timeoutRun = await createRun('run-timeout-1', {
      agentProfileId: timeoutRunner.profileId,
    });
    const timeoutClaim = getData(await claimRun(timeoutRunner));
    const timeoutHeartbeat = getData(
      await runDaemonAction(timeoutRunner, timeoutRun.id, 'heartbeat', {
        claimToken: timeoutClaim.claimToken,
        claimAttempt: timeoutClaim.claimAttempt,
        leaseVersion: timeoutClaim.leaseVersion,
        status: 'running',
      }),
    );
    const timeoutResponse = await runDaemonAction(timeoutRunner, timeoutRun.id, 'timeout', {
      claimToken: timeoutClaim.claimToken,
      claimAttempt: timeoutClaim.claimAttempt,
      leaseVersion: timeoutHeartbeat.leaseVersion,
      errorSummary: 'process timed out after stopping',
    });
    const timeout = getData(timeoutResponse);
    expect(timeoutResponse.status).toBe(200);
    expect(timeout.status).toBe('timeout');

    const completeAfterTimeoutResponse = await runDaemonAction(timeoutRunner, timeoutRun.id, 'complete', {
      claimToken: timeoutClaim.claimToken,
      claimAttempt: timeoutClaim.claimAttempt,
      leaseVersion: timeout.leaseVersion,
      resultSummary: {
        ok: true,
      },
    });
    expect(completeAfterTimeoutResponse.status).toBe(409);

    const timedOut = await app.db.getRepository('agRuns').findOne({
      filterByTk: timeoutRun.id,
    });
    expect(timedOut.get('status')).toBe('timeout');
    expect(timedOut.get('finishedAt')).toBeTruthy();
    expect(timedOut.get('errorSummary')).toBe('process timed out after stopping');
  });
});
