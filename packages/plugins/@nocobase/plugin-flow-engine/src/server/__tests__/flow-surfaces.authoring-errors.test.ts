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
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { uid } from '@nocobase/utils';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';
import { collectFlowRegistryRunJsAuthoringErrors, inspectRunJsAuthoringCode } from '../flow-surfaces/runjs-authoring';

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
const GENERATED_POPUP_RELATION_BACKING_FK_TARGET_COLLECTION = 'flow_surface_relation_backing_fk_targets';
const GENERATED_POPUP_RELATION_BACKING_FK_COLLECTION = 'flow_surface_relation_backing_fk_sources';
const GENERATED_POPUP_RELATION_BACKING_FK_FIELDS = Array.from({ length: 9 }, (_item, index) => `field${index + 1}`);
const GENERATED_POPUP_RELATION_BACKING_FK_FIELD = 'customer';
const GENERATED_POPUP_RELATION_BACKING_FK_NAME = 'customer_id';
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
        name: GENERATED_POPUP_RELATION_BACKING_FK_TARGET_COLLECTION,
        title: 'Flow surface relation backing FK targets',
        titleField: 'name',
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
        name: GENERATED_POPUP_RELATION_BACKING_FK_COLLECTION,
        title: 'Flow surface relation backing FK sources',
        fields: [
          ...GENERATED_POPUP_RELATION_BACKING_FK_FIELDS.map((name) => ({
            name,
            type: 'string',
            interface: 'input',
          })),
          {
            name: GENERATED_POPUP_RELATION_BACKING_FK_NAME,
            type: 'integer',
            interface: 'integer',
          },
        ],
      },
    });
    await rootAgent.resource('collections.fields', GENERATED_POPUP_RELATION_BACKING_FK_COLLECTION).create({
      values: {
        name: GENERATED_POPUP_RELATION_BACKING_FK_FIELD,
        type: 'belongsTo',
        target: GENERATED_POPUP_RELATION_BACKING_FK_TARGET_COLLECTION,
        foreignKey: GENERATED_POPUP_RELATION_BACKING_FK_NAME,
        interface: 'm2o',
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
      [GENERATED_POPUP_RELATION_BACKING_FK_TARGET_COLLECTION]: ['name'],
      [GENERATED_POPUP_RELATION_BACKING_FK_COLLECTION]: [
        ...GENERATED_POPUP_RELATION_BACKING_FK_FIELDS,
        GENERATED_POPUP_RELATION_BACKING_FK_NAME,
      ],
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
    const calendarFieldsError = response.body.errors.find(
      (error: any) => error.ruleId === 'calendar-main-block-unsupported-fields',
    );
    expect(calendarFieldsError?.details?.repairHint).toContain('settings.titleField');
    expect(calendarFieldsError?.details?.repairHint).toContain('settings.startField');
    expect(calendarFieldsError?.details?.repairHint).toContain('settings.endField');
    expect(calendarFieldsError?.details?.repairHint).toContain('Keep block type calendar');
    expect(calendarFieldsError?.message).toContain('Keep block type calendar');
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

  it('should reject persisted table settings payloads before table writes', async () => {
    const composeErrors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      blocks: [
        {
          key: 'auditTable',
          type: 'table',
          collection: 'employees',
          stepParams: {
            tableSettings: {
              pageSize: { pageSize: 20 },
            },
          },
          settings: {
            pageSize: 20,
            tableSettings: {
              defaultSorting: {
                sort: [{ field: 'createdAt', direction: 'desc' }],
              },
            },
          },
        },
      ],
    });

    expect(composeErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.tableSettings',
          ruleId: 'table-settings-unsupported-key',
          details: expect.objectContaining({
            repairHint: expect.stringContaining('settings.sorting'),
          }),
        }),
        expect.objectContaining({
          path: '$.blocks[0].stepParams',
          ruleId: 'table-settings-unsupported-key',
        }),
      ]),
    );

    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'table-target' },
        changes: {
          title: 'Audit trail',
          tableSettings: {
            pageSize: { pageSize: 20 },
          },
          settings: {
            defaultSorting: {
              sort: [{ field: 'createdAt', direction: 'desc' }],
            },
          },
        },
      },
      { hostBlockType: 'table' },
    );

    expect(configureErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.tableSettings',
          ruleId: 'table-settings-unsupported-key',
        }),
        expect.objectContaining({
          path: '$.changes.settings.defaultSorting',
          ruleId: 'table-settings-unsupported-key',
        }),
      ]),
    );
    expect(configureErrors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.title',
          ruleId: 'table-settings-unsupported-key',
        }),
      ]),
    );
  });

  it('should aggregate non-canonical jsBlock public authoring shapes before writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      blocks: [
        {
          key: 'badTopLevelCode',
          type: 'jsBlock',
          code: 'ctx.render(null);',
          version: 'v2',
        },
        {
          key: 'badStepParams',
          type: 'jsBlock',
          settings: {
            code: 'ctx.render(null);',
            version: 'v2',
          },
          stepParams: {
            jsSettings: {
              runJs: {
                code: 'ctx.render(null);',
                version: 'v2',
              },
            },
          },
        },
        {
          key: 'badScript',
          type: 'jsBlock',
          script: {
            code: 'ctx.render(null);',
          },
        },
        {
          key: 'missingSource',
          type: 'jsBlock',
          settings: {
            title: 'Missing source',
          },
        },
        {
          key: 'badAlias',
          type: 'js',
          settings: {
            code: 'ctx.render(null);',
          },
        },
      ],
    });

    expect(errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'jsBlock-top-level-code-unsupported',
        'jsBlock-top-level-version-unsupported',
        'jsBlock-stepParams-unsupported',
        'jsBlock-script-unsupported',
        'jsBlock-source-required',
        'jsBlock-type-alias-unsupported',
      ]),
    );
    expect(errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].code',
        '$.blocks[0].version',
        '$.blocks[1].stepParams',
        '$.blocks[2].script',
        '$.blocks[3]',
        '$.blocks[4].type',
      ]),
    );
    errors.forEach((error: any) => {
      expect(error.message).toContain('settings.code');
      expect(error.details).toEqual(
        expect.objectContaining({
          requiredBlockType: 'jsBlock',
          fixStrategy: 'repair_same_block_type',
          agentInstruction: expect.stringContaining('fix every listed error'),
        }),
      );
    });
  });

  it('should expose backend RunJS repair metadata for all hard semantic rule families', async () => {
    const composeErrors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      blocks: [
        {
          key: 'missingRender',
          type: 'jsBlock',
          settings: {
            code: 'const title = "Missing render";',
          },
        },
        {
          key: 'functionWrapper',
          type: 'jsBlock',
          settings: {
            code: 'function Wrapped() { ctx.render(null); }',
          },
        },
        {
          key: 'arrowFunctionWrapper',
          type: 'jsBlock',
          settings: {
            code: 'const Wrapped = () => ctx.render(null);',
          },
        },
        {
          key: 'unreachableRender',
          type: 'jsBlock',
          settings: {
            code: 'return null;\nctx.render(null);',
          },
        },
        {
          key: 'callbackRender',
          type: 'jsBlock',
          settings: {
            code: 'setTimeout(() => ctx.render(null), 0);',
          },
        },
        {
          key: 'directDom',
          type: 'jsBlock',
          settings: {
            code: "ctx.element.innerHTML = '<strong>bad</strong>';",
          },
        },
        {
          key: 'resourceRequest',
          type: 'jsBlock',
          settings: {
            code: "ctx.render(null);\nawait ctx.request({ resource: 'users', action: 'list' });",
          },
        },
        {
          key: 'blockedGlobal',
          type: 'jsBlock',
          settings: {
            code: "ctx.render(null);\nawait fetch('/api/users');",
          },
        },
        {
          key: 'ctxMismatch',
          type: 'jsBlock',
          settings: {
            code: 'ctx.render(null);\nctx.unknownRoot();',
          },
        },
        {
          key: 'dynamicCtx',
          type: 'jsBlock',
          settings: {
            code: 'ctx.render(null);\nctx[memberName]();',
          },
        },
      ],
    });
    const directErrors = [
      ...inspectRunJsAuthoringCode({
        code: 'const amount = 1;',
        path: '$.valueMissingReturn.code',
        surface: 'reaction.value-runjs',
      }),
      ...inspectRunJsAuthoringCode({
        code: 'ctx.render(null);\nreturn 1;',
        path: '$.valueRender.code',
        surface: 'reaction.value-runjs',
      }),
      ...inspectRunJsAuthoringCode({
        code: 'ctx.render(null);',
        path: '$.unknownSurface.code',
        surface: 'mystery.runjs',
      }),
      ...inspectRunJsAuthoringCode({
        code: 'ctx.render(null);',
        path: '$.unknownModel.code',
        modelUse: 'MysteryModel',
      }),
    ];
    const errors = [...composeErrors, ...directErrors].filter((error: any) =>
      String(error.ruleId || '').startsWith('runjs-'),
    );

    expect(new Set(errors.map((error: any) => error.details?.repairClass))).toEqual(
      new Set([
        'switch-to-resource-api',
        'missing-top-level-return',
        'value-surface-forbids-render',
        'unknown-surface-stop',
        'unknown-model-stop',
        'replace-innerhtml-with-render',
        'render-top-level-function-wrapper',
        'render-unreachable-render-call',
        'ctx-root-mismatch-stop',
        'unknown-global-stop',
      ]),
    );
    errors.forEach((error: any) => {
      expect(error.message).toContain('Do not skip this JS/RunJS step.');
      expect(error.message).toContain('Suggested fix:');
      expect(error.details).toEqual(
        expect.objectContaining({
          repairClass: expect.any(String),
          suggestedAction: expect.any(String),
          skipForbidden: true,
          mustRetry: true,
          agentInstruction: expect.stringContaining('fix every listed error'),
          line: expect.any(Number),
          column: expect.any(Number),
        }),
      );
      expect(error.details.docsKey).toBeUndefined();
      expect(error.details.retryable).toBeUndefined();
      expect(error.details.suggestedSnippetIds).toBeUndefined();
      expect(error.details.modelUse).toBeUndefined();
      expect(error.details.surface).toBeUndefined();
      expect(error.details.surfaceStyle).toBeUndefined();
    });
    expect(errors.find((error: any) => error.details?.repairClass === 'switch-to-resource-api')?.message).toContain(
      'Fix the error and retry the same write.',
    );
    expect(errors.find((error: any) => error.details?.repairClass === 'ctx-root-mismatch-stop')?.message).toContain(
      'Resolve the blocking context/problem first, then retry the same write.',
    );
  });

  it('should allow legal RunJS render and action code on supported JS model surfaces', () => {
    expect(
      inspectRunJsAuthoringCode({ code: 'ctx.render(null);', path: '$.jsBlock.code', modelUse: 'JSBlockModel' }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({ code: 'ctx.render(null);', path: '$.jsColumn.code', modelUse: 'JSColumnModel' }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({ code: 'ctx.render(null);', path: '$.jsItem.code', modelUse: 'JSItemModel' }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: 'ctx.message.success("Done");',
        path: '$.jsAction.code',
        modelUse: 'JSActionModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: 'ctx.render(/fetch/.test(ctx.record?.name || ""));',
        path: '$.jsBlock.regex.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: 'const hasMatch = /fetch|process|localStorage/.test("fetch");\nreturn { title: { text: hasMatch ? "A" : "B" } };',
        path: '$.chart.visual.raw',
        modelUse: 'ChartOptionModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const rows = (ctx.data.objects || []).map((row) => ({ location: row.location, process: row.processName }));',
          'return { dataset: { source: rows }, series: [{ type: "bar" }] };',
        ].join('\n'),
        path: '$.chart.visual.propertyKeys.raw',
        modelUse: 'ChartOptionModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: 'const { fetch } = ctx.libs;\nctx.render(fetch);',
        path: '$.jsBlock.destructuredLocal.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const row = { location: "HQ", processName: "Sync" };',
          'const { location, processName: process } = row;',
          'const format = (localStorage) => localStorage;',
          'try { throw row; } catch (fetch) { ctx.render({ location, process, fetch: format(fetch) }); }',
        ].join('\n'),
        path: '$.jsBlock.localBindings.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const helper = { document: { createElement: () => null } };',
          'const { document } = helper;',
          'ctx.render(document.createElement("div"));',
        ].join('\n'),
        path: '$.jsBlock.shadowedDocument.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const helper = { navigator: { clipboard: "local" }, insertAdjacentHTML: () => "safe" };',
          'const { navigator, insertAdjacentHTML } = helper;',
          'ctx.render({ clip: navigator.clipboard, html: insertAdjacentHTML("<b>x</b>") });',
        ].join('\n'),
        path: '$.jsBlock.shadowedNavigatorAndInsertAdjacentHTML.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const helper = { window: { localStorage: "local" } };',
          'const { window } = helper;',
          'ctx.render(window["localStorage"]);',
        ].join('\n'),
        path: '$.jsBlock.shadowedWindowBracket.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const panel = { handler(navigator) { const clip = navigator.clipboard; } };',
          'class LocalPanel { handler(window) { const storage = window.localStorage; } }',
          'ctx.render({ panel, LocalPanel });',
        ].join('\n'),
        path: '$.jsBlock.methodParameterBindings.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const panel = { ["handler"](navigator) { const clip = navigator.clipboard; } };',
          'class LocalPanel { ["handler"](window) { const storage = window.localStorage; } }',
          'ctx.render({ panel, LocalPanel });',
        ].join('\n'),
        path: '$.jsBlock.computedMethodParameterBindings.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: "if (/process|fetch/.test(String(params?.name || ''))) {\n  chart.off('click');\n}",
        path: '$.chart.events.raw',
        modelUse: 'ChartEventsModel',
      }),
    ).toEqual([]);
  });

  it('should allow documented RunJS ctx roots on JS authoring surfaces', () => {
    const allowedCtxRootSnippets = [
      "ctx.render(null);\nawait ctx.openView('popup-uid', { mode: 'dialog' });",
      'ctx.render(null);\nctx.exit();',
      'ctx.render(null);\nctx.exitAll();',
      'ctx.render(ctx.view?.inputArgs?.viewUid);',
      "ctx.render(ctx.getModel('block-uid')?.uid);",
      'ctx.render(null);\nawait ctx.getApiInfos();',
      "ctx.render(null);\nawait ctx.getVarInfos({ path: 'record', maxDepth: 1 });",
      'ctx.render(null);\nawait ctx.getEnvInfos();',
      "ctx.render(null);\nawait ctx.resolveJsonTemplate('{{ ctx.record.id }}');",
      "ctx.render(null);\nctx.createResource('SingleRecordResource');",
      "ctx.render(null);\nctx.useResource('MultiRecordResource');",
      'ctx.render(ctx.blockModel?.uid);',
      'ctx.render(ctx.collectionField?.name);',
      'ctx.render(ctx.filterManager?.uid);',
      'ctx.render(ctx.router?.basename);',
      'ctx.render(ctx.route?.pathname);',
      'ctx.render(ctx.location?.pathname);',
      'ctx.render(ctx.i18n?.language);',
      'ctx.render(Boolean(ctx.sql));',
      "ctx.render(null);\nctx.on?.('refresh', () => {});",
      "ctx.render(null);\nctx.off?.('refresh', () => {});",
    ];

    allowedCtxRootSnippets.forEach((code, index) => {
      expect(
        inspectRunJsAuthoringCode({
          code,
          path: `$.allowedCtxRoots[${index}].code`,
          modelUse: 'JSBlockModel',
        }),
      ).toEqual([]);
    });
  });

  it('should validate FlowResource instance method calls on RunJS resource aliases', () => {
    const invalidCases = [
      {
        code: "const r = ctx.makeResource('MultiRecordResource');\nr.setFilters({ status: 'open' });",
        path: '$.runjs.multiResourceAlias.code',
      },
      {
        code: [
          'collections.map(() => {',
          "  const r = ctx.makeResource('MultiRecordResource');",
          '  r.setFilters({ status: "open" });',
          '  return r;',
          '});',
        ].join('\n'),
        path: '$.runjs.callbackResourceAlias.code',
      },
      {
        code: 'ctx.resource.setFilters({ status: "open" });',
        path: '$.runjs.ctxResource.code',
      },
      {
        code: 'const r = ctx.resource;\nr.setFilters({ status: "open" });',
        path: '$.runjs.ctxResourceAlias.code',
      },
      {
        code: "ctx.makeResource('MultiRecordResource').setFilters({ status: 'open' });",
        path: '$.runjs.directFactoryResource.code',
      },
      {
        code: "const r = ctx.makeResource('MultiRecordResource');\nr?.setFilters?.({ status: 'open' });",
        path: '$.runjs.optionalResourceAlias.code',
      },
      {
        code: "const r = ctx.makeResource('MultiRecordResource');\nr['setFilters']({ status: 'open' });",
        path: '$.runjs.bracketResourceAlias.code',
      },
    ];

    invalidCases.forEach(({ code, path }) => {
      const errors = inspectRunJsAuthoringCode({
        code,
        path,
        modelUse: 'JSActionModel',
      });

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path,
            ruleId: 'runjs-flow-resource-method-invalid',
            details: expect.objectContaining({
              method: 'setFilters',
              repairClass: 'resource-runtime-contract-stop',
              suggestedMethod: 'setFilter',
            }),
          }),
        ]),
      );
    });
  });

  it('should allow valid FlowResource methods and ignore non-resource or shadowed bindings', () => {
    const errors = inspectRunJsAuthoringCode({
      code: [
        "const multi = ctx.makeResource('MultiRecordResource');",
        "multi.setResourceName('tasks');",
        'multi.setFilter({ status: "open" });',
        'multi.setPageSize(20);',
        'multi.refresh();',
        'multi.getData();',
        'multi.getMeta();',
        "const single = ctx.makeResource('SingleRecordResource');",
        'single.save({ title: "Done" });',
        'single.destroy();',
        "const sql = ctx.initResource('SQLResource');",
        "sql.setSQL('select 1');",
        'sql.setBind({ id: 1 });',
        "sql.setSQLType('selectRows');",
        'await sql.run();',
        'await sql.runById();',
        'ctx.resource.getData();',
        'ctx.resource.setFilter({ status: "open" });',
        'ctx.resource.setPageSize(10);',
        'const plain = { setFilters() {} };',
        'plain.setFilters({ status: "open" });',
        "const outer = ctx.makeResource('MultiRecordResource');",
        'function local(outer) { outer.setFilters({ status: "open" }); }',
        "const method = 'setFilters';",
        "const dynamic = ctx.makeResource('MultiRecordResource');",
        'dynamic[method]({ status: "open" });',
      ].join('\n'),
      path: '$.runjs.validResourceMethods.code',
      modelUse: 'JSActionModel',
    });

    expect(errors).toEqual([]);
  });

  it('should not treat method-local code or out-of-scope shadow bindings as top-level RunJS', () => {
    const objectMethodRenderErrors = inspectRunJsAuthoringCode({
      code: 'const panel = { draw() { ctx.render(null); } };',
      path: '$.jsBlock.objectMethodRender.code',
      modelUse: 'JSBlockModel',
    });
    expect(objectMethodRenderErrors.map((error: any) => error.details?.repairClass)).toContain(
      'render-top-level-function-wrapper',
    );

    const classMethodRenderErrors = inspectRunJsAuthoringCode({
      code: 'class Panel { draw() { ctx.render(null); } }',
      path: '$.jsBlock.classMethodRender.code',
      modelUse: 'JSBlockModel',
    });
    expect(classMethodRenderErrors.map((error: any) => error.details?.repairClass)).toContain(
      'render-unreachable-render-call',
    );

    const computedObjectMethodRenderErrors = inspectRunJsAuthoringCode({
      code: 'const panel = { ["draw"]() { ctx.render(null); } };',
      path: '$.jsBlock.computedObjectMethodRender.code',
      modelUse: 'JSBlockModel',
    });
    expect(computedObjectMethodRenderErrors.map((error: any) => error.details?.repairClass)).toContain(
      'render-top-level-function-wrapper',
    );

    const computedClassMethodRenderErrors = inspectRunJsAuthoringCode({
      code: 'class Panel { ["draw"]() { ctx.render(null); } }',
      path: '$.jsBlock.computedClassMethodRender.code',
      modelUse: 'JSBlockModel',
    });
    expect(computedClassMethodRenderErrors.map((error: any) => error.details?.repairClass)).toContain(
      'render-unreachable-render-call',
    );

    const methodReturnErrors = inspectRunJsAuthoringCode({
      code: 'const factory = { option() { return { title: { text: "A" } }; } };',
      path: '$.chart.visual.methodReturn.raw',
      modelUse: 'ChartOptionModel',
    });
    expect(methodReturnErrors.map((error: any) => error.details?.repairClass)).toContain('missing-top-level-return');

    const outOfScopeUnbracedForDocumentErrors = inspectRunJsAuthoringCode({
      code: [
        'for (const document of []) ctx.console.log(document);',
        'ctx.render(null);',
        'document.createElement("div");',
      ].join('\n'),
      path: '$.jsBlock.outOfScopeUnbracedForDocument.code',
      modelUse: 'JSBlockModel',
    });
    expect(outOfScopeUnbracedForDocumentErrors.map((error: any) => error.ruleId)).toContain(
      'runjs-direct-dom-render-forbidden',
    );

    const outOfScopeDocumentErrors = inspectRunJsAuthoringCode({
      code: [
        'if (ctx.record) { const document = ctx.libs.document; }',
        'ctx.render(null);',
        'document.createElement("div");',
      ].join('\n'),
      path: '$.jsBlock.outOfScopeDocument.code',
      modelUse: 'JSBlockModel',
    });
    expect(outOfScopeDocumentErrors.map((error: any) => error.ruleId)).toContain('runjs-direct-dom-render-forbidden');

    const ifControlErrors = inspectRunJsAuthoringCode({
      code: 'ctx.render(null);\nif (document) { document.createElement("div"); }',
      path: '$.jsBlock.ifControlDocument.code',
      modelUse: 'JSBlockModel',
    });
    expect(ifControlErrors.map((error: any) => error.ruleId)).toContain('runjs-direct-dom-render-forbidden');
  });

  it('should reject async functions rendered as React components before persisting', async () => {
    const code = [
      'async function DashboardMetrics() {',
      '  const cards = [',
      "    { title: 'Active Employer Groups', value: 4 },",
      "    { title: 'Active Policies', value: 5 },",
      "    { title: 'Claims Paid Total', value: '$0.00' },",
      '  ];',
      '  return ctx.React.createElement(',
      "    'div',",
      '    null,',
      '    cards.map(function(card) {',
      "      return ctx.React.createElement('div', { key: card.title }, card.title, String(card.value));",
      '    })',
      '  );',
      '}',
      '',
      'ctx.render(ctx.React.createElement(DashboardMetrics));',
    ].join('\n');

    const directErrors = inspectRunJsAuthoringCode({
      code,
      path: '$.jsBlock.asyncComponent.code',
      modelUse: 'JSBlockModel',
    });
    expect(directErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-async-component-forbidden',
          details: expect.objectContaining({
            repairClass: 'react-runtime-contract-stop',
            component: 'DashboardMetrics',
          }),
        }),
      ]),
    );

    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid async component dashboard',
        },
      },
      assets: {
        scripts: {
          kpis: {
            code,
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'kpis',
              type: 'jsBlock',
              script: 'kpis',
            },
          ],
        },
      ],
    });
    expect(applyBlueprintErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].script',
          ruleId: 'runjs-react-async-component-forbidden',
          details: expect.objectContaining({
            repairClass: 'react-runtime-contract-stop',
            component: 'DashboardMetrics',
          }),
        }),
      ]),
    );

    const reactAliasErrors = inspectRunJsAuthoringCode({
      code: [
        'const React = ctx.React;',
        'const h = React.createElement;',
        'const DashboardMetrics = async () => React.createElement("div", null, "Metrics");',
        'ctx.render(h(DashboardMetrics));',
      ].join('\n'),
      path: '$.jsBlock.asyncComponentAlias.code',
      modelUse: 'JSBlockModel',
    });
    expect(reactAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-async-component-forbidden',
          details: expect.objectContaining({
            repairClass: 'react-runtime-contract-stop',
            capability: 'ctx.React.createElement',
            component: 'DashboardMetrics',
          }),
        }),
      ]),
    );
  });

  it('should not leak named function or class expression bindings into later authoring RunJS code', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      blocks: [
        {
          key: 'namedDocumentExpression',
          type: 'jsBlock',
          settings: {
            code: [
              'const helper = function document() { return document; };',
              'ctx.render(helper);',
              'document.createElement("div");',
            ].join('\n'),
          },
        },
        {
          key: 'namedDocumentClassExtendsExpression',
          type: 'jsBlock',
          settings: {
            code: [
              'const helper = class document extends (document["createElement"]("div"), Object) {};',
              'ctx.render(helper);',
            ].join('\n'),
          },
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
        expect.objectContaining({
          path: '$.blocks[1].settings.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
      ]),
    );
  });

  it('should not leak named function or class expression bindings into flowRegistry RunJS code', () => {
    const errors = collectFlowRegistryRunJsAuthoringErrors({
      namedDocumentExpression: {
        key: 'namedDocumentExpression',
        on: 'beforeRender',
        steps: {
          runUnsafe: {
            use: 'runjs',
            defaultParams: {
              code: ['const helper = function document() { return document; };', 'document.createElement("div");'].join(
                '\n',
              ),
            },
          },
        },
      },
      namedDocumentClassExtendsExpression: {
        key: 'namedDocumentClassExtendsExpression',
        on: 'beforeRender',
        steps: {
          runUnsafe: {
            use: 'runjs',
            defaultParams: {
              code: [
                'const helper = class document extends (document["createElement"]("div"), Object) {};',
                'return helper;',
              ].join('\n'),
            },
          },
        },
      },
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.flowRegistry.namedDocumentExpression.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
        expect.objectContaining({
          path: '$.flowRegistry.namedDocumentClassExtendsExpression.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
      ]),
    );
  });

  it('should reject ctx.element and ctx aliases on authoring paths', async () => {
    const composeErrors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      blocks: [
        {
          key: 'ctxElementAlias',
          type: 'jsBlock',
          settings: {
            code: 'const el = ctx.element;\nctx.render(null);\nel.innerHTML = "<strong>bad</strong>";',
          },
        },
        {
          key: 'ctxAlias',
          type: 'jsBlock',
          settings: {
            code: 'const c = ctx;\nc.render(null);\nc.openView({});',
          },
        },
        {
          key: 'ctxDestructureAlias',
          type: 'jsBlock',
          settings: {
            code: [
              'const { request, openView, element } = ctx;',
              'ctx.render(null);',
              'await request({ resource: "users", action: "list" });',
              'openView({});',
              'element.innerHTML = "<strong>bad</strong>";',
            ].join('\n'),
          },
        },
      ],
    });

    expect(composeErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
          details: expect.objectContaining({ capability: 'ctx.element', alias: 'el' }),
        }),
        expect.objectContaining({
          path: '$.blocks[1].settings.code',
          ruleId: 'runjs-ctx-root-unknown',
          details: expect.objectContaining({ member: 'c' }),
        }),
        expect.objectContaining({
          path: '$.blocks[2].settings.code',
          ruleId: 'runjs-ctx-root-unknown',
          details: expect.objectContaining({ member: 'request' }),
        }),
        expect.objectContaining({
          path: '$.blocks[2].settings.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
          details: expect.objectContaining({ capability: 'ctx.element', alias: 'element' }),
        }),
      ]),
    );
  });

  it('should reject ctx.element and ctx aliases on flowRegistry paths', () => {
    const errors = collectFlowRegistryRunJsAuthoringErrors({
      ctxElementAlias: {
        key: 'ctxElementAlias',
        on: 'beforeRender',
        steps: {
          runUnsafe: {
            use: 'runjs',
            defaultParams: {
              code: 'const el = ctx.element;\nel.innerHTML = "<strong>bad</strong>";',
            },
          },
        },
      },
      ctxAlias: {
        key: 'ctxAlias',
        on: 'beforeRender',
        steps: {
          runUnsafe: {
            use: 'runjs',
            defaultParams: {
              code: 'const c = ctx;\nc.openView({});',
            },
          },
        },
      },
      ctxDestructureAlias: {
        key: 'ctxDestructureAlias',
        on: 'beforeRender',
        steps: {
          runUnsafe: {
            use: 'runjs',
            defaultParams: {
              code: [
                'const { request, openView, element } = ctx;',
                'await request({ resource: "users", action: "list" });',
                'openView({});',
                'element.innerHTML = "<strong>bad</strong>";',
              ].join('\n'),
            },
          },
        },
      },
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.flowRegistry.ctxElementAlias.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
          details: expect.objectContaining({ capability: 'ctx.element', alias: 'el' }),
        }),
        expect.objectContaining({
          path: '$.flowRegistry.ctxAlias.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-ctx-root-unknown',
          details: expect.objectContaining({ member: 'c' }),
        }),
        expect.objectContaining({
          path: '$.flowRegistry.ctxDestructureAlias.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-ctx-root-unknown',
          details: expect.objectContaining({ member: 'request' }),
        }),
        expect.objectContaining({
          path: '$.flowRegistry.ctxDestructureAlias.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
          details: expect.objectContaining({ capability: 'ctx.element', alias: 'element' }),
        }),
      ]),
    );
  });

  it('should reject bracket-member direct DOM writes', () => {
    const documentErrors = inspectRunJsAuthoringCode({
      code: 'ctx.render(null);\ndocument["createElement"]("div");',
      path: '$.jsBlock.bracketDocument.code',
      modelUse: 'JSBlockModel',
    });
    expect(documentErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-direct-dom-render-forbidden',
          details: expect.objectContaining({
            capability: 'document["createElement"]',
          }),
        }),
      ]),
    );

    const ctxElementErrors = inspectRunJsAuthoringCode({
      code: 'ctx.element["innerHTML"] = "<strong>bad</strong>";',
      path: '$.jsBlock.bracketCtxElement.code',
      modelUse: 'JSBlockModel',
    });
    expect(ctxElementErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-direct-dom-render-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.element["innerHTML"]',
          }),
        }),
      ]),
    );
  });

  it('should reject comment-separated bracket direct DOM writes on authoring paths', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      blocks: [
        {
          key: 'commentBracketDocument',
          type: 'jsBlock',
          settings: {
            code: 'ctx.render(null);\ndocument/* comment */["createElement"]("div");',
          },
        },
        {
          key: 'commentBracketCtxElement',
          type: 'jsBlock',
          settings: {
            code: 'ctx.element/* comment */["innerHTML"] = "<strong>bad</strong>";',
          },
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
        expect.objectContaining({
          path: '$.blocks[1].settings.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
      ]),
    );
  });

  it('should reject comment-separated bracket direct DOM writes on flowRegistry paths', () => {
    const errors = collectFlowRegistryRunJsAuthoringErrors({
      commentBracketDocument: {
        key: 'commentBracketDocument',
        on: 'beforeRender',
        steps: {
          runUnsafe: {
            use: 'runjs',
            defaultParams: {
              code: 'document/* comment */["createElement"]("div");',
            },
          },
        },
      },
      commentBracketCtxElement: {
        key: 'commentBracketCtxElement',
        on: 'beforeRender',
        steps: {
          runUnsafe: {
            use: 'runjs',
            defaultParams: {
              code: 'ctx.element/* comment */["innerHTML"] = "<strong>bad</strong>";',
            },
          },
        },
      },
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.flowRegistry.commentBracketDocument.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
        expect.objectContaining({
          path: '$.flowRegistry.commentBracketCtxElement.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
      ]),
    );
  });

  it('should reject optional-chained unsafe capabilities on authoring write paths', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'missing-target-never-resolved' },
      blocks: [
        {
          key: 'optionalRequest',
          type: 'jsBlock',
          settings: {
            code: "ctx?.render(null);\nawait ctx?.request?.({ resource: 'users', action: 'list' });",
          },
        },
        {
          key: 'optionalUnknownRoot',
          type: 'jsBlock',
          settings: {
            code: 'ctx?.render(null);\nctx?.unknownRoot();',
          },
        },
        {
          key: 'optionalDynamicCtx',
          type: 'jsBlock',
          settings: {
            code: 'ctx?.render(null);\nctx?.[memberName]();',
          },
        },
        {
          key: 'optionalDocumentCreateElement',
          type: 'jsBlock',
          settings: {
            code: 'ctx?.render(null);\ndocument?.createElement("div");',
          },
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.code',
          ruleId: 'runjs-resource-api-required',
          details: expect.objectContaining({
            repairClass: 'switch-to-resource-api',
          }),
        }),
        expect.objectContaining({
          path: '$.blocks[1].settings.code',
          ruleId: 'runjs-ctx-root-unknown',
          details: expect.objectContaining({
            repairClass: 'ctx-root-mismatch-stop',
            member: 'unknownRoot',
          }),
        }),
        expect.objectContaining({
          path: '$.blocks[2].settings.code',
          ruleId: 'runjs-dynamic-ctx-member-unresolved',
          details: expect.objectContaining({
            repairClass: 'ctx-root-mismatch-stop',
          }),
        }),
        expect.objectContaining({
          path: '$.blocks[3].settings.code',
          ruleId: 'runjs-direct-dom-render-forbidden',
          details: expect.objectContaining({
            repairClass: 'replace-innerhtml-with-render',
            capability: 'document?.createElement',
          }),
        }),
      ]),
    );
  });

  it('should allow plugin-contributed ctx.ai RunJS APIs on JS block authoring paths', () => {
    const errors = inspectRunJsAuthoringCode({
      code: [
        'ctx.ai.triggerTask({ aiEmployee: "viz", tasks: [{ title: "Daily handoff" }], open: true });',
        'ctx.ai.triggerModelTask("flow-model-uid", 0, { open: true });',
        'ctx.render(null);',
      ].join('\n'),
      path: '$.blocks[0].settings.code',
      modelUse: 'JSBlockModel',
    });

    expect(errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-ctx-root-unknown',
        }),
        expect.objectContaining({
          ruleId: 'runjs-dynamic-ctx-member-unresolved',
        }),
      ]),
    );
  });

  it('should reject builder chart assets that use association fields directly', async () => {
    const employerGroupsCollection = {
      dataSourceKey: 'main',
      name: 'employer_groups',
      getFields: () => [
        {
          name: 'title',
          type: 'string',
          interface: 'input',
        },
      ],
      getField: (name: string) =>
        name === 'title'
          ? {
              name: 'title',
              type: 'string',
              interface: 'input',
            }
          : null,
    };
    const claimsCollection = {
      dataSourceKey: 'main',
      name: 'claims',
      getField: (name: string) => {
        if (name === 'id') {
          return {
            name: 'id',
            type: 'bigInt',
            interface: 'id',
          };
        }
        if (name === 'employer_group') {
          return {
            name: 'employer_group',
            type: 'belongsTo',
            interface: 'm2o',
            target: 'employer_groups',
            targetCollection: employerGroupsCollection,
            isAssociationField: () => true,
          };
        }
        return null;
      },
    };

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid association chart',
          },
        },
        assets: {
          charts: {
            employerGroupChart: {
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'claims',
                },
                measures: [{ field: 'id', aggregation: 'count', alias: 'claimCount' }],
                dimensions: [{ field: 'employer_group' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'employer_group',
                  y: 'claimCount',
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
                key: 'employerGroupChart',
                type: 'chart',
                chart: 'employerGroupChart',
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) =>
          collectionName === 'claims'
            ? claimsCollection
            : collectionName === 'employer_groups'
              ? employerGroupsCollection
              : null,
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.employerGroupChart.query.dimensions[0].field',
          ruleId: 'chart-builder-query-association-field-requires-subfield',
          message: expect.stringContaining("'employer_group.title'"),
          details: expect.objectContaining({
            suggestedFieldPath: 'employer_group.title',
            suggestedTitleField: 'title',
            targetCollectionName: 'employer_groups',
          }),
        }),
      ]),
    );
  });

  it('should reject builder chart assets that count relation subfields', async () => {
    const employerGroupsCollection = {
      dataSourceKey: 'main',
      name: 'employer_groups',
      getFields: () => [
        {
          name: 'title',
          type: 'string',
          interface: 'input',
        },
      ],
      getField: (name: string) =>
        name === 'title'
          ? {
              name: 'title',
              type: 'string',
              interface: 'input',
            }
          : null,
    };
    const claimsCollection = {
      dataSourceKey: 'main',
      name: 'claims',
      getField: (name: string) => {
        if (name === 'id') {
          return {
            name: 'id',
            type: 'bigInt',
            interface: 'id',
          };
        }
        if (name === 'employer_group') {
          return {
            name: 'employer_group',
            type: 'belongsTo',
            interface: 'm2o',
            target: 'employer_groups',
            targetCollection: employerGroupsCollection,
            isAssociationField: () => true,
          };
        }
        return null;
      },
    };

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid relation count chart',
          },
        },
        assets: {
          charts: {
            employerGroupChart: {
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'claims',
                },
                measures: [{ field: 'employer_group.title', aggregation: 'count', alias: 'claimCount' }],
                dimensions: [{ field: 'employer_group.title' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'employer_group.title',
                  y: 'claimCount',
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
                key: 'employerGroupChart',
                type: 'chart',
                chart: 'employerGroupChart',
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) =>
          collectionName === 'claims'
            ? claimsCollection
            : collectionName === 'employer_groups'
              ? employerGroupsCollection
              : null,
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.employerGroupChart.query.measures[0].field',
          ruleId: 'chart-builder-query-count-measure-relation-subfield',
          message: expect.stringContaining("counts relation subfield 'employer_group.title'"),
          details: expect.objectContaining({
            fieldPath: 'employer_group.title',
            suggestedMeasure: {
              field: 'id',
              aggregation: 'count',
              alias: 'claimCount',
            },
            suggestedDimension: {
              field: 'employer_group.title',
            },
          }),
        }),
      ]),
    );
  });

  it('should validate configure popup and hidden popup RunJS recursively', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'calendar-target' },
        changes: {
          popup: {
            blocks: [
              {
                key: 'popupJsBlock',
                type: 'jsBlock',
                settings: {
                  code: 'ctx.render(unknownPopupValue);',
                },
              },
            ],
            reaction: {
              items: [
                {
                  type: 'runjs',
                  code: 'return unknownReactionValue;',
                },
              ],
            },
          },
        },
      },
      {
        hostBlockType: 'CalendarBlockModel',
        currentNode: { use: 'CalendarBlockModel' },
        skipGeneratedPopupDefaultFieldGroups: true,
      },
    );

    expect(errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.changes.popup.blocks[0].settings.code', '$.changes.popup.reaction.items[0].code']),
    );
    expect(errors.map((error: any) => error.details?.repairClass)).toEqual(
      expect.arrayContaining(['unknown-global-stop']),
    );
  });

  it('should only reroute resource-like ctx.request calls and preserve template interpolation checks', () => {
    expect(
      inspectRunJsAuthoringCode({
        code: "ctx.render(null);\nawait ctx.request({ url: 'https://example.com/status' });",
        path: '$.httpRequest.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: "ctx.render(null);\nawait ctx.request({ url: '/app:getInfo', method: 'get' });",
        path: '$.customEndpoint.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
    expect(
      inspectRunJsAuthoringCode({
        code: "ctx.render(null);\nawait ctx.request({ url: '/app:getInfo', action: 'get' });",
        path: '$.customEndpointWithAction.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    const collectionRefreshRequestErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.api.request({ url: 'collection:refresh' });",
      path: '$.collectionRefreshRequest.code',
      modelUse: 'JSBlockModel',
    });
    expect(collectionRefreshRequestErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-action-invalid',
          details: expect.objectContaining({
            actionName: 'refresh',
            endpoint: 'collection:refresh',
            repairClass: 'resource-runtime-contract-stop',
          }),
        }),
      ]),
    );

    const namedCollectionRefreshRequestErrors = inspectRunJsAuthoringCode(
      {
        code: "ctx.render(null);\nawait ctx.api.request({ url: '/api/tasks:refresh' });",
        path: '$.namedCollectionRefreshRequest.code',
        modelUse: 'JSBlockModel',
      },
      {
        getCollection: (_dataSourceKey, collectionName) =>
          collectionName === 'tasks' ? { name: collectionName } : null,
      },
    );
    expect(namedCollectionRefreshRequestErrors.map((error: any) => error.ruleId)).toContain(
      'runjs-resource-action-invalid',
    );

    const collectionRequestErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.request({ url: 'tasks:list', method: 'get' });",
      path: '$.collectionRequest.code',
      modelUse: 'JSBlockModel',
    });
    expect(collectionRequestErrors.map((error: any) => error.details?.repairClass)).toContain('switch-to-resource-api');
    const apiCollectionRequestErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.api.request({ url: 'tasks:get', method: 'get' });",
      path: '$.apiCollectionRequest.code',
      modelUse: 'JSBlockModel',
    });
    expect(apiCollectionRequestErrors.map((error: any) => error.details?.repairClass)).toContain(
      'switch-to-resource-api',
    );
    const positionalCollectionRequestErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.request('/api/tasks:list', { params: { pageSize: 1 } });",
      path: '$.positionalCollectionRequest.code',
      modelUse: 'JSBlockModel',
    });
    expect(positionalCollectionRequestErrors.map((error: any) => error.details?.repairClass)).toContain(
      'switch-to-resource-api',
    );
    const absoluteApiCollectionRequestErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.request({ url: '/api/tasks:list?pageSize=1', skipNotify: true });",
      path: '$.absoluteApiCollectionRequest.code',
      modelUse: 'JSBlockModel',
    });
    expect(absoluteApiCollectionRequestErrors.map((error: any) => error.details?.repairClass)).toContain(
      'switch-to-resource-api',
    );
    const dynamicCollectionRequestErrors = inspectRunJsAuthoringCode({
      code: "const collectionName = 'tasks';\nctx.render(null);\nawait ctx.request({ url: `${collectionName}:list`, method: 'get' });",
      path: '$.dynamicCollectionRequest.code',
      modelUse: 'JSBlockModel',
    });
    expect(dynamicCollectionRequestErrors.map((error: any) => error.details?.repairClass)).toContain(
      'switch-to-resource-api',
    );
    const dynamicAbsoluteApiCollectionRequestErrors = inspectRunJsAuthoringCode({
      code: "const collectionName = 'tasks';\nctx.render(null);\nawait ctx.request({ url: `/api/${collectionName}:list?pageSize=1`, skipNotify: true });",
      path: '$.dynamicAbsoluteApiCollectionRequest.code',
      modelUse: 'JSBlockModel',
    });
    expect(dynamicAbsoluteApiCollectionRequestErrors.map((error: any) => error.details?.repairClass)).toContain(
      'switch-to-resource-api',
    );

    const runjsResourceEndpointErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.runjs('resource:list', { resource: 'tasks' });",
      path: '$.runjsResourceEndpoint.code',
      modelUse: 'JSBlockModel',
    });
    expect(runjsResourceEndpointErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-nested-runjs-forbidden',
          details: expect.objectContaining({
            repairClass: 'nested-runjs-stop',
            capability: 'ctx.runjs',
          }),
        }),
      ]),
    );

    const optionalRunjsCollectionEndpointErrors = inspectRunJsAuthoringCode({
      code: 'ctx.render(null);\nawait ctx?.runjs?.(`${collectionName}:list`, { pageSize: 20 });',
      path: '$.optionalRunjsCollectionEndpoint.code',
      modelUse: 'JSBlockModel',
    });
    expect(optionalRunjsCollectionEndpointErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-nested-runjs-forbidden',
          details: expect.objectContaining({
            repairClass: 'nested-runjs-stop',
            capability: 'ctx.runjs',
          }),
        }),
      ]),
    );

    const commentedRunjsResourceEndpointErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.runjs(/* endpoint */ 'resource:list', { resource: 'tasks' });",
      path: '$.commentedRunjsResourceEndpoint.code',
      modelUse: 'JSBlockModel',
    });
    expect(commentedRunjsResourceEndpointErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-nested-runjs-forbidden',
          details: expect.objectContaining({
            repairClass: 'nested-runjs-stop',
            capability: 'ctx.runjs',
          }),
        }),
      ]),
    );

    const concatenatedRunjsEndpointErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.runjs(collectionName + ':list', { pageSize: 20 });",
      path: '$.concatenatedRunjsEndpoint.code',
      modelUse: 'JSBlockModel',
    });
    expect(concatenatedRunjsEndpointErrors.map((error: any) => error.ruleId)).toContain('runjs-nested-runjs-forbidden');

    const ordinaryRunjsLabelCallErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.runjs('cache:get()', {});",
      path: '$.ordinaryRunjsLabelCall.code',
      modelUse: 'JSBlockModel',
    });
    expect(ordinaryRunjsLabelCallErrors.map((error: any) => error.ruleId)).toContain('runjs-nested-runjs-forbidden');

    const collectionRefreshRunjsErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.runjs('collection:refresh', {});",
      path: '$.collectionRefreshRunjs.code',
      modelUse: 'JSBlockModel',
    });
    expect(collectionRefreshRunjsErrors.map((error: any) => error.ruleId)).toContain('runjs-resource-action-invalid');

    const invalidApiResourceErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.api.resource.list({ resource: 'tasks', pageSize: 1 });",
      path: '$.invalidApiResource.code',
      modelUse: 'JSBlockModel',
    });
    expect(invalidApiResourceErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-api-resource-call-invalid',
          details: expect.objectContaining({
            repairClass: 'switch-to-resource-api',
            capability: 'ctx.api.resource.list',
            method: 'list',
          }),
        }),
      ]),
    );

    const invalidApiResourceRefreshErrors = inspectRunJsAuthoringCode(
      {
        code: "ctx.render(null);\nawait ctx.api.resource('tasks', 'refresh');\nawait ctx.api.resource('tasks').refresh();",
        path: '$.invalidApiResourceRefresh.code',
        modelUse: 'JSBlockModel',
      },
      {
        getCollection: (_dataSourceKey, collectionName) =>
          collectionName === 'tasks' ? { name: collectionName } : null,
      },
    );
    expect(invalidApiResourceRefreshErrors.map((error: any) => error.ruleId)).toContain(
      'runjs-resource-action-invalid',
    );

    const opencodeActionResourceErrors = inspectRunJsAuthoringCode({
      code: `
const { Card, Row, Col, Statistic } = ctx.libs.antd;

async function fetchCount(collection, filter) {
  const res = await ctx.api.resource('list', {
    resource: collection,
    params: { filter: filter || {}, pageSize: 1 }
  });
  return res.data?.total || 0;
}

const activeGroups = await fetchCount('employer_groups', { group_status: 'Active' });

ctx.render(
  <Row gutter={[16, 16]}>
    <Col span={4}>
      <Card>
        <Statistic title="Active Employer Groups" value={activeGroups} />
      </Card>
    </Col>
  </Row>
);
`,
      path: '$.opencodeActionResource.code',
      modelUse: 'JSBlockModel',
    });
    expect(opencodeActionResourceErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-api-resource-call-invalid',
          details: expect.objectContaining({
            repairClass: 'switch-to-resource-api',
            capability: "ctx.api.resource('list')",
            method: 'list',
          }),
        }),
      ]),
    );

    const apiResourceFactoryErrors = inspectRunJsAuthoringCode({
      code: "ctx.render(null);\nawait ctx.api.resource('tasks').list({ pageSize: 1 });",
      path: '$.apiResourceFactory.code',
      modelUse: 'JSBlockModel',
    });
    expect(apiResourceFactoryErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-api-resource-call-invalid',
          details: expect.objectContaining({
            repairClass: 'switch-to-resource-api',
            capability: "ctx.api.resource('tasks').list",
            method: 'list',
          }),
        }),
      ]),
    );

    const opencodeActionArgumentResourceErrors = inspectRunJsAuthoringCode({
      code: `
var antd = ctx.libs.antd;
var h = ctx.React.createElement;

var Card = antd.Card;
var Row = antd.Row;
var Col = antd.Col;
var Statistic = antd.Statistic;

function card(title, value) {
  return h(Card, null, h(Statistic, { title: title, value: value }));
}

(async function() {
  var results = await Promise.all([
    ctx.api.resource('employer_groups', 'list', { filter: { group_status: 'Active' } }),
    ctx.api.resource('policies', 'list', { filter: { policy_status: 'Active' } }),
    ctx.api.resource('claims', 'list', {}),
    ctx.api.resource('reimbursement_requests', 'list', {
      filter: { request_status: { $in: ['Draft', 'Submitted', 'Under Review'] } }
    })
  ]);
  ctx.render(h(Row, { gutter: [16, 16] },
    h(Col, { span: 4 }, card('Active Employer Groups', results[0].data.length)),
    h(Col, { span: 4 }, card('Active Policies', results[1].data.length))
  ));
})();
ctx.render('Loading');
`,
      path: '$.opencodeActionArgumentResource.code',
      modelUse: 'JSBlockModel',
    });
    expect(opencodeActionArgumentResourceErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-api-resource-call-invalid',
          details: expect.objectContaining({
            repairClass: 'switch-to-resource-api',
            capability: "ctx.api.resource('employer_groups', 'list')",
            method: 'list',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-api-resource-call-invalid',
          details: expect.objectContaining({
            repairClass: 'switch-to-resource-api',
            capability: "ctx.api.resource('claims', 'list')",
            method: 'list',
          }),
        }),
      ]),
    );

    const opencodeCollectionResourceErrors = inspectRunJsAuthoringCode({
      code: `
const React = ctx.React;

function DashboardKPIs() {
  React.useEffect(function() {
    async function fetchData() {
      try {
        var results = await Promise.all([
          ctx.api.resource('employer_groups').list({ pageSize: 1, filters: JSON.stringify({ $and: [{ group_status: 'Active' }] }) }),
          ctx.api.resource('policies').list({ pageSize: 1, filters: JSON.stringify({ $and: [{ policy_status: 'Active' }] }) }),
          ctx.api.resource('claims').list({ pageSize: 1000 }),
          ctx.api.resource('reimbursement_requests').list({ pageSize: 1000 }),
        ]);
        return results;
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);
  return null;
}

ctx.render(React.createElement(DashboardKPIs));
`,
      path: '$.opencodeCollectionResource.code',
      modelUse: 'JSBlockModel',
    });
    expect(opencodeCollectionResourceErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-api-resource-call-invalid',
          details: expect.objectContaining({
            repairClass: 'switch-to-resource-api',
            capability: "ctx.api.resource('employer_groups').list",
            method: 'list',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-api-resource-call-invalid',
          details: expect.objectContaining({
            repairClass: 'switch-to-resource-api',
            capability: "ctx.api.resource('claims').list",
            method: 'list',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: "ctx.render(null);\nawait ctx.runjs('return 1;');",
        path: '$.ordinaryNestedRunjs.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-nested-runjs-forbidden',
        }),
      ]),
    );

    const templateLiteralErrors = inspectRunJsAuthoringCode({
      code: 'ctx.render(`${ctx.openView({})}`);',
      path: '$.templateInterpolation.code',
      modelUse: 'JSBlockModel',
    });
    expect(templateLiteralErrors).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: 'ctx.render(`literal fetch("/not-executed") text`);',
        path: '$.templateLiteralText.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
  });

  it('should validate RunJS ctx.api members through direct access, aliases, destructuring, and dynamic access', () => {
    expect(
      inspectRunJsAuthoringCode({
        code: [
          "var requestPromise = ctx.api.request({ url: 'https://example.com/status' });",
          'var role = ctx.api.auth.role;',
          'var token = ctx.api.auth.token;',
          'var authenticator = ctx.api.auth.authenticator;',
          'var locale = ctx.api.auth.locale;',
          'var auth = ctx.api.auth;',
          'var api = ctx.api;',
          'var apiAuth = api.auth;',
          'var request = ctx.api.request;',
          'var { request: destructuredRequest, resource } = ctx.api;',
          'var assignedRequest;',
          '({ request: assignedRequest } = ctx.api);',
          'var authRole = apiAuth.role;',
          'var localeLowercase = ctx.api.auth.locale.toLowerCase();',
          'var roleLength = auth.role.length;',
          'var tokenPreview = apiAuth.token && apiAuth.token.slice(0, 8);',
          "var requestPromiseByAlias = request({ url: 'https://example.com/status' });",
          "var requestPromiseByDestructuredAlias = destructuredRequest({ url: 'https://example.com/status' });",
          "var requestPromiseByAssignedAlias = assignedRequest({ url: 'https://example.com/status' });",
          'var fields = { requestPromise: requestPromise, role: role, token: token, authenticator: authenticator, locale: locale, authRole: authRole, localeLowercase: localeLowercase, roleLength: roleLength, tokenPreview: tokenPreview };',
          'ctx.render(auth.locale || fields.role);',
        ].join('\n'),
        path: '$.validCtxApiMembers.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    [
      {
        code: 'ctx.render(null);\nvar useRequest = ctx.api.useRequest;',
        path: '$.directUnknownCtxApiMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: 'ctx.render(null);\nvar requestDefaults = ctx.api.request.defaults;',
        path: '$.nestedCtxApiRequestMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.request.defaults',
      },
      {
        code: 'ctx.render(null);\nvar { defaults } = ctx.api.request;',
        path: '$.destructuredNestedCtxApiRequestMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.request.defaults',
      },
      {
        code: 'ctx.render(null);\nvar request = ctx.api.request;\nrequest.use(function() {});',
        path: '$.aliasedNestedCtxApiRequestMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.request.use',
      },
      {
        code: 'ctx.render(null);\nvar request;\n({ request } = ctx.api);\nrequest.use(function() {});',
        path: '$.assignedDestructuredNestedCtxApiRequestMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.request.use',
      },
      {
        code: 'ctx.render(null);\nvar list = ctx.api.resource.list;',
        path: '$.nestedCtxApiResourceMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.resource.list',
      },
      {
        code: 'ctx.render(ctx.api.resource?.list);',
        path: '$.optionalNestedCtxApiResourceMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.resource.list',
      },
      {
        code: 'ctx.render(null);\nvar resource = ctx.api.resource;\nvar bind = resource.bind;',
        path: '$.aliasedNestedCtxApiResourceMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.resource.bind',
      },
      {
        code: "ctx.render(null);\nvar api = ctx.api;\nvar list = api.resource.list;\napi.resource.list({ resource: 'tasks' });",
        path: '$.bareAndCalledAliasedNestedCtxApiResourceMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.resource.list',
      },
      {
        code: 'ctx.render(null);\nvar { list } = ctx.api.resource;',
        path: '$.destructuredNestedCtxApiResourceMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.resource.list',
      },
      {
        code: 'ctx.render(null);\nvar list;\n({ list } = ctx.api.resource);',
        path: '$.assignedDestructuredNestedCtxApiResourceMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.resource.list',
      },
      {
        code: [
          'ctx.render(null);',
          'var request = ctx.api.request;',
          'function rebindRequest() { request = { use: function() {} }; }',
          'request.use(function() {});',
        ].join('\n'),
        path: '$.nestedFunctionReassignedCtxApiRequestAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.request.use',
      },
      {
        code: [
          'ctx.render(null);',
          'let api = ctx.api;',
          'if (Math.random()) api = { useRequest: function() {} };',
          'api.useRequest({});',
        ].join('\n'),
        path: '$.conditionalReassignedCtxApiAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          'var api = enabled ? ctx.api : {};',
          'api.useRequest({});',
        ].join('\n'),
        path: '$.conditionalInitializedCtxApiAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          'var useRequest = (enabled ? ctx.api : {}).useRequest;',
        ].join('\n'),
        path: '$.conditionalCtxApiObjectMemberAccess.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          'var request = enabled && ctx.api.request;',
          'request.use(function() {});',
        ].join('\n'),
        path: '$.logicalInitializedCtxApiRequestAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.request.use',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          'var use = (enabled && ctx.api.request).use;',
        ].join('\n'),
        path: '$.logicalCtxApiRequestObjectMemberAccess.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.request.use',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          'var { useRequest } = enabled ? ctx.api : {};',
        ].join('\n'),
        path: '$.conditionalDestructuredUnknownCtxApiMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: ['ctx.render(null);', 'let api = null;', 'api ||= ctx.api;', 'api.useRequest({});'].join('\n'),
        path: '$.logicalOrAssignedCtxApiAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: ['ctx.render(null);', 'let api = {};', 'api &&= ctx.api;', 'api.useRequest({});'].join('\n'),
        path: '$.logicalAndAssignedCtxApiAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: ['ctx.render(null);', 'let api = null;', 'api ??= ctx.api;', 'api.useRequest({});'].join('\n'),
        path: '$.nullishAssignedCtxApiAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: [
          'ctx.render(null);',
          'let api = ctx.api;',
          'api ||= { useRequest: function() {} };',
          'api.useRequest({});',
        ].join('\n'),
        path: '$.logicalOrMaybeReassignedCtxApiAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: [
          'ctx.render(null);',
          'let api = ctx.api;',
          'api ??= { useRequest: function() {} };',
          'api.useRequest({});',
        ].join('\n'),
        path: '$.nullishMaybeReassignedCtxApiAlias.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: 'ctx.render(null);\nvar api = ctx.api;\napi.useRequest({});',
        path: '$.aliasedUnknownCtxApiMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: 'ctx.render(null);\nvar useRequest;\n({ useRequest } = ctx.api);',
        path: '$.assignedUnknownCtxApiMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: 'ctx.render(null);\nvar { useRequest } = ctx.api;',
        path: '$.destructuredUnknownCtxApiMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: 'ctx.render(null);\nctx?.api?.useRequest?.({});',
        path: '$.optionalUnknownCtxApiMember.code',
        ruleId: 'runjs-ctx-api-member-unknown',
        capability: 'ctx.api.useRequest',
      },
      {
        code: 'ctx.render(null);\nvar methodName = "useRequest";\nctx.api[methodName]({});',
        path: '$.dynamicCtxApiMember.code',
        ruleId: 'runjs-ctx-api-member-dynamic-unresolved',
        capability: 'ctx.api.[...]',
      },
      {
        code: 'ctx.render(null);\nvar memberName = "useRequest";\nvar { [memberName]: value } = ctx.api;',
        path: '$.dynamicDestructuredCtxApiMember.code',
        ruleId: 'runjs-ctx-api-member-dynamic-unresolved',
        capability: 'ctx.api.[...]',
      },
      {
        code: 'ctx.render(null);\nctx.api.auth.setToken("x");',
        path: '$.unsupportedCtxApiAuthMember.code',
        ruleId: 'runjs-ctx-api-auth-member-unsupported',
        capability: 'ctx.api.auth.setToken',
      },
      {
        code: 'ctx.render(null);\nvar auth;\n({ auth } = ctx.api);\nauth.setToken("x");',
        path: '$.assignedDestructuredUnsupportedCtxApiAuthMember.code',
        ruleId: 'runjs-ctx-api-auth-member-unsupported',
        capability: 'ctx.api.auth.setToken',
      },
      {
        code: [
          'ctx.render(null);',
          'let auth = ctx.api.auth;',
          'auth && (auth = { setToken: function() {} });',
          'auth.setToken("x");',
        ].join('\n'),
        path: '$.logicalReassignedCtxApiAuthAlias.code',
        ruleId: 'runjs-ctx-api-auth-member-unsupported',
        capability: 'ctx.api.auth.setToken',
      },
      {
        code: 'ctx.render(null);\nctx.api.auth.token = "x";',
        path: '$.readonlyCtxApiAuthTokenWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.token',
      },
      {
        code: 'ctx.render(null);\nvar auth = ctx.api.auth;\nauth.role = "admin";',
        path: '$.aliasedReadonlyCtxApiAuthRoleWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.role',
      },
      {
        code: 'ctx.render(null);\nvar api = ctx.api;\napi.auth.locale++;',
        path: '$.aliasedReadonlyCtxApiAuthLocaleUpdate.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.locale',
      },
      {
        code: 'ctx.render(null);\nvar auth;\n({ auth } = ctx.api);\ndelete auth.authenticator;',
        path: '$.assignedReadonlyCtxApiAuthAuthenticatorDelete.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.authenticator',
      },
      {
        code: 'ctx.render(null);\nvar source = { token: "x" };\n({ token: ctx.api.auth.token } = source);',
        path: '$.destructuringTargetReadonlyCtxApiAuthTokenWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.token',
      },
      {
        code: 'ctx.render(null);\nvar authenticator = ctx.api.auth.authenticator;\nauthenticator.options = {};',
        path: '$.readonlyCtxApiAuthenticatorAliasPropertyWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.authenticator.options',
      },
      {
        code: 'ctx.render(null);\nvar { authenticator } = ctx.api.auth;\nauthenticator.options = {};',
        path: '$.readonlyCtxApiAuthenticatorDestructuredPropertyWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.authenticator.options',
      },
      {
        code: 'ctx.render(null);\nvar authenticator;\n({ authenticator } = ctx.api.auth);\nauthenticator.options = {};',
        path: '$.readonlyCtxApiAuthenticatorAssignedDestructuredPropertyWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.authenticator.options',
      },
      {
        code: 'ctx.render(null);\nvar { auth: { authenticator } } = ctx.api;\nauthenticator.options = {};',
        path: '$.readonlyCtxApiNestedAuthenticatorDestructuredPropertyWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.authenticator.options',
      },
      {
        code: 'ctx.render(null);\nvar authenticator;\n({ auth: { authenticator } } = ctx.api);\nauthenticator.options = {};',
        path: '$.readonlyCtxApiNestedAuthenticatorAssignedDestructuredPropertyWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.authenticator.options',
      },
      {
        code: 'ctx.render(null);\nfor (ctx.api.auth.role in { admin: true }) {}',
        path: '$.forInReadonlyCtxApiAuthRoleWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.role',
      },
      {
        code: 'ctx.render(null);\nvar auth = ctx.api.auth;\nfor (auth.token of ["x"]) {}',
        path: '$.forOfAliasedReadonlyCtxApiAuthTokenWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.token',
      },
      {
        code: 'ctx.render(null);\nasync function load(items) { var auth = ctx.api.auth; for await (auth.locale of items) {} }',
        path: '$.forAwaitOfAliasedReadonlyCtxApiAuthLocaleWrite.code',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
        capability: 'ctx.api.auth.locale',
      },
      {
        code: 'ctx.render(null);\nvar { setToken } = ctx.api.auth;',
        path: '$.destructuredUnsupportedCtxApiAuthMember.code',
        ruleId: 'runjs-ctx-api-auth-member-unsupported',
        capability: 'ctx.api.auth.setToken',
      },
    ].forEach(({ capability, code, path, ruleId }) => {
      expect(
        inspectRunJsAuthoringCode({
          code,
          path,
          modelUse: 'JSBlockModel',
        }),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId,
            details: expect.objectContaining({
              repairClass: 'ctx-root-mismatch-stop',
              capability,
            }),
          }),
        ]),
      );
    });

    [
      {
        code: "ctx.render(null);\nctx.api.resource.list({ resource: 'tasks', pageSize: 1 });",
        path: '$.directInvalidApiResourceCall.code',
        capability: 'ctx.api.resource.list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar api = ctx.api;\napi.resource.list({ resource: 'tasks', pageSize: 1 });",
        path: '$.aliasedInvalidApiResourceCall.code',
        capability: 'api.resource.list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar { resource } = ctx.api;\nresource('tasks').list({ pageSize: 1 });",
        path: '$.destructuredInvalidApiResourceFactoryCall.code',
        capability: "resource('tasks').list",
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar resource;\n({ resource } = ctx.api);\nresource('tasks').list({ pageSize: 1 });",
        path: '$.assignedDestructuredInvalidApiResourceFactoryCall.code',
        capability: "resource('tasks').list",
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar resource = ctx.api.resource;\nresource('tasks', 'get', { filterByTk: 1 });",
        path: '$.aliasedInvalidApiResourceActionCall.code',
        capability: "resource('tasks', 'get')",
        method: 'get',
      },
      {
        code: "ctx.render(null);\nvar tasks = ctx.api.resource('tasks');\ntasks.list({ pageSize: 1 });",
        path: '$.resourceHandleAliasInvalidApiResourceCall.code',
        capability: 'tasks.list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar { list } = ctx.api.resource('tasks');\nlist({ pageSize: 1 });",
        path: '$.resourceHandleMethodDestructuredInvalidApiResourceCall.code',
        capability: 'list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar list = ctx.api.resource('tasks').list;\nlist({ pageSize: 1 });",
        path: '$.resourceHandleMethodAliasFromFactoryInvalidApiResourceCall.code',
        capability: 'list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar list;\nlist = ctx.api.resource('tasks').list;\nlist({ pageSize: 1 });",
        path: '$.resourceHandleMethodAssignedAliasFromFactoryInvalidApiResourceCall.code',
        capability: 'list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar list;\n({ list } = ctx.api.resource('tasks'));\nlist({ pageSize: 1 });",
        path: '$.resourceHandleMethodAssignedDestructuredInvalidApiResourceCall.code',
        capability: 'list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar tasks = ctx.api.resource('tasks');\nvar localTasks = tasks;\nlocalTasks.get({ filterByTk: 1 });",
        path: '$.resourceHandleSecondLevelAliasInvalidApiResourceCall.code',
        capability: 'localTasks.get',
        method: 'get',
      },
      {
        code: "ctx.render(null);\nvar tasks = ctx.api.resource('tasks');\nvar list = tasks.list;\nlist({ pageSize: 1 });",
        path: '$.resourceHandleMethodAliasFromHandleInvalidApiResourceCall.code',
        capability: 'list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar list = ctx.api.resource('tasks').list;\nvar localList = list;\nlocalList({ pageSize: 1 });",
        path: '$.resourceHandleMethodSecondLevelAliasInvalidApiResourceCall.code',
        capability: 'localList',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar list = ctx.api.resource('tasks').list;\nvar localList;\nlocalList = list;\nlocalList({ pageSize: 1 });",
        path: '$.resourceHandleMethodAssignedSecondLevelAliasInvalidApiResourceCall.code',
        capability: 'localList',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar list = ctx.api.resource('tasks').list;\nvar localList = (0, list);\nlocalList({ pageSize: 1 });",
        path: '$.resourceHandleMethodSequenceAliasInvalidApiResourceCall.code',
        capability: 'localList',
        method: 'list',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "var list = ctx.api.resource('tasks').list;",
          'var localList = enabled ? list : function() {};',
          'localList({ pageSize: 1 });',
        ].join('\n'),
        path: '$.resourceHandleMethodConditionalAliasInvalidApiResourceCall.code',
        capability: 'localList',
        method: 'list',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "var list = ctx.api.resource('tasks').list;",
          'var localList = enabled && list;',
          'localList({ pageSize: 1 });',
        ].join('\n'),
        path: '$.resourceHandleMethodLogicalAliasInvalidApiResourceCall.code',
        capability: 'localList',
        method: 'list',
      },
      {
        code: "ctx.render(null);\nctx.api.resource('tasks').list.call(null, { pageSize: 1 });",
        path: '$.resourceMethodCallInvokeInvalidApiResourceCall.code',
        capability: "ctx.api.resource('tasks').list.call",
        method: 'list',
      },
      {
        code: "ctx.render(null);\nctx.api.resource('tasks').get.apply(null, [{ filterByTk: 1 }]);",
        path: '$.resourceMethodApplyInvokeInvalidApiResourceCall.code',
        capability: "ctx.api.resource('tasks').get.apply",
        method: 'get',
      },
      {
        code: "ctx.render(null);\nctx.api.resource('tasks').create.bind(null, { values: {} });",
        path: '$.resourceMethodBindInvokeInvalidApiResourceCall.code',
        capability: "ctx.api.resource('tasks').create.bind",
        method: 'create',
      },
      {
        code: "ctx.render(null);\nvar list = ctx.api.resource('tasks').list;\nlist.call(null, { pageSize: 1 });",
        path: '$.resourceMethodAliasCallInvokeInvalidApiResourceCall.code',
        capability: 'list.call',
        method: 'list',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "var tasks = enabled ? ctx.api.resource('tasks') : {};",
          'tasks.list({ pageSize: 1 });',
        ].join('\n'),
        path: '$.conditionalResourceHandleAliasInvalidApiResourceCall.code',
        capability: 'tasks.list',
        method: 'list',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "(enabled ? ctx.api.resource('tasks') : {}).list({ pageSize: 1 });",
        ].join('\n'),
        path: '$.conditionalDirectResourceHandleInvalidApiResourceCall.code',
        capability: "ctx.api.resource('tasks').list",
        method: 'list',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "var tasks = ctx.api.resource('tasks');",
          '(enabled ? tasks : {}).get({ filterByTk: 1 });',
        ].join('\n'),
        path: '$.conditionalDirectResourceHandleAliasInvalidApiResourceCall.code',
        capability: '(enabled ? tasks : {}).get',
        method: 'get',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "var list = enabled ? ctx.api.resource('tasks').list : function() {};",
          'list({ pageSize: 1 });',
        ].join('\n'),
        path: '$.conditionalResourceMethodAliasInvalidApiResourceCall.code',
        capability: 'list',
        method: 'list',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "var list = ctx.api.resource('tasks').list;",
          '(enabled ? list : function() {})({ pageSize: 1 });',
        ].join('\n'),
        path: '$.conditionalDirectResourceMethodAliasInvalidApiResourceCall.code',
        capability: 'enabled ? list : function() {}',
        method: 'list',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "var list = enabled && ctx.api.resource('tasks').list;",
          'list({ pageSize: 1 });',
        ].join('\n'),
        path: '$.logicalResourceMethodAliasInvalidApiResourceCall.code',
        capability: 'list',
        method: 'list',
      },
      {
        code: "ctx.render(null);\n(0, ctx.api.resource('tasks').list)({ pageSize: 1 });",
        path: '$.sequenceWrappedDirectResourceMethodInvalidApiResourceCall.code',
        capability: "0, ctx.api.resource('tasks').list",
        method: 'list',
      },
      {
        code: [
          'ctx.render(null);',
          'var enabled = Math.random() > 0.5;',
          "(enabled ? ctx.api.resource('tasks').list : function(){})({ pageSize: 1 });",
        ].join('\n'),
        path: '$.conditionalWrappedDirectResourceMethodInvalidApiResourceCall.code',
        capability: "enabled ? ctx.api.resource('tasks').list : function(){}",
        method: 'list',
      },
      {
        code: "ctx.render(null);\n(0, ctx.api.resource)('tasks', 'list', { pageSize: 1 });",
        path: '$.sequenceWrappedDirectResourceFactoryInvalidApiResourceCall.code',
        capability: "0, ctx.api.resource('tasks', 'list')",
        method: 'list',
      },
      {
        code: "ctx.render(null);\nvar tasks = ctx.api.resource('tasks');\n(0, tasks.list)({ pageSize: 1 });",
        path: '$.sequenceWrappedResourceHandleMethodAliasInvalidApiResourceCall.code',
        capability: '0, tasks.list',
        method: 'list',
      },
    ].forEach(({ capability, code, method, path }) => {
      const errors = inspectRunJsAuthoringCode({
        code,
        path,
        modelUse: 'JSBlockModel',
      });
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-api-resource-call-invalid',
            details: expect.objectContaining({
              repairClass: 'switch-to-resource-api',
              capability,
              method,
            }),
          }),
        ]),
      );
      expect(errors.map((error: any) => error.ruleId)).not.toContain('runjs-ctx-api-member-unknown');
    });

    [
      'ctx.render(null);\nlet api = ctx.api;\napi = { useRequest: function() {} };\napi.useRequest();',
      'ctx.render(null);\nlet api = ctx.api;\napi &&= { useRequest: function() {} };\napi.useRequest();',
      'ctx.render(null);\nlet auth = ctx.api.auth;\nauth = { setToken: function() {} };\nauth.setToken();',
      'ctx.render(null);\nlet request = ctx.api.request;\nrequest &&= { use: function() {} };\nrequest.use();',
      'ctx.render(null);\nvar api = ctx.api;\nvar api = { useRequest: function() {} };\napi.useRequest();',
      'ctx.render(null);\nvar auth = ctx.api.auth;\nvar auth = { setToken: function() {} };\nauth.setToken();',
      'ctx.render(null);\nvar request = ctx.api.request;\nvar request = { use: function() {} };\nrequest.use();',
      'ctx.render(null);\nlet api = ctx.api;\napi = { useRequest: function() {} };\nlet localApi = api;\nlocalApi.useRequest();',
      'ctx.render(null);\nlet request = ctx.api.request;\nrequest = { use: function() {} };\nlet localRequest = request;\nlocalRequest.use();',
      'ctx.render(null);\nlet authenticator = ctx.api.auth.authenticator;\nauthenticator = {};\nauthenticator.options = {};',
      'ctx.render(null);\nlet tasks = ctx.api.resource("tasks");\ntasks = { list: function() {} };\nlet localTasks = tasks;\nlocalTasks.list();',
      'ctx.render(null);\nlet tasks = ctx.api.resource("tasks");\ntasks &&= { list: function() {} };\ntasks.list();',
      'ctx.render(null);\nlet list = ctx.api.resource("tasks").list;\nlist &&= function() {};\nlist();',
      'ctx.render(null);\nlet api = ctx.api;\nfor (api of [{}]) {}\napi.useRequest();',
      'ctx.render(null);\nlet tasks = ctx.api.resource("tasks");\nfor (tasks of [{}]) {}\ntasks.list();',
      'ctx.render(null);\nlet api = ctx.api;\nfor (api in { active: true }) {}\napi.useRequest();',
      [
        'ctx.render(null);',
        'let outer = 0;',
        'let api = ctx.api;',
        'for (outer of [1]) { for (api of [{}]) {} }',
        'api.useRequest();',
      ].join('\n'),
      [
        'ctx.render(null);',
        'let key = "";',
        'let api = ctx.api;',
        'for (key in { active: true }) { for (api of [{}]) {} }',
        'api.useRequest();',
      ].join('\n'),
      [
        'ctx.render(null);',
        'let key = "";',
        'let api = ctx.api;',
        'for (key in { ["active"]: true }) { for (api of [{}]) {} }',
        'api.useRequest();',
      ].join('\n'),
      [
        'ctx.render(null);',
        'let key = "";',
        'let api = ctx.api;',
        'for (key in { __proto__() {} }) { for (api of [{}]) {} }',
        'api.useRequest();',
      ].join('\n'),
      [
        'ctx.render(null);',
        'let outer = 0;',
        'let api = ctx.api;',
        'for (outer of [,]) { for (api of [{}]) {} }',
        'api.useRequest();',
      ].join('\n'),
      [
        'ctx.render(null);',
        'var resource = ctx.api.resource;',
        'var resource = function() { return { list: function() {} }; };',
        "resource('tasks').list();",
      ].join('\n'),
    ].forEach((code, index) => {
      expect(
        inspectRunJsAuthoringCode({
          code,
          path: `$.reassignedCtxApiAlias[${index}].code`,
          modelUse: 'JSBlockModel',
        }),
      ).toEqual([]);
    });

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'ctx.render(null);',
          'let items = [];',
          'let outer = 0;',
          'let api = ctx.api;',
          'for (outer of items) { for (api of [{}]) {} }',
          'api.useRequest();',
        ].join('\n'),
        path: '$.dynamicNestedLoopKeepsCtxApiAlias.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-ctx-api-member-unknown',
          details: expect.objectContaining({
            capability: 'ctx.api.useRequest',
          }),
        }),
      ]),
    );

    const sharedResourceHelperErrors = inspectRunJsAuthoringCode({
      code: [
        'async function fetchAll(resourceName, filter) {',
        "  ctx.initResource('MultiRecordResource');",
        '  ctx.resource.setResourceName(resourceName);',
        '  ctx.resource.setPageSize(200);',
        '  if (filter) ctx.resource.setFilter(filter);',
        '  await ctx.resource.refresh();',
        '  return ctx.resource.getData() || [];',
        '}',
        "const activeGroups = await fetchAll('employer_groups', { group_status: { $eq: 'Active' } });",
        "const claimsRows = await fetchAll('claims');",
        "ctx.render(ctx.React.createElement('div', null, String(activeGroups.length + claimsRows.length)));",
      ].join('\n'),
      path: '$.sharedResourceHelper.code',
      modelUse: 'JSBlockModel',
    });
    expect(sharedResourceHelperErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-jsblock-shared-resource-helper-forbidden',
          details: expect.objectContaining({
            repairClass: 'resource-runtime-contract-stop',
            capability: 'ctx.initResource',
            functionName: 'fetchAll',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-jsblock-shared-resource-helper-forbidden',
          details: expect.objectContaining({
            repairClass: 'resource-runtime-contract-stop',
            capability: 'ctx.resource',
            functionName: 'fetchAll',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'async function fetchAll(resourceName, filter) {',
          "  const resource = ctx.makeResource('MultiRecordResource');",
          '  resource.setResourceName(resourceName);',
          '  resource.setPageSize(200);',
          '  if (filter) resource.setFilter(filter);',
          '  await resource.refresh();',
          '  return resource.getData() || [];',
          '}',
          "const rows = await fetchAll('claims', { review_status: { $eq: 'Needs Review' } });",
          "ctx.render(ctx.React.createElement('div', null, String(rows.length)));",
        ].join('\n'),
        path: '$.localResourceHelper.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'ctx.render(null);',
          'let outer = 0;',
          'let api = ctx.api;',
          'for (outer of [...[]]) { for (api of [{}]) {} }',
          'api.useRequest();',
        ].join('\n'),
        path: '$.emptySpreadNestedForOfKeepsCtxApiAlias.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-ctx-api-member-unknown',
          details: expect.objectContaining({
            capability: 'ctx.api.useRequest',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'ctx.render(null);',
          'let key = "";',
          'let api = ctx.api;',
          'for (key in { [Symbol.iterator]: 1 }) { for (api of [{}]) {} }',
          'api.useRequest();',
        ].join('\n'),
        path: '$.symbolComputedNestedForInKeepsCtxApiAlias.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-ctx-api-member-unknown',
          details: expect.objectContaining({
            capability: 'ctx.api.useRequest',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'ctx.render(null);',
          'let key = "";',
          'let api = ctx.api;',
          'for (key in { __proto__: null }) { for (api of [{}]) {} }',
          'api.useRequest();',
        ].join('\n'),
        path: '$.protoOnlyNestedForInKeepsCtxApiAlias.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-ctx-api-member-unknown',
          details: expect.objectContaining({
            capability: 'ctx.api.useRequest',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: 'function invoke(ctx) { return ctx.api.useRequest; }\nctx.render(null);',
        path: '$.shadowedCtxApiMember.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
  });

  it('should reject invalid React runtime patterns in JSBlock authoring code', async () => {
    const hookErrors = inspectRunJsAuthoringCode({
      code: [
        'const { Card, Statistic, Spin } = ctx.antd;',
        'const { useEffect, useState } = ctx.React;',
        'const [count, setCount] = useState(null);',
        "useEffect(() => { ctx.api.resource.list({ resource: 'ai_products', pageSize: 1 }).then((res) => setCount(res.meta?.total || 0)); }, []);",
        "const el = count === null ? React.createElement(Spin, null) : React.createElement(Statistic, { title: '追踪产品数', value: count });",
        'ctx.render(React.createElement(Card, { bordered: false }, el));',
      ].join('\n'),
      path: '$.hookMisuse.code',
      modelUse: 'JSBlockModel',
    });
    expect(hookErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-hook-top-level-forbidden',
          details: expect.objectContaining({
            repairClass: 'react-runtime-contract-stop',
            hook: 'useState',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-api-resource-call-invalid',
        }),
        expect.objectContaining({
          ruleId: 'runjs-react-global-unbound',
        }),
      ]),
    );

    const defaultAliasErrors = inspectRunJsAuthoringCode({
      code: ['const React = ctx.React.default;', "ctx.render(React.createElement('div', null, 'broken'));"].join('\n'),
      path: '$.defaultReactAlias.code',
      modelUse: 'JSBlockModel',
    });
    expect(defaultAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-default-alias-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.React.default',
            binding: 'React',
          }),
        }),
      ]),
    );

    const defaultRenameErrors = inspectRunJsAuthoringCode({
      code: ['const { default: React } = ctx.React;', 'ctx.render(<div>broken</div>);'].join('\n'),
      path: '$.defaultReactRename.code',
      modelUse: 'JSBlockModel',
    });
    expect(defaultRenameErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-default-alias-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.React.default',
            binding: 'React',
          }),
        }),
      ]),
    );

    const defaultIntermediateAliasErrors = inspectRunJsAuthoringCode({
      code: [
        'const { default: ReactDefault } = ctx.React;',
        "ctx.render(ctx.React.createElement('div', null, 'ok'));",
      ].join('\n'),
      path: '$.defaultReactIntermediateAlias.code',
      modelUse: 'JSBlockModel',
    });
    expect(defaultIntermediateAliasErrors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-default-alias-forbidden',
        }),
      ]),
    );

    const defaultTwoStepAliasErrors = inspectRunJsAuthoringCode({
      code: [
        'const ReactDefault = ctx.React.default;',
        'const React = ReactDefault;',
        "ctx.render(React.createElement('div', null, 'broken'));",
      ].join('\n'),
      path: '$.defaultReactTwoStepAlias.code',
      modelUse: 'JSBlockModel',
    });
    expect(defaultTwoStepAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-default-alias-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.React.default',
            binding: 'React',
          }),
        }),
      ]),
    );

    [
      {
        code: ['let React;', 'React ||= ctx.React.default;', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactLogicalOrAssignment.code',
      },
      {
        code: ['let React;', 'React ??= ctx.React.default;', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactNullishAssignment.code',
      },
      {
        code: ['let React;', 'React &&= ctx.React.default;', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactLogicalAndAssignment.code',
      },
      {
        code: [
          'let ReactDefault;',
          'ReactDefault ||= ctx.React.default;',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactLogicalTwoStepAlias.code',
      },
      {
        code: [
          'let ReactDefault;',
          'ReactDefault ??= ctx.React.default;',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNullishTwoStepAlias.code',
      },
      {
        code: [
          'let ReactDefault = {};',
          'ReactDefault &&= ctx.React.default;',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactLogicalAndTwoStepAlias.code',
      },
      {
        code: [
          'let ReactNs;',
          'ReactNs ||= ctx.React;',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNamespaceLogicalOrAlias.code',
      },
      {
        code: [
          'let ReactNs;',
          'ReactNs ??= ctx.React;',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNamespaceNullishAlias.code',
      },
      {
        code: [
          'let ReactNs = {};',
          'ReactNs &&= ctx.React;',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNamespaceLogicalAndAlias.code',
      },
      {
        code: [
          'let ReactNs;',
          'ReactNs ||= ctx.React;',
          'const { default: React } = ReactNs;',
          'ctx.render(<div>broken</div>);',
        ],
        path: '$.defaultReactNamespaceLogicalDestructure.code',
      },
      {
        code: [
          'let ReactDefault;',
          'const React = (ReactDefault = ctx.React.default);',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactInlineAssignmentAlias.code',
      },
      {
        code: [
          'let ReactDefault;',
          'const React = (ReactDefault ||= ctx.React.default);',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactInlineLogicalOrAlias.code',
      },
      {
        code: [
          'let ReactDefault;',
          'const React = (ReactDefault ??= ctx.React.default);',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactInlineNullishAlias.code',
      },
      {
        code: [
          'let ReactDefault = {};',
          'const React = (ReactDefault &&= ctx.React.default);',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactInlineLogicalAndAlias.code',
      },
      {
        code: ['let ReactNs;', 'const { default: React } = (ReactNs = ctx.React);', 'ctx.render(<div>broken</div>);'],
        path: '$.defaultReactInlineNamespaceAssignmentDestructure.code',
      },
      {
        code: ['let ReactNs;', 'const { default: React } = (ReactNs ||= ctx.React);', 'ctx.render(<div>broken</div>);'],
        path: '$.defaultReactInlineNamespaceLogicalDestructure.code',
      },
      {
        code: ['let ReactNs;', 'const { default: React } = (ReactNs ??= ctx.React);', 'ctx.render(<div>broken</div>);'],
        path: '$.defaultReactInlineNamespaceNullishDestructure.code',
      },
      {
        code: [
          'let ReactNs = {};',
          'const { default: React } = (ReactNs &&= ctx.React);',
          'ctx.render(<div>broken</div>);',
        ],
        path: '$.defaultReactInlineNamespaceLogicalAndDestructure.code',
      },
      {
        code: [
          'let ReactDefault;',
          'const React = (0, ReactDefault ||= ctx.React.default);',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactSequenceInlineLogicalAlias.code',
      },
      {
        code: [
          'let ReactNs;',
          'const { default: React } = (0, ReactNs ||= ctx.React);',
          'ctx.render(<div>broken</div>);',
        ],
        path: '$.defaultReactSequenceInlineNamespaceDestructure.code',
      },
      {
        code: [
          'const ReactNs1 = ctx.React;',
          'const ReactNs2 = ReactNs1;',
          'const React = ReactNs2.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactMultiHopNamespaceAlias.code',
      },
      {
        code: [
          '((React = ctx.React.default) => {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '})();',
        ],
        path: '$.defaultReactFunctionParamAlias.code',
      },
      {
        code: [
          '((ReactDefault = ctx.React.default) => {',
          '  const React = ReactDefault;',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '})();',
        ],
        path: '$.defaultReactFunctionParamTwoStepAlias.code',
      },
      {
        code: [
          '(({ React: ReactNs } = ctx) => {',
          '  const React = ReactNs.default;',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '})();',
        ],
        path: '$.defaultReactFunctionParamNamespaceDestructure.code',
      },
      {
        code: [
          '(({ React: { default: React } } = ctx) => {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '})();',
        ],
        path: '$.defaultReactFunctionParamNestedDestructure.code',
      },
      {
        code: [
          '((box = { ns: ctx.React }) => {',
          '  const React = box.ns.default;',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '})();',
        ],
        path: '$.defaultReactFunctionParamObjectNamespaceCarrierAlias.code',
      },
      {
        code: [
          '((arr = [ctx.React.default]) => {',
          '  const React = arr[0];',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '})();',
        ],
        path: '$.defaultReactFunctionParamArrayDefaultCarrierAlias.code',
      },
      {
        code: [
          'const box = { ns: ctx.React };',
          'const React = box.ns.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectNamespaceCarrierAlias.code',
      },
      {
        code: [
          'const box = { ReactDefault: ctx.React.default };',
          'const React = box.ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectDefaultCarrierAlias.code',
      },
      {
        code: [
          'const arr = [ctx.React.default];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayDefaultCarrierAlias.code',
      },
      {
        code: [
          'const arr = [ctx.React];',
          'const React = arr[0].default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayNamespaceCarrierAlias.code',
      },
      {
        code: [
          'const box = { ns: ctx.React };',
          'box.ns = ctx.React.default;',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectCarrierMemberReassignedToDefault.code',
      },
      {
        code: [
          'const arr = [ctx.React];',
          'arr[0] = ctx.React.default;',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayCarrierMemberReassignedToDefault.code',
      },
      {
        code: [
          'const { ns: React } = { ns: ctx.React.default };',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectCarrierDestructureRead.code',
      },
      {
        code: ['const [React] = [ctx.React.default];', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactArrayCarrierDestructureRead.code',
      },
      {
        code: [
          'const box = { ns: ctx.React.default };',
          'const { ns: React } = box;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectAliasCarrierDestructureRead.code',
      },
      {
        code: [
          'const arr = [ctx.React.default];',
          'const [React] = arr;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayAliasCarrierDestructureRead.code',
      },
      {
        code: [
          'const { ns: ReactNs } = { ns: ctx.React };',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectNamespaceCarrierDestructureRead.code',
      },
      {
        code: [
          'const { ns: { default: React } } = { ns: ctx.React };',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedObjectNamespaceCarrierDestructureRead.code',
      },
      {
        code: ['const [{ default: React }] = [ctx.React];', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactNestedArrayNamespaceCarrierDestructureRead.code',
      },
      {
        code: ['const { 0: React } = [ctx.React.default];', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactNumericObjectPatternArrayDefault.code',
      },
      {
        code: [
          'const { 0: ReactNs } = [ctx.React];',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNumericObjectPatternArrayNamespaceDefault.code',
      },
      {
        code: [
          'const box = { ns: ctx.React };',
          '({ ns: box.ns } = { ns: ctx.React.default });',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectCarrierDestructureMemberWriteToDefault.code',
      },
      {
        code: [
          'const arr = [ctx.React];',
          '[arr[0]] = [ctx.React.default];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayCarrierDestructureMemberWriteToDefault.code',
      },
      {
        code: [
          'const { ...box } = { ns: ctx.React.default };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectRestCarrierDefault.code',
      },
      {
        code: [
          'const { ...box } = { ns: ctx.React.default, [fieldName]: 1 };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectRestCarrierDynamicKeyCannotHideDefault.code',
      },
      {
        code: [
          'const { ...box } = { [fieldName]: ctx.React.default };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectRestCarrierDynamicKeyOnlyDefault.code',
      },
      {
        code: [
          'const unsafe = { ns: ctx.React.default };',
          'const { ns: React } = { ...unsafe };',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectSpreadCarrierDestructureDefault.code',
      },
      {
        code: [
          'const unsafe = { ns: ctx.React.default };',
          'const { ns: React } = { ...unsafe, [fieldName]: 1 };',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectSpreadCarrierDynamicKeyCannotHideDefault.code',
      },
      {
        code: [
          'const safe = { ns: ctx.React };',
          'const box = { ...safe, [fieldName]: ctx.React.default };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectDynamicKeyCarrierCannotHideDefault.code',
      },
      {
        code: [
          'const { ns: React } = { [fieldName]: ctx.React.default };',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectDynamicKeyOnlyCarrierDefault.code',
      },
      {
        code: [
          'const box = { [fieldName]: ctx.React.default };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectDynamicKeyCarrierAliasDefault.code',
      },
      {
        code: [
          'const unsafe = { [fieldName]: ctx.React.default };',
          'const box = { ...unsafe };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectDynamicKeySpreadAliasDefault.code',
      },
      {
        code: [
          'const unsafe = { ns: ctx.React, [fieldName]: ctx.React.default };',
          'const box = { ...unsafe };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectSpreadDynamicKeyOverridesNamespaceDefault.code',
      },
      {
        code: [
          'const box = { ...{ [fieldName]: ctx.React.default } };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectLiteralDynamicKeySpreadAliasDefault.code',
      },
      {
        code: [
          'const safe = { ns: ctx.React };',
          'const unsafe = { ns: ctx.React.default };',
          'const { ns: React } = { ...safe, ...unsafe };',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectSpreadCarrierLaterDefault.code',
      },
      {
        code: [
          'const unsafe = { ns: ctx.React.default };',
          'const box = { ...unsafe };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectSpreadCarrierAliasDefault.code',
      },
      {
        code: [
          'const box = { ...{ ns: ctx.React.default } };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectLiteralSpreadCarrierAliasDefault.code',
      },
      {
        code: [
          'const source = { ns: ctx.React.default };',
          'const { ...box } = source;',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectAliasRestCarrierDefault.code',
      },
      {
        code: [
          'const { ...box } = { ...{ ns: ctx.React.default } };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectLiteralSpreadRestCarrierDefault.code',
      },
      {
        code: [
          'const [...arr] = [ctx.React.default];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayRestCarrierDefault.code',
      },
      {
        code: [
          'const unsafe = [ctx.React.default];',
          'const [React] = [...unsafe];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArraySpreadCarrierDestructureDefault.code',
      },
      {
        code: [
          'const [skip, React] = [...[0], ...[ctx.React.default]];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayFixedSpreadPrefixDestructureDefault.code',
      },
      {
        code: [
          'const [React = ctx.React.default] = [...items, ctx.React];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayUnboundedSpreadPatternDefaultAlias.code',
      },
      {
        code: [
          'const arr = [...items, ctx.React.default];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayUnboundedSpreadTrailingDefaultCarrierAlias.code',
      },
      {
        code: [
          'const arr = [...items, ...[ctx.React.default]];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayUnboundedSpreadTrailingDefaultSpreadCarrierAlias.code',
      },
      {
        code: [
          'const [...arr] = [...items, ctx.React.default];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayUnboundedSpreadTrailingDefaultRestCarrierAlias.code',
      },
      {
        code: [
          'const [...arr] = [...items, ...[ctx.React.default]];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayUnboundedSpreadTrailingDefaultSpreadRestCarrierAlias.code',
      },
      {
        code: [
          'const { 0: React = ctx.React.default } = [...items, ctx.React];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNumericObjectPatternUnboundedSpreadDefaultAlias.code',
      },
      {
        code: [
          'const unsafe = [ctx.React.default];',
          'const safe = [ctx.React];',
          'const [React] = [...unsafe, ...safe];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArraySpreadCarrierFirstDefault.code',
      },
      {
        code: [
          'const unsafe = [ctx.React.default];',
          'const arr = [...unsafe];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArraySpreadCarrierAliasDefault.code',
      },
      {
        code: [
          'const arr = [...[ctx.React.default]];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayLiteralSpreadCarrierAliasDefault.code',
      },
      {
        code: [
          'const arr = [...[0], ...[ctx.React.default]];',
          'const React = arr[1];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayFixedSpreadPrefixCarrierAliasDefault.code',
      },
      {
        code: [
          'const source = [ctx.React.default];',
          'const [...arr] = source;',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayAliasRestCarrierDefault.code',
      },
      {
        code: [
          'const [...arr] = [...[ctx.React.default]];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayLiteralSpreadRestCarrierDefault.code',
      },
      {
        code: [
          'const [...arr] = [...[0], ...[ctx.React.default]];',
          'const React = arr[1];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayFixedSpreadPrefixRestCarrierDefault.code',
      },
      {
        code: [
          'const [first, ...arr] = [ctx.React, ctx.React.default];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayOffsetRestCarrierDefault.code',
      },
      {
        code: [
          'const { ...box } = { ns: ctx.React };',
          'const React = box.ns.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectRestCarrierNamespace.code',
      },
      {
        code: [
          'const source = { ns: ctx.React };',
          'const { ...box } = source;',
          'const React = box.ns.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectAliasRestCarrierNamespace.code',
      },
      {
        code: [
          'const { ns: box } = { ns: { default: ctx.React.default } };',
          'const { default: React } = box;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectDestructuredNestedCarrierDefault.code',
      },
      {
        code: [
          'const [box] = [{ default: ctx.React.default }];',
          'const { default: React } = box;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayDestructuredNestedCarrierDefault.code',
      },
      {
        code: [
          'const box = {};',
          'box.ns = { default: ctx.React.default };',
          'const { default: React } = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactMemberAssignedNestedCarrierDefault.code',
      },
      {
        code: [
          'const { ns: box } = { ns: { runtime: ctx.React } };',
          'const React = box.runtime.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectDestructuredNestedCarrierNamespace.code',
      },
      {
        code: [
          'const box = {};',
          'box.ns = { runtime: ctx.React.default };',
          'const React = box.ns.runtime;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactMultiHopMemberAssignedCarrierDefault.code',
      },
      {
        code: [
          'const box = { ns: {} };',
          'box.ns.runtime = ctx.React.default;',
          'const React = box.ns.runtime;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactMultiHopMemberAssignedDefault.code',
      },
      {
        code: [
          'const box = {};',
          'box.ns = [ctx.React.default];',
          'const React = box.ns[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactMultiHopArrayMemberAssignedCarrierDefault.code',
      },
      {
        code: [
          'for (const React of [ctx.React.default]) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfDirectDefaultAlias.code',
      },
      {
        code: [
          'for (const React of [ctx.React, ctx.React.default]) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfMultiElementDirectDefaultAlias.code',
      },
      {
        code: [
          'for (const ReactNs of [ctx.React]) {',
          '  const React = ReactNs.default;',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfNamespaceDefaultAlias.code',
      },
      {
        code: [
          'for (const { ns: ReactNs } of [{ ns: ctx.React }]) {',
          '  const React = ReactNs.default;',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfDestructuredNamespaceDefaultAlias.code',
      },
      {
        code: [
          'for (const ReactNs of [{}, ctx.React]) {',
          '  const React = ReactNs.default;',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfMultiElementNamespaceDefaultAlias.code',
      },
      {
        code: [
          'for (const React of [...[ctx.React.default]]) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfLiteralSpreadDefaultAlias.code',
      },
      {
        code: [
          'for (const React of [...[0], ...[ctx.React.default]]) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfFixedSpreadPrefixDefaultAlias.code',
      },
      {
        code: [
          'for (const { ns: React } of [...[{ ns: ctx.React.default }]]) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfDestructuredLiteralSpreadDefaultAlias.code',
      },
      {
        code: [
          'for (const React of (flag ? [ctx.React.default] : [ctx.React])) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfConditionalDefaultAlias.code',
      },
      {
        code: [
          'const values = [ctx.React.default];',
          'for (const React of values) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfArrayAliasDefaultAlias.code',
      },
      {
        code: [
          'const values = [{ ns: ctx.React.default }];',
          'for (const { ns: React } of values) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfArrayAliasDestructuredDefaultAlias.code',
      },
      {
        code: [
          'const box = { ns: ctx.React };',
          'for ({ ns: box.ns } of [{ ns: ctx.React.default }]) break;',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactForOfMemberWriteToDefaultAlias.code',
      },
      {
        code: [
          'for (const { React = ctx.React.default } of records) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfUnknownSourcePatternDefaultAlias.code',
      },
      {
        code: [
          'for (const { React = ctx.React.default } of [{ React: ctx.React }, {}]) {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '}',
        ],
        path: '$.defaultReactForOfMultiElementPatternDefaultAlias.code',
      },
      {
        code: ['const { React = ctx.React.default } = {};', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactObjectPatternDefaultAlias.code',
      },
      {
        code: [
          'const { ReactDefault = ctx.React.default } = {};',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectPatternDefaultTwoStepAlias.code',
      },
      {
        code: ['const [React = ctx.React.default] = [];', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactArrayPatternDefaultAlias.code',
      },
      {
        code: [
          'const { ns: ReactNs = ctx.React } = {};',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectPatternNamespaceDefaultAlias.code',
      },
      {
        code: [
          '(({ React = ctx.React.default } = {}) => {',
          "  ctx.render(React.createElement('div', null, 'broken'));",
          '})({});',
        ],
        path: '$.defaultReactFunctionObjectPatternDefaultAlias.code',
      },
      {
        code: [
          'const { box = { ns: ctx.React } } = {};',
          'const React = box.ns.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactObjectPatternDefaultObjectCarrierAlias.code',
      },
      {
        code: [
          'const [arr = [ctx.React.default]] = [];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactArrayPatternDefaultArrayCarrierAlias.code',
      },
      {
        code: [
          'const { view: { default: React } = ctx.React } = {};',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedObjectPatternNamespaceDefaultAlias.code',
      },
      {
        code: [
          'const c = ctx;',
          'const React = c.React.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactCtxRootAlias.code',
      },
      {
        code: [
          'const { React: ReactNs } = ctx;',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactDestructuredNamespaceAlias.code',
      },
      {
        code: [
          'const c = ctx;',
          'const { React: ReactNs } = c;',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactCtxAliasDestructuredNamespace.code',
      },
      {
        code: [
          'let c;',
          'const React = (c = ctx).React.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactInlineCtxRootAlias.code',
      },
      {
        code: ['const { React: { default: React } } = ctx;', "ctx.render(React.createElement('div', null, 'broken'));"],
        path: '$.defaultReactNestedCtxDestructure.code',
      },
      {
        code: [
          'let React;',
          '({ React: { default: React } } = ctx);',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedCtxAssignmentDestructure.code',
      },
      {
        code: [
          'const c = ctx;',
          'const { React: { default: React } } = c;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedCtxAliasDestructure.code',
      },
      {
        code: [
          'let c;',
          'const { React: { default: React } } = (c = ctx);',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedInlineCtxAliasDestructure.code',
      },
      {
        code: [
          'const { React: { default: ReactDefault } } = ctx;',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedCtxDestructureTwoStepAlias.code',
      },
      {
        code: [
          'let ReactDefault;',
          '({ React: { default: ReactDefault } } = ctx);',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedCtxAssignmentDestructureTwoStepAlias.code',
      },
      {
        code: [
          'let ReactDefault;',
          '{ ReactDefault = ctx.React.default; }',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockAssignmentAlias.code',
      },
      {
        code: [
          'let ReactDefault;',
          '{ ReactDefault ||= ctx.React.default; }',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockLogicalOrAlias.code',
      },
      {
        code: [
          'let ReactDefault;',
          '{ ReactDefault ??= ctx.React.default; }',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockNullishAlias.code',
      },
      {
        code: [
          'let ReactDefault = {};',
          '{ ReactDefault &&= ctx.React.default; }',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockLogicalAndAlias.code',
      },
      {
        code: [
          'let ReactDefault;',
          '{ ({ default: ReactDefault } = ctx.React); }',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockDestructuredDefaultAlias.code',
      },
      {
        code: [
          'let ReactNs;',
          '{ ReactNs = ctx.React; }',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockNamespaceAssignmentAlias.code',
      },
      {
        code: [
          'let ReactNs;',
          '{ ReactNs ||= ctx.React; }',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockNamespaceLogicalOrAlias.code',
      },
      {
        code: [
          'let ReactNs;',
          '{ ReactNs ??= ctx.React; }',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockNamespaceNullishAlias.code',
      },
      {
        code: [
          'let ReactNs = {};',
          '{ ReactNs &&= ctx.React; }',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockNamespaceLogicalAndAlias.code',
      },
      {
        code: [
          'let ReactNs;',
          '{ ({ React: ReactNs } = ctx); }',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactNestedBlockDestructuredNamespaceAlias.code',
      },
      {
        code: [
          'const React = Math.random() > 0.5 ? ctx.React.default : ctx.React;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactConditionalAlias.code',
      },
      {
        code: [
          'const React = window.__React || ctx.React.default;',
          "ctx.render(React.createElement('div', null, 'broken'));",
        ],
        path: '$.defaultReactLogicalFallbackAlias.code',
      },
      {
        code: [
          'const ReactNs = Math.random() > 0.5 ? ctx.React : window.__React;',
          'const { default: React } = ReactNs;',
          'ctx.render(<div>broken</div>);',
        ],
        path: '$.defaultReactConditionalNamespaceDestructure.code',
      },
    ].forEach(({ code, path }) => {
      const errors = inspectRunJsAuthoringCode({
        code: code.join('\n'),
        path,
        modelUse: 'JSBlockModel',
      });
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-react-default-alias-forbidden',
            details: expect.objectContaining({
              capability: 'ctx.React.default',
              binding: 'React',
            }),
          }),
        ]),
      );
    });

    [
      {
        code: [
          'let ReactNs;',
          'function initReactNs() { ReactNs = ctx.React; }',
          'const React = ReactNs.default;',
          "ctx.render(React.createElement('div', null, 'not-an-authoring-default-alias'));",
        ],
        path: '$.defaultReactNestedFunctionNamespaceAssignmentNotPropagated.code',
      },
      {
        code: [
          'let ReactDefault;',
          '[1].forEach(() => { ReactDefault = ctx.React.default; });',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'not-an-authoring-default-alias'));",
        ],
        path: '$.defaultReactCallbackDefaultAssignmentNotPropagated.code',
      },
      {
        code: [
          'const React = ctx.React;',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactRuntimeNamespaceAllowed.code',
      },
      {
        code: [
          'const box = { ns: ctx.React.default };',
          'box.ns = ctx.React;',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-reassigned-runtime-namespace'));",
        ],
        path: '$.defaultReactObjectCarrierMemberReassignedToNamespaceAllowed.code',
      },
      {
        code: [
          'const arr = [ctx.React.default];',
          'arr[0] = ctx.React;',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'allowed-reassigned-runtime-namespace'));",
        ],
        path: '$.defaultReactArrayCarrierMemberReassignedToNamespaceAllowed.code',
      },
      {
        code: [
          'const { ns: React } = { ns: ctx.React };',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactObjectCarrierDestructureNamespaceAllowed.code',
      },
      {
        code: [
          'const safe = { ns: ctx.React };',
          'const { ns: React } = { ns: ctx.React.default, ...safe };',
          "ctx.render(React.createElement('div', null, 'allowed-spread-override-namespace'));",
        ],
        path: '$.defaultReactObjectCarrierDestructureLaterSpreadNamespaceAllowed.code',
      },
      {
        code: [
          'const safe = { ns: ctx.React };',
          'const { ns: React } = { ...safe };',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactObjectSpreadCarrierDestructureNamespaceAllowed.code',
      },
      {
        code: [
          'const safe = { ns: ctx.React };',
          'const { ns: React } = { ...safe, [fieldName]: 1 };',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactObjectSpreadCarrierDynamicNonReactNamespaceAllowed.code',
      },
      {
        code: [
          'const safe = { ns: ctx.React };',
          'const box = { [fieldName]: ctx.React.default, ...safe };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-spread-override-namespace'));",
        ],
        path: '$.defaultReactObjectDynamicKeyLaterSpreadNamespaceAllowed.code',
      },
      {
        code: [
          'const safe = { [fieldName]: ctx.React.default, ns: ctx.React };',
          'const box = { ...safe };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactObjectSpreadSourceStaticNamespaceOverridesDynamicKeyAllowed.code',
      },
      {
        code: [
          'const box = { [fieldName]: ctx.React.default, ns: ctx.React };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactObjectDynamicKeyExactNamespaceAllowed.code',
      },
      {
        code: [
          'const box = { [fieldName]: ctx.React.default };',
          'box.ns = ctx.React;',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactObjectDynamicKeyReassignedNamespaceAllowed.code',
      },
      {
        code: [
          'const box = { ...{ ns: ctx.React } };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactObjectLiteralSpreadCarrierAliasNamespaceAllowed.code',
      },
      {
        code: [
          'const { ...box } = { ...{ ns: ctx.React } };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactObjectLiteralSpreadRestCarrierNamespaceAllowed.code',
      },
      {
        code: [
          'const unsafe = { ns: ctx.React.default };',
          'const safe = { ns: ctx.React };',
          'const { ns: React } = { ...unsafe, ...safe };',
          "ctx.render(React.createElement('div', null, 'allowed-spread-override-namespace'));",
        ],
        path: '$.defaultReactObjectSpreadCarrierLaterNamespaceAllowed.code',
      },
      {
        code: [
          'const { 0: React = ctx.React.default } = [ctx.React];',
          "ctx.render(React.createElement('div', null, 'allowed-default-source-namespace'));",
        ],
        path: '$.defaultReactNumericObjectPatternDefaultSourceNamespaceAllowed.code',
      },
      {
        code: [
          'const box = { ns: ctx.React.default };',
          '({ ns: box.ns } = { ns: ctx.React });',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-reassigned-runtime-namespace'));",
        ],
        path: '$.defaultReactObjectCarrierDestructureMemberWriteToNamespaceAllowed.code',
      },
      {
        code: [
          'const arr = [ctx.React.default];',
          '[arr[0]] = [ctx.React];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'allowed-reassigned-runtime-namespace'));",
        ],
        path: '$.defaultReactArrayCarrierDestructureMemberWriteToNamespaceAllowed.code',
      },
      {
        code: [
          'const { ns, ...box } = { ns: ctx.React.default, other: ctx.React };',
          'const React = box.other;',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactObjectRestExcludedDefaultAllowed.code',
      },
      {
        code: [
          'const { ...box } = { [fieldName]: ctx.React.default, ns: ctx.React };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactObjectRestDynamicKeyExactNamespaceAllowed.code',
      },
      {
        code: [
          'const [...arr] = [ctx.React];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactArrayRestCarrierNamespaceAllowed.code',
      },
      {
        code: [
          'const safe = [ctx.React];',
          'const [React] = [...safe];',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactArraySpreadCarrierDestructureNamespaceAllowed.code',
      },
      {
        code: [
          'const [skip, React] = [...[0], ...[ctx.React]];',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactArrayFixedSpreadPrefixDestructureNamespaceAllowed.code',
      },
      {
        code: [
          'const arr = [...[ctx.React]];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactArrayLiteralSpreadCarrierAliasNamespaceAllowed.code',
      },
      {
        code: [
          'const arr = [...[0], ...[ctx.React]];',
          'const React = arr[1];',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactArrayFixedSpreadPrefixCarrierAliasNamespaceAllowed.code',
      },
      {
        code: [
          'const arr = [...items, ctx.React.default];',
          'arr[0] = ctx.React;',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'allowed-reassigned-runtime-namespace'));",
        ],
        path: '$.defaultReactArrayUnboundedSpreadTrailingDefaultReassignedNamespaceAllowed.code',
      },
      {
        code: [
          'const source = [ctx.React];',
          'const [...arr] = source;',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactArrayAliasRestCarrierNamespaceAllowed.code',
      },
      {
        code: [
          'const [...arr] = [...[ctx.React]];',
          'const React = arr[0];',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactArrayLiteralSpreadRestCarrierNamespaceAllowed.code',
      },
      {
        code: [
          'const [...arr] = [...[0], ...[ctx.React]];',
          'const React = arr[1];',
          "ctx.render(React.createElement('div', null, 'allowed-spread-namespace'));",
        ],
        path: '$.defaultReactArrayFixedSpreadPrefixRestCarrierNamespaceAllowed.code',
      },
      {
        code: [
          'const safe = { ns: ctx.React };',
          'const { ...box } = { ns: ctx.React.default, ...safe };',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-spread-override-namespace'));",
        ],
        path: '$.defaultReactObjectRestCarrierSpreadOverrideAllowed.code',
      },
      {
        code: [
          'const { React = ctx.React.default } = { React: ctx.React };',
          "ctx.render(React.createElement('div', null, 'allowed-default-source-namespace'));",
        ],
        path: '$.defaultReactObjectPatternDefaultSourceNamespaceAllowed.code',
      },
      {
        code: [
          'const box = {};',
          'box.ns = { runtime: ctx.React };',
          'const React = box.ns.runtime;',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactMultiHopMemberAssignedCarrierNamespaceAllowed.code',
      },
      {
        code: [
          'const box = { ns: {} };',
          'box.ns.runtime = ctx.React;',
          'const React = box.ns.runtime;',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactMultiHopMemberAssignedNamespaceAllowed.code',
      },
      {
        code: [
          'for (const React of [ctx.React]) {',
          "  ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
          '}',
        ],
        path: '$.defaultReactForOfRuntimeNamespaceAllowed.code',
      },
      {
        code: [
          'for (const React of [ctx.React, ctx.React]) {',
          "  ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
          '}',
        ],
        path: '$.defaultReactForOfMultiElementRuntimeNamespaceAllowed.code',
      },
      {
        code: [
          'for (const React of [...[ctx.React]]) {',
          "  ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
          '}',
        ],
        path: '$.defaultReactForOfLiteralSpreadNamespaceAllowed.code',
      },
      {
        code: [
          'const values = [ctx.React];',
          'for (const React of values) {',
          "  ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
          '}',
        ],
        path: '$.defaultReactForOfArrayAliasNamespaceAllowed.code',
      },
      {
        code: [
          'const box = { ns: ctx.React.default };',
          'for ({ ns: box.ns } of [{ ns: ctx.React }]) break;',
          'const React = box.ns;',
          "ctx.render(React.createElement('div', null, 'allowed-runtime-namespace'));",
        ],
        path: '$.defaultReactForOfMemberWriteToNamespaceAllowed.code',
      },
      {
        code: [
          'for (const { React = ctx.React.default } of [{ React: ctx.React }]) {',
          "  ctx.render(React.createElement('div', null, 'allowed-default-source-namespace'));",
          '}',
        ],
        path: '$.defaultReactForOfPatternDefaultSourceNamespaceAllowed.code',
      },
      {
        code: [
          'for (const { React = ctx.React.default } of [{ React: ctx.React }, { React: ctx.React }]) {',
          "  ctx.render(React.createElement('div', null, 'allowed-default-source-namespace'));",
          '}',
        ],
        path: '$.defaultReactForOfMultiElementPatternDefaultSourceNamespaceAllowed.code',
      },
      {
        code: [
          'const values = [{ React: ctx.React }];',
          'for (const { React = ctx.React.default } of values) {',
          "  ctx.render(React.createElement('div', null, 'allowed-default-source-namespace'));",
          '}',
        ],
        path: '$.defaultReactForOfArrayAliasPatternDefaultSourceNamespaceAllowed.code',
      },
      {
        code: [
          'const { ReactDefault = ctx.React.default } = { ReactDefault: ctx.React };',
          'const React = ReactDefault;',
          "ctx.render(React.createElement('div', null, 'allowed-default-source-namespace'));",
        ],
        path: '$.defaultReactObjectPatternDefaultTwoStepSourceNamespaceAllowed.code',
      },
      {
        code: [
          'const [React = ctx.React.default] = [ctx.React];',
          "ctx.render(React.createElement('div', null, 'allowed-default-source-namespace'));",
        ],
        path: '$.defaultReactArrayPatternDefaultSourceNamespaceAllowed.code',
      },
      {
        code: [
          '(({ React = ctx.React.default } = { React: ctx.React }) => {',
          "  ctx.render(React.createElement('div', null, 'allowed-default-source-namespace'));",
          '})();',
        ],
        path: '$.defaultReactFunctionObjectPatternDefaultSourceNamespaceAllowed.code',
      },
    ].forEach(({ code, path }) => {
      const errors = inspectRunJsAuthoringCode({
        code: code.join('\n'),
        path,
        modelUse: 'JSBlockModel',
      });
      expect(errors).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-react-default-alias-forbidden',
          }),
        ]),
      );
    });

    const defaultAssignmentRenameErrors = inspectRunJsAuthoringCode({
      code: ['let React;', '({ default: React } = ctx.React);', 'ctx.render(<div>broken</div>);'].join('\n'),
      path: '$.defaultReactAssignmentRename.code',
      modelUse: 'JSBlockModel',
    });
    expect(defaultAssignmentRenameErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-default-alias-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.React.default',
            binding: 'React',
          }),
        }),
      ]),
    );

    const defaultAssignmentTwoStepAliasErrors = inspectRunJsAuthoringCode({
      code: [
        'let ReactDefault;',
        '({ default: ReactDefault } = ctx.React);',
        'const React = ReactDefault;',
        "ctx.render(React.createElement('div', null, 'broken'));",
      ].join('\n'),
      path: '$.defaultReactAssignmentTwoStepAlias.code',
      modelUse: 'JSBlockModel',
    });
    expect(defaultAssignmentTwoStepAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-default-alias-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.React.default',
            binding: 'React',
          }),
        }),
      ]),
    );

    const componentCallErrors = inspectRunJsAuthoringCode({
      code: [
        'function MetricCard(props) {',
        '  return ctx.libs.antd.Card({ style: { borderRadius: 8 } },',
        '    ctx.libs.antd.Statistic({',
        "      title: React.createElement('span', null, props.title),",
        '      value: props.value,',
        '    })',
        '  );',
        '}',
        'ctx.render(ctx.React.createElement(MetricCard, { title: "Active", value: 1 }));',
      ].join('\n'),
      path: '$.componentCallMisuse.code',
      modelUse: 'JSBlockModel',
    });
    expect(componentCallErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-component-call-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.libs.antd.Card',
            component: 'Card',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-react-component-call-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.libs.antd.Statistic',
            component: 'Statistic',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-react-global-unbound',
        }),
      ]),
    );

    const aliasComponentCallErrors = inspectRunJsAuthoringCode({
      code: 'const { Card } = ctx.libs.antd;\nctx.render(Card({ bordered: false }));',
      path: '$.aliasComponentCallMisuse.code',
      modelUse: 'JSBlockModel',
    });
    expect(aliasComponentCallErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-component-call-forbidden',
          details: expect.objectContaining({
            capability: 'ctx.libs.antd.Card',
            component: 'Card',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const React = ctx.React;',
          'const { Card, Statistic } = ctx.libs.antd;',
          'function App() {',
          '  const [count] = React.useState(0);',
          "  return React.createElement(Card, { bordered: false }, React.createElement(Statistic, { title: 'Total', value: count }));",
          '}',
          'ctx.render(React.createElement(App));',
        ].join('\n'),
        path: '$.validReactComponent.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid React JSBlock page',
        },
      },
      assets: {
        scripts: {
          reactKpi: {
            code: "ctx.render(React.createElement('div', null, 'bad'));",
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'reactKpi',
              type: 'jsBlock',
              script: 'reactKpi',
            },
          ],
        },
      ],
    });
    expect(applyBlueprintErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].script',
          ruleId: 'runjs-react-global-unbound',
        }),
      ]),
    );

    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'js-block-target' },
        changes: {
          code: 'const { Card } = ctx.libs.antd;\nctx.render(Card({ bordered: false }));',
          version: 'v2',
        },
      },
      {
        currentNode: { use: 'JSBlockModel' },
      },
    );
    expect(configureErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.code',
          ruleId: 'runjs-react-component-call-forbidden',
        }),
      ]),
    );
  });

  it('should reject case-mismatched ctx.libs members in RunJS authoring code', async () => {
    const errors = inspectRunJsAuthoringCode({
      code: [
        'const ReactA = ctx.libs.react;',
        'const ReactDOMA = ctx?.libs?.reactDOM;',
        "const Icons = ctx.libs['antdicons'];",
        'const { react, antdicons: iconsAlias } = ctx.libs;',
        'ctx.render(ctx.libs.React.createElement("div", null, Boolean(ReactA || ReactDOMA || Icons || react || iconsAlias)));',
      ].join('\n'),
      path: '$.ctxLibsCaseMismatch.code',
      modelUse: 'JSBlockModel',
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-ctx-libs-member-case-invalid',
          details: expect.objectContaining({
            accessKind: 'member',
            member: 'react',
            expectedMember: 'React',
            capability: 'ctx.libs.react',
            expectedCapability: 'ctx.libs.React',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-ctx-libs-member-case-invalid',
          details: expect.objectContaining({
            accessKind: 'member',
            member: 'reactDOM',
            expectedMember: 'ReactDOM',
            capability: 'ctx.libs.reactDOM',
            expectedCapability: 'ctx.libs.ReactDOM',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-ctx-libs-member-case-invalid',
          details: expect.objectContaining({
            accessKind: 'bracket',
            member: 'antdicons',
            expectedMember: 'antdIcons',
            capability: "ctx.libs['antdicons']",
            expectedCapability: 'ctx.libs.antdIcons',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-ctx-libs-member-case-invalid',
          details: expect.objectContaining({
            accessKind: 'destructure',
            member: 'react',
            expectedMember: 'React',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-ctx-libs-member-case-invalid',
          details: expect.objectContaining({
            accessKind: 'destructure',
            member: 'antdicons',
            expectedMember: 'antdIcons',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const React = ctx.libs.React;',
          'const { ReactDOM, antdIcons } = ctx.libs;',
          'const custom = ctx.libs.customLib;',
          "const libName = 'customLib';",
          'const dynamic = ctx.libs[libName];',
          'ctx.render(React.createElement("div", null, Boolean(ReactDOM || antdIcons || custom || dynamic)));',
        ].join('\n'),
        path: '$.validCtxLibsMembers.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid ctx libs JSBlock page',
        },
      },
      assets: {
        scripts: {
          reactKpi: {
            code: 'const React = ctx.libs.react;\nctx.render(null);',
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'reactKpi',
              type: 'jsBlock',
              script: 'reactKpi',
            },
          ],
        },
      ],
    });
    expect(applyBlueprintErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].script',
          ruleId: 'runjs-ctx-libs-member-case-invalid',
        }),
      ]),
    );

    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'js-block-target' },
        changes: {
          code: 'const { react } = ctx.libs;\nctx.render(null);',
          version: 'v2',
        },
      },
      {
        currentNode: { use: 'JSBlockModel' },
      },
    );
    expect(configureErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.code',
          ruleId: 'runjs-ctx-libs-member-case-invalid',
        }),
      ]),
    );
  });

  it('should reject unsupported ctx.libs.antd members in RunJS authoring code', async () => {
    const invalidCases = [
      {
        accessKind: 'member',
        capability: 'ctx.libs.antd.colors',
        code: 'const c = ctx.libs.antd.colors;\nctx.render(null);',
      },
      {
        accessKind: 'member',
        capability: "ctx.libs['antd'].colors",
        code: "const c = ctx.libs['antd'].colors;\nctx.render(null);",
      },
      {
        accessKind: 'bracket',
        capability: 'ctx.libs.antd["colors"]',
        code: "const c = ctx.libs.antd['colors'];\nctx.render(null);",
      },
      {
        accessKind: 'member',
        capability: 'ctx.libs.antd.colors',
        code: 'const antd = ctx.libs.antd;\nconst c = antd.colors;\nctx.render(null);',
      },
      {
        accessKind: 'member',
        capability: 'ctx.libs.antd.colors',
        code: 'const { antd } = ctx.libs;\nconst c = antd.colors;\nctx.render(null);',
      },
      {
        accessKind: 'member',
        capability: 'ctx.antd.colors',
        code: 'const antd = ctx.antd;\nconst c = antd.colors;\nctx.render(null);',
      },
      {
        accessKind: 'destructure',
        capability: 'ctx.libs.antd.colors',
        code: 'const { colors } = ctx.libs.antd;\nctx.render(null);',
      },
      {
        accessKind: 'member',
        capability: 'ctx.libs.antd.colors',
        code: 'const { green, blue } = ctx.libs.antd.colors;\nctx.render(null);',
      },
    ];

    for (const entry of invalidCases) {
      expect(
        inspectRunJsAuthoringCode({
          code: entry.code,
          path: '$.unsupportedCtxLibsAntdMember.code',
          modelUse: 'JSBlockModel',
        }),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-ctx-libs-member-unknown',
            details: expect.objectContaining({
              accessKind: entry.accessKind,
              capability: entry.capability,
              library: 'antd',
              member: 'colors',
              suggestedImport: '@ant-design/colors',
            }),
          }),
        ]),
      );
    }

    expect(
      inspectRunJsAuthoringCode({
        code: ['const { Card, Row, Col, Statistic } = ctx.libs.antd;', 'ctx.render(null);'].join('\n'),
        path: '$.validCtxLibsAntdMembers.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: ["const { green } = await ctx.importAsync('@ant-design/colors');", 'ctx.render(String(green[6]));'].join(
          '\n',
        ),
        path: '$.validAntDesignColorsImport.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: "const member = 'colors';\nconst c = ctx.libs.antd[member];\nctx.render(c);",
        path: '$.dynamicCtxLibsAntdMember.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid antd colors JSBlock page',
        },
      },
      assets: {
        scripts: {
          kpis: {
            code: 'const { green } = ctx.libs.antd.colors;\nctx.render(null);',
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'kpis',
              type: 'jsBlock',
              script: 'kpis',
            },
          ],
        },
      ],
    });
    expect(applyBlueprintErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].script',
          ruleId: 'runjs-ctx-libs-member-unknown',
        }),
      ]),
    );

    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'js-block-target' },
        changes: {
          code: 'const c = ctx.libs.antd.colors;\nctx.render(null);',
          version: 'v2',
        },
      },
      {
        currentNode: { use: 'JSBlockModel' },
      },
    );
    expect(configureErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.code',
          ruleId: 'runjs-ctx-libs-member-unknown',
        }),
      ]),
    );
  });

  it('should reject invalid FlowResource runtime patterns in JSBlock authoring code', () => {
    const errors = inspectRunJsAuthoringCode({
      code: [
        'const now = new Date();',
        'const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);',
        "const resource = ctx.makeResource('ai_intelligence');",
        'const { meta } = await resource.list({',
        '  pageSize: 1,',
        '  page: 0,',
        '  filter: { createdAt: { $gte: weekAgo.toISOString() } }',
        '});',
        'const total = meta?.total || 0;',
        'const element = ctx.render(ctx.libs.antd.Statistic, {',
        "  title: '本周新增情报数',",
        '  value: total,',
        '  prefix: ctx.libs.antdIcons.RiseOutlined',
        '});',
        'return element;',
      ].join('\n'),
      path: '$.resourceRuntimeMisuse.code',
      modelUse: 'JSBlockModel',
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-make-resource-type-invalid',
          details: expect.objectContaining({
            repairClass: 'resource-runtime-contract-stop',
            capability: 'ctx.makeResource',
            resourceType: 'ai_intelligence',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-flow-resource-list-method-invalid',
          details: expect.objectContaining({
            repairClass: 'resource-runtime-contract-stop',
            capability: 'resource.list',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-render-component-signature-invalid',
          details: expect.objectContaining({
            repairClass: 'react-runtime-contract-stop',
            capability: 'ctx.libs.antd.Statistic',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-react-component-prop-node-required',
          details: expect.objectContaining({
            repairClass: 'react-runtime-contract-stop',
            capability: 'ctx.libs.antdIcons.RiseOutlined',
            prop: 'prefix',
          }),
        }),
      ]),
    );

    const aliasErrors = inspectRunJsAuthoringCode({
      code: "const resourceType = 'ai_intelligence';\nctx.render(null);\nctx.makeResource(resourceType);",
      path: '$.resourceTypeAliasMisuse.code',
      modelUse: 'JSBlockModel',
    });
    expect(aliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-make-resource-type-invalid',
          details: expect.objectContaining({
            resourceType: 'ai_intelligence',
          }),
        }),
      ]),
    );

    const dynamicErrors = inspectRunJsAuthoringCode({
      code: 'ctx.render(null);\nctx.makeResource(resourceTypeName);',
      path: '$.dynamicResourceType.code',
      modelUse: 'JSBlockModel',
    });
    expect(dynamicErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-make-resource-type-unresolved',
          details: expect.objectContaining({
            expression: 'resourceTypeName',
          }),
        }),
      ]),
    );

    const hookResourceErrors = inspectRunJsAuthoringCode({
      code: [
        'const React = ctx.React;',
        'function MetricsPanel() {',
        '  React.useEffect(function() {',
        "    ctx.initResource('MultiRecordResource');",
        "    ctx.resource.setResourceName('claims');",
        '    ctx.resource.refresh();',
        '  }, []);',
        "  return React.createElement('div', null, 'Loading metrics');",
        '}',
        'ctx.render(React.createElement(MetricsPanel));',
      ].join('\n'),
      path: '$.hookResource.code',
      modelUse: 'JSBlockModel',
    });
    expect(hookResourceErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-jsblock-resource-hook-forbidden',
          details: expect.objectContaining({
            repairClass: 'resource-runtime-contract-stop',
            capability: 'ctx.initResource',
            hook: 'useEffect',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-jsblock-resource-hook-forbidden',
          details: expect.objectContaining({
            repairClass: 'resource-runtime-contract-stop',
            capability: 'ctx.resource',
            hook: 'useEffect',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const React = ctx.React;',
          "const resourceType = 'MultiRecordResource';",
          'const resource = ctx.makeResource(resourceType);',
          "resource.setResourceName('ai_intelligence');",
          'resource.setPageSize(1);',
          "resource.setFilter({ createdAt: { $gte: '2026-05-12T00:00:00.000Z' } });",
          'await resource.refresh();',
          "const total = resource.getMeta('total') || resource.getMeta()?.total || 0;",
          'ctx.render(React.createElement(ctx.libs.antd.Statistic, {',
          "  title: '本周新增情报数',",
          '  value: total,',
          '  prefix: React.createElement(ctx.libs.antdIcons.RiseOutlined),',
          '}));',
        ].join('\n'),
        path: '$.validResourceRuntime.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
  });

  it('should reject statically invalid RunJS resource filters before write', async () => {
    const makeCollection = (name: string, fields: any[]) => {
      const fieldsByName = new Map(fields.map((field) => [field.name, field]));
      return {
        dataSourceKey: 'main',
        name,
        fields: fieldsByName,
        getField: (fieldName: string) => fieldsByName.get(fieldName),
        getFields: () => fields,
      };
    };
    const collections: Record<string, any> = {
      reimbursement_requests: makeCollection('reimbursement_requests', [
        { name: 'request_status', type: 'string', interface: 'select' },
      ]),
      intelligenceItems: makeCollection('intelligenceItems', [
        { name: 'occurDate', type: 'date', interface: 'datetime' },
      ]),
      claims: makeCollection('claims', [
        { name: 'review_status', type: 'string', interface: 'select' },
        { name: 'claim_category', type: 'string', interface: 'select' },
        { name: 'chain_status', type: 'string', interface: 'select' },
        { name: 'chained_setup_status', type: 'string', interface: 'select' },
        { name: 'destructured_status', type: 'string', interface: 'select' },
        { name: 'destructured_copy_status', type: 'string', interface: 'select' },
        { name: 'destructured_assignment_status', type: 'string', interface: 'select' },
        { name: 'alias_before_configuration_status', type: 'string', interface: 'select' },
        { name: 'ctx_alias_before_configuration_status', type: 'string', interface: 'select' },
        { name: 'destructured_before_configuration_status', type: 'string', interface: 'select' },
        { name: 'nested_ctx_status', type: 'string', interface: 'select' },
        { name: 'nested_late_config_status', type: 'string', interface: 'select' },
        { name: 'nested_alias_status', type: 'string', interface: 'select' },
        { name: 'nested_destructured_status', type: 'string', interface: 'select' },
        { name: 'not_status', type: 'string', interface: 'select' },
        { name: 'not_inner_status', type: 'string', interface: 'select' },
      ]),
    };

    const errors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        blocks: [
          {
            key: 'missingDollarOperator',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('reimbursement_requests');",
                "ctx.resource.setFilter({ request_status: { in: ['Draft', 'Submitted'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'unknownField',
            type: 'jsBlock',
            settings: {
              code: [
                "const resource = ctx.makeResource('MultiRecordResource');",
                "resource.setResourceName('claims');",
                "resource.setFilter({ missing_status: 'Active' });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'unknownCollection',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('missing_collection');",
                "ctx.resource.setFilter({ status: 'Active' });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'ctxResourceAliasAfterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('claims');",
                'const aliased = ctx.resource;',
                "aliased.setFilter({ review_status: { in: ['Needs Review'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'resourceAliasCopyAfterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "const base = ctx.makeResource('MultiRecordResource');",
                "base.setResourceName('claims');",
                'const copied = base;',
                "copied.setFilter({ claim_category: { in: ['Excess'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'chainedSetResourceNameFilter',
            type: 'jsBlock',
            settings: {
              code: [
                "const resource = ctx.makeResource('MultiRecordResource');",
                "resource.setResourceName('claims').setFilter({ chain_status: { in: ['Open'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'chainedStateSetupSeparateFilter',
            type: 'jsBlock',
            settings: {
              code: [
                "const resource = ctx.makeResource('MultiRecordResource');",
                "resource.setDataSourceKey('main').setResourceName('claims');",
                "resource.setFilter({ chained_setup_status: { in: ['Open'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'destructuredCtxResourceAliasAfterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('claims');",
                'const { resource } = ctx;',
                "resource.setFilter({ destructured_status: { in: ['Open'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'destructuredCtxResourceAliasCopyAfterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('claims');",
                'const { resource: base } = ctx;',
                'const copied = base;',
                "copied.setFilter({ destructured_copy_status: { in: ['Open'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'destructuredCtxResourceAssignmentAfterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                'let assigned;',
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('claims');",
                '({ resource: assigned } = ctx);',
                "assigned.setFilter({ destructured_assignment_status: { in: ['Open'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'resourceAliasBeforeConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "const resource = ctx.makeResource('MultiRecordResource');",
                'const copied = resource;',
                "resource.setResourceName('claims');",
                "copied.setFilter({ alias_before_configuration_status: { in: ['Open'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'ctxResourceAliasBeforeConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                'const aliased = ctx.resource;',
                "ctx.resource.setResourceName('claims');",
                "aliased.setFilter({ ctx_alias_before_configuration_status: { in: ['Open'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'destructuredCtxResourceBeforeConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                'const { resource } = ctx;',
                "ctx.resource.setResourceName('claims');",
                "resource.setFilter({ destructured_before_configuration_status: { in: ['Open'] } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'nestedFunctionCtxResourceAfterOuterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('claims');",
                'function applyFilter() {',
                "  ctx.resource.setFilter({ nested_ctx_status: { in: ['Open'] } });",
                '}',
                'applyFilter();',
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'nestedFunctionCtxResourceDeclaredBeforeOuterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                'function applyFilter() {',
                "  ctx.resource.setFilter({ nested_late_config_status: { in: ['Open'] } });",
                '}',
                "ctx.resource.setResourceName('claims');",
                'applyFilter();',
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'nestedFunctionCtxResourceAliasAfterOuterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('claims');",
                'function applyFilter() {',
                '  const resource = ctx.resource;',
                "  resource.setFilter({ nested_alias_status: { in: ['Open'] } });",
                '}',
                'applyFilter();',
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'nestedFunctionDestructuredCtxResourceAfterOuterConfiguration',
            type: 'jsBlock',
            settings: {
              code: [
                "ctx.initResource('MultiRecordResource');",
                "ctx.resource.setResourceName('claims');",
                'function applyFilter() {',
                '  const { resource } = ctx;',
                "  resource.setFilter({ nested_destructured_status: { in: ['Open'] } });",
                '}',
                'applyFilter();',
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'helperForwardedInvalidDateRangeObject',
            type: 'jsBlock',
            settings: {
              code: [
                'async function countRecords(collectionName, filter) {',
                "  const resource = ctx.makeResource('MultiRecordResource');",
                '  resource.setResourceName(collectionName);',
                '  if (filter) resource.setFilter(filter);',
                '  await resource.refresh();',
                '  return resource.getMeta?.()?.count ?? 0;',
                '}',
                "await countRecords('intelligenceItems', { occurDate: { $dateOn: { $dateTo: 'now', $dateFrom: '-7d' } } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'topLevelNotWrapper',
            type: 'jsBlock',
            settings: {
              code: [
                "const resource = ctx.makeResource('MultiRecordResource');",
                "resource.setResourceName('claims');",
                "resource.setFilter({ $not: { not_status: { in: ['Closed'] } } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'fieldLevelNotWrapper',
            type: 'jsBlock',
            settings: {
              code: [
                "const resource = ctx.makeResource('MultiRecordResource');",
                "resource.setResourceName('claims');",
                "resource.setFilter({ not_inner_status: { $not: { in: ['Closed'] } } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
          {
            key: 'topLevelNotUnknownField',
            type: 'jsBlock',
            settings: {
              code: [
                "const resource = ctx.makeResource('MultiRecordResource');",
                "resource.setResourceName('claims');",
                "resource.setFilter({ $not: { missing_not_status: 'Closed' } });",
                'ctx.render(null);',
              ].join('\n'),
            },
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => collections[collectionName],
      },
    );

    const missingDollarFieldPaths = errors
      .filter((error: any) => error.ruleId === 'runjs-resource-filter-operator-missing-dollar')
      .map((error: any) => error.details?.fieldPath);
    expect(missingDollarFieldPaths).toEqual(
      expect.arrayContaining([
        'request_status',
        'review_status',
        'claim_category',
        'chain_status',
        'chained_setup_status',
        'destructured_status',
        'destructured_copy_status',
        'destructured_assignment_status',
        'alias_before_configuration_status',
        'ctx_alias_before_configuration_status',
        'destructured_before_configuration_status',
        'nested_ctx_status',
        'nested_late_config_status',
        'nested_alias_status',
        'nested_destructured_status',
        'not_status',
        'not_inner_status',
      ]),
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-operator-missing-dollar',
          details: expect.objectContaining({
            fieldPath: 'request_status',
            operator: 'in',
            suggestedOperator: '$in',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-field-unknown',
          details: expect.objectContaining({
            collectionName: 'claims',
            fieldPath: 'missing_status',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-field-unknown',
          details: expect.objectContaining({
            collectionName: 'claims',
            fieldPath: 'missing_not_status',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-resource-collection-unknown',
          details: expect.objectContaining({
            collectionName: 'missing_collection',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-range-object-invalid',
          details: expect.objectContaining({
            collectionName: 'intelligenceItems',
            fieldPath: 'occurDate',
            operator: '$dateOn',
            unsupportedKeys: ['$dateTo', '$dateFrom'],
            suggestedValue: { type: 'past', number: 7, unit: 'day' },
          }),
        }),
      ]),
    );
  });

  it('should pass collection context into top-level RunJS reactions', async () => {
    const fields = [{ name: 'review_status', type: 'string', interface: 'select' }];
    const fieldsByName = new Map(fields.map((field) => [field.name, field]));
    const collections: Record<string, any> = {
      claims: {
        dataSourceKey: 'main',
        name: 'claims',
        fields: fieldsByName,
        getField: (fieldName: string) => fieldsByName.get(fieldName),
        getFields: () => fields,
      },
    };
    const code = [
      "const resource = ctx.makeResource('MultiRecordResource');",
      "resource.setResourceName('claims');",
      "resource.setFilter({ review_status: { in: ['Needs Review'] } });",
    ].join('\n');

    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'claims-widget' },
        reaction: {
          items: [{ type: 'runjs', code }],
        },
        changes: {
          reaction: {
            items: [{ type: 'runjs', code }],
          },
        },
      },
      {
        getCollection: (_dataSourceKey, collectionName) => collections[collectionName],
      },
    );

    const filterErrors = errors.filter(
      (error: any) => error.ruleId === 'runjs-resource-filter-operator-missing-dollar',
    );
    expect(filterErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.reaction.items[0].code', '$.changes.reaction.items[0].code']),
    );
    expect(filterErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.reaction.items[0].code',
          details: expect.objectContaining({
            fieldPath: 'review_status',
            operator: 'in',
            suggestedOperator: '$in',
          }),
        }),
        expect.objectContaining({
          path: '$.changes.reaction.items[0].code',
          details: expect.objectContaining({
            fieldPath: 'review_status',
            operator: 'in',
            suggestedOperator: '$in',
          }),
        }),
      ]),
    );
  });

  it('should validate pre-bound ctx.resource filters with known authoring resource context', async () => {
    const claimsFields = [{ name: 'review_status', type: 'string', interface: 'select' }];
    const employeeFields = [
      { name: 'id', type: 'bigInt', interface: 'id' },
      { name: 'status', type: 'string', interface: 'select' },
    ];
    const claimsFieldsByName = new Map(claimsFields.map((field) => [field.name, field]));
    const employeeFieldsByName = new Map(employeeFields.map((field) => [field.name, field]));
    const collections: Record<string, any> = {
      claims: {
        dataSourceKey: 'main',
        name: 'claims',
        fields: claimsFieldsByName,
        getField: (fieldName: string) => claimsFieldsByName.get(fieldName),
        getFields: () => claimsFields,
      },
      employees: {
        dataSourceKey: 'main',
        name: 'employees',
        fields: employeeFieldsByName,
        getField: (fieldName: string) => employeeFieldsByName.get(fieldName),
        getFields: () => employeeFields,
      },
    };

    const reactionCode = "ctx.resource.setFilter({ review_status: { in: ['Needs Review'] } });";
    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'claims-widget' },
        reaction: {
          items: [{ type: 'runjs', code: reactionCode }],
        },
        changes: {
          reaction: {
            items: [{ type: 'runjs', code: reactionCode }],
          },
        },
      },
      {
        currentDataSourceKey: 'main',
        currentCollectionName: 'claims',
        getCollection: (_dataSourceKey, collectionName) => collections[collectionName],
        hostDataSourceKey: 'main',
        hostCollectionName: 'claims',
      },
    );

    expect(configureErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.reaction.items[0].code',
          ruleId: 'runjs-resource-filter-operator-missing-dollar',
          details: expect.objectContaining({
            collectionName: 'claims',
            fieldPath: 'review_status',
            operator: 'in',
          }),
        }),
        expect.objectContaining({
          path: '$.changes.reaction.items[0].code',
          ruleId: 'runjs-resource-filter-operator-missing-dollar',
          details: expect.objectContaining({
            collectionName: 'claims',
            fieldPath: 'review_status',
            operator: 'in',
          }),
        }),
      ]),
    );

    const chartConfigureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'employee-chart' },
        changes: {
          visual: {
            raw: "ctx.resource.setFilter({ status: { in: ['Active'] } });\nreturn {};",
          },
          events: {
            raw: "ctx.resource.setFilter({ status: { in: ['Active'] } });",
          },
        },
      },
      {
        currentDataSourceKey: 'main',
        currentCollectionName: 'employees',
        getCollection: (_dataSourceKey, collectionName) => collections[collectionName],
        hostBlockType: 'ChartBlockModel',
        hostDataSourceKey: 'main',
        hostCollectionName: 'employees',
      },
    );
    expect(chartConfigureErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.visual.raw',
          ruleId: 'runjs-resource-filter-operator-missing-dollar',
          details: expect.objectContaining({
            collectionName: 'employees',
            fieldPath: 'status',
            operator: 'in',
          }),
        }),
        expect.objectContaining({
          path: '$.changes.events.raw',
          ruleId: 'runjs-resource-filter-operator-missing-dollar',
          details: expect.objectContaining({
            collectionName: 'employees',
            fieldPath: 'status',
            operator: 'in',
          }),
        }),
      ]),
    );

    const chartAssetErrors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Pre-bound chart resource context page',
          },
        },
        assets: {
          charts: {
            statusChart: {
              query: {
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
              },
              visual: {
                mode: 'custom',
                raw: "ctx.resource.setFilter({ status: { in: ['Active'] } });\nreturn {};",
              },
              events: {
                raw: "ctx.resource.setFilter({ status: { in: ['Active'] } });",
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'statusChart',
                type: 'chart',
                chart: 'statusChart',
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => collections[collectionName],
      },
    );
    expect(chartAssetErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.statusChart.visual.raw',
          ruleId: 'runjs-resource-filter-operator-missing-dollar',
          details: expect.objectContaining({
            collectionName: 'employees',
            fieldPath: 'status',
            operator: 'in',
          }),
        }),
        expect.objectContaining({
          path: '$.assets.charts.statusChart.events.raw',
          ruleId: 'runjs-resource-filter-operator-missing-dollar',
          details: expect.objectContaining({
            collectionName: 'employees',
            fieldPath: 'status',
            operator: 'in',
          }),
        }),
      ]),
    );
  });

  it('should allow statically valid RunJS resource filters', async () => {
    const reimbursementRequestFields = [{ name: 'request_status', type: 'string', interface: 'select' }];
    const departmentFields = [{ name: 'name', type: 'string', interface: 'input' }];
    const departmentFieldsByName = new Map(departmentFields.map((field) => [field.name, field]));
    const departmentCollection = {
      dataSourceKey: 'main',
      name: 'departments',
      fields: departmentFieldsByName,
      getField: (fieldName: string) => departmentFieldsByName.get(fieldName),
      getFields: () => departmentFields,
    };
    const employeeFields = [
      {
        name: 'department',
        type: 'belongsTo',
        interface: 'm2o',
        targetCollection: departmentCollection,
      },
    ];
    const employeeFieldsByName = new Map(employeeFields.map((field) => [field.name, field]));
    const reimbursementRequestFieldsByName = new Map(reimbursementRequestFields.map((field) => [field.name, field]));
    const collections: Record<string, any> = {
      reimbursement_requests: {
        dataSourceKey: 'main',
        name: 'reimbursement_requests',
        fields: reimbursementRequestFieldsByName,
        getField: (fieldName: string) => reimbursementRequestFieldsByName.get(fieldName),
        getFields: () => reimbursementRequestFields,
      },
      employees: {
        dataSourceKey: 'main',
        name: 'employees',
        fields: employeeFieldsByName,
        getField: (fieldName: string) => employeeFieldsByName.get(fieldName),
        getFields: () => employeeFields,
      },
      departments: departmentCollection,
    };
    const errors = await collectFlowSurfaceAuthoringErrors(
      'addBlock',
      {
        type: 'jsBlock',
        settings: {
          code: [
            "const resource = ctx.makeResource('MultiRecordResource');",
            "resource.setResourceName('reimbursement_requests');",
            "resource.setFilter({ request_status: { $in: ['Draft', 'Submitted'] } });",
            'await resource.refresh();',
            "const employees = ctx.makeResource('MultiRecordResource');",
            "employees.setResourceName('employees');",
            "employees.setFilter({ department: { name: { $eq: 'Sales' } } });",
            'ctx.render(null);',
          ].join('\n'),
        },
      },
      {
        getCollection: (_dataSourceKey, collectionName) => collections[collectionName],
      },
    );

    expect(errors).toEqual([]);
  });

  it('should reject AST-detected RunJS syntax, nested runjs, resource arguments, and source limits', async () => {
    expect(
      inspectRunJsAuthoringCode({
        code: 'ctx.render(<div>Broken</div>;',
        path: '$.syntax.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-syntax-invalid',
          details: expect.objectContaining({
            repairClass: 'syntax-stop',
          }),
        }),
      ]),
    );

    [
      "ctx.render(null);\nconst run = ctx.runjs;\nawait run('return 1;');",
      "ctx.render(null);\nconst { runjs } = ctx;\nawait runjs('return 1;');",
      "ctx.render(null);\nconst { runjs: run } = ctx;\nawait run('return 1;');",
      "ctx.render(null);\nawait ctx['runjs']('return 1;');",
    ].forEach((code, index) => {
      expect(
        inspectRunJsAuthoringCode({
          code,
          path: `$.nestedRunjs[${index}].code`,
          modelUse: 'JSBlockModel',
        }),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-nested-runjs-forbidden',
            details: expect.objectContaining({
              repairClass: 'nested-runjs-stop',
            }),
          }),
        ]),
      );
    });

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'ctx.render(null);',
          'const run = ctx.runjs;',
          "function invoke(run) { return run('ordinary callback value'); }",
        ].join('\n'),
        path: '$.shadowedRunjsAlias.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: [
          "function invoke(ctx) { return ctx.runjs('ordinary callback value'); }",
          "ctx.message.success('Done');",
        ].join('\n'),
        path: '$.shadowedCtxRunjs.code',
        modelUse: 'JSActionModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: "ctx.render(null);\nctx.initResource('FlowResource');",
        path: '$.initResourceFlowResource.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-make-resource-type-invalid',
          details: expect.objectContaining({
            capability: 'ctx.initResource',
            resourceType: 'FlowResource',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'ctx.render(null);',
          "const resourceType = 'MultiRecordResource';",
          'function build(resourceType) { return ctx.makeResource(resourceType); }',
        ].join('\n'),
        path: '$.shadowedResourceType.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-make-resource-type-unresolved',
          details: expect.objectContaining({
            expression: 'resourceType',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'function build(ctx, resourceType) { return ctx.makeResource(resourceType); }',
          "ctx.message.success('Done');",
        ].join('\n'),
        path: '$.shadowedCtxResource.code',
        modelUse: 'JSActionModel',
      }),
    ).toEqual([]);

    [
      "function invoke(ctx) { return ctx.runjs('resource:list', {}); }\nctx.message.success('Done');",
      "function invoke(ctx) { return ctx.request('users:list'); }\nctx.message.success('Done');",
      "function invoke(ctx) { return ctx.api.resource.list('users'); }\nctx.message.success('Done');",
      "function invoke(ctx) { return ctx.openView(); }\nctx.message.success('Done');",
      "function invoke(ctx) { return ctx.notARealRoot.doThing(); }\nctx.message.success('Done');",
      "function invoke(ctx) { return ctx.libs.react; }\nctx.message.success('Done');",
      "function invoke(ctx) { return ctx.element.innerHTML = '<span />'; }\nctx.message.success('Done');",
    ].forEach((code, index) => {
      expect(
        inspectRunJsAuthoringCode({
          code,
          path: `$.shadowedCtxLegacyValidators[${index}].code`,
          modelUse: 'JSActionModel',
        }),
      ).toEqual([]);
    });

    [
      "ctx.runjs('resource:list', {});\nfunction ctx() {}",
      "function invoke() { return ctx.runjs('resource:list', {}); function ctx() {} }\nctx.message.success('Done');",
    ].forEach((code, index) => {
      expect(
        inspectRunJsAuthoringCode({
          code,
          path: `$.laterDeclaredCtxShadow[${index}].code`,
          modelUse: 'JSActionModel',
        }),
      ).toEqual([]);
    });

    [
      "ctx.runjs('resource:list', {});\nfor (let ctx of items) { ctx.message.success('local'); }\nctx.message.success('Done');",
      "ctx.runjs('resource:list', {});\nfor (let ctx in items) { ctx.message.success('local'); }\nctx.message.success('Done');",
      "ctx.runjs('resource:list', {});\nswitch (kind) { case 1: let ctx = local; ctx.message.success('local'); break; }\nctx.message.success('Done');",
    ].forEach((code, index) => {
      expect(
        inspectRunJsAuthoringCode({
          code,
          path: `$.blockScopedCtxDoesNotShadowPreviousRuntimeCtx[${index}].code`,
          modelUse: 'JSActionModel',
        }),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-nested-runjs-forbidden',
          }),
        ]),
      );
    });

    expect(
      inspectRunJsAuthoringCode({
        code: "class Local { static { var ctx = local; } }\nctx.runjs('resource:list', {});",
        path: '$.staticBlockVarCtxDoesNotShadowOuterRuntimeCtx.code',
        modelUse: 'JSActionModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-nested-runjs-forbidden',
        }),
      ]),
    );

    const staticBlockVarRunjsAliasErrors = inspectRunJsAuthoringCode({
      code: "class Local { static { var run = ctx.runjs; } }\nawait run('return 1;');",
      path: '$.staticBlockVarRunjsAliasDoesNotLeak.code',
      modelUse: 'JSActionModel',
    });
    expect(staticBlockVarRunjsAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'run',
          }),
        }),
      ]),
    );
    expect(staticBlockVarRunjsAliasErrors.map((error: any) => error.ruleId)).not.toContain(
      'runjs-nested-runjs-forbidden',
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'class Local { static {',
          '  function wrap() { var ctx = local; }',
          "  ctx.element.innerHTML = '<span />';",
          '} }',
          "ctx.message.success('Done');",
        ].join('\n'),
        path: '$.staticBlockNestedFunctionVarCtxDoesNotLeak.code',
        modelUse: 'JSActionModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-direct-dom-render-forbidden',
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'ctx.render(null);',
          "const resourceType = 'MultiRecordResource';",
          'function build() { return ctx.makeResource(resourceType); const resourceType = dynamicType; }',
        ].join('\n'),
        path: '$.laterDeclaredResourceTypeShadow.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-make-resource-type-unresolved',
          details: expect.objectContaining({
            expression: 'resourceType',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          "class Local { static { var resourceType = 'MultiRecordResource'; } }",
          'ctx.makeResource(resourceType);',
        ].join('\n'),
        path: '$.staticBlockVarResourceTypeDoesNotLeak.code',
        modelUse: 'JSActionModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-make-resource-type-unresolved',
          details: expect.objectContaining({
            expression: 'resourceType',
          }),
        }),
      ]),
    );

    const staticBlockNestedFunctionVarResourceAliasErrors = inspectRunJsAuthoringCode({
      code: [
        'class Local { static {',
        "  function wrap() { var resource = ctx.makeResource('MultiRecordResource'); }",
        '  resource.list();',
        '} }',
        "ctx.message.success('Done');",
      ].join('\n'),
      path: '$.staticBlockNestedFunctionVarResourceAliasDoesNotLeak.code',
      modelUse: 'JSActionModel',
    });
    expect(staticBlockNestedFunctionVarResourceAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'resource',
          }),
        }),
      ]),
    );
    expect(staticBlockNestedFunctionVarResourceAliasErrors.map((error: any) => error.ruleId)).not.toContain(
      'runjs-resource-method-unknown',
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          'function use(resource) { return resource.list(); }',
          "ctx.message.success('Done');",
        ].join('\n'),
        path: '$.shadowedFlowResourceAlias.code',
        modelUse: 'JSActionModel',
      }),
    ).toEqual([]);

    const staticBlockNestedFunctionVarReactAliasErrors = inspectRunJsAuthoringCode({
      code: [
        'class Local { static {',
        '  function wrap() { var Card = ctx.libs.antd.Card; }',
        '  Card({ bordered: false });',
        '} }',
        'ctx.render(null);',
      ].join('\n'),
      path: '$.staticBlockNestedFunctionVarReactAliasDoesNotLeak.code',
      modelUse: 'JSBlockModel',
    });
    expect(staticBlockNestedFunctionVarReactAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'Card',
          }),
        }),
      ]),
    );
    expect(staticBlockNestedFunctionVarReactAliasErrors.map((error: any) => error.ruleId)).not.toContain(
      'runjs-ctx-libs-member-unknown',
    );

    const staticBlockVarReactAliasErrors = inspectRunJsAuthoringCode({
      code: [
        'class Local { static { var Card = ctx.libs.antd.Card; } }',
        'Card({ bordered: false });',
        'ctx.render(null);',
      ].join('\n'),
      path: '$.staticBlockVarReactAliasDoesNotLeak.code',
      modelUse: 'JSBlockModel',
    });
    expect(staticBlockVarReactAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'Card',
          }),
        }),
      ]),
    );
    expect(staticBlockVarReactAliasErrors.map((error: any) => error.ruleId)).not.toContain(
      'runjs-ctx-libs-member-unknown',
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const Card = ctx.libs.antd.Card;',
          'function use(Card) { return Card({ bordered: false }); }',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.shadowedReactComponentAlias.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: 'ctx.render(null);\nctx.makeResource(`MultiRecordResource`);',
        path: '$.staticTemplateResource.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: 'ctx.render(null);\nctx.makeResource(`Multi${kind}Resource`);',
        path: '$.dynamicTemplateResource.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-make-resource-type-unresolved',
          details: expect.objectContaining({
            expression: '`Multi${kind}Resource`',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: ['ctx.render(null);', 'const value = 1;'.repeat(5000)].join('\n'),
        path: '$.largeSource.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([
      expect.objectContaining({
        ruleId: 'runjs-source-too-large',
        details: expect.objectContaining({
          repairClass: 'source-limit-stop',
        }),
      }),
    ]);

    const oversizedSource = 'x'.repeat(64 * 1024 + 1);
    const multiLargeErrors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'grid' },
      blocks: [
        {
          type: 'jsBlock',
          settings: {
            code: oversizedSource,
            version: 'v2',
          },
        },
        {
          type: 'jsBlock',
          settings: {
            code: oversizedSource,
            version: 'v2',
          },
        },
      ],
    });
    expect(multiLargeErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.code',
          ruleId: 'runjs-source-too-large',
        }),
        expect.objectContaining({
          path: '$.blocks[1].settings.code',
          ruleId: 'runjs-source-too-large',
        }),
      ]),
    );

    const tooManyBlocks = Array.from({ length: 101 }, (_item, index) => ({
      type: 'jsBlock',
      settings: {
        code: `ctx.render('block ${index}');`,
        version: 'v2',
      },
    }));
    const tooManyErrors = await collectFlowSurfaceAuthoringErrors('compose', {
      target: { uid: 'grid' },
      blocks: tooManyBlocks,
    });
    expect(tooManyErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-too-many-sources',
        }),
      ]),
    );

    const oversizedFlowRegistry = Object.fromEntries(
      Array.from({ length: 101 }, (_item, index) => [
        `flow${index}`,
        {
          on: 'submit',
          steps: {
            run: {
              use: 'runjs',
              params: {
                code: oversizedSource,
              },
            },
          },
        },
      ]),
    );
    const oversizedFlowRegistryErrors = collectFlowRegistryRunJsAuthoringErrors(oversizedFlowRegistry);
    expect(oversizedFlowRegistryErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.flowRegistry.flow0.steps.run.params.code',
          ruleId: 'runjs-source-too-large',
        }),
        expect.objectContaining({
          ruleId: 'runjs-total-source-too-large',
        }),
        expect.objectContaining({
          ruleId: 'runjs-too-many-sources',
        }),
      ]),
    );

    const tooManyFlowRegistry = Object.fromEntries(
      Array.from({ length: 101 }, (_item, index) => [
        `flow${index}`,
        {
          on: 'submit',
          steps: {
            run: {
              use: 'runjs',
              params: {
                code: `ctx.console.log('flow ${index}');`,
              },
            },
          },
        },
      ]),
    );
    expect(collectFlowRegistryRunJsAuthoringErrors(tooManyFlowRegistry)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-too-many-sources',
        }),
      ]),
    );
  });

  it('should reject ctx.runjs resource endpoints on applyBlueprint and configure writes', async () => {
    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid ctx.runjs resource page',
        },
      },
      assets: {
        scripts: {
          kpiPanel: {
            code: "ctx.render(null);\nawait ctx.runjs('resource:list', { resource: 'ai_products' });",
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'kpiPanel',
              type: 'jsBlock',
              script: 'kpiPanel',
            },
          ],
        },
      ],
    });
    expect(applyBlueprintErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].script',
          ruleId: 'runjs-nested-runjs-forbidden',
          details: expect.objectContaining({
            repairClass: 'nested-runjs-stop',
            capability: 'ctx.runjs',
          }),
        }),
      ]),
    );

    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'js-block-target' },
        changes: {
          code: "ctx.render(null);\nawait ctx.runjs('collection:list', { collection: 'ai_products' });",
          version: 'v2',
        },
      },
      {
        currentNode: { use: 'JSBlockModel' },
      },
    );
    expect(configureErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.code',
          ruleId: 'runjs-nested-runjs-forbidden',
          details: expect.objectContaining({
            repairClass: 'nested-runjs-stop',
            capability: 'ctx.runjs',
          }),
        }),
      ]),
    );
  });

  it('should persist canonical localized jsBlock settings without falling back to default code', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring jsBlock public contract page',
      tabTitle: 'Authoring jsBlock public contract tab',
    });

    const addBlockCode = "ctx.render('<div>Add block KPI</div>');";
    const addBlockResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.tabSchemaUid },
        type: 'jsBlock',
        settings: {
          title: 'Add block KPI',
          code: addBlockCode,
          version: 'v2',
        },
      },
    });
    expect(addBlockResponse.status, readErrorMessage(addBlockResponse)).toBe(200);
    const addBlockReadback = await getSurface(rootAgent, { uid: getData(addBlockResponse).uid });
    expect(addBlockReadback.tree?.stepParams?.jsSettings?.runJs).toMatchObject({
      code: addBlockCode,
      version: 'v2',
    });

    const composeCode = "ctx.render('<div>Compose KPI</div>');";
    const composeResponse = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'composeKpi',
            type: 'jsBlock',
            settings: {
              title: 'Compose KPI',
              code: composeCode,
              version: 'v2',
            },
          },
        ],
      },
    });
    expect(composeResponse.status, readErrorMessage(composeResponse)).toBe(200);
    const composedUid = getData(composeResponse).blocks?.[0]?.uid;
    const composedReadback = await getSurface(rootAgent, { uid: composedUid });
    expect(composedReadback.tree?.stepParams?.jsSettings?.runJs).toMatchObject({
      code: composeCode,
      version: 'v2',
    });

    const configureCode = "ctx.render('<div>Configured KPI</div>');";
    const configureResponse = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: getData(addBlockResponse).uid },
        changes: {
          title: 'Configured KPI',
          code: configureCode,
          version: 'v2',
        },
      },
    });
    expect(configureResponse.status, readErrorMessage(configureResponse)).toBe(200);
    const configuredReadback = await getSurface(rootAgent, { uid: getData(addBlockResponse).uid });
    expect(configuredReadback.tree?.stepParams?.jsSettings?.runJs).toMatchObject({
      code: configureCode,
      version: 'v2',
    });
  });

  it('should return no-skip RunJS repair guidance from flowSurfaces write errors', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring RunJS repair guidance page',
      tabTitle: 'Authoring RunJS repair guidance tab',
    });

    const response = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'jsBlock',
        settings: {
          title: 'Broken JSBlock',
          code: "const label = 'Missing render';",
          version: 'v2',
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        errorCount: response.body.errors.length,
        details: expect.objectContaining({
          mustFixAllErrorsBeforeRetry: true,
          retryPolicy: 'fix_all_errors_before_retry_same_write',
          agentInstruction: expect.stringContaining('Fix every listed error'),
        }),
      }),
    );
    const issue = response.body?.errors?.find((error: any) => error.ruleId === 'runjs-render-required');
    expect(issue).toEqual(
      expect.objectContaining({
        index: expect.any(Number),
        type: 'bad_request',
        code: 'FLOW_SURFACE_AUTHORING_VALIDATION_ERROR',
        status: 400,
        message: expect.stringContaining('Do not skip this JS/RunJS step.'),
        details: expect.objectContaining({
          repairClass: 'replace-innerhtml-with-render',
          skipForbidden: true,
          mustRetry: true,
          agentInstruction: expect.stringContaining('Fix the error and retry the same write.'),
          suggestedAction: expect.any(String),
        }),
      }),
    );
    expect(issue.message).toContain('Suggested fix:');
  });

  it('should reject ignored localized jsBlock code shapes without creating default JS blocks', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring invalid jsBlock public contract page',
      tabTitle: 'Authoring invalid jsBlock public contract tab',
    });

    const validResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'jsBlock',
        settings: {
          title: 'Valid JSBlock',
          code: "ctx.render('<div>Valid</div>');",
          version: 'v2',
        },
      },
    });
    expect(validResponse.status, readErrorMessage(validResponse)).toBe(200);

    const invalidAddBlockResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'jsBlock',
        code: "ctx.render('<div>Ignored top-level code</div>');",
      },
    });
    expect(invalidAddBlockResponse.status).toBe(400);
    expect(readErrorMessage(invalidAddBlockResponse)).toContain('settings.code');

    const missingSourceAddBlockResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'jsBlock',
        settings: {
          title: 'Missing JS source',
        },
      },
    });
    expect(missingSourceAddBlockResponse.status).toBe(400);
    expect(missingSourceAddBlockResponse.body?.errors?.map((error: any) => error.ruleId)).toContain(
      'jsBlock-source-required',
    );

    const aliasAddBlockResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'js',
        settings: {
          code: "ctx.render('<div>Alias</div>');",
        },
      },
    });
    expect(aliasAddBlockResponse.status).toBe(400);
    expect(aliasAddBlockResponse.body?.errors?.map((error: any) => error.ruleId)).toContain(
      'jsBlock-type-alias-unsupported',
    );

    const invalidComposeResponse = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'ignoredTopLevelVersion',
            type: 'jsBlock',
            version: 'v2',
          },
          {
            key: 'unsupportedScript',
            type: 'jsBlock',
            script: 'missingAssetKey',
          },
          {
            key: 'missingSource',
            type: 'jsBlock',
            settings: {
              title: 'Missing JS source',
            },
          },
          {
            key: 'aliasBlock',
            type: 'js',
            settings: {
              code: "ctx.render('<div>Alias</div>');",
            },
          },
        ],
      },
    });
    expect(invalidComposeResponse.status).toBe(400);
    expect(invalidComposeResponse.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'jsBlock-top-level-version-unsupported',
        'jsBlock-script-unsupported',
        'jsBlock-source-required',
        'jsBlock-type-alias-unsupported',
      ]),
    );

    const pageReadback = await getSurface(rootAgent, { uid: page.gridUid });
    const jsBlocks = collectDescendantNodes(pageReadback.tree, (node) => node?.use === 'JSBlockModel');
    expect(jsBlocks).toHaveLength(1);
  });

  it('should aggregate non-canonical jsBlock configure shapes before writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring invalid jsBlock configure page',
      tabTitle: 'Authoring invalid jsBlock configure tab',
    });
    const validResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'jsBlock',
        settings: {
          title: 'Configurable JSBlock',
          code: "ctx.render('<div>Valid</div>');",
          version: 'v2',
        },
      },
    });
    expect(validResponse.status, readErrorMessage(validResponse)).toBe(200);

    const invalidConfigureResponse = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: getData(validResponse).uid },
        changes: {
          code: "ctx.render('<div>Inline</div>');",
          version: 'v2',
          script: 'kpiCards',
          props: {},
          decoratorProps: {},
          flowRegistry: {},
          stepParams: {
            jsSettings: {
              runJs: {
                code: "ctx.render('<div>Internal</div>');",
                version: 'v2',
              },
            },
          },
          settings: {
            code: "ctx.render('<div>Nested settings</div>');",
          },
        },
      },
    });

    expect(invalidConfigureResponse.status).toBe(400);
    expect(invalidConfigureResponse.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'jsBlock-script-unsupported',
        'jsBlock-mixed-inline-and-script',
        'jsBlock-internal-field-unsupported',
        'jsBlock-stepParams-unsupported',
        'jsBlock-settings-unsupported-key',
      ]),
    );
    expect(invalidConfigureResponse.body?.errors?.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.changes.script',
        '$.changes.props',
        '$.changes.decoratorProps',
        '$.changes.flowRegistry',
        '$.changes.stepParams',
        '$.changes.settings.code',
      ]),
    );
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
    const singleColumnError = response.body.errors.find((error: any) => error.ruleId === 'block-layout-single-column');
    expect(singleColumnError?.details?.repairHint).toContain('same layout row');
    expect(singleColumnError?.details?.example?.layout?.rows?.[0]).toHaveLength(2);
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

  it('should reject visible data blocks without valid business fields before applyBlueprint writes', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring empty visible data block fields',
          },
        },
        defaults: {
          collections: {
            employees: {
              fieldGroups: [
                {
                  title: 'Employee defaults',
                  fields: ['nickname'],
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
                key: 'emptyEmployeeTable',
                type: 'table',
                collection: 'employees',
              },
              {
                key: 'systemOnlyEmployeeList',
                type: 'list',
                collection: 'employees',
                fields: [
                  {
                    key: 'systemOnlyDivider',
                    type: 'divider',
                    settings: {
                      label: 'System',
                    },
                  },
                ],
              },
              {
                key: 'actionOnlyEmployeeGrid',
                type: 'gridCard',
                collection: 'employees',
                fields: [
                  {
                    field: 'nickname',
                    type: 'operation',
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    const visibleFieldErrors = response.body?.errors?.filter(
      (error: any) => error.ruleId === 'data-block-visible-fields-required',
    );
    expect(visibleFieldErrors).toHaveLength(3);
    expect(visibleFieldErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.tabs[0].blocks[0].fields',
        '$.tabs[0].blocks[1].fields',
        '$.tabs[0].blocks[2].fields',
      ]),
    );
    for (const error of visibleFieldErrors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
      expect(error.message).toContain('Add collection field names');
      expect(error.message).toContain('defaults.collections.*.fieldGroups');
      expect(error.details).toEqual(
        expect.objectContaining({
          repairHint: expect.stringContaining('Add direct visible collection fields'),
          agentInstruction: expect.stringContaining('fix every listed error'),
        }),
      );
    }
  });

  it('should reject table dataScope field maps before applyBlueprint writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeTableWithInvalidDataScope',
                type: 'table',
                collection: 'employees',
                settings: {
                  dataScope: {
                    nickname: {
                      $eq: 'Ada',
                    },
                  },
                },
                fields: ['nickname', 'email'],
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => context.db.getCollection(collectionName),
      },
    );

    const dataScopeError = errors.find((error: any) => error.ruleId === 'dataScope-filter-group-invalid-shape');
    expect(dataScopeError).toMatchObject({
      path: '$.tabs[0].blocks[0].settings.dataScope',
      ruleId: 'dataScope-filter-group-invalid-shape',
    });
    expect(dataScopeError?.message).toContain('expects FilterGroup');
    expect(dataScopeError?.details?.repairHint).toContain('logic/items');
  });

  it('should accept table dataScope FilterGroup authoring', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeTableWithValidDataScope',
                type: 'table',
                collection: 'employees',
                settings: {
                  dataScope: {
                    logic: '$and',
                    items: [
                      {
                        path: 'nickname',
                        operator: '$eq',
                        value: 'Ada',
                      },
                    ],
                  },
                },
                fields: ['nickname', 'email'],
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => context.db.getCollection(collectionName),
      },
    );

    expect(errors.map((error: any) => error.ruleId)).not.toContain('dataScope-filter-group-invalid-shape');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty object', {}],
  ])('should accept table dataScope %s authoring', async (_label, dataScope) => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: `employeeTableWithAllowedDataScope${_label.replace(/\W/g, '')}`,
                type: 'table',
                collection: 'employees',
                settings: {
                  dataScope,
                },
                fields: ['nickname', 'email'],
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => context.db.getCollection(collectionName),
      },
    );

    expect(errors.map((error: any) => error.ruleId)).not.toContain('dataScope-filter-group-invalid-shape');
  });

  it('should reject implicit relation fields when no safe titleField can be resolved before applyBlueprint writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'relationTitleFieldTable',
                type: 'table',
                collection: GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION,
                fields: [GENERATED_POPUP_RELATION_OVERRIDE_FIELD],
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => context.db.getCollection(collectionName),
      },
    );

    const relationTitleFieldError = errors.find(
      (error: any) => error.path === '$.tabs[0].blocks[0].fields[0].titleField',
    );
    expect(relationTitleFieldError).toMatchObject({
      ruleId: 'relation-titleField-unreadable',
      details: {
        fieldPath: GENERATED_POPUP_RELATION_OVERRIDE_FIELD,
        titleField: 'id',
      },
    });
    expect(relationTitleFieldError?.details?.repairHint).toContain('"titleField"');
  });

  it('should reject implicit relation fieldGroups when no safe titleField can be resolved before applyBlueprint writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'relationTitleFieldDetails',
                type: 'details',
                collection: GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION,
                fieldGroups: [
                  {
                    title: 'Main',
                    fields: [
                      GENERATED_POPUP_RELATION_OVERRIDE_FIELD,
                      GENERATED_POPUP_RELATION_OVERRIDE_FIELDS[0],
                      GENERATED_POPUP_RELATION_OVERRIDE_FIELDS[1],
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => context.db.getCollection(collectionName),
      },
    );

    const relationTitleFieldError = errors.find(
      (error: any) => error.path === '$.tabs[0].blocks[0].fieldGroups[0].fields[0].titleField',
    );
    expect(relationTitleFieldError).toMatchObject({
      ruleId: 'relation-titleField-unreadable',
      details: {
        fieldPath: GENERATED_POPUP_RELATION_OVERRIDE_FIELD,
        titleField: 'id',
      },
    });
    expect(relationTitleFieldError?.details?.repairHint).toContain('"titleField"');
  });

  it('should allow strict registered attachment display bindings without implicit titleField before applyBlueprint writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'attachmentPreviewTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status', 'email', 'fujian'],
              },
              {
                key: 'attachmentPreviewDetails',
                type: 'details',
                collection: 'employees',
                fieldGroups: [
                  {
                    title: 'Main',
                    fields: ['nickname', 'status', 'email', 'fujian'],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-file-manager']),
        getCollection: (_dataSourceKey, collectionName) => context.db.getCollection(collectionName),
      },
    );

    expect(errors.filter((error: any) => String(error.ruleId).startsWith('relation-titleField'))).toEqual([]);
  });

  it('should not apply blueprint-only implicit relation titleField validation to compose', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        target: {
          uid: 'missing-target-never-resolved',
        },
        blocks: [
          {
            key: 'composeRelationTitleFieldTable',
            type: 'table',
            collection: GENERATED_POPUP_RELATION_OVERRIDE_SOURCE_COLLECTION,
            fields: [
              GENERATED_POPUP_RELATION_OVERRIDE_FIELD,
              GENERATED_POPUP_RELATION_OVERRIDE_FIELDS[0],
              GENERATED_POPUP_RELATION_OVERRIDE_FIELDS[1],
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => context.db.getCollection(collectionName),
      },
    );

    expect(errors.filter((error: any) => String(error.ruleId).startsWith('relation-titleField'))).toEqual([]);
  });

  it('should reject visible data blocks without valid business fields before compose writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring compose visible data fields page',
      tabTitle: 'Authoring compose visible data fields tab',
    });

    const response = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'emptyGridCard',
            type: 'gridCard',
            collection: 'employees',
          },
          {
            key: 'emptyEmployeeList',
            type: 'list',
            collection: 'employees',
            fields: [],
          },
          {
            key: 'dividerOnlyDetails',
            type: 'details',
            collection: 'employees',
            fieldGroups: [
              {
                title: 'Display',
                fields: [
                  {
                    key: 'displayDivider',
                    type: 'divider',
                    settings: {
                      label: 'Display',
                    },
                  },
                ],
              },
            ],
          },
          {
            key: 'emptyCreateForm',
            type: 'createForm',
            collection: 'employees',
            fields: [],
          },
          {
            key: 'emptyEditForm',
            type: 'editForm',
            collection: 'employees',
            fields: [],
          },
          {
            key: 'emptyFilterForm',
            type: 'filterForm',
            collection: 'employees',
            fields: [],
          },
          {
            key: 'emptyKanban',
            type: 'kanban',
            collection: 'employees',
            fields: [],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    const visibleFieldErrors = response.body?.errors?.filter(
      (error: any) => error.ruleId === 'data-block-visible-fields-required',
    );
    expect(visibleFieldErrors).toHaveLength(7);
    expect(visibleFieldErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.blocks[0].fields',
        '$.blocks[1].fields',
        '$.blocks[2].fieldGroups',
        '$.blocks[3].fields',
        '$.blocks[4].fields',
        '$.blocks[5].fields',
        '$.blocks[6].fields',
      ]),
    );
  });

  it('should not require visible fields on template-backed data blocks', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      blocks: [
        {
          key: 'templateBackedTable',
          type: 'table',
          template: {
            uid: 'existing-template-uid',
          },
        },
      ],
    });

    expect(errors.map((error: any) => error.ruleId)).not.toContain('data-block-visible-fields-required');
  });

  it('should reject visible data blocks without valid business fields before addBlock and addBlocks writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Authoring add block visible data fields page',
      tabTitle: 'Authoring add block visible data fields tab',
    });

    const addBlockResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'table',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      },
    });

    expect(addBlockResponse.status).toBe(400);
    expect(addBlockResponse.body?.errors?.map((error: any) => error.ruleId)).toContain(
      'data-block-visible-fields-required',
    );
    expect(addBlockResponse.body?.errors?.map((error: any) => error.path)).toContain('$.fields');

    const addBlocksResponse = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        blocks: [
          {
            target: { uid: page.gridUid },
            type: 'list',
            resource: {
              collectionName: 'employees',
            },
          },
        ],
      },
    });

    expect(addBlocksResponse.status).toBe(400);
    expect(addBlocksResponse.body?.errors?.map((error: any) => error.ruleId)).toContain(
      'data-block-visible-fields-required',
    );
    expect(addBlocksResponse.body?.errors?.map((error: any) => error.path)).toContain('$.blocks[0].fields');
  });

  it('should allow JS field entries without business fields before authoring writes', async () => {
    const applyBlueprintResponse = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring JS field only visible data blocks',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'jsColumnOnlyTable',
                type: 'table',
                collection: 'employees',
                fields: [
                  {
                    key: 'employeeSummary',
                    type: 'jsColumn',
                    settings: {
                      code: `ctx.render('Employee summary');`,
                    },
                  },
                ],
              },
              {
                key: 'jsItemOnlyCreateForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'employeePreview',
                    type: 'jsItem',
                    settings: {
                      code: `ctx.render('Employee preview');`,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(applyBlueprintResponse.status, readErrorMessage(applyBlueprintResponse)).toBe(200);

    const composePage = await createPage(rootAgent, {
      title: 'Authoring compose JS field only page',
      tabTitle: 'Authoring compose JS field only tab',
    });
    const composeResponse = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: composePage.gridUid },
        blocks: [
          {
            key: 'composeJsColumnOnlyTable',
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: [
              {
                key: 'employeeStatus',
                fieldPath: 'status',
                renderer: 'js',
                settings: {
                  code: `ctx.render(ctx.value || 'No status');`,
                },
              },
            ],
          },
        ],
      },
    });

    expect(composeResponse.status, readErrorMessage(composeResponse)).toBe(200);

    const addBlockPage = await createPage(rootAgent, {
      title: 'Authoring add block JS field only page',
      tabTitle: 'Authoring add block JS field only tab',
    });
    const addBlockResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: addBlockPage.gridUid },
        type: 'table',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        fields: [
          {
            key: 'employeeMetric',
            type: 'jsColumn',
            settings: {
              code: `ctx.render('Metric');`,
            },
          },
        ],
      },
    });

    expect(addBlockResponse.status, readErrorMessage(addBlockResponse)).toBe(200);

    const addBlocksResponse = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: { uid: addBlockPage.gridUid },
        blocks: [
          {
            type: 'table',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: [
              {
                key: 'employeeRisk',
                type: 'jsColumn',
                settings: {
                  code: `ctx.render('Risk');`,
                },
              },
            ],
          },
        ],
      },
    });

    expect(addBlocksResponse.status, readErrorMessage(addBlocksResponse)).toBe(200);
  });

  it('should keep visible field error text when JS inputs are not valid field substitutes', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring invalid JS field substitute data blocks',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'jsActionOnlyTable',
                type: 'table',
                collection: 'employees',
                actions: [
                  {
                    key: 'tableJsAction',
                    type: 'jsItem',
                    settings: {
                      code: `ctx.render('Action');`,
                    },
                  },
                ],
              },
              {
                key: 'wrongContainerJsItemTable',
                type: 'table',
                collection: 'employees',
                fields: [
                  {
                    key: 'wrongTableItem',
                    type: 'jsItem',
                    settings: {
                      code: `ctx.render('Wrong table item');`,
                    },
                  },
                ],
              },
              {
                key: 'wrongContainerJsColumnForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'wrongFormColumn',
                    type: 'jsColumn',
                    settings: {
                      code: `ctx.render('Wrong form column');`,
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
    const visibleFieldErrors = response.body?.errors?.filter(
      (error: any) => error.ruleId === 'data-block-visible-fields-required',
    );
    expect(visibleFieldErrors).toHaveLength(3);
    expect(visibleFieldErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.tabs[0].blocks[0].fields',
        '$.tabs[0].blocks[1].fields',
        '$.tabs[0].blocks[2].fields',
      ]),
    );
    for (const visibleFieldError of visibleFieldErrors) {
      expect(visibleFieldError?.message).toContain('Add collection field names');
      expect(visibleFieldError?.message).toContain('defaults.collections.*.fieldGroups');
      expect(visibleFieldError?.message).not.toContain('JS');
    }
  });

  it('should allow direct visible data blocks with valid business fields', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring valid visible data block fields',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'validEmployeeTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
  });

  it('should leave unknown visible data block fields on the field-path-unknown rule', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring unknown visible data block field',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'unknownFieldEmployeeTable',
                type: 'table',
                collection: 'employees',
                fields: ['missingNickname'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.map((error: any) => error.ruleId)).toContain('field-path-unknown');
    expect(response.body?.errors?.map((error: any) => error.ruleId)).not.toContain(
      'data-block-visible-fields-required',
    );
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
                fields: LARGE_GENERATED_POPUP_FIELDS.slice(0, 3),
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
                fields: GENERATED_POPUP_TEN_EFFECTIVE_FIELDS.slice(0, 3),
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

  it('should not count relation backing foreign keys as generated popup defaults', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring relation backing FK generated popup fields',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'relationBackingFkRecordsTable',
                type: 'table',
                collection: GENERATED_POPUP_RELATION_BACKING_FK_COLLECTION,
                fields: GENERATED_POPUP_RELATION_BACKING_FK_FIELDS.slice(0, 3),
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: GENERATED_POPUP_RELATION_BACKING_FK_FIELDS[0], operator: '$notEmpty' },
                    { path: GENERATED_POPUP_RELATION_BACKING_FK_FIELDS[1], operator: '$notEmpty' },
                    { path: GENERATED_POPUP_RELATION_BACKING_FK_FIELDS[2], operator: '$notEmpty' },
                    { path: GENERATED_POPUP_RELATION_BACKING_FK_FIELDS[3], operator: '$notEmpty' },
                  ],
                },
                actions: [
                  {
                    key: 'createRelationBackingFkRecord',
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
    expect(generatedFieldPaths).toEqual(
      expect.arrayContaining([
        ...GENERATED_POPUP_RELATION_BACKING_FK_FIELDS,
        GENERATED_POPUP_RELATION_BACKING_FK_FIELD,
      ]),
    );
    expect(generatedFieldPaths).not.toContain(GENERATED_POPUP_RELATION_BACKING_FK_NAME);
  });

  it('should keep explicitly listed relation backing foreign keys in generated popup defaults', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring explicit relation backing FK generated popup fields',
          },
        },
        defaults: {
          collections: {
            [GENERATED_POPUP_RELATION_BACKING_FK_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Explicit fields',
                  fields: [
                    GENERATED_POPUP_RELATION_BACKING_FK_FIELDS[0],
                    GENERATED_POPUP_RELATION_BACKING_FK_NAME,
                    GENERATED_POPUP_RELATION_BACKING_FK_FIELD,
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
                key: 'explicitRelationBackingFkRecordsTable',
                type: 'table',
                collection: GENERATED_POPUP_RELATION_BACKING_FK_COLLECTION,
                fields: GENERATED_POPUP_RELATION_BACKING_FK_FIELDS.slice(0, 3),
                actions: [
                  {
                    key: 'createExplicitRelationBackingFkRecord',
                    type: 'addNew',
                    popup: {
                      tryTemplate: false,
                    },
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
    const persistedAction = await context.flowRepo.findModelById(createAction.uid, { includeAsyncNode: true });
    expect(persistedAction?.stepParams?.popupSettings?.openView?.popupTemplateUid).toBeFalsy();
    const createForm = collectDescendantNodes(persistedAction, (item) => item?.use === 'CreateFormModel')[0];
    expect(createForm).toBeTruthy();
    const generatedFieldPaths = collectDescendantNodes(
      createForm,
      (item) => !!item?.stepParams?.fieldSettings?.init?.fieldPath,
    ).map((item: any) => item.stepParams.fieldSettings.init.fieldPath);
    expect(generatedFieldPaths).toEqual(
      expect.arrayContaining([
        GENERATED_POPUP_RELATION_BACKING_FK_FIELDS[0],
        GENERATED_POPUP_RELATION_BACKING_FK_NAME,
        GENERATED_POPUP_RELATION_BACKING_FK_FIELD,
      ]),
    );
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
      path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview`,
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
      `defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview.fields`,
    );
    expect(missingFormBehaviorError.message).toContain('review every described generated add/edit field');
    expect(missingFormBehaviorError.message).toContain('formBehaviorDescriptionReview');
  });

  it('should accept implemented and noUiBehavior review coverage for described generated fields', async () => {
    for (const [label, collectionDefaults] of [
      [
        'implemented',
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
          formBehaviorDescriptionReview: {
            fields: {
              title: {
                decision: 'implemented',
              },
            },
          },
        },
      ],
      [
        'noUiBehavior',
        {
          formBehaviorDescriptionReview: {
            fields: {
              title: {
                decision: 'noUiBehavior',
                reasonCode: 'no-ui-behavior',
              },
            },
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

  it('should reject null defaults formBehavior and old array review coverage', async () => {
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
                hasTried: true,
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
          ruleId: 'defaults-formBehaviorDescriptionReview-fields-invalid-shape',
          details: expect.objectContaining({
            migrationExample: expect.any(Object),
            fixOptions: expect.any(Array),
          }),
        }),
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview`,
          ruleId: 'defaults-formBehaviorDescriptionReview-unsupported-key',
          details: expect.objectContaining({
            unsupportedKeys: ['hasTried'],
            migrationExample: expect.any(Object),
          }),
        }),
      ]),
    );
  });

  it('should accept null review entries for generated add and edit candidates without descriptions', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description review empty description null',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
              formBehaviorDescriptionReview: {
                fields: {
                  title: {
                    decision: 'noUiBehavior',
                    reasonCode: 'no-ui-behavior',
                  },
                  notes: null,
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
                key: 'descriptionBehaviorEmptyDescriptionNullTable',
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
  });

  it('should reject implemented review decisions without actual structured coverage', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description review implemented missing coverage',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
              formBehaviorDescriptionReview: {
                fields: {
                  title: {
                    decision: 'implemented',
                  },
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
                key: 'descriptionBehaviorImplementedMissingCoverageTable',
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
    const error = response.body.errors.find(
      (item: any) => item.ruleId === 'description-review-implemented-missing-coverage',
    );
    expectStructuredError(error, {
      status: 400,
      type: 'bad_request',
    });
    expect(error).toMatchObject({
      path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview.fields.title`,
      details: {
        collection: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
        field: 'title',
        description: 'Title is required for generated add and edit forms.',
        decision: 'implemented',
      },
    });
    expect(error.details.fixOptions).toEqual(expect.any(Array));
    expect(error.details.fixOptions.length).toBeGreaterThanOrEqual(2);
  });

  it('should reject implemented review decisions when field settings are empty', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description review empty settings coverage',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
              formBehavior: {
                addNew: {
                  fields: {
                    title: {
                      settings: {},
                    },
                  },
                },
                edit: {
                  fields: {
                    title: {
                      settings: {},
                    },
                  },
                },
              },
              formBehaviorDescriptionReview: {
                fields: {
                  title: {
                    decision: 'implemented',
                  },
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
                key: 'descriptionBehaviorEmptySettingsTable',
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
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview.fields.title`,
          ruleId: 'description-review-implemented-missing-coverage',
        }),
      ]),
    );
  });

  it('should accept implemented review coverage from applicable top-level form reactions', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description review reaction coverage',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
              formBehaviorDescriptionReview: {
                fields: {
                  title: {
                    decision: 'implemented',
                  },
                },
              },
            },
          },
        },
        reaction: {
          items: [
            {
              type: 'setFieldLinkageRules',
              target: 'main.descriptionBehaviorReactionForm',
              rules: [
                {
                  key: 'requireTitle',
                  when: {
                    logic: '$and',
                    items: [],
                  },
                  then: [
                    {
                      type: 'setFieldState',
                      fieldPaths: ['title'],
                      state: 'required',
                    },
                  ],
                },
              ],
            },
          ],
        },
        tabs: [
          {
            key: 'main',
            title: 'Overview',
            blocks: [
              {
                key: 'descriptionBehaviorReactionForm',
                type: 'createForm',
                collection: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
                fields: ['title'],
                actions: ['submit'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
  });

  it('should reject implemented review coverage from unrelated top-level form reactions', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description review unrelated reaction coverage',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
              formBehaviorDescriptionReview: {
                fields: {
                  title: {
                    decision: 'implemented',
                  },
                },
              },
            },
          },
        },
        reaction: {
          items: [
            {
              type: 'setFieldLinkageRules',
              target: 'main.descriptionBehaviorUnrelatedReactionForm',
              rules: [
                {
                  key: 'requireTitleElsewhere',
                  when: {
                    logic: '$and',
                    items: [],
                  },
                  then: [
                    {
                      type: 'setFieldState',
                      fieldPaths: ['title'],
                      state: 'required',
                    },
                  ],
                },
              ],
            },
          ],
        },
        tabs: [
          {
            key: 'main',
            title: 'Overview',
            blocks: [
              {
                key: 'descriptionBehaviorSourceTable',
                type: 'table',
                collection: DESCRIPTION_FORM_BEHAVIOR_COLLECTION,
                fields: ['title'],
              },
              {
                key: 'descriptionBehaviorUnrelatedReactionForm',
                type: 'createForm',
                collection: DESCRIPTION_FORM_BEHAVIOR_IGNORED_COLLECTION,
                fields: ['title'],
                actions: ['submit'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview.fields.title`,
          ruleId: 'description-review-implemented-missing-coverage',
        }),
      ]),
    );
  });

  it('should reject non-implemented review decisions that conflict with structured coverage', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring description review non implemented conflict',
          },
        },
        defaults: {
          collections: {
            [DESCRIPTION_FORM_BEHAVIOR_COLLECTION]: {
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
              },
              formBehaviorDescriptionReview: {
                fields: {
                  title: {
                    decision: 'unsupported',
                    reasonCode: 'ambiguous-description',
                  },
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
                key: 'descriptionBehaviorNonImplementedConflictTable',
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
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: `$.defaults.collections.${DESCRIPTION_FORM_BEHAVIOR_COLLECTION}.formBehaviorDescriptionReview.fields.title`,
          ruleId: 'description-review-nonimplemented-conflicts-with-coverage',
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
                fields: ['field1', 'field2', 'field3'],
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
                fields: LARGE_GENERATED_POPUP_FIELDS.slice(0, 3),
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
      fields: ['title'],
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
                fields: ['nickname', 'status', 'email'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['navigation-icon-required', 'navigation-icon-unknown']),
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
    expect(response.body).toEqual(
      expect.objectContaining({
        errorCount: response.body.errors.length,
        details: expect.objectContaining({
          mustFixAllErrorsBeforeRetry: true,
          retryPolicy: 'fix_all_errors_before_retry_same_write',
          agentInstruction: expect.stringContaining('Fix every listed error'),
          requiredBlockPolicy: expect.objectContaining({
            requiredBlockTypes: expect.arrayContaining(['chart']),
            fixStrategy: 'repair_same_block_type',
            doNotReplaceOrDrop: true,
          }),
        }),
      }),
    );
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
    const chartIssue = response.body.errors.find(
      (error: any) => error.ruleId === 'chart-block-asset-reference-required',
    );
    expect(chartIssue).toEqual(
      expect.objectContaining({
        index: expect.any(Number),
        details: expect.objectContaining({
          requiredBlockType: 'chart',
          fixStrategy: 'repair_same_block_type',
          agentInstruction: expect.stringContaining('Repair it as chart'),
        }),
      }),
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
            actions: [
              { key: 'badCalendarAction', type: 'updateRecord' },
              { key: 'badCalendarAIEmployee', type: 'aiEmployee' },
            ],
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
        '$.blocks[1].actions[1]',
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
    const title = `Duplicate authoring group ${uid()}`;
    await context.routesRepo.create({
      values: {
        type: 'group',
        title,
        schemaUid: uid(),
      },
    });
    await context.routesRepo.create({
      values: {
        type: 'group',
        title,
        schemaUid: uid(),
      },
    });

    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title,
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
