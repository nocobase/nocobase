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
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../shared/apiContract';

function getTestApiPath(action: Parameters<typeof getAgentGatewayApiUrl>[0], targetKey?: unknown) {
  return `/${getAgentGatewayApiUrl(action, targetKey === undefined ? undefined : String(targetKey))}`;
}

interface ResponseLike {
  status: number;
  body: {
    data?: unknown;
  };
}

interface FakeDaemonRegistration {
  nodeId: string;
  nodeToken: string;
  profileId: string;
  inviteToken: string;
}

interface LeaseValues {
  claimToken: unknown;
  claimAttempt: unknown;
  leaseVersion: unknown;
}

function getData(response: ResponseLike) {
  return response.body.data ?? response.body ?? {};
}

function getRecordData(response: ResponseLike) {
  const data = getData(response);
  expect(data && typeof data === 'object' && !Array.isArray(data)).toBe(true);
  return data as Record<string, unknown>;
}

function getListData(response: ResponseLike) {
  const data = getData(response);
  expect(Array.isArray(data)).toBe(true);
  return data as Array<Record<string, unknown>>;
}

function expectString(value: unknown) {
  expect(typeof value).toBe('string');
  return String(value);
}

function extractInviteToken(registerCommand: unknown) {
  const match =
    String(registerCommand).match(/AGENT_GATEWAY_INVITE_TOKEN='([^']+)'/) ||
    String(registerCommand).match(/--invite-token\s+'?([^'\s]+)'?/);
  expect(match?.[1]).toBeTruthy();
  return String(match?.[1]);
}

function getLeaseValues(lease: Record<string, unknown>): LeaseValues {
  return {
    claimToken: lease.claimToken,
    claimAttempt: lease.claimAttempt,
    leaseVersion: lease.leaseVersion,
  };
}

