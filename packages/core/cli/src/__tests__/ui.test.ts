/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';
import { renderTable } from '../lib/ui.js';

function displayWidth(value: string) {
  return Array.from(value).reduce((width, character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return width + (codePoint >= 0x2e80 && codePoint <= 0x9fff ? 2 : 1);
  }, 0);
}

test('renderTable aligns columns with Chinese headers', () => {
  const table = renderTable(
    ['名称', '显示名', 'Base', '启用', '本地已同步'],
    [
      ['aaa', 'aaa', '/x/aaa/', 'yes', 'no'],
      ['admin', 'Admin', '/x/admin/', 'yes', 'no'],
      ['cba', 'Cba', '/x/cba/', 'yes', 'yes'],
    ],
  );
  const lines = table.split('\n');
  const baseColumnStarts = [
    displayWidth(lines[0].slice(0, lines[0].indexOf('Base'))),
    displayWidth(lines[2].slice(0, lines[2].indexOf('/x/aaa/'))),
    displayWidth(lines[3].slice(0, lines[3].indexOf('/x/admin/'))),
    displayWidth(lines[4].slice(0, lines[4].indexOf('/x/cba/'))),
  ];

  expect(baseColumnStarts).toEqual([15, 15, 15, 15]);
  expect(lines[1]).toContain('----');
});
