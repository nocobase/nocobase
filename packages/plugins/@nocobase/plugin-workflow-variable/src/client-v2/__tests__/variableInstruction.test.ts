/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2VariableInstruction from '../VariableInstruction';

describe('VariableInstruction', () => {
  it('preserves the variable node metadata and lazy v2 fieldset loader', async () => {
    const instruction = new V2VariableInstruction();

    expect(instruction.type).toBe('variable');
    expect(instruction.group).toBe('control');

    const module = await instruction.FieldsetLoader?.();

    expect(typeof module?.default).toBe('function');
  });

  it('only exposes declaring variable nodes as workflow variables', () => {
    const instruction = new V2VariableInstruction();

    expect(
      instruction.useVariables({
        key: 'var1',
        title: 'Variable 1',
        config: {
          target: null,
        },
      }),
    ).toEqual({
      value: 'var1',
      label: 'Variable 1',
    });

    expect(
      instruction.useVariables({
        key: 'var2',
        title: 'Variable 2',
        config: {
          target: 'var1',
        },
      }),
    ).toBeNull();
  });
});
