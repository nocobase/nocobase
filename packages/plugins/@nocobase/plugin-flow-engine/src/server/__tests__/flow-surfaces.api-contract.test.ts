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
import { uid } from '@nocobase/utils';
import _ from 'lodash';
import FlowModelRepository from '../repository';
import {
  buildPersistedRootPageModel,
  buildPopupPageTree,
  buildSyntheticRootPageTabModel,
} from '../flow-surfaces/builder';
import {
  createFlowSurfacesMockServer,
  loginFlowSurfacesRootAgent,
  syncFlowSurfacesEnabledPlugins,
  wrapFlowSurfacesReadCompatibleAgent,
} from './flow-surfaces.mock-server';
import { FLOW_SURFACES_MINIMAL_TEST_PLUGINS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

describe('flowSurfaces API contract builders', () => {
  it('should keep persisted root page builder separate from synthetic tab and popup builders', async () => {
    const persistedPage = buildPersistedRootPageModel({
      pageUid: 'persisted-page',
      pageTitle: 'Persisted page',
      routeId: 1,
      enableTabs: true,
      displayTitle: false,
      pageDocumentTitle: 'Persisted document title',
    });

    expect(persistedPage).toMatchObject({
      uid: 'persisted-page',
      use: 'RootPageModel',
      props: {
        routeId: 1,
        title: 'Persisted page',
        enableTabs: true,
        displayTitle: false,
      },
      stepParams: {
        pageSettings: {
          general: {
            title: 'Persisted page',
            enableTabs: true,
            displayTitle: false,
            documentTitle: 'Persisted document title',
          },
        },
      },
    });
    expect(persistedPage.subModels).toBeUndefined();

    const syntheticTab = buildSyntheticRootPageTabModel({
      uid: 'synthetic-tab',
      title: 'Synthetic tab',
      icon: 'TableOutlined',
      documentTitle: 'Synthetic document title',
      route: {
        id: 100,
        schemaUid: 'synthetic-tab',
      },
      props: {
        custom: true,
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            closable: false,
          },
        },
      },
      grid: {
        uid: 'synthetic-grid',
        use: 'BlockGridModel',
      },
    });

    expect(syntheticTab).toMatchObject({
      uid: 'synthetic-tab',
      use: 'RootPageTabModel',
      props: {
        custom: true,
        title: 'Synthetic tab',
        icon: 'TableOutlined',
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Synthetic tab',
            icon: 'TableOutlined',
            documentTitle: 'Synthetic document title',
            closable: false,
          },
        },
      },
      subModels: {
        grid: {
          uid: 'synthetic-grid',
          use: 'BlockGridModel',
        },
      },
    });

    const popupPage = buildPopupPageTree({
      pageUid: 'popup-page',
      tabUid: 'popup-tab',
      gridUid: 'popup-grid',
      pageTitle: 'Popup page',
      tabTitle: 'Popup tab',
      displayTitle: true,
      enableTabs: true,
    });

    expect(popupPage.use).toBe('ChildPageModel');
    expect(_.castArray(popupPage.subModels?.tabs || [])[0]).toMatchObject({
      uid: 'popup-tab',
      use: 'ChildPageTabModel',
      subModels: {
        grid: {
          uid: 'popup-grid',
          use: 'BlockGridModel',
        },
      },
    });
  });
});

