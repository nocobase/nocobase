/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import ResponseMessageInstruction from '../nodes/response-message';

describe('ResponseMessageInstruction', () => {
  it('uses a v2 loader-based fieldset without a legacy schema fieldset', async () => {
    const instruction = new ResponseMessageInstruction();

    expect(instruction.type).toBe('response-message');
    expect(instruction.group).toBe('extended');
    expect(instruction.fieldset).toBeUndefined();
    expect(typeof instruction.FieldsetLoader).toBe('function');

    const module = await instruction.FieldsetLoader?.();

    expect(typeof module?.default).toBe('function');
  });

  it('keeps the v1 availability rule', () => {
    const instruction = new ResponseMessageInstruction();

    expect(instruction.isAvailable?.({ workflow: { type: 'request-interception' } } as any)).toBe(true);
    expect(instruction.isAvailable?.({ workflow: { type: 'action', sync: true } } as any)).toBe(true);
    expect(instruction.isAvailable?.({ workflow: { type: 'action', sync: false } } as any)).toBe(false);
  });
});
