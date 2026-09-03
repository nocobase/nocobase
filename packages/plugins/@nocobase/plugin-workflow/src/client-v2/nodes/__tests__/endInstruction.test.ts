/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2EndInstruction from '../end';
import V1EndInstruction from '../../../client/nodes/end';

describe('EndInstruction', () => {
  it('keeps the v1 node as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1EndInstruction();

    expect(instruction).toBeInstanceOf(V2EndInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
  });

  it('preserves the v1 metadata in the v2 instruction', () => {
    const instruction = new V2EndInstruction();

    expect(instruction.type).toBe('end');
    expect(instruction.group).toBe('control');
    expect(instruction.description).toBe('{{t("End the process immediately, with set status.", { ns: "workflow" })}}');
    expect(instruction.end).toBe(true);
  });
});
