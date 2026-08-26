/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { uid } from '@nocobase/utils';
import {
  addBlockData,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getComposeBlock,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import {
  loginFlowSurfacesRootAgent,
  syncFlowSurfacesEnabledPlugins,
  wrapFlowSurfacesReadCompatibleAgent,
} from './flow-surfaces.mock-server';
import {
  FLOW_SURFACES_AI_TEST_PLUGIN_INSTALLS,
  FLOW_SURFACES_AI_TEST_PLUGINS,
  FLOW_SURFACES_MINIMAL_TEST_PLUGINS,
} from './flow-surfaces.test-plugins';

describe('flowSurfaces AI employee action contract', () => {
  const DEFAULT_AI_EMPLOYEE_USER_MESSAGE = 'Analyze the current record and suggest next steps.';
  const DEFAULT_AI_EMPLOYEE_RECORD_USER_MESSAGE = `${DEFAULT_AI_EMPLOYEE_USER_MESSAGE}\n{{ ctx.record }}`;

  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];

  async function ensureAIEmployeesCollection() {
    if (!context.db.getCollection('aiEmployees')) {
      await rootAgent.resource('collections').create({
        values: {
          name: 'aiEmployees',
          title: 'AI employees',
          autoGenId: false,
          fields: [
            { name: 'username', type: 'string', primaryKey: true, interface: 'input' },
            { name: 'nickname', type: 'string', interface: 'input' },
            { name: 'enabled', type: 'boolean', interface: 'switch', defaultValue: true },
            { name: 'deprecated', type: 'boolean', interface: 'switch', defaultValue: false },
            { name: 'category', type: 'string', interface: 'input', defaultValue: 'business' },
            { name: 'skillSettings', type: 'jsonb' },
          ],
        },
      });
      await waitForFixtureCollectionsReady(context.db, {
        aiEmployees: ['username', 'enabled', 'deprecated', 'category'],
      });
    }

    const repo = context.db.getRepository('aiEmployees');
    for (const values of [
      { username: 'dex', nickname: 'Dex', enabled: true, deprecated: false, category: 'business' },
      { username: 'disabled', nickname: 'Disabled', enabled: false, deprecated: false, category: 'business' },
      { username: 'legacy', nickname: 'Legacy', enabled: true, deprecated: true, category: 'business' },
      { username: 'devbot', nickname: 'Developer bot', enabled: true, deprecated: false, category: 'developer' },
      { username: 'restricted', nickname: 'Restricted', enabled: true, deprecated: false, category: 'business' },
    ]) {
      const existing = await repo.findOne({ filter: { username: values.username } });
      if (!existing) {
        await repo.create({ values });
      }
    }

    if (!context.db.getCollection('rolesAiEmployees')) {
      await rootAgent.resource('collections').create({
        values: {
          name: 'rolesAiEmployees',
          title: 'Role AI employees',
          fields: [
            { name: 'roleName', type: 'string', interface: 'input' },
            { name: 'aiEmployee', type: 'string', interface: 'input' },
          ],
        },
      });
      await waitForFixtureCollectionsReady(context.db, {
        rolesAiEmployees: ['roleName', 'aiEmployee'],
      });
    }
  }

  async function createFlowSurfacesAIWriterAgent(visibleUsernames: string[]) {
    const roleName = `flow_ai_writer_${uid()}`;
    await context.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: ['ui.flowSurfaces'],
      },
    });
    const grantsRepo = context.db.getRepository('rolesAiEmployees');
    for (const aiEmployee of visibleUsernames) {
      await grantsRepo.create({
        values: {
          roleName,
          aiEmployee,
        },
      });
    }
    const user = await context.db.getRepository('users').create({
      values: {
        roles: [roleName],
      },
    });
    return wrapFlowSurfacesReadCompatibleAgent(await context.app.agent().login(user), context.app);
  }

  function aiEmployeeSettings(overrides: Record<string, any> = {}) {
    return _.mergeWith(
      {},
      {
        username: 'dex',
        auto: false,
        workContext: [{ type: 'flow-model', target: 'self' }],
        tasks: [
          {
            title: 'Analyze current record',
            message: {
              system: 'Use the current UI context.',
              user: DEFAULT_AI_EMPLOYEE_USER_MESSAGE,
              workContext: [{ type: 'flow-model', target: 'self' }],
            },
            autoSend: false,
            skillSettings: { skills: ['crm'], tools: [] },
            model: null,
            webSearch: false,
          },
        ],
        style: { size: 40, mask: false },
      },
      overrides,
      (_targetValue, sourceValue) => (Array.isArray(sourceValue) ? sourceValue : undefined),
    );
  }

  async function createTable() {
    const page = await createPage(rootAgent, {
      title: `AI employee action page ${Date.now()}`,
      tabTitle: 'Overview',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    return {
      page,
      table,
    };
  }

  function expectResolvedFlowModelContext(contextItems: any[], expectedUid: string) {
    expect(contextItems).toEqual([{ type: 'flow-model', uid: expectedUid }]);
    expect(JSON.stringify(contextItems)).not.toContain('target');
    expect(JSON.stringify(contextItems)).not.toContain('self');
  }

  async function readAction(uid: string) {
    return await flowRepo.findModelById(uid, { includeAsyncNode: true });
  }

  function getPersistedTasks(action: any) {
    return _.get(action, ['stepParams', 'shortcutSettings', 'editTasks', 'tasks']);
  }

  function expectNoPersistedPropsTasks(action: any) {
    expect(action?.props || {}).not.toHaveProperty('tasks');
  }

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      enabledPluginAliases: FLOW_SURFACES_AI_TEST_PLUGINS,
      plugins: FLOW_SURFACES_AI_TEST_PLUGIN_INSTALLS,
    });
    ({ flowRepo, rootAgent } = context);
    await ensureAIEmployeesCollection();
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('exposes AI employee catalog actions only when plugin-ai is enabled', async () => {
    const { table } = await createTable();

    const enabledCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: table.uid },
          expand: ['item.configureOptions', 'item.contracts'],
        },
      }),
    );
    expect(enabledCatalog.actions.find((item: any) => item.key === 'aiEmployee')).toMatchObject({
      use: 'AIEmployeeButtonModel',
      configureOptions: {
        username: { type: 'string' },
        tasks: { type: 'array' },
      },
      settingsContract: {
        props: expect.objectContaining({
          allowedKeys: expect.arrayContaining(['aiEmployee', 'context', 'auto', 'style']),
        }),
        stepParams: expect.objectContaining({
          allowedKeys: expect.arrayContaining(['shortcutSettings']),
        }),
      },
    });
    const aiEmployeeContract = enabledCatalog.actions.find((item: any) => item.key === 'aiEmployee').settingsContract;
    expect(aiEmployeeContract.props.allowedKeys).not.toContain('tasks');
    expect(aiEmployeeContract.stepParams.groups.shortcutSettings.allowedPaths).toEqual(['editTasks.tasks']);
    expect(enabledCatalog.recordActions.find((item: any) => item.key === 'aiEmployee')).toMatchObject({
      use: 'AIEmployeeButtonModel',
    });

    await syncFlowSurfacesEnabledPlugins(
      context.app,
      FLOW_SURFACES_MINIMAL_TEST_PLUGINS,
      FLOW_SURFACES_AI_TEST_PLUGINS,
    );
    try {
      const disabledRootAgent = await loginFlowSurfacesRootAgent(context.app);
      const disabledCatalog = getData(
        await disabledRootAgent.resource('flowSurfaces').catalog({
          values: {
            target: { uid: table.uid },
          },
        }),
      );
      expect(disabledCatalog.actions.find((item: any) => item.key === 'aiEmployee')).toBeUndefined();

      const addRes = await disabledRootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings(),
        },
      });
      expect(addRes.status).toBe(400);
      expect(readErrorMessage(addRes)).toContain('@nocobase/plugin-ai');
    } finally {
      await syncFlowSurfacesEnabledPlugins(context.app, FLOW_SURFACES_AI_TEST_PLUGINS, FLOW_SURFACES_AI_TEST_PLUGINS);
      rootAgent = await loginFlowSurfacesRootAgent(context.app);
    }
  });

  it('creates collection and record AI employee actions with resolved public settings', async () => {
    const { table } = await createTable();
    const collectionAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings(),
        },
      }),
    );
    const recordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings({ style: { size: 36 } }),
        },
      }),
    );

    for (const actionUid of [collectionAction.uid, recordAction.uid]) {
      const persisted = await readAction(actionUid);
      expect(persisted?.use).toBe('AIEmployeeButtonModel');
      expect(persisted?.props?.aiEmployee?.username).toBe('dex');
      expect(persisted?.props?.auto).toBe(false);
      expectResolvedFlowModelContext(persisted?.props?.context?.workContext, table.uid);
      const persistedTasks = getPersistedTasks(persisted);
      expectResolvedFlowModelContext(persistedTasks?.[0]?.message?.workContext, table.uid);
      expect(persistedTasks?.[0]).toMatchObject({
        title: 'Analyze current record',
        autoSend: false,
        skillSettings: { skills: ['crm'], tools: [], skillsVersion: 2, toolsVersion: 2 },
        webSearch: false,
      });
      expectNoPersistedPropsTasks(persisted);
    }
    const persistedCollectionAction = await readAction(collectionAction.uid);
    const persistedRecordAction = await readAction(recordAction.uid);
    expect(persistedCollectionAction?.props?.style).toEqual({ size: 40, mask: false });
    expect(persistedRecordAction?.props?.style).toEqual({ size: 36, mask: false });
    expect(getPersistedTasks(persistedCollectionAction)?.[0]?.message?.user).toBe(DEFAULT_AI_EMPLOYEE_USER_MESSAGE);
    expect(getPersistedTasks(persistedRecordAction)?.[0]?.message?.user).toBe(DEFAULT_AI_EMPLOYEE_RECORD_USER_MESSAGE);

    const updateRecordActionRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: recordAction.uid },
        tasks: [
          {
            title: 'Analyze current record again',
          },
        ],
      },
    });
    expect(updateRecordActionRes.status, readErrorMessage(updateRecordActionRes)).toBe(200);
    const updatedRecordAction = await readAction(recordAction.uid);
    const updatedRecordUserMessage = getPersistedTasks(updatedRecordAction)?.[0]?.message?.user;
    expect(updatedRecordUserMessage).toBe(DEFAULT_AI_EMPLOYEE_RECORD_USER_MESSAGE);
    expect(updatedRecordUserMessage.match(/\{\{\s*ctx\.record\s*\}\}/g) || []).toHaveLength(1);
  });

  it('defaults AI employee workContext type and canonicalizes task prompt aliases', async () => {
    const { table } = await createTable();
    const prompt = 'Summarize the current table context and list the next action.';
    const action = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings({
            workContext: [{ target: 'self' }],
            tasks: [
              {
                title: 'Prompt alias task',
                prompt,
                message: {
                  system: 'Use the current UI context.',
                  workContext: [{ target: 'self' }],
                },
                autoSend: false,
                skillSettings: null,
                model: null,
                webSearch: false,
              },
            ],
          }),
        },
      }),
    );

    const persisted = await readAction(action.uid);
    expectResolvedFlowModelContext(persisted?.props?.context?.workContext, table.uid);
    const task = getPersistedTasks(persisted)?.[0];
    expect(task?.prompt).toBeUndefined();
    expect(task?.message?.user).toBe(prompt);
    expectResolvedFlowModelContext(task?.message?.workContext, table.uid);

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: action.uid },
        tasks: [
          {
            prompt: 'Updated prompt through alias.',
            message: {
              system: 'Updated system.',
              workContext: [{ target: 'self' }],
            },
          },
        ],
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);
    const updated = await readAction(action.uid);
    expect(getPersistedTasks(updated)?.[0]?.prompt).toBeUndefined();
    expect(getPersistedTasks(updated)?.[0]?.message?.user).toBe('Updated prompt through alias.');
    expectResolvedFlowModelContext(getPersistedTasks(updated)?.[0]?.message?.workContext, table.uid);
  });

  it('treats unversioned empty AI employee task skills and tools as preset on create', async () => {
    const { table } = await createTable();
    const action = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings({
            tasks: [
              {
                title: 'Analyze current record',
                message: {
                  system: 'Use the current UI context.',
                  user: DEFAULT_AI_EMPLOYEE_USER_MESSAGE,
                  workContext: [{ type: 'flow-model', target: 'self' }],
                },
                autoSend: false,
                skillSettings: { skills: [], tools: [] },
                model: null,
                webSearch: false,
              },
            ],
          }),
        },
      }),
    );

    const persisted = await readAction(action.uid);
    expect(getPersistedTasks(persisted)?.[0]?.skillSettings).toBeNull();
    expectResolvedFlowModelContext(getPersistedTasks(persisted)?.[0]?.message?.workContext, table.uid);
    expectNoPersistedPropsTasks(persisted);
  });

  it('resolves AI employee action settings during compose', async () => {
    const page = await createPage(rootAgent, {
      title: `AI employee compose page ${Date.now()}`,
      tabTitle: 'Overview',
    });
    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.tabSchemaUid },
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname'],
            actions: [{ type: 'aiEmployee', settings: aiEmployeeSettings() }],
            recordActions: [{ type: 'aiEmployee', settings: aiEmployeeSettings() }],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const tableBlock = getComposeBlock(getData(composeRes), 'employeesTable');
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock.uid });
    const collectionAction = _.castArray(tableReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'AIEmployeeButtonModel',
    );
    const actionsColumn = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    );
    const recordAction = _.castArray(actionsColumn?.subModels?.actions || []).find(
      (item: any) => item?.use === 'AIEmployeeButtonModel',
    );
    expectResolvedFlowModelContext(collectionAction?.props?.context?.workContext, tableBlock.uid);
    expectResolvedFlowModelContext(recordAction?.props?.context?.workContext, tableBlock.uid);
    expectResolvedFlowModelContext(getPersistedTasks(collectionAction)?.[0]?.message?.workContext, tableBlock.uid);
    expectResolvedFlowModelContext(getPersistedTasks(recordAction)?.[0]?.message?.workContext, tableBlock.uid);
    expect(getPersistedTasks(collectionAction)?.[0]?.message?.user).toBe(DEFAULT_AI_EMPLOYEE_USER_MESSAGE);
    expect(getPersistedTasks(recordAction)?.[0]?.message?.user).toBe(DEFAULT_AI_EMPLOYEE_RECORD_USER_MESSAGE);
    expectNoPersistedPropsTasks(collectionAction);
    expectNoPersistedPropsTasks(recordAction);
  });

  it('rejects duplicate AI employee actions in the same compose action container', async () => {
    const page = await createPage(rootAgent, {
      title: `AI employee duplicate compose page ${Date.now()}`,
      tabTitle: 'Overview',
    });
    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.tabSchemaUid },
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status', 'email'],
            recordActions: [
              { type: 'aiEmployee', settings: aiEmployeeSettings() },
              { type: 'aiEmployee', settings: aiEmployeeSettings() },
            ],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(400);
    expect(composeRes.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['duplicate-ai-employee-action']),
    );
    expect(readErrorMessage(composeRes)).toContain('duplicates an existing AI employee action');
  });

  it('rejects duplicate AI employee actions in the same applyBlueprint action container', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `AI employee duplicate blueprint ${Date.now()}`,
          },
        },
        tabs: [
          {
            key: 'main',
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status', 'email'],
                recordActions: [
                  { type: 'aiEmployee', settings: aiEmployeeSettings() },
                  { type: 'aiEmployee', settings: aiEmployeeSettings() },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(executeRes.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['duplicate-ai-employee-action']),
    );
  });

  it('allows same AI employee and task when public action settings differ in compose', async () => {
    const page = await createPage(rootAgent, {
      title: `AI employee non-duplicate compose page ${Date.now()}`,
      tabTitle: 'Overview',
    });
    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.tabSchemaUid },
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status', 'email'],
            recordActions: [
              { key: 'aiEmployeeDefault', type: 'aiEmployee', settings: aiEmployeeSettings() },
              { key: 'aiEmployeeAuto', type: 'aiEmployee', settings: aiEmployeeSettings({ auto: true }) },
              { key: 'aiEmployeeMask', type: 'aiEmployee', settings: aiEmployeeSettings({ style: { mask: true } }) },
              {
                key: 'aiEmployeeModel',
                type: 'aiEmployee',
                settings: aiEmployeeSettings({
                  tasks: [
                    {
                      title: 'Analyze current record',
                      message: {
                        system: 'Use the current UI context.',
                        user: DEFAULT_AI_EMPLOYEE_USER_MESSAGE,
                        workContext: [{ type: 'flow-model', target: 'self' }],
                      },
                      autoSend: false,
                      skillSettings: { skills: ['crm'], tools: [] },
                      model: { llmService: 'openai', model: 'gpt-4.1' },
                      webSearch: false,
                    },
                  ],
                }),
              },
              {
                key: 'aiEmployeeSearch',
                type: 'aiEmployee',
                settings: aiEmployeeSettings({
                  tasks: [
                    {
                      title: 'Analyze current record',
                      message: {
                        system: 'Use the current UI context.',
                        user: DEFAULT_AI_EMPLOYEE_USER_MESSAGE,
                        workContext: [{ type: 'flow-model', target: 'self' }],
                      },
                      autoSend: false,
                      skillSettings: { skills: ['crm'], tools: [] },
                      model: null,
                      webSearch: true,
                    },
                  ],
                }),
              },
            ],
          },
        ],
      },
    });

    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);
    const tableBlock = getComposeBlock(getData(composeRes), 'employeesTable');
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock.uid });
    const actionsColumn = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    );
    const aiRecordActions = _.castArray(actionsColumn?.subModels?.actions || []).filter(
      (item: any) => item?.use === 'AIEmployeeButtonModel',
    );
    expect(aiRecordActions).toHaveLength(5);
  });

  it('resolves AI employee work contexts in applyBlueprint block, record, and form actions', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `AI employee blueprint ${Date.now()}`,
          },
        },
        tabs: [
          {
            key: 'main',
            title: 'Overview',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['nickname'],
                actions: [{ type: 'aiEmployee', settings: aiEmployeeSettings() }],
              },
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                actions: [
                  {
                    type: 'aiEmployee',
                    settings: aiEmployeeSettings({
                      workContext: [{ type: 'flow-model', target: 'employeeForm' }],
                    }),
                  },
                ],
                recordActions: [{ type: 'aiEmployee', settings: aiEmployeeSettings() }],
              },
            ],
            layout: {
              rows: [['employeeForm', 'employeesTable']],
            },
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);

    const data = getData(executeRes);
    const formBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CreateFormModel')[0];
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const formReadback = await getSurface(rootAgent, { uid: formBlock.uid });
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock.uid });
    const formAction = _.castArray(formReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'AIEmployeeButtonModel',
    );
    const tableAction = _.castArray(tableReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'AIEmployeeButtonModel',
    );
    const tableActionsColumn = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    );
    const recordAction = _.castArray(tableActionsColumn?.subModels?.actions || []).find(
      (item: any) => item?.use === 'AIEmployeeButtonModel',
    );

    expectResolvedFlowModelContext(formAction?.props?.context?.workContext, formBlock.uid);
    expectResolvedFlowModelContext(getPersistedTasks(formAction)?.[0]?.message?.workContext, formBlock.uid);
    expectResolvedFlowModelContext(tableAction?.props?.context?.workContext, formBlock.uid);
    expectResolvedFlowModelContext(getPersistedTasks(tableAction)?.[0]?.message?.workContext, tableBlock.uid);
    expectResolvedFlowModelContext(recordAction?.props?.context?.workContext, tableBlock.uid);
    expectResolvedFlowModelContext(getPersistedTasks(recordAction)?.[0]?.message?.workContext, tableBlock.uid);
    expect(getPersistedTasks(formAction)?.[0]?.message?.user).toBe(DEFAULT_AI_EMPLOYEE_USER_MESSAGE);
    expect(getPersistedTasks(tableAction)?.[0]?.message?.user).toBe(DEFAULT_AI_EMPLOYEE_USER_MESSAGE);
    expect(getPersistedTasks(recordAction)?.[0]?.message?.user).toBe(DEFAULT_AI_EMPLOYEE_RECORD_USER_MESSAGE);
    expectNoPersistedPropsTasks(formAction);
    expectNoPersistedPropsTasks(tableAction);
    expectNoPersistedPropsTasks(recordAction);
  });

  it('rejects invalid AI employee usernames and block-key references', async () => {
    const { table } = await createTable();

    for (const username of ['missing', 'disabled', 'legacy', 'devbot']) {
      const res = await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings({ username }),
        },
      });
      expect(res.status).toBe(400);
      expect(readErrorMessage(res)).toContain(username);
    }

    const blockKeyRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `AI employee invalid block key ${Date.now()}`,
          },
        },
        tabs: [
          {
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                actions: [
                  {
                    type: 'aiEmployee',
                    settings: aiEmployeeSettings({
                      workContext: [{ type: 'flow-model', target: 'missingBlock' }],
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(blockKeyRes.status).toBe(400);
    expect(readErrorMessage(blockKeyRes)).toContain('missingBlock');

    const invalidTargetRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: { uid: table.uid },
        type: 'aiEmployee',
        settings: aiEmployeeSettings({
          workContext: [{ type: 'flow-model', target: 1 }],
        }),
      },
    });
    expect(invalidTargetRes.status).toBe(400);
    expect(readErrorMessage(invalidTargetRes)).toContain("target must be 'self' or a string block key");
  });

  it('rejects AI employee usernames hidden from the current writer roles', async () => {
    const { table } = await createTable();
    const writerAgent = await createFlowSurfacesAIWriterAgent(['dex']);

    const allowedRes = await writerAgent.resource('flowSurfaces').addAction({
      values: {
        target: { uid: table.uid },
        type: 'aiEmployee',
        settings: aiEmployeeSettings(),
      },
    });
    expect(allowedRes.status, readErrorMessage(allowedRes)).toBe(200);

    const hiddenRes = await writerAgent.resource('flowSurfaces').addAction({
      values: {
        target: { uid: table.uid },
        type: 'aiEmployee',
        settings: aiEmployeeSettings({ username: 'restricted' }),
      },
    });
    expect(hiddenRes.status).toBe(400);
    expect(readErrorMessage(hiddenRes)).toContain("username 'restricted' is not visible to current roles");
  });

  it('reconfigures AI employee tasks through public configure and updateSettings without dropping fields', async () => {
    const { table } = await createTable();
    const action = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings(),
        },
      }),
    );

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: action.uid },
        changes: {
          auto: true,
          tasks: [
            {
              title: 'Generate insight',
              message: {
                user: 'Summarize risks and next steps.',
                workContext: [{ type: 'flow-model', target: 'self' }],
              },
              autoSend: true,
              skillSettings: { tools: ['web'] },
              model: { llmService: 'openai', model: 'gpt-4.1' },
              webSearch: false,
            },
          ],
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    let persisted = await readAction(action.uid);
    expect(persisted?.props?.auto).toBe(true);
    expect(getPersistedTasks(persisted)?.[0]).toMatchObject({
      title: 'Generate insight',
      message: {
        system: 'Use the current UI context.',
        user: 'Summarize risks and next steps.',
      },
      autoSend: true,
      skillSettings: {
        skills: ['crm'],
        tools: ['web'],
        skillsVersion: 2,
        toolsVersion: 2,
      },
      model: { llmService: 'openai', model: 'gpt-4.1' },
      webSearch: false,
    });
    expectResolvedFlowModelContext(getPersistedTasks(persisted)?.[0]?.message?.workContext, table.uid);
    expectNoPersistedPropsTasks(persisted);

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: action.uid },
        tasks: [
          {
            message: {
              system: 'Updated system background.',
            },
            skillSettings: {
              skills: [],
              tools: [],
            },
          },
        ],
        style: {
          mask: true,
        },
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);

    persisted = await readAction(action.uid);
    expect(getPersistedTasks(persisted)?.[0]).toMatchObject({
      title: 'Generate insight',
      message: {
        system: 'Updated system background.',
        user: 'Summarize risks and next steps.',
      },
      autoSend: true,
      model: { llmService: 'openai', model: 'gpt-4.1' },
      webSearch: false,
    });
    expect(getPersistedTasks(persisted)?.[0]?.skillSettings).toBeNull();
    expect(persisted?.props?.style).toEqual({ size: 40, mask: true });
    expectNoPersistedPropsTasks(persisted);

    const explicitCustomEmptyRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: action.uid },
        tasks: [
          {
            skillSettings: {
              skills: [],
              tools: [],
              skillsVersion: 2,
              toolsVersion: 2,
            },
          },
        ],
      },
    });
    expect(explicitCustomEmptyRes.status, readErrorMessage(explicitCustomEmptyRes)).toBe(200);

    persisted = await readAction(action.uid);
    expect(getPersistedTasks(persisted)?.[0]).toMatchObject({
      title: 'Generate insight',
      skillSettings: {
        skills: [],
        tools: [],
        skillsVersion: 2,
        toolsVersion: 2,
      },
      model: { llmService: 'openai', model: 'gpt-4.1' },
      webSearch: false,
    });
    expect(persisted?.props?.style).toEqual({ size: 40, mask: true });
    expectNoPersistedPropsTasks(persisted);
  });

  it('validates AI employee task prompt variables against the current flow context', async () => {
    const { table } = await createTable();
    const recordTaskSettings = aiEmployeeSettings({
      tasks: [
        {
          title: 'Analyze record',
          message: {
            system: 'Use the current record.',
            user: 'Analyze {{ ctx.record.nickname }}.',
            workContext: [{ type: 'flow-model', target: 'self' }],
          },
          autoSend: false,
          skillSettings: { skills: [], tools: [] },
          webSearch: false,
        },
      ],
    });

    const validRecordActionRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: table.uid },
        type: 'aiEmployee',
        settings: recordTaskSettings,
      },
    });
    expect(validRecordActionRes.status, readErrorMessage(validRecordActionRes)).toBe(200);
    const validRecordAction = await readAction(getData(validRecordActionRes).uid);
    expect(getPersistedTasks(validRecordAction)?.[0]?.message?.user).toBe(
      'Analyze {{ ctx.record.nickname }}.\n{{ ctx.record }}',
    );

    const alreadyRecordActionRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: table.uid },
        type: 'aiEmployee',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Analyze record',
              message: {
                system: 'Use the current record.',
                user: DEFAULT_AI_EMPLOYEE_RECORD_USER_MESSAGE,
                workContext: [{ type: 'flow-model', target: 'self' }],
              },
              autoSend: false,
              skillSettings: { skills: [], tools: [] },
              webSearch: false,
            },
          ],
        }),
      },
    });
    expect(alreadyRecordActionRes.status, readErrorMessage(alreadyRecordActionRes)).toBe(200);
    const alreadyRecordAction = await readAction(getData(alreadyRecordActionRes).uid);
    const alreadyRecordUserMessage = getPersistedTasks(alreadyRecordAction)?.[0]?.message?.user;
    expect(alreadyRecordUserMessage).toBe(DEFAULT_AI_EMPLOYEE_RECORD_USER_MESSAGE);
    expect(alreadyRecordUserMessage.match(/\{\{\s*ctx\.record\s*\}\}/g) || []).toHaveLength(1);

    const blockActionWithRecordVarRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: { uid: table.uid },
        type: 'aiEmployee',
        settings: recordTaskSettings,
      },
    });
    expect(blockActionWithRecordVarRes.status).toBe(400);
    expect(readErrorMessage(blockActionWithRecordVarRes)).toContain('settings.tasks[0].message.user');
    expect(readErrorMessage(blockActionWithRecordVarRes)).toContain('path "record.nickname" is not available');
    expect(readErrorMessage(blockActionWithRecordVarRes)).toContain('flowSurfaces:context');

    const configurableAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings({
            tasks: [
              {
                title: 'Configure dynamic path',
                message: {
                  system: 'Use the current UI context.',
                  user: DEFAULT_AI_EMPLOYEE_USER_MESSAGE,
                  workContext: [{ type: 'flow-model', target: 'self' }],
                },
                autoSend: false,
                skillSettings: { skills: ['crm'], tools: [] },
                model: null,
                webSearch: false,
              },
            ],
          }),
        },
      }),
    );
    const validDynamicPathRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: configurableAction.uid },
        changes: {
          tasks: [
            {
              message: {
                user: 'Analyze {{ ctx.urlSearchParams.keyword }}.',
              },
            },
          ],
        },
      },
    });
    expect(validDynamicPathRes.status, readErrorMessage(validDynamicPathRes)).toBe(200);

    const validDeepContextPathRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: configurableAction.uid },
        changes: {
          tasks: [
            {
              message: {
                user: 'Analyze {{ ctx.record.manager.nickname }}.',
              },
            },
          ],
        },
      },
    });
    expect(validDeepContextPathRes.status, readErrorMessage(validDeepContextPathRes)).toBe(200);

    const invalidCases = [
      {
        label: 'whole ctx object',
        user: 'Analyze {{ctx}}.',
        expected: ['settings.tasks[0].message.user', '{{ctx}}', 'concrete ctx path', 'flowSurfaces:context'],
      },
      {
        label: 'multiline whole ctx object',
        user: 'Analyze {{\nctx\n}}.',
        expected: ['settings.tasks[0].message.user', 'whole ctx object', 'concrete ctx path', 'flowSurfaces:context'],
      },
      {
        label: 'missing ctx path',
        user: 'Analyze {{ ctx.missing.value }}.',
        expected: ['settings.tasks[0].message.user', 'path "missing.value" is not available', 'flowSurfaces:context'],
      },
      {
        label: 'non ctx expression',
        user: 'Analyze {{ foo }}.',
        expected: ['settings.tasks[0].message.user', '{{ foo }}', 'concrete ctx path', 'flowSurfaces:context'],
      },
      {
        label: 'nested dynamic ctx path',
        user: 'Analyze {{ ctx.urlSearchParams.keyword.extra }}.',
        expected: [
          'settings.tasks[0].message.user',
          'path "urlSearchParams.keyword.extra" is not available',
          'flowSurfaces:context',
        ],
      },
    ];

    for (const item of invalidCases) {
      const res = await rootAgent.resource('flowSurfaces').configure({
        values: {
          target: { uid: configurableAction.uid },
          changes: {
            tasks: [
              {
                message: {
                  user: item.user,
                },
              },
            ],
          },
        },
      });
      expect(res.status, item.label).toBe(400);
      for (const expected of item.expected) {
        expect(readErrorMessage(res)).toContain(expected);
      }
    }

    const rawStepParamsValidRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: configurableAction.uid },
        stepParams: {
          shortcutSettings: {
            editTasks: {
              tasks: [
                {
                  message: {
                    user: 'Raw step params task.',
                    workContext: [{ type: 'flow-model', target: 'self' }],
                  },
                  skillSettings: {
                    skills: [],
                    tools: [],
                  },
                },
              ],
            },
          },
        },
      },
    });
    expect(rawStepParamsValidRes.status, readErrorMessage(rawStepParamsValidRes)).toBe(200);
    const rawStepParamsAction = await readAction(configurableAction.uid);
    expect(getPersistedTasks(rawStepParamsAction)?.[0]).toMatchObject({
      message: {
        user: 'Raw step params task.',
        workContext: [{ type: 'flow-model', uid: table.uid }],
      },
    });
    expect(getPersistedTasks(rawStepParamsAction)?.[0]?.skillSettings).toBeNull();

    const rawStepParamsRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: configurableAction.uid },
        stepParams: {
          shortcutSettings: {
            editTasks: {
              tasks: [
                {
                  message: {
                    user: 'Analyze {{ctx}}.',
                  },
                },
              ],
            },
          },
        },
      },
    });
    expect(rawStepParamsRes.status).toBe(400);
    expect(readErrorMessage(rawStepParamsRes)).toContain('stepParams.shortcutSettings.editTasks.tasks[0].message.user');
    expect(readErrorMessage(rawStepParamsRes)).toContain('{{ctx}}');
    expect(readErrorMessage(rawStepParamsRes)).toContain('flowSurfaces:context');
  });

  it('rejects adding the same AI employee record action twice to one table', async () => {
    const { table } = await createTable();
    const firstRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: table.uid },
        type: 'aiEmployee',
        settings: aiEmployeeSettings(),
      },
    });
    expect(firstRes.status, readErrorMessage(firstRes)).toBe(200);

    const duplicateRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: { uid: table.uid },
        type: 'aiEmployee',
        settings: aiEmployeeSettings(),
      },
    });

    expect(duplicateRes.status).toBe(400);
    expect(readErrorMessage(duplicateRes)).toContain('duplicates an existing AI employee action');
    expect(duplicateRes.body?.errors?.[0]?.ruleId).toBe('duplicate-ai-employee-action');
  });

  it('allows adding AI employee record actions that differ by public settings', async () => {
    const { table } = await createTable();
    const variants = [
      aiEmployeeSettings(),
      aiEmployeeSettings({ auto: true }),
      aiEmployeeSettings({ style: { mask: true } }),
      aiEmployeeSettings({
        tasks: [
          {
            title: 'Analyze current record',
            message: {
              system: 'Use the current UI context.',
              user: DEFAULT_AI_EMPLOYEE_USER_MESSAGE,
              workContext: [{ type: 'flow-model', target: 'self' }],
            },
            autoSend: false,
            skillSettings: { skills: ['crm'], tools: [] },
            model: { llmService: 'openai', model: 'gpt-4.1' },
            webSearch: false,
          },
        ],
      }),
      aiEmployeeSettings({
        tasks: [
          {
            title: 'Analyze current record',
            message: {
              system: 'Use the current UI context.',
              user: DEFAULT_AI_EMPLOYEE_USER_MESSAGE,
              workContext: [{ type: 'flow-model', target: 'self' }],
            },
            autoSend: false,
            skillSettings: { skills: ['crm'], tools: [] },
            model: null,
            webSearch: true,
          },
        ],
      }),
    ];

    for (const settings of variants) {
      const response = await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings,
        },
      });
      expect(response.status, readErrorMessage(response)).toBe(200);
    }
  });

  it('clears AI employee tasks through public updateSettings', async () => {
    const { table } = await createTable();
    const action = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings(),
        },
      }),
    );

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: action.uid },
        tasks: [],
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);

    const persisted = await readAction(action.uid);
    expect(getPersistedTasks(persisted)).toEqual([]);
    expectNoPersistedPropsTasks(persisted);
  });

  it('migrates legacy props.tasks when public tasks are updated', async () => {
    const { table } = await createTable();
    const action = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings(),
        },
      }),
    );
    const persisted = await readAction(action.uid);
    await flowRepo.patch({
      uid: action.uid,
      props: {
        ...persisted.props,
        tasks: [
          {
            title: 'Legacy persisted task',
            message: {
              system: 'Legacy system.',
              user: 'Legacy user.',
              workContext: [{ type: 'flow-model', uid: table.uid }],
            },
            autoSend: false,
            skillSettings: { skills: ['legacy-skill'], tools: [] },
            webSearch: false,
          },
        ],
      },
      stepParams: {},
    });

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: action.uid },
        tasks: [
          {
            title: 'Migrated task',
            skillSettings: {
              tools: ['migrated-tool'],
            },
          },
        ],
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);

    const migrated = await readAction(action.uid);
    expect(getPersistedTasks(migrated)?.[0]).toMatchObject({
      title: 'Migrated task',
      message: {
        system: 'Legacy system.',
        user: 'Legacy user.',
      },
      skillSettings: {
        skills: ['legacy-skill'],
        tools: ['migrated-tool'],
        skillsVersion: 2,
        toolsVersion: 2,
      },
      webSearch: false,
    });
    expectResolvedFlowModelContext(getPersistedTasks(migrated)?.[0]?.message?.workContext, table.uid);
    expectNoPersistedPropsTasks(migrated);
  });

  it('migrates legacy props.tasks during unrelated public AI employee settings updates', async () => {
    const { table } = await createTable();
    const action = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings(),
        },
      }),
    );
    const persisted = await readAction(action.uid);
    await flowRepo.patch({
      uid: action.uid,
      props: {
        ...persisted.props,
        tasks: [
          {
            title: 'Legacy preserved task',
            message: {
              system: 'Legacy system.',
              user: 'Legacy user.',
              workContext: [{ type: 'flow-model', uid: table.uid }],
            },
            autoSend: false,
            skillSettings: { skills: ['legacy-skill'], tools: [] },
            webSearch: false,
          },
        ],
      },
      stepParams: {},
    });

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: action.uid },
        style: {
          mask: true,
        },
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);

    const migrated = await readAction(action.uid);
    expect(getPersistedTasks(migrated)?.[0]).toMatchObject({
      title: 'Legacy preserved task',
      message: {
        system: 'Legacy system.',
        user: 'Legacy user.',
      },
      skillSettings: {
        skills: ['legacy-skill'],
        tools: [],
        skillsVersion: 2,
        toolsVersion: 2,
      },
      webSearch: false,
    });
    expect(migrated?.props?.style).toEqual({ size: 40, mask: true });
    expectNoPersistedPropsTasks(migrated);
  });

  it('rejects malformed AI employee work context and task payloads', async () => {
    const { table } = await createTable();

    const invalidCases = [
      {
        label: 'unsupported workContext type',
        settings: aiEmployeeSettings({
          workContext: [{ type: 'record', uid: table.uid }],
        }),
        messages: [
          "settings.workContext[0].type only supports 'flow-model'",
          'type is optional and defaults to flow-model',
        ],
      },
      {
        label: 'workContext has unsupported key',
        settings: aiEmployeeSettings({
          workContext: [{ type: 'flow-model', target: 'self', foo: true }],
        }),
        message: "settings.workContext[0] does not support key 'foo'",
      },
      {
        label: 'workContext has blank target',
        settings: aiEmployeeSettings({
          workContext: [{ type: 'flow-model', uid: table.uid, target: '   ' }],
        }),
        message: "settings.workContext[0].target must be 'self' or a string block key",
      },
      {
        label: 'message is not an object',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken message',
              message: null,
            },
          ],
        }),
        message: 'settings.tasks[0].message must be an object',
      },
      {
        label: 'message has unsupported key',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken message key',
              message: {
                extra: true,
              },
            },
          ],
        }),
        message: "settings.tasks[0].message does not support key 'extra'",
      },
      {
        label: 'task workContext has blank target',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken task context',
              message: {
                workContext: [{ type: 'flow-model', uid: table.uid, target: '   ' }],
              },
            },
          ],
        }),
        message: "settings.tasks[0].message.workContext[0].target must be 'self' or a string block key",
      },
      {
        label: 'autoSend is not boolean',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken autoSend',
              message: {},
              autoSend: 'yes',
            },
          ],
        }),
        message: 'settings.tasks[0].autoSend must be a boolean',
      },
      {
        label: 'model is not an object',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken model',
              message: {},
              model: 'gpt-4.1',
            },
          ],
        }),
        message: 'settings.tasks[0].model must be an object or null',
      },
      {
        label: 'model has unsupported key',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken model key',
              message: {},
              model: { llmService: 'openai', model: 'gpt-4.1', temperature: 0.2 },
            },
          ],
        }),
        message: "settings.tasks[0].model does not support key 'temperature'",
      },
      {
        label: 'skillSettings is not an object',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken skill settings',
              message: {},
              skillSettings: [],
            },
          ],
        }),
        message: 'settings.tasks[0].skillSettings must be an object or null',
      },
      {
        label: 'skillSettings has unsupported key',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken skill settings key',
              message: {},
              skillSettings: { skills: [], tools: [], extra: true },
            },
          ],
        }),
        message: "settings.tasks[0].skillSettings does not support key 'extra'",
      },
      {
        label: 'unsupported task key',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Broken task key',
              message: {},
              rawProps: true,
            },
          ],
        }),
        messages: [
          "settings.tasks[0] does not support key 'rawProps'",
          'allowed keys: title, message, autoSend, skillSettings, model, webSearch, prompt',
          'Put user instructions in tasks[n].message.user or the prompt alias',
        ],
      },
      {
        label: 'prompt conflicts with message user',
        settings: aiEmployeeSettings({
          tasks: [
            {
              title: 'Conflicting prompt',
              prompt: 'Alias prompt.',
              message: {
                user: 'Canonical prompt.',
              },
            },
          ],
        }),
        messages: ['settings.tasks[0] cannot set both prompt and message.user', 'prompt is an alias for message.user'],
      },
      {
        label: 'style mask is not boolean',
        settings: aiEmployeeSettings({
          style: {
            mask: 'yes',
          },
        }),
        message: 'settings.style.mask must be a boolean',
      },
      {
        label: 'style has unsupported key',
        settings: aiEmployeeSettings({
          style: {
            className: 'avatar-large',
          },
        }),
        message: "settings.style does not support key 'className'",
      },
    ];

    for (const item of invalidCases) {
      const res = await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: item.settings,
        },
      });
      expect(res.status, item.label).toBe(400);
      const expectedMessages = 'messages' in item ? item.messages : [item.message];
      for (const message of expectedMessages) {
        expect(readErrorMessage(res)).toContain(message);
      }
    }

    const action = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings(),
        },
      }),
    );
    const rawStepParamsMalformedRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: action.uid },
        stepParams: {
          shortcutSettings: {
            editTasks: {
              tasks: [
                {
                  message: {
                    workContext: [{ type: 'flow-model', target: '   ' }],
                  },
                },
              ],
            },
          },
        },
      },
    });
    expect(rawStepParamsMalformedRes.status).toBe(400);
    expect(readErrorMessage(rawStepParamsMalformedRes)).toContain(
      "stepParams.shortcutSettings.editTasks.tasks[0].message.workContext[0].target must be 'self' or a string block key",
    );
  });

  it('rejects raw internal AI employee prop writes through updateSettings', async () => {
    const { table } = await createTable();
    const action = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: { uid: table.uid },
          type: 'aiEmployee',
          settings: aiEmployeeSettings(),
        },
      }),
    );

    const rawPropsRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: action.uid },
        props: {
          aiEmployee: {
            username: 'restricted',
          },
          context: {
            workContext: [{ type: 'flow-model', target: 'self' }],
          },
        },
      },
    });
    expect(rawPropsRes.status).toBe(400);
    expect(readErrorMessage(rawPropsRes)).toContain('does not accept raw props.aiEmployee');
    expect(readErrorMessage(rawPropsRes)).toContain('use top-level username, auto, workContext, tasks or style');
  });
});

function collectDescendantNodes(node: any, predicate: (input: any) => boolean, bucket: any[] = []) {
  if (!node || typeof node !== 'object') {
    return bucket;
  }
  if (predicate(node)) {
    bucket.push(node);
  }
  Object.values(node.subModels || {}).forEach((subModel) => {
    _.castArray(subModel).forEach((child) => collectDescendantNodes(child, predicate, bucket));
  });
  return bucket;
}
