/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { normalizeAssociationFieldNames } from '../recordSelectShared';

describe('recordSelectShared normalizeAssociationFieldNames', () => {
  it('falls back to target collection title field and filterTargetKey when fieldNames are missing', () => {
    const targetCollection = {
      filterTargetKey: ['id'],
      titleCollectionField: { name: 'nickname' },
    } as any;

    expect(normalizeAssociationFieldNames(undefined, targetCollection)).toEqual({
      label: 'nickname',
      value: 'id',
    });
  });

  it('falls back to normalized filterTargetKey when title field is unavailable', () => {
    const targetCollection = {
      filterTargetKey: ['userId'],
    } as any;

    expect(normalizeAssociationFieldNames({}, targetCollection)).toEqual({
      label: 'userId',
      value: 'userId',
    });
  });

  it('keeps explicit fieldNames when provided', () => {
    const targetCollection = {
      filterTargetKey: 'id',
      titleCollectionField: { name: 'nickname' },
    } as any;

    expect(normalizeAssociationFieldNames({ label: 'title', value: 'code' }, targetCollection)).toEqual({
      label: 'title',
      value: 'code',
    });
  });

  it('treats placeholder label/value as unset and resolves to real collection fields', () => {
    const targetCollection = {
      filterTargetKey: ['id'],
      titleCollectionField: { name: 'staffname' },
    } as any;

    expect(normalizeAssociationFieldNames({ label: 'label', value: 'value' }, targetCollection)).toEqual({
      label: 'staffname',
      value: 'id',
    });
  });
});
