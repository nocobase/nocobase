/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowFieldBindingContextContribution,
  FlowFieldBindingContribution,
  FlowModelSchemaContribution,
} from '@nocobase/flow-engine';
import {
  createFieldModelSchemaContribution,
  createFieldModelStepParamsSchema,
  createFieldModelSkeleton,
  createPopupBlockGrid,
  createRuntimeFieldModelSlotSchema,
  runJsActionSettingsStepParamsSchema,
} from './shared';

function toTitle(use: string) {
  return use
    .replace(/Model$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\bJson\b/g, 'JSON')
    .replace(/\bUrl\b/g, 'URL')
    .trim();
}

function createFieldContribution(
  use: string,
  options: Partial<FlowModelSchemaContribution> = {},
): FlowModelSchemaContribution {
  return {
    ...createFieldModelSchemaContribution({
      use,
      title: toTitle(use),
    }),
    ...options,
    use,
    title: options.title || toTitle(use),
  };
}

function createJsFieldContribution(use: 'JSFieldModel' | 'JSEditableFieldModel'): FlowModelSchemaContribution {
  const baseSchema = createFieldModelStepParamsSchema();
  const skeleton = createFieldModelSkeleton(use);

  return createFieldContribution(use, {
    title: use === 'JSEditableFieldModel' ? 'JS editable field' : 'JS field',
    stepParamsSchema: {
      type: 'object',
      properties: {
        ...(baseSchema.properties || {}),
        jsSettings: runJsActionSettingsStepParamsSchema,
      },
      additionalProperties: true,
    },
    skeleton: {
      ...skeleton,
      stepParams: {
        ...(skeleton.stepParams || {}),
        jsSettings: {
          runJs: {
            version: 'v2',
            code: '',
          },
        },
      },
    },
  });
}

function createAssociationDisplayFieldSkeleton(
  use: string,
  options: Partial<{
    dataSourceKey: string;
    sourceCollectionName: string;
    sourceFieldPath: string;
    targetCollectionName: string;
    targetFieldPath: string;
  }> = {},
) {
  const dataSourceKey = options.dataSourceKey || 'main';
  const sourceCollectionName = options.sourceCollectionName || 'users';
  const sourceFieldPath = options.sourceFieldPath || 'roles';
  const targetCollectionName = options.targetCollectionName || 'roles';
  const targetFieldPath = options.targetFieldPath || 'title';

  return {
    ...createFieldModelSkeleton(use, {
      dataSourceKey,
      collectionName: sourceCollectionName,
      fieldPath: sourceFieldPath,
    }),
    subModels: {
      field: createFieldModelSkeleton('DisplayTextFieldModel', {
        dataSourceKey,
        collectionName: targetCollectionName,
        fieldPath: targetFieldPath,
      }),
    },
  };
}

function createRecordPickerFieldContribution(): FlowModelSchemaContribution {
  const skeleton = createAssociationDisplayFieldSkeleton('RecordPickerFieldModel');
  return createFieldContribution('RecordPickerFieldModel', {
    subModelSlots: {
      field: createRuntimeFieldModelSlotSchema('display-field', 'Selected record label renderer.'),
      'grid-block': {
        type: 'object',
        use: 'BlockGridModel',
        description: 'Popup selector content grid.',
      },
    },
    skeleton: {
      ...skeleton,
      subModels: {
        ...skeleton.subModels,
        'grid-block': createPopupBlockGrid({
          prefix: 'record-picker-popup',
        }),
      },
    },
  });
}

function createRecordSelectFieldContribution(): FlowModelSchemaContribution {
  return createFieldContribution('RecordSelectFieldModel', {
    subModelSlots: {
      field: createRuntimeFieldModelSlotSchema('display-field', 'Selected option label renderer.'),
    },
    skeleton: createAssociationDisplayFieldSkeleton('RecordSelectFieldModel'),
  });
}

function createSubTableColumnContribution(): FlowModelSchemaContribution {
  const dataSourceKey = 'main';
  const collectionName = 'users';
  const fieldPath = 'roles.title';
  return createFieldContribution('SubTableColumnModel', {
    subModelSlots: {
      field: createRuntimeFieldModelSlotSchema('editable-field', 'Inline sub-table column editor field.'),
    },
    skeleton: {
      uid: 'todo-sub-table-column-model',
      use: 'SubTableColumnModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey,
            collectionName,
            fieldPath,
          },
        },
      },
      subModels: {
        field: createFieldModelSkeleton('DisplayTextFieldModel', {
          dataSourceKey,
          collectionName,
          fieldPath,
        }),
      },
    },
  });
}

