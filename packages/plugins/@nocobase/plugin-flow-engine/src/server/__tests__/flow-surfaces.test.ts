/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Repository } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import _ from 'lodash';
import FlowModelRepository from '../repository';
import { FlowSurfacesService } from '../flow-surfaces/service';
import { createFlowSurfaceFixture, listFixtureAliases } from './flow-surfaces.fixtures';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

const FLOW_SURFACES_TEMPLATE_ENABLED_TEST_PLUGINS = [...FLOW_SURFACES_TEST_PLUGINS, 'ui-templates'] as const;
const FLOW_SURFACES_TEMPLATE_ENABLED_TEST_PLUGIN_INSTALLS = [
  ...FLOW_SURFACES_TEST_PLUGIN_INSTALLS,
  'ui-templates',
] as const;

describe('flowSurfaces resource', () => {
  let app: MockServer;
  let db: Database;
  let flowRepo: FlowModelRepository;
  let routesRepo: Repository;
  let rootAgent: any;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer({
      plugins: FLOW_SURFACES_TEMPLATE_ENABLED_TEST_PLUGIN_INSTALLS as any,
      enabledPluginAliases: FLOW_SURFACES_TEMPLATE_ENABLED_TEST_PLUGINS,
    });
    db = app.db;
    flowRepo = db.getCollection('flowModels').repository as FlowModelRepository;
    routesRepo = db.getRepository('desktopRoutes');
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupFixtureCollections(rootAgent, db);
  }, 120000);

  beforeEach(async () => {
    rootAgent = await loginFlowSurfacesRootAgent(app);
  });

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should sync tab move and settings writes back to route and readback', async () => {
    const created = await createPage(rootAgent, {
      title: 'Employees page',
      tabTitle: 'Main tab',
    });

    const addedTab = await getData(
      await rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: { uid: created.pageUid },
          title: 'Secondary tab',
          documentTitle: 'Secondary browser title',
        },
      }),
    );
    expect(addedTab.tabSchemaUid).toBeTruthy();

    const moveTabRes = await rootAgent.resource('flowSurfaces').moveTab({
      values: {
        sourceUid: addedTab.tabSchemaUid,
        targetUid: created.tabSchemaUid,
        position: 'before',
      },
    });
    expect(moveTabRes.status).toBe(200);

    await rootAgent.resource('flowSurfaces').updateTab({
      values: {
        target: { uid: addedTab.tabSchemaUid },
        title: 'Secondary tab updated',
        icon: 'AppstoreOutlined',
        documentTitle: 'Updated browser title',
      },
    });

    const updatedTabRoute = await routesRepo.findOne({
      filter: {
        schemaUid: addedTab.tabSchemaUid,
      },
    });
    expect(updatedTabRoute?.get('title')).toBe('Secondary tab updated');
    expect(updatedTabRoute?.get('icon')).toBe('AppstoreOutlined');
    expect(updatedTabRoute?.get('options').documentTitle).toBe('Updated browser title');

    const tabReadback = await getSurface(rootAgent, {
      tabSchemaUid: addedTab.tabSchemaUid,
    });
    expect(tabReadback.tree.use).toBe('RootPageTabModel');
    expect(tabReadback.tree.stepParams?.pageTabSettings?.tab).toMatchObject({
      title: 'Secondary tab updated',
      icon: 'AppstoreOutlined',
      documentTitle: 'Updated browser title',
    });

    await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: addedTab.tabSchemaUid },
        props: {
          title: 'Secondary tab via settings',
          icon: 'SettingOutlined',
        },
        stepParams: {
          pageTabSettings: {
            tab: {
              title: 'Secondary tab via settings',
              icon: 'SettingOutlined',
              documentTitle: 'Settings browser title',
            },
          },
        },
      },
    });

    const tabRouteAfterSettings = await routesRepo.findOne({
      filter: {
        schemaUid: addedTab.tabSchemaUid,
      },
    });
    expect(tabRouteAfterSettings?.get('title')).toBe('Secondary tab via settings');
    expect(tabRouteAfterSettings?.get('icon')).toBe('SettingOutlined');
    expect(tabRouteAfterSettings?.get('options').documentTitle).toBe('Settings browser title');
    const tabReadbackAfterSettings = await getSurface(rootAgent, {
      tabSchemaUid: addedTab.tabSchemaUid,
    });
    expect(tabReadbackAfterSettings.tree.props).toMatchObject({
      title: 'Secondary tab via settings',
      icon: 'SettingOutlined',
    });
    expect(tabReadbackAfterSettings.tree.stepParams?.pageTabSettings?.tab).toMatchObject({
      title: 'Secondary tab via settings',
      icon: 'SettingOutlined',
      documentTitle: 'Settings browser title',
    });

    const readback = await getSurface(rootAgent, {
      pageSchemaUid: created.pageSchemaUid,
    });
    const routeBackedTabs = getRouteBackedTabs(readback);
    expect(routeBackedTabs).toHaveLength(2);
    expect(routeBackedTabs[0].uid).toBe(addedTab.tabSchemaUid);
    expect(routeBackedTabs[1].uid).toBe(created.tabSchemaUid);

    const removeTabRes = await rootAgent.resource('flowSurfaces').removeTab({
      values: {
        uid: addedTab.tabSchemaUid,
      },
    });
    expect(removeTabRes.status).toBe(200);

    const destroyPageRes = await rootAgent.resource('flowSurfaces').destroyPage({
      values: {
        uid: created.pageUid,
      },
    });
    expect(destroyPageRes.status).toBe(200);
  });

  it('should recover popup surfaces after removing the last popup child tab', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup tabs page',
      tabTitle: 'Popup tabs tab',
    });
    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const popupAction = await addRecordAction(rootAgent, tableUid, 'view', {
      popup: {
        mode: 'replace',
        blocks: [
          {
            key: 'details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname'],
          },
        ],
      },
    });

    expect(popupAction.popupPageUid).toBeTruthy();
    expect(popupAction.popupTabUid).toBeTruthy();
    expect(popupAction.popupGridUid).toBeTruthy();

    const removeLastTabRes = await rootAgent.resource('flowSurfaces').removePopupTab({
      values: {
        target: {
          uid: popupAction.popupTabUid,
        },
      },
    });
    expect(removeLastTabRes.status).toBe(200);

    const popupHostAfterRemoveAll = await getSurface(rootAgent, {
      uid: popupAction.uid,
    });
    const popupPageAfterRemoveAll = popupHostAfterRemoveAll.tree.subModels?.page;
    expect(popupPageAfterRemoveAll?.uid).toBe(popupAction.popupPageUid);
    expect(popupPageAfterRemoveAll?.use).toBe('ChildPageModel');
    expect(_.castArray(popupPageAfterRemoveAll?.subModels?.tabs || [])).toHaveLength(0);

    const recoveredPopupBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: popupAction.uid,
          },
          type: 'markdown',
          settings: {
            content: 'Recovered popup body',
          },
        },
      }),
    );
    expect(recoveredPopupBlock.popupPageUid).toBe(popupAction.popupPageUid);
    expect(recoveredPopupBlock.popupTabUid).toBeTruthy();
    expect(recoveredPopupBlock.popupGridUid).toBeTruthy();

    const popupHostAfterRecovery = await getSurface(rootAgent, {
      uid: popupAction.uid,
    });
    const recoveredPopupPage = popupHostAfterRecovery.tree.subModels?.page;
    const recoveredTabs = _.castArray(recoveredPopupPage?.subModels?.tabs || []);
    const recoveredGridItems = _.castArray(recoveredTabs[0]?.subModels?.grid?.subModels?.items || []);
    expect(recoveredPopupPage?.uid).toBe(popupAction.popupPageUid);
    expect(recoveredTabs).toHaveLength(1);
    expect(recoveredTabs[0]?.uid).toBe(recoveredPopupBlock.popupTabUid);
    expect(recoveredGridItems).toHaveLength(1);
    expect(recoveredGridItems[0]).toMatchObject({
      use: 'MarkdownBlockModel',
      props: {
        content: 'Recovered popup body',
      },
    });
  });

  it('should sync page settings updates back to desktop route state', async () => {
    const created = await createPage(rootAgent, {
      title: 'Settings page',
      tabTitle: 'Settings tab',
      enableTabs: true,
    });

    await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: created.pageUid },
        props: {
          title: 'Settings page updated',
          enableTabs: false,
          displayTitle: false,
        },
        stepParams: {
          pageSettings: {
            general: {
              title: 'Settings page updated',
              documentTitle: 'Page-level browser title',
              displayTitle: false,
              enableTabs: false,
            },
          },
        },
      },
    });

    const pageRoute = await routesRepo.findOne({
      filter: {
        schemaUid: created.pageSchemaUid,
      },
      appends: ['children'],
    });
    expect(pageRoute?.get('title')).toBe('Settings page updated');
    expect(pageRoute?.get('enableTabs')).toBe(false);
    expect(pageRoute?.get('displayTitle')).toBe(false);
    expect(pageRoute?.get('options')?.documentTitle).toBeUndefined();
    expect(_.castArray(pageRoute?.get('children') || [])[0]?.get?.('hidden')).toBe(true);

    const readback = await getSurface(rootAgent, {
      pageSchemaUid: created.pageSchemaUid,
    });
    expect(readback.tree.props).toMatchObject({
      title: 'Settings page updated',
      enableTabs: false,
      displayTitle: false,
    });
    expect(readback.tree.stepParams?.pageSettings?.general).toMatchObject({
      title: 'Settings page updated',
      documentTitle: 'Page-level browser title',
      displayTitle: false,
      enableTabs: false,
    });
    expect(readback.pageRoute.title).toBe('Settings page updated');
    expect(readback.pageRoute.displayTitle).toBe(false);
  });

  it('should sync tab flowRegistry back to both route state and synthetic RootPageTabModel readback', async () => {
    const created = await createPage(rootAgent, {
      title: 'Tab flow registry page',
      tabTitle: 'Registry tab',
    });

    const setFlows = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: { uid: created.tabSchemaUid },
        flowRegistry: {
          tabBeforeRender: {
            key: 'tabBeforeRender',
            on: 'beforeRender',
            steps: {},
          },
        },
      },
    });
    expect(setFlows.status).toBe(200);

    const updatedTabRoute = await routesRepo.findOne({
      filter: {
        schemaUid: created.tabSchemaUid,
      },
    });
    expect(updatedTabRoute?.get('options')?.flowRegistry).toMatchObject({
      tabBeforeRender: {
        key: 'tabBeforeRender',
      },
    });

    const tabReadback = await getSurface(rootAgent, {
      tabSchemaUid: created.tabSchemaUid,
    });
    expect(tabReadback.tree.use).toBe('RootPageTabModel');
    expect(tabReadback.tree.flowRegistry).toMatchObject({
      tabBeforeRender: {
        key: 'tabBeforeRender',
      },
    });

    const readback = await getSurface(rootAgent, {
      tabSchemaUid: created.tabSchemaUid,
    });
    expect(readback.tree.flowRegistry).toMatchObject({
      tabBeforeRender: {
        key: 'tabBeforeRender',
      },
    });
  });

  it('should expose representative catalog entries and settings contracts for page and table contexts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Catalog page',
      tabTitle: 'Catalog tab',
    });
    const catalogExpand = ['item.configureOptions', 'node.contracts'];

    const tabCatalog = await getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          expand: catalogExpand,
        },
      }),
    );
    expect(tabCatalog.blocks.map((item: any) => item.use)).toEqual(
      expect.arrayContaining(['TableBlockModel', 'ListBlockModel', 'ChartBlockModel', 'ActionPanelBlockModel']),
    );
    expect(tabCatalog.blocks.find((item: any) => item.use === 'FormBlockModel')).toBeUndefined();
    expect(tabCatalog.blocks.find((item: any) => item.use === 'MapBlockModel')?.createSupported).toBe(false);
    expect(tabCatalog.blocks.find((item: any) => item.use === 'CommentsBlockModel')?.createSupported).toBe(false);
    expect(tabCatalog.node.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      icon: {
        type: 'string',
      },
      documentTitle: {
        type: 'string',
      },
    });
    expect(tabCatalog.node.settingsContract?.stepParams?.groups?.pageTabSettings?.allowedPaths).toEqual(
      expect.arrayContaining(['tab.title', 'tab.icon', 'tab.documentTitle']),
    );

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const tableCatalog = await getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableBlockUid,
          },
          expand: catalogExpand,
        },
      }),
    );
    expect(tableCatalog.blocks).toBeUndefined();
    expect(tableCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['addNew', 'refresh', 'bulkDelete', 'js']),
    );
    expect(tableCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['view', 'edit', 'delete', 'js']),
    );
    expect(tableCatalog.fields.some((item: any) => item.key === 'nickname')).toBe(true);
    expect(tableCatalog.fields.some((item: any) => item.key === 'department.title')).toBe(true);
    expect(tableCatalog.fields.some((item: any) => item.key === 'skills.label')).toBe(false);
    expect(tableCatalog.fields.find((item: any) => item.key === 'nickname')?.configureOptions).toMatchObject({
      label: {
        type: 'string',
      },
      clickToOpen: {
        type: 'boolean',
      },
    });
    expect(tableCatalog.node.settingsContract?.stepParams?.groups?.resourceSettings?.allowedPaths).toEqual(
      expect.arrayContaining(['init.dataSourceKey', 'init.collectionName']),
    );
    expect(tableCatalog.node.settingsContract?.stepParams?.groups?.tableSettings?.allowedPaths).toEqual(
      expect.arrayContaining(['pageSize.pageSize', 'dataScope.filter', 'dragSort.dragSort']),
    );
    expect(
      tableCatalog.node.settingsContract?.stepParams?.groups?.tableSettings?.pathSchemas?.['dataScope.filter'],
    ).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['logic', 'items']),
      'x-flowSurfaceFormat': 'filter-group',
    });
  });

  it('should expose association-specific popup resourceBindings for association popup surfaces', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup resource catalog page',
      tabTitle: 'Popup resource catalog tab',
    });
    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const associationPopupAction = await addAction(rootAgent, tableUid, 'popup');
    const associationPopupConfig = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: associationPopupAction.uid,
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
    expect(associationPopupConfig.status).toBe(200);

    const associationPopupCatalog = await getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: associationPopupAction.uid,
          },
        },
      }),
    );
    const associationPopupTableBindings =
      associationPopupCatalog.blocks.find((item: any) => item.use === 'TableBlockModel')?.resourceBindings || [];
    expect(associationPopupTableBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['associatedRecords', 'otherRecords']),
    );
    expect(associationPopupTableBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection', 'currentRecord']),
    );
    expect(
      associationPopupTableBindings.find((item: any) => item.key === 'associatedRecords')?.associationFields,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'employee' })]));
  });

  it('should compose meaningful popup blocks and reject current-record blocks on plain popup surfaces', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup compose resource page',
      tabTitle: 'Popup compose resource tab',
    });
    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const recordPopupAction = await addRecordAction(rootAgent, tableUid, 'view');
    const recordPopupCompose = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: recordPopupAction.uid,
        },
        mode: 'replace',
        blocks: [
          {
            key: 'details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname', 'department.title'],
          },
        ],
      },
    });
    expect(recordPopupCompose.status).toBe(200);

    const recordPopupSurface = await getSurface(rootAgent, {
      uid: recordPopupAction.uid,
    });
    const recordPopupBlock = _.castArray(
      recordPopupSurface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(recordPopupBlock.use).toBe('DetailsBlockModel');
    expect(recordPopupBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });

    const recordScopedPopupAction = await addRecordAction(rootAgent, tableUid, 'popup');
    const recordScopedPopupCompose = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: recordScopedPopupAction.uid,
        },
        mode: 'replace',
        blocks: [
          {
            key: 'details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname'],
          },
        ],
      },
    });
    expect(recordScopedPopupCompose.status).toBe(200);

    const recordScopedPopupSurface = await getSurface(rootAgent, {
      uid: recordScopedPopupAction.uid,
    });
    const recordScopedPopupBlock = _.castArray(
      recordScopedPopupSurface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(recordScopedPopupBlock.use).toBe('DetailsBlockModel');
    expect(recordScopedPopupBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });

    const plainPopupAction = await addAction(rootAgent, tableUid, 'popup');
    const plainPopupCompose = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: plainPopupAction.uid,
        },
        mode: 'replace',
        blocks: [
          {
            key: 'details',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['nickname'],
          },
        ],
      },
    });
    expect(plainPopupCompose.status).toBe(400);
    expect(readErrorMessage(plainPopupCompose)).toContain('plain popup');
    expect(readErrorMessage(plainPopupCompose)).toContain('inspect catalog.blocks first');
  });

  it('should align popup addBlock semantic and raw resource validation with popup block semantics', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup addBlock resource page',
      tabTitle: 'Popup addBlock resource tab',
    });
    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const associationPopupAction = await addAction(rootAgent, tableUid, 'popup');
    const associationPopupConfig = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: associationPopupAction.uid,
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
    expect(associationPopupConfig.status).toBe(200);

    const semanticAdd = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: associationPopupAction.uid,
        },
        type: 'table',
        resource: {
          binding: 'associatedRecords',
          associationField: 'employee',
        },
      },
    });
    expect(semanticAdd.status).toBe(200);

    const semanticListAdd = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: associationPopupAction.uid,
        },
        type: 'list',
        resource: {
          binding: 'associatedRecords',
          associationField: 'employee',
        },
      },
    });
    expect(semanticListAdd.status).toBe(200);

    const invalidAssociationCurrentCollectionRaw = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: associationPopupAction.uid,
        },
        type: 'createForm',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
          associationName: 'tasks',
          sourceId: '{{ctx.custom.badSourceId}}',
        },
      },
    });
    expect(invalidAssociationCurrentCollectionRaw.status).toBe(400);
    expect(readErrorMessage(invalidAssociationCurrentCollectionRaw)).toContain(
      `resourceInit does not match popup binding 'currentCollection'`,
    );

    const invalidAssociationCurrentRecordRaw = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: associationPopupAction.uid,
        },
        type: 'details',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
          filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
          associationName: 'tasks',
          sourceId: '{{ctx.custom.badSourceId}}',
        },
      },
    });
    expect(invalidAssociationCurrentRecordRaw.status).toBe(400);
    expect(readErrorMessage(invalidAssociationCurrentRecordRaw)).toContain(
      `resourceInit does not match popup binding 'currentRecord'`,
    );

    const associationPopupSurface = await getSurface(rootAgent, {
      uid: associationPopupAction.uid,
    });
    const associationPopupBlocks = _.castArray(
      associationPopupSurface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    );
    const associationPopupBlock = associationPopupBlocks[0];
    const semanticAssociationPopupBlock = associationPopupBlocks[1];
    expect(associationPopupBlock.use).toBe('TableBlockModel');
    expect(associationPopupBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      associationName: 'tasks.employee',
      sourceId: '{{ctx.popup.record.employeeId}}',
    });
    expect(semanticAssociationPopupBlock.use).toBe('ListBlockModel');
    expect(semanticAssociationPopupBlock.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      associationName: 'tasks.employee',
      sourceId: '{{ctx.popup.record.employeeId}}',
    });

    const recordPopupAction = await addRecordAction(rootAgent, tableUid, 'view');
    const invalidRaw = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: recordPopupAction.uid,
        },
        type: 'details',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      },
    });
    expect(invalidRaw.status).toBe(400);
    expect(readErrorMessage(invalidRaw)).toContain(`resourceInit binding 'currentCollection'`);
    expect(readErrorMessage(invalidRaw)).toContain('supported bindings:');
    expect(readErrorMessage(invalidRaw)).toContain('currentRecord');
  });

  it('should support explicit otherRecords dataSourceKey on plain popup surfaces', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup block scene page',
      tabTitle: 'Popup block scene tab',
    });
    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const plainPopupAction = await addAction(rootAgent, tableUid, 'popup');
    const otherRecordsBlock = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: plainPopupAction.uid,
        },
        type: 'table',
        resource: {
          binding: 'otherRecords',
          dataSourceKey: 'main',
          collectionName: 'departments',
        },
      },
    });
    expect(otherRecordsBlock.status).toBe(200);

    const plainPopupSurface = await getSurface(rootAgent, {
      uid: plainPopupAction.uid,
    });
    const otherRecordsTable = _.castArray(
      plainPopupSurface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(otherRecordsTable.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'departments',
    });
  });

  it('should enforce grouped path-level contracts for public core collection blocks', async () => {
    const page = await createPage(rootAgent, {
      title: 'Core block contract page',
      tabTitle: 'Core block contract tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const createFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const editFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'editForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const filterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const validTableSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: tableUid,
        },
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
          },
          tableSettings: {
            quickEdit: {
              editable: true,
            },
            dataScope: {
              filter: {
                logic: '$and',
                items: [],
              },
            },
            defaultSorting: {
              sort: [],
            },
          },
        },
      },
    });
    expect(validTableSettings.status).toBe(200);

    const invalidTableSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: tableUid,
        },
        stepParams: {
          tableSettings: {
            dataScope: {
              unsupported: true,
            },
          },
        },
      },
    });
    expect(invalidTableSettings.status).toBe(400);
    const tableReadback = await getSurface(rootAgent, {
      uid: tableUid,
    });
    expect(tableReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    expect(tableReadback.tree.stepParams?.tableSettings?.quickEdit).toMatchObject({
      editable: true,
    });

    const validCreateFormSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: createFormUid,
        },
        stepParams: {
          formModelSettings: {
            layout: {
              layout: 'horizontal',
              labelAlign: 'right',
              labelWidth: 160,
              labelWrap: false,
              colon: false,
            },
            assignRules: {
              value: [],
            },
          },
          eventSettings: {
            linkageRules: {
              value: [],
            },
          },
        },
      },
    });
    expect(validCreateFormSettings.status).toBe(200);

    const invalidCreateFormLayout = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: createFormUid,
        },
        stepParams: {
          formModelSettings: {
            layout: {
              unsupported: true,
            },
          },
        },
      },
    });
    expect(invalidCreateFormLayout.status).toBe(400);

    const invalidCreateFormEventOnlyGroup = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: createFormUid,
        },
        stepParams: {
          formSettings: {
            init: {
              collectionName: 'employees',
            },
          },
        },
      },
    });
    expect(invalidCreateFormEventOnlyGroup.status).toBe(400);
    const createFormReadback = await getSurface(rootAgent, {
      uid: createFormUid,
    });
    expect(createFormReadback.tree.stepParams?.formModelSettings?.layout).toMatchObject({
      layout: 'horizontal',
      labelAlign: 'right',
      labelWidth: 160,
      labelWrap: false,
      colon: false,
    });
    expect(createFormReadback.tree.stepParams?.eventSettings?.linkageRules).toMatchObject({
      value: [],
    });

    const validEditFormSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: editFormUid,
        },
        stepParams: {
          formSettings: {
            dataScope: {
              filter: {
                logic: '$and',
                items: [],
              },
            },
          },
        },
      },
    });
    expect(validEditFormSettings.status).toBe(200);

    const invalidEditFormSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: editFormUid,
        },
        stepParams: {
          formSettings: {
            dataScope: {
              unsupported: true,
            },
          },
        },
      },
    });
    expect(invalidEditFormSettings.status).toBe(400);

    const validDetailsSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: detailsUid,
        },
        stepParams: {
          detailsSettings: {
            dataScope: {
              filter: {
                logic: '$and',
                items: [],
              },
            },
            defaultSorting: {
              sort: [],
            },
            linkageRules: {
              value: [],
            },
          },
        },
      },
    });
    expect(validDetailsSettings.status).toBe(200);

    const invalidDetailsSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: detailsUid,
        },
        stepParams: {
          detailsSettings: {
            defaultSorting: {
              unsupported: true,
            },
          },
        },
      },
    });
    expect(invalidDetailsSettings.status).toBe(400);

    const validFilterFormSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: filterFormUid,
        },
        stepParams: {
          formFilterBlockModelSettings: {
            defaultValues: {
              value: [],
            },
          },
        },
      },
    });
    expect(validFilterFormSettings.status).toBe(200);

    const invalidFilterFormSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: filterFormUid,
        },
        stepParams: {
          formFilterBlockModelSettings: {
            defaultValues: {
              unsupported: [],
            },
          },
        },
      },
    });
    expect(invalidFilterFormSettings.status).toBe(400);
    const filterFormReadback = await getSurface(rootAgent, {
      uid: filterFormUid,
    });
    expect(filterFormReadback.tree.stepParams?.formFilterBlockModelSettings?.defaultValues).toMatchObject({
      value: [],
    });
  });

  it('should support the first-batch formal built-in blocks through addBlock and get', async () => {
    const page = await createPage(rootAgent, {
      title: 'Supported blocks page',
      tabTitle: 'Supported blocks tab',
    });

    const blockCases = [
      {
        type: 'list',
        expectedUse: 'ListBlockModel',
        resourceInit: { dataSourceKey: 'main', collectionName: 'employees' },
      },
      {
        type: 'gridCard',
        expectedUse: 'GridCardBlockModel',
        resourceInit: { dataSourceKey: 'main', collectionName: 'employees' },
      },
      { type: 'markdown', expectedUse: 'MarkdownBlockModel' },
      { type: 'iframe', expectedUse: 'IframeBlockModel' },
      { type: 'chart', expectedUse: 'ChartBlockModel' },
      { type: 'actionPanel', expectedUse: 'ActionPanelBlockModel' },
    ];

    for (const blockCase of blockCases) {
      const created = getData(
        await rootAgent.resource('flowSurfaces').addBlock({
          values: {
            target: {
              uid: page.tabSchemaUid,
            },
            type: blockCase.type,
            resourceInit: blockCase.resourceInit,
          },
        }),
      );

      const readback = await getSurface(rootAgent, {
        uid: created.uid,
      });
      expect(readback.tree.use).toBe(blockCase.expectedUse);

      if (blockCase.type === 'list' || blockCase.type === 'gridCard') {
        expect(created.itemUid).toBeTruthy();
        expect(created.gridUid).toBeTruthy();
      }
    }
  });

  it('should enforce real block settings keys for representative built-in block contracts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Block contract page',
      tabTitle: 'Block contract tab',
    });

    const markdownBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
        },
      }),
    );
    const invalidMarkdownSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: markdownBlock.uid,
        },
        stepParams: {
          markdownSettings: {
            editMarkdown: {
              content: 'legacy-key',
            },
          },
        },
      },
    });
    expect(invalidMarkdownSettings.status).toBe(400);

    const validMarkdownSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: markdownBlock.uid,
        },
        stepParams: {
          markdownBlockSettings: {
            editMarkdown: {
              content: 'real-key',
            },
          },
        },
      },
    });
    expect(validMarkdownSettings.status).toBe(200);

    const createFormBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'createForm',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );
    const invalidCreateFormEventOnlyWrite = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: createFormBlock.uid,
        },
        stepParams: {
          formSettings: {
            refresh: {
              force: true,
            },
          },
        },
      },
    });
    expect(invalidCreateFormEventOnlyWrite.status).toBe(400);

    const validCreateFormSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: createFormBlock.uid,
        },
        stepParams: {
          formModelSettings: {
            layout: {
              layout: 'horizontal',
              labelAlign: 'left',
              labelWidth: 160,
              labelWrap: true,
              colon: true,
            },
            assignRules: {
              value: [],
            },
          },
          eventSettings: {
            linkageRules: {
              value: [],
            },
          },
        },
      },
    });
    expect(validCreateFormSettings.status).toBe(200);

    const validCreateFormEventBinding = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: createFormBlock.uid,
        },
        flowRegistry: {
          createFormRefresh: {
            key: 'createFormRefresh',
            on: {
              eventName: 'submit',
              phase: 'beforeStep',
              flowKey: 'formSettings',
              stepKey: 'refresh',
            },
            steps: {},
          },
        },
      },
    });
    expect(validCreateFormEventBinding.status).toBe(200);

    const tableBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'table',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );
    const invalidTableLegacyStep = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: tableBlock.uid,
        },
        stepParams: {
          paginationSettings: {
            pageSize: {
              pageSize: 50,
            },
          },
        },
      },
    });
    expect(invalidTableLegacyStep.status).toBe(400);

    const validTableSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: tableBlock.uid,
        },
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
          },
          tableSettings: {
            quickEdit: {
              editable: true,
            },
            pageSize: {
              pageSize: 50,
            },
            dragSort: {
              dragSort: true,
            },
          },
        },
      },
    });
    expect(validTableSettings.status).toBe(200);

    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'chart',
        },
      }),
    );
    const invalidChartSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: chartBlock.uid,
        },
        stepParams: {
          chartSettings: {
            legacy: true,
          },
        },
      },
    });
    expect(invalidChartSettings.status).toBe(400);

    const validChartSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: chartBlock.uid,
        },
        stepParams: {
          chartSettings: {
            configure: {
              query: {
                mode: 'sql',
                sql: 'select 1 as value',
              },
              chart: {
                option: {
                  mode: 'basic',
                },
              },
            },
          },
        },
      },
    });
    expect(validChartSettings.status).toBe(200);

    const createFormReadback = await getSurface(rootAgent, {
      uid: createFormBlock.uid,
    });
    expect(createFormReadback.tree.flowRegistry?.createFormRefresh).toMatchObject({
      key: 'createFormRefresh',
      on: {
        eventName: 'submit',
        phase: 'beforeStep',
        flowKey: 'formSettings',
        stepKey: 'refresh',
      },
    });
  });

  it('should enforce real action button settings keys and linkageRules event bindings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Action contract page',
      tabTitle: 'Action contract tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const viewAction = await addAction(rootAgent, tableBlockUid, 'view');

    const invalidLegacyButtonStep = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: viewAction.uid,
        },
        stepParams: {
          buttonSettings: {
            general: {
              htmlType: 'submit',
            },
          },
        },
      },
    });
    expect(invalidLegacyButtonStep.status).toBe(400);

    const validActionSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: viewAction.uid,
        },
        props: {
          htmlType: 'submit',
          position: 'fixed',
          tooltip: 'Open the popup view',
          danger: true,
          color: '#1677ff',
        },
        stepParams: {
          buttonSettings: {
            general: {
              title: 'Open view',
              tooltip: 'Open the popup view',
              type: 'link',
              danger: true,
              color: '#1677ff',
            },
          },
        },
      },
    });
    expect(validActionSettings.status).toBe(200);

    const missingLinkageRulesFlow = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: viewAction.uid,
        },
        flowRegistry: {
          linkageRefresh: {
            key: 'linkageRefresh',
            on: {
              eventName: 'click',
              phase: 'beforeStep',
              flowKey: 'buttonSettings',
              stepKey: 'linkageRules',
            },
            steps: {},
          },
        },
      },
    });
    expect(missingLinkageRulesFlow.status).toBe(400);

    const configureLinkageRules = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: viewAction.uid,
        },
        stepParams: {
          buttonSettings: {
            linkageRules: [],
          },
        },
      },
    });
    expect(configureLinkageRules.status).toBe(200);

    const invalidLinkageRulesType = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: viewAction.uid,
        },
        stepParams: {
          buttonSettings: {
            linkageRules: {
              legacy: true,
            },
          },
        },
      },
    });
    expect(invalidLinkageRulesType.status).toBe(400);

    const validLinkageRulesFlow = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: viewAction.uid,
        },
        flowRegistry: {
          linkageRefresh: {
            key: 'linkageRefresh',
            on: {
              eventName: 'click',
              phase: 'beforeStep',
              flowKey: 'buttonSettings',
              stepKey: 'linkageRules',
            },
            steps: {},
          },
        },
      },
    });
    expect(validLinkageRulesFlow.status).toBe(200);

    const actionReadback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    expect(actionReadback.tree.props).toMatchObject({
      htmlType: 'submit',
      position: 'fixed',
      tooltip: 'Open the popup view',
      danger: true,
      color: '#1677ff',
    });
    expect(actionReadback.tree.stepParams?.buttonSettings?.general).toMatchObject({
      title: 'Open view',
      tooltip: 'Open the popup view',
      type: 'link',
      danger: true,
      color: '#1677ff',
    });
    expect(actionReadback.tree.stepParams?.buttonSettings?.general?.htmlType).toBeUndefined();
    expect(actionReadback.tree.stepParams?.buttonSettings?.general?.position).toBeUndefined();
    expect(actionReadback.tree.stepParams?.buttonSettings?.linkageRules).toEqual([]);
  });

  it('should support inline settings and popup on singular add APIs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Inline add page',
      tabTitle: 'Inline add tab',
    });

    const addTableRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        settings: {
          title: 'Employees table',
          pageSize: 50,
        },
      },
    });
    expect(addTableRes.status).toBe(200);
    const table = getData(addTableRes);
    const tableReadback = await getSurface(rootAgent, {
      uid: table.uid,
    });
    expect(tableReadback.tree.props?.title).toBe('Employees table');
    expect(tableReadback.tree.stepParams?.tableSettings?.pageSize?.pageSize).toBe(50);

    const addFieldRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: table.uid,
        },
        fieldPath: 'nickname',
        settings: {
          title: 'Employee nickname',
          width: 220,
        },
      },
    });
    expect(addFieldRes.status).toBe(200);
    const field = getData(addFieldRes);
    const fieldWrapperReadback = await getSurface(rootAgent, {
      uid: field.wrapperUid,
    });
    expect(fieldWrapperReadback.tree.props?.title).toBe('Employee nickname');
    expect(fieldWrapperReadback.tree.props?.width).toBe(220);
    expect(fieldWrapperReadback.tree.stepParams?.tableColumnSettings?.title?.title).toBe('Employee nickname');

    const addActionRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: table.uid,
        },
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
              fields: ['nickname'],
              actions: ['submit'],
            },
          ],
        },
      },
    });
    expect(addActionRes.status).toBe(200);
    const addAction = getData(addActionRes);
    expect(addAction.popupPageUid).toBeTruthy();
    expect(addAction.popupTabUid).toBeTruthy();
    expect(addAction.popupGridUid).toBeTruthy();
    const addActionReadback = await getSurface(rootAgent, {
      uid: addAction.uid,
    });
    expect(addActionReadback.tree.stepParams?.buttonSettings?.general?.title).toBe('Create employee');
    const addActionPopupPage = await getSurface(rootAgent, {
      uid: addAction.popupPageUid,
    });
    expect(addActionPopupPage.tree.use).toBe('ChildPageModel');

    const addRecordActionRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'view',
        settings: {
          title: 'View employee',
          openView: {
            dataSourceKey: 'main',
            collectionName: 'employees',
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
              fields: ['nickname'],
            },
          ],
        },
      },
    });
    expect(addRecordActionRes.status).toBe(200);
    const recordAction = getData(addRecordActionRes);
    expect(recordAction.popupPageUid).toBeTruthy();
    expect(recordAction.popupTabUid).toBeTruthy();
    expect(recordAction.popupGridUid).toBeTruthy();
    const recordActionReadback = await getSurface(rootAgent, {
      uid: recordAction.uid,
    });
    expect(recordActionReadback.tree.stepParams?.buttonSettings?.general?.title).toBe('View employee');
    expect(recordActionReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      mode: 'drawer',
    });
  });

  it('should auto-complete field popup shells for addField and inline popup content', async () => {
    const page = await createPage(rootAgent, {
      title: 'Field popup add page',
      tabTitle: 'Field popup add tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const localPopupRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: tableUid,
        },
        fieldPath: 'department.title',
        settings: {
          title: 'Department',
          openView: {
            dataSourceKey: 'main',
            collectionName: 'departments',
            associationName: 'employees.department',
            mode: 'modal',
          },
        },
      },
    });
    expect(localPopupRes.status).toBe(200);
    const localPopupField = getData(localPopupRes);
    expect(localPopupField.popupPageUid).toBeTruthy();
    expect(localPopupField.popupTabUid).toBeTruthy();
    expect(localPopupField.popupGridUid).toBeTruthy();
    const localPopupReadback = await getSurface(rootAgent, {
      uid: localPopupField.fieldUid,
    });
    expect(localPopupReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'departments',
      associationName: 'employees.department',
      mode: 'dialog',
    });
    expect(localPopupReadback.tree.subModels?.page?.use).toBe('ChildPageModel');

    const inlinePopupRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: tableUid,
        },
        fieldPath: 'nickname',
        settings: {
          title: 'Employee nickname',
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
              fields: ['nickname'],
            },
          ],
        },
      },
    });
    expect(inlinePopupRes.status).toBe(200);
    const inlinePopupField = getData(inlinePopupRes);
    expect(inlinePopupField.popupPageUid).toBeTruthy();
    expect(inlinePopupField.popupTabUid).toBeTruthy();
    expect(inlinePopupField.popupGridUid).toBeTruthy();
    const inlinePopupReadback = await getSurface(rootAgent, {
      uid: inlinePopupField.fieldUid,
    });
    expect(inlinePopupReadback.tree.props?.clickToOpen).toBe(true);
    expect(inlinePopupReadback.tree.stepParams?.displayFieldSettings?.clickToOpen?.clickToOpen).toBe(true);
    expect(inlinePopupReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const inlinePopupBlock = _.castArray(
      inlinePopupReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(inlinePopupBlock?.use).toBe('DetailsBlockModel');
    expect(inlinePopupBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
  });

  it('should auto-complete association field popups with defaultType edit and save them as reusable templates', async () => {
    const page = await createPage(rootAgent, {
      title: 'Association field default popup page',
      tabTitle: 'Association field default popup tab',
    });

    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const defaultEditPopupRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: detailsUid,
        },
        fieldPath: 'department.title',
        popup: {
          defaultType: 'edit',
        },
      },
    });
    expect(defaultEditPopupRes.status).toBe(200);
    const defaultEditPopupField = getData(defaultEditPopupRes);
    expect(defaultEditPopupField.popupPageUid).toBeUndefined();
    expect(defaultEditPopupField.popupTabUid).toBeUndefined();
    expect(defaultEditPopupField.popupGridUid).toBeUndefined();

    const defaultEditPopupReadback = await getSurface(rootAgent, {
      uid: defaultEditPopupField.fieldUid,
    });
    expect(defaultEditPopupReadback.tree.props?.clickToOpen).toBe(true);
    expect(defaultEditPopupReadback.tree.popup?.template).toMatchObject({
      mode: 'reference',
    });

    const templatedPopupUid = defaultEditPopupReadback.tree.popup?.template?.uid;
    expect(typeof templatedPopupUid).toBe('string');

    const templatedPopup = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: templatedPopupUid,
        },
      }),
    );
    expect(templatedPopup.type).toBe('popup');
    expect(templatedPopup.collectionName).toBe('departments');
    expect(templatedPopup.associationName).toBe('employees.department');

    const templatedPopupSurface = await getSurface(rootAgent, {
      uid: templatedPopup.targetUid,
    });
    const popupBlock = _.castArray(
      templatedPopupSurface.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(popupBlock?.use).toBe('EditFormModel');
    const popupFieldPaths = _.castArray(popupBlock?.subModels?.grid?.subModels?.items || [])
      .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath)
      .filter(Boolean);
    expect(popupFieldPaths).not.toContain('employees');
    expect(popupFieldPaths).not.toContain('manager');
    const popupActionUses = _.castArray(popupBlock?.subModels?.actions || []).map((item: any) => item?.use);
    expect(popupActionUses).toContain('FormSubmitActionModel');
  });

  it('should support field popup content in addFields and compose field specs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Batch field popup page',
      tabTitle: 'Batch field popup tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const addFieldsRes = await rootAgent.resource('flowSurfaces').addFields({
      values: {
        target: {
          uid: tableUid,
        },
        fields: [
          {
            key: 'nickname',
            fieldPath: 'nickname',
            popup: {
              mode: 'replace',
              blocks: [
                {
                  key: 'details',
                  type: 'details',
                  resource: {
                    binding: 'currentRecord',
                  },
                  fields: ['nickname'],
                },
              ],
            },
          },
          {
            key: 'status',
            fieldPath: 'status',
          },
        ],
      },
    });
    expect(addFieldsRes.status).toBe(200);
    const addFieldsResult = getData(addFieldsRes);
    expect(addFieldsResult.fields[0].result.popupPageUid).toBeTruthy();
    expect(addFieldsResult.fields[0].result.popupGridUid).toBeTruthy();

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'replace',
        blocks: [
          {
            key: 'details',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: [
              {
                key: 'department',
                fieldPath: 'department.title',
                popup: {
                  mode: 'replace',
                  blocks: [
                    {
                      key: 'departmentDetails',
                      type: 'details',
                      resource: {
                        binding: 'currentRecord',
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
    });
    expect(composeRes.status).toBe(200);
    const composeResult = getData(composeRes);
    const composedField = composeResult.blocks[0].fields[0];
    expect(composedField.popupPageUid).toBeTruthy();
    expect(composedField.popupTabUid).toBeTruthy();
    expect(composedField.popupGridUid).toBeTruthy();
    const composedFieldReadback = await getSurface(rootAgent, {
      uid: composedField.fieldUid,
    });
    expect(composedFieldReadback.tree.subModels?.page?.use).toBe('ChildPageModel');
    const composedPopupBlock = _.castArray(
      composedFieldReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    )[0];
    expect(composedPopupBlock?.use).toBe('DetailsBlockModel');
  });

  it('should auto-complete bare relation fields in compose with non-empty view popups', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose relation popup page',
      tabTitle: 'Compose relation popup tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'replace',
        blocks: [
          {
            key: 'employeesDetails',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['department'],
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);
    const composeResult = getData(composeRes);
    const composedField = composeResult.blocks[0].fields[0];
    const composedFieldReadback = await getSurface(rootAgent, {
      uid: composedField.fieldUid,
    });
    expect(composedFieldReadback.tree.props?.clickToOpen).toBe(true);

    if (composedFieldReadback.tree.popup?.template?.uid) {
      const popupTemplate = getData(
        await rootAgent.resource('flowSurfaces').getTemplate({
          values: {
            uid: composedFieldReadback.tree.popup.template.uid,
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
      expect(composedFieldReadback.tree.subModels?.page?.use).toBe('ChildPageModel');
      const composedPopupBlock = _.castArray(
        composedFieldReadback.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
      )[0];
      expect(composedPopupBlock?.use).toBe('DetailsBlockModel');
    }
  });

  it('should preserve details item fieldSettings when addFields applies inline label settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Details addFields page',
      tabTitle: 'Details addFields tab',
    });

    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const addFieldsRes = await rootAgent.resource('flowSurfaces').addFields({
      values: {
        target: {
          uid: detailsUid,
        },
        fields: [
          {
            key: 'nickname',
            fieldPath: 'nickname',
            settings: {
              label: 'Employee nickname',
            },
          },
        ],
      },
    });
    expect(addFieldsRes.status).toBe(200);

    const createdField = getData(addFieldsRes).fields[0].result;
    const wrapperReadback = await getSurface(rootAgent, {
      uid: createdField.wrapperUid,
    });
    const innerReadback = await getSurface(rootAgent, {
      uid: createdField.fieldUid,
    });

    expect(wrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'nickname',
    });
    expect(wrapperReadback.tree.stepParams?.detailItemSettings?.label).toMatchObject({
      title: 'Employee nickname',
    });
    expect(innerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'nickname',
    });
  });

  it('should auto-complete field popup shells on configure and normalize legacy openView modes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Configure popup page',
      tabTitle: 'Configure popup tab',
    });

    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const field = await addField(rootAgent, detailsUid, 'department.title');

    const configureFieldRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: field.fieldUid,
        },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'departments',
            associationName: 'employees.department',
            mode: 'modal',
          },
        },
      },
    });
    expect(configureFieldRes.status).toBe(200);
    const configuredField = getData(configureFieldRes);
    expect(configuredField.popupPageUid).toBeTruthy();
    expect(configuredField.popupTabUid).toBeTruthy();
    expect(configuredField.popupGridUid).toBeTruthy();

    const configuredFieldReadback = await getSurface(rootAgent, {
      uid: field.fieldUid,
    });
    expect(configuredFieldReadback.tree.props?.clickToOpen).toBe(true);
    expect(configuredFieldReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      dataSourceKey: 'main',
      collectionName: 'departments',
      associationName: 'employees.department',
    });
    expect(configuredFieldReadback.tree.subModels?.page?.uid).toBe(configuredField.popupPageUid);

    const configureFieldAgainRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: field.fieldUid,
        },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'departments',
            associationName: 'employees.department',
            mode: 'page',
          },
        },
      },
    });
    expect(configureFieldAgainRes.status).toBe(200);
    const configuredFieldAgain = getData(configureFieldAgainRes);
    expect(configuredFieldAgain.popupPageUid).toBe(configuredField.popupPageUid);
    const configuredFieldAgainReadback = await getSurface(rootAgent, {
      uid: field.fieldUid,
    });
    expect(configuredFieldAgainReadback.tree.stepParams?.popupSettings?.openView.mode).toBe('embed');

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const viewAction = await addRecordAction(rootAgent, tableUid, 'view');
    const configureActionRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: viewAction.uid,
        },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'employees',
            mode: 'modal',
          },
        },
      },
    });
    expect(configureActionRes.status).toBe(200);
    const configuredActionReadback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    expect(configuredActionReadback.tree.stepParams?.popupSettings?.openView.mode).toBe('dialog');
  });

  it('should reject field popup content when settings target an external popup uid', async () => {
    const page = await createPage(rootAgent, {
      title: 'External popup conflict page',
      tabTitle: 'External popup conflict tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const invalidRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: tableUid,
        },
        fieldPath: 'department.title',
        settings: {
          openView: {
            uid: 'external-popup-uid',
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
              fields: ['title'],
            },
          ],
        },
      },
    });
    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain('external openView.uid');
  });

  it('should preserve empty action popup payload semantics for external popup targets', async () => {
    const page = await createPage(rootAgent, {
      title: 'External action popup replace page',
      tabTitle: 'External action popup replace tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const externalPopupAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: tableUid,
          },
          type: 'popup',
          popup: {
            blocks: [
              {
                key: 'details',
                type: 'details',
                resource: {
                  binding: 'currentCollection',
                },
                fields: ['nickname'],
              },
            ],
          },
        },
      }),
    );
    getData(
      await rootAgent.resource('flowSurfaces').updatePopupTab({
        values: {
          target: {
            uid: externalPopupAction.popupTabUid,
          },
          title: 'Shared employee popup',
        },
      }),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: tableUid,
        },
        type: 'view',
        settings: {
          openView: {
            uid: externalPopupAction.uid,
          },
        },
        popup: {},
      },
    });
    expect(replaceRes.status).toBe(200);
    expect(getData(replaceRes).popupPageUid).toBe(externalPopupAction.popupPageUid);

    const layoutOnlyRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: tableUid,
        },
        type: 'view',
        settings: {
          openView: {
            uid: externalPopupAction.uid,
          },
        },
        popup: {
          mode: 'replace',
          layout: {
            rows: [['details']],
          },
        },
      },
    });
    expect(layoutOnlyRes.status).toBe(200);
    expect(getData(layoutOnlyRes).popupPageUid).toBe(externalPopupAction.popupPageUid);

    const externalPopupReadback = await getSurface(rootAgent, {
      uid: externalPopupAction.uid,
    });
    const externalPopupTab = _.castArray(externalPopupReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const externalPopupBlock = _.castArray(externalPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    const externalPopupFieldPaths = _.castArray(externalPopupBlock?.subModels?.grid?.subModels?.items || []).map(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath,
    );
    expect(externalPopupTab?.props?.title).toBe('Shared employee popup');
    expect(externalPopupBlock?.use).toBe('DetailsBlockModel');
    expect(externalPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('employees');
    expect(externalPopupFieldPaths).toEqual(['nickname']);
  });

  it('should reject openView uid when it points to a popup page node', async () => {
    const page = await createPage(rootAgent, {
      title: 'Invalid popup uid page',
      tabTitle: 'Invalid popup uid tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const field = await addField(rootAgent, tableUid, 'department.title');
    const viewAction = await addRecordAction(rootAgent, tableUid, 'view');
    const viewPopupBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: viewAction.uid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
        },
      }),
    );
    expect(viewPopupBlock.popupPageUid).toBeTruthy();

    const invalidRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: field.fieldUid,
        },
        changes: {
          openView: {
            uid: viewPopupBlock.popupPageUid,
          },
        },
      },
    });
    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain('page or tab nodes');
    expect(readErrorMessage(invalidRes)).toContain('ChildPageModel');
  });

  it('should reject openView uid when it points to a non-existent node', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing popup uid page',
      tabTitle: 'Missing popup uid tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const field = await addField(rootAgent, tableUid, 'department.title');

    const invalidRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: field.fieldUid,
        },
        changes: {
          openView: {
            uid: 'missing-popup-opener',
          },
        },
      },
    });
    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain('must reference an existing node');
  });

  it('should configure roles table fields with displayStyle tag and switch fieldComponent via wrapper changes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users roles field configure page',
      tabTitle: 'Users roles field configure tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'users',
    });
    const rolesField = await addField(rootAgent, tableUid, 'roles');

    const displayStyleRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: rolesField.fieldUid,
        },
        changes: {
          displayStyle: 'tag',
        },
      },
    });
    expect(displayStyleRes.status).toBe(200);

    const rolesInnerReadback = await getSurface(rootAgent, {
      uid: rolesField.fieldUid,
    });
    expect(rolesInnerReadback.tree.use).toBe('DisplayTextFieldModel');
    expect(rolesInnerReadback.tree.props?.displayStyle).toBe('tag');
    expect(rolesInnerReadback.tree.stepParams?.displayFieldSettings?.displayStyle?.displayStyle).toBe('tag');

    const switchComponentRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: rolesField.wrapperUid,
        },
        changes: {
          fieldComponent: 'DisplaySubTableFieldModel',
        },
      },
    });
    expect(switchComponentRes.status).toBe(200);

    const rolesWrapperAfterSwitch = await getSurface(rootAgent, {
      uid: rolesField.wrapperUid,
    });
    const rolesInnerAfterSwitch = await getSurface(rootAgent, {
      uid: rolesField.fieldUid,
    });
    expect(rolesWrapperAfterSwitch.tree.stepParams?.tableColumnSettings?.model?.use).toBe('DisplaySubTableFieldModel');
    expect(rolesInnerAfterSwitch.tree.use).toBe('DisplaySubTableFieldModel');
    expect(rolesInnerAfterSwitch.tree.stepParams?.fieldBinding?.use).toBe('DisplaySubTableFieldModel');
    expect(rolesInnerAfterSwitch.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
  });

  it('should reject invalid openView uid through updateSettings stepParams writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Invalid updateSettings popup uid page',
      tabTitle: 'Invalid updateSettings popup uid tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const field = await addField(rootAgent, tableUid, 'department.title');
    const viewAction = await addRecordAction(rootAgent, tableUid, 'view');
    const viewPopupBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: viewAction.uid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
        },
      }),
    );
    expect(viewPopupBlock.popupPageUid).toBeTruthy();

    const invalidRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          popupSettings: {
            openView: {
              uid: viewPopupBlock.popupPageUid,
            },
          },
        },
      },
    });
    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain('page or tab nodes');
    expect(readErrorMessage(invalidRes)).toContain('ChildPageModel');
  });

  it('should enforce real wrapper and column props contracts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Wrapper contract page',
      tabTitle: 'Wrapper contract tab',
    });

    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const formField = await addField(rootAgent, formUid, 'nickname');

    const invalidLegacyWrapperTitle = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: formField.wrapperUid,
        },
        props: {
          title: 'Legacy wrapper title',
        },
      },
    });
    expect(invalidLegacyWrapperTitle.status).toBe(400);

    const validWrapperProps = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: formField.wrapperUid,
        },
        props: {
          label: 'Employee nickname',
          showLabel: false,
          tooltip: 'Nickname tooltip',
          extra: 'Nickname description',
        },
      },
    });
    expect(validWrapperProps.status).toBe(200);

    const wrapperReadback = await getSurface(rootAgent, {
      uid: formField.wrapperUid,
    });
    expect(wrapperReadback.tree.props).toMatchObject({
      label: 'Employee nickname',
      showLabel: false,
      tooltip: 'Nickname tooltip',
      extra: 'Nickname description',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const tableField = await addField(rootAgent, tableUid, 'nickname');
    const table = await flowRepo.findModelById(tableUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;

    const validTableColumnProps = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: tableField.wrapperUid,
        },
        props: {
          title: 'Nickname column',
          tooltip: 'Nickname column tooltip',
          width: 260,
          fixed: 'left',
          sorter: true,
        },
      },
    });
    expect(validTableColumnProps.status).toBe(200);

    const tableColumnReadback = await getSurface(rootAgent, {
      uid: tableField.wrapperUid,
    });
    expect(tableColumnReadback.tree.props).toMatchObject({
      title: 'Nickname column',
      tooltip: 'Nickname column tooltip',
      width: 260,
      fixed: 'left',
      sorter: true,
    });

    const invalidActionColumnLabel = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        props: {
          label: 'Bad label key',
        },
      },
    });
    expect(invalidActionColumnLabel.status).toBe(400);

    const validActionColumnProps = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        props: {
          title: 'Actions',
          tooltip: 'Actions tooltip',
          width: 300,
          fixed: 'right',
        },
      },
    });
    expect(validActionColumnProps.status).toBe(200);

    const actionColumnReadback = await getSurface(rootAgent, {
      uid: actionsColumnUid,
    });
    expect(actionColumnReadback.tree.props).toMatchObject({
      title: 'Actions',
      tooltip: 'Actions tooltip',
      width: 300,
      fixed: 'right',
    });
  });

  it('should build simple table surface with create action row actions and association columns', async () => {
    const page = await createPage(rootAgent, {
      title: 'Table page',
      tabTitle: 'Table tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableBlockUid, { includeAsyncNode: true });
    const actionsColumn = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    );
    expect(actionsColumn?.uid).toBeTruthy();

    const addNewAction = await addAction(rootAgent, tableBlockUid, 'addNew', {
      settings: {
        title: 'Create New',
      },
      popup: {},
    });
    expect(addNewAction.uid).toBeTruthy();

    const viewAction = await addRecordAction(rootAgent, tableBlockUid, 'view', {
      popup: {
        mode: 'replace',
      },
    });
    const editAction = await addRecordAction(rootAgent, tableBlockUid, 'edit', {
      popup: {
        layout: {
          rows: [[{ key: 'defaultEditForm', span: 10 }]],
        },
      },
    });
    await addRecordAction(rootAgent, tableBlockUid, 'popup');
    await addRecordAction(rootAgent, tableBlockUid, 'delete');

    const nicknameField = await addField(rootAgent, tableBlockUid, 'nickname');
    const statusField = await addField(rootAgent, tableBlockUid, 'status');
    const associationField = await addField(rootAgent, tableBlockUid, 'department.title');

    const readback = await getSurface(rootAgent, {
      uid: tableBlockUid,
    });
    const block = readback.tree;
    expect(block.use).toBe('TableBlockModel');
    expect(block.stepParams?.resourceSettings?.init).toEqual({
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    expect(_.castArray(block.subModels?.actions || []).map((item: any) => item.use)).toContain('AddNewActionModel');
    expect(
      _.castArray(
        _.castArray(block.subModels?.columns || []).find((item: any) => item.use === 'TableActionsColumnModel')
          ?.subModels?.actions || [],
      ).map((item: any) => item.use),
    ).toEqual(
      expect.arrayContaining(['ViewActionModel', 'EditActionModel', 'PopupCollectionActionModel', 'DeleteActionModel']),
    );

    const associationColumn = _.castArray(block.subModels?.columns || []).find(
      (column: any) => column.uid === associationField.wrapperUid,
    );
    expect(associationColumn?.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      associationPathName: 'department',
      fieldPath: 'department.title',
    });
    expect(associationColumn?.subModels?.field?.uid).toBe(associationField.fieldUid);
    const nicknameColumn = _.castArray(block.subModels?.columns || []).find(
      (column: any) => column.uid === nicknameField.wrapperUid,
    );
    expect(nicknameColumn?.props || {}).not.toHaveProperty('title');
    expect(nicknameColumn?.props || {}).not.toHaveProperty('dataIndex');

    const bundle = createFlowSurfaceFixture(readback);
    expect(listFixtureAliases(bundle)).toEqual(
      expect.arrayContaining([
        'block.table1',
        'action.addNew1',
        'column.actions1',
        'action.view1',
        'action.edit1',
        'action.popup1',
        'action.delete1',
        'field.nickname.wrapper',
        'field.nickname.inner',
        'field.status.wrapper',
        'field.department.title.wrapper',
      ]),
    );
    expect(Object.values(bundle.refs).some((item: any) => item?.uid === nicknameField.wrapperUid)).toBe(true);
    expect(Object.values(bundle.refs).some((item: any) => item?.uid === statusField.wrapperUid)).toBe(true);

    const addNewReadback = await getSurface(rootAgent, {
      uid: addNewAction.uid,
    });
    const addNewPopupTab = _.castArray(addNewReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const addNewPopupBlock = _.castArray(addNewPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    const addNewPopupFieldPaths = _.castArray(addNewPopupBlock?.subModels?.grid?.subModels?.items || []).map(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath,
    );
    expect(addNewPopupTab?.props?.title).toBe('Create New');
    expect(addNewPopupBlock?.use).toBe('CreateFormModel');
    expect(addNewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('employees');
    expect(addNewPopupFieldPaths).toEqual(expect.arrayContaining(['nickname', 'department']));
    expect(addNewPopupFieldPaths).not.toEqual(
      expect.arrayContaining(['createdAt', 'updatedAt', 'departmentId', 'tasks', 'logs', 'skills']),
    );
    expect(_.castArray(addNewPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const viewReadback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const viewPopupTab = _.castArray(viewReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const viewPopupBlock = _.castArray(viewPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    const viewPopupFieldPaths = _.castArray(viewPopupBlock?.subModels?.grid?.subModels?.items || []).map(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath,
    );
    expect(viewPopupTab?.props?.title).toBe('Details');
    expect(viewPopupBlock?.use).toBe('DetailsBlockModel');
    expect(viewPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('employees');
    expect(viewPopupBlock?.subModels?.actions).toBeUndefined();
    expect(viewPopupFieldPaths).toEqual(expect.arrayContaining(['nickname', 'department']));
    expect(viewPopupFieldPaths).not.toEqual(expect.arrayContaining(['departmentId', 'tasks', 'logs', 'skills']));

    const editReadback = await getSurface(rootAgent, {
      uid: editAction.uid,
    });
    const editPopupTab = _.castArray(editReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
    const editPopupBlock = _.castArray(editPopupTab?.subModels?.grid?.subModels?.items || [])[0];
    const editPopupFieldPaths = _.castArray(editPopupBlock?.subModels?.grid?.subModels?.items || []).map(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath,
    );
    expect(editPopupTab?.props?.title).toBe('Edit');
    expect(editPopupBlock?.use).toBe('EditFormModel');
    expect(editPopupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('employees');
    expect(editPopupFieldPaths).toEqual(expect.arrayContaining(['nickname', 'department']));
    expect(editPopupFieldPaths).not.toEqual(
      expect.arrayContaining(['createdAt', 'updatedAt', 'departmentId', 'tasks', 'logs', 'skills']),
    );
    expect(_.castArray(editPopupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );
  });

  it('should auto-complete omitted popup payloads for direct action APIs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Implicit popup action page',
      tabTitle: 'Implicit popup action tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const addNewAction = await addAction(rootAgent, tableBlockUid, 'addNew', {
      settings: {
        title: 'Create Employee',
      },
    });
    const viewAction = await addRecordAction(rootAgent, tableBlockUid, 'view', {
      settings: {
        title: 'Inspect Employee',
      },
    });

    const readActionPopup = async (actionUid: string) => {
      const actionReadback = await getSurface(rootAgent, {
        uid: actionUid,
      });
      const popupTab = _.castArray(actionReadback.tree.subModels?.page?.subModels?.tabs || [])[0];
      const popupBlock = _.castArray(popupTab?.subModels?.grid?.subModels?.items || [])[0];
      return {
        popupTab,
        popupBlock,
      };
    };

    expect(addNewAction.popupPageUid).toBeTruthy();
    expect(addNewAction.popupTabUid).toBeTruthy();
    expect(addNewAction.popupGridUid).toBeTruthy();
    const addNewPopup = await readActionPopup(addNewAction.uid);
    expect(addNewPopup.popupTab?.props?.title).toBe('Create Employee');
    expect(addNewPopup.popupBlock?.use).toBe('CreateFormModel');
    expect(addNewPopup.popupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('employees');
    expect(_.castArray(addNewPopup.popupBlock?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    expect(viewAction.popupPageUid).toBeTruthy();
    expect(viewAction.popupTabUid).toBeTruthy();
    expect(viewAction.popupGridUid).toBeTruthy();
    const viewPopup = await readActionPopup(viewAction.uid);
    expect(viewPopup.popupTab?.props?.title).toBe('Inspect Employee');
    expect(viewPopup.popupBlock?.use).toBe('DetailsBlockModel');
    expect(viewPopup.popupBlock?.stepParams?.resourceSettings?.init?.collectionName).toBe('employees');
  });

  it('should keep plain popup action empty payloads composable', async () => {
    const page = await createPage(rootAgent, {
      title: 'Plain popup empty payload page',
      tabTitle: 'Plain popup empty payload tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const popupActionRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: tableBlockUid,
        },
        type: 'popup',
        popup: {},
      },
    });
    expect(popupActionRes.status).toBe(200);
    const popupActionData = getData(popupActionRes);
    expect(popupActionData.popupPageUid).toBeTruthy();
    expect(popupActionData.popupTabUid).toBeTruthy();
    expect(popupActionData.popupGridUid).toBeTruthy();

    const popupReadback = await getSurface(rootAgent, {
      uid: popupActionData.uid,
    });
    expect(popupReadback.tree.subModels?.page?.uid).toBe(popupActionData.popupPageUid);
    expect(_.castArray(popupReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.uid).toBe(
      popupActionData.popupTabUid,
    );
  });

  it('should support nested popup surfaces to depth 3', async () => {
    const page = await createPage(rootAgent, {
      title: 'Nested popup page',
      tabTitle: 'Nested popup tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableBlockUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;
    const viewAction = await addAction(rootAgent, tableBlockUid, 'view');

    await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: viewAction.uid,
        },
        stepParams: {
          popupSettings: {
            openView: {
              mode: 'dialog',
              size: 'large',
            },
          },
        },
      },
    });

    const firstPopupBlock = await getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: viewAction.uid,
          },
          type: 'table',
          resource: {
            binding: 'associatedRecords',
            associationField: 'tasks',
          },
        },
      }),
    );
    const secondPopupAction = await addAction(rootAgent, firstPopupBlock.uid, 'popup');

    const secondPopupBlock = await getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: secondPopupAction.uid,
          },
          type: 'table',
          resource: {
            binding: 'currentCollection',
          },
        },
      }),
    );
    const thirdPopupAction = await addAction(rootAgent, secondPopupBlock.uid, 'popup');

    await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: thirdPopupAction.uid,
        },
        type: 'details',
        resource: {
          binding: 'otherRecords',
          collectionName: 'departments',
        },
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    expect(readback.tree.use).toBe('ViewActionModel');
    expect(readback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      pageModelClass: 'ChildPageModel',
    });
    expect(readback.tree.subModels?.page?.use).toBe('ChildPageModel');
    expect(_.castArray(readback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid?.use).toBe(
      'BlockGridModel',
    );

    const bundle = createFlowSurfaceFixture(readback);
    expect(listFixtureAliases(bundle)).toEqual(
      expect.arrayContaining([
        'action.view1',
        'action.view1.popup.page',
        'action.view1.popup.tab',
        'action.view1.popup.grid',
        'block.table1',
        'action.popup1',
        'action.popup1.popup.page',
        'action.popup1.popup.grid',
        'block.table2',
        'action.popup2',
        'action.popup2.popup.grid',
        'block.details1',
      ]),
    );
  });

  it('should create create-form block with fields actions and layout round-trip', async () => {
    const page = await createPage(rootAgent, {
      title: 'Create form page',
      tabTitle: 'Create form tab',
    });

    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const nicknameField = await addField(rootAgent, formUid, 'nickname');
    const statusField = await addField(rootAgent, formUid, 'status');
    const submitAction = await addAction(rootAgent, formUid, 'submit');

    const gridUid = await getBlockGridUid(rootAgent, formUid);
    await rootAgent.resource('flowSurfaces').setLayout({
      values: {
        target: {
          uid: gridUid,
        },
        rows: {
          row1: [[nicknameField.wrapperUid], [statusField.wrapperUid]],
        },
        sizes: {
          row1: [12, 12],
        },
        rowOrder: ['row1'],
      },
    });
    await rootAgent.resource('flowSurfaces').moveNode({
      values: {
        sourceUid: statusField.wrapperUid,
        targetUid: nicknameField.wrapperUid,
        position: 'before',
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: formUid,
    });
    expect(readback.tree.use).toBe('CreateFormModel');
    expect(readback.tree.subModels?.grid?.use).toBe('FormGridModel');
    expect(_.castArray(readback.tree.subModels?.actions || []).map((item: any) => item.use)).toEqual([
      'FormSubmitActionModel',
    ]);
    expect(_.castArray(readback.tree.subModels?.actions || [])[0]?.uid).toBe(submitAction.uid);
    expect(readback.tree.subModels?.grid?.props?.rows).toEqual({
      row1: [[nicknameField.wrapperUid], [statusField.wrapperUid]],
    });
    expect(readback.tree.subModels?.grid?.props?.rowOrder).toEqual(['row1']);
  });

  it('should create edit-form and details blocks with fields actions and event flow replacement', async () => {
    const page = await createPage(rootAgent, {
      title: 'Edit and details page',
      tabTitle: 'Edit and details tab',
    });

    const editFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'editForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const editField = await addField(rootAgent, editFormUid, 'nickname');
    const detailsField = await addField(rootAgent, detailsUid, 'department.title');
    const editSubmit = await addAction(rootAgent, editFormUid, 'submit');
    const updateRecordAction = await addAction(rootAgent, detailsUid, 'updateRecord');

    await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: updateRecordAction.uid,
        },
        flowRegistry: {
          beforeAssignConfirm: {
            key: 'beforeAssignConfirm',
            title: 'Before assign confirm',
            on: {
              eventName: 'click',
              phase: 'beforeStep',
              flowKey: 'assignSettings',
              stepKey: 'confirm',
            },
            steps: {},
          },
        },
      },
    });

    const editReadback = await getSurface(rootAgent, {
      uid: editFormUid,
    });
    expect(editReadback.tree.use).toBe('EditFormModel');
    expect(_.castArray(editReadback.tree.subModels?.actions || [])[0]?.uid).toBe(editSubmit.uid);
    expect(_.castArray(editReadback.tree.subModels?.grid?.subModels?.items || [])[0]?.uid).toBe(editField.wrapperUid);

    const detailsReadback = await getSurface(rootAgent, {
      uid: detailsUid,
    });
    const updateActionReadback = await getSurface(rootAgent, {
      uid: updateRecordAction.uid,
    });
    expect(detailsReadback.tree.use).toBe('DetailsBlockModel');
    expect(_.castArray(detailsReadback.tree.subModels?.actions || [])[0]?.uid).toBe(updateRecordAction.uid);
    expect(updateRecordAction.assignFormUid).toBeTruthy();
    expect(updateActionReadback.tree.flowRegistry?.beforeAssignConfirm?.on).toMatchObject({
      eventName: 'click',
      phase: 'beforeStep',
      flowKey: 'assignSettings',
      stepKey: 'confirm',
    });
    expect(_.castArray(detailsReadback.tree.subModels?.grid?.subModels?.items || [])[0]?.uid).toBe(
      detailsField.wrapperUid,
    );
  });

  it('should create filter-form block and clickable field popup surface', async () => {
    const page = await createPage(rootAgent, {
      title: 'Filter and click page',
      tabTitle: 'Filter and click tab',
    });

    const filterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const filterField = await addField(rootAgent, filterFormUid, 'status');
    const filterAction = await addAction(rootAgent, filterFormUid, 'submit');

    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const clickableField = await addField(rootAgent, detailsUid, 'department.title');
    await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: clickableField.fieldUid,
        },
        props: {
          clickToOpen: true,
        },
        stepParams: {
          displayFieldSettings: {
            clickToOpen: {
              clickToOpen: true,
            },
          },
          popupSettings: {
            openView: {
              dataSourceKey: 'main',
              collectionName: 'departments',
              associationName: 'employees.department',
            },
          },
        },
      },
    });

    const popupBlock = await getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: clickableField.fieldUid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
        },
      }),
    );
    expect(popupBlock.pageUid).toBeTruthy();
    expect(popupBlock.gridUid).toBeTruthy();
    expect(popupBlock.popupPageUid).toBe(popupBlock.pageUid);
    expect(popupBlock.popupGridUid).toBeTruthy();
    expect(popupBlock.blockGridUid).toBeTruthy();
    expect(popupBlock.gridUid).toBe(popupBlock.blockGridUid);
    expect(popupBlock.popupGridUid).not.toBe(popupBlock.blockGridUid);

    const filterReadback = await getSurface(rootAgent, {
      uid: filterFormUid,
    });
    expect(filterReadback.tree.use).toBe('FilterFormBlockModel');
    expect(_.castArray(filterReadback.tree.subModels?.actions || []).map((item: any) => item.use)).toEqual([
      'FilterFormSubmitActionModel',
    ]);
    expect(_.castArray(filterReadback.tree.subModels?.grid?.subModels?.items || [])[0]?.uid).toBe(
      filterField.wrapperUid,
    );
    expect(_.castArray(filterReadback.tree.subModels?.actions || [])[0]?.uid).toBe(filterAction.uid);

    const fieldReadback = await getSurface(rootAgent, {
      uid: clickableField.fieldUid,
    });
    expect(fieldReadback.tree.props?.clickToOpen).toBe(true);
    expect(fieldReadback.tree.stepParams?.displayFieldSettings?.clickToOpen?.clickToOpen).toBe(true);
    expect(fieldReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'departments',
      associationName: 'employees.department',
    });
    expect(fieldReadback.tree.subModels?.page?.use).toBe('ChildPageModel');

    const fieldPopupCatalog = await getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: clickableField.fieldUid,
          },
        },
      }),
    );
    const fieldPopupDetailsBindings =
      fieldPopupCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')?.resourceBindings || [];
    expect(fieldPopupDetailsBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['currentRecord', 'otherRecords']),
    );
    expect(fieldPopupDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection']),
    );

    const popupGridCatalog = await getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: popupBlock.popupGridUid,
          },
        },
      }),
    );
    const popupGridDetailsBindings =
      popupGridCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')?.resourceBindings || [];
    expect(popupGridDetailsBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['currentRecord', 'otherRecords']),
    );
    expect(popupGridDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection']),
    );

    await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: clickableField.fieldUid,
        },
        stepParams: {
          popupSettings: {},
        },
      },
    });

    const clearedFieldReadback = await getSurface(rootAgent, {
      uid: clickableField.fieldUid,
    });
    expect(clearedFieldReadback.tree.stepParams?.popupSettings).toBeUndefined();
  });

  it('should require explicit filter targets and persist default filter field props plus filterManager bindings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Filter target page',
      tabTitle: 'Filter target tab',
    });

    const filterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const createFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const filterCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: filterFormUid,
          },
        },
      }),
    );
    const nicknameTargets = filterCatalog.fields
      .filter((item: any) => item.key === 'nickname')
      .map((item: any) => item.targetBlockUid);
    expect(nicknameTargets).toEqual(expect.arrayContaining([tableUid, detailsUid]));
    expect(filterCatalog.fields.find((item: any) => item.key === 'nickname')?.requiredInitParams).toEqual(
      expect.arrayContaining(['fieldPath', 'defaultTargetUid']),
    );

    const missingTargetField = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: filterFormUid,
        },
        fieldPath: 'nickname',
      },
    });
    expect(missingTargetField.status).toBe(400);

    const bioFormField = await addField(rootAgent, createFormUid, 'bio');
    const bioReadback = await getSurface(rootAgent, {
      uid: bioFormField.fieldUid,
    });
    expect(bioReadback.tree.use).toBe('TextareaFieldModel');
    expect(bioReadback.tree.props).toMatchObject({
      autoSize: {
        minRows: 3,
        maxRows: 10,
      },
    });

    const bioFilterField = await addField(rootAgent, filterFormUid, 'bio', {
      defaultTargetUid: tableUid,
    });
    const departmentField = await addField(rootAgent, filterFormUid, 'department', {
      defaultTargetUid: tableUid,
    });
    const isManagerField = await addField(rootAgent, filterFormUid, 'isManager', {
      defaultTargetUid: detailsUid,
    });

    const bioFilterReadback = await getSurface(rootAgent, {
      uid: bioFilterField.fieldUid,
    });
    expect(bioFilterReadback.tree.use).toBe('InputFieldModel');

    const departmentReadback = await getSurface(rootAgent, {
      uid: departmentField.fieldUid,
    });
    expect(departmentReadback.tree.use).toBe('FilterFormRecordSelectFieldModel');
    expect(departmentReadback.tree.props).toMatchObject({
      allowMultiple: true,
      multiple: true,
      quickCreate: 'none',
    });
    const departmentWrapperReadback = await getSurface(rootAgent, {
      uid: departmentField.wrapperUid,
    });
    expect(departmentField.defaultTargetUid).toBe(tableUid);
    expect(departmentWrapperReadback.tree.stepParams?.filterFormItemSettings?.init?.defaultTargetUid).toBe(tableUid);

    const checkboxReadback = await getSurface(rootAgent, {
      uid: isManagerField.fieldUid,
    });
    expect(checkboxReadback.tree.use).toBe('SelectFieldModel');
    expect(checkboxReadback.tree.props).toMatchObject({
      allowClear: true,
      multiple: false,
    });
    expect(checkboxReadback.tree.props?.options).toEqual([
      { label: '{{t("Yes")}}', value: true },
      { label: '{{t("No")}}', value: false },
    ]);

    const pageGrid = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(pageGrid?.filterManager).toEqual(
      expect.arrayContaining([
        {
          filterId: bioFilterField.wrapperUid,
          targetId: tableUid,
          filterPaths: ['bio'],
        },
        {
          filterId: departmentField.wrapperUid,
          targetId: tableUid,
          filterPaths: ['department.id'],
        },
        {
          filterId: isManagerField.wrapperUid,
          targetId: detailsUid,
          filterPaths: ['isManager'],
        },
      ]),
    );

    const updateFilterTarget = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: bioFilterField.wrapperUid,
        },
        stepParams: {
          filterFormItemSettings: {
            init: {
              defaultTargetUid: detailsUid,
            },
          },
        },
      },
    });
    expect(updateFilterTarget.status).toBe(200);

    const pageGridAfterTargetUpdate = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(pageGridAfterTargetUpdate?.filterManager || []).find(
        (item: any) => item.filterId === bioFilterField.wrapperUid,
      ),
    ).toMatchObject({
      targetId: detailsUid,
      filterPaths: ['bio'],
    });

    const updateFilterFieldFromInner = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: bioFilterField.fieldUid,
        },
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'employees',
              fieldPath: 'nickname',
            },
          },
        },
      },
    });
    expect(updateFilterFieldFromInner.status).toBe(200);

    const bioWrapperAfterInnerUpdate = await getSurface(rootAgent, {
      uid: bioFilterField.wrapperUid,
    });
    const bioInnerAfterInnerUpdate = await getSurface(rootAgent, {
      uid: bioFilterField.fieldUid,
    });
    expect(bioWrapperAfterInnerUpdate.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'nickname',
    });
    expect(bioInnerAfterInnerUpdate.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'nickname',
    });
    const pageGridAfterInnerFieldUpdate = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(pageGridAfterInnerFieldUpdate?.filterManager || []).find(
        (item: any) => item.filterId === bioFilterField.wrapperUid,
      ),
    ).toMatchObject({
      targetId: detailsUid,
      filterPaths: ['nickname'],
    });

    const updateFilterFieldFromWrapper = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: bioFilterField.wrapperUid,
        },
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'employees',
              fieldPath: 'status',
            },
          },
        },
      },
    });
    expect(updateFilterFieldFromWrapper.status).toBe(200);

    const bioWrapperAfterWrapperUpdate = await getSurface(rootAgent, {
      uid: bioFilterField.wrapperUid,
    });
    const bioInnerAfterWrapperUpdate = await getSurface(rootAgent, {
      uid: bioFilterField.fieldUid,
    });
    expect(bioWrapperAfterWrapperUpdate.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'status',
    });
    expect(bioInnerAfterWrapperUpdate.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'status',
    });
    const pageGridAfterWrapperFieldUpdate = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(pageGridAfterWrapperFieldUpdate?.filterManager || []).find(
        (item: any) => item.filterId === bioFilterField.wrapperUid,
      ),
    ).toMatchObject({
      targetId: detailsUid,
      filterPaths: ['status'],
    });

    const applyFilterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const applyFilterGridUid = await getBlockGridUid(rootAgent, applyFilterFormUid);
    const applyFilterField = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: applyFilterGridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                clientKey: 'applied-filter',
                use: 'FilterFormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'employees',
                      fieldPath: 'nickname',
                    },
                  },
                  filterFormItemSettings: {
                    init: {
                      defaultTargetUid: detailsUid,
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'InputFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'employees',
                          fieldPath: 'nickname',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(applyFilterField.status).toBe(200);
    const appliedWrapperUid = applyFilterField.body.data.clientKeyToUid['applied-filter'];
    expect(appliedWrapperUid).toBeTruthy();

    const pageGridAfterApply = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(pageGridAfterApply?.filterManager || []).find((item: any) => item.filterId === appliedWrapperUid),
    ).toMatchObject({
      targetId: detailsUid,
      filterPaths: ['nickname'],
    });

    const removeFilterField = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: {
          uid: departmentField.wrapperUid,
        },
      },
    });
    expect(removeFilterField.status).toBe(200);

    const pageGridAfterRemove = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(pageGridAfterRemove?.filterManager || []).some(
        (item: any) => item.filterId === departmentField.wrapperUid,
      ),
    ).toBe(false);
  });

  it('should keep field capability inference aligned across catalog addField and apply', async () => {
    const page = await createPage(rootAgent, {
      title: 'Field capability page',
      tabTitle: 'Field capability tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const createFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const filterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableUid,
          },
        },
      }),
    );
    const createFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: createFormUid,
          },
        },
      }),
    );
    const filterCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: filterFormUid,
          },
        },
      }),
    );

    const formNicknameField = createFormCatalog.fields.find((item: any) => item.key === 'nickname');
    const formStatusField = createFormCatalog.fields.find((item: any) => item.key === 'status');
    const tableNicknameField = tableCatalog.fields.find((item: any) => item.key === 'nickname');
    const filterNicknameField = filterCatalog.fields.find(
      (item: any) => item.key === 'nickname' && (item.targetBlockUid === tableUid || !item.targetBlockUid),
    );

    expect(formNicknameField).toMatchObject({
      use: 'FormItemModel',
      fieldUse: 'InputFieldModel',
    });
    expect(tableNicknameField).toMatchObject({
      use: 'TableColumnModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(filterNicknameField).toMatchObject({
      use: 'FilterFormItemModel',
      fieldUse: 'InputFieldModel',
    });

    const explicitFormField = await addField(rootAgent, createFormUid, 'nickname', {
      fieldUse: formNicknameField.fieldUse,
    });
    expect(explicitFormField.fieldUse).toBe(formNicknameField.fieldUse);

    const explicitFormFieldReadback = await getSurface(rootAgent, {
      uid: explicitFormField.fieldUid,
    });
    expect(explicitFormFieldReadback.tree.use).toBe(formNicknameField.fieldUse);

    const mismatchedFieldUseRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: createFormUid,
        },
        fieldPath: 'nickname',
        fieldUse: tableNicknameField.fieldUse,
      },
    });
    expect(mismatchedFieldUseRes.status).toBe(400);
    expect(readErrorMessage(mismatchedFieldUseRes)).toContain(`does not match inferred fieldUse`);

    const unknownFieldUseRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: createFormUid,
        },
        fieldPath: 'nickname',
        fieldUse: 'UnknownFieldModel',
      },
    });
    expect(unknownFieldUseRes.status).toBe(400);
    expect(readErrorMessage(unknownFieldUseRes)).toContain(`is not allowed under`);

    const explicitFilterField = await addField(rootAgent, filterFormUid, 'nickname', {
      defaultTargetUid: tableUid,
      fieldUse: filterNicknameField.fieldUse,
    });
    expect(explicitFilterField.fieldUse).toBe(filterNicknameField.fieldUse);

    const explicitFilterFieldReadback = await getSurface(rootAgent, {
      uid: explicitFilterField.fieldUid,
    });
    expect(explicitFilterFieldReadback.tree.use).toBe(filterNicknameField.fieldUse);

    const createFormGridUid = await getBlockGridUid(rootAgent, createFormUid);
    const applyFieldRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: createFormGridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                clientKey: 'catalog-form-field',
                use: formStatusField.use,
                stepParams: {
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'employees',
                      fieldPath: 'status',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: formStatusField.fieldUse,
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'employees',
                          fieldPath: 'status',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(applyFieldRes.status).toBe(200);
    expect(applyFieldRes.body.data.clientKeyToUid['catalog-form-field']).toBeTruthy();
  });

  it('should reject bound fields without interface in addField while keeping interface-backed fields working', async () => {
    const page = await createPage(rootAgent, {
      title: 'No interface field page',
      tabTitle: 'No interface field tab',
    });

    const rolesTableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'roles',
    });
    const rolesDetailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'roles',
    });
    const rolesEditFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'editForm', {
      dataSourceKey: 'main',
      collectionName: 'roles',
    });

    for (const [targetUid, fieldPath] of [
      [rolesTableUid, 'default'],
      [rolesDetailsUid, 'hidden'],
      [rolesEditFormUid, 'default'],
    ] as Array<[string, string]>) {
      const invalidRes = await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: targetUid,
          },
          fieldPath,
        },
      });
      expect(invalidRes.status).toBe(400);
      expect(readErrorMessage(invalidRes)).toContain(`roles.${fieldPath}`);
      expect(readErrorMessage(invalidRes)).toContain('has no interface');
    }

    const validField = await addField(rootAgent, rolesTableUid, 'title');
    const validFieldReadback = await getSurface(rootAgent, {
      uid: validField.fieldUid,
    });
    expect(validFieldReadback.tree.use).toBe('DisplayTextFieldModel');
  });

  it('should keep representative advanced action visibility aligned between catalog and direct addAction', async () => {
    const page = await createPage(rootAgent, {
      title: 'Action visibility page',
      tabTitle: 'Action visibility tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const createFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const filterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const treeTableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'categories',
    });
    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: treeTableUid,
            },
            changes: {
              treeTable: true,
            },
          },
        })
      ).status,
    ).toBe(200);

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableUid,
          },
        },
      }),
    );
    const createFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: createFormUid,
          },
        },
      }),
    );
    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: detailsUid,
          },
        },
      }),
    );
    const filterFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: filterFormUid,
          },
        },
      }),
    );
    const treeTableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: treeTableUid,
          },
        },
      }),
    );
    expect(tableCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['expandCollapse', 'bulkEdit', 'bulkUpdate', 'upload', 'composeEmail']),
    );
    expect(tableCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['duplicate', 'composeEmail']),
    );
    expect(tableCatalog.recordActions.find((item: any) => item.key === 'addChild')).toBeUndefined();
    expect(treeTableCatalog.recordActions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['duplicate', 'addChild', 'composeEmail']),
    );
    expect(createFormCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['submit', 'js', 'jsItem', 'triggerWorkflow']),
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
        'templatePrint',
        'triggerWorkflow',
      ]),
    );
    expect(filterFormCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['submit', 'reset', 'collapse', 'js']),
    );

    const tableBulkEdit = await addAction(rootAgent, tableUid, 'bulkEdit');
    const rowAddChild = await addRecordAction(rootAgent, treeTableUid, 'addChild');
    const formSubmit = await addAction(rootAgent, createFormUid, 'submit');
    const filterCollapse = await addAction(rootAgent, filterFormUid, 'collapse');
    const detailsTemplatePrint = await addRecordAction(rootAgent, detailsUid, 'templatePrint');

    expect((await getSurface(rootAgent, { uid: tableBulkEdit.uid })).tree.use).toBe('BulkEditActionModel');
    expect((await getSurface(rootAgent, { uid: rowAddChild.uid })).tree.use).toBe('AddChildActionModel');
    expect((await getSurface(rootAgent, { uid: formSubmit.uid })).tree.use).toBe('FormSubmitActionModel');
    expect((await getSurface(rootAgent, { uid: filterCollapse.uid })).tree.use).toBe('FilterFormCollapseActionModel');
    expect((await getSurface(rootAgent, { uid: detailsTemplatePrint.uid })).tree.use).toBe(
      'TemplatePrintRecordActionModel',
    );
    expect(
      (await getSurface(rootAgent, { uid: rowAddChild.uid })).tree.stepParams?.popupSettings?.openView,
    ).toMatchObject({
      mode: 'drawer',
      size: 'medium',
    });
  });

  it('should reject addChild on non-tree tables without creating a table actions column', async () => {
    const page = await createPage(rootAgent, {
      title: 'Add child validation page',
      tabTitle: 'Add child validation tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const beforeReadback = await getSurface(rootAgent, {
      uid: tableUid,
    });
    const beforeActionColumns = _.castArray(beforeReadback.tree.subModels?.columns || []).filter(
      (item: any) => item?.use === 'TableActionsColumnModel',
    );
    const beforeActionColumnUids = beforeActionColumns.map((item: any) => item?.uid).filter(Boolean);
    const beforeActionUids = beforeActionColumns.flatMap((item: any) =>
      _.castArray(item?.subModels?.actions || [])
        .map((action: any) => action?.uid)
        .filter(Boolean),
    );
    expect(
      beforeActionColumns.flatMap((item: any) =>
        _.castArray(item?.subModels?.actions || []).map((action: any) => action?.use),
      ),
    ).not.toContain('AddChildActionModel');

    const addChildRes = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: tableUid,
        },
        type: 'addChild',
      },
    });
    expect(addChildRes.status).toBe(400);
    expect(readErrorMessage(addChildRes)).toContain('tree table');

    const afterReadback = await getSurface(rootAgent, {
      uid: tableUid,
    });
    const afterActionColumns = _.castArray(afterReadback.tree.subModels?.columns || []).filter(
      (item: any) => item?.use === 'TableActionsColumnModel',
    );
    const afterActionColumnUids = afterActionColumns.map((item: any) => item?.uid).filter(Boolean);
    const afterActionUids = afterActionColumns.flatMap((item: any) =>
      _.castArray(item?.subModels?.actions || [])
        .map((action: any) => action?.uid)
        .filter(Boolean),
    );
    expect(
      afterActionColumns.flatMap((item: any) =>
        _.castArray(item?.subModels?.actions || []).map((action: any) => action?.use),
      ),
    ).not.toContain('AddChildActionModel');
    expect(afterActionColumnUids).toEqual(beforeActionColumnUids);
    expect(afterActionUids).toEqual(beforeActionUids);
  });

  it('should expose js public capabilities consistently across catalog, direct APIs and configure', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS capability page',
      tabTitle: 'JS capability tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const createFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const filterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const actionPanelUid = await addBlock(rootAgent, page.tabSchemaUid, 'actionPanel', {});
    const jsBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'jsBlock', {});
    const composedJsBlockRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.gridUid,
          },
          blocks: [
            {
              key: 'composedHero',
              type: 'jsBlock',
              settings: {
                title: 'Composed hero',
                description: 'Composed through flowSurfaces',
                className: 'composed-hero',
                version: '1.0.0',
                code: "return { type: 'div', children: ['Composed hero'] };",
              },
            },
          ],
        },
      }),
    );
    const composedJsBlockUid = composedJsBlockRes.blocks?.[0]?.uid;
    expect(composedJsBlockUid).toBeTruthy();

    const pageCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
        },
      }),
    );
    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableUid,
          },
        },
      }),
    );
    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: detailsUid,
          },
        },
      }),
    );
    const createFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: createFormUid,
          },
        },
      }),
    );
    const filterFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: filterFormUid,
          },
        },
      }),
    );
    const actionPanelCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: actionPanelUid,
          },
        },
      }),
    );

    expect(pageCatalog.blocks.map((item: any) => item.key)).toContain('jsBlock');
    expect(tableCatalog.fields.find((item: any) => item.key === 'js:nickname')).toMatchObject({
      use: 'TableColumnModel',
      fieldUse: 'JSFieldModel',
      renderer: 'js',
    });
    expect(tableCatalog.fields.find((item: any) => item.key === 'jsColumn')).toMatchObject({
      use: 'JSColumnModel',
      fieldUse: 'JSColumnModel',
      type: 'jsColumn',
    });
    expect(createFormCatalog.fields.find((item: any) => item.key === 'js:nickname')).toMatchObject({
      use: 'FormItemModel',
      fieldUse: 'JSEditableFieldModel',
      renderer: 'js',
    });
    expect(createFormCatalog.fields.find((item: any) => item.key === 'jsItem')).toMatchObject({
      use: 'JSItemModel',
      fieldUse: 'JSItemModel',
      type: 'jsItem',
    });
    expect(filterFormCatalog.fields.some((item: any) => item.renderer === 'js' || item.type === 'jsItem')).toBe(false);

    expect(tableCatalog.actions.map((item: any) => item.key)).toContain('js');
    expect(detailsCatalog.recordActions.map((item: any) => item.key)).toContain('js');
    expect(createFormCatalog.actions.map((item: any) => item.key)).toContain('js');
    expect(createFormCatalog.actions.find((item: any) => item.key === 'jsItem')).toMatchObject({
      use: 'JSItemActionModel',
    });
    expect(filterFormCatalog.actions.map((item: any) => item.key)).toContain('js');
    expect(actionPanelCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['js', 'triggerWorkflow']),
    );

    const table = await flowRepo.findModelById(tableUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;
    expect(actionsColumnUid).toBeTruthy();

    const tableJsAction = await addAction(rootAgent, tableUid, 'js');
    const rowJsAction = await addRecordAction(rootAgent, tableUid, 'js');
    const detailsJsAction = await addRecordAction(rootAgent, detailsUid, 'js');
    const formJsAction = await addAction(rootAgent, createFormUid, 'js');
    const formJsItemAction = await addAction(rootAgent, createFormUid, 'jsItem');
    const filterJsAction = await addAction(rootAgent, filterFormUid, 'js');
    const panelJsAction = await addAction(rootAgent, actionPanelUid, 'js');

    expect((await getSurface(rootAgent, { uid: tableJsAction.uid })).tree.use).toBe('JSCollectionActionModel');
    expect((await getSurface(rootAgent, { uid: rowJsAction.uid })).tree.use).toBe('JSRecordActionModel');
    expect((await getSurface(rootAgent, { uid: detailsJsAction.uid })).tree.use).toBe('JSRecordActionModel');
    expect((await getSurface(rootAgent, { uid: formJsAction.uid })).tree.use).toBe('JSFormActionModel');
    expect((await getSurface(rootAgent, { uid: formJsItemAction.uid })).tree.use).toBe('JSItemActionModel');
    expect((await getSurface(rootAgent, { uid: filterJsAction.uid })).tree.use).toBe('FilterFormJSActionModel');
    expect((await getSurface(rootAgent, { uid: panelJsAction.uid })).tree.use).toBe('JSActionModel');

    const tableJsField = await addField(rootAgent, tableUid, 'nickname', {
      renderer: 'js',
    });
    const detailsJsField = await addField(rootAgent, detailsUid, 'nickname', {
      renderer: 'js',
    });
    const formJsField = await addField(rootAgent, createFormUid, 'nickname', {
      renderer: 'js',
    });
    const jsColumn = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: tableUid,
          },
          type: 'jsColumn',
          settings: {
            title: 'JS runtime column',
          },
        },
      }),
    );
    const jsItem = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: createFormUid,
          },
          type: 'jsItem',
          settings: {
            label: 'JS runtime item',
          },
        },
      }),
    );

    expect(tableJsField.renderer).toBe('js');
    expect(formJsField.renderer).toBe('js');
    expect(jsColumn.type).toBe('jsColumn');
    expect(jsItem.type).toBe('jsItem');
    expect((await getSurface(rootAgent, { uid: tableJsField.fieldUid })).tree.use).toBe('JSFieldModel');
    expect((await getSurface(rootAgent, { uid: detailsJsField.fieldUid })).tree.use).toBe('JSFieldModel');
    expect((await getSurface(rootAgent, { uid: formJsField.fieldUid })).tree.use).toBe('JSEditableFieldModel');
    expect((await getSurface(rootAgent, { uid: jsColumn.uid })).tree.use).toBe('JSColumnModel');
    expect((await getSurface(rootAgent, { uid: jsItem.uid })).tree.use).toBe('JSItemModel');

    const invalidFilterRenderer = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: filterFormUid,
        },
        fieldPath: 'nickname',
        renderer: 'js',
        defaultTargetUid: tableUid,
      },
    });
    expect(invalidFilterRenderer.status).toBe(400);
    expect(readErrorMessage(invalidFilterRenderer)).toContain(`renderer 'js' is not allowed`);

    const invalidFormJsColumn = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: createFormUid,
        },
        type: 'jsColumn',
      },
    });
    expect(invalidFormJsColumn.status).toBe(400);
    expect(readErrorMessage(invalidFormJsColumn)).toContain(`field type 'jsColumn'`);

    const invalidTableJsItem = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: tableUid,
        },
        type: 'jsItem',
      },
    });
    expect(invalidTableJsItem.status).toBe(400);
    expect(readErrorMessage(invalidTableJsItem)).toContain(`field type 'jsItem'`);

    const jsBlockConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: jsBlockUid,
        },
        changes: {
          title: 'Users hero',
          description: 'JS block summary',
          className: 'users-hero',
          version: '1.0.1',
          code: "return { type: 'div', children: ['Users hero'] };",
        },
      },
    });
    expect(jsBlockConfigureRes.status).toBe(200);

    const jsFieldConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tableJsField.wrapperUid,
        },
        changes: {
          label: 'Nickname JS',
          version: '1.0.1',
          code: "return record.nickname?.toUpperCase?.() || '';",
        },
      },
    });
    expect(jsFieldConfigureRes.status).toBe(200);

    const jsActionConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: panelJsAction.uid,
        },
        changes: {
          title: 'Run diagnostics',
          version: '1.0.1',
          code: 'await ctx.runjs(\'console.log("diagnostics")\');',
        },
      },
    });
    expect(jsActionConfigureRes.status).toBe(200);

    const jsItemActionConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: formJsItemAction.uid,
        },
        changes: {
          title: 'Run item diagnostics',
          version: '1.0.1',
          code: 'await ctx.runjs(\'console.log("item diagnostics")\');',
        },
      },
    });
    expect(jsItemActionConfigureRes.status).toBe(200);

    const jsColumnConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: jsColumn.uid,
        },
        changes: {
          title: 'JS column',
          width: 280,
          fixed: 'left',
          version: '1.0.1',
          code: 'return record.nickname;',
        },
      },
    });
    expect(jsColumnConfigureRes.status).toBe(200);

    const jsItemConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: jsItem.uid,
        },
        changes: {
          label: 'JS item',
          showLabel: true,
          labelWidth: 120,
          version: '1.0.1',
          code: 'return record.nickname;',
        },
      },
    });
    expect(jsItemConfigureRes.status).toBe(200);

    const jsBlockReadback = await getSurface(rootAgent, { uid: jsBlockUid });
    const composedJsBlockReadback = await getSurface(rootAgent, { uid: composedJsBlockUid });
    const jsFieldReadback = await getSurface(rootAgent, { uid: tableJsField.fieldUid });
    const jsActionReadback = await getSurface(rootAgent, { uid: panelJsAction.uid });
    const jsItemActionReadback = await getSurface(rootAgent, { uid: formJsItemAction.uid });
    const jsColumnReadback = await getSurface(rootAgent, { uid: jsColumn.uid });
    const jsItemReadback = await getSurface(rootAgent, { uid: jsItem.uid });

    expect(jsBlockReadback.tree.use).toBe('JSBlockModel');
    expect(composedJsBlockReadback.tree.use).toBe('JSBlockModel');
    expect(composedJsBlockReadback.tree.decoratorProps).toMatchObject({
      title: 'Composed hero',
      description: 'Composed through flowSurfaces',
      className: 'composed-hero',
    });
    expect(jsBlockReadback.tree.decoratorProps).toMatchObject({
      title: 'Users hero',
      description: 'JS block summary',
      className: 'users-hero',
    });
    expect(jsBlockReadback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '1.0.1',
      code: "return { type: 'div', children: ['Users hero'] };",
    });
    expect(jsFieldReadback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '1.0.1',
      code: "return record.nickname?.toUpperCase?.() || '';",
    });
    expect(jsActionReadback.tree.stepParams?.clickSettings?.runJs).toMatchObject({
      version: '1.0.1',
      code: 'await ctx.runjs(\'console.log("diagnostics")\');',
    });
    expect(jsItemActionReadback.tree.stepParams?.clickSettings?.runJs).toMatchObject({
      version: '1.0.1',
      code: 'await ctx.runjs(\'console.log("item diagnostics")\');',
    });
    expect(jsColumnReadback.tree.props).toMatchObject({
      title: 'JS column',
      width: 280,
      fixed: 'left',
    });
    expect(jsColumnReadback.tree.stepParams?.tableColumnSettings).toMatchObject({
      title: {
        title: 'JS column',
      },
      width: {
        width: 280,
      },
      fixed: {
        fixed: 'left',
      },
    });
    expect(jsColumnReadback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '1.0.1',
      code: 'return record.nickname;',
    });
    expect(jsItemReadback.tree.props).toMatchObject({
      label: 'JS item',
      showLabel: true,
    });
    expect(jsItemReadback.tree.decoratorProps).toMatchObject({
      labelWidth: 120,
    });
    expect(jsItemReadback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      version: '1.0.1',
      code: 'return record.nickname;',
    });
  });

  it('should mirror props-backed table and field settings into stepParams for configure and updateSettings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Settings mirror page',
      tabTitle: 'Settings mirror tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const createFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const detailsUid = await addBlock(rootAgent, page.tabSchemaUid, 'details', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const filterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const tableField = await addField(rootAgent, tableUid, 'nickname');
    const formField = await addField(rootAgent, createFormUid, 'nickname');
    const detailsField = await addField(rootAgent, detailsUid, 'department.title');
    const filterField = await addField(rootAgent, filterFormUid, 'status', {
      defaultTargetUid: tableUid,
    });

    const tableConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: tableField.wrapperUid,
        },
        changes: {
          title: 'Nickname column',
          tooltip: 'Nickname tooltip',
          width: 360,
          fixed: 'right',
          sorter: true,
          editable: true,
        },
      },
    });
    expect(tableConfigureRes.status).toBe(200);

    const formUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: formField.wrapperUid,
        },
        props: {
          label: 'Nickname field',
          showLabel: false,
          tooltip: 'Nickname help',
          extra: 'Nickname description',
          initialValue: 'guest',
          required: true,
        },
      },
    });
    expect(formUpdateRes.status).toBe(200);

    const detailsUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: detailsField.wrapperUid,
        },
        props: {
          label: 'Department label',
          showLabel: false,
          tooltip: 'Department help',
          extra: 'Department description',
        },
      },
    });
    expect(detailsUpdateRes.status).toBe(200);

    const filterUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: filterField.wrapperUid,
        },
        props: {
          label: 'Status label',
          showLabel: false,
          tooltip: 'Status help',
          extra: 'Status description',
          initialValue: 'active',
        },
      },
    });
    expect(filterUpdateRes.status).toBe(200);

    const formBlockUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: createFormUid,
        },
        decoratorProps: {
          labelWidth: 180,
          labelWrap: false,
        },
      },
    });
    expect(formBlockUpdateRes.status).toBe(200);

    const tableReadback = await getSurface(rootAgent, { uid: tableField.wrapperUid });
    const formReadback = await getSurface(rootAgent, { uid: formField.wrapperUid });
    const detailsReadback = await getSurface(rootAgent, { uid: detailsField.wrapperUid });
    const filterReadback = await getSurface(rootAgent, { uid: filterField.wrapperUid });
    const formBlockReadback = await getSurface(rootAgent, { uid: createFormUid });

    expect(tableReadback.tree.stepParams?.tableColumnSettings).toMatchObject({
      title: {
        title: 'Nickname column',
      },
      tooltip: {
        tooltip: 'Nickname tooltip',
      },
      width: {
        width: 360,
      },
      fixed: {
        fixed: 'right',
      },
      sorter: {
        sorter: true,
      },
      quickEdit: {
        editable: true,
      },
    });

    expect(formReadback.tree.stepParams?.editItemSettings).toMatchObject({
      label: {
        label: 'Nickname field',
      },
      showLabel: {
        showLabel: false,
      },
      tooltip: {
        tooltip: 'Nickname help',
      },
      description: {
        description: 'Nickname description',
      },
      initialValue: {
        defaultValue: 'guest',
      },
      required: {
        required: true,
      },
    });

    expect(detailsReadback.tree.stepParams?.detailItemSettings).toMatchObject({
      label: {
        title: 'Department label',
      },
      showLabel: {
        showLabel: false,
      },
      tooltip: {
        tooltip: 'Department help',
      },
      description: {
        description: 'Department description',
      },
    });

    expect(filterReadback.tree.stepParams?.filterFormItemSettings).toMatchObject({
      label: {
        label: 'Status label',
      },
      showLabel: {
        showLabel: false,
      },
      tooltip: {
        tooltip: 'Status help',
      },
      description: {
        description: 'Status description',
      },
      initialValue: {
        defaultValue: 'active',
      },
    });

    expect(formBlockReadback.tree.stepParams?.formModelSettings?.layout).toMatchObject({
      labelWidth: 180,
      labelWrap: false,
    });
  });

  it('should compile supported js public capabilities through apply', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS apply page',
      tabTitle: 'JS apply tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const createFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const actionPanelUid = await addBlock(rootAgent, page.tabSchemaUid, 'actionPanel', {});

    const formGridUid = await getBlockGridUid(rootAgent, createFormUid);
    expect(formGridUid).toBeTruthy();

    const tableApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: tableUid,
        },
        spec: {
          subModels: {
            columns: [
              {
                clientKey: 'js-column',
                use: 'JSColumnModel',
                props: {
                  title: 'JS apply column',
                },
                stepParams: {
                  jsSettings: {
                    runJs: {
                      version: '1.0.0',
                      code: 'return record.nickname;',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(tableApply.status).toBe(200);
    const jsColumnUid = tableApply.body.data.clientKeyToUid['js-column'];
    expect(jsColumnUid).toBeTruthy();
    expect((await getSurface(rootAgent, { uid: jsColumnUid })).tree.use).toBe('JSColumnModel');

    const formApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: formGridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                clientKey: 'js-item',
                use: 'JSItemModel',
                props: {
                  label: 'JS apply item',
                },
                stepParams: {
                  jsSettings: {
                    runJs: {
                      version: '1.0.0',
                      code: 'return record.nickname;',
                    },
                  },
                },
              },
              {
                clientKey: 'js-bound-field',
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'employees',
                      fieldPath: 'nickname',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'employees',
                          fieldPath: 'nickname',
                        },
                      },
                      jsSettings: {
                        runJs: {
                          version: '1.0.0',
                          code: 'return record.nickname;',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(formApply.status).toBe(200);
    const jsItemUid = formApply.body.data.clientKeyToUid['js-item'];
    const jsBoundWrapperUid = formApply.body.data.clientKeyToUid['js-bound-field'];
    expect(jsItemUid).toBeTruthy();
    expect(jsBoundWrapperUid).toBeTruthy();
    expect((await getSurface(rootAgent, { uid: jsItemUid })).tree.use).toBe('JSItemModel');
    const jsBoundFieldReadback = await getSurface(rootAgent, { uid: jsBoundWrapperUid });
    expect(jsBoundFieldReadback.tree.use).toBe('FormItemModel');
    expect(jsBoundFieldReadback.tree.subModels?.field?.use).toBe('JSEditableFieldModel');

    const panelApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: actionPanelUid,
        },
        spec: {
          subModels: {
            actions: [
              {
                clientKey: 'js-panel-action',
                use: 'JSActionModel',
                props: {
                  title: 'Run JS',
                },
                stepParams: {
                  clickSettings: {
                    runJs: {
                      version: '1.0.0',
                      code: 'return 1;',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(panelApply.status).toBe(200);
    const jsPanelActionUid = panelApply.body.data.clientKeyToUid['js-panel-action'];
    expect(jsPanelActionUid).toBeTruthy();
    expect((await getSurface(rootAgent, { uid: jsPanelActionUid })).tree.use).toBe('JSActionModel');
  });

  it('should fail apply compilation early for non-public block action and field capabilities', async () => {
    const page = await createPage(rootAgent, {
      title: 'Apply capability page',
      tabTitle: 'Apply capability tab',
    });

    const unknownBlockApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: page.gridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                use: 'UnknownBlockModel',
              },
            ],
          },
        },
      },
    });
    expect(unknownBlockApply.status).toBe(400);
    expect(readErrorMessage(unknownBlockApply)).toContain(`block 'UnknownBlockModel' is not a public capability`);

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;

    const unknownActionApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        spec: {
          subModels: {
            actions: [
              {
                use: 'UnknownActionModel',
              },
            ],
          },
        },
      },
    });
    expect(unknownActionApply.status).toBe(400);
    expect(readErrorMessage(unknownActionApply)).toContain(`action 'UnknownActionModel' is not a public capability`);

    const createFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const formGridUid = await getBlockGridUid(rootAgent, createFormUid);

    const invalidWrapperApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: formGridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                use: 'TableColumnModel',
                stepParams: {
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'employees',
                      fieldPath: 'nickname',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'InputFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'employees',
                          fieldPath: 'nickname',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(invalidWrapperApply.status).toBe(400);
    expect(readErrorMessage(invalidWrapperApply)).toContain(`field wrapper 'TableColumnModel'`);

    const invalidFieldUseApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: formGridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'employees',
                      fieldPath: 'nickname',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'DisplayTextFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'employees',
                          fieldPath: 'nickname',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(invalidFieldUseApply.status).toBe(400);
    expect(readErrorMessage(invalidFieldUseApply)).toContain(`fieldUse 'DisplayTextFieldModel'`);
  });

  it('should support mutate key chain rollback apply replace subtree and stable get readback', async () => {
    const pageSchemaUid = 'rollback_page_schema_uid';
    const tabSchemaUid = 'rollback_tab_schema_uid';
    const rollbackRes = await rootAgent.resource('flowSurfaces').mutate({
      values: {
        atomic: true,
        ops: [
          {
            opId: 'page',
            type: 'createPage',
            values: {
              pageSchemaUid,
              tabSchemaUid,
              title: 'Rollback page',
              tabTitle: 'Rollback tab',
            },
          },
          {
            opId: 'block',
            type: 'addBlock',
            values: {
              target: {
                uid: {
                  key: 'page.tabSchemaUid',
                },
              },
              type: 'details',
              resourceInit: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
            },
          },
          {
            type: 'addField',
            values: {
              target: {
                uid: {
                  key: 'block.uid',
                },
              },
              fieldPath: 'not_exists',
            },
          },
        ],
      },
    });
    expect(rollbackRes.status).toBe(400);
    expect(
      await routesRepo.findOne({
        filter: {
          schemaUid: pageSchemaUid,
        },
      }),
    ).toBeNull();

    const page = await createPage(rootAgent, {
      title: 'Apply page',
      tabTitle: 'Apply tab',
    });
    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const gridUid = await getBlockGridUid(rootAgent, formUid);

    const applyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: gridUid,
        },
        spec: {
          props: {
            rows: {
              row1: [['field-a']],
            },
            sizes: {
              row1: [24],
            },
            rowOrder: ['row1'],
          },
          subModels: {
            items: [
              {
                clientKey: 'field-a',
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'employees',
                      fieldPath: 'nickname',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'InputFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'employees',
                          fieldPath: 'nickname',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(applyRes.status).toBe(200);
    expect(applyRes.body.data.clientKeyToUid['field-a']).toBeTruthy();

    const tabApplyTarget = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: { uid: page.tabSchemaUid },
        spec: {
          props: {
            title: 'Apply tab updated',
            icon: 'TableOutlined',
          },
          stepParams: {
            pageTabSettings: {
              tab: {
                title: 'Apply tab updated',
                icon: 'TableOutlined',
                documentTitle: 'Apply tab document',
              },
            },
          },
          flowRegistry: {
            beforeRenderApply: {
              key: 'beforeRenderApply',
              on: 'beforeRender',
              steps: {},
            },
          },
        },
      },
    });
    expect(tabApplyTarget.status).toBe(200);

    const firstReadback = await getSurface(rootAgent, {
      uid: formUid,
    });
    const secondReadback = await getSurface(rootAgent, {
      uid: formUid,
    });
    const tabReadback = await getSurface(rootAgent, {
      tabSchemaUid: page.tabSchemaUid,
    });
    const tabRoute = await routesRepo.findOne({
      filter: {
        schemaUid: page.tabSchemaUid,
      },
    });
    expect(_.castArray(firstReadback.tree.subModels?.grid?.subModels?.items || [])[0]?.uid).toBe(
      applyRes.body.data.clientKeyToUid['field-a'],
    );
    expect(tabReadback.tree.stepParams?.pageTabSettings?.tab).toMatchObject({
      title: 'Apply tab updated',
      icon: 'TableOutlined',
      documentTitle: 'Apply tab document',
    });
    expect(_.castArray(tabReadback.tree.subModels?.grid?.subModels?.items || [])[0]?.uid).toBeTruthy();
    expect(tabRoute?.get('title')).toBe('Apply tab updated');
    expect(tabRoute?.get('icon')).toBe('TableOutlined');
    expect(tabRoute?.get('options').documentTitle).toBe('Apply tab document');
    expect(tabRoute?.get('options').flowRegistry).toEqual({
      beforeRenderApply: {
        key: 'beforeRenderApply',
        on: 'beforeRender',
        steps: {},
      },
    });
    expect(createFlowSurfaceFixture(firstReadback).canonical).toEqual(
      createFlowSurfaceFixture(secondReadback).canonical,
    );
  });

  it('should apply replace on page target with tab add update move remove and existing client key reuse', async () => {
    const page = await createPage(rootAgent, {
      title: 'Apply page root',
      tabTitle: 'Main tab',
      enableTabs: true,
    });

    const secondaryTab = await getData(
      await rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: { uid: page.pageUid },
          title: 'Secondary tab',
          documentTitle: 'Secondary tab document',
        },
      }),
    );

    const pageApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: { uid: page.pageUid },
        spec: {
          props: {
            title: 'Apply page root updated',
            enableTabs: true,
          },
          stepParams: {
            pageSettings: {
              general: {
                title: 'Apply page root updated',
                enableTabs: true,
              },
            },
          },
          subModels: {
            tabs: [
              {
                uid: secondaryTab.tabSchemaUid,
                clientKey: 'existing-tab',
                use: 'RootPageTabModel',
                props: {
                  title: 'Secondary first',
                },
                stepParams: {
                  pageTabSettings: {
                    tab: {
                      title: 'Secondary first',
                      documentTitle: 'Secondary first document',
                    },
                  },
                },
                subModels: {
                  grid: {
                    use: 'BlockGridModel',
                  },
                },
              },
              {
                clientKey: 'new-tab',
                use: 'RootPageTabModel',
                props: {
                  title: 'Fresh tab',
                },
                stepParams: {
                  pageTabSettings: {
                    tab: {
                      title: 'Fresh tab',
                      documentTitle: 'Fresh tab document',
                    },
                  },
                },
                subModels: {
                  grid: {
                    use: 'BlockGridModel',
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(pageApply.status).toBe(200);
    expect(pageApply.body.data.clientKeyToUid['existing-tab']).toBe(secondaryTab.tabSchemaUid);
    expect(pageApply.body.data.clientKeyToUid['new-tab']).toBeTruthy();

    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    expect(pageReadback.tree.props).toMatchObject({
      title: 'Apply page root updated',
      enableTabs: true,
    });
    const pageTabs = getRouteBackedTabs(pageReadback);
    expect(pageTabs).toHaveLength(2);
    expect(pageTabs[0].uid).toBe(secondaryTab.tabSchemaUid);
    expect(pageTabs[1].uid).toBe(pageApply.body.data.clientKeyToUid['new-tab']);
    expect(pageTabs[0].stepParams?.pageTabSettings?.tab?.title).toBe('Secondary first');
    expect(pageTabs[1].stepParams?.pageTabSettings?.tab?.title).toBe('Fresh tab');

    expect(
      await routesRepo.findOne({
        filter: {
          schemaUid: page.tabSchemaUid,
        },
      }),
    ).toBeNull();

    const pageApplyWithoutTabs = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: { uid: page.pageUid },
        spec: {
          props: {
            title: 'Apply page wrapper only',
            enableTabs: true,
          },
          stepParams: {
            pageSettings: {
              general: {
                title: 'Apply page wrapper only',
                enableTabs: true,
              },
            },
          },
        },
      },
    });
    expect(pageApplyWithoutTabs.status).toBe(200);

    const pageReadbackAfterWrapperOnly = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const pageTabsAfterWrapperOnly = getRouteBackedTabs(pageReadbackAfterWrapperOnly);
    expect(pageTabsAfterWrapperOnly).toHaveLength(2);
    expect(pageTabsAfterWrapperOnly[0].uid).toBe(secondaryTab.tabSchemaUid);
    expect(pageTabsAfterWrapperOnly[1].uid).toBe(pageApply.body.data.clientKeyToUid['new-tab']);
  });

  it('should apply replace on popup page target and keep popup subtree canonical', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup apply page',
      tabTitle: 'Popup apply tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableBlockUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;
    const viewAction = await addAction(rootAgent, tableBlockUid, 'view');

    await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: viewAction.uid,
        },
        type: 'details',
        resource: {
          binding: 'currentRecord',
        },
      },
    });

    const popupBefore = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const popupPageUid = popupBefore.tree.subModels?.page?.uid;
    const popupTabUid = _.castArray(popupBefore.tree.subModels?.page?.subModels?.tabs || [])[0]?.uid;
    expect(popupPageUid).toBeTruthy();
    expect(popupTabUid).toBeTruthy();

    const popupApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: popupPageUid,
        },
        spec: {
          props: {
            title: 'Popup surface',
            displayTitle: true,
            enableTabs: true,
          },
          stepParams: {
            pageSettings: {
              general: {
                title: 'Popup surface',
                displayTitle: true,
                enableTabs: true,
              },
            },
          },
          subModels: {
            tabs: [
              {
                uid: popupTabUid,
                use: 'ChildPageTabModel',
                props: {
                  title: 'Popup tab',
                },
                stepParams: {
                  pageTabSettings: {
                    tab: {
                      title: 'Popup tab',
                    },
                  },
                },
                subModels: {
                  grid: {
                    use: 'BlockGridModel',
                    props: {
                      rows: {
                        row1: [['popup-md']],
                      },
                      sizes: {
                        row1: [24],
                      },
                      rowOrder: ['row1'],
                    },
                    subModels: {
                      items: [
                        {
                          clientKey: 'popup-md',
                          use: 'MarkdownBlockModel',
                          props: {
                            content: 'Popup markdown body',
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(popupApply.status).toBe(200);
    expect(popupApply.body.data.clientKeyToUid['popup-md']).toBeTruthy();

    const popupAfter = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const popupPage = popupAfter.tree.subModels?.page;
    const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
    const popupGridItems = _.castArray(popupTab?.subModels?.grid?.subModels?.items || []);
    expect(popupPage.props).toMatchObject({
      title: 'Popup surface',
      displayTitle: true,
      enableTabs: true,
    });
    expect(popupTab.props).toMatchObject({
      title: 'Popup tab',
    });
    expect(popupGridItems).toHaveLength(1);
    expect(popupGridItems[0].use).toBe('MarkdownBlockModel');
    expect(popupGridItems[0].props?.content).toBe('Popup markdown body');

    const popupWrapperOnlyApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: popupPageUid,
        },
        spec: {
          props: {
            title: 'Popup surface wrapper only',
            displayTitle: true,
            enableTabs: true,
          },
          stepParams: {
            pageSettings: {
              general: {
                title: 'Popup surface wrapper only',
                displayTitle: true,
                enableTabs: true,
              },
            },
          },
        },
      },
    });
    expect(popupWrapperOnlyApply.status).toBe(200);

    const popupAfterWrapperOnly = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const popupItemsAfterWrapperOnly = _.castArray(
      popupAfterWrapperOnly.tree.subModels?.page?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [],
    );
    expect(popupItemsAfterWrapperOnly).toHaveLength(1);
    expect(popupItemsAfterWrapperOnly[0].props?.content).toBe('Popup markdown body');
  });

  it('should apply replace on popup host target and bootstrap popup wrapper settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup host apply page',
      tabTitle: 'Popup host apply tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableBlockUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;
    const viewAction = await addAction(rootAgent, tableBlockUid, 'view');

    const popupApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: viewAction.uid,
        },
        spec: {
          subModels: {
            page: {
              use: 'ChildPageModel',
              props: {
                title: 'Popup bootstrap',
                displayTitle: true,
                enableTabs: true,
              },
              stepParams: {
                pageSettings: {
                  general: {
                    title: 'Popup bootstrap',
                    documentTitle: 'Popup bootstrap document',
                    displayTitle: true,
                    enableTabs: true,
                  },
                },
              },
              flowRegistry: {
                popupPageFlow: {
                  key: 'popupPageFlow',
                  on: 'beforeRender',
                  steps: {},
                },
              },
              subModels: {
                tabs: [
                  {
                    use: 'ChildPageTabModel',
                    props: {
                      title: 'Bootstrap tab',
                      icon: 'EyeOutlined',
                    },
                    stepParams: {
                      pageTabSettings: {
                        tab: {
                          title: 'Bootstrap tab',
                          icon: 'EyeOutlined',
                          documentTitle: 'Popup bootstrap tab',
                        },
                      },
                    },
                    flowRegistry: {
                      popupTabFlow: {
                        key: 'popupTabFlow',
                        on: 'beforeRender',
                        steps: {},
                      },
                    },
                    subModels: {
                      grid: {
                        use: 'BlockGridModel',
                        flowRegistry: {
                          popupGridFlow: {
                            key: 'popupGridFlow',
                            on: 'beforeRender',
                            steps: {},
                          },
                        },
                        subModels: {
                          items: [
                            {
                              clientKey: 'popup-md',
                              use: 'MarkdownBlockModel',
                              props: {
                                content: 'Popup bootstrap body',
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });
    expect(popupApply.status).toBe(200);
    expect(popupApply.body.data.clientKeyToUid['popup-md']).toBeTruthy();

    const popupReadback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const popupPage = popupReadback.tree.subModels?.page;
    const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
    const popupGrid = popupTab?.subModels?.grid;
    const popupItems = _.castArray(popupGrid?.subModels?.items || []);
    expect(popupPage?.props).toMatchObject({
      title: 'Popup bootstrap',
      displayTitle: true,
      enableTabs: true,
    });
    expect(popupPage?.stepParams?.pageSettings?.general).toMatchObject({
      title: 'Popup bootstrap',
      documentTitle: 'Popup bootstrap document',
      displayTitle: true,
      enableTabs: true,
    });
    expect(popupPage?.flowRegistry).toMatchObject({
      popupPageFlow: {
        on: 'beforeRender',
      },
    });
    expect(popupTab?.props).toMatchObject({
      title: 'Bootstrap tab',
      icon: 'EyeOutlined',
    });
    expect(popupTab?.stepParams?.pageTabSettings?.tab).toMatchObject({
      title: 'Bootstrap tab',
      icon: 'EyeOutlined',
      documentTitle: 'Popup bootstrap tab',
    });
    expect(popupTab?.flowRegistry).toMatchObject({
      popupTabFlow: {
        on: 'beforeRender',
      },
    });
    expect(popupGrid?.flowRegistry).toMatchObject({
      popupGridFlow: {
        on: 'beforeRender',
      },
    });
    expect(popupItems).toHaveLength(1);
    expect(popupItems[0].props?.content).toBe('Popup bootstrap body');
  });

  it('should allow popup host apply bootstrap with an empty popup grid', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup skeleton page',
      tabTitle: 'Popup skeleton tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableBlockUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;
    const viewAction = await addAction(rootAgent, tableBlockUid, 'view');

    const popupApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: viewAction.uid,
        },
        spec: {
          subModels: {
            page: {
              use: 'ChildPageModel',
              subModels: {
                tabs: [
                  {
                    use: 'ChildPageTabModel',
                    subModels: {
                      grid: {
                        use: 'BlockGridModel',
                        subModels: {
                          items: [],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });
    expect(popupApply.status).toBe(200);

    const popupReadback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const popupPage = popupReadback.tree.subModels?.page;
    const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
    const popupGrid = popupTab?.subModels?.grid;
    const popupItems = _.castArray(popupGrid?.subModels?.items || []);
    expect(popupPage?.use).toBe('ChildPageModel');
    expect(popupTab?.use).toBe('ChildPageTabModel');
    expect(popupGrid?.use).toBe('BlockGridModel');
    expect(popupItems).toHaveLength(0);
    expect(popupGrid?.props).toMatchObject({
      rows: {},
      sizes: {},
      rowOrder: [],
    });
  });

  it('should preserve existing duplicate same-use blocks when apply matches by sibling order', async () => {
    const service = new FlowSurfacesService(app.pm.get('flow-engine') as any);
    const page = await service.transaction((transaction) =>
      service.createPage(
        {
          title: 'Duplicate markdown page',
          tabTitle: 'Duplicate markdown tab',
        },
        { transaction },
      ),
    );

    const firstBlock = await service.transaction((transaction) =>
      service.addBlock(
        {
          target: {
            uid: page.gridUid,
          },
          type: 'markdown',
          settings: {
            content: 'Alpha',
          },
        },
        { transaction },
      ),
    );
    const secondBlock = await service.transaction((transaction) =>
      service.addBlock(
        {
          target: {
            uid: page.gridUid,
          },
          type: 'markdown',
          settings: {
            content: 'Beta',
          },
        },
        { transaction },
      ),
    );

    const applyRes = await service.transaction((transaction) =>
      service.apply(
        {
          target: {
            uid: page.gridUid,
          },
          spec: {
            subModels: {
              items: [
                {
                  use: 'MarkdownBlockModel',
                  props: {
                    content: 'Alpha updated',
                  },
                },
                {
                  use: 'MarkdownBlockModel',
                  props: {
                    content: 'Beta updated',
                  },
                },
              ],
            },
          },
        },
        { transaction },
      ),
    );
    expect(applyRes).toBeTruthy();

    const readback = await service.get({
      uid: page.gridUid,
    });
    const items = _.castArray(readback.tree.subModels?.items || []);
    expect(items).toHaveLength(2);
    expect(items[0].uid).toBe(firstBlock.uid);
    expect(items[1].uid).toBe(secondBlock.uid);
    expect(items[0].props?.content).toBe('Alpha updated');
    expect(items[1].props?.content).toBe('Beta updated');
  });

  it('should preserve existing duplicate same-use actions when apply matches by sibling order', async () => {
    const page = await createPage(rootAgent, {
      title: 'Duplicate popup action page',
      tabTitle: 'Duplicate popup action tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableBlockUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;

    const firstPopup = await addRecordAction(rootAgent, tableBlockUid, 'popup', {
      settings: {
        title: 'Popup A',
      },
    });
    const secondPopup = await addRecordAction(rootAgent, tableBlockUid, 'popup', {
      settings: {
        title: 'Popup B',
      },
    });

    const applyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        spec: {
          subModels: {
            actions: [
              {
                use: 'PopupCollectionActionModel',
                props: {
                  title: 'Popup A updated',
                },
              },
              {
                use: 'PopupCollectionActionModel',
                props: {
                  title: 'Popup B updated',
                },
              },
            ],
          },
        },
      },
    });
    expect(applyRes.status).toBe(200);

    const readback = await getSurface(rootAgent, {
      uid: actionsColumnUid,
    });
    const actions = _.castArray(readback.tree.subModels?.actions || []);
    expect(actions).toHaveLength(2);
    expect(actions[0].uid).toBe(firstPopup.uid);
    expect(actions[1].uid).toBe(secondPopup.uid);
    expect(actions[0].props?.title).toBe('Popup A updated');
    expect(actions[1].props?.title).toBe('Popup B updated');
  });

  it('should reject ambiguous duplicate same-use reuse when apply cannot identify which node to keep', async () => {
    const page = await createPage(rootAgent, {
      title: 'Duplicate ambiguity page',
      tabTitle: 'Duplicate ambiguity tab',
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableBlockUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;

    await addRecordAction(rootAgent, tableBlockUid, 'popup', {
      settings: {
        title: 'Popup A',
      },
    });
    await addRecordAction(rootAgent, tableBlockUid, 'popup', {
      settings: {
        title: 'Popup B',
      },
    });

    const applyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: actionsColumnUid,
        },
        spec: {
          subModels: {
            actions: [
              {
                use: 'PopupCollectionActionModel',
                props: {
                  title: 'Only one popup remains',
                },
              },
            ],
          },
        },
      },
    });
    expect(applyRes.status).toBe(400);
  });

  it('should auto-generate deterministic layout for apply replace without explicit grid layout', async () => {
    const page = await createPage(rootAgent, {
      title: 'Auto layout page',
      tabTitle: 'Auto layout tab',
    });

    const createRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: page.gridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                clientKey: 'md-a',
                use: 'MarkdownBlockModel',
                props: {
                  content: 'A',
                },
              },
              {
                clientKey: 'md-b',
                use: 'MarkdownBlockModel',
                props: {
                  content: 'B',
                },
              },
            ],
          },
        },
      },
    });
    expect(createRes.status).toBe(200);

    const firstUid = createRes.body.data.clientKeyToUid['md-a'];
    const secondUid = createRes.body.data.clientKeyToUid['md-b'];
    const firstReadback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(firstReadback.tree.subModels?.grid?.props).toMatchObject({
      rowOrder: ['autoRow1', 'autoRow2'],
      rows: {
        autoRow1: [[firstUid]],
        autoRow2: [[secondUid]],
      },
      sizes: {
        autoRow1: [24],
        autoRow2: [24],
      },
    });
    await flowRepo.patch({
      uid: page.gridUid,
      stepParams: {
        legacyFlow: {
          legacyStep: {
            keep: true,
          },
        },
      },
    });

    const customLayout = await rootAgent.resource('flowSurfaces').setLayout({
      values: {
        target: {
          uid: page.gridUid,
        },
        rows: {
          legacyRow: [[firstUid], [secondUid]],
        },
        sizes: {
          legacyRow: [12, 12],
        },
        rowOrder: ['legacyRow'],
      },
    });
    expect(customLayout.status).toBe(200);
    const persistedGrid = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(persistedGrid?.stepParams).toMatchObject({
      legacyFlow: {
        legacyStep: {
          keep: true,
        },
      },
      gridSettings: {
        grid: {
          rows: {
            legacyRow: [[firstUid], [secondUid]],
          },
          sizes: {
            legacyRow: [12, 12],
          },
          rowOrder: ['legacyRow'],
        },
      },
    });

    const resetLegacyLayoutRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: page.gridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                uid: firstUid,
                use: 'MarkdownBlockModel',
                props: {
                  content: 'A',
                },
              },
              {
                uid: secondUid,
                use: 'MarkdownBlockModel',
                props: {
                  content: 'B',
                },
              },
            ],
          },
        },
      },
    });
    expect(resetLegacyLayoutRes.status).toBe(200);

    const resetReadback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(resetReadback.tree.subModels?.grid?.props).toMatchObject({
      rowOrder: ['autoRow1', 'autoRow2'],
      rows: {
        autoRow1: [[firstUid]],
        autoRow2: [[secondUid]],
      },
      sizes: {
        autoRow1: [24],
        autoRow2: [24],
      },
    });

    const reorderRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: page.gridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                uid: secondUid,
                use: 'MarkdownBlockModel',
                props: {
                  content: 'B updated',
                },
              },
              {
                uid: firstUid,
                use: 'MarkdownBlockModel',
                props: {
                  content: 'A updated',
                },
              },
            ],
          },
        },
      },
    });
    expect(reorderRes.status).toBe(200);

    const secondReadback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(secondReadback.tree.subModels?.grid?.props).toMatchObject({
      rowOrder: ['autoRow1', 'autoRow2'],
      rows: {
        autoRow1: [[secondUid]],
        autoRow2: [[firstUid]],
      },
      sizes: {
        autoRow1: [24],
        autoRow2: [24],
      },
    });

    const removeRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: page.gridUid,
        },
        spec: {
          subModels: {
            items: [
              {
                uid: secondUid,
                use: 'MarkdownBlockModel',
                props: {
                  content: 'Only B remains',
                },
              },
            ],
          },
        },
      },
    });
    expect(removeRes.status).toBe(200);

    const thirdReadback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(thirdReadback.tree.subModels?.grid?.props).toMatchObject({
      rowOrder: ['autoRow1'],
      rows: {
        autoRow1: [[secondUid]],
      },
      sizes: {
        autoRow1: [24],
      },
    });

    const tableBlockUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const table = await flowRepo.findModelById(tableBlockUid, { includeAsyncNode: true });
    const actionsColumnUid = _.castArray(table?.subModels?.columns || []).find(
      (column: any) => column.use === 'TableActionsColumnModel',
    )?.uid;
    const viewAction = await addAction(rootAgent, tableBlockUid, 'view');
    await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: viewAction.uid,
        },
        type: 'markdown',
        settings: {
          content: 'Bootstrap popup',
        },
      },
    });
    const popupHost = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const popupPageUid = popupHost.tree.subModels?.page?.uid;
    const popupTabUid = _.castArray(popupHost.tree.subModels?.page?.subModels?.tabs || [])[0]?.uid;

    const popupApply = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: popupPageUid,
        },
        spec: {
          subModels: {
            tabs: [
              {
                uid: popupTabUid,
                use: 'ChildPageTabModel',
                subModels: {
                  grid: {
                    use: 'BlockGridModel',
                    subModels: {
                      items: [
                        {
                          clientKey: 'popup-md',
                          use: 'MarkdownBlockModel',
                          props: {
                            content: 'Popup auto layout',
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
    expect(popupApply.status).toBe(200);

    const popupReadback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    expect(
      _.castArray(popupReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid?.props,
    ).toMatchObject({
      rowOrder: ['autoRow1'],
      sizes: {
        autoRow1: [24],
      },
    });
  });

  it('should auto-layout addBlock and addBlocks while preserving existing grid rows', async () => {
    const page = await createPage(rootAgent, {
      title: 'Add block auto layout page',
      tabTitle: 'Add block auto layout tab',
    });

    const firstBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
          settings: {
            content: 'Alpha',
          },
        },
      }),
    );

    let readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(readback.tree.subModels?.grid?.props).toMatchObject({
      rowOrder: ['autoRow1'],
      rows: {
        autoRow1: [[firstBlock.uid]],
      },
      sizes: {
        autoRow1: [24],
      },
    });

    const customLayout = await rootAgent.resource('flowSurfaces').setLayout({
      values: {
        target: {
          uid: page.gridUid,
        },
        rows: {
          legacyRow: [[firstBlock.uid]],
        },
        sizes: {
          legacyRow: [24],
        },
        rowOrder: ['legacyRow'],
      },
    });
    expect(customLayout.status).toBe(200);

    const secondBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
          settings: {
            content: 'Beta',
          },
        },
      }),
    );

    const batchAdd = getData(
      await rootAgent.resource('flowSurfaces').addBlocks({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'gamma',
              type: 'markdown',
              settings: {
                content: 'Gamma',
              },
            },
            {
              key: 'delta',
              type: 'markdown',
              settings: {
                content: 'Delta',
              },
            },
          ],
        },
      }),
    );
    expect(batchAdd.successCount).toBe(2);
    expect(batchAdd.errorCount).toBe(0);

    const thirdBlockUid = batchAdd.blocks[0].result.uid;
    const fourthBlockUid = batchAdd.blocks[1].result.uid;
    readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(readback.tree.subModels?.grid?.props).toMatchObject({
      rowOrder: ['legacyRow', 'appendRow1', 'appendRow2', 'appendRow3'],
      rows: {
        legacyRow: [[firstBlock.uid]],
        appendRow1: [[secondBlock.uid]],
        appendRow2: [[thirdBlockUid]],
        appendRow3: [[fourthBlockUid]],
      },
      sizes: {
        legacyRow: [24],
        appendRow1: [24],
        appendRow2: [24],
        appendRow3: [24],
      },
    });
  });

  it('should preserve existing layout when compose append omits layout', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose append preserve layout page',
      tabTitle: 'Compose append preserve layout tab',
    });

    const firstBlockUid = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
          settings: {
            content: 'Alpha',
          },
        },
      }),
    ).uid;
    const secondBlockUid = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
          settings: {
            content: 'Beta',
          },
        },
      }),
    ).uid;

    const customLayout = await rootAgent.resource('flowSurfaces').setLayout({
      values: {
        target: {
          uid: page.gridUid,
        },
        rows: {
          legacyRow: [[firstBlockUid], [secondBlockUid]],
        },
        sizes: {
          legacyRow: [8, 16],
        },
        rowOrder: ['legacyRow'],
      },
    });
    expect(customLayout.status).toBe(200);

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'gamma',
            type: 'markdown',
            settings: {
              content: 'Gamma',
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const gammaBlock = getComposeBlock(composed, 'gamma');
    expect(composed.layout).toMatchObject({
      rowOrder: ['legacyRow', 'appendRow1'],
      rows: {
        legacyRow: [[firstBlockUid], [secondBlockUid]],
        appendRow1: [[gammaBlock.uid]],
      },
      sizes: {
        legacyRow: [8, 16],
        appendRow1: [24],
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(readback.tree.subModels?.grid?.props).toMatchObject({
      rowOrder: ['legacyRow', 'appendRow1'],
      rows: {
        legacyRow: [[firstBlockUid], [secondBlockUid]],
        appendRow1: [[gammaBlock.uid]],
      },
      sizes: {
        legacyRow: [8, 16],
        appendRow1: [24],
      },
    });
  });

  it('should rebuild auto layout when compose append sees an invalid existing layout', async () => {
    const page = await createPage(rootAgent, {
      title: 'Compose append fallback page',
      tabTitle: 'Compose append fallback tab',
    });

    const firstBlockUid = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
          settings: {
            content: 'Alpha',
          },
        },
      }),
    ).uid;
    const secondBlockUid = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
          settings: {
            content: 'Beta',
          },
        },
      }),
    ).uid;

    const currentGrid = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    await flowRepo.patch({
      uid: page.gridUid,
      props: {
        ...(currentGrid?.props || {}),
        rows: {
          legacyRow: [[firstBlockUid]],
        },
        sizes: {
          legacyRow: [24],
        },
        rowOrder: ['legacyRow'],
      },
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'append',
        blocks: [
          {
            key: 'gamma',
            type: 'markdown',
            settings: {
              content: 'Gamma',
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const gammaBlock = getComposeBlock(composed, 'gamma');
    const readback = await getSurface(rootAgent, {
      uid: page.tabSchemaUid,
    });
    expect(readback.tree.subModels?.grid?.props).toMatchObject({
      rowOrder: ['autoRow1', 'autoRow2', 'autoRow3'],
      rows: {
        autoRow1: [[firstBlockUid]],
        autoRow2: [[secondBlockUid]],
        autoRow3: [[gammaBlock.uid]],
      },
      sizes: {
        autoRow1: [24],
        autoRow2: [24],
        autoRow3: [24],
      },
    });
  });

  it('should reject invalid settings paths events and layouts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validation page',
      tabTitle: 'Validation tab',
    });
    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const field = await addField(rootAgent, formUid, 'nickname');
    const gridUid = await getBlockGridUid(rootAgent, formUid);

    const invalidSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          forbiddenSettings: {
            foo: 'bar',
          },
        },
      },
    });
    expect(invalidSettings.status).toBe(400);

    const invalidNestedPath = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          displayFieldSettings: {
            clickToOpen: {
              unsupported: true,
            },
          },
        },
      },
    });
    expect(invalidNestedPath.status).toBe(400);

    const invalidFieldSettingsPath = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          fieldSettings: {
            editor: {
              widget: 'legacy',
            },
          },
        },
      },
    });
    expect(invalidFieldSettingsPath.status).toBe(400);

    const invalidWrapperFieldSettingsPathAgain = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.wrapperUid,
        },
        stepParams: {
          fieldSettings: {
            editor: {
              widget: 'legacy-wrapper',
            },
          },
        },
      },
    });
    expect(invalidWrapperFieldSettingsPathAgain.status).toBe(400);

    const invalidWrapperFieldSettingsPath = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.wrapperUid,
        },
        stepParams: {
          fieldSettings: {
            editor: {
              widget: 'legacy',
            },
          },
        },
      },
    });
    expect(invalidWrapperFieldSettingsPath.status).toBe(400);

    const invalidPopupSettingPath = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          popupSettings: {
            openView: {
              unsupported: true,
            },
          },
        },
      },
    });
    expect(invalidPopupSettingPath.status).toBe(400);

    const invalidPageType = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: page.pageUid },
        stepParams: {
          pageSettings: {
            general: {
              displayTitle: 'not-a-boolean',
            },
          },
        },
      },
    });
    expect(invalidPageType.status).toBe(400);

    const invalidFieldType = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          displayFieldSettings: {
            clickToOpen: {
              clickToOpen: 'bad-value',
            },
          },
        },
      },
    });
    expect(invalidFieldType.status).toBe(400);

    const configurePopupSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          popupSettings: {
            openView: {
              dataSourceKey: 'main',
              collectionName: 'employees',
              mode: 'drawer',
            },
          },
        },
      },
    });
    expect(configurePopupSettings.status).toBe(200);

    const validPopupFlow = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: field.fieldUid,
        },
        flowRegistry: {
          popupFlow: {
            key: 'popupFlow',
            on: {
              eventName: 'click',
              phase: 'beforeStep',
              flowKey: 'popupSettings',
              stepKey: 'openView',
            },
            steps: {},
          },
        },
      },
    });
    expect(validPopupFlow.status).toBe(200);

    const clearPopupSettingsWithBoundFlow = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          popupSettings: {},
        },
      },
    });
    expect(clearPopupSettingsWithBoundFlow.status).toBe(400);

    const invalidFlow = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: field.fieldUid,
        },
        flowRegistry: {
          badFlow: {
            key: 'badFlow',
            on: {
              eventName: 'submit',
              phase: 'beforeStep',
              flowKey: 'popupSettings',
              stepKey: 'missingStep',
            },
            steps: {},
          },
        },
      },
    });
    expect(invalidFlow.status).toBe(400);

    const clearPopupSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: field.fieldUid,
        },
        stepParams: {
          popupSettings: {},
        },
        flowRegistry: {},
      },
    });
    expect(clearPopupSettings.status).toBe(200);

    const invalidClearedPopupFlow = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: field.fieldUid,
        },
        flowRegistry: {
          clearedPopupFlow: {
            key: 'clearedPopupFlow',
            on: {
              eventName: 'click',
              phase: 'beforeStep',
              flowKey: 'popupSettings',
              stepKey: 'openView',
            },
            steps: {},
          },
        },
      },
    });
    expect(invalidClearedPopupFlow.status).toBe(400);

    const invalidResourceFlow = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: formUid,
        },
        flowRegistry: {
          badResourceFlow: {
            key: 'badResourceFlow',
            on: {
              eventName: 'beforeRender',
              phase: 'beforeStep',
              flowKey: 'resourceSettings',
              stepKey: 'init',
            },
            steps: {},
          },
        },
      },
    });
    expect(invalidResourceFlow.status).toBe(400);

    const invalidLayout = await rootAgent.resource('flowSurfaces').setLayout({
      values: {
        target: {
          uid: gridUid,
        },
        rows: {
          row1: [[field.wrapperUid]],
        },
        sizes: {},
        rowOrder: ['row1'],
      },
    });
    expect(invalidLayout.status).toBe(400);
  });

  it('should expose flowSurfaces:get as GET-only root locator query API', async () => {
    const page = await createPage(rootAgent, {
      title: 'GET surface page',
      tabTitle: 'GET surface tab',
    });

    const pageReadbackRes = await rootAgent.resource('flowSurfaces').get({
      pageSchemaUid: page.pageSchemaUid,
    });
    expect(pageReadbackRes.status).toBe(200);
    expect(getData(pageReadbackRes).target).toEqual({
      locator: {
        pageSchemaUid: page.pageSchemaUid,
      },
      uid: page.pageUid,
      kind: 'page',
    });
    expect(getData(pageReadbackRes).pageRoute.id).toBe(page.routeId);

    const routeReadbackRes = await rootAgent.resource('flowSurfaces').get({
      routeId: page.routeId,
    });
    expect(routeReadbackRes.status).toBe(200);
    expect(getData(routeReadbackRes).target).toEqual({
      locator: {
        routeId: String(page.routeId),
      },
      uid: page.pageUid,
      kind: 'page',
    });
    expect(getData(routeReadbackRes).pageRoute.schemaUid).toBe(page.pageSchemaUid);

    const mixedLocatorRes = await rootAgent.resource('flowSurfaces').get({
      uid: page.pageUid,
      pageSchemaUid: page.pageSchemaUid,
    } as any);
    expect(mixedLocatorRes.status).toBe(400);
    expect(readErrorMessage(mixedLocatorRes)).toContain('exactly one locator');

    const service = new FlowSurfacesService(app.pm.get('flow-engine') as any);
    await expect(
      service.get({
        target: {
          uid: page.pageUid,
        },
      } as any),
    ).rejects.toThrow(`do not wrap them in 'target'`);
    await expect(
      service.get({
        values: {
          uid: page.pageUid,
        },
      } as any),
    ).rejects.toThrow(`do not wrap them in 'values'`);

    const postGetRes = await rootAgent.post('/flowSurfaces:get').send({
      pageSchemaUid: page.pageSchemaUid,
    });
    expect(postGetRes.status).toBe(400);
    expect(readErrorMessage(postGetRes)).toContain('only supports GET');

    const wrappedEmptyValuesRes = await rootAgent.resource('flowSurfaces').get({
      pageSchemaUid: page.pageSchemaUid,
      values: {},
    } as any);
    expect(wrappedEmptyValuesRes.status).toBe(400);
    expect(readErrorMessage(wrappedEmptyValuesRes)).toContain(`do not wrap them in 'values'`);

    const wrappedTargetRes = await rootAgent.get(
      `/flowSurfaces:get?target%5Buid%5D=${encodeURIComponent(page.tabSchemaUid)}`,
    );
    expect(wrappedTargetRes.status).toBe(400);
    expect(readErrorMessage(wrappedTargetRes)).toContain(`do not wrap them in 'target'`);

    const wrappedValuesRes = await rootAgent.get(
      `/flowSurfaces:get?values%5Buid%5D=${encodeURIComponent(page.tabSchemaUid)}`,
    );
    expect(wrappedValuesRes.status).toBe(400);
    expect(readErrorMessage(wrappedValuesRes)).toContain(`do not wrap them in 'values'`);
  });

  it('should normalize and validate filter-group payloads across flowSurfaces write entrances', async () => {
    const page = await createPage(rootAgent, {
      title: 'Filter group contract page',
      tabTitle: 'Filter group contract tab',
    });

    const createdTable = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'table',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
          settings: {
            dataScope: {},
          },
        },
      }),
    );

    let tableSurface = await getSurface(rootAgent, {
      uid: createdTable.uid,
    });
    expect(tableSurface.tree.stepParams?.tableSettings?.dataScope?.filter).toEqual({
      logic: '$and',
      items: [],
    });

    const configureEmptyFilter = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: createdTable.uid,
        },
        changes: {
          dataScope: {},
        },
      },
    });
    expect(configureEmptyFilter.status).toBe(200);

    tableSurface = await getSurface(rootAgent, {
      uid: createdTable.uid,
    });
    expect(tableSurface.tree.stepParams?.tableSettings?.dataScope?.filter).toEqual({
      logic: '$and',
      items: [],
    });

    const configureNullFilter = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: createdTable.uid,
        },
        changes: {
          dataScope: null,
        },
      },
    });
    expect(configureNullFilter.status).toBe(200);

    tableSurface = await getSurface(rootAgent, {
      uid: createdTable.uid,
    });
    expect(tableSurface.tree.stepParams?.tableSettings?.dataScope?.filter).toEqual({
      logic: '$and',
      items: [],
    });

    const directEmptyFilter = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: createdTable.uid,
        },
        stepParams: {
          tableSettings: {
            dataScope: {
              filter: {},
            },
          },
        },
      },
    });
    expect(directEmptyFilter.status).toBe(200);

    tableSurface = await getSurface(rootAgent, {
      uid: createdTable.uid,
    });
    expect(tableSurface.tree.stepParams?.tableSettings?.dataScope?.filter).toEqual({
      logic: '$and',
      items: [],
    });

    const applyEmptyFilter = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: createdTable.uid,
        },
        spec: {
          stepParams: {
            tableSettings: {
              dataScope: {
                filter: null,
              },
            },
          },
        },
      },
    });
    expect(applyEmptyFilter.status).toBe(200);

    tableSurface = await getSurface(rootAgent, {
      uid: createdTable.uid,
    });
    expect(tableSurface.tree.stepParams?.tableSettings?.dataScope?.filter).toEqual({
      logic: '$and',
      items: [],
    });

    const validFilter = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: createdTable.uid,
        },
        stepParams: {
          tableSettings: {
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
          },
        },
      },
    });
    expect(validFilter.status).toBe(200);

    tableSurface = await getSurface(rootAgent, {
      uid: createdTable.uid,
    });
    expect(tableSurface.tree.stepParams?.tableSettings?.dataScope?.filter).toEqual({
      logic: '$and',
      items: [
        {
          path: 'nickname',
          operator: '$eq',
          value: 'alpha',
        },
      ],
    });

    const invalidConfigureFilter = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: createdTable.uid,
        },
        changes: {
          dataScope: {
            foo: 'bar',
          },
        },
      },
    });
    expect(invalidConfigureFilter.status).toBe(400);
    expect(readErrorMessage(invalidConfigureFilter)).toContain('stepParams.tableSettings.dataScope.filter');
    expect(readErrorMessage(invalidConfigureFilter)).toContain('FilterGroup');
    expect(readErrorMessage(invalidConfigureFilter)).toContain('logic and items');

    const invalidFilters = [
      { case: 'missing-logic-items', filter: { foo: 'bar' }, reason: 'logic and items' },
      { case: 'missing-items', filter: { logic: '$and' }, reason: 'logic and items' },
      { case: 'items-not-array', filter: { logic: '$and', items: {} }, reason: 'items must be an array' },
      { case: 'invalid-logic', filter: { logic: '$xx', items: [] }, reason: "logic must be '$and' or '$or'" },
      {
        case: 'invalid-nested-item',
        filter: { logic: '$and', items: [{ foo: 'bar' }] },
        reason: 'Invalid filter item type',
      },
    ];

    for (const testCase of invalidFilters) {
      const response = await rootAgent.resource('flowSurfaces').updateSettings({
        values: {
          target: {
            uid: createdTable.uid,
          },
          stepParams: {
            tableSettings: {
              dataScope: {
                filter: testCase.filter,
              },
            },
          },
        },
      });
      expect({
        case: testCase.case,
        status: response.status,
      }).toMatchObject({
        case: testCase.case,
        status: 400,
      });
      expect(readErrorMessage(response)).toContain('stepParams.tableSettings.dataScope.filter');
      expect(readErrorMessage(response)).toContain('FilterGroup');
      expect(readErrorMessage(response)).toContain('{"logic":"$and","items":[]}');
      expect(readErrorMessage(response)).toContain(testCase.reason);
    }
  });
});

