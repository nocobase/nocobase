/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { executePlan, validatePlan } from '../flow-surfaces/planning/runtime';

describe('flowSurfaces bootstrap planning', () => {
  function getComposeBlock(result: Record<string, any>, ref: string) {
    const matched = (result?.blocks || []).find((item: any) => item?.ref === ref);
    expect(matched).toBeTruthy();
    return matched;
  }

  function getComposeAction(block: Record<string, any>, scope: 'actions' | 'recordActions', ref: string) {
    const matched = (block?.[scope] || []).find((item: any) => item?.ref === ref);
    expect(matched).toBeTruthy();
    return matched;
  }

  it('should validate bootstrap plan with createMenu/createPage and step refs in selectors and values', async () => {
    const harness = createPlanningHarness();

    const data = await validatePlan(buildBootstrapPlanValues(), harness.deps);

    expect(data.target).toBeNull();
    expect(data.fingerprint).toBeNull();
    expect(data.refs).toEqual({});
    expect(data.compiledSteps).toEqual([
      expect.objectContaining({
        index: 0,
        id: 'group',
        action: 'createMenu',
        payload: expect.objectContaining({
          title: 'Workspace',
          type: 'group',
        }),
      }),
      expect.objectContaining({
        index: 1,
        id: 'menu',
        action: 'createMenu',
        payload: expect.objectContaining({
          title: 'Employees',
          type: 'item',
          parentMenuRouteId: {
            ref: 'group.routeId',
          },
        }),
      }),
      expect.objectContaining({
        index: 2,
        id: 'page',
        action: 'createPage',
        payload: expect.objectContaining({
          menuRouteId: {
            ref: 'menu.routeId',
          },
          tabTitle: 'Overview',
          enableTabs: true,
        }),
      }),
      expect.objectContaining({
        index: 3,
        id: 'extraTab',
        action: 'addTab',
        resolvedSelectors: {
          target: {
            source: 'step',
            step: 'page',
            path: 'pageUid',
          },
        },
        payload: expect.objectContaining({
          target: {
            uid: {
              ref: 'page.pageUid',
            },
          },
          title: {
            ref: 'page.tabSchemaName',
          },
        }),
      }),
      expect.objectContaining({
        index: 4,
        id: 'configureTab',
        action: 'configure',
        resolvedSelectors: {
          target: {
            source: 'step',
            step: 'page',
            path: 'tabSchemaUid',
          },
        },
        payload: expect.objectContaining({
          target: {
            uid: {
              ref: 'page.tabSchemaUid',
            },
          },
          changes: {
            title: 'Overview (planned)',
            documentTitle: {
              ref: 'extraTab.tabSchemaUid',
            },
          },
        }),
      }),
    ]);
  });

  it('should execute bootstrap plan and resolve previous step refs across mutate and plan-only actions', async () => {
    const harness = createPlanningHarness();

    const data = await executePlan(buildBootstrapPlanValues(), harness.deps);

    expect(data.fingerprintBefore).toBeNull();
    expect(data.surfaceExistsAfterExecute).toBe(true);
    expect(data.persistedRefs).toEqual([]);
    expect(data.refs).toMatchObject({
      surface: {
        uid: expect.any(String),
        kind: 'page',
      },
    });

    const resultById = Object.fromEntries(
      data.results.map((item: Record<string, any>) => [String(item.id || item.index), item.result]),
    );
    expect(resultById.group.routeId).toBeTruthy();
    expect(resultById.menu.parentMenuRouteId).toBe(resultById.group.routeId);
    expect(resultById.page.routeId).toBe(resultById.menu.routeId);
    expect(resultById.extraTab.pageUid).toBe(resultById.page.pageUid);
    expect(data.target).toMatchObject({
      locator: {
        pageSchemaUid: resultById.page.pageSchemaUid,
      },
      uid: resultById.page.pageUid,
      kind: 'page',
    });

    const page = harness.state.pagesBySchema.get(resultById.page.pageSchemaUid);
    expect(page).toBeTruthy();
    expect(page.enableTabs).toBe(true);
    expect(page.parentMenuRouteId).toBe(resultById.group.routeId);
    expect(page.tabs).toHaveLength(2);
    expect(page.tabs[0]).toMatchObject({
      uid: resultById.page.tabSchemaUid,
      title: 'Overview (planned)',
      documentTitle: resultById.extraTab.tabSchemaUid,
      hidden: false,
    });
    expect(page.tabs[1]).toMatchObject({
      uid: resultById.extraTab.tabSchemaUid,
      title: resultById.page.tabSchemaName,
      hidden: false,
    });
  });

  it('should resolve nested compose created refs across one bootstrap executePlan', async () => {
    const harness = createPlanningHarness();

    const data = await executePlan(
      {
        plan: {
          steps: [
            {
              id: 'group',
              action: 'createMenu',
              values: {
                title: 'Workspace',
                type: 'group',
              },
            },
            {
              id: 'menu',
              action: 'createMenu',
              values: {
                title: 'Users',
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
                ref: 'usersPage',
                title: 'Users page',
                tabTitle: 'Overview',
              },
            },
            {
              id: 'composeMain',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'usersPage.tab',
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    ref: 'usersTable',
                    type: 'table',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'users',
                    },
                    fields: [
                      { ref: 'usersTable.username', fieldPath: 'username' },
                      { ref: 'usersTable.nickname', fieldPath: 'nickname' },
                    ],
                    recordActions: [{ ref: 'usersTable.viewUser', type: 'view' }],
                  },
                ],
              },
            },
            {
              id: 'composeUserPopup',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'usersTable.viewUser.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'userDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    recordActions: [{ ref: 'userDetails.editUser', type: 'edit' }],
                  },
                ],
              },
            },
            {
              id: 'composeEditPopup',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'userDetails.editUser.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'userEditForm',
                    type: 'editForm',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [{ ref: 'userEditForm.username', fieldPath: 'username' }],
                    actions: [{ ref: 'userEditForm.submit', type: 'submit' }],
                  },
                ],
              },
            },
          ],
        },
      },
      harness.deps,
    );

    expect(data.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'composeUserPopup',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                ref: 'usersTable.viewUser.popupGrid',
              },
            },
          }),
        }),
        expect.objectContaining({
          id: 'composeEditPopup',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                ref: 'userDetails.editUser.popupGrid',
              },
            },
          }),
        }),
      ]),
    );

    const resultById = Object.fromEntries(
      data.results.map((item: Record<string, any>) => [String(item.id || item.index), item.result]),
    );
    const usersTable = getComposeBlock(resultById.composeMain, 'usersTable');
    const viewUser = getComposeAction(usersTable, 'recordActions', 'usersTable.viewUser');
    expect(viewUser.popupGridUid).toBeTruthy();
    expect(resultById.composeUserPopup.target.uid).toBe(viewUser.popupGridUid);
    const userDetails = getComposeBlock(resultById.composeUserPopup, 'userDetails');
    const editUser = getComposeAction(userDetails, 'recordActions', 'userDetails.editUser');
    expect(editUser.popupGridUid).toBeTruthy();
    expect(resultById.composeEditPopup.target.uid).toBe(editUser.popupGridUid);
    const userEditForm = getComposeBlock(resultById.composeEditPopup, 'userEditForm');
    expect(getComposeAction(userEditForm, 'actions', 'userEditForm.submit').uid).toBeTruthy();
    expect(data.target).toMatchObject({
      locator: {
        pageSchemaUid: resultById.page.pageSchemaUid,
      },
      uid: resultById.page.pageUid,
      kind: 'page',
    });
  });

  it('should allow empty bindRefs and empty expectedFingerprint in bootstrap mode, but reject non-empty bindRefs', async () => {
    const harness = createPlanningHarness();

    await expect(
      validatePlan(
        {
          bindRefs: [],
          expectedFingerprint: '',
          plan: {
            steps: [
              {
                id: 'group',
                action: 'createMenu',
                values: {
                  title: 'Empty bootstrap workspace',
                  type: 'group',
                },
              },
            ],
          },
        },
        harness.deps,
      ),
    ).resolves.toMatchObject({
      target: null,
      fingerprint: null,
    });

    await expect(
      validatePlan(
        {
          bindRefs: [
            {
              ref: 'menuRoot',
              locator: {
                uid: 'missing',
              },
            },
          ],
          plan: {
            steps: [
              {
                id: 'group',
                action: 'createMenu',
                values: {
                  title: 'Invalid bootstrap workspace',
                  type: 'group',
                },
              },
            ],
          },
        },
        harness.deps,
      ),
    ).rejects.toThrow('bindRefs require surface');
  });

  it('should keep validatePlan fail-fast shape by default and only call collect issues hook when opted in', async () => {
    const harness = createPlanningHarness();
    let collectCalls = 0;
    harness.deps.collectValidatePlanIssues = async () => {
      collectCalls += 1;
      return {
        ok: true,
        fieldIssues: [],
      };
    };

    const defaultData = await validatePlan(buildBootstrapPlanValues(), harness.deps);
    expect(defaultData.validation).toBeUndefined();
    expect(collectCalls).toBe(0);

    const collectedData = await validatePlan(
      {
        ...buildBootstrapPlanValues(),
        validation: {
          collectFieldIssues: true,
        },
      },
      harness.deps,
    );
    expect(collectCalls).toBe(1);
    expect(collectedData.validation).toEqual({
      ok: true,
      fieldIssues: [],
    });
  });

  it('should reject selector and value step refs that do not point to previous step ids', async () => {
    const harness = createPlanningHarness();

    await expect(
      validatePlan(
        {
          plan: {
            steps: [
              {
                id: 'configureTab',
                action: 'configure',
                selectors: {
                  target: {
                    step: 'page',
                    path: 'tabSchemaUid',
                  },
                },
                values: {
                  changes: {
                    title: 'Should fail',
                  },
                },
              },
              {
                id: 'page',
                action: 'createPage',
                values: {
                  title: 'Late page',
                  tabTitle: 'Late tab',
                },
              },
            ],
          },
        },
        harness.deps,
      ),
    ).rejects.toThrow(`selectors.target.step 'page' is not a previous step id`);

    await expect(
      validatePlan(
        {
          plan: {
            steps: [
              {
                id: 'group',
                action: 'createMenu',
                values: {
                  title: 'Group',
                  type: 'group',
                },
              },
              {
                id: 'menu',
                action: 'createMenu',
                values: {
                  title: 'Item',
                  type: 'item',
                  parentMenuRouteId: {
                    step: 'page',
                    path: 'routeId',
                  },
                },
              },
              {
                id: 'page',
                action: 'createPage',
                values: {
                  title: 'Page',
                  tabTitle: 'Tab',
                },
              },
            ],
          },
        },
        harness.deps,
      ),
    ).rejects.toThrow(`values.parentMenuRouteId.step 'page' is not a previous step id`);
  });
});

