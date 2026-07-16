/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2DestroyInstruction from '../destroy';
import V1DestroyInstruction from '../../../client/nodes/destroy';

describe('DestroyInstruction', () => {
  it('keeps the v1 node as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1DestroyInstruction();

    expect(instruction).toBeInstanceOf(V2DestroyInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.PresetFieldsetLoader).toBe('function');
  });

  it('preserves the v1 metadata in the v2 instruction', () => {
    const instruction = new V2DestroyInstruction();

    expect(instruction.type).toBe('destroy');
    expect(instruction.group).toBe('collection');
    expect(instruction.description).toBe(
      '{{t("Delete records of a collection. Could use variables in workflow context as filter. All records match the filter will be deleted.", { ns: "workflow" })}}',
    );
  });

  it('does not expose deleted records as downstream association sources', () => {
    const instruction = new V2DestroyInstruction();

    expect(instruction.useTempAssociationSource()).toBeNull();
  });
});
