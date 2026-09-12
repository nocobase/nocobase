/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import LoopInstruction, { LOOP_DEFAULT_CONDITION } from '../loop';

describe('LoopInstruction', () => {
  it('exposes lazy loaders and default config', () => {
    const instruction = new LoopInstruction();

    expect(instruction.type).toBe('loop');
    expect(instruction.branching).toBe(true);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.ComponentLoader).toBe('function');
    expect(instruction.createDefaultConfig()).toEqual({
      target: 1,
      condition: false,
      exit: 0,
    });
  });

  it('keeps the default condition payload stable', () => {
    expect(LOOP_DEFAULT_CONDITION).toEqual({
      checkpoint: 0,
      continueOnFalse: false,
      calculation: {
        group: {
          type: 'and',
          calculations: [],
        },
      },
    });
  });
});
