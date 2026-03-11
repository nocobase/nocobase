/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildDisplaySubListForkKey, normalizeFieldIndexChain } from '../displaySubListUtils';

describe('DisplaySubListFieldModel utils', () => {
  it('should preserve index 0 in field index chain', () => {
    const result = normalizeFieldIndexChain([0, 'org_o2m:0', '', null, undefined]);
    expect(result).toEqual(['0', 'org_o2m:0']);
  });

  it('should generate different fork keys for different parent index chains', () => {
    const key1 = buildDisplaySubListForkKey({
      parentFieldIndex: ['org_o2m:0'],
      index: 0,
      blockPage: 1,
    });
    const key2 = buildDisplaySubListForkKey({
      parentFieldIndex: ['org_o2m:1'],
      index: 0,
      blockPage: 1,
    });
    expect(key1).not.toBe(key2);
  });

  it('should generate stable root key when parent index chain is empty', () => {
    const key = buildDisplaySubListForkKey({
      parentFieldIndex: [],
      index: 0,
      blockPage: 1,
    });
    expect(key).toBe('row_root_0_1');
  });
});
