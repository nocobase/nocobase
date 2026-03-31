/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import QueryInstruction from '../nodes/query';

describe('temp association source hook', () => {
  it('returns null when query node uses multiple', () => {
    const instruction = new QueryInstruction();
    const source = instruction.useTempAssociationSource({
      id: 1,
      key: 'node1',
      config: {
        collection: 'posts',
        multiple: true,
      },
    });
    expect(source).toBeNull();
  });
});