describe('agent gateway fake daemon E2E', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let sequence = 0;

  beforeEach(async () => {
    app = await createMockServer({
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

  function nextCode(prefix: string) {
    sequence += 1;
    return `${prefix}-${sequence}-${Date.now()}`;
  }

  async function createInvitation(values: Record<string, unknown> = {}) {
    const response = await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.createNodeInvitation)).send({
      invitationKey: nextCode('fake-daemon-invite'),
      serverUrl: 'http://127.0.0.1:13000',
      expiresInSeconds: 3600,
      expectedNodeKey: 'fake-daemon-node',
      ...values,
    });
    expect(response.status).toBe(200);
    return getRecordData(response);
  }

  async function registerNode(inviteToken: string, values: Record<string, unknown> = {}) {
    return await app
      .agent()
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.registerNode))
      .send({
        inviteToken,
        nodeKey: 'fake-daemon-node',
        displayName: 'Fake Daemon Node',
        daemonVersion: 'fake-daemon/1.0.0',
        hostInfo: {
          hostname: 'fake-daemon-host',
        },
        capabilitiesJson: {
          maxConcurrency: 1,
        },
        ...values,
      });
  }

  async function registerFakeDaemon(
    values: Record<string, unknown> = {},
    options: { maxConcurrency?: number } = {},
  ): Promise<FakeDaemonRegistration> {
    const invitation = await createInvitation();
    const inviteToken = extractInviteToken(invitation.registerCommand);
    const maxConcurrency = options.maxConcurrency || 1;
    const registerResponse = await registerNode(inviteToken, {
      capabilitiesJson: {
        maxConcurrency,
      },
      ...values,
    });
    expect(registerResponse.status).toBe(200);
    const registration = getRecordData(registerResponse);
    const nodeId = expectString(registration.nodeId);
    const nodeToken = expectString(registration.nodeToken);

    const heartbeatResponse = await app
      .agent()
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, nodeId))
      .set('Authorization', `Bearer ${nodeToken}`)
      .send({
        currentConcurrency: 0,
        capabilitiesJson: {
          maxConcurrency,
          artifacts: true,
          snapshots: true,
        },
        profiles: [
          {
            profileKey: 'fake-success',
            displayName: 'Fake Success',
            agentType: 'code',
            driver: 'fake',
            provider: 'opencode',
            status: 'active',
            capabilitiesJson: {
              artifacts: true,
              executionPolicyKey: 'fake-success',
              maxConcurrency,
              structuredEvents: true,
            },
            metadataJson: {
              label: 'fake-success-profile',
              command: 'FAKE_PROFILE_COMMAND_SECRET',
              cwd: '/tmp/FAKE_PROFILE_CWD_SECRET',
              env: {
                SECRET: 'FAKE_PROFILE_ENV_SECRET',
              },
            },
          },
        ],
      });
    expect(heartbeatResponse.status).toBe(200);

    const profile = await app.db.getRepository('agAgentProfiles').findOne({
      filter: {
        nodeId,
        profileKey: 'fake-success',
      },
    });
    expect(profile).toBeTruthy();

    return {
      nodeId,
      nodeToken,
      profileId: expectString(profile.get('id')),
      inviteToken,
    };
  }

  async function createPromptTemplate(values: Record<string, unknown> = {}) {
    const response = await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.createPromptTemplate)).send({
      templateKey: nextCode('fake.daemon.template'),
      displayName: 'Fake daemon E2E template',
      templateText: 'Build a fake daemon task at {{ now }}.',
      status: 'active',
      variablesSchemaJson: {},
      defaultExecutionPayloadJson: {
        mode: 'fake-success',
      },
      ...values,
    });
    expect(response.status).toBe(200);
    return getRecordData(response);
  }

  async function createRun(
    daemon: FakeDaemonRegistration,
    values: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    const response = await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.createRun)).send({
      runCode: nextCode('fake-daemon-run'),
      sourceType: 'test',
      agentProfileId: daemon.profileId,
      promptSnapshot: {
        text: 'Prompt snapshot with PROMPT_SECRET',
      },
      provider: 'opencode',
      capabilitiesSnapshotJson: {
        artifacts: true,
        structuredEvents: true,
      },
      executionPolicyKey: 'fake-success',
      executionPayloadJson: {
        executionPolicyKey: 'fake-success',
        mode: 'fake-success',
        cwd: '.',
      },
      ...values,
    });
    expect(response.status).toBe(200);
    return getRecordData(response);
  }

  async function claimRun(daemon: FakeDaemonRegistration) {
    return await app
      .agent()
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.claimRun, daemon.nodeId))
      .set('Authorization', `Bearer ${daemon.nodeToken}`)
      .send({
        profileKey: 'fake-success',
      });
  }

  async function runDaemonAction(
    daemon: FakeDaemonRegistration,
    runId: unknown,
    action: string,
    values: Record<string, unknown>,
  ) {
    const actionName = {
      heartbeat: AGENT_GATEWAY_API_ACTIONS.heartbeatRun,
      complete: AGENT_GATEWAY_API_ACTIONS.completeRun,
      fail: AGENT_GATEWAY_API_ACTIONS.failRun,
      timeout: AGENT_GATEWAY_API_ACTIONS.timeoutRun,
      'cancel-ack': AGENT_GATEWAY_API_ACTIONS.ackCancelRun,
    }[action];
    if (!actionName) {
      throw new Error(`Unsupported daemon action: ${action}`);
    }
    return await app
      .agent()
      .post(getTestApiPath(actionName, String(runId)))
      .set('Authorization', `Bearer ${daemon.nodeToken}`)
      .send(values);
  }

  async function appendObservation(
    daemon: FakeDaemonRegistration,
    runId: unknown,
    action: string,
    values: Record<string, unknown>,
  ) {
    const actionName = {
      'events:append': AGENT_GATEWAY_API_ACTIONS.appendRunEvents,
      'artifacts:register': AGENT_GATEWAY_API_ACTIONS.registerRunArtifact,
      'snapshots:register': AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot,
    }[action];
    if (!actionName) {
      throw new Error(`Unsupported observation action: ${action}`);
    }
    return await app
      .agent()
      .post(getTestApiPath(actionName, String(runId)))
      .set('Authorization', `Bearer ${daemon.nodeToken}`)
      .send(values);
  }

  it('runs the complete P0 loop through public APIs with redacted observable outputs', async () => {
    const daemon = await registerFakeDaemon();
    const template = await createPromptTemplate();
    const run = await createRun(daemon, {
      promptTemplateId: template.id,
    });
    const runId = expectString(run.id);

    const claimResponse = await claimRun(daemon);
    expect(claimResponse.status).toBe(200);
    const claim = getRecordData(claimResponse);
    expect(claim.claimed).toBe(true);
    expect(claim.runId).toBe(runId);
    expect(claim.claimAttempt).toBe(1);
    expect(claim.leaseVersion).toBe(1);
    const claimToken = expectString(claim.claimToken);

    const runHeartbeatResponse = await runDaemonAction(daemon, runId, 'heartbeat', {
      ...getLeaseValues(claim),
      status: 'running',
    });
    expect(runHeartbeatResponse.status).toBe(200);
    const runHeartbeat = getRecordData(runHeartbeatResponse);
    expect(runHeartbeat.status).toBe('running');
    expect(runHeartbeat.leaseVersion).toBe(2);

    const activeLease = getLeaseValues({
      ...claim,
      leaseVersion: runHeartbeat.leaseVersion,
    });
    const firstEventResponse = await appendObservation(daemon, runId, 'events:append', {
      ...activeLease,
      source: 'stdout',
      sequence: 1,
      eventType: 'log',
      level: 'info',
      message: 'Started fake run with Authorization: Bearer EVENT_MESSAGE_SECRET token=EVENT_TOKEN_SECRET',
      contentJson: {
        safe: 'event-safe-value',
        token: 'EVENT_PAYLOAD_TOKEN_SECRET',
        command: 'EVENT_PAYLOAD_COMMAND_SECRET',
        cwd: '/tmp/EVENT_PAYLOAD_CWD_SECRET',
        env: {
          SECRET: 'EVENT_PAYLOAD_ENV_SECRET',
        },
      },
    });
    expect(firstEventResponse.status).toBe(200);

    const secondEventResponse = await appendObservation(daemon, runId, 'events:append', {
      ...activeLease,
      source: 'stdout',
      sequence: 2,
      eventType: 'log',
      level: 'info',
      message: 'Finished fake build step with password=EVENT_PASSWORD_SECRET',
      contentJson: {
        safe: 'second-event-safe-value',
      },
    });
    expect(secondEventResponse.status).toBe(200);

    const artifactResponse = await appendObservation(daemon, runId, 'artifacts:register', {
      ...activeLease,
      artifactKey: 'stdout-main',
      artifactType: 'text',
      mimeType: 'text/plain',
      contentText:
        'visible output\nAuthorization: Bearer ARTIFACT_TEXT_SECRET\ncommand=ARTIFACT_COMMAND_SECRET cwd=/tmp/ARTIFACT_CWD_SECRET env.SECRET=ARTIFACT_ENV_SECRET\n',
      metadataJson: {
        safe: 'artifact-safe-value',
        externalUrl: 'https://daemon.example/artifacts/stdout-main',
      },
    });
    expect(artifactResponse.status).toBe(200);

    const snapshotResponse = await appendObservation(daemon, runId, 'snapshots:register', {
      ...activeLease,
      snapshotType: 'workspace',
      snapshotJson: {
        files: ['src/page.tsx'],
        command: 'SNAPSHOT_COMMAND_SECRET',
        cwd: '/tmp/SNAPSHOT_CWD_SECRET',
        env: {
          SECRET: 'SNAPSHOT_ENV_SECRET',
        },
        nested: {
          token: 'SNAPSHOT_TOKEN_SECRET',
        },
      },
      metadataJson: {
        safe: 'snapshot-safe-value',
        authorization: 'Bearer SNAPSHOT_METADATA_SECRET',
      },
    });
    expect(snapshotResponse.status).toBe(200);

    const completeResponse = await runDaemonAction(daemon, runId, 'complete', {
      ...activeLease,
      resultSummaryJson: {
        safe: 'completed',
        command: 'RESULT_COMMAND_SECRET',
        cwd: '/tmp/RESULT_CWD_SECRET',
        env: {
          SECRET: 'RESULT_ENV_SECRET',
        },
      },
    });
    expect(completeResponse.status).toBe(200);
    const completed = getRecordData(completeResponse);
    expect(completed.status).toBe('succeeded');
    expect(completed.leaseVersion).toBe(3);

    const staleEventResponse = await appendObservation(daemon, runId, 'events:append', {
      ...activeLease,
      source: 'stdout',
      sequence: 3,
      eventType: 'log',
      message: 'late stale write',
    });
    expect(staleEventResponse.status).toBe(409);
    expect(getRecordData(staleEventResponse)).toMatchObject({
      code: 'lease_lost',
    });

    const runResponse = await rootAgent.get(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.getRun, runId));
    expect(runResponse.status).toBe(200);
    const readableRun = getRecordData(runResponse);
    expect(readableRun.status).toBe('succeeded');
    expect(readableRun.promptTemplateId).toBe(template.id);
    expect(readableRun).not.toHaveProperty('claimAttempt');
    expect(readableRun).not.toHaveProperty('leaseVersion');
    expect(readableRun).not.toHaveProperty('promptSnapshot');
    expect(readableRun).not.toHaveProperty('executionPayloadJson');

    const runListResponse = await rootAgent.get(
      `${getTestApiPath(AGENT_GATEWAY_API_ACTIONS.listRuns)}?status=succeeded`,
    );
    expect(runListResponse.status).toBe(200);
    const runList = getListData(runListResponse);
    expect(runList.some((item) => item.id === runId && item.status === 'succeeded')).toBe(true);

    const eventsResponse = await rootAgent.get(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.listRunEvents, runId));
    const artifactsResponse = await rootAgent.get(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, runId));
    const snapshotsResponse = await rootAgent.get(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, runId));
    const apiLogsResponse = await rootAgent.get(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs, runId));
    expect(eventsResponse.status).toBe(200);
    expect(artifactsResponse.status).toBe(200);
    expect(snapshotsResponse.status).toBe(200);
    expect(apiLogsResponse.status).toBe(200);

    const events = getListData(eventsResponse);
    const artifacts = getListData(artifactsResponse);
    const snapshots = getListData(snapshotsResponse);
    const apiLogs = getListData(apiLogsResponse);
    expect(events).toHaveLength(2);
    expect(artifacts.length).toBeGreaterThanOrEqual(1);
    expect(artifacts[0].metadataJson).toMatchObject({
      externalUrl: 'https://daemon.example/artifacts/stdout-main',
      safe: 'artifact-safe-value',
    });
    expect(snapshots.length).toBeGreaterThanOrEqual(1);
    expect(apiLogs.length).toBeGreaterThanOrEqual(5);
    const apiLogActions = apiLogs.map((log) => String((log.requestSummaryJson as Record<string, unknown>).action));
    expect(apiLogActions).toEqual(
      expect.arrayContaining([
        AGENT_GATEWAY_API_ACTIONS.claimRun,
        AGENT_GATEWAY_API_ACTIONS.heartbeatRun,
        AGENT_GATEWAY_API_ACTIONS.appendRunEvents,
        AGENT_GATEWAY_API_ACTIONS.registerRunArtifact,
        AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot,
        AGENT_GATEWAY_API_ACTIONS.completeRun,
      ]),
    );

    const serializedObservability = JSON.stringify({
      events,
      artifacts,
      snapshots,
      readableRun,
    });
    expect(serializedObservability).not.toContain('EVENT_MESSAGE_SECRET');
    expect(serializedObservability).not.toContain('EVENT_TOKEN_SECRET');
    expect(serializedObservability).not.toContain('EVENT_PAYLOAD_TOKEN_SECRET');
    expect(serializedObservability).not.toContain('EVENT_PAYLOAD_COMMAND_SECRET');
    expect(serializedObservability).not.toContain('EVENT_PAYLOAD_CWD_SECRET');
    expect(serializedObservability).not.toContain('EVENT_PAYLOAD_ENV_SECRET');
    expect(serializedObservability).not.toContain('EVENT_PASSWORD_SECRET');
    expect(serializedObservability).not.toContain('ARTIFACT_TEXT_SECRET');
    expect(serializedObservability).not.toContain('ARTIFACT_COMMAND_SECRET');
    expect(serializedObservability).not.toContain('ARTIFACT_CWD_SECRET');
    expect(serializedObservability).not.toContain('ARTIFACT_ENV_SECRET');
    expect(serializedObservability).not.toContain('SNAPSHOT_COMMAND_SECRET');
    expect(serializedObservability).not.toContain('SNAPSHOT_CWD_SECRET');
    expect(serializedObservability).not.toContain('SNAPSHOT_ENV_SECRET');
    expect(serializedObservability).not.toContain('SNAPSHOT_TOKEN_SECRET');
    expect(serializedObservability).not.toContain('SNAPSHOT_METADATA_SECRET');
    expect(serializedObservability).not.toContain('RESULT_COMMAND_SECRET');
    expect(serializedObservability).not.toContain('RESULT_CWD_SECRET');
    expect(serializedObservability).not.toContain('RESULT_ENV_SECRET');
    expect(serializedObservability).toContain('[REDACTED]');

    const serializedApiLogs = JSON.stringify(apiLogs);
    expect(serializedApiLogs).not.toContain(daemon.inviteToken);
    expect(serializedApiLogs).not.toContain(daemon.nodeToken);
    expect(serializedApiLogs).not.toContain(claimToken);
    expect(serializedApiLogs).not.toContain('RUN_COMMAND_SECRET');
    expect(serializedApiLogs).not.toContain('RUN_CWD_SECRET');
    expect(serializedApiLogs).not.toContain('RUN_ENV_SECRET');
    expect(serializedApiLogs).not.toContain('EVENT_MESSAGE_SECRET');
    expect(serializedApiLogs).not.toContain('ARTIFACT_TEXT_SECRET');
    expect(serializedApiLogs).not.toContain('SNAPSHOT_COMMAND_SECRET');
    expect(serializedApiLogs).not.toContain('RESULT_COMMAND_SECRET');
    expect(serializedApiLogs).toContain('[REDACTED]');

    expect(await app.db.getRepository('agRunEvents').count({ filter: { runId } })).toBe(2);
    expect(await app.db.getRepository('agRunArtifacts').count({ filter: { runId } })).toBe(1);
    expect(await app.db.getRepository('agRunSnapshots').count({ filter: { runId } })).toBe(1);
  });

  it('rejects expired invitations before node registration', async () => {
    const invitation = await createInvitation();
    await app.db.getRepository('agNodeInvitations').update({
      filterByTk: invitation.invitationId,
      values: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    const inviteToken = extractInviteToken(invitation.registerCommand);

    const registerResponse = await registerNode(inviteToken);
    expect(registerResponse.status).toBe(403);

    const storedInvitation = await app.db.getRepository('agNodeInvitations').findOne({
      filterByTk: invitation.invitationId,
    });
    expect(storedInvitation.get('status')).not.toBe('accepted');
    expect(await app.db.getRepository('agNodes').count()).toBe(0);
  });

  it('rejects invalid node tokens for node heartbeat', async () => {
    const daemon = await registerFakeDaemon();

    const heartbeatResponse = await app
      .agent()
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, daemon.nodeId))
      .set('Authorization', 'Bearer ag_node_invalid_token')
      .send({});
    expect(heartbeatResponse.status).toBe(401);
  });

  it('rejects run claims from disabled nodes', async () => {
    const daemon = await registerFakeDaemon();
    await createRun(daemon);

    const disableResponse = await rootAgent
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.updateNode, daemon.nodeId))
      .send({
        status: 'disabled',
      });
    expect(disableResponse.status).toBe(200);

    const claimResponse = await claimRun(daemon);
    expect(claimResponse.status).toBe(403);
  });

  it('does not return the same run twice for duplicate claims', async () => {
    const daemon = await registerFakeDaemon({}, { maxConcurrency: 2 });
    const run = await createRun(daemon);

    const firstClaimResponse = await claimRun(daemon);
    expect(firstClaimResponse.status).toBe(200);
    const firstClaim = getRecordData(firstClaimResponse);
    expect(firstClaim.claimed).toBe(true);
    expect(firstClaim.runId).toBe(run.id);

    const secondClaimResponse = await claimRun(daemon);
    expect(secondClaimResponse.status).toBe(200);
    const secondClaim = getRecordData(secondClaimResponse);
    expect(secondClaim.claimed).toBe(false);
    expect(secondClaim.reason).toBe('no_claimable_run');
    expect(secondClaim.runId).not.toBe(run.id);
  });

  it('marks lease-expired claimed runs as stalled before failing them', async () => {
    const daemon = await registerFakeDaemon();
    const run = await createRun(daemon);
    const claimResponse = await claimRun(daemon);
    expect(claimResponse.status).toBe(200);

    await app.db.getRepository('agRuns').update({
      filterByTk: run.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const expireResponse = await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.expireRunLeases)).send({});
    expect(expireResponse.status).toBe(200);
    expect(getRecordData(expireResponse)).toMatchObject({
      stalledCount: 1,
      failedCount: 0,
    });

    const stalledRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(stalledRun.get('status')).toBe('stalled');
    expect(stalledRun.get('finishedAt')).toBeFalsy();

    await app.db.getRepository('agRuns').update({
      filterByTk: run.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const failExpiredResponse = await rootAgent
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.expireRunLeases))
      .send({});
    expect(failExpiredResponse.status).toBe(200);
    expect(getRecordData(failExpiredResponse)).toMatchObject({
      stalledCount: 0,
      failedCount: 1,
    });

    const failedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(failedRun.get('status')).toBe('failed');
    expect(failedRun.get('finishedAt')).toBeTruthy();
  });

  it('keeps canceling runs non-terminal until fake daemon acknowledges cancellation', async () => {
    const daemon = await registerFakeDaemon();
    const run = await createRun(daemon);
    const claimResponse = await claimRun(daemon);
    expect(claimResponse.status).toBe(200);
    const claim = getRecordData(claimResponse);
    const heartbeatResponse = await runDaemonAction(daemon, run.id, 'heartbeat', {
      ...getLeaseValues(claim),
      status: 'running',
    });
    expect(heartbeatResponse.status).toBe(200);
    const heartbeat = getRecordData(heartbeatResponse);
    const activeLease = getLeaseValues({
      ...claim,
      leaseVersion: heartbeat.leaseVersion,
    });

    const cancelResponse = await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.cancelRun, run.id)).send({});
    expect(cancelResponse.status).toBe(200);
    const cancel = getRecordData(cancelResponse);
    expect(cancel.status).toBe('canceling');
    expect(cancel.cancelRequested).toBe(true);
    expect(cancel.finishedAt).toBeFalsy();

    const completeWhileCancelingResponse = await runDaemonAction(daemon, run.id, 'complete', {
      ...activeLease,
      resultSummaryJson: {
        ok: true,
      },
    });
    expect(completeWhileCancelingResponse.status).toBe(409);

    const cancelingRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(cancelingRun.get('status')).toBe('canceling');
    expect(cancelingRun.get('finishedAt')).toBeFalsy();

    const ackResponse = await runDaemonAction(daemon, run.id, 'cancel-ack', activeLease);
    expect(ackResponse.status).toBe(200);
    const ack = getRecordData(ackResponse);
    expect(ack.status).toBe('canceled');

    const canceledRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(canceledRun.get('status')).toBe('canceled');
    expect(canceledRun.get('cancelAckAt')).toBeTruthy();
    expect(canceledRun.get('finishedAt')).toBeTruthy();
  });
});
