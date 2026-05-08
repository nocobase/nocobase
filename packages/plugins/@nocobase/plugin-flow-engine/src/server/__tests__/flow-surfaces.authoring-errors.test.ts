/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createMenu,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

describe('flowSurfaces backend authoring aggregate errors', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should return all authoring validation errors with stable locations before compose writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring aggregate errors page',
      tabTitle: 'Authoring aggregate errors tab',
    });

    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.tabSchemaUid },
        blocks: [
          {
            key: 'badCalendar',
            type: 'calendar',
            fields: ['title'],
            fieldGroups: [
              {
                title: '',
                fields: [],
              },
            ],
            fieldsLayout: { rows: [] },
            recordActions: [{ key: 'view', type: 'view' }],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.length).toBeGreaterThanOrEqual(8);
    for (const error of response.body.errors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
      expect(error.path).toEqual(expect.any(String));
      expect(error.ruleId).toEqual(expect.any(String));
    }
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'fields-fieldGroups-mutually-exclusive',
        'fieldsLayout-fieldGroups-mutually-exclusive',
        'calendar-main-block-unsupported-fields',
        'calendar-main-block-unsupported-fieldGroups',
        'calendar-main-block-unsupported-recordActions',
        'calendar-main-block-unsupported-fieldsLayout',
        'fieldGroups-group-title-required',
        'fieldGroups-group-fields-required',
      ]),
    );
  });

  it('should aggregate deterministic authoring hard errors before target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badTable',
            type: 'table',
            layout: {
              rows: [['badLocalLayoutKey']],
            },
            fields: ['title'],
            fieldGroups: [
              {
                title: 'Table fields',
                fields: ['title'],
              },
            ],
            fieldsLayout: {
              rows: [['title', 'missingField'], ['title']],
            },
            defaultFilter: {
              logic: '$and',
              items: [],
            },
            settings: {
              sort: ['-createdAt'],
              sorting: [
                {
                  field: 'createdAt',
                  direction: 'asc',
                },
              ],
              connectFields: {
                targets: [
                  {
                    filterPaths: [''],
                  },
                ],
              },
            },
            popup: {
              template: { uid: 'template-uid' },
              saveAsTemplate: {
                name: 'Conflicting popup template',
                description: 'Should fail before write.',
              },
            },
            actions: [
              {
                key: 'badBulkAssign',
                type: 'bulkUpdate',
                settings: {
                  assignValues: ['title'],
                },
              },
              {
                key: 'legacyTopLevelAssign',
                type: 'bulkUpdate',
                assignValues: {
                  status: 'inactive',
                },
              },
              {
                key: 'misplacedUpdateRecord',
                type: 'updateRecord',
              },
              {
                key: 'badJs',
                type: 'jsItem',
              },
              {
                key: 'actionPopupReaction',
                type: 'popup',
                popup: {
                  blocks: [
                    {
                      key: 'actionPopupDetails',
                      type: 'details',
                      collection: 'employees',
                      fields: ['title'],
                    },
                  ],
                  reaction: {
                    items: [
                      {
                        target: 'actionPopupDetails',
                        rules: [],
                      },
                    ],
                  },
                },
              },
            ],
            reaction: {
              items: [
                {
                  target: 'missingLocalTarget',
                  effects: [],
                },
              ],
            },
          },
          {
            key: 'badGridCard',
            type: 'gridCard',
            settings: {
              columns: {
                xs: 1,
                md: 0,
              },
              rowCount: 0,
              displayTitle: true,
              cardTemplate: 'legacy-card',
            },
          },
          {
            key: 'badCalendarBinding',
            type: 'calendar',
            collection: 'calendar_events',
            settings: {
              startField: 'missingStartAt',
            },
            recordActions: [
              {
                key: 'badCalendarJsItem',
                type: 'jsItem',
                source: 'return null;',
              },
            ],
          },
          {
            key: 'badDetailsJsItem',
            type: 'details',
            actions: [
              {
                key: 'badDetailsJsItem',
                type: 'jsItem',
                source: 'return null;',
              },
            ],
          },
          {
            key: 'badKanbanBinding',
            type: 'kanban',
            collection: 'kanban_tasks',
            settings: {
              groupField: 'missingStatus',
            },
          },
          {
            key: 'badChartBuilderRelation',
            type: 'chart',
            settings: {
              displayTitle: true,
              query: {
                mode: 'builder',
                collectionPath: ['main', 'employees'],
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.title' }],
                sorting: [{ field: ['department', 'title'], direction: 'asc' }],
              },
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'block-layout-unsupported',
        'fieldGroups-host-unsupported',
        'fieldsLayout-host-unsupported',
        'fieldsLayout-unknown-field-key',
        'fieldsLayout-duplicate-field-key',
        'defaultFilter-explicit-empty',
        'sort-alias-conflict',
        'tree-connectFields-target-required',
        'tree-connectFields-filterPath-invalid-shape',
        'popup-saveAsTemplate-template-conflict',
        'assignValues-invalid-shape',
        'assignValues-top-level-unsupported',
        'update-record-must-use-record-actions',
        'jsItem-source-required',
        'reaction-target-unknown',
        'gridCard-columns-missing-breakpoints',
        'gridCard-columns-invalid-breakpoints',
        'gridCard-rowCount-invalid',
        'grid-card-settings-unsupported',
        'calendar-semantic-field-unknown',
        'js-item-action-slot-unsupported',
        'kanban-semantic-field-unknown',
        'chart-display-title-unsupported',
        'chart-builder-relation-field-runtime-unsupported',
      ]),
    );
    for (const error of response.body.errors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
      expect(error.path).toEqual(expect.any(String));
      expect(error.ruleId).toEqual(expect.any(String));
    }
    const errorKeys = response.body.errors.map((error: any) => `${error.path}:${error.ruleId}`);
    expect(new Set(errorKeys).size).toBe(errorKeys.length);
  });

  it('should aggregate unknown tab and popup layout keys before applyBlueprint writes', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring bad layout page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            layout: {
              rows: [['knownTable', 'missingTabBlock']],
            },
            blocks: [
              {
                key: 'knownTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                actions: [
                  {
                    key: 'view',
                    type: 'view',
                    popup: {
                      layout: {
                        rows: [['knownPopupDetails', 'missingPopupBlock']],
                      },
                      blocks: [
                        {
                          key: 'knownPopupDetails',
                          type: 'details',
                          collection: 'employees',
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

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['block-layout-unknown-key']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.tabs[0].layout.rows[0][1]', '$.tabs[0].blocks[0].actions[0].popup.layout.rows[0][1]']),
    );
    for (const error of response.body.errors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
      expect(error.path).toEqual(expect.any(String));
      expect(error.ruleId).toEqual(expect.any(String));
    }
  });

  it('should aggregate live metadata field errors before write target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badEmployeeTable',
            type: 'table',
            collection: 'employees',
            fields: ['nickname', 'missingField'],
            fieldGroups: [
              {
                title: 'Main',
                fields: ['status', 'missingGroupField'],
              },
            ],
            defaultFilter: {
              missingFilterField: {
                $eq: 'active',
              },
            },
            actions: [
              {
                key: 'badBulkUpdate',
                type: 'bulkUpdate',
                settings: {
                  assignValues: {
                    missingAssignField: 'draft',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['field-path-unknown']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].fields[1]',
        '$.blocks[0].fieldGroups[0].fields[1]',
        '$.blocks[0].defaultFilter.missingFilterField',
        '$.blocks[0].actions[0].settings.assignValues.missingAssignField',
      ]),
    );
    for (const error of response.body.errors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
      expect(error.path).toEqual(expect.any(String));
      expect(error.ruleId).toEqual(expect.any(String));
    }
  });

  it('should aggregate legacy action slot errors before write target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badDetailsActions',
            type: 'details',
            actions: [
              { key: 'badAddChild', type: 'addChild' },
              { key: 'badUpdateRecord', type: 'updateRecord' },
            ],
            recordActions: [{ key: 'badBulkUpdate', type: 'bulkUpdate' }],
          },
          {
            key: 'badCalendarActions',
            type: 'calendar',
            template: { uid: 'calendar-template-uid' },
            actions: [{ key: 'badCalendarAction', type: 'updateRecord' }],
          },
          {
            key: 'badKanbanActions',
            type: 'kanban',
            template: { uid: 'kanban-template-uid' },
            actions: [{ key: 'badKanbanAction', type: 'bulkUpdate' }],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'add-child-must-use-record-actions',
        'update-record-must-use-record-actions',
        'bulk-update-must-use-actions',
        'calendar-action-unsupported',
        'kanban-action-unsupported',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].actions[0]',
        '$.blocks[0].actions[1]',
        '$.blocks[0].recordActions[0]',
        '$.blocks[1].actions[0]',
        '$.blocks[2].actions[0]',
      ]),
    );
  });

  it('should aggregate template-backed data surface default overrides before write target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'templateBackedTableWithDefaultFilter',
            type: 'table',
            template: { uid: 'table-template-uid' },
            defaultFilter: {
              logic: '$and',
              items: [{ path: 'nickname', operator: '$notEmpty' }],
            },
          },
          {
            key: 'templateBackedGridWithDefaultActionSettings',
            type: 'gridCard',
            template: { uid: 'grid-template-uid' },
            defaultActionSettings: {
              filter: {
                defaultFilter: {
                  logic: '$and',
                  items: [{ path: 'nickname', operator: '$notEmpty' }],
                },
              },
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'data-surface-block-default-filter-template-unsupported',
        'data-surface-block-default-action-settings-template-unsupported',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.blocks[0].defaultFilter', '$.blocks[1].defaultActionSettings']),
    );
  });

  it('should aggregate filter action settings metadata errors before write target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badFilterActionTable',
            type: 'table',
            collection: 'employees',
            actions: [
              {
                key: 'filter',
                type: 'filter',
                settings: {
                  filterableFieldNames: ['nickname', 'missingFilterableField'],
                  defaultFilter: {
                    logic: '$and',
                    items: [
                      {
                        path: 'missingFilterField',
                        operator: '$notEmpty',
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['field-path-unknown', 'defaultFilter-filterable-field-missing']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].actions[0].settings.filterableFieldNames[1]',
        '$.blocks[0].actions[0].settings.defaultFilter.items[0].path',
      ]),
    );
  });

  it('should reject invalid defaultFilter field paths and operators before write target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'relationLeafTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [{ path: 'department', operator: '$notEmpty' }],
            },
          },
          {
            key: 'invalidItemOperatorTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [{ path: 'nickname', operator: '$definitelyBad' }],
            },
          },
          {
            key: 'invalidMapOperatorTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [{ path: 'nickname', operator: '$notEmpty' }],
              nickname: {
                $definitelyBad: 'active',
              },
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['defaultFilter-relation-field-unsupported', 'defaultFilter-invalid-operator']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].defaultFilter.items[0].path',
        '$.blocks[1].defaultFilter.items[0].operator',
        '$.blocks[2].defaultFilter.nickname.$definitelyBad',
      ]),
    );
  });

  it('should only let filter actions consume defaultFilter settings', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badViewActionFilterSettingsTable',
            type: 'table',
            collection: 'employees',
            actions: [
              {
                key: 'view',
                type: 'view',
                settings: {
                  filterableFieldNames: ['nickname'],
                  defaultFilter: {
                    logic: '$and',
                    items: [{ path: 'nickname', operator: '$notEmpty' }],
                  },
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'defaultFilter-action-settings-unsupported',
        'filterableFieldNames-action-settings-unsupported',
        'public-data-surface-default-filter-required',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].actions[0].settings.defaultFilter',
        '$.blocks[0].actions[0].settings.filterableFieldNames',
        '$.blocks[0].defaultFilter',
      ]),
    );
  });

  it('should validate filter action filterableFieldNames against inherited defaultFilter', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badInheritedFilterableTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [{ path: 'nickname', operator: '$notEmpty' }],
            },
            actions: [
              {
                key: 'filter',
                type: 'filter',
                settings: {
                  filterableFieldNames: ['status'],
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['defaultFilter-filterable-field-missing']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.blocks[0].defaultFilter.items[0].path']),
    );
  });

  it('should reject defaultFilter that misses common business fields when live metadata has enough candidates', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'thinDefaultFilterTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [{ path: 'nickname', operator: '$notEmpty' }],
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['defaultFilter-common-fields-incomplete']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.blocks[0].defaultFilter.items']),
    );
  });

  it('should aggregate explicit invalid defaultFilter shapes before write target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'arrayFilterTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: [],
          },
          {
            key: 'stringFilterTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: 'nickname',
          },
          {
            key: 'missingItemsTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
            },
          },
          {
            key: 'invalidLogicTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$bad',
              items: [{ path: 'nickname', operator: '$notEmpty' }],
            },
          },
          {
            key: 'missingOperatorTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [{ path: 'nickname' }],
            },
          },
          {
            key: 'actionSettingsFilterTable',
            type: 'table',
            collection: 'employees',
            actions: [
              {
                key: 'filter',
                type: 'filter',
                settings: {
                  defaultFilter: {
                    logic: '$and',
                    items: [{ path: 'nickname' }],
                  },
                },
              },
            ],
          },
          {
            key: 'defaultActionSettingsFilterTable',
            type: 'table',
            collection: 'employees',
            defaultActionSettings: {
              filter: {
                defaultFilter: {
                  logic: '$and',
                  items: [{ path: 'nickname' }],
                },
              },
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'defaultFilter-invalid-shape',
        'defaultFilter-items-required',
        'defaultFilter-invalid-logic',
        'defaultFilter-item-invalid-shape',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].defaultFilter',
        '$.blocks[1].defaultFilter',
        '$.blocks[2].defaultFilter.items',
        '$.blocks[3].defaultFilter.logic',
        '$.blocks[4].defaultFilter.items[0]',
        '$.blocks[5].actions[0].settings.defaultFilter.items[0]',
        '$.blocks[6].defaultActionSettings.filter.defaultFilter.items[0]',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain(
      'public-data-surface-default-filter-required',
    );
    for (const error of response.body.errors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
    }
  });

  it('should aggregate explicit relation titleField errors before write target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badRelationTitleFields',
            type: 'details',
            collection: 'employees',
            fields: [
              {
                fieldPath: 'department',
                titleField: 'missingDepartmentTitle',
                popup: {
                  blocks: [
                    {
                      type: 'details',
                      resource: {
                        binding: 'currentRecord',
                        collectionName: 'flow_surface_profiles',
                      },
                    },
                    {
                      type: 'table',
                      resource: {
                        binding: 'currentRecord',
                      },
                    },
                    {
                      type: 'list',
                      resource: {
                        binding: 'associatedRecords',
                        associationField: 'profile',
                      },
                    },
                  ],
                },
              },
              {
                fieldPath: 'department',
                titleField: 'id',
              },
              {
                fieldPath: 'status',
                titleField: 'nickname',
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'relation-titleField-unknown',
        'relation-titleField-unreadable',
        'relation-titleField-non-association',
        'relation-popup-current-record-target-mismatch',
        'relation-popup-associated-records-binding-required',
        'relation-popup-associated-records-association-field-required',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].fields[0].titleField',
        '$.blocks[0].fields[0].popup.blocks[0].resource.collectionName',
        '$.blocks[0].fields[0].popup.blocks[1].resource.binding',
        '$.blocks[0].fields[0].popup.blocks[2].resource.associationField',
        '$.blocks[0].fields[1].titleField',
        '$.blocks[0].fields[2].titleField',
      ]),
    );
  });

  it('should aggregate ambiguous navigation group titles before applyBlueprint writes', async () => {
    await createMenu(rootAgent, {
      type: 'group',
      title: 'Duplicate authoring group',
    });
    await createMenu(rootAgent, {
      type: 'group',
      title: 'Duplicate authoring group',
    });

    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title: 'Duplicate authoring group',
          },
          item: {
            title: 'Ambiguous navigation authoring page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'badEmployeeTable',
                type: 'table',
                collection: 'employees',
                fields: ['unknownEmployeeField'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['navigation-group-title-ambiguous', 'field-path-unknown']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.navigation.group.title', '$.tabs[0].blocks[0].fields[0]']),
    );
  });
});
