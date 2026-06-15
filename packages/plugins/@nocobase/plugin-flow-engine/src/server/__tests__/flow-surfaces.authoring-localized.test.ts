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
  expectStructuredError,
  getComposeBlock,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';

describe('flowSurfaces backend authoring localized compiler', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should aggregate addBlock authoring errors before write side effects', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized addBlock page',
      tabTitle: 'Authoring localized addBlock tab',
    });

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'kanban',
        fieldGroups: [
          {
            title: '',
            fields: [],
          },
        ],
        fieldsLayout: { rows: [] },
        recordActions: [{ key: 'view', type: 'view' }],
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, [
      'fieldsLayout-fieldGroups-mutually-exclusive',
      'kanban-main-block-unsupported-fieldGroups',
      'kanban-main-block-unsupported-recordActions',
      'kanban-main-block-unsupported-fieldsLayout',
      'fieldGroups-group-title-required',
      'fieldGroups-group-fields-required',
    ]);
    const kanbanFieldGroupsError = response.body.errors.find(
      (error: any) => error.ruleId === 'kanban-main-block-unsupported-fieldGroups',
    );
    expect(kanbanFieldGroupsError?.details?.repairHint).toContain('settings.groupField');
    expect(kanbanFieldGroupsError?.details?.repairHint).toContain('Keep block type kanban');
  });

  it('should aggregate addBlocks item authoring errors before batch writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized addBlocks page',
      tabTitle: 'Authoring localized addBlocks tab',
    });

    const response = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: { uid: page.tabSchemaUid },
        blocks: [
          {
            key: 'badTree',
            type: 'tree',
            fields: ['title'],
            fieldGroups: [],
            fieldsLayout: { rows: [] },
            actions: [{ key: 'refresh', type: 'refresh' }],
            recordActions: [{ key: 'view', type: 'view' }],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, [
      'fields-fieldGroups-mutually-exclusive',
      'fieldsLayout-fieldGroups-mutually-exclusive',
      'tree-main-block-unsupported-fields',
      'tree-main-block-unsupported-fieldGroups',
      'tree-main-block-unsupported-actions',
      'tree-main-block-unsupported-recordActions',
      'tree-main-block-unsupported-fieldsLayout',
      'fieldGroups-invalid-shape',
    ]);
  });

  it('should aggregate configure authoring errors with resolved host context', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized configure page',
      tabTitle: 'Authoring localized configure tab',
    });
    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        defaultFilter: employeeDefaultFilter(),
        fields: ['nickname'],
      },
    });
    const tableUid = getData(addRes).uid;

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: tableUid },
        changes: {
          fieldGroups: [
            {
              title: 'Main',
              fields: ['title'],
            },
          ],
          fieldsLayout: { rows: [] },
        },
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, [
      'configure-fieldsLayout-fieldGroups-mutually-exclusive',
      'fieldGroups-host-unsupported',
      'fieldsLayout-host-unsupported',
    ]);
  });

  it('should aggregate configure chart errors with resolved host context', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized chart configure page',
      tabTitle: 'Authoring localized chart configure tab',
    });
    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'chart',
        settings: {
          query: {
            mode: 'builder',
            collectionPath: ['main', 'employees'],
            measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          },
        },
      },
    });

    expect(addRes.status).toBe(200);
    const chartUid = getData(addRes).uid;
    expect(chartUid).toBeTruthy();

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
        changes: {
          displayTitle: true,
          query: {
            mode: 'builder',
            collectionPath: ['main', 'employees'],
            measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
            dimensions: [{ field: 'department.title' }],
          },
        },
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, ['chart-display-title-unsupported']);
  });

  it('should aggregate configure gridCard settings errors with resolved host context', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized gridCard configure page',
      tabTitle: 'Authoring localized gridCard configure tab',
    });
    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'gridCard',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        defaultFilter: employeeDefaultFilter(),
        fields: ['nickname'],
      },
    });

    expect(addRes.status).toBe(200);
    const gridCardUid = getData(addRes).uid;

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: gridCardUid },
        changes: {
          columns: {
            xs: 1,
            md: 0,
          },
          rowCount: 0,
          displayTitle: true,
        },
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, [
      'gridCard-columns-missing-breakpoints',
      'gridCard-columns-invalid-breakpoints',
      'gridCard-rowCount-invalid',
      'grid-card-settings-unsupported',
    ]);
  });

  it('should aggregate configure defaultFilter errors with resolved table metadata', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized table configure page',
      tabTitle: 'Authoring localized table configure tab',
    });
    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        defaultFilter: employeeDefaultFilter(),
        fields: ['nickname'],
      },
    });

    expect(addRes.status).toBe(200);
    const tableUid = getData(addRes).uid;
    expect(tableUid).toBeTruthy();

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: tableUid },
        changes: {
          defaultFilter: {
            missingEmployeeField: {
              $eq: 'active',
            },
          },
        },
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, ['field-path-unknown']);
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.changes.defaultFilter.missingEmployeeField']),
    );
  });

  it('should aggregate tree connectFields live target errors before configure side effects', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized tree connectFields page',
      tabTitle: 'Authoring localized tree connectFields tab',
    });
    const treeRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'tree',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      },
    });
    expect(treeRes.status).toBe(200);
    const treeUid = getData(treeRes).uid;

    const departmentsTableRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'departments',
        },
        defaultFilter: departmentDefaultFilter(),
        fields: ['title'],
      },
    });
    expect(departmentsTableRes.status).toBe(200);
    const departmentsTableUid = getData(departmentsTableRes).uid;

    const employeesTableRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        defaultFilter: employeeDefaultFilter(),
        fields: ['nickname'],
      },
    });
    expect(employeesTableRes.status).toBe(200);
    const employeesTableUid = getData(employeesTableRes).uid;

    const markdownRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'markdown',
        settings: {
          content: 'Unsupported tree connectFields target',
        },
      },
    });
    expect(markdownRes.status).toBe(200);
    const markdownUid = getData(markdownRes).uid;

    const otherPage = await createPage(rootAgent, {
      title: 'Authoring localized tree connectFields other page',
      tabTitle: 'Authoring localized tree connectFields other tab',
    });
    const otherTableRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: otherPage.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        defaultFilter: employeeDefaultFilter(),
        fields: ['nickname'],
      },
    });
    expect(otherTableRes.status).toBe(200);
    const otherTableUid = getData(otherTableRes).uid;

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: treeUid },
        changes: {
          fieldNames: {
            key: 'nickname',
          },
          connectFields: {
            targets: [
              { targetId: 'missing-tree-connect-target', filterPaths: ['id'] },
              { targetId: treeUid, filterPaths: ['id'] },
              { targetId: markdownUid, filterPaths: ['id'] },
              { targetId: otherTableUid, filterPaths: ['id'] },
              { targetId: departmentsTableUid },
              { targetId: employeesTableUid, filterPaths: ['missingEmployeeField', 'id'] },
            ],
          },
        },
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, [
      'tree-connectFields-target-not-found',
      'tree-connectFields-target-self',
      'tree-connectFields-target-unsupported',
      'tree-connectFields-target-grid-mismatch',
      'tree-connectFields-filterPaths-required',
      'tree-connectFields-filterPath-unknown',
      'tree-connectFields-filterPath-type-mismatch',
    ]);
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.changes.connectFields.targets[0]',
        '$.changes.connectFields.targets[1]',
        '$.changes.connectFields.targets[2]',
        '$.changes.connectFields.targets[3]',
        '$.changes.connectFields.targets[4].filterPaths',
        '$.changes.connectFields.targets[5].filterPaths[0]',
        '$.changes.connectFields.targets[5].filterPaths[1]',
      ]),
    );
    const gridAfterFailedConfigure = await context.flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect((gridAfterFailedConfigure?.filterManager || []).some((item: any) => item?.filterId === treeUid)).toBe(false);
  });

  it('should auto-generate addBlock data surface defaultFilter from live metadata', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized missing default filter page',
      tabTitle: 'Authoring localized missing default filter tab',
    });

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        fields: ['nickname'],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
    const tableUid = getData(response).uid;
    const readback = await getSurface(rootAgent, { uid: tableUid });
    const filterAction = (readback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'FilterActionModel',
    );
    expect(filterAction?.props?.defaultFilterValue?.items.map((item: any) => item.path)).toEqual([
      'nickname',
      'email',
      'status',
      'phone',
    ]);
    expect(filterAction?.props?.filterableFieldNames).toBeUndefined();
    expect(filterAction?.stepParams?.filterSettings?.filterableFieldNames).toBeUndefined();
  });

  it('should use explicit addBlock defaultFilter without backend field selection', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized explicit default filter page',
      tabTitle: 'Authoring localized explicit default filter tab',
    });

    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        defaultFilter: employeeDefaultFilter(),
        fields: ['nickname'],
      },
    });

    expect(addRes.status).toBe(200);
    const tableUid = getData(addRes).uid;
    const readback = await getSurface(rootAgent, { uid: tableUid });
    const filterAction = (readback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'FilterActionModel',
    );

    expect(filterAction?.props?.defaultFilterValue).toEqual(employeeDefaultFilter());
    expect(filterAction?.props?.filterValue).toEqual(filterAction?.props?.defaultFilterValue);
    expect(filterAction?.stepParams?.filterSettings?.defaultFilter?.defaultFilter).toEqual(
      filterAction?.props?.defaultFilterValue,
    );
    expect(filterAction?.props?.defaultFilterValue?.items).toHaveLength(employeeDefaultFilter().items.length);
    expect(filterAction?.props?.defaultFilterValue?.items.map((item: any) => item.path)).toEqual(
      employeeDefaultFilter().items.map((item: any) => item.path),
    );
  });

  it('should reject relation child paths in UI Builder supplied defaultFilter', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized relation child default filter page',
      tabTitle: 'Authoring localized relation child default filter tab',
    });
    const relationChildDefaultFilter = {
      logic: '$and',
      items: [
        { path: 'nickname', operator: '$notEmpty' },
        { path: 'status', operator: '$notEmpty' },
        { path: 'email', operator: '$notEmpty' },
        { path: 'department.title', operator: '$notEmpty' },
      ],
    };

    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        defaultFilter: relationChildDefaultFilter,
        fields: ['nickname'],
      },
    });

    expect(addRes.status).toBe(400);
    expect(addRes.body?.errors).toEqual(expect.any(Array));
    expect(addRes.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'defaultFilter-field-ineligible',
          path: '$.defaultFilter.items[3].path',
        }),
      ]),
    );
  });

  it('should strip addBlock single-scope non-template data block titles before persisting', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized title cleanup page',
      tabTitle: 'Authoring localized title cleanup tab',
    });

    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        title: 'Should not persist',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        settings: {
          title: 'Should not persist either',
        },
        defaultFilter: employeeDefaultFilter(),
        fields: ['nickname'],
      },
    });

    expect(addRes.status).toBe(200);
    const tableUid = getData(addRes).uid;
    const readback = await getSurface(rootAgent, { uid: tableUid });
    expect(readback.tree?.props?.title).toBeUndefined();
    expect(readback.tree?.stepParams?.cardSettings?.titleDescription?.title).toBeUndefined();
  });

  it('should strip compose single-scope titles and preserve addBlocks multi-block titles', async () => {
    const composePage = await createPage(rootAgent, {
      title: 'Authoring compose title cleanup page',
      tabTitle: 'Authoring compose title cleanup tab',
    });
    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: composePage.tabSchemaUid },
        blocks: [
          {
            key: 'singleTable',
            type: 'table',
            title: 'Should not persist',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            settings: {
              title: 'Should not persist either',
            },
            defaultFilter: employeeDefaultFilter(),
            fields: ['nickname'],
          },
        ],
      },
    });

    const composeData = getData(composeRes);
    const singleTable = getComposeBlock(composeData, 'singleTable');
    const singleReadback = await getSurface(rootAgent, { uid: singleTable.uid });
    expect(singleReadback.tree?.props?.title).toBeUndefined();
    expect(singleReadback.tree?.stepParams?.cardSettings?.titleDescription?.title).toBeUndefined();

    const addBlocksPage = await createPage(rootAgent, {
      title: 'Authoring addBlocks title preservation page',
      tabTitle: 'Authoring addBlocks title preservation tab',
    });
    const addBlocksRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: { uid: addBlocksPage.tabSchemaUid },
        blocks: [
          {
            key: 'employeesTable',
            type: 'table',
            title: 'Employees table',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            defaultFilter: employeeDefaultFilter(),
            fields: ['nickname'],
          },
          {
            key: 'employeesList',
            type: 'list',
            title: 'Employees list',
            resourceInit: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            defaultFilter: employeeDefaultFilter(),
            fields: ['nickname'],
          },
        ],
      },
    });

    const addBlocksData = getData(addBlocksRes);
    const tableUid = addBlocksData.blocks[0]?.result?.uid;
    const listUid = addBlocksData.blocks[1]?.result?.uid;
    const tableReadback = await getSurface(rootAgent, { uid: tableUid });
    const listReadback = await getSurface(rootAgent, { uid: listUid });
    expect(tableReadback.tree?.stepParams?.cardSettings?.titleDescription?.title).toBe('Employees table');
    expect(listReadback.tree?.stepParams?.cardSettings?.titleDescription?.title).toBe('Employees list');
  });

  it('should aggregate addBlock field metadata errors from resourceInit', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized resourceInit metadata page',
      tabTitle: 'Authoring localized resourceInit metadata tab',
    });

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'table',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        defaultFilter: employeeDefaultFilter(),
        fields: ['missingEmployeeField'],
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, ['field-path-unknown']);
    expect(response.body.errors.map((error: any) => error.path)).toEqual(expect.arrayContaining(['$.fields[0]']));
  });

  it('should resolve configure popup reaction targets from popup-local keys', async () => {
    const validErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        changes: {
          popup: {
            blocks: [
              {
                key: 'details',
                type: 'details',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            reaction: {
              items: [
                {
                  target: 'details',
                  effects: [],
                },
              ],
            },
          },
        },
      },
      {
        hostBlockType: 'TableBlockModel',
        getCollection: (dataSourceKey, collectionName) =>
          context.db.getCollection(dataSourceKey === 'main' ? collectionName : `${dataSourceKey}.${collectionName}`),
      },
    );

    expect(validErrors).toHaveLength(0);

    const invalidErrors = await collectFlowSurfaceAuthoringErrors('configure', {
      changes: {
        popup: {
          blocks: [
            {
              key: 'details',
              type: 'details',
            },
          ],
          reaction: {
            items: [
              {
                target: 'missingDetails',
                effects: [],
              },
            ],
          },
        },
      },
    });

    expect(invalidErrors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['reaction-target-unknown']),
    );
    expect(invalidErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.changes.popup.reaction.items[0].target']),
    );
  });

  it('should aggregate calendar hidden popup chart authoring errors during configure', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized calendar hidden popup page',
      tabTitle: 'Authoring localized calendar hidden popup tab',
    });
    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'calendar',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'calendar_events',
        },
        defaultFilter: calendarDefaultFilter(),
        settings: {
          titleField: 'title',
          startField: 'startsAt',
          endField: 'endsAt',
        },
      },
    });
    expect(addRes.status).toBe(200);
    const calendarUid = getData(addRes).uid;

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: calendarUid },
        changes: {
          quickCreatePopup: {
            blocks: [
              {
                key: 'popupChart',
                type: 'chart',
                settings: {
                  displayTitle: true,
                  query: {
                    mode: 'builder',
                    collectionPath: ['main', 'employees'],
                    measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                    dimensions: [{ field: 'department.title' }],
                  },
                },
              },
            ],
          },
        },
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, ['chart-display-title-unsupported']);
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.changes.quickCreatePopup.blocks[0].settings.displayTitle']),
    );
  });

  it('should aggregate kanban hidden popup chart authoring errors during configure', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring localized kanban hidden popup page',
      tabTitle: 'Authoring localized kanban hidden popup tab',
    });
    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'kanban',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'kanban_tasks',
        },
        defaultFilter: kanbanDefaultFilter(),
        fields: ['title'],
        settings: {
          groupField: 'status',
          dragSortBy: 'status_sort',
        },
      },
    });
    expect(addRes.status).toBe(200);
    const kanbanUid = getData(addRes).uid;

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: kanbanUid },
        changes: {
          cardPopup: {
            blocks: [
              {
                key: 'popupChart',
                type: 'chart',
                settings: {
                  displayTitle: true,
                },
              },
            ],
          },
        },
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, ['chart-display-title-unsupported']);
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.changes.cardPopup.blocks[0].settings.displayTitle']),
    );
  });

  it('should aggregate localized unsupported field host and empty defaultFilter errors', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badTable',
            type: 'table',
            collection: 'employees',
            fields: ['nickname'],
            fieldGroups: [
              {
                title: 'Unsupported',
                fields: ['nickname'],
              },
            ],
            fieldsLayout: {
              rows: [['nickname']],
            },
            defaultFilter: {
              logic: '$and',
              items: [],
            },
            settings: {
              sort: ['-createdAt'],
              sorting: [{ field: 'createdAt', direction: 'asc' }],
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    assertAggregateRuleIds(response, [
      'fieldGroups-host-unsupported',
      'fieldsLayout-host-unsupported',
      'defaultFilter-explicit-empty',
      'sort-alias-conflict',
    ]);
  });
});

function assertAggregateRuleIds(response: any, ruleIds: string[]) {
  expect(response.body?.errors).toEqual(expect.any(Array));
  for (const error of response.body.errors) {
    expectStructuredError(error, {
      status: 400,
      type: 'bad_request',
    });
    expect(error.path).toEqual(expect.any(String));
    expect(error.ruleId).toEqual(expect.any(String));
  }
  expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(expect.arrayContaining(ruleIds));
}

function employeeDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'nickname', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'email', operator: '$notEmpty' },
      { path: 'phone', operator: '$notEmpty' },
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

function kanbanDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'title', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'priority', operator: '$notEmpty' },
      { path: 'scope', operator: '$notEmpty' },
    ],
  };
}

function departmentDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'title', operator: '$notEmpty' },
      { path: 'code', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'scope', operator: '$notEmpty' },
    ],
  };
}
