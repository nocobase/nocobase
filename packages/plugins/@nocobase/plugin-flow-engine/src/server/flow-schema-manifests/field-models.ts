/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowFieldBindingContextManifest,
  FlowFieldBindingManifest,
  FlowModelSchemaManifest,
} from '@nocobase/flow-engine';
import { createFieldModelSchemaManifest, createRuntimeFieldModelSlotSchema } from './shared';

function toTitle(use: string) {
  return use
    .replace(/Model$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\bJson\b/g, 'JSON')
    .replace(/\bUrl\b/g, 'URL')
    .trim();
}

function createFieldManifest(use: string, options: Partial<FlowModelSchemaManifest> = {}): FlowModelSchemaManifest {
  return {
    ...createFieldModelSchemaManifest({
      use,
      title: toTitle(use),
    }),
    ...options,
    use,
    title: options.title || toTitle(use),
  };
}

const titleFieldRendererUses = new Set([
  'RecordSelectFieldModel',
  'RecordPickerFieldModel',
  'CascadeSelectFieldModel',
  'FilterFormRecordSelectFieldModel',
]);

function associationBinding(
  context: string,
  use: string,
  interfaces: string[],
  options: Partial<FlowFieldBindingManifest> = {},
): FlowFieldBindingManifest {
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

export const coreFieldBindingContextManifests: FlowFieldBindingContextManifest[] = [
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

export const coreFieldModelManifests: FlowModelSchemaManifest[] = [
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
  'RecordSelectFieldModel',
  'RecordPickerFieldModel',
  'CascadeSelectFieldModel',
  'CascadeSelectListFieldModel',
  'PopupSubTableFieldModel',
  'SubFormFieldModel',
  'SubFormListFieldModel',
  'SubTableFieldModel',
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
].map((use) =>
  createFieldManifest(
    use,
    titleFieldRendererUses.has(use)
      ? {
          subModelSlots: {
            field: createRuntimeFieldModelSlotSchema(
              'display-field',
              'Title field renderer model is resolved from runtime display field bindings.',
            ),
          },
        }
      : undefined,
  ),
);

export const coreFieldBindingManifests: FlowFieldBindingManifest[] = [
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
