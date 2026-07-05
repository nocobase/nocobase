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
import { createInvitationToken } from '../security';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || {};
}

function extractInviteToken(registerCommand: unknown) {
  const match =
    String(registerCommand).match(/AGENT_GATEWAY_INVITE_TOKEN='([^']+)'/) ||
    String(registerCommand).match(/--invite-token\s+'?([^'\s]+)'?/);
  return match?.[1] || '';
}

describe('agent gateway node lifecycle APIs', () => {
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

  async function createInvitation(values: Record<string, unknown> = {}) {
    const response = await rootAgent.post('/api/agent-gateway/node-invitations:create').send({
      serverUrl: 'https://nocobase.example.test',
      expiresInSeconds: 3600,
      expectedNodeKey: 'node-1',
      ...values,
    });

    expect(response.status).toBe(200);
    return getData(response);
  }

  async function registerNode(inviteToken: string, values: Record<string, unknown> = {}) {
    return await app
      .agent()
      .post('/api/agent-gateway/nodes:register')
      .send({
        inviteToken,
        nodeKey: 'node-1',
        daemonVersion: 'fake-daemon/1.0.0',
        hostInfo: {
          hostname: 'agent-host',
        },
        capabilities: {
          maxConcurrency: 2,
        },
        ...values,
      });
  }

  it('creates an invitation and stores only the token hash plus last-four fingerprint', async () => {
    const data = await createInvitation({
      expectedNodeKey: 'node-1',
    });
    const inviteToken = extractInviteToken(data.registerCommand);

    expect(data.invitationId).toBeTruthy();
    expect(data.bootstrapCommand).toContain(
      "curl -fsSL 'https://nocobase.example.test/api/agent-gateway/bootstrap.sh'",
    );
    expect(data.bootstrapCommand).toContain("AGENT_GATEWAY_SERVER_URL='https://nocobase.example.test'");
    expect(data.bootstrapCommand).toContain("AGENT_GATEWAY_NODE_KEY='node-1'");
    expect(data.bootstrapCommand).toContain('AGENT_GATEWAY_INVITE_TOKEN');
    expect(data.bootstrapCommand).not.toContain('--invite-token');
    expect(data.registerCommand).toBe(data.bootstrapCommand);
    expect(inviteToken).toMatch(/^ag_inv_/);

    const invitation = await app.db.getRepository('agNodeInvitations').findOne({
      filterByTk: data.invitationId,
    });

    expect(invitation.get('tokenHash')).not.toBe(inviteToken);
    expect(invitation.get('tokenLast4')).toBe(inviteToken.slice(-4));
    expect(invitation.get('status')).toBe('pending');
  });

  it('serves the bootstrap script used by invitation commands', async () => {
    const response = await app.agent().get('/api/agent-gateway/bootstrap.sh');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/^#!\/usr\/bin\/env bash/);
    expect(response.text).toContain('AGENT_GATEWAY_NODE_KEY');
    expect(response.text).toContain('/api/agent-gateway/daemon-package.tgz');
    expect(response.text).toContain('--invite-token-stdin');
    expect(response.text).toContain('tmux new-session');
  });

  it('serves the daemon package used by the bootstrap script', async () => {
    const response = await app.agent().get('/api/agent-gateway/daemon-package.tgz');

    expect(response.status).toBe(200);
    expect(response.header['content-type']).toContain('application/gzip');
    expect(Number(response.header['content-length'] || 0)).toBeGreaterThan(1000);
  });

  it('registers a node once and rejects used, expired, or revoked invitations', async () => {
    const invitation = await createInvitation({
      expectedNodeKey: 'node-1',
    });
    const inviteToken = extractInviteToken(invitation.registerCommand);
    const response = await registerNode(inviteToken);
    const data = getData(response);

    expect(response.status).toBe(200);
    expect(data.nodeId).toBeTruthy();
    expect(data.nodeToken).toMatch(/^ag_node_/);
    expect(data.heartbeatIntervalSeconds).toBeGreaterThan(0);
    expect(data.claimIntervalSeconds).toBeGreaterThan(0);

    const node = await app.db.getRepository('agNodes').findOne({
      filterByTk: data.nodeId,
    });
    expect(node.get('nodeTokenHash')).not.toBe(data.nodeToken);
    expect(node.get('tokenLast4')).toBe(String(data.nodeToken).slice(-4));
    expect(node.get('status')).toBe('active');

    const acceptedInvitation = await app.db.getRepository('agNodeInvitations').findOne({
      filterByTk: invitation.invitationId,
    });
    expect(acceptedInvitation.get('status')).toBe('accepted');
    expect(acceptedInvitation.get('usedCount')).toBe(1);

    const reusedResponse = await registerNode(inviteToken, {
      nodeKey: 'node-2',
    });
    expect(reusedResponse.status).toBe(403);

    for (const [status, expiresAt] of [
      ['pending', new Date(Date.now() - 60_000)],
      ['revoked', new Date(Date.now() + 60_000)],
      ['accepted', new Date(Date.now() + 60_000)],
    ] as const) {
      const token = createInvitationToken();
      await app.db.getRepository('agNodeInvitations').create({
        values: {
          invitationKey: `inv-${status}`,
          status,
          tokenHash: token.tokenHash,
          tokenLast4: token.tokenLast4,
          maxUses: 1,
          usedCount: status === 'accepted' ? 1 : 0,
          expiresAt,
        },
      });
      const rejectedResponse = await registerNode(token.token, {
        nodeKey: `node-${status}`,
      });
      expect(rejectedResponse.status).toBe(403);
    }
  });

  it('re-registers the same daemon node key without creating duplicate nodes', async () => {
    const firstInvitation = await createInvitation({
      expectedNodeKey: 'node-1',
    });
    const firstResponse = await registerNode(extractInviteToken(firstInvitation.registerCommand), {
      displayName: 'Local daemon',
      capabilities: {
        maxConcurrency: 1,
      },
    });
    const firstRegistration = getData(firstResponse);
    const nodeId = String(firstRegistration.nodeId);
    const firstNodeToken = String(firstRegistration.nodeToken);

    expect(firstResponse.status).toBe(200);
    expect(await app.db.getRepository('agNodes').count({ filter: { nodeKey: 'node-1' } })).toBe(1);

    await app.db.getRepository('agNodes').update({
      filterByTk: nodeId,
      values: {
        status: 'disabled',
      },
    });

    const secondInvitation = await createInvitation({
      expectedNodeKey: 'node-1',
    });
    const secondResponse = await registerNode(extractInviteToken(secondInvitation.registerCommand), {
      displayName: 'Local daemon reconnected',
      daemonVersion: 'fake-daemon/2.0.0',
      hostInfo: {
        hostname: 'agent-host',
        platform: 'linux',
      },
      capabilities: {
        maxConcurrency: 4,
      },
    });
    const secondRegistration = getData(secondResponse);
    const secondNodeToken = String(secondRegistration.nodeToken);

    expect(secondResponse.status).toBe(200);
    expect(secondRegistration.nodeId).toBe(nodeId);
    expect(secondNodeToken).toMatch(/^ag_node_/);
    expect(secondNodeToken).not.toBe(firstNodeToken);
    expect(await app.db.getRepository('agNodes').count({ filter: { nodeKey: 'node-1' } })).toBe(1);

    const node = await app.db.getRepository('agNodes').findOne({
      filterByTk: nodeId,
    });
    expect(node.get('displayName')).toBe('Local daemon reconnected');
    expect(node.get('status')).toBe('active');
    expect(node.get('disabledAt')).toBeFalsy();
    expect(node.get('capabilitiesJson')).toMatchObject({
      maxConcurrency: 4,
    });
    expect(node.get('metadataJson')).toMatchObject({
      daemonVersion: 'fake-daemon/2.0.0',
      hostInfo: {
        hostname: 'agent-host',
        platform: 'linux',
      },
    });

    const oldTokenHeartbeatResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${firstNodeToken}`)
      .send({});
    expect(oldTokenHeartbeatResponse.status).toBe(401);

    const newTokenHeartbeatResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${secondNodeToken}`)
      .send({});
    expect(newTokenHeartbeatResponse.status).toBe(200);
  });

  it('reuses the same host node when the local daemon is registered with a new node key', async () => {
    const firstInvitation = await createInvitation({
      expectedNodeKey: 'node-1',
    });
    const firstResponse = await registerNode(extractInviteToken(firstInvitation.registerCommand), {
      nodeKey: 'node-1',
      hostInfo: {
        hostname: 'agent-host',
        platform: 'linux',
        arch: 'x64',
      },
    });
    const firstRegistration = getData(firstResponse);
    const nodeId = String(firstRegistration.nodeId);

    expect(firstResponse.status).toBe(200);

    const secondInvitation = await createInvitation({
      expectedNodeKey: 'node-2',
    });
    const secondResponse = await registerNode(extractInviteToken(secondInvitation.registerCommand), {
      nodeKey: 'node-2',
      displayName: 'Renamed local daemon',
      hostInfo: {
        hostname: 'agent-host',
        platform: 'linux',
        arch: 'x64',
      },
    });
    const secondRegistration = getData(secondResponse);

    expect(secondResponse.status).toBe(200);
    expect(secondRegistration.nodeId).toBe(nodeId);
    expect(await app.db.getRepository('agNodes').count()).toBe(1);

    const node = await app.db.getRepository('agNodes').findOne({
      filterByTk: nodeId,
    });
    expect(node.get('nodeKey')).toBe('node-2');
    expect(node.get('displayName')).toBe('Renamed local daemon');
  });

  it('hides stale same-host nodes after the active daemon heartbeats', async () => {
    const firstInvitation = await createInvitation({
      expectedNodeKey: 'node-1',
    });
    const firstResponse = await registerNode(extractInviteToken(firstInvitation.registerCommand), {
      nodeKey: 'node-1',
      hostInfo: {
        hostname: 'agent-host',
        platform: 'linux',
        arch: 'x64',
      },
    });
    const firstRegistration = getData(firstResponse);

    await app.db.getRepository('agNodes').create({
      values: {
        nodeKey: 'node-2',
        displayName: 'Duplicate local daemon',
        status: 'active',
        authMode: 'node-token',
        nodeTokenHash: 'duplicate-token-hash',
        tokenLast4: 'hash',
        registeredAt: new Date(),
        lastHeartbeatAt: new Date(),
        metadataJson: {
          hostInfo: {
            hostname: 'agent-host',
            platform: 'linux',
            arch: 'x64',
          },
        },
      },
    });

    const heartbeatResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${firstRegistration.nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${firstRegistration.nodeToken}`)
      .send({
        hostInfo: {
          hostname: 'agent-host',
          platform: 'linux',
          arch: 'x64',
        },
      });
    expect(heartbeatResponse.status).toBe(200);

    const listResponse = await rootAgent.get('/api/agent-gateway/nodes:list');
    expect(listResponse.status).toBe(200);
    const nodes = listResponse.body.data as Array<Record<string, unknown>>;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].nodeKey).toBe('node-1');
    expect(nodes[0].online).toBe(true);
    expect(nodes[0].onlineReason).toBeNull();

    const hiddenNode = await app.db.getRepository('agNodes').findOne({
      filter: {
        nodeKey: 'node-2',
      },
    });
    expect(hiddenNode.get('status')).toBe('disabled');
    expect(hiddenNode.get('metadataJson')).toMatchObject({
      supersededByNodeId: firstRegistration.nodeId,
      supersededReason: 'same-host-node-replaced',
    });
  });

  it('reroutes queued runs from superseded same-host nodes to a matching active profile', async () => {
    const firstInvitation = await createInvitation({
      expectedNodeKey: 'node-1',
    });
    const firstResponse = await registerNode(extractInviteToken(firstInvitation.registerCommand), {
      nodeKey: 'node-1',
      hostInfo: {
        hostname: 'agent-host',
        platform: 'linux',
        arch: 'x64',
      },
    });
    const firstRegistration = getData(firstResponse);
    const currentNodeId = String(firstRegistration.nodeId);

    const oldNode = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey: 'node-2',
        displayName: 'Duplicate local daemon',
        status: 'active',
        authMode: 'node-token',
        nodeTokenHash: 'duplicate-token-hash',
        tokenLast4: 'hash',
        registeredAt: new Date(),
        lastHeartbeatAt: new Date(),
        metadataJson: {
          hostInfo: {
            hostname: 'agent-host',
            platform: 'linux',
            arch: 'x64',
          },
        },
      },
    });
    const oldNodeId = String(oldNode.get('id'));
    const oldProfile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId: oldNodeId,
        profileKey: 'codex',
        provider: 'codex',
        displayName: 'Old Codex',
        agentType: 'code',
        driver: 'exec',
        status: 'active',
      },
    });
    const oldProfileId = String(oldProfile.get('id'));
    const queuedAt = new Date();
    const run = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'same-host-reroute-queued-run',
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        sourceType: 'task-run',
        nodeId: oldNodeId,
        agentProfileId: oldProfileId,
        requestedAt: queuedAt,
        queuedAt,
      },
    });
    await app.db.getRepository('agRunEvents').create({
      values: {
        runId: run.get('id'),
        claimAttempt: 0,
        source: 'agent-gateway',
        sequence: 1,
        level: 'info',
        eventType: 'run.queued',
        message: 'Run queued',
        emittedAt: queuedAt,
      },
    });

    const heartbeatResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${currentNodeId}/heartbeat`)
      .set('Authorization', `Bearer ${firstRegistration.nodeToken}`)
      .send({
        hostInfo: {
          hostname: 'agent-host',
          platform: 'linux',
          arch: 'x64',
        },
        profiles: [
          {
            profileKey: 'codex',
            provider: 'codex',
            displayName: 'Codex',
            agentType: 'code',
            driver: 'exec',
          },
        ],
      });
    expect(heartbeatResponse.status).toBe(200);

    const newProfile = await app.db.getRepository('agAgentProfiles').findOne({
      filter: {
        nodeId: currentNodeId,
        profileKey: 'codex',
      },
    });
    expect(newProfile).toBeTruthy();

    const updatedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.get('id'),
    });
    expect(updatedRun.get('status')).toBe('queued');
    expect(updatedRun.get('nodeId')).toBe(currentNodeId);
    expect(updatedRun.get('agentProfileId')).toBe(newProfile.get('id'));

    const reroutedEvent = await app.db.getRepository('agRunEvents').findOne({
      filter: {
        runId: run.get('id'),
        source: 'agent-gateway',
        eventType: 'run.rerouted',
      },
    });
    expect(reroutedEvent).toBeTruthy();
    expect(reroutedEvent.get('sequence')).toBe(2);
    expect(reroutedEvent.get('payloadJson')).toMatchObject({
      fromNodeId: oldNodeId,
      toNodeId: currentNodeId,
      fromProfileId: oldProfileId,
      toProfileId: String(newProfile.get('id')),
      reason: 'same-host-node-replaced',
    });

    const hiddenNode = await app.db.getRepository('agNodes').findOne({
      filterByTk: oldNodeId,
    });
    expect(hiddenNode.get('status')).toBe('disabled');
  });

  it('accepts valid heartbeats, updates node snapshots, and syncs reported fake profiles', async () => {
    const invitation = await createInvitation();
    const registerResponse = await registerNode(extractInviteToken(invitation.registerCommand));
    const registration = getData(registerResponse);
    const nodeId = String(registration.nodeId);
    const nodeToken = String(registration.nodeToken);

    const invalidResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', 'Bearer invalid-token')
      .send({});
    expect(invalidResponse.status).toBe(401);

    const heartbeatResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${nodeToken}`)
      .send({
        currentConcurrency: 1,
        capabilities: {
          maxConcurrency: 3,
          supportsArtifacts: true,
        },
        profiles: [
          {
            profileKey: 'fake-success',
            provider: 'generic-cli',
            displayName: 'Fake Success',
            agentType: 'code',
            driver: 'fake',
            capabilities: {
              mode: 'success',
            },
            metadata: {
              command: 'must-not-persist',
              cwd: '/tmp/must-not-persist',
              env: {
                SECRET: 'must-not-persist',
              },
              label: 'safe',
            },
          },
          {
            profileKey: 'local-node',
            displayName: 'Local Node',
            agentType: 'code',
            driver: 'exec',
            capabilities: {
              commandKey: 'node',
              mode: 'success',
            },
          },
        ],
      });

    expect(heartbeatResponse.status).toBe(200);
    expect(getData(heartbeatResponse).heartbeatAt).toBeTruthy();

    const node = await app.db.getRepository('agNodes').findOne({
      filterByTk: nodeId,
    });
    expect(node.get('lastHeartbeatAt')).toBeTruthy();
    expect(node.get('capabilitiesJson')).toMatchObject({
      maxConcurrency: 3,
      supportsArtifacts: true,
    });
    expect(node.get('metadataJson')).toMatchObject({
      currentConcurrency: 1,
    });

    const profile = await app.db.getRepository('agAgentProfiles').findOne({
      filter: {
        nodeId,
        profileKey: 'fake-success',
      },
    });
    expect(profile).toBeTruthy();
    expect(profile.get('provider')).toBe('generic-cli');
    expect(profile.get('status')).toBe('active');
    expect(profile.get('capabilitiesJson')).toMatchObject({
      mode: 'success',
    });
    expect(profile.get('metadataJson')).toEqual({
      label: 'safe',
    });
    expect(profile.get('trustedConfigJson')).toBeFalsy();

    const commandProfile = await app.db.getRepository('agAgentProfiles').findOne({
      filter: {
        nodeId,
        profileKey: 'local-node',
      },
    });
    expect(commandProfile).toBeTruthy();
    expect(commandProfile.get('provider')).toBe('generic-cli');
    expect(commandProfile.get('capabilitiesJson')).toMatchObject({
      commandKey: 'node',
      mode: 'success',
      structuredEvents: false,
    });

    const emptyProfilesResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${nodeToken}`)
      .send({
        profiles: [],
      });
    expect(emptyProfilesResponse.status).toBe(200);

    const inactiveProfile = await app.db.getRepository('agAgentProfiles').findOne({
      filter: {
        nodeId,
        profileKey: 'fake-success',
      },
    });
    expect(inactiveProfile.get('status')).toBe('inactive');

    await app.db.getRepository('agNodes').update({
      filterByTk: nodeId,
      values: {
        status: 'disabled',
      },
    });
    const disabledResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${nodeToken}`)
      .send({});
    expect(disabledResponse.status).toBe(403);
  });

  it('lists nodes and per-node agent profiles without token hashes or raw config fields', async () => {
    const invitation = await createInvitation();
    const registerResponse = await registerNode(extractInviteToken(invitation.registerCommand));
    const registration = getData(registerResponse);
    const nodeId = String(registration.nodeId);

    await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${registration.nodeToken}`)
      .send({
        profiles: [
          {
            profileKey: 'fake-success',
            metadata: {
              command: 'hidden',
              label: 'visible',
            },
          },
        ],
      });

    const listResponse = await rootAgent.get('/api/agent-gateway/nodes:list');
    expect(listResponse.status).toBe(200);
    const nodes = listResponse.body.data as Array<Record<string, unknown>>;
    expect(nodes[0].id).toBe(nodeId);
    expect(nodes[0]).not.toHaveProperty('nodeTokenHash');

    const profilesResponse = await rootAgent.get(`/api/agent-gateway/nodes/${nodeId}/profiles:list`);
    expect(profilesResponse.status).toBe(200);
    const profiles = profilesResponse.body.data as Array<Record<string, unknown>>;
    expect(profiles[0].profileKey).toBe('fake-success');
    expect(profiles[0]).not.toHaveProperty('trustedConfigJson');
    expect(profiles[0].metadataJson).toEqual({
      label: 'visible',
    });
  });

  it('enables and disables nodes through management API without exposing token hashes', async () => {
    const invitation = await createInvitation();
    const registerResponse = await registerNode(extractInviteToken(invitation.registerCommand));
    const registration = getData(registerResponse);
    const nodeId = String(registration.nodeId);
    const nodeToken = String(registration.nodeToken);

    const disableResponse = await rootAgent.post(`/api/agent-gateway/nodes:update/${nodeId}`).send({
      status: 'disabled',
    });
    const disabledNode = getData(disableResponse);
    expect(disableResponse.status).toBe(200);
    expect(disabledNode.status).toBe('disabled');
    expect(disabledNode.disabledAt).toBeTruthy();
    expect(disabledNode).not.toHaveProperty('nodeTokenHash');

    const disabledHeartbeatResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${nodeToken}`)
      .send({});
    expect(disabledHeartbeatResponse.status).toBe(403);

    const enableResponse = await rootAgent.post(`/api/agent-gateway/nodes:update/${nodeId}`).send({
      status: 'active',
    });
    const enabledNode = getData(enableResponse);
    expect(enableResponse.status).toBe(200);
    expect(enabledNode.status).toBe('active');
    expect(enabledNode.disabledAt).toBeFalsy();

    const invalidStatusResponse = await rootAgent.post(`/api/agent-gateway/nodes:update/${nodeId}`).send({
      status: 'pending',
    });
    expect(invalidStatusResponse.status).toBe(400);
  });

  it('requires management permission for node and invitation management APIs', async () => {
    const invitation = await createInvitation();
    const registerResponse = await registerNode(extractInviteToken(invitation.registerCommand));
    const registration = getData(registerResponse);
    const nodeId = String(registration.nodeId);

    await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${registration.nodeToken}`)
      .send({
        profiles: [
          {
            profileKey: 'fake-success',
          },
        ],
      });

    await app.db.getRepository('roles').create({
      values: {
        name: 'agentGatewayManager',
        snippets: ['agentGateway.manage'],
      },
    });
    const managerUser = await app.db.getRepository('users').create({
      values: {
        username: 'agent-gateway-manager',
        roles: ['agentGatewayManager'],
      },
    });
    const managerAgent = await app.agent().login(managerUser);

    const managerListResponse = await managerAgent.get('/api/agent-gateway/nodes:list');
    expect(managerListResponse.status).toBe(200);

    const dualRoleUser = await app.db.getRepository('users').create({
      values: {
        username: 'agent-gateway-dual-role',
        roles: ['member', 'agentGatewayManager'],
      },
    });
    await app.db.getRepository('rolesUsers').update({
      filter: {
        userId: dualRoleUser.get('id'),
      },
      values: {
        default: false,
      },
    });
    await app.db.getRepository('rolesUsers').update({
      filter: {
        userId: dualRoleUser.get('id'),
        roleName: 'member',
      },
      values: {
        default: true,
      },
    });

    const dualRoleDefaultAgent = await app.agent().login(dualRoleUser);
    const dualRoleDefaultResponse = await dualRoleDefaultAgent.get('/api/agent-gateway/nodes:list');
    expect(dualRoleDefaultResponse.status).toBe(403);

    const dualRoleManagerAgent = await app.agent().login(dualRoleUser, 'agentGatewayManager');
    const dualRoleManagerResponse = await dualRoleManagerAgent.get('/api/agent-gateway/nodes:list');
    expect(dualRoleManagerResponse.status).toBe(200);

    await app.db.getRepository('roles').create({
      values: {
        name: 'agentGatewayDepartmentManager',
        snippets: ['agentGateway.manage'],
      },
    });
    const departmentUser = await app.db.getRepository('users').create({
      values: {
        username: 'agent-gateway-department-manager',
        roles: ['member'],
      },
    });
    await app.db.getRepository('rolesUsers').update({
      filter: {
        userId: departmentUser.get('id'),
        roleName: 'member',
      },
      values: {
        default: true,
      },
    });
    await app.db.getRepository('departments').create({
      values: {
        title: 'Agent Gateway Department',
        roles: ['agentGatewayDepartmentManager'],
        members: [departmentUser.get('id')],
      },
    });

    const departmentDefaultAgent = await app.agent().login(departmentUser);
    const departmentDefaultResponse = await departmentDefaultAgent.get('/api/agent-gateway/nodes:list');
    expect(departmentDefaultResponse.status).toBe(403);

    const departmentManagerAgent = await app.agent().login(departmentUser, 'agentGatewayDepartmentManager');
    const departmentManagerResponse = await departmentManagerAgent.get('/api/agent-gateway/nodes:list');
    expect(departmentManagerResponse.status).toBe(200);

    const memberUser = await app.db.getRepository('users').create({
      values: {
        username: 'agent-gateway-member',
        roles: ['member'],
      },
    });
    const memberAgent = await app.agent().login(memberUser);

    const invitationResponse = await memberAgent.post('/api/agent-gateway/node-invitations:create').send({
      serverUrl: 'https://nocobase.example.test',
    });
    expect(invitationResponse.status).toBe(403);

    const listNodesResponse = await memberAgent.get('/api/agent-gateway/nodes:list');
    expect(listNodesResponse.status).toBe(403);

    const getNodeResponse = await memberAgent.get(`/api/agent-gateway/nodes:get/${nodeId}`);
    expect(getNodeResponse.status).toBe(403);

    const updateNodeResponse = await memberAgent.post(`/api/agent-gateway/nodes:update/${nodeId}`).send({
      status: 'disabled',
    });
    expect(updateNodeResponse.status).toBe(403);

    const profilesResponse = await memberAgent.get(`/api/agent-gateway/nodes/${nodeId}/profiles:list`);
    expect(profilesResponse.status).toBe(403);
  });
});
