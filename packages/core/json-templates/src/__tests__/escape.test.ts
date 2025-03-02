/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escape } from '../escape';

describe('escape', () => {
  it('should escape array', () => {
    const list: any = [1, 2];
    list.$id = [1, '$'];
    const escaped = escape(list);
    const expected: any = [1, 2];
    expected.nocobase_dollar_id = [1, 'nocobase_dollar_'];
    expect(escaped).toEqual(expected);
  });
});
