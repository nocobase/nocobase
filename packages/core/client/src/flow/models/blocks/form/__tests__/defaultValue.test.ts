/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { hasOwnInitialValueConfig, resolveCollectionFieldInitialValue } from '../defaultValue';

describe('form default value helpers', () => {
  it('resolves collection field default value for supported interfaces', () => {
    expect(
      resolveCollectionFieldInitialValue({
        interface: 'input',
        defaultValue: '1123',
      }),
    ).toBe('1123');
  });

  it('coerces to-one association defaults before applying them', () => {
    expect(
      resolveCollectionFieldInitialValue({
        interface: 'm2o',
        isAssociationField: () => true,
        type: 'belongsTo',
        defaultValue: [1, 2],
      }),
    ).toBe(1);
  });

  it('skips unsupported interfaces such as formula', () => {
    expect(
      resolveCollectionFieldInitialValue({
        interface: 'formula',
        defaultValue: '1123',
      }),
    ).toBeUndefined();
  });

  it('treats props.initialValue as explicit config even when the value is undefined', () => {
    expect(
      hasOwnInitialValueConfig({
        props: {
          initialValue: undefined,
        },
      }),
    ).toBe(true);
  });

  it('detects legacy step-based default config', () => {
    expect(
      hasOwnInitialValueConfig({
        getStepParams(flowKey: string, stepKey: string) {
          if (flowKey === 'editItemSettings' && stepKey === 'initialValue') {
            return { defaultValue: 'A' };
          }
          return undefined;
        },
      }),
    ).toBe(true);
  });

  it('returns false when the form item has no explicit default config', () => {
    expect(
      hasOwnInitialValueConfig({
        props: {},
        getStepParams() {
          return undefined;
        },
      }),
    ).toBe(false);
  });
});
