/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import ScriptInstruction from '../script';
import { SCRIPT_DEFAULT_CONFIG } from '../shared';

describe('ScriptInstruction', () => {
  it('keeps the v2 instruction loader-based and preserves the default config', () => {
    const instruction = new ScriptInstruction();

    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(instruction.createDefaultConfig()).toEqual(SCRIPT_DEFAULT_CONFIG);
  });

  it('keeps the script result block menu localized through the bound translator', () => {
    const instruction = new ScriptInstruction().bindTranslate((key) => `translated:${key}`);

    expect(
      instruction.getCreateModelMenuItem({
        node: { id: 1, key: 'scriptNode', title: 'Script node' },
      }).createModelOptions.stepParams.valueSettings.init.defaultValue,
    ).toBe('translated:Script result');
  });

  it('accepts primitive-compatible type filters and rejects unrelated ones', () => {
    const instruction = new ScriptInstruction();

    expect(instruction.useVariables({ key: 'result', title: 'Result' }, { types: ['number'] })).toEqual({
      value: 'result',
      label: 'Result',
    });
    expect(
      instruction.useVariables(
        { key: 'result', title: 'Result' },
        { types: [{ type: 'reference', options: { collection: 'posts' } }] },
      ),
    ).toBeNull();
  });
});