function createSubTableFieldContribution(): FlowModelSchemaContribution {
  return createFieldContribution('SubTableFieldModel', {
    subModelSlots: {
      columns: {
        type: 'array',
        uses: ['SubTableColumnModel'],
        description: 'Inline editable sub-table columns.',
      },
    },
    skeleton: {
      ...createFieldModelSkeleton('SubTableFieldModel', {
        dataSourceKey: 'main',
        collectionName: 'users',
        fieldPath: 'roles',
      }),
      subModels: {
        columns: [
          {
            uid: 'todo-sub-table-column-model',
            use: 'SubTableColumnModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: 'main',
                  collectionName: 'users',
                  fieldPath: 'roles.title',
                },
              },
            },
            subModels: {
              field: createFieldModelSkeleton('DisplayTextFieldModel', {
                dataSourceKey: 'main',
                collectionName: 'users',
                fieldPath: 'roles.title',
              }),
            },
          },
        ],
      },
    },
  });
}

function createSubFormFieldContribution(
  use: 'SubFormFieldModel' | 'SubFormListFieldModel',
): FlowModelSchemaContribution {
  return createFieldContribution(use, {
    subModelSlots: {
      grid: {
        type: 'object',
        use: 'FormGridModel',
        description: 'Nested form grid.',
      },
    },
    skeleton: {
      ...createFieldModelSkeleton(use, {
        dataSourceKey: 'main',
        collectionName: 'users',
        fieldPath: use === 'SubFormFieldModel' ? 'profile' : 'roles',
      }),
      subModels: {
        grid: {
          uid: `todo-${use
            .replace(/Model$/, '')
            .replace(/[A-Z]/g, (m, i) => `${i ? '-' : ''}${m.toLowerCase()}`)}-grid`,
          use: 'FormGridModel',
        },
      },
    },
  });
}

function associationBinding(
  context: string,
  use: string,
  interfaces: string[],
  options: Partial<FlowFieldBindingContribution> = {},
): FlowFieldBindingContribution {
  return {
    context,
    use,
    interfaces,
    conditions: {
      association: true,
      ...(options.conditions || {}),
    },
    ...options,
  };
}

export const coreFieldBindingContextContributions: FlowFieldBindingContextContribution[] = [
  { name: 'editable-field' },
  { name: 'display-field' },
  { name: 'filter-field' },
  { name: 'form-item-field', inherits: ['editable-field'] },
  { name: 'assign-form-item-field', inherits: ['form-item-field'] },
  { name: 'table-column-field', inherits: ['display-field'] },
  { name: 'details-item-field', inherits: ['display-field'] },
  { name: 'form-association-item-field', inherits: ['display-field'] },
  { name: 'filter-form-item-field', inherits: ['filter-field'] },
];

const coreFieldModelContributionEntries: Array<string | FlowModelSchemaContribution> = [
  'InputFieldModel',
  'NumberFieldModel',
  'PercentFieldModel',
  'PasswordFieldModel',
  'CollectionSelectorFieldModel',
  'DateOnlyFieldModel',
  'DateTimeNoTzFieldModel',
  'DateTimeTzFieldModel',
  'TimeFieldModel',
  'CheckboxFieldModel',
  'CheckboxGroupFieldModel',
  'RadioGroupFieldModel',
  'SelectFieldModel',
  'TextareaFieldModel',
  'JsonFieldModel',
  'RichTextFieldModel',
  'ColorFieldModel',
  'IconFieldModel',
  createJsFieldContribution('JSFieldModel'),
  createJsFieldContribution('JSEditableFieldModel'),
  createRecordSelectFieldContribution(),
  createRecordPickerFieldContribution(),
  'CascadeSelectFieldModel',
  'CascadeSelectListFieldModel',
  'PopupSubTableFieldModel',
  createSubFormFieldContribution('SubFormFieldModel'),
  createSubFormFieldContribution('SubFormListFieldModel'),
  createSubTableFieldContribution(),
  createSubTableColumnContribution(),
  'DisplayTextFieldModel',
  'DisplayNumberFieldModel',
  'DisplayDateTimeFieldModel',
  'DisplayTimeFieldModel',
  'DisplayColorFieldModel',
  'DisplayEnumFieldModel',
  'DisplayPasswordFieldModel',
  'DisplayCheckboxFieldModel',
  'DisplayJSONFieldModel',
  'DisplayHtmlFieldModel',
  'DisplayIconFieldModel',
  'DisplayPercentFieldModel',
  'DisplayURLFieldModel',
  'DisplaySubItemFieldModel',
  'DisplaySubListFieldModel',
  'DisplaySubTableFieldModel',
  'FilterFormRecordSelectFieldModel',
  'DateTimeFilterFieldModel',
  'DateOnlyFilterFieldModel',
  'DateTimeNoTzFilterFieldModel',
  'DateTimeTzFilterFieldModel',
];

