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

const BUSINESS_COLLECTIONS = [
  'build_nb_envs',
  'build_test_cases',
  'build_runs',
  'build_results',
  'build_version_snapshots',
];

const UI_BUILD_PROMPT_TEMPLATE = `请使用已安装的 Agent Skills 完成以下 NocoBase UI 搭建任务。

任务需求：
{{record.prompt}}

目标 NB 环境：
{{record.nb_env.name}}
API：{{record.nb_env.api_base_url}}
Admin：{{record.nb_env.admin_url}}

清空策略：{{record.cleanup_policy}}
截图策略：{{record.screenshot_policy}}

请在完成后生成报告、日志、截图和版本信息。`;

interface ResponseBody<T> {
  data?: T;
  errors?: Array<{
    message?: string;
  }>;
}

interface ResponseLike<T = unknown> {
  status: number;
  body: ResponseBody<T> & Record<string, unknown>;
}

interface CollectionFieldLike {
  type?: string;
  target?: string;
  targetKey?: string;
  foreignKey?: string;
  options?: Record<string, unknown>;
}

interface CollectionLike {
  hasField?(name: string): boolean;
  getField?(name: string): CollectionFieldLike | undefined;
}

interface DatabaseWithCollections {
  getCollection?(name: string): CollectionLike | undefined;
}

interface FakeDaemonRegistration {
  nodeId: string;
  nodeToken: string;
  profileId: string;
}

interface LeaseValues {
  claimToken: unknown;
  claimAttempt: unknown;
  leaseVersion: unknown;
}

function getData<T>(response: ResponseLike<T>) {
  return (response.body.data ?? response.body) as T;
}

function getRecordData(response: ResponseLike) {
  const data = getData<Record<string, unknown>>(response as ResponseLike<Record<string, unknown>>);
  expect(data && typeof data === 'object' && !Array.isArray(data)).toBe(true);
  return data;
}

