/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import {
  createActionStepParamsSchema,
  genericFilterSchema,
  popupActionSettingsStepParamsSchema,
} from '../flow-schema-manifests/shared';
import { FlowSchemaService } from '../flow-schema-service';

function createService() {
  const service = new FlowSchemaService();

  service.registerFieldBindingContexts([
    { name: 'editable-field' },
    { name: 'display-field' },
    { name: 'form-item-field', inherits: ['editable-field'] },
  ]);

  service.registerFieldBindings(
    [
      {
        context: 'editable-field',
        use: 'InputFieldModel',
        interfaces: ['input', 'uuid'],
        isDefault: true,
      },
      {
        context: 'form-item-field',
        use: 'RecordSelectFieldModel',
        interfaces: ['m2m'],
        isDefault: true,
      },
      {
        context: 'form-item-field',
        use: 'RecordPickerFieldModel',
        interfaces: ['m2m'],
        order: 20,
      },
      {
        context: 'form-item-field',
        use: 'SubTableFieldModel',
        interfaces: ['m2m'],
        order: 30,
      },
      {
        context: 'display-field',
        use: 'DisplayTextFieldModel',
        interfaces: ['input'],
        isDefault: true,
      },
    ],
    'official',
  );

  service.registerModelManifests([
    {
      use: 'FormItemModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      subModelSlots: {
        field: {
          type: 'object',
          fieldBindingContext: 'form-item-field',
        },
      },
    },
    {
      use: 'InputFieldModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
    },
    {
      use: 'RecordSelectFieldModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      subModelSlots: {
        field: {
          type: 'object',
          fieldBindingContext: 'editable-field',
        },
      },
    },
    {
      use: 'RecordPickerFieldModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      subModelSlots: {
        field: {
          type: 'object',
          fieldBindingContext: 'display-field',
        },
        'grid-block': {
          type: 'object',
          use: 'BlockGridModel',
        },
      },
    },
    {
      use: 'SubTableFieldModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      subModelSlots: {
        columns: {
          type: 'array',
          uses: ['SubTableColumnModel'],
        },
      },
    },
    {
      use: 'SubTableColumnModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      subModelSlots: {
        field: {
          type: 'object',
          fieldBindingContext: 'editable-field',
        },
      },
    },
    {
      use: 'BlockGridModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
    },
    {
      use: 'ChildPageModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      subModelSlots: {
        tabs: {
          type: 'array',
          uses: ['ChildPageTabModel'],
          required: true,
          minItems: 1,
        },
      },
    },
    {
      use: 'ChildPageTabModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      subModelSlots: {
        grid: {
          type: 'object',
          use: 'BlockGridModel',
          required: true,
        },
      },
    },
    {
      use: 'DisplayTextFieldModel',
      source: 'official',
      strict: true,
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
    },
  ]);

  return service;
}

