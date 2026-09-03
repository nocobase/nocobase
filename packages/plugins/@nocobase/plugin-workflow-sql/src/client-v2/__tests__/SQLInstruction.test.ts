/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2SQLInstruction from '../SQLInstruction';
import V1SQLInstruction from '../../client/SQLInstruction';

describe('SQLInstruction', () => {
  it('keeps the v1 node as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1SQLInstruction();

    expect(instruction).toBeInstanceOf(V2SQLInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
  });

  it('preserves the SQL node variable option shape', () => {
    const instruction = new V2SQLInstruction();

    expect(instruction.useVariables({ key: 'n1', title: 'SQL action' })).toEqual({
      value: 'n1',
      label: 'SQL action',
    });
  });

  it('preserves the v1 default data source', () => {
    const instruction = new V2SQLInstruction();

    expect(instruction.createDefaultConfig()).toEqual({
      dataSource: 'main',
    });
  });
});
