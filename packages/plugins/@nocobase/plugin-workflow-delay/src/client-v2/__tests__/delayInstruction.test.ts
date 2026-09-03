/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V1DelayInstruction from '../../client/DelayInstruction';
import V2DelayInstruction from '../DelayInstruction';

describe('DelayInstruction', () => {
  it('keeps the v1 node as a compatibility entry over the v2 implementation', () => {
    const instruction = new V1DelayInstruction();

    expect(instruction).toBeInstanceOf(V2DelayInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(instruction.fieldset).toBeUndefined();
  });

  it('preserves the delay node metadata and lazy v2 fieldset loader', async () => {
    const instruction = new V2DelayInstruction();

    expect(instruction.type).toBe('delay');
    expect(instruction.group).toBe('control');
    expect(instruction.async).toBe(true);

    const module = await instruction.FieldsetLoader?.();

    expect(typeof module?.default).toBe('function');
  });
});
