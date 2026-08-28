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
  addCheckedDatasourceId,
  getCheckedDatasourceIds,
  removeCheckedDatasourceId,
} from '../ai-employees/datasource/DatasourceSelector';

describe('DatasourceSelector checked datasource helpers', () => {
  it('derives checked datasource ids from context items', () => {
    expect(
      getCheckedDatasourceIds([
        { type: 'datasource', uid: 1, title: 'Orders' },
        { type: 'flow-model', uid: 'block-1' },
        { type: 'datasource', uid: '2', title: 'Users' },
      ]),
    ).toEqual(['1', '2']);
  });

  it('adds and removes datasource ids without mutating previous state', () => {
    const checkedIds = new Set(['1']);
    const added = addCheckedDatasourceId(checkedIds, '2');
    const removed = removeCheckedDatasourceId(added, '1');

    expect(Array.from(checkedIds)).toEqual(['1']);
    expect(Array.from(added)).toEqual(['1', '2']);
    expect(Array.from(removed)).toEqual(['2']);
  });
});
