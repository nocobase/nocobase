/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getCoreFieldConfigureState, reverseFieldConfigureItems } from '../field-configure';

describe('inverse relationship configuration', () => {
  it.each(['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'])(
    'keeps the %s inverse relationship type disabled when creating or editing a field',
    (type) => {
      for (const createOnly of [true, false]) {
        for (const showReverseFieldConfig of [true, false]) {
          const values = {
            autoCreateReverseField: true,
            reverseField: { type, ...(createOnly ? {} : { key: 'existing-reverse-field' }) },
          };

          expect(
            getCoreFieldConfigureState('reverseField.type', values, { createOnly, showReverseFieldConfig }),
          ).toEqual({
            disabled: true,
            hidden: !showReverseFieldConfig,
          });
        }
      }
    },
  );

  it.each(['reverseField.name', 'reverseField.uiSchema.title'])(
    'allows editing %s only when the inverse configuration is visible',
    (name) => {
      for (const showReverseFieldConfig of [true, false]) {
        expect(getCoreFieldConfigureState(name, {}, { showReverseFieldConfig })).toEqual({
          disabled: !showReverseFieldConfig,
          hidden: !showReverseFieldConfig,
        });
      }
    },
  );

  it('also disables the inverse relationship type in explicit configure items', () => {
    const item = reverseFieldConfigureItems().find(({ name }) => name === 'reverseField.type');

    expect(item?.disabled).toBe(true);
  });
});
