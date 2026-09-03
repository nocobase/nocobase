/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { SequenceRulesConfigureField } from '../SequenceRulesConfigureField';
import { SequenceFieldInterface } from '../interface';

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
  useT: () => (value: string) => value,
}));

describe('SequenceFieldInterface', () => {
  it('defines sequence field schema, configuration and visibility rules', () => {
    const fieldInterface = new SequenceFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'sequence',
      type: 'object',
      group: 'advanced',
      order: 3,
      title: 'Sequence',
      sortable: true,
      default: {
        interface: 'sequence',
        type: 'sequence',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          'x-component-props': {},
        },
      },
      availableTypes: ['sequence'],
      hasDefaultValue: false,
      filterable: {
        operators: 'string',
      },
      titleUsable: true,
    });

    expect(fieldInterface.configure.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'unique',
          component: 'Checkbox',
        }),
        expect.objectContaining({
          name: 'patterns',
          required: true,
          Component: SequenceRulesConfigureField,
          defaultValue: [{ type: 'integer', options: { digits: 4, start: 1 } }],
        }),
        expect.objectContaining({
          name: 'inputable',
          component: 'Checkbox',
        }),
        expect.objectContaining({
          name: 'match',
          component: 'Checkbox',
        }),
      ]),
    );

    const patternsItem = fieldInterface.configure.items.find((item) => item.name === 'patterns');
    const ruleTypes = patternsItem?.componentProps?.ruleTypes;
    expect(ruleTypes.map((item) => item.value)).toEqual(['string', 'randomChar', 'integer', 'date']);
    expect(ruleTypes.find((item) => item.value === 'integer')?.defaults).toEqual({ digits: 4, start: 1 });
    expect(ruleTypes.find((item) => item.value === 'randomChar')?.fields[1]).toMatchObject({
      name: 'charsets',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        allowClear: false,
      },
      required: true,
    });

    const matchItem = fieldInterface.configure.items.find((item) => item.name === 'match');
    expect(matchItem?.hidden?.({ values: { inputable: false } })).toBe(true);
    expect(matchItem?.hidden?.({ values: { inputable: true } })).toBe(false);
  });
});