function buildBootstrapPlanValues() {
  return {
    bindRefs: [],
    expectedFingerprint: '',
    plan: {
      steps: [
        {
          id: 'group',
          action: 'createMenu',
          values: {
            title: 'Workspace',
            type: 'group',
          },
        },
        {
          id: 'menu',
          action: 'createMenu',
          values: {
            title: 'Employees',
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
        {
          id: 'configureTab',
          action: 'configure',
          selectors: {
            target: {
              step: 'page',
              path: 'tabSchemaUid',
            },
          },
          values: {
            changes: {
              title: 'Overview (planned)',
              documentTitle: {
                step: 'extraTab',
                path: 'tabSchemaUid',
              },
            },
          },
        },
      ],
    },
  };
}

function createPlanningHarness() {
  const state = {
    routeSeq: 1000,
    tabRouteSeq: 2000,
    pageSeq: 1,
    tabSeq: 1,
    gridSeq: 1,
    blockSeq: 1,
    actionSeq: 1,
    popupGridSeq: 1,
    tabNameSeq: 1,
    menusByRouteId: new Map<number, any>(),
    pagesBySchema: new Map<string, any>(),
    pagesByUid: new Map<string, any>(),
    pageByTabUid: new Map<string, any>(),
  };

  const buildPageReadTree = (page: any) => ({
    uid: page.pageUid,
    use: 'RootPageModel',
    props: {
      title: page.title,
      enableTabs: page.enableTabs,
      displayTitle: true,
    },
    stepParams: {
      pageSettings: {
        general: {
          title: page.title,
          enableTabs: page.enableTabs,
          displayTitle: true,
        },
      },
    },
    subModels: {
      tabs: page.tabs.map((tab: any) => ({
        uid: tab.uid,
        use: 'RootPageTabModel',
        props: {
          title: tab.title,
        },
        stepParams: {
          pageTabSettings: {
            tab: {
              title: tab.title,
              documentTitle: tab.documentTitle,
            },
          },
        },
        subModels: {
          grid: {
            uid: tab.gridUid,
            use: 'BlockGridModel',
          },
        },
      })),
    },
  });

  const syncPageIndexes = (page: any) => {
    state.pagesBySchema.set(page.pageSchemaUid, page);
    state.pagesByUid.set(page.pageUid, page);
    for (const tab of page.tabs) {
      state.pageByTabUid.set(tab.uid, page);
    }
  };

  const createPlaceholderMenuItem = (values: Record<string, any>) => {
    const routeId = state.routeSeq++;
    const pageSchemaUid = values.pageSchemaUid || `page_schema_${state.pageSeq++}`;
    const pageUid = values.pageUid || `page_${state.pageSeq++}`;
    const tabSchemaUid = values.tabSchemaUid || `tab_schema_${state.tabSeq++}`;
    const tabSchemaName = values.tabSchemaName || `tab_schema_name_${state.tabNameSeq++}`;
    const gridUid = `grid_${state.gridSeq++}`;
    const tabRouteId = state.tabRouteSeq++;
    const menu = {
      routeId,
      type: 'flowPage',
      parentMenuRouteId: values.parentMenuRouteId ?? null,
      title: values.title || pageSchemaUid,
      pageSchemaUid,
      pageUid,
      initialized: false,
      tabs: [
        {
          uid: tabSchemaUid,
          title: values.tabTitle || 'Untitled',
          documentTitle: values.tabDocumentTitle,
          tabSchemaName,
          gridUid,
          tabRouteId,
          hidden: true,
        },
      ],
    };
    state.menusByRouteId.set(routeId, menu);
    syncPageIndexes({
      routeId,
      parentMenuRouteId: menu.parentMenuRouteId,
      title: menu.title,
      pageSchemaUid,
      pageUid,
      enableTabs: false,
      initialized: false,
      tabs: menu.tabs,
    });
    return menu;
  };

  const createMenu = (values: Record<string, any>) => {
    if (values.type === 'group') {
      const result = {
        routeId: state.routeSeq++,
        type: 'group',
        parentMenuRouteId: values.parentMenuRouteId ?? null,
      };
      state.menusByRouteId.set(result.routeId, {
        ...result,
        title: values.title,
      });
      return result;
    }

    const menu = createPlaceholderMenuItem(values);
    return {
      routeId: menu.routeId,
      type: menu.type,
      parentMenuRouteId: menu.parentMenuRouteId,
      pageSchemaUid: menu.pageSchemaUid,
      pageUid: menu.pageUid,
      tabRouteId: menu.tabs[0].tabRouteId,
      tabSchemaUid: menu.tabs[0].uid,
      tabSchemaName: menu.tabs[0].tabSchemaName,
    };
  };

  const createPage = (values: Record<string, any>) => {
    if (values.menuRouteId) {
      const menu = state.menusByRouteId.get(Number(values.menuRouteId));
      if (!menu) {
        throw new Error(`menu '${values.menuRouteId}' not found`);
      }
      const page = state.pagesBySchema.get(menu.pageSchemaUid);
      page.initialized = true;
      page.enableTabs = !!values.enableTabs;
      page.title = values.title || page.title;
      page.tabs[0].title = values.tabTitle || page.tabs[0].title;
      page.tabs[0].documentTitle = values.tabDocumentTitle ?? page.tabs[0].documentTitle;
      page.tabs[0].hidden = !page.enableTabs;
      menu.initialized = true;
      menu.tabs = page.tabs;
      syncPageIndexes(page);
      return {
        routeId: page.routeId,
        parentMenuRouteId: page.parentMenuRouteId,
        pageSchemaUid: page.pageSchemaUid,
        pageUid: page.pageUid,
        tabSchemaUid: page.tabs[0].uid,
        tabRouteId: page.tabs[0].tabRouteId,
        tabSchemaName: page.tabs[0].tabSchemaName,
        gridUid: page.tabs[0].gridUid,
      };
    }

    const menu = createPlaceholderMenuItem(values);
    return createPage({
      ...values,
      menuRouteId: menu.routeId,
    });
  };

  const addTab = (values: Record<string, any>) => {
    const page = state.pagesByUid.get(values.target.uid);
    if (!page) {
      throw new Error(`page '${values.target.uid}' not found`);
    }
    const tab = {
      uid: values.tabSchemaUid || `tab_schema_${state.tabSeq++}`,
      title: values.title || 'Untitled',
      documentTitle: values.documentTitle,
      tabSchemaName: values.tabSchemaName || `tab_schema_name_${state.tabNameSeq++}`,
      gridUid: `grid_${state.gridSeq++}`,
      tabRouteId: state.tabRouteSeq++,
      hidden: !page.enableTabs,
    };
    page.tabs.push(tab);
    syncPageIndexes(page);
    return {
      pageUid: page.pageUid,
      tabSchemaUid: tab.uid,
      tabRouteId: tab.tabRouteId,
      tabSchemaName: tab.tabSchemaName,
      gridUid: tab.gridUid,
    };
  };

  const configure = (values: Record<string, any>) => {
    const page = state.pageByTabUid.get(values.target.uid);
    if (!page) {
      throw new Error(`tab '${values.target.uid}' not found`);
    }
    const tab = page.tabs.find((item: any) => item.uid === values.target.uid);
    if (!tab) {
      throw new Error(`tab '${values.target.uid}' not found`);
    }
    if (Object.prototype.hasOwnProperty.call(values.changes || {}, 'title')) {
      tab.title = values.changes.title;
    }
    if (Object.prototype.hasOwnProperty.call(values.changes || {}, 'documentTitle')) {
      tab.documentTitle = values.changes.documentTitle;
    }
    syncPageIndexes(page);
    return {
      uid: tab.uid,
      changes: {
        ...values.changes,
      },
    };
  };

  const compose = (values: Record<string, any>) => {
    const blocks = (values.blocks || []).map((block: any, blockIndex: number) => {
      const fields = (block.fields || []).map((field: any, fieldIndex: number) => {
        const normalized =
          typeof field === 'string'
            ? {
                ref: field,
                fieldPath: field,
              }
            : {
                ref: field.ref || field.fieldPath || `field_${blockIndex + 1}_${fieldIndex + 1}`,
                fieldPath: field.fieldPath,
              };
        const uid = `field_${state.blockSeq}_${fieldIndex + 1}`;
        return {
          ...normalized,
          uid,
          wrapperUid: `${uid}_wrapper`,
          fieldUid: `${uid}_inner`,
        };
      });
      const actions = (block.actions || []).map((action: any, actionIndex: number) => {
        const normalized =
          typeof action === 'string'
            ? {
                ref: action,
                type: action,
              }
            : {
                ref: action.ref || action.type || `action_${blockIndex + 1}_${actionIndex + 1}`,
                type: action.type,
              };
        return {
          ...normalized,
          uid: `action_${state.actionSeq++}`,
          popupGridUid: `popup_grid_${state.popupGridSeq++}`,
        };
      });
      const recordActions = (block.recordActions || []).map((action: any, actionIndex: number) => {
        const normalized =
          typeof action === 'string'
            ? {
                ref: action,
                type: action,
              }
            : {
                ref: action.ref || action.type || `record_action_${blockIndex + 1}_${actionIndex + 1}`,
                type: action.type,
              };
        return {
          ...normalized,
          uid: `record_action_${state.actionSeq++}`,
          popupGridUid: `popup_grid_${state.popupGridSeq++}`,
        };
      });
      const blockUid = `block_${state.blockSeq++}`;
      const result = {
        ref: block.ref,
        type: block.type,
        uid: blockUid,
        fields,
        actions,
        recordActions,
      };
      return result;
    });

    return {
      target: {
        uid: values.target.uid,
      },
      mode: values.mode || 'append',
      blocks,
      ...(values.layout
        ? {
            layout: {
              ok: true,
              ...values.layout,
            },
          }
        : {}),
    };
  };

  const deps: any = {
    normalizeGetTarget: (value: any) => value,
    resolveLocator: async (target: any) => {
      if (target?.pageSchemaUid) {
        const page = state.pagesBySchema.get(target.pageSchemaUid);
        if (!page) {
          const error: any = new Error(`missing page '${target.pageSchemaUid}'`);
          error.code = 'MISSING';
          throw error;
        }
        return {
          target,
          uid: page.pageUid,
          kind: 'page',
        };
      }
      if (target?.uid && state.pagesByUid.has(target.uid)) {
        return {
          target,
          uid: target.uid,
          kind: 'page',
        };
      }
      if (target?.uid && state.pageByTabUid.has(target.uid)) {
        return {
          target,
          uid: target.uid,
          kind: 'tab',
        };
      }
      const error: any = new Error(`missing target '${target?.uid || target?.pageSchemaUid || 'unknown'}'`);
      error.code = 'MISSING';
      throw error;
    },
    loadResolvedSurfaceTree: async (resolved: any) => {
      const page =
        state.pagesByUid.get(resolved.uid) ||
        state.pageByTabUid.get(resolved.uid) ||
        Array.from(state.pagesBySchema.values()).find((item) => item.pageUid === resolved.uid);
      if (!page) {
        const error: any = new Error(`missing surface '${resolved.uid}'`);
        error.code = 'MISSING';
        throw error;
      }
      return buildPageReadTree(page);
    },
    stripInternalSurfaceMetaFromNodeTree: <T>(node: T) => node,
    buildReadTargetSummary: (target: any, resolved: any) => ({
      locator: target,
      uid: resolved.uid,
      kind: resolved.kind,
    }),
    buildSurfaceContextFingerprint: ({ surfaceResolved, refMap }: any) =>
      `fp:${surfaceResolved?.uid || 'none'}:${refMap.size}`,
    buildSurfaceReadPayload: async (target: any, resolved: any, node: any) => ({
      target: {
        locator: target,
        uid: resolved.uid,
        kind: resolved.kind,
      },
      tree: node,
    }),
    assertRequestRefsPersistable: async () => undefined,
    persistDeclaredRefForNode: async (refInfo: any) => ({
      ref: refInfo.ref,
      uid: refInfo.uid,
      persisted: true,
    }),
    dispatchPlanOnlyAction: async (action: string, payload: Record<string, any>) => {
      if (action === 'configure') {
        return configure(payload);
      }
      if (action === 'compose') {
        return compose(payload);
      }
      throw new Error(`unsupported plan-only action '${action}'`);
    },
    dispatchOp: async (op: any, resolvedValues: Record<string, any>) => {
      switch (op.type) {
        case 'createMenu':
          return createMenu(resolvedValues);
        case 'createPage':
          return createPage(resolvedValues);
        case 'addTab':
          return addTab(resolvedValues);
        default:
          throw new Error(`unsupported mutate action '${op.type}'`);
      }
    },
    isSurfaceReadbackMissingError: (error: any) => error?.code === 'MISSING',
  };

  return {
    state,
    deps,
  };
}
