/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGIN_INSTALLS,
  FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGINS,
  createFlowSurfacesContractContext,
  addBlockData,
  createPage,
  createMenu,
  destroyFlowSurfacesContractContext,
  getData,
  getRouteBackedTabs,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { expectTemplateUsage, getListData } from './flow-surfaces.templates.helpers';
import { FlowSurfacesService } from '../flow-surfaces/service';

describe('flowSurfaces applyBlueprint contract', () => {
  const DEFAULT_COLLECTION_BLOCK_ACTION_USES = new Set([
    'FilterActionModel',
    'CalendarNavActionModel',
    'CalendarViewSelectActionModel',
    'RefreshActionModel',
    'AddNewActionModel',
  ]);

  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let routesRepo: FlowSurfacesContractContext['routesRepo'];
  const POPUP_RELATION_SOURCE_FIELDS = ['username', 'nickname', 'email'];
  const POPUP_RELATION_TARGET_FIELDS = ['name', 'title', 'description'];
  const POPUP_RELATION_TARGET_TITLE_FIELDS = ['title', 'name', 'description'];

  function collectDescendantNodes(node: any, predicate: (input: any) => boolean, bucket: any[] = []) {
    if (!node || typeof node !== 'object') {
      return bucket;
    }
    if (predicate(node)) {
      bucket.push(node);
    }
    const subModels = _.isPlainObject(node.subModels) ? Object.values(node.subModels) : [];
    subModels.forEach((subModel) => {
      _.castArray(subModel).forEach((child) => {
        collectDescendantNodes(child, predicate, bucket);
      });
    });
    return bucket;
  }

  function collectFieldPaths(node: any) {
    return collectDescendantNodes(node, (item) => !!item?.stepParams?.fieldSettings?.init?.fieldPath).map(
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath,
    );
  }

  function findDescendantNode(node: any, predicate: (input: any) => boolean) {
    return collectDescendantNodes(node, predicate)[0];
  }

  function readDirectFormFieldPaths(node: any) {
    return _.castArray(node?.subModels?.grid?.subModels?.items || [])
      .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath)
      .filter(Boolean);
  }

  function readDirectFormDividerLabels(node: any) {
    return _.castArray(node?.subModels?.grid?.subModels?.items || [])
      .filter((item: any) => item?.use === 'DividerItemModel')
      .map((item: any) => item?.props?.label)
      .filter(Boolean);
  }

  function readNodeActionUses(node: any) {
    return _.castArray(node?.subModels?.actions || []).map((item: any) => item?.use);
  }

  function readTableRecordActionUses(node: any) {
    const actionsColumn = _.castArray(node?.subModels?.columns || []).find(
      (column: any) => column?.use === 'TableActionsColumnModel',
    );
    return readNodeActionUses(actionsColumn);
  }

  function readTableRecordActions(node: any) {
    const actionsColumn = _.castArray(node?.subModels?.columns || []).find(
      (column: any) => column?.use === 'TableActionsColumnModel',
    );
    return _.castArray(actionsColumn?.subModels?.actions || []);
  }

  function readTableColumns(node: any) {
    return _.castArray(node?.subModels?.columns || []);
  }

  function expectTreeTableTitleClickDefaults(node: any) {
    const columns = readTableColumns(node);
    expect(columns[0]?.use).toBe('TableColumnModel');
    expect(columns[0]?.stepParams?.fieldSettings?.init?.fieldPath).toBe('title');
    expect(columns[0]?.subModels?.field?.props?.clickToOpen).toBe(true);
    expect(columns[0]?.subModels?.field?.stepParams?.displayFieldSettings?.clickToOpen?.clickToOpen).toBe(true);
    expect(columns[0]?.subModels?.field?.stepParams?.popupSettings?.openView).toBeTruthy();
    expect(columns[1]?.use).toBe('TableActionsColumnModel');
  }

  function readCardItemRecordActionUses(node: any) {
    return _.castArray(node?.subModels?.item?.subModels?.actions || []).map((item: any) => item?.use);
  }

  function expectAssignedValuesMirrors(actionTree: any, assignedValues: Record<string, any>) {
    expect(actionTree.stepParams?.assignSettings?.assignFieldValues?.assignedValues).toEqual(assignedValues);
    expect(actionTree.stepParams?.apply?.apply?.assignedValues).toEqual(assignedValues);
  }

  function expectTriggerWorkflows(actionTree: any, groupKey: string, triggerWorkflows: any[]) {
    expect(actionTree.stepParams?.[groupKey]?.setTriggerWorkflows?.group).toEqual(triggerWorkflows);
  }

  async function createRequiredDefaultsCollection() {
    const collectionName = `flow_surface_required_blueprint_${_.uniqueId()}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: collectionName,
        fields: [
          {
            name: 'requiredText',
            type: 'string',
            interface: 'input',
            validation: {
              type: 'string',
              rules: [{ key: `required_${_.uniqueId()}`, name: 'required' }],
            },
          },
          {
            name: 'optionalText',
            type: 'string',
            interface: 'input',
          },
          {
            name: 'requiredOptionsText',
            type: 'string',
            interface: 'input',
            validation: {
              type: 'string',
              rules: [{ key: `required_options_${_.uniqueId()}`, name: 'required' }],
            },
          },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [collectionName]: ['requiredText', 'optionalText', 'requiredOptionsText'],
    });
    return collectionName;
  }

  function expectRequiredFormItemDefaults(node: any) {
    expect(node?.props?.required).toBe(true);
    expect(node?.stepParams?.editItemSettings?.required?.required).toBe(true);
  }

  function expectNoRequiredFormItemDefaults(node: any) {
    expect(node?.props?.required).toBeUndefined();
    expect(node?.stepParams?.editItemSettings?.required).toBeUndefined();
  }

  function findGridItemByFieldPath(blockNode: any, fieldPath: string) {
    return _.castArray(blockNode?.subModels?.grid?.subModels?.items || []).find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === fieldPath,
    );
  }

  function expectAssignFormGridItems(actionTree: any, assignedValues: Record<string, any>) {
    const items = _.castArray(actionTree.subModels?.assignForm?.subModels?.grid?.subModels?.items || []);
    expect(items).toHaveLength(Object.keys(assignedValues).length);
    Object.entries(assignedValues).forEach(([fieldPath, value]) => {
      const item = items.find((candidate: any) => candidate?.stepParams?.fieldSettings?.init?.fieldPath === fieldPath);
      expect(item).toBeTruthy();
      expect(item?.use).toBe('AssignFormItemModel');
      expect(item?.stepParams?.fieldSettings?.assignValue?.value).toEqual(value);
      expect(item?.subModels?.field?.uid).toBeTruthy();
      expect(item?.subModels?.field?.stepParams?.fieldSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'employees',
        fieldPath,
      });
    });
  }

  async function readPrimaryPopupBlockFromAction(actionUid: string) {
    const actionReadback = await getSurface(rootAgent, {
      uid: actionUid,
    });
    const popupTemplateUid = actionReadback.tree?.popup?.template?.uid;
    if (popupTemplateUid) {
      const popupTemplate = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: popupTemplateUid,
          },
        }),
      );
      const popupSurface = await getSurface(rootAgent, {
        uid: popupTemplate.targetUid,
      });
      const popupItems = _.castArray(
        popupSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      );
      return {
        actionReadback,
        popupSurface,
        popupItems,
        popupBlock: popupItems[0],
      };
    }
    const popupItems = _.castArray(
      actionReadback.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    );
    return {
      actionReadback,
      popupSurface: actionReadback,
      popupItems,
      popupBlock: popupItems[0],
    };
  }

  async function readPrimaryPopupBlockFromField(fieldUid: string) {
    const fieldReadback = await getSurface(rootAgent, {
      uid: fieldUid,
    });
    const popupTemplateUid = fieldReadback.tree?.popup?.template?.uid;
    if (popupTemplateUid) {
      const popupTemplate = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: popupTemplateUid,
          },
        }),
      );
      const popupSurface = await getSurface(rootAgent, {
        uid: popupTemplate.targetUid,
      });
      const popupItems = _.castArray(
        popupSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      );
      return {
        fieldReadback,
        popupSurface,
        popupItems,
        popupBlock: popupItems[0],
      };
    }
    const popupItems = _.castArray(
      fieldReadback.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    );
    return {
      fieldReadback,
      popupSurface: fieldReadback,
      popupItems,
      popupBlock: popupItems[0],
    };
  }

  async function createPopupTestCollection(name: string) {
    await rootAgent.resource('collections').create({
      values: {
        name,
        title: name,
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'label', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [name]: ['name', 'code', 'label'],
    });
  }

  async function createPopupRelationTestCollections(sourceCollection: string, targetCollection: string) {
    const throughCollection = `${sourceCollection}_${targetCollection}`;
    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: targetCollection,
        titleField: 'title',
        filterTargetKey: 'id',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'description', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        titleField: 'username',
        filterTargetKey: 'id',
        fields: [
          { name: 'username', type: 'string', interface: 'input' },
          { name: 'nickname', type: 'string', interface: 'input' },
          { name: 'email', type: 'string', interface: 'email' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: throughCollection,
        title: throughCollection,
        fields: [
          {
            name: 'id',
            type: 'integer',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            interface: 'id',
          },
        ],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'roles',
        type: 'belongsToMany',
        target: targetCollection,
        through: throughCollection,
        foreignKey: 'sourceId',
        otherKey: 'targetId',
        interface: 'm2m',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [sourceCollection]: POPUP_RELATION_SOURCE_FIELDS,
      [targetCollection]: POPUP_RELATION_TARGET_TITLE_FIELDS,
      [throughCollection]: ['id', 'sourceId', 'targetId'],
    });
  }

  async function createPopupRelationTestFixture(prefix: string) {
    const suffix = _.uniqueId();
    const namePrefix = prefix.replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'bpr';
    const sourceCollection = `${namePrefix}_s_${suffix}`;
    const targetCollection = `${namePrefix}_t_${suffix}`;
    await createPopupRelationTestCollections(sourceCollection, targetCollection);
    return {
      sourceCollection,
      targetCollection,
      associationName: `${sourceCollection}.roles`,
    };
  }

  async function findPopupTemplateByName(name: string) {
    const listed = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          filter: {
            name,
          },
        },
      }),
    );
    return listed.rows.find((row: any) => row.name === name);
  }

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      plugins: FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGIN_INSTALLS as any,
      enabledPluginAliases: FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGINS,
    });
    ({ rootAgent, flowRepo, routesRepo } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should default collection required validation onto applyBlueprint create and edit form items only', async () => {
    const collectionName = await createRequiredDefaultsCollection();
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        page: {
          title: 'Blueprint required defaults',
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'createForm',
                type: 'createForm',
                collection: collectionName,
                fields: ['requiredText', 'optionalText', 'requiredOptionsText'],
                actions: ['submit'],
              },
              {
                key: 'editForm',
                type: 'editForm',
                collection: collectionName,
                fields: ['requiredText'],
                actions: ['submit'],
              },
              {
                key: 'details',
                type: 'details',
                collection: collectionName,
                fields: ['requiredText'],
              },
              {
                key: 'table',
                type: 'table',
                collection: collectionName,
                fields: ['requiredText'],
              },
              {
                key: 'filter',
                type: 'filterForm',
                collection: collectionName,
                fields: [
                  {
                    key: 'requiredFilter',
                    field: 'requiredText',
                    target: 'table',
                  },
                ],
                actions: ['submit'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const blocks = _.castArray(getRouteBackedTabs(data.surface)[0]?.subModels?.grid?.subModels?.items || []);
    const createForm = blocks.find((item: any) => item?.use === 'CreateFormModel');
    const editForm = blocks.find((item: any) => item?.use === 'EditFormModel');
    const details = blocks.find((item: any) => item?.use === 'DetailsBlockModel');
    const table = blocks.find((item: any) => item?.use === 'TableBlockModel');
    const filter = blocks.find((item: any) => item?.use === 'FilterFormBlockModel');

    expectRequiredFormItemDefaults(findGridItemByFieldPath(createForm, 'requiredText'));
    expectNoRequiredFormItemDefaults(findGridItemByFieldPath(createForm, 'optionalText'));
    expectRequiredFormItemDefaults(findGridItemByFieldPath(createForm, 'requiredOptionsText'));
    expectRequiredFormItemDefaults(findGridItemByFieldPath(editForm, 'requiredText'));
    expectNoRequiredFormItemDefaults(findGridItemByFieldPath(details, 'requiredText'));
    expectNoRequiredFormItemDefaults(
      _.castArray(table?.subModels?.columns || []).find(
        (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'requiredText',
      ),
    );
    expectNoRequiredFormItemDefaults(findGridItemByFieldPath(filter, 'requiredText'));
  });

  it('should persist explicit relation titleField from applyBlueprint table fields', async () => {
    const title = `Relation title field blueprint ${Date.now()}`;
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title,
          },
        },
        page: {
          title,
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: [
                  'nickname',
                  {
                    field: 'manager',
                    titleField: 'nickname',
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const managerColumns = collectDescendantNodes(
      data.surface.tree,
      (item) => item?.use === 'TableColumnModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'manager',
    );
    const managerColumn = managerColumns.find((item) => item?.props?.titleField === 'nickname');

    expect(managerColumn?.props?.titleField).toBe('nickname');
    expect(managerColumn?.stepParams?.tableColumnSettings?.fieldNames?.label).toBe('nickname');
    expect(managerColumn?.subModels?.field?.props?.titleField).toBe('nickname');

    const invalidTitle = `Invalid relation id title field blueprint ${Date.now()}`;
    const invalidRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: invalidTitle,
          },
        },
        page: {
          title: invalidTitle,
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesIdTitleTable',
                type: 'table',
                collection: 'employees',
                fields: [
                  {
                    field: 'manager',
                    titleField: 'id',
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain("cannot use unreadable relation title field 'id'");
  });

  it('should create one page from a simplified page blueprint and return only target/surface', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title: 'Workspace',
            icon: 'AppstoreOutlined',
          },
          item: {
            title: 'Employees',
          },
        },
        page: {
          title: 'Employees',
          documentTitle: 'Employees workspace',
          enableHeader: true,
          displayTitle: true,
        },
        assets: {
          scripts: {
            overviewBanner: {
              version: '1.0.0',
              code: "ctx.render('<div>Employees overview</div>');",
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                recordActions: [
                  {
                    type: 'view',
                    title: 'View',
                    popup: {
                      title: 'Employee details',
                      blocks: [
                        {
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'employees',
                          },
                          fields: ['nickname'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          {
            title: 'Summary',
            blocks: [
              {
                type: 'jsBlock',
                title: 'Overview banner',
                script: 'overviewBanner',
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);

    expect(data).toMatchObject({
      version: '1',
      mode: 'create',
      target: {
        pageSchemaUid: expect.any(String),
        pageUid: expect.any(String),
      },
    });
    expect(Object.keys(data).sort()).toEqual(['mode', 'surface', 'target', 'version']);

    expect(getRouteBackedTabs(data.surface).map((tab: any) => tab?.props?.title)).toEqual(['Overview', 'Summary']);
    expect(data.surface.target.locator.pageSchemaUid).toBe(data.target.pageSchemaUid);
    expect(data.surface.pageRoute.menuSchemaUid).toEqual(expect.any(String));
    expect(data.surface.pageRoute.menuSchemaUid).not.toBe(data.target.pageSchemaUid);

    const pageRoute = await routesRepo.findOne({
      filter: {
        schemaUid: data.target.pageSchemaUid,
      },
    });
    expect(pageRoute?.get('menuSchemaUid')).toBe(data.surface.pageRoute.menuSchemaUid);
  });

  it('should force single-tab applyBlueprint pages to hidden-tab mode even when enableTabs is explicit true', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        page: {
          title: 'Single tab explicit tabs page',
          enableTabs: true,
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tabs = getRouteBackedTabs(data.surface);
    expect(tabs).toHaveLength(1);
    expect(data.surface.pageRoute.enableTabs).toBe(false);
    expect(data.surface.tree.props.enableTabs).toBe(false);
    expect(data.surface.tree.stepParams?.pageSettings?.general?.enableTabs).toBe(false);
    expect(tabs[0]?.props?.route?.hidden).toBe(true);
  });

  it('should reject object-shaped applyBlueprint script payloads instead of keeping the default JS block code', async () => {
    const cases = [
      {
        label: 'block script',
        block: {
          type: 'jsBlock',
          script: {
            source: 'runjs',
            value: "ctx.render('<div>Broken</div>');",
          },
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].script',
      },
      {
        label: 'field script',
        block: {
          type: 'table',
          collection: 'employees',
          fields: [
            {
              type: 'jsColumn',
              script: {
                source: 'runjs',
                value: "ctx.render('<div>Broken</div>');",
              },
            },
            'nickname',
          ],
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].fields[0].script',
      },
      {
        label: 'fieldGroups field script',
        block: {
          type: 'details',
          collection: 'employees',
          fieldGroups: [
            {
              title: 'Profile',
              fields: [
                {
                  type: 'jsColumn',
                  script: {
                    source: 'runjs',
                    value: "ctx.render('<div>Broken</div>');",
                  },
                },
                'nickname',
              ],
            },
          ],
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].fieldGroups[0].fields[0].script',
      },
      {
        label: 'action script',
        block: {
          type: 'table',
          collection: 'employees',
          fields: ['nickname'],
          actions: [
            {
              type: 'jsItem',
              script: {
                source: 'runjs',
                value: "ctx.render('<div>Broken</div>');",
              },
            },
          ],
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].actions[0].script',
      },
      {
        label: 'record action script',
        block: {
          type: 'table',
          collection: 'employees',
          fields: ['nickname'],
          recordActions: [
            {
              type: 'jsItem',
              script: {
                source: 'runjs',
                value: "ctx.render('<div>Broken</div>');",
              },
            },
          ],
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].script',
      },
    ];

    for (const testCase of cases) {
      const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          tabs: [
            {
              title: `Invalid ${testCase.label}`,
              blocks: [testCase.block],
            },
          ],
        },
      });

      expect(res.status).toBe(400);
      expect(readErrorMessage(res)).toContain(testCase.expectedPath);
      expect(readErrorMessage(res)).toContain('must be a string asset key');
      expect(readErrorMessage(res)).toContain('use settings.code for inline JS code');
      if (testCase.label === 'block script') {
        const ruleIds = Array.isArray(res.body?.errors) ? res.body.errors.map((error) => error.ruleId) : [];
        expect(ruleIds).not.toContain('jsBlock-source-required');
      }
    }
  });

  it('should reject empty applyBlueprint script asset keys instead of keeping default JS code', async () => {
    const cases = [
      {
        label: 'empty block script',
        block: {
          type: 'jsBlock',
          script: '',
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].script',
      },
      {
        label: 'whitespace field script',
        block: {
          type: 'table',
          collection: 'employees',
          fields: [
            {
              type: 'jsColumn',
              script: '   ',
            },
            'nickname',
          ],
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].fields[0].script',
      },
      {
        label: 'whitespace fieldGroups field script',
        block: {
          type: 'details',
          collection: 'employees',
          fieldGroups: [
            {
              title: 'Profile',
              fields: [
                {
                  type: 'jsColumn',
                  script: '   ',
                },
                'nickname',
              ],
            },
          ],
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].fieldGroups[0].fields[0].script',
      },
      {
        label: 'empty action script',
        block: {
          type: 'table',
          collection: 'employees',
          fields: ['nickname'],
          actions: [
            {
              type: 'jsItem',
              script: '',
            },
          ],
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].actions[0].script',
      },
      {
        label: 'whitespace record action script',
        block: {
          type: 'table',
          collection: 'employees',
          fields: ['nickname'],
          recordActions: [
            {
              type: 'jsItem',
              script: '   ',
            },
          ],
        },
        expectedPath: 'flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].script',
      },
    ];

    for (const testCase of cases) {
      const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          tabs: [
            {
              title: `Invalid ${testCase.label}`,
              blocks: [testCase.block],
            },
          ],
        },
      });

      expect(res.status).toBe(400);
      expect(readErrorMessage(res)).toContain(testCase.expectedPath);
      expect(readErrorMessage(res)).toContain('must be a non-empty string asset key');
      expect(readErrorMessage(res)).toContain('use settings.code for inline JS code');
    }
  });

  it('should reject script asset references without runnable code on jsItem actions and record actions', async () => {
    const cases = [
      {
        label: 'action script asset',
        scripts: {
          emptyActionScript: {},
        },
        block: {
          type: 'table',
          collection: 'employees',
          fields: ['nickname'],
          actions: [
            {
              type: 'jsItem',
              script: 'emptyActionScript',
            },
          ],
        },
        expected:
          "flowSurfaces applyBlueprint tabs[0].blocks[0].actions[0].script references script asset 'emptyActionScript' without non-empty code",
      },
      {
        label: 'record action script asset',
        scripts: {
          metadataOnlyRecordActionScript: {
            title: 'Metadata only',
          },
        },
        block: {
          type: 'table',
          collection: 'employees',
          fields: ['nickname'],
          recordActions: [
            {
              type: 'jsItem',
              script: 'metadataOnlyRecordActionScript',
            },
          ],
        },
        expected:
          "flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].script references script asset 'metadataOnlyRecordActionScript' without non-empty code",
      },
    ];

    for (const testCase of cases) {
      const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          assets: {
            scripts: testCase.scripts,
          },
          tabs: [
            {
              title: `Invalid ${testCase.label}`,
              blocks: [testCase.block],
            },
          ],
        },
      });

      expect(res.status).toBe(400);
      expect(readErrorMessage(res)).toContain(testCase.expected);
      expect(readErrorMessage(res)).toContain('use settings.code for inline JS code');
    }
  });

  it('should reject non-canonical applyBlueprint jsBlock authoring shapes before default JS fallback', async () => {
    const invalidCases = [
      {
        label: 'top-level code',
        block: {
          type: 'jsBlock',
          code: "ctx.render('<div>Ignored top-level code</div>');",
        },
        expectedRuleId: 'jsBlock-top-level-code-unsupported',
      },
      {
        label: 'top-level version',
        block: {
          type: 'jsBlock',
          version: 'v2',
        },
        expectedRuleId: 'jsBlock-top-level-version-unsupported',
      },
      {
        label: 'handwritten stepParams',
        block: {
          type: 'jsBlock',
          settings: {
            code: "ctx.render('<div>Inline</div>');",
            version: 'v2',
          },
          stepParams: {
            jsSettings: {
              runJs: {
                code: "ctx.render('<div>Internal</div>');",
                version: 'v2',
              },
            },
          },
        },
        expectedRuleId: 'jsBlock-stepParams-unsupported',
      },
      {
        label: 'mixed asset and inline code',
        assets: {
          scripts: {
            kpiCardsScript: {
              code: "ctx.render('<div>Asset</div>');",
              version: 'v2',
            },
          },
        },
        block: {
          type: 'jsBlock',
          script: 'kpiCardsScript',
          settings: {
            code: "ctx.render('<div>Inline</div>');",
            version: 'v2',
          },
        },
        expectedRuleId: 'jsBlock-mixed-inline-and-script',
      },
      {
        label: 'missing inline or asset source',
        block: {
          type: 'jsBlock',
          settings: {
            title: 'Missing source',
          },
        },
        expectedRuleId: 'jsBlock-source-required',
      },
      {
        label: 'deprecated js block alias',
        block: {
          type: 'js',
          settings: {
            code: "ctx.render('<div>Alias</div>');",
          },
        },
        expectedRuleId: 'jsBlock-type-alias-unsupported',
      },
    ];

    for (const testCase of invalidCases) {
      const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          ...(testCase.assets ? { assets: testCase.assets } : {}),
          tabs: [
            {
              title: `Invalid ${testCase.label}`,
              blocks: [testCase.block],
            },
          ],
        },
      });

      expect(res.status).toBe(400);
      expect(res.body?.errors?.map((error: any) => error.ruleId)).toContain(testCase.expectedRuleId);
      expect(readErrorMessage(res)).toContain('settings.code');
    }
  });

  it('should apply JS block code from an applyBlueprint script asset key', async () => {
    const code = "ctx.render('<div>Asset KPI Cards</div>');";
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        assets: {
          scripts: {
            kpiCardsScript: {
              code,
              version: 'v2',
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'kpiCards',
                type: 'jsBlock',
                script: 'kpiCardsScript',
                settings: {
                  title: 'KPI Cards',
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const jsBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'JSBlockModel')[0];
    expect(jsBlock?.stepParams?.jsSettings?.runJs).toMatchObject({
      code,
      version: 'v2',
    });
  });

  it('should apply inline JS block code from applyBlueprint settings', async () => {
    const code = "ctx.render('<div>Inline KPI Cards</div>');";
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'kpiCards',
                type: 'jsBlock',
                settings: {
                  title: 'KPI Cards',
                  code,
                  version: 'v2',
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const jsBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'JSBlockModel')[0];
    expect(jsBlock?.stepParams?.jsSettings?.runJs).toMatchObject({
      code,
      version: 'v2',
    });
  });

  it('should create flow-model calendar blocks through applyBlueprint', async () => {
    const quickCreatePopup = {
      mode: 'dialog',
      size: 'large',
    };
    const eventPopup = {
      mode: 'drawer',
      size: 'large',
    };
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Calendar blueprint',
          },
        },
        page: {
          title: 'Calendar blueprint',
        },
        defaults: {
          collections: {
            calendar_events: {
              fieldGroups: [
                {
                  key: 'eventMain',
                  title: 'Event main',
                  fields: ['title', 'status', 'startsAt', 'endsAt'],
                },
              ],
              popups: {
                addNew: {
                  name: 'Create calendar event',
                  description: 'Create one calendar event.',
                },
                view: {
                  name: 'Calendar event details',
                  description: 'View one calendar event.',
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Calendar',
            blocks: [
              {
                key: 'eventsCalendar',
                type: 'calendar',
                collection: 'calendar_events',
                settings: {
                  title: 'Events',
                  description: 'Calendar events',
                  titleField: 'title',
                  colorField: 'status',
                  startField: 'startsAt',
                  endField: 'endsAt',
                  defaultView: 'week',
                  quickCreateEvent: false,
                  showLunar: true,
                  weekStart: 0,
                  quickCreatePopup,
                  eventPopup,
                },
                actions: ['today', 'turnPages', 'title', 'selectView', 'refresh'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const calendarBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CalendarBlockModel')[0];

    expect(calendarBlock).toMatchObject({
      use: 'CalendarBlockModel',
      props: {
        fieldNames: {
          id: 'id',
          title: 'title',
          colorFieldName: 'status',
          start: 'startsAt',
          end: 'endsAt',
        },
        defaultView: 'week',
        enableQuickCreateEvent: false,
        showLunar: true,
        weekStart: 0,
      },
      stepParams: {
        cardSettings: {
          blockHeight: {
            heightMode: 'fullHeight',
          },
        },
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar_events',
          },
        },
        calendarSettings: {
          quickCreatePopupSettings: quickCreatePopup,
          eventPopupSettings: eventPopup,
        },
      },
      subModels: {
        quickCreateAction: {
          use: 'CalendarQuickCreateActionModel',
        },
        eventViewAction: {
          use: 'CalendarEventViewActionModel',
        },
      },
    });
    expect(calendarBlock.props.quickCreatePopupSettings).toBeUndefined();
    expect(calendarBlock.props.eventPopupSettings).toBeUndefined();
    expect(calendarBlock.subModels.quickCreateAction.uid).toBe(`${calendarBlock.uid}-quickCreateAction`);
    expect(calendarBlock.subModels.eventViewAction.uid).toBe(`${calendarBlock.uid}-eventViewAction`);
    expect(calendarBlock.subModels.quickCreateAction.stepParams.popupSettings.openView).toMatchObject({
      collectionName: 'calendar_events',
      mode: 'dialog',
      size: 'large',
    });
    expect(calendarBlock.subModels.eventViewAction.stepParams.popupSettings.openView).toMatchObject({
      collectionName: 'calendar_events',
      mode: 'drawer',
      size: 'large',
    });
    const quickCreateTemplateUid = calendarBlock.subModels.quickCreateAction.popup?.template?.uid;
    const eventTemplateUid = calendarBlock.subModels.eventViewAction.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(eventTemplateUid).toBeTruthy();
    expect(quickCreateTemplateUid).not.toBe(eventTemplateUid);

    const quickCreatePopupSurface = await readPrimaryPopupBlockFromAction(`${calendarBlock.uid}-quickCreateAction`);
    const eventPopupBlock = await readPrimaryPopupBlockFromAction(`${calendarBlock.uid}-eventViewAction`);
    expect(quickCreatePopupSurface.popupBlock?.use).toBe('CreateFormModel');
    expect(eventPopupBlock.popupBlock?.use).toBe('DetailsBlockModel');
    expect(
      collectDescendantNodes(
        quickCreatePopupSurface.popupBlock,
        (item) => item?.use === 'DividerItemModel' && item?.props?.label === 'Event main',
      ),
    ).toHaveLength(1);
    expect(
      collectDescendantNodes(
        eventPopupBlock.popupBlock,
        (item) => item?.use === 'DividerItemModel' && item?.props?.label === 'Event main',
      ),
    ).toHaveLength(1);
    const persistedQuickCreateAction = await flowRepo.findModelById(`${calendarBlock.uid}-quickCreateAction`, {
      includeAsyncNode: true,
    });
    const persistedEventAction = await flowRepo.findModelById(`${calendarBlock.uid}-eventViewAction`, {
      includeAsyncNode: true,
    });
    expect(persistedQuickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: quickCreatePopupSurface.popupSurface.tree.uid,
      popupTemplateUid: quickCreateTemplateUid,
    });
    expect(persistedEventAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: eventPopupBlock.popupSurface.tree.uid,
      popupTemplateUid: eventTemplateUid,
    });
    expect(readNodeActionUses(calendarBlock).filter((use) => DEFAULT_COLLECTION_BLOCK_ACTION_USES.has(use))).toEqual([
      'FilterActionModel',
      'CalendarNavActionModel',
      'CalendarViewSelectActionModel',
      'RefreshActionModel',
      'AddNewActionModel',
    ]);
  });

  it('should reject calendar main block fields fieldGroups and recordActions in applyBlueprint', async () => {
    const invalidCases = [
      {
        key: 'fields',
        payload: {
          fields: ['title'],
        },
        message: 'calendar main blocks do not support fields',
      },
      {
        key: 'fieldGroups',
        payload: {
          fieldGroups: [
            {
              title: 'Event fields',
              fields: ['title'],
            },
          ],
        },
        message: 'calendar main blocks do not support fieldGroups',
      },
      {
        key: 'recordActions',
        payload: {
          recordActions: ['view'],
        },
        message: 'calendar main blocks do not support recordActions',
      },
    ];

    for (const item of invalidCases) {
      const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          mode: 'create',
          navigation: {
            item: {
              title: `Invalid calendar blueprint ${item.key}`,
            },
          },
          page: {
            title: `Invalid calendar blueprint ${item.key}`,
          },
          tabs: [
            {
              title: 'Calendar',
              blocks: [
                {
                  key: 'eventsCalendar',
                  type: 'calendar',
                  collection: 'calendar_events',
                  ...item.payload,
                },
              ],
            },
          ],
        },
      });

      expect(executeRes.status).toBe(400);
      expect(readErrorMessage(executeRes)).toContain(item.message);
    }
  });

  it('should accept legacy wrapped dataScope filters in applyBlueprint block settings', async () => {
    const filterGroup = {
      logic: '$and',
      items: [
        {
          path: 'status',
          operator: '$eq',
          value: 'active',
        },
      ],
    };

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Legacy dataScope blueprint',
          },
        },
        page: {
          title: 'Legacy dataScope blueprint',
        },
        tabs: [
          {
            title: 'Employees',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                settings: {
                  pageSize: 20,
                  dataScope: {
                    filter: filterGroup,
                  },
                },
                fields: ['nickname', 'status'],
              },
            ],
            layout: {
              rows: [[{ key: 'employeesTable', span: 24 }]],
            },
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = findDescendantNode(data.surface.tree, (item) => item?.use === 'TableBlockModel');
    expect(tableBlock?.stepParams?.tableSettings?.dataScope?.filter).toEqual(filterGroup);
  });

  it('should create flow-model tree blocks through applyBlueprint and reject unsupported tree containers', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Tree blueprint',
          },
        },
        page: {
          title: 'Tree blueprint',
        },
        tabs: [
          {
            title: 'Tree',
            blocks: [
              {
                key: 'categoryTree',
                type: 'tree',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'categories',
                },
                settings: {
                  searchable: false,
                  defaultExpandAll: true,
                  includeDescendants: true,
                  pageSize: 200,
                  titleField: 'title',
                },
              },
            ],
            layout: {
              rows: [[{ key: 'categoryTree', span: 8 }]],
            },
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const treeBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TreeBlockModel')[0];
    expect(treeBlock).toMatchObject({
      use: 'TreeBlockModel',
      props: {
        searchable: false,
        defaultExpandAll: true,
        includeDescendants: true,
        pageSize: 200,
        fieldNames: {
          title: 'title',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'categories',
          },
        },
        treeSettings: {
          searchable: {
            searchable: false,
          },
          defaultExpandAll: {
            defaultExpandAll: true,
          },
          includeDescendants: {
            includeDescendants: true,
          },
          pageSize: {
            pageSize: 200,
          },
          titleField: {
            titleField: 'title',
          },
        },
      },
    });
    expect(treeBlock.subModels).toBeUndefined();

    const invalidCases = [
      {
        key: 'fields',
        payload: {
          fields: ['title'],
        },
        message: 'tree main blocks do not support fields',
      },
      {
        key: 'fieldGroups',
        payload: {
          fieldGroups: [
            {
              title: 'Tree fields',
              fields: ['title'],
            },
          ],
        },
        message: 'tree main blocks do not support fieldGroups',
      },
      {
        key: 'actions',
        payload: {
          actions: ['refresh'],
        },
        message: 'tree main blocks do not support actions',
      },
      {
        key: 'recordActions',
        payload: {
          recordActions: ['view'],
        },
        message: 'tree main blocks do not support recordActions',
      },
    ];

    for (const item of invalidCases) {
      const invalidRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          mode: 'create',
          navigation: {
            item: {
              title: `Invalid tree blueprint ${item.key}`,
            },
          },
          page: {
            title: `Invalid tree blueprint ${item.key}`,
          },
          tabs: [
            {
              title: 'Tree',
              blocks: [
                {
                  key: 'categoryTree',
                  type: 'tree',
                  collection: 'categories',
                  ...item.payload,
                },
              ],
            },
          ],
        },
      });

      expect(invalidRes.status).toBe(400);
      expect(readErrorMessage(invalidRes)).toContain(item.message);
    }
  });

  it('should persist tree connectFields targets from applyBlueprint settings', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Tree connect blueprint',
          },
        },
        page: {
          title: 'Tree connect blueprint',
        },
        tabs: [
          {
            key: 'main',
            title: 'Tree connect',
            blocks: [
              {
                key: 'usersTree',
                type: 'tree',
                collection: 'employees',
                settings: {
                  connectFields: {
                    targets: [{ target: 'usersTable' }],
                  },
                },
              },
              {
                key: 'usersTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: {
              rows: [
                [
                  { key: 'usersTree', span: 8 },
                  { key: 'usersTable', span: 16 },
                ],
              ],
            },
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const treeBlock = findDescendantNode(data.surface.tree, (item) => item?.use === 'TreeBlockModel');
    const tableBlock = findDescendantNode(data.surface.tree, (item) => item?.use === 'TableBlockModel');
    const blockGrid = findDescendantNode(data.surface.tree, (item) => item?.use === 'BlockGridModel');
    expect(blockGrid?.filterManager).toEqual(
      expect.arrayContaining([
        {
          filterId: treeBlock.uid,
          targetId: tableBlock.uid,
          filterPaths: ['id'],
        },
      ]),
    );
  });

  it('should reject duplicate tree connectFields targets from applyBlueprint settings', async () => {
    const duplicateRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Duplicate tree connect blueprint',
          },
        },
        tabs: [
          {
            key: 'main',
            blocks: [
              {
                key: 'usersTree',
                type: 'tree',
                collection: 'employees',
                settings: {
                  connectFields: {
                    targets: [{ target: 'usersTable' }, { target: 'usersTable', filterPaths: ['id'] }],
                  },
                },
              },
              {
                key: 'usersTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(duplicateRes.status).toBe(400);
    expect(readErrorMessage(duplicateRes)).toContain('duplicate target');
  });

  it('should apply block-level defaultFilter in applyBlueprint data blocks and prefer explicit action settings', async () => {
    const blockDefaultFilter = {
      logic: '$and',
      items: [
        {
          path: 'nickname',
          operator: '$includes',
          value: 'staff',
        },
        {
          path: 'status',
          operator: '$notEmpty',
        },
        {
          path: 'email',
          operator: '$notEmpty',
        },
      ],
    };
    const explicitActionFilter = {
      logic: '$and',
      items: [
        {
          path: 'status',
          operator: '$eq',
          value: 'active',
        },
        {
          path: 'email',
          operator: '$notEmpty',
        },
        {
          path: 'phone',
          operator: '$notEmpty',
        },
      ],
    };
    const calendarBlockDefaultFilter = {
      logic: '$and',
      items: [
        {
          path: 'title',
          operator: '$includes',
          value: 'planning',
        },
        {
          path: 'status',
          operator: '$notEmpty',
        },
        {
          path: 'category',
          operator: '$notEmpty',
        },
      ],
    };

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Employees default filters',
          },
        },
        page: {
          title: 'Employees default filters',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: blockDefaultFilter,
                fields: ['nickname'],
              },
              {
                key: 'employeesList',
                type: 'list',
                collection: 'employees',
                defaultFilter: blockDefaultFilter,
                fields: ['nickname'],
              },
              {
                key: 'employeesCards',
                type: 'gridCard',
                collection: 'employees',
                defaultFilter: blockDefaultFilter,
                fields: ['nickname'],
                actions: [
                  {
                    key: 'filterAction',
                    type: 'filter',
                    settings: {
                      defaultFilter: explicitActionFilter,
                    },
                  },
                ],
              },
              {
                key: 'eventsCalendar',
                type: 'calendar',
                collection: 'calendar_events',
                defaultFilter: calendarBlockDefaultFilter,
              },
            ],
            layout: {
              rows: [
                ['employeesTable', 'employeesList'],
                ['employeesCards', 'eventsCalendar'],
              ],
            },
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const listBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ListBlockModel')[0];
    const gridCardBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'GridCardBlockModel')[0];
    const calendarBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CalendarBlockModel')[0];
    const tableFilterAction = _.castArray(tableBlock?.subModels?.actions || []).find(
      (item: any) => item?.use === 'FilterActionModel',
    );
    const listFilterAction = _.castArray(listBlock?.subModels?.actions || []).find(
      (item: any) => item?.use === 'FilterActionModel',
    );
    const gridCardFilterAction = _.castArray(gridCardBlock?.subModels?.actions || []).find(
      (item: any) => item?.use === 'FilterActionModel',
    );
    const calendarFilterAction = _.castArray(calendarBlock?.subModels?.actions || []).find(
      (item: any) => item?.use === 'FilterActionModel',
    );

    expect(tableFilterAction?.props?.defaultFilterValue).toEqual(blockDefaultFilter);
    expect(tableFilterAction?.stepParams?.filterSettings?.defaultFilter?.defaultFilter).toEqual(blockDefaultFilter);
    expect(tableFilterAction?.props?.filterableFieldNames).toBeUndefined();
    expect(tableFilterAction?.stepParams?.filterSettings?.filterableFieldNames).toBeUndefined();
    expect(listFilterAction?.props?.defaultFilterValue).toEqual(blockDefaultFilter);
    expect(listFilterAction?.stepParams?.filterSettings?.defaultFilter?.defaultFilter).toEqual(blockDefaultFilter);
    expect(gridCardFilterAction?.props?.defaultFilterValue).toEqual(explicitActionFilter);
    expect(gridCardFilterAction?.stepParams?.filterSettings?.defaultFilter?.defaultFilter).toEqual(
      explicitActionFilter,
    );
    expect(calendarFilterAction?.props?.defaultFilterValue).toEqual(calendarBlockDefaultFilter);
    expect(calendarFilterAction?.stepParams?.filterSettings?.defaultFilter?.defaultFilter).toEqual(
      calendarBlockDefaultFilter,
    );
  });

  it('should accept sort as a compatibility alias for sorting in applyBlueprint block settings', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Employees sort alias blueprint',
          },
        },
        page: {
          title: 'Employees sort alias blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                settings: {
                  sort: ['-createdAt', 'nickname'],
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    expect(tableBlock?.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'createdAt',
        direction: 'desc',
      },
      {
        field: 'nickname',
        direction: 'asc',
      },
    ]);

    const conflictRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Employees sort conflict blueprint',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                settings: {
                  sort: ['-createdAt'],
                  sorting: [
                    {
                      field: 'createdAt',
                      direction: 'asc',
                    },
                  ],
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });
    expect(conflictRes.status).toBe(400);
    expect(readErrorMessage(conflictRes)).toContain('sort');
    expect(readErrorMessage(conflictRes)).toContain('sorting');
  });

  it('should normalize public sort direction aliases in applyBlueprint block settings', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Employees sort direction alias blueprint',
          },
        },
        page: {
          title: 'Employees sort direction alias blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                settings: {
                  sort: [
                    {
                      field: 'createdAt',
                      direction: 'ascending',
                    },
                    {
                      field: 'nickname',
                      direction: 'descending',
                    },
                  ],
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    expect(tableBlock?.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'createdAt',
        direction: 'asc',
      },
      {
        field: 'nickname',
        direction: 'desc',
      },
    ]);
  });

  it('should preserve explicit empty table sorting in applyBlueprint', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Employees empty sorting blueprint',
          },
        },
        page: {
          title: 'Employees empty sorting blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                settings: {
                  sorting: [],
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    expect(tableBlock?.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([]);
  });

  it('should reject empty block-level defaultFilter groups in applyBlueprint data blocks', async () => {
    for (const block of [
      {
        key: 'employeesTable',
        type: 'table',
        collection: 'employees',
        defaultFilter: {},
        fields: ['nickname'],
      },
      {
        key: 'eventsCalendar',
        type: 'calendar',
        collection: 'calendar_events',
        defaultFilter: null,
      },
      {
        key: 'tasksKanban',
        type: 'kanban',
        collection: 'tasks',
        defaultFilter: {
          logic: '$and',
          items: [],
        },
        fields: ['title'],
      },
    ]) {
      const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          mode: 'create',
          navigation: {
            item: {
              title: `Empty default filter ${block.key}`,
            },
          },
          page: {
            title: `Empty default filter ${block.key}`,
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [block],
              layout: {
                rows: [[block.key]],
              },
            },
          ],
        },
      });

      expect(executeRes.status).toBe(400);
      const message = readErrorMessage(executeRes);
      expect(message).toMatch(/cannot be explicitly empty|must include at least one concrete filter item/);
      expect(message).toContain('flowSurfaces authoring $.tabs[0].blocks[0].defaultFilter');
      expect(message).not.toContain('flowSurfaces applyBlueprint flowSurfaces applyBlueprint');
    }
  });

  it('should auto-complete bare relation fields in applyBlueprint with non-empty view popups', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Employees relation popup',
          },
        },
        page: {
          title: 'Employees relation popup',
          documentTitle: 'Employees relation popup',
          enableHeader: true,
          displayTitle: true,
        },
        tabs: [
          {
            key: 'main',
            title: 'Overview',
            blocks: [
              {
                key: 'employeesDetails',
                type: 'details',
                collection: 'employees',
                fields: ['department'],
              },
            ],
          },
        ],
      },
    });
    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const executeData = getData(executeRes);
    const pageSchemaUid = executeData.target.pageSchemaUid;
    const readback = await getSurface(rootAgent, {
      pageSchemaUid,
    });
    const detailsBlock = readback.tree.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items?.[0];
    const departmentFieldNodes = collectDescendantNodes(
      detailsBlock,
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'department',
    );
    const departmentField =
      departmentFieldNodes.find(
        (item) =>
          item?.props?.clickToOpen === true ||
          !!item?.popup?.template?.uid ||
          !!item?.subModels?.page?.uid ||
          !!item?.stepParams?.popupSettings?.openView,
      ) || departmentFieldNodes[departmentFieldNodes.length - 1];
    expect(departmentField?.props?.clickToOpen).toBe(true);

    if (departmentField?.popup?.template?.uid) {
      const popupTemplate = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: departmentField.popup.template.uid,
          },
        }),
      );
      const popupTemplateSurface = await getSurface(rootAgent, {
        uid: popupTemplate.targetUid,
      });
      const popupTemplateBlock = _.castArray(
        popupTemplateSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      )[0];
      expect(popupTemplateBlock?.use).toBe('DetailsBlockModel');
    } else {
      expect(departmentField?.subModels?.page?.use).toBe('ChildPageModel');
      const popupBlock = _.castArray(
        departmentField?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      )[0];
      expect(popupBlock?.use).toBe('DetailsBlockModel');
    }
  });

  it('should ignore local popup blocks/layout/mode when applyBlueprint binds popup.template', async () => {
    const sourcePage = await createPage(rootAgent, {
      title: `Popup template source page ${Date.now()}`,
      tabTitle: 'Source',
    });
    const sourceDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: sourcePage.gridUid },
          type: 'details',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
          fields: ['nickname'],
        },
      }),
    );
    const sourceField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: { uid: sourceDetails.uid },
          fieldPath: 'nickname',
          popup: {
            blocks: [
              {
                key: 'sourcePopupDetails',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['nickname'],
              },
            ],
          },
        },
      }),
    );
    const popupTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: sourceField.fieldUid || sourceField.uid },
          name: `Blueprint popup template ${Date.now()}`,
          description: 'Reusable popup template for applyBlueprint mixed popup payload coverage.',
          saveMode: 'duplicate',
        },
      }),
    );

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            title: `Popup template blueprint group ${Date.now()}`,
            icon: 'AppstoreOutlined',
          },
          item: {
            title: `Popup template blueprint page ${Date.now()}`,
          },
        },
        page: {
          title: 'Popup template blueprint page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: [
                  {
                    field: 'nickname',
                    popup: {
                      title: 'Employee quick view',
                      template: {
                        uid: popupTemplate.uid,
                        mode: 'reference',
                      },
                      mode: 'append',
                      blocks: [
                        {
                          key: 'ignoredPopupDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'employees',
                          },
                          fields: ['status'],
                        },
                      ],
                      layout: {
                        rows: [['ignoredPopupDetails']],
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const templatedField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'nickname' &&
        item?.popup?.template?.uid === popupTemplate.uid,
    )[0];

    expect(templatedField?.popup?.template).toMatchObject({
      uid: popupTemplate.uid,
      mode: 'reference',
    });
    expect(templatedField?.popup?.pageUid).toBeUndefined();
    expect(templatedField?.popup?.tabUid).toBeUndefined();
    expect(templatedField?.popup?.gridUid).toBeUndefined();
    expect(templatedField?.stepParams?.popupSettings?.openView).toMatchObject({
      title: 'Employee quick view',
    });
    expect(collectDescendantNodes(data.surface.tree, (item) => item?.use === 'MarkdownBlockModel')).toHaveLength(0);
  });

  it('should auto-select popup templates through applyBlueprint popup.tryTemplate and keep inline popup fallback on misses', async () => {
    const popupTryTemplateCollection = `blueprint_popup_try_template_${Date.now()}`;
    await rootAgent.resource('collections').create({
      values: {
        name: popupTryTemplateCollection,
        title: 'Blueprint popup tryTemplate targets',
        fields: [{ name: 'nickname', type: 'string', interface: 'input' }],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [popupTryTemplateCollection]: ['nickname'],
    });

    const sourcePage = await createPage(rootAgent, {
      title: `Popup tryTemplate source page ${Date.now()}`,
      tabTitle: 'Source',
    });
    const sourceDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: sourcePage.gridUid },
          type: 'details',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: popupTryTemplateCollection,
          },
          fields: ['nickname'],
        },
      }),
    );
    const sourceField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: { uid: sourceDetails.uid },
          fieldPath: 'nickname',
          popup: {
            blocks: [
              {
                key: 'employeePopupDetails',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['nickname'],
              },
            ],
          },
        },
      }),
    );
    const popupTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: sourceField.fieldUid || sourceField.uid },
          name: `Blueprint popup tryTemplate ${Date.now()}`,
          description: 'Reusable popup template for applyBlueprint popup.tryTemplate coverage.',
          saveMode: 'duplicate',
        },
      }),
    );

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Popup tryTemplate blueprint page ${Date.now()}`,
          },
        },
        page: {
          title: 'Popup tryTemplate blueprint page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: popupTryTemplateCollection,
                fields: [
                  {
                    field: 'nickname',
                    popup: {
                      title: 'Employee quick view',
                      tryTemplate: true,
                    },
                  },
                ],
              },
              {
                key: 'skillDetails',
                type: 'details',
                collection: 'skills',
                fields: [
                  {
                    field: 'label',
                    popup: {
                      title: 'Skill quick view',
                      tryTemplate: true,
                      blocks: [
                        {
                          key: 'skillPopupDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'skills',
                          },
                          fields: ['label'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const templatedField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'nickname' &&
        item?.popup?.template?.uid === popupTemplate.uid,
    )[0];
    expect(templatedField?.popup?.template).toMatchObject({
      uid: popupTemplate.uid,
      mode: 'reference',
    });
    expect(templatedField?.popup?.pageUid).toBeUndefined();
    expect(templatedField?.stepParams?.popupSettings?.openView).toMatchObject({
      title: 'Employee quick view',
    });

    const fallbackField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'label' &&
        (item?.popup?.pageUid || item?.popup?.template?.uid),
    )[0];
    expect(fallbackField?.uid).toBeTruthy();
    const fallbackPopup = await readPrimaryPopupBlockFromField(fallbackField.uid);
    expect(
      collectDescendantNodes(
        fallbackPopup.popupSurface.tree,
        (item) =>
          item?.use === 'DetailsBlockModel' && item?.stepParams?.resourceSettings?.init?.collectionName === 'skills',
      ),
    ).toHaveLength(1);
  });

  it('should reject partial popup template block matches for multi-block tryTemplate requests', async () => {
    const unique = Date.now();
    const collectionName = `bp_popup_partial_match_${unique}`;
    await createPopupTestCollection(collectionName);

    const sourcePage = await createPage(rootAgent, {
      title: `Popup partial template source ${unique}`,
      tabTitle: 'Source',
    });
    const sourceDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: sourcePage.gridUid },
          type: 'details',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName,
          },
          fields: ['name'],
        },
      }),
    );
    const sourceField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: { uid: sourceDetails.uid },
          fieldPath: 'name',
          popup: {
            blocks: [
              {
                key: 'singleDetailsPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const partialTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: sourceField.fieldUid || sourceField.uid },
          name: `Blueprint partial popup template ${unique}`,
          description: 'Single-block popup template must not satisfy a multi-block popup request.',
          saveMode: 'duplicate',
        },
      }),
    );

    const targetPage = await createPage(rootAgent, {
      title: `Popup partial template target ${unique}`,
      tabTitle: 'Target',
    });
    const targetDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: targetPage.gridUid },
          type: 'details',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName,
          },
          fields: ['name'],
        },
      }),
    );
    const targetField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: { uid: targetDetails.uid },
          fieldPath: 'code',
          popup: {
            tryTemplate: true,
            blocks: [
              {
                key: 'firstDetailsPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['code'],
              },
              {
                key: 'secondDetailsPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['label'],
              },
            ],
          },
        },
      }),
    );
    const hostUids = _.uniq([targetField.fieldUid, targetField.wrapperUid, targetField.uid].filter(Boolean));
    const hostReadbacks = await Promise.all(hostUids.map((uid: string) => getSurface(rootAgent, { uid })));
    hostReadbacks.forEach((readback) => {
      expect(readback.tree?.popup?.template?.uid).not.toBe(partialTemplate.uid);
    });
    const popupReadback = hostReadbacks.find(
      (readback) =>
        _.castArray(readback.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [])
          .length,
    );

    expect(popupReadback).toBeTruthy();
    const popupBlocks = _.castArray(
      popupReadback?.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    );
    expect(popupBlocks.map((item: any) => item?.use)).toEqual(['DetailsBlockModel', 'DetailsBlockModel']);
    expect(collectFieldPaths({ subModels: { page: popupReadback?.tree?.subModels?.page } })).toEqual(
      expect.arrayContaining(['code', 'label']),
    );
  });

  it('should reject popup template matches with extra blocks or reordered explicit popup blocks', async () => {
    const unique = Date.now();
    const collectionName = `bp_popup_block_shape_${unique}`;
    await createPopupTestCollection(collectionName);

    const sourcePage = await createPage(rootAgent, {
      title: `Popup block shape source ${unique}`,
      tabTitle: 'Source',
    });
    const sourceTable = await addBlockData(rootAgent, {
      target: { uid: sourcePage.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      fields: ['name'],
    });
    const sourceTwoBlockAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: sourceTable.uid },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'firstSourceDetailsPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
              {
                key: 'secondSourceDetailsPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['code'],
              },
            ],
          },
        },
      }),
    );
    const extraBlockTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: sourceTwoBlockAction.uid },
          name: `Blueprint extra block popup template ${unique}`,
          description: 'Two-block popup template must not satisfy a one-block popup request.',
          saveMode: 'duplicate',
        },
      }),
    );
    const sourceReorderedAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: sourceTable.uid },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'sourceMarkdownPopup',
                type: 'markdown',
                settings: {
                  content: 'Source markdown first.',
                },
              },
              {
                key: 'sourceDetailsPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const reorderedTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: sourceReorderedAction.uid },
          name: `Blueprint reordered popup template ${unique}`,
          description: 'Reordered popup template must not satisfy an explicit popup block order.',
          saveMode: 'duplicate',
        },
      }),
    );

    const targetPage = await createPage(rootAgent, {
      title: `Popup block shape target ${unique}`,
      tabTitle: 'Target',
    });
    const targetTable = await addBlockData(rootAgent, {
      target: { uid: targetPage.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      fields: ['name'],
    });
    const oneBlockAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: targetTable.uid },
          type: 'view',
          popup: {
            tryTemplate: true,
            blocks: [
              {
                key: 'targetOneBlockDetailsPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['label'],
              },
            ],
          },
        },
      }),
    );
    const oneBlockPopup = await readPrimaryPopupBlockFromAction(oneBlockAction.uid);
    expect(oneBlockPopup.actionReadback.tree?.popup?.template?.uid).not.toBe(extraBlockTemplate.uid);
    expect(oneBlockPopup.popupItems.map((item: any) => item?.use)).toEqual(['DetailsBlockModel']);

    const orderedAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: targetTable.uid },
          type: 'view',
          popup: {
            tryTemplate: true,
            blocks: [
              {
                key: 'targetDetailsFirstPopup',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['code'],
              },
              {
                key: 'targetMarkdownSecondPopup',
                type: 'markdown',
                settings: {
                  content: 'Target markdown second.',
                },
              },
            ],
          },
        },
      }),
    );
    const orderedPopup = await readPrimaryPopupBlockFromAction(orderedAction.uid);
    expect(orderedPopup.actionReadback.tree?.popup?.template?.uid).not.toBe(reorderedTemplate.uid);
    expect(orderedPopup.popupItems.map((item: any) => item?.use)).toEqual(['DetailsBlockModel', 'MarkdownBlockModel']);
  });

  it('should include order and settings in popup save-reuse semantic signatures', () => {
    const service = new FlowSurfacesService({ db: {} } as any);
    const fieldItem = (fieldPath: string, uid: string, props: Record<string, any> = {}) => ({
      uid,
      key: `${uid}-key`,
      parentUid: `${uid}-parent`,
      use: 'FormItemModel',
      props,
      createdAt: `${uid}-created-at`,
      updatedAt: `${uid}-updated-at`,
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'semantic_signature_targets',
            fieldPath,
          },
        },
      },
    });
    const popupTree = (items: any[], uidPrefix: string) => ({
      uid: `${uidPrefix}-page`,
      key: `${uidPrefix}-page-key`,
      parentUid: `${uidPrefix}-host`,
      use: 'ChildPageModel',
      createdAt: `${uidPrefix}-page-created-at`,
      updatedAt: `${uidPrefix}-page-updated-at`,
      subModels: {
        tabs: [
          {
            uid: `${uidPrefix}-tab`,
            key: `${uidPrefix}-tab-key`,
            use: 'TabModel',
            subModels: {
              grid: {
                uid: `${uidPrefix}-grid`,
                key: `${uidPrefix}-grid-key`,
                use: 'GridModel',
                subModels: {
                  items: [
                    {
                      uid: `${uidPrefix}-block`,
                      key: `${uidPrefix}-block-key`,
                      use: 'DetailsBlockModel',
                      subModels: {
                        grid: {
                          uid: `${uidPrefix}-block-grid`,
                          key: `${uidPrefix}-block-grid-key`,
                          use: 'GridModel',
                          subModels: {
                            items,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });
    const signatureOf = (input: any) => (service as any).buildPopupTemplateTreeSemanticSignature(input);

    expect(signatureOf(popupTree([fieldItem('name', 'a-name'), fieldItem('code', 'a-code')], 'a'))).toBe(
      signatureOf(popupTree([fieldItem('name', 'b-name'), fieldItem('code', 'b-code')], 'b')),
    );
    expect(signatureOf(popupTree([fieldItem('name', 'a-name'), fieldItem('code', 'a-code')], 'a'))).not.toBe(
      signatureOf(popupTree([fieldItem('code', 'c-code'), fieldItem('name', 'c-name')], 'c')),
    );
    expect(signatureOf(popupTree([fieldItem('name', 'a-name'), fieldItem('code', 'a-code')], 'a'))).not.toBe(
      signatureOf(
        popupTree([fieldItem('name', 'd-name', { extra: 'different helper' }), fieldItem('code', 'd-code')], 'd'),
      ),
    );
  });

  it('should keep popup.tryTemplate false as a hard opt-out for default relation field popup templates', async () => {
    const unique = Date.now();
    const sourceCollection = `bptfs_${unique}`;
    const targetCollection = `bptft_${unique}`;
    const associationName = `${sourceCollection}.roles`;
    await createPopupRelationTestCollections(sourceCollection, targetCollection);

    const buildBlueprint = (title: string, popup: Record<string, any>) => ({
      version: '1',
      mode: 'create',
      navigation: {
        item: {
          title,
        },
      },
      tabs: [
        {
          title: 'Users',
          blocks: [
            {
              key: 'usersDetails',
              type: 'details',
              collection: sourceCollection,
              fields: [
                'username',
                {
                  field: 'roles',
                  popup,
                },
              ],
            },
          ],
        },
      ],
    });

    const setupRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildBlueprint(`Relation default popup template source ${unique}`, {
        defaultType: 'edit',
      }),
    });
    expect(setupRes.status, readErrorMessage(setupRes)).toBe(200);

    const listedAfterSetup = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          search: String(unique),
          pageSize: 20,
        },
      }),
    );
    const setupTemplates = listedAfterSetup.rows.filter(
      (row: any) => row.associationName === associationName && row.useModel === 'EditFormModel',
    );
    expect(setupTemplates).toHaveLength(1);
    await expectTemplateUsage(rootAgent, setupTemplates[0].uid, 1);

    const optOutRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildBlueprint(`Relation default popup opt out ${unique}`, {
        tryTemplate: false,
        defaultType: 'edit',
      }),
    });
    expect(optOutRes.status, readErrorMessage(optOutRes)).toBe(200);

    const optOutData = getData(optOutRes);
    const optOutField = collectDescendantNodes(
      optOutData.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'roles' &&
        (!!item?.subModels?.page?.uid || !!item?.popup?.template?.uid || !!item?.stepParams?.popupSettings?.openView),
    )[0];
    expect(optOutField?.uid).toBeTruthy();

    const optOutPopup = await readPrimaryPopupBlockFromField(optOutField.uid);
    expect(optOutPopup.fieldReadback.tree?.popup?.template).toBeUndefined();
    expect(optOutPopup.fieldReadback.tree?.popup?.pageUid).toBeTruthy();
    expect(optOutPopup.popupBlock?.use).toBe('EditFormModel');

    const listedAfterOptOut = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          search: String(unique),
          pageSize: 20,
        },
      }),
    );
    const finalTemplates = listedAfterOptOut.rows.filter(
      (row: any) => row.associationName === associationName && row.useModel === 'EditFormModel',
    );
    expect(finalTemplates).toHaveLength(1);
    expect(finalTemplates[0].uid).toBe(setupTemplates[0].uid);
    await expectTemplateUsage(rootAgent, setupTemplates[0].uid, 1);
  });

  it('should preserve checkboxGroup mode defaults in addNew popup create forms built by applyBlueprint', async () => {
    const collectionName = `blueprint_checkbox_group_${Date.now()}`;
    const checkboxGroupFieldPath = 'tags';

    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: 'Blueprint checkbox group targets',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          {
            name: checkboxGroupFieldPath,
            type: 'array',
            interface: 'checkboxGroup',
            enum: [
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ],
          },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', checkboxGroupFieldPath],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Checkbox group popup page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: collectionName,
                fields: ['title', checkboxGroupFieldPath],
                actions: ['addNew'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const addNewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'AddNewActionModel')[0];
    expect(addNewAction?.uid).toBeTruthy();

    const { popupBlock } = await readPrimaryPopupBlockFromAction(addNewAction.uid);
    expect(popupBlock?.use).toBe('CreateFormModel');

    const checkboxGroupFormItem = collectDescendantNodes(
      popupBlock,
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === checkboxGroupFieldPath,
    )[0];
    const checkboxGroupField = _.castArray(checkboxGroupFormItem?.subModels?.field || [])[0];
    expect(checkboxGroupField?.use).toBe('CheckboxGroupFieldModel');
  });

  it('should apply blueprint defaults to generated popup names and grouped popup fields', async () => {
    const unique = Date.now();
    const sourceCollection = `bp_defaults_src_${unique}`;
    const targetCollection = `bp_defaults_target_${unique}`;
    const sourceAddName = `Create source ${unique}`;
    const sourceViewName = `Inspect source ${unique}`;
    const associationViewName = `Inspect associated target ${unique}`;
    const targetViewName = `Inspect target fallback ${unique}`;
    const sourceAddDescription = 'Create one source record.';
    const sourceViewDescription = 'View one source record.';
    const associationViewDescription = 'View one related target record.';
    const targetViewDescription = 'View one target record.';

    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: 'Blueprint defaults target',
        titleField: 'name',
        filterTargetKey: 'name',
        createdAt: true,
        updatedAt: true,
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'label', type: 'string', interface: 'input' },
          { name: 'createdAt', type: 'date', interface: 'createdAt', field: 'createdAt' },
          { name: 'updatedAt', type: 'date', interface: 'updatedAt', field: 'updatedAt' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: 'Blueprint defaults source',
        titleField: 'title',
        filterTargetKey: 'title',
        createdAt: true,
        updatedAt: true,
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'note', type: 'text', interface: 'textarea' },
          { name: 'createdAt', type: 'date', interface: 'createdAt', field: 'createdAt' },
          { name: 'updatedAt', type: 'date', interface: 'updatedAt', field: 'updatedAt' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'target',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'targetId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [sourceCollection]: ['title', 'note', 'targetId', 'createdAt', 'updatedAt'],
      [targetCollection]: ['name', 'label', 'createdAt', 'updatedAt'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint defaults runtime ${unique}`,
          },
        },
        defaults: {
          collections: {
            [sourceCollection]: {
              fieldGroups: [
                {
                  key: 'sourceMain',
                  title: 'Source main',
                  fields: ['title', 'note', { field: 'target', titleField: 'label' }, 'createdAt'],
                },
                {
                  key: 'sourceAudit',
                  title: 'Source audit',
                  fields: ['createdAt', 'updatedAt'],
                },
              ],
              popups: {
                addNew: {
                  name: sourceAddName,
                  description: sourceAddDescription,
                },
                view: {
                  name: sourceViewName,
                  description: sourceViewDescription,
                },
                associations: {
                  target: {
                    view: {
                      name: associationViewName,
                      description: associationViewDescription,
                    },
                  },
                },
              },
            },
            [targetCollection]: {
              fieldGroups: [
                {
                  key: 'targetMain',
                  title: 'Target main',
                  fields: ['name', 'label'],
                },
                {
                  key: 'targetAudit',
                  title: 'Target audit',
                  fields: ['createdAt', 'updatedAt'],
                },
              ],
              popups: {
                view: {
                  name: targetViewName,
                  description: targetViewDescription,
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'sourceTable',
                type: 'table',
                collection: sourceCollection,
                fields: ['title', 'target'],
                actions: ['addNew'],
                recordActions: ['view'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const addNewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'AddNewActionModel')[0];
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    const targetFieldNodes = collectDescendantNodes(
      data.surface.tree,
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'target',
    );
    const targetField =
      targetFieldNodes.find(
        (item) =>
          item?.props?.clickToOpen === true ||
          !!item?.popup?.template?.uid ||
          !!item?.subModels?.page?.uid ||
          !!item?.stepParams?.popupSettings?.openView,
      ) || targetFieldNodes[targetFieldNodes.length - 1];

    expect(addNewAction?.uid).toBeTruthy();
    expect(viewAction?.uid).toBeTruthy();
    expect(targetField?.uid).toBeTruthy();

    const addNewPopup = await readPrimaryPopupBlockFromAction(addNewAction.uid);
    const addNewTab = _.castArray(addNewPopup.popupSurface.tree?.subModels?.page?.subModels?.tabs || [])[0];
    expect(addNewPopup.actionReadback.tree?.stepParams?.popupSettings?.openView?.title).toBe(sourceAddName);
    expect(addNewTab?.props?.title).toBe(sourceAddName);
    expect(addNewPopup.popupBlock?.use).toBe('CreateFormModel');
    const addNewFields = collectFieldPaths(addNewPopup.popupBlock);
    expect(addNewFields).toEqual(expect.arrayContaining(['title', 'note', 'target']));
    expect(addNewFields).not.toContain('createdAt');
    expect(addNewFields).not.toContain('updatedAt');
    const addNewTargetField = collectDescendantNodes(
      addNewPopup.popupBlock,
      (item) => item?.use === 'FormItemModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'target',
    )[0];
    expect(addNewTargetField?.props?.titleField).toBe('label');
    expect(addNewTargetField?.stepParams?.editItemSettings?.titleField?.label).toBe('label');
    expect(addNewTargetField?.subModels?.field?.props?.titleField).toBe('label');
    expect(await findPopupTemplateByName(sourceAddName)).toMatchObject({
      name: sourceAddName,
      description: sourceAddDescription,
    });

    const viewPopup = await readPrimaryPopupBlockFromAction(viewAction.uid);
    const viewTab = _.castArray(viewPopup.popupSurface.tree?.subModels?.page?.subModels?.tabs || [])[0];
    expect(viewPopup.actionReadback.tree?.stepParams?.popupSettings?.openView?.title).toBe(sourceViewName);
    expect(viewTab?.props?.title).toBe(sourceViewName);
    expect(viewPopup.popupBlock?.use).toBe('DetailsBlockModel');
    expect(collectFieldPaths(viewPopup.popupBlock)).toEqual(expect.arrayContaining(['title', 'note', 'createdAt']));
    const viewTargetField = collectDescendantNodes(
      viewPopup.popupBlock,
      (item) => item?.use === 'DetailsItemModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'target',
    )[0];
    expect(viewTargetField?.props?.titleField).toBe('label');
    expect(viewTargetField?.stepParams?.detailItemSettings?.fieldNames?.label).toBe('label');
    expect(viewTargetField?.subModels?.field?.props?.titleField).toBe('label');
    expect(await findPopupTemplateByName(sourceViewName)).toMatchObject({
      name: sourceViewName,
      description: sourceViewDescription,
    });

    const fieldPopup = await readPrimaryPopupBlockFromField(targetField.uid);
    expect(fieldPopup.fieldReadback.tree?.stepParams?.popupSettings?.openView?.title).toBe(associationViewName);
    expect(fieldPopup.popupBlock?.use).toBe('DetailsBlockModel');
    const associationPopupFields = collectFieldPaths(fieldPopup.popupBlock);
    expect(associationPopupFields).toEqual(expect.arrayContaining(['name', 'label', 'createdAt']));
    expect(associationPopupFields).not.toContain('title');
    expect(await findPopupTemplateByName(associationViewName)).toMatchObject({
      name: associationViewName,
      description: associationViewDescription,
    });
    expect(await findPopupTemplateByName(targetViewName)).toBeUndefined();
  });

  it('should persist prepared default fieldGroups relation titleField in generated action popups', async () => {
    const unique = Date.now();
    const sourceCollection = `bp_prepared_defaults_src_${unique}`;
    const targetCollection = `bp_prepared_defaults_target_${unique}`;
    const addPopupName = `Create prepared source ${unique}`;
    const viewPopupName = `Inspect prepared source ${unique}`;

    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: 'Prepared defaults target',
        titleField: 'id',
        filterTargetKey: 'id',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: 'Prepared defaults source',
        titleField: 'title',
        filterTargetKey: 'title',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'note', type: 'text', interface: 'textarea' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'target',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'targetId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [sourceCollection]: ['title', 'note', 'targetId'],
      [targetCollection]: ['name', 'code'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Prepared defaults runtime ${unique}`,
          },
        },
        defaults: {
          collections: {
            [sourceCollection]: {
              fieldGroups: [
                {
                  key: 'main',
                  title: 'Main',
                  fields: ['title', { field: 'target', titleField: 'name' }],
                },
              ],
              popups: {
                addNew: {
                  name: addPopupName,
                  description: 'Create one prepared source record.',
                },
                view: {
                  name: viewPopupName,
                  description: 'View one prepared source record.',
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'sourceTable',
                type: 'table',
                collection: sourceCollection,
                fields: ['title', 'target'],
                actions: ['addNew'],
                recordActions: ['view'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const addNewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'AddNewActionModel')[0];
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];

    expect(addNewAction?.uid).toBeTruthy();
    expect(viewAction?.uid).toBeTruthy();

    const addNewPopup = await readPrimaryPopupBlockFromAction(addNewAction.uid);
    const addNewTargetField = collectDescendantNodes(
      addNewPopup.popupBlock,
      (item) => item?.use === 'FormItemModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'target',
    )[0];
    expect(addNewTargetField?.props?.titleField).toBe('name');
    expect(addNewTargetField?.stepParams?.editItemSettings?.titleField?.label).toBe('name');
    expect(addNewTargetField?.subModels?.field?.props?.titleField).toBe('name');

    const viewPopup = await readPrimaryPopupBlockFromAction(viewAction.uid);
    const viewTargetField = collectDescendantNodes(
      viewPopup.popupBlock,
      (item) => item?.use === 'DetailsItemModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'target',
    )[0];
    expect(viewTargetField?.props?.titleField).toBe('name');
    expect(viewTargetField?.stepParams?.detailItemSettings?.fieldNames?.label).toBe('name');
    expect(viewTargetField?.subModels?.field?.props?.titleField).toBe('name');
  });

  it('should apply default formBehavior settings and linkage rules to generated action popups', async () => {
    const unique = Date.now();
    const collectionName = `bp_form_behavior_${unique}`;
    const addPopupName = `Create behavior ${unique}`;
    const editPopupName = `Edit behavior ${unique}`;

    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: 'Blueprint form behavior',
        titleField: 'title',
        filterTargetKey: 'title',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'approvalComment', type: 'text', interface: 'textarea' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'approvalComment'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint form behavior runtime ${unique}`,
          },
        },
        defaults: {
          collections: {
            [collectionName]: {
              popups: {
                addNew: {
                  name: addPopupName,
                  description: 'Create one behavior record.',
                },
                edit: {
                  name: editPopupName,
                  description: 'Edit one behavior record.',
                },
              },
              formBehavior: {
                addNew: {
                  fields: {
                    title: {
                      settings: {
                        required: true,
                        extra: '必填。最多 50 个字符。',
                        rules: [{ max: 50, message: '最多 50 个字符。' }],
                      },
                    },
                  },
                },
                edit: {
                  fields: {
                    approvalComment: {
                      settings: {
                        extra: '当 status 为 published 时必填。',
                      },
                    },
                  },
                  fieldLinkageRules: [
                    {
                      key: 'requireApprovalComment',
                      when: {
                        logic: '$and',
                        items: [
                          {
                            path: 'formValues.status',
                            operator: '$eq',
                            value: 'published',
                          },
                        ],
                      },
                      then: [
                        {
                          type: 'setFieldState',
                          fieldPaths: ['approvalComment'],
                          state: 'required',
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'behaviorTable',
                type: 'table',
                collection: collectionName,
                fields: ['title', 'status'],
                actions: ['addNew'],
                recordActions: ['edit'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const addNewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'AddNewActionModel')[0];
    const editAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'EditActionModel')[0];
    expect(addNewAction?.uid).toBeTruthy();
    expect(editAction?.uid).toBeTruthy();

    const addNewPopup = await readPrimaryPopupBlockFromAction(addNewAction.uid);
    const titleItem = collectDescendantNodes(
      addNewPopup.popupBlock,
      (item) => item?.use === 'FormItemModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'title',
    )[0];
    expect(titleItem?.props?.required).toBe(true);
    expect(titleItem?.props?.extra).toBe('必填。最多 50 个字符。');
    expect(titleItem?.props?.rules).toEqual([{ max: 50, message: '最多 50 个字符。' }]);

    const editPopup = await readPrimaryPopupBlockFromAction(editAction.uid);
    const approvalItem = collectDescendantNodes(
      editPopup.popupBlock,
      (item) => item?.use === 'FormItemModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'approvalComment',
    )[0];
    expect(approvalItem?.props?.extra).toBe('当 status 为 published 时必填。');
    const linkageRules = editPopup.popupBlock?.subModels?.grid?.stepParams?.eventSettings?.linkageRules?.value;
    expect(linkageRules).toHaveLength(1);
    expect(linkageRules?.[0]?.key).toBe('requireApprovalComment');
  });

  it('should apply default formBehavior linkage rules to generated relation field edit popups', async () => {
    const unique = Date.now();
    const sourceCollection = `bp_field_popup_behavior_src_${unique}`;
    const targetCollection = `bp_field_popup_behavior_target_${unique}`;
    const editPopupName = `Edit related behavior ${unique}`;

    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: 'Blueprint field popup behavior target',
        titleField: 'name',
        filterTargetKey: 'name',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'approvalComment', type: 'text', interface: 'textarea' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: 'Blueprint field popup behavior source',
        titleField: 'title',
        filterTargetKey: 'title',
        fields: [{ name: 'title', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'target',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'targetId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [sourceCollection]: ['title', 'targetId'],
      [targetCollection]: ['name', 'status', 'approvalComment'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint field popup behavior runtime ${unique}`,
          },
        },
        defaults: {
          collections: {
            [targetCollection]: {
              popups: {
                edit: {
                  name: editPopupName,
                  description: 'Edit one related behavior record.',
                },
              },
              formBehavior: {
                edit: {
                  fields: {
                    approvalComment: {
                      settings: {
                        extra: '当 status 为 active 时必填。',
                      },
                    },
                  },
                  fieldLinkageRules: [
                    {
                      key: 'requireRelatedApprovalComment',
                      when: {
                        logic: '$and',
                        items: [
                          {
                            path: 'formValues.status',
                            operator: '$eq',
                            value: 'active',
                          },
                        ],
                      },
                      then: [
                        {
                          type: 'setFieldState',
                          fieldPaths: ['approvalComment'],
                          state: 'required',
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'sourceTable',
                type: 'table',
                collection: sourceCollection,
                fields: [
                  'title',
                  {
                    field: 'target',
                    popup: {
                      defaultType: 'edit',
                    },
                  },
                ],
                actions: ['refresh'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const targetField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'target' &&
        (!!item?.subModels?.page?.uid || !!item?.popup?.template?.uid || !!item?.stepParams?.popupSettings?.openView),
    )[0];
    expect(targetField?.uid).toBeTruthy();

    const fieldPopup = await readPrimaryPopupBlockFromField(targetField.uid);
    expect(fieldPopup.fieldReadback.tree?.stepParams?.popupSettings?.openView?.title).toBe(editPopupName);
    expect(fieldPopup.popupBlock?.use).toBe('EditFormModel');
    const approvalItem = collectDescendantNodes(
      fieldPopup.popupBlock,
      (item) => item?.use === 'FormItemModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'approvalComment',
    )[0];
    expect(approvalItem?.props?.extra).toBe('当 status 为 active 时必填。');
    const linkageRules = fieldPopup.popupBlock?.subModels?.grid?.stepParams?.eventSettings?.linkageRules?.value;
    expect(linkageRules).toHaveLength(1);
    expect(linkageRules?.[0]?.key).toBe('requireRelatedApprovalComment');
  });

  it('should filter default formBehavior linkage rules that reference fields absent from generated relation field edit popups', async () => {
    const unique = Date.now();
    const sourceCollection = `bp_field_popup_filter_src_${unique}`;
    const targetCollection = `bp_field_popup_filter_target_${unique}`;
    const ownerCollection = `bp_field_popup_filter_owner_${unique}`;
    const editPopupName = `Edit filtered related behavior ${unique}`;

    await rootAgent.resource('collections').create({
      values: {
        name: ownerCollection,
        title: 'Blueprint field popup filter owner',
        titleField: 'name',
        filterTargetKey: 'name',
        fields: [{ name: 'name', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: 'Blueprint field popup filter target',
        titleField: 'name',
        filterTargetKey: 'name',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'approvalComment', type: 'text', interface: 'textarea' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', targetCollection).create({
      values: {
        name: 'owner',
        type: 'belongsTo',
        target: ownerCollection,
        foreignKey: 'ownerId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: 'Blueprint field popup filter source',
        titleField: 'title',
        filterTargetKey: 'title',
        fields: [{ name: 'title', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'target',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'targetId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [ownerCollection]: ['name'],
      [targetCollection]: ['name', 'approvalComment', 'ownerId'],
      [sourceCollection]: ['title', 'targetId'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint field popup filtered behavior runtime ${unique}`,
          },
        },
        defaults: {
          collections: {
            [targetCollection]: {
              popups: {
                edit: {
                  name: editPopupName,
                  description: 'Edit one filtered related behavior record.',
                },
              },
              formBehavior: {
                edit: {
                  fields: {
                    approvalComment: {
                      settings: {
                        extra: '当 owner 为 Alice 时必填。',
                      },
                    },
                  },
                  fieldLinkageRules: [
                    {
                      key: 'requireApprovalCommentWhenOwner',
                      when: {
                        logic: '$and',
                        items: [
                          {
                            path: 'formValues.owner',
                            operator: '$notEmpty',
                          },
                        ],
                      },
                      then: [
                        {
                          type: 'setFieldState',
                          fieldPaths: ['approvalComment'],
                          state: 'required',
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'sourceTable',
                type: 'table',
                collection: sourceCollection,
                fields: [
                  'title',
                  {
                    field: 'target',
                    popup: {
                      defaultType: 'edit',
                    },
                  },
                ],
                actions: ['refresh'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const targetField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'target' &&
        (!!item?.subModels?.page?.uid || !!item?.popup?.template?.uid || !!item?.stepParams?.popupSettings?.openView),
    )[0];
    expect(targetField?.uid).toBeTruthy();

    const fieldPopup = await readPrimaryPopupBlockFromField(targetField.uid);
    expect(fieldPopup.fieldReadback.tree?.stepParams?.popupSettings?.openView?.title).toBe(editPopupName);
    expect(fieldPopup.popupBlock?.use).toBe('EditFormModel');
    expect(collectFieldPaths(fieldPopup.popupBlock)).not.toContain('owner');
    const approvalItem = collectDescendantNodes(
      fieldPopup.popupBlock,
      (item) => item?.use === 'FormItemModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'approvalComment',
    )[0];
    expect(approvalItem?.props?.extra).toBe('当 owner 为 Alice 时必填。');
    const linkageRules = fieldPopup.popupBlock?.subModels?.grid?.stepParams?.eventSettings?.linkageRules?.value;
    expect(linkageRules || []).toEqual([]);
  });

  it('should use source association popup names for generated associated-record action popups', async () => {
    const unique = Date.now();
    const { sourceCollection, targetCollection } = await createPopupRelationTestFixture('bp_assoc_defaults');
    const roleAddName = `User role add ${unique}`;
    const roleEditName = `User role edit ${unique}`;
    const roleAddDescription = 'Create one related role record.';
    const roleEditDescription = 'Edit one related role record.';

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint association action defaults ${unique}`,
          },
        },
        defaults: {
          collections: {
            [sourceCollection]: {
              popups: {
                associations: {
                  roles: {
                    addNew: {
                      name: roleAddName,
                      description: roleAddDescription,
                    },
                    edit: {
                      name: roleEditName,
                      description: roleEditDescription,
                    },
                  },
                },
              },
            },
            [targetCollection]: {
              fieldGroups: [
                {
                  key: 'roleMain',
                  title: 'Role main',
                  fields: POPUP_RELATION_TARGET_FIELDS,
                },
              ],
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'usersTable',
                type: 'table',
                collection: sourceCollection,
                fields: POPUP_RELATION_SOURCE_FIELDS,
                recordActions: [
                  {
                    key: 'viewUser',
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          key: 'userRoles',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                            collectionName: targetCollection,
                          },
                          fields: POPUP_RELATION_TARGET_FIELDS,
                          actions: ['addNew'],
                          recordActions: ['edit'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(viewAction?.uid).toBeTruthy();

    const viewPopup = await readPrimaryPopupBlockFromAction(viewAction.uid);
    const rolesTable = collectDescendantNodes(
      viewPopup.popupSurface.tree,
      (item) => item?.use === 'TableBlockModel',
    )[0];
    expect(rolesTable?.uid).toBeTruthy();
    const addNewAction = collectDescendantNodes(rolesTable, (item) => item?.use === 'AddNewActionModel')[0];
    const editAction = collectDescendantNodes(rolesTable, (item) => item?.use === 'EditActionModel')[0];
    expect(addNewAction?.uid).toBeTruthy();
    expect(editAction?.uid).toBeTruthy();

    const addNewPopup = await readPrimaryPopupBlockFromAction(addNewAction.uid);
    expect(addNewPopup.actionReadback.tree?.stepParams?.popupSettings?.openView?.title).toBe(roleAddName);
    expect(addNewPopup.popupBlock?.use).toBe('CreateFormModel');
    const addNewFields = collectFieldPaths(addNewPopup.popupBlock);
    expect(addNewFields).toContain('title');
    expect(addNewFields).not.toContain('username');
    expect(await findPopupTemplateByName(roleAddName)).toMatchObject({
      name: roleAddName,
      description: roleAddDescription,
    });

    const editPopup = await readPrimaryPopupBlockFromAction(editAction.uid);
    expect(editPopup.actionReadback.tree?.stepParams?.popupSettings?.openView?.title).toBe(roleEditName);
    expect(editPopup.popupBlock?.use).toBe('EditFormModel');
    const editFields = collectFieldPaths(editPopup.popupBlock);
    expect(editFields).toContain('title');
    expect(editFields).not.toContain('username');
    expect(await findPopupTemplateByName(roleEditName)).toMatchObject({
      name: roleEditName,
      description: roleEditDescription,
    });
  });

  it('should use target collection popup names for relation action template hits without association overrides', async () => {
    const unique = Date.now();
    const { sourceCollection, targetCollection } = await createPopupRelationTestFixture('bp_target_defaults');
    const competingTemplateName = `Competing role edit template ${unique}`;
    const targetRoleEditName = `Target role edit default ${unique}`;
    const targetRoleEditDescription = 'Edit one role record through the target collection popup default.';

    const sourcePage = await createPage(rootAgent, {
      title: `Competing role edit source ${unique}`,
      tabTitle: 'Source',
    });
    const sourceRolesTable = await addBlockData(rootAgent, {
      target: { uid: sourcePage.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: targetCollection,
      },
      fields: POPUP_RELATION_TARGET_FIELDS,
    });
    const competingEditAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: sourceRolesTable.uid },
          type: 'edit',
          popup: {
            blocks: [
              {
                key: 'competingRoleEdit',
                type: 'editForm',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const competingTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: competingEditAction.uid },
          name: competingTemplateName,
          description: 'Generic role edit template must not win over a configured target default name.',
          saveMode: 'duplicate',
        },
      }),
    );

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint relation target defaults ${unique}`,
          },
        },
        defaults: {
          collections: {
            [targetCollection]: {
              fieldGroups: [
                {
                  key: 'roleMain',
                  title: 'Role main',
                  fields: POPUP_RELATION_TARGET_FIELDS,
                },
              ],
              popups: {
                edit: {
                  name: targetRoleEditName,
                  description: targetRoleEditDescription,
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'usersTable',
                type: 'table',
                collection: sourceCollection,
                fields: POPUP_RELATION_SOURCE_FIELDS,
                recordActions: [
                  {
                    key: 'viewUser',
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          key: 'userRoles',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                            collectionName: targetCollection,
                          },
                          fields: POPUP_RELATION_TARGET_FIELDS,
                          recordActions: ['edit'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    const viewPopup = await readPrimaryPopupBlockFromAction(viewAction.uid);
    const rolesTable = collectDescendantNodes(
      viewPopup.popupSurface.tree,
      (item) => item?.use === 'TableBlockModel',
    )[0];
    const editAction = collectDescendantNodes(rolesTable, (item) => item?.use === 'EditActionModel')[0];
    expect(editAction?.uid).toBeTruthy();

    const editPopup = await readPrimaryPopupBlockFromAction(editAction.uid);
    expect(editPopup.actionReadback.tree?.popup?.template?.uid).not.toBe(competingTemplate.uid);
    expect(editPopup.actionReadback.tree?.stepParams?.popupSettings?.openView?.title).toBe(targetRoleEditName);
    expect(await findPopupTemplateByName(targetRoleEditName)).toMatchObject({
      name: targetRoleEditName,
      description: targetRoleEditDescription,
    });
  });

  it('should not regenerate default popup content when popup.tryTemplate hits an existing template', async () => {
    const unique = Date.now();
    const collectionName = `bp_defaults_tpl_${unique}`;
    const relatedCollectionName = `bp_defaults_tpl_rel_${unique}`;
    const existingTemplateName = `Existing defaults template ${unique}`;
    const defaultViewName = `Default view name ignored by template ${unique}`;
    const relationViewName = `Relation default ignored by direct action ${unique}`;

    await rootAgent.resource('collections').create({
      values: {
        name: relatedCollectionName,
        title: `Blueprint defaults related ${unique}`,
        titleField: 'title',
        filterTargetKey: 'title',
        fields: [{ name: 'title', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: 'Blueprint defaults template hit',
        titleField: 'name',
        filterTargetKey: 'name',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'extra', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', collectionName).create({
      values: {
        name: 'related',
        type: 'belongsTo',
        target: relatedCollectionName,
        foreignKey: 'relatedId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['name', 'extra', 'relatedId'],
      [relatedCollectionName]: ['title'],
    });

    const sourcePage = await createPage(rootAgent, {
      title: `Blueprint defaults template source ${unique}`,
      tabTitle: 'Source',
    });
    const sourceTable = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: sourcePage.gridUid },
          type: 'table',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName,
          },
          fields: ['name'],
        },
      }),
    );
    const sourceAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: sourceTable.uid },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'existingTemplateDetails',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name'],
              },
            ],
          },
        },
      }),
    );
    const existingTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: sourceAction.uid },
          name: existingTemplateName,
          description: 'Existing popup template that should win over blueprint defaults.',
          saveMode: 'duplicate',
        },
      }),
    );

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint defaults template hit ${unique}`,
          },
        },
        defaults: {
          collections: {
            [collectionName]: {
              fieldGroups: [
                {
                  key: 'defaultGroup',
                  title: 'Default group',
                  fields: ['name', 'extra'],
                },
              ],
              popups: {
                view: {
                  name: defaultViewName,
                  description: 'View one record with the default details popup.',
                },
                associations: {
                  related: {
                    view: {
                      name: relationViewName,
                      description: 'View one related record; must not affect direct record actions.',
                    },
                  },
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: collectionName,
                fields: ['name'],
                recordActions: ['view'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(viewAction?.uid).toBeTruthy();

    const viewPopup = await readPrimaryPopupBlockFromAction(viewAction.uid);
    expect(viewPopup.actionReadback.tree?.popup?.template).toMatchObject({
      uid: existingTemplate.uid,
      mode: 'reference',
    });
    expect(viewPopup.actionReadback.tree?.stepParams?.popupSettings?.openView?.title).not.toBe(defaultViewName);
    expect(viewPopup.actionReadback.tree?.stepParams?.popupSettings?.openView?.title).not.toBe(relationViewName);
    const templateFieldPaths = collectFieldPaths(viewPopup.popupBlock);
    expect(templateFieldPaths).toContain('name');
    expect(templateFieldPaths).not.toContain('extra');
    expect(await findPopupTemplateByName(defaultViewName)).toBeUndefined();
  });

  it('should save inline popup content as templates through applyBlueprint popup.saveAsTemplate', async () => {
    const unique = Date.now();
    const fieldTemplateName = `Blueprint popup saveAsTemplate field ${unique}`;
    const actionTemplateName = `Blueprint popup saveAsTemplate action ${unique}`;
    const recordActionTemplateName = `Blueprint popup saveAsTemplate record ${unique}`;

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Popup saveAsTemplate blueprint page ${unique}`,
          },
        },
        page: {
          title: 'Popup saveAsTemplate blueprint page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fields: [
                  {
                    key: 'employeeNickname',
                    field: 'nickname',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'employeePopupDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['nickname'],
                        },
                      ],
                      saveAsTemplate: {
                        name: fieldTemplateName,
                        description: 'Popup template saved from applyBlueprint field popup.',
                      },
                    },
                  },
                ],
              },
              {
                key: 'employeeTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status'],
                actions: [
                  {
                    key: 'employeePopupAction',
                    type: 'popup',
                    title: 'Open employee popup',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'employeePopupTable',
                          type: 'table',
                          resource: {
                            binding: 'currentCollection',
                          },
                          fields: ['nickname'],
                        },
                      ],
                      saveAsTemplate: {
                        name: actionTemplateName,
                        description: 'Popup template saved from applyBlueprint action popup.',
                      },
                    },
                  },
                ],
                recordActions: [
                  {
                    key: 'employeeViewAction',
                    type: 'view',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'employeeRecordPopupDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['status'],
                        },
                      ],
                      saveAsTemplate: {
                        name: recordActionTemplateName,
                        description: 'Popup template saved from applyBlueprint record action popup.',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);

    async function expectSavedTemplateReference(templateName: string) {
      const listed = getListData(
        await rootAgent.resource('flowSurfaces').listTemplates({
          values: {
            type: 'popup',
            search: templateName,
          },
        }),
      );
      const template = listed.rows.find((row: any) => row.name === templateName);
      expect(template?.uid).toBeTruthy();
      const matchedNode = collectDescendantNodes(
        data.surface.tree,
        (item) => item?.popup?.template?.uid === template.uid,
      )[0];
      expect(matchedNode?.popup?.template).toMatchObject({
        uid: template.uid,
        mode: 'reference',
      });
      expect(matchedNode?.popup?.pageUid).toBeUndefined();
      expect(matchedNode?.popup?.tabUid).toBeUndefined();
      expect(matchedNode?.popup?.gridUid).toBeUndefined();
      const savedTemplate = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: template.uid,
          },
        }),
      );
      expect(savedTemplate.usageCount).toBeGreaterThanOrEqual(1);
      return template;
    }

    await expectSavedTemplateReference(fieldTemplateName);
    await expectSavedTemplateReference(actionTemplateName);
    await expectSavedTemplateReference(recordActionTemplateName);
  });

  it('should include relation context in auto-saved applyBlueprint popup template names', async () => {
    const unique = Date.now();
    const suffix = String(unique).slice(-8);
    const sourceCollection = `brns_${suffix}`;
    const targetCollection = `brnt_${suffix}`;
    const associationName = `${sourceCollection}.roles`;
    const directPopupTitle = `用户详情 ${unique}`;
    const relationPopupTitle = `角色详情 ${unique}`;
    const relationEditPopupTitle = `编辑角色 ${unique}`;
    await createPopupRelationTestCollections(sourceCollection, targetCollection);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Relation popup template names ${unique}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                key: 'usersDetails',
                type: 'details',
                collection: sourceCollection,
                fields: [
                  'username',
                  {
                    field: 'roles',
                    popup: {
                      title: relationPopupTitle,
                      blocks: [
                        {
                          key: 'roleDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: targetCollection,
                          },
                          fields: ['title', 'name'],
                          recordActions: [
                            {
                              type: 'edit',
                              title: '编辑',
                              popup: {
                                title: relationEditPopupTitle,
                                blocks: [
                                  {
                                    key: 'roleEditForm',
                                    type: 'editForm',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: targetCollection,
                                    },
                                    fields: ['title', 'name'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
                recordActions: [
                  {
                    type: 'view',
                    title: '详情',
                    popup: {
                      title: directPopupTitle,
                      blocks: [
                        {
                          key: 'userDetailsPopup',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: sourceCollection,
                          },
                          fields: ['username', 'email'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);

    const listed = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          search: String(unique),
          pageSize: 20,
        },
      }),
    );
    const rows = listed.rows;
    const findTemplate = (name: string) => rows.find((row: any) => row.name === name);

    const directTemplate = findTemplate(`${directPopupTitle}弹窗模板`);
    expect(directTemplate?.uid).toBeTruthy();
    expect(directTemplate?.associationName).toBeFalsy();
    expect(directTemplate?.description).toContain('上下文：直接/当前记录');

    const relationTemplate = findTemplate(`${relationPopupTitle}(${associationName})`);
    expect(relationTemplate?.uid).toBeTruthy();
    expect(relationTemplate?.associationName).toBe(associationName);
    expect(relationTemplate?.name).not.toContain('弹窗');
    expect(relationTemplate?.description).toContain(`上下文：关联 ${associationName}`);
    expect(relationTemplate?.description).toContain(`宿主：${sourceCollection}`);
    expect(relationTemplate?.description).toContain('触发器：字段“roles”');

    const relationEditTemplate = findTemplate(`${relationEditPopupTitle}(${associationName})`);
    expect(relationEditTemplate?.uid).toBeTruthy();
    expect(relationEditTemplate?.associationName).toBe(associationName);
    expect(relationEditTemplate?.name).not.toContain('弹窗');
    expect(relationEditTemplate?.description).toContain(`上下文：关联 ${associationName}`);
    expect(relationEditTemplate?.description).toContain(`宿主：${targetCollection}`);
    expect(relationEditTemplate?.description).toContain('触发器：记录操作“编辑”');
  });

  it('should reuse relation popup templates across field and record action hosts in applyBlueprint', async () => {
    const unique = Date.now();
    const sourceCollection = `prs_${unique}`;
    const targetCollection = `prt_${unique}`;
    const associationName = `${sourceCollection}.roles`;
    const relationPopupTitle = `角色详情复用 ${unique}`;
    const relationEditPopupTitle = `编辑角色复用 ${unique}`;
    const userPopupTitle = `用户详情复用 ${unique}`;
    await createPopupRelationTestCollections(sourceCollection, targetCollection);

    const roleDetailsBlock = (key: string, editKey: string) => ({
      key,
      type: 'details',
      resource: {
        binding: 'currentRecord',
        collectionName: targetCollection,
      },
      fields: ['title', 'name'],
      recordActions: [
        {
          key: `${key}Edit`,
          type: 'edit',
          title: '编辑',
          popup: {
            title: relationEditPopupTitle,
            blocks: [
              {
                key: editKey,
                type: 'editForm',
                resource: {
                  binding: 'currentRecord',
                  collectionName: targetCollection,
                },
                fields: ['title', 'name'],
              },
            ],
          },
        },
      ],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Relation popup template reuse ${unique}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                key: 'usersDetails',
                type: 'details',
                collection: sourceCollection,
                fields: [
                  'username',
                  {
                    field: 'roles',
                    popup: {
                      title: relationPopupTitle,
                      blocks: [roleDetailsBlock('rootRoleDetails', 'rootRoleEditForm')],
                    },
                  },
                ],
                recordActions: [
                  {
                    key: 'userDetailAction',
                    type: 'view',
                    title: '详情',
                    popup: {
                      title: userPopupTitle,
                      blocks: [
                        {
                          key: 'userDetailsPopup',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: sourceCollection,
                          },
                          fields: ['username', 'email'],
                        },
                        {
                          key: 'userRolesTable',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                            collectionName: targetCollection,
                          },
                          fields: [
                            {
                              field: 'title',
                              popup: {
                                title: relationPopupTitle,
                                blocks: [roleDetailsBlock('tableFieldRoleDetails', 'tableFieldRoleEditForm')],
                              },
                            },
                            'name',
                          ],
                          recordActions: [
                            {
                              key: 'tableRoleView',
                              type: 'view',
                              title: '详情',
                              popup: {
                                title: relationPopupTitle,
                                blocks: [roleDetailsBlock('tableActionRoleDetails', 'tableActionRoleEditForm')],
                              },
                            },
                            {
                              key: 'tableRoleEdit',
                              type: 'edit',
                              title: '编辑',
                              popup: {
                                title: relationEditPopupTitle,
                                blocks: [
                                  {
                                    key: 'tableActionRoleEditForm',
                                    type: 'editForm',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: targetCollection,
                                    },
                                    fields: ['title', 'name'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const listed = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          search: String(unique),
          pageSize: 20,
        },
      }),
    );
    const rows = listed.rows;
    const relationTemplateName = `${relationPopupTitle}(${associationName})`;
    const relationEditTemplateName = `${relationEditPopupTitle}(${associationName})`;
    const relationTemplates = rows.filter((row: any) => row.name === relationTemplateName);
    const relationEditTemplates = rows.filter((row: any) => row.name === relationEditTemplateName);

    expect(relationTemplates).toHaveLength(1);
    expect(relationTemplates[0]).toMatchObject({
      useModel: 'DetailsBlockModel',
      collectionName: targetCollection,
      associationName,
    });
    expect(relationEditTemplates).toHaveLength(1);
    expect(relationEditTemplates[0]).toMatchObject({
      useModel: 'EditFormModel',
      collectionName: targetCollection,
      associationName,
    });
    expect(rows.filter((row: any) => row.name === relationTemplateName && !row.associationName)).toHaveLength(0);
    expect(rows.filter((row: any) => row.name === relationEditTemplateName && !row.associationName)).toHaveLength(0);
    await expectTemplateUsage(rootAgent, relationTemplates[0].uid, 3);
    await expectTemplateUsage(rootAgent, relationEditTemplates[0].uid, 2);
  });

  it('should keep relation context when applyBlueprint binds an explicit relation popup template', async () => {
    const unique = Date.now();
    const sourceCollection = `pre_src_${unique}`;
    const targetCollection = `pre_target_${unique}`;
    const associationName = `${sourceCollection}.roles`;
    const relationPopupTitle = `显式角色详情复用 ${unique}`;
    await createPopupRelationTestCollections(sourceCollection, targetCollection);

    const roleDetailsBlock = (key: string) => ({
      key,
      type: 'details',
      resource: {
        binding: 'currentRecord',
        collectionName: targetCollection,
      },
      fields: ['title', 'name'],
    });

    const setupRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Relation explicit popup template source ${unique}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                key: 'usersDetails',
                type: 'details',
                collection: sourceCollection,
                fields: [
                  'username',
                  {
                    field: 'roles',
                    popup: {
                      title: relationPopupTitle,
                      blocks: [roleDetailsBlock('sourceRoleDetails')],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(setupRes.status, readErrorMessage(setupRes)).toBe(200);

    const relationTemplate = await findPopupTemplateByName(`${relationPopupTitle}(${associationName})`);
    expect(relationTemplate).toMatchObject({
      collectionName: targetCollection,
      associationName,
    });
    await expectTemplateUsage(rootAgent, relationTemplate.uid, 1);

    const explicitRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Relation explicit popup template use ${unique}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                key: 'usersDetails',
                type: 'details',
                collection: sourceCollection,
                fields: [
                  'username',
                  {
                    field: 'roles',
                    popup: {
                      title: `显式字段角色详情 ${unique}`,
                      template: {
                        uid: relationTemplate.uid,
                        mode: 'reference',
                      },
                    },
                  },
                ],
                recordActions: [
                  {
                    key: 'userDetailAction',
                    type: 'view',
                    title: '详情',
                    popup: {
                      blocks: [
                        {
                          key: 'userDetailsPopup',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: sourceCollection,
                          },
                          fields: ['username'],
                        },
                        {
                          key: 'userRolesTable',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                            collectionName: targetCollection,
                          },
                          fields: ['title', 'name'],
                          recordActions: [
                            {
                              key: 'tableRoleView',
                              type: 'view',
                              title: '角色详情',
                              popup: {
                                title: `显式操作角色详情 ${unique}`,
                                template: {
                                  uid: relationTemplate.uid,
                                  mode: 'reference',
                                },
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(explicitRes.status, readErrorMessage(explicitRes)).toBe(200);
    const data = getData(explicitRes);
    const relationField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'roles' &&
        item?.popup?.template?.uid === relationTemplate.uid,
    )[0];
    expect(relationField?.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: targetCollection,
      associationName,
    });
    await expectTemplateUsage(rootAgent, relationTemplate.uid, 3);
  });

  it('should reject direct popup templates when explicitly used in relation applyBlueprint popups', async () => {
    const unique = Date.now();
    const sourceCollection = `prd_src_${unique}`;
    const targetCollection = `prd_target_${unique}`;
    const associationName = `${sourceCollection}.roles`;
    const directPopupTitle = `直接角色详情 ${unique}`;
    await createPopupRelationTestCollections(sourceCollection, targetCollection);

    const setupRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Direct popup template source ${unique}`,
          },
        },
        tabs: [
          {
            title: 'Roles',
            blocks: [
              {
                key: 'rolesDetails',
                type: 'details',
                collection: targetCollection,
                fields: [
                  {
                    field: 'title',
                    popup: {
                      title: directPopupTitle,
                      blocks: [
                        {
                          key: 'directRoleDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: targetCollection,
                          },
                          fields: ['title', 'name'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(setupRes.status, readErrorMessage(setupRes)).toBe(200);

    const directTemplate = await findPopupTemplateByName(`${directPopupTitle}弹窗模板`);
    expect(directTemplate).toMatchObject({
      collectionName: targetCollection,
    });
    expect(directTemplate.associationName).toBeFalsy();

    const rejectedRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Relation direct popup template rejection ${unique}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                key: 'usersDetails',
                type: 'details',
                collection: sourceCollection,
                fields: [
                  'username',
                  {
                    field: 'roles',
                    popup: {
                      title: `错误复用角色详情 ${unique}`,
                      template: {
                        uid: directTemplate.uid,
                        mode: 'reference',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(rejectedRes.status).toBe(400);
    expect(readErrorMessage(rejectedRes)).toContain('association mismatch');
    expect(readErrorMessage(rejectedRes)).toContain(`expected '${associationName}', got '(none)'`);
  });

  it('should keep applying popup template reuse after a template is saved earlier in the same blueprint', async () => {
    const unique = Date.now();
    const collectionName = `popup_bp_same_request_${unique}`;
    const firstTemplateName = `Blueprint same request popup source ${unique}`;
    const secondTemplateName = `Blueprint same request popup ignored ${unique}`;
    await createPopupTestCollection(collectionName);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint same request popup reuse ${unique}`,
          },
        },
        page: {
          title: 'Blueprint same request popup reuse',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'detailsWithPopups',
                type: 'details',
                collection: collectionName,
                fields: [
                  {
                    key: 'sourceField',
                    field: 'name',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'sourcePopup',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['name'],
                        },
                      ],
                      saveAsTemplate: {
                        name: firstTemplateName,
                        description: 'Popup template saved earlier in this applyBlueprint request.',
                      },
                    },
                  },
                  {
                    key: 'reuseField',
                    field: 'code',
                    popup: {
                      blocks: [
                        {
                          key: 'reusePopup',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['code'],
                        },
                      ],
                      saveAsTemplate: {
                        name: secondTemplateName,
                        description: 'This metadata must not create a second template.',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const sourceTemplate = await findPopupTemplateByName(firstTemplateName);
    expect(sourceTemplate?.uid).toBeTruthy();
    expect(await findPopupTemplateByName(secondTemplateName)).toBeUndefined();
    const popupReferences = collectDescendantNodes(
      data.surface.tree,
      (item) => item?.popup?.template?.uid === sourceTemplate.uid,
    );
    expect(popupReferences).toHaveLength(2);
    await expectTemplateUsage(rootAgent, sourceTemplate.uid, 2);
  });

  it('should reuse popup templates created earlier in the same blueprint via popup.template.local', async () => {
    const unique = Date.now();
    const templateName = `Blueprint popup local ${unique}`;

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint popup local page ${unique}`,
          },
        },
        page: {
          title: 'Blueprint popup local page',
        },
        tabs: [
          {
            key: 'source',
            title: 'Source',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fields: [
                  {
                    key: 'producerField',
                    field: 'nickname',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'producerPopupDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['nickname'],
                        },
                      ],
                      saveAsTemplate: {
                        name: templateName,
                        description: 'Popup template created earlier in the same blueprint.',
                        local: 'blueprintPopupAlias',
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            key: 'consumer',
            title: 'Consumer',
            blocks: [
              {
                key: 'employeeTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                recordActions: [
                  {
                    key: 'consumerAction',
                    type: 'view',
                    title: 'View employee',
                    popup: {
                      template: {
                        local: 'blueprintPopupAlias',
                        mode: 'reference',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const listed = getListData(
      await rootAgent.resource('flowSurfaces').listTemplates({
        values: {
          type: 'popup',
          search: templateName,
        },
      }),
    );
    const template = listed.rows.find((row: any) => row.name === templateName);
    expect(template?.uid).toBeTruthy();
    expect(
      collectDescendantNodes(data.surface.tree, (item) => item?.popup?.template?.uid === template.uid),
    ).toHaveLength(2);
    await expectTemplateUsage(rootAgent, template.uid, 2);
  });

  it('should let popup.template.local reuse the final bound template uid from combined tryTemplate + saveAsTemplate producers in applyBlueprint', async () => {
    const unique = Date.now();
    const hitCollection = `popup_bp_hit_${unique}`;
    const missCollection = `popup_bp_miss_${unique}`;
    await createPopupTestCollection(hitCollection);
    await createPopupTestCollection(missCollection);

    const sourcePage = await createPage(rootAgent, {
      title: `Blueprint combined popup source ${unique}`,
      tabTitle: 'Blueprint combined popup source',
    });
    const sourceDetails = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: sourcePage.gridUid },
        type: 'details',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: hitCollection,
        },
        fields: ['name'],
      },
    });
    expect(sourceDetails.status).toBe(200);
    const sourceField = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: { uid: getData(sourceDetails).uid },
        fieldPath: 'name',
        popup: {
          blocks: [
            {
              key: 'blueprintCombinedHitSourcePopup',
              type: 'details',
              resource: {
                binding: 'currentRecord',
              },
              fields: ['name'],
            },
          ],
        },
      },
    });
    expect(sourceField.status).toBe(200);
    const sourceTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: getData(sourceField).fieldUid || getData(sourceField).uid },
          name: `Blueprint combined popup hit source ${unique}`,
          description: 'Existing template reused through a combined applyBlueprint producer.',
          saveMode: 'duplicate',
        },
      }),
    );

    const hitIgnoredTemplateName = `Blueprint combined popup hit ignored ${unique}`;
    const hitRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint combined popup hit ${unique}`,
          },
        },
        page: {
          title: 'Blueprint combined popup hit',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'hitDetails',
                type: 'details',
                collection: hitCollection,
                fields: [
                  {
                    key: 'hitProducer',
                    field: 'code',
                    popup: {
                      tryTemplate: true,
                      saveAsTemplate: {
                        name: hitIgnoredTemplateName,
                        description: 'Ignored on tryTemplate hit inside applyBlueprint.',
                        local: 'blueprintHitAlias',
                      },
                    },
                  },
                  {
                    key: 'hitConsumer',
                    field: 'label',
                    popup: {
                      template: {
                        local: 'blueprintHitAlias',
                        mode: 'reference',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(hitRes.status).toBe(200);
    const hitData = getData(hitRes);
    expect(
      collectDescendantNodes(hitData.surface.tree, (item) => item?.popup?.template?.uid === sourceTemplate.uid),
    ).toHaveLength(2);
    expect(await findPopupTemplateByName(hitIgnoredTemplateName)).toBeUndefined();
    await expectTemplateUsage(rootAgent, sourceTemplate.uid, 2);

    const missTemplateName = `Blueprint combined popup miss ${unique}`;
    const missRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint combined popup miss ${unique}`,
          },
        },
        page: {
          title: 'Blueprint combined popup miss',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'missDetails',
                type: 'details',
                collection: missCollection,
                fields: [
                  {
                    key: 'missProducer',
                    field: 'name',
                    popup: {
                      tryTemplate: true,
                      blocks: [
                        {
                          key: 'blueprintCombinedMissPopup',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['name'],
                        },
                      ],
                      saveAsTemplate: {
                        name: missTemplateName,
                        description: 'Saved after tryTemplate miss inside applyBlueprint.',
                        local: 'blueprintMissAlias',
                      },
                    },
                  },
                  {
                    key: 'missConsumer',
                    field: 'code',
                    popup: {
                      template: {
                        local: 'blueprintMissAlias',
                        mode: 'reference',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(missRes.status).toBe(200);
    const missData = getData(missRes);
    const missTemplate = await findPopupTemplateByName(missTemplateName);
    expect(missTemplate?.uid).toBeTruthy();
    expect(
      collectDescendantNodes(missData.surface.tree, (item) => item?.popup?.template?.uid === missTemplate.uid),
    ).toHaveLength(2);
    await expectTemplateUsage(rootAgent, missTemplate.uid, 2);
  });

  it('should reject invalid applyBlueprint popup local template aliases', async () => {
    const unique = Date.now();

    const undefinedAliasRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint popup local undefined ${unique}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fields: [
                  {
                    key: 'consumerField',
                    field: 'nickname',
                    popup: {
                      template: {
                        local: 'missingBlueprintPopupAlias',
                        mode: 'reference',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(undefinedAliasRes.status).toBe(400);
    expect(readErrorMessage(undefinedAliasRes)).toContain(
      "flowSurfaces applyBlueprint tabs[0].blocks[0].fields[0].popup.template.local 'missingBlueprintPopupAlias' must reference an earlier popup.saveAsTemplate.local in the same request",
    );

    const duplicateAliasRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint popup local duplicate ${unique}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fields: [
                  {
                    key: 'producerFieldA',
                    field: 'nickname',
                    popup: {
                      blocks: [
                        {
                          key: 'duplicatePopupA',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['nickname'],
                        },
                      ],
                      saveAsTemplate: {
                        name: `Blueprint duplicate popup alias A ${unique}`,
                        description: 'First duplicate alias producer.',
                        local: 'duplicateBlueprintAlias',
                      },
                    },
                  },
                  {
                    key: 'producerFieldB',
                    field: 'status',
                    popup: {
                      blocks: [
                        {
                          key: 'duplicatePopupB',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['status'],
                        },
                      ],
                      saveAsTemplate: {
                        name: `Blueprint duplicate popup alias B ${unique}`,
                        description: 'Second duplicate alias producer.',
                        local: 'duplicateBlueprintAlias',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(duplicateAliasRes.status).toBe(400);
    expect(readErrorMessage(duplicateAliasRes)).toContain(
      "flowSurfaces applyBlueprint tabs[0].blocks[0].fields[1].popup.saveAsTemplate.local 'duplicateBlueprintAlias' is duplicated in the same request",
    );
  });

  it('should replace an existing page by pageSchemaUid and remove extra tabs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Legacy employees',
      tabTitle: 'Legacy overview',
      enableTabs: true,
    });
    const addTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: page.pageUid,
        },
        title: 'Legacy extra',
      },
    });
    expect(addTabRes.status).toBe(200);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        page: {
          title: 'Employees workspace',
          documentTitle: 'Employees replace flow',
          displayTitle: false,
          enableTabs: false,
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);

    expect(data).toMatchObject({
      version: '1',
      mode: 'replace',
      target: {
        pageSchemaUid: page.pageSchemaUid,
        pageUid: page.pageUid,
      },
    });
    expect(getRouteBackedTabs(data.surface)).toHaveLength(1);
    expect(data.surface.pageRoute.displayTitle).toBe(false);
  });

  it('should reuse a unique same-title navigation group instead of creating a duplicate group', async () => {
    const groupTitle = `Unique applyBlueprint group ${Date.now()}`;
    const existingGroup = await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            title: groupTitle,
          },
          item: {
            title: 'Employees under reused group',
          },
        },
        page: {
          title: 'Employees under reused group',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(String(data.surface.pageRoute.parentId)).toBe(String(existingGroup.routeId));

    const matchedGroups = _.castArray(
      await routesRepo.find({
        filter: {
          type: 'group',
          title: groupTitle,
        },
      }),
    );
    expect(matchedGroups).toHaveLength(1);
  });

  it('should ignore group metadata when reusing a unique same-title navigation group', async () => {
    const groupTitle = `Same-title metadata group ${Date.now()}`;
    const existingGroup = await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
      icon: 'AppstoreOutlined',
      tooltip: 'Existing group tooltip',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            title: groupTitle,
            icon: 'UserOutlined',
            tooltip: 'Should be ignored for reused group',
            hideInMenu: true,
          },
          item: {
            title: 'Employees with reused group metadata',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(String(data.surface.pageRoute.parentId)).toBe(String(existingGroup.routeId));

    const reusedGroup = await routesRepo.findOne({
      filterByTk: existingGroup.routeId,
    });
    expect(reusedGroup.get('icon')).toBe('AppstoreOutlined');
    expect(reusedGroup.get('tooltip')).toBe('Existing group tooltip');
    expect(reusedGroup.get('hideInMenu')).toBe(false);
  });

  it('should let navigation.group.routeId take priority over title and ignore group metadata', async () => {
    const targetGroup = await createMenu(rootAgent, {
      title: `Explicit target group ${Date.now()}`,
      type: 'group',
      icon: 'AppstoreOutlined',
      tooltip: 'Target group tooltip',
    });
    const otherGroupTitle = `Ignored title group ${Date.now()}`;
    const otherGroup = await createMenu(rootAgent, {
      title: otherGroupTitle,
      type: 'group',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            routeId: targetGroup.routeId,
            title: otherGroupTitle,
            icon: 'UserOutlined',
            tooltip: 'Should be ignored for explicit group',
            hideInMenu: true,
          },
          item: {
            title: 'Employees under explicit group',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(String(data.surface.pageRoute.parentId)).toBe(String(targetGroup.routeId));
    expect(String(data.surface.pageRoute.parentId)).not.toBe(String(otherGroup.routeId));

    const reusedGroup = await routesRepo.findOne({
      filterByTk: targetGroup.routeId,
    });
    expect(reusedGroup.get('icon')).toBe('AppstoreOutlined');
    expect(reusedGroup.get('tooltip')).toBe('Target group tooltip');
    expect(reusedGroup.get('hideInMenu')).toBe(false);
  });

  it('should ignore navigation.group.routeId metadata without mutating the existing group', async () => {
    const existingGroup = await createMenu(rootAgent, {
      title: `Explicit group ${Date.now()}`,
      type: 'group',
      icon: 'AppstoreOutlined',
      tooltip: 'Existing explicit group tooltip',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            routeId: existingGroup.routeId,
            icon: 'UserOutlined',
            hideInMenu: true,
          },
          item: {
            title: 'Employees under explicit group',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(String(data.surface.pageRoute.parentId)).toBe(String(existingGroup.routeId));

    const reusedGroup = await routesRepo.findOne({
      filterByTk: existingGroup.routeId,
    });
    expect(reusedGroup.get('icon')).toBe('AppstoreOutlined');
    expect(reusedGroup.get('tooltip')).toBe('Existing explicit group tooltip');
    expect(reusedGroup.get('hideInMenu')).toBe(false);
  });

  it('should reject ambiguous navigation group title reuse and ask for routeId explicitly', async () => {
    const groupTitle = `Ambiguous applyBlueprint group ${Date.now()}`;
    await routesRepo.create({
      values: {
        title: groupTitle,
        type: 'group',
        schemaUid: `ambiguous-apply-blueprint-group-${Date.now()}-1`,
      },
    });
    await routesRepo.create({
      values: {
        title: groupTitle,
        type: 'group',
        schemaUid: `ambiguous-apply-blueprint-group-${Date.now()}-2`,
      },
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            title: groupTitle,
          },
          item: {
            title: 'Ambiguous group page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain(
      `navigation.group.title '${groupTitle}' matches 2 existing root menu groups`,
    );
    expect(readErrorMessage(executeRes)).toContain('navigation.group.routeId explicitly');
  });

  it('should auto-generate a vertical grid layout when tab layout is omitted', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Auto layout page',
          },
        },
        page: {
          title: 'Auto layout page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
              {
                type: 'details',
                collection: 'employees',
                fields: ['nickname', 'status'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const firstTab = getRouteBackedTabs(data.surface)[0];
    const tabGrid = await flowRepo.findModelByParentId(firstTab.uid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    const gridItems = Array.isArray(tabGrid?.subModels?.items) ? tabGrid.subModels.items : [];

    expect(gridItems).toHaveLength(2);
    expect(tabGrid?.props?.rowOrder).toEqual(['row1', 'row2']);
    expect(tabGrid?.props?.rows?.row1).toEqual([[gridItems[0]?.uid]]);
    expect(tabGrid?.props?.rows?.row2).toEqual([[gridItems[1]?.uid]]);
    expect(tabGrid?.props?.sizes?.row1).toEqual([24]);
    expect(tabGrid?.props?.sizes?.row2).toEqual([24]);
  });

  it('should report layout errors with index-based tab paths instead of generated tab keys', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Layout error page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: {
              rows: [['missingBlock']],
            },
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    const message = readErrorMessage(executeRes);
    expect(message).toContain(`flowSurfaces authoring $.tabs[0].layout.rows[0][0]`);
    expect(message).toContain(`references unknown block 'missingBlock'`);
    expect(message).not.toContain(`tabs['`);
  });

  it('should normalize currentRecord associationPathName resource shorthand into an associated-records popup table', async () => {
    const { sourceCollection, targetCollection, associationName } =
      await createPopupRelationTestFixture('bp_shorthand');
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Association shorthand popup page',
          },
        },
        page: {
          title: 'Association shorthand popup page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: sourceCollection,
                fields: POPUP_RELATION_SOURCE_FIELDS,
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'table',
                          resource: {
                            binding: 'currentRecord',
                            associationPathName: 'roles',
                            collectionName: targetCollection,
                          },
                          fields: POPUP_RELATION_TARGET_TITLE_FIELDS,
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(viewAction?.uid).toBeTruthy();

    const { popupBlock } = await readPrimaryPopupBlockFromAction(viewAction.uid);

    expect(popupBlock?.use).toBe('TableBlockModel');
    expect(popupBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: targetCollection,
      associationName,
    });
    expect(collectFieldPaths(popupBlock)).toEqual(expect.arrayContaining(['title', 'name']));
  });

  it('should reject multi-segment associationPathName when binding-centered shorthand tries to normalize it', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid multi-segment relation popup page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'table',
                          resource: {
                            binding: 'currentRecord',
                            associationPathName: 'manager.roles',
                            collectionName: 'roles',
                          },
                          fields: ['title', 'name', 'description'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    const message = readErrorMessage(executeRes);
    expect(message).toContain(`associationPathName 'manager.roles'`);
    expect(message).toContain('single association field name');
    expect(message).toContain('associationField');
  });

  it('should create the nested users-roles popup page structure and auto-promote record actions from details.actions', async () => {
    const { sourceCollection, targetCollection, associationName } =
      await createPopupRelationTestFixture('bp_nested_popups');
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Users popup page ${Date.now()}`,
          },
        },
        page: {
          title: 'Users popup page',
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                key: 'usersTable',
                type: 'table',
                collection: sourceCollection,
                fields: ['username', 'nickname', 'roles'],
                recordActions: [
                  {
                    type: 'view',
                    title: '详情',
                    popup: {
                      layout: {
                        rows: [
                          [
                            { key: 'userDetails', span: 12 },
                            { key: 'userRoles', span: 12 },
                          ],
                        ],
                      },
                      blocks: [
                        {
                          key: 'userDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: sourceCollection,
                          },
                          fields: ['username', 'nickname', 'email', 'roles'],
                          actions: [
                            {
                              type: 'edit',
                              title: '编辑用户',
                              popup: {
                                blocks: [
                                  {
                                    key: 'userEditForm',
                                    type: 'editForm',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: sourceCollection,
                                    },
                                    fields: ['username', 'nickname', 'email', 'roles'],
                                    actions: ['submit'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          key: 'userRoles',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                            collectionName: targetCollection,
                          },
                          fields: POPUP_RELATION_TARGET_TITLE_FIELDS,
                          recordActions: [
                            {
                              type: 'view',
                              title: '查看角色',
                              popup: {
                                blocks: [
                                  {
                                    key: 'roleDetails',
                                    type: 'details',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: targetCollection,
                                    },
                                    fields: POPUP_RELATION_TARGET_TITLE_FIELDS,
                                    actions: [
                                      {
                                        type: 'edit',
                                        title: '编辑角色',
                                        popup: {
                                          blocks: [
                                            {
                                              key: 'roleEditForm',
                                              type: 'editForm',
                                              resource: {
                                                binding: 'currentRecord',
                                                collectionName: targetCollection,
                                              },
                                              fields: ['title', 'name'],
                                              actions: ['submit'],
                                            },
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const pageTree = data.surface.tree;
    const mainTable = collectDescendantNodes(pageTree, (item) => item?.use === 'TableBlockModel')[0];
    expect(mainTable?.uid).toBeTruthy();

    const mainTableReadback = await getSurface(rootAgent, {
      uid: mainTable.uid,
    });
    expect(mainTableReadback.tree.use).toBe('TableBlockModel');
    expect(collectFieldPaths(mainTableReadback.tree)).toEqual(expect.arrayContaining(['roles']));

    const mainViewAction = collectDescendantNodes(mainTableReadback.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(mainViewAction?.uid).toBeTruthy();

    const { popupItems } = await readPrimaryPopupBlockFromAction(mainViewAction.uid);
    expect(popupItems).toHaveLength(2);
    const userDetailsBlock = popupItems.find((item: any) => item?.use === 'DetailsBlockModel');
    const userRolesTable = popupItems.find((item: any) => item?.use === 'TableBlockModel');
    expect(userDetailsBlock?.uid).toBeTruthy();
    expect(userRolesTable?.uid).toBeTruthy();

    const userDetailsReadback = await getSurface(rootAgent, {
      uid: userDetailsBlock.uid,
    });
    expect(collectFieldPaths(userDetailsReadback.tree)).toEqual(expect.arrayContaining(['email', 'roles']));
    expect(_.castArray(userDetailsReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'EditActionModel',
    );
    const userEditAction = _.castArray(userDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    expect(userEditAction?.uid).toBeTruthy();

    const { popupBlock: userEditForm } = await readPrimaryPopupBlockFromAction(userEditAction.uid);
    expect(userEditForm?.use).toBe('EditFormModel');
    expect(_.castArray(userEditForm?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const userRolesReadback = await getSurface(rootAgent, {
      uid: userRolesTable.uid,
    });
    expect(userRolesReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: targetCollection,
      associationName,
    });
    expect(collectFieldPaths(userRolesReadback.tree)).toEqual(expect.arrayContaining(['title', 'name']));
    const roleViewAction = collectDescendantNodes(userRolesReadback.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(roleViewAction?.uid).toBeTruthy();

    const { popupBlock: roleDetailsBlock } = await readPrimaryPopupBlockFromAction(roleViewAction.uid);
    expect(roleDetailsBlock?.use).toBe('DetailsBlockModel');

    const roleDetailsReadback = await getSurface(rootAgent, {
      uid: roleDetailsBlock.uid,
    });
    expect(_.castArray(roleDetailsReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'EditActionModel',
    );
    const roleEditAction = _.castArray(roleDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    expect(roleEditAction?.uid).toBeTruthy();

    const { popupBlock: roleEditForm } = await readPrimaryPopupBlockFromAction(roleEditAction.uid);
    expect(roleEditForm?.use).toBe('EditFormModel');
    expect(_.castArray(roleEditForm?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );
  });

  it('should create a details-root page with a popup recordAction, associated-records table, and nested edit popups', async () => {
    const { sourceCollection, targetCollection, associationName } =
      await createPopupRelationTestFixture('bp_details_popups');
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Details root popup page ${Date.now()}`,
          },
        },
        page: {
          title: 'Details root popup page',
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                key: 'rootDetails',
                type: 'details',
                collection: sourceCollection,
                fields: ['username', 'nickname', 'roles'],
                recordActions: [
                  {
                    type: 'popup',
                    title: 'Details',
                    popup: {
                      layout: {
                        rows: [
                          [
                            { key: 'userDetails', span: 12 },
                            { key: 'userRoles', span: 12 },
                          ],
                        ],
                      },
                      blocks: [
                        {
                          key: 'userDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: sourceCollection,
                          },
                          fields: ['username', 'nickname', 'email', 'roles'],
                        },
                        {
                          key: 'userRoles',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                            collectionName: targetCollection,
                          },
                          fields: [
                            {
                              field: 'title',
                              popup: {
                                title: 'Role details',
                                blocks: [
                                  {
                                    key: 'roleDetails',
                                    type: 'details',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: targetCollection,
                                    },
                                    fields: POPUP_RELATION_TARGET_TITLE_FIELDS,
                                  },
                                ],
                              },
                            },
                            'name',
                            'description',
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const rootDetails = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'DetailsBlockModel')[0];
    expect(rootDetails?.uid).toBeTruthy();

    const rootDetailsReadback = await getSurface(rootAgent, {
      uid: rootDetails.uid,
    });
    expect(rootDetailsReadback.tree.use).toBe('DetailsBlockModel');
    expect(collectFieldPaths(rootDetailsReadback.tree)).toEqual(
      expect.arrayContaining(['username', 'nickname', 'roles']),
    );
    const rootPopupAction = _.castArray(rootDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'PopupCollectionActionModel',
    );
    expect(rootPopupAction?.uid).toBeTruthy();

    const { popupItems } = await readPrimaryPopupBlockFromAction(rootPopupAction.uid);
    expect(popupItems).toHaveLength(2);
    const userDetailsBlock = popupItems.find((item: any) => item?.use === 'DetailsBlockModel');
    const userRolesTable = popupItems.find((item: any) => item?.use === 'TableBlockModel');
    expect(userDetailsBlock?.uid).toBeTruthy();
    expect(userRolesTable?.uid).toBeTruthy();

    const userDetailsReadback = await getSurface(rootAgent, {
      uid: userDetailsBlock.uid,
    });
    expect(collectFieldPaths(userDetailsReadback.tree)).toEqual(expect.arrayContaining(['email', 'roles']));
    expect(readNodeActionUses(userDetailsReadback.tree)).toContain('EditActionModel');
    const userEditAction = _.castArray(userDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    expect(userEditAction?.uid).toBeTruthy();

    const { popupBlock: userEditForm } = await readPrimaryPopupBlockFromAction(userEditAction.uid);
    expect(userEditForm?.use).toBe('EditFormModel');
    expect(readNodeActionUses(userEditForm)).toContain('FormSubmitActionModel');

    const userRolesReadback = await getSurface(rootAgent, {
      uid: userRolesTable.uid,
    });
    expect(userRolesReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: targetCollection,
      associationName,
    });
    expect(collectFieldPaths(userRolesReadback.tree)).toEqual(expect.arrayContaining(['title', 'name']));
    const roleTitleFieldNodes = collectDescendantNodes(
      userRolesReadback.tree,
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'title',
    );
    const roleTitleField =
      roleTitleFieldNodes.find(
        (item) =>
          item?.props?.clickToOpen === true ||
          !!item?.popup?.template?.uid ||
          !!item?.subModels?.page?.uid ||
          !!item?.stepParams?.popupSettings?.openView,
      ) || roleTitleFieldNodes[roleTitleFieldNodes.length - 1];
    expect(roleTitleField?.props?.clickToOpen).toBe(true);

    let roleDetailsBlock;
    if (roleTitleField?.popup?.template?.uid) {
      const popupTemplate = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: roleTitleField.popup.template.uid,
          },
        }),
      );
      const popupTemplateSurface = await getSurface(rootAgent, {
        uid: popupTemplate.targetUid,
      });
      roleDetailsBlock = _.castArray(
        popupTemplateSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      )[0];
    } else {
      expect(roleTitleField?.subModels?.page?.use).toBe('ChildPageModel');
      roleDetailsBlock = _.castArray(
        roleTitleField?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      )[0];
    }
    expect(roleDetailsBlock?.use).toBe('DetailsBlockModel');

    const roleDetailsReadback = await getSurface(rootAgent, {
      uid: roleDetailsBlock.uid,
    });
    expect(readNodeActionUses(roleDetailsReadback.tree)).toContain('EditActionModel');
    const roleEditAction = _.castArray(roleDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    expect(roleEditAction?.uid).toBeTruthy();

    const { popupBlock: roleEditForm } = await readPrimaryPopupBlockFromAction(roleEditAction.uid);
    expect(roleEditForm?.use).toBe('EditFormModel');
    expect(readNodeActionUses(roleEditForm)).toContain('FormSubmitActionModel');
  });

  it('should auto-complete clickable field and relation field popups in applyBlueprint', async () => {
    const { sourceCollection, targetCollection } = await createPopupRelationTestFixture('bp_click_popups');
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Clickable field popup page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                type: 'table',
                collection: sourceCollection,
                fields: [
                  {
                    field: 'username',
                    settings: {
                      clickToOpen: true,
                    },
                  },
                  {
                    field: 'nickname',
                    popup: {},
                  },
                  {
                    field: 'roles',
                    label: 'Roles',
                  },
                ],
              },
            ],
          },
        ],
        defaults: {
          collections: {
            [sourceCollection]: {
              popups: {
                view: {
                  name: 'Generated user details',
                  description: 'View one generated user record.',
                },
                associations: {
                  roles: {
                    view: {
                      name: 'Generated role details',
                      description: 'View one generated role record.',
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const table = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const tableReadback = await getSurface(rootAgent, {
      uid: table.uid,
    });
    const findClickableField = (fieldPath: string) => {
      const fieldNodes = collectDescendantNodes(
        tableReadback.tree,
        (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === fieldPath,
      );
      return (
        fieldNodes.find(
          (item) =>
            item?.props?.clickToOpen === true ||
            !!item?.popup?.template?.uid ||
            !!item?.subModels?.page?.uid ||
            !!item?.stepParams?.popupSettings?.openView,
        ) || fieldNodes[fieldNodes.length - 1]
      );
    };

    const usernameField = findClickableField('username');
    const nicknameField = findClickableField('nickname');
    const rolesField = findClickableField('roles');
    expect(usernameField?.props?.clickToOpen).toBe(true);
    expect(nicknameField?.props?.clickToOpen).toBe(true);
    expect(rolesField?.props?.clickToOpen).toBe(true);

    const usernamePopup = await readPrimaryPopupBlockFromField(usernameField.uid);
    expect(usernamePopup.popupBlock?.use).toBe('DetailsBlockModel');
    expect(collectFieldPaths(usernamePopup.popupBlock).length).toBeGreaterThan(0);

    const nicknamePopup = await readPrimaryPopupBlockFromField(nicknameField.uid);
    expect(nicknamePopup.popupBlock?.use).toBe('DetailsBlockModel');
    expect(collectFieldPaths(nicknamePopup.popupBlock).length).toBeGreaterThan(0);

    const rolesPopup = await readPrimaryPopupBlockFromField(rolesField.uid);
    expect(rolesPopup.popupBlock?.use).toBe('DetailsBlockModel');
    expect(collectFieldPaths(rolesPopup.popupBlock)).toEqual(
      expect.arrayContaining(POPUP_RELATION_TARGET_TITLE_FIELDS),
    );
    const roleFieldReadback = await getSurface(rootAgent, {
      uid: rolesField.uid,
    });
    if (roleFieldReadback.tree?.popup?.template?.uid) {
      const roleTemplate = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: roleFieldReadback.tree.popup.template.uid,
          },
        }),
      );
      expect(roleTemplate.collectionName).toBe(targetCollection);
      expect(roleTemplate.name).toBe('Generated role details');
    }
  });

  it('should allow custom edit popups with one inherited editForm plus sibling blocks', async () => {
    const { sourceCollection, targetCollection, associationName } =
      await createPopupRelationTestFixture('bp_inherited_edit');
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Inherited edit popup page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                type: 'table',
                collection: sourceCollection,
                fields: ['username', 'nickname', 'email', 'roles'],
                recordActions: [
                  {
                    type: 'view',
                    title: '详情',
                    popup: {
                      blocks: [
                        {
                          key: 'userDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: sourceCollection,
                          },
                          fields: ['username', 'nickname', 'email', 'roles'],
                          actions: [
                            {
                              type: 'edit',
                              title: '编辑用户',
                              popup: {
                                layout: {
                                  rows: [
                                    [
                                      { key: 'userEditForm', span: 12 },
                                      { key: 'userRoles', span: 12 },
                                    ],
                                  ],
                                },
                                blocks: [
                                  {
                                    key: 'userEditForm',
                                    type: 'editForm',
                                    fields: ['username', 'nickname', 'email', 'roles'],
                                    actions: ['submit'],
                                  },
                                  {
                                    key: 'userRoles',
                                    type: 'table',
                                    resource: {
                                      binding: 'associatedRecords',
                                      associationField: 'roles',
                                      collectionName: targetCollection,
                                    },
                                    fields: POPUP_RELATION_TARGET_TITLE_FIELDS,
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const mainTable = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const mainViewAction = collectDescendantNodes(mainTable, (item) => item?.use === 'ViewActionModel')[0];
    const { actionReadback: mainViewActionReadback, popupBlock: userDetailsBlock } =
      await readPrimaryPopupBlockFromAction(mainViewAction.uid);
    expect(mainViewActionReadback.tree?.stepParams?.popupSettings?.openView).toMatchObject({
      collectionName: sourceCollection,
    });
    expect(mainViewActionReadback.tree?.stepParams?.popupSettings?.openView).not.toHaveProperty('filterByTk');
    expect(userDetailsBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: sourceCollection,
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
    const userDetailsReadback = await getSurface(rootAgent, {
      uid: userDetailsBlock.uid,
    });
    const userEditAction = _.castArray(userDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    const { popupItems } = await readPrimaryPopupBlockFromAction(userEditAction.uid);
    const userEditForm = popupItems.find((item: any) => item?.use === 'EditFormModel');
    const userRolesTable = popupItems.find((item: any) => item?.use === 'TableBlockModel');

    expect(userEditForm?.use).toBe('EditFormModel');
    expect(userEditForm?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: sourceCollection,
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
    expect(collectFieldPaths(userEditForm)).toEqual(expect.arrayContaining(['username', 'roles']));
    expect(_.castArray(userEditForm?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    expect(userRolesTable?.use).toBe('TableBlockModel');
    expect(userRolesTable?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: targetCollection,
      associationName,
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });
  });

  it('should auto-promote common record actions from actions to recordActions on table, list, and gridCard blocks', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Record action promotion page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Table',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
                actions: ['refresh', { type: 'view', title: 'View row' }, { type: 'edit', title: 'Edit row' }],
                recordActions: [{ type: 'delete', title: 'Delete row' }],
              },
            ],
          },
          {
            title: 'List',
            blocks: [
              {
                type: 'list',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
                actions: ['refresh', { type: 'view', title: 'View row' }, { type: 'edit', title: 'Edit row' }],
                recordActions: [{ type: 'delete', title: 'Delete row' }],
              },
            ],
          },
          {
            title: 'Grid',
            blocks: [
              {
                type: 'gridCard',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
                actions: ['refresh', { type: 'view', title: 'View row' }, { type: 'edit', title: 'Edit row' }],
                recordActions: [{ type: 'delete', title: 'Delete row' }],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const listBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ListBlockModel')[0];
    const gridCardBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'GridCardBlockModel')[0];

    const tableReadback = await getSurface(rootAgent, { uid: tableBlock?.uid });
    const listReadback = await getSurface(rootAgent, { uid: listBlock?.uid });
    const gridCardReadback = await getSurface(rootAgent, { uid: gridCardBlock?.uid });

    expect(readNodeActionUses(tableReadback.tree)).toEqual([
      'FilterActionModel',
      'RefreshActionModel',
      'BulkDeleteActionModel',
      'AddNewActionModel',
    ]);
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual([
      'ViewActionModel',
      'EditActionModel',
      'DeleteActionModel',
    ]);

    expect(readNodeActionUses(listReadback.tree)).toEqual([
      'FilterActionModel',
      'RefreshActionModel',
      'AddNewActionModel',
    ]);
    expect(readCardItemRecordActionUses(listReadback.tree)).toEqual([
      'DeleteActionModel',
      'ViewActionModel',
      'EditActionModel',
    ]);

    expect(readNodeActionUses(gridCardReadback.tree)).toEqual([
      'FilterActionModel',
      'RefreshActionModel',
      'AddNewActionModel',
    ]);
    expect(readCardItemRecordActionUses(gridCardReadback.tree)).toEqual([
      'DeleteActionModel',
      'ViewActionModel',
      'EditActionModel',
    ]);
  });

  it('should applyBlueprint create jsItem block and record actions on public hosts', async () => {
    const tableActionCode = 'ctx.render("table action asset");';
    const tableRecordActionCode = 'ctx.render("table record action asset");';
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        assets: {
          scripts: {
            tableActionScript: {
              version: '2.0.0',
              code: tableActionCode,
            },
            tableRecordActionScript: {
              version: '2.0.1',
              code: tableRecordActionCode,
            },
          },
        },
        navigation: {
          item: {
            title: `JS item action blueprint ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                actions: [
                  {
                    type: 'jsItem',
                    title: 'Table tools',
                    script: 'tableActionScript',
                  },
                ],
                recordActions: [
                  {
                    type: 'jsItem',
                    title: 'Row tools',
                    script: 'tableRecordActionScript',
                  },
                ],
              },
              {
                key: 'employeesList',
                type: 'list',
                collection: 'employees',
                fields: ['nickname'],
                actions: [
                  {
                    type: 'jsItem',
                    settings: {
                      version: '1.0.2',
                      code: 'ctx.render(null);',
                    },
                  },
                ],
                recordActions: [
                  {
                    type: 'jsItem',
                    settings: {
                      version: '1.0.3',
                      code: 'ctx.render(null);',
                    },
                  },
                ],
              },
              {
                key: 'employeesCards',
                type: 'gridCard',
                collection: 'employees',
                fields: ['nickname'],
                actions: [
                  {
                    type: 'jsItem',
                    settings: {
                      version: '1.0.4',
                      code: 'ctx.render(null);',
                    },
                  },
                ],
                recordActions: [
                  {
                    type: 'jsItem',
                    settings: {
                      version: '1.0.5',
                      code: 'ctx.render(null);',
                    },
                  },
                ],
              },
              {
                key: 'eventsCalendar',
                type: 'calendar',
                collection: 'calendar_events',
                actions: [
                  {
                    type: 'jsItem',
                    settings: {
                      version: '1.0.6',
                      code: 'ctx.render(null);',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const listBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ListBlockModel')[0];
    const gridCardBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'GridCardBlockModel')[0];
    const calendarBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CalendarBlockModel')[0];

    expect(readNodeActionUses(tableBlock)).toContain('JSItemActionModel');
    expect(readTableRecordActionUses(tableBlock)).toContain('JSItemActionModel');
    expect(readNodeActionUses(listBlock)).toContain('JSItemActionModel');
    expect(readCardItemRecordActionUses(listBlock)).toContain('JSItemActionModel');
    expect(readNodeActionUses(gridCardBlock)).toContain('JSItemActionModel');
    expect(readCardItemRecordActionUses(gridCardBlock)).toContain('JSItemActionModel');
    expect(readNodeActionUses(calendarBlock)).toContain('JSItemActionModel');

    const tableCollectionJsItem = _.castArray(tableBlock?.subModels?.actions || []).find(
      (item: any) => item?.use === 'JSItemActionModel',
    );
    const tableRecordJsItem = readTableRecordActions(tableBlock).find((item: any) => item?.use === 'JSItemActionModel');
    expect(tableCollectionJsItem?.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '2.0.0',
      code: tableActionCode,
    });
    expect(tableRecordJsItem?.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '2.0.1',
      code: tableRecordActionCode,
    });
  });

  it('should applyBlueprint update actions with assignValues settings and mirror assignedValues', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint assign values page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Employees',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status'],
                actions: [
                  {
                    type: 'bulkUpdate',
                    settings: {
                      assignValues: {
                        status: 'inactive',
                      },
                    },
                  },
                ],
                recordActions: [
                  {
                    type: 'updateRecord',
                    settings: {
                      assignValues: {
                        status: 'active',
                      },
                      triggerWorkflows: [
                        {
                          workflowKey: 'employee_status_changed',
                          context: 'department',
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const bulkUpdateAction = collectDescendantNodes(
      data.surface.tree,
      (item) => item?.use === 'BulkUpdateActionModel',
    )[0];
    const updateRecordAction = collectDescendantNodes(
      data.surface.tree,
      (item) => item?.use === 'UpdateRecordActionModel',
    )[0];
    expect(bulkUpdateAction?.uid).toBeTruthy();
    expect(updateRecordAction?.uid).toBeTruthy();
    expectAssignedValuesMirrors(bulkUpdateAction, {
      status: 'inactive',
    });
    expectAssignFormGridItems(bulkUpdateAction, {
      status: 'inactive',
    });
    expectAssignedValuesMirrors(updateRecordAction, {
      status: 'active',
    });
    expectTriggerWorkflows(updateRecordAction, 'recordTriggerWorkflowsActionSettings', [
      {
        workflowKey: 'employee_status_changed',
        context: 'department',
      },
    ]);
    expectAssignFormGridItems(updateRecordAction, {
      status: 'active',
    });
  });

  it('should auto-inject submit into applyBlueprint create and edit forms and keep it first', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint default submit page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'createAuto',
                type: 'createForm',
                collection: 'users',
                fields: ['username'],
              },
              {
                key: 'createExplicit',
                type: 'createForm',
                collection: 'users',
                fields: ['nickname'],
                actions: ['submit', 'js'],
              },
              {
                key: 'usersTable',
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
                recordActions: [
                  {
                    type: 'view',
                    title: 'View',
                    popup: {
                      blocks: [
                        {
                          key: 'userDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'users',
                          },
                          fields: ['username', 'nickname', 'email'],
                          actions: [
                            {
                              type: 'edit',
                              title: 'Edit user',
                              popup: {
                                blocks: [
                                  {
                                    key: 'userEditForm',
                                    type: 'editForm',
                                    fields: ['username'],
                                    actions: ['js'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const overviewBlocks = _.castArray(data.surface?.tree?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels?.items;
    const createForms = _.castArray(overviewBlocks || []).filter((item: any) => item?.use === 'CreateFormModel');
    expect(createForms).toHaveLength(2);
    const [createAutoBlock, createExplicitBlock] = createForms;
    expect(readDirectFormFieldPaths(createAutoBlock)).toEqual(['username']);
    expect(readDirectFormFieldPaths(createExplicitBlock)).toEqual(['nickname']);
    expect(createAutoBlock?.uid).toBeTruthy();
    expect(createExplicitBlock?.uid).toBeTruthy();
    const createAutoReadback = await getSurface(rootAgent, {
      uid: createAutoBlock?.uid,
    });
    const createExplicitReadback = await getSurface(rootAgent, {
      uid: createExplicitBlock?.uid,
    });

    expect(readNodeActionUses(createAutoReadback.tree)).toEqual(['FormSubmitActionModel']);
    const createExplicitUses = readNodeActionUses(createExplicitReadback.tree);
    expect(createExplicitUses[0]).toBe('FormSubmitActionModel');
    expect(createExplicitUses.filter((item) => item === 'FormSubmitActionModel')).toHaveLength(1);
    expect(createExplicitUses).toHaveLength(2);

    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const tableReadback = await getSurface(rootAgent, {
      uid: tableBlock?.uid,
    });
    const tableViewAction = collectDescendantNodes(tableReadback.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(tableViewAction?.uid).toBeTruthy();
    const { popupBlock: userDetailsBlock } = await readPrimaryPopupBlockFromAction(tableViewAction.uid);
    const userDetailsReadback = await getSurface(rootAgent, {
      uid: userDetailsBlock?.uid,
    });
    const userEditAction = _.castArray(userDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    expect(userEditAction?.uid).toBeTruthy();
    const { popupBlock: userEditFormBlock } = await readPrimaryPopupBlockFromAction(userEditAction.uid);
    const userEditFormUses = readNodeActionUses(userEditFormBlock);
    expect(userEditFormUses[0]).toBe('FormSubmitActionModel');
    expect(userEditFormUses.filter((item) => item === 'FormSubmitActionModel')).toHaveLength(1);
    expect(userEditFormUses).toHaveLength(2);
  });

  it('should reject addChild written under actions in applyBlueprint', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Misplaced addChild page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'categories',
                fields: ['title'],
                actions: [{ type: 'addChild', title: 'Add child category' }],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(executeRes.body?.errors?.[0]?.path).toBe('$.tabs[0].blocks[0].actions[0]');
    expect(readErrorMessage(executeRes)).toContain('recordActions');
  });

  it('should reject addChild string shorthand written under actions in applyBlueprint', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Misplaced addChild shorthand page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'categories',
                fields: ['title'],
                actions: ['addChild'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(executeRes.body?.errors?.[0]?.path).toBe('$.tabs[0].blocks[0].actions[0]');
    expect(readErrorMessage(executeRes)).toContain('recordActions');
  });

  it('should only allow addChild under recordActions when applyBlueprint targets a tree table', async () => {
    const invalidRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Invalid addChild blueprint ${Date.now()}`,
          },
        },
        defaults: {
          collections: {
            categories: {
              fieldGroups: [
                {
                  key: 'categoryMain',
                  title: 'Category main',
                  fields: ['title', 'parent'],
                },
              ],
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'categories',
                fields: ['title'],
                recordActions: [{ type: 'addChild', title: 'Add child category' }],
              },
            ],
          },
        ],
      },
    });

    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain('tree table');

    const validRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Valid addChild blueprint ${Date.now()}`,
          },
        },
        defaults: {
          collections: {
            categories: {
              fieldGroups: [
                {
                  key: 'categoryMain',
                  title: 'Category main',
                  fields: ['title', 'parent'],
                },
              ],
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'categories',
                settings: {
                  treeTable: true,
                },
                fields: ['title'],
                recordActions: [{ type: 'addChild', title: 'Add child category' }],
              },
            ],
          },
        ],
      },
    });

    expect(validRes.status).toBe(200);
    const data = getData(validRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock?.uid });
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual(['AddChildActionModel']);
    expectTreeTableTitleClickDefaults(tableReadback.tree);
    const addChild = readTableRecordActions(tableReadback.tree).find(
      (action: any) => action?.use === 'AddChildActionModel',
    );
    expect(addChild?.uid).toBeTruthy();
    const { actionReadback, popupBlock } = await readPrimaryPopupBlockFromAction(addChild.uid);
    expect(actionReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
    });
    expect(actionReadback.tree.stepParams?.popupSettings?.openView?.sourceId).toBeUndefined();
    expect(popupBlock?.use).toBe('CreateFormModel');
    expect(popupBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });
    expect(readDirectFormDividerLabels(popupBlock)).toEqual(['Category main']);
    expect(readDirectFormFieldPaths(popupBlock)).toEqual(['title', 'parent']);

    const validStringRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Valid addChild shorthand blueprint ${Date.now()}`,
          },
        },
        defaults: {
          collections: {
            categories: {
              fieldGroups: [
                {
                  key: 'categoryMain',
                  title: 'Category main',
                  fields: ['title', 'parent'],
                },
              ],
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'categories',
                settings: {
                  treeTable: true,
                },
                fields: ['title'],
                recordActions: ['addChild'],
              },
            ],
          },
        ],
      },
    });

    expect(validStringRes.status).toBe(200);
    const stringData = getData(validStringRes);
    const stringTableBlock = collectDescendantNodes(
      stringData.surface.tree,
      (item) => item?.use === 'TableBlockModel',
    )[0];
    const stringTableReadback = await getSurface(rootAgent, { uid: stringTableBlock?.uid });
    expect(readTableRecordActionUses(stringTableReadback.tree)).toEqual(['AddChildActionModel']);
    expectTreeTableTitleClickDefaults(stringTableReadback.tree);
    const stringAddChild = readTableRecordActions(stringTableReadback.tree).find(
      (action: any) => action?.use === 'AddChildActionModel',
    );
    expect(stringAddChild?.uid).toBeTruthy();
    const { actionReadback: stringActionReadback, popupBlock: stringPopupBlock } =
      await readPrimaryPopupBlockFromAction(stringAddChild.uid);
    expect(stringActionReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
    });
    expect(stringActionReadback.tree.stepParams?.popupSettings?.openView?.sourceId).toBeUndefined();
    expect(stringPopupBlock?.use).toBe('CreateFormModel');
    expect(stringPopupBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });
    expect(readDirectFormDividerLabels(stringPopupBlock)).toEqual(['Category main']);
    expect(readDirectFormFieldPaths(stringPopupBlock)).toEqual(['title', 'parent']);
  });

  it('should inject addChild into tree table record actions by default', async () => {
    const unique = Date.now();
    const pageTitle = `Tree table blueprint default addChild ${unique}`;
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: pageTitle,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'categoriesTable',
                type: 'table',
                collection: 'categories',
                settings: {
                  treeTable: true,
                },
                fields: ['title'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock?.uid });
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual(['AddChildActionModel']);
    expectTreeTableTitleClickDefaults(tableReadback.tree);

    const addChild = readTableRecordActions(tableReadback.tree).find(
      (action: any) => action?.use === 'AddChildActionModel',
    );
    expect(addChild?.uid).toBeTruthy();
    const { actionReadback, popupSurface, popupBlock } = await readPrimaryPopupBlockFromAction(addChild.uid);
    expect(actionReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
    });
    expect(actionReadback.tree.stepParams?.popupSettings?.openView?.sourceId).toBeUndefined();
    expect(popupSurface.tree?.use).toBe('AddChildActionModel');
    expect(popupBlock?.use).toBe('CreateFormModel');
    expect(popupBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });
  });

  it('should keep explicit tree table record actions and still inject addChild', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Tree table explicit record actions ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'categories',
                settings: {
                  treeTable: true,
                },
                fields: ['title'],
                recordActions: ['view', 'edit', 'delete'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock?.uid });
    const recordActionUses = readTableRecordActionUses(tableReadback.tree);
    expect(recordActionUses).toEqual(
      expect.arrayContaining(['EditActionModel', 'DeleteActionModel', 'AddChildActionModel']),
    );
    expect(recordActionUses).not.toContain('ViewActionModel');
    expect(recordActionUses.filter((item) => item === 'AddChildActionModel')).toHaveLength(1);
    expect(recordActionUses).toHaveLength(3);
    expectTreeTableTitleClickDefaults(tableReadback.tree);
  });

  it('should reject unreadable explicit tree table fields with no readable candidate', async () => {
    for (const fieldName of ['id', 'parentId', 'parent', 'parent.title']) {
      const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            item: {
              title: `Invalid tree table first column ${fieldName} ${Date.now()}`,
            },
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'table',
                  collection: 'categories',
                  settings: {
                    treeTable: true,
                  },
                  fields: [fieldName],
                },
              ],
            },
          ],
        },
      });

      expect(executeRes.status).toBe(400);
      expect(
        _.castArray(executeRes.body?.errors)
          .map((error: any) => String(error?.message || ''))
          .join('\n'),
      ).toContain('explicit fields must include at least one direct readable');
    }
  });

  it('should keep explicit tree table addChild record actions without duplication', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Tree table explicit addChild ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'categories',
                settings: {
                  treeTable: true,
                },
                fields: ['title'],
                recordActions: ['addChild'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock?.uid });
    expect(readTableRecordActionUses(tableReadback.tree).filter((item) => item === 'AddChildActionModel')).toHaveLength(
      1,
    );
  });

  it('should not inject addChild for treeTable tables backed by non-tree collections', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Non-tree table addChild ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                settings: {
                  treeTable: true,
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock?.uid });
    expect(readTableRecordActionUses(tableReadback.tree)).not.toContain('AddChildActionModel');
  });

  it('should not inject default addChild into template-backed tree tables', async () => {
    const sourcePage = await createPage(rootAgent, {
      title: `Tree table block template source ${Date.now()}`,
      tabTitle: 'Source',
    });
    const sourceTable = await addBlockData(rootAgent, {
      target: { uid: sourcePage.gridUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'categories',
      },
      fields: ['title'],
      settings: {
        treeTable: true,
      },
    });
    const sourceTableReadback = await getSurface(rootAgent, { uid: sourceTable.uid });
    const sourceAddChild = readTableRecordActions(sourceTableReadback.tree).find(
      (action: any) => action?.use === 'AddChildActionModel',
    );
    if (sourceAddChild?.uid) {
      const removeAddChild = await rootAgent.resource('flowSurfaces').removeNode({
        values: {
          target: {
            uid: sourceAddChild.uid,
          },
        },
      });
      expect(removeAddChild.status).toBe(200);
    }
    const blockTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: sourceTable.uid },
          name: `Tree table block template ${Date.now()}`,
          description: 'Tree table block template for applyBlueprint default action guard.',
          saveMode: 'duplicate',
        },
      }),
    );

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Tree table template-backed blueprint ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'templatedTreeTable',
                template: {
                  uid: blockTemplate.uid,
                  mode: 'copy',
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const templatedTable = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    expect(templatedTable?.uid).toBeTruthy();
    const tableReadback = await getSurface(rootAgent, { uid: templatedTable.uid });
    expect(readTableRecordActionUses(tableReadback.tree)).not.toContain('AddChildActionModel');
  });

  it('should accept applyBlueprint defaults without attaching popup metadata to injected non-popup actions', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Blueprint defaults contract ${Date.now()}`,
          },
        },
        defaults: {
          collections: {
            users: {
              fieldGroups: [
                {
                  key: 'basic',
                  title: 'Basic information',
                  fields: ['username', 'nickname', 'email'],
                },
              ],
              popups: {
                view: {
                  name: 'User details',
                  description: 'View one user record.',
                },
                associations: {
                  roles: {
                    view: {
                      name: 'User role details',
                      description: 'View one related role record.',
                    },
                  },
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(200);
    const data = getData(res);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock?.uid });
    const tableActions = _.castArray(tableReadback.tree?.subModels?.actions || []);
    const filterAction = tableActions.find((item: any) => item?.use === 'FilterActionModel');
    const refreshAction = tableActions.find((item: any) => item?.use === 'RefreshActionModel');
    const bulkDeleteAction = tableActions.find((item: any) => item?.use === 'BulkDeleteActionModel');

    expect(tableActions.map((item: any) => item?.use)).toEqual([
      'FilterActionModel',
      'RefreshActionModel',
      'BulkDeleteActionModel',
      'AddNewActionModel',
    ]);
    expect(filterAction?.popup?.template).toBeUndefined();
    expect(refreshAction?.popup?.template).toBeUndefined();
    expect(bulkDeleteAction?.popup?.template).toBeUndefined();
  });

  it.each([
    [
      'defaults.collections blocks',
      {
        defaults: {
          collections: {
            users: {
              blocks: [],
            },
          },
        },
      },
      '$.defaults.collections.users',
      'unsupported keys: blocks',
    ],
    [
      'popups.view missing description',
      {
        defaults: {
          collections: {
            users: {
              popups: {
                view: {
                  name: 'User details',
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.popups.view.description',
      'must be a non-empty string',
    ],
    [
      'popups.addNew missing description',
      {
        defaults: {
          collections: {
            users: {
              popups: {
                addNew: {
                  name: 'Create user',
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.popups.addNew.description',
      'must be a non-empty string',
    ],
    [
      'popups.edit missing description',
      {
        defaults: {
          collections: {
            users: {
              popups: {
                edit: {
                  name: 'Edit user',
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.popups.edit.description',
      'must be a non-empty string',
    ],
    [
      'popups.view blocks',
      {
        defaults: {
          collections: {
            users: {
              popups: {
                view: {
                  name: 'User details',
                  blocks: [],
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.popups.view',
      'unsupported keys: blocks',
    ],
    [
      'popups relations alias',
      {
        defaults: {
          collections: {
            users: {
              popups: {
                relations: {
                  roles: {
                    view: {
                      name: 'User role details',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.popups',
      'unsupported keys: relations',
    ],
    [
      'popups.associations view fieldGroups',
      {
        defaults: {
          collections: {
            users: {
              popups: {
                associations: {
                  roles: {
                    view: {
                      name: 'User role details',
                      description: 'View one related role record.',
                      fieldGroups: [],
                    },
                  },
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.popups.associations.roles.view',
      'unsupported keys: fieldGroups',
    ],
    [
      'popups.associations view missing description',
      {
        defaults: {
          collections: {
            users: {
              popups: {
                associations: {
                  roles: {
                    view: {
                      name: 'User role details',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.popups.associations.roles.view.description',
      'must be a non-empty string',
    ],
    [
      'popups.view fieldGroups',
      {
        defaults: {
          collections: {
            users: {
              popups: {
                view: {
                  name: 'User details',
                  description: 'View one user record.',
                  fieldGroups: [],
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.popups.view',
      'unsupported keys: fieldGroups',
    ],
    [
      'formBehavior invalid rules',
      {
        defaults: {
          collections: {
            users: {
              formBehavior: {
                edit: {
                  fields: {
                    nickname: {
                      settings: {
                        rules: {
                          max: 50,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '$.defaults.collections.users.formBehavior.edit.fields.nickname.settings.rules',
      'must be an array',
    ],
  ])('should reject invalid applyBlueprint defaults %s', async (_label, partial, expectedPath, expectedMessage) => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
              },
            ],
          },
        ],
        ...partial,
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(expectedPath);
    expect(readErrorMessage(res)).toContain(expectedMessage);
  });

  it('should ignore malformed shadowed legacy main defaults when dataSources.main provides the collection defaults', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        page: {
          title: 'Datasource main defaults precedence',
        },
        defaults: {
          collections: {
            users: {
              fieldGroups: [
                {
                  title: 'Malformed stale legacy alias',
                  fields: [{ titleField: 'missingFieldPath' }],
                },
              ],
            },
          },
          dataSources: {
            main: {
              collections: {
                users: {
                  fieldGroups: [
                    {
                      title: 'Main datasource',
                      fields: ['username', 'nickname', 'email'],
                    },
                  ],
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
              },
            ],
          },
        ],
      },
    });

    expect(res.status, readErrorMessage(res)).toBe(200);
  });

  it('should reject unsupported applyBlueprint top-level keys', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        unexpectedEnvelope: {
          version: '1',
          title: 'unsupported',
        },
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain('only accepts top-level keys');
    expect(readErrorMessage(res)).toContain('unsupported keys: unexpectedEnvelope');
  });

  it.each([
    [
      'reject create mode target',
      {
        version: '1',
        mode: 'create',
        target: {
          pageSchemaUid: 'employees-page-schema',
        },
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'create mode does not accept target',
    ],
    [
      'reject replace mode without target',
      {
        version: '1',
        mode: 'replace',
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'replace mode requires target.pageSchemaUid',
    ],
    [
      'reject replace navigation',
      {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: 'employees-page-schema',
        },
        navigation: {
          item: {
            title: 'Employees',
          },
        },
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'replace mode does not accept navigation',
    ],
    [
      'reject empty tabs',
      {
        version: '1',
        mode: 'create',
        tabs: [],
      },
      'tabs must be a non-empty array',
    ],
    [
      'reject empty tab blocks',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [],
          },
        ],
      },
      'tabs[0].blocks must be a non-empty array',
    ],
    [
      'reject unsupported blueprint-style key',
      {
        version: '1',
        kind: 'blueprint',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'unsupported keys: kind',
      undefined,
    ],
    [
      'reject block unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                unexpectedKey: true,
              },
            ],
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].blocks[0]',
    ],
    [
      'reject block.resource unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                resource: {
                  binding: 'currentRecord',
                  unexpectedKey: true,
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].blocks[0].resource',
    ],
    [
      'reject block.resource mixed binding and raw-only keys',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                resource: {
                  binding: 'currentRecord',
                  sourceId: 1,
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
      'cannot mix binding with flowSurfaces applyBlueprint tabs[0].blocks[0].resource.sourceId',
      'flowSurfaces applyBlueprint tabs[0].blocks[0].resource',
    ],
    [
      'reject field unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: [{ key: 'nicknameField', field: 'nickname', unexpectedKey: true }],
              },
            ],
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].blocks[0].fields[0]',
    ],
    [
      'reject field target object',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
              {
                key: 'employeesFilter',
                type: 'filterForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'nicknameField',
                    field: 'nickname',
                    target: {
                      key: 'employeesTable',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      'must be a string block key',
      'flowSurfaces applyBlueprint tabs[0].blocks[1].fields[0].target',
    ],
    [
      'reject action unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                recordActions: [{ type: 'view', unexpectedKey: true }],
              },
            ],
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0]',
    ],
    [
      'reject layout cell unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: {
              rows: [[{ unexpectedKey: 'employeesTable' }]],
            },
          },
        ],
      },
      'must reference a block key',
      '$.tabs[0].layout.rows[0][0]',
    ],
  ])('should %s', async (_label, values, message, expectedPath) => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values,
    });

    expect(res.status).toBe(400);
    const errorMessage = readErrorMessage(res);
    expect(errorMessage).toContain(message);
    if (expectedPath) {
      expect(errorMessage).toContain(expectedPath);
      expect(errorMessage).not.toContain(`tabs['`);
    }
  });

  it('should reject popup unknown keys instead of ignoring them', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      foo: 'bar',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].popup only accepts keys title, mode, template, tryTemplate, defaultType, saveAsTemplate, blocks, layout; unsupported keys: foo',
    );
  });

  it('should reject block-level layout and point authors to tabs[] or popup layout only', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                layout: {
                  rows: [['employeesTable']],
                },
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces authoring $.tabs[0].blocks[0].layout is not supported; layout is only allowed on tabs[] and popup',
    );
  });

  it('should reject generic form blocks in applyBlueprint and point authors to editForm/createForm', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Generic form page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Main',
            blocks: [
              {
                type: 'form',
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      "flowSurfaces applyBlueprint tabs[0].blocks[0].type 'form' is unsupported in applyBlueprint; use 'editForm' or 'createForm'",
    );
  });

  it('should reject custom edit popups that do not contain exactly one editForm block', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Missing editForm page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'users',
                          },
                          fields: ['username', 'nickname', 'email'],
                          actions: [
                            {
                              type: 'edit',
                              popup: {
                                blocks: [
                                  {
                                    type: 'details',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: 'users',
                                    },
                                    fields: ['username', 'nickname', 'email'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces authoring $.tabs[0].blocks[0].recordActions[0].popup.blocks[0].actions[0].popup custom edit popup must contain exactly one editForm block; found 0',
    );
  });

  it('should reject custom edit popup editForm resources that are not currentRecord-bound', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Invalid editForm resource page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'email'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'users',
                          },
                          fields: ['username', 'nickname', 'email'],
                          actions: [
                            {
                              type: 'edit',
                              popup: {
                                blocks: [
                                  {
                                    type: 'editForm',
                                    resource: {
                                      binding: 'associatedRecords',
                                      associationField: 'roles',
                                      collectionName: 'roles',
                                    },
                                    fields: ['title'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      "flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].popup.blocks[0].recordActions[0].popup.blocks[0].resource.binding must be 'currentRecord' in a custom edit popup",
    );
  });

  it('should reject tab layout uid cells and require key-only applyBlueprint layout cells', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: {
              rows: [[{ uid: 'existing-block-uid' }]],
            },
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces authoring $.tabs[0].layout.rows[0][0] must reference a block key',
    );
  });

  it('should reject non-object tab layout values instead of silently dropping them', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: 'auto',
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain('flowSurfaces authoring $.tabs[0].layout must be an object');
  });

  it('should apply fieldsLayout to field-grid blocks through applyBlueprint', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        page: {
          title: 'Blueprint form layout',
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'nicknameField',
                    field: 'nickname',
                  },
                  {
                    key: 'statusField',
                    field: 'status',
                  },
                  {
                    key: 'departmentField',
                    field: 'department',
                  },
                ],
                fieldsLayout: {
                  rows: [
                    ['nicknameField'],
                    [
                      { key: 'statusField', span: 12 },
                      { key: 'departmentField', span: 12 },
                    ],
                  ],
                },
                actions: ['submit'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const formBlock = _.castArray(data.surface?.tree?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels?.items?.[0];
    expect(formBlock?.use).toBe('CreateFormModel');

    const formGrid = formBlock?.subModels?.grid;
    const formItems = _.castArray(formGrid?.subModels?.items || []);
    const nicknameWrapper = formItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'nickname',
    )?.uid;
    const statusWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'status')
      ?.uid;
    const departmentWrapper = formItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'department',
    )?.uid;

    expect(nicknameWrapper).toBeTruthy();
    expect(statusWrapper).toBeTruthy();
    expect(departmentWrapper).toBeTruthy();
    expect(formGrid?.props?.rowOrder).toEqual(['row1', 'row2']);
    expect(formGrid?.props?.rows).toEqual({
      row1: [[nicknameWrapper]],
      row2: [[statusWrapper], [departmentWrapper]],
    });
    expect(formGrid?.props?.sizes).toEqual({
      row1: [24],
      row2: [12, 12],
    });
  });

  it('should apply relation fieldType on blueprint field objects without creating standalone table blocks', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        page: {
          title: 'Blueprint relation fieldType',
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'userForm',
                type: 'createForm',
                collection: 'users',
                fields: [
                  {
                    key: 'rolesField',
                    field: 'roles',
                    fieldType: 'popupSubTable',
                    fields: ['title', 'name'],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const formBlock = _.castArray(data.surface?.tree?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels?.items?.[0];
    const formItems = _.castArray(formBlock?.subModels?.grid?.subModels?.items || []);
    expect(formItems).toHaveLength(1);
    expect(formItems[0]?.use).toBe('FormItemModel');
    expect(formItems[0]?.subModels?.field?.use).toBe('PopupSubTableFieldModel');
    expect(
      _.castArray(formItems[0]?.subModels?.field?.subModels?.subTableColumns || [])
        .filter((item: any) => item?.use === 'TableColumnModel')
        .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual(['roles.title', 'roles.name']);
  });

  it('should reject fieldsLayout on applyBlueprint blocks that do not own a field grid', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                fieldsLayout: {
                  rows: [['nickname']],
                },
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces authoring $.tabs[0].blocks[0].fieldsLayout is only supported on createForm, editForm, details, or filterForm blocks',
    );
  });

  it('should reject applyBlueprint fieldsLayout object cells that reference unknown field keys', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        page: {
          title: 'Invalid fieldsLayout field key',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'nicknameField',
                    field: 'nickname',
                  },
                  {
                    key: 'statusField',
                    field: 'status',
                  },
                ],
                fieldsLayout: {
                  rows: [
                    [
                      { key: 'missingField', span: 12 },
                      { key: 'statusField', span: 12 },
                    ],
                  ],
                },
                actions: ['submit'],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      "flowSurfaces authoring $.tabs[0].blocks[0].fieldsLayout.rows[0][0] references unknown field 'missingField'",
    );
  });

  it('should auto-apply compact filterForm layout when fieldsLayout is omitted', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        page: {
          title: 'Blueprint filter compact layout',
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'employeeFilter',
                type: 'filterForm',
                collection: 'employees',
                fields: [
                  { key: 'nicknameFilter', field: 'nickname', target: 'employeesTable' },
                  { key: 'statusFilter', field: 'status', target: 'employeesTable' },
                  { key: 'departmentFilter', field: 'department', target: 'employeesTable' },
                ],
                actions: ['submit', 'reset'],
              },
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const overviewTab = _.castArray(data.surface?.tree?.subModels?.tabs || [])[0];
    const filterBlock = overviewTab?.subModels?.grid?.subModels?.items?.[0];
    expect(filterBlock?.use).toBe('FilterFormBlockModel');

    const filterGrid = filterBlock?.subModels?.grid;
    const filterItems = _.castArray(filterGrid?.subModels?.items || []);
    const nicknameWrapper = filterItems.find(
      (item: any) => item?.stepParams?.filterFormItemSettings?.init?.filterField?.name === 'nickname',
    )?.uid;
    const statusWrapper = filterItems.find(
      (item: any) => item?.stepParams?.filterFormItemSettings?.init?.filterField?.name === 'status',
    )?.uid;
    const departmentWrapper = filterItems.find(
      (item: any) => item?.stepParams?.filterFormItemSettings?.init?.filterField?.name === 'department',
    )?.uid;

    expect(filterGrid?.props?.rowOrder).toEqual(['row1']);
    expect(filterGrid?.props?.rows).toEqual({
      row1: [[nicknameWrapper], [statusWrapper], [departmentWrapper]],
    });
    expect(filterGrid?.props?.sizes).toEqual({
      row1: [8, 8, 8],
    });
  });

  it('should auto-apply full-width richText and vditor rows when applyBlueprint fieldsLayout is omitted', async () => {
    const collectionName = `flow_surface_wide_blueprint_${_.uniqueId()}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: collectionName,
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'input' },
          { name: 'body', type: 'text', interface: 'richText' },
          { name: 'summary', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'notes', type: 'text', interface: 'vditor' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.app.db, {
      [collectionName]: ['title', 'status', 'body', 'summary', 'code', 'notes'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        page: {
          title: 'Blueprint wide field layout',
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'wideCreateForm',
                type: 'createForm',
                collection: collectionName,
                fields: ['title', 'status', 'body', 'summary', 'code', 'notes'],
                actions: ['submit'],
              },
              {
                key: 'wideDetails',
                type: 'details',
                collection: collectionName,
                fields: ['title', 'status', 'body', 'summary', 'code', 'notes'],
              },
            ],
            layout: {
              rows: [
                [
                  { key: 'wideCreateForm', span: 12 },
                  { key: 'wideDetails', span: 12 },
                ],
              ],
            },
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const overviewTab = _.castArray(data.surface?.tree?.subModels?.tabs || [])[0];
    const blocks = _.castArray(overviewTab?.subModels?.grid?.subModels?.items || []);
    const createFormBlock = blocks.find((item: any) => item?.use === 'CreateFormModel');
    const detailsBlock = blocks.find((item: any) => item?.use === 'DetailsBlockModel');

    for (const block of [createFormBlock, detailsBlock]) {
      const grid = block?.subModels?.grid;
      const items = _.castArray(grid?.subModels?.items || []);
      const titleWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'title')?.uid;
      const statusWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'status')
        ?.uid;
      const bodyWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'body')?.uid;
      const summaryWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'summary')
        ?.uid;
      const codeWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'code')?.uid;
      const notesWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'notes')?.uid;

      expect(grid?.props?.rows).toEqual({
        row1: [[titleWrapper], [statusWrapper]],
        row2: [[bodyWrapper]],
        row3: [[summaryWrapper], [codeWrapper]],
        row4: [[notesWrapper]],
      });
      expect(grid?.props?.sizes).toEqual({
        row1: [12, 12],
        row2: [24],
        row3: [12, 12],
        row4: [24],
      });
    }
  });

  it('should compile fieldGroups into divider items and compact rows through applyBlueprint', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        page: {
          title: 'Blueprint field groups',
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fieldGroups: [
                  {
                    title: 'Basic information',
                    fields: [
                      { key: 'nicknameField', field: 'nickname' },
                      { key: 'statusField', field: 'status' },
                    ],
                  },
                  {
                    title: 'Contact',
                    fields: [{ key: 'departmentField', field: 'department' }],
                  },
                ],
                actions: ['submit'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const formBlock = _.castArray(data.surface?.tree?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels?.items?.[0];
    expect(formBlock?.use).toBe('CreateFormModel');

    const formGrid = formBlock?.subModels?.grid;
    const formItems = _.castArray(formGrid?.subModels?.items || []);
    const basicDividerNode = formItems.find(
      (item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Basic information',
    );
    const contactDividerNode = formItems.find(
      (item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Contact',
    );
    const basicDivider = basicDividerNode?.uid;
    const contactDivider = contactDividerNode?.uid;
    const nicknameWrapper = formItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'nickname',
    )?.uid;
    const statusWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'status')
      ?.uid;
    const departmentWrapper = formItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'department',
    )?.uid;

    expect(basicDividerNode?.props?.orientation).toBe('left');
    expect(basicDividerNode?.stepParams?.markdownItemSetting?.title).toMatchObject({
      label: 'Basic information',
      orientation: 'left',
    });
    expect(contactDividerNode?.props?.orientation).toBe('left');
    expect(contactDividerNode?.stepParams?.markdownItemSetting?.title).toMatchObject({
      label: 'Contact',
      orientation: 'left',
    });
    expect(formGrid?.props?.rowOrder).toEqual(['row1', 'row2', 'row3', 'row4']);
    expect(formGrid?.props?.rows).toEqual({
      row1: [[basicDivider]],
      row2: [[nicknameWrapper], [statusWrapper]],
      row3: [[contactDivider]],
      row4: [[departmentWrapper]],
    });
    expect(formGrid?.props?.sizes).toEqual({
      row1: [24],
      row2: [12, 12],
      row3: [24],
      row4: [24],
    });
  });

  it('should reject fieldGroups outside createForm editForm and details blocks', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeFilter',
                type: 'filterForm',
                collection: 'employees',
                fieldGroups: [
                  {
                    title: 'Invalid',
                    fields: ['nickname'],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces authoring $.tabs[0].blocks[0].fieldGroups is only supported on createForm, editForm, or details blocks',
    );
  });

  it('should force replace into hidden-tab mode when the final blueprint has one tab', async () => {
    const page = await createPage(rootAgent, {
      title: 'Preserve enableTabs',
      tabTitle: 'Legacy overview',
      enableTabs: true,
    });
    const addTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: page.pageUid,
        },
        title: 'Legacy extra',
      },
    });
    expect(addTabRes.status).toBe(200);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        page: {
          title: 'Preserved tabs page',
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(getRouteBackedTabs(data.surface)).toHaveLength(1);
    expect(data.surface.pageRoute.enableTabs).toBe(false);
    expect(data.surface.tree.props.enableTabs).toBe(false);
    expect(data.surface.tree.stepParams?.pageSettings?.general?.enableTabs).toBe(false);
    expect(getRouteBackedTabs(data.surface)[0]?.props?.route?.hidden).toBe(true);
  });

  it('should force replace single-tab payloads to hidden-tab mode even when enableTabs is explicit true', async () => {
    const page = await createPage(rootAgent, {
      title: 'Single explicit replace page',
      tabTitle: 'Legacy overview',
      enableTabs: true,
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        page: {
          enableTabs: true,
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(getRouteBackedTabs(data.surface)).toHaveLength(1);
    expect(data.surface.pageRoute.enableTabs).toBe(false);
    expect(getRouteBackedTabs(data.surface)[0]?.props?.route?.hidden).toBe(true);
  });

  it('should rewrite existing route-backed tab slots by index without requiring tab keys', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tab order page',
      tabTitle: 'Legacy overview',
      enableTabs: true,
      tabSchemaName: 'overview',
    });
    const addTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: page.pageUid,
        },
        title: 'Legacy summary',
        tabSchemaName: 'summary',
      },
    });
    const addedTab = getData(addTabRes);
    const beforeSurface = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const beforeTabs = getRouteBackedTabs(beforeSurface);
    expect(beforeTabs).toHaveLength(2);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        tabs: [
          {
            title: 'Summary',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
          {
            title: 'Overview',
            blocks: [
              {
                type: 'details',
                collection: 'employees',
                fields: ['nickname', 'status'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(getRouteBackedTabs(data.surface).map((tab: any) => tab.uid)).toEqual([
      page.tabSchemaUid,
      addedTab.tabSchemaUid,
    ]);
    expect(getRouteBackedTabs(data.surface).map((tab: any) => tab?.props?.title)).toEqual(['Summary', 'Overview']);
  });

  it('should reject replace multi-tab payload when enableTabs is omitted but current page enableTabs is false', async () => {
    const page = await createPage(rootAgent, {
      title: 'Hidden tabs page',
      tabTitle: 'Legacy overview',
      enableTabs: false,
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'overviewTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
          {
            key: 'summary',
            title: 'Summary',
            blocks: [
              {
                key: 'summaryTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain(
      'replace mode requires page.enableTabs=true when tabs.length > 1 and the current page has enableTabs=false',
    );
  });

  it('should allow replace multi-tab payload when current page enableTabs is false but page.enableTabs=true is explicit', async () => {
    const page = await createPage(rootAgent, {
      title: 'Hidden tabs upgrade page',
      tabTitle: 'Legacy overview',
      enableTabs: false,
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        page: {
          enableTabs: true,
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'overviewTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
          {
            key: 'summary',
            title: 'Summary',
            blocks: [
              {
                key: 'summaryTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(getRouteBackedTabs(data.surface)).toHaveLength(2);
    expect(data.surface.pageRoute.enableTabs).toBe(true);
  });

  it('should reject object-style field target keys in applyBlueprint and require string block keys only', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Filter target page',
          },
        },
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesFilter',
                type: 'filterForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'nickname',
                    field: 'nickname',
                    target: {
                      key: 'employeesTable',
                    },
                  },
                ],
              },
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces applyBlueprint tabs[0].blocks[0].fields[0].target');
    expect(readErrorMessage(executeRes)).toContain('target must be a string block key');
  });

  it('should reject duplicate reaction slots with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Duplicate reaction slot page',
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
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [],
            },
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [],
            },
          ],
        },
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces applyBlueprint reaction.items[1]');
    expect(readErrorMessage(executeRes)).toContain(`duplicates reaction slot 'setFieldValueRules'`);
    expect(readErrorMessage(executeRes)).toContain(`target 'main.employeeForm'`);
  });

  it('should reject invalid reaction target payloads with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid reaction payload page',
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
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: {},
              rules: {},
            },
          ],
        },
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces applyBlueprint reaction.items[0].target');
    expect(readErrorMessage(executeRes)).toContain('must be a non-empty string');
  });

  it('should reject non-array reaction rules payloads with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid reaction rules page',
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
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: {},
            },
          ],
        },
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces applyBlueprint reaction.items[0].rules');
    expect(readErrorMessage(executeRes)).toContain('must be an array');
  });

  it('should report popup nested block errors with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Popup validation page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'details',
                          collection: 'employees',
                          unexpectedNestedKey: 'department',
                          fields: ['nickname'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    const message = readErrorMessage(executeRes);
    expect(message).toContain('flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].popup.blocks[0]');
    expect(message).toContain('unsupported keys: unexpectedNestedKey');
    expect(message).not.toContain(`tabs['`);
  });
});