function getData(response: any) {
  expect(response.status).toBe(200);
  return response.body.data;
}

function getComposeBlock(result: any, key: string) {
  const block = _.castArray(result?.blocks || []).find((item: any) => item?.key === key);
  expect(block).toBeTruthy();
  return block;
}

function readErrorMessage(response: any) {
  return response?.body?.errors?.[0]?.message || '';
}

function isRetriableHelperError(error: any) {
  const message = String(error?.message || '');
  return (
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'HPE_INVALID_CONSTANT' ||
    /socket hang up|timed out|parse error|expected http\/, rtsp\/ or ice\//i.test(message)
  );
}

function isRetriableHelperResponse(response: any) {
  return response?.status === 404;
}

async function runFlowSurfaceHelper<T>(
  execute: () => Promise<T>,
  options: {
    isRetriableResponse?: (response: T) => boolean;
  } = {},
) {
  const { isRetriableResponse = isRetriableHelperResponse } = options;
  let lastError: any;
  let lastResponse: T | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await execute();
      lastResponse = response;
      if (!isRetriableResponse(response) || attempt > 0) {
        return response;
      }
    } catch (error: any) {
      lastError = error;
      if (!isRetriableHelperError(error) || attempt > 0) {
        throw error;
      }
    }
  }
  if (lastError) {
    throw lastError;
  }
  return lastResponse as T;
}

