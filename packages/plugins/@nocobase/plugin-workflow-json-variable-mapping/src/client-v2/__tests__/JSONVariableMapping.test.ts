/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import JSONVariableMappingInstruction from '../JSONVariableMapping';

describe('JSONVariableMappingInstruction', () => {
  it('registers the v2 fieldset through a lazy loader', async () => {
    const instruction = new JSONVariableMappingInstruction();

    expect(instruction.type).toBe('json-variable-mapping');
    expect(instruction.group).toBe('control');
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(instruction.createDefaultConfig()).toEqual({
      parseArray: false,
      variables: [],
    });

    const loaded = await instruction.FieldsetLoader();
    expect(loaded.default).toBeTypeOf('function');
  });

  it('preserves the v1 variable exposure contract', () => {
    const instruction = new JSONVariableMappingInstruction();

    expect(
      instruction.useVariables(
        {
          key: 'node-key',
          title: 'JSON mapper',
          config: {
            variables: [
              {
                key: 'field-1',
                path: 'user.name',
                alias: 'User name',
              },
              {
                key: 'field-2',
                path: 'user.age',
              },
            ],
          },
        },
        {},
      ),
    ).toEqual({
      value: 'node-key',
      label: 'JSON mapper',
      children: [
        {
          isLeaf: true,
          label: 'User name',
          value: 'field-1',
          key: 'field-1',
        },
        {
          isLeaf: true,
          label: 'user.age',
          value: 'field-2',
          key: 'field-2',
        },
      ],
    });
  });
});
