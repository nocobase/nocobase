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
  normalizeFlowSurfaceComposeRef,
  normalizeComposeActionSpec,
  normalizeComposeFieldSpec,
} from '../flow-surfaces/service-utils';

describe('flowSurfaces compose ref guards', () => {
  it('should allow dotted refs and reject empty refs', () => {
    expect(normalizeFlowSurfaceComposeRef('users.table', 'flowSurfaces compose block #1')).toBe('users.table');
    expect(() => normalizeFlowSurfaceComposeRef('', 'flowSurfaces compose block #1')).toThrow('ref cannot be empty');
  });

  it('should reject duplicate refs inside a compose collection', () => {
    expect(() =>
      assertFlowSurfaceComposeUniqueKeys(
        [{ ref: 'viewUser' }, { ref: 'viewUser' }],
        'flowSurfaces compose block #1 recordActions',
      ),
    ).toThrow("ref 'viewUser' is duplicated");
  });

  it('should reject compose actions that still use key', () => {
    expect(() =>
      normalizeComposeActionSpec(
        {
          key: 'view.user',
          type: 'view',
        },
        0,
      ),
    ).toThrow('does not support key, use ref instead');
  });

  it('should allow dotted field refs and reject legacy key fields', () => {
    expect(
      normalizeComposeFieldSpec(
        {
          ref: 'roles.title',
          fieldPath: 'roles.title',
        },
        0,
      ),
    ).toMatchObject({
      index: 1,
      ref: 'roles.title',
      fieldPath: 'roles.title',
    });

    expect(() =>
      normalizeComposeFieldSpec(
        {
          key: 'roles.title',
          fieldPath: 'roles.title',
        },
        0,
      ),
    ).toThrow('does not support key, use ref instead');
  });
});
