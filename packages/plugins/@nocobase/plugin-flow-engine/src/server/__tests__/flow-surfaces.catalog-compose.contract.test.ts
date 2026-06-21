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
  getComposeBlock,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  getData,
  getSurface,
  readErrorItem,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { loginFlowSurfacesRootAgent, syncFlowSurfacesEnabledPlugins } from './flow-surfaces.mock-server';
import {
  FLOW_SURFACES_APPROVAL_TEST_ENABLED_PLUGIN_ALIASES,
  FLOW_SURFACES_MINIMAL_TEST_PLUGINS,
  FLOW_SURFACES_TEST_PLUGINS,
} from './flow-surfaces.test-plugins';
import { expectTemplateUsage, saveTemplate } from './flow-surfaces.templates.helpers';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';

describe('flowSurfaces catalog + compose contract', () => {
  const DEFAULT_COLLECTION_BLOCK_ACTION_USES = new Set([
    'FilterActionModel',
    'CalendarNavActionModel',
    'CalendarViewSelectActionModel',
    'RefreshActionModel',
    'AddNewActionModel',
  ]);

  let context: FlowSurfacesContractContext;
  let app: FlowSurfacesContractContext['app'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  const calendarPopupSourceTables = new Map<string, any>();

  async function createSyntheticApprovalSurface(targetFlowRepo = flowRepo) {
    const pageUid = uid();
    const tabUid = uid();
    const gridUid = uid();

    await targetFlowRepo.insertModel({
      uid: pageUid,
      use: 'TriggerChildPageModel',
      subModels: {
        tabs: [
          {
            uid: tabUid,
            use: 'TriggerChildPageTabModel',
            subModels: {
              grid: {
                uid: gridUid,
                use: 'TriggerBlockGridModel',
              },
            },
          },
        ],
      },
    });

    return {
      pageUid,
      tabUid,
      gridUid,
    };
  }

  async function createTimestampedEmployeesCollection() {
    const collectionName = `employees_with_created_at_${uid()}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: collectionName,
        createdAt: true,
        updatedAt: true,
        fields: [
          { name: 'nickname', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'input' },
          { name: 'createdAt', type: 'date', interface: 'createdAt', field: 'createdAt' },
          { name: 'updatedAt', type: 'date', interface: 'updatedAt', field: 'updatedAt' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      [collectionName]: ['nickname', 'createdAt', 'updatedAt'],
    });
    return collectionName;
  }

  async function readPrimaryPopupBlock(actionUid: string) {
    const actionSurface = await getSurface(rootAgent, {
      uid: actionUid,
    });
    const popupTemplateUid = actionSurface.tree?.popup?.template?.uid;
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
        actionSurface,
        popupSurface,
        popupBlock: _.castArray(
          popupSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
        )[0],
      };
    }
    return {
      actionSurface,
      popupSurface: actionSurface,
      popupBlock: _.castArray(
        actionSurface.tree?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      )[0],
    };
  }

  function readTableColumns(node: any) {
    return _.castArray(node?.subModels?.columns || []);
  }

  function readTableRecordActionUses(node: any) {
    const actionsColumn = readTableColumns(node).find((column: any) => column?.use === 'TableActionsColumnModel');
    return _.castArray(actionsColumn?.subModels?.actions || []).map((action: any) => action?.use);
  }

  function expectTreeTableTitleClickDefaults(node: any, expectedFieldPath = 'title') {
    const columns = readTableColumns(node);
    expect(columns[0]?.use).toBe('TableColumnModel');
    expect(columns[0]?.stepParams?.fieldSettings?.init?.fieldPath).toBe(expectedFieldPath);
    expect(columns[0]?.subModels?.field?.props?.clickToOpen).toBe(true);
    expect(columns[0]?.subModels?.field?.stepParams?.displayFieldSettings?.clickToOpen?.clickToOpen).toBe(true);
    expect(columns[0]?.subModels?.field?.stepParams?.popupSettings?.openView).toBeTruthy();
    expect(columns[1]?.use).toBe('TableActionsColumnModel');
  }

  async function expectCalendarPopupTemplateBinding(
    calendarUid: string,
    actionKey: 'quickCreateAction' | 'eventViewAction',
    templateUid?: string,
  ) {
    const action = await flowRepo.findModelById(`${calendarUid}-${actionKey}`, { includeAsyncNode: true });
    const openView = action?.stepParams?.popupSettings?.openView;
    if (templateUid) {
      expect(openView).toMatchObject({
        popupTemplateUid: templateUid,
      });
      return;
    }
    expect(openView?.popupTemplateUid).toBeUndefined();
    expect(openView?.popupTemplateMode).toBeUndefined();
  }

  async function expectPersistedCalendarPopupOpenView(
    calendarUid: string,
    actionKey: 'quickCreateAction' | 'eventViewAction',
    openView: Record<string, any>,
  ) {
    const action = await flowRepo.findModelById(`${calendarUid}-${actionKey}`, { includeAsyncNode: true });
    expect(action?.stepParams?.popupSettings?.openView).toMatchObject(openView);
  }

  async function patchCalendarPopupOpenView(
    calendarUid: string,
    actionKey: 'quickCreateAction' | 'eventViewAction',
    openView: Record<string, any>,
  ) {
    const actionUid = `${calendarUid}-${actionKey}`;
    const action = await flowRepo.findModelById(actionUid, { includeAsyncNode: true });
    await flowRepo.patch({
      uid: actionUid,
      stepParams: _.merge({}, action?.stepParams || {}, {
        popupSettings: {
          openView,
        },
      }),
    });
  }

  function collectDescendantNodes(node: any, predicate: (input: any) => boolean, bucket: any[] = []) {
    if (!node || typeof node !== 'object') {
      return bucket;
    }
    if (predicate(node)) {
      bucket.push(node);
    }
    for (const value of Object.values(node.subModels || {})) {
      for (const child of _.castArray(value as any)) {
        collectDescendantNodes(child, predicate, bucket);
      }
    }
    return bucket;
  }

  function expectAssignedValuesMirrors(actionTree: any, assignedValues: Record<string, any>) {
    expect(actionTree.stepParams?.assignSettings?.assignFieldValues?.assignedValues).toEqual(assignedValues);
    expect(actionTree.stepParams?.apply?.apply?.assignedValues).toEqual(assignedValues);
  }

  function expectTriggerWorkflows(actionTree: any, groupKey: string, triggerWorkflows: any[]) {
    expect(actionTree.stepParams?.[groupKey]?.setTriggerWorkflows?.group).toEqual(triggerWorkflows);
  }

  async function createRequiredDefaultsCollection() {
    const collectionName = `flow_surface_required_defaults_${uid()}`;
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
              rules: [{ key: `required_${uid()}`, name: 'required' }],
            },
          },
          {
            name: 'optionalText',
            type: 'string',
            interface: 'input',
            validation: {
              type: 'string',
              rules: [],
            },
          },
          {
            name: 'requiredOptionsText',
            type: 'string',
            interface: 'input',
            validation: {
              type: 'string',
              rules: [{ key: `required_options_${uid()}`, name: 'required' }],
            },
          },
        ],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
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

  function findAssignFormGridItem(actionTree: any, fieldPath: string) {
    return _.castArray(actionTree.subModels?.assignForm?.subModels?.grid?.subModels?.items || []).find(
      (candidate: any) => candidate?.stepParams?.fieldSettings?.init?.fieldPath === fieldPath,
    );
  }

  function expectIconOnlyCollectionActionDefaults(
    action: any,
    expected: {
      use: string;
      tooltip: string;
      icon: string;
      type?: string;
    },
  ) {
    expect(action?.use).toBe(expected.use);
    expect(action?.props).toMatchObject({
      title: '',
      tooltip: expected.tooltip,
      icon: expected.icon,
      iconOnly: true,
      position: 'right',
      ...(expected.type ? { type: expected.type } : {}),
    });
    expect(action?.stepParams?.buttonSettings?.general).toMatchObject({
      title: '',
      tooltip: expected.tooltip,
      icon: expected.icon,
      iconOnly: true,
      ...(expected.type ? { type: expected.type } : {}),
    });
    expect(action?.stepParams?.buttonSettings?.general?.position).toBeUndefined();
  }

  async function createCalendarTestCollection(collectionName: string) {
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: collectionName,
        createdAt: false,
        updatedAt: false,
        timestamps: false,
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'select' },
          { name: 'startsAt', type: 'date', interface: 'datetime' },
          { name: 'endsAt', type: 'date', interface: 'datetime' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      [collectionName]: ['title', 'status', 'startsAt', 'endsAt'],
    });
  }

  async function getCalendarPopupSourceTable(collectionName: string) {
    const existing = calendarPopupSourceTables.get(collectionName);
    if (existing?.uid) {
      return existing;
    }
    const page = await createPage(rootAgent, {
      title: `Calendar popup source page ${collectionName}`,
      tabTitle: `Calendar popup source tab ${collectionName}`,
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    calendarPopupSourceTables.set(collectionName, table);
    return table;
  }

  async function createCalendarPopupTemplate(type: 'addNew' | 'view' | 'edit', collectionName: string) {
    const sourceTable = await getCalendarPopupSourceTable(collectionName);
    const actionResource = type === 'addNew' ? 'addAction' : 'addRecordAction';
    const action = getData(
      await rootAgent.resource('flowSurfaces')[actionResource]({
        values: {
          target: {
            uid: sourceTable.uid,
          },
          resourceInit: {
            dataSourceKey: 'main',
            collectionName,
          },
          type,
          popup: {
            blocks: [
              {
                key: `${type}CalendarPopupBlock`,
                type: type === 'addNew' ? 'createForm' : type === 'edit' ? 'editForm' : 'details',
                resource: {
                  binding: type === 'addNew' ? 'currentCollection' : 'currentRecord',
                },
                fields: ['title'],
              },
            ],
          },
        },
      }),
    );
    return saveTemplate(rootAgent, {
      target: {
        uid: action.uid,
      },
      name: `Calendar ${type} popup template ${uid()}`,
      description: `Reusable calendar ${type} popup template for hidden calendar popup actions.`,
      saveMode: 'duplicate',
    });
  }

  async function createExternalCalendarPopupTargets(collectionName: string) {
    const table = await getCalendarPopupSourceTable(collectionName);
    const quickCreateTarget = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'addNew',
          popup: {
            blocks: [
              {
                key: 'externalQuickCreateCalendarPopupBlock',
                type: 'createForm',
                resource: {
                  binding: 'currentCollection',
                },
                fields: ['title'],
              },
            ],
          },
        },
      }),
    );
    const eventTarget = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'edit',
          popup: {
            blocks: [
              {
                key: 'externalEventCalendarPopupBlock',
                type: 'editForm',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['title'],
              },
            ],
          },
        },
      }),
    );
    return {
      quickCreateTargetUid: quickCreateTarget.uid,
      eventTargetUid: eventTarget.uid,
    };
  }

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ app, flowRepo, rootAgent } = context);
    calendarPopupSourceTables.clear();
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should default required validation onto form items created through addField and addFields only', async () => {
    const collectionName = await createRequiredDefaultsCollection();
    const page = await createPage(rootAgent, {
      title: 'Required defaults direct add page',
      tabTitle: 'Required defaults direct add tab',
    });
    const createForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    const details = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    const filterForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'filterForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      fields: [
        {
          fieldPath: 'optionalText',
          defaultTargetUid: table.uid,
        },
      ],
    });

    const addRequired = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: createForm.uid,
          },
          fieldPath: 'requiredText',
        },
      }),
    );
    const addExplicitOptional = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: createForm.uid,
          },
          fieldPath: 'requiredText',
          settings: {
            required: false,
          },
        },
      }),
    );
    const addFields = getData(
      await rootAgent.resource('flowSurfaces').addFields({
        values: {
          target: {
            uid: createForm.uid,
          },
          fields: [
            {
              key: 'optional',
              fieldPath: 'optionalText',
            },
            {
              key: 'requiredOptions',
              fieldPath: 'requiredOptionsText',
            },
          ],
        },
      }),
    );
    expect(addFields.successCount).toBe(2);
    expect(addFields.errorCount).toBe(0);

    const addDetailsRequired = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: details.uid,
          },
          fieldPath: 'requiredText',
        },
      }),
    );
    const addTableRequired = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: table.uid,
          },
          fieldPath: 'requiredText',
        },
      }),
    );
    const addFilterRequired = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: filterForm.uid,
          },
          fieldPath: 'requiredText',
          defaultTargetUid: table.uid,
        },
      }),
    );

    expectRequiredFormItemDefaults((await getSurface(rootAgent, { uid: addRequired.wrapperUid })).tree);
    const explicitOptionalTree = (await getSurface(rootAgent, { uid: addExplicitOptional.wrapperUid })).tree;
    expect(explicitOptionalTree?.props?.required).toBe(false);
    expect(explicitOptionalTree?.stepParams?.editItemSettings?.required?.required).toBe(false);
    expectNoRequiredFormItemDefaults(
      (await getSurface(rootAgent, { uid: addFields.fields[0].result.wrapperUid })).tree,
    );
    expectRequiredFormItemDefaults((await getSurface(rootAgent, { uid: addFields.fields[1].result.wrapperUid })).tree);
    expectNoRequiredFormItemDefaults((await getSurface(rootAgent, { uid: addDetailsRequired.wrapperUid })).tree);
    expectNoRequiredFormItemDefaults((await getSurface(rootAgent, { uid: addTableRequired.wrapperUid })).tree);
    expectNoRequiredFormItemDefaults((await getSurface(rootAgent, { uid: addFilterRequired.wrapperUid })).tree);
  });

  it('should default required validation onto inline form fields created through addBlock, addBlocks, and compose', async () => {
    const collectionName = await createRequiredDefaultsCollection();
    const page = await createPage(rootAgent, {
      title: 'Required defaults inline add page',
      tabTitle: 'Required defaults inline add tab',
    });

    const addBlockCreate = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'createForm',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName,
          },
          fields: ['requiredText', 'optionalText'],
        },
      }),
    );
    const addBlocks = getData(
      await rootAgent.resource('flowSurfaces').addBlocks({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'editForm',
              type: 'editForm',
              resourceInit: {
                dataSourceKey: 'main',
                collectionName,
              },
              fields: ['requiredText'],
            },
          ],
        },
      }),
    );
    expect(addBlocks.successCount).toBe(1);
    expect(addBlocks.errorCount).toBe(0);

    const compose = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'composeCreate',
              type: 'createForm',
              resource: {
                dataSourceKey: 'main',
                collectionName,
              },
              fields: ['requiredText', 'optionalText'],
            },
            {
              key: 'composeEdit',
              type: 'editForm',
              resource: {
                dataSourceKey: 'main',
                collectionName,
              },
              fields: ['requiredText'],
            },
          ],
        },
      }),
    );

    const addBlockSurface = await getSurface(rootAgent, {
      uid: addBlockCreate.uid,
    });
    expectRequiredFormItemDefaults(findGridItemByFieldPath(addBlockSurface.tree, 'requiredText'));
    expectNoRequiredFormItemDefaults(findGridItemByFieldPath(addBlockSurface.tree, 'optionalText'));

    const addBlocksSurface = await getSurface(rootAgent, {
      uid: addBlocks.blocks[0].result.uid,
    });
    expectRequiredFormItemDefaults(findGridItemByFieldPath(addBlocksSurface.tree, 'requiredText'));

    const composeCreateSurface = await getSurface(rootAgent, {
      uid: getComposeBlock(compose, 'composeCreate').uid,
    });
    const composeEditSurface = await getSurface(rootAgent, {
      uid: getComposeBlock(compose, 'composeEdit').uid,
    });
    expectRequiredFormItemDefaults(findGridItemByFieldPath(composeCreateSurface.tree, 'requiredText'));
    expectNoRequiredFormItemDefaults(findGridItemByFieldPath(composeCreateSurface.tree, 'optionalText'));
    expectRequiredFormItemDefaults(findGridItemByFieldPath(composeEditSurface.tree, 'requiredText'));
  });

  it('should expose full public action catalog variants without collapsing cross-scope action keys', async () => {
    const globalCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {},
      }),
    );
    expect(globalCatalog.selectedSections).toEqual(['blocks', 'actions', 'recordActions']);

    const popupVariants = globalCatalog.actions
      .filter((item: any) => item.key === 'popup')
      .map((item: any) => `${item.scope}:${item.use}`);
    expect(popupVariants).toEqual(expect.arrayContaining(['block:PopupCollectionActionModel']));
    const recordPopupVariants = globalCatalog.recordActions
      .filter((item: any) => item.key === 'popup')
      .map((item: any) => `${item.scope}:${item.use}`);
    expect(recordPopupVariants).toEqual(expect.arrayContaining(['record:PopupCollectionActionModel']));

    const submitVariants = globalCatalog.actions
      .filter((item: any) => item.key === 'submit')
      .map((item: any) => `${item.scope}:${item.use}`);
    expect(submitVariants).toEqual(
      expect.arrayContaining(['form:FormSubmitActionModel', 'filterForm:FilterFormSubmitActionModel']),
    );

    const jsVariants = globalCatalog.actions.filter((item: any) => item.key === 'js').map((item: any) => item.scope);
    expect(jsVariants).toEqual(expect.arrayContaining(['block', 'form', 'filterForm', 'actionPanel']));
    const recordJsVariants = globalCatalog.recordActions
      .filter((item: any) => item.key === 'js')
      .map((item: any) => item.scope);
    expect(recordJsVariants).toEqual(expect.arrayContaining(['record']));
  });

  it('should treat explicit empty catalog sections as an empty response instead of falling back to defaults', async () => {
    const emptyCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          sections: [],
        },
      }),
    );

    expect(emptyCatalog.selectedSections).toEqual([]);
    expect(emptyCatalog.blocks).toBeUndefined();
    expect(emptyCatalog.fields).toBeUndefined();
    expect(emptyCatalog.actions).toBeUndefined();
    expect(emptyCatalog.recordActions).toBeUndefined();
    expect(emptyCatalog.node).toBeUndefined();
  });

  it('should compose approval blocks when workflow-approval is explicitly enabled for the test app', async () => {
    const collectionName = await createRequiredDefaultsCollection();
    await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_APPROVAL_TEST_ENABLED_PLUGIN_ALIASES);
    try {
      const approvalRootAgent: any = await loginFlowSurfacesRootAgent(app);
      const approvalSurface = await createSyntheticApprovalSurface();
      const approvalCatalog = getData(
        await approvalRootAgent.resource('flowSurfaces').catalog({
          values: {
            target: {
              uid: approvalSurface.gridUid,
            },
            sections: ['blocks'],
          },
        }),
      );
      expect(approvalCatalog.blocks.map((item: any) => item.key)).toContain('approvalInitiator');

      const composeResult = getData(
        await approvalRootAgent.resource('flowSurfaces').compose({
          values: {
            target: {
              uid: approvalSurface.gridUid,
            },
            blocks: [
              {
                key: 'initiator',
                type: 'approvalInitiator',
                resource: {
                  dataSourceKey: 'main',
                  collectionName,
                },
                fields: ['optionalText', 'requiredText'],
              },
            ],
          },
        }),
      );

      const initiatorBlock = getComposeBlock(composeResult, 'initiator');
      expect(initiatorBlock.uid).toBeTruthy();
      const optionalFieldWrapper = await getSurface(approvalRootAgent, {
        uid: initiatorBlock.fields[0].wrapperUid,
      });
      const requiredFieldWrapper = await getSurface(approvalRootAgent, {
        uid: initiatorBlock.fields[1].wrapperUid,
      });
      expect(optionalFieldWrapper.tree.use).toBe('PatternFormItemModel');
      expect(requiredFieldWrapper.tree.use).toBe('PatternFormItemModel');
      expectNoRequiredFormItemDefaults(optionalFieldWrapper.tree);
      expectRequiredFormItemDefaults(requiredFieldWrapper.tree);
    } finally {
      await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_TEST_PLUGINS);
    }
  });

  it('should only expose catalog blocks and actions backed by plugins enabled in the current app instance', async () => {
    await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_MINIMAL_TEST_PLUGINS);
    try {
      const minimalRootAgent: any = await loginFlowSurfacesRootAgent(app);

      const page = await createPage(minimalRootAgent, {
        title: 'Minimal catalog page',
        tabTitle: 'Minimal catalog tab',
      });
      const pageCatalog = getData(
        await minimalRootAgent.resource('flowSurfaces').catalog({
          values: {
            target: {
              uid: page.tabSchemaUid,
            },
          },
        }),
      );
      expect(pageCatalog.blocks.map((item: any) => item.use)).toEqual(
        expect.arrayContaining([
          'TableBlockModel',
          'CreateFormModel',
          'EditFormModel',
          'DetailsBlockModel',
          'FilterFormBlockModel',
          'JSBlockModel',
        ]),
      );
      expect(pageCatalog.blocks.find((item: any) => item.use === 'ListBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'GridCardBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'TreeBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'MarkdownBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'IframeBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'MapBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'ChartBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'CommentsBlockModel')).toBeUndefined();
      expect(pageCatalog.blocks.find((item: any) => item.use === 'ActionPanelBlockModel')).toBeUndefined();

      const table = await addBlockData(minimalRootAgent, {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      });
      const tableCatalog = getData(
        await minimalRootAgent.resource('flowSurfaces').catalog({
          values: {
            target: {
              uid: table.uid,
            },
          },
        }),
      );
      expect(tableCatalog.actions.map((item: any) => item.key)).toEqual(
        expect.arrayContaining(['filter', 'addNew', 'popup', 'refresh', 'expandCollapse', 'bulkDelete', 'link', 'js']),
      );
      expect(tableCatalog.actions.find((item: any) => item.key === 'bulkEdit')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'bulkUpdate')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'export')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'exportAttachments')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'import')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'upload')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'composeEmail')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'templatePrint')).toBeUndefined();
      expect(tableCatalog.actions.find((item: any) => item.key === 'triggerWorkflow')).toBeUndefined();

      expect(tableCatalog.recordActions.map((item: any) => item.key)).toEqual(
        expect.arrayContaining(['view', 'edit', 'popup', 'delete', 'updateRecord', 'js']),
      );
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'duplicate')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'composeEmail')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'templatePrint')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'triggerWorkflow')).toBeUndefined();
    } finally {
      await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_TEST_PLUGINS);
    }
  });

  it('should expose tree block only when block-tree is enabled', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tree catalog page',
      tabTitle: 'Tree catalog tab',
    });

    const fullCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          sections: ['blocks'],
        },
      }),
    );
    const treeItem = fullCatalog.blocks.find((item: any) => item.key === 'tree');
    expect(treeItem).toMatchObject({
      use: 'TreeBlockModel',
      requiredInitParams: ['dataSourceKey', 'collectionName'],
      createSupported: true,
    });

    await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_MINIMAL_TEST_PLUGINS);
    try {
      const minimalRootAgent: any = await loginFlowSurfacesRootAgent(app);
      const minimalPage = await createPage(minimalRootAgent, {
        title: 'Minimal tree catalog page',
        tabTitle: 'Minimal tree catalog tab',
      });
      const minimalCatalog = getData(
        await minimalRootAgent.resource('flowSurfaces').catalog({
          values: {
            target: {
              uid: minimalPage.tabSchemaUid,
            },
            sections: ['blocks'],
          },
        }),
      );
      expect(minimalCatalog.blocks.find((item: any) => item.key === 'tree')).toBeUndefined();
    } finally {
      await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_TEST_PLUGINS);
    }
  });

  it('should expose public catalog action keys for representative block targets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Catalog contract page',
      tabTitle: 'Catalog contract tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });
    const createForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const details = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const list = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'list',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const gridCard = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'gridCard',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const filterForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'filterForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: '',
      },
      fields: [
        {
          fieldPath: 'nickname',
          defaultTargetUid: table.uid,
        },
      ],
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
    });
    const kanban = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
    });
    const tree = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'categories',
      },
    });

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: table.uid,
          },
          expand: ['item.configureOptions', 'item.contracts'],
        },
      }),
    );
    expect(tableCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining([
        'filter',
        'addNew',
        'popup',
        'refresh',
        'expandCollapse',
        'bulkDelete',
        'bulkEdit',
        'bulkUpdate',
        'export',
        'exportAttachments',
        'import',
        'link',
        'upload',
        'js',
        'jsItem',
        'composeEmail',
        'templatePrint',
        'triggerWorkflow',
      ]),
    );
    expect(tableCatalog.node.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      pageSize: {
        type: 'number',
      },
      density: {
        type: 'string',
        enum: expect.arrayContaining(['large', 'middle', 'small']),
      },
      dataScope: {
        type: 'object',
      },
    });
    expect(tableCatalog.rowActions).toBeUndefined();
    expect(tableCatalog.actions.map((item: any) => item.key)).not.toEqual(expect.arrayContaining(['view', 'edit']));
    expect(tableCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining([
        'duplicate',
        'view',
        'edit',
        'popup',
        'composeEmail',
        'delete',
        'updateRecord',
        'js',
        'jsItem',
        'templatePrint',
        'triggerWorkflow',
      ]),
    );
    expect(tableCatalog.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();
    expect(tableCatalog.recordActions.length).toBeGreaterThan(0);
    expect(
      tableCatalog.actions.find((item: any) => item.key === 'jsItem')?.settingsContract?.stepParams?.groups,
    ).toEqual(expect.objectContaining({ buttonSettings: expect.any(Object), jsSettings: expect.any(Object) }));
    expect(
      tableCatalog.actions.find((item: any) => item.key === 'jsItem')?.settingsContract?.stepParams?.groups,
    ).not.toHaveProperty('clickSettings');
    expect(
      tableCatalog.recordActions.find((item: any) => item.key === 'jsItem')?.settingsContract?.stepParams?.groups,
    ).toEqual(expect.objectContaining({ buttonSettings: expect.any(Object), jsSettings: expect.any(Object) }));
    expect(
      tableCatalog.recordActions.find((item: any) => item.key === 'jsItem')?.settingsContract?.stepParams?.groups,
    ).not.toHaveProperty('clickSettings');
    expect(tableCatalog.actions.find((item: any) => item.key === 'addNew')?.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      iconOnly: {
        type: 'boolean',
      },
      openView: {
        type: 'object',
      },
    });
    expect(tableCatalog.actions.find((item: any) => item.key === 'bulkDelete')?.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      confirm: {
        type: 'object',
      },
    });
    expect(tableCatalog.recordActions.find((item: any) => item.key === 'view')?.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      iconOnly: {
        type: 'boolean',
      },
      openView: {
        type: 'object',
      },
    });
    expect(tableCatalog.recordActions.find((item: any) => item.key === 'updateRecord')?.configureOptions).toMatchObject(
      {
        assignValues: {
          type: 'object',
        },
        triggerWorkflows: {
          type: 'array',
        },
      },
    );
    expect(tableCatalog.actions.find((item: any) => item.key === 'bulkUpdate')?.configureOptions).toMatchObject({
      assignValues: {
        type: 'object',
      },
    });
    expect(tableCatalog.actions.find((item: any) => item.key === 'bulkUpdate')?.configureOptions).not.toHaveProperty(
      'triggerWorkflows',
    );

    const calendarCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: calendar.uid,
          },
          expand: ['item.configureOptions'],
        },
      }),
    );
    expect(calendarCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining([
        'today',
        'turnPages',
        'title',
        'selectView',
        'filter',
        'addNew',
        'popup',
        'refresh',
        'js',
        'jsItem',
        'triggerWorkflow',
      ]),
    );
    for (const disallowedKey of [
      'expandCollapse',
      'bulkDelete',
      'bulkEdit',
      'bulkUpdate',
      'export',
      'exportAttachments',
      'import',
      'link',
      'upload',
      'composeEmail',
      'templatePrint',
    ]) {
      expect(calendarCatalog.actions.map((item: any) => item.key)).not.toContain(disallowedKey);
    }
    expect(calendarCatalog.recordActions || []).toEqual([]);
    expect(calendarCatalog.node.configureOptions).toMatchObject({
      titleField: {
        type: 'string',
      },
      colorField: {
        type: 'string',
      },
      startField: {
        type: 'string',
      },
      endField: {
        type: 'string',
      },
      defaultView: {
        type: 'string',
        enum: expect.arrayContaining(['month', 'week', 'day']),
      },
      quickCreatePopup: {
        type: 'object',
      },
      eventPopup: {
        type: 'object',
      },
    });
    expect(calendarCatalog.actions.find((item: any) => item.key === 'today')?.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      position: {
        enum: expect.arrayContaining(['left', 'right']),
      },
      linkageRules: {
        type: 'array',
      },
    });
    expect(calendarCatalog.actions.find((item: any) => item.key === 'turnPages')?.configureOptions).toEqual(
      expect.objectContaining({
        position: expect.objectContaining({
          enum: expect.arrayContaining(['left', 'right']),
        }),
        linkageRules: expect.objectContaining({
          type: 'array',
        }),
      }),
    );
    expect(
      calendarCatalog.actions.find((item: any) => item.key === 'turnPages')?.configureOptions?.title,
    ).toBeUndefined();

    const listCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: list.uid,
          },
        },
      }),
    );
    expect(listCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['filter', 'addNew', 'popup', 'refresh', 'js', 'jsItem', 'triggerWorkflow']),
    );
    expect(listCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['view', 'edit', 'popup', 'delete', 'updateRecord', 'js', 'jsItem', 'triggerWorkflow']),
    );

    const gridCardCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: gridCard.uid,
          },
        },
      }),
    );
    expect(gridCardCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['filter', 'addNew', 'popup', 'refresh', 'js', 'jsItem', 'triggerWorkflow']),
    );
    expect(gridCardCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['view', 'edit', 'popup', 'delete', 'updateRecord', 'js', 'jsItem', 'triggerWorkflow']),
    );

    const kanbanCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: kanban.uid,
          },
        },
      }),
    );
    expect(kanbanCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['filter', 'addNew', 'popup', 'refresh', 'js', 'jsItem']),
    );
    expect(kanbanCatalog.recordActions || []).toEqual([]);

    const treeCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tree.uid,
          },
          expand: ['item.configureOptions'],
        },
      }),
    );
    expect(treeCatalog.actions || []).toEqual([]);
    expect(treeCatalog.recordActions || []).toEqual([]);
    expect(treeCatalog.fields || []).toEqual([]);
    expect(treeCatalog.node.configureOptions).toMatchObject({
      searchable: {
        type: 'boolean',
      },
      defaultExpandAll: {
        type: 'boolean',
      },
      includeDescendants: {
        type: 'boolean',
      },
      titleField: {
        type: 'string',
      },
      pageSize: {
        type: 'number',
      },
      connectFields: {
        type: 'object',
      },
    });

    const createFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: createForm.uid,
          },
          expand: ['item.configureOptions'],
        },
      }),
    );
    expect(createFormCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['submit', 'js', 'jsItem', 'triggerWorkflow']),
    );
    expect(createFormCatalog.actions.find((item: any) => item.key === 'submit')?.configureOptions).toMatchObject({
      confirm: {
        type: 'object',
      },
      triggerWorkflows: {
        type: 'array',
      },
    });

    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: details.uid,
          },
          expand: ['item.configureOptions'],
        },
      }),
    );
    expect(detailsCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining([
        'view',
        'edit',
        'popup',
        'composeEmail',
        'delete',
        'updateRecord',
        'js',
        'jsItem',
        'templatePrint',
        'triggerWorkflow',
      ]),
    );
    expect(
      detailsCatalog.recordActions.find((item: any) => item.key === 'updateRecord')?.configureOptions,
    ).toMatchObject({
      assignValues: {
        type: 'object',
      },
      triggerWorkflows: {
        type: 'array',
      },
    });

    const filterFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: filterForm.uid,
          },
        },
      }),
    );
    expect(filterFormCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['submit', 'reset', 'collapse', 'js']),
    );
    expect(filterFormCatalog.actions.map((item: any) => item.key)).not.toContain('jsItem');
  });

  it('should create jsItem actions in public collection record and form action slots', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS item action create page',
      tabTitle: 'JS item action create tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });
    const createForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });
    const filterForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'filterForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: '',
      },
      fields: [
        {
          fieldPath: 'nickname',
          defaultTargetUid: table.uid,
        },
      ],
    });
    const actionPanel = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'actionPanel',
    });

    const collectionAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'jsItem',
          settings: {
            title: 'Table tools',
            version: '1.0.0',
            code: 'ctx.render(null);',
          },
        },
      }),
    );
    expect((await getSurface(rootAgent, { uid: collectionAction.uid })).tree).toMatchObject({
      use: 'JSItemActionModel',
      stepParams: {
        jsSettings: {
          runJs: {
            version: '1.0.0',
            code: 'ctx.render(null);',
          },
        },
      },
    });

    const recordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'jsItem',
          settings: {
            title: 'Row tools',
            version: '1.0.1',
            code: 'ctx.render(null);',
          },
        },
      }),
    );
    expect((await getSurface(rootAgent, { uid: recordAction.uid })).tree).toMatchObject({
      use: 'JSItemActionModel',
      stepParams: {
        jsSettings: {
          runJs: {
            version: '1.0.1',
            code: 'ctx.render(null);',
          },
        },
      },
    });

    const formAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: createForm.uid,
          },
          type: 'jsItem',
        },
      }),
    );
    const formActionReadback = await getSurface(rootAgent, { uid: formAction.uid });
    expect(formActionReadback.tree.use).toBe('JSItemActionModel');
    expect(formActionReadback.tree.stepParams?.jsSettings?.runJs?.code).toContain('ctx.render');
    expect(formActionReadback.tree.stepParams?.clickSettings?.runJs).toBeUndefined();

    for (const target of [
      { uid: filterForm.uid, use: 'FilterFormBlockModel' },
      { uid: actionPanel.uid, use: 'ActionPanelBlockModel' },
    ]) {
      const invalidRes = await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: target.uid,
          },
          type: 'jsItem',
        },
      });
      expect(invalidRes.status).toBe(400);
      expect(readErrorMessage(invalidRes)).toContain(
        `flowSurfaces addAction 'jsItem' is not allowed under '${target.use}'`,
      );
    }
  });

  it('should guide JS nodes to ctx.openView when declarative popup is requested', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS popup guidance page',
      tabTitle: 'JS popup guidance tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });
    const actionPanel = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'actionPanel',
    });
    const createForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });
    const popup = {
      tryTemplate: true,
    };

    const jsActionPopupRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: actionPanel.uid,
        },
        type: 'js',
        popup,
      },
    });
    expect(jsActionPopupRes.status).toBe(400);
    expect(readErrorMessage(jsActionPopupRes)).toContain(`flowSurfaces addAction type 'js' does not support popup`);
    expect(readErrorMessage(jsActionPopupRes)).toContain('should use ctx.openView to open popup');

    const jsRecordActionPopupRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'js',
        popup,
      },
    });
    expect(jsRecordActionPopupRes.status).toBe(400);
    expect(readErrorMessage(jsRecordActionPopupRes)).toContain(
      `flowSurfaces addRecordAction type 'js' does not support popup`,
    );
    expect(readErrorMessage(jsRecordActionPopupRes)).toContain('should use ctx.openView to open popup');

    const jsFieldPopupRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: table.uid,
        },
        fieldPath: 'nickname',
        renderer: 'js',
        popup,
      },
    });
    expect(jsFieldPopupRes.status).toBe(400);
    expect(readErrorMessage(jsFieldPopupRes)).toContain(
      `flowSurfaces addField field 'JSFieldModel' does not support popup`,
    );
    expect(readErrorMessage(jsFieldPopupRes)).toContain('should use ctx.openView to open popup');

    const jsDisplayField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: table.uid,
          },
          fieldPath: 'nickname',
          renderer: 'js',
        },
      }),
    );
    const configureJsDisplayFieldOpenViewRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: jsDisplayField.fieldUid,
        },
        changes: {
          openView: {
            mode: 'dialog',
          },
        },
      },
    });
    expect(configureJsDisplayFieldOpenViewRes.status).toBe(400);
    expect(readErrorMessage(configureJsDisplayFieldOpenViewRes)).toContain(
      `flowSurfaces configure field 'JSFieldModel' does not support openView`,
    );
    expect(readErrorMessage(configureJsDisplayFieldOpenViewRes)).toContain('should use ctx.openView to open popup');

    const jsEditableField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: createForm.uid,
          },
          fieldPath: 'nickname',
          renderer: 'js',
        },
      }),
    );
    const configureJsEditableFieldOpenViewRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: jsEditableField.wrapperUid,
        },
        changes: {
          openView: {
            mode: 'dialog',
          },
        },
      },
    });
    expect(configureJsEditableFieldOpenViewRes.status).toBe(400);
    expect(readErrorMessage(configureJsEditableFieldOpenViewRes)).toContain(
      `flowSurfaces configure field 'JSEditableFieldModel' does not support openView`,
    );
    expect(readErrorMessage(configureJsEditableFieldOpenViewRes)).toContain('should use ctx.openView to open popup');

    const jsColumn = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'jsColumn',
        },
      }),
    );
    const configureJsColumnOpenViewRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: jsColumn.uid,
        },
        changes: {
          openView: {
            mode: 'dialog',
          },
        },
      },
    });
    expect(configureJsColumnOpenViewRes.status).toBe(400);
    expect(readErrorMessage(configureJsColumnOpenViewRes)).toContain(
      `flowSurfaces configure jsColumn 'JSColumnModel' does not support openView`,
    );
    expect(readErrorMessage(configureJsColumnOpenViewRes)).toContain('should use ctx.openView to open popup');

    const jsItem = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: createForm.uid,
          },
          type: 'jsItem',
        },
      }),
    );
    const configureJsItemOpenViewRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: jsItem.uid,
        },
        changes: {
          openView: {
            mode: 'dialog',
          },
        },
      },
    });
    expect(configureJsItemOpenViewRes.status).toBe(400);
    expect(readErrorMessage(configureJsItemOpenViewRes)).toContain(
      `flowSurfaces configure jsItem 'JSItemModel' does not support openView`,
    );
    expect(readErrorMessage(configureJsItemOpenViewRes)).toContain('should use ctx.openView to open popup');

    const jsAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: actionPanel.uid,
          },
          type: 'js',
        },
      }),
    );
    const configureJsOpenViewRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: jsAction.uid,
        },
        changes: {
          openView: {
            mode: 'dialog',
          },
        },
      },
    });
    expect(configureJsOpenViewRes.status).toBe(400);
    expect(readErrorMessage(configureJsOpenViewRes)).toContain(
      `flowSurfaces configure action 'JSActionModel' does not support openView`,
    );
    expect(readErrorMessage(configureJsOpenViewRes)).toContain('should use ctx.openView to open popup');
  });

  it('should compose jsItem actions and recordActions into public action slots', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose JS item actions page',
      tabTitle: 'Compose JS item actions tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            actions: [
              {
                type: 'jsItem',
                settings: {
                  title: 'Table tools',
                  version: '1.0.0',
                  code: 'ctx.render(null);',
                },
              },
            ],
            recordActions: [
              {
                type: 'jsItem',
                settings: {
                  title: 'Row tools',
                  version: '1.0.1',
                  code: 'ctx.render(null);',
                },
              },
            ],
          },
          {
            key: 'employeeForm',
            type: 'createForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['nickname'],
            actions: [
              {
                type: 'jsItem',
                settings: {
                  title: 'Form tools',
                  version: '1.0.2',
                  code: 'ctx.render(null);',
                },
              },
            ],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);
    const composed = getData(composeRes);
    const tableBlock = getComposeBlock(composed, 'employeesTable');
    const formBlock = getComposeBlock(composed, 'employeeForm');
    expect(tableBlock.actions.map((item: any) => item.type)).toEqual([
      'filter',
      'refresh',
      'bulkDelete',
      'addNew',
      'jsItem',
    ]);
    expect(tableBlock.recordActions.map((item: any) => item.type)).toEqual(['view', 'edit', 'delete', 'jsItem']);
    expect(formBlock.actions.map((item: any) => item.type)).toEqual(['submit', 'jsItem']);

    const tableReadback = await getSurface(rootAgent, { uid: tableBlock.uid });
    const tableCollectionJsItem = _.castArray(tableReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'JSItemActionModel',
    );
    const tableActionsColumn = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    );
    const tableRecordJsItem = _.castArray(tableActionsColumn?.subModels?.actions || []).find(
      (item: any) => item?.use === 'JSItemActionModel',
    );
    expect(tableCollectionJsItem?.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '1.0.0',
      code: 'ctx.render(null);',
    });
    expect(tableRecordJsItem?.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '1.0.1',
      code: 'ctx.render(null);',
    });

    const formReadback = await getSurface(rootAgent, { uid: formBlock.uid });
    const formJsItem = _.castArray(formReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'JSItemActionModel',
    );
    expect(formJsItem?.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '1.0.2',
      code: 'ctx.render(null);',
    });
  });

  it('should create configure and validate flow-model calendar blocks', async () => {
    const page = await createPage(rootAgent, {
      title: 'Calendar contract page',
      tabTitle: 'Calendar contract tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
    });

    const calendarReadback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(calendarReadback.tree.use).toBe('CalendarBlockModel');
    expect(calendarReadback.tree.props?.fieldNames).toMatchObject({
      id: 'id',
      title: 'title',
      start: 'startsAt',
      end: 'endsAt',
    });
    expect(calendarReadback.tree.props).toMatchObject({
      defaultView: 'month',
      enableQuickCreateEvent: true,
      weekStart: 1,
    });
    expect(calendarReadback.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'fullHeight',
    });
    expect(_.castArray(calendarReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual([
      'FilterActionModel',
      'CalendarNavActionModel',
      'CalendarViewSelectActionModel',
      'RefreshActionModel',
      'AddNewActionModel',
    ]);

    const quickCreateAction = calendarReadback.tree.subModels?.quickCreateAction;
    const eventViewAction = calendarReadback.tree.subModels?.eventViewAction;
    const quickCreateTemplateUid = quickCreateAction?.popup?.template?.uid;
    const eventViewTemplateUid = eventViewAction?.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(eventViewTemplateUid).toBeTruthy();
    expect(quickCreateAction).toMatchObject({
      uid: `${calendar.uid}-quickCreateAction`,
      use: 'CalendarQuickCreateActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'calendar_events',
            pageModelClass: 'ChildPageModel',
          },
        },
      },
    });
    expect(eventViewAction).toMatchObject({
      uid: `${calendar.uid}-eventViewAction`,
      use: 'CalendarEventViewActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'calendar_events',
            pageModelClass: 'ChildPageModel',
          },
        },
      },
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      popupTemplateUid: quickCreateTemplateUid,
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      popupTemplateUid: eventViewTemplateUid,
    });

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: calendar.uid,
        },
        changes: {
          title: 'Team calendar',
          titleField: 'title',
          colorField: 'status',
          startField: 'startsAt',
          endField: 'endsAt',
          defaultView: 'week',
          quickCreateEvent: false,
          showLunar: true,
          weekStart: 0,
          dataScope: {
            logic: '$and',
            items: [
              {
                path: 'status',
                operator: '$eq',
                value: 'confirmed',
              },
            ],
          },
          quickCreatePopup: {
            mode: 'dialog',
            size: 'large',
            filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
            associationName: 'meetings',
            sourceId: '{{ctx.view.inputArgs.sourceId}}',
            popupTemplateHasFilterByTk: true,
            popupTemplateHasSourceId: true,
          },
          eventPopup: {
            mode: 'drawer',
            size: 'small',
          },
        },
      },
    });
    expect(configureRes.status).toBe(200);

    const configured = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(configured.tree.props).toMatchObject({
      fieldNames: {
        id: 'id',
        title: 'title',
        start: 'startsAt',
        end: 'endsAt',
        colorFieldName: 'status',
      },
      defaultView: 'week',
      enableQuickCreateEvent: false,
      showLunar: true,
      weekStart: 0,
    });
    expect(configured.tree.props).not.toHaveProperty('quickCreatePopupSettings');
    expect(configured.tree.props).not.toHaveProperty('eventPopupSettings');
    expect(configured.tree.stepParams?.calendarSettings).toMatchObject({
      titleField: {
        titleField: 'title',
      },
      colorField: {
        colorFieldName: 'status',
      },
      startDateField: {
        start: 'startsAt',
      },
      endDateField: {
        end: 'endsAt',
      },
      defaultView: {
        defaultView: 'week',
      },
      quickCreateEvent: {
        enableQuickCreateEvent: false,
      },
      showLunar: {
        showLunar: true,
      },
      weekStart: {
        weekStart: 0,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'status',
              operator: '$eq',
              value: 'confirmed',
            },
          ],
        },
      },
    });
    expect(configured.tree.stepParams?.calendarSettings?.quickCreatePopupSettings).toMatchObject({
      mode: 'dialog',
      size: 'large',
      tryTemplate: false,
    });
    expect(configured.tree.stepParams?.calendarSettings?.quickCreatePopupSettings).not.toHaveProperty('filterByTk');
    expect(configured.tree.stepParams?.calendarSettings?.quickCreatePopupSettings).not.toHaveProperty(
      'associationName',
    );
    expect(configured.tree.stepParams?.calendarSettings?.quickCreatePopupSettings).not.toHaveProperty('sourceId');
    expect(configured.tree.stepParams?.calendarSettings?.eventPopupSettings).toMatchObject({
      mode: 'drawer',
      size: 'small',
    });
    expect(configured.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      dataSourceKey: 'main',
      collectionName: 'calendar_events',
    });
    expect(configured.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).not.toHaveProperty(
      'filterByTk',
    );
    expect(configured.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).not.toHaveProperty(
      'associationName',
    );
    expect(configured.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).not.toHaveProperty(
      'sourceId',
    );
    expect(configured.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).not.toHaveProperty(
      'popupTemplateHasFilterByTk',
    );
    expect(configured.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).not.toHaveProperty(
      'popupTemplateHasSourceId',
    );
    expect(configured.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'small',
      dataSourceKey: 'main',
      collectionName: 'calendar_events',
    });

    const invalidStartFieldRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: calendar.uid,
        },
        changes: {
          startField: 'title',
        },
      },
    });
    expect(invalidStartFieldRes.status).toBe(400);
    expect(readErrorMessage(invalidStartFieldRes)).toContain(
      `flowSurfaces configure calendar startField 'title' is not supported by CalendarBlockModel`,
    );

    const invalidCalendarSettingCases = [
      {
        changes: { defaultView: 'agenda' },
        message: 'calendar defaultView must be one of: month, week, day',
      },
      {
        changes: { weekStart: 3 },
        message: 'calendar weekStart must be 0 or 1',
      },
      {
        changes: { quickCreateEvent: 'false' },
        message: 'calendar quickCreateEvent must be a boolean',
      },
      {
        changes: { showLunar: 'true' },
        message: 'calendar showLunar must be a boolean',
      },
    ];
    for (const item of invalidCalendarSettingCases) {
      const invalidSettingRes = await rootAgent.resource('flowSurfaces').configure({
        values: {
          target: {
            uid: calendar.uid,
          },
          changes: item.changes,
        },
      });
      expect(invalidSettingRes.status).toBe(400);
      expect(readErrorMessage(invalidSettingRes)).toContain(item.message);
    }

    const invalidRawUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: calendar.uid,
        },
        props: {
          weekStart: 2,
        },
      },
    });
    expect(invalidRawUpdateRes.status).toBe(400);
    expect(readErrorMessage(invalidRawUpdateRes)).toContain('calendar weekStart must be 0 or 1');

    const noDateCollectionName = `calendar_no_dates_${uid()}`;
    await rootAgent.resource('collections').create({
      values: {
        name: noDateCollectionName,
        title: 'Calendar no dates',
        createdAt: false,
        updatedAt: false,
        timestamps: false,
        fields: [{ name: 'title', type: 'string', interface: 'input' }],
      },
    });
    const invalidCollectionRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'calendar',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: noDateCollectionName,
        },
      },
    });
    expect(invalidCollectionRes.status).toBe(400);
    expect(readErrorMessage(invalidCollectionRes)).toContain(`must contain at least one date field`);
  });

  it('should mirror direct calendar popup props writes into stepParams and hidden popup hosts', async () => {
    const collectionName = `calendar_direct_props_popup_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar direct popup props page',
      tabTitle: 'Calendar direct popup props tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', quickCreateTemplate.uid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', eventViewTemplate.uid);

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: calendar.uid,
        },
        props: {
          quickCreatePopupSettings: {
            mode: 'dialog',
            size: 'large',
            popupTemplateUid: null,
          },
          eventPopupSettings: {
            mode: 'drawer',
            size: 'small',
            popupTemplateUid: null,
          },
        },
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.stepParams?.calendarSettings?.quickCreatePopupSettings).toMatchObject({
      mode: 'dialog',
      size: 'large',
      tryTemplate: false,
    });
    expect(readback.tree.stepParams?.calendarSettings?.quickCreatePopupSettings).not.toHaveProperty('popupTemplateUid');
    expect(readback.tree.stepParams?.calendarSettings?.eventPopupSettings).toMatchObject({
      mode: 'drawer',
      size: 'small',
      tryTemplate: false,
    });
    expect(readback.tree.stepParams?.calendarSettings?.eventPopupSettings).not.toHaveProperty('popupTemplateUid');
    expect(readback.tree.props).not.toHaveProperty('quickCreatePopupSettings');
    expect(readback.tree.props).not.toHaveProperty('eventPopupSettings');
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toBeUndefined();
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      mode: 'dialog',
      size: 'large',
      collectionName,
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      mode: 'drawer',
      size: 'small',
      collectionName,
    });
  });

  it('should preserve calendar action-level popup display overrides and partial popup template updates', async () => {
    const collectionName = `calendar_partial_popup_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar partial popup page',
      tabTitle: 'Calendar partial popup tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    const initialReadback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    const quickCreateTemplateUid = initialReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid;
    const eventTemplateUid = initialReadback.tree.subModels?.eventViewAction?.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(eventTemplateUid).toBeTruthy();

    await patchCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      ...(initialReadback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView || {}),
      mode: 'dialog',
      size: 'large',
      title: 'Quick create override',
      pageModelClass: 'ChildPageModel',
    });
    await patchCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      ...(initialReadback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView || {}),
      mode: 'dialog',
      size: 'large',
      title: 'Event view override',
      pageModelClass: 'ChildPageModel',
    });

    const actionOverrideReadback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(actionOverrideReadback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject(
      {
        mode: 'dialog',
        size: 'large',
        title: 'Quick create override',
      },
    );
    expect(actionOverrideReadback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      title: 'Event view override',
    });
    expect(actionOverrideReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid).toBe(quickCreateTemplateUid);
    expect(actionOverrideReadback.tree.subModels?.eventViewAction?.popup?.template?.uid).toBe(eventTemplateUid);

    const bindTemplateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: calendar.uid,
        },
        props: {
          quickCreatePopupSettings: {
            popupTemplateUid: quickCreateTemplateUid,
          },
          eventPopupSettings: {
            popupTemplateUid: eventTemplateUid,
          },
        },
      },
    });
    expect(bindTemplateRes.status, readErrorMessage(bindTemplateRes)).toBe(200);

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: calendar.uid,
        },
        props: {
          quickCreatePopupSettings: {
            mode: 'drawer',
          },
          eventPopupSettings: {
            size: 'small',
          },
        },
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);

    const partialUpdateReadback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(partialUpdateReadback.tree.stepParams?.calendarSettings?.quickCreatePopupSettings).toMatchObject({
      mode: 'drawer',
      popupTemplateUid: quickCreateTemplateUid,
    });
    expect(partialUpdateReadback.tree.stepParams?.calendarSettings?.eventPopupSettings).toMatchObject({
      size: 'small',
      popupTemplateUid: eventTemplateUid,
    });
    expect(partialUpdateReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid).toBe(quickCreateTemplateUid);
    expect(partialUpdateReadback.tree.subModels?.eventViewAction?.popup?.template?.uid).toBe(eventTemplateUid);
    expect(partialUpdateReadback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      title: 'Quick create override',
    });
    expect(partialUpdateReadback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      title: 'Event view override',
    });
  });

  it('should rebuild calendar hidden popup targets when the block resource changes', async () => {
    const sourceCollectionName = `calendar_resource_popup_source_${uid()}`;
    const targetCollectionName = `calendar_resource_popup_target_${uid()}`;
    await createCalendarTestCollection(sourceCollectionName);
    await createCalendarTestCollection(targetCollectionName);

    const page = await createPage(rootAgent, {
      title: 'Calendar resource popup page',
      tabTitle: 'Calendar resource popup tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: sourceCollectionName,
      },
    });
    const initialReadback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    const quickCreateTemplateUid = initialReadback.tree.subModels?.quickCreateAction?.popup?.template?.uid;
    const eventTemplateUid = initialReadback.tree.subModels?.eventViewAction?.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(eventTemplateUid).toBeTruthy();

    await patchCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      ...(initialReadback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView || {}),
      mode: 'dialog',
      size: 'large',
      title: 'Quick create resource override',
    });
    await patchCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      ...(initialReadback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView || {}),
      mode: 'dialog',
      size: 'large',
      title: 'Event resource override',
    });

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: calendar.uid,
        },
        changes: {
          resource: {
            dataSourceKey: 'main',
            collectionName: targetCollectionName,
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    const quickCreateOpenView = readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView;
    const eventOpenView = readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView;
    expect(quickCreateOpenView).toMatchObject({
      collectionName: targetCollectionName,
      dataSourceKey: 'main',
      mode: 'dialog',
      size: 'large',
      title: 'Quick create resource override',
    });
    expect(eventOpenView).toMatchObject({
      collectionName: targetCollectionName,
      dataSourceKey: 'main',
      mode: 'dialog',
      size: 'large',
      title: 'Event resource override',
    });
    expect(quickCreateOpenView?.popupTemplateUid).not.toBe(quickCreateTemplateUid);
    expect(eventOpenView?.popupTemplateUid).not.toBe(eventTemplateUid);
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template?.uid).not.toBe(quickCreateTemplateUid);
    expect(readback.tree.subModels?.eventViewAction?.popup?.template?.uid).not.toBe(eventTemplateUid);
  });

  it('should let explicit calendar block height settings override the full-height creation default', async () => {
    const page = await createPage(rootAgent, {
      title: 'Calendar explicit height page',
      tabTitle: 'Calendar explicit height tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
      settings: {
        height: 420,
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });

    expect(readback.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'specifyValue',
      height: 420,
    });
  });

  it('should auto-bind compatible popup templates for default calendar hidden popup hosts', async () => {
    const collectionName = `calendar_popup_template_auto_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    await expectTemplateUsage(rootAgent, quickCreateTemplate.uid, 0);
    await expectTemplateUsage(rootAgent, eventViewTemplate.uid, 0);

    const page = await createPage(rootAgent, {
      title: 'Calendar popup template auto-bind page',
      tabTitle: 'Calendar popup template auto-bind tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toMatchObject({
      uid: quickCreateTemplate.uid,
      mode: 'reference',
    });
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toMatchObject({
      uid: eventViewTemplate.uid,
      mode: 'reference',
    });
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      collectionName,
    });
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      collectionName,
    });
    expect(await flowRepo.findModelById(`${calendar.uid}-quickCreateAction`, { includeAsyncNode: true })).toMatchObject(
      {
        stepParams: {
          popupSettings: {
            openView: {
              popupTemplateUid: quickCreateTemplate.uid,
            },
          },
        },
      },
    );
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', quickCreateTemplate.uid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', eventViewTemplate.uid);
  });

  it('should canonicalize compose calendar hidden popup settings into stepParams before binding templates', async () => {
    const collectionName = `calendar_compose_popup_canonical_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar compose popup canonical page',
      tabTitle: 'Calendar compose popup canonical tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'usersCalendar',
            type: 'calendar',
            resource: {
              dataSourceKey: 'main',
              collectionName,
            },
            settings: {
              titleField: 'title',
              startField: 'startsAt',
              quickCreatePopupSettings: {
                mode: 'dialog',
                size: 'large',
                tryTemplate: true,
              },
              eventPopupSettings: {
                mode: 'drawer',
                size: 'small',
                tryTemplate: true,
              },
            },
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);
    const calendarBlock = getData(composeRes)?.blocks?.[0];
    const calendarUid = calendarBlock?.uid;
    expect(calendarUid).toBeTruthy();
    expect(calendarBlock?.actions?.map((item: any) => item.type)).toEqual([
      'filter',
      'turnPages',
      'selectView',
      'refresh',
      'addNew',
    ]);

    const readback = await getSurface(rootAgent, {
      uid: calendarUid,
    });
    expect(readback.tree.props).not.toHaveProperty('quickCreatePopupSettings');
    expect(readback.tree.props).not.toHaveProperty('eventPopupSettings');
    expect(readback.tree.stepParams?.calendarSettings?.quickCreatePopupSettings).toMatchObject({
      mode: 'dialog',
      size: 'large',
    });
    expect(readback.tree.stepParams?.calendarSettings?.eventPopupSettings).toMatchObject({
      mode: 'drawer',
      size: 'small',
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toMatchObject({
      uid: quickCreateTemplate.uid,
      mode: 'reference',
    });
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toMatchObject({
      uid: eventViewTemplate.uid,
      mode: 'reference',
    });
    await expectCalendarPopupTemplateBinding(calendarUid, 'quickCreateAction', quickCreateTemplate.uid);
    await expectCalendarPopupTemplateBinding(calendarUid, 'eventViewAction', eventViewTemplate.uid);
  });

  it('should not bind record-scoped popup templates to calendar quick-create hosts', async () => {
    const collectionName = `calendar_record_scoped_guard_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar record-scoped quick-create template guard page',
      tabTitle: 'Calendar record-scoped quick-create template guard tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    const recordAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'recordScopedCalendarPopupDetails',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['title'],
              },
            ],
          },
        },
      }),
    );
    const recordScopedTemplate = await saveTemplate(rootAgent, {
      target: {
        uid: recordAction.uid,
      },
      name: `Calendar record-scoped popup template ${uid()}`,
      description: 'Record-scoped popup template that quick-create must not reuse.',
      saveMode: 'duplicate',
    });

    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });

    const generatedQuickCreateTemplateUid = readback.tree.subModels?.quickCreateAction?.popup?.template?.uid;
    expect(generatedQuickCreateTemplateUid).toBeTruthy();
    expect(generatedQuickCreateTemplateUid).not.toBe(recordScopedTemplate.uid);
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      collectionName,
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      popupTemplateUid: generatedQuickCreateTemplateUid,
      collectionName,
    });
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toMatchObject({
      uid: recordScopedTemplate.uid,
      mode: 'reference',
    });
    const { popupBlock } = await readPrimaryPopupBlock(`${calendar.uid}-quickCreateAction`);
    expect(popupBlock?.use).toBe('CreateFormModel');
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', generatedQuickCreateTemplateUid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', recordScopedTemplate.uid);
  });

  it('should auto-complete and save calendar hidden popup templates when no compatible template exists', async () => {
    const collectionName = `calendar_popup_template_generate_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar popup template auto-generate page',
      tabTitle: 'Calendar popup template auto-generate tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      settings: {
        quickCreatePopup: {
          mode: 'dialog',
          size: 'large',
        },
        eventPopup: {
          mode: 'drawer',
          size: 'small',
        },
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    const quickCreateTemplateUid = readback.tree.subModels?.quickCreateAction?.popup?.template?.uid;
    const eventViewTemplateUid = readback.tree.subModels?.eventViewAction?.popup?.template?.uid;
    expect(quickCreateTemplateUid).toBeTruthy();
    expect(eventViewTemplateUid).toBeTruthy();
    expect(quickCreateTemplateUid).not.toBe(eventViewTemplateUid);
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      collectionName,
    });
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'small',
      collectionName,
    });
    const quickCreatePopup = await readPrimaryPopupBlock(`${calendar.uid}-quickCreateAction`);
    const eventViewPopup = await readPrimaryPopupBlock(`${calendar.uid}-eventViewAction`);
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      mode: 'dialog',
      size: 'large',
      uid: quickCreatePopup.popupSurface.tree.uid,
      popupTemplateUid: quickCreateTemplateUid,
      collectionName,
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      mode: 'drawer',
      size: 'small',
      uid: eventViewPopup.popupSurface.tree.uid,
      popupTemplateUid: eventViewTemplateUid,
      collectionName,
    });

    expect(quickCreatePopup.popupBlock?.use).toBe('CreateFormModel');
    expect(eventViewPopup.popupBlock?.use).toBe('DetailsBlockModel');
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', quickCreateTemplateUid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', eventViewTemplateUid);
  });

  it('should auto-bind calendar popup templates while preserving display popup settings', async () => {
    const collectionName = `calendar_explicit_popup_guard_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar explicit popup settings template guard page',
      tabTitle: 'Calendar explicit popup settings template guard tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      settings: {
        quickCreatePopup: {
          mode: 'dialog',
          size: 'large',
        },
        eventPopup: {
          mode: 'drawer',
          size: 'small',
        },
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toMatchObject({
      uid: quickCreateTemplate.uid,
      mode: 'reference',
    });
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toMatchObject({
      uid: eventViewTemplate.uid,
      mode: 'reference',
    });
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
    });
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'small',
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      popupTemplateUid: quickCreateTemplate.uid,
      mode: 'dialog',
      size: 'large',
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      popupTemplateUid: eventViewTemplate.uid,
      mode: 'drawer',
      size: 'small',
    });
    const persistedCalendar = await flowRepo.findModelById(calendar.uid, { includeAsyncNode: true });
    expect(persistedCalendar?.stepParams?.calendarSettings?.quickCreatePopupSettings).toMatchObject({
      popupTemplateUid: quickCreateTemplate.uid,
      mode: 'dialog',
      size: 'large',
    });
    expect(persistedCalendar?.stepParams?.calendarSettings?.eventPopupSettings).toMatchObject({
      popupTemplateUid: eventViewTemplate.uid,
      mode: 'drawer',
      size: 'small',
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', quickCreateTemplate.uid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', eventViewTemplate.uid);
  });

  it('should auto-bind applyBlueprint calendar popup templates while preserving display popup settings', async () => {
    const collectionName = `calendar_blueprint_explicit_popup_guard_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        page: {
          title: 'Calendar explicit popup blueprint page',
        },
        tabs: [
          {
            title: 'Calendar',
            blocks: [
              {
                key: 'eventsCalendar',
                type: 'calendar',
                collection: collectionName,
                settings: {
                  quickCreatePopup: {
                    mode: 'dialog',
                    size: 'large',
                  },
                  eventPopup: {
                    mode: 'drawer',
                    size: 'small',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const calendar = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CalendarBlockModel')[0];
    expect(calendar).toBeTruthy();
    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    const calendarBlock = readback.tree;
    expect(calendarBlock?.subModels?.quickCreateAction?.popup?.template).toMatchObject({
      uid: quickCreateTemplate.uid,
      mode: 'reference',
    });
    expect(calendarBlock?.subModels?.eventViewAction?.popup?.template).toMatchObject({
      uid: eventViewTemplate.uid,
      mode: 'reference',
    });
    expect(calendarBlock?.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
    });
    expect(calendarBlock?.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'small',
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      popupTemplateUid: quickCreateTemplate.uid,
      mode: 'dialog',
      size: 'large',
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      popupTemplateUid: eventViewTemplate.uid,
      mode: 'drawer',
      size: 'small',
    });
    const persistedCalendar = await flowRepo.findModelById(calendar.uid, { includeAsyncNode: true });
    expect(persistedCalendar?.stepParams?.calendarSettings?.quickCreatePopupSettings).toMatchObject({
      popupTemplateUid: quickCreateTemplate.uid,
      mode: 'dialog',
      size: 'large',
    });
    expect(persistedCalendar?.stepParams?.calendarSettings?.eventPopupSettings).toMatchObject({
      popupTemplateUid: eventViewTemplate.uid,
      mode: 'drawer',
      size: 'small',
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', quickCreateTemplate.uid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', eventViewTemplate.uid);
  });

  it('should honor calendar popup tryTemplate false as an auto-bind opt-out', async () => {
    const collectionName = `calendar_try_template_false_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar popup tryTemplate false page',
      tabTitle: 'Calendar popup tryTemplate false tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      settings: {
        quickCreatePopup: {
          tryTemplate: false,
        },
        eventPopup: {
          tryTemplate: false,
        },
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: `${calendar.uid}-quickCreateAction`,
      collectionName,
    });
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: `${calendar.uid}-eventViewAction`,
      collectionName,
    });
    expect(
      readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView?.tryTemplate,
    ).toBeUndefined();
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView?.tryTemplate).toBeUndefined();
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction');
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction');
  });

  it('should normalize explicit calendar popup template settings into persisted template references', async () => {
    const collectionName = `calendar_explicit_popup_template_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar explicit popup template page',
      tabTitle: 'Calendar explicit popup template tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      settings: {
        quickCreatePopup: {
          template: {
            uid: quickCreateTemplate.uid,
            mode: 'reference',
          },
          mode: 'dialog',
          size: 'large',
        },
        eventPopup: {
          template: {
            uid: eventViewTemplate.uid,
            mode: 'reference',
          },
          mode: 'drawer',
          size: 'small',
        },
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toMatchObject({
      uid: quickCreateTemplate.uid,
      mode: 'reference',
    });
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toMatchObject({
      uid: eventViewTemplate.uid,
      mode: 'reference',
    });
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
    });
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'small',
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      popupTemplateUid: quickCreateTemplate.uid,
      mode: 'dialog',
      size: 'large',
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      popupTemplateUid: eventViewTemplate.uid,
      mode: 'drawer',
      size: 'small',
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', quickCreateTemplate.uid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', eventViewTemplate.uid);
  });

  it('should preserve explicit calendar popup copied template targets without repeated duplication', async () => {
    const collectionName = `calendar_explicit_popup_template_copy_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar explicit popup template copy page',
      tabTitle: 'Calendar explicit popup template copy tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      settings: {
        quickCreatePopup: {
          template: {
            uid: quickCreateTemplate.uid,
            mode: 'copy',
          },
          mode: 'dialog',
          size: 'large',
        },
        eventPopup: {
          template: {
            uid: eventViewTemplate.uid,
            mode: 'copy',
          },
          mode: 'drawer',
          size: 'small',
        },
      },
    });

    const initialQuickCreateAction = await flowRepo.findModelById(`${calendar.uid}-quickCreateAction`, {
      includeAsyncNode: true,
    });
    const initialEventViewAction = await flowRepo.findModelById(`${calendar.uid}-eventViewAction`, {
      includeAsyncNode: true,
    });
    const initialQuickCreateOpenView = initialQuickCreateAction?.stepParams?.popupSettings?.openView;
    const initialEventViewOpenView = initialEventViewAction?.stepParams?.popupSettings?.openView;
    expect(initialQuickCreateOpenView).toMatchObject({
      popupTemplateUid: quickCreateTemplate.uid,
      popupTemplateMode: 'copy',
      popupTemplateContext: true,
      mode: 'dialog',
      size: 'large',
    });
    expect(initialEventViewOpenView).toMatchObject({
      popupTemplateUid: eventViewTemplate.uid,
      popupTemplateMode: 'copy',
      popupTemplateContext: true,
      mode: 'drawer',
      size: 'small',
    });
    expect(initialQuickCreateOpenView?.uid).toBeTruthy();
    expect(initialQuickCreateOpenView?.uid).not.toBe(`${calendar.uid}-quickCreateAction`);
    expect(initialEventViewOpenView?.uid).toBeTruthy();
    expect(initialEventViewOpenView?.uid).not.toBe(`${calendar.uid}-eventViewAction`);

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup).toMatchObject({
      mode: 'copy',
    });
    expect(readback.tree.subModels?.eventViewAction?.popup).toMatchObject({
      mode: 'copy',
    });

    await expectPersistedCalendarPopupOpenView(calendar.uid, 'quickCreateAction', {
      uid: initialQuickCreateOpenView.uid,
      popupTemplateUid: quickCreateTemplate.uid,
      popupTemplateMode: 'copy',
      popupTemplateContext: true,
      mode: 'dialog',
      size: 'large',
    });
    await expectPersistedCalendarPopupOpenView(calendar.uid, 'eventViewAction', {
      uid: initialEventViewOpenView.uid,
      popupTemplateUid: eventViewTemplate.uid,
      popupTemplateMode: 'copy',
      popupTemplateContext: true,
      mode: 'drawer',
      size: 'small',
    });
  });

  it('should validate initial calendar popup settings on addBlock', async () => {
    const collectionName = `calendar_invalid_initial_popup_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar invalid initial popup page',
      tabTitle: 'Calendar invalid initial popup tab',
    });

    const missingTargetRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'calendar',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName,
        },
        settings: {
          quickCreatePopup: {
            uid: `missing-calendar-popup-target-${uid()}`,
          },
        },
      },
    });
    expect(missingTargetRes.status).toBe(400);
    expect(readErrorMessage(missingTargetRes)).toContain('openView.uid must reference an existing node');

    const invalidModeRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'calendar',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName,
        },
        settings: {
          quickCreatePopup: {
            tryTemplate: false,
            mode: 'sidecar',
          },
        },
      },
    });
    expect(invalidModeRes.status).toBe(400);
    expect(readErrorMessage(invalidModeRes)).toContain("openView.mode only supports 'drawer', 'dialog' or 'embed'");
  });

  it('should clear existing calendar popup template usage when configure opts out with tryTemplate false', async () => {
    const collectionName = `calendar_config_try_template_false_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar configure tryTemplate false page',
      tabTitle: 'Calendar configure tryTemplate false tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', quickCreateTemplate.uid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', eventViewTemplate.uid);

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: calendar.uid,
        },
        changes: {
          quickCreatePopup: {
            tryTemplate: false,
          },
          eventPopup: {
            tryTemplate: false,
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: `${calendar.uid}-quickCreateAction`,
      collectionName,
    });
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: `${calendar.uid}-eventViewAction`,
      collectionName,
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction');
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction');
  });

  it('should clear existing calendar popup template usage when configure points to external targets', async () => {
    const collectionName = `calendar_config_external_popup_${uid()}`;
    await createCalendarTestCollection(collectionName);
    const quickCreateTemplate = await createCalendarPopupTemplate('addNew', collectionName);
    const eventViewTemplate = await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar configure external popup page',
      tabTitle: 'Calendar configure external popup tab',
    });
    const { quickCreateTargetUid, eventTargetUid } = await createExternalCalendarPopupTargets(collectionName);
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction', quickCreateTemplate.uid);
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction', eventViewTemplate.uid);

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: calendar.uid,
        },
        changes: {
          quickCreatePopup: {
            uid: quickCreateTargetUid,
            mode: 'dialog',
          },
          eventPopup: {
            uid: eventTargetUid,
            mode: 'drawer',
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: quickCreateTargetUid,
      mode: 'dialog',
    });
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: eventTargetUid,
      mode: 'drawer',
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction');
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction');
  });

  it('should preserve external calendar popup target uids instead of auto-binding popup templates', async () => {
    const collectionName = `calendar_external_popup_target_${uid()}`;
    await createCalendarTestCollection(collectionName);
    await createCalendarPopupTemplate('addNew', collectionName);
    await createCalendarPopupTemplate('view', collectionName);
    const page = await createPage(rootAgent, {
      title: 'Calendar external popup target page',
      tabTitle: 'Calendar external popup target tab',
    });
    const { quickCreateTargetUid, eventTargetUid } = await createExternalCalendarPopupTargets(collectionName);
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      settings: {
        quickCreatePopup: {
          uid: quickCreateTargetUid,
          mode: 'dialog',
        },
        eventPopup: {
          uid: eventTargetUid,
          mode: 'drawer',
        },
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(readback.tree.subModels?.quickCreateAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.eventViewAction?.popup?.template).toBeUndefined();
    expect(readback.tree.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: quickCreateTargetUid,
      mode: 'dialog',
    });
    expect(readback.tree.subModels?.eventViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      uid: eventTargetUid,
      mode: 'drawer',
    });
    await expectCalendarPopupTemplateBinding(calendar.uid, 'quickCreateAction');
    await expectCalendarPopupTemplateBinding(calendar.uid, 'eventViewAction');
  });

  it('should create configure and batch-add flow-model tree blocks', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tree block contract page',
      tabTitle: 'Tree block contract tab',
    });

    const tree = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'categories',
      },
    });
    const treeReadback = await getSurface(rootAgent, {
      uid: tree.uid,
    });
    expect(treeReadback.tree).toMatchObject({
      use: 'TreeBlockModel',
      props: {
        searchable: true,
        defaultExpandAll: false,
        includeDescendants: true,
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'categories',
          },
        },
      },
    });
    expect(treeReadback.tree.subModels).toBeUndefined();

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          searchable: false,
          defaultExpandAll: true,
          includeDescendants: false,
          titleField: 'title',
          pageSize: 200,
          height: 420,
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);
    const configuredTree = await getSurface(rootAgent, {
      uid: tree.uid,
    });
    expect(configuredTree.tree.props).toMatchObject({
      searchable: false,
      defaultExpandAll: true,
      includeDescendants: false,
      fieldNames: {
        title: 'title',
      },
      pageSize: 200,
    });
    expect(configuredTree.tree.decoratorProps || {}).not.toHaveProperty('height');
    expect(configuredTree.tree.decoratorProps || {}).not.toHaveProperty('heightMode');
    expect(configuredTree.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'specifyValue',
      height: 420,
    });
    expect(configuredTree.tree.stepParams?.treeSettings).toMatchObject({
      searchable: {
        searchable: false,
      },
      defaultExpandAll: {
        defaultExpandAll: true,
      },
      includeDescendants: {
        includeDescendants: false,
      },
      titleField: {
        titleField: 'title',
      },
      pageSize: {
        pageSize: 200,
      },
    });

    const batchPage = await createPage(rootAgent, {
      title: 'Batch tree block page',
      tabTitle: 'Batch tree block tab',
    });
    const batchRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: {
          uid: batchPage.tabSchemaUid,
        },
        blocks: [
          {
            key: 'treeA',
            type: 'tree',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
          },
          {
            key: 'treeB',
            use: 'TreeBlockModel',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'departments',
            },
            settings: {
              searchable: false,
            },
          },
        ],
      },
    });
    expect(batchRes.status).toBe(200);
    const batchData = getData(batchRes);
    expect(batchData.successCount).toBe(2);
    expect(batchData.errorCount).toBe(0);
    expect(batchData.blocks.map((item: any) => item.result?.uid).filter(Boolean)).toHaveLength(2);
  });

  it('should add configure and clear tree connectFields bindings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tree connect contract page',
      tabTitle: 'Tree connect contract tab',
    });
    const employeesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const departmentsTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'departments',
      },
    });

    const tree = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
      settings: {
        connectFields: {
          targets: [{ targetId: employeesTable.uid }],
        },
      },
    });
    const gridAfterAdd = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(gridAfterAdd?.filterManager).toEqual(
      expect.arrayContaining([
        {
          filterId: tree.uid,
          targetId: employeesTable.uid,
          filterPaths: ['id'],
        },
      ]),
    );

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [
              {
                targetId: departmentsTable.uid,
                filterPaths: ['id'],
              },
            ],
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);
    const gridAfterConfigure = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(gridAfterConfigure?.filterManager || []).filter((item: any) => item.filterId === tree.uid),
    ).toEqual([
      {
        filterId: tree.uid,
        targetId: departmentsTable.uid,
        filterPaths: ['id'],
      },
    ]);

    const clearRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [],
          },
        },
      },
    });
    expect(clearRes.status, readErrorMessage(clearRes)).toBe(200);
    const gridAfterClear = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(_.castArray(gridAfterClear?.filterManager || []).some((item: any) => item.filterId === tree.uid)).toBe(
      false,
    );
  });

  it('should validate tree connectFields against the rendered tree key field', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tree connect custom key page',
      tabTitle: 'Tree connect custom key tab',
    });
    const employeesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const tree = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const configureByCustomKey = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          fieldNames: {
            key: 'nickname',
          },
          connectFields: {
            targets: [{ targetId: employeesTable.uid, filterPaths: ['nickname'] }],
          },
        },
      },
    });
    expect(configureByCustomKey.status, readErrorMessage(configureByCustomKey)).toBe(200);
    const gridAfterConfigure = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(gridAfterConfigure?.filterManager || []).filter((item: any) => item.filterId === tree.uid),
    ).toEqual([
      {
        filterId: tree.uid,
        targetId: employeesTable.uid,
        filterPaths: ['nickname'],
      },
    ]);

    const configureByDefaultId = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [{ targetId: employeesTable.uid, filterPaths: ['id'] }],
          },
        },
      },
    });
    expect(configureByDefaultId.status).toBe(400);
    expect(readErrorMessage(configureByDefaultId)).toContain('type-compatible');
    expect(readErrorMessage(configureByDefaultId)).toContain("tree selected key 'nickname'");
  });

  it('should clear stale tree connectFields bindings when tree resource changes without connectFields', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tree connect resource change page',
      tabTitle: 'Tree connect resource change tab',
    });
    const employeesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const tree = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
      settings: {
        connectFields: {
          targets: [{ targetId: employeesTable.uid }],
        },
      },
    });
    const gridBeforeResourceChange = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(gridBeforeResourceChange?.filterManager || []).some((item: any) => item.filterId === tree.uid),
    ).toBe(true);

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          resource: {
            dataSourceKey: 'main',
            collectionName: 'departments',
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);
    const gridAfterResourceChange = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(gridAfterResourceChange?.filterManager || []).some((item: any) => item.filterId === tree.uid),
    ).toBe(false);
  });

  it('should keep tree event flows separate from connectFields persistence', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tree flow registry separation page',
      tabTitle: 'Tree flow registry separation tab',
    });
    const tree = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const eventFlowRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: tree.uid,
        },
        flowRegistry: {
          treeBeforeRender: {
            key: 'treeBeforeRender',
            on: 'beforeRender',
            steps: {},
          },
        },
      },
    });
    expect(eventFlowRes.status, readErrorMessage(eventFlowRes)).toBe(200);

    const rawUpdateConnectFields = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: tree.uid,
        },
        flowRegistry: {
          connectFields: {
            targets: [],
          },
        },
      },
    });
    expect(rawUpdateConnectFields.status).toBe(400);
    expect(readErrorMessage(rawUpdateConnectFields)).toContain('changes.connectFields');

    const rawSetEventConnectFields = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: tree.uid,
        },
        flowRegistry: {
          connectFields: {
            targets: [],
          },
        },
      },
    });
    expect(rawSetEventConnectFields.status).toBe(400);
    expect(readErrorMessage(rawSetEventConnectFields)).toContain('changes.connectFields');
  });

  it('should reject invalid tree connectFields targets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Invalid tree connect page',
      tabTitle: 'Invalid tree connect tab',
    });
    const tree = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const departmentsTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'departments',
      },
    });
    const employeesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const markdown = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'markdown',
      settings: {
        content: 'Unsupported target',
      },
    });

    const crossCollectionMissingPaths = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [{ targetId: departmentsTable.uid }],
          },
        },
      },
    });
    expect(crossCollectionMissingPaths.status).toBe(400);
    expect(readErrorMessage(crossCollectionMissingPaths)).toContain('filterPaths');

    const unsupportedTarget = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [{ targetId: markdown.uid, filterPaths: ['id'] }],
          },
        },
      },
    });
    expect(unsupportedTarget.status).toBe(400);
    expect(readErrorMessage(unsupportedTarget)).toContain('does not support tree connectFields');

    const missingTarget = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [{ targetId: 'missing-target-uid', filterPaths: ['id'] }],
          },
        },
      },
    });
    expect(missingTarget.status).toBe(400);
    expect(readErrorMessage(missingTarget)).toContain('targetId');

    const selfTarget = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [{ targetId: tree.uid, filterPaths: ['id'] }],
          },
        },
      },
    });
    expect(selfTarget.status).toBe(400);
    expect(readErrorMessage(selfTarget)).toContain('cannot be the tree block itself');

    const otherPage = await createPage(rootAgent, {
      title: 'Invalid tree connect other page',
      tabTitle: 'Invalid tree connect other tab',
    });
    const otherPageTable = await addBlockData(rootAgent, {
      target: {
        uid: otherPage.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const crossGridTarget = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [{ targetId: otherPageTable.uid, filterPaths: ['id'] }],
          },
        },
      },
    });
    expect(crossGridTarget.status).toBe(400);
    expect(readErrorMessage(crossGridTarget)).toContain('same block grid');

    const duplicateTarget = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [{ targetId: employeesTable.uid }, { targetBlockUid: employeesTable.uid, filterPaths: ['id'] }],
          },
        },
      },
    });
    expect(duplicateTarget.status).toBe(400);
    expect(readErrorMessage(duplicateTarget)).toContain('duplicate targetId');

    const typeMismatchTarget = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tree.uid,
        },
        changes: {
          connectFields: {
            targets: [{ targetId: employeesTable.uid, filterPaths: ['nickname'] }],
          },
        },
      },
    });
    expect(typeMismatchTarget.status).toBe(400);
    expect(readErrorMessage(typeMismatchTarget)).toContain('type-compatible');
  });

  it('should clean tree connectFields bindings when removing tree or target blocks', async () => {
    const treeRemovalPage = await createPage(rootAgent, {
      title: 'Tree connect remove tree page',
      tabTitle: 'Tree connect remove tree tab',
    });
    const treeRemovalTable = await addBlockData(rootAgent, {
      target: {
        uid: treeRemovalPage.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const removableTree = await addBlockData(rootAgent, {
      target: {
        uid: treeRemovalPage.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
      settings: {
        connectFields: {
          targets: [{ targetId: treeRemovalTable.uid }],
        },
      },
    });
    const gridBeforeTreeRemoval = await flowRepo.findModelById(treeRemovalPage.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(gridBeforeTreeRemoval?.filterManager || []).some((item: any) => item.filterId === removableTree.uid),
    ).toBe(true);

    const removeTreeRes = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: {
          uid: removableTree.uid,
        },
      },
    });
    expect(removeTreeRes.status, readErrorMessage(removeTreeRes)).toBe(200);
    const gridAfterTreeRemoval = await flowRepo.findModelById(treeRemovalPage.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(gridAfterTreeRemoval?.filterManager || []).some((item: any) => item.filterId === removableTree.uid),
    ).toBe(false);

    const targetRemovalPage = await createPage(rootAgent, {
      title: 'Tree connect remove target page',
      tabTitle: 'Tree connect remove target tab',
    });
    const targetRemovalTable = await addBlockData(rootAgent, {
      target: {
        uid: targetRemovalPage.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const targetRemovalTree = await addBlockData(rootAgent, {
      target: {
        uid: targetRemovalPage.tabSchemaUid,
      },
      type: 'tree',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
      settings: {
        connectFields: {
          targets: [{ targetId: targetRemovalTable.uid }],
        },
      },
    });
    const gridBeforeTargetRemoval = await flowRepo.findModelById(targetRemovalPage.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(gridBeforeTargetRemoval?.filterManager || []).some(
        (item: any) => item.filterId === targetRemovalTree.uid && item.targetId === targetRemovalTable.uid,
      ),
    ).toBe(true);

    const removeTargetRes = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: {
          uid: targetRemovalTable.uid,
        },
      },
    });
    expect(removeTargetRes.status, readErrorMessage(removeTargetRes)).toBe(200);
    const gridAfterTargetRemoval = await flowRepo.findModelById(targetRemovalPage.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(gridAfterTargetRemoval?.filterManager || []).some(
        (item: any) => item.targetId === targetRemovalTable.uid,
      ),
    ).toBe(false);
  });

  it('should project missing calendar popup hosts during readback without persisting them', async () => {
    const page = await createPage(rootAgent, {
      title: 'Calendar read projection page',
      tabTitle: 'Calendar read projection tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
    });

    const quickCreateActionUid = `${calendar.uid}-quickCreateAction`;
    const eventViewActionUid = `${calendar.uid}-eventViewAction`;
    await flowRepo.remove(quickCreateActionUid);
    await flowRepo.remove(eventViewActionUid);
    expect(await flowRepo.findModelById(quickCreateActionUid, { includeAsyncNode: true })).toBeNull();
    expect(await flowRepo.findModelById(eventViewActionUid, { includeAsyncNode: true })).toBeNull();

    const calendarReadback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    expect(calendarReadback.tree.subModels?.quickCreateAction).toMatchObject({
      uid: quickCreateActionUid,
      use: 'CalendarQuickCreateActionModel',
    });
    expect(calendarReadback.tree.subModels?.eventViewAction).toMatchObject({
      uid: eventViewActionUid,
      use: 'CalendarEventViewActionModel',
    });
    expect(await flowRepo.findModelById(quickCreateActionUid, { includeAsyncNode: true })).toBeNull();
    expect(await flowRepo.findModelById(eventViewActionUid, { includeAsyncNode: true })).toBeNull();
  });

  it('should honor server-registered calendar title field interfaces when validating flow-model calendar bindings', async () => {
    const calendarPlugin: any = app.pm.get('calendar');
    const previousGetTitleFieldInterfaces = calendarPlugin?.getTitleFieldInterfaces;
    const previousTitleFieldInterfaces = calendarPlugin?.titleFieldInterfaces;

    try {
      calendarPlugin.getTitleFieldInterfaces = () => ['input', 'select', 'phone', 'email', 'radioGroup', 'sequence'];

      const sequenceCollectionName = `calendar_sequence_events_${uid()}`;
      await rootAgent.resource('collections').create({
        values: {
          name: sequenceCollectionName,
          title: 'Calendar sequence events',
          createdAt: false,
          updatedAt: false,
          timestamps: false,
          fields: [
            {
              name: 'eventCode',
              type: 'string',
              interface: 'sequence',
            },
            {
              name: 'startsAt',
              type: 'date',
              interface: 'datetime',
            },
          ],
        },
      });

      const page = await createPage(rootAgent, {
        title: 'Calendar sequence page',
        tabTitle: 'Calendar sequence tab',
      });
      const calendar = await addBlockData(rootAgent, {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'calendar',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: sequenceCollectionName,
        },
      });

      const configureRes = await rootAgent.resource('flowSurfaces').configure({
        values: {
          target: {
            uid: calendar.uid,
          },
          changes: {
            titleField: 'eventCode',
          },
        },
      });
      expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

      const calendarReadback = await getSurface(rootAgent, {
        uid: calendar.uid,
      });
      expect(calendarReadback.tree.props?.fieldNames?.title).toBe('eventCode');
    } finally {
      if (typeof previousGetTitleFieldInterfaces === 'function') {
        calendarPlugin.getTitleFieldInterfaces = previousGetTitleFieldInterfaces;
      } else {
        delete calendarPlugin.getTitleFieldInterfaces;
      }
      if (typeof previousTitleFieldInterfaces !== 'undefined') {
        calendarPlugin.titleFieldInterfaces = previousTitleFieldInterfaces;
      } else {
        delete calendarPlugin.titleFieldInterfaces;
      }
    }
  });

  it('should support calendar actions and reject unsupported table-only actions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Calendar action page',
      tabTitle: 'Calendar action tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
    });

    for (const actionType of ['today', 'turnPages', 'title', 'selectView', 'refresh', 'js', 'triggerWorkflow']) {
      const response = await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: calendar.uid,
          },
          type: actionType,
        },
      });
      expect(response.status, `${actionType}: ${readErrorMessage(response)}`).toBe(200);
    }

    const invalidTableOnlyAction = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: calendar.uid,
        },
        type: 'bulkDelete',
      },
    });
    expect(invalidTableOnlyAction.status).toBe(400);
    expect(readErrorMessage(invalidTableOnlyAction)).toContain(
      `flowSurfaces addAction 'bulkDelete' is not allowed under 'CalendarBlockModel'`,
    );

    const readback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    const actionUses = _.castArray(readback.tree.subModels?.actions || []).map((item: any) => item.use);
    expect(actionUses).toEqual(
      expect.arrayContaining([
        'CalendarTodayActionModel',
        'CalendarNavActionModel',
        'CalendarTitleActionModel',
        'CalendarViewSelectActionModel',
        'RefreshActionModel',
        'JSCollectionActionModel',
        'CollectionTriggerWorkflowActionModel',
      ]),
    );
    expect(actionUses).not.toEqual(expect.arrayContaining(['BulkDeleteActionModel', 'ImportActionModel']));
  });

  it('should reject direct calendar main block fields fieldGroups and recordActions in compose', async () => {
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
      const page = await createPage(rootAgent, {
        title: `Invalid calendar compose ${item.key}`,
        tabTitle: `Invalid calendar compose ${item.key}`,
      });
      const composeRes = await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'calendar',
              type: 'calendar',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'calendar_events',
              },
              ...item.payload,
            },
          ],
        },
      });
      expect(composeRes.status).toBe(400);
      expect(readErrorMessage(composeRes)).toContain(item.message);
    }
  });

  it('should build event fields under calendar hidden quick-create and event-view popup hosts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Calendar popup host page',
      tabTitle: 'Calendar popup host tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
      settings: {
        quickCreatePopup: {
          tryTemplate: false,
        },
        eventPopup: {
          tryTemplate: false,
        },
      },
    });

    const quickCreateForm = await addBlockData(rootAgent, {
      target: {
        uid: `${calendar.uid}-quickCreateAction`,
      },
      type: 'createForm',
      resource: {
        binding: 'currentCollection',
      },
      fields: ['title', 'status', 'category'],
    });
    await addBlockData(rootAgent, {
      target: {
        uid: `${calendar.uid}-eventViewAction`,
      },
      type: 'details',
      resource: {
        binding: 'currentRecord',
      },
      fields: ['title', 'status', 'category'],
    });
    const quickTitleField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: quickCreateForm.uid,
          },
          fieldPath: 'title',
        },
      }),
    );
    expect(quickTitleField.uid).toBeTruthy();

    const calendarReadback = await getSurface(rootAgent, {
      uid: calendar.uid,
    });
    const quickCreateBlock =
      calendarReadback.tree.subModels?.quickCreateAction?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid
        ?.subModels?.items?.[0];
    const eventViewBlock =
      calendarReadback.tree.subModels?.eventViewAction?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid
        ?.subModels?.items?.[0];
    expect(quickCreateBlock).toMatchObject({
      use: 'CreateFormModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar_events',
          },
        },
      },
    });
    expect(eventViewBlock).toMatchObject({
      use: 'DetailsBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'calendar_events',
            filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
          },
        },
      },
    });
  });

  it('should backfill persisted calendar popup hosts before writing to legacy missing host uids', async () => {
    const page = await createPage(rootAgent, {
      title: 'Calendar popup host backfill page',
      tabTitle: 'Calendar popup host backfill tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
      settings: {
        quickCreatePopup: {
          tryTemplate: false,
        },
        eventPopup: {
          tryTemplate: false,
        },
      },
    });
    const quickCreateActionUid = `${calendar.uid}-quickCreateAction`;
    const eventViewActionUid = `${calendar.uid}-eventViewAction`;
    await flowRepo.remove(quickCreateActionUid);
    await flowRepo.remove(eventViewActionUid);
    expect(await flowRepo.findModelById(quickCreateActionUid, { includeAsyncNode: true })).toBeNull();
    expect(await flowRepo.findModelById(eventViewActionUid, { includeAsyncNode: true })).toBeNull();

    const quickCreateForm = await addBlockData(rootAgent, {
      target: {
        uid: quickCreateActionUid,
      },
      type: 'createForm',
      resource: {
        binding: 'currentCollection',
      },
      fields: ['title'],
    });
    expect(quickCreateForm.uid).toBeTruthy();

    const quickCreateAction = await flowRepo.findModelById(quickCreateActionUid, { includeAsyncNode: true });
    const eventViewAction = await flowRepo.findModelById(eventViewActionUid, { includeAsyncNode: true });
    expect(quickCreateAction).toMatchObject({
      uid: quickCreateActionUid,
      use: 'CalendarQuickCreateActionModel',
    });
    expect(eventViewAction).toMatchObject({
      uid: eventViewActionUid,
      use: 'CalendarEventViewActionModel',
    });
    const quickCreateBlock = _.castArray(
      quickCreateAction?.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(quickCreateBlock).toMatchObject({
      uid: quickCreateForm.uid,
      use: 'CreateFormModel',
    });
  });

  it('should recursively backfill persisted calendar popup hosts in nested calendar popup trees', async () => {
    const page = await createPage(rootAgent, {
      title: 'Nested calendar popup host backfill page',
      tabTitle: 'Nested calendar popup host backfill tab',
    });
    const outerCalendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
    });
    const nestedCalendar = await addBlockData(rootAgent, {
      target: {
        uid: `${outerCalendar.uid}-quickCreateAction`,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
    });
    const nestedQuickCreateActionUid = `${nestedCalendar.uid}-quickCreateAction`;
    const nestedEventViewActionUid = `${nestedCalendar.uid}-eventViewAction`;
    await flowRepo.remove(nestedQuickCreateActionUid);
    await flowRepo.remove(nestedEventViewActionUid);
    expect(await flowRepo.findModelById(nestedQuickCreateActionUid, { includeAsyncNode: true })).toBeNull();
    expect(await flowRepo.findModelById(nestedEventViewActionUid, { includeAsyncNode: true })).toBeNull();

    await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'markdown',
      settings: {
        content: 'Trigger a page-tree write preflight.',
      },
    });

    expect(await flowRepo.findModelById(nestedQuickCreateActionUid, { includeAsyncNode: true })).toMatchObject({
      uid: nestedQuickCreateActionUid,
      use: 'CalendarQuickCreateActionModel',
    });
    expect(await flowRepo.findModelById(nestedEventViewActionUid, { includeAsyncNode: true })).toMatchObject({
      uid: nestedEventViewActionUid,
      use: 'CalendarEventViewActionModel',
    });
  });

  it('should allow filter forms to target calendar blocks', async () => {
    const page = await createPage(rootAgent, {
      title: 'Calendar filter target page',
      tabTitle: 'Calendar filter target tab',
    });
    const calendar = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'calendar_events',
      },
    });
    const filterForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'filterForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: '',
      },
      fields: [
        {
          fieldPath: 'title',
          defaultTargetUid: calendar.uid,
        },
      ],
    });
    const filterField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: filterForm.uid,
          },
          fieldPath: 'title',
          collectionName: 'calendar_events',
          defaultTargetUid: calendar.uid,
        },
      }),
    );
    expect(filterField.uid).toBeTruthy();

    const readback = await getSurface(rootAgent, {
      uid: filterForm.uid,
    });
    const firstFilterItem = readback.tree.subModels?.grid?.subModels?.items?.[0];
    expect(firstFilterItem?.stepParams?.filterFormItemSettings?.init).toMatchObject({
      defaultTargetUid: calendar.uid,
      filterField: {
        name: 'title',
      },
    });
  });

  it('should only expose addChild in target-specific catalog when a table uses a tree collection with treeTable enabled', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tree table catalog contract page',
      tabTitle: 'Tree table catalog contract tab',
    });
    const employeesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const categoriesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'categories',
      },
    });

    const employeesCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: employeesTable.uid,
          },
        },
      }),
    );
    expect(employeesCatalog.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();

    const categoriesCatalogBeforeEnable = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: categoriesTable.uid,
          },
        },
      }),
    );
    expect(categoriesCatalogBeforeEnable.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: categoriesTable.uid,
            },
            changes: {
              treeTable: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    const categoriesCatalogAfterEnable = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: categoriesTable.uid,
          },
        },
      }),
    );
    expect(categoriesCatalogAfterEnable.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['addChild', 'edit', 'delete']),
    );
    expect(categoriesCatalogAfterEnable.recordActions.find((item: any) => item.key === 'view')).toBeUndefined();

    const categoriesTableReadback = await getSurface(rootAgent, {
      uid: categoriesTable.uid,
    });
    const actionsColumn = readTableColumns(categoriesTableReadback.tree).find(
      (column: any) => column?.use === 'TableActionsColumnModel',
    );
    expect(actionsColumn?.uid).toBeTruthy();

    const categoriesActionsColumnCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: actionsColumn.uid,
          },
        },
      }),
    );
    expect(categoriesActionsColumnCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['addChild', 'edit', 'delete']),
    );
    expect(categoriesActionsColumnCatalog.recordActions.find((item: any) => item.key === 'view')).toBeUndefined();
  });

  it('should expose popup block resourceBindings and reject invalid popup record block bindings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup catalog contract page',
      tabTitle: 'Popup catalog contract tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const plainPopup = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'popup',
        },
      }),
    );
    const plainPopupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: plainPopup.uid,
          },
        },
      }),
    );
    expect(plainPopupCatalog.blocks.find((item: any) => item.use === 'CreateFormModel')?.resourceBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'currentCollection' }),
        expect.objectContaining({ key: 'otherRecords' }),
      ]),
    );
    expect(plainPopupCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')).toBeUndefined();

    const recordPopup = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'view',
        },
      }),
    );
    const recordPopupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: recordPopup.uid,
          },
        },
      }),
    );
    const recordPopupDetailsBindings =
      recordPopupCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')?.resourceBindings || [];
    expect(recordPopupDetailsBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['currentRecord', 'otherRecords']),
    );
    expect(recordPopupDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection', 'associatedRecords']),
    );

    const recordScopedPopup = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'popup',
        },
      }),
    );
    const recordScopedPopupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: recordScopedPopup.uid,
          },
        },
      }),
    );
    const recordScopedPopupDetailsBindings =
      recordScopedPopupCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')?.resourceBindings || [];
    expect(recordScopedPopupDetailsBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['currentRecord', 'otherRecords']),
    );
    expect(recordScopedPopupDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection', 'associatedRecords']),
    );

    const invalidRaw = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: recordPopup.uid,
        },
        type: 'details',
        resource: {
          binding: 'currentCollection',
        },
        fields: ['username', 'nickname', 'email'],
      },
    });
    expect(invalidRaw.status).toBe(400);
    expect(readErrorMessage(invalidRaw)).toContain(`resource.binding='currentCollection'`);
    expect(readErrorMessage(invalidRaw)).toContain('supported bindings:');
    expect(readErrorMessage(invalidRaw)).toContain('currentRecord');

    const associationPopup = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'popup',
        },
      }),
    );
    const configureAssociationPopup = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: associationPopup.uid,
        },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
            associationName: 'tasks',
            sourceId: '{{ctx.record.id}}',
            filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
          },
        },
      },
    });
    expect(configureAssociationPopup.status).toBe(200);

    const invalidAssociationCurrentRecordRaw = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: associationPopup.uid,
        },
        type: 'details',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
          filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
          associationName: 'tasks',
          sourceId: '{{ctx.custom.badSourceId}}',
        },
        fields: ['title'],
      },
    });
    expect(invalidAssociationCurrentRecordRaw.status).toBe(400);
    expect(readErrorMessage(invalidAssociationCurrentRecordRaw)).toContain(
      `does not support resourceInit binding 'currentRecord'`,
    );
  });

  it('should hide collection block popup bindings on unsupported popup scenes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup unsupported scene page',
      tabTitle: 'Popup unsupported scene tab',
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

    const popup = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'popup',
        },
      }),
    );
    const configurePopup = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: popup.uid,
        },
        changes: {
          openView: {
            scene: 'select',
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      },
    });
    expect(configurePopup.status).toBe(200);

    const popupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: popup.uid,
          },
        },
      }),
    );
    expect(popupCatalog.blocks.find((item: any) => item.use === 'CreateFormModel')).toBeUndefined();
    expect(popupCatalog.blocks.find((item: any) => item.use === 'TableBlockModel')).toBeUndefined();
    expect(popupCatalog.blocks.find((item: any) => item.use === 'MarkdownBlockModel')).toBeTruthy();

    const addCollectionBlock = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: popup.uid,
        },
        type: 'table',
        resource: {
          binding: 'otherRecords',
          dataSourceKey: 'main',
          collectionName: 'departments',
        },
        fields: ['title'],
      },
    });
    expect(addCollectionBlock.status).toBe(400);
    expect(readErrorMessage(addCollectionBlock)).toContain(`scene 'select'`);
  });

  it('should reject direct addAction types that do not match the public action scope of the target container', async () => {
    const page = await createPage(rootAgent, {
      title: 'Action visibility page',
      tabTitle: 'Action visibility tab',
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
    const createForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const tableReadback = await getSurface(rootAgent, {
      uid: table.uid,
    });
    const actionsColumnUid = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    )?.uid;

    const rowActionOnTableBlock = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'view',
      },
    });
    expect(rowActionOnTableBlock.status).toBe(400);
    expect(readErrorMessage(rowActionOnTableBlock)).toContain(`use addRecordAction`);

    const blockActionOnRowContainer = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        type: 'refresh',
      },
    });
    expect(blockActionOnRowContainer.status).toBe(400);
    expect(readErrorMessage(blockActionOnRowContainer)).toContain(`record action surface`);

    const directRecordActionOnInternalContainer = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        type: 'view',
      },
    });
    expect(directRecordActionOnInternalContainer.status).toBe(400);
    expect(readErrorMessage(directRecordActionOnInternalContainer)).toContain(`internal record action container`);

    const hiddenDeleteOnForm = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: createForm.uid,
        },
        type: 'delete',
      },
    });
    expect(hiddenDeleteOnForm.status).toBe(400);
    expect(readErrorMessage(hiddenDeleteOnForm)).toContain(`is not allowed under 'CreateFormModel'`);
  });

  it('should compose a filter-form and table under a page grid with simple 3:7 layout semantics', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose users page',
      tabTitle: 'Compose users tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'filter',
            type: 'filterForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: [
              {
                key: 'username',
                fieldPath: 'username',
                target: 'table',
              },
              {
                key: 'nickname',
                fieldPath: 'nickname',
                target: 'table',
              },
            ],
            fieldsLayout: {
              rows: [
                [
                  { key: 'nickname', span: 12 },
                  { key: 'username', span: 12 },
                ],
              ],
            },
            actions: ['submit', 'reset'],
          },
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            actions: [
              'filter',
              {
                type: 'addNew',
                popup: {
                  mode: 'replace',
                },
              },
              'refresh',
            ],
            recordActions: [
              {
                type: 'view',
                popup: {
                  blocks: [],
                },
              },
              {
                type: 'edit',
                popup: {},
              },
              'delete',
            ],
          },
        ],
        layout: {
          rows: [
            [
              { key: 'filter', span: 3 },
              { key: 'table', span: 7 },
            ],
          ],
        },
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const filterBlock = getComposeBlock(composed, 'filter');
    const tableBlock = getComposeBlock(composed, 'table');
    expect(filterBlock.uid).toBeTruthy();
    expect(tableBlock.uid).toBeTruthy();
    expect(composed.layout.sizes.row1).toEqual([7, 17]);

    const tabGrid = await flowRepo.findModelByParentId(page.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(tabGrid?.props?.sizes?.row1).toEqual([7, 17]);
    expect(tabGrid?.props?.rowOrder).toEqual(['row1']);

    const tableReadback = await getSurface(rootAgent, {
      uid: tableBlock.uid,
    });
    expect(tableReadback.tree.use).toBe('TableBlockModel');
    expect(tableReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
    });
    expect(_.castArray(tableReadback.tree.subModels?.columns || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['TableActionsColumnModel', 'TableColumnModel']),
    );
    expect(
      _.castArray(tableReadback.tree.subModels?.columns || [])
        .filter((item: any) => item?.use === 'TableColumnModel')
        .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual(expect.arrayContaining(['username', 'nickname']));
    expect(
      _.castArray(tableReadback.tree.subModels?.actions || [])
        .map((item: any) => item?.use)
        .filter((use) => DEFAULT_COLLECTION_BLOCK_ACTION_USES.has(use)),
    ).toEqual(['FilterActionModel', 'RefreshActionModel', 'AddNewActionModel']);
    const actionsColumnUid = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    )?.uid;
    const rowActionsReadback = await getSurface(rootAgent, {
      uid: actionsColumnUid,
    });
    expect(_.castArray(rowActionsReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['ViewActionModel', 'EditActionModel', 'DeleteActionModel']),
    );

    const composedTableBlock = getComposeBlock(composed, 'table');
    const composedAddNewAction = composedTableBlock?.actions?.find((item: any) => item.type === 'addNew');
    const composedViewAction = composedTableBlock?.recordActions?.find((item: any) => item.type === 'view');
    const composedEditAction = composedTableBlock?.recordActions?.find((item: any) => item.type === 'edit');

    const { popupBlock: addNewPopupBlock } = await readPrimaryPopupBlock(composedAddNewAction.uid);
    expect(addNewPopupBlock?.use).toBe('CreateFormModel');
    expect(addNewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(addNewPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const { popupBlock: viewPopupBlock } = await readPrimaryPopupBlock(composedViewAction.uid);
    expect(viewPopupBlock?.use).toBe('DetailsBlockModel');
    expect(viewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');

    const { popupBlock: editPopupBlock } = await readPrimaryPopupBlock(composedEditAction.uid);
    expect(editPopupBlock?.use).toBe('EditFormModel');
    expect(editPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(editPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const filterReadback = await getSurface(rootAgent, {
      uid: filterBlock.uid,
    });
    expect(filterReadback.tree.use).toBe('FilterFormBlockModel');
    expect(_.castArray(filterReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['FilterFormSubmitActionModel', 'FilterFormResetActionModel']),
    );
    expect(filterReadback.tree.subModels?.grid?.props?.rowOrder).toEqual(['row1']);

    const usernameFilter = composed.blocks
      .find((item: any) => item.key === 'filter')
      ?.fields?.find((item: any) => item.fieldPath === 'username');
    const nicknameFilter = composed.blocks
      .find((item: any) => item.key === 'filter')
      ?.fields?.find((item: any) => item.fieldPath === 'nickname');
    expect(nicknameFilter?.wrapperUid).toBeTruthy();
    expect(usernameFilter?.wrapperUid).toBeTruthy();
    expect(filterReadback.tree.subModels?.grid?.props?.rows).toEqual({
      row1: [[nicknameFilter.wrapperUid], [usernameFilter.wrapperUid]],
    });
    expect(filterReadback.tree.subModels?.grid?.props?.sizes).toEqual({
      row1: [12, 12],
    });
    const usernameFilterReadback = await getSurface(rootAgent, {
      uid: usernameFilter.wrapperUid,
    });
    expect(usernameFilterReadback.tree.stepParams?.filterFormItemSettings?.init?.defaultTargetUid).toBe(tableBlock.uid);
  });

  it('should compose tree blocks with layout and reject unsupported tree content containers', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose tree page',
      tabTitle: 'Compose tree tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'categoryTree',
            type: 'tree',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
            settings: {
              searchable: true,
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
    });
    expect(composeRes.status).toBe(200);
    const composed = getData(composeRes);
    const treeBlock = getComposeBlock(composed, 'categoryTree');
    expect(composed.layout.rows.row1).toEqual([[treeBlock.uid]]);
    expect(composed.layout.sizes.row1).toEqual([24]);

    const treeReadback = await getSurface(rootAgent, {
      uid: treeBlock.uid,
    });
    expect(treeReadback.tree).toMatchObject({
      use: 'TreeBlockModel',
      props: {
        searchable: true,
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
    expect(treeReadback.tree.subModels).toBeUndefined();

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
      const invalidPage = await createPage(rootAgent, {
        title: `Invalid tree compose ${item.key}`,
        tabTitle: `Invalid tree compose ${item.key}`,
      });
      const invalidRes = await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: invalidPage.tabSchemaUid,
          },
          blocks: [
            {
              key: 'tree',
              type: 'tree',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'categories',
              },
              ...item.payload,
            },
          ],
        },
      });
      expect(invalidRes.status).toBe(400);
      expect(readErrorMessage(invalidRes)).toContain(item.message);
    }
  });

  it('should compose same-run tree connectFields targets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose tree connect page',
      tabTitle: 'Compose tree connect tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'usersTree',
            type: 'tree',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            settings: {
              connectFields: {
                targets: [{ target: 'usersTable' }],
              },
            },
          },
          {
            key: 'usersTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname'],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);
    const composed = getData(composeRes);
    const treeBlock = getComposeBlock(composed, 'usersTree');
    const tableBlock = getComposeBlock(composed, 'usersTable');
    const pageGrid = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(pageGrid?.filterManager).toEqual(
      expect.arrayContaining([
        {
          filterId: treeBlock.uid,
          targetId: tableBlock.uid,
          filterPaths: ['id'],
        },
      ]),
    );
  });

  it('should compose relation fields with fieldType on form blocks', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose relation fieldType page',
      tabTitle: 'Compose relation fieldType tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'userForm',
              type: 'createForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                {
                  key: 'rolesField',
                  fieldPath: 'roles',
                  fieldType: 'popupSubTable',
                  fields: ['title', 'name'],
                },
              ],
            },
          ],
        },
      }),
    );

    const formBlock = getComposeBlock(composeRes, 'userForm');
    const formSurface = await getSurface(rootAgent, {
      uid: formBlock.uid,
    });
    const formItems = _.castArray(formSurface.tree?.subModels?.grid?.subModels?.items || []);
    expect(formItems).toHaveLength(1);
    expect(formItems[0]?.use).toBe('FormItemModel');
    expect(formItems[0]?.subModels?.field?.use).toBe('PopupSubTableFieldModel');
    expect(
      _.castArray(formItems[0]?.subModels?.field?.subModels?.subTableColumns || [])
        .filter((item: any) => item?.use === 'TableColumnModel')
        .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual(['roles.title', 'roles.name']);

    const fieldCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: formItems[0].uid,
          },
        },
      }),
    );
    expect(fieldCatalog.node.relation?.fieldTypes).toEqual(
      expect.arrayContaining(['select', 'picker', 'subFormList', 'popupSubTable']),
    );
    expect(fieldCatalog.node.relation?.current).toMatchObject({
      fieldType: 'popupSubTable',
      fields: ['title', 'name'],
      titleField: 'title',
    });
    expect(fieldCatalog.node.relation?.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldType: 'picker',
          defaults: expect.objectContaining({
            titleField: 'title',
            fields: ['title'],
          }),
        }),
        expect.objectContaining({
          fieldType: 'popupSubTable',
          defaults: expect.objectContaining({
            titleField: 'title',
            fields: ['title'],
          }),
        }),
      ]),
    );
  });

  it('should compose inline editable subTable columns with editable fields', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose editable relation subTable page',
      tabTitle: 'Compose editable relation subTable tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'userForm',
              type: 'createForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                {
                  key: 'rolesField',
                  fieldPath: 'roles',
                  fieldType: 'subTable',
                  fields: ['title', 'name'],
                },
              ],
            },
          ],
        },
      }),
    );

    const formBlock = getComposeBlock(composeRes, 'userForm');
    const formSurface = await getSurface(rootAgent, {
      uid: formBlock.uid,
    });
    const formItems = _.castArray(formSurface.tree?.subModels?.grid?.subModels?.items || []);
    expect(formItems).toHaveLength(1);
    const rolesField = formItems[0]?.subModels?.field;
    expect(rolesField?.use).toBe('SubTableFieldModel');

    const columns = _.castArray(rolesField?.subModels?.columns || []);
    expect(columns.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath)).toEqual([
      'roles.title',
      'roles.name',
    ]);
    expect(columns.map((item: any) => item?.props?.title)).toEqual(['{{t("Role name")}}', '{{t("Role UID")}}']);
    expect(columns.map((item: any) => item?.subModels?.field?.use)).toEqual(['InputFieldModel', 'InputFieldModel']);
  });

  it('should preserve explicit empty relation fields in compose fieldType specs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose empty relation fieldType page',
      tabTitle: 'Compose empty relation fieldType tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'userForm',
              type: 'createForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                {
                  key: 'rolesField',
                  fieldPath: 'roles',
                  fieldType: 'popupSubTable',
                  fields: [],
                },
              ],
            },
          ],
        },
      }),
    );

    const formBlock = getComposeBlock(composeRes, 'userForm');
    const formSurface = await getSurface(rootAgent, {
      uid: formBlock.uid,
    });
    const formItems = _.castArray(formSurface.tree?.subModels?.grid?.subModels?.items || []);
    expect(
      _.castArray(formItems[0]?.subModels?.field?.subModels?.subTableColumns || [])
        .filter((item: any) => item?.use === 'TableColumnModel')
        .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual([]);
  });

  it('should addBlock with inline fields that use relation fieldType semantics', async () => {
    const page = await createPage(rootAgent, {
      title: 'AddBlock inline relation fields page',
      tabTitle: 'AddBlock inline relation fields tab',
    });

    const addBlockByTypeRes = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'createForm',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
          fields: [
            {
              key: 'rolesField',
              fieldPath: 'roles',
              fieldType: 'popupSubTable',
              fields: ['title'],
            },
          ],
        },
      }),
    );

    const blockByTypeSurface = await getSurface(rootAgent, {
      uid: addBlockByTypeRes.uid,
    });
    const formItemsByType = _.castArray(blockByTypeSurface.tree?.subModels?.grid?.subModels?.items || []);
    expect(formItemsByType).toHaveLength(1);
    expect(formItemsByType[0]?.subModels?.field?.use).toBe('PopupSubTableFieldModel');
    expect(
      _.castArray(formItemsByType[0]?.subModels?.field?.subModels?.subTableColumns || [])
        .filter((item: any) => item?.use === 'TableColumnModel')
        .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual(['roles.title']);

    const addBlockByUseRes = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          use: 'CreateFormModel',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
          fields: [
            {
              key: 'rolesFieldByUse',
              fieldPath: 'roles',
              fieldType: 'popupSubTable',
            },
          ],
        },
      }),
    );

    const blockByUseSurface = await getSurface(rootAgent, {
      uid: addBlockByUseRes.uid,
    });
    const formItemsByUse = _.castArray(blockByUseSurface.tree?.subModels?.grid?.subModels?.items || []);
    expect(formItemsByUse).toHaveLength(1);
    expect(formItemsByUse[0]?.subModels?.field?.use).toBe('PopupSubTableFieldModel');

    const addBlocksData = getData(
      await rootAgent.resource('flowSurfaces').addBlocks({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'batchUserForm',
              type: 'createForm',
              resourceInit: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                {
                  key: 'batchRolesField',
                  fieldPath: 'roles',
                  fieldType: 'popupSubTable',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(addBlocksData.successCount).toBe(1);
    const batchBlockSurface = await getSurface(rootAgent, {
      uid: addBlocksData.blocks[0].result.uid,
    });
    const batchFormItems = _.castArray(batchBlockSurface.tree?.subModels?.grid?.subModels?.items || []);
    expect(batchFormItems).toHaveLength(1);
    expect(batchFormItems[0]?.subModels?.field?.use).toBe('PopupSubTableFieldModel');
  });

  it('should reject internal relation field model keys in public field specs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Reject internal relation field keys page',
      tabTitle: 'Reject internal relation field keys tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'userForm',
            type: 'createForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: [
              {
                key: 'rolesField',
                fieldPath: 'roles',
                fieldComponent: 'PopupSubTableFieldModel',
              },
            ],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(400);
    expect(readErrorMessage(composeRes)).toContain(
      'field objects must use public fieldType/fields/titleField keys; remove internal keys: fieldComponent',
    );
  });

  it('should reject fieldsLayout on compose blocks that do not own a field grid', async () => {
    const page = await createPage(rootAgent, {
      title: 'Invalid compose fieldsLayout page',
      tabTitle: 'Invalid compose fieldsLayout tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname'],
            fieldsLayout: {
              rows: [['username']],
            },
          },
        ],
      },
    });

    expect(composeRes.status).toBe(400);
    expect(readErrorMessage(composeRes)).toContain(
      'flowSurfaces authoring $.blocks[0].fieldsLayout is only supported on createForm, editForm, details, or filterForm blocks',
    );
  });

  it('should reject invalid compose fieldsLayout cell placement and span values', async () => {
    const cases = [
      {
        title: 'Duplicate compose fieldsLayout field page',
        fieldsLayout: {
          rows: [['username', 'username']],
        },
        expectedMessage: "flowSurfaces authoring $.blocks[0].fieldsLayout.rows[0][1] duplicates field 'username'",
      },
      {
        title: 'Missing compose fieldsLayout field page',
        fieldsLayout: {
          rows: [['username']],
        },
        expectedMessage: 'flowSurfaces authoring $.blocks[0].fields[1] must appear exactly once in fieldsLayout rows',
      },
      {
        title: 'Invalid compose fieldsLayout span page',
        fieldsLayout: {
          rows: [[{ key: 'username', span: '12' }, 'nickname', 'email']],
        },
        expectedMessage: 'fieldsLayout row #1 cell #1.span must be a number',
      },
    ];

    for (const item of cases) {
      const page = await createPage(rootAgent, {
        title: item.title,
        tabTitle: 'Invalid compose fieldsLayout tab',
      });

      const composeRes = await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'employeeForm',
              type: 'createForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: ['username', 'nickname', 'email'],
              fieldsLayout: item.fieldsLayout,
            },
          ],
        },
      });

      expect(composeRes.status).toBe(400);
      expect(readErrorMessage(composeRes)).toContain(item.expectedMessage);
    }
  });

  it('should auto-apply compact filterForm layout in compose when fieldsLayout is omitted', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose compact filter page',
      tabTitle: 'Compose compact filter tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'filter',
            type: 'filterForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: [
              { fieldPath: 'username', target: 'table' },
              { fieldPath: 'nickname', target: 'table' },
              { fieldPath: 'email', target: 'table' },
            ],
            actions: ['submit', 'reset'],
          },
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(200);
    const composed = getData(composeRes);
    const filterBlock = getComposeBlock(composed, 'filter');
    const filterReadback = await getSurface(rootAgent, {
      uid: filterBlock.uid,
    });

    const usernameFilter = composed.blocks
      .find((item: any) => item.key === 'filter')
      ?.fields?.find((item: any) => item.fieldPath === 'username');
    const nicknameFilter = composed.blocks
      .find((item: any) => item.key === 'filter')
      ?.fields?.find((item: any) => item.fieldPath === 'nickname');
    const emailFilter = composed.blocks
      .find((item: any) => item.key === 'filter')
      ?.fields?.find((item: any) => item.fieldPath === 'email');

    expect(filterReadback.tree.subModels?.grid?.props?.rows).toEqual({
      row1: [[usernameFilter.wrapperUid], [nicknameFilter.wrapperUid], [emailFilter.wrapperUid]],
    });
    expect(filterReadback.tree.subModels?.grid?.props?.sizes).toEqual({
      row1: [8, 8, 8],
    });
  });

  it('should auto-apply full-width richText and vditor rows in compose and addBlock', async () => {
    const collectionName = `flow_surface_wide_compose_${uid()}`;
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
    await waitForFixtureCollectionsReady(app.db, {
      [collectionName]: ['title', 'status', 'body', 'summary', 'code', 'notes'],
    });

    const page = await createPage(rootAgent, {
      title: 'Wide compose layout page',
      tabTitle: 'Wide compose layout tab',
    });
    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'wideEditForm',
            type: 'editForm',
            resource: {
              dataSourceKey: 'main',
              collectionName,
            },
            fields: ['title', 'status', 'body', 'summary', 'code', 'notes'],
            actions: ['submit'],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(200);
    const composed = getData(composeRes);
    const formReadback = await getSurface(rootAgent, {
      uid: getComposeBlock(composed, 'wideEditForm').uid,
    });
    const formItems = _.castArray(formReadback.tree.subModels?.grid?.subModels?.items || []);
    const titleWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'title')
      ?.uid;
    const statusWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'status')
      ?.uid;
    const bodyWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'body')?.uid;
    const summaryWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'summary')
      ?.uid;
    const codeWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'code')?.uid;
    const notesWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'notes')
      ?.uid;

    expect(formReadback.tree.subModels?.grid?.props?.rows).toEqual({
      row1: [[titleWrapper], [statusWrapper]],
      row2: [[bodyWrapper]],
      row3: [[summaryWrapper], [codeWrapper]],
      row4: [[notesWrapper]],
    });
    expect(formReadback.tree.subModels?.grid?.props?.sizes).toEqual({
      row1: [12, 12],
      row2: [24],
      row3: [12, 12],
      row4: [24],
    });

    const addBlockPage = await createPage(rootAgent, {
      title: 'Wide addBlock layout page',
      tabTitle: 'Wide addBlock layout tab',
    });
    const addBlockRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: addBlockPage.tabSchemaUid,
        },
        type: 'details',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName,
        },
        fields: ['title', 'body', 'summary'],
      },
    });

    expect(addBlockRes.status).toBe(200);
    const addBlockReadback = await getSurface(rootAgent, {
      uid: getData(addBlockRes).uid,
    });
    const detailsItems = _.castArray(addBlockReadback.tree.subModels?.grid?.subModels?.items || []);
    const detailsTitleWrapper = detailsItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'title',
    )?.uid;
    const detailsBodyWrapper = detailsItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'body',
    )?.uid;
    const detailsSummaryWrapper = detailsItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'summary',
    )?.uid;

    expect(addBlockReadback.tree.subModels?.grid?.props?.rows).toEqual({
      row1: [[detailsTitleWrapper]],
      row2: [[detailsBodyWrapper]],
      row3: [[detailsSummaryWrapper]],
    });
    expect(addBlockReadback.tree.subModels?.grid?.props?.sizes).toEqual({
      row1: [24],
      row2: [24],
      row3: [24],
    });
  });

  it('should compile compose fieldGroups into divider items and compact rows', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose field groups page',
      tabTitle: 'Compose field groups tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeeForm',
            type: 'createForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fieldGroups: [
              {
                title: 'Basic information',
                fields: ['username', 'nickname'],
              },
              {
                title: 'Contact',
                fields: ['email'],
              },
            ],
            actions: ['submit'],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(200);
    const composed = getData(composeRes);
    const formBlock = getComposeBlock(composed, 'employeeForm');
    const formReadback = await getSurface(rootAgent, {
      uid: formBlock.uid,
    });
    const formItems = _.castArray(formReadback.tree.subModels?.grid?.subModels?.items || []);
    const basicDividerNode = formItems.find(
      (item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Basic information',
    );
    const contactDividerNode = formItems.find(
      (item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Contact',
    );
    const basicDivider = basicDividerNode?.uid;
    const contactDivider = contactDividerNode?.uid;
    const usernameWrapper = formItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'username',
    )?.uid;
    const nicknameWrapper = formItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'nickname',
    )?.uid;
    const emailWrapper = formItems.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'email')
      ?.uid;

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
    expect(formReadback.tree.subModels?.grid?.props?.rows).toEqual({
      row1: [[basicDivider]],
      row2: [[usernameWrapper], [nicknameWrapper]],
      row3: [[contactDivider]],
      row4: [[emailWrapper]],
    });
    expect(formReadback.tree.subModels?.grid?.props?.sizes).toEqual({
      row1: [24],
      row2: [12, 12],
      row3: [24],
      row4: [24],
    });
  });

  it('should auto-inject submit into create and edit forms during compose without duplicating explicit submit', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose default submit page',
      tabTitle: 'Compose default submit tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'createAuto',
            type: 'createForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username'],
          },
          {
            key: 'editWithJs',
            type: 'editForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            actions: ['js'],
          },
          {
            key: 'createExplicit',
            type: 'createForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['email'],
            actions: ['submit', 'js'],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(200);
    const composed = getData(composeRes);
    const createAutoBlock = getComposeBlock(composed, 'createAuto');
    const editWithJsBlock = getComposeBlock(composed, 'editWithJs');
    const createExplicitBlock = getComposeBlock(composed, 'createExplicit');
    expect(createAutoBlock.uid).toBeTruthy();
    expect(editWithJsBlock.uid).toBeTruthy();
    expect(createExplicitBlock.uid).toBeTruthy();

    expect(_.castArray(createAutoBlock.actions || []).map((item: any) => item?.type)).toEqual(['submit']);
    expect(_.castArray(editWithJsBlock.actions || []).map((item: any) => item?.type)).toEqual(['submit', 'js']);
    expect(_.castArray(createExplicitBlock.actions || []).map((item: any) => item?.type)).toEqual(['submit', 'js']);

    const createAutoReadback = await getSurface(rootAgent, {
      uid: createAutoBlock.uid,
    });
    const editWithJsReadback = await getSurface(rootAgent, {
      uid: editWithJsBlock.uid,
    });
    const createExplicitReadback = await getSurface(rootAgent, {
      uid: createExplicitBlock.uid,
    });

    expect(_.castArray(createAutoReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual([
      'FormSubmitActionModel',
    ]);

    const editWithJsUses = _.castArray(editWithJsReadback.tree.subModels?.actions || []).map((item: any) => item?.use);
    expect(editWithJsUses[0]).toBe('FormSubmitActionModel');
    expect(editWithJsUses.filter((item: any) => item === 'FormSubmitActionModel')).toHaveLength(1);
    expect(editWithJsUses).toHaveLength(2);

    const createExplicitUses = _.castArray(createExplicitReadback.tree.subModels?.actions || []).map(
      (item: any) => item?.use,
    );
    expect(createExplicitUses[0]).toBe('FormSubmitActionModel');
    expect(createExplicitUses.filter((item: any) => item === 'FormSubmitActionModel')).toHaveLength(1);
    expect(createExplicitUses).toHaveLength(2);
  });

  it('should compose a list block with item fields block actions and record actions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose list page',
      tabTitle: 'Compose list tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeesList',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            actions: ['addNew', 'refresh'],
            recordActions: [
              'view',
              'edit',
              {
                type: 'popup',
                popup: {
                  mode: 'replace',
                  blocks: [
                    {
                      key: 'details',
                      type: 'details',
                      resource: {
                        binding: 'currentRecord',
                      },
                      fields: ['username', 'nickname', 'email'],
                    },
                  ],
                },
              },
              'delete',
            ],
            settings: {
              pageSize: 20,
              layout: 'vertical',
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const listBlock = composed.blocks.find((item: any) => item.key === 'employeesList');
    expect(listBlock.uid).toBeTruthy();
    expect(listBlock.itemUid).toBeTruthy();
    expect(listBlock.itemGridUid).toBeTruthy();
    expect(listBlock.fields.map((item: any) => item.fieldPath)).toEqual(['username', 'nickname', 'email']);
    expect(listBlock.actions.map((item: any) => item.type)).toEqual(['filter', 'refresh', 'addNew']);
    expect(listBlock.recordActions.map((item: any) => item.type)).toEqual(['view', 'edit', 'popup', 'delete']);
    const popupActionResult = listBlock.recordActions.find((item: any) => item.type === 'popup');
    expect(popupActionResult.popupPageUid).toBeTruthy();
    expect(popupActionResult.popupTabUid).toBeTruthy();
    expect(popupActionResult.popupGridUid).toBeTruthy();

    const listReadback = await getSurface(rootAgent, {
      uid: listBlock.uid,
    });
    expect(listReadback.tree.use).toBe('ListBlockModel');
    expect(listReadback.tree.subModels?.item?.use).toBe('ListItemModel');
    expect(listReadback.tree.subModels?.item?.subModels?.grid?.use).toBe('DetailsGridModel');
    expect(_.castArray(listReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual([
      'FilterActionModel',
      'RefreshActionModel',
      'AddNewActionModel',
    ]);
    expect(
      _.castArray(listReadback.tree.subModels?.item?.subModels?.grid?.subModels?.items || []).map(
        (item: any) => item?.subModels?.field?.stepParams?.fieldSettings?.init?.fieldPath,
      ),
    ).toEqual(expect.arrayContaining(['username', 'nickname']));
    expect(
      _.castArray(listReadback.tree.subModels?.item?.subModels?.actions || []).map((item: any) => item?.use),
    ).toEqual(
      expect.arrayContaining(['ViewActionModel', 'EditActionModel', 'PopupCollectionActionModel', 'DeleteActionModel']),
    );

    const popupActionUid = popupActionResult?.uid;
    const popupReadback = await getSurface(rootAgent, {
      uid: popupActionUid,
    });
    expect(popupReadback.tree.subModels?.page?.use).toBe('ChildPageModel');
    expect(
      _.castArray(
        popupReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      ).map((item: any) => item?.use),
    ).toEqual(expect.arrayContaining(['DetailsBlockModel']));

    const defaultViewAction = listBlock.recordActions.find((item: any) => item.type === 'view');
    const defaultEditAction = listBlock.recordActions.find((item: any) => item.type === 'edit');
    const { actionSurface: defaultViewActionSurface, popupBlock: defaultViewPopupBlock } = await readPrimaryPopupBlock(
      defaultViewAction.uid,
    );
    expect(defaultViewActionSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(defaultViewActionSurface.tree.popup.template?.uid).toBeTruthy();
    expect(defaultViewActionSurface.tree.popup.pageUid).toBeUndefined();
    expect(defaultViewActionSurface.tree.popup.tabUid).toBeUndefined();
    expect(defaultViewActionSurface.tree.popup.gridUid).toBeUndefined();
    expect(defaultViewPopupBlock?.use).toBe('DetailsBlockModel');

    const { actionSurface: defaultEditActionSurface, popupBlock: defaultEditPopupBlock } = await readPrimaryPopupBlock(
      defaultEditAction.uid,
    );
    expect(defaultEditActionSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(defaultEditActionSurface.tree.popup.template?.uid).toBeTruthy();
    expect(defaultEditActionSurface.tree.popup.pageUid).toBeUndefined();
    expect(defaultEditActionSurface.tree.popup.tabUid).toBeUndefined();
    expect(defaultEditActionSurface.tree.popup.gridUid).toBeUndefined();
    expect(defaultEditPopupBlock?.use).toBe('EditFormModel');
    expect(_.castArray(defaultEditPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );
  });

  it('should create list and grid-card record actions with frontend-aligned button defaults', async () => {
    const page = await createPage(rootAgent, {
      title: 'Record action style page',
      tabTitle: 'Record action style tab',
    });
    const list = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'list',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });
    const gridCard = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'gridCard',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const listEditAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: list.uid,
          },
          type: 'edit',
          settings: {
            title: '编辑',
          },
        },
      }),
    );
    const gridCardViewAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: gridCard.uid,
          },
          type: 'view',
        },
      }),
    );
    const explicitListEditAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: list.uid,
          },
          type: 'edit',
          settings: {
            type: 'primary',
            icon: 'EditOutlined',
            iconOnly: true,
          },
        },
      }),
    );

    const listEditReadback = await getSurface(rootAgent, {
      uid: listEditAction.uid,
    });
    expect(listEditReadback.tree.stepParams?.buttonSettings?.general).toMatchObject({
      title: '编辑',
      type: 'link',
      icon: null,
    });

    const gridCardViewReadback = await getSurface(rootAgent, {
      uid: gridCardViewAction.uid,
    });
    expect(gridCardViewReadback.tree.stepParams?.buttonSettings?.general).toMatchObject({
      type: 'link',
      icon: null,
    });

    const explicitListEditReadback = await getSurface(rootAgent, {
      uid: explicitListEditAction.uid,
    });
    expect(explicitListEditReadback.tree.stepParams?.buttonSettings?.general).toMatchObject({
      type: 'primary',
      icon: 'EditOutlined',
      iconOnly: true,
    });
    expect(explicitListEditReadback.tree.stepParams?.buttonSettings?.general?.title).toBeUndefined();
  });

  it('should create explicit bulk delete with icon-only right collection action defaults', async () => {
    const page = await createPage(rootAgent, {
      title: 'Bulk delete action style page',
      tabTitle: 'Bulk delete action style tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const bulkDeleteAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'bulkDelete',
        },
      }),
    );
    const explicitBulkDeleteAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'bulkDelete',
          settings: {
            title: 'Remove selected',
            position: 'left',
          },
        },
      }),
    );

    const bulkDeleteReadback = await getSurface(rootAgent, {
      uid: bulkDeleteAction.uid,
    });
    expectIconOnlyCollectionActionDefaults(bulkDeleteReadback.tree, {
      use: 'BulkDeleteActionModel',
      tooltip: '{{t("Delete")}}',
      icon: 'DeleteOutlined',
    });

    const explicitBulkDeleteReadback = await getSurface(rootAgent, {
      uid: explicitBulkDeleteAction.uid,
    });
    expect(explicitBulkDeleteReadback.tree.stepParams?.buttonSettings?.general).toMatchObject({
      title: 'Remove selected',
      tooltip: '{{t("Delete")}}',
      icon: 'DeleteOutlined',
    });
    expect(explicitBulkDeleteReadback.tree.stepParams?.buttonSettings?.general?.type).toBeUndefined();
  });

  it('should compose a grid-card block with item fields block actions and record actions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose grid-card page',
      tabTitle: 'Compose grid-card tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeeCards',
            type: 'gridCard',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            actions: ['addNew', 'refresh'],
            recordActions: ['view', 'edit', 'updateRecord', 'delete'],
            settings: {
              columns: 3,
              rowCount: 2,
              layout: 'vertical',
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const gridCardBlock = composed.blocks.find((item: any) => item.key === 'employeeCards');
    expect(gridCardBlock.uid).toBeTruthy();
    expect(gridCardBlock.itemUid).toBeTruthy();
    expect(gridCardBlock.itemGridUid).toBeTruthy();
    expect(gridCardBlock.fields.map((item: any) => item.fieldPath)).toEqual(['username', 'nickname', 'email']);
    expect(gridCardBlock.actions.map((item: any) => item.type)).toEqual(['filter', 'refresh', 'addNew']);
    expect(gridCardBlock.recordActions.map((item: any) => item.type)).toEqual([
      'view',
      'edit',
      'updateRecord',
      'delete',
    ]);
    const updateRecordResult = gridCardBlock.recordActions.find((item: any) => item.type === 'updateRecord');
    expect(updateRecordResult.assignFormUid).toBeTruthy();
    expect(updateRecordResult.assignFormGridUid).toBeTruthy();

    const gridCardReadback = await getSurface(rootAgent, {
      uid: gridCardBlock.uid,
    });
    expect(gridCardReadback.tree.use).toBe('GridCardBlockModel');
    expect(gridCardReadback.tree.subModels?.item?.use).toBe('GridCardItemModel');
    expect(gridCardReadback.tree.subModels?.item?.subModels?.grid?.use).toBe('DetailsGridModel');
    expect(_.castArray(gridCardReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual([
      'FilterActionModel',
      'RefreshActionModel',
      'AddNewActionModel',
    ]);
    expect(
      _.castArray(gridCardReadback.tree.subModels?.item?.subModels?.grid?.subModels?.items || []).map(
        (item: any) => item?.subModels?.field?.stepParams?.fieldSettings?.init?.fieldPath,
      ),
    ).toEqual(expect.arrayContaining(['username', 'nickname']));
    expect(
      _.castArray(gridCardReadback.tree.subModels?.item?.subModels?.actions || []).map((item: any) => item?.use),
    ).toEqual(
      expect.arrayContaining(['ViewActionModel', 'EditActionModel', 'UpdateRecordActionModel', 'DeleteActionModel']),
    );
  });

  it('should support recordActions grouping on all record-capable blocks while still rejecting unsupported action containers', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose record action validation page',
      tabTitle: 'Compose record action validation tab',
    });

    const tableRecordActionsRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            actions: ['addNew', 'refresh'],
            recordActions: ['view', 'delete'],
          },
        ],
      },
    });
    expect(tableRecordActionsRes.status).toBe(200);

    const tableBlock = getData(tableRecordActionsRes).blocks.find((item: any) => item.key === 'table');
    expect(tableBlock.actions.map((item: any) => item.type)).toEqual(['filter', 'refresh', 'bulkDelete', 'addNew']);
    expect(tableBlock.recordActions.map((item: any) => item.type)).toEqual(['view', 'edit', 'delete']);
    expect(tableBlock.actionsColumnUid).toBeTruthy();

    const tableActionReadback = await getSurface(rootAgent, {
      uid: tableBlock.uid,
    });
    const tableActions = _.castArray(tableActionReadback.tree.subModels?.actions || []);
    expect(tableActions.map((item: any) => item?.use)).toEqual([
      'FilterActionModel',
      'RefreshActionModel',
      'BulkDeleteActionModel',
      'AddNewActionModel',
    ]);
    const explicitRefreshAction = tableActions.find((item: any) => item?.use === 'RefreshActionModel');
    const explicitAddNewAction = tableActions.find((item: any) => item?.use === 'AddNewActionModel');
    expect(explicitRefreshAction?.uid).toBe(tableBlock.actions.find((item: any) => item.type === 'refresh')?.uid);
    expect(explicitAddNewAction?.uid).toBe(tableBlock.actions.find((item: any) => item.type === 'addNew')?.uid);
    const defaultBulkDeleteAction = tableActions.find((item: any) => item?.use === 'BulkDeleteActionModel');
    expectIconOnlyCollectionActionDefaults(defaultBulkDeleteAction, {
      use: 'BulkDeleteActionModel',
      tooltip: '{{t("Delete")}}',
      icon: 'DeleteOutlined',
    });
    expect(defaultBulkDeleteAction?.stepParams?.deleteSettings?.confirm).toMatchObject({
      enable: true,
      title: '{{t("Delete record")}}',
      content: '{{t("Are you sure you want to delete it?")}}',
    });

    const tableRecordActionReadback = await getSurface(rootAgent, {
      uid: tableBlock.actionsColumnUid,
    });
    expect(_.castArray(tableRecordActionReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['ViewActionModel', 'DeleteActionModel']),
    );

    const detailsRecordActionsRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'details',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            recordActions: ['view'],
          },
        ],
      },
    });
    expect(detailsRecordActionsRes.status).toBe(200);
    const detailsBlock = getData(detailsRecordActionsRes).blocks.find((item: any) => item.key === 'details');
    expect(detailsBlock.recordActions.map((item: any) => item.type)).toEqual(['edit', 'view']);
    const defaultViewAction = detailsBlock.recordActions.find((item: any) => item.type === 'view');
    const defaultEditAction = detailsBlock.recordActions.find((item: any) => item.type === 'edit');
    const defaultViewActionSurface = await getSurface(rootAgent, {
      uid: defaultViewAction.uid,
    });
    expect(defaultViewActionSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(defaultViewActionSurface.tree.popup.template?.uid).toBeTruthy();
    expect(defaultViewActionSurface.tree.popup.pageUid).toBeUndefined();
    expect(defaultViewActionSurface.tree.popup.tabUid).toBeUndefined();
    expect(defaultViewActionSurface.tree.popup.gridUid).toBeUndefined();
    const defaultEditActionSurface = await getSurface(rootAgent, {
      uid: defaultEditAction.uid,
    });
    expect(defaultEditActionSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(defaultEditActionSurface.tree.popup.template?.uid).toBeTruthy();
    expect(defaultEditActionSurface.tree.popup.pageUid).toBeUndefined();
    expect(defaultEditActionSurface.tree.popup.tabUid).toBeUndefined();
    expect(defaultEditActionSurface.tree.popup.gridUid).toBeUndefined();

    const listBlockOnlyRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeesList',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            actions: ['view'],
          },
        ],
      },
    });
    expect(listBlockOnlyRes.status).toBe(400);
    expect(readErrorMessage(listBlockOnlyRes)).toContain(`must be placed under recordActions`);

    const gridCardRecordOnlyRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeeCards',
            type: 'gridCard',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            recordActions: ['addNew'],
          },
        ],
      },
    });
    expect(gridCardRecordOnlyRes.status).toBe(400);
    expect(readErrorMessage(gridCardRecordOnlyRes)).toContain(`must be placed under actions`);
  });

  it('treeAddChildCompose should only compose addChild when the target table enables treeTable on a tree collection', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose addChild page',
      tabTitle: 'Compose addChild tab',
    });

    const invalidComposeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'categoriesTableWithoutTree',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
            fields: ['title'],
            recordActions: ['addChild'],
          },
        ],
      },
    });
    expect(invalidComposeRes.status).toBe(400);
    expect(readErrorMessage(invalidComposeRes)).toContain('tree table');

    const validComposeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'categoriesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
            fields: ['title'],
            recordActions: ['addChild'],
            settings: {
              treeTable: true,
            },
          },
        ],
      },
    });
    expect(validComposeRes.status).toBe(200);

    const categoriesTable = getData(validComposeRes).blocks.find((item: any) => item.key === 'categoriesTable');
    expect(categoriesTable.recordActions.map((item: any) => item.type)).toEqual(['addChild']);
    expect(categoriesTable.recordActions.find((item: any) => item.type === 'view')).toBeUndefined();
    const addChildAction = categoriesTable.recordActions.find((item: any) => item.type === 'addChild');
    expect(addChildAction?.uid).toBeTruthy();

    const addChildReadback = await getSurface(rootAgent, {
      uid: addChildAction.uid,
    });
    expect(addChildReadback.tree.use).toBe('AddChildActionModel');
    expect(addChildReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'medium',
    });
  });

  it('treeTitleComposeExplicitFields should preserve a readable explicit first field as the clickable tree column', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose tree table explicit title page',
      tabTitle: 'Compose tree table explicit title tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'categoriesTree',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
            settings: {
              treeTable: true,
            },
            fields: ['code'],
            recordActions: ['view', 'edit'],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const categoriesTable = getComposeBlock(getData(composeRes), 'categoriesTree');
    expect(categoriesTable.fields.map((item: any) => item.fieldPath)).toEqual(['code']);
    expect(categoriesTable.recordActions.map((item: any) => item.type)).toEqual(['edit', 'addChild']);
    expect(categoriesTable.recordActions.find((item: any) => item.type === 'view')).toBeUndefined();

    const tableReadback = await getSurface(rootAgent, {
      uid: categoriesTable.uid,
    });
    expectTreeTableTitleClickDefaults(tableReadback.tree, 'code');
    expect(
      readTableColumns(tableReadback.tree).map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual(['code', undefined]);
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual(['EditActionModel', 'AddChildActionModel']);
  });

  it('treeTitleComposeDefaults should compose explicit tree tables with a clickable metadata column', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose tree table clickable title page',
      tabTitle: 'Compose tree table clickable title tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'categoriesTree',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
            settings: {
              treeTable: true,
            },
            fields: ['code'],
            recordActions: ['view', 'edit'],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const categoriesTable = getComposeBlock(getData(composeRes), 'categoriesTree');
    expect(categoriesTable.fields.map((item: any) => item.fieldPath)).toEqual(['code']);
    expect(categoriesTable.recordActions.map((item: any) => item.type)).toEqual(['edit', 'addChild']);
    expect(categoriesTable.recordActions.find((item: any) => item.type === 'view')).toBeUndefined();

    const tableReadback = await getSurface(rootAgent, {
      uid: categoriesTable.uid,
    });
    expectTreeTableTitleClickDefaults(tableReadback.tree, 'code');
    expect(
      readTableColumns(tableReadback.tree).map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual(['code', undefined]);
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual(['EditActionModel', 'AddChildActionModel']);
  });

  it('treeTitleComposeDuplicateRecordActionKeys should preserve duplicate tree table popup action results by uid', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose tree table duplicate popup actions page',
      tabTitle: 'Compose tree table duplicate popup actions tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'categoriesTree',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'categories',
            },
            settings: {
              treeTable: true,
            },
            fields: ['code'],
            recordActions: [
              {
                key: 'inspectA',
                type: 'popup',
                popup: {
                  mode: 'drawer',
                  blocks: [
                    {
                      key: 'detailsA',
                      type: 'details',
                      resource: {
                        binding: 'currentRecord',
                      },
                      fields: ['title'],
                    },
                  ],
                },
              },
              {
                key: 'inspectB',
                type: 'popup',
                popup: {
                  mode: 'replace',
                  blocks: [
                    {
                      key: 'detailsB',
                      type: 'details',
                      resource: {
                        binding: 'currentRecord',
                      },
                      fields: ['code'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const categoriesTable = getComposeBlock(getData(composeRes), 'categoriesTree');
    const popupActions = categoriesTable.recordActions.filter((item: any) => item.type === 'popup');
    expect(popupActions.map((item: any) => item.key)).toEqual(['inspectA', 'inspectB']);
    expect(popupActions.map((item: any) => item.uid)).toHaveLength(2);
    expect(new Set(popupActions.map((item: any) => item.uid)).size).toBe(2);
    expect(popupActions[0].popupPageUid).toBeTruthy();
    expect(popupActions[0].popupTabUid).toBeTruthy();
    expect(popupActions[0].popupGridUid).toBeTruthy();
    expect(popupActions[1].popupPageUid).toBeTruthy();
    expect(popupActions[1].popupTabUid).toBeTruthy();
    expect(popupActions[1].popupGridUid).toBeTruthy();
    expect(popupActions[0].popupPageUid).not.toBe(popupActions[1].popupPageUid);
    expect(categoriesTable.recordActions.map((item: any) => item.type)).toEqual(['popup', 'popup', 'addChild']);
    expect(categoriesTable.recordActions.find((item: any) => item.type === 'view')).toBeUndefined();

    const tableReadback = await getSurface(rootAgent, {
      uid: categoriesTable.uid,
    });
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual([
      'PopupCollectionActionModel',
      'PopupCollectionActionModel',
      'AddChildActionModel',
    ]);
  });

  it('treeTitleFallback should fall back to a direct readable tree table title field when collection title metadata is unsafe', async () => {
    const collectionName = `tree_title_fallback_${uid()}`;
    const applyCollectionRes = await rootAgent.resource('collections').apply({
      values: {
        name: collectionName,
        title: 'Tree title fallback',
        template: 'tree',
        fields: [
          { name: 'name', type: 'string', interface: 'input', title: 'Name' },
          { name: 'code', type: 'string', interface: 'input', title: 'Code' },
        ],
      },
    });
    expect(applyCollectionRes.status, readErrorMessage(applyCollectionRes)).toBe(200);
    await waitForFixtureCollectionsReady(app.db, {
      [collectionName]: ['name', 'code', 'parentId'],
    });

    const collection = app.db.getCollection(collectionName);
    collection.options.titleField = 'parent';
    collection.options.filterTargetKey = 'parent.title';

    const page = await createPage(rootAgent, {
      title: 'Compose tree table title fallback page',
      tabTitle: 'Compose tree table title fallback tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'unsafeTitleTree',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName,
            },
            settings: {
              treeTable: true,
            },
            fields: ['name'],
            recordActions: ['view', 'edit'],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const table = getComposeBlock(getData(composeRes), 'unsafeTitleTree');
    expect(table.fields.map((item: any) => item.fieldPath)).toEqual(['name']);
    expect(table.fields.map((item: any) => item.fieldPath)).not.toContain('parent');
    expect(table.fields.map((item: any) => item.fieldPath)).not.toContain('parent.title');
    expect(table.fields.map((item: any) => item.fieldPath)).not.toContain('id');
    expect(table.recordActions.map((item: any) => item.type)).toEqual(['edit', 'addChild']);
    expect(table.recordActions.find((item: any) => item.type === 'view')).toBeUndefined();

    const tableReadback = await getSurface(rootAgent, {
      uid: table.uid,
    });
    expectTreeTableTitleClickDefaults(tableReadback.tree, 'name');
    expect(
      readTableColumns(tableReadback.tree).map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath),
    ).toEqual(['name', undefined]);
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual(['EditActionModel', 'AddChildActionModel']);
  });

  it('should bind addChild popup create form to the tree children association', async () => {
    const page = await createPage(rootAgent, {
      title: 'Add child association popup page',
      tabTitle: 'Add child association popup tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'categories',
      },
      settings: {
        treeTable: true,
      },
    });

    const addChildRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'addChild',
      },
    });
    expect(addChildRes.status).toBe(200);
    const addChild = getData(addChildRes);

    const { actionSurface, popupBlock } = await readPrimaryPopupBlock(addChild.uid);
    expect(actionSurface.tree.use).toBe('AddChildActionModel');
    expect(actionSurface.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
    });
    expect(actionSurface.tree.stepParams?.popupSettings?.openView?.sourceId).toBeUndefined();
    expect(popupBlock?.use).toBe('CreateFormModel');
    expect(popupBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: addChild.uid,
        },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'categories',
            mode: 'dialog',
          },
        },
      },
    });
    expect(configureRes.status).toBe(200);
    const configuredAddChild = await getSurface(rootAgent, {
      uid: addChild.uid,
    });
    expect(configuredAddChild.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'categories',
      associationName: 'categories.children',
      mode: 'dialog',
    });
    expect(configuredAddChild.tree.stepParams?.popupSettings?.openView?.sourceId).toBeUndefined();
  });

  it('should reject addChild for tree tables without a tree children field', async () => {
    const collectionName = `tree_without_children_${uid()}`;
    await rootAgent.resource('collections').apply({
      values: {
        name: collectionName,
        title: 'Tree without children',
        template: 'tree',
        fields: [{ name: 'title', interface: 'input', title: 'Title' }],
      },
    });
    await waitForFixtureCollectionsReady(app.db, {
      [collectionName]: ['title', 'parentId'],
    });

    const destroyChildrenRes = await rootAgent.resource('collections.fields', collectionName).destroy({
      filterByTk: 'children',
    });
    expect(destroyChildrenRes.status).toBe(200);
    expect(app.db.getCollection(collectionName)?.getField?.('children')).toBeFalsy();

    const page = await createPage(rootAgent, {
      title: 'Tree table without children field page',
      tabTitle: 'Tree table without children field tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
      settings: {
        treeTable: true,
      },
    });

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: table.uid,
          },
        },
      }),
    );
    expect(tableCatalog.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();

    const addChildRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'addChild',
      },
    });
    expect(addChildRes.status).toBe(400);
    expect(readErrorMessage(addChildRes)).toContain('does not expose a tree children field');
  });

  it('should reject legacy scope overrides mixed into compose actions and recordActions', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose scope validation page',
      tabTitle: 'Compose scope validation tab',
    });

    const legacyScopeOnBlockActionsRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status', 'email'],
            actions: [
              {
                type: 'addNew',
                scope: 'block',
              },
            ],
          },
        ],
      },
    });
    expect(legacyScopeOnBlockActionsRes.status).toBe(400);
    expect(readErrorMessage(legacyScopeOnBlockActionsRes)).toContain(
      'does not support scope, use actions or recordActions',
    );

    const legacyScopeOnRecordActionsRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status', 'email'],
            recordActions: [
              {
                type: 'view',
                scope: 'row',
              },
            ],
          },
        ],
      },
    });
    expect(legacyScopeOnRecordActionsRes.status).toBe(400);
    expect(readErrorMessage(legacyScopeOnRecordActionsRes)).toContain(
      'does not support scope, use actions or recordActions',
    );
  });

  it('should support compose replace and configure simple changes while rejecting raw patch keys', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose replace page',
      tabTitle: 'Compose replace tab',
    });

    const initialCompose = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: ['username', 'nickname', 'email'],
              actions: ['filter', 'addNew'],
              recordActions: ['view', 'delete'],
            },
          ],
        },
      }),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'replace',
        blocks: [
          {
            key: 'form',
            type: 'createForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            actions: ['submit'],
          },
        ],
      },
    });
    expect(replaceRes.status).toBe(200);
    const replaced = getData(replaceRes);
    const replacedFormBlock = getComposeBlock(replaced, 'form');
    const initialTableBlock = getComposeBlock(initialCompose, 'table');
    expect(replacedFormBlock.uid).toBeTruthy();

    const tabGrid = await flowRepo.findModelByParentId(page.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(_.castArray(tabGrid?.subModels?.items || []).map((item: any) => item.uid)).toEqual([replacedFormBlock.uid]);
    expect(_.castArray(tabGrid?.subModels?.items || []).some((item: any) => item.uid === initialTableBlock.uid)).toBe(
      false,
    );
    expect(tabGrid?.props?.sizes?.row1).toEqual([24]);

    const pageConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: page.pageUid },
        changes: {
          title: 'Users console',
          documentTitle: 'Users browser title',
          displayTitle: false,
          enableTabs: true,
        },
      },
    });
    expect(pageConfigure.status).toBe(200);

    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    expect(pageReadback.tree.stepParams?.pageSettings?.general).toMatchObject({
      title: 'Users console',
      documentTitle: 'Users browser title',
      displayTitle: false,
      enableTabs: true,
    });

    const formUid = replacedFormBlock.uid;
    const formGrid = await flowRepo.findModelById(formUid, { includeAsyncNode: true });
    const formFieldWrapperUid = _.castArray(formGrid?.subModels?.grid?.subModels?.items || [])[0]?.uid;
    const formFieldInnerUid = _.castArray(formGrid?.subModels?.grid?.subModels?.items || [])[0]?.subModels?.field?.uid;
    const formActionUid = _.castArray(formGrid?.subModels?.actions || [])[0]?.uid;

    const blockConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formUid,
        },
        changes: {
          layout: 'vertical',
          labelAlign: 'left',
          labelWidth: 180,
          labelWrap: true,
        },
      },
    });
    expect(blockConfigure.status).toBe(200);

    const wrapperConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formFieldWrapperUid,
        },
        changes: {
          label: 'User name',
          tooltip: 'Primary login name',
          extra: 'Used for sign-in',
          showLabel: false,
        },
      },
    });
    expect(wrapperConfigure.status).toBe(200);

    const fieldConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formFieldInnerUid,
        },
        changes: {
          clickToOpen: true,
          openView: {
            dataSourceKey: 'main',
            collectionName: 'users',
            mode: 'drawer',
          },
        },
      },
    });
    expect(fieldConfigure.status).toBe(200);

    const actionConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formActionUid,
        },
        changes: {
          title: 'Submit now',
          tooltip: 'Create the record',
          iconOnly: true,
          confirm: {
            enable: true,
            title: 'Please confirm',
            content: 'Submit the form now?',
          },
        },
      },
    });
    expect(actionConfigure.status).toBe(200);

    const formReadback = await getSurface(rootAgent, {
      uid: formUid,
    });
    expect(formReadback.tree.stepParams?.formModelSettings?.layout).toMatchObject({
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: 180,
      labelWrap: true,
    });

    const wrapperReadback = await getSurface(rootAgent, {
      uid: formFieldWrapperUid,
    });
    expect(wrapperReadback.tree.props).toMatchObject({
      label: 'User name',
      tooltip: 'Primary login name',
      extra: 'Used for sign-in',
      showLabel: false,
    });

    const fieldReadback = await getSurface(rootAgent, {
      uid: formFieldInnerUid,
    });
    expect(fieldReadback.tree.props?.clickToOpen).toBe(true);
    expect(fieldReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      collectionName: 'users',
      mode: 'drawer',
    });

    const actionReadback = await getSurface(rootAgent, {
      uid: formActionUid,
    });
    expect(actionReadback.tree.props).toMatchObject({
      title: 'Submit now',
      tooltip: 'Create the record',
      iconOnly: true,
    });
    expect(actionReadback.tree.stepParams?.buttonSettings?.general?.iconOnly).toBe(true);
    expect(actionReadback.tree.stepParams?.submitSettings?.confirm).toMatchObject({
      enable: true,
      title: 'Please confirm',
      content: 'Submit the form now?',
    });

    const rawPathConfigure = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formUid,
        },
        changes: {
          stepParams: {
            formModelSettings: {
              layout: {
                layout: 'horizontal',
              },
            },
          },
        },
      },
    });
    expect(rawPathConfigure.status).toBe(400);
    expect(readErrorMessage(rawPathConfigure)).toContain('does not accept raw keys');
    expect(readErrorMessage(rawPathConfigure)).toContain('configureOptions');

    const rawUseCompose = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'bad',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status', 'email'],
            use: 'TableBlockModel',
          },
        ],
      },
    });
    expect(rawUseCompose.status).toBe(400);
    expect(readErrorMessage(rawUseCompose)).toContain('public semantic block fields');

    const unknownSimpleField = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formUid,
        },
        changes: {
          unknown: true,
        },
      },
    });
    expect(unknownSimpleField.status).toBe(400);
    expect(readErrorMessage(unknownSimpleField)).toContain('does not support');
  });

  it('should support inline settings and popup on direct add and batch add APIs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Direct add inline page',
      tabTitle: 'Direct add inline tab',
    });

    const addBlocksRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            settings: {
              title: 'Employees table',
              pageSize: 50,
            },
          },
          {
            key: 'notes',
            type: 'markdown',
            settings: {
              content: '# Team notes',
            },
          },
          {
            key: 'calendar',
            type: 'calendar',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'calendar_events',
            },
          },
        ],
      },
    });
    expect(addBlocksRes.status).toBe(200);
    const addBlocksData = getData(addBlocksRes);
    expect(addBlocksData.successCount).toBe(3);
    expect(addBlocksData.errorCount).toBe(0);
    const tableUid = addBlocksData.blocks.find((item: any) => item.key === 'table')?.result?.uid;
    expect(tableUid).toBeTruthy();
    const calendarUid = addBlocksData.blocks.find((item: any) => item.key === 'calendar')?.result?.uid;
    expect(calendarUid).toBeTruthy();
    const calendarReadback = await getSurface(rootAgent, {
      uid: calendarUid,
    });
    expect(calendarReadback.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'fullHeight',
    });
    expect(_.castArray(calendarReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual([
      'FilterActionModel',
      'CalendarNavActionModel',
      'CalendarViewSelectActionModel',
      'RefreshActionModel',
      'AddNewActionModel',
    ]);
    const tableReadback = await getSurface(rootAgent, {
      uid: tableUid,
    });
    expect(_.castArray(tableReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['FilterActionModel', 'AddNewActionModel', 'RefreshActionModel']),
    );
    const defaultAddNewActionUid = _.castArray(tableReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'AddNewActionModel',
    )?.uid;
    expect(defaultAddNewActionUid).toBeTruthy();
    const defaultAddNewActionSurface = await getSurface(rootAgent, {
      uid: defaultAddNewActionUid,
    });
    expect(defaultAddNewActionSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(defaultAddNewActionSurface.tree.popup.template?.uid).toBeTruthy();
    expect(defaultAddNewActionSurface.tree.popup.pageUid).toBeUndefined();
    expect(defaultAddNewActionSurface.tree.popup.tabUid).toBeUndefined();
    expect(defaultAddNewActionSurface.tree.popup.gridUid).toBeUndefined();

    const addFieldsRes = await rootAgent.resource('flowSurfaces').addFields({
      values: {
        target: {
          uid: tableUid,
        },
        fields: [
          {
            key: 'username',
            fieldPath: 'username',
            settings: {
              title: 'Username',
              width: 220,
            },
          },
          {
            key: 'bad-field',
            fieldPath: 'nickname',
            settings: {
              badSetting: true,
            },
          },
        ],
      },
    });
    expect(addFieldsRes.status).toBe(200);
    const addFieldsData = getData(addFieldsRes);
    expect(addFieldsData.successCount).toBe(1);
    expect(addFieldsData.errorCount).toBe(1);
    expect(addFieldsData.fields[0].ok).toBe(true);
    expect(addFieldsData.fields[1].ok).toBe(false);
    expectStructuredError(addFieldsData.fields[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(addFieldsData.fields[1].error.message).toContain('does not support: badSetting');
    expect(addFieldsData.fields[1].error.message).toContain('supported configureOptions');

    const fieldReadback = await getSurface(rootAgent, {
      uid: addFieldsData.fields[0].result.wrapperUid,
    });
    expect(fieldReadback.tree.props?.title).toBe('Username');
    expect(fieldReadback.tree.props?.width).toBe(220);

    const addActionsRes = await rootAgent.resource('flowSurfaces').addActions({
      values: {
        target: {
          uid: tableUid,
        },
        actions: [
          {
            key: 'addNew',
            type: 'addNew',
            settings: {
              title: 'Create employee',
            },
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'form',
                  type: 'createForm',
                  resource: {
                    binding: 'currentCollection',
                  },
                  fields: ['username'],
                  actions: ['submit'],
                },
              ],
            },
          },
          {
            key: 'openPopup',
            type: 'popup',
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'popupNotes',
                  type: 'markdown',
                  settings: {
                    content: '# Popup notes',
                  },
                },
              ],
            },
          },
          {
            key: 'openPopupWithMode',
            type: 'popup',
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'popupSummary',
                  type: 'markdown',
                  settings: {
                    content: '# Popup summary',
                  },
                },
              ],
            },
          },
          {
            key: 'archiveSelected',
            type: 'bulkUpdate',
            settings: {
              assignValues: {
                nickname: 'inactive',
              },
            },
          },
          {
            key: 'refresh-with-popup',
            type: 'refresh',
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'details',
                  type: 'details',
                  resource: {
                    binding: 'currentRecord',
                  },
                  fields: ['username', 'nickname', 'email'],
                },
              ],
            },
          },
        ],
      },
    });
    expect(addActionsRes.status).toBe(200);
    const addActionsData = getData(addActionsRes);
    expect(addActionsData.successCount).toBe(4);
    expect(addActionsData.errorCount).toBe(1);
    expect(addActionsData.actions[0].result.popupPageUid).toBeTruthy();
    expect(addActionsData.actions[1].result.popupPageUid).toBeTruthy();
    expect(addActionsData.actions[1].result.popupTabUid).toBeTruthy();
    expect(addActionsData.actions[1].result.popupGridUid).toBeTruthy();
    expect(addActionsData.actions[2].result.popupPageUid).toBeTruthy();
    expect(addActionsData.actions[2].result.popupTabUid).toBeTruthy();
    expect(addActionsData.actions[2].result.popupGridUid).toBeTruthy();
    expect(addActionsData.actions[3].result.popupPageUid).toBeUndefined();
    expect(addActionsData.actions[3].result.popupTabUid).toBeUndefined();
    expect(addActionsData.actions[3].result.popupGridUid).toBeUndefined();
    expectStructuredError(addActionsData.actions[4].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(addActionsData.actions[4].error.message).toContain(`type 'refresh' does not support popup`);
    expect(addActionsData.actions[4].error.message).not.toContain('should use ctx.openView to open popup');

    const bulkUpdateReadback = await getSurface(rootAgent, {
      uid: addActionsData.actions[3].result.uid,
    });
    expect(bulkUpdateReadback.tree.use).toBe('BulkUpdateActionModel');
    expectAssignedValuesMirrors(bulkUpdateReadback.tree, {
      nickname: 'inactive',
    });

    const { actionSurface: popupSurface, popupBlock } = await readPrimaryPopupBlock(
      addActionsData.actions[1].result.uid,
    );
    expect(popupSurface.tree.popup.template).toBeUndefined();
    expect(popupBlock?.use).toBe('MarkdownBlockModel');
    expect(popupBlock?.props?.content).toBe('# Popup notes');
    const { actionSurface: popupWithModeSurface, popupBlock: popupWithModeBlock } = await readPrimaryPopupBlock(
      addActionsData.actions[2].result.uid,
    );
    expect(popupWithModeSurface.tree.popup.template).toBeUndefined();
    expect(popupWithModeBlock?.use).toBe('MarkdownBlockModel');
    expect(popupWithModeBlock?.props?.content).toBe('# Popup summary');

    const addRecordActionsRes = await rootAgent.resource('flowSurfaces').addRecordActions({
      values: {
        target: {
          uid: tableUid,
        },
        recordActions: [
          {
            key: 'view',
            type: 'view',
            settings: {
              title: 'View employee',
              openView: {
                dataSourceKey: 'main',
                collectionName: 'users',
                mode: 'drawer',
              },
            },
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'details',
                  type: 'details',
                  resource: {
                    binding: 'currentRecord',
                  },
                  fields: ['username', 'nickname', 'email'],
                },
              ],
            },
          },
          {
            key: 'delete',
            type: 'delete',
            settings: {
              confirm: true,
            },
          },
          {
            key: 'implicitEdit',
            type: 'edit',
            popup: {},
          },
          {
            key: 'implicitViewWithLayout',
            type: 'view',
            popup: {
              layout: {
                rows: [[{ key: 'defaultDetails', span: 10 }]],
              },
            },
          },
          {
            key: 'markCurrentActive',
            type: 'updateRecord',
            settings: {
              icon: 'StarOutlined',
              iconOnly: true,
              assignValues: {
                nickname: 'active',
              },
            },
          },
        ],
      },
    });
    expect(addRecordActionsRes.status).toBe(200);
    const addRecordActionsData = getData(addRecordActionsRes);
    expect(addRecordActionsData.successCount).toBe(5);
    expect(addRecordActionsData.errorCount).toBe(0);
    expect(addRecordActionsData.recordActions[0].result.popupGridUid).toBeTruthy();
    expect(addRecordActionsData.recordActions[2].result.popupPageUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[2].result.popupTabUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[2].result.popupGridUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[3].result.popupPageUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[3].result.popupTabUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[3].result.popupGridUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[4].result.popupPageUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[4].result.popupTabUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[4].result.popupGridUid).toBeUndefined();

    const { actionSurface: implicitEditSurface, popupBlock: implicitEditPopupBlock } = await readPrimaryPopupBlock(
      addRecordActionsData.recordActions[2].result.uid,
    );
    expect(implicitEditSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(implicitEditPopupBlock?.use).toBe('EditFormModel');
    expect(implicitEditPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(implicitEditPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const { actionSurface: implicitViewWithLayoutSurface, popupBlock: implicitViewWithLayoutPopupBlock } =
      await readPrimaryPopupBlock(addRecordActionsData.recordActions[3].result.uid);
    expect(implicitViewWithLayoutSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(implicitViewWithLayoutPopupBlock?.use).toBe('DetailsBlockModel');

    const updateRecordReadback = await getSurface(rootAgent, {
      uid: addRecordActionsData.recordActions[4].result.uid,
    });
    expect(updateRecordReadback.tree.use).toBe('UpdateRecordActionModel');
    expect(updateRecordReadback.tree.props).toMatchObject({
      icon: 'StarOutlined',
      iconOnly: true,
    });
    expect(updateRecordReadback.tree.props?.title).toBeUndefined();
    expect(updateRecordReadback.tree.stepParams?.buttonSettings?.general).toMatchObject({
      icon: 'StarOutlined',
      iconOnly: true,
    });
    expect(updateRecordReadback.tree.stepParams?.buttonSettings?.general?.title).toBeUndefined();
    expectAssignedValuesMirrors(updateRecordReadback.tree, {
      nickname: 'active',
    });

    const addFieldRawUnknownRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: tableUid,
        },
        fieldPath: 'nickname',
        settings: {
          badSetting: true,
        },
      },
    });
    expect(addFieldRawUnknownRes.status).toBe(400);
    expect(readErrorMessage(addFieldRawUnknownRes)).toContain('does not support: badSetting');
    expect(readErrorMessage(addFieldRawUnknownRes)).toContain('supported configureOptions');
  });

  it('should auto-complete omitted popup payloads in batch action APIs and inherit custom popup tab titles', async () => {
    const page = await createPage(rootAgent, {
      title: 'Implicit batch popup page',
      tabTitle: 'Implicit batch popup tab',
    });

    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const addActionsRes = await rootAgent.resource('flowSurfaces').addActions({
      values: {
        target: {
          uid: table.uid,
        },
        actions: [
          {
            key: 'implicitAddNew',
            type: 'addNew',
            settings: {
              title: 'Create employee',
            },
          },
        ],
      },
    });
    expect(addActionsRes.status).toBe(200);
    const addActionsData = getData(addActionsRes);
    expect(addActionsData.successCount).toBe(1);
    expect(addActionsData.errorCount).toBe(0);
    expect(addActionsData.actions[0].result.popupPageUid).toBeUndefined();
    expect(addActionsData.actions[0].result.popupTabUid).toBeUndefined();
    expect(addActionsData.actions[0].result.popupGridUid).toBeUndefined();

    const {
      actionSurface: implicitAddNewSurface,
      popupSurface: implicitAddNewPopupSurface,
      popupBlock: implicitAddNewPopupBlock,
    } = await readPrimaryPopupBlock(addActionsData.actions[0].result.uid);
    const implicitAddNewPopupTab = _.castArray(
      implicitAddNewPopupSurface.tree.subModels?.page?.subModels?.tabs || [],
    )[0];
    expect(implicitAddNewSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(implicitAddNewSurface.tree.stepParams?.popupSettings?.openView?.title).toBe('Create employee');
    expect(implicitAddNewPopupTab?.props?.title).toBe('{{t("Add new")}}');
    expect(implicitAddNewPopupBlock?.use).toBe('CreateFormModel');
    expect(implicitAddNewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(implicitAddNewPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const addRecordActionsRes = await rootAgent.resource('flowSurfaces').addRecordActions({
      values: {
        target: {
          uid: table.uid,
        },
        recordActions: [
          {
            key: 'implicitView',
            type: 'view',
            settings: {
              title: 'Inspect employee',
            },
          },
          {
            key: 'implicitEdit',
            type: 'edit',
            settings: {
              title: 'Modify employee',
            },
          },
        ],
      },
    });
    expect(addRecordActionsRes.status).toBe(200);
    const addRecordActionsData = getData(addRecordActionsRes);
    expect(addRecordActionsData.successCount).toBe(2);
    expect(addRecordActionsData.errorCount).toBe(0);
    expect(addRecordActionsData.recordActions[0].result.popupPageUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[0].result.popupTabUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[0].result.popupGridUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[1].result.popupPageUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[1].result.popupTabUid).toBeUndefined();
    expect(addRecordActionsData.recordActions[1].result.popupGridUid).toBeUndefined();

    const {
      actionSurface: implicitViewSurface,
      popupSurface: implicitViewPopupSurface,
      popupBlock: implicitViewPopupBlock,
    } = await readPrimaryPopupBlock(addRecordActionsData.recordActions[0].result.uid);
    const implicitViewPopupTab = _.castArray(implicitViewPopupSurface.tree.subModels?.page?.subModels?.tabs || [])[0];
    expect(implicitViewSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(implicitViewSurface.tree.stepParams?.popupSettings?.openView?.title).toBe('Inspect employee');
    expect(implicitViewPopupTab?.props?.title).toBe('{{t("Details")}}');
    expect(implicitViewPopupBlock?.use).toBe('DetailsBlockModel');
    expect(implicitViewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');

    const {
      actionSurface: implicitEditSurface,
      popupSurface: implicitEditPopupSurface,
      popupBlock: implicitEditPopupBlock,
    } = await readPrimaryPopupBlock(addRecordActionsData.recordActions[1].result.uid);
    const implicitEditPopupTab = _.castArray(implicitEditPopupSurface.tree.subModels?.page?.subModels?.tabs || [])[0];
    expect(implicitEditSurface.tree.popup.template).toMatchObject({
      mode: 'reference',
    });
    expect(implicitEditSurface.tree.stepParams?.popupSettings?.openView?.title).toBe('Modify employee');
    expect(implicitEditPopupTab?.props?.title).toBe('{{t("Edit")}}');
    expect(implicitEditPopupBlock?.use).toBe('EditFormModel');
    expect(implicitEditPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('users');
    expect(_.castArray(implicitEditPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );
  });

  it('should keep batch addBlocks partial-success semantics when filter payload is invalid', async () => {
    const page = await createPage(rootAgent, {
      title: 'Batch filter contract page',
      tabTitle: 'Batch filter contract tab',
    });

    const addBlocksRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'valid-table',
            type: 'table',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status', 'email'],
            settings: {
              title: 'Valid employees table',
            },
          },
          {
            key: 'invalid-filter-table',
            type: 'table',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status', 'email'],
            settings: {
              dataScope: {
                foo: 'bar',
              },
            },
          },
        ],
      },
    });
    expect(addBlocksRes.status).toBe(200);
    const addBlocksData = getData(addBlocksRes);
    expect(addBlocksData.successCount).toBe(1);
    expect(addBlocksData.errorCount).toBe(1);
    expect(addBlocksData.blocks[0].ok).toBe(true);
    expect(addBlocksData.blocks[1].ok).toBe(false);
    expectStructuredError(addBlocksData.blocks[1].error, {
      status: 400,
      type: 'bad_request',
    });
    const invalidFilterError = addBlocksData.blocks[1].error;
    expect(invalidFilterError.message).toContain('settings invalid');
    expect(invalidFilterError.message).toContain('authoring validation failed');
    expect(invalidFilterError.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.dataScope',
          ruleId: 'dataScope-filter-group-invalid-shape',
          message: expect.stringContaining('FilterGroup'),
        }),
      ]),
    );
    expect(invalidFilterError.errors[0].message).toContain('{"logic":"$and","items":[]}');
    expect(invalidFilterError.errors[0].message).toContain('does not support: foo');

    const validTableReadback = await getSurface(rootAgent, {
      uid: addBlocksData.blocks[0].result.uid,
    });
    expect(validTableReadback.tree.stepParams?.cardSettings?.titleDescription?.title).toBe('Valid employees table');
  });

  it('should require dataSourceKey when addBlock creates a collection block from raw resourceInit', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing datasource addBlock page',
      tabTitle: 'Missing datasource addBlock tab',
    });

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'table',
        resourceInit: {
          collectionName: 'employees',
        },
        fields: ['nickname'],
      },
    });

    expect(response.status).toBe(400);
    expectStructuredError(readErrorItem(response), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(response)).toContain(
      `flowSurfaces addBlock block 'table' requires resourceInit.dataSourceKey`,
    );

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(_.castArray(readback.tree.subModels?.grid?.subModels?.items || [])).toHaveLength(0);
  });

  it('should keep batch addBlocks partial-success semantics when collection resource misses dataSourceKey', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing datasource addBlocks page',
      tabTitle: 'Missing datasource addBlocks tab',
    });

    const addBlocksRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'notes',
            type: 'markdown',
            settings: {
              content: '# Team notes',
            },
          },
          {
            key: 'employeesTable',
            type: 'table',
            resourceInit: {
              collectionName: 'employees',
            },
            fields: ['nickname'],
          },
        ],
      },
    });

    expect(addBlocksRes.status).toBe(200);
    const addBlocksData = getData(addBlocksRes);
    expect(addBlocksData.successCount).toBe(1);
    expect(addBlocksData.errorCount).toBe(1);
    expect(addBlocksData.blocks[0].ok).toBe(true);
    expect(addBlocksData.blocks[1].ok).toBe(false);
    expectStructuredError(addBlocksData.blocks[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(addBlocksData.blocks[1].error.message).toContain(
      `flowSurfaces addBlock block 'table' requires resourceInit.dataSourceKey`,
    );

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    const items = _.castArray(readback.tree.subModels?.grid?.subModels?.items || []);
    expect(items).toHaveLength(1);
    expect(items[0]?.use).toBe('MarkdownBlockModel');
  });

  it('should reject compose when a collection block raw resource misses dataSourceKey', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing datasource compose page',
      tabTitle: 'Missing datasource compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              collectionName: 'employees',
            },
            fields: ['nickname'],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(400);
    expectStructuredError(readErrorItem(composeRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(composeRes)).toContain(
      `flowSurfaces compose block #1 ("employeesTable", type="table") requires resource.dataSourceKey`,
    );

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(_.castArray(readback.tree.subModels?.grid?.subModels?.items || [])).toHaveLength(0);
  });

  it('should reject mutate addBlock ops when collection resource misses dataSourceKey', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing datasource mutate page',
      tabTitle: 'Missing datasource mutate tab',
    });

    const mutateRes = await rootAgent.resource('flowSurfaces').mutate({
      values: {
        atomic: true,
        ops: [
          {
            type: 'addBlock',
            target: {
              uid: page.tabSchemaUid,
            },
            values: {
              type: 'table',
              resourceInit: {
                collectionName: 'employees',
              },
              fields: ['nickname'],
            },
          },
        ],
      },
    });

    expect(mutateRes.status).toBe(400);
    expectStructuredError(readErrorItem(mutateRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(mutateRes)).toContain(
      `flowSurfaces addBlock block 'table' requires resourceInit.dataSourceKey`,
    );

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(_.castArray(readback.tree.subModels?.grid?.subModels?.items || [])).toHaveLength(0);
  });

  it('should allow addBlock to create filterForm without block-level resourceInit', async () => {
    const page = await createPage(rootAgent, {
      title: 'FilterForm addBlock without resource page',
      tabTitle: 'FilterForm addBlock without resource tab',
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
      fields: ['nickname'],
    });

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'filterForm',
        fields: [
          {
            fieldPath: 'nickname',
            defaultTargetUid: table.uid,
          },
        ],
      },
    });

    expect(response.status).toBe(200);
    const block = getData(response);
    expect(block.uid).toBeTruthy();

    const readback = await getSurface(rootAgent, {
      uid: block.uid,
    });
    expect(readback.tree.use).toBe('FilterFormBlockModel');
    expect(readback.tree.stepParams?.resourceSettings?.init).toBeUndefined();
  });

  it('should allow compose to create filterForm without block-level resource', async () => {
    const page = await createPage(rootAgent, {
      title: 'FilterForm compose without resource page',
      tabTitle: 'FilterForm compose without resource tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname'],
          },
          {
            key: 'filterForm',
            type: 'filterForm',
            fields: [
              {
                fieldPath: 'nickname',
                target: 'employeesTable',
              },
            ],
            actions: ['submit', 'reset'],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(200);
    const composed = getData(composeRes);
    expect(composed.blocks).toHaveLength(2);
    const filterBlock = getComposeBlock(composed, 'filterForm');
    expect(filterBlock).toMatchObject({
      key: 'filterForm',
      type: 'filterForm',
    });
    expect(filterBlock.uid).toBeTruthy();

    const readback = await getSurface(rootAgent, {
      uid: filterBlock.uid,
    });
    expect(readback.tree.use).toBe('FilterFormBlockModel');
    expect(readback.tree.stepParams?.resourceSettings?.init).toBeUndefined();
  });

  it('should reject raw direct-add payload keys and require settings/configureOptions instead', async () => {
    const page = await createPage(rootAgent, {
      title: 'Raw direct add contract page',
      tabTitle: 'Raw direct add contract tab',
    });
    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const rawBlockRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'markdown',
        stepParams: {
          markdownBlockSettings: {
            editMarkdown: {
              content: 'legacy markdown',
            },
          },
        },
      },
    });
    expect(rawBlockRes.status).toBe(400);
    expect(readErrorMessage(rawBlockRes)).toContain('does not accept raw keys');

    const rawFieldRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'jsColumn',
        props: {
          title: 'Legacy JS column',
        },
      },
    });
    expect(rawFieldRes.status).toBe(400);
    expect(readErrorMessage(rawFieldRes)).toContain('does not accept internal field keys');

    const rawActionRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'addNew',
        stepParams: {
          buttonSettings: {
            general: {
              title: 'Legacy action',
            },
          },
        },
      },
    });
    expect(rawActionRes.status).toBe(400);
    expect(readErrorMessage(rawActionRes)).toContain('does not accept raw keys');

    const batchActionRes = await rootAgent.resource('flowSurfaces').addActions({
      values: {
        target: {
          uid: table.uid,
        },
        actions: [
          {
            key: 'valid',
            type: 'addNew',
            settings: {
              title: 'Create employee',
            },
          },
          {
            key: 'invalid-raw',
            type: 'refresh',
            stepParams: {
              buttonSettings: {
                general: {
                  title: 'Legacy refresh',
                },
              },
            },
          },
        ],
      },
    });
    expect(batchActionRes.status).toBe(200);
    const batchActionData = getData(batchActionRes);
    expect(batchActionData.successCount).toBe(1);
    expect(batchActionData.errorCount).toBe(1);
    expect(batchActionData.actions[0].ok).toBe(true);
    expect(batchActionData.actions[1].ok).toBe(false);
    expectStructuredError(batchActionData.actions[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(batchActionData.actions[1].error.message).toContain('does not accept raw keys');
  });

  it('should compose and configure list grid-card and static blocks with simple semantic settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose static page',
      tabTitle: 'Compose static tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'list',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            settings: {
              pageSize: 20,
              dataScope: {
                logic: '$and',
                items: [
                  {
                    path: 'nickname',
                    operator: '$eq',
                    value: 'alpha',
                  },
                ],
              },
              sorting: [
                {
                  field: 'username',
                  direction: 'asc',
                },
              ],
              layout: 'vertical',
            },
          },
          {
            key: 'grid',
            type: 'gridCard',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            settings: {
              columns: 3,
              rowCount: 2,
              dataScope: {
                logic: '$and',
                items: [
                  {
                    path: 'username',
                    operator: '$eq',
                    value: 'grid-user',
                  },
                ],
              },
              sorting: [
                {
                  field: 'nickname',
                  direction: 'desc',
                },
              ],
              layout: 'vertical',
            },
          },
          {
            key: 'markdown',
            type: 'markdown',
            settings: {
              content: '# Users handbook',
            },
          },
          {
            key: 'iframe',
            type: 'iframe',
            settings: {
              mode: 'url',
              url: 'https://example.com/users',
              height: 360,
              allow: 'fullscreen',
            },
          },
          {
            key: 'chart',
            type: 'chart',
            settings: {
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                measures: [
                  {
                    field: 'id',
                    aggregation: 'count',
                    alias: 'employeeCount',
                  },
                ],
                dimensions: [{ field: 'status' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'status',
                  y: 'employeeCount',
                },
              },
            },
          },
          {
            key: 'panel',
            type: 'actionPanel',
            settings: {
              layout: 'list',
              ellipsis: false,
            },
          },
        ],
        layout: {
          rows: [
            ['list', 'grid'],
            ['markdown', 'iframe'],
            ['chart', 'panel'],
          ],
        },
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    expect(composed.layout.rowOrder).toEqual(['row1', 'row2', 'row3']);
    expect(composed.layout.sizes.row1).toEqual([12, 12]);
    expect(composed.layout.sizes.row2).toEqual([12, 12]);
    expect(composed.layout.sizes.row3).toEqual([12, 12]);

    const listUid = getComposeBlock(composed, 'list').uid;
    const gridUid = getComposeBlock(composed, 'grid').uid;
    const markdownUid = getComposeBlock(composed, 'markdown').uid;
    const iframeUid = getComposeBlock(composed, 'iframe').uid;
    const chartUid = getComposeBlock(composed, 'chart').uid;
    const panelUid = getComposeBlock(composed, 'panel').uid;

    const listInitial = await getSurface(rootAgent, { uid: listUid });
    expect(listInitial.tree.stepParams?.listSettings).toMatchObject({
      pageSize: {
        pageSize: 20,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'nickname',
              operator: '$eq',
              value: 'alpha',
            },
          ],
        },
      },
      defaultSorting: {
        sort: [
          {
            field: 'username',
            direction: 'asc',
          },
        ],
      },
      layout: {
        layout: 'vertical',
      },
    });

    const gridInitial = await getSurface(rootAgent, { uid: gridUid });
    expect(gridInitial.tree.stepParams?.GridCardSettings).toMatchObject({
      columnCount: {
        columnCount: {
          xs: 3,
          sm: 3,
          md: 3,
          lg: 3,
          xl: 3,
          xxl: 3,
        },
      },
      rowCount: {
        rowCount: 2,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'username',
              operator: '$eq',
              value: 'grid-user',
            },
          ],
        },
      },
      defaultSorting: {
        sort: [
          {
            field: 'nickname',
            direction: 'desc',
          },
        ],
      },
    });

    const markdownInitial = await getSurface(rootAgent, { uid: markdownUid });
    expect(markdownInitial.tree.stepParams?.markdownBlockSettings?.editMarkdown?.content).toBe('# Users handbook');

    const iframeInitial = await getSurface(rootAgent, { uid: iframeUid });
    expect(iframeInitial.tree.stepParams?.iframeBlockSettings?.editIframe).toMatchObject({
      mode: 'url',
      url: 'https://example.com/users',
      height: 360,
      allow: 'fullscreen',
    });

    const chartInitial = await getSurface(rootAgent, { uid: chartUid });
    expect(chartInitial.tree.stepParams?.chartSettings?.configure?.query?.mode).toBe('builder');

    const panelInitial = await getSurface(rootAgent, { uid: panelUid });
    expect(panelInitial.tree.stepParams?.actionPanelBlockSetting).toMatchObject({
      layout: {
        layout: 'list',
      },
      ellipsis: {
        ellipsis: false,
      },
    });

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: listUid },
            changes: {
              pageSize: 50,
              dataScope: {
                logic: '$and',
                items: [
                  {
                    path: 'nickname',
                    operator: '$eq',
                    value: 'beta',
                  },
                ],
              },
              sorting: [
                {
                  field: 'nickname',
                  direction: 'asc',
                },
              ],
              layout: 'horizontal',
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: gridUid },
            changes: {
              columns: {
                xs: 1,
                sm: 1,
                md: 2,
                lg: 4,
                xl: 4,
                xxl: 5,
              },
              rowCount: 4,
              dataScope: {
                logic: '$and',
                items: [
                  {
                    path: 'username',
                    operator: '$eq',
                    value: 'grid-updated',
                  },
                ],
              },
              sorting: [
                {
                  field: 'username',
                  direction: 'desc',
                },
              ],
              layout: 'horizontal',
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: markdownUid },
            changes: {
              content: '## Updated users handbook',
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: iframeUid },
            changes: {
              mode: 'html',
              html: '<div>Users iframe</div>',
              htmlId: 'users-iframe',
              height: 420,
            },
          },
        })
      ).status,
    ).toBe(200);

    const chartConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
        changes: {
          query: {
            mode: 'sql',
            // Keep this preview SQL cross-dialect and metadata-stable:
            // - literal row avoids relying on fixture data
            // - lowercase alias matches PG/MySQL preview alias behavior consistently
            sql: "select 'active' as status, 1 as employeecount",
            sqlDatasource: 'main',
          },
          visual: {
            mode: 'basic',
            type: 'bar',
            mappings: {
              x: 'status',
              y: 'employeecount',
            },
          },
        },
      },
    });
    expect(chartConfigureRes.status).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: panelUid },
            changes: {
              layout: 'grid',
              ellipsis: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    const listUpdated = await getSurface(rootAgent, { uid: listUid });
    expect(listUpdated.tree.stepParams?.listSettings).toMatchObject({
      pageSize: {
        pageSize: 50,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'nickname',
              operator: '$eq',
              value: 'beta',
            },
          ],
        },
      },
      defaultSorting: {
        sort: [
          {
            field: 'nickname',
            direction: 'asc',
          },
        ],
      },
      layout: {
        layout: 'horizontal',
      },
    });

    const gridUpdated = await getSurface(rootAgent, { uid: gridUid });
    expect(gridUpdated.tree.stepParams?.GridCardSettings).toMatchObject({
      columnCount: {
        columnCount: {
          xs: 1,
          sm: 1,
          md: 2,
          lg: 4,
          xl: 4,
          xxl: 5,
        },
      },
      rowCount: {
        rowCount: 4,
      },
      dataScope: {
        filter: {
          logic: '$and',
          items: [
            {
              path: 'username',
              operator: '$eq',
              value: 'grid-updated',
            },
          ],
        },
      },
      defaultSorting: {
        sort: [
          {
            field: 'username',
            direction: 'desc',
          },
        ],
      },
      layout: {
        layout: 'horizontal',
      },
    });

    const markdownUpdated = await getSurface(rootAgent, { uid: markdownUid });
    expect(markdownUpdated.tree.stepParams?.markdownBlockSettings?.editMarkdown?.content).toBe(
      '## Updated users handbook',
    );

    const iframeUpdated = await getSurface(rootAgent, { uid: iframeUid });
    expect(iframeUpdated.tree.stepParams?.iframeBlockSettings?.editIframe).toMatchObject({
      mode: 'html',
      html: '<div>Users iframe</div>',
      htmlId: 'users-iframe',
      height: 420,
    });

    const chartUpdated = await getSurface(rootAgent, { uid: chartUid });
    expect(chartUpdated.tree.stepParams?.chartSettings?.configure?.query?.mode).toBe('sql');

    const panelUpdated = await getSurface(rootAgent, { uid: panelUid });
    expect(panelUpdated.tree.stepParams?.actionPanelBlockSetting).toMatchObject({
      layout: {
        layout: 'grid',
      },
      ellipsis: {
        ellipsis: true,
      },
    });
  });

  it('should accept sort as a compatibility alias for sorting in compose and configure settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose sort alias page',
      tabTitle: 'Compose sort alias tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            settings: {
              sort: ['-createdAt', 'username'],
            },
            fields: ['username', 'nickname', 'email'],
          },
          {
            key: 'list',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            settings: {
              sort: [
                {
                  field: 'nickname',
                  direction: 'asc',
                },
              ],
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const tableUid = getComposeBlock(composed, 'table').uid;
    const listUid = getComposeBlock(composed, 'list').uid;

    const tableInitial = await getSurface(rootAgent, { uid: tableUid });
    expect(tableInitial.tree.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'createdAt',
        direction: 'desc',
      },
      {
        field: 'username',
        direction: 'asc',
      },
    ]);

    const listInitial = await getSurface(rootAgent, { uid: listUid });
    expect(listInitial.tree.stepParams?.listSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'nickname',
        direction: 'asc',
      },
    ]);

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: tableUid },
        changes: {
          sort: [
            {
              field: 'nickname',
              direction: 'desc',
            },
          ],
        },
      },
    });
    expect(configureRes.status).toBe(200);

    const tableUpdated = await getSurface(rootAgent, { uid: tableUid });
    expect(tableUpdated.tree.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'nickname',
        direction: 'desc',
      },
    ]);

    const conflictRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: tableUid },
        changes: {
          sort: ['-createdAt'],
          sorting: [
            {
              field: 'createdAt',
              direction: 'asc',
            },
          ],
        },
      },
    });
    expect(conflictRes.status).toBe(400);
    expect(readErrorMessage(conflictRes)).toContain('sort');
    expect(readErrorMessage(conflictRes)).toContain('sorting');
  });

  it('should normalize public sort direction aliases in compose and configure settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose sort direction alias page',
      tabTitle: 'Compose sort direction alias tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'table',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            settings: {
              sort: [
                {
                  field: 'createdAt',
                  direction: 'ascend',
                },
                {
                  field: 'username',
                  direction: 'descending',
                },
              ],
            },
            fields: ['username', 'nickname', 'email'],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const tableUid = getComposeBlock(getData(composeRes), 'table').uid;
    const tableInitial = await getSurface(rootAgent, { uid: tableUid });
    expect(tableInitial.tree.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'createdAt',
        direction: 'asc',
      },
      {
        field: 'username',
        direction: 'desc',
      },
    ]);

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: tableUid },
        changes: {
          sort: [
            {
              field: 'nickname',
              direction: 'descending',
            },
          ],
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const tableUpdated = await getSurface(rootAgent, { uid: tableUid });
    expect(tableUpdated.tree.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'nickname',
        direction: 'desc',
      },
    ]);
  });

  it('should default missing table and list sorting to createdAt desc in compose', async () => {
    const collectionName = await createTimestampedEmployeesCollection();
    const page = await createPage(rootAgent, {
      title: 'Compose default sorting page',
      tabTitle: 'Compose default sorting tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName,
            },
            fields: ['nickname'],
          },
          {
            key: 'employeesList',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName,
            },
            fields: ['nickname'],
          },
        ],
      },
    });

    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);
    const data = getData(composeRes);
    const tableBlock = getComposeBlock(data, 'employeesTable');
    const listBlock = getComposeBlock(data, 'employeesList');
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock.uid });
    const listReadback = await getSurface(rootAgent, { uid: listBlock.uid });

    expect(tableReadback.tree.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'createdAt',
        direction: 'desc',
      },
    ]);
    expect(listReadback.tree.stepParams?.listSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'createdAt',
        direction: 'desc',
      },
    ]);
  });

  it('should default missing list sorting to createdAt desc in addBlock', async () => {
    const collectionName = await createTimestampedEmployeesCollection();
    const page = await createPage(rootAgent, {
      title: 'Add block default sorting page',
      tabTitle: 'Add block default sorting tab',
    });

    const listBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'list',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName,
      },
    });
    const listReadback = await getSurface(rootAgent, { uid: listBlock.uid });

    expect(listReadback.tree.stepParams?.listSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'createdAt',
        direction: 'desc',
      },
    ]);
  });

  it('should not default missing sorting when the collection has no createdAt field', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose no createdAt sorting page',
      tabTitle: 'Compose no createdAt sorting tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'eventsTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'calendar_events',
            },
            fields: ['title', 'status', 'category'],
          },
        ],
      },
    });

    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);
    const tableBlock = getComposeBlock(getData(composeRes), 'eventsTable');
    const tableReadback = await getSurface(rootAgent, { uid: tableBlock.uid });

    expect(tableReadback.tree.stepParams?.tableSettings?.defaultSorting).toBeUndefined();
  });

  it('should compose update actions with assignValues settings and mirror assignedValues', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose assign values page',
      tabTitle: 'Compose assign values tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status', 'email'],
            actions: [
              {
                key: 'bulkArchive',
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
                key: 'markActive',
                type: 'updateRecord',
                settings: {
                  assignValues: {
                    status: 'active',
                  },
                  triggerWorkflows: [
                    {
                      workflowKey: 'employee_status_changed',
                      context: 'manager',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const composed = getData(composeRes);
    const tableBlock = getComposeBlock(composed, 'employeesTable');
    const bulkUpdateAction = tableBlock.actions.find((item: any) => item.type === 'bulkUpdate');
    const updateRecordAction = tableBlock.recordActions.find((item: any) => item.type === 'updateRecord');
    expect(bulkUpdateAction?.uid).toBeTruthy();
    expect(updateRecordAction?.uid).toBeTruthy();

    const bulkUpdateReadback = await getSurface(rootAgent, { uid: bulkUpdateAction.uid });
    const updateRecordReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expect(bulkUpdateReadback.tree.use).toBe('BulkUpdateActionModel');
    expect(updateRecordReadback.tree.use).toBe('UpdateRecordActionModel');
    expectAssignedValuesMirrors(bulkUpdateReadback.tree, {
      status: 'inactive',
    });
    expectAssignFormGridItems(bulkUpdateReadback.tree, {
      status: 'inactive',
    });
    expectAssignedValuesMirrors(updateRecordReadback.tree, {
      status: 'active',
    });
    expectTriggerWorkflows(updateRecordReadback.tree, 'recordTriggerWorkflowsActionSettings', [
      {
        workflowKey: 'employee_status_changed',
        context: 'manager',
      },
    ]);
    expectAssignFormGridItems(updateRecordReadback.tree, {
      status: 'active',
    });

    const bulkUpdateTriggerWorkflows = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: bulkUpdateAction.uid,
        },
        changes: {
          triggerWorkflows: [
            {
              workflowKey: 'bulk_workflow',
            },
          ],
        },
      },
    });
    expect(bulkUpdateTriggerWorkflows.status).toBe(400);
    expect(readErrorMessage(bulkUpdateTriggerWorkflows)).toContain('triggerWorkflows');

    const updateTriggerWorkflowsViaStepParams = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        stepParams: {
          recordTriggerWorkflowsActionSettings: {
            setTriggerWorkflows: {
              group: [
                {
                  workflowKey: 'employee_status_reviewed',
                },
                {
                  workflowKey: 'employee_department_changed',
                  context: 'department',
                },
              ],
            },
          },
        },
      },
    });
    expect(updateTriggerWorkflowsViaStepParams.status, readErrorMessage(updateTriggerWorkflowsViaStepParams)).toBe(200);

    const updateRecordTriggerWorkflowsReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expectTriggerWorkflows(updateRecordTriggerWorkflowsReadback.tree, 'recordTriggerWorkflowsActionSettings', [
      {
        workflowKey: 'employee_status_reviewed',
      },
      {
        workflowKey: 'employee_department_changed',
        context: 'department',
      },
    ]);

    const invalidTriggerWorkflowsViaStepParams = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        stepParams: {
          recordTriggerWorkflowsActionSettings: {
            setTriggerWorkflows: {
              group: [
                {
                  workflowKey: '',
                },
              ],
            },
          },
        },
      },
    });
    expect(invalidTriggerWorkflowsViaStepParams.status).toBe(400);
    expect(readErrorMessage(invalidTriggerWorkflowsViaStepParams)).toContain('workflowKey');

    const clearTriggerWorkflowsViaStepParams = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        stepParams: {
          recordTriggerWorkflowsActionSettings: {
            setTriggerWorkflows: {
              group: [],
            },
          },
        },
      },
    });
    expect(clearTriggerWorkflowsViaStepParams.status, readErrorMessage(clearTriggerWorkflowsViaStepParams)).toBe(200);
    const updateRecordTriggerWorkflowsCleared = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expectTriggerWorkflows(updateRecordTriggerWorkflowsCleared.tree, 'recordTriggerWorkflowsActionSettings', []);

    const updateViaAssignSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        stepParams: {
          assignSettings: {
            assignFieldValues: {
              assignedValues: {
                nickname: 'VIP',
                status: 'inactive',
              },
            },
          },
        },
      },
    });
    expect(updateViaAssignSettings.status, readErrorMessage(updateViaAssignSettings)).toBe(200);

    const updateRecordAssignSettingsReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expectAssignedValuesMirrors(updateRecordAssignSettingsReadback.tree, {
      nickname: 'VIP',
      status: 'inactive',
    });
    expectAssignFormGridItems(updateRecordAssignSettingsReadback.tree, {
      nickname: 'VIP',
      status: 'inactive',
    });

    const updateViaPartialAssignSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        stepParams: {
          assignSettings: {
            assignFieldValues: {
              assignedValues: {
                status: 'pending',
              },
            },
          },
        },
      },
    });
    expect(updateViaPartialAssignSettings.status, readErrorMessage(updateViaPartialAssignSettings)).toBe(200);

    const updateRecordPartialReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expectAssignedValuesMirrors(updateRecordPartialReadback.tree, {
      nickname: 'VIP',
      status: 'pending',
    });
    expectAssignFormGridItems(updateRecordPartialReadback.tree, {
      nickname: 'VIP',
      status: 'pending',
    });

    const statusAssignItem = findAssignFormGridItem(updateRecordPartialReadback.tree, 'status');
    expect(statusAssignItem?.uid).toBeTruthy();
    expect(statusAssignItem?.subModels?.field?.uid).toBeTruthy();
    await flowRepo.patch({
      uid: statusAssignItem.uid,
      stepParams: _.merge({}, statusAssignItem.stepParams || {}, {
        editItemSettings: {
          marker: 'preserve-item-settings',
        },
      }),
    });
    await flowRepo.patch({
      uid: statusAssignItem.subModels.field.uid,
      stepParams: _.merge({}, statusAssignItem.subModels.field.stepParams || {}, {
        preservedFieldSettings: {
          marker: 'preserve-field-settings',
        },
      }),
    });

    const updatePreservedItem = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        stepParams: {
          assignSettings: {
            assignFieldValues: {
              assignedValues: {
                status: 'reviewed',
              },
            },
          },
        },
      },
    });
    expect(updatePreservedItem.status, readErrorMessage(updatePreservedItem)).toBe(200);

    const updateRecordPreservedReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expectAssignedValuesMirrors(updateRecordPreservedReadback.tree, {
      nickname: 'VIP',
      status: 'reviewed',
    });
    expectAssignFormGridItems(updateRecordPreservedReadback.tree, {
      nickname: 'VIP',
      status: 'reviewed',
    });
    const preservedStatusItem = findAssignFormGridItem(updateRecordPreservedReadback.tree, 'status');
    expect(preservedStatusItem?.stepParams?.editItemSettings).toEqual({
      marker: 'preserve-item-settings',
    });
    expect(preservedStatusItem?.subModels?.field?.stepParams?.preservedFieldSettings).toEqual({
      marker: 'preserve-field-settings',
    });

    const updateViaApplyMirror = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: bulkUpdateAction.uid,
        },
        stepParams: {
          apply: {
            apply: {
              assignedValues: {
                status: 'archived',
              },
            },
          },
        },
      },
    });
    expect(updateViaApplyMirror.status, readErrorMessage(updateViaApplyMirror)).toBe(200);

    const bulkUpdateApplyReadback = await getSurface(rootAgent, { uid: bulkUpdateAction.uid });
    expectAssignedValuesMirrors(bulkUpdateApplyReadback.tree, {
      status: 'archived',
    });
    expectAssignFormGridItems(bulkUpdateApplyReadback.tree, {
      status: 'archived',
    });

    const conflictingAssignedValues = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        stepParams: {
          assignSettings: {
            assignFieldValues: {
              assignedValues: {
                status: 'active',
              },
            },
          },
          apply: {
            apply: {
              assignedValues: {
                status: 'inactive',
              },
            },
          },
        },
      },
    });
    expect(conflictingAssignedValues.status).toBe(400);
    expect(readErrorMessage(conflictingAssignedValues)).toContain('assignedValues');

    const clearAssignedValues = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        stepParams: {
          assignSettings: {
            assignFieldValues: {
              assignedValues: {},
            },
          },
        },
      },
    });
    expect(clearAssignedValues.status, readErrorMessage(clearAssignedValues)).toBe(200);

    const updateRecordClearedReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expectAssignedValuesMirrors(updateRecordClearedReadback.tree, {});
    expectAssignFormGridItems(updateRecordClearedReadback.tree, {});
  });

  it('should reject partial responsive grid card columns in simple configure', async () => {
    const page = await createPage(rootAgent, {
      title: 'Configure grid card columns validation',
      tabTitle: 'Configure grid card columns validation',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'grid',
            type: 'gridCard',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
            fields: ['username', 'nickname', 'email'],
            settings: {
              columns: 3,
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const gridUid = getComposeBlock(composed, 'grid').uid;
    expect(gridUid).toBeTruthy();

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: gridUid },
        changes: {
          columns: {
            xs: 1,
            md: 2,
            lg: 3,
          },
        },
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('must include xs, sm, md, lg, xl, xxl');
    expect(response.body.errors?.[0]?.details?.missingBreakpoints).toEqual(['sm', 'xl', 'xxl']);
  });

  it('should configure richer field and action semantics with simple changes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Configure rich page',
      tabTitle: 'Configure rich tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'form',
              type: 'createForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'flow_surface_profiles',
              },
              fields: ['bio'],
              actions: ['submit'],
            },
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['nickname', 'manager'],
              actions: ['refresh'],
              recordActions: ['updateRecord'],
            },
          ],
        },
      }),
    );

    const formBlock = composeRes.blocks.find((item: any) => item.key === 'form');
    const tableBlock = composeRes.blocks.find((item: any) => item.key === 'table');
    const formField = formBlock.fields.find((item: any) => item.fieldPath === 'bio');
    const formSubmitAction = formBlock.actions.find((item: any) => item.type === 'submit');
    const tableField = tableBlock.fields.find((item: any) => item.fieldPath === 'manager');
    const updateRecordAction = tableBlock.recordActions.find((item: any) => item.type === 'updateRecord');

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: formField.wrapperUid },
            changes: {
              label: 'Biography',
              initialValue: 'n/a',
              required: true,
              labelWidth: 180,
              labelWrap: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: formField.fieldUid },
            changes: {
              title: 'Biography field',
              icon: 'EditOutlined',
              autoSize: {
                minRows: 2,
                maxRows: 6,
              },
              allowClear: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: formSubmitAction.uid },
            changes: {
              title: 'Save profile',
              tooltip: 'Submit the create form',
              type: 'primary',
              color: 'blue',
              htmlType: 'submit',
              position: 'right',
              confirm: {
                enable: true,
                title: 'Confirm submit',
                content: 'Save this record now?',
              },
              triggerWorkflows: [
                {
                  workflowKey: 'profile_created',
                },
              ],
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: tableField.wrapperUid },
            changes: {
              title: 'Employee manager',
              width: 280,
              fixed: 'left',
              editable: true,
              dataIndex: 'manager',
              titleField: 'nickname',
            },
          },
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: updateRecordAction.uid },
            changes: {
              title: 'Quick update',
              type: 'primary',
              color: 'gold',
              htmlType: 'button',
              position: 'end',
              confirm: {
                enable: true,
                title: 'Confirm update',
                content: 'Apply assigned values?',
              },
              assignValues: {
                status: 'active',
              },
              triggerWorkflows: [
                {
                  workflowKey: 'employee_status_changed',
                  context: 'manager',
                },
              ],
            },
          },
        })
      ).status,
    ).toBe(200);

    const formWrapperReadback = await getSurface(rootAgent, { uid: formField.wrapperUid });
    expect(formWrapperReadback.tree.props).toMatchObject({
      label: 'Biography',
      initialValue: 'n/a',
      required: true,
    });
    expect(formWrapperReadback.tree.decoratorProps).toMatchObject({
      labelWidth: 180,
      labelWrap: true,
    });

    const formFieldReadback = await getSurface(rootAgent, { uid: formField.fieldUid });
    expect(formFieldReadback.tree.props).toMatchObject({
      title: 'Biography field',
      icon: 'EditOutlined',
      autoSize: {
        minRows: 2,
        maxRows: 6,
      },
      allowClear: true,
    });

    const formActionReadback = await getSurface(rootAgent, { uid: formSubmitAction.uid });
    expect(formActionReadback.tree.props).toMatchObject({
      title: 'Save profile',
      tooltip: 'Submit the create form',
      type: 'primary',
      color: 'blue',
      htmlType: 'submit',
      position: 'right',
    });
    expect(formActionReadback.tree.stepParams?.submitSettings?.confirm).toMatchObject({
      enable: true,
      title: 'Confirm submit',
      content: 'Save this record now?',
    });
    expectTriggerWorkflows(formActionReadback.tree, 'formTriggerWorkflowsActionSettings', [
      {
        workflowKey: 'profile_created',
      },
    ]);

    const tableWrapperReadback = await getSurface(rootAgent, { uid: tableField.wrapperUid });
    expect(tableWrapperReadback.tree.props).toMatchObject({
      title: 'Employee manager',
      width: 280,
      fixed: 'left',
      editable: true,
      dataIndex: 'manager',
      titleField: 'nickname',
    });
    expect(tableWrapperReadback.tree.stepParams?.tableColumnSettings?.title?.title).toBe('Employee manager');

    const updateActionReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expect(updateActionReadback.tree.props).toMatchObject({
      title: 'Quick update',
      type: 'primary',
      color: 'gold',
      htmlType: 'button',
      position: 'end',
    });
    expect(updateActionReadback.tree.stepParams?.assignSettings).toMatchObject({
      confirm: {
        enable: true,
        title: 'Confirm update',
        content: 'Apply assigned values?',
      },
      assignFieldValues: {
        assignedValues: {
          status: 'active',
        },
      },
    });
    expect(updateActionReadback.tree.stepParams?.apply?.apply?.assignedValues).toMatchObject({
      status: 'active',
    });
    expectTriggerWorkflows(updateActionReadback.tree, 'recordTriggerWorkflowsActionSettings', [
      {
        workflowKey: 'employee_status_changed',
        context: 'manager',
      },
    ]);
    expectAssignFormGridItems(updateActionReadback.tree, {
      status: 'active',
    });

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: formSubmitAction.uid },
            changes: {
              triggerWorkflows: [],
            },
          },
        })
      ).status,
    ).toBe(200);

    const formActionClearedReadback = await getSurface(rootAgent, { uid: formSubmitAction.uid });
    expectTriggerWorkflows(formActionClearedReadback.tree, 'formTriggerWorkflowsActionSettings', []);

    const invalidFormActionTriggerWorkflows = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: formSubmitAction.uid },
        changes: {
          triggerWorkflows: null,
        },
      },
    });
    expect(invalidFormActionTriggerWorkflows.status).toBe(400);
    expect(readErrorMessage(invalidFormActionTriggerWorkflows)).toContain('triggerWorkflows');

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: { uid: updateRecordAction.uid },
            changes: {
              assignValues: {},
            },
          },
        })
      ).status,
    ).toBe(200);

    const updateActionClearedReadback = await getSurface(rootAgent, { uid: updateRecordAction.uid });
    expectAssignedValuesMirrors(updateActionClearedReadback.tree, {});
    expectAssignFormGridItems(updateActionClearedReadback.tree, {});
  });
});
