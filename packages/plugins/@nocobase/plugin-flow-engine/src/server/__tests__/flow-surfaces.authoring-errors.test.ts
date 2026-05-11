/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  addBlockData,
  createMenu,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  getData,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';

const LARGE_GENERATED_POPUP_COLLECTION = 'flow_surface_large_generated_popup_records';
const LARGE_GENERATED_POPUP_FIELDS = Array.from({ length: 11 }, (_item, index) => `field${index + 1}`);
const LARGE_GENERATED_POPUP_SOURCE_COLLECTION = 'flow_surface_large_generated_popup_sources';
const LARGE_GENERATED_POPUP_RELATION_FIELD = 'largeRecord';
const LARGE_GENERATED_POPUP_KANBAN_COLLECTION = 'flow_surface_large_generated_popup_kanban';
const LARGE_GENERATED_POPUP_UNSUPPORTED_COLLECTION = 'flow_surface_large_generated_popup_unsupported';
const LARGE_GENERATED_POPUP_CODE_COLLECTION = 'flow_surface_large_generated_popup_code';
const LARGE_GENERATED_POPUP_KANBAN_EXTRA_FIELDS = Array.from({ length: 9 }, (_item, index) => `extra${index + 1}`);
const LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS = Array.from(
  { length: 11 },
  (_item, index) => `unsupported${index + 1}`,
);
const LARGE_GENERATED_POPUP_CODE_FIELDS = Array.from({ length: 11 }, (_item, index) => `code${index + 1}`);

