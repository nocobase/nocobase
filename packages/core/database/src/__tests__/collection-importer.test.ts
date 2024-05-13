/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ImporterReader } from '../collection-importer';
import * as path from 'path';
import { extend } from '../database';

describe('collection importer', () => {
  test('import reader', async () => {
    const reader = new ImporterReader(path.resolve(__dirname, './fixtures/collections'));

    const modules = await reader.read();

    const posts = modules.find((m) => m.name === 'posts');

    expect(posts).toMatchObject({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    posts.schema = 'test';

    const modules2 = await reader.read();
    const posts2 = modules2.find((m) => m.name === 'posts');
    expect(posts2.schema).toBeFalsy();
  });

  test('extend', async () => {
    const extendObject = extend({
      name: 'tags',
      fields: [{ type: 'string', name: 'title' }],
    });

    expect(extendObject).toHaveProperty('extend');
  });
});
