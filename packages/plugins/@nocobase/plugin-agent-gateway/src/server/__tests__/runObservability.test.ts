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

import PluginAgentGatewayServer from '../plugin';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
    meta?: Record<string, unknown>;
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
      expectedNodeKey: nodeKey,
    });
    expect(invitationResponse.status).toBe(200);
    const registerCommand = expectString(getData(invitationResponse).registerCommand);
    const inviteToken =
      registerCommand.match(/AGENT_GATEWAY_INVITE_TOKEN='([^']+)'/)?.[1] ||
      registerCommand.match(/--invite-token '([^']+)'/)?.[1];
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
            provider: 'opencode',
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

  async function createAndClaimRun(runner: RegisteredRunner, executionPayload?: Record<string, unknown>) {
    const runResponse = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode: `run-observe-${Date.now()}-${Math.random()}`,
      sourceType: 'test',
      agentProfileId: runner.profileId,
      promptSnapshot: {
        prompt: 'Prompt that should not appear in management read APIs or API logs',
      },
      executionPayload: {
        task: 'observe',
        command: 'must-not-render',
        cwd: '/tmp/must-not-render',
        env: {
          SECRET: 'must-not-render',
        },
        ...executionPayload,
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

  function registerTestSnippet(name: string, actions: string[]) {
    app.acl.registerSnippet({
      name,
      actions,
    });
    return name;
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
        message:
          'small event\nAuthorization: Bearer EVENT_MESSAGE_SECRET\ncommand=EVENT_COMMAND_SECRET cwd=/tmp/EVENT_CWD_SECRET env.SECRET=EVENT_ENV_SECRET',
        payload: {
          token: 'EVENT_SECRET',
          command: 'EVENT_PAYLOAD_COMMAND_SECRET',
          cwd: '/tmp/EVENT_PAYLOAD_CWD_SECRET',
          env: {
            SECRET: 'EVENT_PAYLOAD_ENV_SECRET',
          },
        },
      }),
    );
    const event = getData(eventResponse);
    expect(eventResponse.status).toBe(200);
    expect(event.idempotent).toBe(false);
    expect(String(event.message)).toContain('Authorization: [REDACTED]');
    expect(String(event.message)).not.toContain('EVENT_MESSAGE_SECRET');
    expect(String(event.message)).not.toContain('EVENT_COMMAND_SECRET');
    expect(String(event.message)).not.toContain('EVENT_CWD_SECRET');
    expect(String(event.message)).not.toContain('EVENT_ENV_SECRET');

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
      command: '[REDACTED]',
      cwd: '[REDACTED]',
      env: '[REDACTED]',
    });
    expect(JSON.stringify(events[0].get('payloadJson'))).not.toContain('EVENT_PAYLOAD_COMMAND_SECRET');
    expect(JSON.stringify(events[0].get('payloadJson'))).not.toContain('EVENT_PAYLOAD_CWD_SECRET');
    expect(JSON.stringify(events[0].get('payloadJson'))).not.toContain('EVENT_PAYLOAD_ENV_SECRET');
    expect(String(events[0].get('message'))).toContain('Authorization: [REDACTED]');
    expect(String(events[0].get('message'))).not.toContain('EVENT_MESSAGE_SECRET');
    expect(await app.db.getRepository('agRunEvents').count({ filter: { runId: run.id } })).toBe(1);
  });

  it('registers artifacts idempotently and preserves artifact text before persistence', async () => {
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
        contentText:
          'visible line\nAuthorization: Bearer ARTIFACT_SECRET\ncommand=ARTIFACT_COMMAND_SECRET cwd=/tmp/ARTIFACT_CWD_SECRET env.SECRET=ARTIFACT_ENV_SECRET\n',
        metadata: {
          externalUrl: 'https://daemon.example/artifacts/stdout-main',
          downloadUrl: 'https://daemon.example/download/stdout-main',
          nested: {
            href: 'https://daemon.example/href/stdout-main',
            note: 'see https://daemon.example/inline/stdout-main',
          },
          command: 'ARTIFACT_METADATA_COMMAND_SECRET',
          cwd: '/tmp/ARTIFACT_METADATA_CWD_SECRET',
          env: {
            SECRET: 'ARTIFACT_METADATA_ENV_SECRET',
          },
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
    expect(String(storedArtifact.get('contentText'))).toContain('ARTIFACT_SECRET');
    expect(String(storedArtifact.get('contentText'))).toContain('ARTIFACT_COMMAND_SECRET');
    expect(String(storedArtifact.get('contentText'))).toContain('ARTIFACT_CWD_SECRET');
    expect(String(storedArtifact.get('contentText'))).toContain('ARTIFACT_ENV_SECRET');
    expect(String(storedArtifact.get('contentText'))).toContain('Authorization: Bearer ARTIFACT_SECRET');
    expect(storedArtifact.get('metadataJson')).toMatchObject({
      externalUrl: 'https://daemon.example/artifacts/stdout-main',
      downloadUrl: 'https://daemon.example/download/stdout-main',
      nested: {
        href: 'https://daemon.example/href/stdout-main',
        note: 'see https://daemon.example/inline/stdout-main',
      },
      command: 'ARTIFACT_METADATA_COMMAND_SECRET',
      cwd: '/tmp/ARTIFACT_METADATA_CWD_SECRET',
      env: {
        SECRET: 'ARTIFACT_METADATA_ENV_SECRET',
      },
      password: 'METADATA_SECRET',
    });
    const serializedMetadata = JSON.stringify(storedArtifact.get('metadataJson'));
    expect(serializedMetadata).toContain('daemon.example');
    expect(serializedMetadata).toContain('ARTIFACT_METADATA_COMMAND_SECRET');
    expect(serializedMetadata).toContain('ARTIFACT_METADATA_CWD_SECRET');
    expect(serializedMetadata).toContain('ARTIFACT_METADATA_ENV_SECRET');
  });

  it('adds declared artifact groups when listed artifacts have older metadata', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner, {
      artifacts: [
        {
          glob: 'runs/nb-opencode-ui-batch/*/report.html',
          groupLabel: 'Reports',
        },
        {
          path: 'runs/nb-opencode-ui-batch/run-1/run.json',
          groupLabel: 'Run metadata',
        },
      ],
    });

    const reportResponse = await daemonRunPost(
      runner,
      run.id,
      'artifacts:register',
      leaseValues(claim, {
        artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/report.html',
        artifactType: 'html-report',
        mimeType: 'text/html',
        contentText: '<html><body>report</body></html>',
        metadata: {
          relativePath: 'runs/nb-opencode-ui-batch/run-1/report.html',
        },
      }),
    );
    expect(reportResponse.status).toBe(200);

    const runMetadataResponse = await daemonRunPost(
      runner,
      run.id,
      'artifacts:register',
      leaseValues(claim, {
        artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/run.json',
        artifactType: 'json-report',
        mimeType: 'application/json',
        contentText: '{"status":"passed"}',
        metadata: {
          relativePath: 'runs/nb-opencode-ui-batch/run-1/run.json',
        },
      }),
    );
    expect(runMetadataResponse.status).toBe(200);

    const artifactsResponse = await rootAgent.get(`/api/agent-gateway/runs/${run.id}/artifacts:list`);
    expect(artifactsResponse.status).toBe(200);
    const artifacts = artifactsResponse.body.data as Array<Record<string, unknown>>;
    expect(artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/report.html',
          metadataJson: expect.objectContaining({
            artifactGroupLabel: 'Reports',
          }),
        }),
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/run.json',
          metadataJson: expect.objectContaining({
            artifactGroupLabel: 'Run metadata',
          }),
        }),
      ]),
    );
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
          command: 'SNAPSHOT_COMMAND_SECRET',
          cwd: '/tmp/SNAPSHOT_CWD_SECRET',
          env: {
            SECRET: 'SNAPSHOT_ENV_SECRET',
          },
          nested: {
            apiKey: 'SNAPSHOT_SECRET',
          },
        },
        metadata: {
          authorization: 'Bearer SNAPSHOT_METADATA_SECRET',
          command: 'SNAPSHOT_METADATA_COMMAND_SECRET',
          cwd: '/tmp/SNAPSHOT_METADATA_CWD_SECRET',
          env: {
            SECRET: 'SNAPSHOT_METADATA_ENV_SECRET',
          },
        },
      }),
    );
    const snapshot = getData(snapshotResponse);
    expect(snapshotResponse.status).toBe(200);

    const storedSnapshot = await app.db.getRepository('agRunSnapshots').findOne({
      filterByTk: snapshot.id,
    });
    expect(storedSnapshot.get('snapshotJson')).toMatchObject({
      command: '[REDACTED]',
      cwd: '[REDACTED]',
      env: '[REDACTED]',
      nested: {
        apiKey: '[REDACTED]',
      },
    });
    expect(storedSnapshot.get('metadataJson')).toMatchObject({
      authorization: '[REDACTED]',
      command: '[REDACTED]',
      cwd: '[REDACTED]',
      env: '[REDACTED]',
    });
    const serializedSnapshot = JSON.stringify(storedSnapshot.toJSON());
    expect(serializedSnapshot).not.toContain('SNAPSHOT_COMMAND_SECRET');
    expect(serializedSnapshot).not.toContain('SNAPSHOT_CWD_SECRET');
    expect(serializedSnapshot).not.toContain('SNAPSHOT_ENV_SECRET');
    expect(serializedSnapshot).not.toContain('SNAPSHOT_METADATA_COMMAND_SECRET');
    expect(serializedSnapshot).not.toContain('SNAPSHOT_METADATA_CWD_SECRET');
    expect(serializedSnapshot).not.toContain('SNAPSHOT_METADATA_ENV_SECRET');
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

  it('paginates run events and returns later same-timestamp ingests with lower UUIDs', async () => {
    const runner = await registerRunner();
    const { run } = await createAndClaimRun(runner);
    const runId = expectString(run.id);
    const repository = app.db.getRepository('agRunEvents');
    const timestamps = [
      new Date('2026-07-11T02:00:00.000Z'),
      new Date('2026-07-11T02:00:01.000Z'),
      new Date('2026-07-11T02:00:02.000Z'),
      new Date('2026-07-11T02:00:03.000Z'),
    ];
    const eventIds = [
      '80000000-0000-4000-8000-000000000001',
      '80000000-0000-4000-8000-000000000002',
      '80000000-0000-4000-8000-000000000003',
      '80000000-0000-4000-8000-000000000004',
    ];
    for (let index = 0; index < timestamps.length; index += 1) {
      const event = await app.db.sequelize.transaction(async (transaction) => {
        return await repository.create({
          values: {
            id: eventIds[index],
            runId,
            claimAttempt: index < 2 ? 1 : 2,
            source: index % 2 === 0 ? 'stdout' : 'harness',
            sequence: Math.floor(index / 2) + 1,
            eventType: `cursor.event.${index + 1}`,
            message: `cursor message ${index + 1}`,
            emittedAt: timestamps[index],
          },
          transaction,
        });
      });
      await app.db
        .getCollection('agRunEvents')
        .model.update({ createdAt: timestamps[index] }, { where: { id: event.get('id') }, hooks: false });
    }

    const latestResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/events:list`).query({ pageSize: 2 });
    expect(latestResponse.status).toBe(200);
    expect((latestResponse.body.data as Array<Record<string, unknown>>).map((event) => event.eventType)).toEqual([
      'cursor.event.3',
      'cursor.event.4',
    ]);
    expect(latestResponse.body.meta).toMatchObject({
      pageSize: 2,
      hasMoreBefore: true,
      hasMoreAfter: false,
    });
    const beforeCursor = expectString(latestResponse.body.meta?.beforeCursor);
    const afterCursor = expectString(latestResponse.body.meta?.afterCursor);

    const olderResponse = await rootAgent
      .get(`/api/agent-gateway/runs/${runId}/events:list`)
      .query({ pageSize: 2, beforeCursor });
    expect(olderResponse.status).toBe(200);
    expect((olderResponse.body.data as Array<Record<string, unknown>>).map((event) => event.eventType)).toEqual([
      'cursor.event.1',
      'cursor.event.2',
    ]);
    expect(olderResponse.body.meta).toMatchObject({
      hasMoreBefore: false,
    });

    const deltaIds: string[] = [];
    for (const values of [
      {
        id: '00000000-0000-4000-8000-000000000001',
        claimAttempt: 3,
        source: 'stdout',
        sequence: 0,
        eventType: 'cursor.delta.attempt',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        claimAttempt: 2,
        source: 'cloud-code',
        sequence: 0,
        eventType: 'cursor.delta.source',
      },
    ]) {
      const event = await app.db.sequelize.transaction(async (transaction) => {
        return await repository.create({
          values: {
            runId,
            ...values,
            message: values.eventType,
            emittedAt: timestamps[3],
          },
          transaction,
        });
      });
      deltaIds.push(expectString(event.get('id')));
      await app.db
        .getCollection('agRunEvents')
        .model.update({ createdAt: timestamps[3] }, { where: { id: event.get('id') }, hooks: false });
    }

    const deltaResponse = await rootAgent
      .get(`/api/agent-gateway/runs/${runId}/events:list`)
      .query({ pageSize: 10, afterCursor });
    expect(deltaResponse.status).toBe(200);
    const deltaEvents = deltaResponse.body.data as Array<Record<string, unknown>>;
    expect(deltaEvents.map((event) => event.id).sort()).toEqual([...deltaIds].sort());
    expect(deltaEvents.map((event) => event.eventType).sort()).toEqual(['cursor.delta.attempt', 'cursor.delta.source']);

    expect((await rootAgent.get(`/api/agent-gateway/runs/${runId}/events:list`).query({ pageSize: 501 })).status).toBe(
      400,
    );
    expect(
      (await rootAgent.get(`/api/agent-gateway/runs/${runId}/events:list`).query({ beforeCursor: 'bad' })).status,
    ).toBe(400);
  });

  it('paginates artifact, snapshot, and API log metadata and guards lazy artifact content ownership', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner);
    const runId = expectString(run.id);
    const artifactIds: string[] = [];
    for (const artifactKey of ['artifact-page-1', 'artifact-page-2']) {
      const response = await daemonRunPost(
        runner,
        runId,
        'artifacts:register',
        leaseValues(claim, {
          artifactKey,
          artifactType: 'log',
          mimeType: 'text/plain',
          contentText: `content-${artifactKey}`,
        }),
      );
      expect(response.status).toBe(200);
      artifactIds.push(expectString(getData(response).id));
    }
    for (const snapshotType of ['workspace', 'custom']) {
      const response = await daemonRunPost(
        runner,
        runId,
        'snapshots:register',
        leaseValues(claim, {
          snapshotType,
          snapshot: {
            snapshotType,
          },
        }),
      );
      expect(response.status).toBe(200);
    }
    for (let index = 0; index < 2; index += 1) {
      await app.db.getRepository('agApiCallLogs').create({
        values: {
          id: randomUUID(),
          runId,
          direction: 'daemon_to_server',
          method: 'GET',
          path: `/cursor-api-log-${index + 1}`,
          statusCode: 200,
        },
      });
    }

    const artifactsResponse = await rootAgent
      .get(`/api/agent-gateway/runs/${runId}/artifacts:list`)
      .query({ page: 2, pageSize: 1 });
    expect(artifactsResponse.status).toBe(200);
    expect(artifactsResponse.body.data).toHaveLength(1);
    expect((artifactsResponse.body.data as Array<Record<string, unknown>>)[0]).not.toHaveProperty('contentText');
    expect(artifactsResponse.body.meta).toMatchObject({
      count: 2,
      page: 2,
      pageSize: 1,
      totalPage: 2,
    });

    const snapshotsResponse = await rootAgent
      .get(`/api/agent-gateway/runs/${runId}/snapshots:list`)
      .query({ page: 2, pageSize: 1 });
    expect(snapshotsResponse.status).toBe(200);
    expect(snapshotsResponse.body.data).toHaveLength(1);
    expect(snapshotsResponse.body.meta).toMatchObject({
      count: 2,
      page: 2,
      pageSize: 1,
      totalPage: 2,
    });

    const apiLogsResponse = await rootAgent
      .get(`/api/agent-gateway/runs/${runId}/api-call-logs:list`)
      .query({ page: 2, pageSize: 1 });
    expect(apiLogsResponse.status).toBe(200);
    expect(apiLogsResponse.body.data).toHaveLength(1);
    expect(apiLogsResponse.body.meta).toMatchObject({
      page: 2,
      pageSize: 1,
    });
    expect(Number(apiLogsResponse.body.meta?.count)).toBeGreaterThanOrEqual(2);
    expect(Number(apiLogsResponse.body.meta?.totalPage)).toBe(Number(apiLogsResponse.body.meta?.count));

    const contentResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/artifacts/${artifactIds[0]}:content`);
    expect(contentResponse.status).toBe(200);
    expect(getData(contentResponse)).toMatchObject({
      id: artifactIds[0],
      contentText: 'content-artifact-page-1',
    });

    const otherRunResponse = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode: `run-observe-other-${Date.now()}-${Math.random()}`,
      sourceType: 'test',
      agentProfileId: runner.profileId,
    });
    expect(otherRunResponse.status).toBe(200);
    const otherRun = getData(otherRunResponse);
    const wrongRunResponse = await rootAgent.get(
      `/api/agent-gateway/runs/${expectString(otherRun.id)}/artifacts/${artifactIds[0]}:content`,
    );
    expect(wrongRunResponse.status).toBe(404);
    expect(
      (await rootAgent.get(`/api/agent-gateway/runs/${runId}/artifacts:list`).query({ pageSize: 101 })).status,
    ).toBe(400);
  });

  it('lists runs and observation details through read-only management APIs', async () => {
    const runner = await registerRunner();
    const { run, claim } = await createAndClaimRun(runner);
    const runId = expectString(run.id);
    expect(run).not.toHaveProperty('promptSnapshot');
    expect(run).not.toHaveProperty('executionPayloadJson');

    await daemonRunPost(
      runner,
      runId,
      'events:append',
      leaseValues(claim, {
        source: 'stdout',
        sequence: 1,
        eventType: 'log',
        level: 'info',
        message: 'observable event',
        payload: {
          token: 'EVENT_READ_SECRET',
        },
      }),
    );
    await daemonRunPost(
      runner,
      runId,
      'artifacts:register',
      leaseValues(claim, {
        artifactKey: 'stdout',
        artifactType: 'log',
        mimeType: 'text/plain',
        contentText: 'inline artifact',
        metadata: {
          externalUrl: 'https://daemon.example/artifacts/stdout',
        },
      }),
    );
    await daemonRunPost(
      runner,
      runId,
      'snapshots:register',
      leaseValues(claim, {
        snapshotType: 'workspace',
        snapshot: {
          files: ['a.ts'],
        },
      }),
    );

    const conversationEventFindSpy = vi.spyOn(app.db.getRepository('agAgentConversationEvents'), 'find');
    const listResponse = await rootAgent.get(
      `/api/agent-gateway/runs:list?status=claimed&nodeId=${runner.nodeId}&agentProfileId=${runner.profileId}`,
    );
    expect(listResponse.status).toBe(200);
    expect(conversationEventFindSpy).not.toHaveBeenCalled();
    conversationEventFindSpy.mockRestore();
    const runs = listResponse.body.data as Array<Record<string, unknown>>;
    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe(runId);
    expect(runs[0]).not.toHaveProperty('claimTokenHash');
    expect(runs[0]).not.toHaveProperty('promptSnapshot');
    expect(runs[0]).not.toHaveProperty('executionPayloadJson');
    expect(JSON.stringify(runs[0])).not.toContain('must-not-render');

    const getResponse = await rootAgent.get(`/api/agent-gateway/runs:get/${runId}`);
    expect(getResponse.status).toBe(200);
    expect(getData(getResponse).id).toBe(runId);
    expect(getData(getResponse)).not.toHaveProperty('claimTokenHash');
    expect(getData(getResponse)).not.toHaveProperty('promptSnapshot');
    expect(getData(getResponse)).not.toHaveProperty('executionPayloadJson');
    expect(JSON.stringify(getData(getResponse))).not.toContain('must-not-render');

    const eventsResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/events:list`);
    expect(eventsResponse.status).toBe(200);
    const events = eventsResponse.body.data as Array<Record<string, unknown>>;
    expect(events[0].message).toBe('observable event');
    expect(events[0].payloadJson).toMatchObject({
      token: '[REDACTED]',
    });

    const artifactsResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/artifacts:list`);
    expect(artifactsResponse.status).toBe(200);
    const artifacts = artifactsResponse.body.data as Array<Record<string, unknown>>;
    expect(artifacts[0]).not.toHaveProperty('contentText');
    expect(artifacts[0].metadataJson).toMatchObject({
      externalUrl: 'https://daemon.example/artifacts/stdout',
    });
    expect(JSON.stringify(artifacts[0])).toContain('https://daemon.example/artifacts/stdout');
    expect(artifactsResponse.body.meta).toMatchObject({
      count: 1,
      page: 1,
      pageSize: 20,
      totalPage: 1,
    });
    const artifactContentResponse = await rootAgent.get(
      `/api/agent-gateway/runs/${runId}/artifacts/${expectString(artifacts[0].id)}:content`,
    );
    expect(artifactContentResponse.status).toBe(200);
    expect(getData(artifactContentResponse)).toMatchObject({
      id: artifacts[0].id,
      contentText: 'inline artifact',
    });

    const snapshotsResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/snapshots:list`);
    expect(snapshotsResponse.status).toBe(200);
    const snapshots = snapshotsResponse.body.data as Array<Record<string, unknown>>;
    expect(snapshots[0].snapshotJson).toMatchObject({
      files: ['a.ts'],
    });

    const apiLogsResponse = await rootAgent.get(`/api/agent-gateway/runs/${runId}/api-call-logs:list`);
    expect(apiLogsResponse.status).toBe(200);
    const apiLogs = apiLogsResponse.body.data as Array<Record<string, unknown>>;
    expect(apiLogs.length).toBeGreaterThan(0);
    expect(JSON.stringify(apiLogs)).not.toContain('EVENT_READ_SECRET');

    const readRunAgent = await createUserAgent('agent-gateway-run-reader', ['agentGateway.readRun']);
    expect((await readRunAgent.get('/api/agent-gateway/runs:list')).status).toBe(200);
    const standardRunListResponse = await readRunAgent.get('/agRuns:list');
    expect(standardRunListResponse.status).toBe(200);
    const standardRuns = standardRunListResponse.body.data as Array<Record<string, unknown>>;
    expect(standardRuns[0]).not.toHaveProperty('promptSnapshot');
    expect(standardRuns[0]).not.toHaveProperty('executionPayloadJson');
    expect(JSON.stringify(standardRuns[0])).not.toContain('must-not-render');

    const standardRunGetResponse = await readRunAgent.get(`/agRuns:get/${runId}`);
    expect(standardRunGetResponse.status).toBe(200);
    expect(getData(standardRunGetResponse)).not.toHaveProperty('promptSnapshot');
    expect(getData(standardRunGetResponse)).not.toHaveProperty('executionPayloadJson');
    expect(JSON.stringify(getData(standardRunGetResponse))).not.toContain('must-not-render');
    expect((await readRunAgent.get(`/api/agent-gateway/runs/${runId}/events:list`)).status).toBe(403);

    const readRunsAgent = await createUserAgent('agent-gateway-runs-list-reader', ['agentGateway.readRuns']);
    expect((await readRunsAgent.get('/api/agent-gateway/runs:list')).status).toBe(200);
    expect((await readRunsAgent.get(`/api/agent-gateway/runs:get/${runId}`)).status).toBe(403);
    expect((await readRunsAgent.get(`/agRuns:get/${runId}`)).status).toBe(403);

    const rawRunsSnippet = registerTestSnippet('agentGateway.test.rawRunsCollection', ['agRuns:list', 'agRuns:get']);
    const rawRunsAgent = await createUserAgent('agent-gateway-raw-runs-reader', [rawRunsSnippet]);
    expect((await rawRunsAgent.get('/api/agRuns:list')).status).toBe(403);
    expect((await rawRunsAgent.get(`/api/agRuns:get/${runId}`)).status).toBe(403);

    const rawRunMutationSnippet = registerTestSnippet('agentGateway.test.rawRunsMutationCollection', [
      'agRuns:create',
      'agRuns:update',
      'agRuns:destroy',
    ]);
    const rawRunMutationAgent = await createUserAgent('agent-gateway-raw-runs-mutator', [rawRunMutationSnippet]);
    expect(
      (
        await rawRunMutationAgent.post('/api/agRuns:create').send({
          runCode: 'raw-run-create-must-not-bypass',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await rawRunMutationAgent.post(`/api/agRuns:update/${runId}`).send({
          status: 'succeeded',
        })
      ).status,
    ).toBe(403);
    expect((await rawRunMutationAgent.post(`/api/agRuns:destroy/${runId}`).send({})).status).toBe(403);

    const readRunDetailsAgent = await createUserAgent('agent-gateway-run-details-reader', [
      'agentGateway.readRunDetails',
    ]);
    expect((await readRunDetailsAgent.get(`/api/agent-gateway/runs/${runId}/events:list`)).status).toBe(403);
    expect((await readRunDetailsAgent.get(`/api/agent-gateway/runs/${runId}/artifacts:list`)).status).toBe(403);
    expect((await readRunDetailsAgent.get(`/api/agent-gateway/runs/${runId}/snapshots:list`)).status).toBe(403);
    expect((await readRunDetailsAgent.get(`/api/agent-gateway/runs/${runId}/api-call-logs:list`)).status).toBe(403);
    expect((await readRunDetailsAgent.get('/agRunEvents:list')).status).toBe(403);
    expect((await readRunDetailsAgent.get('/agRunArtifacts:list')).status).toBe(403);
    expect((await readRunDetailsAgent.get('/agRunSnapshots:list')).status).toBe(403);
    expect((await readRunDetailsAgent.get('/agApiCallLogs:list')).status).toBe(403);

    const rawEventsSnippet = registerTestSnippet('agentGateway.test.rawRunEventsCollection', ['agRunEvents:list']);
    const rawEventsAgent = await createUserAgent('agent-gateway-raw-events-reader', [rawEventsSnippet]);
    expect((await rawEventsAgent.get('/api/agRunEvents:list')).status).toBe(403);

    const rawSessionCollectionsSnippet = registerTestSnippet('agentGateway.test.rawSessionCollections', [
      'agAgentSessions:list',
    ]);
    const rawSessionCollectionsAgent = await createUserAgent('agent-gateway-raw-session-reader', [
      rawSessionCollectionsSnippet,
    ]);
    expect((await rawSessionCollectionsAgent.get('/api/agAgentSessions:list')).status).toBe(403);

    const rawCoreCollectionsSnippet = registerTestSnippet('agentGateway.test.rawCoreCollections', [
      'agNodes:list',
      'agAgentProfiles:list',
      'agNodeInvitations:list',
    ]);
    const rawCoreCollectionsAgent = await createUserAgent('agent-gateway-raw-core-reader', [rawCoreCollectionsSnippet]);
    expect((await rawCoreCollectionsAgent.get('/api/agNodes:list')).status).toBe(403);
    expect((await rawCoreCollectionsAgent.get('/api/agAgentProfiles:list')).status).toBe(403);
    expect((await rawCoreCollectionsAgent.get('/api/agNodeInvitations:list')).status).toBe(403);

    const readArtifactsAgent = await createUserAgent('agent-gateway-artifacts-reader', ['agentGateway.readArtifacts']);
    expect((await readArtifactsAgent.get(`/api/agent-gateway/runs/${runId}/artifacts:list`)).status).toBe(200);
    expect(
      (
        await readArtifactsAgent.get(
          `/api/agent-gateway/runs/${runId}/artifacts/${expectString(artifacts[0].id)}:content`,
        )
      ).status,
    ).toBe(200);
    expect((await readArtifactsAgent.get(`/api/agent-gateway/runs/${runId}/snapshots:list`)).status).toBe(200);
    expect((await readArtifactsAgent.get(`/api/agent-gateway/runs/${runId}/events:list`)).status).toBe(403);
    expect((await readArtifactsAgent.get(`/api/agent-gateway/runs/${runId}/api-call-logs:list`)).status).toBe(403);

    const readRawLogsAgent = await createUserAgent('agent-gateway-raw-logs-reader', ['agentGateway.readRawLogs']);
    expect((await readRawLogsAgent.get(`/api/agent-gateway/runs/${runId}/events:list`)).status).toBe(200);
    expect((await readRawLogsAgent.get(`/api/agent-gateway/runs/${runId}/api-call-logs:list`)).status).toBe(200);
    expect((await readRawLogsAgent.get(`/api/agent-gateway/runs/${runId}/artifacts:list`)).status).toBe(403);
    expect(
      (
        await readRawLogsAgent.get(
          `/api/agent-gateway/runs/${runId}/artifacts/${expectString(artifacts[0].id)}:content`,
        )
      ).status,
    ).toBe(403);
    expect((await readRawLogsAgent.get(`/api/agent-gateway/runs/${runId}/snapshots:list`)).status).toBe(403);

    const managerAgent = await createUserAgent('agent-gateway-observer-manager', ['agentGateway.manage']);
    expect((await managerAgent.get(`/api/agent-gateway/runs/${runId}/events:list`)).status).toBe(200);
    expect((await managerAgent.get(`/api/agent-gateway/runs/${runId}/artifacts:list`)).status).toBe(200);
    expect((await managerAgent.get(`/api/agent-gateway/runs/${runId}/snapshots:list`)).status).toBe(200);
    expect((await managerAgent.get(`/api/agent-gateway/runs/${runId}/api-call-logs:list`)).status).toBe(200);
    expect((await managerAgent.get('/agRuns:list')).status).toBe(200);

    const memberUser = await app.db.getRepository('users').create({
      values: {
        username: 'agent-gateway-observer-member',
        roles: ['member'],
      },
    });
    const memberAgent = await app.agent().login(memberUser);
    expect((await memberAgent.get('/api/agent-gateway/runs:list')).status).toBe(403);
  });
});
