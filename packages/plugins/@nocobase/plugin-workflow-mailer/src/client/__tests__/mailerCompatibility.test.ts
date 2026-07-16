/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import V1MailerInstruction from '../MailerInstruction';
import V2MailerInstruction from '../../client-v2/MailerInstruction';

describe('MailerInstruction compatibility', () => {
  it('keeps the v1 instruction as a thin compatibility layer over the v2 implementation', () => {
    const instruction = new V1MailerInstruction();

    expect(instruction).toBeInstanceOf(V2MailerInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(instruction.fieldset).toBeUndefined();
  });
});