describe('flowSurfaces API contract', () => {
  let app: MockServer;
  let db: Database;
  let flowRepo: FlowModelRepository;
  let routesRepo: Repository;
  let rootAgent: any;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer();

    db = app.db;
    flowRepo = db.getCollection('flowModels').repository as FlowModelRepository;
    routesRepo = db.getRepository('desktopRoutes');
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupFixtureCollections(rootAgent);
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should allow loggedIn users to read but require explicit flowSurfaces snippet for writes', async () => {
    const readerRoleName = `flow_reader_${uid()}`;
    const writerRoleName = `flow_writer_${uid()}`;
    await db.getRepository('roles').create({
      values: {
        name: readerRoleName,
      },
    });
    await db.getRepository('roles').create({
      values: {
        name: writerRoleName,
        snippets: ['ui.flowSurfaces'],
      },
    });

    const readerUser = await db.getRepository('users').create({
      values: {
        roles: [readerRoleName],
      },
    });
    const writerUser = await db.getRepository('users').create({
      values: {
        roles: [writerRoleName],
      },
    });

    const readerAgent = wrapFlowSurfacesReadCompatibleAgent(await app.agent().login(readerUser), app);
    const writerAgent = wrapFlowSurfacesReadCompatibleAgent(await app.agent().login(writerUser), app);
    const page = await createPage(rootAgent, {
      title: 'ACL contract page',
      tabTitle: 'ACL contract tab',
    });
    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const pageRootUid = pageReadback?.target?.uid;
    const pageGridUid = getRouteBackedTabs(pageReadback)[0]?.subModels?.grid?.uid;
    expect(pageRootUid).toBeTruthy();
    expect(pageGridUid).toBeTruthy();

    const readRes = await readerAgent.resource('flowSurfaces').get({
      pageSchemaUid: page.pageSchemaUid,
    });
    expect(readRes.status).toBe(200);
    const catalogRes = await readerAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: pageGridUid,
        },
      },
    });
    expect(catalogRes.status).toBe(200);
    const contextRes = await readerAgent.resource('flowSurfaces').context({
      values: {
        target: {
          uid: pageGridUid,
        },
        path: 'record',
      },
    });
    expect(contextRes.status).toBe(200);

    const deniedWriteRes = await readerAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: pageRootUid,
        },
        title: 'Denied tab',
      },
    });
    expect(deniedWriteRes.status).toBe(403);
    expectStructuredError(readErrorItem(deniedWriteRes), {
      status: 403,
      type: 'forbidden',
    });

    const allowedWriteRes = await writerAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: pageRootUid,
        },
        title: 'Allowed tab',
      },
    });
    expect(allowedWriteRes.status).toBe(200);
  });

  it('should keep route-backed tabs under tree.subModels.tabs and reject wrapped get locators', async () => {
    const page = await createPage(rootAgent, {
      title: 'Read contract page',
      tabTitle: 'Read contract tab',
    });
    const addedTab = await getData(
      await rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: {
            uid: page.pageUid,
          },
          title: 'Read contract second tab',
        },
      }),
    );

    const readRes = await rootAgent.resource('flowSurfaces').get({
      pageSchemaUid: page.pageSchemaUid,
    });
    expect(readRes.status).toBe(200);
    const readback = getData(readRes);
    expect(readback.tabs).toBeUndefined();
    expect(readback.tabTrees).toBeUndefined();
    expect(getRouteBackedTabs(readback).map((tab) => tab.uid)).toEqual([page.tabSchemaUid, addedTab.tabSchemaUid]);

    const wrappedTargetRes = await rootAgent.resource('flowSurfaces').get({
      target: {
        uid: page.pageUid,
      },
    } as any);
    expect(wrappedTargetRes.status).toBe(400);
    expectStructuredError(readErrorItem(wrappedTargetRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(wrappedTargetRes)).toContain(`do not wrap them in 'target'`);

    const wrappedValuesRes = await rootAgent.resource('flowSurfaces').get({
      values: {
        uid: page.pageUid,
      },
    } as any);
    expect(wrappedValuesRes.status).toBe(400);
    expectStructuredError(readErrorItem(wrappedValuesRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(wrappedValuesRes)).toContain(`do not wrap them in 'values'`);

    const wrappedEmptyValuesRes = await rootAgent.resource('flowSurfaces').get({
      pageSchemaUid: page.pageSchemaUid,
      values: {},
    } as any);
    expect(wrappedEmptyValuesRes.status).toBe(400);
    expectStructuredError(readErrorItem(wrappedEmptyValuesRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(wrappedEmptyValuesRes)).toContain(`do not wrap them in 'values'`);

    const rawWrappedValuesQueryRes = await rootAgent.get(
      `/flowSurfaces:get?pageSchemaUid=${encodeURIComponent(page.pageSchemaUid)}&values%5Buid%5D=${encodeURIComponent(
        page.pageUid,
      )}`,
    );
    expect(rawWrappedValuesQueryRes.status).toBe(400);
    expectStructuredError(readErrorItem(rawWrappedValuesQueryRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorMessage(rawWrappedValuesQueryRes)).toContain(`do not wrap them in 'values'`);
  });

  it('should treat missing apply mode as replace and reject unsupported modes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Contract page',
      tabTitle: 'Contract tab',
    });

    const defaultApplyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: { uid: page.tabSchemaUid },
        spec: {
          props: {
            title: 'Contract tab default replace',
            icon: 'TableOutlined',
          },
          stepParams: {
            pageTabSettings: {
              tab: {
                title: 'Contract tab default replace',
                icon: 'TableOutlined',
                documentTitle: 'Contract tab default document',
              },
            },
          },
        },
      },
    });
    expect(defaultApplyRes.status).toBe(200);

    const defaultRoute = await routesRepo.findOne({
      filter: {
        schemaUid: page.tabSchemaUid,
      },
    });
    const defaultReadback = await getSurface(rootAgent, {
      tabSchemaUid: page.tabSchemaUid,
    });
    expect(defaultRoute?.get('title')).toBe('Contract tab default replace');
    expect(defaultRoute?.get('icon')).toBe('TableOutlined');
    expect(defaultRoute?.get('options').documentTitle).toBe('Contract tab default document');
    expect(defaultReadback.tree.stepParams?.pageTabSettings?.tab).toMatchObject({
      title: 'Contract tab default replace',
      icon: 'TableOutlined',
      documentTitle: 'Contract tab default document',
    });

    const explicitReplaceRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: { uid: page.tabSchemaUid },
        mode: 'replace',
        spec: {
          props: {
            title: 'Contract tab explicit replace',
            icon: 'AppstoreOutlined',
          },
          stepParams: {
            pageTabSettings: {
              tab: {
                title: 'Contract tab explicit replace',
                icon: 'AppstoreOutlined',
                documentTitle: 'Contract tab explicit document',
              },
            },
          },
        },
      },
    });
    expect(explicitReplaceRes.status).toBe(200);

    const explicitRoute = await routesRepo.findOne({
      filter: {
        schemaUid: page.tabSchemaUid,
      },
    });
    const explicitReadback = await getSurface(rootAgent, {
      tabSchemaUid: page.tabSchemaUid,
    });
    expect(explicitRoute?.get('title')).toBe('Contract tab explicit replace');
    expect(explicitRoute?.get('icon')).toBe('AppstoreOutlined');
    expect(explicitRoute?.get('options').documentTitle).toBe('Contract tab explicit document');
    expect(explicitReadback.tree.props).toMatchObject({
      title: 'Contract tab explicit replace',
      icon: 'AppstoreOutlined',
    });
    expect(explicitReadback.tree.subModels?.grid?.use).toBe('BlockGridModel');

    for (const invalidMode of ['merge', 'patch', null] as any[]) {
      const invalidRes = await rootAgent.resource('flowSurfaces').apply({
        values: {
          target: { uid: page.tabSchemaUid },
          mode: invalidMode,
          spec: {
            props: {
              title: `Contract tab invalid ${invalidMode}`,
            },
          },
        },
      });

      expect(invalidRes.status).toBe(400);
      expect(readErrorMessage(invalidRes)).toContain(`mode='replace'`);
      expect(readErrorMessage(invalidRes)).toContain('v1');
    }
  });

  it('should treat missing mutate atomic as v1 atomic execution and reject atomic=false', async () => {
    const rollbackPageSchemaUid = 'default_atomic_page_schema_uid';
    const rollbackTabSchemaUid = 'default_atomic_tab_schema_uid';
    const rollbackRes = await rootAgent.resource('flowSurfaces').mutate({
      values: {
        ops: [
          {
            opId: 'page',
            type: 'createPage',
            values: {
              pageSchemaUid: rollbackPageSchemaUid,
              tabSchemaUid: rollbackTabSchemaUid,
              title: 'Default atomic page',
              tabTitle: 'Default atomic tab',
            },
          },
          {
            opId: 'block',
            type: 'addBlock',
            values: {
              target: {
                uid: {
                  ref: 'page.gridUid',
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
                  ref: 'block.uid',
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
          schemaUid: rollbackPageSchemaUid,
        },
      }),
    ).toBeNull();

    const successPageSchemaUid = `mutate_shape_${uid()}`;
    const successTabSchemaUid = `mutate_shape_tab_${uid()}`;
    const successMutateRes = await rootAgent.resource('flowSurfaces').mutate({
      values: {
        ops: [
          {
            opId: 'page',
            type: 'createPage',
            values: {
              pageSchemaUid: successPageSchemaUid,
              tabSchemaUid: successTabSchemaUid,
              title: 'Mutate shape page',
              tabTitle: 'Mutate shape tab',
            },
          },
          {
            opId: 'block',
            type: 'addBlock',
            values: {
              clientKey: 'details-block',
              target: {
                uid: {
                  ref: 'page.gridUid',
                },
              },
              type: 'details',
              resourceInit: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
            },
          },
        ],
      },
    });
    expect(successMutateRes.status).toBe(200);
    const successMutateData = getData(successMutateRes);
    expect(successMutateData.results).toHaveLength(2);
    expect(successMutateData.results[0]).toMatchObject({
      opId: 'page',
      result: {
        pageSchemaUid: successPageSchemaUid,
        tabSchemaUid: successTabSchemaUid,
      },
    });
    expect(successMutateData.results[1]).toMatchObject({
      opId: 'block',
      result: {
        uid: expect.any(String),
      },
    });
    expect(successMutateData.clientKeyToUid['details-block']).toBe(successMutateData.results[1].result.uid);

    for (const { atomic, key } of [
      { atomic: false, key: 'false' },
      { atomic: null, key: 'null' },
    ] as any[]) {
      const pageSchemaUid = `atomic_${key}_page_schema_uid`;
      const mutateRes = await rootAgent.resource('flowSurfaces').mutate({
        values: {
          atomic,
          ops: [
            {
              type: 'createPage',
              values: {
                pageSchemaUid,
                tabSchemaUid: `atomic_${key}_tab_schema_uid`,
                title: `Atomic ${key} page`,
                tabTitle: `Atomic ${key} tab`,
              },
            },
          ],
        },
      });
      expect(mutateRes.status).toBe(400);
      expect(readErrorMessage(mutateRes)).toContain('atomic=true');
      expect(readErrorMessage(mutateRes)).toContain('v1');
      expect(
        await routesRepo.findOne({
          filter: {
            schemaUid: pageSchemaUid,
          },
        }),
      ).toBeNull();
    }

    const legacyRefRes = await rootAgent.resource('flowSurfaces').mutate({
      values: {
        ops: [
          {
            opId: 'page',
            type: 'createPage',
            values: {
              pageSchemaUid: 'legacy_ref_contract_page_schema_uid',
              tabSchemaUid: 'legacy_ref_contract_tab_schema_uid',
              title: 'Legacy ref contract page',
              tabTitle: 'Legacy ref contract tab',
            },
          },
          {
            type: 'addBlock',
            values: {
              target: {
                uid: {
                  $ref: 'page.gridUid',
                },
              },
              type: 'details',
              resourceInit: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
            },
          },
        ],
      },
    });
    expect(legacyRefRes.status).toBe(400);
    expect(readErrorMessage(legacyRefRes)).toContain('"$ref"');
    expect(readErrorMessage(legacyRefRes)).toContain('ref');

    const invalidTypeRes = await rootAgent.resource('flowSurfaces').mutate({
      values: {
        ops: [
          {
            type: 'notSupported',
            values: {},
          },
        ],
      },
    });
    expect(invalidTypeRes.status).toBe(400);
    expect(readErrorMessage(invalidTypeRes)).toContain(`notSupported`);
    expect(readErrorMessage(invalidTypeRes)).toContain('not supported');
  });

  it('should keep createPage addTab get removeTab destroyPage behavior unchanged', async () => {
    const created = await createPage(rootAgent, {
      title: 'Employees page',
      tabTitle: 'Main tab',
    });

    const pageRoute = await routesRepo.findOne({
      filter: {
        schemaUid: created.pageSchemaUid,
      },
      appends: ['children'],
    });
    expect(pageRoute?.get('type')).toBe('flowPage');
    expect(pageRoute?.get('children')).toHaveLength(1);
    expect(_.castArray(pageRoute?.get('children') || [])[0]?.get?.('hidden')).toBe(true);

    const pageModel = await flowRepo.findModelByParentId(created.pageSchemaUid, {
      subKey: 'page',
      includeAsyncNode: true,
    });
    expect(pageModel).toMatchObject({
      use: 'RootPageModel',
      props: {
        routeId: pageRoute?.get('id'),
      },
    });
    expect(pageModel?.subModels).toBeUndefined();

    const initialReadback = await getSurface(rootAgent, {
      pageSchemaUid: created.pageSchemaUid,
    });
    expect(initialReadback.tree.use).toBe('RootPageModel');
    expect(_.castArray(initialReadback.tree.subModels?.tabs || [])[0]?.use).toBe('RootPageTabModel');
    expect(_.castArray(initialReadback.tree.subModels?.tabs || [])[0]?.subModels?.grid?.use).toBe('BlockGridModel');

    const initialTabGrid = await flowRepo.findModelByParentId(created.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(initialTabGrid?.use).toBe('BlockGridModel');

    const addedTab = getData(
      await rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: { uid: created.pageUid },
          title: 'Secondary tab',
          documentTitle: 'Secondary browser title',
        },
      }),
    );

    expect(
      await flowRepo.findModelById(addedTab.tabSchemaUid, {
        includeAsyncNode: true,
      }),
    ).toMatchObject({
      uid: addedTab.tabSchemaUid,
      schema: {
        use: 'RouteModel',
      },
    });
    expect(
      await flowRepo.findModelByParentId(addedTab.tabSchemaUid, {
        subKey: 'grid',
        includeAsyncNode: true,
      }),
    ).toMatchObject({
      use: 'BlockGridModel',
    });

    const readback = await getSurface(rootAgent, {
      pageSchemaUid: created.pageSchemaUid,
    });
    const routeBackedTabs = getRouteBackedTabs(readback);
    expect(routeBackedTabs).toHaveLength(2);
    expect(routeBackedTabs[0].uid).toBe(created.tabSchemaUid);
    expect(routeBackedTabs[1].uid).toBe(addedTab.tabSchemaUid);

    const removeTabRes = await rootAgent.resource('flowSurfaces').removeTab({
      values: {
        uid: addedTab.tabSchemaUid,
      },
    });
    expect(removeTabRes.status).toBe(200);
    expect(
      await routesRepo.findOne({
        filter: {
          schemaUid: addedTab.tabSchemaUid,
        },
      }),
    ).toBeNull();
    expect(
      await flowRepo.findModelByParentId(addedTab.tabSchemaUid, {
        subKey: 'grid',
        includeAsyncNode: true,
      }),
    ).toBeNull();

    const destroyPageRes = await rootAgent.resource('flowSurfaces').destroyPage({
      values: {
        uid: created.pageUid,
      },
    });
    expect(destroyPageRes.status).toBe(200);
    expect(
      await routesRepo.findOne({
        filter: {
          schemaUid: created.pageSchemaUid,
        },
      }),
    ).toBeNull();
    expect(
      await flowRepo.findModelByParentId(created.pageSchemaUid, {
        subKey: 'page',
        includeAsyncNode: true,
      }),
    ).toBeNull();
    expect(
      await flowRepo.findModelByParentId(created.tabSchemaUid, {
        subKey: 'grid',
        includeAsyncNode: true,
      }),
    ).toBeNull();
  });

  it('should return structured conflict errors when a record-capable block loses its required item subtree', async () => {
    const page = await createPage(rootAgent, {
      title: 'Conflict page',
      tabTitle: 'Conflict tab',
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
    const item = await flowRepo.findModelByParentId(gridCard.uid, {
      subKey: 'item',
      includeAsyncNode: true,
    });
    expect(item?.uid).toBeTruthy();

    await flowRepo.destroy({
      filterByTk: item.uid,
    });

    const response = await rootAgent.resource('flowSurfaces').addRecordAction({
      values: {
        target: {
          uid: gridCard.uid,
        },
        type: 'view',
      },
    });
    expect(response.status).toBe(409);
    expectStructuredError(readErrorItem(response), {
      status: 409,
      type: 'conflict',
    });
    expect(readErrorMessage(response)).toContain('missing its item subtree');
  });

  it('should reject removing the last outer tab and invalid outer tab move lifecycles', async () => {
    const page = await createPage(rootAgent, {
      title: 'Outer tab lifecycle page',
      tabTitle: 'Outer tab lifecycle tab',
    });

    const removeLastTabRes = await rootAgent.resource('flowSurfaces').removeTab({
      values: {
        uid: page.tabSchemaUid,
      },
    });
    expect(removeLastTabRes.status).toBe(400);
    expect(readErrorMessage(removeLastTabRes)).toContain('last route-backed tab');
    expect(readErrorMessage(removeLastTabRes)).toContain('destroyPage');

    const sameTabMoveRes = await rootAgent.resource('flowSurfaces').moveTab({
      values: {
        sourceUid: page.tabSchemaUid,
        targetUid: page.tabSchemaUid,
        position: 'before',
      },
    });
    expect(sameTabMoveRes.status).toBe(400);
    expect(readErrorMessage(sameTabMoveRes)).toContain('different sourceUid and targetUid');

    const anotherPage = await createPage(rootAgent, {
      title: 'Other outer tab lifecycle page',
      tabTitle: 'Other outer tab lifecycle tab',
    });
    const crossPageMoveRes = await rootAgent.resource('flowSurfaces').moveTab({
      values: {
        sourceUid: page.tabSchemaUid,
        targetUid: anotherPage.tabSchemaUid,
        position: 'before',
      },
    });
    expect(crossPageMoveRes.status).toBe(400);
    expect(readErrorMessage(crossPageMoveRes)).toContain('same page route');
  });

  it('should create nested menu nodes and initialize a page from a bindable menu item', async () => {
    const group = await createMenu(rootAgent, {
      title: 'Workspace',
      type: 'group',
    });
    const item = await createMenu(rootAgent, {
      title: 'Employees',
      type: 'item',
      parentMenuRouteId: group.routeId,
    });

    expect(group.type).toBe('group');
    expect(item.type).toBe('flowPage');
    expect(item.parentMenuRouteId).toBe(group.routeId);

    const initialized = await createPage(rootAgent, {
      menuRouteId: item.routeId,
      tabTitle: 'Overview',
      enableTabs: true,
    });

    expect(initialized.routeId).toBe(item.routeId);
    expect(initialized.pageSchemaUid).toBe(item.pageSchemaUid);
    expect(initialized.pageUid).toBe(item.pageUid);

    const pageRoute = await routesRepo.findOne({
      filterByTk: String(item.routeId),
      appends: ['children'],
    });
    expect(pageRoute?.get('parentId')).toBe(group.routeId);
    expect(pageRoute?.get('enableTabs')).toBe(true);

    const tabRoute = _.castArray(pageRoute?.get('children') || [])[0];
    expect(tabRoute?.get?.('hidden')).toBe(false);
    expect(
      await flowRepo.findModelByParentId(initialized.tabSchemaUid, {
        subKey: 'grid',
        includeAsyncNode: true,
      }),
    ).toMatchObject({
      use: 'BlockGridModel',
    });
  });

  it('should support updating menu metadata and moving an item back to top level', async () => {
    const group = await createMenu(rootAgent, {
      title: 'Workspace',
      type: 'group',
    });
    const item = await createMenu(rootAgent, {
      title: 'Employees',
      parentMenuRouteId: group.routeId,
    });

    const updated = await getData(
      await rootAgent.resource('flowSurfaces').updateMenu({
        values: {
          menuRouteId: item.routeId,
          title: 'Employees Center',
          parentMenuRouteId: null,
        },
      }),
    );

    expect(updated.routeId).toBe(item.routeId);
    expect(updated.parentMenuRouteId).toBeNull();

    const pageRoute = await routesRepo.findOne({
      filterByTk: String(item.routeId),
    });
    expect(pageRoute?.get('title')).toBe('Employees Center');
    expect(pageRoute?.get('parentId')).toBeNull();
  });

  it('should reject binding createPage to a group menu route', async () => {
    const group = await createMenu(rootAgent, {
      title: 'Workspace',
      type: 'group',
    });

    const response = await rootAgent.resource('flowSurfaces').createPage({
      values: {
        menuRouteId: group.routeId,
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('flowPage menu route');
  });

  it('should reject binding createPage to a legacy flowPage route that was not created by createMenu', async () => {
    const legacySchemaUid = uid();
    const legacyRoute = await routesRepo.create({
      values: {
        type: 'flowPage',
        title: 'Legacy employees',
        schemaUid: legacySchemaUid,
        hideInMenu: false,
      },
    });

    const response = await rootAgent.resource('flowSurfaces').createPage({
      values: {
        menuRouteId: legacyRoute.get('id'),
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('bindable menu route');
  });

  it('should reject re-initializing an already initialized menu item', async () => {
    const item = await createMenu(rootAgent, {
      title: 'Employees',
      type: 'item',
    });

    await createPage(rootAgent, {
      menuRouteId: item.routeId,
      tabTitle: 'Overview',
    });

    const response = await rootAgent.resource('flowSurfaces').createPage({
      values: {
        menuRouteId: item.routeId,
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('does not allow re-initializing');
  });

  it('should reject createMenu and updateMenu parentMenuRouteId when the parent is not a group', async () => {
    const item = await createMenu(rootAgent, {
      title: 'Employees',
      type: 'item',
    });

    const createResponse = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        title: 'Child',
        type: 'item',
        parentMenuRouteId: item.routeId,
      },
    });
    expect(createResponse.status).toBe(400);
    expect(readErrorMessage(createResponse)).toContain('must be a group route');

    const updateResponse = await rootAgent.resource('flowSurfaces').updateMenu({
      values: {
        menuRouteId: item.routeId,
        parentMenuRouteId: item.routeId,
      },
    });
    expect(updateResponse.status).toBe(400);
    expect(readErrorMessage(updateResponse)).toContain('must be a group route');
  });

  it('should reject moving a menu group into its descendant', async () => {
    const rootGroup = await createMenu(rootAgent, {
      title: 'Root',
      type: 'group',
    });
    const childGroup = await createMenu(rootAgent, {
      title: 'Child',
      type: 'group',
      parentMenuRouteId: rootGroup.routeId,
    });

    const response = await rootAgent.resource('flowSurfaces').updateMenu({
      values: {
        menuRouteId: rootGroup.routeId,
        parentMenuRouteId: childGroup.routeId,
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('descendant');
  });

  it('should keep legacy route-backed pages usable without menu-first initialization markers', async () => {
    const page = await createPage(rootAgent, {
      title: 'Legacy page',
      tabTitle: 'Overview',
    });

    const addTabResult = await getData(
      await rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: {
            uid: page.pageUid,
          },
          title: 'Details',
        },
      }),
    );
    expect(addTabResult.pageUid).toBe(page.pageUid);

    const removeResponse = await rootAgent.resource('flowSurfaces').removeTab({
      values: {
        uid: addTabResult.tabSchemaUid,
      },
    });
    expect(removeResponse.status).toBe(200);

    const destroyResponse = await rootAgent.resource('flowSurfaces').destroyPage({
      values: {
        uid: page.pageUid,
      },
    });
    expect(destroyResponse.status).toBe(200);
  });

  it('should reject page lifecycle APIs before a bindable menu item is initialized', async () => {
    const item = await createMenu(rootAgent, {
      title: 'Employees',
      type: 'item',
    });

    const addTabResponse = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: item.pageUid,
        },
        title: 'Details',
      },
    });
    expect(addTabResponse.status).toBe(400);
    expect(readErrorMessage(addTabResponse)).toContain('requires an initialized page');

    const destroyPageResponse = await rootAgent.resource('flowSurfaces').destroyPage({
      values: {
        uid: item.pageUid,
      },
    });
    expect(destroyPageResponse.status).toBe(400);
    expect(readErrorMessage(destroyPageResponse)).toContain('requires an initialized page');

    const removeTabResponse = await rootAgent.resource('flowSurfaces').removeTab({
      values: {
        uid: item.tabSchemaUid,
      },
    });
    expect(removeTabResponse.status).toBe(400);
    expect(readErrorMessage(removeTabResponse)).toContain('requires an initialized page');
  });

  it('should reject legacy write locators and direct callers to flowSurfaces:get first', async () => {
    const page = await createPage(rootAgent, {
      title: 'Legacy write locator page',
      tabTitle: 'Legacy write locator tab',
    });

    const legacyCatalogRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        pageSchemaUid: page.pageSchemaUid,
      },
    });
    expect(legacyCatalogRes.status).toBe(400);
    expect(readErrorMessage(legacyCatalogRes)).toContain('target.uid');
    expect(readErrorMessage(legacyCatalogRes)).toContain('flowSurfaces:get first');

    const legacyAddTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        title: 'Legacy add tab',
      },
    });
    expect(legacyAddTabRes.status).toBe(400);
    expect(readErrorMessage(legacyAddTabRes)).toContain('target.uid');
    expect(readErrorMessage(legacyAddTabRes)).toContain('flowSurfaces:get first');

    const disguisedAddTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: page.pageSchemaUid,
        },
        title: 'Disguised add tab',
      },
    });
    expect(disguisedAddTabRes.status).toBe(400);
    expect(readErrorMessage(disguisedAddTabRes)).toContain('route-backed page uid');
    expect(readErrorMessage(disguisedAddTabRes)).toContain('flowSurfaces:get first');

    const legacyConfigureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          routeId: String(page.routeId),
        },
        changes: {
          title: 'Legacy route configure',
        },
      },
    });
    expect(legacyConfigureRes.status).toBe(400);
    expect(readErrorMessage(legacyConfigureRes)).toContain('target.uid');
    expect(readErrorMessage(legacyConfigureRes)).toContain('flowSurfaces:get first');

    const legacyDestroyRes = await rootAgent.resource('flowSurfaces').destroyPage({
      values: {
        pageSchemaUid: page.pageSchemaUid,
      },
    });
    expect(legacyDestroyRes.status).toBe(400);
    expect(readErrorMessage(legacyDestroyRes)).toContain('only accepts root uid');
    expect(readErrorMessage(legacyDestroyRes)).toContain('flowSurfaces:get first');

    const disguisedDestroyRes = await rootAgent.resource('flowSurfaces').destroyPage({
      values: {
        uid: page.pageSchemaUid,
      },
    });
    expect(disguisedDestroyRes.status).toBe(400);
    expect(readErrorMessage(disguisedDestroyRes)).toContain('route-backed page uid');
    expect(readErrorMessage(disguisedDestroyRes)).toContain('flowSurfaces:get first');

    const legacyRemoveTabRes = await rootAgent.resource('flowSurfaces').removeTab({
      values: {
        tabSchemaUid: page.tabSchemaUid,
      },
    });
    expect(legacyRemoveTabRes.status).toBe(400);
    expect(readErrorMessage(legacyRemoveTabRes)).toContain('only accepts root uid');
    expect(readErrorMessage(legacyRemoveTabRes)).toContain('flowSurfaces:get first');
  });

  it('should guard outer page/tab APIs from popup child surfaces and expose popup tab APIs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup tab contract page',
      tabTitle: 'Popup tab contract tab',
    });
    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const pageGridUid = getRouteBackedTabs(pageReadback)[0]?.subModels?.grid?.uid;
    expect(pageGridUid).toBeTruthy();
    const table = await addBlockData(rootAgent, {
      target: {
        uid: pageGridUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const popupAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: table.uid,
          },
          type: 'view',
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
      }),
    );
    expect(popupAction.popupPageUid).toBeTruthy();
    expect(popupAction.popupTabUid).toBeTruthy();
    expect(popupAction.popupGridUid).toBeTruthy();
    const popupActionReadback = await getSurface(rootAgent, {
      uid: popupAction.uid,
    });
    const popupPage = popupActionReadback.tree?.subModels?.page;
    const primaryPopupTabUid = _.castArray(popupPage?.subModels?.tabs || [])[0]?.uid;
    expect(popupPage?.uid).toBeTruthy();
    expect(primaryPopupTabUid).toBeTruthy();

    const destroyPopupPageRes = await rootAgent.resource('flowSurfaces').destroyPage({
      values: {
        uid: popupPage.uid,
      },
    });
    expect(destroyPopupPageRes.status).toBe(400);
    expect(readErrorMessage(destroyPopupPageRes)).toContain('popup child pages');

    const addTabOnPopupPageRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: popupPage.uid,
        },
        title: 'Wrong API popup tab',
      },
    });
    expect(addTabOnPopupPageRes.status).toBe(400);
    expect(readErrorMessage(addTabOnPopupPageRes)).toContain('addPopupTab');

    const updateOuterTabOnPopupRes = await rootAgent.resource('flowSurfaces').updateTab({
      values: {
        target: {
          uid: primaryPopupTabUid,
        },
        title: 'Wrong update popup tab',
      },
    });
    expect(updateOuterTabOnPopupRes.status).toBe(400);
    expect(readErrorMessage(updateOuterTabOnPopupRes)).toContain('updatePopupTab');

    const moveOuterTabOnPopupRes = await rootAgent.resource('flowSurfaces').moveTab({
      values: {
        sourceUid: primaryPopupTabUid,
        targetUid: page.tabSchemaUid,
        position: 'before',
      },
    });
    expect(moveOuterTabOnPopupRes.status).toBe(400);
    expect(readErrorMessage(moveOuterTabOnPopupRes)).toContain('movePopupTab');

    const removeOuterTabOnPopupRes = await rootAgent.resource('flowSurfaces').removeTab({
      values: {
        uid: primaryPopupTabUid,
      },
    });
    expect(removeOuterTabOnPopupRes.status).toBe(400);
    expect(readErrorMessage(removeOuterTabOnPopupRes)).toContain('removePopupTab');

    const addedPopupTab = getData(
      await rootAgent.resource('flowSurfaces').addPopupTab({
        values: {
          target: {
            uid: popupPage.uid,
          },
          title: 'Secondary popup tab',
          icon: 'TableOutlined',
          documentTitle: 'Secondary popup browser title',
        },
      }),
    );
    expect(addedPopupTab).toMatchObject({
      popupPageUid: popupPage.uid,
      popupTabUid: expect.any(String),
      popupGridUid: expect.any(String),
    });

    const updatedPopupTab = getData(
      await rootAgent.resource('flowSurfaces').updatePopupTab({
        values: {
          target: {
            uid: addedPopupTab.popupTabUid,
          },
          title: 'Secondary popup tab updated',
          icon: 'AppstoreOutlined',
          documentTitle: 'Updated popup browser title',
          flowRegistry: {
            popupTabBeforeRender: {
              key: 'popupTabBeforeRender',
              on: 'beforeRender',
              steps: {},
            },
          },
        },
      }),
    );
    expect(updatedPopupTab).toMatchObject({
      uid: addedPopupTab.popupTabUid,
      title: 'Secondary popup tab updated',
      icon: 'AppstoreOutlined',
    });

    const movedPopupTab = getData(
      await rootAgent.resource('flowSurfaces').movePopupTab({
        values: {
          sourceUid: addedPopupTab.popupTabUid,
          targetUid: primaryPopupTabUid,
          position: 'before',
        },
      }),
    );
    expect(movedPopupTab).toEqual({
      sourceUid: addedPopupTab.popupTabUid,
      targetUid: primaryPopupTabUid,
      position: 'before',
    });

    const removedPopupTab = getData(
      await rootAgent.resource('flowSurfaces').removePopupTab({
        values: {
          target: {
            uid: addedPopupTab.popupTabUid,
          },
        },
      }),
    );
    expect(removedPopupTab).toEqual({
      uid: addedPopupTab.popupTabUid,
    });
  });

  it('should only allow removeNode on regular node uid targets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Remove node contract page',
      tabTitle: 'Remove node contract tab',
    });
    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const tabReadback = await getSurface(rootAgent, {
      tabSchemaUid: page.tabSchemaUid,
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

    const removeBlockRes = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: {
          uid: table.uid,
        },
      },
    });
    expect(removeBlockRes.status).toBe(200);

    const removeByPageSchemaUid = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: { uid: page.pageUid },
      },
    });
    expect(removeByPageSchemaUid.status).toBe(400);
    expect(readErrorMessage(removeByPageSchemaUid)).toContain('destroyPage');

    const removeByTabSchemaUid = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: { uid: page.tabSchemaUid },
      },
    });
    expect(removeByTabSchemaUid.status).toBe(400);
    expect(readErrorMessage(removeByTabSchemaUid)).toContain('removeTab');

    const removeByRouteId = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: {
          routeId: String(page.routeId),
        },
      },
    });
    expect(removeByRouteId.status).toBe(400);
    expect(readErrorMessage(removeByRouteId)).toContain('destroyPage');

    const removePageUid = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: {
          uid: pageReadback.target.uid,
        },
      },
    });
    expect(removePageUid.status).toBe(400);
    expect(readErrorMessage(removePageUid)).toContain('destroyPage');

    const removeTabUid = await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: {
          uid: tabReadback.target.uid,
        },
      },
    });
    expect(removeTabUid.status).toBe(400);
    expect(readErrorMessage(removeTabUid)).toContain('removeTab');
  });

  it('should expose readonly contract for unknown use and reject unknown or unsupported public mutations', async () => {
    await flowRepo.insertModel({
      uid: 'mystery-node',
      use: 'MysteryBlockModel',
      props: {
        title: 'mystery',
      },
    } as any);

    const mysteryCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: 'mystery-node',
          },
        },
      }),
    );
    expect(mysteryCatalog.editableDomains).toEqual([]);
    expect(mysteryCatalog.configureOptions).toEqual({});
    expect(mysteryCatalog.settingsSchema).toEqual({});
    expect(mysteryCatalog.settingsContract).toEqual({});
    expect(mysteryCatalog.actions).toEqual([]);

    const updateUnknownRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: 'mystery-node',
        },
        props: {
          title: 'should fail',
        },
      },
    });
    expect(updateUnknownRes.status).toBe(400);
    expect(readErrorMessage(updateUnknownRes)).toContain(`domain 'props' is not editable`);

    const eventUnknownRes = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: 'mystery-node',
        },
        flowRegistry: {
          test: {
            on: 'beforeRender',
          },
        },
      },
    });
    expect(eventUnknownRes.status).toBe(400);
    expect(readErrorMessage(eventUnknownRes)).toContain(`setEventFlows is not supported`);

    const page = await createPage(rootAgent, {
      title: 'Mutation contract page',
      tabTitle: 'Mutation contract tab',
    });
    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const pageGridUid = getRouteBackedTabs(pageReadback)[0]?.subModels?.grid?.uid;
    expect(pageGridUid).toBeTruthy();
    const pageCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: pageGridUid,
          },
        },
      }),
    );
    expect(pageCatalog.blocks.find((item: any) => item.key === 'form')).toBeUndefined();
    expect(pageCatalog.blocks.find((item: any) => item.use === 'FormBlockModel')).toBeUndefined();

    const unknownBlockRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: pageGridUid,
        },
        type: 'notRegisteredBlock',
      },
    });
    expect(unknownBlockRes.status).toBe(400);
    expect(readErrorMessage(unknownBlockRes)).toContain('registered block types/uses');

    const unsupportedBlockRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: pageGridUid,
        },
        type: 'map',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      },
    });
    expect(unsupportedBlockRes.status).toBe(400);
    expect(readErrorMessage(unsupportedBlockRes)).toContain(`does not support creating 'map' yet`);

    const hiddenCompatFormRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: pageGridUid,
        },
        type: 'form',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      },
    });
    expect(hiddenCompatFormRes.status).toBe(400);
    expect(readErrorMessage(hiddenCompatFormRes)).toContain('registered block types/uses');

    const hiddenCompatFormUseRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: pageGridUid,
        },
        use: 'FormBlockModel',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      },
    });
    expect(hiddenCompatFormUseRes.status).toBe(400);
    expect(readErrorMessage(hiddenCompatFormUseRes)).toContain('registered block types/uses');

    const table = await addBlockData(rootAgent, {
      target: {
        uid: pageGridUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const unknownActionRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: table.uid,
        },
        type: 'notRegisteredAction',
      },
    });
    expect(unknownActionRes.status).toBe(400);
    expect(readErrorMessage(unknownActionRes)).toContain('registered action types/uses');
  });

  it('should expose full public action catalog variants without collapsing cross-scope action keys', async () => {
    const globalCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {},
      }),
    );

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

  it('should only expose catalog blocks and actions backed by plugins enabled in the current app instance', async () => {
    await syncFlowSurfacesEnabledPlugins(app, FLOW_SURFACES_MINIMAL_TEST_PLUGINS);
    try {
      const minimalRootAgent = await loginFlowSurfacesRootAgent(app);

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
        expect.arrayContaining(['addChild', 'view', 'edit', 'popup', 'delete', 'updateRecord', 'js']),
      );
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'duplicate')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'composeEmail')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'templatePrint')).toBeUndefined();
      expect(tableCatalog.recordActions.find((item: any) => item.key === 'triggerWorkflow')).toBeUndefined();
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
    const filterForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'filterForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: '',
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
        'composeEmail',
        'templatePrint',
        'triggerWorkflow',
      ]),
    );
    expect(tableCatalog.configureOptions).toMatchObject({
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
        'addChild',
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
    expect(tableCatalog.recordActions.length).toBeGreaterThan(0);
    expect(tableCatalog.actions.find((item: any) => item.key === 'addNew')?.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      openView: {
        type: 'object',
      },
    });
    expect(tableCatalog.recordActions.find((item: any) => item.key === 'view')?.configureOptions).toMatchObject({
      title: {
        type: 'string',
      },
      openView: {
        type: 'object',
      },
    });

    const createFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: createForm.uid,
          },
        },
      }),
    );
    expect(createFormCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['submit', 'js', 'triggerWorkflow']),
    );

    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: details.uid,
          },
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
        'templatePrint',
        'triggerWorkflow',
      ]),
    );

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
        collectionName: 'employees',
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
      expect.arrayContaining(['currentRecord', 'associatedRecords', 'otherRecords']),
    );
    expect(recordPopupDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection']),
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
      expect.arrayContaining(['currentRecord', 'associatedRecords', 'otherRecords']),
    );
    expect(recordScopedPopupDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection']),
    );

    const invalidRaw = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: recordPopup.uid,
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
                fieldPath: 'username',
                target: 'table',
              },
              {
                fieldPath: 'nickname',
                target: 'table',
              },
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
            fields: ['username', 'nickname'],
            actions: ['filter', 'addNew', 'refresh'],
            recordActions: ['view', 'edit', 'delete'],
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
    expect(composed.keyToUid.filter).toBeTruthy();
    expect(composed.keyToUid.table).toBeTruthy();
    expect(composed.layout.sizes.row1).toEqual([7, 17]);

    const tabGrid = await flowRepo.findModelByParentId(page.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(tabGrid?.props?.sizes?.row1).toEqual([7, 17]);
    expect(tabGrid?.props?.rowOrder).toEqual(['row1']);

    const tableReadback = await getSurface(rootAgent, {
      uid: composed.keyToUid.table,
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
    expect(_.castArray(tableReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['FilterActionModel', 'AddNewActionModel', 'RefreshActionModel']),
    );

    const actionsColumnUid = _.castArray(tableReadback.tree.subModels?.columns || []).find(
      (item: any) => item?.use === 'TableActionsColumnModel',
    )?.uid;
    const rowActionsReadback = await getSurface(rootAgent, {
      uid: actionsColumnUid,
    });
    expect(_.castArray(rowActionsReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['ViewActionModel', 'EditActionModel', 'DeleteActionModel']),
    );

    const filterReadback = await getSurface(rootAgent, {
      uid: composed.keyToUid.filter,
    });
    expect(filterReadback.tree.use).toBe('FilterFormBlockModel');
    expect(_.castArray(filterReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['FilterFormSubmitActionModel', 'FilterFormResetActionModel']),
    );

    const usernameFilter = composed.blocks
      .find((item: any) => item.key === 'filter')
      ?.fields?.find((item: any) => item.fieldPath === 'username');
    expect(usernameFilter?.wrapperUid).toBeTruthy();
    const usernameFilterReadback = await getSurface(rootAgent, {
      uid: usernameFilter.wrapperUid,
    });
    expect(usernameFilterReadback.tree.stepParams?.filterFormItemSettings?.init?.defaultTargetUid).toBe(
      composed.keyToUid.table,
    );
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
              collectionName: 'employees',
            },
            fields: ['nickname', 'status'],
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
                      fields: ['nickname'],
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
    expect(listBlock.fields.map((item: any) => item.fieldPath)).toEqual(['nickname', 'status']);
    expect(listBlock.actions.map((item: any) => item.type)).toEqual(['addNew', 'refresh']);
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
    expect(_.castArray(listReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['AddNewActionModel', 'RefreshActionModel']),
    );
    expect(
      _.castArray(listReadback.tree.subModels?.item?.subModels?.grid?.subModels?.items || []).map(
        (item: any) => item?.subModels?.field?.stepParams?.fieldSettings?.init?.fieldPath,
      ),
    ).toEqual(expect.arrayContaining(['nickname', 'status']));
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
              collectionName: 'employees',
            },
            fields: ['nickname', 'status'],
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
    expect(gridCardBlock.fields.map((item: any) => item.fieldPath)).toEqual(['nickname', 'status']);
    expect(gridCardBlock.actions.map((item: any) => item.type)).toEqual(['addNew', 'refresh']);
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
    expect(_.castArray(gridCardReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['AddNewActionModel', 'RefreshActionModel']),
    );
    expect(
      _.castArray(gridCardReadback.tree.subModels?.item?.subModels?.grid?.subModels?.items || []).map(
        (item: any) => item?.subModels?.field?.stepParams?.fieldSettings?.init?.fieldPath,
      ),
    ).toEqual(expect.arrayContaining(['nickname', 'status']));
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
              collectionName: 'employees',
            },
            actions: ['addNew', 'refresh'],
            recordActions: ['view', 'delete'],
          },
        ],
      },
    });
    expect(tableRecordActionsRes.status).toBe(200);

    const tableBlock = getData(tableRecordActionsRes).blocks.find((item: any) => item.key === 'table');
    expect(tableBlock.actions.map((item: any) => item.type)).toEqual(['addNew', 'refresh']);
    expect(tableBlock.recordActions.map((item: any) => item.type)).toEqual(['view', 'delete']);
    expect(tableBlock.actionsColumnUid).toBeTruthy();

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
              collectionName: 'employees',
            },
            recordActions: ['view'],
          },
        ],
      },
    });
    expect(detailsRecordActionsRes.status).toBe(200);
    const detailsBlock = getData(detailsRecordActionsRes).blocks.find((item: any) => item.key === 'details');
    expect(detailsBlock.recordActions.map((item: any) => item.type)).toEqual(['view']);

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
              collectionName: 'employees',
            },
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
              collectionName: 'employees',
            },
            recordActions: ['addNew'],
          },
        ],
      },
    });
    expect(gridCardRecordOnlyRes.status).toBe(400);
    expect(readErrorMessage(gridCardRecordOnlyRes)).toContain(`must be placed under actions`);
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
              fields: ['username', 'nickname'],
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
            fields: ['username', 'nickname'],
            actions: ['submit'],
          },
        ],
      },
    });
    expect(replaceRes.status).toBe(200);
    const replaced = getData(replaceRes);
    expect(replaced.keyToUid.form).toBeTruthy();

    const tabGrid = await flowRepo.findModelByParentId(page.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(_.castArray(tabGrid?.subModels?.items || []).map((item: any) => item.uid)).toEqual([replaced.keyToUid.form]);
    expect(
      _.castArray(tabGrid?.subModels?.items || []).some((item: any) => item.uid === initialCompose.keyToUid.table),
    ).toBe(false);
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

    const formUid = replaced.keyToUid.form;
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
    });
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
              collectionName: 'employees',
            },
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
        ],
      },
    });
    expect(addBlocksRes.status).toBe(200);
    const addBlocksData = getData(addBlocksRes);
    expect(addBlocksData.successCount).toBe(2);
    expect(addBlocksData.errorCount).toBe(0);
    const tableUid = addBlocksData.blocks.find((item: any) => item.key === 'table')?.result?.uid;
    expect(tableUid).toBeTruthy();

    const addFieldsRes = await rootAgent.resource('flowSurfaces').addFields({
      values: {
        target: {
          uid: tableUid,
        },
        fields: [
          {
            key: 'nickname',
            fieldPath: 'nickname',
            settings: {
              title: 'Employee nickname',
              width: 220,
            },
          },
          {
            key: 'bad-field',
            fieldPath: 'status',
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
    expect(addFieldsData.fields[1].error.message).toContain('settings invalid');
    expect(addFieldsData.fields[1].error.message).toContain('supported configureOptions');

    const fieldReadback = await getSurface(rootAgent, {
      uid: addFieldsData.fields[0].result.wrapperUid,
    });
    expect(fieldReadback.tree.props?.title).toBe('Employee nickname');
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
                  fields: ['nickname'],
                  actions: ['submit'],
                },
              ],
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
                  fields: ['nickname'],
                },
              ],
            },
          },
        ],
      },
    });
    expect(addActionsRes.status).toBe(200);
    const addActionsData = getData(addActionsRes);
    expect(addActionsData.successCount).toBe(1);
    expect(addActionsData.errorCount).toBe(1);
    expect(addActionsData.actions[0].result.popupPageUid).toBeTruthy();
    expectStructuredError(addActionsData.actions[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(addActionsData.actions[1].error.message).toContain(`type 'refresh' does not support popup`);

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
          {
            key: 'delete',
            type: 'delete',
            settings: {
              confirm: true,
            },
          },
        ],
      },
    });
    expect(addRecordActionsRes.status).toBe(200);
    const addRecordActionsData = getData(addRecordActionsRes);
    expect(addRecordActionsData.successCount).toBe(2);
    expect(addRecordActionsData.errorCount).toBe(0);
    expect(addRecordActionsData.recordActions[0].result.popupGridUid).toBeTruthy();

    const addFieldRawUnknownRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: tableUid,
        },
        fieldPath: 'status',
        settings: {
          badSetting: true,
        },
      },
    });
    expect(addFieldRawUnknownRes.status).toBe(400);
    expect(readErrorMessage(addFieldRawUnknownRes)).toContain('settings invalid');
    expect(readErrorMessage(addFieldRawUnknownRes)).toContain('supported configureOptions');
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
    expect(addBlocksData.blocks[1].error.message).toContain('settings invalid');
    expect(addBlocksData.blocks[1].error.message).toContain('stepParams.tableSettings.dataScope.filter');
    expect(addBlocksData.blocks[1].error.message).toContain('FilterGroup');
    expect(addBlocksData.blocks[1].error.message).toContain('{"logic":"$and","items":[]}');

    const validTableReadback = await getSurface(rootAgent, {
      uid: addBlocksData.blocks[0].result.uid,
    });
    expect(validTableReadback.tree.props?.title).toBe('Valid employees table');
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

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        type: 'filterForm',
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
            key: 'filterForm',
            type: 'filterForm',
            actions: ['submit', 'reset'],
          },
        ],
      },
    });

    expect(composeRes.status).toBe(200);
    const composed = getData(composeRes);
    expect(composed.blocks).toHaveLength(1);
    expect(composed.blocks[0]).toMatchObject({
      key: 'filterForm',
      type: 'filterForm',
    });
    expect(composed.blocks[0].uid).toBeTruthy();
    expect(composed.keyToUid.filterForm).toBe(composed.blocks[0].uid);

    const readback = await getSurface(rootAgent, {
      uid: composed.blocks[0].uid,
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
        collectionName: 'employees',
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
    expect(readErrorMessage(rawFieldRes)).toContain('does not accept raw keys');

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

    const listUid = composed.keyToUid.list;
    const gridUid = composed.keyToUid.grid;
    const markdownUid = composed.keyToUid.markdown;
    const iframeUid = composed.keyToUid.iframe;
    const chartUid = composed.keyToUid.chart;
    const panelUid = composed.keyToUid.panel;

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
            settings: {
              columns: 3,
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const composed = getData(composeRes);
    const gridUid = composed.keyToUid.grid;
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
    expect(readErrorMessage(response)).toContain('missing: sm, xl, xxl');
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
              fields: ['nickname'],
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
    const tableField = tableBlock.fields.find((item: any) => item.fieldPath === 'nickname');
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
              title: 'Employee nickname',
              width: 280,
              fixed: 'left',
              editable: true,
              dataIndex: 'nickname',
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

    const tableWrapperReadback = await getSurface(rootAgent, { uid: tableField.wrapperUid });
    expect(tableWrapperReadback.tree.props).toMatchObject({
      title: 'Employee nickname',
      width: 280,
      fixed: 'left',
      editable: true,
      dataIndex: 'nickname',
      titleField: 'nickname',
    });
    expect(tableWrapperReadback.tree.stepParams?.tableColumnSettings?.title?.title).toBe('Employee nickname');

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
  });

  it('should create and destroy the modern page ui schema shell while keeping top-level tab synthetic', async () => {
    const page = await createPage(rootAgent, {
      title: 'Shell page',
      tabTitle: 'Shell tab',
    });

    const pageSchemaRes = await rootAgent.resource('uiSchemas').getJsonSchema({
      resourceIndex: page.pageSchemaUid,
    });
    expect(pageSchemaRes.status || pageSchemaRes.statusCode).toBe(200);
    expect(pageSchemaRes.body.data).toMatchObject({
      type: 'void',
      'x-component': 'FlowRoute',
      'x-uid': page.pageSchemaUid,
    });

    const pageModel = await flowRepo.findModelByParentId(page.pageSchemaUid, {
      subKey: 'page',
      includeAsyncNode: true,
    });
    expect(pageModel?.use).toBe('RootPageModel');
    expect(pageModel?.subModels?.tabs).toBeUndefined();

    const tabGrid = await flowRepo.findModelByParentId(page.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(tabGrid?.use).toBe('BlockGridModel');

    const destroyRes = await rootAgent.resource('flowSurfaces').destroyPage({
      values: {
        uid: page.pageUid,
      },
    });
    expect(destroyRes.status).toBe(200);

    const removedSchemaRes = await rootAgent.resource('uiSchemas').getJsonSchema({
      resourceIndex: page.pageSchemaUid,
    });
    expect(removedSchemaRes.status || removedSchemaRes.statusCode).toBe(200);
    expect(removedSchemaRes.body.data || {}).toEqual({});
  });

  it('should normalize users.roles table association fields into text bindings and keep popup context on the clicked role record', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users roles page',
      tabTitle: 'Users roles tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
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
                {
                  fieldPath: 'username',
                  target: 'table',
                },
                {
                  fieldPath: 'nickname',
                  target: 'table',
                },
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
              fields: ['username', 'nickname', 'roles', 'roles.title'],
              actions: ['filter', 'addNew'],
              recordActions: ['view', 'edit', 'delete'],
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
      }),
    );

    expect(composeRes.layout.sizes.row1).toEqual([7, 17]);
    const tableFields = composeRes.blocks.find((item: any) => item.key === 'table')?.fields || [];
    const directRolesField = tableFields.find((item: any) => item.fieldPath === 'roles');
    const rolesTitleField = tableFields.find((item: any) => item.fieldPath === 'roles.title');
    expect(directRolesField?.wrapperUid).toBeTruthy();
    expect(directRolesField?.fieldUid).toBeTruthy();
    expect(rolesTitleField?.wrapperUid).toBeTruthy();
    expect(rolesTitleField?.fieldUid).toBeTruthy();

    const directRolesWrapperReadback = await getSurface(rootAgent, { uid: directRolesField.wrapperUid });
    const directRolesInnerReadback = await getSurface(rootAgent, { uid: directRolesField.fieldUid });

    expect(directRolesWrapperReadback.tree.use).toBe('TableColumnModel');
    expect(directRolesInnerReadback.tree.use).toBe('DisplayTextFieldModel');
    expect(directRolesWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(directRolesWrapperReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directRolesInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(directRolesInnerReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directRolesWrapperReadback.tree.props?.titleField).toBe('title');
    expect(directRolesInnerReadback.tree.props?.titleField).toBe('title');

    expect(rolesTitleField?.wrapperUid).toBeTruthy();
    expect(rolesTitleField?.fieldUid).toBeTruthy();

    const rolesWrapperReadback = await getSurface(rootAgent, { uid: rolesTitleField.wrapperUid });
    const rolesInnerReadback = await getSurface(rootAgent, { uid: rolesTitleField.fieldUid });

    expect(rolesWrapperReadback.tree.use).toBe('TableColumnModel');
    expect(rolesInnerReadback.tree.use).toBe('DisplayTextFieldModel');
    const rolesWrapperCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: rolesTitleField.wrapperUid,
          },
        },
      }),
    );
    const rolesInnerCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: rolesTitleField.fieldUid,
          },
        },
      }),
    );
    expect(rolesWrapperCatalog.configureOptions).toMatchObject({
      fieldComponent: {
        type: 'string',
      },
    });
    expect(rolesWrapperCatalog.configureOptions.mode).toBeUndefined();
    expect(rolesInnerCatalog.configureOptions).toMatchObject({
      displayStyle: {
        type: 'string',
        enum: expect.arrayContaining(['text', 'tag']),
      },
    });
    expect(rolesInnerCatalog.configureOptions.mode).toBeUndefined();
    expect(rolesWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(rolesWrapperReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(rolesInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(rolesInnerReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(rolesWrapperReadback.tree.props?.titleField).toBe('title');
    expect(rolesInnerReadback.tree.props?.titleField).toBe('title');

    const popupDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: directRolesField.fieldUid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
        },
      }),
    );

    const initialPopupDetailsReadback = await getSurface(rootAgent, { uid: popupDetails.uid });
    expect(initialPopupDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.wrapperUid,
            },
            changes: {
              clickToOpen: true,
              openView: {
                dataSourceKey: 'main',
                collectionName: 'roles',
                mode: 'drawer',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    const fieldPopupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: directRolesField.fieldUid,
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

    const popupTitleField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: popupDetails.uid,
          },
          fieldPath: 'title',
        },
      }),
    );

    const rolesInnerWithPopup = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(rolesInnerWithPopup.tree.props?.clickToOpen).toBe(true);
    expect(rolesInnerWithPopup.tree.stepParams?.displayFieldSettings?.clickToOpen?.clickToOpen).toBe(true);
    expect(rolesInnerWithPopup.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      mode: 'drawer',
    });

    const popupPage = rolesInnerWithPopup.tree.subModels?.page;
    expect(popupPage?.use).toBe('ChildPageModel');
    const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
    expect(popupTab?.use).toBe('ChildPageTabModel');
    expect(popupTab?.subModels?.grid?.use).toBe('BlockGridModel');
    expect(_.castArray(popupTab?.subModels?.grid?.subModels?.items || [])[0]?.uid).toBe(popupDetails.uid);

    const popupGridCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: popupTab.subModels?.grid?.uid,
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

    const popupGridDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: popupTab.subModels?.grid?.uid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
        },
      }),
    );

    const popupDetailsReadback = await getSurface(rootAgent, { uid: popupDetails.uid });
    expect(popupDetailsReadback.tree.use).toBe('DetailsBlockModel');
    expect(popupDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const popupGridDetailsReadback = await getSurface(rootAgent, { uid: popupGridDetails.uid });
    expect(popupGridDetailsReadback.tree.use).toBe('DetailsBlockModel');
    expect(popupGridDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const popupEditAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: popupDetails.uid,
          },
          type: 'edit',
        },
      }),
    );
    const popupEditForm = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: popupEditAction.uid,
          },
          type: 'editForm',
          resource: {
            binding: 'currentRecord',
          },
        },
      }),
    );
    const popupEditFormReadback = await getSurface(rootAgent, { uid: popupEditForm.uid });
    expect(popupEditFormReadback.tree.use).toBe('EditFormModel');
    expect(popupEditFormReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const popupTitleReadback = await getSurface(rootAgent, { uid: popupTitleField.wrapperUid });
    expect(popupTitleReadback.tree.stepParams?.fieldSettings?.init?.fieldPath).toBe('title');

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.wrapperUid,
            },
            changes: {
              titleField: 'name',
            },
          },
        })
      ).status,
    ).toBe(200);

    let syncedWrapper = await getSurface(rootAgent, { uid: directRolesField.wrapperUid });
    let syncedInner = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(syncedWrapper.tree.props?.titleField).toBe('name');
    expect(syncedInner.tree.props?.titleField).toBe('name');

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.fieldUid,
            },
            changes: {
              titleField: 'title',
            },
          },
        })
      ).status,
    ).toBe(200);

    syncedWrapper = await getSurface(rootAgent, { uid: directRolesField.wrapperUid });
    syncedInner = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(syncedWrapper.tree.props?.titleField).toBe('title');
    expect(syncedInner.tree.props?.titleField).toBe('title');
  });

  it('should keep users.roles details fields aligned with manual UI Builder text-display semantics', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users details roles page',
      tabTitle: 'Users details roles tab',
    });

    const detailsBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
        },
      }),
    );
    expect(detailsCatalog.fields.find((item: any) => item.key === 'roles')).toMatchObject({
      use: 'DetailsItemModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(detailsCatalog.fields.some((item: any) => item.key === 'roles.title')).toBe(false);

    const rolesField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'roles',
        },
      }),
    );

    const rolesFieldFromLeaf = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'roles.title',
        },
      }),
    );

    expect(rolesField.fieldPath).toBe('roles');
    expect(rolesField.associationPathName).toBeUndefined();
    expect(rolesFieldFromLeaf.fieldPath).toBe('roles');
    expect(rolesFieldFromLeaf.associationPathName).toBeUndefined();

    const directWrapper = await getSurface(rootAgent, { uid: rolesField.wrapperUid });
    const directInner = await getSurface(rootAgent, { uid: rolesField.fieldUid });
    expect(directWrapper.tree.use).toBe('DetailsItemModel');
    expect(directInner.tree.use).toBe('DisplayTextFieldModel');
    expect(directWrapper.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(directWrapper.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directInner.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(directInner.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directWrapper.tree.props?.titleField).toBe('title');
    expect(directInner.tree.props?.titleField).toBe('title');

    const leafWrapper = await getSurface(rootAgent, { uid: rolesFieldFromLeaf.wrapperUid });
    const leafInner = await getSurface(rootAgent, { uid: rolesFieldFromLeaf.fieldUid });
    expect(leafWrapper.tree.use).toBe('DetailsItemModel');
    expect(leafInner.tree.use).toBe('DisplayTextFieldModel');
    expect(leafWrapper.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(leafWrapper.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(leafInner.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(leafInner.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(leafWrapper.tree.props?.titleField).toBe('title');
    expect(leafInner.tree.props?.titleField).toBe('title');
  });

  it('should keep users.roles associationName when adding associated records block inside username popup', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users username popup page',
      tabTitle: 'Users username popup tab',
    });

    const composeRes = getData(
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
              fields: ['username', 'nickname'],
              actions: ['refresh'],
            },
          ],
        },
      }),
    );

    const tableFields = composeRes.blocks.find((item: any) => item.key === 'table')?.fields || [];
    const usernameField = tableFields.find((item: any) => item.fieldPath === 'username');
    expect(usernameField?.wrapperUid).toBeTruthy();
    expect(usernameField?.fieldUid).toBeTruthy();

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: usernameField.wrapperUid,
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
        })
      ).status,
    ).toBe(200);

    const popupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: usernameField.fieldUid,
          },
        },
      }),
    );
    const tableBindings =
      popupCatalog.blocks.find((item: any) => item.use === 'TableBlockModel')?.resourceBindings || [];
    expect(tableBindings.map((item: any) => item.key)).toEqual(expect.arrayContaining(['associatedRecords']));
    expect(tableBindings.find((item: any) => item.key === 'associatedRecords')?.associationFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'roles',
          collectionName: 'roles',
          associationName: 'users.roles',
        }),
      ]),
    );

    const rolesTable = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: usernameField.fieldUid,
          },
          type: 'table',
          resource: {
            binding: 'associatedRecords',
            associationField: 'roles',
          },
        },
      }),
    );

    const rolesTableReadback = await getSurface(rootAgent, { uid: rolesTable.uid });
    expect(rolesTableReadback.tree.use).toBe('TableBlockModel');
    expect(rolesTableReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });
  });

  it('should preserve users.roles sourceId on nested record-action popups inside association tables', async () => {
    const page = await createPage(rootAgent, {
      title: 'Nested users roles popup page',
      tabTitle: 'Nested users roles popup tab',
    });

    const composeRes = getData(
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
              fields: ['username', 'roles'],
              recordActions: ['view'],
            },
          ],
        },
      }),
    );

    const table = composeRes.blocks.find((item: any) => item.key === 'table');
    const tableViewAction = table?.recordActions?.[0];
    expect(tableViewAction?.uid).toBeTruthy();

    const userPopupRolesTable = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: tableViewAction.uid,
          },
          type: 'table',
          resource: {
            binding: 'associatedRecords',
            associationField: 'roles',
          },
        },
      }),
    );

    const userPopupRolesTableReadback = await getSurface(rootAgent, { uid: userPopupRolesTable.uid });
    expect(userPopupRolesTableReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });

    const roleViewAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: userPopupRolesTable.uid,
          },
          type: 'view',
        },
      }),
    );

    const roleViewActionReadback = await getSurface(rootAgent, { uid: roleViewAction.uid });
    expect(roleViewActionReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const nestedRoleDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: roleViewAction.uid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
        },
      }),
    );

    const nestedRoleDetailsReadback = await getSurface(rootAgent, { uid: nestedRoleDetails.uid });
    expect(nestedRoleDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const legacyRoleViewAction = _.cloneDeep(
      await flowRepo.findModelById(roleViewAction.uid, { includeAsyncNode: true }),
    );
    delete legacyRoleViewAction?.stepParams?.popupSettings?.openView?.sourceId;
    await flowRepo.upsertModel(legacyRoleViewAction);

    const nestedRoleDetailsViaFallback = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: roleViewAction.uid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
        },
      }),
    );

    const nestedRoleDetailsFallbackReadback = await getSurface(rootAgent, { uid: nestedRoleDetailsViaFallback.uid });
    expect(nestedRoleDetailsFallbackReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });
  });

  it('should not auto preserve associationName when an association field is configured as a non-association-field popup', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users roles non-association-field popup page',
      tabTitle: 'Users roles non-association-field popup tab',
    });

    const composeRes = getData(
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
              fields: ['username', 'roles'],
              actions: ['refresh'],
            },
          ],
        },
      }),
    );

    const tableFields = composeRes.blocks.find((item: any) => item.key === 'table')?.fields || [];
    const directRolesField = tableFields.find((item: any) => item.fieldPath === 'roles');
    expect(directRolesField?.wrapperUid).toBeTruthy();
    expect(directRolesField?.fieldUid).toBeTruthy();

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.wrapperUid,
            },
            changes: {
              clickToOpen: true,
              openView: {
                dataSourceKey: 'main',
                collectionName: 'users',
                mode: 'dialog',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    let fieldReadback = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(fieldReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      mode: 'dialog',
    });
    expect(fieldReadback.tree.stepParams?.popupSettings?.openView).not.toHaveProperty('associationName');

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.wrapperUid,
            },
            changes: {
              openView: {
                dataSourceKey: 'main',
                collectionName: 'roles',
                associationName: null,
                mode: 'drawer',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    fieldReadback = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(fieldReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: null,
      mode: 'drawer',
    });
  });

  it('should align table/details/grid-card/edit-form field catalog semantics with frontend menus', async () => {
    const page = await createPage(rootAgent, {
      title: 'Field catalog alignment page',
      tabTitle: 'Field catalog alignment tab',
    });

    const tableBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const detailsBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const gridCardBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'gridCard',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const editFormBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'editForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableBlock.uid,
          },
        },
      }),
    );
    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
        },
      }),
    );
    const gridCardCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: gridCardBlock.uid,
          },
        },
      }),
    );
    const editFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: editFormBlock.uid,
          },
        },
      }),
    );

    expect(tableCatalog.fields.some((item: any) => item.key === 'skills.label')).toBe(false);
    expect(detailsCatalog.fields.some((item: any) => item.key === 'skills.label')).toBe(false);
    expect(gridCardCatalog.fields.some((item: any) => item.key === 'skills.label')).toBe(false);
    expect(tableCatalog.fields.find((item: any) => item.key === 'skills')).toMatchObject({
      use: 'TableColumnModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(detailsCatalog.fields.find((item: any) => item.key === 'skills')).toMatchObject({
      use: 'DetailsItemModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(gridCardCatalog.fields.find((item: any) => item.key === 'skills')).toMatchObject({
      use: 'DetailsItemModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(tableCatalog.fields.some((item: any) => item.key === 'profile.bio')).toBe(true);
    expect(detailsCatalog.fields.some((item: any) => item.key === 'profile.bio')).toBe(true);
    expect(gridCardCatalog.fields.some((item: any) => item.key === 'profile.bio')).toBe(true);

    expect(editFormCatalog.fields.find((item: any) => item.key === 'profile.bio')).toMatchObject({
      use: 'FormAssociationItemModel',
      wrapperUse: 'FormAssociationItemModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(editFormCatalog.fields.find((item: any) => item.key === 'js:profile.bio')).toBeUndefined();

    const directAddField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: editFormBlock.uid,
          },
          fieldPath: 'profile.bio',
        },
      }),
    );
    const directAddWrapper = await getSurface(rootAgent, { uid: directAddField.wrapperUid });
    const directAddInner = await getSurface(rootAgent, { uid: directAddField.fieldUid });
    expect(directAddWrapper.tree.use).toBe('FormAssociationItemModel');
    expect(directAddInner.tree.use).toBe('DisplayTextFieldModel');

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'editFormViaCompose',
              type: 'editForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['profile.bio'],
            },
          ],
        },
      }),
    );
    const composedField = composeRes.blocks.find((item: any) => item.key === 'editFormViaCompose')?.fields?.[0];
    expect(composedField?.wrapperUid).toBeTruthy();
    const composeWrapper = await getSurface(rootAgent, { uid: composedField.wrapperUid });
    const composeInner = await getSurface(rootAgent, { uid: composedField.fieldUid });
    expect(composeWrapper.tree.use).toBe('FormAssociationItemModel');
    expect(composeInner.tree.use).toBe('DisplayTextFieldModel');
  });

  it('should normalize generic to-many association leaf paths but keep to-one leaf paths unchanged', async () => {
    const page = await createPage(rootAgent, {
      title: 'Association binding page',
      tabTitle: 'Association binding tab',
    });

    const detailsBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const skillsField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'skills.label',
        },
      }),
    );
    expect(skillsField.fieldPath).toBe('skills');
    expect(skillsField.associationPathName).toBeUndefined();

    const directSkillsField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'skills',
        },
      }),
    );
    expect(directSkillsField.fieldPath).toBe('skills');
    expect(directSkillsField.associationPathName).toBeUndefined();

    const profileField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'profile.bio',
        },
      }),
    );
    expect(profileField.fieldPath).toBe('profile.bio');
    expect(profileField.associationPathName).toBe('profile');

    const skillsWrapperReadback = await getSurface(rootAgent, { uid: skillsField.wrapperUid });
    const skillsInnerReadback = await getSurface(rootAgent, { uid: skillsField.fieldUid });
    expect(skillsWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'skills',
    });
    expect(skillsWrapperReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(skillsInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'skills',
    });
    expect(skillsInnerReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(skillsWrapperReadback.tree.props?.titleField).toBe('label');
    expect(skillsInnerReadback.tree.props?.titleField).toBe('label');

    const directSkillsWrapperReadback = await getSurface(rootAgent, { uid: directSkillsField.wrapperUid });
    const directSkillsInnerReadback = await getSurface(rootAgent, { uid: directSkillsField.fieldUid });
    expect(directSkillsWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'skills',
    });
    expect(directSkillsWrapperReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directSkillsInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'skills',
    });
    expect(directSkillsInnerReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directSkillsInnerReadback.tree.use).toBe('DisplayTextFieldModel');
    expect(directSkillsWrapperReadback.tree.props?.titleField).toBe('label');
    expect(directSkillsInnerReadback.tree.props?.titleField).toBe('label');

    const profileWrapperReadback = await getSurface(rootAgent, { uid: profileField.wrapperUid });
    const profileInnerReadback = await getSurface(rootAgent, { uid: profileField.fieldUid });
    expect(profileWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'profile.bio',
      associationPathName: 'profile',
    });
    expect(profileInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'profile.bio',
      associationPathName: 'profile',
    });
    expect(profileWrapperReadback.tree.props || {}).not.toHaveProperty('titleField');
    expect(profileInnerReadback.tree.props || {}).not.toHaveProperty('titleField');
  });

  it('should reject no-interface bound fields across addField addFields and compose', async () => {
    const page = await createPage(rootAgent, {
      title: 'No interface contract page',
      tabTitle: 'No interface contract tab',
    });

    const rolesTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'roles',
      },
    });

    const singleRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: rolesTable.uid,
        },
        fieldPath: 'default',
      },
    });
    expect(singleRes.status).toBe(400);
    expect(readErrorMessage(singleRes)).toContain('roles.default');
    expect(readErrorMessage(singleRes)).toContain('has no interface');

    const batchRes = await rootAgent.resource('flowSurfaces').addFields({
      values: {
        target: {
          uid: rolesTable.uid,
        },
        fields: [
          { key: 'title', fieldPath: 'title' },
          { key: 'hidden', fieldPath: 'hidden' },
        ],
      },
    });
    expect(batchRes.status).toBe(200);
    const batchData = getData(batchRes);
    expect(batchData.successCount).toBe(1);
    expect(batchData.errorCount).toBe(1);
    expect(batchData.fields[0].ok).toBe(true);
    expect(batchData.fields[1].ok).toBe(false);
    expectStructuredError(batchData.fields[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(batchData.fields[1].error.message).toContain('roles.hidden');
    expect(batchData.fields[1].error.message).toContain('has no interface');

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'rolesDetails',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'roles',
            },
            fields: ['title', 'hidden'],
          },
        ],
      },
    });
    expect(composeRes.status).toBe(400);
    expect(readErrorMessage(composeRes)).toContain('roles.hidden');
    expect(readErrorMessage(composeRes)).toContain('has no interface');
  });
});

