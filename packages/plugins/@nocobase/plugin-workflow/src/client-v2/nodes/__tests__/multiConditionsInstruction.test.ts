/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2MultiConditionsInstruction from '../multi-conditions';
import V1MultiConditionsInstruction from '../../../client/nodes/multi-conditions';
import { MULTI_CONDITION_BRANCH_INDEX } from '../components/multiConditionsShared';

describe('MultiConditionsInstruction', () => {
  it('creates the v1-compatible default config', () => {
    const instruction = new V2MultiConditionsInstruction();
    const config = instruction.createDefaultConfig?.();

    expect(config).toEqual({
      conditions: [{ uid: expect.any(String) }],
      continueOnNoMatch: false,
    });
  });

  it('keeps the branching metadata needed by add-node downstream placement', () => {
    const instruction = new V2MultiConditionsInstruction();

    expect(instruction.branching).toEqual([
      { label: '{{t("First condition", { ns: "workflow" })}}', value: MULTI_CONDITION_BRANCH_INDEX.DEFAULT },
      { label: '{{t("Otherwise", { ns: "workflow" })}}', value: MULTI_CONDITION_BRANCH_INDEX.OTHERWISE },
    ]);
  });

  it('lets the v1 node inherit the v2 loaders as a thin compatibility entry', () => {
    const instruction = new V1MultiConditionsInstruction();

    expect(instruction).toBeInstanceOf(V2MultiConditionsInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.ComponentLoader).toBe('function');
  });
});
