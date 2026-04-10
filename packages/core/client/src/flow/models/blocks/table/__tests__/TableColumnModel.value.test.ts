/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { resolveTableColumnReadPrettyValue } from '../TableColumnModel';

describe('TableColumnModel readPretty value resolving', () => {
  it('keeps association object when rendered field path matches the table column field', () => {
    const value = { id: 1, nickname: 'Alice' };

    expect(resolveTableColumnReadPrettyValue(value, 'user', 'user')).toBe(value);
  });

  it('reads relative title-field value from association object', () => {
    expect(resolveTableColumnReadPrettyValue({ id: 1, nickname: 'Alice' }, 'user', 'nickname')).toBe('Alice');
  });

  it('reads nested title-field value from absolute association path', () => {
    expect(resolveTableColumnReadPrettyValue({ profile: { nickname: 'Alice' } }, 'user', 'user.profile.nickname')).toBe(
      'Alice',
    );
  });

  it('falls back to the original cell value when nested title-field data is missing', () => {
    const value = { id: 1 };

    expect(resolveTableColumnReadPrettyValue(value, 'user', 'nickname')).toBe(value);
  });
});
