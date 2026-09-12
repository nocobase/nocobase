/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import type { FlowSurfaceFieldDefaultBindingScope } from '../flow-surfaces/core-field-default-bindings';
import {
  CORE_FIELD_DEFAULT_BINDING_MATRIX,
  getSharedFieldDefaultBindingUse,
} from '../flow-surfaces/core-field-default-bindings';

const FRONTEND_CORE_DEFAULT_BINDING_REGISTRATIONS: Record<
  FlowSurfaceFieldDefaultBindingScope,
  Record<string, string>
> = {
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

describe('flowSurfaces core field default binding parity', () => {
  for (const scope of Object.keys(CORE_FIELD_DEFAULT_BINDING_MATRIX) as FlowSurfaceFieldDefaultBindingScope[]) {
    it(`should keep ${scope} fallback bindings aligned with frontend defaults`, () => {
      const interfaces = Object.keys(CORE_FIELD_DEFAULT_BINDING_MATRIX[scope]);
      const frontendDefaults = Object.fromEntries(
        interfaces.map((fieldInterface) => [
          fieldInterface,
          FRONTEND_CORE_DEFAULT_BINDING_REGISTRATIONS[scope][fieldInterface],
        ]),
      );
      const serverDefaults = Object.fromEntries(
        interfaces.map((fieldInterface) => [fieldInterface, getSharedFieldDefaultBindingUse(scope, fieldInterface)]),
      );

      expect(serverDefaults).toEqual(CORE_FIELD_DEFAULT_BINDING_MATRIX[scope]);
      expect(frontendDefaults).toEqual(serverDefaults);
    });
  }

  it('should explicitly align enum-like display fields and dedicated editable group fields', () => {
    expect(FRONTEND_CORE_DEFAULT_BINDING_REGISTRATIONS.display.select).toBe('DisplayEnumFieldModel');
    expect(FRONTEND_CORE_DEFAULT_BINDING_REGISTRATIONS.display.checkboxGroup).toBe('DisplayEnumFieldModel');
    expect(FRONTEND_CORE_DEFAULT_BINDING_REGISTRATIONS.display.tableoid).toBe('DisplayEnumFieldModel');
    expect(FRONTEND_CORE_DEFAULT_BINDING_REGISTRATIONS.editable.radioGroup).toBe('RadioGroupFieldModel');
    expect(FRONTEND_CORE_DEFAULT_BINDING_REGISTRATIONS.editable.checkboxGroup).toBe('CheckboxGroupFieldModel');
    expect(getSharedFieldDefaultBindingUse('display', 'select')).toBe('DisplayEnumFieldModel');
    expect(getSharedFieldDefaultBindingUse('display', 'checkboxGroup')).toBe('DisplayEnumFieldModel');
    expect(getSharedFieldDefaultBindingUse('display', 'tableoid')).toBe('DisplayEnumFieldModel');
    expect(getSharedFieldDefaultBindingUse('editable', 'radioGroup')).toBe('RadioGroupFieldModel');
    expect(getSharedFieldDefaultBindingUse('editable', 'checkboxGroup')).toBe('CheckboxGroupFieldModel');
  });
});
