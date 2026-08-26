/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createFlowSurfacesContractContext,
  destroyFlowSurfacesContractContext,
  getData,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';
import { compilePlanStep } from '../flow-surfaces/planning/compiler';
import { FLOW_SURFACE_DECLARED_KEY_KEY, FLOW_SURFACE_INTERNAL_META_KEY } from '../flow-surfaces/planning/key-registry';

function declaredKeyParams(key: string) {
  return {
    [FLOW_SURFACE_INTERNAL_META_KEY]: {
      [FLOW_SURFACE_DECLARED_KEY_KEY]: key,
    },
  };
}

function collectDescendantNodes(node: any, predicate: (item: any) => boolean, carry: any[] = []) {
  if (!node || typeof node !== 'object') {
    return carry;
  }
  if (predicate(node)) {
    carry.push(node);
  }
  for (const value of Object.values(node.subModels || {})) {
    for (const child of Array.isArray(value) ? value : [value]) {
      collectDescendantNodes(child, predicate, carry);
    }
  }
  return carry;
}

function buildStableKeyBlueprint(title: string, fields: string[], extraRecordActions: any[] = []) {
  return {
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
        key: 'overviewTab',
        title: 'Overview',
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            collection: 'employees',
            fields,
            actions: [{ key: 'addEmployee', type: 'addNew' }],
            recordActions: [{ key: 'editEmployee', type: 'edit' }, ...extraRecordActions],
          },
        ],
      },
    ],
  };
}

