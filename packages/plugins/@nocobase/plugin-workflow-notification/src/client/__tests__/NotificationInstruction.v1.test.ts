/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import NotificationInstruction from '../NotificationInstruction';

describe('NotificationInstruction v1 compatibility', () => {
  it('reuses the v2 fieldset loader for the v1 workflow drawer', () => {
    const instruction = new NotificationInstruction();

    expect(instruction.fieldset).toBeUndefined();
    expect(typeof instruction.FieldsetLoader).toBe('function');
  });
});
