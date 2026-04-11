/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getRouteBackedTabs,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

describe('flowSurfaces executeDsl contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent, flowRepo } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should create one page from the simplified structure DSL and return only target/surface', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        version: '1',
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
    expect(data.dsl).toBeUndefined();
    expect(data.plan).toBeUndefined();
    expect(data.compiledSteps).toBeUndefined();
    expect(data.results).toBeUndefined();
    expect(data.verificationMode).toBeUndefined();
    expect(data.keys).toBeUndefined();

    expect(getRouteBackedTabs(data.surface).map((tab: any) => tab?.props?.title)).toEqual(['Overview', 'Summary']);
    expect(data.surface.target.locator.pageSchemaUid).toBe(data.target.pageSchemaUid);
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

    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
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
    expect(data.keys).toBeUndefined();
    expect(getRouteBackedTabs(data.surface)).toHaveLength(1);
    expect(data.surface.pageRoute.displayTitle).toBe(false);
  });

  it('should auto-generate a vertical grid layout when tab layout is omitted', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
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
    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
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
    expect(message).toContain(`flowSurfaces executeDsl tabs[0].layout.rows[0][0]`);
    expect(message).toContain(`references unknown block 'missingBlock'`);
    expect(message).not.toContain(`tabs['`);
  });

  it('should reject unsupported executeDsl top-level keys', async () => {
    const res = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        dsl: {
          version: '1',
          title: 'unsupported',
        },
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain('only accepts top-level keys');
    expect(readErrorMessage(res)).toContain('unsupported keys: dsl');
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
      'reject block collectionName alias',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collectionName: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'collectionName is unsupported; use collection',
      'flowSurfaces executeDsl tabs[0].blocks[0].collectionName',
    ],
    [
      'reject block resourceBinding alias',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', resourceBinding: 'currentCollection' }],
          },
        ],
      },
      'resourceBinding is unsupported; use binding',
      'flowSurfaces executeDsl tabs[0].blocks[0].resourceBinding',
    ],
    [
      'reject block association alias',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', association: 'department' }],
          },
        ],
      },
      'association is unsupported; use associationPathName',
      'flowSurfaces executeDsl tabs[0].blocks[0].association',
    ],
    [
      'reject block.resource resourceBinding alias',
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
                  resourceBinding: 'currentCollection',
                },
              },
            ],
          },
        ],
      },
      'resourceBinding is unsupported; use binding',
      'flowSurfaces executeDsl tabs[0].blocks[0].resource.resourceBinding',
    ],
    [
      'reject block.resource collection alias',
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
                  collection: 'employees',
                },
              },
            ],
          },
        ],
      },
      'collection is unsupported; use collectionName',
      'flowSurfaces executeDsl tabs[0].blocks[0].resource.collection',
    ],
    [
      'reject block.resource association alias',
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
                  collectionName: 'employees',
                  association: 'department',
                },
              },
            ],
          },
        ],
      },
      'association is unsupported; use associationPathName',
      'flowSurfaces executeDsl tabs[0].blocks[0].resource.association',
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
      'cannot mix binding with flowSurfaces executeDsl tabs[0].blocks[0].resource.sourceId',
      'flowSurfaces executeDsl tabs[0].blocks[0].resource',
    ],
    [
      'reject fieldPath alias',
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
                fields: [{ key: 'nicknameField', fieldPath: 'nickname' }],
              },
            ],
          },
        ],
      },
      '.fieldPath is unsupported; use field',
      undefined,
    ],
    [
      'reject openView alias',
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
                fields: [
                  {
                    key: 'nicknameField',
                    field: 'nickname',
                    openView: {
                      title: 'Details',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      '.openView is unsupported; use popup',
      undefined,
    ],
  ])('should %s', async (_label, values, message, expectedPath) => {
    const res = await rootAgent.resource('flowSurfaces').executeDsl({
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

  it.each([
    [
      'reject block legacy ref',
      'ref',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                ref: 'employeesTable',
                type: 'table',
                collection: 'employees',
              },
            ],
          },
        ],
      },
      'flowSurfaces executeDsl tabs[0].blocks[0]',
    ],
    [
      'reject block legacy $ref',
      '$ref',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                $ref: '#/employeesTable',
                type: 'table',
                collection: 'employees',
              },
            ],
          },
        ],
      },
      'flowSurfaces executeDsl tabs[0].blocks[0]',
    ],
    [
      'reject popup legacy $ref',
      '$ref',
      {
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
                      $ref: '#/popup',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      'flowSurfaces executeDsl tabs[0].blocks[0].recordActions[0].popup',
    ],
    [
      'reject resource legacy $ref',
      '$ref',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'details',
                resource: {
                  $ref: '#/resource',
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
      'flowSurfaces executeDsl tabs[0].blocks[0].resource',
    ],
    [
      'reject field target legacy $ref',
      '$ref',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesFilter',
                type: 'filterForm',
                collection: 'employees',
                fields: [
                  {
                    field: 'nickname',
                    target: {
                      $ref: '#/employeesTable',
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
      'flowSurfaces executeDsl tabs[0].blocks[0].fields[0].target',
    ],
    [
      'reject layout cell legacy $ref',
      '$ref',
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
              rows: [[{ $ref: '#/employeesTable' }]],
            },
          },
        ],
      },
      'flowSurfaces executeDsl tabs[0].layout.rows[0][0]',
    ],
  ])('should %s', async (_label, legacyKey, values, expectedPath) => {
    const res = await rootAgent.resource('flowSurfaces').executeDsl({
      values,
    });

    expect(res.status).toBe(400);
    const errorMessage = readErrorMessage(res);
    expect(errorMessage).toContain(expectedPath);
    if (legacyKey === '$ref') {
      expect(errorMessage).toContain(`"$ref" is not supported`);
    } else {
      expect(errorMessage).toContain('does not support { ref }');
    }
    expect(errorMessage).not.toContain(`tabs['`);
  });

  it('should reject popup unknown keys instead of ignoring them', async () => {
    const res = await rootAgent.resource('flowSurfaces').executeDsl({
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
      'flowSurfaces executeDsl tabs[0].blocks[0].recordActions[0].popup only accepts keys title, mode, template, blocks, layout; unsupported keys: foo',
    );
  });

  it('should reject tab layout uid cells and require key-only executeDsl layout cells', async () => {
    const res = await rootAgent.resource('flowSurfaces').executeDsl({
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
      'flowSurfaces executeDsl tabs[0].layout.rows[0][0] only accepts keys key, span; unsupported keys: uid',
    );
  });

  it('should reject non-object tab layout values instead of silently dropping them', async () => {
    const res = await rootAgent.resource('flowSurfaces').executeDsl({
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
    expect(readErrorMessage(res)).toContain('flowSurfaces executeDsl tabs[0].layout must be an object');
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

    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
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

    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
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
    expect(data.keys).toBeUndefined();
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

    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
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

    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
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

  it('should reject object-style field target keys in executeDsl and require string block keys only', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
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
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces executeDsl tabs[0].blocks[0].fields[0].target');
    expect(readErrorMessage(executeRes)).toContain('target must be a string block key');
  });

  it('should report popup nested block alias errors with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Popup alias page',
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
                          association: 'department',
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
    expect(message).toContain('flowSurfaces executeDsl tabs[0].blocks[0].recordActions[0].popup.blocks[0].association');
    expect(message).toContain('association is unsupported; use associationPathName');
    expect(message).not.toContain(`tabs['`);
  });
});
