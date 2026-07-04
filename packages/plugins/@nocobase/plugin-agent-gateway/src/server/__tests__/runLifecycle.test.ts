/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { randomUUID } from 'crypto';

import PluginAgentGatewayServer from '../plugin';
import { createNodeToken, toStoredTokenFields } from '../security';

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
  profileKey: string;
  profileProvider?: string;
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

describe('agent gateway run lifecycle APIs', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let queuedRunOffset = 0;

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
    queuedRunOffset = 0;

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

  async function createRunner(
    options: {
      nodeKey?: string;
      maxConcurrency?: number;
      profileKey?: string;
      profileProvider?: string;
      lastHeartbeatAt?: Date;
    } = {},
  ): Promise<TestRunner> {
    const nodeKey = options.nodeKey || 'node-1';
    const profileKey = options.profileKey || 'fake-success';
    const nodeToken = createNodeToken();
    const now = new Date();
    const lastHeartbeatAt = options.lastHeartbeatAt || now;
    const node = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey,
        displayName: nodeKey,
        status: 'active',
        authMode: 'node-token',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: {
          maxConcurrency: options.maxConcurrency || 1,
        },
        registeredAt: now,
        lastHeartbeatAt,
      },
    });
    const nodeId = String(node.get('id'));
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId,
        profileKey,
        provider: options.profileProvider,
        displayName: profileKey,
        agentType: 'code',
        driver: 'fake',
        status: 'active',
        capabilitiesJson: {
          maxConcurrency: options.maxConcurrency || 1,
        },
      },
    });

    return {
      nodeId,
      nodeToken: nodeToken.token,
      profileId: String(profile.get('id')),
      profileKey,
      profileProvider: options.profileProvider,
    };
  }

  async function createRun(runCode: string, values: Record<string, unknown> = {}) {
    const response = await rootAgent.post('/api/agent-gateway/runs:create').send({
      runCode,
      sourceType: 'test',
      promptSnapshot: {
        text: `Prompt for ${runCode}`,
      },
      executionPayload: {
        task: runCode,
        command: 'must-not-render',
        cwd: '/tmp/must-not-render',
        env: {
          SECRET: 'must-not-render',
        },
      },
      ...values,
    });

    expect(response.status).toBe(200);
    return getData(response);
  }

  async function seedQueuedRun(runCode: string, values: Record<string, unknown> = {}) {
    queuedRunOffset += 1;
    const queuedAt = new Date(Date.now() + queuedRunOffset);
    return await app.db.getRepository('agRuns').create({
      values: {
        runCode,
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        requestedAt: queuedAt,
        queuedAt,
        ...values,
      },
    });
  }

  async function seedActiveRun(runCode: string, values: Record<string, unknown>) {
    const now = new Date();
    return await app.db.getRepository('agRuns').create({
      values: {
        runCode,
        status: 'running',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        requestedAt: now,
        queuedAt: now,
        claimedAt: now,
        startedAt: now,
        claimExpiresAt: new Date(now.getTime() + 60000),
        ...values,
      },
    });
  }

  async function claimRun(runner: TestRunner, values: Record<string, unknown> = {}) {
    return await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs:claim`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        profileKey: 'fake-success',
        capabilities: {
          maxConcurrency: 999,
        },
        ...values,
      });
  }

  async function runDaemonAction(runner: TestRunner, runId: unknown, action: string, values: Record<string, unknown>) {
    return await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/${action}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send(values);
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

  it('creates queued runs without exposing claim token hashes', async () => {
    const run = await createRun('run-create-1');

    expect(run.id).toBeTruthy();
    expect(run.runCode).toBe('run-create-1');
    expect(run.status).toBe('queued');
    expect(run.claimAttempt).toBe(0);
    expect(run.leaseVersion).toBe(0);
    expect(run.cancelRequested).toBe(false);
    expect(run).not.toHaveProperty('claimTokenHash');
    expect(run).not.toHaveProperty('promptSnapshot');
    expect(run).not.toHaveProperty('executionPayloadJson');
    expect(JSON.stringify(run)).not.toContain('must-not-render');

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('promptSnapshot')).toMatchObject({
      text: 'Prompt for run-create-1',
    });
    expect(storedRun.get('executionPayloadJson')).toMatchObject({
      task: 'run-create-1',
      command: 'must-not-render',
      cwd: '/tmp/must-not-render',
      env: {
        SECRET: 'must-not-render',
      },
    });
    expect(storedRun.get('queuedAt')).toBeTruthy();
  });

  it('reroutes manual UI build runs from stale runners to an online matching Codex runner', async () => {
    const staleRunner = await createRunner({
      nodeKey: 'aaa-stale-codex',
      profileKey: 'codex',
      lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000),
    });
    const onlineRunner = await createRunner({
      nodeKey: 'zzz-online-codex',
      profileKey: 'codex',
      profileProvider: 'codex',
    });
    const now = new Date().toISOString();

    await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'manual-ui-build-reroute',
        status: 'queued',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        sourceType: 'manual-ui-build',
        requestedAt: now,
        queuedAt: now,
        nodeId: staleRunner.nodeId,
        agentProfileId: staleRunner.profileId,
        promptSnapshot: {
          text: 'Build a NocoBase page',
        },
        executionPayloadJson: {
          prompt: 'Build a NocoBase page',
          cwd: '.',
        },
      },
    });

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filter: {
        runCode: 'manual-ui-build-reroute',
      },
    });
    expect(storedRun.get('nodeId')).toBe(onlineRunner.nodeId);
    expect(storedRun.get('agentProfileId')).toBe(onlineRunner.profileId);
    expect(storedRun.get('executionPayloadJson')).toMatchObject({
      prompt: 'Build a NocoBase page',
      cwd: '.',
      profileKey: 'codex',
      commandKey: 'codex',
      provider: 'codex',
    });
  });

  it('creates UI build runs with a default Codex runner payload and runner diagnostics', async () => {
    const offlineRunner = await createRunner({
      nodeKey: 'aaa-offline-codex',
      profileKey: 'codex',
      profileProvider: 'codex',
      lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000),
    });
    const runner = await createRunner({
      nodeKey: 'zzz-local-codex',
      profileKey: 'codex',
      profileProvider: 'codex',
    });

    const optionsResponse = await rootAgent.get('/api/agent-gateway/build-runs:options');
    expect(optionsResponse.status).toBe(200);
    const options = getData(optionsResponse);
    const nodes = Array.isArray(options.nodes) ? options.nodes : [];
    expect(options.defaultProfileKey).toBe('codex');
    expect(options.defaultCwd).toBe('.');
    expect(nodes[0]).toMatchObject({
      id: runner.nodeId,
      online: true,
      profiles: [
        expect.objectContaining({
          id: runner.profileId,
          profileKey: 'codex',
          provider: 'codex',
        }),
      ],
    });
    expect(nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: offlineRunner.nodeId,
          online: false,
        }),
      ]),
    );

    const createResponse = await rootAgent.post('/api/agent-gateway/build-runs:create').send({
      title: 'Calendar build',
      prompt: '搭建一个日历测试页面',
      cwd: '/root/work/nocobase',
    });
    expect(createResponse.status).toBe(200);
    const createResult = getData(createResponse);
    expect(createResult).toMatchObject({
      runId: expect.any(String),
      run: expect.objectContaining({
        status: 'queued',
        sourceType: 'ui-build',
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
        runnerStatusJson: expect.objectContaining({
          online: true,
          reason: 'ready',
          profileKey: 'codex',
        }),
      }),
    });

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: String(createResult.runId),
    });
    expect(storedRun.get('promptSnapshot')).toMatchObject({
      renderedPrompt: expect.stringContaining('搭建一个日历测试页面'),
    });
    expect(storedRun.get('executionPayloadJson')).toMatchObject({
      scenario: 'nocobase-ui-build',
      prompt: expect.stringContaining('搭建一个日历测试页面'),
      profileKey: 'codex',
      commandKey: 'codex',
      provider: 'codex',
      cwd: '/root/work/nocobase',
    });

    const reroutedResponse = await rootAgent.post('/api/agent-gateway/build-runs:create').send({
      title: 'Calendar build from stale runner',
      prompt: '搭建另一个日历测试页面',
      nodeId: offlineRunner.nodeId,
      agentProfileId: offlineRunner.profileId,
    });
    expect(reroutedResponse.status).toBe(200);
    const reroutedResult = getData(reroutedResponse);
    expect(reroutedResult).toMatchObject({
      run: expect.objectContaining({
        sourceType: 'ui-build',
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
        runnerStatusJson: expect.objectContaining({
          online: true,
          reason: 'ready',
        }),
      }),
      runnerStatus: expect.objectContaining({
        online: true,
        reason: 'ready',
      }),
    });

    const claimResponse = await claimRun(runner, {
      profileKey: 'codex',
    });
    expect(claimResponse.status).toBe(200);
    const claim = getData(claimResponse);
    expect(claim).toMatchObject({
      claimed: true,
      runId: createResult.runId,
      run: expect.objectContaining({
        executionPayloadJson: expect.objectContaining({
          prompt: expect.stringContaining('搭建一个日历测试页面'),
        }),
      }),
    });
  });

  it('includes agent session capabilities in management run list and details', async () => {
    const now = new Date();
    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: 'codex',
        providerSessionId: `codex-thread-${randomUUID()}`,
        status: 'ended',
        capabilitiesJson: {
          resumeWithMessage: false,
          detectSessionId: true,
        },
      },
    });
    const run = await app.db.getRepository('agRuns').create({
      values: {
        id: randomUUID(),
        runCode: 'run-management-session-capabilities',
        status: 'succeeded',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested: false,
        requestedAt: now,
        queuedAt: now,
        startedAt: now,
        completedAt: now,
        finishedAt: now,
        agentSessionId: session.get('id'),
        agentSessionProvider: 'codex',
        agentSessionProviderId: session.get('providerSessionId'),
      },
    });
    await app.db.getRepository('agAgentSessions').update({
      filterByTk: session.get('id'),
      values: {
        rootRunId: run.get('id'),
        latestRunId: run.get('id'),
      },
    });

    const listResponse = await rootAgent.get('/api/agent-gateway/runs:list');
    expect(listResponse.status).toBe(200);
    const listedRun = (listResponse.body.data as Array<Record<string, unknown>>).find(
      (item) => item.id === run.get('id'),
    );
    expect(listedRun).toMatchObject({
      agentSessionCapabilitiesJson: {
        resumeWithMessage: false,
        detectSessionId: true,
      },
    });

    const detailResponse = await rootAgent.get(`/api/agent-gateway/runs:get/${run.get('id')}`);
    expect(detailResponse.status).toBe(200);
    expect(getData(detailResponse)).toMatchObject({
      agentSessionCapabilitiesJson: {
        resumeWithMessage: false,
        detectSessionId: true,
      },
    });
  });

  it('ignores session and continuation lineage fields when dispatch creates queued runs', async () => {
    const parentRun = await seedQueuedRun('run-parent-for-continuation');
    const continuationRequestedAt = '2026-07-01T00:00:00.000Z';

    const run = await createRun('run-continuation-create-1', {
      agentSessionId: '11111111-1111-4111-8111-111111111111',
      parentRunId: parentRun.get('id'),
      resumedFromRunId: parentRun.get('id'),
      continuationReason: 'user-message',
      continuationMessagePreview: 'Continue from last result',
      continuationMessageHash: 'sha256-preview',
      continuationIdempotencyKey: 'idem-1',
      continuationRequestKey: 'request-1',
      continuationRequestedById: '1',
      continuationRequestedAt,
      agentSessionProvider: 'codex',
      agentSessionProviderId: 'thread-create-1',
    });

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('agentSessionId')).toBeFalsy();
    expect(storedRun.get('parentRunId')).toBeFalsy();
    expect(storedRun.get('resumedFromRunId')).toBeFalsy();
    expect(storedRun.get('continuationReason')).toBeFalsy();
    expect(storedRun.get('continuationMessagePreview')).toBeFalsy();
    expect(storedRun.get('continuationMessageHash')).toBeFalsy();
    expect(storedRun.get('continuationIdempotencyKey')).toBeFalsy();
    expect(storedRun.get('continuationRequestKey')).toBeFalsy();
    expect(storedRun.get('continuationRequestedById')).toBeFalsy();
    expect(storedRun.get('continuationRequestedAt')).toBeFalsy();
    expect(storedRun.get('agentSessionProvider')).toBeFalsy();
    expect(storedRun.get('agentSessionProviderId')).toBeFalsy();
  });

  it('claims a queued run once and enforces persisted node/profile concurrency', async () => {
    const runner = await createRunner();
    const firstRun = await createRun('run-claim-1', {
      agentProfileId: runner.profileId,
    });
    await createRun('run-claim-2', {
      agentProfileId: runner.profileId,
    });

    const claimResponse = await claimRun(runner);
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim.claimed).toBe(true);
    expect(claim.runId).toBe(firstRun.id);
    expect(String(claim.claimToken)).toMatch(/^ag_claim_/);
    expect(claim.claimAttempt).toBe(1);
    expect(claim.leaseVersion).toBe(1);
    expect(claim.nodeCapabilities).toMatchObject({
      maxConcurrency: 1,
    });
    expect(claim.profileCapabilities).toMatchObject({
      maxConcurrency: 1,
    });
    expect(claim.profileKey).toBe(runner.profileKey);
    expect(claim.run).toMatchObject({
      id: firstRun.id,
      promptSnapshot: {
        text: 'Prompt for run-claim-1',
      },
      executionPayloadJson: {
        task: 'run-claim-1',
      },
    });
    expect(String(JSON.stringify(claim.run))).toContain('must-not-render');

    const claimedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: firstRun.id,
    });
    expect(claimedRun.get('status')).toBe('claimed');
    expect(claimedRun.get('nodeId')).toBe(runner.nodeId);
    expect(claimedRun.get('agentProfileId')).toBe(runner.profileId);
    expect(claimedRun.get('claimTokenHash')).not.toBe(claim.claimToken);
    expect(claimedRun.get('claimTokenLast4')).toBe(String(claim.claimToken).slice(-4));

    const secondClaimResponse = await claimRun(runner);
    const secondClaim = getData(secondClaimResponse);
    expect(secondClaimResponse.status).toBe(200);
    expect(secondClaim).toMatchObject({
      claimed: false,
      reason: 'node_concurrency_full',
    });
  });

  it('returns canonical provider separately from a custom profile key during claim', async () => {
    const runner = await createRunner({
      profileKey: 'custom-codex',
      profileProvider: 'codex',
    });
    const run = await createRun('run-custom-provider', {
      agentProfileId: runner.profileId,
    });

    const claimResponse = await claimRun(runner, {
      profileKey: 'custom-codex',
    });
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim).toMatchObject({
      claimed: true,
      runId: run.id,
      profileKey: 'custom-codex',
      profileProvider: 'codex',
    });
  });

  it('enriches dispatch resolved Skill selections with solidified sources for node claims', async () => {
    const runner = await createRunner({
      profileProvider: 'codex',
    });
    const skill = await app.db.getRepository('agSkills').create({
      values: {
        id: randomUUID(),
        skillKey: 'dispatch-selected-skill',
        displayName: 'Dispatch selected Skill',
        status: 'active',
      },
    });
    const skillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        id: randomUUID(),
        skillId: skill.get('id'),
        versionLabel: 'v1',
        status: 'active',
        metadataJson: {
          source: {
            type: 'github',
            repoUrl: 'https://github.com/example/skills',
            commitSha: '0123456789abcdef0123456789abcdef01234567',
            archiveUrl: 'https://github.com/example/skills/archive/0123456789abcdef0123456789abcdef01234567.zip',
            sha256: 'solidified-archive-sha256',
          },
        },
      },
    });
    const run = await seedQueuedRun('run-claim-dispatch-skill', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
      executionPayloadJson: {
        commandKey: 'opencode',
        skillVersion: {
          skillVersionId: skillVersion.get('id'),
          versionLabel: 'evil-inline',
          source: {
            type: 'zip',
            archiveUrl: 'https://evil.example.test/inline.zip',
            sha256: 'evil-inline-sha256',
          },
        },
        skillVersions: [
          {
            skillVersionId: skillVersion.get('id'),
            versionLabel: 'evil-list',
            source: {
              type: 'zip',
              archiveUrl: 'https://evil.example.test/list.zip',
              sha256: 'evil-list-sha256',
            },
          },
          {
            skillVersionId: '99999999-9999-4999-8999-999999999999',
            versionLabel: 'evil-extra',
            source: {
              type: 'zip',
              archiveUrl: 'https://evil.example.test/extra.zip',
              sha256: 'evil-extra-sha256',
            },
          },
        ],
        resolvedSkills: {
          selectedSkill: [
            {
              skillVersionId: skillVersion.get('id'),
              versionLabel: 'v1',
              installStatus: 'installed',
              source: {
                type: 'zip',
                archiveUrl: 'https://evil.example.test/resolved.zip',
                sha256: 'evil-resolved-sha256',
              },
            },
          ],
        },
      },
    });

    const claimResponse = await claimRun(runner);
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim.runId).toBe(run.get('id'));
    expect(claim.run).toMatchObject({
      executionPayloadJson: {
        commandKey: 'opencode',
        skillVersions: [
          {
            skillVersionId: skillVersion.get('id'),
            versionLabel: 'v1',
            status: 'active',
            source: {
              type: 'github',
              repoUrl: 'https://github.com/example/skills',
              archiveUrl: 'https://github.com/example/skills/archive/0123456789abcdef0123456789abcdef01234567.zip',
              sha256: 'solidified-archive-sha256',
            },
          },
        ],
      },
    });
    expect(JSON.stringify(claim.run)).not.toContain('evil.example.test');
    expect(claim.run.executionPayloadJson.skillVersion).toBeUndefined();
    expect(claim.run.executionPayloadJson.resolvedSkills.selectedSkill[0].source).toBeUndefined();
  });

  it('serializes uploaded ZIP Skill sources as node-token archive URLs for claims', async () => {
    const runner = await createRunner();
    const skill = await app.db.getRepository('agSkills').create({
      values: {
        id: randomUUID(),
        skillKey: 'uploaded-zip-skill',
        displayName: 'Uploaded ZIP Skill',
        status: 'active',
      },
    });
    const skillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        id: randomUUID(),
        skillId: skill.get('id'),
        versionLabel: 'zip-v1',
        status: 'active',
        metadataJson: {
          source: {
            type: 'zip',
            archivePath: '/server-only/agent-gateway/uploaded.zip',
            sha256: 'uploaded-zip-sha256',
            sizeBytes: 1024,
            uploadedAt: '2026-07-01T00:00:00.000Z',
          },
        },
      },
    });
    await seedQueuedRun('run-claim-uploaded-zip-skill', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
      executionPayloadJson: {
        commandKey: 'opencode',
        resolvedSkills: {
          selectedSkill: [
            {
              skillVersionId: skillVersion.get('id'),
              versionLabel: 'zip-v1',
            },
          ],
        },
      },
    });

    const claimResponse = await claimRun(runner);
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim.run.executionPayloadJson.skillVersions).toEqual([
      expect.objectContaining({
        skillVersionId: skillVersion.get('id'),
        source: expect.objectContaining({
          type: 'zip',
          archiveUrl: expect.stringContaining(
            `/api/agent-gateway/skill-versions/${skillVersion.get('id')}/archive:download`,
          ),
          auth: 'node-token',
          sha256: 'uploaded-zip-sha256',
          sizeBytes: 1024,
        }),
      }),
    ]);
    expect(JSON.stringify(claim.run)).not.toContain('/server-only/agent-gateway/uploaded.zip');
  });

  it('lets the matching node token upsert Skill install status without allowing node impersonation', async () => {
    const runner = await createRunner();
    const otherRunner = await createRunner({
      nodeKey: 'node-skill-other',
    });
    const skill = await app.db.getRepository('agSkills').create({
      values: {
        id: randomUUID(),
        skillKey: 'skill-sync-test',
        displayName: 'Skill sync test',
        status: 'active',
      },
    });
    const skillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        id: randomUUID(),
        skillId: skill.get('id'),
        versionLabel: 'v1',
        status: 'active',
        metadataJson: {
          source: {
            type: 'zip',
          },
        },
      },
    });

    const forbiddenResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/skill-installs:upsert`)
      .set('Authorization', `Bearer ${otherRunner.nodeToken}`)
      .send({
        skillVersionId: skillVersion.get('id'),
        status: 'installed',
      });
    expect(forbiddenResponse.status).toBe(403);

    const installResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/skill-installs:upsert`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        skillVersionId: skillVersion.get('id'),
        status: 'installed',
        capabilitiesSnapshot: {
          skillRootPath: '/workspace/skills/v1',
        },
        settingsSnapshot: {
          versionLabel: 'v1',
        },
      });
    const install = getData(installResponse);
    expect(installResponse.status).toBe(200);
    expect(install).toMatchObject({
      nodeId: runner.nodeId,
      skillVersionId: skillVersion.get('id'),
      status: 'installed',
      idempotent: false,
    });

    const updateResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/skill-installs:upsert`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        skillVersionId: skillVersion.get('id'),
        status: 'installed',
        capabilitiesSnapshot: {
          skillRootPath: '/workspace/skills/v1',
        },
      });
    expect(updateResponse.status).toBe(200);
    expect(await app.db.getRepository('agNodeSkillInstalls').count()).toBe(1);
  });

  it('lets node tokens create directed OpenCode smoke runs and terminally skip queued smoke runs', async () => {
    const runner = await createRunner({
      nodeKey: 'node-smoke',
      maxConcurrency: 2,
    });
    const olderRun = await seedQueuedRun('run-smoke-older', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });

    const smokeCreateResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/smoke-runs:create`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        profileKey: 'fake-success',
        promptSnapshot: {
          text: 'Run OpenCode smoke token=SMOKE_CREATE_SECRET',
        },
        executionPayload: {
          driver: 'exec',
          skillVersionId: '66666666-6666-4666-8666-666666666666',
        },
      });
    const smokeRun = getData(smokeCreateResponse);
    expect(smokeCreateResponse.status).toBe(200);
    expect(smokeRun).toMatchObject({
      status: 'queued',
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });

    const storedSmokeRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: smokeRun.runId,
    });
    expect(storedSmokeRun.get('sourceType')).toBe('opencode-smoke');
    expect(storedSmokeRun.get('executionPayloadJson')).toMatchObject({
      driver: 'exec',
      profileKey: 'fake-success',
      skillVersionId: '66666666-6666-4666-8666-666666666666',
    });

    const directedClaimResponse = await claimRun(runner, {
      profileKey: 'fake-success',
      runId: smokeRun.runId,
    });
    const directedClaim = getData(directedClaimResponse);
    expect(directedClaimResponse.status).toBe(200);
    expect(directedClaim.runId).toBe(smokeRun.runId);
    expect(directedClaim.runId).not.toBe(olderRun.get('id'));

    const skipCreateResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/smoke-runs:create`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        profileKey: 'fake-success',
        promptSnapshot: {
          text: 'Skip OpenCode smoke',
        },
        executionPayload: {
          driver: 'exec',
        },
      });
    const skipRun = getData(skipCreateResponse);
    const skipResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${skipRun.runId}/skip`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        reason: 'missing_dependency token=SMOKE_SKIP_SECRET',
        resultSummary: {
          reason: 'missing_dependency',
        },
      });
    expect(skipResponse.status).toBe(200);
    expect(getData(skipResponse)).toMatchObject({
      status: 'failed',
      skipped: true,
    });

    const skippedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: skipRun.runId,
    });
    expect(skippedRun.get('status')).toBe('failed');
    expect(skippedRun.get('resultSummaryJson')).toMatchObject({
      reason: 'missing_dependency',
      skipped: true,
    });
    expect(String(skippedRun.get('errorSummary'))).toContain('[REDACTED]');
    expect(skippedRun.get('finishedAt')).toBeTruthy();

    const normalRun = await seedQueuedRun('run-smoke-normal', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
      sourceType: 'test',
    });
    const forbiddenSkipResponse = await app
      .agent()
      .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${normalRun.get('id')}/skip`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        reason: 'must not skip normal runs',
      });
    expect(forbiddenSkipResponse.status).toBe(403);
  });

  it('filters claim candidates by persisted node and profile eligibility before pagination', async () => {
    const otherRunner = await createRunner({
      nodeKey: 'node-other',
    });
    const runner = await createRunner({
      nodeKey: 'node-target',
    });

    for (let index = 0; index < 55; index += 1) {
      await seedQueuedRun(`run-other-node-${index}`, {
        nodeId: otherRunner.nodeId,
        agentProfileId: otherRunner.profileId,
      });
    }
    const claimableRun = await seedQueuedRun('run-target-after-global-page', {
      agentProfileId: runner.profileId,
    });

    const claimResponse = await claimRun(runner);
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim.claimed).toBe(true);
    expect(claim.runId).toBe(claimableRun.get('id'));
  });

  it('skips full profiles and claims later candidates for another active profile', async () => {
    const runner = await createRunner({
      nodeKey: 'node-profile-skip',
      maxConcurrency: 2,
    });
    await app.db.getRepository('agAgentProfiles').update({
      filterByTk: runner.profileId,
      values: {
        capabilitiesJson: {
          maxConcurrency: 1,
        },
      },
    });
    const secondaryProfile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId: runner.nodeId,
        profileKey: 'fake-secondary',
        displayName: 'Fake Secondary',
        agentType: 'code',
        driver: 'fake',
        status: 'active',
        capabilitiesJson: {
          maxConcurrency: 1,
        },
      },
    });
    await seedActiveRun('run-profile-primary-active', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    const blockedRun = await seedQueuedRun('run-profile-primary-blocked', {
      agentProfileId: runner.profileId,
    });
    const claimableRun = await seedQueuedRun('run-profile-secondary-claimable', {
      agentProfileId: String(secondaryProfile.get('id')),
    });

    const claimResponse = await claimRun(runner, {
      profileKey: '',
    });
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim.claimed).toBe(true);
    expect(claim.runId).toBe(claimableRun.get('id'));

    const blocked = await app.db.getRepository('agRuns').findOne({
      filterByTk: blockedRun.get('id'),
    });
    expect(blocked.get('status')).toBe('queued');
  });

  it('extends leases on heartbeat and rejects stale writers without mutation', async () => {
    const staleNodeHeartbeatAt = new Date(Date.now() - 10 * 60 * 1000);
    const runner = await createRunner({
      lastHeartbeatAt: staleNodeHeartbeatAt,
    });
    const run = await createRun('run-heartbeat-1', {
      agentProfileId: runner.profileId,
    });
    const claim = getData(await claimRun(runner));

    const heartbeatResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      status: 'running',
    });
    const heartbeat = getData(heartbeatResponse);
    expect(heartbeatResponse.status).toBe(200);
    expect(heartbeat.status).toBe('running');
    expect(heartbeat.leaseVersion).toBe(2);
    expect(heartbeat.cancelRequested).toBe(false);

    const staleResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      status: 'running',
    });
    expect(staleResponse.status).toBe(409);
    expect(getData(staleResponse)).toMatchObject({
      code: 'lease_lost',
    });

    const wrongTokenResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: 'wrong-claim-token',
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      status: 'running',
    });
    expect(wrongTokenResponse.status).toBe(409);

    const downgradeResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      status: 'syncing_skills',
    });
    const downgrade = getData(downgradeResponse);
    expect(downgradeResponse.status).toBe(200);
    expect(downgrade.status).toBe('running');
    expect(downgrade.leaseVersion).toBe(3);

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    const storedNode = await app.db.getRepository('agNodes').findOne({
      filterByTk: runner.nodeId,
    });
    expect(storedRun.get('status')).toBe('running');
    expect(storedRun.get('leaseVersion')).toBe(3);
    expect(storedRun.get('lastRunHeartbeatAt')).toBeTruthy();
    expect(new Date(String(storedNode.get('lastHeartbeatAt'))).getTime()).toBeGreaterThan(
      staleNodeHeartbeatAt.getTime(),
    );
  });

  it('redacts terminal result and error summaries before exposing them to run readers', async () => {
    const runner = await createRunner({
      profileProvider: 'codex',
    });
    const run = await createRun('run-terminal-redaction-1', {
      agentProfileId: runner.profileId,
    });
    const claim = getData(await claimRun(runner));
    const heartbeat = getData(
      await runDaemonAction(runner, run.id, 'heartbeat', {
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
        status: 'running',
      }),
    );

    const completeResponse = await runDaemonAction(runner, run.id, 'complete', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      resultSummary: {
        command: 'must-not-render',
        cwd: '/tmp/must-not-render',
        env: {
          SECRET: 'must-not-render',
        },
        nested: {
          token: 'RESULT_TOKEN_SECRET',
        },
        safe: 'visible summary',
      },
    });
    expect(completeResponse.status).toBe(200);

    const completedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(completedRun.get('resultSummaryJson')).toMatchObject({
      command: '[REDACTED]',
      cwd: '[REDACTED]',
      env: '[REDACTED]',
      nested: {
        token: '[REDACTED]',
      },
      safe: 'visible summary',
    });

    const completedReadResponse = await rootAgent.get(`/api/agent-gateway/runs:get/${run.id}`);
    expect(JSON.stringify(getData(completedReadResponse))).not.toContain('must-not-render');
    expect(JSON.stringify(getData(completedReadResponse))).not.toContain('RESULT_TOKEN_SECRET');

    const completedApiLogsResponse = await rootAgent.get(`/api/agent-gateway/runs/${run.id}/api-call-logs:list`);
    expect(completedApiLogsResponse.status).toBe(200);
    const completedApiLogs = JSON.stringify(completedApiLogsResponse.body.data);
    expect(completedApiLogs).not.toContain('must-not-render');
    expect(completedApiLogs).not.toContain('RESULT_TOKEN_SECRET');
    expect(completedApiLogs).toContain('[REDACTED]');

    const failedRun = await createRun('run-terminal-redaction-2', {
      agentProfileId: runner.profileId,
    });
    const failedClaim = getData(await claimRun(runner));
    const failResponse = await runDaemonAction(runner, failedRun.id, 'fail', {
      claimToken: failedClaim.claimToken,
      claimAttempt: failedClaim.claimAttempt,
      leaseVersion: failedClaim.leaseVersion,
      resultSummary: {
        commandPath: 'must-not-render',
      },
      errorSummary: 'command=must-not-render cwd=/tmp/must-not-render env.SECRET=must-not-render token=FAIL_SECRET',
    });
    expect(failResponse.status).toBe(200);

    const failedReadResponse = await rootAgent.get(`/api/agent-gateway/runs:get/${failedRun.id}`);
    const failedRead = getData(failedReadResponse);
    expect(JSON.stringify(failedRead)).not.toContain('must-not-render');
    expect(JSON.stringify(failedRead)).not.toContain('FAIL_SECRET');
    expect(String(failedRead.errorSummary)).toContain('[REDACTED]');

    const failedApiLogsResponse = await rootAgent.get(`/api/agent-gateway/runs/${failedRun.id}/api-call-logs:list`);
    expect(failedApiLogsResponse.status).toBe(200);
    const failedApiLogs = JSON.stringify(failedApiLogsResponse.body.data);
    expect(failedApiLogs).not.toContain('must-not-render');
    expect(failedApiLogs).not.toContain('FAIL_SECRET');
    expect(failedApiLogs).toContain('[REDACTED]');
  });

  it('moves running runs through canceling and only cancels them after daemon ack', async () => {
    const runner = await createRunner();
    const run = await createRun('run-cancel-1', {
      agentProfileId: runner.profileId,
    });
    const claim = getData(await claimRun(runner));
    const heartbeat = getData(
      await runDaemonAction(runner, run.id, 'heartbeat', {
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
        status: 'running',
      }),
    );

    const readOnlyAgent = await createUserAgent('agent-gateway-cancel-read-only', ['agentGateway.readRuns']);
    expect((await readOnlyAgent.post(`/api/agent-gateway/runs/${run.id}/cancel`).send({})).status).toBe(403);

    const cancelResponse = await rootAgent.post(`/api/agent-gateway/runs/${run.id}/cancel`).send({});
    const cancel = getData(cancelResponse);
    expect(cancelResponse.status).toBe(200);
    expect(cancel.status).toBe('canceling');
    expect(cancel.cancelRequested).toBe(true);
    expect(cancel.cancelRequestedAt).toBeTruthy();

    const completeWhileCancelingResponse = await runDaemonAction(runner, run.id, 'complete', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      resultSummary: {
        ok: true,
      },
    });
    expect(completeWhileCancelingResponse.status).toBe(409);

    const ackResponse = await runDaemonAction(runner, run.id, 'cancel-ack', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
    });
    const ack = getData(ackResponse);
    expect(ackResponse.status).toBe(200);
    expect(ack.status).toBe('canceled');
    expect(ack.leaseVersion).toBe(3);

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('status')).toBe('canceled');
    expect(storedRun.get('cancelAckAt')).toBeTruthy();
    expect(storedRun.get('canceledAt')).toBeTruthy();
    expect(storedRun.get('finishedAt')).toBeTruthy();

    const cancelAudits = await app.db.getRepository('agAgentActionAudits').find({
      filter: {
        runId: run.id,
        action: 'cancel',
      },
    });
    expect(cancelAudits.map((audit) => audit.toJSON())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          permissionKey: 'agentGateway.cancelRun',
          resultStatus: 'denied',
        }),
        expect.objectContaining({
          permissionKey: 'agentGateway.cancelRun',
          resultStatus: 'accepted',
          metadataJson: expect.objectContaining({
            previousStatus: 'running',
          }),
        }),
        expect.objectContaining({
          permissionKey: 'agentGateway.cancelRun',
          resultStatus: 'succeeded',
          metadataJson: expect.objectContaining({
            status: 'canceling',
          }),
        }),
      ]),
    );

    const failAfterCancelResponse = await runDaemonAction(runner, run.id, 'fail', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: ack.leaseVersion,
      errorSummary: 'late failure',
    });
    expect(failAfterCancelResponse.status).toBe(409);
  });

  it('rejects terminal transitions that skip required active states', async () => {
    const runner = await createRunner();
    const run = await createRun('run-transition-guard-1', {
      agentProfileId: runner.profileId,
    });
    const claim = getData(await claimRun(runner));

    const completeBeforeRunningResponse = await runDaemonAction(runner, run.id, 'complete', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      resultSummary: {
        ok: true,
      },
    });
    expect(completeBeforeRunningResponse.status).toBe(409);

    const timeoutBeforeRunningResponse = await runDaemonAction(runner, run.id, 'timeout', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      errorSummary: 'timeout before process start',
    });
    expect(timeoutBeforeRunningResponse.status).toBe(409);

    const cancelAckBeforeCancelResponse = await runDaemonAction(runner, run.id, 'cancel-ack', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
    });
    expect(cancelAckBeforeCancelResponse.status).toBe(409);

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(storedRun.get('status')).toBe('claimed');
    expect(storedRun.get('leaseVersion')).toBe(1);
    expect(storedRun.get('finishedAt')).toBeFalsy();
  });

  it('cancels queued runs immediately and excludes them from later claims', async () => {
    const runner = await createRunner();
    const run = await createRun('run-queued-cancel-1', {
      agentProfileId: runner.profileId,
    });

    const cancelResponse = await rootAgent.post(`/api/agent-gateway/runs/${run.id}/cancel`).send({});
    const cancel = getData(cancelResponse);
    expect(cancelResponse.status).toBe(200);
    expect(cancel.status).toBe('canceled');
    expect(cancel.finishedAt).toBeTruthy();

    const claimResponse = await claimRun(runner);
    const claim = getData(claimResponse);
    expect(claimResponse.status).toBe(200);
    expect(claim).toMatchObject({
      claimed: false,
      reason: 'no_claimable_run',
    });
  });

  it('marks expired leases abandoned and allows daemon-confirmed process timeout only from active leases', async () => {
    const runner = await createRunner();
    const abandonedRun = await createRun('run-abandon-1', {
      agentProfileId: runner.profileId,
    });
    await claimRun(runner);
    await app.db.getRepository('agRuns').update({
      filterByTk: abandonedRun.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const expireResponse = await rootAgent.post('/api/agent-gateway/runs:expire-leases').send({});
    const expire = getData(expireResponse);
    expect(expireResponse.status).toBe(200);
    expect(expire.abandonedCount).toBe(1);

    const abandoned = await app.db.getRepository('agRuns').findOne({
      filterByTk: abandonedRun.id,
    });
    expect(abandoned.get('status')).toBe('abandoned');
    expect(abandoned.get('finishedAt')).toBeTruthy();

    const timeoutRunner = await createRunner({
      nodeKey: 'node-timeout',
    });
    const timeoutRun = await createRun('run-timeout-1', {
      agentProfileId: timeoutRunner.profileId,
    });
    const timeoutClaim = getData(await claimRun(timeoutRunner));
    const timeoutHeartbeat = getData(
      await runDaemonAction(timeoutRunner, timeoutRun.id, 'heartbeat', {
        claimToken: timeoutClaim.claimToken,
        claimAttempt: timeoutClaim.claimAttempt,
        leaseVersion: timeoutClaim.leaseVersion,
        status: 'running',
      }),
    );
    const timeoutResponse = await runDaemonAction(timeoutRunner, timeoutRun.id, 'timeout', {
      claimToken: timeoutClaim.claimToken,
      claimAttempt: timeoutClaim.claimAttempt,
      leaseVersion: timeoutHeartbeat.leaseVersion,
      errorSummary: 'process timed out after stopping',
    });
    const timeout = getData(timeoutResponse);
    expect(timeoutResponse.status).toBe(200);
    expect(timeout.status).toBe('timeout');

    const completeAfterTimeoutResponse = await runDaemonAction(timeoutRunner, timeoutRun.id, 'complete', {
      claimToken: timeoutClaim.claimToken,
      claimAttempt: timeoutClaim.claimAttempt,
      leaseVersion: timeout.leaseVersion,
      resultSummary: {
        ok: true,
      },
    });
    expect(completeAfterTimeoutResponse.status).toBe(409);

    const timedOut = await app.db.getRepository('agRuns').findOne({
      filterByTk: timeoutRun.id,
    });
    expect(timedOut.get('status')).toBe('timeout');
    expect(timedOut.get('finishedAt')).toBeTruthy();
    expect(timedOut.get('errorSummary')).toBe('process timed out after stopping');
  });
});
