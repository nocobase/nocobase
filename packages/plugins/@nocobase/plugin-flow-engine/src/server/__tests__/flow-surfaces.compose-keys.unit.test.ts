/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  assertFlowSurfaceComposeUniqueKeys,
  normalizeFlowSurfaceComposeKey,
  normalizeComposeActionSpec,
  normalizeComposeFieldSpec,
} from '../flow-surfaces/service-utils';

describe('flowSurfaces compose key guards', () => {
  it('should allow dotted keys and reject empty keys', () => {
    expect(normalizeFlowSurfaceComposeKey('users.table', 'flowSurfaces compose block #1')).toBe('users.table');
    expect(() => normalizeFlowSurfaceComposeKey('', 'flowSurfaces compose block #1')).toThrow('key cannot be empty');
  });

  it('should reject duplicate keys inside a compose collection', () => {
    expect(() =>
      assertFlowSurfaceComposeUniqueKeys(
        [{ key: 'viewUser' }, { key: 'viewUser' }],
        'flowSurfaces compose block #1 recordActions',
      ),
    ).toThrow("key 'viewUser' is duplicated");
  });

  it('should normalize compose actions with explicit keys', () => {
    expect(
      normalizeComposeActionSpec(
        {
          key: 'view.user',
          type: 'view',
        },
        0,
      ),
    ).toMatchObject({
      key: 'view.user',
      type: 'view',
    });
  });

  it('should derive field keys from fieldPath and reject object-style target selectors', () => {
    expect(
      normalizeComposeFieldSpec(
        {
          key: 'roles.title',
          fieldPath: 'roles.title',
        },
        0,
      ),
    ).toMatchObject({
      index: 1,
      key: 'roles.title',
      fieldPath: 'roles.title',
    });

    expect(() =>
      normalizeComposeFieldSpec(
        {
          fieldPath: 'roles.title',
          target: {
            key: 'details',
          },
        },
        0,
      ),
    ).toThrow('target must be a string block key');
  });
});
