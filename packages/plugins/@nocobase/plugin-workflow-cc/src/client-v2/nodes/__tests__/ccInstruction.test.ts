/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V1CCInstruction from '../../../client/instruction';
import V2CCInstruction from '../cc';

describe('CCInstruction client-v2', () => {
  it('keeps the v1 instruction as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1CCInstruction();

    expect(instruction).toBeInstanceOf(V2CCInstruction);
    expect(instruction.fieldset).toBeUndefined();
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(instruction.type).toBe('cc');
    expect(instruction.group).toBe('manual');
  });

  it('exposes lazy v2 drawer and keeps node metadata aligned with v1', async () => {
    const instruction = new V2CCInstruction();
    const module = await instruction.FieldsetLoader?.();

    expect(module?.default).toBeTypeOf('function');
    expect(instruction.title).toContain('CC');
    expect(instruction.description).toContain('Provide a CC (carbon copy) feature');
    expect(instruction.icon).toBeTruthy();
  });
});