async function createPage(rootAgent: any, values: Record<string, any>) {
  return getData(
    await runFlowSurfaceHelper(() =>
      rootAgent.resource('flowSurfaces').createPage({
        values,
      }),
    ),
  );
}

async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(
    await runFlowSurfaceHelper(() =>
      rootAgent.resource('flowSurfaces').get({
        ...target,
      }),
    ),
  );
}

async function getBlockGridUid(rootAgent: any, blockUid: string) {
  const readback = await getSurface(rootAgent, {
    uid: blockUid,
  });
  const gridUid = readback?.tree?.subModels?.grid?.uid;
  expect(gridUid).toBeTruthy();
  return gridUid;
}

function getRouteBackedTabs(readback: any) {
  return _.castArray(readback?.tree?.subModels?.tabs || []);
}

async function addBlock(rootAgent: any, targetUid: string, type: string, resourceInit?: Record<string, any>) {
  const normalizedResourceInit = resourceInit && Object.keys(resourceInit).length ? resourceInit : undefined;
  let normalizedTargetUid = targetUid;
  const targetReadback = await getSurface(rootAgent, {
    uid: targetUid,
  });
  if (['RootPageTabModel', 'ChildPageTabModel'].includes(targetReadback?.tree?.use)) {
    normalizedTargetUid = targetReadback.tree?.subModels?.grid?.uid || targetUid;
  }
  const data = getData(
    await runFlowSurfaceHelper(() =>
      rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: normalizedTargetUid,
          },
          type,
          ...(normalizedResourceInit ? { resourceInit: normalizedResourceInit } : {}),
        },
      }),
    ),
  );
  return data.uid;
}