function getListData(response: ResponseLike) {
  const data = getData<Array<Record<string, unknown>>>(response as ResponseLike<Array<Record<string, unknown>>>);
  expect(Array.isArray(data)).toBe(true);
  return data;
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

function getDbCollection(app: MockServer, name: string) {
  return (app.db as unknown as DatabaseWithCollections).getCollection?.(name);
}

function getFieldOption(field: CollectionFieldLike | undefined, key: keyof CollectionFieldLike) {
  return field?.options?.[key] ?? field?.[key];
}

describe('agent gateway no-code business trigger smoke', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let sequence = 0;

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
    expectBusinessCollectionsAreNotPluginCore();
    await seedUiBuildBusinessCollections();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  function nextCode(prefix: string) {
    sequence += 1;
    return `${prefix}-${sequence}-${Date.now()}`;
  }

  function expectBusinessCollectionsAreNotPluginCore() {
    for (const collectionName of BUSINESS_COLLECTIONS) {
      expect(getDbCollection(app, collectionName)).toBeFalsy();
    }
  }

  async function seedUiBuildBusinessCollections() {
    app.db.collection({
      name: 'build_nb_envs',
      tableName: 'build_nb_envs',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'api_base_url' },
        { type: 'string', name: 'admin_url' },
      ],
    });

    app.db.collection({
      name: 'build_test_cases',
      tableName: 'build_test_cases',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'text', name: 'prompt', length: 'medium' },
      ],
    });

    app.db.collection({
      name: 'build_runs',
      tableName: 'build_runs',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'text', name: 'prompt', length: 'medium' },
        { type: 'jsonb', name: 'attachments' },
        { type: 'belongsTo', name: 'nb_env', target: 'build_nb_envs', foreignKey: 'nb_env_id' },
        { type: 'belongsTo', name: 'agent_profile', target: 'agAgentProfiles', foreignKey: 'agent_profile_id' },
        { type: 'belongsTo', name: 'node', target: 'agNodes', foreignKey: 'node_id' },
        { type: 'belongsTo', name: 'skills', target: 'agSkillVersions', foreignKey: 'skill_version_id' },
        { type: 'string', name: 'cleanup_policy' },
        { type: 'string', name: 'screenshot_policy' },
        { type: 'belongsTo', name: 'agent_run', target: 'agRuns', foreignKey: 'agent_run_id' },
        { type: 'jsonb', name: 'result_summary' },
      ],
    });

    app.db.collection({
      name: 'build_results',
      tableName: 'build_results',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'build_run', target: 'build_runs', foreignKey: 'build_run_id' },
        { type: 'belongsTo', name: 'agent_run', target: 'agRuns', foreignKey: 'agent_run_id' },
        { type: 'text', name: 'report', length: 'medium' },
        { type: 'jsonb', name: 'screenshots' },
      ],
    });

    app.db.collection({
      name: 'build_version_snapshots',
      tableName: 'build_version_snapshots',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'build_run', target: 'build_runs', foreignKey: 'build_run_id' },
        { type: 'belongsTo', name: 'agent_run', target: 'agRuns', foreignKey: 'agent_run_id' },
        { type: 'jsonb', name: 'version_info' },
      ],
    });

    await app.db.sync();

    for (const collectionName of BUSINESS_COLLECTIONS) {
      expect(getDbCollection(app, collectionName)).toBeTruthy();
    }
  }

  async function createInvitation() {
    const nodeKey = nextCode('ui-build-node');
    const response = await rootAgent.post('/agentGatewayApi:createNodeInvitation').send({
      invitationKey: nextCode('ui-build-invite'),
      serverUrl: 'http://127.0.0.1:13000',
      expiresInSeconds: 3600,
      expectedNodeKey: nodeKey,
    });
    expect(response.status).toBe(200);
    return {
      ...getRecordData(response),
      nodeKey,
    };
  }

  async function registerFakeDaemon(): Promise<FakeDaemonRegistration> {
    const invitation = await createInvitation();
    const registerResponse = await app
      .agent()
      .post('/agentGatewayApi:registerNode')
      .send({
        inviteToken: extractInviteToken(invitation.registerCommand),
        nodeKey: invitation.nodeKey,
        displayName: 'UI Build Fake Node',
        daemonVersion: 'fake-daemon/1.0.0',
        hostInfo: {
          hostname: 'ui-build-fake-host',
        },
        capabilities: {
          maxConcurrency: 1,
        },
      });
    expect(registerResponse.status).toBe(200);
    const registration = getRecordData(registerResponse);
    const nodeId = expectString(registration.nodeId);
    const nodeToken = expectString(registration.nodeToken);

    const heartbeatResponse = await app
      .agent()
      .post(`/agentGatewayApi:heartbeatNode/${nodeId}`)
      .set('Authorization', `Bearer ${nodeToken}`)
      .send({
        currentConcurrency: 0,
        capabilities: {
          maxConcurrency: 1,
          supportsArtifacts: true,
          supportsSnapshots: true,
        },
        profiles: [
          {
            profileKey: 'fake-success',
            displayName: 'Fake UI Build Success',
            agentType: 'code',
            driver: 'fake',
            status: 'active',
            capabilities: {
              artifacts: true,
              maxConcurrency: 1,
              structuredEvents: true,
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
    };
  }

  async function createUiBuildSkill(nodeId: string) {
    const skill = await app.db.getRepository('agSkills').create({
      values: {
        skillKey: 'nocobase-opencode-ui-batch',
        displayName: 'NocoBase OpenCode UI Batch',
        status: 'active',
      },
    });
    const skillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        skillId: skill.get('id'),
        versionLabel: '1.0.0-smoke',
        status: 'active',
        manifestJson: {
          entry: 'nocobase-opencode-ui-batch',
        },
      },
    });
    const install = await app.db.getRepository('agNodeSkillInstalls').create({
      values: {
        nodeId,
        skillVersionId: skillVersion.get('id'),
        status: 'installed',
        installedAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    return {
      skillVersionId: expectString(skillVersion.get('id')),
      installId: expectString(install.get('id')),
    };
  }

  async function createPromptTemplate() {
    const response = await rootAgent.post('/agentGatewayApi:createPromptTemplate').send({
      templateKey: nextCode('ui.build.template'),
      displayName: 'NocoBase UI Build smoke template',
      templateText: UI_BUILD_PROMPT_TEMPLATE,
      status: 'active',
      defaultExecutionPayload: {
        driver: 'fake',
      },
    });
    expect(response.status).toBe(200);
    return getRecordData(response);
  }

  async function createDispatchBinding(promptTemplateId: unknown) {
    const response = await rootAgent.post('/agentGatewayApi:createDispatchBinding').send({
      bindingKey: nextCode('ui.build.dispatch'),
      collectionName: 'build_runs',
      promptTemplateId,
      outputAgentRunField: 'agent_run',
      agentProfileField: 'agent_profile',
      nodeField: 'node',
      skillFieldsJson: ['skills'],
      fieldMappingsJson: {
        title: 'title',
        prompt: 'prompt',
        attachments: 'attachments',
        cleanupPolicy: 'cleanup_policy',
        screenshotPolicy: 'screenshot_policy',
      },
    });
    expect(response.status).toBe(200);
    return getRecordData(response);
  }

  async function grantCollectionActions(
    roleName: string,
    collectionName: string,
    actionNames: string[],
    fieldsByAction: Record<string, string[]> = {},
  ) {
    const response = await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: collectionName,
        usingActionsConfig: true,
        actions: actionNames.map((name) => ({
          name,
          ...(fieldsByAction[name] ? { fields: fieldsByAction[name] } : {}),
        })),
      },
    });
    expect(response.status).toBe(200);
  }

  async function createBusinessUserAgent() {
    const roleName = nextCode('agentGatewayUiBuildBusinessRole').replace(/[^A-Za-z0-9_]/g, '');
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: [
          'agentGateway.dispatchRun',
          'agentGateway.readRun',
          'agentGateway.readRunDetails',
          'agentGateway.readArtifacts',
          'agentGateway.readRawLogs',
        ],
      },
    });

    await grantCollectionActions(roleName, 'build_runs', ['create', 'view', 'update'], {
      create: [
        'title',
        'prompt',
        'attachments',
        'nb_env',
        'nb_env_id',
        'agent_profile',
        'agent_profile_id',
        'node',
        'node_id',
        'skills',
        'skill_version_id',
        'cleanup_policy',
        'screenshot_policy',
      ],
      view: [
        'title',
        'prompt',
        'attachments',
        'nb_env',
        'nb_env_id',
        'agent_profile',
        'agent_profile_id',
        'node',
        'node_id',
        'skills',
        'skill_version_id',
        'cleanup_policy',
        'screenshot_policy',
        'agent_run',
        'agent_run_id',
        'result_summary',
      ],
      update: ['agent_run', 'agent_run_id'],
    });
    await grantCollectionActions(roleName, 'build_nb_envs', ['view'], {
      view: ['name', 'api_base_url', 'admin_url'],
    });
    await grantCollectionActions(roleName, 'agNodes', ['view']);
    await grantCollectionActions(roleName, 'agAgentProfiles', ['view']);
    await grantCollectionActions(roleName, 'agSkillVersions', ['view']);
    await grantCollectionActions(roleName, 'agNodeSkillInstalls', ['view']);

    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });
    return await app.agent().login(user);
  }

  async function createBusinessBuildRun(
    businessAgent: ReturnType<MockServer['agent']>,
    daemon: FakeDaemonRegistration,
    skillVersionId: string,
  ) {
    const nbEnv = await app.db.getRepository('build_nb_envs').create({
      values: {
        name: 'Local NocoBase smoke',
        api_base_url: 'http://127.0.0.1:13000/api',
        admin_url: 'http://127.0.0.1:13000/v2/admin/',
      },
    });

    const values = {
      title: 'Customer portal build smoke',
      prompt: '搭建一个客户门户页面，包含客户列表、详情和最近跟进记录。',
      attachments: [
        {
          name: 'wireframe.md',
          contentType: 'text/markdown',
        },
      ],
      nb_env_id: nbEnv.get('id'),
      agent_profile_id: daemon.profileId,
      node_id: daemon.nodeId,
      skill_version_id: skillVersionId,
      cleanup_policy: 'reset-flow-models-before-build',
      screenshot_policy: 'capture-after-build-and-verify',
    };
    expect(values).not.toHaveProperty('promptSnapshot');
    expect(values).not.toHaveProperty('executionPayloadJson');

    const response = await businessAgent.resource('build_runs').create({
      values: {
        ...values,
      },
    });
    expect(response.status).toBe(200);
    const buildRun = getData<Record<string, unknown>>(response as ResponseLike<Record<string, unknown>>);
    expect(buildRun).not.toHaveProperty('promptSnapshot');
    expect(buildRun).not.toHaveProperty('executionPayloadJson');
    return {
      id: String(buildRun.id),
      record: buildRun,
    };
  }

  async function claimRun(daemon: FakeDaemonRegistration) {
    return await app
      .agent()
      .post(`/agentGatewayApi:claimRun/${daemon.nodeId}`)
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
      heartbeat: 'heartbeatRun',
      complete: 'completeRun',
      fail: 'failRun',
      timeout: 'timeoutRun',
      'cancel-ack': 'ackCancelRun',
    }[action];
    if (!actionName) {
      throw new Error(`Unsupported daemon action: ${action}`);
    }
    return await app
      .agent()
      .post(`/agentGatewayApi:${actionName}/${runId}`)
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
      'events:append': 'appendRunEvents',
      'artifacts:register': 'registerRunArtifact',
      'snapshots:register': 'registerRunSnapshot',
    }[action];
    if (!actionName) {
      throw new Error(`Unsupported observation action: ${action}`);
    }
    return await app
      .agent()
      .post(`/agentGatewayApi:${actionName}/${runId}`)
      .set('Authorization', `Bearer ${daemon.nodeToken}`)
      .send(values);
  }

  it('dispatches a no-code business record through a fake daemon and exposes related run details', async () => {
    const buildRunsCollection = getDbCollection(app, 'build_runs');
    const agentRunField = buildRunsCollection?.getField?.('agent_run');
    expect(buildRunsCollection?.hasField?.('promptSnapshot')).toBe(false);
    expect(buildRunsCollection?.hasField?.('executionPayloadJson')).toBe(false);
    expect(getFieldOption(agentRunField, 'type')).toBe('belongsTo');
    expect(getFieldOption(agentRunField, 'target')).toBe('agRuns');
    expect(getFieldOption(agentRunField, 'foreignKey')).toBe('agent_run_id');

    const businessAgent = await createBusinessUserAgent();
    const daemon = await registerFakeDaemon();
    const skill = await createUiBuildSkill(daemon.nodeId);
    const template = await createPromptTemplate();
    const binding = await createDispatchBinding(template.id);
    const buildRun = await createBusinessBuildRun(businessAgent, daemon, skill.skillVersionId);
    const buildRunId = buildRun.id;

    const dispatchResponse = await businessAgent.post(`/agentGatewayApi:dispatchBinding/${binding.id}`).send({
      sourceRecordId: buildRunId,
      sourceCollection: 'build_runs',
      idempotencyKey: 'ui-build-smoke-click',
    });
    expect(dispatchResponse.status).toBe(200);
    const dispatch = getRecordData(dispatchResponse);
    expect(dispatch).toMatchObject({
      sourceCollection: 'build_runs',
      sourceRecordId: buildRunId,
      outputAgentRunField: 'agent_run',
      relationUpdated: true,
      deduped: false,
    });
    const runId = expectString(dispatch.runId);
    const dispatchedRun = dispatch.run as Record<string, unknown>;
    expect(dispatchedRun.id).toBe(runId);
    expect(dispatchedRun.status).toBe('queued');
    expect(dispatchedRun).not.toHaveProperty('promptSnapshot');
    expect(dispatchedRun).not.toHaveProperty('executionPayloadJson');

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filterByTk: runId,
    });
    expect(storedRun.get('sourceType')).toBe('dispatch');
    expect(storedRun.get('sourceCollection')).toBe('build_runs');
    expect(storedRun.get('sourceRecordId')).toBe(buildRunId);
    expect(storedRun.get('nodeId')).toBe(daemon.nodeId);
    expect(storedRun.get('agentProfileId')).toBe(daemon.profileId);
    expect(storedRun.get('promptTemplateId')).toBe(template.id);
    expect(storedRun.get('promptSnapshot')).toMatchObject({
      templateText: UI_BUILD_PROMPT_TEMPLATE,
      renderedPrompt: expect.stringContaining('搭建一个客户门户页面'),
    });
    expect(JSON.stringify(storedRun.get('promptSnapshot'))).toEqual(
      expect.stringContaining('http://127.0.0.1:13000/api'),
    );
    expect(JSON.stringify(storedRun.get('promptSnapshot'))).toEqual(
      expect.stringContaining('capture-after-build-and-verify'),
    );
    expect(storedRun.get('executionPayloadJson')).toMatchObject({
      driver: 'fake',
      dispatch: {
        bindingId: binding.id,
        bindingKey: binding.bindingKey,
        collectionName: 'build_runs',
        recordId: buildRunId,
        sourceCollection: 'build_runs',
        sourceRecordId: buildRunId,
        outputAgentRunField: 'agent_run',
        idempotencyKey: 'ui-build-smoke-click',
      },
      fields: {
        title: 'Customer portal build smoke',
        prompt: '搭建一个客户门户页面，包含客户列表、详情和最近跟进记录。',
        cleanupPolicy: 'reset-flow-models-before-build',
        screenshotPolicy: 'capture-after-build-and-verify',
      },
      skills: {
        skills: skill.skillVersionId,
      },
      resolvedSkills: {
        skills: [
          expect.objectContaining({
            installId: skill.installId,
            installStatus: 'installed',
            nodeId: daemon.nodeId,
            skillVersionId: skill.skillVersionId,
            status: 'active',
            versionLabel: '1.0.0-smoke',
          }),
        ],
      },
    });

    const updatedBuildRun = await app.db.getRepository('build_runs').findOne({
      filterByTk: buildRunId,
    });
    expect(updatedBuildRun.get('agent_run_id')).toBe(runId);

    const claimResponse = await claimRun(daemon);
    expect(claimResponse.status).toBe(200);
    const claim = getRecordData(claimResponse);
    expect(claim.claimed).toBe(true);
    expect(claim.runId).toBe(runId);

    const heartbeatResponse = await runDaemonAction(daemon, runId, 'heartbeat', {
      ...getLeaseValues(claim),
      status: 'running',
    });
    expect(heartbeatResponse.status).toBe(200);
    const heartbeat = getRecordData(heartbeatResponse);
    const activeLease = getLeaseValues({
      ...claim,
      leaseVersion: heartbeat.leaseVersion,
    });

    const eventResponse = await appendObservation(daemon, runId, 'events:append', {
      ...activeLease,
      source: 'stdout',
      sequence: 1,
      eventType: 'log',
      level: 'info',
      message: 'UI build smoke started from business build_runs record',
      payload: {
        collectionName: 'build_runs',
        recordId: buildRunId,
      },
    });
    expect(eventResponse.status).toBe(200);

    const artifactResponse = await appendObservation(daemon, runId, 'artifacts:register', {
      ...activeLease,
      artifactKey: 'ui-build-report',
      artifactType: 'text',
      mimeType: 'text/markdown',
      contentText: '# UI Build Smoke\n\nFake daemon completed the no-code business dispatch.',
      metadata: {
        kind: 'report',
      },
    });
    expect(artifactResponse.status).toBe(200);

    const snapshotResponse = await appendObservation(daemon, runId, 'snapshots:register', {
      ...activeLease,
      snapshotType: 'nocobase',
      snapshot: {
        nocobaseVersion: 'smoke',
        pageCount: 1,
      },
      metadata: {
        kind: 'version-info',
      },
    });
    expect(snapshotResponse.status).toBe(200);

    const completeResponse = await runDaemonAction(daemon, runId, 'complete', {
      ...activeLease,
      resultSummary: {
        status: 'ok',
        reportArtifactKey: 'ui-build-report',
        generatedPages: 1,
      },
    });
    expect(completeResponse.status).toBe(200);
    expect(getRecordData(completeResponse)).toMatchObject({
      status: 'succeeded',
    });

    const runResponse = await businessAgent.get(`/agentGatewayApi:getRun/${runId}`);
    const eventsResponse = await businessAgent.get(`/agentGatewayApi:listRunEvents/${runId}`);
    const artifactsResponse = await businessAgent.get(`/agentGatewayApi:listRunArtifacts/${runId}`);
    const snapshotsResponse = await businessAgent.get(`/agentGatewayApi:listRunSnapshots/${runId}`);
    expect(runResponse.status).toBe(200);
    expect(eventsResponse.status).toBe(200);
    expect(artifactsResponse.status).toBe(200);
    expect(snapshotsResponse.status).toBe(200);

    const readableRun = getRecordData(runResponse);
    const events = getListData(eventsResponse);
    const artifacts = getListData(artifactsResponse);
    const snapshots = getListData(snapshotsResponse);
    expect(readableRun).toMatchObject({
      id: runId,
      status: 'succeeded',
      resultSummaryJson: {
        status: 'ok',
        reportArtifactKey: 'ui-build-report',
        generatedPages: 1,
      },
    });
    expect(readableRun).not.toHaveProperty('promptSnapshot');
    expect(readableRun).not.toHaveProperty('executionPayloadJson');
    expect(events).toEqual([
      expect.objectContaining({
        runId,
        source: 'stdout',
        sequence: 1,
        message: 'UI build smoke started from business build_runs record',
      }),
    ]);
    expect(artifacts).toEqual([
      expect.objectContaining({
        runId,
        artifactKey: 'ui-build-report',
        artifactType: 'text',
      }),
    ]);
    expect(snapshots).toEqual([
      expect.objectContaining({
        runId,
        snapshotType: 'nocobase',
      }),
    ]);

    const businessReadResponse = await businessAgent.resource('build_runs').get({
      filterByTk: buildRunId,
      appends: ['agent_run'],
    });
    expect(businessReadResponse.status).toBe(200);
    const businessRead = getData<Record<string, unknown>>(
      businessReadResponse as ResponseLike<Record<string, unknown>>,
    );
    expect(String(businessRead.id)).toBe(buildRunId);
    expect(businessRead).toMatchObject({
      title: 'Customer portal build smoke',
      agent_run_id: runId,
      agent_run: expect.objectContaining({
        id: runId,
        status: 'succeeded',
        resultSummaryJson: {
          status: 'ok',
          reportArtifactKey: 'ui-build-report',
          generatedPages: 1,
        },
      }),
    });
    expect(JSON.stringify(businessRead)).not.toContain('executionPayloadJson');
    expect(JSON.stringify(businessRead)).not.toContain('promptSnapshot');
  });
});
