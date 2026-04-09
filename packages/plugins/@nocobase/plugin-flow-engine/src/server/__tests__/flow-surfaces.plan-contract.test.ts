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
  addBlockData,
  createFlowSurfacesContractContext,
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

describe('flowSurfaces plan contract', () => {
  let context: FlowSurfacesContractContext;
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ flowRepo, rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should execute bootstrap createMenu/createPage steps through executePlan and resolve previous step refs', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        plan: {
          steps: [
            {
              id: 'group',
              action: 'createMenu',
              values: {
                title: 'Bootstrap workspace',
                type: 'group',
              },
            },
            {
              id: 'menu',
              action: 'createMenu',
              values: {
                title: 'Bootstrap employees',
                type: 'item',
                parentMenuRouteId: {
                  step: 'group',
                  path: 'routeId',
                },
              },
            },
            {
              id: 'page',
              action: 'createPage',
              values: {
                menuRouteId: {
                  step: 'menu',
                  path: 'routeId',
                },
                tabTitle: 'Overview',
                enableTabs: true,
              },
            },
            {
              id: 'extraTab',
              action: 'addTab',
              selectors: {
                target: {
                  step: 'page',
                  path: 'pageUid',
                },
              },
              values: {
                title: {
                  step: 'page',
                  path: 'tabSchemaName',
                },
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);

    const executeData = getData(executeRes);
    expect(executeData.surfaceExistsAfterExecute).toBe(true);
    expect(executeData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'group',
          action: 'createMenu',
          payload: expect.objectContaining({
            title: 'Bootstrap workspace',
            type: 'group',
          }),
        }),
        expect.objectContaining({
          id: 'menu',
          action: 'createMenu',
          payload: expect.objectContaining({
            type: 'item',
            parentMenuRouteId: {
              ref: 'group.routeId',
            },
          }),
        }),
        expect.objectContaining({
          id: 'page',
          action: 'createPage',
          payload: expect.objectContaining({
            menuRouteId: {
              ref: 'menu.routeId',
            },
          }),
        }),
        expect.objectContaining({
          id: 'extraTab',
          action: 'addTab',
          payload: expect.objectContaining({
            title: {
              ref: 'page.tabSchemaName',
            },
          }),
        }),
      ]),
    );

    const resultById = Object.fromEntries(
      executeData.results.map((item: Record<string, any>) => [String(item.id || item.index), item.result]),
    );
    expect(resultById.group.routeId).toBeTruthy();
    expect(resultById.menu.parentMenuRouteId).toBe(resultById.group.routeId);
    expect(resultById.page.routeId).toBe(resultById.menu.routeId);
    expect(resultById.extraTab.pageUid).toBe(resultById.page.pageUid);
    expect(executeData.target).toMatchObject({
      locator: {
        pageSchemaUid: resultById.page.pageSchemaUid,
      },
      uid: resultById.page.pageUid,
      kind: 'page',
    });
    expect(executeData.refs.surface.uid).toBe(resultById.page.pageUid);

    const pageSurface = await getSurface(rootAgent, {
      pageSchemaUid: resultById.page.pageSchemaUid,
    });
    const tabs = getRouteBackedTabs(pageSurface);
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.uid).toBe(resultById.page.tabSchemaUid);
    expect(tabs[1]?.uid).toBe(resultById.extraTab.tabSchemaUid);
  });

  it('should execute compose through executePlan runtime dispatch', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute plan compose page',
      tabTitle: 'Execute plan compose tab',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'composeTable',
              action: 'compose',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
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
                ],
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);

    const executeData = getData(executeRes);
    expect(executeData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'composeTable',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: page.tabSchemaUid,
            },
          }),
        }),
      ]),
    );
    expect(executeData.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'composeTable',
          action: 'compose',
          result: expect.objectContaining({
            keyToUid: expect.objectContaining({
              employeesTable: expect.any(String),
            }),
          }),
        }),
      ]),
    );

    const tableUid = executeData.results[0]?.result?.keyToUid?.employeesTable;
    const tableSurface = await getSurface(rootAgent, {
      uid: tableUid,
    });
    expect(tableSurface.tree.use).toBe('TableBlockModel');
    expect(tableSurface.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
  });

  it('should persist only used bindRefs as declared refs and keep metadata hidden from public reads', async () => {
    const page = await createPage(rootAgent, {
      title: 'Ref persistence page',
      tabTitle: 'Ref persistence tab',
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

    const describeRes = await rootAgent.resource('flowSurfaces').describeSurface({
      values: {
        locator: {
          pageSchemaUid: page.pageSchemaUid,
        },
        bindRefs: [
          {
            ref: 'employeesTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
        ],
      },
    });
    expect(describeRes.status).toBe(200);
    const describeData = getData(describeRes);
    expect(describeData.refs.employeesTable.uid).toBe(table.uid);

    const describeWithoutBindRefs = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
      }),
    );
    expect(describeWithoutBindRefs.fingerprint).not.toBe(describeData.fingerprint);

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        bindRefs: [
          {
            ref: 'employeesTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
          {
            ref: 'unusedTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
        ],
        plan: {
          steps: [
            {
              id: 'configureTable',
              action: 'configure',
              selectors: {
                target: {
                  ref: 'employeesTable',
                },
              },
              values: {
                changes: {
                  pageSize: 25,
                },
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);
    expect(executeData.persistedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'employeesTable',
          uid: table.uid,
          persisted: true,
        }),
      ]),
    );
    expect(executeData.persistedRefs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'unusedTable',
        }),
      ]),
    );

    const describedAgain = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
      }),
    );
    expect(describedAgain.refs.employeesTable.uid).toBe(table.uid);
    expect(describedAgain.refs.unusedTable).toBeUndefined();
    const describeWithBindRefAfterPersist = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
          bindRefs: [
            {
              ref: 'employeesTable',
              locator: {
                uid: table.uid,
              },
              expectedKind: 'block',
            },
          ],
        },
      }),
    );
    expect(describeWithBindRefAfterPersist.fingerprint).toBe(describedAgain.fingerprint);

    const publicTableReadback = await getSurface(rootAgent, {
      uid: table.uid,
    });
    expect(publicTableReadback.tree?.stepParams?.__flowSurfaceMeta).toBeUndefined();

    const rawTable = await flowRepo.findModelById(table.uid, {
      includeAsyncNode: true,
    });
    expect(_.get(rawTable, ['stepParams', '__flowSurfaceMeta', 'declaredRef'])).toBe('employeesTable');
  });

  it('should ignore reserved declared refs and persist surface.ref when anchoring a persistable surface', async () => {
    const page = await createPage(rootAgent, {
      title: 'Surface anchor page',
      tabTitle: 'Surface anchor tab',
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

    const rawTableBeforePollution = await flowRepo.findModelById(table.uid, {
      includeAsyncNode: true,
    });
    await flowRepo.patch({
      uid: table.uid,
      stepParams: {
        ...(rawTableBeforePollution?.stepParams || {}),
        __flowSurfaceMeta: {
          declaredRef: 'surface',
        },
      },
    });

    const describedWithReservedDeclaredRef = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
      }),
    );
    expect(describedWithReservedDeclaredRef.refs.surface.uid).toBe(page.pageUid);
    expect(describedWithReservedDeclaredRef.refs.surface.uid).not.toBe(table.uid);

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          ref: 'employeesTable',
        },
        bindRefs: [
          {
            ref: 'employeesTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
        ],
        plan: {
          steps: [
            {
              action: 'configure',
              selectors: {
                target: {
                  ref: 'surface',
                },
              },
              values: {
                changes: {
                  pageSize: 30,
                },
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    expect(getData(executeRes).persistedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'employeesTable',
          uid: table.uid,
          persisted: true,
        }),
      ]),
    );

    const describedAgain = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
      }),
    );
    expect(describedAgain.refs.employeesTable.uid).toBe(table.uid);
  });

  it('should reject reserved or duplicated bindRefs, reject route-backed refs, and report missing after-state when executePlan removes the surface', async () => {
    const page = await createPage(rootAgent, {
      title: 'Ref guard page',
      tabTitle: 'Ref guard tab',
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

    const reservedRefRes = await rootAgent.resource('flowSurfaces').describeSurface({
      values: {
        locator: {
          pageSchemaUid: page.pageSchemaUid,
        },
        bindRefs: [
          {
            ref: 'surface',
            locator: {
              uid: table.uid,
            },
          },
        ],
      },
    });
    expect(reservedRefRes.status).toBe(400);
    expect(readErrorMessage(reservedRefRes)).toContain('reserved');

    const duplicateRefRes = await rootAgent.resource('flowSurfaces').describeSurface({
      values: {
        locator: {
          pageSchemaUid: page.pageSchemaUid,
        },
        bindRefs: [
          {
            ref: 'employeesTable',
            locator: {
              uid: table.uid,
            },
          },
          {
            ref: 'employeesTable',
            locator: {
              uid: table.uid,
            },
          },
        ],
      },
    });
    expect(duplicateRefRes.status).toBe(400);
    expect(readErrorMessage(duplicateRefRes)).toContain('duplicated');

    const validateRouteBackedRefRes = await rootAgent.resource('flowSurfaces').validatePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        bindRefs: [
          {
            ref: 'pageRoot',
            locator: {
              uid: page.pageUid,
            },
            expectedKind: 'page',
          },
        ],
        plan: {
          steps: [
            {
              action: 'addTab',
              selectors: {
                target: {
                  ref: 'pageRoot',
                },
              },
              values: {
                title: 'Should fail',
              },
            },
          ],
        },
      },
    });
    expect(validateRouteBackedRefRes.status).toBe(400);
    expectStructuredError(readErrorItem(validateRouteBackedRefRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorItem(validateRouteBackedRefRes).code).toBe('FLOW_SURFACE_REF_NOT_PERSISTABLE');

    const executeRouteBackedRefRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        bindRefs: [
          {
            ref: 'pageRoot',
            locator: {
              uid: page.pageUid,
            },
            expectedKind: 'page',
          },
        ],
        plan: {
          steps: [
            {
              action: 'addTab',
              selectors: {
                target: {
                  ref: 'pageRoot',
                },
              },
              values: {
                title: 'Should fail',
              },
            },
          ],
        },
      },
    });
    expect(executeRouteBackedRefRes.status).toBe(400);
    expectStructuredError(readErrorItem(executeRouteBackedRefRes), {
      status: 400,
      type: 'bad_request',
    });
    expect(readErrorItem(executeRouteBackedRefRes).code).toBe('FLOW_SURFACE_REF_NOT_PERSISTABLE');

    const destroyPageRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              action: 'destroyPage',
              selectors: {
                target: {
                  locator: {
                    uid: page.pageUid,
                  },
                },
              },
            },
          ],
        },
      },
    });
    expect(destroyPageRes.status).toBe(200);
    expect(getData(destroyPageRes)).toMatchObject({
      surfaceExistsAfterExecute: false,
      refs: {},
    });
  });
});
