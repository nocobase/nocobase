/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type FlowSurfaceFieldDefaultBindingScope = 'display' | 'editable' | 'filter';

export const CORE_FIELD_DEFAULT_BINDING_MATRIX: Record<FlowSurfaceFieldDefaultBindingScope, Record<string, string>> = {
  display: {
    richText: 'DisplayHtmlFieldModel',
    number: 'DisplayNumberFieldModel',
    integer: 'DisplayNumberFieldModel',
    id: 'DisplayNumberFieldModel',
    snowflakeId: 'DisplayNumberFieldModel',
    json: 'DisplayJSONFieldModel',
    select: 'DisplayEnumFieldModel',
    multipleSelect: 'DisplayEnumFieldModel',
    radioGroup: 'DisplayEnumFieldModel',
    checkboxGroup: 'DisplayEnumFieldModel',
    collection: 'DisplayEnumFieldModel',
    tableoid: 'DisplayEnumFieldModel',
    icon: 'DisplayIconFieldModel',
    checkbox: 'DisplayCheckboxFieldModel',
    password: 'DisplayPasswordFieldModel',
    percent: 'DisplayPercentFieldModel',
    date: 'DisplayDateTimeFieldModel',
    datetimeNoTz: 'DisplayDateTimeFieldModel',
    createdAt: 'DisplayDateTimeFieldModel',
    datetime: 'DisplayDateTimeFieldModel',
    updatedAt: 'DisplayDateTimeFieldModel',
    unixTimestamp: 'DisplayDateTimeFieldModel',
    input: 'DisplayTextFieldModel',
    email: 'DisplayTextFieldModel',
    phone: 'DisplayTextFieldModel',
    uuid: 'DisplayTextFieldModel',
    textarea: 'DisplayTextFieldModel',
    nanoid: 'DisplayTextFieldModel',
    url: 'DisplayURLFieldModel',
    color: 'DisplayColorFieldModel',
    time: 'DisplayTimeFieldModel',
  },
  editable: {
    json: 'JsonFieldModel',
    textarea: 'TextareaFieldModel',
    icon: 'IconFieldModel',
    radioGroup: 'RadioGroupFieldModel',
    color: 'ColorFieldModel',
    select: 'SelectFieldModel',
    multipleSelect: 'SelectFieldModel',
    checkboxGroup: 'CheckboxGroupFieldModel',
    checkbox: 'CheckboxFieldModel',
    password: 'PasswordFieldModel',
    number: 'NumberFieldModel',
    integer: 'NumberFieldModel',
    id: 'NumberFieldModel',
    snowflakeId: 'NumberFieldModel',
    percent: 'PercentFieldModel',
    datetimeNoTz: 'DateTimeNoTzFieldModel',
    date: 'DateOnlyFieldModel',
    datetime: 'DateTimeTzFieldModel',
    createdAt: 'DateTimeTzFieldModel',
    updatedAt: 'DateTimeTzFieldModel',
    unixTimestamp: 'DateTimeTzFieldModel',
    time: 'TimeFieldModel',
    collection: 'CollectionSelectorFieldModel',
    tableoid: 'CollectionSelectorFieldModel',
    richText: 'RichTextFieldModel',
    input: 'InputFieldModel',
    email: 'InputFieldModel',
    phone: 'InputFieldModel',
    uuid: 'InputFieldModel',
    url: 'InputFieldModel',
    nanoid: 'InputFieldModel',
  },
  filter: {
    date: 'DateOnlyFilterFieldModel',
    datetimeNoTz: 'DateTimeNoTzFilterFieldModel',
    createdAt: 'DateTimeTzFilterFieldModel',
    datetime: 'DateTimeTzFilterFieldModel',
    updatedAt: 'DateTimeTzFilterFieldModel',
    unixTimestamp: 'DateTimeTzFilterFieldModel',
    select: 'SelectFieldModel',
    multipleSelect: 'SelectFieldModel',
    radioGroup: 'SelectFieldModel',
    checkboxGroup: 'SelectFieldModel',
    checkbox: 'SelectFieldModel',
    number: 'NumberFieldModel',
    integer: 'NumberFieldModel',
    id: 'NumberFieldModel',
    snowflakeId: 'NumberFieldModel',
    time: 'TimeFieldModel',
    percent: 'PercentFieldModel',
    input: 'InputFieldModel',
    email: 'InputFieldModel',
    phone: 'InputFieldModel',
    uuid: 'InputFieldModel',
    url: 'InputFieldModel',
    nanoid: 'InputFieldModel',
  },
};

const SUPPLEMENTAL_FIELD_DEFAULT_BINDING_MATRIX: Record<FlowSurfaceFieldDefaultBindingScope, Record<string, string>> = {
  display: {
    formula: 'DisplayDateTimeFieldModel',
  },
  editable: {},
  filter: {},
};

const FIELD_DEFAULT_BINDING_FALLBACKS: Record<FlowSurfaceFieldDefaultBindingScope, string> = {
  display: 'DisplayTextFieldModel',
  editable: 'InputFieldModel',
  filter: 'InputFieldModel',
};

function normalizeFieldInterface(fieldInterface?: string) {
  return String(fieldInterface || '').trim();
}

export function getSharedFieldDefaultBindingUse(
  scope: FlowSurfaceFieldDefaultBindingScope,
  fieldInterface?: string,
): string | undefined {
  const normalized = normalizeFieldInterface(fieldInterface);
  if (!normalized) {
    return undefined;
  }
  return (
    CORE_FIELD_DEFAULT_BINDING_MATRIX[scope][normalized] || SUPPLEMENTAL_FIELD_DEFAULT_BINDING_MATRIX[scope][normalized]
  );
}

export function inferSharedFieldDefaultBindingUse(scope: FlowSurfaceFieldDefaultBindingScope, fieldInterface?: string) {
  return getSharedFieldDefaultBindingUse(scope, fieldInterface) || FIELD_DEFAULT_BINDING_FALLBACKS[scope];
}
