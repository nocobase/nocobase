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

describe('flowSurfaces applyBlueprint contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let routesRepo: FlowSurfacesContractContext['routesRepo'];

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

  function readNodeActionUses(node: any) {
    return _.castArray(node?.subModels?.actions || []).map((item: any) => item?.use);
  }

  function readTableRecordActionUses(node: any) {
    const actionsColumn = _.castArray(node?.subModels?.columns || []).find(
      (column: any) => column?.use === 'TableActionsColumnModel',
    );
    return readNodeActionUses(actionsColumn);
  }

  function readCardItemRecordActionUses(node: any) {
    return _.castArray(node?.subModels?.item?.subModels?.actions || []).map((item: any) => item?.use);
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
      return {
        actionReadback,
        popupSurface,
        popupBlock: _.castArray(
          popupSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
        )[0],
      };
    }
    return {
      actionReadback,
      popupSurface: actionReadback,
      popupBlock: _.castArray(
        actionReadback.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      )[0],
    };
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

  it('should create one page from a simplified page blueprint and return only target/surface', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title: 'Workspace',
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

    expect(executeRes.status).toBe(200);
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
    expect(executeRes.status).toBe(200);
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
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'label' && item?.popup?.pageUid,
    )[0];
    expect(fallbackField?.popup?.template).toBeUndefined();
    expect(fallbackField?.popup?.pageUid).toBeTruthy();
    expect(
      collectDescendantNodes(
        fallbackField,
        (item) =>
          item?.use === 'DetailsBlockModel' && item?.stepParams?.resourceSettings?.init?.collectionName === 'skills',
      ),
    ).toHaveLength(1);
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
      await expectTemplateUsage(rootAgent, template.uid, 1);
      return template;
    }

    await expectSavedTemplateReference(fieldTemplateName);
    await expectSavedTemplateReference(actionTemplateName);
    await expectSavedTemplateReference(recordActionTemplateName);
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

  it('should reject same-title navigation group reuse when group metadata is also provided', async () => {
    const groupTitle = `Same-title metadata group ${Date.now()}`;
    await createMenu(rootAgent, {
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
            icon: 'UserOutlined',
            tooltip: 'Should fail for reused group',
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

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain(
      `navigation.group.title '${groupTitle}' matched an existing menu group`,
    );
    expect(readErrorMessage(executeRes)).toContain('navigation.group.icon');
    expect(readErrorMessage(executeRes)).toContain('navigation.group.tooltip');
    expect(readErrorMessage(executeRes)).toContain('Same-title reuse is title-only');
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces:updateMenu');
  });

  it('should reject navigation.group.routeId when existing-group metadata is also provided', async () => {
    const existingGroup = await createMenu(rootAgent, {
      title: `Explicit group ${Date.now()}`,
      type: 'group',
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

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('navigation.group.routeId');
    expect(readErrorMessage(executeRes)).toContain('navigation.group.icon');
    expect(readErrorMessage(executeRes)).toContain('navigation.group.hideInMenu');
    expect(readErrorMessage(executeRes)).toContain('does not update existing menu-group metadata');
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces:updateMenu');
  });

  it('should reject ambiguous navigation group title reuse and ask for routeId explicitly', async () => {
    const groupTitle = `Ambiguous applyBlueprint group ${Date.now()}`;
    await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });
    await createMenu(rootAgent, {
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
      `navigation.group.title '${groupTitle}' matches 2 existing menu groups`,
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
    expect(message).toContain(`flowSurfaces applyBlueprint tabs[0].layout.rows[0][0]`);
    expect(message).toContain(`references unknown block 'missingBlock'`);
    expect(message).not.toContain(`tabs['`);
  });

  it('should normalize currentRecord associationPathName resource shorthand into an associated-records popup table', async () => {
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
                collection: 'users',
                fields: ['username'],
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
                            collectionName: 'roles',
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

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(viewAction?.uid).toBeTruthy();

    const viewReadback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const popupBlock = _.castArray(viewReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid
      ?.subModels?.items?.[0];

    expect(popupBlock?.use).toBe('TableBlockModel');
    expect(popupBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: 'roles',
      associationName: 'users.roles',
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
                fields: ['username'],
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

    expect(executeRes.status).toBe(400);
    const message = readErrorMessage(executeRes);
    expect(message).toContain(`associationPathName 'manager.roles'`);
    expect(message).toContain('single association field name');
    expect(message).toContain('associationField');
  });

  it('should create the nested users-roles popup page structure and auto-promote record actions from details.actions', async () => {
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
                collection: 'users',
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
                            collectionName: 'users',
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
                                      collectionName: 'users',
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
                            collectionName: 'roles',
                          },
                          fields: ['title', 'name'],
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
                                      collectionName: 'roles',
                                    },
                                    fields: ['title', 'name'],
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
                                                collectionName: 'roles',
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

    const mainViewReadback = await getSurface(rootAgent, {
      uid: mainViewAction.uid,
    });
    const popupItems = _.castArray(
      _.castArray(mainViewReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels?.items ||
        [],
    );
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
      collectionName: 'roles',
      associationName: 'users.roles',
    });
    expect(collectFieldPaths(userRolesReadback.tree)).toEqual(expect.arrayContaining(['title', 'name']));
    const roleViewAction = collectDescendantNodes(userRolesReadback.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(roleViewAction?.uid).toBeTruthy();

    const roleViewReadback = await getSurface(rootAgent, {
      uid: roleViewAction.uid,
    });
    const roleDetailsBlock = _.castArray(roleViewReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels
      ?.grid?.subModels?.items?.[0];
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
                collection: 'users',
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
                            collectionName: 'users',
                          },
                          fields: ['username', 'nickname', 'email', 'roles'],
                        },
                        {
                          key: 'userRoles',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                            collectionName: 'roles',
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
                                      collectionName: 'roles',
                                    },
                                    fields: ['title', 'name'],
                                  },
                                ],
                              },
                            },
                            'name',
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

    const rootPopupReadback = await getSurface(rootAgent, {
      uid: rootPopupAction.uid,
    });
    const popupItems = _.castArray(
      _.castArray(rootPopupReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels
        ?.items || [],
    );
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
      collectionName: 'roles',
      associationName: 'users.roles',
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

  it('should allow custom edit popups with one inherited editForm plus sibling blocks', async () => {
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
                collection: 'users',
                fields: ['username', 'roles'],
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
                            collectionName: 'users',
                          },
                          fields: ['username', 'roles'],
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
                                    fields: ['username', 'roles'],
                                    actions: ['submit'],
                                  },
                                  {
                                    key: 'userRoles',
                                    type: 'table',
                                    resource: {
                                      binding: 'associatedRecords',
                                      associationField: 'roles',
                                      collectionName: 'roles',
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

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const mainTable = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const mainViewAction = collectDescendantNodes(mainTable, (item) => item?.use === 'ViewActionModel')[0];
    const mainViewReadback = await getSurface(rootAgent, {
      uid: mainViewAction.uid,
    });
    const userDetailsBlock = _.castArray(mainViewReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels
      ?.grid?.subModels?.items?.[0];
    const userDetailsReadback = await getSurface(rootAgent, {
      uid: userDetailsBlock.uid,
    });
    const userEditAction = _.castArray(userDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    const userEditReadback = await getSurface(rootAgent, {
      uid: userEditAction.uid,
    });
    const popupItems = _.castArray(
      _.castArray(userEditReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels?.items ||
        [],
    );
    const userEditForm = popupItems.find((item: any) => item?.use === 'EditFormModel');
    const userRolesTable = popupItems.find((item: any) => item?.use === 'TableBlockModel');

    expect(userEditForm?.use).toBe('EditFormModel');
    expect(userEditForm?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: 'users',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
    expect(collectFieldPaths(userEditForm)).toEqual(expect.arrayContaining(['username', 'roles']));
    expect(_.castArray(userEditForm?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    expect(userRolesTable?.use).toBe('TableBlockModel');
    expect(userRolesTable?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: 'roles',
      associationName: 'users.roles',
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
                fields: ['username'],
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
                fields: ['username'],
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
                fields: ['username'],
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
      'AddNewActionModel',
      'RefreshActionModel',
    ]);
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual([
      'DeleteActionModel',
      'ViewActionModel',
      'EditActionModel',
    ]);

    expect(readNodeActionUses(listReadback.tree)).toEqual([
      'FilterActionModel',
      'AddNewActionModel',
      'RefreshActionModel',
    ]);
    expect(readCardItemRecordActionUses(listReadback.tree)).toEqual([
      'DeleteActionModel',
      'ViewActionModel',
      'EditActionModel',
    ]);

    expect(readNodeActionUses(gridCardReadback.tree)).toEqual([
      'FilterActionModel',
      'AddNewActionModel',
      'RefreshActionModel',
    ]);
    expect(readCardItemRecordActionUses(gridCardReadback.tree)).toEqual([
      'DeleteActionModel',
      'ViewActionModel',
      'EditActionModel',
    ]);
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
    expect(readErrorMessage(executeRes)).toContain('tabs[0].blocks[0].actions[0]');
    expect(readErrorMessage(executeRes)).toContain('must be authored under recordActions');
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
    expect(readErrorMessage(executeRes)).toContain('tabs[0].blocks[0].actions[0]');
    expect(readErrorMessage(executeRes)).toContain('must be authored under recordActions');
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

    const validStringRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Valid addChild shorthand blueprint ${Date.now()}`,
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
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].layout.rows[0][0]',
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
      'flowSurfaces applyBlueprint tabs[0].blocks[0].layout is not supported; layout is only allowed on tabs[] and popup',
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
                fields: ['username'],
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
                          fields: ['username'],
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
                                    fields: ['username'],
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
      'flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].popup.blocks[0].recordActions[0].popup custom edit popup must contain exactly one editForm block',
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
                fields: ['username'],
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
                          fields: ['username'],
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
      'flowSurfaces applyBlueprint tabs[0].layout.rows[0][0] only accepts keys key, span; unsupported keys: uid',
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
    expect(readErrorMessage(res)).toContain('flowSurfaces applyBlueprint tabs[0].layout must be an object');
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
      'flowSurfaces applyBlueprint tabs[0].blocks[0].fieldsLayout is only supported on createForm, editForm, details or filterForm',
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
      "flowSurfaces applyBlueprint tabs[0].blocks[0].fieldsLayout.rows[0][0] references unknown field 'missingField'",
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
      'flowSurfaces applyBlueprint tabs[0].blocks[0].fieldGroups is only supported on createForm, editForm or details',
    );
  });

  it('should keep page enableTabs unchanged in replace mode when page.enableTabs is omitted', async () => {
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
    expect(data.surface.pageRoute.enableTabs).toBe(true);
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
