/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, MockDatabase } from '@nocobase/database';
import { SourceManager } from '../source-manager';

describe('source-manager', async () => {
  let sourceManager: SourceManager;
  let db: MockDatabase;

  beforeEach(async () => {
    sourceManager = new SourceManager();
    db = await createMockDatabase();
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await db.close();
  });

  it('sync', async () => {
    const spy = vi.fn();
    sourceManager.registerSource('test', {
      title: 'Test',
      sync: spy,
    });
    await sourceManager.sync({} as any, []);
    expect(spy).toBeCalledTimes(0);
    await sourceManager.sync({} as any, ['test']);
    expect(spy).toBeCalledTimes(1);
  });

  it('handle texts saved', async () => {
    db.collection({
      name: 'test',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
      ],
    });
    await db.sync();
    sourceManager.registerSource('test', {
      title: 'Test',
      sync: async () => ({}),
      namespace: 'test',
      collections: [
        {
          collection: 'test',
          fields: ['title'],
        },
      ],
    });
    const spy = vi.fn();
    sourceManager.handleTextsSaved(db, async (texts) => spy(texts));
    await db.getRepository('test').create({ values: { title: 'Test' } });
    expect(spy).toBeCalledWith([{ text: 'Test', module: 'resources.test' }]);
  });
});
