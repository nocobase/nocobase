/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2VariableInstruction from '../../client-v2/VariableInstruction';
import V1VariableInstruction from '../Instruction';

describe('VariableInstruction compatibility', () => {
  it('keeps the v1 node as a compatibility entry over the v2 implementation', () => {
    const instruction = new V1VariableInstruction();

    expect(instruction).toBeInstanceOf(V2VariableInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(instruction.fieldset).toBeUndefined();
  });
});