export const coreFieldModelContributions: FlowModelSchemaContribution[] = coreFieldModelContributionEntries.map(
  (contribution) => (typeof contribution === 'string' ? createFieldContribution(contribution) : contribution),
);

export const coreFieldBindingContributions: FlowFieldBindingContribution[] = [
  {
    context: 'editable-field',
    use: 'InputFieldModel',
    interfaces: ['input', 'email', 'phone', 'uuid', 'url', 'nanoid'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'NumberFieldModel',
    interfaces: ['number', 'integer', 'id', 'snowflakeId'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'PercentFieldModel',
    interfaces: ['percent'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'PasswordFieldModel',
    interfaces: ['password'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'CollectionSelectorFieldModel',
    interfaces: ['collection', 'tableoid'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'DateOnlyFieldModel',
    interfaces: ['date'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'DateTimeNoTzFieldModel',
    interfaces: ['datetimeNoTz'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'DateTimeTzFieldModel',
    interfaces: ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'TimeFieldModel',
    interfaces: ['time'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'CheckboxFieldModel',
    interfaces: ['checkbox'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'CheckboxGroupFieldModel',
    interfaces: ['checkboxGroup'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'RadioGroupFieldModel',
    interfaces: ['radioGroup'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'SelectFieldModel',
    interfaces: ['select', 'multipleSelect'],
    isDefault: true,
    defaultProps: {
      allowClear: true,
    },
  },
  {
    context: 'editable-field',
    use: 'SelectFieldModel',
    interfaces: ['radioGroup'],
  },
  {
    context: 'editable-field',
    use: 'SelectFieldModel',
    interfaces: ['checkboxGroup'],
    isDefault: true,
    defaultProps: {
      allowClear: true,
      mode: 'tags',
    },
  },
  {
    context: 'editable-field',
    use: 'TextareaFieldModel',
    interfaces: ['textarea'],
    isDefault: true,
    defaultProps: {
      autoSize: {
        minRows: 3,
      },
    },
  },
  {
    context: 'editable-field',
    use: 'JsonFieldModel',
    interfaces: ['json'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'RichTextFieldModel',
    interfaces: ['richText'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'ColorFieldModel',
    interfaces: ['color'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'IconFieldModel',
    interfaces: ['icon'],
    isDefault: true,
  },
  {
    context: 'editable-field',
    use: 'JSEditableFieldModel',
    interfaces: ['*'],
  },
  associationBinding(
    'editable-field',
    'RecordSelectFieldModel',
    ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
    {
      isDefault: true,
      order: 1,
    },
  ),
  associationBinding(
    'editable-field',
    'RecordPickerFieldModel',
    ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
    {
      order: 20,
    },
  ),
  associationBinding('editable-field', 'CascadeSelectFieldModel', ['m2o', 'o2o', 'oho', 'obo'], {
    isDefault: true,
    order: 60,
    conditions: {
      targetCollectionTemplateIn: ['tree'],
    },
  }),
  associationBinding('editable-field', 'CascadeSelectListFieldModel', ['m2m', 'o2m', 'mbm'], {
    isDefault: true,
    order: 60,
    conditions: {
      targetCollectionTemplateIn: ['tree'],
    },
  }),
  associationBinding('editable-field', 'PopupSubTableFieldModel', ['m2m', 'o2m', 'mbm'], {
    order: 300,
    conditions: {
      targetCollectionTemplateNotIn: ['file'],
    },
  }),
  associationBinding('form-item-field', 'SubFormFieldModel', ['m2o', 'o2o', 'oho', 'obo', 'updatedBy', 'createdBy'], {
    order: 100,
    conditions: {
      targetCollectionTemplateNotIn: ['file'],
    },
  }),
  associationBinding('form-item-field', 'SubFormListFieldModel', ['m2m', 'o2m', 'mbm'], {
    order: 100,
    conditions: {
      targetCollectionTemplateNotIn: ['file'],
    },
  }),
  associationBinding('form-item-field', 'SubTableFieldModel', ['m2m', 'o2m', 'mbm'], {
    order: 200,
    conditions: {
      targetCollectionTemplateNotIn: ['file'],
    },
  }),
  {
    context: 'display-field',
    use: 'DisplayTextFieldModel',
    interfaces: ['input', 'email', 'phone', 'uuid', 'textarea', 'nanoid'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayNumberFieldModel',
    interfaces: ['number', 'integer', 'id', 'snowflakeId'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayDateTimeFieldModel',
    interfaces: ['date', 'datetimeNoTz', 'createdAt', 'datetime', 'updatedAt', 'unixTimestamp'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayTimeFieldModel',
    interfaces: ['time'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayColorFieldModel',
    interfaces: ['color'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayEnumFieldModel',
    interfaces: ['select', 'multipleSelect', 'radioGroup', 'checkboxGroup', 'collection', 'tableoid'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayPasswordFieldModel',
    interfaces: ['password'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayCheckboxFieldModel',
    interfaces: ['checkbox'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayJSONFieldModel',
    interfaces: ['json'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayHtmlFieldModel',
    interfaces: ['richText'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayIconFieldModel',
    interfaces: ['icon'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayPercentFieldModel',
    interfaces: ['percent'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'DisplayURLFieldModel',
    interfaces: ['url'],
    isDefault: true,
  },
  {
    context: 'display-field',
    use: 'JSFieldModel',
    interfaces: ['*'],
  },
  associationBinding('details-item-field', 'DisplaySubItemFieldModel', [
    'm2o',
    'o2o',
    'oho',
    'obo',
    'updatedBy',
    'createdBy',
  ]),
  associationBinding('details-item-field', 'DisplaySubListFieldModel', ['m2m', 'o2m', 'mbm']),
  associationBinding('details-item-field', 'DisplaySubTableFieldModel', ['m2m', 'o2m', 'mbm']),
  {
    context: 'filter-field',
    use: 'InputFieldModel',
    interfaces: [
      'input',
      'email',
      'phone',
      'uuid',
      'url',
      'nanoid',
      'textarea',
      'markdown',
      'vditor',
      'richText',
      'password',
      'color',
    ],
    isDefault: true,
  },
  {
    context: 'filter-field',
    use: 'NumberFieldModel',
    interfaces: ['number', 'integer', 'id', 'snowflakeId'],
    isDefault: true,
  },
  {
    context: 'filter-field',
    use: 'PercentFieldModel',
    interfaces: ['percent'],
    isDefault: true,
  },
  {
    context: 'filter-field',
    use: 'TimeFieldModel',
    interfaces: ['time'],
    isDefault: true,
  },
  {
    context: 'filter-field',
    use: 'SelectFieldModel',
    interfaces: ['select', 'multipleSelect', 'radioGroup'],
    isDefault: true,
    defaultProps: {
      allowClear: true,
    },
  },
  {
    context: 'filter-field',
    use: 'SelectFieldModel',
    interfaces: ['checkboxGroup'],
    isDefault: true,
    defaultProps: {
      allowClear: true,
      mode: 'tags',
    },
  },
  {
    context: 'filter-field',
    use: 'SelectFieldModel',
    interfaces: ['checkbox'],
    isDefault: true,
    defaultProps: {
      allowClear: true,
      multiple: false,
      options: [
        { label: '{{t("Yes")}}', value: true },
        { label: '{{t("No")}}', value: false },
      ],
    },
  },
  {
    context: 'filter-field',
    use: 'DateOnlyFilterFieldModel',
    interfaces: ['date'],
    isDefault: true,
  },
  {
    context: 'filter-field',
    use: 'DateTimeNoTzFilterFieldModel',
    interfaces: ['datetimeNoTz'],
    isDefault: true,
  },
  {
    context: 'filter-field',
    use: 'DateTimeTzFilterFieldModel',
    interfaces: ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'],
    isDefault: true,
  },
  associationBinding(
    'filter-field',
    'FilterFormRecordSelectFieldModel',
    ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
    {
      isDefault: true,
      defaultProps: {
        allowMultiple: true,
        multiple: true,
        quickCreate: 'none',
      },
    },
  ),
];
