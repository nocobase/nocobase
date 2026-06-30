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
  displayName?: string;
  status?: string;
  templateText?: string;
}

interface ScopeRecord {
  id: number;
}

interface PreviewResponse {
  templateId: string | null;
  templateKey: string;
  renderedPrompt: string;
  variables: Array<{
    expression: string;
    value: string;
  }>;
}

function getData<T>(response: ResponseLike<T>) {
  return response.body.data || (response.body as T);
}

function getErrorMessage<T>(response: ResponseLike<T>) {
  return response.body.errors?.[0]?.message || '';
}

describe('agent gateway prompt template APIs', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let rootUserId = '';

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
  });

  afterEach(async () => {
    await app?.destroy();
  });

  async function createTemplate(values: Record<string, unknown> = {}) {
    const response = await rootAgent.post('/api/agent-gateway/prompt-templates:create').send({
      templateKey: 'ticket-summary',
      displayName: 'Ticket summary',
      templateText: 'Summarize {{record.title}}',
      ...values,
    });

    expect(response.status).toBe(200);
    return getData(response as ResponseLike<PromptTemplateRecord>);
  }

  async function seedPreviewCollections() {
    app.db.collection({
      name: 'agPromptCustomers',
      filterTargetKey: 'name',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'secretCode' },
      ],
    });
    app.db.collection({
      name: 'agPromptTickets',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'string', name: 'internalCode', secret: true },
        {
          type: 'belongsTo',
          name: 'customer',
          target: 'agPromptCustomers',
          foreignKey: 'customerId',
          targetKey: 'id',
        },
      ],
    });
    await app.db.sync();

    const customer = await app.db.getRepository('agPromptCustomers').create({
      values: {
        name: 'Acme',
        secretCode: 'customer-secret-value',
      },
    });
    const ticket = await app.db.getRepository('agPromptTickets').create({
      values: {
        title: 'Login is broken',
        internalCode: 'ticket-secret-value',
        customerId: customer.get('id'),
      },
    });
    const hiddenTicket = await app.db.getRepository('agPromptTickets').create({
      values: {
        title: 'Billing is broken',
        internalCode: 'hidden-ticket-secret-value',
        customerId: customer.get('id'),
      },
    });

    return {
      ticketId: ticket.get('id'),
      hiddenTicketId: hiddenTicket.get('id'),
    };
  }

  async function createManagerAgent(roleName: string) {
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['agentGateway.manage'],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: `${roleName}-user`,
        roles: [roleName],
      },
    });

    return await app.agent().login(user);
  }

  async function createScope(collectionName: string, name: string, scope: Record<string, unknown>) {
    const response = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: collectionName,
        name,
        scope,
      },
    });

    expect(response.status).toBe(200);
    return getData(response as ResponseLike<ScopeRecord>);
  }

  async function grantCollectionView(
    roleName: string,
    collectionName: string,
    options: {
      fields?: string[];
      scopeId?: number;
    } = {},
  ) {
    const viewAction: Record<string, unknown> = {
      name: 'view',
    };
    if (options.fields) {
      viewAction.fields = options.fields;
    }
    if (options.scopeId) {
      viewAction.scopeId = options.scopeId;
    }

    const response = await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: collectionName,
        usingActionsConfig: true,
        actions: [viewAction],
      },
    });

    expect(response.status).toBe(200);
  }

  it('creates, lists, gets, updates, and deletes templates with unique templateKey enforcement', async () => {
    const template = await createTemplate();
    expect(template.id).toBeTruthy();
    expect(template.templateKey).toBe('ticket-summary');
    expect(template.status).toBe('active');

    const duplicateResponse = await rootAgent.post('/api/agent-gateway/prompt-templates:create').send({
      templateKey: 'ticket-summary',
      displayName: 'Duplicate',
      templateText: 'Duplicate',
    });
    expect(duplicateResponse.status).toBe(409);
    expect(getErrorMessage(duplicateResponse as ResponseLike<unknown>)).toContain('templateKey already exists');

    const listResponse = await rootAgent.get('/api/agent-gateway/prompt-templates:list');
    const templates = getData(listResponse as ResponseLike<PromptTemplateRecord[]>);
    expect(templates.map((record) => record.templateKey)).toEqual(['ticket-summary']);

    const getResponse = await rootAgent.get('/api/agent-gateway/prompt-templates:get/ticket-summary');
    expect(getData(getResponse as ResponseLike<PromptTemplateRecord>).id).toBe(template.id);

    const updateResponse = await rootAgent.post('/api/agent-gateway/prompt-templates:update/ticket-summary').send({
      displayName: 'Updated ticket summary',
      status: 'disabled',
      templateText: 'Updated {{record.title}}',
    });
    const updatedTemplate = getData(updateResponse as ResponseLike<PromptTemplateRecord>);
    expect(updatedTemplate.displayName).toBe('Updated ticket summary');
    expect(updatedTemplate.status).toBe('disabled');
    expect(updatedTemplate.templateText).toBe('Updated {{record.title}}');

    const destroyResponse = await rootAgent.post(`/api/agent-gateway/prompt-templates:destroy/${template.id}`);
    expect(destroyResponse.status).toBe(200);

    const emptyListResponse = await rootAgent.get('/api/agent-gateway/prompt-templates:list');
    expect(getData(emptyListResponse as ResponseLike<PromptTemplateRecord[]>)).toHaveLength(0);
  });

  it('renders supported variables and redacts secret-like fields during preview', async () => {
    const { ticketId } = await seedPreviewCollections();
    const template = await createTemplate({
      templateText:
        'Ticket {{record.title}} for {{record.customer.name}} by {{user.id}} at {{now}}. Codes: {{record.internalCode}} / {{record.customer.secretCode}}.',
    });

    const previewResponse = await rootAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateId: template.id,
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    const preview = getData(previewResponse as ResponseLike<PreviewResponse>);

    expect(previewResponse.status).toBe(200);
    expect(preview.templateId).toBe(template.id);
    expect(preview.renderedPrompt).toContain('Ticket Login is broken for Acme');
    expect(preview.renderedPrompt).toContain(`by ${rootUserId}`);
    expect(preview.renderedPrompt).toMatch(/ at \d{4}-\d{2}-\d{2}T/);
    expect(preview.renderedPrompt).toContain('[REDACTED] / [REDACTED]');
    expect(preview.renderedPrompt).not.toContain('ticket-secret-value');
    expect(preview.renderedPrompt).not.toContain('customer-secret-value');
    expect(preview.variables.map((variable) => variable.expression)).toEqual([
      'record.title',
      'record.customer.name',
      'user.id',
      'now',
      'record.internalCode',
      'record.customer.secretCode',
    ]);
  });

  it('rejects unknown variables and unsupported executable syntax with clear preview errors', async () => {
    const { ticketId } = await seedPreviewCollections();

    const unknownResponse = await rootAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Unknown {{record.missingField}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(unknownResponse.status).toBe(400);
    expect(getErrorMessage(unknownResponse as ResponseLike<unknown>)).toContain(
      'Unknown template variable: record.missingField',
    );

    const executableResponse = await rootAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'No code {{record.title.toString()}} and {{process.env.SECRET}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(executableResponse.status).toBe(400);
    expect(getErrorMessage(executableResponse as ResponseLike<unknown>)).toContain(
      'Unsupported template variable syntax',
    );
  });

  it('rejects malformed template delimiters with clear preview errors', async () => {
    for (const [templateText, expectedMessage] of [
      ['Missing close {{record.title', 'unclosed template variable'],
      ['Empty {{}}', 'Template variable cannot be empty'],
      ['Stray }} delimiter', 'stray closing delimiter'],
      ['Nested {{record.{{title}}}}', 'Unsupported template variable syntax'],
    ] as const) {
      const response = await rootAgent.post('/api/agent-gateway/prompt-templates:preview').send({
        templateText,
      });

      expect(response.status).toBe(400);
      expect(getErrorMessage(response as ResponseLike<unknown>)).toContain(expectedMessage);
    }
  });

  it('checks collection, field, relation, and data-scope permissions during preview', async () => {
    const { ticketId, hiddenTicketId } = await seedPreviewCollections();
    const roleName = 'agentGatewayPromptManager';
    const managerAgent = await createManagerAgent(roleName);

    const noCollectionPermissionResponse = await managerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Ticket {{record.title}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(noCollectionPermissionResponse.status).toBe(403);
    expect(getErrorMessage(noCollectionPermissionResponse as ResponseLike<unknown>)).toContain(
      'No permission to preview collection: agPromptTickets',
    );

    await grantCollectionView(roleName, 'agPromptTickets', {
      fields: ['title', 'customer'],
    });

    const titleResponse = await managerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Ticket {{record.title}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(titleResponse.status).toBe(200);
    expect(getData(titleResponse as ResponseLike<PreviewResponse>).renderedPrompt).toBe('Ticket Login is broken');

    const disallowedFieldResponse = await managerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Secret {{record.internalCode}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(disallowedFieldResponse.status).toBe(403);
    expect(getErrorMessage(disallowedFieldResponse as ResponseLike<unknown>)).toContain(
      'No permission to preview template variable: record.internalCode',
    );

    const noRelationPermissionResponse = await managerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Customer {{record.customer.name}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(noRelationPermissionResponse.status).toBe(403);
    expect(getErrorMessage(noRelationPermissionResponse as ResponseLike<unknown>)).toContain(
      'No permission to preview collection: agPromptCustomers',
    );

    const customerScope = await createScope('agPromptCustomers', 'visible prompt customers', {
      name: 'Acme',
    });
    await grantCollectionView(roleName, 'agPromptCustomers', {
      fields: ['name'],
      scopeId: customerScope.id,
    });

    const relationResponse = await managerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Customer {{record.customer.name}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(relationResponse.status).toBe(200);
    expect(getData(relationResponse as ResponseLike<PreviewResponse>).renderedPrompt).toBe('Customer Acme');

    const noUserPermissionResponse = await managerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'User {{user.id}}',
    });
    expect(noUserPermissionResponse.status).toBe(403);
    expect(getErrorMessage(noUserPermissionResponse as ResponseLike<unknown>)).toContain(
      'No permission to preview collection: users',
    );

    await grantCollectionView(roleName, 'users', {
      fields: ['id'],
    });

    const userAllowedResponse = await managerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'User {{user.id}}',
    });
    expect(userAllowedResponse.status).toBe(200);
    expect(getData(userAllowedResponse as ResponseLike<PreviewResponse>).renderedPrompt).toMatch(/^User \d+$/);

    const disallowedUserFieldResponse = await managerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'User {{user.username}}',
    });
    expect(disallowedUserFieldResponse.status).toBe(403);
    expect(getErrorMessage(disallowedUserFieldResponse as ResponseLike<unknown>)).toContain(
      'No permission to preview template variable: user.username',
    );

    const scopedUserRoleName = 'agentGatewayPromptUserScopedManager';
    const scopedUserManagerAgent = await createManagerAgent(scopedUserRoleName);
    const userScope = await createScope('users', 'other prompt users', {
      username: 'not-current-user',
    });
    await grantCollectionView(scopedUserRoleName, 'users', {
      fields: ['id'],
      scopeId: userScope.id,
    });

    const scopedUserDeniedResponse = await scopedUserManagerAgent
      .post('/api/agent-gateway/prompt-templates:preview')
      .send({
        templateText: 'User {{user.id}}',
      });
    expect(scopedUserDeniedResponse.status).toBe(403);
    expect(getErrorMessage(scopedUserDeniedResponse as ResponseLike<unknown>)).toContain(
      'No permission to preview template variable: user',
    );

    const scopedRoleName = 'agentGatewayPromptScopedManager';
    const scopedManagerAgent = await createManagerAgent(scopedRoleName);
    const scope = await createScope('agPromptTickets', 'visible prompt tickets', {
      title: 'Login is broken',
    });
    await grantCollectionView(scopedRoleName, 'agPromptTickets', {
      fields: ['title'],
      scopeId: scope.id,
    });
    expect(
      app.acl.can({
        role: scopedRoleName,
        resource: 'agPromptTickets',
        action: 'view',
      })?.params?.filter,
    ).toMatchObject({
      title: 'Login is broken',
    });

    const scopedAllowedResponse = await scopedManagerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Ticket {{record.title}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(scopedAllowedResponse.status).toBe(200);
    expect(getData(scopedAllowedResponse as ResponseLike<PreviewResponse>).renderedPrompt).toBe(
      'Ticket Login is broken',
    );

    const scopedDeniedResponse = await scopedManagerAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Ticket {{record.title}}',
      collectionName: 'agPromptTickets',
      recordId: hiddenTicketId,
    });
    expect(scopedDeniedResponse.status).toBe(404);
    expect(getErrorMessage(scopedDeniedResponse as ResponseLike<unknown>)).toContain('Preview record not found');
  });

  it('does not write full preview prompts or secrets into API call logs', async () => {
    const { ticketId } = await seedPreviewCollections();

    const previewResponse = await rootAgent.post('/api/agent-gateway/prompt-templates:preview').send({
      templateText: 'Prompt secret={{record.customer.secretCode}}',
      collectionName: 'agPromptTickets',
      recordId: ticketId,
    });
    expect(previewResponse.status).toBe(200);

    const logCount = await app.db.getRepository('agApiCallLogs').count({});
    expect(logCount).toBe(0);
  });
});
