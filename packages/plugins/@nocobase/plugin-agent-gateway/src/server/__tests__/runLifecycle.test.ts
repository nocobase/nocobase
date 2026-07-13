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
    meta?: Record<string, unknown>;
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

function getTime(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  return date.getTime();
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
    const profileProvider = options.profileProvider || (profileKey === 'codex' ? 'codex' : 'generic-cli');
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
        provider: profileProvider,
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
      profileProvider,
    };
  }

  async function createRun(runCode: string, values: Record<string, unknown> = {}) {
    const profile = values.agentProfileId
      ? await app.db.getRepository('agAgentProfiles').findOne({
          filterByTk: values.agentProfileId,
        })
      : null;
    const executionPolicyKey = profile ? String(profile.get('profileKey')) : 'fake-success';
    const provider = profile ? String(profile.get('provider')) : 'generic-cli';
    const capabilitiesSnapshotJson = profile ? profile.get('capabilitiesJson') : {};
    const response = await rootAgent.post('/agentGatewayApi:createRun').send({
      runCode,
      sourceType: 'test',
      promptSnapshot: {
        text: `Prompt for ${runCode}`,
      },
      provider,
      capabilitiesSnapshotJson,
      executionPolicyKey,
      executionPayloadJson: {
        executionPolicyKey,
        task: runCode,
        prompt: `Prompt for ${runCode}`,
        cwd: '.',
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
      .post(`/agentGatewayApi:claimRun/${runner.nodeId}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        profileKey: runner.profileKey,
        ...values,
      });
  }

  async function runDaemonAction(runner: TestRunner, runId: unknown, action: string, values: Record<string, unknown>) {
    const resourceActionByLegacyAction: Record<string, string> = {
      heartbeat: 'heartbeatRun',
      complete: 'completeRun',
      fail: 'failRun',
      timeout: 'timeoutRun',
      'cancel-ack': 'ackCancelRun',
    };
    return await app
      .agent()
      .post(`/agentGatewayApi:${resourceActionByLegacyAction[action]}/${runId}`)
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
      executionPolicyKey: 'fake-success',
      task: 'run-create-1',
      prompt: 'Prompt for run-create-1',
      cwd: '.',
    });
    expect(storedRun.get('queuedAt')).toBeTruthy();
  });

  it.each([
    ['extraArgs', ['--add-dir', '/tmp']],
    ['args', ['--sandbox', 'danger-full-access']],
    ['env', { UNDECLARED_SECRET: 'secret' }],
    ['commandKey', 'codex'],
    ['cwd', '/tmp'],
  ])('rejects unsafe remote execution field %s without creating a run', async (field, value) => {
    const before = await app.db.getRepository('agRuns').count();
    const response = await rootAgent.post('/agentGatewayApi:createRun').send({
      runCode: `run-reject-${field}`,
      sourceType: 'test',
      provider: 'codex',
      capabilitiesSnapshotJson: {},
      executionPolicyKey: 'codex',
      executionPayloadJson: {
        executionPolicyKey: 'codex',
        prompt: 'Safe prompt',
        cwd: '.',
        [field]: value,
      },
    });

    expect(response.status).toBe(400);
    expect(await app.db.getRepository('agRuns').count()).toBe(before);
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
        provider: 'codex',
        capabilitiesSnapshotJson: {},
        executionPolicyKey: 'codex',
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
      executionPolicyKey: 'codex',
    });
  });

  it('creates task runs through the build-runs route with a default Codex runner payload and runner diagnostics', async () => {
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

    const optionsResponse = await rootAgent.get('/agentGatewayApi:listRunOptions');
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
          onlineReason: 'heartbeat-stale',
        }),
      ]),
    );

    const createResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      title: 'Calendar build',
      prompt: '搭建一个日历测试页面',
      cwd: '.',
    });
    expect(createResponse.status).toBe(200);
    const createResult = getData(createResponse);
    expect(createResult).toMatchObject({
      runId: expect.any(String),
      run: expect.objectContaining({
        status: 'queued',
        sourceType: 'task-run',
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
      prompt: expect.stringContaining('搭建一个日历测试页面'),
      executionPolicyKey: 'codex',
      cwd: '.',
    });
    const initialConversationEvents = await app.db.getRepository('agAgentConversationEvents').find({
      filter: {
        runId: String(createResult.runId),
      },
      sort: ['sequence'],
    });
    expect(initialConversationEvents).toHaveLength(1);
    expect(initialConversationEvents[0].get('eventType')).toBe('agent.user.message');
    expect(initialConversationEvents[0].get('source')).toBe('agent-gateway-task');
    expect(initialConversationEvents[0].get('contentText')).toContain('搭建一个日历测试页面');
    expect(initialConversationEvents[0].get('contentJson')).toMatchObject({
      title: 'Calendar build',
    });

    const reroutedResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      title: 'Calendar build from stale runner',
      prompt: '搭建另一个日历测试页面',
      nodeId: offlineRunner.nodeId,
      agentProfileId: offlineRunner.profileId,
    });
    expect(reroutedResponse.status).toBe(200);
    const reroutedResult = getData(reroutedResponse);
    expect(reroutedResult).toMatchObject({
      run: expect.objectContaining({
        sourceType: 'task-run',
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

  it('rejects task run creation when no online runner can claim it', async () => {
    const offlineRunner = await createRunner({
      nodeKey: 'offline-codex-only',
      profileKey: 'codex',
      profileProvider: 'codex',
      lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000),
    });

    const createResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      title: 'Queued forever prevention',
      prompt: 'This should not be queued when the daemon is offline',
      nodeId: offlineRunner.nodeId,
      agentProfileId: offlineRunner.profileId,
    });

    expect(createResponse.status).toBe(409);
    expect(JSON.stringify(createResponse.body)).toContain('Selected Agent Gateway runner is offline');
    expect(await app.db.getRepository('agRuns').count()).toBe(0);

    const implicitCreateResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      title: 'Implicit runner also blocked',
      prompt: 'This should also fail without an online runner',
    });

    expect(implicitCreateResponse.status).toBe(409);
    expect(JSON.stringify(implicitCreateResponse.body)).toContain('No online Agent Gateway runner is available');
    expect(await app.db.getRepository('agRuns').count()).toBe(0);
  });

  it('lists task templates and applies selected template defaults to task runs', async () => {
    const runner = await createRunner({
      nodeKey: 'remote-187-codex',
      profileKey: 'codex',
      profileProvider: 'codex',
    });

    const optionsResponse = await rootAgent.get('/agentGatewayApi:listRunOptions');
    expect(optionsResponse.status).toBe(200);
    const options = getData(optionsResponse);
    const taskTemplates = Array.isArray(options.taskTemplates) ? options.taskTemplates : [];
    expect(taskTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          templateKey: 'generic',
        }),
        expect.objectContaining({
          templateKey: 'nocobase-ui-build',
        }),
        expect.objectContaining({
          templateKey: 'opencode-ui-batch',
        }),
      ]),
    );

    const createTemplateResponse = await rootAgent.post('/agentGatewayApi:createTaskTemplate').send({
      templateKey: 'build-on-187',
      displayName: 'Build on 187',
      description: 'Browser validation build template',
      defaultTitle: '187 browser validation',
      defaultPrompt: '搭建一个用于浏览器验收的任务页面',
      cwd: '/root/work/nocobase',
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
      artifactRoot: 'storage/agent-gateway',
      artifactsJson: [
        {
          glob: 'screenshots/**/*.png',
          groupLabel: 'Screenshots',
        },
      ],
    });
    expect(createTemplateResponse.status).toBe(200);
    const createdTemplate = getData(createTemplateResponse);
    expect(createdTemplate).toMatchObject({
      templateKey: 'build-on-187',
      displayName: 'Build on 187',
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });

    const listResponse = await rootAgent.get('/agentGatewayApi:listTaskTemplates?includeDisabled=true');
    expect(listResponse.status).toBe(200);
    const listedTemplates = Array.isArray(listResponse.body.data) ? listResponse.body.data : [];
    expect(listedTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          templateKey: 'build-on-187',
        }),
      ]),
    );

    const createRunResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      taskTemplateId: createdTemplate.id,
    });
    expect(createRunResponse.status).toBe(200);
    const createRunResult = getData(createRunResponse);
    expect(createRunResult).toMatchObject({
      runId: expect.any(String),
      run: expect.objectContaining({
        sourceType: 'task-run',
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
      }),
    });

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: String(createRunResult.runId),
    });
    expect(storedRun.get('taskTemplateId')).toBe(createdTemplate.id);
    expect(storedRun.get('promptSnapshot')).toMatchObject({
      renderedPrompt: expect.stringContaining('搭建一个用于浏览器验收的任务页面'),
      variables: expect.objectContaining({
        title: '187 browser validation',
        taskTemplateKey: 'build-on-187',
      }),
    });
    expect(storedRun.get('executionPayloadJson')).toMatchObject({
      title: '187 browser validation',
      instruction: '搭建一个用于浏览器验收的任务页面',
      cwd: '/root/work/nocobase',
      artifactRoot: 'storage/agent-gateway',
      artifacts: [
        {
          glob: 'screenshots/**/*.png',
          groupLabel: 'Screenshots',
        },
      ],
      taskTemplate: {
        id: createdTemplate.id,
        key: 'build-on-187',
        displayName: 'Build on 187',
      },
    });

    const updateTemplateResponse = await rootAgent
      .post(`/agentGatewayApi:updateTaskTemplate/${createdTemplate.id}`)
      .send({
        status: 'disabled',
      });
    expect(updateTemplateResponse.status).toBe(200);
    expect(getData(updateTemplateResponse)).toMatchObject({
      status: 'disabled',
    });

    const disabledCreateResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      taskTemplateKey: 'build-on-187',
    });
    expect(disabledCreateResponse.status).toBe(409);
    expect(JSON.stringify(disabledCreateResponse.body)).toContain('Task template is not active');
  });

  it('creates task runs with selected skill versions and artifact declarations', async () => {
    const runner = await createRunner({
      nodeKey: 'generic-task-codex',
      profileKey: 'codex',
      profileProvider: 'codex',
    });
    const installableSkillSource = {
      type: 'zip',
      sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      storageId: 1,
      objectPath: 'agent-gateway/skills/aa',
      objectFilename: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.zip',
      objectKey: 'agent-gateway/skills/aa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.zip',
      sizeBytes: 1024,
    };
    const activeSkill = await app.db.getRepository('agSkills').create({
      values: {
        id: randomUUID(),
        skillKey: 'nb-opencode-ui-batch',
        displayName: 'NB OpenCode UI Batch',
        status: 'active',
      },
    });
    const activeSkillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        id: randomUUID(),
        skillId: activeSkill.get('id'),
        versionLabel: 'v1',
        status: 'active',
        metadataJson: {
          source: installableSkillSource,
        },
      },
    });
    const otherSkill = await app.db.getRepository('agSkills').create({
      values: {
        id: randomUUID(),
        skillKey: 'other-skill',
        displayName: 'Other Skill',
        status: 'active',
      },
    });
    const otherSkillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        id: randomUUID(),
        skillId: otherSkill.get('id'),
        versionLabel: 'v1',
        status: 'active',
        metadataJson: {
          source: installableSkillSource,
        },
      },
    });
    const inactiveSkill = await app.db.getRepository('agSkills').create({
      values: {
        id: randomUUID(),
        skillKey: 'disabled-skill',
        displayName: 'Disabled Skill',
        status: 'inactive',
      },
    });
    const inactiveSkillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        id: randomUUID(),
        skillId: inactiveSkill.get('id'),
        versionLabel: 'v1',
        status: 'active',
        metadataJson: {},
      },
    });

    const optionsResponse = await rootAgent.get('/agentGatewayApi:listRunOptions');
    expect(optionsResponse.status).toBe(200);
    const options = getData(optionsResponse);
    expect(options).toMatchObject({
      defaultProfileKey: 'codex',
      defaultCwd: '.',
      skillVersions: expect.arrayContaining([
        expect.objectContaining({
          id: activeSkillVersion.get('id'),
          skillKey: 'nb-opencode-ui-batch',
          displayName: 'NB OpenCode UI Batch',
          versionLabel: 'v1',
        }),
      ]),
    });
    expect(JSON.stringify(options)).not.toContain(String(inactiveSkillVersion.get('id')));

    const inactiveSkillResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      title: 'Inactive skill evaluation',
      prompt: '运行 nb-opencode-ui-batch harness 并汇总结果',
      skillVersionIds: [inactiveSkillVersion.get('id')],
      cwd: 'myskills/skills/nb-opencode-ui-batch',
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    expect(inactiveSkillResponse.status).toBe(409);

    const createResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      title: 'Batch evaluation',
      prompt: '运行 nb-opencode-ui-batch harness 并汇总结果',
      skillVersionIds: [otherSkillVersion.get('id'), activeSkillVersion.get('id'), activeSkillVersion.get('id')],
      cwd: 'myskills/skills/nb-opencode-ui-batch',
      artifactRoot: '../..',
      artifacts: [
        {
          glob: 'runs/nb-opencode-ui-batch/*/report.html',
          groupLabel: 'Reports',
        },
        {
          glob: 'runs/nb-opencode-ui-batch/*/browser-screenshots/**/*',
          groupLabel: 'Screenshots',
        },
      ],
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    expect(createResponse.status).toBe(200);
    const createResult = getData(createResponse);
    expect(createResult).toMatchObject({
      runId: expect.any(String),
      run: expect.objectContaining({
        status: 'queued',
        sourceType: 'task-run',
        nodeId: runner.nodeId,
        agentProfileId: runner.profileId,
      }),
    });

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: String(createResult.runId),
    });
    expect(storedRun.get('promptSnapshot')).toMatchObject({
      renderedPrompt: '运行 nb-opencode-ui-batch harness 并汇总结果',
      variables: expect.objectContaining({
        title: 'Batch evaluation',
      }),
    });
    expect(storedRun.get('executionPayloadJson')).toMatchObject({
      prompt: '运行 nb-opencode-ui-batch harness 并汇总结果',
      instruction: '运行 nb-opencode-ui-batch harness 并汇总结果',
      executionPolicyKey: 'codex',
      cwd: 'myskills/skills/nb-opencode-ui-batch',
      artifactRoot: '../..',
      artifacts: [
        {
          glob: 'runs/nb-opencode-ui-batch/*/report.html',
          groupLabel: 'Reports',
        },
        {
          glob: 'runs/nb-opencode-ui-batch/*/browser-screenshots/**/*',
          groupLabel: 'Screenshots',
        },
      ],
      resolvedSkills: [
        {
          skillVersionId: otherSkillVersion.get('id'),
        },
        {
          skillVersionId: activeSkillVersion.get('id'),
        },
      ],
    });
    const initialConversationEvents = await app.db.getRepository('agAgentConversationEvents').find({
      filter: {
        runId: String(createResult.runId),
      },
      sort: ['sequence'],
    });
    expect(initialConversationEvents).toHaveLength(1);
    expect(initialConversationEvents[0].get('eventType')).toBe('agent.user.message');
    expect(initialConversationEvents[0].get('source')).toBe('agent-gateway-task');
    expect(initialConversationEvents[0].get('contentText')).toContain('运行 nb-opencode-ui-batch harness 并汇总结果');
    expect(initialConversationEvents[0].get('contentJson')).toMatchObject({
      title: 'Batch evaluation',
    });
  });

  it('uses the persisted run capability snapshot in management run list and details', async () => {
    const now = new Date();
    const session = await app.db.getRepository('agAgentSessions').create({
      values: {
        id: randomUUID(),
        provider: 'codex',
        providerSessionId: `codex-thread-${randomUUID()}`,
        status: 'ended',
        capabilitiesJson: {
          resumeWithMessage: false,
          detectSessionId: false,
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
        provider: 'codex',
        capabilitiesSnapshotJson: {
          resumeWithMessage: false,
          detectSessionId: true,
        },
        executionPolicyKey: 'codex',
        agentSessionId: session.get('id'),
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

    const listResponse = await rootAgent.get('/agentGatewayApi:listRuns');
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

    const detailResponse = await rootAgent.get(`/agentGatewayApi:getRun/${run.get('id')}`);
    expect(detailResponse.status).toBe(200);
    expect(getData(detailResponse)).toMatchObject({
      agentSessionCapabilitiesJson: {
        resumeWithMessage: false,
        detectSessionId: true,
      },
    });
  });

  it('paginates the management run list with total metadata', async () => {
    await seedQueuedRun('run-list-page-1', {
      createdAt: new Date('2026-07-01T00:00:01.000Z'),
    });
    await seedQueuedRun('run-list-page-2', {
      createdAt: new Date('2026-07-01T00:00:02.000Z'),
    });
    await seedQueuedRun('run-list-page-3', {
      createdAt: new Date('2026-07-01T00:00:03.000Z'),
    });

    const listResponse = await rootAgent.get('/agentGatewayApi:listRuns?page=2&pageSize=2');

    expect(listResponse.status).toBe(200);
    expect((listResponse.body.data as Array<Record<string, unknown>>).map((run) => run.runCode)).toEqual([
      'run-list-page-1',
    ]);
    expect(listResponse.body.meta).toMatchObject({
      count: 3,
      page: 2,
      pageSize: 2,
      totalPage: 2,
    });
  });

  it('supports the standard collection filter payload on the management run list', async () => {
    await seedQueuedRun('run-filter-queued', {
      createdAt: new Date('2026-07-01T00:00:01.000Z'),
    });
    await seedQueuedRun('run-filter-succeeded', {
      status: 'succeeded',
      createdAt: new Date('2026-07-01T00:00:02.000Z'),
    });

    const listResponse = await rootAgent.get('/agentGatewayApi:listRuns').query({
      filter: JSON.stringify({
        $and: [
          {
            status: {
              $eq: 'succeeded',
            },
          },
        ],
      }),
    });

    expect(listResponse.status).toBe(200);
    expect((listResponse.body.data as Array<Record<string, unknown>>).map((run) => run.runCode)).toEqual([
      'run-filter-succeeded',
    ]);
    expect(listResponse.body.meta).toMatchObject({
      count: 1,
      page: 1,
      pageSize: 50,
      totalPage: 1,
    });
  });

  it('lists management runs with task template summaries and supports template sorting', async () => {
    const skill = await app.db.getRepository('agSkills').create({
      values: {
        id: randomUUID(),
        skillKey: 'template-skill',
        displayName: 'Template Skill',
        status: 'active',
      },
    });
    const skillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        id: randomUUID(),
        skillId: skill.get('id'),
        versionLabel: 'v1',
        status: 'active',
        metadataJson: {},
      },
    });
    const template = await app.db.getRepository('agTaskTemplates').create({
      values: {
        id: randomUUID(),
        templateKey: 'template-run-filter',
        displayName: 'Template run filter',
        status: 'active',
        defaultTitle: '',
        defaultPrompt: '',
        cwd: '.',
        skillVersionIdsJson: [skillVersion.get('id')],
        artifactsJson: [],
        metadataJson: {},
      },
    });
    const otherTemplate = await app.db.getRepository('agTaskTemplates').create({
      values: {
        id: randomUUID(),
        templateKey: 'other-template-run-filter',
        displayName: 'Other template',
        status: 'active',
        defaultTitle: '',
        defaultPrompt: '',
        cwd: '.',
        skillVersionIdsJson: [],
        artifactsJson: [],
        metadataJson: {},
      },
    });

    await seedQueuedRun('run-template-sort-b', {
      taskTemplateId: template.get('id'),
      createdAt: new Date('2026-07-01T00:00:01.000Z'),
    });
    await seedQueuedRun('run-template-sort-a', {
      taskTemplateId: template.get('id'),
      createdAt: new Date('2026-07-01T00:00:02.000Z'),
    });
    await seedQueuedRun('run-template-sort-other', {
      taskTemplateId: otherTemplate.get('id'),
      createdAt: new Date('2026-07-01T00:00:03.000Z'),
    });

    const listResponse = await rootAgent.get('/agentGatewayApi:listRuns').query({
      filter: JSON.stringify({
        taskTemplateId: {
          $eq: template.get('id'),
        },
      }),
      sort: 'runCode',
    });

    expect(listResponse.status).toBe(200);
    const runs = listResponse.body.data as Array<Record<string, unknown>>;
    expect(runs.map((run) => run.runCode)).toEqual(['run-template-sort-a', 'run-template-sort-b']);
    expect(runs[0]).toMatchObject({
      taskTemplateId: template.get('id'),
      taskTemplateJson: {
        id: template.get('id'),
        templateKey: 'template-run-filter',
        displayName: 'Template run filter',
        skillVersionIds: [skillVersion.get('id')],
        skills: [
          {
            id: skillVersion.get('id'),
            skillId: skill.get('id'),
            skillKey: 'template-skill',
            displayName: 'Template Skill',
            versionLabel: 'v1',
            status: 'active',
          },
        ],
      },
    });
    expect(listResponse.body.meta).toMatchObject({
      count: 2,
      taskTemplates: expect.arrayContaining([
        expect.objectContaining({
          id: template.get('id'),
          templateKey: 'template-run-filter',
          displayName: 'Template run filter',
        }),
      ]),
    });
  });

  it('rejects session and continuation lineage fields on canonical run creation', async () => {
    const parentRun = await seedQueuedRun('run-parent-for-continuation');
    const continuationRequestedAt = '2026-07-01T00:00:00.000Z';

    const response = await rootAgent.post('/agentGatewayApi:createRun').send({
      runCode: 'run-continuation-create-1',
      sourceType: 'test',
      provider: 'generic-cli',
      capabilitiesSnapshotJson: {},
      executionPolicyKey: 'fake-success',
      executionPayloadJson: {
        executionPolicyKey: 'fake-success',
        prompt: 'Prompt for run-continuation-create-1',
        cwd: '.',
      },
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
      agentSessionProviderId: 'thread-create-1',
    });
    expect(response.status).toBe(400);
    expect(await app.db.getRepository('agRuns').count({ filter: { runCode: 'run-continuation-create-1' } })).toBe(0);
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
    expect(claim.leaseTtlMs).toBe(60_000);
    expect(Date.parse(String(claim.serverTime))).toBeGreaterThan(0);
    expect(Date.parse(String(claim.claimExpiresAt)) - Date.parse(String(claim.serverTime))).toBe(claim.leaseTtlMs);
    expect(claim).not.toHaveProperty('nodeCapabilities');
    expect(claim.profileCapabilities).toEqual({
      structuredEvents: false,
      liveSemanticMessage: false,
      resumeSession: false,
      resumeWithMessage: false,
      stdinMessage: false,
      detectSessionId: false,
      terminalOutput: true,
      artifacts: false,
      interrupt: false,
      terminate: true,
    });
    expect(claim.executionPolicyKey).toBe(runner.profileKey);
    expect(claim.run).toMatchObject({
      id: firstRun.id,
      status: 'claimed',
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
      claimAttempt: 1,
      leaseVersion: 1,
      promptSnapshot: {
        text: 'Prompt for run-claim-1',
      },
      executionPayloadJson: {
        executionPolicyKey: 'fake-success',
        task: 'run-claim-1',
      },
    });
    expect(String(JSON.stringify(claim))).not.toContain('must-not-render');

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

  it('keeps stalled leases in concurrency and lets the same daemon resume before claiming new work', async () => {
    const runner = await createRunner();
    const expiredRun = await createRun('run-claim-recovery-expired', {
      agentProfileId: runner.profileId,
    });
    const firstClaim = getData(await claimRun(runner));
    expect(firstClaim.claimed).toBe(true);
    expect(firstClaim.runId).toBe(expiredRun.id);

    await app.db.getRepository('agRuns').update({
      filterByTk: expiredRun.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const queuedRun = await createRun('run-claim-recovery-next', {
      agentProfileId: runner.profileId,
    });
    const secondClaim = getData(await claimRun(runner));
    expect(secondClaim).toMatchObject({
      claimed: false,
      reason: 'node_concurrency_full',
    });

    const recoveredRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: expiredRun.id,
    });
    expect(recoveredRun.get('status')).toBe('stalled');
    expect(recoveredRun.get('finishedAt')).toBeFalsy();
    expect(getTime(recoveredRun.get('claimExpiresAt'))).toBeGreaterThan(Date.now());

    const recoveryEvent = await app.db.getRepository('agRunEvents').findOne({
      filter: {
        runId: expiredRun.id,
        eventType: 'run.lease.stalled',
      },
    });
    expect(recoveryEvent).toBeTruthy();
    expect(recoveryEvent.get('payloadJson')).toMatchObject({
      reason: 'before-claim',
      previousStatus: 'claimed',
      nextStatus: 'stalled',
    });

    const resumedHeartbeatResponse = await runDaemonAction(runner, expiredRun.id, 'heartbeat', {
      claimToken: firstClaim.claimToken,
      claimAttempt: firstClaim.claimAttempt,
      leaseVersion: firstClaim.leaseVersion,
      status: 'running',
    });
    const resumedHeartbeat = getData(resumedHeartbeatResponse);
    expect(resumedHeartbeatResponse.status).toBe(200);
    expect(resumedHeartbeat).toMatchObject({
      status: 'running',
      leaseVersion: 2,
    });

    const completeResponse = await runDaemonAction(runner, expiredRun.id, 'complete', {
      claimToken: firstClaim.claimToken,
      claimAttempt: firstClaim.claimAttempt,
      leaseVersion: resumedHeartbeat.leaseVersion,
      resultSummaryJson: {
        recovered: true,
      },
    });
    expect(completeResponse.status).toBe(200);

    const thirdClaim = getData(await claimRun(runner));
    expect(thirdClaim.claimed).toBe(true);
    expect(thirdClaim.runId).toBe(queuedRun.id);
  });

  it('returns only the custom execution policy key and capability summary during claim', async () => {
    const runner = await createRunner({
      profileKey: 'custom-codex',
      profileProvider: 'codex',
    });
    const run = await createRun('run-custom-provider', {
      agentProfileId: runner.profileId,
      executionPayloadJson: {
        executionPolicyKey: 'custom-codex',
        prompt: 'Prompt for run-custom-provider',
        cwd: '.',
      },
    });

    const claimResponse = await claimRun(runner, {
      profileKey: 'custom-codex',
    });
    const claim = getData(claimResponse);

    expect(claimResponse.status).toBe(200);
    expect(claim).toMatchObject({
      claimed: true,
      runId: run.id,
      executionPolicyKey: 'custom-codex',
      profileCapabilities: {},
    });
    expect(claim).not.toHaveProperty('profileProvider');
  });

  it('enriches dispatch resolved Skill selections with solidified sources for node claims', async () => {
    const runner = await createRunner({
      profileKey: 'opencode',
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
        executionPolicyKey: 'opencode',
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
        executionPolicyKey: 'opencode',
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
              capabilityToken: expect.stringMatching(/^ag_skill_/),
              capabilityExpiresAt: claim.claimExpiresAt,
              capabilityReplayPolicy: 'active-claim-lifetime',
              runId: claim.runId,
              claimAttempt: 1,
            },
          },
        ],
      },
    });
    expect(JSON.stringify(claim.run)).not.toContain('evil.example.test');
    expect(claim.run.executionPayloadJson.skillVersion).toBeUndefined();
    expect(claim.run.executionPayloadJson.resolvedSkills.selectedSkill[0].source).toBeUndefined();
  });

  it('issues hash-only claim-scoped capabilities for uploaded ZIP Skill sources', async () => {
    const runner = await createRunner({
      profileKey: 'opencode',
    });
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
            storageId: 1,
            objectPath: 'agent-gateway/skills/up',
            objectFilename: 'uploaded-zip-sha256.zip',
            objectKey: 'agent-gateway/skills/up/uploaded-zip-sha256.zip',
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
        executionPolicyKey: 'opencode',
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
          archiveUrl: expect.stringContaining(`/agentGatewayApi:downloadSkillVersion/${skillVersion.get('id')}`),
          auth: 'skill-capability',
          capabilityToken: expect.stringMatching(/^ag_skill_/),
          capabilityExpiresAt: claim.claimExpiresAt,
          capabilityReplayPolicy: 'active-claim-lifetime',
          runId: claim.runId,
          claimAttempt: 1,
          sha256: 'uploaded-zip-sha256',
          sizeBytes: 1024,
        }),
      }),
    ]);
    expect(JSON.stringify(claim.run)).not.toContain('/server-only/agent-gateway/uploaded.zip');
    const source = claim.run.executionPayloadJson.skillVersions[0].source;
    const archiveUrl = new URL(String(source.archiveUrl));
    expect(archiveUrl.searchParams.get('runId')).toBe(String(claim.runId));
    expect(archiveUrl.searchParams.get('claimAttempt')).toBe('1');
    const capability = await app.db.getRepository('agSkillDownloadCapabilities').findOne({
      filter: {
        runId: claim.runId,
      },
    });
    expect(capability).toBeTruthy();
    expect(capability.get('nodeId')).toBe(runner.nodeId);
    expect(capability.get('claimAttempt')).toBe(1);
    expect(capability.get('skillVersionId')).toBe(skillVersion.get('id'));
    expect(capability.get('sha256')).toBe('uploaded-zip-sha256');
    expect(capability.get('tokenHash')).not.toBe(source.capabilityToken);
    expect(JSON.stringify(capability.toJSON())).not.toContain(String(source.capabilityToken));

    const cancelResponse = await rootAgent.post(`/agentGatewayApi:cancelRun/${claim.runId}`).send({});
    expect(cancelResponse.status).toBe(200);
    expect(await app.db.getRepository('agSkillDownloadCapabilities').count()).toBe(0);

    await app.db.getRepository('agRuns').update({
      filterByTk: claim.runId,
      values: {
        status: 'queued',
        cancelRequested: false,
        cancelRequestedAt: null,
        claimExpiresAt: null,
      },
    });
    const reclaimed = getData(await claimRun(runner, { runId: claim.runId }));
    const reclaimedSource = reclaimed.run.executionPayloadJson.skillVersions[0].source;
    expect(reclaimed.claimAttempt).toBe(2);
    expect(reclaimedSource.capabilityToken).not.toBe(source.capabilityToken);
    expect(await app.db.getRepository('agSkillDownloadCapabilities').count()).toBe(1);
  });

  it('requires a current assignment capability for the first Skill install status report', async () => {
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
            type: 'github',
            repoUrl: 'https://github.com/example/skill-sync-test',
            commitSha: 'a'.repeat(40),
            archiveUrl: `https://github.com/example/skill-sync-test/archive/${'a'.repeat(40)}.zip`,
            sha256: 'a'.repeat(64),
          },
        },
      },
    });
    await seedQueuedRun('run-skill-install-assignment', {
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
      executionPayloadJson: {
        executionPolicyKey: runner.profileKey,
        resolvedSkills: [{ skillVersionId: skillVersion.get('id') }],
      },
    });
    const claim = getData(await claimRun(runner));
    const source = claim.run.executionPayloadJson.skillVersions[0].source;

    const forbiddenResponse = await app
      .agent()
      .post(`/agentGatewayApi:upsertNodeSkillInstall/${runner.nodeId}`)
      .set('Authorization', `Bearer ${otherRunner.nodeToken}`)
      .send({
        skillVersionId: skillVersion.get('id'),
        status: 'installed',
      });
    expect(forbiddenResponse.status).toBe(403);

    const unassignedSkillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        id: randomUUID(),
        skillId: skill.get('id'),
        versionLabel: 'v2',
        status: 'active',
        metadataJson: {
          source: {
            type: 'github',
            repoUrl: 'https://github.com/example/skill-sync-test',
            commitSha: 'b'.repeat(40),
            archiveUrl: `https://github.com/example/skill-sync-test/archive/${'b'.repeat(40)}.zip`,
            sha256: 'b'.repeat(64),
          },
        },
      },
    });
    const forgedResponse = await app
      .agent()
      .post(`/agentGatewayApi:upsertNodeSkillInstall/${runner.nodeId}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        skillVersionId: unassignedSkillVersion.get('id'),
        status: 'installed',
        capabilityToken: source.capabilityToken,
        runId: claim.runId,
        claimAttempt: claim.claimAttempt,
        sourceSha256: 'b'.repeat(64),
      });
    expect(forgedResponse.status).toBe(404);

    const installResponse = await app
      .agent()
      .post(`/agentGatewayApi:upsertNodeSkillInstall/${runner.nodeId}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        skillVersionId: skillVersion.get('id'),
        status: 'installed',
        capabilityToken: source.capabilityToken,
        runId: claim.runId,
        claimAttempt: claim.claimAttempt,
        sourceSha256: source.sha256,
        capabilitiesSnapshotJson: {
          skillRootPath: '/workspace/skills/v1',
        },
        settingsSnapshotJson: {
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
      assignedRunId: claim.runId,
      assignedClaimAttempt: claim.claimAttempt,
    });

    const updateResponse = await app
      .agent()
      .post(`/agentGatewayApi:upsertNodeSkillInstall/${runner.nodeId}`)
      .set('Authorization', `Bearer ${runner.nodeToken}`)
      .send({
        skillVersionId: skillVersion.get('id'),
        status: 'installed',
        capabilitiesSnapshotJson: {
          skillRootPath: '/workspace/skills/v1',
        },
      });
    expect(updateResponse.status).toBe(200);
    expect(await app.db.getRepository('agNodeSkillInstalls').count()).toBe(1);
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
        executionPayloadJson: {
          executionPolicyKey: otherRunner.profileKey,
        },
      });
    }
    const claimableRun = await seedQueuedRun('run-target-after-global-page', {
      agentProfileId: runner.profileId,
      executionPayloadJson: {
        executionPolicyKey: runner.profileKey,
      },
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
      executionPayloadJson: {
        executionPolicyKey: runner.profileKey,
      },
    });
    const claimableRun = await seedQueuedRun('run-profile-secondary-claimable', {
      agentProfileId: String(secondaryProfile.get('id')),
      executionPayloadJson: {
        executionPolicyKey: 'fake-secondary',
      },
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

  it('extends leases, deduplicates a retried heartbeat, and rejects older writers', async () => {
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
    expect(heartbeat.leaseTtlMs).toBe(60_000);
    expect(Date.parse(String(heartbeat.claimExpiresAt)) - Date.parse(String(heartbeat.serverTime))).toBe(
      heartbeat.leaseTtlMs,
    );
    const runAfterHeartbeat = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    const firstHeartbeatAt = getTime(runAfterHeartbeat.get('lastRunHeartbeatAt'));

    await new Promise((resolve) => setTimeout(resolve, 20));

    const retriedResponse = await runDaemonAction(runner, run.id, 'heartbeat', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
      status: 'running',
    });
    expect(retriedResponse.status).toBe(200);
    expect(getData(retriedResponse)).toMatchObject({
      status: 'running',
      leaseVersion: heartbeat.leaseVersion,
      claimExpiresAt: heartbeat.claimExpiresAt,
    });
    const retriedHeartbeat = getData(retriedResponse);
    expect(Number(retriedHeartbeat.leaseTtlMs)).toBeLessThan(Number(heartbeat.leaseTtlMs));
    const runAfterRetry = await app.db.getRepository('agRuns').findOne({
      filterByTk: run.id,
    });
    expect(getTime(runAfterRetry.get('lastRunHeartbeatAt'))).toBe(firstHeartbeatAt);

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
      resultSummaryJson: {
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

    const completedReadResponse = await rootAgent.get(`/agentGatewayApi:getRun/${run.id}`);
    expect(JSON.stringify(getData(completedReadResponse))).not.toContain('must-not-render');
    expect(JSON.stringify(getData(completedReadResponse))).not.toContain('RESULT_TOKEN_SECRET');

    const completedApiLogsResponse = await rootAgent.get(`/agentGatewayApi:listRunApiCallLogs/${run.id}`);
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
      resultSummaryJson: {
        commandPath: 'must-not-render',
      },
      errorSummary: 'command=must-not-render cwd=/tmp/must-not-render env.SECRET=must-not-render token=FAIL_SECRET',
    });
    expect(failResponse.status).toBe(200);

    const failedReadResponse = await rootAgent.get(`/agentGatewayApi:getRun/${failedRun.id}`);
    const failedRead = getData(failedReadResponse);
    expect(JSON.stringify(failedRead)).not.toContain('must-not-render');
    expect(JSON.stringify(failedRead)).not.toContain('FAIL_SECRET');
    expect(String(failedRead.errorSummary)).toContain('[REDACTED]');

    const failedApiLogsResponse = await rootAgent.get(`/agentGatewayApi:listRunApiCallLogs/${failedRun.id}`);
    expect(failedApiLogsResponse.status).toBe(200);
    const failedApiLogs = JSON.stringify(failedApiLogsResponse.body.data);
    expect(failedApiLogs).not.toContain('must-not-render');
    expect(failedApiLogs).not.toContain('FAIL_SECRET');
    expect(failedApiLogs).toContain('[REDACTED]');
  });

  it('keeps task titles after completion and reports token usage from conversation events', async () => {
    const runner = await createRunner({
      profileProvider: 'codex',
    });
    const createResponse = await rootAgent.post('/agentGatewayApi:createTaskRun').send({
      title: 'Search gold price',
      prompt: 'Search today gold price',
      nodeId: runner.nodeId,
      agentProfileId: runner.profileId,
    });
    expect(createResponse.status).toBe(200);
    const createResult = getData(createResponse);
    expect(createResult.run).toMatchObject({
      taskTitle: 'Search gold price',
      resultSummaryJson: {
        title: 'Search gold price',
      },
    });

    await app.db.sequelize.transaction(async (transaction) => {
      await app.db.getRepository('agAgentConversationEvents').create({
        values: {
          id: randomUUID(),
          runId: String(createResult.runId),
          sequence: 1,
          eventType: 'agent.turn.completed',
          source: 'codex',
          providerEventId: 'turn-usage-1',
          contentJson: {
            type: 'turn.completed',
            usage: {
              input_tokens: 39968,
              cached_input_tokens: 18176,
              output_tokens: 144,
              reasoning_output_tokens: 77,
            },
          },
        },
        transaction,
      });
    });

    const claim = getData(await claimRun(runner));
    const heartbeat = getData(
      await runDaemonAction(runner, createResult.runId, 'heartbeat', {
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
        status: 'running',
      }),
    );
    const completeResponse = await runDaemonAction(runner, createResult.runId, 'complete', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      resultSummaryJson: {
        status: 'succeeded',
      },
    });
    expect(completeResponse.status).toBe(200);

    const completedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: String(createResult.runId),
    });
    expect(completedRun.get('resultSummaryJson')).toMatchObject({
      title: 'Search gold price',
      status: 'succeeded',
      tokenUsageJson: {
        inputTokens: 39968,
        cachedInputTokens: 18176,
        outputTokens: 144,
        reasoningOutputTokens: 77,
        totalTokens: 40112,
      },
    });

    await app.db.getRepository('agAgentConversationEvents').destroy({
      filter: {
        runId: String(createResult.runId),
      },
    });

    const completedReadResponse = await rootAgent.get(`/agentGatewayApi:getRun/${createResult.runId}`);
    expect(completedReadResponse.status).toBe(200);
    expect(getData(completedReadResponse)).toMatchObject({
      taskTitle: 'Search gold price',
      tokenUsageJson: {
        inputTokens: 39968,
        cachedInputTokens: 18176,
        outputTokens: 144,
        reasoningOutputTokens: 77,
        totalTokens: 40112,
      },
    });

    const listResponse = await rootAgent.get('/agentGatewayApi:listRuns');
    expect(listResponse.status).toBe(200);
    const runs = getData(listResponse);
    expect(Array.isArray(runs)).toBe(true);
    expect(runs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: String(createResult.runId),
          taskTitle: 'Search gold price',
          tokenUsageJson: expect.objectContaining({
            totalTokens: 40112,
          }),
        }),
      ]),
    );
  });

  it('persists Codex token usage from a bounded terminal tail when structured usage is absent', async () => {
    const runner = await createRunner({
      profileProvider: 'codex',
    });
    const run = await createRun('run-codex-terminal-token-fallback', {
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

    await app.db.sequelize.transaction(async (transaction) => {
      await app.db.getRepository('agAgentConversationEvents').create({
        values: {
          id: randomUUID(),
          runId: String(run.id),
          sequence: 1,
          eventType: 'agent.message',
          source: 'terminal-live',
          contentText: [
            'old terminal output\n'.repeat(5000),
            'OpenAI Codex v0.142.5\r',
            'Task completed\r',
            '\u001b[2mtokens used\u001b[0m\r',
            '11,126\r',
            '[agent-gateway] process exited with code 0\r',
          ].join('\n'),
          contentJson: {
            live: true,
            stream: 'terminal',
          },
        },
        transaction,
      });
    });

    const completeResponse = await runDaemonAction(runner, run.id, 'complete', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      resultSummaryJson: {
        title: 'Terminal token fallback',
      },
    });
    expect(completeResponse.status).toBe(200);
    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: String(run.id),
    });
    expect(storedRun.get('resultSummaryJson')).toMatchObject({
      tokenUsageJson: {
        totalTokens: 11126,
      },
    });

    await app.db.getRepository('agAgentConversationEvents').destroy({
      filter: {
        runId: String(run.id),
      },
    });

    const readResponse = await rootAgent.get(`/agentGatewayApi:getRun/${run.id}`);
    expect(readResponse.status).toBe(200);
    expect(getData(readResponse)).toMatchObject({
      tokenUsageJson: {
        totalTokens: 11126,
      },
    });
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
    expect((await readOnlyAgent.post(`/agentGatewayApi:cancelRun/${run.id}`).send({})).status).toBe(403);

    const cancelResponse = await rootAgent.post(`/agentGatewayApi:cancelRun/${run.id}`).send({});
    const cancel = getData(cancelResponse);
    expect(cancelResponse.status).toBe(200);
    expect(cancel.status).toBe('canceling');
    expect(cancel.cancelRequested).toBe(true);
    expect(cancel.cancelRequestedAt).toBeTruthy();

    const completeWhileCancelingResponse = await runDaemonAction(runner, run.id, 'complete', {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: heartbeat.leaseVersion,
      resultSummaryJson: {
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
      resultSummaryJson: {
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

    const cancelResponse = await rootAgent.post(`/agentGatewayApi:cancelRun/${run.id}`).send({});
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

  it('finishes expired canceling or cancel-requested leases as canceled', async () => {
    const cancelingRunner = await createRunner({
      nodeKey: 'node-expired-canceling',
    });
    const cancelingRun = await createRun('run-expired-canceling', {
      agentProfileId: cancelingRunner.profileId,
    });
    await claimRun(cancelingRunner);
    const cancelResponse = await rootAgent.post(`/agentGatewayApi:cancelRun/${cancelingRun.id}`).send({});
    expect(cancelResponse.status).toBe(200);
    expect(getData(cancelResponse).status).toBe('canceling');
    await app.db.getRepository('agRuns').update({
      filterByTk: cancelingRun.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const requestedRunner = await createRunner({
      nodeKey: 'node-expired-cancel-requested',
    });
    const requestedRun = await createRun('run-expired-cancel-requested', {
      agentProfileId: requestedRunner.profileId,
    });
    const requestedClaimResponse = await claimRun(requestedRunner);
    expect(requestedClaimResponse.status).toBe(200);
    const requestedClaim = getData(requestedClaimResponse);
    expect(requestedClaim.claimed).toBe(true);
    const requestedHeartbeatResponse = await runDaemonAction(requestedRunner, requestedRun.id, 'heartbeat', {
      claimToken: requestedClaim.claimToken,
      claimAttempt: requestedClaim.claimAttempt,
      leaseVersion: requestedClaim.leaseVersion,
      status: 'running',
    });
    expect(requestedHeartbeatResponse.status).toBe(200);
    await app.db.getRepository('agRuns').update({
      filterByTk: requestedRun.id,
      values: {
        cancelRequested: true,
        cancelRequestedAt: new Date(),
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const runsBeforeManualRecovery = await app.db.getRepository('agRuns').find({
      filterByTk: [cancelingRun.id, requestedRun.id],
    });
    const alreadyCanceledCount = runsBeforeManualRecovery.filter((run) => run.get('status') === 'canceled').length;
    for (const run of runsBeforeManualRecovery) {
      expect(run.get('cancelRequested')).toBe(true);
    }

    const expireResponse = await rootAgent.post('/agentGatewayApi:expireRunLeases').send({});
    expect(expireResponse.status).toBe(200);
    expect(getData(expireResponse)).toMatchObject({
      stalledCount: 0,
      failedCount: 0,
      canceledCount: 2 - alreadyCanceledCount,
    });

    for (const runId of [cancelingRun.id, requestedRun.id]) {
      const canceledRun = await app.db.getRepository('agRuns').findOne({
        filterByTk: runId,
      });
      expect(canceledRun.toJSON()).toMatchObject({
        status: 'canceled',
        cancelRequested: true,
        canceledAt: expect.anything(),
        finishedAt: expect.anything(),
        terminalEndedAt: expect.anything(),
      });
      expect(canceledRun.get('failedAt')).toBeFalsy();
      expect(canceledRun.get('errorSummary')).toBeFalsy();
    }
    expect(
      await app.db.getRepository('agRunEvents').count({
        filter: {
          runId: {
            $in: [cancelingRun.id, requestedRun.id],
          },
          eventType: 'run.lease.canceled',
        },
      }),
    ).toBe(2);
  });

  it('marks expired leases stalled before failing them and allows daemon-confirmed process timeout only from active leases', async () => {
    const runner = await createRunner();
    const stalledRun = await createRun('run-stalled-1', {
      agentProfileId: runner.profileId,
    });
    await claimRun(runner);
    await app.db.getRepository('agRuns').update({
      filterByTk: stalledRun.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const expireResponse = await rootAgent.post('/agentGatewayApi:expireRunLeases').send({});
    const expire = getData(expireResponse);
    expect(expireResponse.status).toBe(200);
    expect(expire.stalledCount).toBe(1);
    expect(expire.failedCount).toBe(0);

    const stalled = await app.db.getRepository('agRuns').findOne({
      filterByTk: stalledRun.id,
    });
    expect(stalled.get('status')).toBe('stalled');
    expect(stalled.get('finishedAt')).toBeFalsy();

    await app.db.getRepository('agRuns').update({
      filterByTk: stalledRun.id,
      values: {
        claimExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const failExpiredResponse = await rootAgent.post('/agentGatewayApi:expireRunLeases').send({});
    const failExpired = getData(failExpiredResponse);
    expect(failExpiredResponse.status).toBe(200);
    expect(failExpired.stalledCount).toBe(0);
    expect(failExpired.failedCount).toBe(1);

    const failed = await app.db.getRepository('agRuns').findOne({
      filterByTk: stalledRun.id,
    });
    expect(failed.get('status')).toBe('failed');
    expect(failed.get('failedAt')).toBeTruthy();
    expect(failed.get('finishedAt')).toBeTruthy();
    expect(failed.get('errorSummary')).toBe('Runner lost after lease stalled grace period');

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
      resultSummaryJson: {
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
