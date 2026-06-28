/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import V1ParallelInstruction from '../../client/ParallelInstruction';
import V2ParallelInstruction, { PARALLEL_INSTRUCTION_TYPE } from '../nodes/parallel';

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  Instruction: class {},
}));

describe('ParallelInstruction', () => {
  it('keeps the v1 node as a compatibility entry over the v2 implementation', () => {
    const instruction = new V1ParallelInstruction();

    expect(instruction).toBeInstanceOf(V2ParallelInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.ComponentLoader).toBe('function');
    expect(instruction.fieldset).toBeUndefined();
  });

  it('preserves the parallel node metadata and lazy v2 loaders', async () => {
    const instruction = new V2ParallelInstruction();

    expect(instruction.type).toBe(PARALLEL_INSTRUCTION_TYPE);
    expect(instruction.group).toBe('control');
    expect(instruction.branching).toBe(true);
    expect(instruction.createDefaultConfig()).toEqual({ mode: 'all' });

    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.ComponentLoader).toBe('function');
  });
});
