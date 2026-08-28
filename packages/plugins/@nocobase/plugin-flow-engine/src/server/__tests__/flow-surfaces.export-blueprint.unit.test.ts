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
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createFlowSurfacesContractContext,
  destroyFlowSurfacesContractContext,
  getData,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import {
  FLOW_SURFACES_RECORD_HISTORY_TEST_PLUGIN_INSTALLS,
  FLOW_SURFACES_TEST_PLUGINS,
} from './flow-surfaces.test-plugins';

const ROOT_ONLY_ERROR = 'exportBlueprint v1 only supports root page export';
const INTERNAL_DOCUMENT_KEYS = new Set(['tree', 'nodeMap', 'publicNodeMap', 'internal', 'ref', 'uid']);

type FlowSurfaceTestRecord = Record<string, unknown>;
type FlowSurfaceTestNode = FlowSurfaceTestRecord & {
  uid?: string;
  parentId?: unknown;
  subKey?: unknown;
  subType?: unknown;
  use?: string;
  props?: FlowSurfaceTestRecord;
  stepParams?: FlowSurfaceTestRecord;
  subModels?: Record<string, unknown>;
};

function isFlowSurfaceTestRecord(value: unknown): value is FlowSurfaceTestRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asFlowSurfaceTestNode(value: unknown): FlowSurfaceTestNode | undefined {
  return isFlowSurfaceTestRecord(value) ? (value as FlowSurfaceTestNode) : undefined;
}

function readRecordString(value: unknown, key: string) {
  const record = asFlowSurfaceTestNode(value);
  return typeof record?.[key] === 'string' ? record[key] : undefined;
}

function collectDescendantNodes(
  node: unknown,
  predicate: (item: FlowSurfaceTestNode) => boolean,
  carry: FlowSurfaceTestNode[] = [],
) {
  const current = asFlowSurfaceTestNode(node);
  if (!current) {
    return carry;
  }
  if (predicate(current)) {
    carry.push(current);
  }
  for (const value of Object.values(current.subModels || {})) {
    for (const child of Array.isArray(value) ? value : [value]) {
      collectDescendantNodes(child, predicate, carry);
    }
  }
  return carry;
}

function assertNoInternalDocumentKeys(value: unknown, path: string[] = []) {
  if (!value || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoInternalDocumentKeys(item, [...path, String(index)]));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = [...path, key];
    const isPublicTemplateUid = key === 'uid' && path[path.length - 1] === 'template';
    expect(
      INTERNAL_DOCUMENT_KEYS.has(key) && !isPublicTemplateUid,
      `unexpected internal key at document.${nextPath.join('.')}`,
    ).toBe(false);
    assertNoInternalDocumentKeys(child, nextPath);
  }
}

function readFieldName(field: unknown) {
  return typeof field === 'string' ? field : readRecordString(field, 'field');
}

function readActionType(action: unknown) {
  return typeof action === 'string' ? action : readRecordString(action, 'type');
}

function employeeDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'nickname', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'email', operator: '$notEmpty' },
    ],
  };
}

function calendarDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'title', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'category', operator: '$notEmpty' },
      { path: 'scope', operator: '$notEmpty' },
    ],
  };
}

function chartQuery() {
  return {
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
  };
}

function chartVisual() {
  return {
    mode: 'basic',
    type: 'bar',
    mappings: {
      x: 'status',
      y: 'employeeCount',
    },
  };
}

function readFirstTable(readback: { tree?: unknown }) {
  const table = collectDescendantNodes(readback.tree, (item) => item?.use === 'TableBlockModel')[0];
  expect(table?.uid).toBeTruthy();
  return table;
}

function readFieldHost(readback: { tree?: unknown }, fieldPath: string) {
  const fieldHost = collectDescendantNodes(
    readback.tree,
    (item) => _.get(item.stepParams, ['fieldSettings', 'init', 'fieldPath']) === fieldPath,
  )[0];
  expect(fieldHost?.uid).toBeTruthy();
  return fieldHost;
}

async function markFieldUnsupported(context: FlowSurfacesContractContext, fieldHost: FlowSurfaceTestNode) {
  await context.flowRepo.upsertModel({
    uid: fieldHost.uid,
    parentId: fieldHost.parentId,
    subKey: fieldHost.subKey,
    subType: fieldHost.subType,
    use: fieldHost.use,
    props: {
      ...(fieldHost.props || {}),
      unsupportedExportState: 'Unsupported helper text',
    },
    stepParams: fieldHost.stepParams,
  });
}

async function readPage(rootAgent: FlowSurfacesContractContext['rootAgent'], pageSchemaUid: string) {
  return getData(
    await rootAgent.resource('flowSurfaces').get({
      pageSchemaUid,
    }),
  );
}

function buildExportSourceBlueprint(title: string) {
  return {
    version: '1',
    mode: 'create',
    navigation: {
      item: {
        title,
      },
    },
    page: {
      title,
      documentTitle: `${title} document`,
      enableHeader: true,
      enableTabs: true,
      displayTitle: true,
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
            fields: [
              { key: 'nicknameField', field: 'nickname' },
              { key: 'emailField', field: 'email' },
              { key: 'phoneField', field: 'phone' },
            ],
            actions: [{ key: 'addEmployee', type: 'addNew' }],
            recordActions: [
              { key: 'editEmployee', type: 'edit' },
              { key: 'viewEmployee', type: 'view' },
            ],
          },
        ],
        layout: {
          rows: [['employeesTable']],
        },
      },
    ],
  };
}

async function createExportSourcePage(rootAgent: FlowSurfacesContractContext['rootAgent'], title: string) {
  const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
    values: buildExportSourceBlueprint(title),
  });
  expect(createRes.status, readErrorMessage(createRes)).toBe(200);
  return getData(createRes).target.pageSchemaUid as string;
}

