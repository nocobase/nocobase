/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import _ from 'lodash';
import {
  buildPersistedRootPageModel,
  buildPopupPageTree,
  buildSyntheticRootPageTabModel,
} from '../flow-surfaces/builder';
import {
  addBlockData,
  createFlowSurfacesContractContext,
  createMenu,
  createPage,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  getData,
  getRouteBackedTabs,
  getSurface,
  readErrorItem,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { wrapFlowSurfacesReadCompatibleAgent } from './flow-surfaces.mock-server';

describe('flowSurfaces API contract builders', () => {
  it('should keep persisted root page builder separate from synthetic tab and popup builders', async () => {
    const persistedPage: any = buildPersistedRootPageModel({
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

describe('flowSurfaces API contract core', () => {
  let context: FlowSurfacesContractContext;
  let app: FlowSurfacesContractContext['app'];
  let db: FlowSurfacesContractContext['db'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let routesRepo: FlowSurfacesContractContext['routesRepo'];
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ app, db, flowRepo, routesRepo, rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
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
    const describeRes = await readerAgent.resource('flowSurfaces').describeSurface({
      values: {
        locator: {
          pageSchemaUid: page.pageSchemaUid,
        },
      },
    });
    expect(describeRes.status).toBe(200);

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

    const deniedApplyBlueprintRes = await readerAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Denied applyBlueprint page',
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
              },
            ],
          },
        ],
      },
    });
    expect(deniedApplyBlueprintRes.status).toBe(403);
    expectStructuredError(readErrorItem(deniedApplyBlueprintRes), {
      status: 403,
      type: 'forbidden',
    });
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

  it('should return structured bad_request errors when flow-surfaces write bodies are not top-level objects', async () => {
    const nullBlueprintRes = await rootAgent
      .post('/flowSurfaces:applyBlueprint')
      .set('Content-Type', 'application/json')
      .send('null');
    expect(nullBlueprintRes.status).toBe(400);
    expectStructuredError(readErrorItem(nullBlueprintRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorItem(nullBlueprintRes).code).toBe('FLOW_SURFACE_BAD_REQUEST');
    expect(readErrorMessage(nullBlueprintRes)).toBe('flowSurfaces applyBlueprint payload must be an object');

    const arrayComposeRes = await rootAgent
      .post('/flowSurfaces:compose')
      .set('Content-Type', 'application/json')
      .send([]);
    expect(arrayComposeRes.status).toBe(400);
    expectStructuredError(readErrorItem(arrayComposeRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorItem(arrayComposeRes).code).toBe('FLOW_SURFACE_BAD_REQUEST');
    expect(readErrorMessage(arrayComposeRes)).toBe('flowSurfaces compose values must be an object');
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

  it('should reject ambiguous duplicate apply matches unless callers provide explicit uid', async () => {
    const page = await createPage(rootAgent, {
      title: 'Duplicate apply matching page',
      tabTitle: 'Duplicate apply matching tab',
    });

    const firstMarkdown = await addBlockData(rootAgent, {
      target: {
        uid: page.gridUid,
      },
      type: 'markdown',
    });
    await addBlockData(rootAgent, {
      target: {
        uid: page.gridUid,
      },
      type: 'markdown',
    });

    const ambiguousApplyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'replace',
        spec: {
          subModels: {
            grid: {
              use: 'BlockGridModel',
              subModels: {
                items: [{ use: 'MarkdownBlockModel' }],
              },
            },
          },
        },
      },
    });
    expect(ambiguousApplyRes.status).toBe(400);
    expect(readErrorMessage(ambiguousApplyRes)).toContain(
      "cannot safely match duplicate 'MarkdownBlockModel' nodes under 'BlockGridModel.items'",
    );

    const explicitApplyRes = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        mode: 'replace',
        spec: {
          subModels: {
            grid: {
              use: 'BlockGridModel',
              subModels: {
                items: [{ uid: firstMarkdown.uid, use: 'MarkdownBlockModel' }],
              },
            },
          },
        },
      },
    });
    expect(explicitApplyRes.status).toBe(200);

    const updatedTab = await getSurface(rootAgent, {
      tabSchemaUid: page.tabSchemaUid,
    });
    expect(_.castArray(updatedTab.tree?.subModels?.grid?.subModels?.items || []).map((item) => item.uid)).toEqual([
      firstMarkdown.uid,
    ]);
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
                  step: 'page',
                  path: 'gridUid',
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
                  step: 'block',
                  path: 'uid',
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
                  step: 'page',
                  path: 'gridUid',
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
              title: 'Legacy $ref contract page',
              tabTitle: 'Legacy $ref contract tab',
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
          expand: ['node.contracts'],
        },
      }),
    );
    expect(mysteryCatalog.node.editableDomains).toEqual([]);
    expect(mysteryCatalog.node.configureOptions).toEqual({});
    expect(mysteryCatalog.node.settingsSchema).toEqual({});
    expect(mysteryCatalog.node.settingsContract).toEqual({});
    expect(mysteryCatalog.actions).toBeUndefined();

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
});
