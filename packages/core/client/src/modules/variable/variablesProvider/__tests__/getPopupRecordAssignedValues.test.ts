/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { CURRENT_POPUP_RECORD_VARIABLE, getPopupRecordAssignedValues } from '../getPopupRecordAssignedValues';

describe('getPopupRecordAssignedValues', () => {
  it('prefills the highest-priority relation field targeting the current popup collection', () => {
    expect(
      getPopupRecordAssignedValues({
        collectionName: 'comments',
        popupCollectionName: 'roles',
        collectionFields: [
          { name: 'author', target: 'users', type: 'belongsTo' } as any,
          { name: 'roleComments', target: 'roles', type: 'hasMany' } as any,
          { name: 'role', target: 'roles', type: 'belongsTo' } as any,
        ],
      }),
    ).toEqual({
      role: CURRENT_POPUP_RECORD_VARIABLE,
    });
  });

  it('returns empty values when the popup collection matches the target collection', () => {
    expect(
      getPopupRecordAssignedValues({
        collectionName: 'comments',
        popupCollectionName: 'comments',
        collectionFields: [{ name: 'parent', target: 'comments', type: 'belongsTo' } as any],
      }),
    ).toEqual({});
  });

  it('returns empty values when no relation field targets the popup collection', () => {
    expect(
      getPopupRecordAssignedValues({
        collectionName: 'comments',
        popupCollectionName: 'roles',
        collectionFields: [{ name: 'author', target: 'users', type: 'belongsTo' } as any],
      }),
    ).toEqual({});
  });
});
