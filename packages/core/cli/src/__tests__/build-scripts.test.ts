/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from 'vitest';

test('build script copies locale JSON files into dist/locale', async () => {
  const packageRoot = path.resolve(__dirname, '..', '..');
  const sourceLocale = path.join(packageRoot, 'src', 'locale', 'en-US.json');
  const distLocale = path.join(packageRoot, 'dist', 'locale', 'en-US.json');

  const [sourceContent, distContent] = await Promise.all([
    fsp.readFile(sourceLocale, 'utf8'),
    fsp.readFile(distLocale, 'utf8'),
  ]);

  expect(distContent).toBe(sourceContent);
});
