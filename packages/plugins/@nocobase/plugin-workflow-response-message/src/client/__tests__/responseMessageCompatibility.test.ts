/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import V1ResponseMessageInstruction from '../ResponseMessageInstruction';
import V2ResponseMessageInstruction from '../../client-v2/nodes/response-message';

describe('ResponseMessageInstruction compatibility', () => {
  it('keeps the v1 instruction as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1ResponseMessageInstruction();

    expect(instruction).toBeInstanceOf(V2ResponseMessageInstruction);
    expect(instruction.fieldset).toBeUndefined();
    expect(typeof instruction.FieldsetLoader).toBe('function');
  });
});
