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

import { normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
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

describe('agent gateway run terminal APIs', () => {
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
        provider: 'codex',
        displayName: 'Fake Terminal',
        agentType: 'code',
        driver: 'fake',
        status: 'active',
        capabilitiesJson: {
          ...normalizeAgentProviderCapabilities('codex'),
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
    const runResponse = await rootAgent.post('/agentGatewayApi:createRun').send({
      runCode: `run-terminal-${Date.now()}`,
      sourceType: 'test',
      agentProfileId: runner.profileId,
      promptSnapshot: {
        prompt: 'terminal test',
      },
      provider: 'codex',
      capabilitiesSnapshotJson: normalizeAgentProviderCapabilities('codex'),
      executionPolicyKey: 'fake-terminal',
      executionPayloadJson: {
        executionPolicyKey: 'fake-terminal',
        title: 'terminal',
        cwd: '.',
      },
    });
    expect(runResponse.status).toBe(200);
    const run = getData(runResponse);

    const claimResponse = await app
      .agent()
      .post(`/agentGatewayApi:claimRun/${runner.nodeId}`)
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

  async function attachAgentSession(runId: unknown) {
    const providerSessionId = `thread-${randomUUID()}`;
    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: 'codex',
        providerSessionId,
        rootRunId: String(runId),
        latestRunId: String(runId),
        status: 'active',
        capabilitiesJson: {
          interrupt: true,
          terminate: true,
          resumeWithMessage: true,
          liveSemanticMessage: false,
          stdinMessage: false,
        },
      },
    });
    await app.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        agentSessionId: session.get('id'),
        agentSessionProviderId: providerSessionId,
      },
    });
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
      .post(`/agentGatewayApi:updateRunTerminal/${run.id}`)
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
    expect(updatedRun).not.toHaveProperty('terminalSessionName');
    expect(updatedRun.terminalStatus).toBe('active');
    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun?.get('terminalSessionName')).toBe(sessionName);

    const snapshotResponse = await rootAgent.get(`/agentGatewayApi:getTerminalSnapshot/${run.id}`);
    expect(snapshotResponse.status).toBe(200);
    const snapshot = getData(snapshotResponse);
    expect(snapshot).toMatchObject({
      backend: 'tmux',
      terminalStatus: 'active',
      available: false,
      inputEnabled: false,
    });
    expect(snapshot).not.toHaveProperty('sessionName');
  });

  it('falls back to terminal-live conversation events when remote tmux capture is unavailable', async () => {
    const runner = await createRunner();
    const { run, claim } = await createAndClaimRun(runner);
    const sessionName = getSessionName(run.id);

    await app
      .agent()
      .post(`/agentGatewayApi:updateRunTerminal/${run.id}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(
        leaseValues(claim, {
          terminalBackend: 'tmux',
          terminalSessionName: sessionName,
          terminalStatus: 'closed',
          terminalStartedAt: '2026-07-01T10:00:00.000Z',
          terminalEndedAt: '2026-07-01T10:00:10.000Z',
        }),
      );

    await app.db.sequelize.transaction(async (transaction) => {
      const repository = app.db.getRepository('agAgentConversationEvents');
      await repository.create({
        values: {
          id: randomUUID(),
          runId: run.id,
          source: 'terminal-live',
          sequence: 1,
          eventType: 'agent.message',
          contentText: 'old remote output\n',
          contentJson: {
            live: true,
          },
        },
        transaction,
      });
      await repository.create({
        values: {
          id: randomUUID(),
          runId: run.id,
          source: 'codex',
          sequence: 1,
          eventType: 'agent.tool.call',
          contentText: 'shell',
          contentJson: {
            rawLine: '{"type":"item.started","item":{"type":"command_execution","command":"yarn test"}}',
          },
        },
        transaction,
      });
      await repository.create({
        values: {
          id: randomUUID(),
          runId: run.id,
          source: 'terminal-live',
          sequence: 2,
          eventType: 'agent.message',
          contentText: 'latest remote output\n[agent-gateway] process exited with code 0',
          contentJson: {
            live: true,
          },
        },
        transaction,
      });
    });

    const snapshotResponse = await rootAgent.get(`/agentGatewayApi:getTerminalSnapshot/${run.id}?lines=3`);
    expect(snapshotResponse.status).toBe(200);
    const snapshot = getData(snapshotResponse);
    expect(snapshot).toMatchObject({
      backend: 'tmux',
      terminalStatus: 'closed',
      available: true,
      inputEnabled: false,
    });
    expect(String(snapshot.output)).not.toContain('old remote output');
    expect(String(snapshot.output)).toContain('"type":"command_execution"');
    expect(String(snapshot.output)).toContain('"command":"[REDACTED]"');
    expect(String(snapshot.output)).toContain('latest remote output');
    expect(String(snapshot.output)).toContain('[agent-gateway] process exited with code 0');
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
        await cancelOnlyAgent.post(`/agentGatewayApi:sendTerminalInput/${runId}`).send({
          input: 'must-not-write',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await rawSnippetAgent.post(`/agentGatewayApi:sendTerminalInput/${runId}`).send({
          input: 'must-not-write',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await managerAgent.post(`/agentGatewayApi:sendTerminalInput/${runId}`).send({
          input: 'must-not-write',
        })
      ).status,
    ).toBe(403);
    expect((await readRunsOnlyAgent.get(`/agentGatewayApi:getTerminalSnapshot/${runId}`)).status).toBe(403);
    expect((await readRunsOnlyAgent.post(`/agentGatewayApi:interruptTerminal/${runId}`).send({})).status).toBe(403);
    expect((await readRunsOnlyAgent.post(`/agentGatewayApi:terminateTerminal/${runId}`).send({})).status).toBe(403);

    const runner = await createRunner();
    const { run: controlRun } = await createAndClaimRun(runner);
    expect(
      (
        await interruptAgent.post(`/agentGatewayApi:interruptTerminal/${controlRun.id}`).send({
          idempotencyKey: 'inactive-interrupt-click',
        })
      ).status,
    ).toBe(409);
    const terminateResponse = await terminateAgent.post(`/agentGatewayApi:terminateTerminal/${controlRun.id}`).send({
      idempotencyKey: 'inactive-terminate-click',
    });
    expect(terminateResponse.status).toBe(409);
  });

  it('controls a remote managed tmux run without reading a server-local tmux session', async () => {
    const runner = await createRunner();
    const { run, claim } = await createAndClaimRun(runner);
    const sessionName = getSessionName(run.id);
    await attachAgentSession(run.id);

    await app
      .agent()
      .post(`/agentGatewayApi:updateRunTerminal/${run.id}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(
        leaseValues(claim, {
          terminalBackend: 'tmux',
          terminalSessionName: sessionName,
          terminalStatus: 'active',
        }),
      );

    const snapshotResponse = await rootAgent.get(`/agentGatewayApi:getTerminalSnapshot/${run.id}`);
    expect(snapshotResponse.status).toBe(200);
    const snapshot = getData(snapshotResponse);
    expect(snapshot.available).toBe(false);
    expect(snapshot.output).toBe('');
    expect(snapshot.inputEnabled).toBe(false);

    const sendResponse = await rootAgent.post(`/agentGatewayApi:sendTerminalInput/${run.id}`).send({
      input: 'hello',
      appendEnter: true,
    });
    expect(sendResponse.status).toBe(403);
    expect(JSON.stringify(sendResponse.body)).toContain('TERMINAL_RAW_WRITE_DISABLED');

    const legacyWriteResponse = await rootAgent.post(`/agentGatewayApi:sendTerminalInput/${run.id}`).send({
      input: 'legacy-write',
    });
    expect(legacyWriteResponse.status).toBe(403);
    expect(JSON.stringify(legacyWriteResponse.body)).toContain('TERMINAL_RAW_WRITE_DISABLED');

    const malformedResponse = await rootAgent.post(`/agentGatewayApi:sendTerminalInput/${run.id}`).send({
      input: {
        nested: 'must-not-render',
      },
    });
    expect(malformedResponse.status).toBe(403);
    expect(JSON.stringify(malformedResponse.body)).toContain('TERMINAL_RAW_WRITE_DISABLED');

    const oversizedResponse = await rootAgent.post(`/agentGatewayApi:sendTerminalInput/${run.id}`).send({
      input: 'x'.repeat(4001),
    });
    expect(oversizedResponse.status).toBe(403);
    expect(JSON.stringify(oversizedResponse.body)).toContain('TERMINAL_RAW_WRITE_DISABLED');

    const terminateResponse = await rootAgent.post(`/agentGatewayApi:terminateTerminal/${run.id}`).send({
      idempotencyKey: 'tmux-terminate-click',
    });
    expect(terminateResponse.status).toBe(200);
    expect(getData(terminateResponse)).toMatchObject({
      success: true,
      terminalTerminationRequested: true,
      controlRequestStatus: 'accepted',
    });

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('cancelRequested')).toBe(true);
    expect(storedRun.get('status')).toBe('canceling');
    expect(await app.db.getRepository('agRunControlRequests').count({ filter: { runId: run.id } })).toBe(1);
  });
});
