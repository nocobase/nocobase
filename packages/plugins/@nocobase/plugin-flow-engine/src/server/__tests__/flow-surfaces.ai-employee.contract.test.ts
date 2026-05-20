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
              user: 'Analyze the current record and suggest next steps.',
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
          allowedKeys: expect.arrayContaining(['aiEmployee', 'context', 'auto', 'tasks', 'style']),
        }),
      },
    });
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
      expectResolvedFlowModelContext(persisted?.props?.tasks?.[0]?.message?.workContext, table.uid);
      expect(persisted?.props?.tasks?.[0]).toMatchObject({
        title: 'Analyze current record',
        autoSend: false,
        skillSettings: { skills: ['crm'], tools: [] },
        webSearch: false,
      });
    }
    expect((await readAction(collectionAction.uid))?.props?.style).toEqual({ size: 40, mask: false });
    expect((await readAction(recordAction.uid))?.props?.style).toEqual({ size: 36, mask: false });
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
    expectResolvedFlowModelContext(tableAction?.props?.context?.workContext, formBlock.uid);
    expectResolvedFlowModelContext(tableAction?.props?.tasks?.[0]?.message?.workContext, tableBlock.uid);
    expectResolvedFlowModelContext(recordAction?.props?.context?.workContext, tableBlock.uid);
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
    expect(persisted?.props?.tasks?.[0]).toMatchObject({
      title: 'Generate insight',
      message: {
        system: 'Use the current UI context.',
        user: 'Summarize risks and next steps.',
      },
      autoSend: true,
      skillSettings: {
        skills: ['crm'],
        tools: ['web'],
      },
      model: { llmService: 'openai', model: 'gpt-4.1' },
      webSearch: false,
    });
    expectResolvedFlowModelContext(persisted?.props?.tasks?.[0]?.message?.workContext, table.uid);

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
    expect(persisted?.props?.tasks?.[0]).toMatchObject({
      title: 'Generate insight',
      message: {
        system: 'Updated system background.',
        user: 'Summarize risks and next steps.',
      },
      autoSend: true,
      skillSettings: {
        skills: [],
        tools: [],
      },
      model: { llmService: 'openai', model: 'gpt-4.1' },
      webSearch: false,
    });
    expect(persisted?.props?.style).toEqual({ size: 40, mask: true });
  });

  it('rejects malformed AI employee work context and task payloads', async () => {
    const { table } = await createTable();

    const invalidCases = [
      {
        label: 'missing workContext type',
        settings: aiEmployeeSettings({
          workContext: [{ uid: table.uid }],
        }),
        message: "settings.workContext[0].type must be 'flow-model'",
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
        message: "settings.tasks[0] does not support key 'rawProps'",
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
      expect(readErrorMessage(res)).toContain(item.message);
    }
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
