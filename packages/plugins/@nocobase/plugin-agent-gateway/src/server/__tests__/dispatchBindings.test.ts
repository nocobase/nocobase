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

interface ResponseBody<T> {
  data?: T;
  errors?: Array<{
    message?: string;
  }>;
}

interface ResponseLike<T> {
  status: number;
  body: ResponseBody<T> & Record<string, unknown>;
}

interface PromptTemplateRecord {
  id: string;
  templateKey: string;
}

interface DispatchBindingRecord {
  id: string;
  bindingKey: string;
  collectionName: string;
  outputAgentRunField: string;
  enabled: boolean;
}

interface ScopeRecord {
  id: number;
}

interface DispatchResponse {
  bindingId: string;
  bindingKey: string;
  idempotent: boolean;
  deduped: boolean;
  runId: string;
  runCode: string;
  agentSessionId: string | null;
  sourceCollection: string;
  sourceRecordId: string;
  outputAgentRunField: string;
  relationUpdated: boolean;
  run: {
    id: string;
    status: string;
  };
}

function getData<T>(response: ResponseLike<T>) {
  return response.body.data || (response.body as T);
}

function getErrorMessage<T>(response: ResponseLike<T>) {
  return response.body.errors?.[0]?.message || '';
}

describe('agent gateway dispatch binding APIs', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let rootUserId: string;
  let ticketSequence: number;

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
    rootUserId = String(rootUser.get('id'));
    rootAgent = await app.agent().login(rootUser);
    ticketSequence = 1;
    await seedBusinessCollections();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  async function seedBusinessCollections() {
    app.db.collection({
      name: 'agDispatchTickets',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'string', name: 'ticketCode' },
        { type: 'string', name: 'skillName' },
        { type: 'belongsTo', name: 'agentRun', target: 'agRuns', foreignKey: 'agentRunId' },
        { type: 'belongsTo', name: 'selectedNode', target: 'agNodes', foreignKey: 'selectedNodeId' },
        {
          type: 'belongsTo',
          name: 'selectedProfile',
          target: 'agAgentProfiles',
          foreignKey: 'selectedProfileId',
        },
        {
          type: 'belongsTo',
          name: 'selectedSkillVersion',
          target: 'agSkillVersions',
          foreignKey: 'selectedSkillVersionId',
        },
      ],
    });
    app.db.collection({
      name: 'agDispatchCodeTickets',
      filterTargetKey: 'ticketCode',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'string', name: 'ticketCode' },
        { type: 'belongsTo', name: 'agentRun', target: 'agRuns', foreignKey: 'agentRunId' },
      ],
    });
    app.db.collection({
      name: 'agDispatchOtherTickets',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'agentRun', target: 'agRuns', foreignKey: 'agentRunId' },
      ],
    });
    await app.db.sync();
  }

  async function createTemplate(values: Record<string, unknown> = {}) {
    const response = await rootAgent.post('/api/agent-gateway/prompt-templates:create').send({
      templateKey: 'ticket-build',
      displayName: 'Ticket build',
      templateText: 'Build {{record.title}}',
      ...values,
    });
    expect(response.status).toBe(200);
    return getData(response as ResponseLike<PromptTemplateRecord>);
  }

  async function createBinding(values: Record<string, unknown> = {}) {
    const template = values.promptTemplateId ? null : await createTemplate();
    const response = await rootAgent.post('/api/agent-gateway/dispatch-bindings:create').send({
      bindingKey: 'ticket-dispatch',
      collectionName: 'agDispatchTickets',
      promptTemplateId: template?.id || values.promptTemplateId,
      outputAgentRunField: 'agentRun',
      ...values,
    });
    expect(response.status).toBe(200);
    return getData(response as ResponseLike<DispatchBindingRecord>);
  }

  async function createRunner() {
    const node = await app.db.getRepository('agNodes').create({
      values: {
        nodeKey: 'node-dispatch',
        displayName: 'Dispatch node',
        status: 'active',
        authMode: 'node-token',
        capabilitiesJson: {
          maxConcurrency: 1,
        },
        registeredAt: new Date(),
        lastHeartbeatAt: new Date(),
      },
    });
    const profile = await app.db.getRepository('agAgentProfiles').create({
      values: {
        nodeId: node.get('id'),
        profileKey: 'code-builder',
        displayName: 'Code builder',
        agentType: 'code',
        driver: 'fake',
        status: 'active',
      },
    });
    const skill = await app.db.getRepository('agSkills').create({
      values: {
        skillKey: 'nocobase-opencode-ui-batch',
        displayName: 'NocoBase UI builder',
        status: 'active',
      },
    });
    const skillVersion = await app.db.getRepository('agSkillVersions').create({
      values: {
        skillId: skill.get('id'),
        versionLabel: '1.0.0',
        status: 'active',
      },
    });
    const install = await app.db.getRepository('agNodeSkillInstalls').create({
      values: {
        nodeId: node.get('id'),
        skillVersionId: skillVersion.get('id'),
        status: 'installed',
        installedAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    return {
      nodeId: String(node.get('id')),
      profileId: String(profile.get('id')),
      skillVersionId: String(skillVersion.get('id')),
      installId: String(install.get('id')),
    };
  }

  async function createTicket(values: Record<string, unknown> = {}) {
    return await app.db.getRepository('agDispatchTickets').create({
      values: {
        title: 'Login page',
        ticketCode: `ticket-${ticketSequence++}`,
        skillName: 'nocobase-opencode-ui-batch',
        ...values,
      },
    });
  }

  async function grantCollectionActions(
    roleName: string,
    collectionName: string,
    actionNames: string[],
    fieldsByAction: Record<string, string[]> = {},
    scopesByAction: Record<string, number> = {},
  ) {
    const response = await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: collectionName,
        usingActionsConfig: true,
        actions: actionNames.map((name) => ({
          name,
          ...(fieldsByAction[name] ? { fields: fieldsByAction[name] } : {}),
          ...(scopesByAction[name] ? { scopeId: scopesByAction[name] } : {}),
        })),
      },
    });
    expect(response.status).toBe(200);
  }

  async function createCollectionScope(collectionName: string, scopeName: string, scope: Record<string, unknown>) {
    const response = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: collectionName,
        name: scopeName,
        scope,
      },
    });
    expect(response.status).toBe(200);
    return getData(response as ResponseLike<ScopeRecord>);
  }

  async function grantRunScope(roleName: string, scopeName: string, scope: Record<string, unknown>) {
    const scopeResponse = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: 'agRuns',
        name: scopeName,
        scope,
      },
    });
    expect(scopeResponse.status).toBe(200);
    const roleResourceResponse = await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: 'agRuns',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            scope: scopeResponse.body.data.id,
          },
        ],
      },
    });
    expect(roleResourceResponse.status).toBe(200);
  }

  it('validates outputAgentRunField and provides dispatch binding CRUD APIs', async () => {
    const template = await createTemplate();
    const invalidResponse = await rootAgent.post('/api/agent-gateway/dispatch-bindings:create').send({
      bindingKey: 'invalid-output',
      collectionName: 'agDispatchTickets',
      promptTemplateId: template.id,
      outputAgentRunField: 'title',
    });
    expect(invalidResponse.status).toBe(400);
    expect(getErrorMessage(invalidResponse as ResponseLike<unknown>)).toContain(
      'outputAgentRunField must be a belongsTo relation field targeting agRuns.id',
    );

    const invalidGenericCreateResponse = await rootAgent.resource('agDispatchBindings').create({
      values: {
        bindingKey: 'invalid-generic-output',
        collectionName: 'agDispatchTickets',
        promptTemplateId: template.id,
        outputAgentRunField: 'title',
        triggerType: 'record-action',
      },
    });
    expect(invalidGenericCreateResponse.status).toBe(400);
    expect(getErrorMessage(invalidGenericCreateResponse as ResponseLike<unknown>)).toContain(
      'outputAgentRunField must be a belongsTo relation field targeting agRuns.id',
    );

    const invalidSkillFieldResponse = await rootAgent.post('/api/agent-gateway/dispatch-bindings:create').send({
      bindingKey: 'invalid-skill-field',
      collectionName: 'agDispatchTickets',
      promptTemplateId: template.id,
      outputAgentRunField: 'agentRun',
      skillFieldsJson: ['skillName'],
    });
    expect(invalidSkillFieldResponse.status).toBe(400);
    expect(getErrorMessage(invalidSkillFieldResponse as ResponseLike<unknown>)).toContain(
      'skillFieldsJson must reference relation fields targeting agSkillVersions or agNodeSkillInstalls',
    );

    const createResponse = await rootAgent.post('/api/agent-gateway/dispatch-bindings:create').send({
      bindingKey: 'valid-output',
      collectionName: 'agDispatchTickets',
      promptTemplateId: template.id,
      outputAgentRunField: 'agentRun',
      fieldMappingsJson: {
        title: 'title',
      },
    });
    expect(createResponse.status).toBe(200);
    const binding = getData(createResponse as ResponseLike<DispatchBindingRecord>);
    expect(binding.bindingKey).toBe('valid-output');
    expect(binding.enabled).toBe(true);

    const getByIdResponse = await rootAgent.get(`/api/agent-gateway/dispatch-bindings:get/${binding.id}`);
    expect(getByIdResponse.status).toBe(200);
    expect(getData(getByIdResponse as ResponseLike<DispatchBindingRecord>).bindingKey).toBe('valid-output');

    const listResponse = await rootAgent.get('/api/agent-gateway/dispatch-bindings:list');
    expect(getData(listResponse as ResponseLike<DispatchBindingRecord[]>)).toHaveLength(1);

    const invalidCollectionUpdateResponse = await rootAgent
      .post(`/api/agent-gateway/dispatch-bindings:update/${binding.bindingKey}`)
      .send({
        collectionName: 'agDispatchOtherTickets',
      });
    expect(invalidCollectionUpdateResponse.status).toBe(400);
    expect(getErrorMessage(invalidCollectionUpdateResponse as ResponseLike<unknown>)).toContain(
      'fieldMappingsJson references an unknown field: title',
    );

    const invalidGenericUpdateResponse = await rootAgent.resource('agDispatchBindings').update({
      filterByTk: binding.id,
      values: {
        collectionName: 'agDispatchOtherTickets',
      },
    });
    expect(invalidGenericUpdateResponse.status).toBe(400);
    expect(getErrorMessage(invalidGenericUpdateResponse as ResponseLike<unknown>)).toContain(
      'fieldMappingsJson references an unknown field: title',
    );

    const updateResponse = await rootAgent.post(`/api/agent-gateway/dispatch-bindings:update/${binding.id}`).send({
      enabled: false,
    });
    expect(updateResponse.status).toBe(200);
    expect(getData(updateResponse as ResponseLike<DispatchBindingRecord>).enabled).toBe(false);

    const destroyResponse = await rootAgent.post(`/api/agent-gateway/dispatch-bindings:destroy/${binding.id}`);
    expect(destroyResponse.status).toBe(200);

    const emptyListResponse = await rootAgent.get('/api/agent-gateway/dispatch-bindings:list');
    expect(getData(emptyListResponse as ResponseLike<DispatchBindingRecord[]>)).toHaveLength(0);
  });

  it('dispatches one queued run transactionally and writes it back to the business relation field', async () => {
    const runner = await createRunner();
    const binding = await createBinding({
      agentProfileField: 'selectedProfile',
      nodeField: 'selectedNode',
      fieldMappingsJson: {
        title: 'title',
      },
      skillFieldsJson: ['selectedSkillVersion'],
    });
    const ticket = await createTicket({
      selectedNodeId: runner.nodeId,
      selectedProfileId: runner.profileId,
      selectedSkillVersionId: runner.skillVersionId,
    });

    const dispatchResponse = await rootAgent.post(`/api/agent-gateway/dispatch-bindings/${binding.id}/dispatch`).send({
      sourceRecordId: ticket.get('id'),
      idempotencyKey: 'ticket-click-1',
      sourceCollection: 'agDispatchTickets',
    });
    expect(dispatchResponse.status).toBe(200);
    const dispatch = getData(dispatchResponse as ResponseLike<DispatchResponse>);
    expect(dispatch).toMatchObject({
      idempotent: false,
      deduped: false,
      runId: dispatch.run.id,
      sourceCollection: 'agDispatchTickets',
      sourceRecordId: String(ticket.get('id')),
      outputAgentRunField: 'agentRun',
      relationUpdated: true,
    });
    expect(dispatch.runCode).toBeTruthy();
    expect(dispatch.agentSessionId).toBeNull();
    expect(dispatch.run.status).toBe('queued');
    expect(dispatch.run).not.toHaveProperty('promptSnapshot');
    expect(dispatch.run).not.toHaveProperty('executionPayloadJson');

    const storedRun = await app.db.getRepository('agRuns').findOne({
      filter: {
        id: dispatch.run.id,
      },
    });
    expect(storedRun.get('sourceType')).toBe('dispatch');
    expect(storedRun.get('sourceCollection')).toBe('agDispatchTickets');
    expect(storedRun.get('sourceRecordId')).toBe(String(ticket.get('id')));
    expect(String(storedRun.get('requestedById'))).toBe(rootUserId);
    expect(storedRun.get('nodeId')).toBe(runner.nodeId);
    expect(storedRun.get('agentProfileId')).toBe(runner.profileId);
    expect(storedRun.get('promptSnapshot')).toMatchObject({
      renderedPrompt: 'Build Login page',
    });
    expect(storedRun.get('executionPayloadJson')).toMatchObject({
      dispatch: {
        bindingKey: 'ticket-dispatch',
        collectionName: 'agDispatchTickets',
        recordId: String(ticket.get('id')),
        sourceCollection: 'agDispatchTickets',
        sourceRecordId: String(ticket.get('id')),
        outputAgentRunField: 'agentRun',
        idempotencyKey: 'ticket-click-1',
      },
      fields: {
        title: 'Login page',
      },
      skills: {
        selectedSkillVersion: runner.skillVersionId,
      },
      resolvedSkills: {
        selectedSkillVersion: [
          expect.objectContaining({
            installId: runner.installId,
            installStatus: 'installed',
            nodeId: runner.nodeId,
            skillVersionId: runner.skillVersionId,
            status: 'active',
            versionLabel: '1.0.0',
          }),
        ],
      },
    });

    const updatedTicket = await app.db.getRepository('agDispatchTickets').findOne({
      filter: {
        id: ticket.get('id'),
      },
    });
    expect(String(updatedTicket.get('agentRunId'))).toBe(dispatch.runId);
  });

  it('dispatches records by the collection filterTargetKey', async () => {
    const template = await createTemplate({
      templateKey: 'code-ticket-build',
      templateText: 'Build {{record.title}}',
    });
    const binding = await createBinding({
      bindingKey: 'code-ticket-dispatch',
      collectionName: 'agDispatchCodeTickets',
      promptTemplateId: template.id,
      outputAgentRunField: 'agentRun',
    });
    const ticket = await app.db.getRepository('agDispatchCodeTickets').create({
      values: {
        title: 'Code keyed page',
        ticketCode: 'code-ticket-1',
      },
    });

    const dispatchResponse = await rootAgent.post(`/api/agent-gateway/dispatch-bindings/${binding.id}:dispatch`).send({
      recordId: 'code-ticket-1',
      idempotencyKey: 'code-ticket-click',
      expectedCollectionName: 'agDispatchCodeTickets',
    });
    expect(dispatchResponse.status).toBe(200);
    const dispatch = getData(dispatchResponse as ResponseLike<DispatchResponse>);

    const updatedTicket = await app.db.getRepository('agDispatchCodeTickets').findOne({
      filter: {
        id: ticket.get('id'),
      },
    });
    expect(updatedTicket.get('agentRunId')).toBe(dispatch.run.id);
  });

  it('rejects dispatch when the binding does not match the current record collection', async () => {
    const binding = await createBinding();
    const ticket = await createTicket();

    const response = await rootAgent.post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`).send({
      recordId: ticket.get('id'),
      idempotencyKey: 'wrong-collection',
      expectedCollectionName: 'agDispatchOtherTickets',
    });
    expect(response.status).toBe(409);
    expect(getErrorMessage(response as ResponseLike<unknown>)).toContain(
      'Dispatch binding does not match the current record collection',
    );

    const runCount = await app.db.getRepository('agRuns').count({});
    expect(runCount).toBe(0);
  });

  it('prevents duplicate active runs and returns the existing run for the same idempotency key', async () => {
    const binding = await createBinding();
    const ticket = await createTicket();

    const firstResponse = await rootAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'same-click',
      });
    expect(firstResponse.status).toBe(200);
    const firstDispatch = getData(firstResponse as ResponseLike<DispatchResponse>);
    await app.db.getRepository('agRuns').update({
      filterByTk: firstDispatch.run.id,
      values: {
        status: 'running',
        claimAttempt: 3,
        leaseVersion: 7,
        claimTokenLast4: 'LAST',
        claimExpiresAt: new Date(Date.now() + 60_000),
        terminalSessionName: 'ag-run-dispatch-internal-session',
      },
    });

    const sameKeyResponse = await rootAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'same-click',
      });
    expect(sameKeyResponse.status).toBe(200);
    const sameKeyDispatch = getData(sameKeyResponse as ResponseLike<DispatchResponse>);
    expect(sameKeyDispatch).toMatchObject({
      idempotent: true,
      deduped: true,
      runId: firstDispatch.run.id,
      sourceCollection: 'agDispatchTickets',
      sourceRecordId: String(ticket.get('id')),
      outputAgentRunField: 'agentRun',
      relationUpdated: true,
      run: {
        id: firstDispatch.run.id,
      },
    });
    expect(sameKeyDispatch.run).not.toHaveProperty('promptSnapshot');
    expect(sameKeyDispatch.run).not.toHaveProperty('executionPayloadJson');
    for (const internalField of [
      'claimAttempt',
      'leaseVersion',
      'claimTokenLast4',
      'claimExpiresAt',
      'terminalSessionName',
    ]) {
      expect(sameKeyDispatch.run).not.toHaveProperty(internalField);
    }

    const differentKeyResponse = await rootAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'second-click',
      });
    expect(differentKeyResponse.status).toBe(409);
    expect(getErrorMessage(differentKeyResponse as ResponseLike<unknown>)).toContain(
      'A non-terminal Agent Gateway run already exists',
    );

    const runCount = await app.db.getRepository('agRuns').count({});
    expect(runCount).toBe(1);
  });

  it('does not return idempotent existing runs hidden by run data-scope', async () => {
    const binding = await createBinding();
    const ticket = await createTicket();

    const firstResponse = await rootAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'hidden-existing-click',
      });
    expect(firstResponse.status).toBe(200);
    const firstDispatch = getData(firstResponse as ResponseLike<DispatchResponse>);

    const roleName = 'agentGatewayScopedDispatcher';
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.dispatchRun'],
      },
    });
    await grantCollectionActions(roleName, 'agDispatchTickets', ['view', 'update'], {
      view: ['title', 'ticketCode', 'agentRun', 'agentRunId'],
      update: ['agentRun', 'agentRunId'],
    });
    await grantRunScope(roleName, 'dispatch-visible-other-runs', {
      runCode: 'not-the-existing-dispatch-run',
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });
    const dispatcherAgent = await app.agent().login(user);

    const hiddenExistingResponse = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'hidden-existing-click',
      });
    expect(hiddenExistingResponse.status).toBe(404);
    expect(JSON.stringify(hiddenExistingResponse.body)).toContain('AGENT_GATEWAY_RESOURCE_NOT_VISIBLE');
    expect(JSON.stringify(hiddenExistingResponse.body)).not.toContain(firstDispatch.run.id);

    const runCount = await app.db.getRepository('agRuns').count({});
    expect(runCount).toBe(1);
    const deniedAudit = await app.db.getRepository('agAgentActionAudits').findOne({
      filter: {
        action: 'dispatch',
        runId: firstDispatch.run.id,
        permissionKey: 'agentGateway.dispatchRun',
        resultStatus: 'denied',
      },
    });
    expect(deniedAudit?.get('metadataJson')).toMatchObject({
      bindingId: binding.id,
      bindingIdentifier: binding.bindingKey,
      bindingKey: binding.bindingKey,
      existingRunId: firstDispatch.run.id,
      phase: 'existing-run-visibility',
      recordId: String(ticket.get('id')),
    });
    const failedAudits = await app.db.getRepository('agAgentActionAudits').count({
      filter: {
        action: 'dispatch',
        resultStatus: 'failed',
      },
    });
    expect(failedAudits).toBe(0);
  });

  it('does not create orphan runs for concurrent duplicate dispatch requests', async () => {
    const binding = await createBinding();
    const ticket = await createTicket();

    const responses = await Promise.all([
      rootAgent.post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`).send({
        recordId: ticket.get('id'),
        idempotencyKey: 'concurrent-click',
        expectedCollectionName: 'agDispatchTickets',
      }),
      rootAgent.post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`).send({
        recordId: ticket.get('id'),
        idempotencyKey: 'concurrent-click',
        expectedCollectionName: 'agDispatchTickets',
      }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 200]);
    const dispatches = responses.map((response) => getData(response as ResponseLike<DispatchResponse>));
    expect(new Set(dispatches.map((dispatch) => dispatch.runId)).size).toBe(1);
    expect(dispatches.some((dispatch) => dispatch.deduped)).toBe(true);

    const runCount = await app.db.getRepository('agRuns').count({});
    expect(runCount).toBe(1);
    const updatedTicket = await app.db.getRepository('agDispatchTickets').findOne({
      filter: {
        id: ticket.get('id'),
      },
    });
    expect(String(updatedTicket.get('agentRunId'))).toBe(dispatches[0].runId);
  });

  it('does not retry terminal runs until explicit retry policy exists', async () => {
    const binding = await createBinding();
    const oldRun = await app.db.getRepository('agRuns').create({
      values: {
        runCode: 'terminal-old-run',
        status: 'succeeded',
        claimAttempt: 0,
        leaseVersion: 0,
        cancelRequested: false,
        requestedAt: new Date(),
        queuedAt: new Date(),
        finishedAt: new Date(),
      },
    });
    const ticket = await createTicket({
      agentRunId: oldRun.get('id'),
    });

    const response = await rootAgent.post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`).send({
      recordId: ticket.get('id'),
      idempotencyKey: 'retry-click',
    });
    expect(response.status).toBe(409);
    expect(getErrorMessage(response as ResponseLike<unknown>)).toContain(
      'Retry for existing Agent Gateway dispatch runs is not implemented',
    );
  });

  it('rolls back the queued run when business relation writeback fails', async () => {
    const binding = await createBinding();
    const ticket = await createTicket();
    const secretErrorMessage = 'writeback blocked password=WRITEBACK_SECRET token=WRITEBACK_TOKEN';
    app.db.on('agDispatchTickets.beforeUpdate', async (model: { get(key: string): unknown }) => {
      if (model.get('agentRunId')) {
        throw new Error(secretErrorMessage);
      }
    });

    const response = await rootAgent.post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`).send({
      recordId: ticket.get('id'),
      idempotencyKey: 'rollback-click',
    });
    expect(response.status).toBe(500);
    expect(getErrorMessage(response as ResponseLike<unknown>)).toContain('Failed to write Agent Gateway run relation');
    expect(JSON.stringify(response.body)).not.toContain('WRITEBACK_SECRET');
    expect(JSON.stringify(response.body)).not.toContain('WRITEBACK_TOKEN');

    const runCount = await app.db.getRepository('agRuns').count({});
    expect(runCount).toBe(0);
    const unchangedTicket = await app.db.getRepository('agDispatchTickets').findOne({
      filter: {
        id: ticket.get('id'),
      },
    });
    expect(unchangedTicket.get('agentRunId')).toBeFalsy();
    const failedAudit = await app.db.getRepository('agAgentActionAudits').findOne({
      filter: {
        action: 'dispatch',
        permissionKey: 'agentGateway.dispatchRun',
        resultStatus: 'failed',
      },
    });
    const metadataText = JSON.stringify(failedAudit?.get('metadataJson'));
    expect(failedAudit?.get('metadataJson')).toMatchObject({
      bindingIdentifier: binding.bindingKey,
      errorName: 'DispatchWritebackError',
      errorMessage: 'Failed to write Agent Gateway run relation',
      phase: 'relation-writeback',
      recordId: String(ticket.get('id')),
      sourceRecordId: String(ticket.get('id')),
    });
    expect(metadataText).toContain('[REDACTED]');
    expect(metadataText).not.toContain('WRITEBACK_SECRET');
    expect(metadataText).not.toContain('WRITEBACK_TOKEN');
  });

  it('requires business collection permissions in addition to agent gateway dispatch permission', async () => {
    const binding = await createBinding();
    const ticket = await createTicket();
    const roleName = 'agentGatewayDispatcherOnly';
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.dispatchRun'],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });
    const dispatcherAgent = await app.agent().login(user);

    const response = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'no-business-permission',
      });
    expect(response.status).toBe(403);
    expect(getErrorMessage(response as ResponseLike<unknown>)).toContain(
      'No permission to view collection: agDispatchTickets',
    );
    expect(await app.db.getRepository('agRuns').count({})).toBe(0);
    const deniedAudit = await app.db.getRepository('agAgentActionAudits').findOne({
      filter: {
        action: 'dispatch',
        permissionKey: 'agentGateway.dispatchRun',
        resultStatus: 'denied',
      },
    });
    expect(deniedAudit?.get('metadataJson')).toMatchObject({
      bindingIdentifier: binding.bindingKey,
      errorMessage: expect.stringContaining('No permission to view collection: agDispatchTickets'),
      phase: 'business-permission',
      recordId: String(ticket.get('id')),
    });
    expect(
      await app.db.getRepository('agAgentActionAudits').count({
        filter: {
          action: 'dispatch',
          resultStatus: 'failed',
        },
      }),
    ).toBe(0);
  });

  it('does not create a run when the source record is hidden by business data-scope', async () => {
    const binding = await createBinding();
    const visibleTicket = await createTicket({
      title: 'Visible ticket',
    });
    const hiddenTicket = await createTicket({
      title: 'Hidden ticket',
    });
    const roleName = 'agentGatewaySourceScopedDispatcher';
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.dispatchRun'],
      },
    });
    const viewScope = await createCollectionScope('agDispatchTickets', 'visible dispatch tickets', {
      title: 'Visible ticket',
    });
    await grantCollectionActions(
      roleName,
      'agDispatchTickets',
      ['view', 'update'],
      {
        view: ['title', 'ticketCode', 'agentRun', 'agentRunId'],
        update: ['agentRun', 'agentRunId'],
      },
      {
        view: viewScope.id,
      },
    );
    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });
    const dispatcherAgent = await app.agent().login(user);

    const response = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        sourceCollection: 'agDispatchTickets',
        sourceRecordId: hiddenTicket.get('id'),
        idempotencyKey: 'hidden-source-record',
      });
    expect(response.status).toBe(404);
    expect(getErrorMessage(response as ResponseLike<unknown>)).toContain('Dispatch target record not found');

    expect(await app.db.getRepository('agRuns').count({})).toBe(0);
    const unchangedHiddenTicket = await app.db.getRepository('agDispatchTickets').findOne({
      filter: {
        id: hiddenTicket.get('id'),
      },
    });
    expect(unchangedHiddenTicket.get('agentRunId')).toBeFalsy();
    const unchangedVisibleTicket = await app.db.getRepository('agDispatchTickets').findOne({
      filter: {
        id: visibleTicket.get('id'),
      },
    });
    expect(unchangedVisibleTicket.get('agentRunId')).toBeFalsy();
    const deniedAudit = await app.db.getRepository('agAgentActionAudits').findOne({
      filter: {
        action: 'dispatch',
        permissionKey: 'agentGateway.dispatchRun',
        resultStatus: 'denied',
      },
    });
    expect(deniedAudit?.get('metadataJson')).toMatchObject({
      bindingIdentifier: binding.bindingKey,
      errorMessage: expect.stringContaining('Dispatch target record not found'),
      phase: 'business-record-visibility',
      recordId: String(hiddenTicket.get('id')),
      sourceCollection: 'agDispatchTickets',
      sourceRecordId: String(hiddenTicket.get('id')),
    });
  });

  it('does not create a run when the user cannot update the output relation field', async () => {
    const binding = await createBinding();
    const ticket = await createTicket();
    const roleName = 'agentGatewayRelationReadonlyDispatcher';
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.dispatchRun'],
      },
    });
    await grantCollectionActions(roleName, 'agDispatchTickets', ['view', 'update'], {
      view: ['title', 'ticketCode', 'agentRun', 'agentRunId'],
      update: ['status'],
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });
    const dispatcherAgent = await app.agent().login(user);

    const response = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        sourceCollection: 'agDispatchTickets',
        sourceRecordId: ticket.get('id'),
        idempotencyKey: 'no-output-relation-update',
      });
    expect(response.status).toBe(403);
    expect(getErrorMessage(response as ResponseLike<unknown>)).toContain(
      'No permission to write output relation field: agentRun',
    );

    expect(await app.db.getRepository('agRuns').count({})).toBe(0);
    const unchangedTicket = await app.db.getRepository('agDispatchTickets').findOne({
      filter: {
        id: ticket.get('id'),
      },
    });
    expect(unchangedTicket.get('agentRunId')).toBeFalsy();
    const deniedAudit = await app.db.getRepository('agAgentActionAudits').findOne({
      filter: {
        action: 'dispatch',
        permissionKey: 'agentGateway.dispatchRun',
        resultStatus: 'denied',
      },
    });
    expect(deniedAudit?.get('metadataJson')).toMatchObject({
      bindingIdentifier: binding.bindingKey,
      errorMessage: expect.stringContaining('No permission to write output relation field: agentRun'),
      phase: 'business-permission',
      recordId: String(ticket.get('id')),
    });
  });

  it('does not create a run when the prompt reads a source field hidden from the user', async () => {
    const template = await createTemplate({
      templateKey: 'hidden-template-field',
      templateText: 'Build {{record.title}} with {{record.skillName}}',
    });
    const binding = await createBinding({
      bindingKey: 'hidden-template-field-dispatch',
      promptTemplateId: template.id,
    });
    const ticket = await createTicket({
      skillName: 'secret-skill-selection',
    });
    const roleName = 'agentGatewayPromptFieldScopedDispatcher';
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.dispatchRun'],
      },
    });
    await grantCollectionActions(roleName, 'agDispatchTickets', ['view', 'update'], {
      view: ['title', 'ticketCode', 'agentRun', 'agentRunId'],
      update: ['agentRun', 'agentRunId'],
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });
    const dispatcherAgent = await app.agent().login(user);

    const response = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        sourceCollection: 'agDispatchTickets',
        sourceRecordId: ticket.get('id'),
        idempotencyKey: 'hidden-prompt-field',
      });
    expect(response.status).toBe(403);
    expect(getErrorMessage(response as ResponseLike<unknown>)).toContain(
      'No permission to preview template variable: record.skillName',
    );

    expect(await app.db.getRepository('agRuns').count({})).toBe(0);
    const unchangedTicket = await app.db.getRepository('agDispatchTickets').findOne({
      filter: {
        id: ticket.get('id'),
      },
    });
    expect(unchangedTicket.get('agentRunId')).toBeFalsy();
  });

  it('requires permission to select profile and skill version records', async () => {
    const runner = await createRunner();
    const template = await createTemplate({
      templateKey: 'selection-permission',
      templateText: 'Dispatch selected records',
    });
    const binding = await createBinding({
      agentProfileField: 'selectedProfile',
      promptTemplateId: template.id,
      skillFieldsJson: ['selectedSkillVersion'],
    });
    const ticket = await createTicket({
      selectedProfileId: runner.profileId,
      selectedSkillVersionId: runner.skillVersionId,
    });
    const roleName = 'agentGatewaySelectionScopedDispatcher';
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.dispatchRun'],
      },
    });
    await grantCollectionActions(roleName, 'agDispatchTickets', ['view', 'update'], {
      view: ['selectedProfile', 'selectedSkillVersion'],
      update: ['agentRun', 'agentRunId'],
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });
    const dispatcherAgent = await app.agent().login(user);

    const noProfileAccessResponse = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'no-profile-permission',
      });
    expect(noProfileAccessResponse.status).toBe(403);
    expect(getErrorMessage(noProfileAccessResponse as ResponseLike<unknown>)).toContain(
      'No permission to view collection: agAgentProfiles',
    );

    await grantCollectionActions(roleName, 'agAgentProfiles', ['view']);
    const noNodeAccessResponse = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'no-node-permission',
      });
    expect(noNodeAccessResponse.status).toBe(403);
    expect(getErrorMessage(noNodeAccessResponse as ResponseLike<unknown>)).toContain(
      'No permission to view collection: agNodes',
    );

    await grantCollectionActions(roleName, 'agNodes', ['view']);
    const noSkillVersionAccessAfterNodeResponse = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'no-skill-version-permission-after-node',
      });
    expect(noSkillVersionAccessAfterNodeResponse.status).toBe(403);
    expect(getErrorMessage(noSkillVersionAccessAfterNodeResponse as ResponseLike<unknown>)).toContain(
      'No permission to view collection: agSkillVersions',
    );

    const runCount = await app.db.getRepository('agRuns').count({});
    expect(runCount).toBe(0);
  });

  it('requires permission to use statically configured profile and node records', async () => {
    const runner = await createRunner();
    const template = await createTemplate({
      templateKey: 'static-profile-node-permission',
      templateText: 'Static dispatch',
    });
    const binding = await createBinding({
      agentProfileId: runner.profileId,
      nodeId: runner.nodeId,
      promptTemplateId: template.id,
    });
    const ticket = await createTicket();
    const roleName = 'agentGatewayStaticSelectionDispatcher';
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.dispatchRun'],
      },
    });
    await grantCollectionActions(roleName, 'agDispatchTickets', ['view', 'update'], {
      update: ['agentRun', 'agentRunId'],
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });
    const dispatcherAgent = await app.agent().login(user);

    const noProfileAccessResponse = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'static-no-profile-permission',
      });
    expect(noProfileAccessResponse.status).toBe(403);
    expect(getErrorMessage(noProfileAccessResponse as ResponseLike<unknown>)).toContain(
      'No permission to view collection: agAgentProfiles',
    );

    await grantCollectionActions(roleName, 'agAgentProfiles', ['view']);
    const noNodeAccessResponse = await dispatcherAgent
      .post(`/api/agent-gateway/dispatch-bindings/${binding.bindingKey}:dispatch`)
      .send({
        recordId: ticket.get('id'),
        idempotencyKey: 'static-no-node-permission',
      });
    expect(noNodeAccessResponse.status).toBe(403);
    expect(getErrorMessage(noNodeAccessResponse as ResponseLike<unknown>)).toContain(
      'No permission to view collection: agNodes',
    );

    const runCount = await app.db.getRepository('agRuns').count({});
    expect(runCount).toBe(0);
  });
});