describe('flowSurfaces exportBlueprint', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      plugins: FLOW_SURFACES_RECORD_HISTORY_TEST_PLUGIN_INSTALLS,
      enabledPluginAliases: [...FLOW_SURFACES_TEST_PLUGINS, 'record-history'],
    });
    rootAgent = context.rootAgent;
  });

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should export a root page as a prepared replace blueprint without internal tree shape', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export blueprint ${Date.now()}`);

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'error',
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);

    const exported = getData(exportRes);
    expect(exported.document).toMatchObject({
      version: '1',
      mode: 'replace',
      target: {
        pageSchemaUid,
      },
      assets: {
        scripts: {},
        charts: {},
      },
    });
    expect(exported.document.navigation).toBeUndefined();
    expect(exported.source.target.pageSchemaUid).toBe(pageSchemaUid);
    expect(exported.warnings).toEqual([]);
    expect(exported.unsupported).toEqual([]);
    assertNoInternalDocumentKeys(exported.document);

    const [tab] = exported.document.tabs;
    expect(tab.key).toBe('overviewTab');
    expect(tab.title).toBe('Overview');
    expect(tab.layout.rows).toEqual([['employeesTable']]);

    const [table] = tab.blocks;
    expect(table.key).toBe('employeesTable');
    expect(table.type).toBe('table');
    expect(table.collection).toBe('employees');
    expect(table.fields.map(readFieldName)).toEqual(['nickname', 'email', 'phone']);
    expect(table.actions.map(readActionType)).toContain('addNew');
    expect(table.recordActions.map(readActionType)).toEqual(expect.arrayContaining(['edit', 'view']));
  });

  it('should export a root page by routeId locator', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export route locator ${Date.now()}`);
    const pageRoute = await context.routesRepo.findOne({
      filter: {
        schemaUid: pageSchemaUid,
      },
    });
    const routeId = String(pageRoute?.get('id') || '');
    expect(routeId).toBeTruthy();

    const byPageRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(byPageRes.status, readErrorMessage(byPageRes)).toBe(200);

    const byRouteRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          routeId,
        },
      },
    });
    expect(byRouteRes.status, readErrorMessage(byRouteRes)).toBe(200);

    const byPage = getData(byPageRes);
    const byRoute = getData(byRouteRes);
    expect(byRoute.document.target.pageSchemaUid).toBe(pageSchemaUid);
    expect(byRoute.source.target.pageSchemaUid).toBe(pageSchemaUid);
    expect(byRoute.document).toEqual(byPage.document);
    expect(byRoute.source).toEqual(byPage.source);
    expect(byRoute.warnings).toEqual([]);
    expect(byRoute.unsupported).toEqual([]);
  });

  it('should preserve supported data block filter and pagination settings', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export block data settings ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const table = readFirstTable(readback);
    await context.flowRepo.upsertModel({
      uid: table.uid,
      use: table.use,
      props: table.props,
      stepParams: {
        ...(table.stepParams || {}),
        tableSettings: {
          ...((table.stepParams?.tableSettings as Record<string, unknown> | undefined) || {}),
          dataScope: {
            filter: employeeDefaultFilter(),
          },
          pageSize: {
            pageSize: 20,
          },
        },
      },
    });

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    const [exportedTable] = exported.document.tabs[0].blocks;
    expect(exportedTable.defaultFilter).toEqual(employeeDefaultFilter());
    expect(exportedTable.pageSize).toBe(20);
    expect(exportedTable.settings).toMatchObject({
      pageSize: 20,
    });
    expect(exported.unsupported).toEqual([]);
  });

  it('should preserve relation field titleField mirror props as supported public state', async () => {
    const title = `Export relation titleField ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: [
                  { key: 'nicknameField', field: 'nickname' },
                  { key: 'departmentField', field: 'department', titleField: 'title' },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const departmentField = readFieldHost(readback, 'department');
    expect(departmentField.props?.titleField).toBe('title');

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    const departmentSpec = exported.document.tabs[0].blocks[0].fields.find((field) => field?.field === 'department');
    expect(departmentSpec).toMatchObject({
      field: 'department',
      titleField: 'title',
    });
    expect(exported.unsupported).toEqual([]);

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should preserve supported table field settings in default export mode', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export table field settings ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const nicknameField = readFieldHost(readback, 'nickname');
    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: nicknameField.uid,
        },
        changes: {
          title: 'Employee nickname',
          tooltip: 'Shown in the employee table',
          width: 260,
          fixed: 'left',
          sorter: true,
          editable: true,
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    const nicknameSpec = exported.document.tabs[0].blocks[0].fields.find((field) => field?.field === 'nickname');
    expect(nicknameSpec).toMatchObject({
      field: 'nickname',
      settings: {
        title: 'Employee nickname',
        tooltip: 'Shown in the employee table',
        width: 260,
        fixed: 'left',
        sorter: true,
        editable: true,
      },
    });
    expect(exported.unsupported).toEqual([]);

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should preserve supported form field settings in default export mode', async () => {
    const title = `Export form field settings ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: [{ key: 'nicknameField', field: 'nickname' }],
                actions: [],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const nicknameField = readFieldHost(readback, 'nickname');
    const submitAction = collectDescendantNodes(readback.tree, (item) => item?.use === 'FormSubmitActionModel')[0];
    expect(submitAction?.uid).toBeTruthy();
    await context.flowRepo.remove(submitAction.uid);
    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: nicknameField.uid,
        },
        changes: {
          label: 'Employee nickname',
          tooltip: 'Shown on the profile',
          extra: 'Use the preferred display name',
          showLabel: false,
          initialValue: 'New hire',
          required: true,
          pattern: 'editable',
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    const formBlock = exported.document.tabs[0].blocks.find((block) => block.type === 'createForm');
    const nicknameSpec = formBlock.fields.find((field) => field?.field === 'nickname');
    expect(nicknameSpec).toMatchObject({
      field: 'nickname',
      label: 'Employee nickname',
      settings: {
        tooltip: 'Shown on the profile',
        extra: 'Use the preferred display name',
        showLabel: false,
        initialValue: 'New hire',
        required: true,
        pattern: 'editable',
      },
    });
    expect(exported.unsupported).toEqual([]);

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should export current page model settings instead of stale route chrome', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export configured page ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: readback.tree.uid,
        },
        changes: {
          title: 'Configured export title',
          icon: 'AppstoreOutlined',
          documentTitle: 'Configured browser title',
          enableHeader: false,
          enableTabs: false,
          displayTitle: false,
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    expect(exported.document.page).toMatchObject({
      title: 'Configured export title',
      icon: 'AppstoreOutlined',
      documentTitle: 'Configured browser title',
      enableHeader: false,
      enableTabs: false,
      displayTitle: false,
    });
  });

  it('should report single-tab enableTabs true as unsupported instead of exporting a lossy document', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export single tab tabs ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: readback.tree.uid,
        },
        changes: {
          enableTabs: true,
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('unsupported-single-tab-enable-tabs');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.document.page.enableTabs).toBe(false);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'page',
          path: '$.page.enableTabs',
          reasonCode: 'unsupported-single-tab-enable-tabs',
        }),
      ]),
    );
  });

  it('should allow exported documents to be applied as same-instance replace repeatedly', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export replace roundtrip ${Date.now()}`);
    const exported = getData(
      await rootAgent.resource('flowSurfaces').exportBlueprint({
        values: {
          target: {
            pageSchemaUid,
          },
        },
      }),
    );

    const firstReplaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(firstReplaceRes.status, readErrorMessage(firstReplaceRes)).toBe(200);

    const secondReplaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(secondReplaceRes.status, readErrorMessage(secondReplaceRes)).toBe(200);
  });

  it('should reject non-root targets and tab subtree export in v1', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export root only ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const table = readFirstTable(readback);
    const addAction = collectDescendantNodes(readback.tree, (item) => item?.use === 'AddNewActionModel')[0];
    expect(addAction?.uid).toBeTruthy();
    const childPageUid = uid();
    await context.flowRepo.upsertModel({
      uid: childPageUid,
      parentId: addAction.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    const blockExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          uid: table.uid,
        },
      },
    });
    expect(blockExportRes.status).toBe(400);
    expect(readErrorMessage(blockExportRes)).toContain(ROOT_ONLY_ERROR);

    const tabExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          tabSchemaUid: readback.tree.subModels.tabs[0].uid,
        },
      },
    });
    expect(tabExportRes.status).toBe(400);
    expect(readErrorMessage(tabExportRes)).toContain(ROOT_ONLY_ERROR);

    const childPageExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          uid: childPageUid,
        },
      },
    });
    expect(childPageExportRes.status).toBe(400);
    expect(readErrorMessage(childPageExportRes)).toContain(ROOT_ONLY_ERROR);
  });

  it('should export public JS actions without treating runJs settings as unsupported', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export JS action ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const table = readFirstTable(readback);
    const actionsColumn = collectDescendantNodes(readback.tree, (item) => item?.use === 'TableActionsColumnModel')[0];
    expect(actionsColumn?.uid).toBeTruthy();
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: table.uid,
      subKey: 'actions',
      subType: 'array',
      use: 'JSCollectionActionModel',
      props: {
        title: 'Run diagnostics',
        iconOnly: true,
      },
      stepParams: {
        buttonSettings: {
          general: {
            title: 'Run diagnostics',
            iconOnly: true,
          },
        },
        clickSettings: {
          runJs: {
            version: '1.0.1',
            code: "ctx.message.info('Diagnostics ready');",
          },
        },
      },
    });
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: actionsColumn.uid,
      subKey: 'actions',
      subType: 'array',
      use: 'JSItemActionModel',
      props: {
        title: 'Run row diagnostics',
        iconOnly: true,
      },
      stepParams: {
        buttonSettings: {
          general: {
            title: 'Run row diagnostics',
            iconOnly: true,
          },
        },
        jsSettings: {
          runJs: {
            version: '1.0.2',
            code: "ctx.render('Row diagnostics ready');",
          },
        },
      },
    });

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    const [tableDocument] = exported.document.tabs[0].blocks;
    const jsAction = tableDocument.actions.find((action) => action?.type === 'js');
    expect(jsAction).toMatchObject({
      type: 'js',
      settings: {
        title: 'Run diagnostics',
        iconOnly: true,
        version: '1.0.1',
        code: "ctx.message.info('Diagnostics ready');",
      },
    });
    const jsItemAction = tableDocument.recordActions.find((action) => action?.type === 'jsItem');
    expect(jsItemAction).toMatchObject({
      type: 'jsItem',
      settings: {
        title: 'Run row diagnostics',
        iconOnly: true,
        version: '1.0.2',
        code: "ctx.render('Row diagnostics ready');",
      },
    });
    expect(exported.unsupported).toEqual([]);

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should preserve associated resource default action popup runtime as supported state', async () => {
    const title = `Export associated action popup ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'departmentAssociatedTable',
                type: 'table',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'departments',
                  associationName: 'employees.department',
                },
                fields: [{ key: 'titleField', field: 'title' }],
                actions: [{ key: 'addDepartment', type: 'addNew' }],
                recordActions: [{ key: 'viewDepartment', type: 'view' }],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const addAction = collectDescendantNodes(readback.tree, (item) => item?.use === 'AddNewActionModel')[0];
    expect(addAction?.stepParams?.popupSettings?.openView).toMatchObject({
      associationName: 'employees.department',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    const [tableDocument] = exported.document.tabs[0].blocks;
    expect(tableDocument.resource).toMatchObject({
      collectionName: 'departments',
      associationName: 'employees.department',
    });
    expect(tableDocument.actions.map(readActionType)).toContain('addNew');
    expect(tableDocument.recordActions.map(readActionType)).toContain('view');
    expect(exported.unsupported).toEqual([]);

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should preserve public tree block settings instead of rejecting supported props', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export tree block ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const gridUid = readback.tree.subModels.tabs[0].subModels.grid.uid;
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: gridUid,
      subKey: 'items',
      subType: 'array',
      use: 'TreeBlockModel',
      props: {
        searchable: false,
        defaultExpandAll: true,
        includeDescendants: false,
        fieldNames: {
          title: 'name',
          key: 'id',
          children: 'children',
        },
        pageSize: 30,
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
            includeDescendants: false,
          },
          titleField: {
            titleField: 'name',
          },
          pageSize: {
            pageSize: 30,
          },
        },
      },
    });

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    const treeBlock = exported.document.tabs[0].blocks.find((block) => block.type === 'tree');
    expect(treeBlock).toMatchObject({
      type: 'tree',
      collection: 'categories',
      settings: {
        searchable: false,
        defaultExpandAll: true,
        includeDescendants: false,
        fieldNames: {
          title: 'name',
          key: 'id',
          children: 'children',
        },
        titleField: 'name',
        pageSize: 30,
      },
      pageSize: 30,
    });
    expect(exported.unsupported).toEqual([]);
  });

  it('should preserve supported public block settings across export and replace', async () => {
    const title = `Export public block settings ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeesList',
                type: 'list',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                settings: {
                  title: 'Employees list',
                  pageSize: 30,
                  sorting: [{ field: 'nickname', direction: 'asc' }],
                  layout: 'grid',
                },
                fields: ['nickname', 'email'],
              },
              {
                key: 'employeesCards',
                type: 'gridCard',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                settings: {
                  title: 'Employees cards',
                  columns: {
                    xs: 1,
                    sm: 1,
                    md: 2,
                    lg: 3,
                    xl: 3,
                    xxl: 4,
                  },
                  rowCount: 2,
                  sorting: [{ field: 'email', direction: 'desc' }],
                  layout: 'vertical',
                },
                fields: ['nickname', 'email'],
              },
              {
                key: 'utilityActions',
                type: 'actionPanel',
                settings: {
                  title: 'Utilities',
                  layout: 'icons',
                  ellipsis: true,
                },
              },
              {
                key: 'runtimeBanner',
                type: 'jsBlock',
                title: 'Runtime banner',
                description: 'Rendered by JS',
                settings: {
                  showBlockCard: false,
                  version: '1.0.0',
                  code: "ctx.render('Ready');",
                },
              },
              {
                key: 'departmentHistory',
                type: 'recordHistory',
                collection: 'departments',
                settings: {
                  title: 'Department history',
                  sortOrder: { order: 'desc' },
                  dataScope: {
                    logic: '$and',
                    items: [{ path: 'status', operator: '$notEmpty' }],
                  },
                  expand: { expand: false },
                  template: { apply: 'current' },
                },
              },
            ],
            layout: {
              rows: [
                ['employeesList', 'employeesCards'],
                ['utilityActions', 'runtimeBanner', 'departmentHistory'],
              ],
            },
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    expect(exported.unsupported).toEqual([]);
    const blocks = exported.document.tabs[0].blocks;
    const listBlock = blocks.find((block) => block.key === 'employeesList');
    expect(listBlock).toMatchObject({
      type: 'list',
      title: 'Employees list',
      settings: {
        pageSize: 30,
        sorting: [{ field: 'nickname', direction: 'asc' }],
        layout: 'grid',
      },
    });
    const gridCardBlock = blocks.find((block) => block.key === 'employeesCards');
    expect(gridCardBlock).toMatchObject({
      type: 'gridCard',
      title: 'Employees cards',
      settings: {
        columns: {
          xs: 1,
          sm: 1,
          md: 2,
          lg: 3,
          xl: 3,
          xxl: 4,
        },
        rowCount: 2,
        sorting: [{ field: 'email', direction: 'desc' }],
        layout: 'vertical',
      },
    });
    const actionPanelBlock = blocks.find((block) => block.key === 'utilityActions');
    expect(actionPanelBlock).toMatchObject({
      type: 'actionPanel',
      title: 'Utilities',
      settings: {
        layout: 'icons',
        ellipsis: true,
      },
    });
    const jsBlock = blocks.find((block) => block.key === 'runtimeBanner');
    expect(jsBlock).toMatchObject({
      type: 'jsBlock',
      title: 'Runtime banner',
      description: 'Rendered by JS',
      settings: {
        showBlockCard: false,
        version: '1.0.0',
        code: "ctx.render('Ready');",
      },
    });
    const recordHistoryBlock = blocks.find((block) => block.key === 'departmentHistory');
    expect(recordHistoryBlock).toMatchObject({
      type: 'recordHistory',
      collection: 'departments',
      title: 'Department history',
      settings: {
        sortOrder: { order: 'desc' },
        dataScope: {
          logic: '$and',
          items: [{ path: 'status', operator: '$notEmpty' }],
        },
        expand: { expand: false },
        template: { apply: 'current' },
      },
    });
    expect(recordHistoryBlock.defaultFilter).toBeUndefined();
    expect((recordHistoryBlock.actions || []).map(readActionType)).not.toEqual(
      expect.arrayContaining(['expandAll', 'collapseAll']),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);

    const replacedExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(replacedExportRes.status, readErrorMessage(replacedExportRes)).toBe(200);
    const replacedBlocks = getData(replacedExportRes).document.tabs[0].blocks;
    const replacedJsBlock = replacedBlocks.find((block) => block.key === 'runtimeBanner');
    expect(replacedJsBlock?.settings?.showBlockCard).toBe(false);
  });

  it('should preserve supported kanban public settings and hidden popup display settings', async () => {
    const title = `Export kanban settings ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'tasksKanban',
                type: 'kanban',
                collection: 'kanban_tasks',
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'title', operator: '$notEmpty' },
                    { path: 'status', operator: '$notEmpty' },
                    { path: 'priority', operator: '$notEmpty' },
                  ],
                },
                settings: {
                  title: 'Task board',
                  groupField: 'status',
                  styleVariant: 'filled',
                  sorting: [{ field: 'title', direction: 'asc' }],
                  dragEnabled: true,
                  dragSortBy: 'status_sort',
                  quickCreateEnabled: false,
                  quickCreatePopup: {
                    mode: 'drawer',
                    size: 'large',
                    title: 'Quick task',
                    tryTemplate: false,
                  },
                  enableCardClick: false,
                  cardPopup: {
                    mode: 'dialog',
                    size: 'small',
                    title: 'Task details',
                    tryTemplate: false,
                  },
                  cardLayout: 'horizontal',
                  cardLabelAlign: 'left',
                  cardLabelWidth: '120px',
                  cardLabelWrap: true,
                  cardColon: false,
                  pageSize: 40,
                  columnWidth: 320,
                },
                fields: ['title', 'priority'],
              },
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: {
              rows: [['tasksKanban', 'employeesTable']],
            },
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    expect(exported.unsupported).toEqual([]);
    const kanbanBlock = exported.document.tabs[0].blocks.find((block) => block.key === 'tasksKanban');
    expect(kanbanBlock).toMatchObject({
      type: 'kanban',
      collection: 'kanban_tasks',
      title: 'Task board',
      settings: {
        groupField: 'status',
        styleVariant: 'filled',
        sorting: [{ field: 'title', direction: 'asc' }],
        dragEnabled: true,
        dragSortBy: 'status_sort',
        quickCreateEnabled: false,
        quickCreatePopup: {
          mode: 'drawer',
          size: 'large',
          title: 'Quick task',
          tryTemplate: false,
        },
        enableCardClick: false,
        cardPopup: {
          mode: 'dialog',
          size: 'small',
          title: 'Task details',
          tryTemplate: false,
        },
        cardLayout: 'horizontal',
        cardLabelAlign: 'left',
        cardLabelWidth: '120px',
        cardLabelWrap: true,
        cardColon: false,
        pageSize: 40,
        columnWidth: 320,
      },
    });

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should report JS block className as unsupported instead of silently dropping it', async () => {
    const title = `Export JS block className ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
              {
                key: 'runtimeBanner',
                type: 'jsBlock',
                title: 'Runtime banner',
                settings: {
                  version: '1.0.0',
                  code: "ctx.render('Ready');",
                },
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const jsBlock = collectDescendantNodes(readback.tree, (item) => item?.use === 'JSBlockModel')[0];
    expect(jsBlock?.uid).toBeTruthy();
    await context.flowRepo.upsertModel({
      uid: jsBlock.uid,
      use: jsBlock.use,
      decoratorProps: {
        ...(jsBlock.decoratorProps || {}),
        title: 'Runtime banner',
        className: 'custom-runtime-banner',
      },
      stepParams: jsBlock.stepParams,
    });

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('unsupported-public-state');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'block',
          use: 'JSBlockModel',
          type: 'jsBlock',
          reasonCode: 'unsupported-public-state',
        }),
      ]),
    );
  });

  it('should reject unsupported visible nodes by default and report them in warn mode', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export unsupported ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const gridUid = readback.tree.subModels.tabs[0].subModels.grid.uid;
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: gridUid,
      subKey: 'items',
      subType: 'array',
      use: 'UnknownBlockModel',
      props: {
        title: 'Unknown block',
      },
    });

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('cannot export block');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.document.tabs[0].blocks.map((block) => block.key)).toContain('employeesTable');
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'block',
          use: 'UnknownBlockModel',
          reasonCode: 'unsupported-node',
          manualAction: 'Recreate this block manually or add mapper support.',
        }),
      ]),
    );
    expect(exported.warnings.join('\n')).toContain('unsupported-node');
  });

  it('should export chart and calendar blocks as replaceable public specs', async () => {
    const title = `Export chart calendar ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title,
          },
        },
        page: {
          title,
        },
        assets: {
          charts: {
            statusChart: {
              query: chartQuery(),
              visual: chartVisual(),
            },
          },
        },
        tabs: [
          {
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status'],
              },
              {
                key: 'employeesChart',
                type: 'chart',
                chart: 'statusChart',
                settings: {
                  title: 'Employees by status',
                },
              },
              {
                key: 'employeesCalendar',
                type: 'calendar',
                collection: 'calendar_events',
                defaultFilter: calendarDefaultFilter(),
                settings: {
                  title: 'Employee calendar',
                  titleField: 'title',
                  startField: 'startsAt',
                  endField: 'endsAt',
                  defaultView: 'week',
                  quickCreateEvent: false,
                  showLunar: false,
                  weekStart: 1,
                },
              },
            ],
            layout: {
              rows: [['employeesTable', 'employeesChart', 'employeesCalendar']],
            },
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    expect(exported.unsupported).toEqual([]);

    const exportedBlocks = exported.document.tabs[0].blocks;
    const exportedChart = exportedBlocks.find((block) => block.key === 'employeesChart');
    expect(exportedChart).toMatchObject({
      type: 'chart',
      title: 'Employees by status',
      chart: expect.any(String),
    });
    expect(exportedChart.settings?.configure).toBeUndefined();
    const exportedChartAsset = exported.document.assets.charts[exportedChart.chart];
    expect(exportedChartAsset).toMatchObject({
      query: expect.objectContaining({
        mode: 'builder',
      }),
      visual: expect.objectContaining({
        mode: 'basic',
        type: 'bar',
      }),
    });
    const exportedCalendar = exportedBlocks.find((block) => block.key === 'employeesCalendar');
    expect(exportedCalendar).toMatchObject({
      type: 'calendar',
      title: 'Employee calendar',
      collection: 'calendar_events',
      settings: {
        titleField: 'title',
        startField: 'startsAt',
        endField: 'endsAt',
        defaultView: 'week',
        quickCreateEvent: false,
        showLunar: false,
        weekStart: 1,
      },
    });
    const exportedCalendarFilter = exportedCalendar.actions.find((action) => action.type === 'filter');
    expect(exportedCalendarFilter).toMatchObject({
      settings: {
        defaultFilter: calendarDefaultFilter(),
      },
    });

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should treat complex unsupported actions as unsupported without dropping supported sibling blocks', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export complex unsupported action ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const table = readFirstTable(readback);
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: table.uid,
      subKey: 'actions',
      subType: 'array',
      use: 'AIEmployeeButtonModel',
      props: {
        aiEmployee: {
          username: 'dex',
        },
        auto: false,
      },
    });

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('cannot export action');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.document.tabs[0].blocks.map((block) => block.key)).toContain('employeesTable');
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'action',
          use: 'AIEmployeeButtonModel',
          reasonCode: 'unsupported-node',
        }),
      ]),
    );
  });

  it('should treat custom popup display state and local popup pages as unsupported', async () => {
    const customDisplayPageSchemaUid = await createExportSourcePage(
      rootAgent,
      `Export custom popup display ${Date.now()}`,
    );
    const customDisplayReadback = await readPage(rootAgent, customDisplayPageSchemaUid);
    const customDisplayAddAction = collectDescendantNodes(
      customDisplayReadback.tree,
      (item) => item?.use === 'AddNewActionModel',
    )[0];
    expect(customDisplayAddAction?.uid).toBeTruthy();
    await context.flowRepo.upsertModel({
      uid: customDisplayAddAction.uid,
      use: customDisplayAddAction.use,
      props: customDisplayAddAction.props,
      stepParams: {
        ...(customDisplayAddAction.stepParams || {}),
        popupSettings: {
          ...((customDisplayAddAction.stepParams?.popupSettings as Record<string, unknown> | undefined) || {}),
          openView: {
            ...((customDisplayAddAction.stepParams?.popupSettings?.openView as Record<string, unknown> | undefined) ||
              {}),
            size: 'large',
          },
        },
      },
    });

    const customDisplayExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: customDisplayPageSchemaUid,
        },
      },
    });
    expect(customDisplayExportRes.status).toBe(400);
    expect(readErrorMessage(customDisplayExportRes)).toContain('cannot export action');

    const localPopupPageSchemaUid = await createExportSourcePage(rootAgent, `Export local popup ${Date.now()}`);
    const localPopupReadback = await readPage(rootAgent, localPopupPageSchemaUid);
    const localPopupAddAction = collectDescendantNodes(
      localPopupReadback.tree,
      (item) => item?.use === 'AddNewActionModel',
    )[0];
    expect(localPopupAddAction?.uid).toBeTruthy();
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: localPopupAddAction.uid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: localPopupPageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'action',
          use: 'AddNewActionModel',
          reasonCode: 'unsupported-node',
        }),
      ]),
    );
  });

  it('should preserve block templates and treat fields templates as unsupported instead of dropping them', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export template blocks ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const gridUid = readback.tree.subModels.tabs[0].subModels.grid.uid;
    const templateBlockUid = uid();
    const fieldsTemplateBlockUid = uid();

    await context.flowRepo.upsertModel({
      uid: templateBlockUid,
      parentId: gridUid,
      subKey: 'items',
      subType: 'array',
      use: 'ListBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
        referenceSettings: {
          useTemplate: {
            templateUid: 'export-block-template',
            mode: 'reference',
          },
        },
      },
    });
    await context.flowRepo.upsertModel({
      uid: fieldsTemplateBlockUid,
      parentId: gridUid,
      subKey: 'items',
      subType: 'array',
      use: 'EditFormModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      },
    });
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: fieldsTemplateBlockUid,
      subKey: 'grid',
      subType: 'object',
      use: 'ReferenceFormGridModel',
      stepParams: {
        referenceSettings: {
          useTemplate: {
            templateUid: 'export-fields-template',
            mode: 'reference',
          },
        },
      },
    });

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('unsupported-template-summary');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.document.tabs[0].blocks.map((block) => block.key)).toContain('employeesTable');
    const templateBlock = exported.document.tabs[0].blocks.find((block) => block.type === 'list');
    expect(templateBlock?.template).toEqual({
      uid: 'export-block-template',
      mode: 'reference',
    });
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'block',
          use: 'EditFormModel',
          type: 'editForm',
          reasonCode: 'unsupported-template-summary',
        }),
      ]),
    );
  });

  it('should preserve popup template summaries and treat copied popup summaries as unsupported', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export popup template summaries ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const addAction = collectDescendantNodes(readback.tree, (item) => item?.use === 'AddNewActionModel')[0];
    const editAction = collectDescendantNodes(readback.tree, (item) => item?.use === 'EditActionModel')[0];
    expect(addAction?.uid).toBeTruthy();
    expect(editAction?.uid).toBeTruthy();

    await context.flowRepo.upsertModel({
      uid: addAction.uid,
      use: addAction.use,
      props: addAction.props,
      stepParams: {
        ...(addAction.stepParams || {}),
        popupSettings: {
          openView: {
            popupTemplateUid: 'export-popup-template',
            popupTemplateMode: 'reference',
            mode: 'drawer',
          },
        },
      },
    });
    await context.flowRepo.upsertModel({
      uid: editAction.uid,
      use: editAction.use,
      props: editAction.props,
      stepParams: {
        ...(editAction.stepParams || {}),
        popupSettings: {
          openView: {
            uid: 'external-copied-popup-host',
            popupTemplateContext: true,
            mode: 'dialog',
          },
        },
      },
    });

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('unsupported-template-summary');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.document.tabs[0].blocks.map((block) => block.key)).toContain('employeesTable');
    const [table] = exported.document.tabs[0].blocks;
    const exportedPopupTemplateAction = table.actions.find(
      (action) => action?.popup?.template?.uid === 'export-popup-template',
    );
    expect(exportedPopupTemplateAction?.popup?.template).toEqual({
      uid: 'export-popup-template',
      mode: 'reference',
    });
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'recordAction',
          use: 'EditActionModel',
          reasonCode: 'unsupported-template-summary',
        }),
      ]),
    );
  });

  it('should treat flowRegistry event flows as unsupported instead of exporting lossy specs', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export flow registry ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    await context.flowRepo.upsertModel({
      uid: readback.tree.uid,
      use: readback.tree.use,
      props: readback.tree.props,
      stepParams: readback.tree.stepParams,
      flowRegistry: {
        direct: {
          beforeRender: {
            uid: uid(),
          },
        },
      },
    });

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('unsupported-flow-registry');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'page',
          reasonCode: 'unsupported-flow-registry',
        }),
      ]),
    );
  });

  it('should treat unexported block settings as unsupported instead of dropping them', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export block settings ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const gridUid = readback.tree.subModels.tabs[0].subModels.grid.uid;
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: gridUid,
      subKey: 'items',
      subType: 'array',
      use: 'ListBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
        listSettings: {
          refreshData: {
            enabled: true,
          },
        },
      },
    });

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('unsupported-public-state');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.document.tabs[0].blocks.map((block) => block.key)).toContain('employeesTable');
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'block',
          use: 'ListBlockModel',
          type: 'list',
          reasonCode: 'unsupported-public-state',
        }),
      ]),
    );
  });

  it('should treat unexported field display settings as unsupported instead of dropping them', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export field settings ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const nicknameField = readFieldHost(readback, 'nickname');
    await context.flowRepo.upsertModel({
      uid: nicknameField.uid,
      use: nicknameField.use,
      props: nicknameField.props,
      stepParams: {
        ...(nicknameField.stepParams || {}),
        tableColumnSettings: {
          ...((nicknameField.stepParams?.tableColumnSettings as Record<string, unknown> | undefined) || {}),
          title: {
            title: 'Custom nickname',
          },
        },
        displayFieldSettings: {
          displayStyle: {
            displayStyle: 'tag',
          },
        },
      },
    });

    const defaultExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
      },
    });
    expect(defaultExportRes.status).toBe(400);
    expect(readErrorMessage(defaultExportRes)).toContain('cannot export field');

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    const [table] = exported.document.tabs[0].blocks;
    expect(table.fields.map(readFieldName)).toEqual(expect.arrayContaining(['email', 'phone']));
    expect(table.fields.map(readFieldName)).not.toContain('nickname');
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'field',
          reasonCode: 'unsupported-node',
        }),
      ]),
    );
  });

  it('should omit field linkage reactions that reference fields skipped in warn mode', async () => {
    const title = `Export skipped field linkage ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  { key: 'nicknameField', field: 'nickname' },
                  { key: 'statusField', field: 'status' },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const form = collectDescendantNodes(readback.tree, (item) => item?.use === 'CreateFormModel')[0];
    const formGrid = form?.subModels?.grid;
    const statusField = readFieldHost(readback, 'status');
    expect(formGrid?.uid).toBeTruthy();
    await markFieldUnsupported(context, statusField);
    await context.flowRepo.upsertModel({
      uid: formGrid.uid,
      parentId: formGrid.parentId,
      subKey: formGrid.subKey,
      subType: formGrid.subType,
      use: formGrid.use,
      props: formGrid.props,
      stepParams: {
        ...(formGrid.stepParams || {}),
        eventSettings: {
          linkageRules: {
            value: [
              {
                key: 'hideStatus',
                actions: [
                  {
                    key: 'hideStatusAction',
                    name: 'linkageSetFieldProps',
                    params: {
                      value: {
                        fields: [statusField.uid],
                        state: 'hidden',
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    const exportedForm = exported.document.tabs[0].blocks.find((block) => block.type === 'createForm');
    expect(exportedForm.fields.map(readFieldName)).toEqual(['nickname']);
    expect(exported.document.reaction?.items || []).toEqual([]);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'field',
          reasonCode: 'unsupported-node',
        }),
        expect.objectContaining({
          kind: 'reaction',
          reasonCode: 'unsupported-reaction-target-field',
        }),
      ]),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should omit field linkage reactions whose conditions reference fields skipped in warn mode', async () => {
    const title = `Export skipped field linkage condition ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  { key: 'nicknameField', field: 'nickname' },
                  { key: 'statusField', field: 'status' },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const form = collectDescendantNodes(readback.tree, (item) => item?.use === 'CreateFormModel')[0];
    const formGrid = form?.subModels?.grid;
    const statusField = readFieldHost(readback, 'status');
    expect(formGrid?.uid).toBeTruthy();
    await markFieldUnsupported(context, statusField);
    await context.flowRepo.upsertModel({
      uid: formGrid.uid,
      parentId: formGrid.parentId,
      subKey: formGrid.subKey,
      subType: formGrid.subType,
      use: formGrid.use,
      props: formGrid.props,
      stepParams: {
        ...(formGrid.stepParams || {}),
        eventSettings: {
          linkageRules: {
            value: [
              {
                key: 'hideNicknameWhenStatus',
                condition: {
                  logic: '$and',
                  items: [{ path: 'status', operator: '$eq', value: 'inactive' }],
                },
                then: [
                  {
                    key: 'hideNickname',
                    type: 'setFieldState',
                    fieldPaths: ['nickname'],
                    state: 'hidden',
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    const exportedForm = exported.document.tabs[0].blocks.find((block) => block.type === 'createForm');
    expect(exportedForm.fields.map(readFieldName)).toEqual(['nickname']);
    expect(exported.document.reaction?.items || []).toEqual([]);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'reaction',
          reasonCode: 'unsupported-reaction-target-field',
        }),
      ]),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should omit block and action linkage reactions whose conditions reference fields skipped in warn mode', async () => {
    const title = `Export skipped block action linkage condition ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: [
                  { key: 'nicknameField', field: 'nickname' },
                  { key: 'statusField', field: 'status' },
                ],
                actions: [{ key: 'addEmployee', type: 'addNew' }],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const table = readFirstTable(readback);
    const statusField = readFieldHost(readback, 'status');
    const addAction = collectDescendantNodes(readback.tree, (item) => item?.use === 'AddNewActionModel')[0];
    expect(addAction?.uid).toBeTruthy();
    await markFieldUnsupported(context, statusField);
    await context.flowRepo.upsertModel({
      uid: table.uid,
      use: table.use,
      props: table.props,
      stepParams: {
        ...(table.stepParams || {}),
        cardSettings: {
          ...((table.stepParams?.cardSettings as Record<string, unknown> | undefined) || {}),
          linkageRules: {
            value: [
              {
                key: 'hideTableWhenStatus',
                condition: {
                  logic: '$and',
                  items: [{ path: 'status', operator: '$eq', value: 'inactive' }],
                },
                then: [
                  {
                    key: 'hideTable',
                    type: 'setBlockState',
                    state: 'hidden',
                  },
                ],
              },
            ],
          },
        },
      },
    });
    await context.flowRepo.upsertModel({
      uid: addAction.uid,
      use: addAction.use,
      props: addAction.props,
      stepParams: {
        ...(addAction.stepParams || {}),
        buttonSettings: {
          ...((addAction.stepParams?.buttonSettings as Record<string, unknown> | undefined) || {}),
          linkageRules: {
            value: [
              {
                key: 'disableAddWhenStatus',
                condition: {
                  logic: '$and',
                  items: [{ path: 'status', operator: '$eq', value: 'inactive' }],
                },
                then: [
                  {
                    key: 'disableAdd',
                    type: 'setActionState',
                    state: 'disabled',
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    const [exportedTable] = exported.document.tabs[0].blocks;
    expect(exportedTable.fields.map(readFieldName)).toEqual(['nickname']);
    expect(exported.document.reaction?.items || []).toEqual([]);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'field',
          reasonCode: 'unsupported-node',
        }),
        expect.objectContaining({
          kind: 'reaction',
          reasonCode: 'unsupported-reaction-target-field',
        }),
      ]),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should omit field value reactions that reference fields skipped in warn mode', async () => {
    const title = `Export skipped field value ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  { key: 'nicknameField', field: 'nickname' },
                  { key: 'statusField', field: 'status' },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const form = collectDescendantNodes(readback.tree, (item) => item?.use === 'CreateFormModel')[0];
    const formGrid = form?.subModels?.grid;
    const statusField = readFieldHost(readback, 'status');
    expect(formGrid?.uid).toBeTruthy();
    await markFieldUnsupported(context, statusField);
    await context.flowRepo.upsertModel({
      uid: formGrid.uid,
      parentId: formGrid.parentId,
      subKey: formGrid.subKey,
      subType: formGrid.subType,
      use: formGrid.use,
      props: formGrid.props,
      stepParams: {
        ...(formGrid.stepParams || {}),
        formModelSettings: {
          ...((formGrid.stepParams?.formModelSettings as Record<string, unknown> | undefined) || {}),
          assignRules: {
            value: [
              {
                key: 'assignSkippedStatus',
                targetPath: 'status',
                mode: 'assign',
                value: 'inactive',
              },
              {
                key: 'assignNicknameWhenStatus',
                targetPath: 'nickname',
                mode: 'assign',
                condition: {
                  logic: '$and',
                  items: [{ path: 'status', operator: '$eq', value: 'inactive' }],
                },
                value: 'flagged',
              },
            ],
          },
        },
      },
    });

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    const exportedForm = exported.document.tabs[0].blocks.find((block) => block.type === 'createForm');
    expect(exportedForm.fields.map(readFieldName)).toEqual(['nickname']);
    expect(exported.document.reaction?.items || []).toEqual([]);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'reaction',
          reasonCode: 'unsupported-reaction-target-field',
        }),
      ]),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should preserve reactions that reference public context paths when unrelated fields are skipped', async () => {
    const title = `Export context path reactions ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  { key: 'nicknameField', field: 'nickname' },
                  { key: 'statusField', field: 'status' },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const form = collectDescendantNodes(readback.tree, (item) => item?.use === 'CreateFormModel')[0];
    const formGrid = form?.subModels?.grid;
    const statusField = readFieldHost(readback, 'status');
    expect(formGrid?.uid).toBeTruthy();
    await markFieldUnsupported(context, statusField);
    await context.flowRepo.upsertModel({
      uid: formGrid.uid,
      parentId: formGrid.parentId,
      subKey: formGrid.subKey,
      subType: formGrid.subType,
      use: formGrid.use,
      props: formGrid.props,
      stepParams: {
        ...(formGrid.stepParams || {}),
        formModelSettings: {
          ...((formGrid.stepParams?.formModelSettings as Record<string, unknown> | undefined) || {}),
          assignRules: {
            value: [
              {
                key: 'assignNicknameFromContext',
                targetPath: 'nickname',
                mode: 'assign',
                condition: {
                  logic: '$and',
                  items: [{ path: '{{ ctx.formValues.status }}', operator: '$eq', value: 'inactive' }],
                },
                value: '{{ ctx.formValues.nickname }}',
              },
            ],
          },
        },
      },
    });

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    const exportedForm = exported.document.tabs[0].blocks.find((block) => block.type === 'createForm');
    expect(exportedForm.fields.map(readFieldName)).toEqual(['nickname']);
    expect(exported.document.reaction?.items || []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'setFieldValueRules',
          target: 'mainTab.employeeForm',
          rules: [
            expect.objectContaining({
              targetPath: 'nickname',
              when: {
                logic: '$and',
                items: [{ path: 'formValues.status', operator: '$eq', value: 'inactive' }],
              },
              value: {
                source: 'path',
                path: 'formValues.nickname',
              },
            }),
          ],
        }),
      ]),
    );
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'field',
          reasonCode: 'unsupported-node',
        }),
      ]),
    );
    expect(exported.unsupported.some((item) => item.kind === 'reaction')).toBe(false);
  });

  it('should omit sub form linkage reactions that reference skipped nested fields in warn mode', async () => {
    const title = `Export skipped sub form linkage ${Date.now()}`;
    const createRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
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
            key: 'mainTab',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'departmentField',
                    field: 'department',
                    fieldType: 'subForm',
                    titleField: 'title',
                    fields: ['status', 'code'],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(createRes.status, readErrorMessage(createRes)).toBe(200);
    const pageSchemaUid = getData(createRes).target.pageSchemaUid as string;
    const readback = await readPage(rootAgent, pageSchemaUid);
    const departmentField = readFieldHost(readback, 'department');
    const codeField = readFieldHost(readback, 'department.code');
    expect(readFieldHost(readback, 'department.status')?.uid).toBeTruthy();
    const subFormField = collectDescendantNodes(departmentField, (item) => item?.use === 'SubFormFieldModel')[0];
    expect(subFormField?.uid).toBeTruthy();
    await context.flowRepo.upsertModel({
      uid: subFormField.uid,
      parentId: subFormField.parentId,
      subKey: subFormField.subKey,
      subType: subFormField.subType,
      use: subFormField.use,
      props: subFormField.props,
      subModels: subFormField.subModels,
      stepParams: {
        ...(subFormField.stepParams || {}),
        eventSettings: {
          linkageRules: {
            value: [
              {
                key: 'hideSkippedCode',
                actions: [
                  {
                    key: 'hideSkippedCodeAction',
                    name: 'subFormLinkageSetFieldProps',
                    params: {
                      value: {
                        fields: [codeField.uid],
                        state: 'hidden',
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    });
    await markFieldUnsupported(context, codeField);

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    const exportedForm = exported.document.tabs[0].blocks.find((block) => block.type === 'createForm');
    const exportedDepartmentField = exportedForm.fields.find((field) => field?.field === 'department');
    expect(exportedDepartmentField).toMatchObject({
      field: 'department',
      fieldType: 'subForm',
      fields: ['status'],
    });
    expect(exported.document.reaction?.items || []).toEqual([]);
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'field',
          reasonCode: 'unsupported-node',
        }),
        expect.objectContaining({
          kind: 'reaction',
          reasonCode: 'unsupported-reaction-target-field',
        }),
      ]),
    );

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
  });

  it('should drop fully unsupported tabs in warn mode instead of returning an invalid document', async () => {
    const pageSchemaUid = await createExportSourcePage(rootAgent, `Export unsupported tab ${Date.now()}`);
    const readback = await readPage(rootAgent, pageSchemaUid);
    const addTabResult = getData(
      await rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: {
            uid: readback.tree.uid,
          },
          title: 'Unsupported only',
        },
      }),
    );
    const unsupportedTabGrid = await context.flowRepo.findModelByParentId(addTabResult.tabSchemaUid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    expect(unsupportedTabGrid?.uid).toBeTruthy();
    await context.flowRepo.upsertModel({
      uid: uid(),
      parentId: unsupportedTabGrid.uid,
      subKey: 'items',
      subType: 'array',
      use: 'UnknownBlockModel',
    });

    const warnExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid,
        },
        options: {
          unsupported: 'warn',
        },
      },
    });
    expect(warnExportRes.status, readErrorMessage(warnExportRes)).toBe(200);
    const exported = getData(warnExportRes);
    expect(exported.document.tabs).toHaveLength(1);
    expect(exported.document.tabs[0].key).toBe('overviewTab');
    expect(exported.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'tab',
          reasonCode: 'empty-tab',
        }),
      ]),
    );
  });
});
