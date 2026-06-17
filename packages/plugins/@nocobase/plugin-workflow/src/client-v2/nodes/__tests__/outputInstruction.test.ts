/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2OutputInstruction from '../output';
import V1OutputInstruction from '../../../client/nodes/output';

describe('OutputInstruction', () => {
  it('keeps the v1 node as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1OutputInstruction();

    expect(instruction).toBeInstanceOf(V2OutputInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
  });

  it('preserves the v1 metadata in the v2 instruction', () => {
    const instruction = new V2OutputInstruction();

    expect(instruction.type).toBe('output');
    expect(instruction.group).toBe('control');
    expect(instruction.description).toBe(
      '{{t("Set output data of this workflow. When this one is executed as a subflow, the output could be used as variables in downstream nodes of super workflow. You can also use this node in an AI employee workflow, to define what to output. If this node is added multiple times, the value of the last executed node prevails.", { ns: "workflow" })}}',
    );
  });
});