async function addField(rootAgent: any, targetUid: string, fieldPath: string, extraValues: Record<string, any> = {}) {
  return getData(
    await runFlowSurfaceHelper(() =>
      rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: targetUid,
          },
          fieldPath,
          ...extraValues,
        },
      }),
    ),
  );
}

async function addAction(rootAgent: any, targetUid: string, type: string, extraValues: Record<string, any> = {}) {
  const values = {
    target: {
      uid: targetUid,
    },
    type,
    ...extraValues,
  };
  const response = await runFlowSurfaceHelper(() =>
    rootAgent.resource('flowSurfaces').addAction({
      values,
    }),
  );
  if (response.status === 200) {
    return getData(response);
  }
  const message = readErrorMessage(response);
  if (message.includes('use addRecordAction')) {
    return getData(
      await runFlowSurfaceHelper(() =>
        rootAgent.resource('flowSurfaces').addRecordAction({
          values,
        }),
      ),
    );
  }
  return getData(response);
}

async function addRecordAction(rootAgent: any, targetUid: string, type: string, extraValues: Record<string, any> = {}) {
  return getData(
    await runFlowSurfaceHelper(() =>
      rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: targetUid,
          },
          type,
          ...extraValues,
        },
      }),
    ),
  );
}

async function setupFixtureCollections(rootAgent: any, db?: Database) {
  await rootAgent.resource('collections').create({
    values: {
      name: 'departments',
      title: 'Departments',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'location', type: 'string', interface: 'input' },
      ],
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'employees',
      title: 'Employees',
      fields: [
        { name: 'nickname', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
        { name: 'age', type: 'integer', interface: 'number' },
        { name: 'bio', type: 'text', interface: 'textarea' },
        { name: 'isManager', type: 'boolean', interface: 'checkbox' },
      ],
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'department',
      type: 'belongsTo',
      target: 'departments',
      foreignKey: 'departmentId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections').apply({
    values: {
      name: 'categories',
      title: 'Categories',
      template: 'tree',
      fields: [{ name: 'title', interface: 'input', title: 'Title' }],
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'tasks',
      title: 'Tasks',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
      ],
    },
  });

  await rootAgent.resource('collections.fields', 'tasks').create({
    values: {
      name: 'employee',
      type: 'belongsTo',
      target: 'employees',
      foreignKey: 'employeeId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'tasks',
      type: 'hasMany',
      target: 'tasks',
      foreignKey: 'employeeId',
      interface: 'o2m',
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'employee_logs',
      title: 'Employee logs',
      fields: [{ name: 'content', type: 'string', interface: 'textarea' }],
    },
  });

  await rootAgent.resource('collections.fields', 'employee_logs').create({
    values: {
      name: 'employee',
      type: 'belongsTo',
      target: 'employees',
      foreignKey: 'employeeId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'logs',
      type: 'hasMany',
      target: 'employee_logs',
      foreignKey: 'employeeId',
      interface: 'o2m',
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'skills',
      title: 'Skills',
      fields: [{ name: 'label', type: 'string', interface: 'input' }],
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'employee_skills',
      title: 'employee_skills',
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

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'skills',
      type: 'belongsToMany',
      target: 'skills',
      through: 'employee_skills',
      foreignKey: 'employeeId',
      otherKey: 'skillId',
      interface: 'm2m',
    },
  });

  if (db) {
    await waitForFixtureCollectionsReady(db, {
      categories: ['title', 'parentId'],
      departments: ['title', 'location'],
      employees: ['nickname', 'status', 'age', 'bio', 'isManager', 'departmentId'],
      tasks: ['title', 'status', 'employeeId'],
      employee_logs: ['content', 'employeeId'],
      skills: ['label'],
      employee_skills: ['id', 'employeeId', 'skillId'],
    });
  }

  const department = await rootAgent.resource('departments').create({
    values: {
      title: 'R&D',
      location: 'Shenzhen',
    },
  });
  const departmentId = department.body.data.id;

  const employee = await rootAgent.resource('employees').create({
    values: {
      nickname: 'Alice',
      status: 'active',
      age: 30,
      departmentId,
    },
  });
  const employeeId = employee.body.data.id;

  await rootAgent.resource('tasks').create({
    values: {
      title: 'Prepare report',
      status: 'todo',
      employeeId,
    },
  });

  await rootAgent.resource('employee_logs').create({
    values: {
      content: 'Initial log',
      employeeId,
    },
  });

  await rootAgent.resource('skills').create({
    values: {
      label: 'TypeScript',
    },
  });
}
