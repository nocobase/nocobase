/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { MockCluster, MockServer, createMockCluster } from '@nocobase/test';

import { createSkillZipFixture } from '../../node/__tests__/skillArchiveFixtures';
import { AGENT_GATEWAY_SKILL_CAPABILITY_HEADER } from '../../shared/skillCapability';
import PluginAgentGatewayServer from '../plugin';
import { createNodeToken, toStoredTokenFields } from '../security';

interface ResponseLike {
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function binaryParser(response: NodeJS.ReadableStream, callback: (error: Error | null, body?: Buffer) => void) {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  response.on('end', () => callback(null, Buffer.concat(chunks)));
  response.on('error', callback);
}

async function getRootAgent(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });
  expect(rootUser).toBeTruthy();
  return await app.agent().login(rootUser);
}

describe('agent gateway shared storage cluster access', () => {
  let cluster: MockCluster;

  beforeEach(async () => {
    cluster = await createMockCluster({
      plugins: [
        'file-manager',
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
    await cluster?.destroy();
  });

  it('downloads Skill ZIPs and reads protected artifacts from a different instance', async () => {
    const [appA, appB] = cluster.nodes;
    const [agentA, agentB] = await Promise.all([getRootAgent(appA), getRootAgent(appB)]);
    const skillZip = createSkillZipFixture([{ name: 'SKILL.md', content: '# Shared Skill\n' }]);
    const skillResponse = await agentA.post('/agentGatewayApi:uploadSkillVersion').send({
      skillKey: `shared-skill-${randomUUID()}`,
      versionLabel: 'v1',
      contentBase64: skillZip.toString('base64'),
    });
    expect(skillResponse.status).toBe(200);
    const skill = getData(skillResponse);
    expect(skill.source).not.toHaveProperty('objectKey');

    const nodeToken = createNodeToken();
    const now = new Date();
    const node = await appB.db.getRepository('agNodes').create({
      values: {
        nodeKey: `shared-storage-node-${randomUUID()}`,
        displayName: 'Shared storage node',
        status: 'active',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: { maxConcurrency: 1 },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const nodeId = String(node.get('id'));
    const profile = await appB.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId,
        profileKey: 'shared-storage',
        displayName: 'Shared storage',
        agentType: 'code',
        driver: 'fake',
        status: 'active',
        capabilitiesJson: { maxConcurrency: 1 },
      },
    });
    const run = await appA.db.getRepository('agRuns').create({
      values: {
        runCode: `shared-storage-run-${randomUUID()}`,
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        nodeId,
        agentProfileId: profile.get('id'),
        requestedAt: now,
        queuedAt: now,
        executionPayloadJson: {
          executionPolicyKey: 'shared-storage',
          resolvedSkills: [{ skillVersionId: skill.skillVersionId }],
        },
      },
    });
    const claimResponse = await appB
      .agent()
      .post(`/agentGatewayApi:claimRun/${nodeId}`)
      .set('Authorization', `Bearer ${nodeToken.token}`)
      .send({ runId: run.get('id'), profileKey: 'shared-storage' });
    expect(claimResponse.status).toBe(200);
    const claim = getData(claimResponse);
    const claimedRun = claim.run as Record<string, unknown>;
    const executionPayload = claimedRun.executionPayloadJson as Record<string, unknown>;
    const skillVersions = executionPayload.skillVersions as Array<Record<string, unknown>>;
    const source = skillVersions[0].source as Record<string, unknown>;
    expect(source).not.toHaveProperty('objectKey');
    const archiveUrl = new URL(String(source.archiveUrl));
    const archiveResponse = await appB
      .agent()
      .get(`${archiveUrl.pathname.replace(/^\/api/, '')}${archiveUrl.search}`)
      .set('Authorization', `Bearer ${nodeToken.token}`)
      .set(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, String(source.capabilityToken))
      .buffer(true)
      .parse(binaryParser);
    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body).toEqual(skillZip);

    const artifactText = '# Shared artifact';
    const importResponse = await agentA.post('/agentGatewayApi:importExternalRun').send({
      externalRunKey: `shared-artifact-${randomUUID()}`,
      provider: 'codex',
      title: 'Shared artifact run',
      status: 'succeeded',
      artifacts: [
        {
          artifactKey: 'shared-report',
          artifactType: 'text',
          mimeType: 'text/markdown',
          contentText: artifactText,
        },
      ],
    });
    expect(importResponse.status).toBe(200);
    const runId = String(getData(importResponse).runId);
    const listResponse = await agentB.get(`/agentGatewayApi:listRunArtifacts/${runId}`);
    expect(listResponse.status).toBe(200);
    const artifacts = listResponse.body.data as Array<Record<string, unknown>>;
    const artifact = artifacts.find((item) => item.artifactKey === 'shared-report');
    expect(artifact).toBeTruthy();
    expect(artifact).not.toHaveProperty('objectKey');
    const contentResponse = await agentB.get(
      `/agentGatewayApi:getRunArtifactContent/${runId}?artifactId=${String(artifact?.id)}`,
    );
    expect(contentResponse.status).toBe(200);
    expect(getData(contentResponse)).toMatchObject({ contentText: artifactText });
  });
});