function getData(response: any) {
  expect(response.status).toBe(200);
  return response.body.data;
}

function readErrorMessage(response: any) {
  return response?.body?.errors?.[0]?.message || '';
}

function readErrorItem(response: any) {
  return response?.body?.errors?.[0] || {};
}

function expectStructuredError(
  error: any,
  expected: {
    status: number;
    type: string;
  },
) {
  expect(error).toMatchObject({
    code: expect.any(String),
    message: expect.any(String),
    status: expected.status,
    type: expected.type,
  });
}

async function createPage(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createPage({
      values,
    }),
  );
}

async function createMenu(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createMenu({
      values,
    }),
  );
}

async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').get({
      ...target,
    }),
  );
}

function getRouteBackedTabs(readback: any) {
  return _.castArray(readback?.tree?.subModels?.tabs || []);
}

async function addBlockData(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').addBlock({
      values,
    }),
  );
}

async function setupFixtureCollections(rootAgent: any) {
  await rootAgent.resource('collections').create({
    values: {
      name: 'employees',
      title: 'Employees',
      fields: [
        { name: 'nickname', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
      ],
    },
  });
  await rootAgent.resource('collections').create({
    values: {
      name: 'flow_surface_profiles',
      title: 'Flow surface profiles',
      fields: [{ name: 'bio', type: 'text', interface: 'textarea' }],
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'profile',
      type: 'belongsTo',
      target: 'flow_surface_profiles',
      foreignKey: 'profileId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'skills',
      title: 'Skills',
      // Keep generic association leaf-path assertions stable instead of falling back to the default id title key.
      titleField: 'label',
      filterTargetKey: 'label',
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
}
