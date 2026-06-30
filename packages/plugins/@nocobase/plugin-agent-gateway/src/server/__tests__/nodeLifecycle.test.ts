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
  const match = String(registerCommand).match(/--invite-token\s+'?([^'\s]+)'?/);
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
    expect(data.registerCommand).toContain('agent-gateway-daemon register');
    expect(data.registerCommand).toContain("--server-url 'https://nocobase.example.test'");
    expect(data.registerCommand).toContain('--invite-token');
    expect(data.registerCommand).not.toContain('curl');
    expect(inviteToken).toMatch(/^ag_inv_/);

    const invitation = await app.db.getRepository('agNodeInvitations').findOne({
      filterByTk: data.invitationId,
    });

    expect(invitation.get('tokenHash')).not.toBe(inviteToken);
    expect(invitation.get('tokenLast4')).toBe(inviteToken.slice(-4));
    expect(invitation.get('status')).toBe('pending');
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
    expect(profile.get('status')).toBe('active');
    expect(profile.get('capabilitiesJson')).toMatchObject({
      mode: 'success',
    });
    expect(profile.get('metadataJson')).toEqual({
      label: 'safe',
    });
    expect(profile.get('trustedConfigJson')).toBeFalsy();

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

    const profilesResponse = await memberAgent.get(`/api/agent-gateway/nodes/${nodeId}/profiles:list`);
    expect(profilesResponse.status).toBe(403);
  });
});