describe('flowSurfaces backend authoring aggregate errors', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent } = context);
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_GENERATED_POPUP_COLLECTION,
        title: 'Flow surface large generated popup records',
        fields: LARGE_GENERATED_POPUP_FIELDS.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
        title: 'Flow surface large generated popup sources',
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    await rootAgent.resource('collections.fields', LARGE_GENERATED_POPUP_SOURCE_COLLECTION).create({
      values: {
        name: LARGE_GENERATED_POPUP_RELATION_FIELD,
        type: 'belongsTo',
        target: LARGE_GENERATED_POPUP_COLLECTION,
        foreignKey: 'largeRecordId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_GENERATED_POPUP_KANBAN_COLLECTION,
        title: 'Flow surface large generated popup kanban',
        filterTargetKey: 'id',
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
          },
          {
            name: 'status_sort',
            type: 'sort',
            interface: 'sort',
            scopeKey: 'status',
            hidden: true,
          },
          {
            name: 'status',
            type: 'string',
            interface: 'select',
          },
          ...LARGE_GENERATED_POPUP_KANBAN_EXTRA_FIELDS.map((name) => ({
            name,
            type: 'string',
            interface: 'input',
          })),
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_GENERATED_POPUP_UNSUPPORTED_COLLECTION,
        title: 'Flow surface large generated popup unsupported',
        fields: LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS.map((name) => ({
          name,
          type: 'string',
          interface: 'flowSurfaceUnsupportedField',
        })),
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_GENERATED_POPUP_CODE_COLLECTION,
        title: 'Flow surface large generated popup code',
        fields: LARGE_GENERATED_POPUP_CODE_FIELDS.map((name) => ({
          name,
          type: 'text',
          interface: 'code',
        })),
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [LARGE_GENERATED_POPUP_COLLECTION]: LARGE_GENERATED_POPUP_FIELDS,
      [LARGE_GENERATED_POPUP_SOURCE_COLLECTION]: ['title', 'largeRecordId'],
      [LARGE_GENERATED_POPUP_KANBAN_COLLECTION]: [
        'title',
        'status',
        'status_sort',
        ...LARGE_GENERATED_POPUP_KANBAN_EXTRA_FIELDS,
      ],
      [LARGE_GENERATED_POPUP_UNSUPPORTED_COLLECTION]: LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS,
      [LARGE_GENERATED_POPUP_CODE_COLLECTION]: LARGE_GENERATED_POPUP_CODE_FIELDS,
    });
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

  it('should aggregate internal public field object keys before write target resolution', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badCreateForm',
            type: 'createForm',
            collection: 'employees',
            fields: [
              {
                field: 'nickname',
                fieldComponent: 'InputFieldModel',
              },
              {
                field: 'status',
                settings: {
                  fieldUse: 'SelectFieldModel',
                },
              },
            ],
          },
          {
            key: 'badDetails',
            type: 'details',
            collection: 'employees',
            fieldGroups: [
              {
                title: 'Main',
                fields: [
                  {
                    field: 'nickname',
                    stepParams: {},
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
    const internalErrors = response.body.errors.filter(
      (error: any) => error.ruleId === 'internal-field-keys-not-public',
    );
    expect(internalErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].fields[0]',
        '$.blocks[0].fields[1].settings',
        '$.blocks[1].fieldGroups[0].fields[0]',
      ]),
    );
    for (const error of internalErrors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
      expect(error.details?.keys).toEqual(expect.any(Array));
    }
  });

  it('should aggregate configure internal public field object keys before side effects', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring configure internal field keys page',
      tabTitle: 'Authoring configure internal field keys tab',
    });
    const form = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'createForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
      fields: ['nickname'],
    });

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: form.uid },
        changes: {
          fields: [
            {
              field: 'nickname',
              fieldModel: 'InputFieldModel',
            },
          ],
          fieldGroups: [
            {
              title: 'Main',
              fields: [
                {
                  field: 'status',
                  settings: {
                    fieldUse: 'SelectFieldModel',
                  },
                },
              ],
            },
          ],
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    const internalErrors = response.body.errors.filter(
      (error: any) => error.ruleId === 'internal-field-keys-not-public',
    );
    expect(internalErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.changes.fields[0]', '$.changes.fieldGroups[0].fields[0].settings']),
    );
    for (const error of internalErrors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
      expect(error.details?.keys).toEqual(expect.any(Array));
    }
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

  it('should aggregate explicit layout coverage and custom edit popup count errors before applyBlueprint writes', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring layout coverage errors page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            layout: {
              rows: [
                ['mainDetails', 'missingTabBlock'],
                ['layoutFilter'],
                ['sideDetails'],
                ['sideDetails'],
                ['editTable'],
              ],
            },
            blocks: [
              {
                key: 'layoutFilter',
                type: 'filterForm',
                collection: 'employees',
                fields: ['status'],
              },
              {
                key: 'mainDetails',
                type: 'details',
                collection: 'employees',
                fields: ['nickname', 'email', 'phone'],
                fieldsLayout: {
                  rows: [['nickname', 'missingField'], ['nickname'], ['email']],
                },
              },
              {
                key: 'sideDetails',
                type: 'details',
                collection: 'employees',
                fields: ['nickname'],
              },
              {
                key: 'extraDetails',
                type: 'details',
                collection: 'employees',
                fields: ['email'],
              },
              {
                type: 'details',
                collection: 'employees',
                fields: ['phone'],
              },
              {
                key: 'editTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                recordActions: [
                  {
                    key: 'edit',
                    type: 'edit',
                    popup: {
                      blocks: [
                        {
                          type: 'editForm',
                          collection: 'employees',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['nickname'],
                        },
                        {
                          type: 'editForm',
                          collection: 'employees',
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
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'block-layout-unknown-key',
        'block-layout-duplicate-key',
        'block-layout-missing-key',
        'block-layout-filter-must-lead',
        'block-layout-single-column',
        'fieldsLayout-unknown-field-key',
        'fieldsLayout-duplicate-field-key',
        'fieldsLayout-missing-field-key',
        'fieldsLayout-single-column',
        'custom-edit-popup-edit-form-count',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.tabs[0].layout.rows[0][1]',
        '$.tabs[0].layout.rows[3][0]',
        '$.tabs[0].layout.rows[0]',
        '$.tabs[0].layout.rows',
        '$.tabs[0].blocks[1].fieldsLayout.rows[0][1]',
        '$.tabs[0].blocks[1].fieldsLayout.rows',
        '$.tabs[0].blocks[1].fields[2]',
        '$.tabs[0].blocks[3]',
        '$.tabs[0].blocks[4].key',
        '$.tabs[0].blocks[5].recordActions[0].popup',
      ]),
    );
    for (const error of response.body.errors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
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

  it('should reject generated action popups for large collections without collection default fieldGroups', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring large generated popup missing defaults',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'largeRecordsTable',
                type: 'table',
                collection: LARGE_GENERATED_POPUP_COLLECTION,
                fields: ['field1'],
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'field1', operator: '$notEmpty' },
                    { path: 'field2', operator: '$notEmpty' },
                    { path: 'field3', operator: '$notEmpty' },
                    { path: 'field4', operator: '$notEmpty' },
                  ],
                },
                actions: [
                  {
                    key: 'createLargeRecord',
                    type: 'addNew',
                    popup: {},
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
    const missingDefaultsError = response.body.errors.find(
      (error: any) => error.ruleId === 'missing-default-field-groups',
    );
    expectStructuredError(missingDefaultsError, {
      status: 400,
      type: 'bad_request',
    });
    expect(missingDefaultsError).toMatchObject({
      path: `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
      details: {
        collection: LARGE_GENERATED_POPUP_COLLECTION,
        businessFieldCount: 11,
        threshold: 10,
      },
    });
    expect(missingDefaultsError.details.requiredFieldNames).toEqual(
      expect.arrayContaining(LARGE_GENERATED_POPUP_FIELDS),
    );
  });

  it('should accept generated action popups for large collections with collection default fieldGroups', async () => {
    const popupName = `Large generated popup ${Date.now()}`;
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring large generated popup with defaults',
          },
        },
        defaults: {
          collections: {
            [LARGE_GENERATED_POPUP_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Core',
                  fields: LARGE_GENERATED_POPUP_FIELDS.slice(0, 6),
                },
                {
                  title: 'More',
                  fields: LARGE_GENERATED_POPUP_FIELDS.slice(6),
                },
              ],
              popups: {
                addNew: {
                  name: popupName,
                  description: 'Large generated popup fieldGroups should materialize.',
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'largeRecordsTable',
                type: 'table',
                collection: LARGE_GENERATED_POPUP_COLLECTION,
                fields: ['field1'],
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'field1', operator: '$notEmpty' },
                    { path: 'field2', operator: '$notEmpty' },
                    { path: 'field3', operator: '$notEmpty' },
                    { path: 'field4', operator: '$notEmpty' },
                  ],
                },
                actions: [
                  {
                    key: 'createLargeRecord',
                    type: 'addNew',
                    title: 'Create large record',
                    popup: {},
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
    const data = getData(response);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await context.flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    const actions = Array.isArray(persistedTable?.subModels?.actions) ? persistedTable.subModels.actions : [];
    const createAction = actions.find((item: any) => item?.props?.title === 'Create large record');
    expect(createAction?.uid).toBeTruthy();
    const persistedAction = await context.flowRepo.findModelById(createAction.uid, { includeAsyncNode: true });
    const popupTemplateUid = persistedAction?.stepParams?.popupSettings?.openView?.popupTemplateUid;
    expect(popupTemplateUid).toBeTruthy();

    const template = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: popupTemplateUid,
        },
      }),
    );
    expect(template).toMatchObject({
      name: popupName,
      collectionName: LARGE_GENERATED_POPUP_COLLECTION,
      type: 'popup',
    });
    const templateSurface = await context.flowRepo.findModelById(template.targetUid, { includeAsyncNode: true });
    const createForm = collectDescendantNodes(templateSurface, (item) => item?.use === 'CreateFormModel')[0];
    const formItems = Array.isArray(createForm?.subModels?.grid?.subModels?.items)
      ? createForm.subModels.grid.subModels.items
      : [];
    expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Core')).toBe(true);
    expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'More')).toBe(true);
    expect(formItems.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean)).toEqual(
      expect.arrayContaining(['field1', 'field11']),
    );
  });

  it('should aggregate invalid collection defaults shape before blueprint normalization', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring invalid collection defaults',
          },
        },
        defaults: {
          collections: {
            [LARGE_GENERATED_POPUP_COLLECTION]: {
              fieldGroups: [
                {
                  title: '',
                  fields: [{ field: '', extra: true }],
                },
              ],
              blocks: {},
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'largeRecordsTable',
                type: 'table',
                collection: LARGE_GENERATED_POPUP_COLLECTION,
                fields: ['field1'],
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'field1', operator: '$notEmpty' },
                    { path: 'field2', operator: '$notEmpty' },
                    { path: 'field3', operator: '$notEmpty' },
                    { path: 'field4', operator: '$notEmpty' },
                  ],
                },
                actions: [
                  {
                    key: 'createLargeRecord',
                    type: 'addNew',
                    popup: {},
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'defaults-collection-unsupported-key',
        'defaults-fieldGroups-group-title-required',
        'defaults-fieldGroups-field-unsupported-key',
        'defaults-fieldGroups-field-field-required',
      ]),
    );
  });

  it('should aggregate collection default fieldGroups semantic errors before generated popup writes', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        defaults: {
          collections: {
            [LARGE_GENERATED_POPUP_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Incomplete',
                  fields: ['field1', 'unknownField'],
                },
              ],
            },
            [LARGE_GENERATED_POPUP_SOURCE_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Relation',
                  fields: [{ field: LARGE_GENERATED_POPUP_RELATION_FIELD, titleField: 'id' }],
                },
              ],
            },
          },
        },
        blocks: [
          {
            key: 'largeRecordsTable',
            type: 'table',
            collection: LARGE_GENERATED_POPUP_COLLECTION,
            fields: ['field1'],
            defaultFilter: {
              logic: '$and',
              items: [
                { path: 'field1', operator: '$notEmpty' },
                { path: 'field2', operator: '$notEmpty' },
                { path: 'field3', operator: '$notEmpty' },
                { path: 'field4', operator: '$notEmpty' },
              ],
            },
            actions: [
              {
                key: 'createLargeRecord',
                type: 'addNew',
                popup: {},
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'default-field-group-unknown-field',
        'default-field-groups-incomplete',
        'relation-titleField-unreadable',
        'default-field-groups-only-for-large-generated-popups',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups[0].fields[1]`,
        `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
        `$.defaults.collections.${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.fieldGroups[0].fields[0].titleField`,
      ]),
    );
  });

  it('should reject compose generated action popups for large collections without collection default fieldGroups', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'largeRecordsTable',
            type: 'table',
            collection: LARGE_GENERATED_POPUP_COLLECTION,
            fields: ['field1'],
            defaultFilter: {
              logic: '$and',
              items: [
                { path: 'field1', operator: '$notEmpty' },
                { path: 'field2', operator: '$notEmpty' },
                { path: 'field3', operator: '$notEmpty' },
                { path: 'field4', operator: '$notEmpty' },
              ],
            },
            actions: [
              {
                key: 'createLargeRecord',
                type: 'addNew',
                popup: {},
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toContain('missing-default-field-groups');
    expect(response.body.errors.map((error: any) => error.path)).toContain(
      `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
    );
  });

  it('should reject auto-generated relation field popups for large target collections without target default fieldGroups', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'sourceDetails',
            type: 'details',
            collection: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
            fields: [LARGE_GENERATED_POPUP_RELATION_FIELD],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    const missingDefaultsError = response.body.errors.find(
      (error: any) => error.ruleId === 'missing-default-field-groups',
    );
    expect(missingDefaultsError).toMatchObject({
      path: `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
      details: {
        collection: LARGE_GENERATED_POPUP_COLLECTION,
        businessFieldCount: 11,
      },
    });
    expect(missingDefaultsError.details.triggerPaths).toContain('$.blocks[0].fields[0].popup');
  });

  it('should reject auto-generated relation field popups declared inside fieldGroups without target default fieldGroups', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'sourceDetails',
            type: 'details',
            collection: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
            fieldGroups: [
              {
                title: 'Relation',
                fields: [LARGE_GENERATED_POPUP_RELATION_FIELD],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    const missingDefaultsError = response.body.errors.find(
      (error: any) => error.ruleId === 'missing-default-field-groups',
    );
    expect(missingDefaultsError).toMatchObject({
      path: `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
    });
    expect(missingDefaultsError.details.triggerPaths).toContain('$.blocks[0].fieldGroups[0].fields[0].popup');
  });

  it('should reject generated action popups when collection default fieldGroups contain no usable fields', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        defaults: {
          collections: {
            [LARGE_GENERATED_POPUP_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Invalid',
                  fields: ['unknownField'],
                },
              ],
            },
          },
        },
        blocks: [
          {
            key: 'largeRecordsTable',
            type: 'table',
            collection: LARGE_GENERATED_POPUP_COLLECTION,
            fields: ['field1'],
            defaultFilter: {
              logic: '$and',
              items: [
                { path: 'field1', operator: '$notEmpty' },
                { path: 'field2', operator: '$notEmpty' },
                { path: 'field3', operator: '$notEmpty' },
                { path: 'field4', operator: '$notEmpty' },
              ],
            },
            actions: [
              {
                key: 'createLargeRecord',
                type: 'addNew',
                popup: {},
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error: any) => error.ruleId)).toContain('missing-default-field-groups');
    expect(response.body.errors.map((error: any) => error.path)).toContain(
      `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
    );
  });

  it('should reject generated addNew popups when default fieldGroups only contain form-unusable fields', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        defaults: {
          collections: {
            [LARGE_GENERATED_POPUP_UNSUPPORTED_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Unsupported',
                  fields: LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS,
                },
              ],
            },
          },
        },
        blocks: [
          {
            key: 'unsupportedRecordsTable',
            type: 'table',
            collection: LARGE_GENERATED_POPUP_UNSUPPORTED_COLLECTION,
            fields: [LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS[0]],
            defaultFilter: {
              logic: '$and',
              items: [
                { path: LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS[0], operator: '$notEmpty' },
                { path: LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS[1], operator: '$notEmpty' },
                { path: LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS[2], operator: '$notEmpty' },
                { path: LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS[3], operator: '$notEmpty' },
              ],
            },
            actions: [
              {
                key: 'createUnsupportedRecord',
                type: 'addNew',
                popup: {},
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error: any) => error.ruleId)).toContain('missing-default-field-groups');
    expect(response.body.errors.map((error: any) => error.path)).toContain(
      `$.defaults.collections.${LARGE_GENERATED_POPUP_UNSUPPORTED_COLLECTION}.fieldGroups`,
    );
  });

  it('should reject generated addNew popups when default fieldGroups only contain fields owned by disabled plugins', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        defaults: {
          collections: {
            [LARGE_GENERATED_POPUP_CODE_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Code',
                  fields: LARGE_GENERATED_POPUP_CODE_FIELDS,
                },
              ],
            },
          },
        },
        blocks: [
          {
            key: 'codeRecordsTable',
            type: 'table',
            collection: LARGE_GENERATED_POPUP_CODE_COLLECTION,
            fields: [LARGE_GENERATED_POPUP_CODE_FIELDS[0]],
            defaultFilter: {
              logic: '$and',
              items: [
                { path: LARGE_GENERATED_POPUP_CODE_FIELDS[0], operator: '$notEmpty' },
                { path: LARGE_GENERATED_POPUP_CODE_FIELDS[1], operator: '$notEmpty' },
                { path: LARGE_GENERATED_POPUP_CODE_FIELDS[2], operator: '$notEmpty' },
                { path: LARGE_GENERATED_POPUP_CODE_FIELDS[3], operator: '$notEmpty' },
              ],
            },
            actions: [
              {
                key: 'createCodeRecord',
                type: 'addNew',
                popup: {},
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error: any) => error.ruleId)).toContain('missing-default-field-groups');
    expect(response.body.errors.map((error: any) => error.path)).toContain(
      `$.defaults.collections.${LARGE_GENERATED_POPUP_CODE_COLLECTION}.fieldGroups`,
    );
  });

  it('should reject configure action generated popups for large collections without collection default fieldGroups', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring configure action missing defaults page',
      tabTitle: 'Authoring configure action missing defaults tab',
    });
    const table = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
      defaultFilter: {
        logic: '$and',
        items: [
          { path: 'nickname', operator: '$notEmpty' },
          { path: 'status', operator: '$notEmpty' },
          { path: 'email', operator: '$notEmpty' },
          { path: 'phone', operator: '$notEmpty' },
        ],
      },
    });
    const viewAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: { uid: table.uid },
          type: 'view',
          popup: {
            tryTemplate: false,
          },
        },
      }),
    );
    const emptyPopup = await rootAgent.resource('flowSurfaces').apply({
      values: {
        target: { uid: viewAction.uid },
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
    expect(emptyPopup.status, readErrorMessage(emptyPopup)).toBe(200);

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: viewAction.uid },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: LARGE_GENERATED_POPUP_COLLECTION,
            mode: 'modal',
          },
        },
      },
    });

    expect(response.status).toBe(400);
    const missingDefaultsError = response.body.errors.find(
      (error: any) => error.ruleId === 'missing-default-field-groups',
    );
    expect(missingDefaultsError).toMatchObject({
      path: `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
      details: {
        collection: LARGE_GENERATED_POPUP_COLLECTION,
        businessFieldCount: 11,
      },
    });
    expect(missingDefaultsError.details.triggerPaths).toContain('$.changes.openView');
  });

  it('should reject configure field generated popups for large relation target collections without target default fieldGroups', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring configure field missing defaults page',
      tabTitle: 'Authoring configure field missing defaults tab',
    });
    const details = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
      },
    });
    const field = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: { uid: details.uid },
          fieldPath: LARGE_GENERATED_POPUP_RELATION_FIELD,
        },
      }),
    );

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: field.fieldUid },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: LARGE_GENERATED_POPUP_COLLECTION,
            associationName: `${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.${LARGE_GENERATED_POPUP_RELATION_FIELD}`,
            mode: 'modal',
          },
        },
      },
    });

    expect(response.status).toBe(400);
    const missingDefaultsError = response.body.errors.find(
      (error: any) => error.ruleId === 'missing-default-field-groups',
    );
    expect(missingDefaultsError).toMatchObject({
      path: `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
      details: {
        collection: LARGE_GENERATED_POPUP_COLLECTION,
        businessFieldCount: 11,
      },
    });
    expect(missingDefaultsError.details.triggerPaths).toContain('$.changes.openView');
  });

  it('should reject configure resource retarget generated popups for large kanban collections without target default fieldGroups', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring configure kanban retarget missing defaults page',
      tabTitle: 'Authoring configure kanban retarget missing defaults tab',
    });
    const kanban = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
      defaultFilter: {
        logic: '$and',
        items: [
          { path: 'title', operator: '$notEmpty' },
          { path: 'status', operator: '$notEmpty' },
          { path: 'priority', operator: '$notEmpty' },
          { path: 'scope', operator: '$notEmpty' },
        ],
      },
      settings: {
        groupField: 'status',
      },
    });

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: kanban.uid },
        changes: {
          resource: {
            dataSourceKey: 'main',
            collectionName: LARGE_GENERATED_POPUP_KANBAN_COLLECTION,
          },
        },
      },
    });

    expect(response.status).toBe(400);
    const missingDefaultsError = response.body.errors.find(
      (error: any) => error.ruleId === 'missing-default-field-groups',
    );
    expect(missingDefaultsError).toMatchObject({
      path: `$.defaults.collections.${LARGE_GENERATED_POPUP_KANBAN_COLLECTION}.fieldGroups`,
      details: {
        collection: LARGE_GENERATED_POPUP_KANBAN_COLLECTION,
        businessFieldCount: 11,
      },
    });
    expect(missingDefaultsError.details.triggerPaths).toEqual(
      expect.arrayContaining(['$.changes.resource.quickCreatePopup', '$.changes.resource.cardPopup']),
    );
  });

  it('should apply configure resource retarget default fieldGroups to regenerated kanban popup hosts', async () => {
    const popupName = `Kanban retarget quick create ${Date.now()}`;
    const page = await createPage(rootAgent, {
      title: 'Authoring configure kanban retarget with defaults page',
      tabTitle: 'Authoring configure kanban retarget with defaults tab',
    });
    const kanban = await addBlockData(rootAgent, {
      target: { uid: page.tabSchemaUid },
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'kanban_tasks',
      },
      defaultFilter: {
        logic: '$and',
        items: [
          { path: 'title', operator: '$notEmpty' },
          { path: 'status', operator: '$notEmpty' },
          { path: 'priority', operator: '$notEmpty' },
          { path: 'scope', operator: '$notEmpty' },
        ],
      },
      settings: {
        groupField: 'status',
      },
    });

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: kanban.uid },
        defaults: {
          collections: {
            [LARGE_GENERATED_POPUP_KANBAN_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Retarget core',
                  fields: ['title', 'status'],
                },
                {
                  title: 'Retarget extra',
                  fields: LARGE_GENERATED_POPUP_KANBAN_EXTRA_FIELDS,
                },
              ],
              popups: {
                addNew: {
                  name: popupName,
                  description: 'Kanban retarget quick create popup defaults.',
                },
              },
            },
          },
        },
        changes: {
          resource: {
            dataSourceKey: 'main',
            collectionName: LARGE_GENERATED_POPUP_KANBAN_COLLECTION,
          },
        },
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
    const quickCreateAction = await context.flowRepo.findModelById(`${kanban.uid}-quick-create-action`, {
      includeAsyncNode: true,
    });
    const popupTemplateUid = quickCreateAction?.stepParams?.popupSettings?.openView?.popupTemplateUid;
    expect(popupTemplateUid).toBeTruthy();
    const template = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: popupTemplateUid,
        },
      }),
    );
    expect(template).toMatchObject({
      name: popupName,
      collectionName: LARGE_GENERATED_POPUP_KANBAN_COLLECTION,
      type: 'popup',
    });
    const templateSurface = await context.flowRepo.findModelById(template.targetUid, { includeAsyncNode: true });
    const createForm = collectDescendantNodes(templateSurface, (item) => item?.use === 'CreateFormModel')[0];
    const formItems = Array.isArray(createForm?.subModels?.grid?.subModels?.items)
      ? createForm.subModels.grid.subModels.items
      : [];
    expect(
      formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Retarget core'),
    ).toBe(true);
    expect(
      formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Retarget extra'),
    ).toBe(true);
    expect(formItems.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean)).toEqual(
      expect.arrayContaining(['title', 'extra9']),
    );
  });

  it('should require collection default fieldGroups for generated defaults inside explicit popup blocks', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'largeRecordsTable',
            type: 'table',
            collection: LARGE_GENERATED_POPUP_COLLECTION,
            fields: ['field1'],
            defaultFilter: {
              logic: '$and',
              items: [
                { path: 'field1', operator: '$notEmpty' },
                { path: 'field2', operator: '$notEmpty' },
                { path: 'field3', operator: '$notEmpty' },
                { path: 'field4', operator: '$notEmpty' },
              ],
            },
            recordActions: [
              {
                type: 'view',
                popup: {
                  blocks: [
                    {
                      key: 'explicitDetails',
                      type: 'details',
                      collection: LARGE_GENERATED_POPUP_COLLECTION,
                      fieldGroups: [
                        {
                          title: 'Core',
                          fields: ['field1', 'field2'],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                type: 'edit',
                popup: {
                  blocks: [
                    {
                      key: 'explicitEditForm',
                      type: 'editForm',
                      collection: LARGE_GENERATED_POPUP_COLLECTION,
                      fieldGroups: [
                        {
                          title: 'Core',
                          fields: ['field1', 'field2'],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                type: 'delete',
              },
            ],
            actions: [
              {
                key: 'createLargeRecord',
                type: 'addNew',
                popup: {
                  blocks: [
                    {
                      key: 'explicitCreateForm',
                      type: 'createForm',
                      collection: LARGE_GENERATED_POPUP_COLLECTION,
                      fieldGroups: [
                        {
                          title: 'Core',
                          fields: ['field1', 'field2'],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.body?.errors?.map((error: any) => error.ruleId) || []).toContain('missing-default-field-groups');
  });

  it('should allow large explicit field grids because backend field grouping is advisory', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring large flat field grid',
      tabTitle: 'Overview',
    });
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'largeFlatCreateForm',
            type: 'createForm',
            resource: {
              dataSourceKey: 'main',
              collectionName: LARGE_GENERATED_POPUP_COLLECTION,
            },
            fields: LARGE_GENERATED_POPUP_FIELDS,
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
    expect(getData(response).blocks[0].uid).toBeTruthy();
  });

  it('should aggregate applyBlueprint navigation icon errors before writes', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title: 'Authoring icon errors group',
          },
          item: {
            title: 'Authoring icon errors page',
            icon: 'NotARealIconOutlined',
          },
        },
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
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['missing-menu-group-icon', 'invalid-menu-item-icon']),
    );
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain(
      'public-data-surface-default-filter-required',
    );
  });

  it('should aggregate whole-page chart asset errors before blueprint compilation', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring chart asset errors page',
          },
        },
        assets: {
          charts: {
            invalidAsset: [],
            incompleteAsset: {
              query: {
                mode: 'builder',
                sql: 'select 1',
              },
              visual: {
                mode: 'basic',
                type: 'pie',
                mappings: {
                  category: 'status',
                },
              },
            },
          },
        },
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
              {
                key: 'chartWithoutAsset',
                type: 'chart',
                stepParams: {},
              },
              {
                key: 'chartWithMissingAsset',
                type: 'chart',
                chart: 'missingAsset',
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'chart-asset-invalid',
        'chart-builder-query-resource-missing',
        'chart-builder-query-measures-missing',
        'chart-builder-query-forbidden-keys',
        'chart-visual-required-mappings-missing',
        'chart-block-step-params-unsupported',
        'chart-block-asset-reference-required',
        'chart-block-asset-reference-missing',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain(
      'public-data-surface-default-filter-required',
    );
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
              items: [
                { path: 'nickname', operator: '$notEmpty' },
                { path: 'status', operator: '$notEmpty' },
                { path: 'email', operator: '$notEmpty' },
                { path: 'phone', operator: '$notEmpty' },
              ],
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
                  items: [
                    { path: 'nickname', operator: '$notEmpty' },
                    { path: 'status', operator: '$notEmpty' },
                    { path: 'email', operator: '$notEmpty' },
                    { path: 'phone', operator: '$notEmpty' },
                  ],
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
                      {
                        path: 'nickname',
                        operator: '$notEmpty',
                      },
                      {
                        path: 'status',
                        operator: '$notEmpty',
                      },
                      {
                        path: 'email',
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
              items: [
                { path: 'department', operator: '$notEmpty' },
                { path: 'nickname', operator: '$notEmpty' },
                { path: 'status', operator: '$notEmpty' },
                { path: 'email', operator: '$notEmpty' },
              ],
            },
          },
          {
            key: 'invalidItemOperatorTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [
                { path: 'nickname', operator: '$definitelyBad' },
                { path: 'status', operator: '$notEmpty' },
                { path: 'email', operator: '$notEmpty' },
                { path: 'phone', operator: '$notEmpty' },
              ],
            },
          },
          {
            key: 'invalidMapOperatorTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [
                { path: 'nickname', operator: '$notEmpty' },
                { path: 'status', operator: '$notEmpty' },
                { path: 'email', operator: '$notEmpty' },
                { path: 'phone', operator: '$notEmpty' },
              ],
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
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].actions[0].settings.defaultFilter',
        '$.blocks[0].actions[0].settings.filterableFieldNames',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain(
      'public-data-surface-default-filter-required',
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
              items: [
                { path: 'nickname', operator: '$notEmpty' },
                { path: 'email', operator: '$notEmpty' },
                { path: 'phone', operator: '$notEmpty' },
                { path: 'department.title', operator: '$notEmpty' },
              ],
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

  it('should validate filterableFieldNames against backend-generated defaultFilter', async () => {
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'badGeneratedFilterActionTable',
            type: 'table',
            collection: 'employees',
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
          {
            key: 'badGeneratedDefaultActionSettingsTable',
            type: 'table',
            collection: 'employees',
            defaultActionSettings: {
              filter: {
                filterableFieldNames: ['status'],
              },
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    const matchingErrors = response.body.errors.filter(
      (error: any) => error.ruleId === 'defaultFilter-filterable-field-missing',
    );
    expect(matchingErrors).toHaveLength(6);
    expect(matchingErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].defaultFilter.items[0].path',
        '$.blocks[0].defaultFilter.items[1].path',
        '$.blocks[0].defaultFilter.items[3].path',
        '$.blocks[1].defaultFilter.items[0].path',
        '$.blocks[1].defaultFilter.items[1].path',
        '$.blocks[1].defaultFilter.items[3].path',
      ]),
    );
  });

  it('should reject explicit defaultFilter payloads with fewer than four fields', async () => {
    const threeFieldDefaultFilter = {
      logic: '$and',
      items: [
        { path: 'nickname', operator: '$notEmpty' },
        { path: 'status', operator: '$notEmpty' },
        { path: 'email', operator: '$notEmpty' },
      ],
    };
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'narrowBlockDefaultFilterTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: threeFieldDefaultFilter,
          },
          {
            key: 'narrowActionSettingsDefaultFilterTable',
            type: 'table',
            collection: 'employees',
            actions: [
              {
                key: 'filter',
                type: 'filter',
                settings: {
                  defaultFilter: threeFieldDefaultFilter,
                },
              },
            ],
          },
          {
            key: 'narrowDefaultActionSettingsDefaultFilterTable',
            type: 'table',
            collection: 'employees',
            defaultActionSettings: {
              filter: {
                defaultFilter: threeFieldDefaultFilter,
              },
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    const minimumErrors = response.body?.errors?.filter(
      (error: any) => error.ruleId === 'defaultFilter-minimum-fields',
    );
    expect(minimumErrors).toHaveLength(3);
    expect(minimumErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].defaultFilter',
        '$.blocks[1].actions[0].settings.defaultFilter',
        '$.blocks[2].defaultActionSettings.filter.defaultFilter',
      ]),
    );
    for (const error of minimumErrors) {
      expect(error.details).toMatchObject({
        fieldCount: 3,
        requiredFieldCount: 4,
        fieldNames: ['nickname', 'status', 'email'],
      });
    }
  });

  it('should not add common-field coverage errors for explicit defaultFilter payloads', async () => {
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
              items: [{ path: 'missingNickname', operator: '$notEmpty' }],
            },
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['field-path-unknown']),
    );
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain(
      'defaultFilter-common-fields-incomplete',
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

function collectDescendantNodes(node: any, predicate: (input: any) => boolean, bucket: any[] = []) {
  if (!node || typeof node !== 'object') {
    return bucket;
  }
  if (predicate(node)) {
    bucket.push(node);
  }
  const subModels = node.subModels && typeof node.subModels === 'object' ? Object.values(node.subModels) : [];
  subModels.forEach((subModel) => {
    const children = Array.isArray(subModel) ? subModel : [subModel];
    children.forEach((child) => collectDescendantNodes(child, predicate, bucket));
  });
  return bucket;
}
