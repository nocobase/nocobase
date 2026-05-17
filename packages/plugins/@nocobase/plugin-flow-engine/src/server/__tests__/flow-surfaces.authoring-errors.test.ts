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
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';

const LARGE_GENERATED_POPUP_COLLECTION = 'flow_surface_large_generated_popup_records';
const LARGE_GENERATED_POPUP_FIELDS = Array.from({ length: 11 }, (_item, index) => `field${index + 1}`);
const LARGE_GENERATED_POPUP_SOURCE_COLLECTION = 'flow_surface_large_generated_popup_sources';
const LARGE_GENERATED_POPUP_RELATION_FIELD = 'largeRecord';
const LARGE_GENERATED_POPUP_M2M_SOURCE_COLLECTION = 'flow_surface_large_generated_popup_m2m_sources';
const LARGE_GENERATED_POPUP_M2M_RELATION_FIELD = 'largeRecords';
const LARGE_GENERATED_POPUP_M2M_THROUGH_COLLECTION = 'flow_surface_large_generated_popup_m2m_source_records';
const LARGE_GENERATED_POPUP_KANBAN_COLLECTION = 'flow_surface_large_generated_popup_kanban';
const LARGE_GENERATED_POPUP_UNSUPPORTED_COLLECTION = 'flow_surface_large_generated_popup_unsupported';
const LARGE_GENERATED_POPUP_CODE_COLLECTION = 'flow_surface_large_generated_popup_code';
const GENERATED_POPUP_TEN_EFFECTIVE_COLLECTION = 'flow_surface_ten_effective_generated_popup';
const GENERATED_POPUP_TEN_EFFECTIVE_FIELDS = Array.from({ length: 10 }, (_item, index) => `field${index + 1}`);
const DESCRIPTION_FORM_BEHAVIOR_COLLECTION = 'flow_surface_description_form_behavior';
const DESCRIPTION_FORM_BEHAVIOR_IGNORED_COLLECTION = 'flow_surface_description_form_behavior_ignored';
const DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_COLLECTION = 'flow_surface_description_form_behavior_field_group';
const DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_FIELDS = Array.from({ length: 11 }, (_item, index) => `field${index + 1}`);
const GENERATED_POPUP_RELATION_OVERRIDE_TARGET_COLLECTION = 'flow_surface_relation_override_targets';
const GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION = 'flow_surface_relation_override_sources';
const GENERATED_POPUP_RELATION_OVERRIDE_FIELD = 'target';
const GENERATED_POPUP_RELATION_OVERRIDE_FIELDS = Array.from({ length: 10 }, (_item, index) => `field${index + 1}`);
const TITLE_FIELD_DIAGNOSTICS_WIDE_TARGET_COLLECTION = 'flow_surface_title_field_diagnostics_wide_targets';
const TITLE_FIELD_DIAGNOSTICS_WIDE_SOURCE_COLLECTION = 'flow_surface_title_field_diagnostics_wide_sources';
const TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD = 'wideTarget';
const TITLE_FIELD_DIAGNOSTICS_WIDE_FIELDS = Array.from({ length: 21 }, (_item, index) => `field${index + 1}`);
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
        name: LARGE_GENERATED_POPUP_M2M_SOURCE_COLLECTION,
        title: 'Flow surface large generated popup m2m sources',
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_GENERATED_POPUP_M2M_THROUGH_COLLECTION,
        title: 'Flow surface large generated popup m2m source records',
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
    await rootAgent.resource('collections.fields', LARGE_GENERATED_POPUP_M2M_SOURCE_COLLECTION).create({
      values: {
        name: LARGE_GENERATED_POPUP_M2M_RELATION_FIELD,
        type: 'belongsToMany',
        target: LARGE_GENERATED_POPUP_COLLECTION,
        through: LARGE_GENERATED_POPUP_M2M_THROUGH_COLLECTION,
        foreignKey: 'sourceId',
        otherKey: 'targetId',
        interface: 'm2m',
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
    await rootAgent.resource('collections').create({
      values: {
        name: GENERATED_POPUP_TEN_EFFECTIVE_COLLECTION,
        title: 'Flow surface ten effective generated popup fields',
        fields: [
          ...GENERATED_POPUP_TEN_EFFECTIVE_FIELDS.map((name) => ({
            name,
            type: 'string',
            interface: 'input',
          })),
          {
            name: 'internalSort',
            type: 'sort',
            interface: 'sort',
            hidden: true,
          },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
        title: 'Flow surface description form behavior',
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
            description: 'Title is required for generated add and edit forms.',
          },
          {
            name: 'notes',
            type: 'text',
            interface: 'textarea',
          },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: DESCRIPTION_FORM_BEHAVIOR_IGNORED_COLLECTION,
        title: 'Flow surface description form behavior ignored',
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
          },
          {
            name: 'internalNotes',
            type: 'string',
            interface: 'input',
            hidden: true,
            description: 'Hidden notes should not affect generated add and edit form defaults.',
          },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_COLLECTION,
        title: 'Flow surface description form behavior field group',
        fields: DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_FIELDS.map((fieldName, index) => ({
          name: fieldName,
          type: 'string',
          interface: 'input',
          ...(index === DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_FIELDS.length - 1
            ? { description: 'This described field is intentionally outside the supplied generated form groups.' }
            : {}),
        })),
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: GENERATED_POPUP_RELATION_OVERRIDE_TARGET_COLLECTION,
        title: 'Flow surface relation override targets',
        titleField: 'id',
        filterTargetKey: 'id',
        fields: [
          {
            name: 'name',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION,
        title: 'Flow surface relation override sources',
        fields: GENERATED_POPUP_RELATION_OVERRIDE_FIELDS.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections.fields', GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION).create({
      values: {
        name: GENERATED_POPUP_RELATION_OVERRIDE_FIELD,
        type: 'belongsTo',
        target: GENERATED_POPUP_RELATION_OVERRIDE_TARGET_COLLECTION,
        foreignKey: `${GENERATED_POPUP_RELATION_OVERRIDE_FIELD}Id`,
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: TITLE_FIELD_DIAGNOSTICS_WIDE_TARGET_COLLECTION,
        title: 'Flow surface titleField diagnostics wide targets',
        fields: TITLE_FIELD_DIAGNOSTICS_WIDE_FIELDS.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: TITLE_FIELD_DIAGNOSTICS_WIDE_SOURCE_COLLECTION,
        title: 'Flow surface titleField diagnostics wide sources',
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    await rootAgent.resource('collections.fields', TITLE_FIELD_DIAGNOSTICS_WIDE_SOURCE_COLLECTION).create({
      values: {
        name: TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD,
        type: 'belongsTo',
        target: TITLE_FIELD_DIAGNOSTICS_WIDE_TARGET_COLLECTION,
        foreignKey: `${TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD}Id`,
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [LARGE_GENERATED_POPUP_COLLECTION]: LARGE_GENERATED_POPUP_FIELDS,
      [LARGE_GENERATED_POPUP_SOURCE_COLLECTION]: ['title', 'largeRecordId'],
      [LARGE_GENERATED_POPUP_M2M_SOURCE_COLLECTION]: ['title'],
      [LARGE_GENERATED_POPUP_M2M_THROUGH_COLLECTION]: ['id', 'sourceId', 'targetId'],
      [LARGE_GENERATED_POPUP_KANBAN_COLLECTION]: [
        'title',
        'status',
        'status_sort',
        ...LARGE_GENERATED_POPUP_KANBAN_EXTRA_FIELDS,
      ],
      [LARGE_GENERATED_POPUP_UNSUPPORTED_COLLECTION]: LARGE_GENERATED_POPUP_UNSUPPORTED_FIELDS,
      [LARGE_GENERATED_POPUP_CODE_COLLECTION]: LARGE_GENERATED_POPUP_CODE_FIELDS,
      [GENERATED_POPUP_TEN_EFFECTIVE_COLLECTION]: [...GENERATED_POPUP_TEN_EFFECTIVE_FIELDS, 'internalSort'],
      [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: ['title', 'notes'],
      [DESCRIPTION_FORM_BEHAVIOR_IGNORED_COLLECTION]: ['title', 'internalNotes'],
      [DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_COLLECTION]: DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_FIELDS,
      [GENERATED_POPUP_RELATION_OVERRIDE_TARGET_COLLECTION]: ['name'],
      [GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION]: [
        ...GENERATED_POPUP_RELATION_OVERRIDE_FIELDS,
        `${GENERATED_POPUP_RELATION_OVERRIDE_FIELD}Id`,
      ],
      [TITLE_FIELD_DIAGNOSTICS_WIDE_TARGET_COLLECTION]: TITLE_FIELD_DIAGNOSTICS_WIDE_FIELDS,
      [TITLE_FIELD_DIAGNOSTICS_WIDE_SOURCE_COLLECTION]: ['title', `${TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD}Id`],
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

  it('should resolve popup-local reaction targets inside fieldGroups field popups', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      blocks: [
        {
          key: 'employeeDetails',
          type: 'details',
          collection: 'employees',
          fieldGroups: [
            {
              title: 'Main',
              fields: [
                {
                  field: 'department',
                  popup: {
                    blocks: [
                      {
                        key: 'departmentPopupDetails',
                        type: 'details',
                        collection: 'departments',
                        fields: ['title'],
                      },
                    ],
                    reaction: {
                      items: [
                        {
                          target: 'departmentPopupDetails',
                          rules: [],
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(errors.map((error: any) => error.ruleId)).not.toContain('reaction-target-unknown');
  });

  it('should resolve scoped popup-local reaction targets inside applyBlueprint fieldGroups field popups', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Field group scoped popup reaction page',
        },
      },
      tabs: [
        {
          key: 'main',
          title: 'Main',
          blocks: [
            {
              key: 'employeeDetails',
              type: 'details',
              collection: 'employees',
              fieldGroups: [
                {
                  title: 'Main',
                  fields: [
                    {
                      field: 'department',
                      popup: {
                        blocks: [
                          {
                            key: 'departmentPopupDetails',
                            type: 'details',
                            collection: 'departments',
                            fields: ['title'],
                          },
                        ],
                        reaction: {
                          items: [
                            {
                              target: 'main.employeeDetails.department.popup.departmentPopupDetails',
                              rules: [],
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(errors.map((error: any) => error.ruleId)).not.toContain('reaction-target-unknown');
  });

  it('should resolve scoped field reaction targets inside applyBlueprint fieldGroups', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Field group scoped field reaction page',
        },
      },
      tabs: [
        {
          key: 'main',
          title: 'Main',
          blocks: [
            {
              key: 'employeeDetails',
              type: 'details',
              collection: 'employees',
              fieldGroups: [
                {
                  title: 'Main',
                  fields: [
                    {
                      field: 'department',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      reaction: {
        items: [
          {
            target: 'main.employeeDetails.department',
            rules: [],
          },
        ],
      },
    });

    expect(errors.map((error: any) => error.ruleId)).not.toContain('reaction-target-unknown');
  });

  it('should resolve scoped field reaction targets for applyBlueprint fieldGroups string shorthand', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Field group string shorthand reaction page',
        },
      },
      tabs: [
        {
          key: 'main',
          title: 'Main',
          blocks: [
            {
              key: 'employeeDetails',
              type: 'details',
              collection: 'employees',
              fieldGroups: [
                {
                  title: 'Main',
                  fields: ['department'],
                },
              ],
            },
          ],
        },
      ],
      reaction: {
        items: [
          {
            target: 'main.employeeDetails.department',
            rules: [],
          },
        ],
      },
    });

    expect(errors.map((error: any) => error.ruleId)).not.toContain('reaction-target-unknown');
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

  it('should allow generated action popups when only ten effective popup fields are available', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring ten effective generated popup fields',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'tenEffectiveRecordsTable',
                type: 'table',
                collection: GENERATED_POPUP_TEN_EFFECTIVE_COLLECTION,
                fields: [GENERATED_POPUP_TEN_EFFECTIVE_FIELDS[0]],
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: GENERATED_POPUP_TEN_EFFECTIVE_FIELDS[0], operator: '$notEmpty' },
                    { path: GENERATED_POPUP_TEN_EFFECTIVE_FIELDS[1], operator: '$notEmpty' },
                    { path: GENERATED_POPUP_TEN_EFFECTIVE_FIELDS[2], operator: '$notEmpty' },
                    { path: GENERATED_POPUP_TEN_EFFECTIVE_FIELDS[3], operator: '$notEmpty' },
                  ],
                },
                actions: [
                  {
                    key: 'createTenEffectiveRecord',
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

    expect(response.status, readErrorMessage(response)).toBe(200);
    const data = getData(response);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await context.flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    const createAction = collectDescendantNodes(persistedTable, (item) => item?.use === 'AddNewActionModel')[0];
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
    const templateSurface = await context.flowRepo.findModelById(template.targetUid, { includeAsyncNode: true });
    const createForm = collectDescendantNodes(templateSurface, (item) => item?.use === 'CreateFormModel')[0];
    const generatedFieldPaths = collectDescendantNodes(
      createForm,
      (item) => !!item?.stepParams?.fieldSettings?.init?.fieldPath,
    ).map((item: any) => item.stepParams.fieldSettings.init.fieldPath);
    expect(generatedFieldPaths).toEqual(expect.arrayContaining(GENERATED_POPUP_TEN_EFFECTIVE_FIELDS));
    expect(generatedFieldPaths).not.toContain('internalSort');
  });

  it('should require explicit defaults formBehavior when generated add or edit popup fields have descriptions', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description form behavior missing',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'descriptionBehaviorTable',
                type: 'table',
                collection: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
                fields: ['title'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    const missingFormBehaviorError = response.body.errors.find(
      (error: any) => error.ruleId === 'missing-description-form-behavior',
    );
    expectStructuredError(missingFormBehaviorError, {
      status: 400,
      type: 'bad_request',
    });
    expect(missingFormBehaviorError).toMatchObject({
      path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehavior`,
      details: {
        collection: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
        dataSourceKey: 'main',
        actionTypes: ['addNew', 'edit'],
        describedFieldNames: ['title'],
        describedFields: [
          {
            name: 'title',
            title: 'title',
            interface: 'input',
            description: 'Title is required for generated add and edit forms.',
            actionTypes: ['addNew', 'edit'],
          },
        ],
        triggerPaths: [
          '$.tabs[0].blocks[0].actions.addNew',
          '$.tabs[0].blocks[0].recordActions.view',
          '$.tabs[0].blocks[0].recordActions.edit',
        ],
      },
    });
    expect(missingFormBehaviorError.message).toContain(
      `defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehavior`,
    );
    expect(missingFormBehaviorError.message).toContain('Generate structured formBehavior');
    expect(missingFormBehaviorError.message).toContain('formBehaviorDescriptionReview');
  });

  it('should accept structured formBehavior coverage or review coverage for described generated fields', async () => {
    for (const [label, collectionDefaults] of [
      [
        'structured',
        {
          formBehavior: {
            addNew: {
              fields: {
                title: {
                  settings: {
                    required: true,
                  },
                },
              },
            },
            edit: {
              fields: {
                title: {
                  settings: {
                    required: true,
                  },
                },
              },
            },
          },
        },
      ],
      [
        'review',
        {
          formBehaviorDescriptionReview: {
            fields: ['title'],
            hasTried: true,
          },
        },
      ],
    ] as const) {
      const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          mode: 'create',
          navigation: {
            item: {
              title: `Authoring description form behavior ${label}`,
            },
          },
          defaults: {
            collections: {
              [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
                ...collectionDefaults,
              },
            },
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  key: `descriptionBehaviorTable${label}`,
                  type: 'table',
                  collection: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
                  fields: ['title'],
                },
              ],
            },
          ],
        },
      });

      expect(response.status, readErrorMessage(response)).toBe(200);
    }
  });

  it('should reject null defaults formBehavior and invalid review coverage', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description form behavior invalid no-op',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
              formBehavior: null,
              formBehaviorDescriptionReview: {
                fields: [],
                hasTried: false,
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'descriptionBehaviorNullTable',
                type: 'table',
                collection: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
                fields: ['title'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehavior`,
          ruleId: 'defaults-formBehavior-invalid-shape',
        }),
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview.fields`,
          ruleId: 'defaults-formBehaviorDescriptionReview-fields-required',
        }),
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview.hasTried`,
          ruleId: 'defaults-formBehaviorDescriptionReview-hasTried-required',
        }),
      ]),
    );
  });

  it('should keep nested null formBehavior scenes invalid', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description form behavior nested null',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
              formBehavior: {
                addNew: null,
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'descriptionBehaviorNestedNullTable',
                type: 'table',
                collection: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
                fields: ['title'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehavior.addNew`,
          ruleId: 'defaults-formBehavior-scene-invalid-shape',
        }),
      ]),
    );
  });

  it('should not require defaults formBehavior when described fields are outside generated add and edit candidates', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description form behavior ignored candidate',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'descriptionBehaviorIgnoredTable',
                type: 'table',
                collection: DESCRIPTION_FORM_BEHAVIOR_IGNORED_COLLECTION,
                fields: ['title'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
  });

  it('should not require defaults formBehavior for described fields excluded from generated add and edit candidates', async () => {
    const sourceCollection = {
      name: 'description_form_behavior_excluded_candidates',
      getFields: () => [
        {
          name: 'title',
          type: 'string',
          interface: 'input',
        },
        {
          name: 'owner',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'description_form_behavior_excluded_users',
          foreignKey: 'ownerId',
        },
        {
          name: 'ownerId',
          type: 'string',
          interface: 'input',
          description: 'Foreign key storage should not affect generated add and edit form defaults.',
        },
        {
          name: 'tags',
          type: 'belongsToMany',
          interface: 'm2m',
          target: 'description_form_behavior_excluded_tags',
          description: 'Multi-value association should not affect generated add and edit form defaults.',
        },
        {
          name: 'createdById',
          type: 'bigInt',
          interface: 'createdById',
          description: 'System creator id should not affect generated add and edit form defaults.',
        },
        {
          name: 'createdAt',
          type: 'datetime',
          interface: 'createdAt',
          description: 'Audit timestamp should not affect generated add and edit form defaults.',
        },
      ],
    };
    const collectionByName = new Map<string, any>([
      [sourceCollection.name, sourceCollection],
      [
        'description_form_behavior_excluded_users',
        {
          name: 'description_form_behavior_excluded_users',
          titleField: 'nickname',
          getFields: () => [
            {
              name: 'nickname',
              type: 'string',
              interface: 'input',
            },
          ],
        },
      ],
      [
        'description_form_behavior_excluded_tags',
        {
          name: 'description_form_behavior_excluded_tags',
          titleField: 'name',
          getFields: () => [
            {
              name: 'name',
              type: 'string',
              interface: 'input',
            },
          ],
        },
      ],
    ]);

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        defaults: {
          collections: {
            [sourceCollection.name]: {
              popups: {
                addNew: {
                  name: 'Create excluded candidate',
                  description: 'Create one excluded candidate record.',
                },
                edit: {
                  name: 'Edit excluded candidate',
                  description: 'Edit one excluded candidate record.',
                },
                view: {
                  name: 'View excluded candidate',
                  description: 'View one excluded candidate record.',
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
                key: 'excludedCandidateTable',
                type: 'table',
                collection: sourceCollection.name,
                fields: ['title'],
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => collectionByName.get(collectionName) || null,
      },
    );

    expect(errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `$.defaults.collections.${sourceCollection.name}.formBehavior`,
          ruleId: 'missing-description-form-behavior',
        }),
      ]),
    );
  });

  it('should not add missing formBehavior when the described field is outside supplied generated form fieldGroups', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description form behavior field group filtered',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Visible fields',
                  fields: DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_FIELDS.slice(0, 10),
                },
              ],
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'descriptionBehaviorFieldGroupTable',
                type: 'table',
                collection: DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_COLLECTION,
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
                    key: 'createDescriptionBehaviorFieldGroupRecord',
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
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_COLLECTION}.fieldGroups`,
          ruleId: 'default-field-groups-incomplete',
        }),
      ]),
    );
    expect(response.body.errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_FIELD_GROUP_COLLECTION}.formBehavior`,
          ruleId: 'missing-description-form-behavior',
        }),
      ]),
    );
  });

  it('should use datasource-aware generated popup default fieldGroups paths', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'externalLargeRecordsTable',
            type: 'table',
            resource: {
              dataSourceKey: 'external',
              collectionName: LARGE_GENERATED_POPUP_COLLECTION,
            },
            fields: ['field1'],
            actions: [
              {
                key: 'createExternalLargeRecord',
                type: 'addNew',
                popup: {},
              },
            ],
          },
        ],
      },
      {
        getCollection: (dataSourceKey, collectionName) =>
          dataSourceKey === 'external' ? context.db.getCollection(collectionName) : null,
      },
    );

    const missingDefaultsError = errors.find((error: any) => error.ruleId === 'missing-default-field-groups');
    expect(missingDefaultsError).toMatchObject({
      path: `$.defaults.dataSources.external.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
      details: {
        collection: LARGE_GENERATED_POPUP_COLLECTION,
        dataSourceKey: 'external',
        businessFieldCount: 11,
      },
    });
  });

  it('should accept datasource-aware generated popup default fieldGroups', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        target: { uid: 'missing-target-never-resolved' },
        defaults: {
          dataSources: {
            external: {
              collections: {
                [LARGE_GENERATED_POPUP_COLLECTION]: {
                  fieldGroups: [
                    {
                      title: 'External large fields',
                      fields: LARGE_GENERATED_POPUP_FIELDS,
                    },
                  ],
                },
              },
            },
          },
        },
        blocks: [
          {
            key: 'externalLargeRecordsTable',
            type: 'table',
            resource: {
              dataSourceKey: 'external',
              collectionName: LARGE_GENERATED_POPUP_COLLECTION,
            },
            fields: ['field1'],
            actions: [
              {
                key: 'createExternalLargeRecord',
                type: 'addNew',
                popup: {},
              },
            ],
          },
        ],
      },
      {
        getCollection: (dataSourceKey, collectionName) =>
          dataSourceKey === 'external' ? context.db.getCollection(collectionName) : null,
      },
    );

    expect(errors.map((error: any) => error.ruleId)).not.toContain('missing-default-field-groups');
    expect(errors.map((error: any) => error.ruleId)).not.toContain('default-field-groups-incomplete');
  });

  it('should prefer datasource-aware main defaults over stale legacy alias defaults during validation', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      defaults: {
        collections: {
          [LARGE_GENERATED_POPUP_COLLECTION]: {
            fieldGroups: [
              {
                title: 'Stale legacy alias',
                fields: ['field1', 'unknownLegacyField'],
              },
            ],
          },
        },
        dataSources: {
          main: {
            collections: {
              [LARGE_GENERATED_POPUP_COLLECTION]: {
                fieldGroups: [
                  {
                    title: 'Main datasource',
                    fields: LARGE_GENERATED_POPUP_FIELDS,
                  },
                ],
              },
            },
          },
        },
      },
      blocks: [
        {
          key: 'largeRecordsTable',
          type: 'table',
          collection: LARGE_GENERATED_POPUP_COLLECTION,
          fields: ['field1'],
          actions: [
            {
              key: 'createLargeRecord',
              type: 'addNew',
              popup: {},
            },
          ],
        },
      ],
    });

    expect(errors.map((error: any) => error.path)).not.toContain(
      `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups[0].fields[1]`,
    );
    expect(errors.map((error: any) => error.ruleId)).not.toContain('default-field-group-unknown-field');
    expect(errors.map((error: any) => error.ruleId)).not.toContain('missing-default-field-groups');
    expect(errors.map((error: any) => error.ruleId)).not.toContain('default-field-groups-incomplete');
  });

  it('should ignore malformed shadowed legacy main defaults during authoring validation', async () => {
    const values = {
      target: { uid: 'missing-target-never-resolved' },
      defaults: {
        collections: {
          [LARGE_GENERATED_POPUP_COLLECTION]: {
            fieldGroups: [
              {
                title: 'Malformed stale legacy alias',
                fields: [{ titleField: 'missingFieldPath' }],
              },
            ],
          },
        },
        dataSources: {
          main: {
            collections: {
              [LARGE_GENERATED_POPUP_COLLECTION]: {
                fieldGroups: [
                  {
                    title: 'Main datasource',
                    fields: LARGE_GENERATED_POPUP_FIELDS,
                  },
                ],
              },
            },
          },
        },
      },
      blocks: [
        {
          key: 'largeRecordsTable',
          type: 'table',
          collection: LARGE_GENERATED_POPUP_COLLECTION,
          fields: ['field1'],
          actions: [
            {
              key: 'createLargeRecord',
              type: 'addNew',
              popup: {},
            },
          ],
        },
      ],
    };
    const composeErrors = await collectFlowSurfaceAuthoringErrors('compose', values);
    const configureErrors = await collectFlowSurfaceAuthoringErrors('configure', {
      ...values,
      changes: {
        openView: {
          dataSourceKey: 'main',
          collectionName: LARGE_GENERATED_POPUP_COLLECTION,
          mode: 'modal',
        },
      },
    });

    for (const errors of [composeErrors, configureErrors]) {
      expect(errors.map((error: any) => error.path)).not.toContain(
        `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups[0].fields[0].field`,
      );
      expect(errors.map((error: any) => error.ruleId)).not.toContain('defaults-fieldGroups-field-field-required');
      expect(errors.map((error: any) => error.ruleId)).not.toContain('missing-default-field-groups');
      expect(errors.map((error: any) => error.ruleId)).not.toContain('default-field-groups-incomplete');
    }
  });

  it('should report malformed datasource-aware main defaults instead of shadowed legacy defaults', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      defaults: {
        collections: {
          [LARGE_GENERATED_POPUP_COLLECTION]: {
            fieldGroups: [
              {
                title: 'Malformed stale legacy alias',
                fields: [{ titleField: 'missingFieldPath' }],
              },
            ],
          },
        },
        dataSources: {
          main: {
            collections: {
              [LARGE_GENERATED_POPUP_COLLECTION]: {
                fieldGroups: [
                  {
                    title: 'Malformed main datasource',
                    fields: [{ titleField: 'missingFieldPath' }],
                  },
                ],
              },
            },
          },
        },
      },
      blocks: [
        {
          key: 'largeRecordsTable',
          type: 'table',
          collection: LARGE_GENERATED_POPUP_COLLECTION,
          fields: ['field1'],
          actions: [
            {
              key: 'createLargeRecord',
              type: 'addNew',
              popup: {},
            },
          ],
        },
      ],
    });

    expect(errors.map((error: any) => error.path)).toContain(
      `$.defaults.dataSources.main.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups[0].fields[0].field`,
    );
    expect(errors.map((error: any) => error.path)).not.toContain(
      `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups[0].fields[0].field`,
    );
  });

  it('should keep generated popup validation on malformed datasource-aware main defaults paths', async () => {
    const cases = [
      {
        title: 'with legacy alias',
        collections: {
          [LARGE_GENERATED_POPUP_COLLECTION]: {
            fieldGroups: [
              {
                title: 'Legacy alias',
                fields: LARGE_GENERATED_POPUP_FIELDS,
              },
            ],
          },
        },
      },
      {
        title: 'without legacy alias',
        collections: undefined,
      },
    ];

    for (const testCase of cases) {
      const errors = await collectFlowSurfaceAuthoringErrors('compose', {
        target: { uid: 'missing-target-never-resolved' },
        defaults: {
          collections: testCase.collections,
          dataSources: {
            main: {
              collections: {
                [LARGE_GENERATED_POPUP_COLLECTION]: 1,
              },
            },
          },
        },
        blocks: [
          {
            key: `largeRecordsTable-${testCase.title}`,
            type: 'table',
            collection: LARGE_GENERATED_POPUP_COLLECTION,
            fields: ['field1'],
            actions: [
              {
                key: 'createLargeRecord',
                type: 'addNew',
                popup: {},
              },
            ],
          },
        ],
      });

      expect(errors.map((error: any) => error.path)).not.toContain(
        `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
      );
      expect(errors.map((error: any) => error.path)).not.toContain(
        `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}`,
      );
      expect(errors.map((error: any) => error.path)).toContain(
        `$.defaults.dataSources.main.collections.${LARGE_GENERATED_POPUP_COLLECTION}`,
      );
    }
  });

  it('should include default relation titleField overrides when checking generated popup fieldGroups coverage', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring relation override effective popup fields',
          },
        },
        defaults: {
          collections: {
            [GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Main',
                  fields: [
                    ...GENERATED_POPUP_RELATION_OVERRIDE_FIELDS.slice(0, 9),
                    {
                      field: GENERATED_POPUP_RELATION_OVERRIDE_FIELD,
                      titleField: 'name',
                    },
                  ],
                },
              ],
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'relationOverrideRecordsTable',
                type: 'table',
                collection: GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION,
                fields: [GENERATED_POPUP_RELATION_OVERRIDE_FIELDS[0]],
                actions: [
                  {
                    key: 'createRelationOverrideRecord',
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
    const incompleteDefaultsError = response.body.errors.find(
      (error: any) => error.ruleId === 'default-field-groups-incomplete',
    );
    expect(incompleteDefaultsError).toMatchObject({
      path: `$.defaults.collections.${GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION}.fieldGroups`,
      details: {
        missingFieldNames: [GENERATED_POPUP_RELATION_OVERRIDE_FIELDS[9]],
      },
    });
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain('missing-default-field-groups');
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
                  fields: [
                    { field: LARGE_GENERATED_POPUP_RELATION_FIELD, titleField: 'id' },
                    { field: LARGE_GENERATED_POPUP_RELATION_FIELD, titleField: 'missingLargeRecordTitle' },
                  ],
                },
              ],
            },
            [TITLE_FIELD_DIAGNOSTICS_WIDE_SOURCE_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Wide relation',
                  fields: [
                    {
                      field: TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD,
                      titleField: 'missingWideTargetTitle',
                    },
                  ],
                },
              ],
            },
            employees: {
              fieldGroups: [
                {
                  title: 'Employee relation',
                  fields: [{ field: 'manager', titleField: 'department' }],
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
        'relation-titleField-unknown',
      ]),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups[0].fields[1]`,
        `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
        `$.defaults.collections.${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.fieldGroups[0].fields[0].titleField`,
        `$.defaults.collections.${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.fieldGroups[0].fields[1].titleField`,
        `$.defaults.collections.${TITLE_FIELD_DIAGNOSTICS_WIDE_SOURCE_COLLECTION}.fieldGroups[0].fields[0].titleField`,
        '$.defaults.collections.employees.fieldGroups[0].fields[0].titleField',
      ]),
    );
    const defaultUnreadableError = response.body.errors.find(
      (error: any) =>
        error.path ===
        `$.defaults.collections.${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.fieldGroups[0].fields[0].titleField`,
    );
    expect(defaultUnreadableError).toMatchObject({
      ruleId: 'relation-titleField-unreadable',
      details: {
        action: 'compose',
        fieldPath: LARGE_GENERATED_POPUP_RELATION_FIELD,
        titleField: 'id',
        targetCollection: LARGE_GENERATED_POPUP_COLLECTION,
        invalidReason: 'id',
        availableFields: LARGE_GENERATED_POPUP_FIELDS,
        suggestion: expect.any(String),
      },
    });
    expect(defaultUnreadableError.details.availableFields).not.toContain('id');
    expect(defaultUnreadableError.details.availableFields).not.toContain(LARGE_GENERATED_POPUP_RELATION_FIELD);

    const defaultMissingError = response.body.errors.find(
      (error: any) =>
        error.path ===
        `$.defaults.collections.${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.fieldGroups[0].fields[1].titleField`,
    );
    expect(defaultMissingError).toMatchObject({
      ruleId: 'relation-titleField-unknown',
      details: {
        action: 'compose',
        fieldPath: LARGE_GENERATED_POPUP_RELATION_FIELD,
        titleField: 'missingLargeRecordTitle',
        targetCollection: LARGE_GENERATED_POPUP_COLLECTION,
        invalidReason: 'missing',
        availableFields: LARGE_GENERATED_POPUP_FIELDS,
        suggestion: expect.any(String),
      },
    });
    expect(defaultMissingError.details.availableFields).not.toContain('id');
    expect(defaultMissingError.details.availableFields).not.toContain(LARGE_GENERATED_POPUP_RELATION_FIELD);

    const defaultWideMissingError = response.body.errors.find(
      (error: any) =>
        error.path ===
        `$.defaults.collections.${TITLE_FIELD_DIAGNOSTICS_WIDE_SOURCE_COLLECTION}.fieldGroups[0].fields[0].titleField`,
    );
    expect(defaultWideMissingError).toMatchObject({
      ruleId: 'relation-titleField-unknown',
      details: {
        action: 'compose',
        fieldPath: TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD,
        titleField: 'missingWideTargetTitle',
        targetCollection: TITLE_FIELD_DIAGNOSTICS_WIDE_TARGET_COLLECTION,
        invalidReason: 'missing',
        availableFields: TITLE_FIELD_DIAGNOSTICS_WIDE_FIELDS.slice(0, 20),
        availableFieldsTruncated: true,
        suggestion: expect.any(String),
      },
    });
    expect(defaultWideMissingError.details.availableFields).not.toContain('id');
    expect(defaultWideMissingError.details.availableFields).not.toContain(TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD);
    expect(defaultWideMissingError.details.availableFields).not.toContain(TITLE_FIELD_DIAGNOSTICS_WIDE_FIELDS[20]);

    const defaultAssociationError = response.body.errors.find(
      (error: any) => error.path === '$.defaults.collections.employees.fieldGroups[0].fields[0].titleField',
    );
    expect(defaultAssociationError).toMatchObject({
      ruleId: 'relation-titleField-unreadable',
      details: {
        action: 'compose',
        fieldPath: 'manager',
        titleField: 'department',
        targetCollection: 'employees',
        invalidReason: 'association',
        availableFields: expect.arrayContaining(['nickname', 'status', 'email', 'phone']),
        suggestion: expect.any(String),
      },
    });
    expect(defaultAssociationError.details.availableFields).not.toContain('id');
    expect(defaultAssociationError.details.availableFields).not.toContain('department');
    expect(defaultAssociationError.details.availableFields).not.toContain('manager');
  });

  it('should validate external datasource default fieldGroups with datasource-aware paths', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        target: { uid: 'missing-target-never-resolved' },
        defaults: {
          dataSources: {
            external: {
              collections: {
                [LARGE_GENERATED_POPUP_SOURCE_COLLECTION]: {
                  fieldGroups: [
                    {
                      title: 'External relation',
                      fields: [
                        'unknownField',
                        { field: LARGE_GENERATED_POPUP_RELATION_FIELD, titleField: 'missingLargeRecordTitle' },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        getCollection: (dataSourceKey, collectionName) =>
          dataSourceKey === 'external' ? context.db.getCollection(collectionName) : null,
      },
    );

    expect(errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['default-field-group-unknown-field', 'relation-titleField-unknown']),
    );
    expect(errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        `$.defaults.dataSources.external.collections.${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.fieldGroups[0].fields[0]`,
        `$.defaults.dataSources.external.collections.${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.fieldGroups[0].fields[1].titleField`,
      ]),
    );
    expect(
      errors.find(
        (error: any) =>
          error.path ===
          `$.defaults.dataSources.external.collections.${LARGE_GENERATED_POPUP_SOURCE_COLLECTION}.fieldGroups[0].fields[1].titleField`,
      ),
    ).toMatchObject({
      details: {
        targetCollection: LARGE_GENERATED_POPUP_COLLECTION,
        invalidReason: 'missing',
      },
    });
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

  it('should reject applyBlueprint generated view popups when generated relation field popups need target default fieldGroups', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring generated view relation popup missing defaults',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'sourceRecordsTable',
                type: 'table',
                collection: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
                fields: ['title'],
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
      details: {
        collection: LARGE_GENERATED_POPUP_COLLECTION,
        businessFieldCount: 11,
        actionTypes: ['view'],
      },
    });
    expect(missingDefaultsError.details.triggerPaths).toContain(
      `$.tabs[0].blocks[0].recordActions.view.fields.${LARGE_GENERATED_POPUP_RELATION_FIELD}.popup`,
    );
  });

  it('should reject compose generated view popups when generated relation field popups need target default fieldGroups', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring compose generated view relation popup missing defaults page',
      tabTitle: 'Overview',
    });
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'sourceRecordsTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
            },
            fields: ['title'],
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
        actionTypes: ['view'],
      },
    });
    expect(missingDefaultsError.details.triggerPaths).toContain(
      `$.blocks[0].recordActions.view.fields.${LARGE_GENERATED_POPUP_RELATION_FIELD}.popup`,
    );
  });

  it('should accept generated view relation popups when target default fieldGroups are provided', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring generated view relation popup with target defaults page',
      tabTitle: 'Overview',
    });
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
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
            },
          },
        },
        blocks: [
          {
            key: 'sourceRecordsTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
            },
            fields: ['title'],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
  });

  it('should not require target defaults when intermediate view fieldGroups omit the relation field', async () => {
    const unique = Date.now();
    const sourceCollection = `flow_surface_generated_popup_source_defaults_${unique}`;
    const sourceFields = Array.from({ length: 11 }, (_item, index) => `sourceField${index + 1}`);
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        fields: sourceFields.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: LARGE_GENERATED_POPUP_RELATION_FIELD,
        type: 'belongsTo',
        target: LARGE_GENERATED_POPUP_COLLECTION,
        foreignKey: `${LARGE_GENERATED_POPUP_RELATION_FIELD}Id`,
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [sourceCollection]: [...sourceFields, `${LARGE_GENERATED_POPUP_RELATION_FIELD}Id`],
    });

    const page = await createPage(rootAgent, {
      title: 'Authoring generated view source defaults omit relation page',
      tabTitle: 'Overview',
    });
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        defaults: {
          collections: {
            [sourceCollection]: {
              fieldGroups: [
                {
                  title: 'Source',
                  fields: sourceFields,
                },
              ],
            },
          },
        },
        blocks: [
          {
            key: 'sourceRecordsTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: sourceCollection,
            },
            fields: [sourceFields[0]],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(
      response.body.errors.find(
        (error: any) =>
          error.ruleId === 'missing-default-field-groups' &&
          error.details?.collection === LARGE_GENERATED_POPUP_COLLECTION,
      ),
    ).toBeUndefined();
    expect(
      response.body.errors.find(
        (error: any) =>
          error.ruleId === 'default-field-groups-incomplete' && error.details?.collection === sourceCollection,
      ),
    ).toMatchObject({
      details: {
        missingFieldNames: [LARGE_GENERATED_POPUP_RELATION_FIELD],
      },
    });
  });

  it('should not expand generated addNew and edit form popups through relation selector fields', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring generated form relation selector defaults page',
      tabTitle: 'Overview',
    });
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'sourceRecordsList',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
            },
            fields: ['title'],
          },
          {
            key: 'sourceDetails',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: LARGE_GENERATED_POPUP_SOURCE_COLLECTION,
            },
            fields: ['title'],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
  });

  it('should not expand multi-value relation fields in generated view popups', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring generated view m2m relation defaults page',
      tabTitle: 'Overview',
    });
    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'm2mSourceRecordsTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: LARGE_GENERATED_POPUP_M2M_SOURCE_COLLECTION,
            },
            fields: ['title'],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
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

  it('should not require generated addNew popup defaults when only form-unusable fields are available', async () => {
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
    expect(response.body.errors.map((error: any) => error.ruleId)).toContain('defaultFilter-field-ineligible');
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain('missing-default-field-groups');
  });

  it('should not require generated addNew popup defaults when fields are owned by disabled plugins', async () => {
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
    expect(response.body.errors.map((error: any) => error.ruleId)).toContain('defaultFilter-field-ineligible');
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain('missing-default-field-groups');
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

  it('should reject configure generated view popups when generated relation field popups need target default fieldGroups', async () => {
    const unique = Date.now();
    const sourceCollection = `flow_surface_configure_generated_popup_src_${unique}`;
    const sourceFields = Array.from({ length: 11 }, (_item, index) => `sourceField${index + 1}`);
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        fields: sourceFields.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: LARGE_GENERATED_POPUP_RELATION_FIELD,
        type: 'belongsTo',
        target: LARGE_GENERATED_POPUP_COLLECTION,
        foreignKey: `${LARGE_GENERATED_POPUP_RELATION_FIELD}Id`,
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [sourceCollection]: [...sourceFields, `${LARGE_GENERATED_POPUP_RELATION_FIELD}Id`],
    });

    const page = await createPage(rootAgent, {
      title: 'Authoring configure generated view relation popup page',
      tabTitle: 'Authoring configure generated view relation popup tab',
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
        defaults: {
          collections: {
            [sourceCollection]: {
              fieldGroups: [
                {
                  title: 'Source',
                  fields: [...sourceFields, LARGE_GENERATED_POPUP_RELATION_FIELD],
                },
              ],
            },
          },
        },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: sourceCollection,
            mode: 'modal',
          },
        },
      },
    });

    expect(response.status).toBe(400);
    const missingDefaultsError = response.body.errors.find(
      (error: any) =>
        error.ruleId === 'missing-default-field-groups' &&
        error.details?.collection === LARGE_GENERATED_POPUP_COLLECTION,
    );
    expect(missingDefaultsError).toMatchObject({
      path: `$.defaults.collections.${LARGE_GENERATED_POPUP_COLLECTION}.fieldGroups`,
      details: {
        collection: LARGE_GENERATED_POPUP_COLLECTION,
        businessFieldCount: 11,
        actionTypes: ['view'],
      },
    });
    expect(missingDefaultsError.details.triggerPaths).toContain(
      `$.changes.openView.fields.${LARGE_GENERATED_POPUP_RELATION_FIELD}.popup`,
    );
  });

  it('should accept configure generated view relation popups when target default fieldGroups are provided', async () => {
    const unique = Date.now();
    const sourceCollection = `flow_surface_configure_generated_popup_ok_src_${unique}`;
    const sourceFields = Array.from({ length: 11 }, (_item, index) => `sourceField${index + 1}`);
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        fields: sourceFields.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: LARGE_GENERATED_POPUP_RELATION_FIELD,
        type: 'belongsTo',
        target: LARGE_GENERATED_POPUP_COLLECTION,
        foreignKey: `${LARGE_GENERATED_POPUP_RELATION_FIELD}Id`,
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [sourceCollection]: [...sourceFields, `${LARGE_GENERATED_POPUP_RELATION_FIELD}Id`],
    });

    const page = await createPage(rootAgent, {
      title: 'Authoring configure generated view relation popup ok page',
      tabTitle: 'Authoring configure generated view relation popup ok tab',
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
        defaults: {
          collections: {
            [sourceCollection]: {
              fieldGroups: [
                {
                  title: 'Source',
                  fields: [...sourceFields, LARGE_GENERATED_POPUP_RELATION_FIELD],
                },
              ],
            },
            [LARGE_GENERATED_POPUP_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Target core',
                  fields: LARGE_GENERATED_POPUP_FIELDS,
                },
              ],
            },
          },
        },
        changes: {
          openView: {
            dataSourceKey: 'main',
            collectionName: sourceCollection,
            mode: 'modal',
          },
        },
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
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

  it('should reject explicit defaultFilter payloads with fewer than three fields', async () => {
    const twoFieldDefaultFilter = {
      logic: '$and',
      items: [
        { path: 'nickname', operator: '$notEmpty' },
        { path: 'status', operator: '$notEmpty' },
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
            defaultFilter: twoFieldDefaultFilter,
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
                  defaultFilter: twoFieldDefaultFilter,
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
                defaultFilter: twoFieldDefaultFilter,
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
        fieldCount: 2,
        requiredFieldCount: 3,
        fieldNames: ['nickname', 'status'],
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
                fieldPath: 'manager',
                titleField: 'department',
              },
              {
                fieldPath: 'status',
                titleField: 'nickname',
              },
            ],
          },
          {
            key: 'wideRelationTitleFields',
            type: 'details',
            collection: TITLE_FIELD_DIAGNOSTICS_WIDE_SOURCE_COLLECTION,
            fields: [
              {
                fieldPath: TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD,
                titleField: 'missingWideTargetTitle',
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
        '$.blocks[0].fields[3].titleField',
        '$.blocks[1].fields[0].titleField',
      ]),
    );
    const missingTitleFieldError = response.body.errors.find(
      (error: any) => error.path === '$.blocks[0].fields[0].titleField',
    );
    expect(missingTitleFieldError).toMatchObject({
      ruleId: 'relation-titleField-unknown',
      details: {
        action: 'compose',
        fieldPath: 'department',
        titleField: 'missingDepartmentTitle',
        targetCollection: 'departments',
        invalidReason: 'missing',
        availableFields: expect.arrayContaining(['title', 'code', 'status', 'scope']),
        suggestion: expect.any(String),
      },
    });
    expect(missingTitleFieldError.details.availableFields).not.toContain('id');
    expect(missingTitleFieldError.details.availableFields).not.toContain('employees');

    const idTitleFieldError = response.body.errors.find(
      (error: any) => error.path === '$.blocks[0].fields[1].titleField',
    );
    expect(idTitleFieldError).toMatchObject({
      ruleId: 'relation-titleField-unreadable',
      details: {
        action: 'compose',
        fieldPath: 'department',
        titleField: 'id',
        targetCollection: 'departments',
        invalidReason: 'id',
        availableFields: expect.arrayContaining(['title', 'code', 'status', 'scope']),
        suggestion: expect.any(String),
      },
    });
    expect(idTitleFieldError.details.availableFields).not.toContain('id');
    expect(idTitleFieldError.details.availableFields).not.toContain('employees');

    const associationTitleFieldError = response.body.errors.find(
      (error: any) => error.path === '$.blocks[0].fields[2].titleField',
    );
    expect(associationTitleFieldError).toMatchObject({
      ruleId: 'relation-titleField-unreadable',
      details: {
        action: 'compose',
        fieldPath: 'manager',
        titleField: 'department',
        targetCollection: 'employees',
        invalidReason: 'association',
        availableFields: expect.arrayContaining(['nickname', 'status', 'email', 'phone']),
        suggestion: expect.any(String),
      },
    });
    expect(associationTitleFieldError.details.availableFields).not.toContain('id');
    expect(associationTitleFieldError.details.availableFields).not.toContain('department');
    expect(associationTitleFieldError.details.availableFields).not.toContain('manager');

    const wideMissingTitleFieldError = response.body.errors.find(
      (error: any) => error.path === '$.blocks[1].fields[0].titleField',
    );
    expect(wideMissingTitleFieldError).toMatchObject({
      ruleId: 'relation-titleField-unknown',
      details: {
        action: 'compose',
        fieldPath: TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD,
        titleField: 'missingWideTargetTitle',
        targetCollection: TITLE_FIELD_DIAGNOSTICS_WIDE_TARGET_COLLECTION,
        invalidReason: 'missing',
        availableFields: TITLE_FIELD_DIAGNOSTICS_WIDE_FIELDS.slice(0, 20),
        availableFieldsTruncated: true,
        suggestion: expect.any(String),
      },
    });
    expect(wideMissingTitleFieldError.details.availableFields).not.toContain('id');
    expect(wideMissingTitleFieldError.details.availableFields).not.toContain(
      TITLE_FIELD_DIAGNOSTICS_WIDE_RELATION_FIELD,
    );
    expect(wideMissingTitleFieldError.details.availableFields).not.toContain(TITLE_FIELD_DIAGNOSTICS_WIDE_FIELDS[20]);
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
