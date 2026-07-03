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
import { vi } from 'vitest';

import PluginAgentGatewayServer from '../plugin';
import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../../shared/runControl';
import {
  claimRun,
  createQueuedRun,
  createRunner,
  createUserWithSnippets,
  TestRunner,
} from './helpers/terminalStreamHarness';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

describe('agent gateway run control requests', () => {
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

  async function loginWithSnippets(username: string, snippets: string[]) {
    const { userId } = await createUserWithSnippets(app, username, snippets);
    return await app.agent().login(userId);
  }

  function leaseBody(claim: Record<string, unknown>, extra: Record<string, unknown>) {
    return {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      ...extra,
    };
  }

  async function seedActiveRun(
    options: {
      capabilitiesJson?: Record<string, unknown>;
      terminalControl?: boolean;
      withSession?: boolean;
    } = {},
  ) {
    const runner = await createRunner(app, {
      nodeKey: `control-node-${randomUUID()}`,
      terminalControl: options.terminalControl,
    });
    const runId = await createQueuedRun(app, runner, `control-run-${randomUUID()}`);
    const claim = await claimRun(app, runner, runId);
    const sessionName = `ag-run-${runId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 32)}`;
    const updateResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/terminal:update`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(
        leaseBody(claim, {
          terminalBackend: 'tmux',
          terminalSessionName: sessionName,
          terminalStatus: 'active',
        }),
      );
    expect(updateResponse.status).toBe(200);

    let sessionId = '';
    if (options.withSession !== false) {
      const session = await app.db.getRepository('agAgentSessions').create({
        values: {
          id: randomUUID(),
          provider: 'codex',
          providerSessionId: `thread-${randomUUID()}`,
          rootRunId: runId,
          latestRunId: runId,
          status: 'active',
          capabilitiesJson: options.capabilitiesJson || {
            interrupt: true,
            terminate: true,
            resumeWithMessage: true,
            liveSemanticMessage: false,
            stdinMessage: false,
          },
        },
      });
      sessionId = String(session.get('id'));
      await app.db.getRepository('agRuns').update({
        filterByTk: runId,
        values: {
          agentSessionId: sessionId,
          agentSessionProvider: 'codex',
          agentSessionProviderId: session.get('providerSessionId'),
        },
      });
    }

    return {
      runner,
      runId,
      claim,
      sessionName,
      sessionId,
    };
  }

  async function pending(runner: TestRunner, runId: string, claim: Record<string, unknown>) {
    return await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests:pending`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, {}));
  }

  it('enqueues interrupt requests and lets the daemon ack delivered then succeeded', async () => {
    const { runner, runId, claim } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-user', ['agentGateway.interruptRun']);

    const response = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      reason: 'stop politely',
      idempotencyKey: 'interrupt-click-1',
    });
    expect(response.status).toBe(200);
    expect(getData(response)).toMatchObject({
      success: true,
      runId,
      terminalSignal: 'interrupt',
      controlRequestStatus: 'accepted',
    });

    const pendingResponse = await pending(runner, runId, claim);
    expect(pendingResponse.status).toBe(200);
    const request = (getData(pendingResponse).requests as Record<string, unknown>[])[0];
    expect(request).toMatchObject({
      runId,
      action: 'interrupt',
      status: 'accepted',
      reason: 'stop politely',
    });

    const earlySucceededResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'succeeded' }));
    expect(earlySucceededResponse.status).toBe(409);

    const deliveredResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'delivered' }));
    expect(deliveredResponse.status).toBe(200);
    expect(getData(deliveredResponse)).toMatchObject({
      status: 'delivered',
    });
    const deliveredEvent = await app.db.getRepository('agRunEvents').findOne({
      filter: {
        runId,
        source: 'terminal-control',
        eventType: 'terminal.interrupt.delivered',
      },
    });
    expect(deliveredEvent).toBeTruthy();
    const duplicateDeliveredResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'delivered' }));
    expect(duplicateDeliveredResponse.status).toBe(200);
    expect(
      await app.db.getRepository('agRunEvents').count({
        filter: {
          runId,
          source: 'terminal-control',
          eventType: 'terminal.interrupt.delivered',
        },
      }),
    ).toBe(1);
    const deliveredPendingResponse = await pending(runner, runId, claim);
    expect(deliveredPendingResponse.status).toBe(200);
    expect((getData(deliveredPendingResponse).requests as Record<string, unknown>[])[0]).toMatchObject({
      id: request.id,
      status: 'delivered',
    });

    const succeededResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'succeeded', resultMessage: 'sent C-c' }));
    expect(succeededResponse.status).toBe(200);
    expect(getData(succeededResponse)).toMatchObject({
      status: 'succeeded',
    });
    const acceptedAfterFinalResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'accepted' }));
    expect(acceptedAfterFinalResponse.status).toBe(400);
    const duplicateSucceededResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'succeeded' }));
    expect(duplicateSucceededResponse.status).toBe(200);

    const statusResponse = await interruptAgent.get(
      `/api/agent-gateway/runs/${runId}/control-requests/${request.id}:get`,
    );
    expect(statusResponse.status).toBe(200);
    expect(getData(statusResponse)).toMatchObject({
      runId,
      controlRequestId: request.id,
      controlRequestStatus: 'succeeded',
    });
    const otherInterruptAgent = await loginWithSnippets('agent-gateway-interrupt-other-user', [
      'agentGateway.interruptRun',
    ]);
    expect(
      (await otherInterruptAgent.get(`/api/agent-gateway/runs/${runId}/control-requests/${request.id}:get`)).status,
    ).toBe(404);

    const audits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        runId,
        action: 'interrupt',
      },
      sort: ['createdAt'],
    });
    expect(audits.map((audit) => audit.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resultStatus: 'accepted',
          permissionKey: 'agentGateway.interruptRun',
        }),
        expect.objectContaining({
          resultStatus: 'succeeded',
          permissionKey: 'agentGateway.interruptRun',
        }),
      ]),
    );
  });

  it('fails open control requests when the run finishes before daemon ack', async () => {
    const { runner, runId, claim } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-finished', ['agentGateway.interruptRun']);

    const controlResponse = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      idempotencyKey: 'interrupt-before-finish',
    });
    expect(controlResponse.status).toBe(200);
    const controlRequestId = String(getData(controlResponse).controlRequestId);

    await app.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status: 'running',
      },
    });

    const completeResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/complete`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(
        leaseBody(claim, {
          resultSummaryJson: {
            ok: true,
          },
        }),
      );
    expect(completeResponse.status).toBe(200);

    const request = await app.db.getRepository('agRunControlRequests').findOne({
      filterByTk: controlRequestId,
    });
    expect(request?.get('status')).toBe('failed');
    expect(request?.get('resultMessage')).toBe('Run finished before control request completed');
    expect(request?.get('completedAt')).toBeTruthy();

    const failedEvent = await app.db.getRepository('agRunEvents').findOne({
      filter: {
        runId,
        source: 'terminal-control',
        eventType: 'terminal.interrupt.failed',
      },
    });
    expect(failedEvent).toBeTruthy();
    expect(failedEvent?.get('payloadJson')).toMatchObject({
      controlRequestId,
      reason: 'run-finished',
      terminalStatus: 'succeeded',
    });
  });

  it('fails open delivered control requests when the run lease expires', async () => {
    const { runner, runId, claim } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-expired', ['agentGateway.interruptRun']);

    const controlResponse = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      idempotencyKey: 'interrupt-before-expire',
    });
    expect(controlResponse.status).toBe(200);
    const controlRequestId = String(getData(controlResponse).controlRequestId);

    const deliveredResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${controlRequestId}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'delivered' }));
    expect(deliveredResponse.status).toBe(200);

    await app.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const expireResponse = await rootAgent.post('/api/agent-gateway/runs:expire-leases').send({});
    expect(expireResponse.status).toBe(200);
    expect(getData(expireResponse)).toMatchObject({
      abandonedCount: 1,
    });

    const request = await app.db.getRepository('agRunControlRequests').findOne({
      filterByTk: controlRequestId,
    });
    expect(request?.get('status')).toBe('failed');
    expect(request?.get('resultMessage')).toBe('Run finished before control request completed');
    expect(request?.get('completedAt')).toBeTruthy();

    const failedEvent = await app.db.getRepository('agRunEvents').findOne({
      filter: {
        runId,
        source: 'terminal-control',
        eventType: 'terminal.interrupt.failed',
      },
    });
    expect(failedEvent).toBeTruthy();
    expect(failedEvent?.get('payloadJson')).toMatchObject({
      controlRequestId,
      reason: 'run-finished',
      terminalStatus: 'abandoned',
    });
  });

  it('does not expose lease token or tmux session internals in management run responses', async () => {
    const { runId } = await seedActiveRun();

    const detailResponse = await rootAgent.get(`/api/agent-gateway/runs:get/${runId}`);
    expect(detailResponse.status).toBe(200);
    const detailRun = getData(detailResponse);
    expect(detailRun).toMatchObject({
      id: runId,
      terminalBackend: 'tmux',
      terminalStatus: 'active',
    });
    for (const internalField of [
      'claimAttempt',
      'leaseVersion',
      'claimTokenHash',
      'claimTokenLast4',
      'claimExpiresAt',
      'terminalSessionName',
    ]) {
      expect(detailRun).not.toHaveProperty(internalField);
    }

    const listResponse = await rootAgent.get('/api/agent-gateway/runs:list');
    expect(listResponse.status).toBe(200);
    const listData = listResponse.body.data;
    expect(Array.isArray(listData)).toBe(true);
    const listedRun = (listData as Record<string, unknown>[]).find((item) => item.id === runId);
    expect(listedRun).toBeTruthy();
    for (const internalField of [
      'claimAttempt',
      'leaseVersion',
      'claimTokenLast4',
      'claimExpiresAt',
      'terminalSessionName',
    ]) {
      expect(listedRun).not.toHaveProperty(internalField);
    }
  });

  it('dedupes same-key interrupt requests without enqueuing twice', async () => {
    const { runId } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-dedupe', ['agentGateway.interruptRun']);

    const first = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      idempotencyKey: 'same-interrupt',
    });
    const second = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      idempotencyKey: 'same-interrupt',
    });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const requests = await app.db.getRepository('agRunControlRequests').find({
      filter: {
        runId,
        action: 'interrupt',
      },
    });
    expect(requests).toHaveLength(1);
    const acceptedAudits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        runId,
        action: 'interrupt',
        resultStatus: 'accepted',
      },
    });
    expect(acceptedAudits).toHaveLength(1);
  });

  it('rejects a fresh control request for a non-active run without pretending it was accepted', async () => {
    const { runId } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-inactive', ['agentGateway.interruptRun']);
    await app.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status: 'canceled',
        terminalStatus: 'closed',
      },
    });

    const response = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      idempotencyKey: 'fresh-inactive-interrupt',
    });
    expect(response.status).toBe(409);
    expect(await app.db.getRepository('agRunControlRequests').count({ filter: { runId } })).toBe(0);
  });

  it('rolls back accepted control requests when the accepted audit cannot be written', async () => {
    const { runId } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-audit-failure', [
      'agentGateway.interruptRun',
    ]);
    const initialRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    const auditRepository = app.db.getRepository('agAgentActionAudits');
    const createAudit = vi.spyOn(auditRepository, 'create').mockRejectedValueOnce(new Error('audit unavailable'));

    const response = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      idempotencyKey: 'audit-failure-interrupt',
    });
    expect(response.status).toBe(500);
    expect(await app.db.getRepository('agRunControlRequests').count({ filter: { runId } })).toBe(0);

    const run = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(run.get('status')).toBe(initialRun.get('status'));
    createAudit.mockRestore();
  });

  it('requires idempotencyKey for direct control requests', async () => {
    const { runId } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-missing-key', [
      'agentGateway.interruptRun',
    ]);
    const terminateAgent = await loginWithSnippets('agent-gateway-terminate-missing-key', [
      'agentGateway.terminateRun',
    ]);

    expect((await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({})).status).toBe(
      400,
    );
    expect((await terminateAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({})).status).toBe(
      400,
    );
    expect(await app.db.getRepository('agRunControlRequests').count({ filter: { runId } })).toBe(0);
  });

  it('rejects oversized control idempotency keys before enqueueing requests', async () => {
    const { runId } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-large-key', ['agentGateway.interruptRun']);

    const response = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      idempotencyKey: 'x'.repeat(201),
    });

    expect(response.status).toBe(413);
    expect(await app.db.getRepository('agRunControlRequests').count({ filter: { runId } })).toBe(0);
  });

  it('rejects unauthorized and capability-disabled controls without creating requests', async () => {
    const { runId } = await seedActiveRun({
      capabilitiesJson: {
        interrupt: false,
        terminate: true,
      },
    });
    const listOnlyAgent = await loginWithSnippets('agent-gateway-list-only-control', ['agentGateway.readRuns']);
    const unauthorizedResponse = await listOnlyAgent
      .post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`)
      .send({});
    expect(unauthorizedResponse.status).toBe(403);
    expect(JSON.stringify(unauthorizedResponse.body)).toContain('AGENT_GATEWAY_PERMISSION_DENIED');

    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-disabled', ['agentGateway.interruptRun']);
    expect(
      (
        await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
          idempotencyKey: 'disabled-interrupt-click',
        })
      ).status,
    ).toBe(409);

    const requests = await app.db.getRepository('agRunControlRequests').find({
      filter: {
        runId,
      },
    });
    expect(requests).toHaveLength(0);
    const deniedAudits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        runId,
        action: 'interrupt',
        resultStatus: 'denied',
      },
    });
    expect(deniedAudits.length).toBeGreaterThanOrEqual(2);
  });

  it('exposes and accepts controls for active tmux runs before an agent session is detected', async () => {
    const { runId } = await seedActiveRun({ withSession: false });
    const detailResponse = await rootAgent.get(`/api/agent-gateway/runs:get/${runId}`);
    expect(detailResponse.status).toBe(200);
    expect(getData(detailResponse)).toMatchObject({
      agentGatewayControlActionsJson: {
        interruptRun: true,
        terminateRun: true,
      },
    });

    const terminateAgent = await loginWithSnippets('agent-gateway-terminate-no-session', ['agentGateway.terminateRun']);
    const response = await terminateAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({
      idempotencyKey: 'no-session-terminate',
    });
    expect(response.status).toBe(200);
    expect(getData(response)).toMatchObject({
      success: true,
      terminalTerminationRequested: true,
      controlRequestStatus: 'accepted',
    });
    const requests = await app.db.getRepository('agRunControlRequests').find({
      filter: {
        runId,
      },
    });
    expect(requests).toHaveLength(1);
    expect(requests[0].get('agentSessionId')).toBeFalsy();
  });

  it('does not use fallback provider defaults when runner control capabilities are unspecified', async () => {
    const { runner, runId } = await seedActiveRun({ withSession: false });
    await app.db.getRepository('agNodes').update({
      filterByTk: runner.nodeId,
      values: {
        capabilitiesJson: {
          maxConcurrency: 1,
          terminalStream: true,
        },
      },
    });

    const detailResponse = await rootAgent.get(`/api/agent-gateway/runs:get/${runId}`);
    expect(detailResponse.status).toBe(200);
    expect(getData(detailResponse)).toMatchObject({
      agentProviderCapabilitySource: 'fallback',
      agentGatewayControlActionsJson: {
        interruptRun: false,
        terminateRun: false,
      },
    });

    const terminateAgent = await loginWithSnippets('agent-gateway-terminate-unspecified-runner', [
      'agentGateway.terminateRun',
    ]);
    const response = await terminateAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({
      idempotencyKey: 'unspecified-runner-terminate',
    });
    expect(response.status).toBe(409);
    expect(JSON.stringify(response.body)).toContain('AGENT_GATEWAY_ACTION_UNSUPPORTED');
    expect(await app.db.getRepository('agRunControlRequests').count({ filter: { runId } })).toBe(0);
  });

  it('does not expose or accept controls when the runner terminal capability disables them', async () => {
    const { runId } = await seedActiveRun({ withSession: false, terminalControl: false });
    const detailResponse = await rootAgent.get(`/api/agent-gateway/runs:get/${runId}`);
    expect(detailResponse.status).toBe(200);
    expect(getData(detailResponse)).toMatchObject({
      agentGatewayControlActionsJson: {
        interruptRun: false,
        terminateRun: false,
      },
    });

    const terminateAgent = await loginWithSnippets('agent-gateway-terminate-runner-disabled', [
      'agentGateway.terminateRun',
    ]);
    const response = await terminateAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({
      idempotencyKey: 'runner-disabled-terminate',
    });
    expect(response.status).toBe(409);
    expect(await app.db.getRepository('agRunControlRequests').count({ filter: { runId } })).toBe(0);
  });

  it('marks heartbeat cancellation from terminate controls so daemons skip ordinary interrupt cancellation', async () => {
    const { runner, runId, claim } = await seedActiveRun();
    const terminateAgent = await loginWithSnippets('agent-gateway-terminate-heartbeat-race', [
      'agentGateway.terminateRun',
    ]);

    const response = await terminateAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({
      idempotencyKey: 'terminate-heartbeat-race',
    });
    expect(response.status).toBe(200);

    const heartbeatResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/heartbeat`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'running' }));
    expect(heartbeatResponse.status).toBe(200);
    expect(getData(heartbeatResponse)).toMatchObject({
      cancelRequested: true,
      cancelReason: AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON,
    });
  });

  it('enqueues terminate, marks the run canceling, and accepts daemon ack from a canceling lease', async () => {
    const { runner, runId, claim } = await seedActiveRun();
    const terminateAgent = await loginWithSnippets('agent-gateway-terminate-user', ['agentGateway.terminateRun']);
    const response = await terminateAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({
      idempotencyKey: 'terminate-click-1',
    });
    expect(response.status).toBe(200);
    expect(getData(response)).toMatchObject({
      success: true,
      status: 'canceling',
      terminalTerminationRequested: true,
      controlRequestStatus: 'accepted',
    });
    const controlRequestId = getData(response).controlRequestId;

    const run = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(run.get('cancelRequested')).toBe(true);
    expect(run.get('status')).toBe('canceling');

    const duplicate = await terminateAgent.post(`/api/agent-gateway/runs/${runId}/terminal:terminate`).send({
      idempotencyKey: 'terminate-click-1',
    });
    expect(duplicate.status).toBe(200);
    expect(getData(duplicate)).toMatchObject({
      success: true,
      status: 'canceling',
      terminalTerminationRequested: true,
      controlRequestId,
      controlRequestStatus: 'accepted',
    });

    const pendingResponse = await pending(runner, runId, claim);
    expect(pendingResponse.status).toBe(200);
    const request = (getData(pendingResponse).requests as Record<string, unknown>[])[0];
    expect(request).toMatchObject({
      action: 'terminate',
    });
    expect(await app.db.getRepository('agRunControlRequests').count({ filter: { runId, action: 'terminate' } })).toBe(
      1,
    );

    const deliveredResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'delivered' }));
    expect(deliveredResponse.status).toBe(200);

    const ackResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(leaseBody(claim, { status: 'failed', resultMessage: 'tmux missing' }));
    expect(ackResponse.status).toBe(200);
    expect(getData(ackResponse)).toMatchObject({
      status: 'failed',
    });
  });

  it('requires node token and active run lease for pending pulls and ack', async () => {
    const { runner, runId, claim } = await seedActiveRun();
    const interruptAgent = await loginWithSnippets('agent-gateway-interrupt-lease-check', [
      'agentGateway.interruptRun',
    ]);
    const controlResponse = await interruptAgent.post(`/api/agent-gateway/runs/${runId}/terminal:interrupt`).send({
      idempotencyKey: 'lease-check-interrupt',
    });
    expect(controlResponse.status).toBe(200);
    const pendingResponse = await pending(runner, runId, claim);
    expect(pendingResponse.status).toBe(200);
    const request = (getData(pendingResponse).requests as Record<string, unknown>[])[0];

    expect(
      (
        await app
          .agent()
          .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests:pending`)
          .send(leaseBody(claim, {}))
      ).status,
    ).toBe(401);
    expect(
      (
        await app
          .agent()
          .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests:pending`)
          .set('Authorization', `Bearer ${runner.nodeToken}`)
          .send(leaseBody({ ...claim, leaseVersion: 999 }, {}))
      ).status,
    ).toBe(409);
    expect(
      (
        await app
          .agent()
          .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/control-requests/${request.id}:ack`)
          .set('Authorization', `Bearer ${runner.nodeToken}`)
          .send(leaseBody({ ...claim, leaseVersion: 999 }, { status: 'delivered' }))
      ).status,
    ).toBe(409);
  });
});
