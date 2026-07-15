/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { generateClientSettingsTypes } from '../typegen';

describe('light extension settings typegen multi Entry isolation', () => {
  it('isolates the same key across kinds and reports duplicates within one kind', () => {
    const result = generateClientSettingsTypes({
      files: [
        entry('js-blocks', 'one', 'shared', 'title'),
        entry('js-actions', 'two', 'shared', 'confirm'),
        entry('js-blocks', 'duplicate', 'shared', 'other'),
      ],
    });

    expect(result.entries.map((item) => item.entryKey)).toEqual(['client/js-action/shared', 'client/js-block/shared']);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: 'settings_typegen_entry_key_duplicate', kind: 'js-block' }),
    ]);
    const block = result.files.find((file) => file.path.includes('/js-block/shared.d.ts'))?.content || '';
    const action = result.files.find((file) => file.path.includes('/js-action/shared.d.ts'))?.content || '';
    expect(block).toContain('other?: string;');
    expect(block).not.toContain('title');
    expect(block).not.toContain('confirm');
    expect(action).toContain('confirm?: string;');
    expect(action).not.toContain('title');
  });
});

function entry(kindRoot: string, directoryName: string, key: string, propertyName: string) {
  return {
    path: `src/client/${kindRoot}/${directoryName}/entry.json`,
    content: JSON.stringify({
      key,
      settings: { [propertyName]: { type: 'string' } },
    }),
  };
}
