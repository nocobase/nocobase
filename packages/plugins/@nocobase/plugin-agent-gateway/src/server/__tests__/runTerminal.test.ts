/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'child_process';

import { MockServer, createMockServer } from '@nocobase/test';

import { createNodeToken, toStoredTokenFields } from '../security';
import PluginAgentGatewayServer from '../plugin';

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

function execTmux(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile('tmux', args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function tmuxAvailable() {
  try {
    await execTmux(['-V']);
    return true;
  } catch {
    return false;
  }
}

describe('agent gateway run terminal APIs', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let tmuxReady = false;

  beforeAll(async () => {
    tmuxReady = await tmuxAvailable();
  });

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

  async function createRunner(): Promise<TestRunner> {
    const nodeToken = createNodeToken();
    const now = new Date();
    const node = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey: 'node-terminal-1',
        displayName: 'Node Terminal',
        status: 'active',
        authMode: 'node-token',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: {
          maxConcurrency: 1,
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
    });
    const nodeId = String(node.get('id'));
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId,
        profileKey: 'fake-terminal',
        displayName: 'Fake Terminal',
        agentType: 'code',
        driver: 'fake',
        status: 'active',
        capabilitiesJson: {
          maxConcurrency: 1,
        },
      },
    });

    return {
      nodeId,
      nodeToken: nodeToken.token,
      profileId: String(profile.get('id')),
    };
  }

  async function createAndClaimRun(runner: TestRunner) {
    const runResponse = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode: `run-terminal-${Date.now()}`,
      sourceType: 'test',
      agentProfileId: runner.profileId,
      promptSnapshot: {
        prompt: 'terminal test',
      },
      executionPayload: {
        task: 'terminal',
      },
    });
    expect(runResponse.status).toBe(200);
    const run = getData(runResponse);

    const claimResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs:claim`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        profileKey: 'fake-terminal',
      });
    expect(claimResponse.status).toBe(200);
    const claim = getData(claimResponse);
    expect(claim.claimed).toBe(true);

    return {
      run,
      claim,
    };
  }

  function leaseValues(claim: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
    return {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      ...overrides,
    };
  }

  function getSessionName(runId: unknown) {
    return `ag-run-${String(runId)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 32)}`;
  }

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

  it('lets daemon nodes update terminal metadata and users read snapshots', async () => {
    const runner = await createRunner();
    const { run, claim } = await createAndClaimRun(runner);
    const sessionName = getSessionName(run.id);

    const updateResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${run.id}/terminal:update`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(
        leaseValues(claim, {
          terminalBackend: 'tmux',
          terminalSessionName: sessionName,
          terminalStatus: 'active',
          terminalStartedAt: '2026-07-01T10:00:00.000Z',
        }),
      );
    expect(updateResponse.status).toBe(200);
    const updatedRun = getData(updateResponse);
    expect(updatedRun.terminalBackend).toBe('tmux');
    expect(updatedRun.terminalSessionName).toBe(sessionName);
    expect(updatedRun.terminalStatus).toBe('active');

    const snapshotResponse = await rootAgent.get(`/api/agent-gateway/runs/${run.id}/terminal:snapshot`);
    expect(snapshotResponse.status).toBe(200);
    const snapshot = getData(snapshotResponse);
    expect(snapshot).toMatchObject({
      backend: 'tmux',
      sessionName,
      terminalStatus: 'active',
      available: false,
      inputEnabled: false,
    });

    const audits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        runId: run.id,
      },
    });
    expect(audits.map((audit) => audit.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'readTerminal',
          permissionKey: 'agentGateway.readTerminal',
          resultStatus: 'succeeded',
          metadataJson: expect.objectContaining({
            available: false,
          }),
        }),
      ]),
    );
  });

  it('enforces split terminal permissions before terminal state checks', async () => {
    const runId = '11111111-1111-4111-8111-111111111111';
    const cancelOnlyAgent = await createUserAgent('agent-gateway-terminal-cancel-only', ['agentGateway.cancelRun']);
    const readRunsOnlyAgent = await createUserAgent('agent-gateway-terminal-read-runs-only', ['agentGateway.readRuns']);
    const rawSnippetAgent = await createUserAgent('agent-gateway-terminal-raw-snippet', [
      'agentGateway.writeTerminalRaw',
    ]);
    const managerAgent = await createUserAgent('agent-gateway-terminal-manager', ['agentGateway.manage']);
    const interruptAgent = await createUserAgent('agent-gateway-terminal-interrupt', ['agentGateway.interruptRun']);
    const terminateAgent = await createUserAgent('agent-gateway-terminal-terminate', ['agentGateway.terminateRun']);

    expect(
      (
        await cancelOnlyAgent.post(`/api/agent-gateway/runs/${runId}/terminal:send`).send({
          input: 'must-not-write',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await rawSnippetAgent.post(`/api/agent-gateway/runs/${runId}/terminal:send`).send({
          input: 'must-not-write',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await managerAgent.post(`/api/agent-gateway/runs/${runId}/terminal:send`).send({
          input: 'must-not-write',
        })
      ).status,
    ).toBe(403);
    expect((await readRunsOnlyAgent.get(`/api/agent-gateway/runs/${runId}/terminal:snapshot`)).status).toBe(403);
    expect((await readRunsOnlyAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({})).status).toBe(
      403,
    );
    expect((await readRunsOnlyAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({})).status).toBe(
      403,
    );

    const runner = await createRunner();
    const { run: controlRun } = await createAndClaimRun(runner);
    expect(
      (await interruptAgent.post(`/api/agent-gateway/runs/${controlRun.id}/terminal:interrupt`).send({})).status,
    ).toBe(409);
    const terminateResponse = await terminateAgent
      .post(`/api/agent-gateway/runs/${controlRun.id}/terminal:terminate`)
      .send({});
    expect(terminateResponse.status).toBe(200);
    expect(getData(terminateResponse).terminalTerminated).toBe(false);

    const audits = await app.db.getRepository('agAgentActionAudits').find();
    expect(audits.map((audit) => audit.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'readTerminal',
          runId,
          permissionKey: 'agentGateway.readTerminal',
          resultStatus: 'denied',
        }),
        expect.objectContaining({
          action: 'rawTerminalWriteDenied',
          runId,
          permissionKey: 'agentGateway.writeTerminalRaw',
          resultStatus: 'denied',
        }),
        expect.objectContaining({
          action: 'interrupt',
          runId,
          permissionKey: 'agentGateway.interruptRun',
          resultStatus: 'denied',
        }),
        expect.objectContaining({
          action: 'terminate',
          runId,
          permissionKey: 'agentGateway.terminateRun',
          resultStatus: 'denied',
        }),
        expect.objectContaining({
          action: 'interrupt',
          runId: controlRun.id,
          permissionKey: 'agentGateway.interruptRun',
          resultStatus: 'accepted',
        }),
        expect.objectContaining({
          action: 'interrupt',
          runId: controlRun.id,
          permissionKey: 'agentGateway.interruptRun',
          resultStatus: 'failed',
        }),
        expect.objectContaining({
          action: 'terminate',
          runId: controlRun.id,
          permissionKey: 'agentGateway.terminateRun',
          resultStatus: 'accepted',
        }),
        expect.objectContaining({
          action: 'terminate',
          runId: controlRun.id,
          permissionKey: 'agentGateway.terminateRun',
          resultStatus: 'succeeded',
        }),
      ]),
    );
  });

  it('controls a managed tmux terminal session for an active run', async () => {
    if (!tmuxReady) {
      return;
    }

    const runner = await createRunner();
    const { run, claim } = await createAndClaimRun(runner);
    const sessionName = getSessionName(run.id);

    await execTmux(['new-session', '-d', '-s', sessionName, '--', 'sh', '-lc', 'printf ready; sleep 60']);
    try {
      await app
        .agent()
        .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${run.id}/terminal:update`)
        .set('Authorization', `Bearer ${runner.nodeToken}`)
        .send(
          leaseValues(claim, {
            terminalBackend: 'tmux',
            terminalSessionName: sessionName,
            terminalStatus: 'active',
          }),
        );

      const snapshotResponse = await rootAgent.get(`/api/agent-gateway/runs/${run.id}/terminal:snapshot`);
      expect(snapshotResponse.status).toBe(200);
      const snapshot = getData(snapshotResponse);
      expect(snapshot.available).toBe(true);
      expect(String(snapshot.output)).toContain('ready');
      expect(snapshot.inputEnabled).toBe(true);

      const sendResponse = await rootAgent.post(`/api/agent-gateway/runs/${run.id}/terminal:send`).send({
        input: 'hello',
        appendEnter: true,
      });
      expect(sendResponse.status).toBe(200);
      expect(getData(sendResponse).success).toBe(true);

      const terminateResponse = await rootAgent.post(`/api/agent-gateway/runs/${run.id}/terminal:terminate`).send({});
      expect(terminateResponse.status).toBe(200);
      expect(getData(terminateResponse).terminalTerminated).toBe(true);

      const storedRun = await app.db.getRepository('agRuns').findOne({
        filterByTk: run.id,
      });
      expect(storedRun.get('cancelRequested')).toBe(true);
      expect(storedRun.get('status')).toBe('canceling');
    } finally {
      await execTmux(['kill-session', '-t', sessionName]).catch(() => {
        // The terminate API may have already removed the session.
      });
    }
  });
});
