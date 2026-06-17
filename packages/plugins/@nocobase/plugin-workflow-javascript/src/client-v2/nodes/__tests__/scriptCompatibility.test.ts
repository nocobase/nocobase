/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import V1ScriptInstruction from '../../../client/ScriptInstruction';
import { lang } from '../../../locale';
import V2ScriptInstruction from '../script';

describe('ScriptInstruction compatibility', () => {
  it('keeps the v1 instruction as a thin compatibility layer over the v2 implementation', () => {
    const instruction = new V1ScriptInstruction();

    expect(instruction).toBeInstanceOf(V2ScriptInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
  });

  it('retains the legacy initializer for script result blocks', () => {
    const instruction = new V1ScriptInstruction();

    expect(
      instruction.useInitializers({
        id: 1,
        title: 'Script node',
      }),
    ).toMatchObject({
      title: 'Script node',
      resultTitle: lang('Script result'),
    });
  });
});
