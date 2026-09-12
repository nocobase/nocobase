/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import JSONQueryInstruction from '../JSONQueryInstruction';

describe('JSONQueryInstruction', () => {
  it('registers the v2 fieldset through a lazy loader', async () => {
    const instruction = new JSONQueryInstruction();

    expect(instruction.type).toBe('json-query');
    expect(instruction.group).toBe('calculation');
    expect(instruction.testable).toBe(true);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(instruction.createDefaultConfig()).toEqual({
      engine: 'jmespath',
      model: [],
    });

    const loaded = await instruction.FieldsetLoader();
    expect(loaded.default).toBeTypeOf('function');
  });

  it('preserves the v1 variable exposure contract', () => {
    const instruction = new JSONQueryInstruction();

    expect(
      instruction.useVariables(
        {
          key: 'node-key',
          title: 'JSON query',
          config: {
            model: [
              {
                path: 'user.name',
                alias: 'userName',
                label: 'User name',
              },
              {
                path: 'user.age',
                label: 'User age',
              },
            ],
          },
        },
        {},
      ),
    ).toEqual({
      value: 'node-key',
      label: 'JSON query',
      children: [
        {
          value: 'userName',
          label: 'User name',
        },
        {
          value: 'user.age',
          label: 'User age',
        },
      ],
    });
  });
});
