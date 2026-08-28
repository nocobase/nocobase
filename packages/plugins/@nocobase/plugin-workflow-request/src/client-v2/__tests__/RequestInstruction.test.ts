/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import RequestInstruction from '../RequestInstruction';

describe('RequestInstruction', () => {
  it('loads the v2 fieldset lazily and keeps the legacy fieldset empty', async () => {
    const instruction = new RequestInstruction();

    expect(instruction.fieldset).toBeUndefined();
    expect(typeof instruction.FieldsetLoader).toBe('function');

    const module = await instruction.FieldsetLoader?.();

    expect(typeof module?.default).toBe('function');
  });
});