describe('FlowSchemaService', () => {
  it('should normalize fieldBinding-driven field switches and prune stale subModels', () => {
    const service = createService();
    const payload = {
      uid: 'form-item-1',
      use: 'FormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'roles',
          },
        },
      },
      subModels: {
        field: {
          uid: 'field-node-1',
          use: 'RecordSelectFieldModel',
          stepParams: {
            fieldBinding: {
              use: 'RecordPickerFieldModel',
            },
            fieldSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'users',
                fieldPath: 'roles',
              },
            },
          },
          subModels: {
            field: {
              uid: 'label-field-1',
              use: 'DisplayTextFieldModel',
            },
            'grid-block': {
              uid: 'picker-grid-1',
              use: 'BlockGridModel',
            },
            columns: [
              {
                uid: 'legacy-column-1',
                use: 'LegacyColumnModel',
              },
            ],
          },
        },
      },
    };

    const normalized = service.normalizeModelTree(payload);

    expect(normalized.subModels.field.use).toBe('RecordPickerFieldModel');
    expect(normalized.subModels.field.subModels).toMatchObject({
      field: {
        uid: 'label-field-1',
        use: 'DisplayTextFieldModel',
      },
      'grid-block': {
        uid: 'picker-grid-1',
        use: 'BlockGridModel',
      },
    });
    expect(normalized.subModels.field.subModels.columns).toBeUndefined();

    const issues = service.validateModelTree(payload);
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should expose RecordPickerFieldModel popup slots in discovery schema', () => {
    const service = createService();
    const document = service.getDocument('RecordPickerFieldModel');

    expect(document?.jsonSchema?.properties?.subModels).toMatchObject({
      type: 'object',
      properties: {
        field: {
          type: 'object',
        },
        'grid-block': {
          type: 'object',
          properties: {
            use: {
              const: 'BlockGridModel',
            },
          },
        },
      },
    });
  });

  it('should prune stale field slot when switching association form item to SubTableFieldModel', () => {
    const service = createService();
    const payload = {
      uid: 'form-item-sub-table',
      use: 'FormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'roles',
          },
        },
        editItemSettings: {
          model: {
            use: 'SubTableFieldModel',
          },
        },
      },
      subModels: {
        field: {
          uid: 'field-sub-table',
          use: 'RecordSelectFieldModel',
          stepParams: {
            fieldBinding: {
              use: 'SubTableFieldModel',
            },
            fieldSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'users',
                fieldPath: 'roles',
              },
            },
          },
          subModels: {
            field: {
              uid: 'stale-display-field',
              use: 'DisplayTextFieldModel',
            },
          },
        },
      },
    };

    const normalized = service.normalizeModelTree(payload);
    expect(normalized.subModels.field.use).toBe('SubTableFieldModel');
    expect(normalized.subModels.field.subModels?.field).toBeUndefined();

    const issues = service.validateModelTree(payload);
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should allow editable field models inside SubTableColumnModel', () => {
    const service = createService();
    const payload = {
      uid: 'sub-table-column-1',
      use: 'SubTableColumnModel',
      parentId: 'sub-table-field-1',
      subKey: 'columns',
      subType: 'array',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'roles.name',
          },
        },
      },
      subModels: {
        field: {
          uid: 'sub-table-column-field-1',
          use: 'InputFieldModel',
          stepParams: {},
        },
      },
    };

    const issues = service.validateModelTree(payload);
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });

  it('should allow ensure-style partial nested child creation without uid for lazy popup tabs', () => {
    const service = createService();
    const payload = {
      parentId: 'popup-parent',
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
      async: true,
      stepParams: {
        pageSettings: {
          general: {
            displayTitle: false,
            enableTabs: true,
          },
        },
      },
      subModels: {
        tabs: [
          {
            use: 'ChildPageTabModel',
            stepParams: {
              pageTabSettings: {
                tab: {
                  title: 'Details',
                },
              },
            },
          },
        ],
      },
    };

    const issues = service.validateModelTree(payload, { allowRootObjectLocator: true });
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);

    const normalized = service.normalizeModelTree(payload, [], {
      allowRootObjectLocator: true,
      assignImplicitUids: true,
    });

    expect(normalized.uid).toBeUndefined();
    expect(normalized.subModels.tabs[0].uid).toBeTruthy();
    expect(normalized.subModels.tabs[0].subModels?.grid).toBeUndefined();
  });

  it('should validate generic filter trees as recursive groups or conditions', () => {
    const service = new FlowSchemaService();
    const ajv = new Ajv({ allErrors: true, strict: false });

    service.registerModelManifests([
      {
        use: 'FilterHostModel',
        source: 'official',
        strict: true,
        stepParamsSchema: {
          type: 'object',
          properties: {
            filter: genericFilterSchema,
          },
          required: ['filter'],
          additionalProperties: false,
        },
      },
    ]);

    const document = service.getDocument('FilterHostModel');
    const filterSchema = document?.jsonSchema?.properties?.stepParams?.properties?.filter;
    expect(filterSchema).toBeTruthy();
    const validateFilter = ajv.compile(filterSchema || {});

    expect(
      validateFilter({
        logic: '$and',
        items: [
          {
            path: 'status',
            operator: '$eq',
            value: 'published',
          },
          {
            logic: '$or',
            items: [
              {
                path: 'createdBy',
                operator: '$eq',
                value: '{{ctx.currentUser.id}}',
              },
            ],
          },
        ],
      }),
      JSON.stringify(validateFilter.errors),
    ).toBe(true);

    expect(
      validateFilter({
        logic: '$and',
        items: [
          {
            foo: 'bar',
          },
        ],
      }),
      JSON.stringify(validateFilter.errors),
    ).toBe(false);

    const issues = service.validateModelTree({
      uid: 'filter-host-1',
      use: 'FilterHostModel',
      stepParams: {
        filter: {
          logic: '$and',
          items: [
            {
              foo: 'bar',
            },
          ],
        },
      },
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jsonPointer: '#/stepParams/filter/items/0',
          modelUid: 'filter-host-1',
          modelUse: 'FilterHostModel',
          section: 'stepParams',
          keyword: 'oneOf',
        }),
      ]),
    );
  });

  it('should accept null action icons for link-style edit actions', () => {
    const service = new FlowSchemaService();
    service.registerModelManifests([
      {
        use: 'EditActionModel',
        source: 'official',
        strict: true,
        stepParamsSchema: createActionStepParamsSchema({
          popupSettings: popupActionSettingsStepParamsSchema,
        }),
      },
    ]);

    const payload = {
      uid: 'edit-action-1',
      use: 'EditActionModel',
      parentId: 'table-actions-col-1',
      subKey: 'actions',
      subType: 'array',
      stepParams: {
        popupSettings: {
          openView: {
            collectionName: 'orders',
            dataSourceKey: 'main',
          },
        },
        buttonSettings: {
          general: {
            type: 'link',
            icon: null,
          },
        },
      },
    };

    const issues = service.validateModelTree(payload);
    expect(issues.filter((item) => item.level === 'error')).toEqual([]);
  });
});
