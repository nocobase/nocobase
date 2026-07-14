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
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../shared/apiContract';

function getTestApiPath(action: Parameters<typeof getAgentGatewayApiUrl>[0], targetKey?: unknown) {
  return `/${getAgentGatewayApiUrl(action, targetKey === undefined ? undefined : String(targetKey))}`;
}

function getData(response: { body: { data?: Record<string, unknown> } }) {
  return response.body.data || response.body;
}

describe('agent gateway API call log sampling', () => {
  let app: MockServer;

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
  });

  afterEach(async () => {
    await app?.destroy();
  });

  async function createRunner() {
    const nodeToken = createNodeToken();
    const now = new Date();
    const node = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey: 'task04-log-node',
        displayName: 'Task 04 log node',
        status: 'active',
        authMode: 'node-token',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: { maxConcurrency: 1 },
        metadataJson: { currentConcurrency: 0 },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const nodeId = String(node.get('id'));
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId,
        profileKey: 'codex',
        provider: 'codex',
        displayName: 'Codex',
        agentType: 'code',
        driver: 'exec',
        status: 'active',
        capabilitiesJson: {
          executionPolicyKey: 'codex',
          structuredEvents: true,
        },
      },
    });
    return {
      nodeId,
      nodeToken: nodeToken.token,
      profileId: String(profile.get('id')),
    };
  }

  it('skips successful heartbeats and empty claims while retaining state changes and failures', async () => {
    const runner = await createRunner();
    const daemon = app.agent();

    for (let index = 0; index < 5; index += 1) {
      const heartbeatResponse = await daemon
        .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, runner.nodeId))
        .set('Authorization', `Bearer ${runner.nodeToken}`)
        .send({ currentConcurrency: 0 });
      expect(heartbeatResponse.status).toBe(200);

      const claimResponse = await daemon
        .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.claimRun, runner.nodeId))
        .set('Authorization', `Bearer ${runner.nodeToken}`)
        .send({ profileKey: 'codex' });
      expect(claimResponse.status).toBe(200);
      expect(getData(claimResponse).claimed).toBe(false);
    }

    expect(await app.db.getRepository('agApiCallLogs').count()).toBe(0);

    const now = new Date();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'task04-api-log-run',
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        requestedAt: now,
        queuedAt: now,
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
        executionPayloadJson: {
          executionPolicyKey: 'codex',
          prompt: 'Test API log sampling',
          cwd: '.',
        },
      },
    });
    const claimResponse = await daemon
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.claimRun, runner.nodeId))
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({ profileKey: 'codex', runId: run.get('id') });
    expect(claimResponse.status).toBe(200);
    const claim = getData(claimResponse);
    expect(claim.claimed).toBe(true);
    expect(await app.db.getRepository('agApiCallLogs').count()).toBe(1);

    const changedNodeHeartbeatResponse = await daemon
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, runner.nodeId))
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({ currentConcurrency: 1 });
    expect(changedNodeHeartbeatResponse.status).toBe(200);
    expect(await app.db.getRepository('agApiCallLogs').count()).toBe(2);

    const repeatedNodeHeartbeatResponse = await daemon
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, runner.nodeId))
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({ currentConcurrency: 1 });
    expect(repeatedNodeHeartbeatResponse.status).toBe(200);
    expect(await app.db.getRepository('agApiCallLogs').count()).toBe(2);

    const runHeartbeatResponse = await daemon
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, String(run.get('id'))))
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
        status: 'running',
      });
    expect(runHeartbeatResponse.status).toBe(200);
    expect(await app.db.getRepository('agApiCallLogs').count()).toBe(3);

    const repeatedRunHeartbeatResponse = await daemon
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, String(run.get('id'))))
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: Number(claim.leaseVersion) + 1,
        status: 'running',
      });
    expect(repeatedRunHeartbeatResponse.status).toBe(200);
    expect(await app.db.getRepository('agApiCallLogs').count()).toBe(3);

    const failedHeartbeatResponse = await daemon
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, runner.nodeId))
      .set('Authorization', 'Bearer invalid-node-token')
      .send({ currentConcurrency: 0 });
    expect(failedHeartbeatResponse.status).toBe(401);

    const logs = await app.db.getRepository('agApiCallLogs').find({
      sort: ['createdAt'],
    });
    expect(logs).toHaveLength(4);
    expect(logs[0].get('path')).toContain('claimRun');
    expect(logs[0].get('statusCode')).toBe(200);
    expect(logs[1].get('path')).toContain('heartbeatNode');
    expect(logs[1].get('statusCode')).toBe(200);
    expect(logs[2].get('path')).toContain('heartbeatRun');
    expect(logs[2].get('statusCode')).toBe(200);
    expect(logs[3].get('path')).toContain('heartbeatNode');
    expect(logs[3].get('statusCode')).toBe(401);
  });
});
