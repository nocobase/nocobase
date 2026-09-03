/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2UpdateInstruction from '../update';
import V1UpdateInstruction from '../../../client/nodes/update';

describe('UpdateInstruction', () => {
  it('keeps the v1 node as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1UpdateInstruction();

    expect(instruction).toBeInstanceOf(V2UpdateInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.PresetFieldsetLoader).toBe('function');
  });

  it('uses values-only assignment config by default', () => {
    const instruction = new V2UpdateInstruction();

    expect(instruction.createDefaultConfig()).toEqual({});
  });

  it('does not expose updated records as downstream association sources', () => {
    const instruction = new V2UpdateInstruction();

    expect(instruction.useTempAssociationSource()).toBeNull();
  });
});
