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

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
  };
}

interface RegisteredRunner {
  nodeId: string;
  nodeToken: string;
  profileId: string;
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function expectString(value: unknown) {
  expect(typeof value).toBe('string');
  return String(value);
}

describe('agent gateway run observability APIs', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let nodeCounter = 0;

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

  async function registerRunner(): Promise<RegisteredRunner & { inviteToken: string }> {
    nodeCounter += 1;
    const nodeKey = `node-observe-${nodeCounter}`;
    const invitationResponse = await rootAgent.post('/api/agent-gateway/node-invitations:create').send({
      invitationKey: `invite-observe-${nodeCounter}`,
      serverUrl: 'http://127.0.0.1:13000',
    });
    expect(invitationResponse.status).toBe(200);
    const registerCommand = expectString(getData(invitationResponse).registerCommand);
    const inviteToken = registerCommand.match(/--invite-token '([^']+)'/)?.[1];
    expect(inviteToken).toBeTruthy();

    const registerResponse = await app
      .agent()
      .post('/api/agent-gateway/nodes:register')
      .send({
        inviteToken,
        nodeKey,
        displayName: 'Observe Node',
        metadata: {
          apiSecret: 'REGISTER_SECRET',
        },
      });
    expect(registerResponse.status).toBe(200);
    const register = getData(registerResponse);
    const nodeId = expectString(register.nodeId);
    const nodeToken = expectString(register.nodeToken);

    const heartbeatResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${nodeId}/heartbeat`)
      .set('Authorization', `Bearer ${nodeToken}`)
      .send({
        capabilities: {
          maxConcurrency: 1,
        },
        profiles: [
          {
            profileKey: 'fake-observer',
            displayName: 'Fake Observer',
            agentType: 'code',
            driver: 'fake',
            status: 'active',
            capabilities: {
              maxConcurrency: 1,
            },
            metadata: {
              accessKeySecret: 'PROFILE_SECRET',
            },
          },
        ],
      });
    expect(heartbeatResponse.status).toBe(200);

    const profile = await app.db.getRepository('agAgentProfiles').findOne({
      filter: {
        nodeId,
        profileKey: 'fake-observer',
      },
    });
    expect(profile).toBeTruthy();

    return {
      nodeId,
      nodeToken,
      profileId: expectString(profile.get('id')),
      inviteToken: expectString(inviteToken),
    };
  }

  async function createAndClaimRun(runner: RegisteredRunner) {
    const runResponse = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode: `run-observe-${Date.now()}-${Math.random()}`,
      sourceType: 'test',
      agentProfileId: runner.profileId,
      promptSnapshot: {
        prompt: 'Prompt that should not appear in API logs',
      },
      executionPayload: {
        task: 'observe',
      },
    });
    expect(runResponse.status).toBe(200);
    const run = getData(runResponse);

    const claimResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs:claim`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        profileKey: 'fake-observer',
      });
    expect(claimResponse.status).toBe(200);
    const claim = getData(claimResponse);
    expect(claim.claimed).toBe(true);

    return {
      run,
      claim,
    };
  }

  async function daemonRunPost(
    runner: RegisteredRunner,
    runId: unknown,
    action: string,
    values: Record<string, unknown>,
  ) {
    return await app
      .agent()
      .post(`/api/agent-gateway/runs/${runId}/${action}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(values);
  }

  function leaseValues(claim: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
    return {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      ...overrides,
    };
  }

  it('appends events idempotently and enforces source sequence monotonicity', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner);

    const eventResponse = await daemonRunPost(
      runner,
      run.id,
      'events:append',
      leaseValues(claim, {
        source: 'stdout',
        sequence: 1,
        eventType: 'log',
        level: 'info',
        message: 'small event\nAuthorization: Bearer EVENT_MESSAGE_SECRET',
        payload: {
          token: 'EVENT_SECRET',
        },
      }),
    );
    const event = getData(eventResponse);
    expect(eventResponse.status).toBe(200);
    expect(event.idempotent).toBe(false);
    expect(String(event.message)).toContain('Authorization: [REDACTED]');
    expect(String(event.message)).not.toContain('EVENT_MESSAGE_SECRET');

    const retryResponse = await daemonRunPost(
      runner,
      run.id,
      'events:append',
      leaseValues(claim, {
        source: 'stdout',
        sequence: 1,
        eventType: 'log',
        level: 'info',
        message: 'small event retry',
      }),
    );
    const retry = getData(retryResponse);
    expect(retryResponse.status).toBe(200);
    expect(retry.id).toBe(event.id);
    expect(retry.idempotent).toBe(true);

    const missingSequenceResponse = await daemonRunPost(
      runner,
      run.id,
      'events:append',
      leaseValues(claim, {
        source: 'stderr',
        sequence: null,
        eventType: 'log',
      }),
    );
    expect(missingSequenceResponse.status).toBe(400);

    const staleSequenceResponse = await daemonRunPost(
      runner,
      run.id,
      'events:append',
      leaseValues(claim, {
        source: 'stdout',
        sequence: 0,
        eventType: 'log',
      }),
    );
    expect(staleSequenceResponse.status).toBe(409);

    const events = await app.db.getRepository('agRunEvents').find({
      filter: {
        runId: run.id,
        claimAttempt: claim.claimAttempt,
        source: 'stdout',
      },
    });
    expect(events).toHaveLength(1);
    expect(events[0].get('payloadJson')).toMatchObject({
      token: '[REDACTED]',
    });
    expect(String(events[0].get('message'))).toContain('Authorization: [REDACTED]');
    expect(String(events[0].get('message'))).not.toContain('EVENT_MESSAGE_SECRET');
    expect(await app.db.getRepository('agRunEvents').count({ filter: { runId: run.id } })).toBe(1);
  });

  it('registers artifacts idempotently and redacts artifact text before persistence', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner);

    const artifactResponse = await daemonRunPost(
      runner,
      run.id,
      'artifacts:register',
      leaseValues(claim, {
        artifactKey: 'stdout-main',
        artifactType: 'stdout',
        mimeType: 'text/plain',
        contentText: 'visible line\nAuthorization: Bearer ARTIFACT_SECRET\n',
        metadata: {
          externalUrl: 'https://daemon.example/artifacts/stdout-main',
          password: 'METADATA_SECRET',
        },
      }),
    );
    const artifact = getData(artifactResponse);
    expect(artifactResponse.status).toBe(200);
    expect(artifact.idempotent).toBe(false);

    const retryResponse = await daemonRunPost(
      runner,
      run.id,
      'artifacts:register',
      leaseValues(claim, {
        artifactKey: 'stdout-main',
        artifactType: 'stdout',
        contentText: 'changed retry body',
      }),
    );
    const retry = getData(retryResponse);
    expect(retryResponse.status).toBe(200);
    expect(retry.id).toBe(artifact.id);
    expect(retry.idempotent).toBe(true);

    const storedArtifact = await app.db.getRepository('agRunArtifacts').findOne({
      filterByTk: artifact.id,
    });
    expect(String(storedArtifact.get('contentText'))).not.toContain('ARTIFACT_SECRET');
    expect(String(storedArtifact.get('contentText'))).toContain('Authorization: [REDACTED]');
    expect(storedArtifact.get('metadataJson')).toMatchObject({
      externalUrl: 'https://daemon.example/artifacts/stdout-main',
      password: '[REDACTED]',
    });
  });

  it('registers snapshots with nested secret redaction', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner);

    const snapshotResponse = await daemonRunPost(
      runner,
      run.id,
      'snapshots:register',
      leaseValues(claim, {
        snapshotType: 'workspace',
        snapshot: {
          files: ['a.ts'],
          nested: {
            apiKey: 'SNAPSHOT_SECRET',
          },
        },
        metadata: {
          authorization: 'Bearer SNAPSHOT_METADATA_SECRET',
        },
      }),
    );
    const snapshot = getData(snapshotResponse);
    expect(snapshotResponse.status).toBe(200);

    const storedSnapshot = await app.db.getRepository('agRunSnapshots').findOne({
      filterByTk: snapshot.id,
    });
    expect(storedSnapshot.get('snapshotJson')).toMatchObject({
      nested: {
        apiKey: '[REDACTED]',
      },
    });
    expect(storedSnapshot.get('metadataJson')).toMatchObject({
      authorization: '[REDACTED]',
    });
  });

  it('rejects oversized snapshot and metadata bodies without duplicating them in API logs', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner);
    const oversizedSnapshotMarker = `OVERSIZED_SNAPSHOT_MARKER_${'x'.repeat(70 * 1024)}`;
    const oversizedMetadataMarker = `OVERSIZED_METADATA_MARKER_${'y'.repeat(20 * 1024)}`;

    const snapshotResponse = await daemonRunPost(
      runner,
      run.id,
      'snapshots:register',
      leaseValues(claim, {
        snapshotType: 'workspace',
        snapshot: {
          largeValue: oversizedSnapshotMarker,
        },
      }),
    );
    expect(snapshotResponse.status).toBe(413);

    const artifactResponse = await daemonRunPost(
      runner,
      run.id,
      'artifacts:register',
      leaseValues(claim, {
        artifactKey: 'oversized-metadata',
        artifactType: 'stdout',
        contentText: 'small body',
        metadata: {
          largeValue: oversizedMetadataMarker,
        },
      }),
    );
    expect(artifactResponse.status).toBe(413);

    expect(await app.db.getRepository('agRunSnapshots').count({ filter: { runId: run.id } })).toBe(0);
    expect(await app.db.getRepository('agRunArtifacts').count({ filter: { runId: run.id } })).toBe(0);

    const serializedLogs = JSON.stringify(
      (
        await app.db.getRepository('agApiCallLogs').find({
          filter: {
            runId: run.id,
          },
        })
      ).map((log) => log.toJSON()),
    );
    expect(serializedLogs).toContain('"omitted":true');
    expect(serializedLogs).not.toContain('OVERSIZED_SNAPSHOT_MARKER');
    expect(serializedLogs).not.toContain('OVERSIZED_METADATA_MARKER');
  });

  it('rejects stale claim writers for observable output APIs', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner);
    const staleLease = Number(claim.leaseVersion) + 1;

    const eventResponse = await daemonRunPost(
      runner,
      run.id,
      'events:append',
      leaseValues(claim, {
        leaseVersion: staleLease,
        source: 'stdout',
        sequence: 1,
        eventType: 'log',
      }),
    );
    const artifactResponse = await daemonRunPost(
      runner,
      run.id,
      'artifacts:register',
      leaseValues(claim, {
        leaseVersion: staleLease,
        artifactKey: 'stale-artifact',
        artifactType: 'stdout',
        contentText: 'should not persist',
      }),
    );
    const snapshotResponse = await daemonRunPost(
      runner,
      run.id,
      'snapshots:register',
      leaseValues(claim, {
        leaseVersion: staleLease,
        snapshotType: 'node',
        snapshot: {
          status: 'stale',
        },
      }),
    );

    expect(eventResponse.status).toBe(409);
    expect(getData(eventResponse)).toMatchObject({
      code: 'lease_lost',
    });
    expect(artifactResponse.status).toBe(409);
    expect(snapshotResponse.status).toBe(409);
    expect(await app.db.getRepository('agRunEvents').count({ filter: { runId: run.id } })).toBe(0);
    expect(await app.db.getRepository('agRunArtifacts').count({ filter: { runId: run.id } })).toBe(0);
    expect(await app.db.getRepository('agRunSnapshots').count({ filter: { runId: run.id } })).toBe(0);
  });

  it('records daemon API logs without plaintext secrets or required run ids for node-level APIs', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner);
    await daemonRunPost(
      runner,
      run.id,
      'artifacts:register',
      leaseValues(claim, {
        artifactKey: 'api-log-redaction',
        artifactType: 'stdout',
        contentText: 'FULL_ARTIFACT_TEXT_SECRET',
      }),
    );
    const malformedRunId = 'ag_node_FAKE_TOKEN_FOR_PATH_LOGGING';
    const malformedPathResponse = await daemonRunPost(runner, malformedRunId, 'events:append', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      source: 'stdout',
      sequence: 1,
      eventType: 'log',
    });
    expect(malformedPathResponse.status).toBe(400);

    const logs = await app.db.getRepository('agApiCallLogs').find({
      sort: ['createdAt'],
    });
    expect(logs.length).toBeGreaterThanOrEqual(4);

    const registerLog = logs.find((log) => log.get('path') === '/api/agent-gateway/nodes:register');
    expect(registerLog).toBeTruthy();
    expect(registerLog?.get('runId')).toBeFalsy();

    const serializedLogs = JSON.stringify(logs.map((log) => log.toJSON()));
    expect(serializedLogs).not.toContain(runner.inviteToken);
    expect(serializedLogs).not.toContain(runner.nodeToken);
    expect(serializedLogs).not.toContain(String(claim.claimToken));
    expect(serializedLogs).not.toContain('REGISTER_SECRET');
    expect(serializedLogs).not.toContain('PROFILE_SECRET');
    expect(serializedLogs).not.toContain('FULL_ARTIFACT_TEXT_SECRET');
    expect(serializedLogs).not.toContain(malformedRunId);
    expect(serializedLogs).toContain('"omitted":true');
    expect(serializedLogs).toContain('[REDACTED]');
  });
});
