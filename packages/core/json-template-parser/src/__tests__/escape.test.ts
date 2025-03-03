/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { isEqual } from 'lodash';
import { escape, revertEscape } from '../escape';

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

describe('escapeSpecialChars', () => {
  it('should escape special chars', () => {
    expect(escape('$@')).toEqual('nocobase_dollar_nocobase_at_');
    expect(escape('$')).toEqual('nocobase_dollar_');
    expect(escape('@')).toEqual('nocobase_at_');
    expect(escape({ '@': { $: '$' } })).toEqual({ nocobase_at_: { nocobase_dollar_: 'nocobase_dollar_' } });
  });
});

describe('revertEscapeSpecialChars', () => {
  it('should escape special chars', () => {
    expect(escape('$@')).toEqual('nocobase_dollar_nocobase_at_');
    expect(escape('$')).toEqual('nocobase_dollar_');
    expect(escape('@')).toEqual('nocobase_at_');
    const equaled = isEqual(escape({ '@': { $: '$' } }), { nocobase_at_: { nocobase_dollar_: 'nocobase_dollar_' } });
    expect(equaled).toBe(true);
  });
});

describe('reverseEscape', () => {
  it('should reverse escaped special chars', () => {
    expect(revertEscape('nocobase_dollar_nocobase_at_')).toEqual('$@');
    expect(revertEscape('nocobase_dollar_')).toEqual('$');
    expect(revertEscape('nocobase_at_')).toEqual('@');
    const reverted = revertEscape({ nocobase_at_: { nocobase_dollar_: 'nocobase_dollar_' } });
    const equaled = isEqual(reverted, {
      '@': { $: '$' },
    });
    expect(equaled).toBe(true);
  });
});