describe('flowSurfaces applyBlueprint replace stable keys', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      plugins: FLOW_SURFACES_TEST_PLUGIN_INSTALLS as any,
      enabledPluginAliases: FLOW_SURFACES_TEST_PLUGINS,
    });
    rootAgent = context.rootAgent;
  });

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should allow repeated replace blueprints to redeclare keys inside the target tab subtree', async () => {
    const unique = Date.now();
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        ...buildStableKeyBlueprint(`Stable key replace create ${unique}`, ['nickname', 'email']),
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid;

    const replaceValues = {
      mode: 'replace',
      target: {
        pageSchemaUid,
      },
      ...buildStableKeyBlueprint(
        `Stable key replace update ${unique}`,
        ['nickname', 'email', 'phone'],
        [{ key: 'viewEmployee', type: 'view' }],
      ),
      navigation: undefined,
    };

    const firstReplaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: replaceValues,
    });
    expect(firstReplaceRes.status, readErrorMessage(firstReplaceRes)).toBe(200);

    const secondReplaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: replaceValues,
    });
    expect(secondReplaceRes.status, readErrorMessage(secondReplaceRes)).toBe(200);

    const readback = getData(secondReplaceRes);
    const tableBlock = collectDescendantNodes(readback.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    expect(tableBlock?.uid).toBeTruthy();
    const describeRes = await rootAgent.resource('flowSurfaces').describeSurface({
      values: {
        locator: {
          pageSchemaUid,
        },
      },
    });
    expect(describeRes.status, readErrorMessage(describeRes)).toBe(200);
    const keys = getData(describeRes).keys;
    expect(keys?.['overviewTab.employeesTable']?.uid).toBe(tableBlock.uid);
    expect(keys?.['overviewTab.employeesTable.viewEmployee']?.uid).toBeTruthy();
    expect(
      collectDescendantNodes(
        tableBlock,
        (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'phone' || item?.key === 'phone',
      ).length,
    ).toBeGreaterThan(0);
  });

  it('should keep duplicate and out-of-scope key conflicts blocking in replace mode', async () => {
    const unique = Date.now();
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Stable key conflict create ${unique}`,
          },
        },
        page: {
          title: `Stable key conflict create ${unique}`,
          enableTabs: true,
        },
        tabs: [
          {
            key: 'firstTab',
            title: 'First',
            blocks: [{ key: 'firstBlock', type: 'markdown', settings: { content: 'First' } }],
          },
          {
            key: 'secondTab',
            title: 'Second',
            blocks: [{ key: 'outsideBlock', type: 'markdown', settings: { content: 'Second' } }],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid;

    const duplicateRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'replace',
        target: { pageSchemaUid },
        page: {
          title: `Stable key duplicate replace ${unique}`,
        },
        tabs: [
          {
            key: 'firstTab',
            title: 'First',
            blocks: [
              { key: 'dupBlock', type: 'markdown', settings: { content: 'A' } },
              { key: 'dupBlock', type: 'markdown', settings: { content: 'B' } },
            ],
          },
        ],
      },
    });
    expect(duplicateRes.status).toBe(400);
    expect(readErrorMessage(duplicateRes)).toContain("key 'dupBlock' is duplicated");
  });
});

describe('flowSurfaces applyBlueprint replace key planning', () => {
  it('should reject replace created keys that already exist outside the target subtree', async () => {
    const context = {
      surfaceResolved: {
        uid: 'page-1',
        kind: 'page',
      },
      publicTree: {
        uid: 'page-1',
        use: 'RootPageModel',
        subModels: {
          tabs: [
            {
              uid: 'tab-1',
              use: 'RootPageTabModel',
              subModels: {
                grid: {
                  uid: 'grid-1',
                  use: 'BlockGridModel',
                  subModels: {
                    items: [
                      {
                        uid: 'old-block-1',
                        use: 'MarkdownBlockModel',
                        stepParams: declaredKeyParams('introBlock'),
                      },
                    ],
                  },
                },
              },
            },
            {
              uid: 'tab-2',
              use: 'RootPageTabModel',
              subModels: {
                grid: {
                  uid: 'grid-2',
                  use: 'BlockGridModel',
                  subModels: {
                    items: [
                      {
                        uid: 'old-block-2',
                        use: 'MarkdownBlockModel',
                        stepParams: declaredKeyParams('outsideBlock'),
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      publicNodeMap: {
        'tab-1': {
          uid: 'tab-1',
          use: 'RootPageTabModel',
          subModels: {
            grid: {
              uid: 'grid-1',
              use: 'BlockGridModel',
              subModels: {
                items: [
                  {
                    uid: 'old-block-1',
                    use: 'MarkdownBlockModel',
                    stepParams: declaredKeyParams('introBlock'),
                  },
                ],
              },
            },
          },
        },
        'grid-1': {
          uid: 'grid-1',
          use: 'BlockGridModel',
          subModels: {
            items: [
              {
                uid: 'old-block-1',
                use: 'MarkdownBlockModel',
                stepParams: declaredKeyParams('introBlock'),
              },
            ],
          },
        },
        'old-block-1': {
          uid: 'old-block-1',
          use: 'MarkdownBlockModel',
          stepParams: declaredKeyParams('introBlock'),
        },
        'tab-2': {
          uid: 'tab-2',
          use: 'RootPageTabModel',
          subModels: {
            grid: {
              uid: 'grid-2',
              use: 'BlockGridModel',
              subModels: {
                items: [
                  {
                    uid: 'old-block-2',
                    use: 'MarkdownBlockModel',
                    stepParams: declaredKeyParams('outsideBlock'),
                  },
                ],
              },
            },
          },
        },
        'grid-2': {
          uid: 'grid-2',
          use: 'BlockGridModel',
          subModels: {
            items: [
              {
                uid: 'old-block-2',
                use: 'MarkdownBlockModel',
                stepParams: declaredKeyParams('outsideBlock'),
              },
            ],
          },
        },
        'old-block-2': {
          uid: 'old-block-2',
          use: 'MarkdownBlockModel',
          stepParams: declaredKeyParams('outsideBlock'),
        },
      },
      targetSummary: null,
      fingerprint: null,
      uidSet: new Set(['page-1', 'tab-1', 'grid-1', 'old-block-1', 'tab-2', 'grid-2', 'old-block-2']),
      keyMap: new Map([
        [
          'introBlock',
          {
            key: 'introBlock',
            uid: 'old-block-1',
            source: 'declared',
            kind: 'block',
            locator: { uid: 'old-block-1' },
          },
        ],
        [
          'outsideBlock',
          {
            key: 'outsideBlock',
            uid: 'old-block-2',
            source: 'declared',
            kind: 'block',
            locator: { uid: 'old-block-2' },
          },
        ],
      ]),
      requestKeyMap: new Map(),
    } as any;

    await expect(
      compilePlanStep(
        'applyBlueprint',
        {
          id: 'replaceIntro',
          action: 'compose',
          selectors: {
            target: {
              locator: { uid: 'tab-1' },
            },
          },
          values: {
            mode: 'replace',
            blocks: [
              {
                key: 'outsideBlock',
                type: 'markdown',
              },
            ],
          },
        },
        0,
        context,
        {
          normalizeGetTarget: (value) => value,
          resolveLocator: async (target) => ({
            uid: target.uid,
            kind: target.uid === 'tab-1' ? 'tab' : 'node',
          }),
          buildPlanKeyKind: (_node, resolvedKind) => resolvedKind || 'node',
        },
        new Set(),
        new Set(),
      ),
    ).rejects.toThrow("key 'outsideBlock' is already defined");
  });

  it('should reject replace created keys that collide with preserved target containers', async () => {
    const context = {
      surfaceResolved: {
        uid: 'page-1',
        kind: 'page',
      },
      publicTree: {
        uid: 'page-1',
        use: 'RootPageModel',
        subModels: {
          tabs: [
            {
              uid: 'tab-1',
              use: 'RootPageTabModel',
              subModels: {
                grid: {
                  uid: 'grid-1',
                  use: 'BlockGridModel',
                  stepParams: declaredKeyParams('tabGrid'),
                  subModels: {
                    items: [
                      {
                        uid: 'old-block-1',
                        use: 'MarkdownBlockModel',
                        stepParams: declaredKeyParams('introBlock'),
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      publicNodeMap: {
        'tab-1': {
          uid: 'tab-1',
          use: 'RootPageTabModel',
        },
        'grid-1': {
          uid: 'grid-1',
          use: 'BlockGridModel',
          stepParams: declaredKeyParams('tabGrid'),
        },
        'old-block-1': {
          uid: 'old-block-1',
          use: 'MarkdownBlockModel',
          stepParams: declaredKeyParams('introBlock'),
        },
      },
      targetSummary: null,
      fingerprint: null,
      uidSet: new Set(['page-1', 'tab-1', 'grid-1', 'old-block-1']),
      keyMap: new Map([
        [
          'tabGrid',
          {
            key: 'tabGrid',
            uid: 'grid-1',
            source: 'declared',
            kind: 'grid',
            locator: { uid: 'grid-1' },
          },
        ],
        [
          'introBlock',
          {
            key: 'introBlock',
            uid: 'old-block-1',
            source: 'declared',
            kind: 'block',
            locator: { uid: 'old-block-1' },
          },
        ],
      ]),
      requestKeyMap: new Map(),
    } as any;

    await expect(
      compilePlanStep(
        'applyBlueprint',
        {
          id: 'replaceIntro',
          action: 'compose',
          selectors: {
            target: {
              locator: { uid: 'tab-1' },
            },
          },
          values: {
            mode: 'replace',
            blocks: [
              {
                key: 'tabGrid',
                type: 'markdown',
              },
            ],
          },
        },
        0,
        context,
        {
          normalizeGetTarget: (value) => value,
          resolveLocator: async (target) => ({
            uid: target.uid,
            kind: target.uid === 'tab-1' ? 'tab' : 'node',
          }),
          buildPlanKeyKind: (_node, resolvedKind) => resolvedKind || 'node',
        },
        new Set(),
        new Set(),
      ),
    ).rejects.toThrow("key 'tabGrid' is already defined");
  });

  it('should reject same-step key links that would otherwise resolve to the old replace subtree node', async () => {
    const context = {
      surfaceResolved: {
        uid: 'page-1',
        kind: 'page',
      },
      publicTree: {
        uid: 'page-1',
        use: 'RootPageModel',
        subModels: {
          tabs: [
            {
              uid: 'tab-1',
              use: 'RootPageTabModel',
              subModels: {
                grid: {
                  uid: 'grid-1',
                  use: 'BlockGridModel',
                  subModels: {
                    items: [
                      {
                        uid: 'old-block-1',
                        use: 'MarkdownBlockModel',
                        stepParams: declaredKeyParams('introBlock'),
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      publicNodeMap: {
        'tab-1': {
          uid: 'tab-1',
          use: 'RootPageTabModel',
          subModels: {
            grid: {
              uid: 'grid-1',
              use: 'BlockGridModel',
              subModels: {
                items: [
                  {
                    uid: 'old-block-1',
                    use: 'MarkdownBlockModel',
                    stepParams: declaredKeyParams('introBlock'),
                  },
                ],
              },
            },
          },
        },
        'grid-1': {
          uid: 'grid-1',
          use: 'BlockGridModel',
          subModels: {
            items: [
              {
                uid: 'old-block-1',
                use: 'MarkdownBlockModel',
                stepParams: declaredKeyParams('introBlock'),
              },
            ],
          },
        },
        'old-block-1': {
          uid: 'old-block-1',
          use: 'MarkdownBlockModel',
          stepParams: declaredKeyParams('introBlock'),
        },
      },
      targetSummary: null,
      fingerprint: null,
      uidSet: new Set(['page-1', 'tab-1', 'grid-1', 'old-block-1']),
      keyMap: new Map([
        [
          'introBlock',
          {
            key: 'introBlock',
            uid: 'old-block-1',
            source: 'declared',
            kind: 'block',
            locator: { uid: 'old-block-1' },
          },
        ],
      ]),
      requestKeyMap: new Map(),
    } as any;

    await expect(
      compilePlanStep(
        'applyBlueprint',
        {
          id: 'replaceIntro',
          action: 'compose',
          selectors: {
            target: {
              locator: { uid: 'tab-1' },
            },
          },
          values: {
            mode: 'replace',
            blocks: [
              {
                key: 'introBlock',
                type: 'markdown',
                settings: {
                  relatedBlock: {
                    key: 'introBlock',
                  },
                },
              },
            ],
          },
        },
        0,
        context,
        {
          normalizeGetTarget: (value) => value,
          resolveLocator: async (target) => ({
            uid: target.uid,
            kind: target.uid === 'tab-1' ? 'tab' : 'node',
          }),
          buildPlanKeyKind: (_node, resolvedKind) => resolvedKind || 'node',
        },
        new Set(),
        new Set(),
      ),
    ).rejects.toThrow("key 'introBlock' belongs to the current replace scope");
  });

  it('should reject key links to old replace subtree nodes even when they are not recreated', async () => {
    const context = {
      surfaceResolved: {
        uid: 'page-1',
        kind: 'page',
      },
      publicTree: {
        uid: 'page-1',
        use: 'RootPageModel',
        subModels: {
          tabs: [
            {
              uid: 'tab-1',
              use: 'RootPageTabModel',
              subModels: {
                grid: {
                  uid: 'grid-1',
                  use: 'BlockGridModel',
                  subModels: {
                    items: [
                      {
                        uid: 'old-block-1',
                        use: 'MarkdownBlockModel',
                        stepParams: declaredKeyParams('introBlock'),
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      publicNodeMap: {
        'tab-1': {
          uid: 'tab-1',
          use: 'RootPageTabModel',
          subModels: {
            grid: {
              uid: 'grid-1',
              use: 'BlockGridModel',
              subModels: {
                items: [
                  {
                    uid: 'old-block-1',
                    use: 'MarkdownBlockModel',
                    stepParams: declaredKeyParams('introBlock'),
                  },
                ],
              },
            },
          },
        },
        'grid-1': {
          uid: 'grid-1',
          use: 'BlockGridModel',
          subModels: {
            items: [
              {
                uid: 'old-block-1',
                use: 'MarkdownBlockModel',
                stepParams: declaredKeyParams('introBlock'),
              },
            ],
          },
        },
        'old-block-1': {
          uid: 'old-block-1',
          use: 'MarkdownBlockModel',
          stepParams: declaredKeyParams('introBlock'),
        },
      },
      targetSummary: null,
      fingerprint: null,
      uidSet: new Set(['page-1', 'tab-1', 'grid-1', 'old-block-1']),
      keyMap: new Map([
        [
          'introBlock',
          {
            key: 'introBlock',
            uid: 'old-block-1',
            source: 'declared',
            kind: 'block',
            locator: { uid: 'old-block-1' },
          },
        ],
      ]),
      requestKeyMap: new Map(),
    } as any;

    await expect(
      compilePlanStep(
        'applyBlueprint',
        {
          id: 'replaceIntro',
          action: 'compose',
          selectors: {
            target: {
              locator: { uid: 'tab-1' },
            },
          },
          values: {
            mode: 'replace',
            blocks: [
              {
                key: 'replacementBlock',
                type: 'markdown',
                settings: {
                  relatedBlock: {
                    key: 'introBlock',
                  },
                },
              },
            ],
          },
        },
        0,
        context,
        {
          normalizeGetTarget: (value) => value,
          resolveLocator: async (target) => ({
            uid: target.uid,
            kind: target.uid === 'tab-1' ? 'tab' : 'node',
          }),
          buildPlanKeyKind: (_node, resolvedKind) => resolvedKind || 'node',
        },
        new Set(),
        new Set(),
      ),
    ).rejects.toThrow("key 'introBlock' belongs to the current replace scope");
  });

  it('should reject replace compose step targets before old subtree keys can be shadowed', async () => {
    const context = {
      surfaceResolved: {
        uid: 'page-1',
        kind: 'page',
      },
      publicTree: {
        uid: 'page-1',
        use: 'RootPageModel',
      },
      publicNodeMap: {},
      targetSummary: null,
      fingerprint: null,
      uidSet: new Set(['page-1']),
      keyMap: new Map([
        [
          'introBlock',
          {
            key: 'introBlock',
            uid: 'old-block-1',
            source: 'declared',
            kind: 'block',
            locator: { uid: 'old-block-1' },
          },
        ],
      ]),
      requestKeyMap: new Map(),
    } as any;

    await expect(
      compilePlanStep(
        'applyBlueprint',
        {
          id: 'replaceIntro',
          action: 'compose',
          selectors: {
            target: {
              step: 'updatedTab',
              path: 'tabSchemaUid',
            },
          },
          values: {
            mode: 'replace',
            blocks: [
              {
                key: 'newIntroBlock',
                type: 'markdown',
                settings: {
                  relatedBlock: {
                    key: 'introBlock',
                  },
                },
              },
            ],
          },
        },
        0,
        context,
        {
          normalizeGetTarget: (value) => value,
          resolveLocator: async (target) => ({
            uid: target.uid,
            kind: 'node',
          }),
          buildPlanKeyKind: (_node, resolvedKind) => resolvedKind || 'node',
        },
        new Set(['updatedTab']),
        new Set(),
      ),
    ).rejects.toThrow('compose replace does not support selectors.target.step');
  });
});
