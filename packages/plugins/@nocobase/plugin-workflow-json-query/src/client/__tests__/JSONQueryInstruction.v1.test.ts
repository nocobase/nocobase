/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import JSONQueryInstruction from '../instruction';
import V2JSONQueryInstruction from '../../client-v2/JSONQueryInstruction';

describe('JSONQueryInstruction v1 compatibility', () => {
  it('keeps the v1 instruction as a compatibility entry over the v2 implementation', () => {
    const instruction = new JSONQueryInstruction();

    expect(instruction).toBeInstanceOf(V2JSONQueryInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
  });
});
