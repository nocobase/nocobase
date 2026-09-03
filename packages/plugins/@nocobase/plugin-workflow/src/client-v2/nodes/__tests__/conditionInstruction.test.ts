/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2ConditionInstruction from '../condition';
import V1ConditionInstruction from '../../../client/nodes/condition';

describe('ConditionInstruction', () => {
  it('keeps the v1 node as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1ConditionInstruction();

    expect(instruction).toBeInstanceOf(V2ConditionInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.PresetFieldsetLoader).toBe('function');
    expect(typeof instruction.ComponentLoader).toBe('function');
  });
});
