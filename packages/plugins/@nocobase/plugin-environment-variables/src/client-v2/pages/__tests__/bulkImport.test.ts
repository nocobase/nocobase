/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { parseBulkImportText } from '../bulkImport';

describe('parseBulkImportText', () => {
  it('reports invalid names instead of silently dropping them', () => {
    expect(parseBulkImportText('=invalid-empty-name\n123=456', 'default')).toEqual({
      items: [],
      errors: [
        { code: 'emptyName', line: 1 },
        { code: 'invalidName', line: 2 },
      ],
    });
  });

  it('reports malformed lines and empty values', () => {
    expect(parseBulkImportText('FOO\nBAR=', 'secret')).toEqual({
      items: [],
      errors: [
        { code: 'missingSeparator', line: 1 },
        { code: 'emptyValue', line: 2 },
      ],
    });
  });

  it('preserves equals signs in values and ignores blank lines', () => {
    expect(parseBulkImportText('\n FOO = a=b=c \r\n\nBAR=123\n', 'default')).toEqual({
      items: [
        { name: 'FOO', value: 'a=b=c', type: 'default' },
        { name: 'BAR', value: '123', type: 'default' },
      ],
      errors: [],
    });
  });
});
