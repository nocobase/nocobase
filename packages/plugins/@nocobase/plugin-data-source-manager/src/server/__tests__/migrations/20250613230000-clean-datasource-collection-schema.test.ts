/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20250613230000-clean-datasource-collection-schema';

describe('clean datasource collection schema', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.version.update('1.7.10');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('migration', async () => {
    await app.db.getRepository('dataSourcesCollections').model.bulkCreate([
      {
        key: '72pj4jp1ojk',
        name: 'v_t1',
        options: {
          title: 'v_t1',
          tableName: 'v_t1',
          timestamps: false,
          view: true,
          template: 'view',
          introspected: true,
          schema: "{{$deps[0].split('@')?.[0]}}",
          viewName: "{{$deps[0].split('@')?.[1]}}",
          filterTargetKey: ['aid'],
          description: '000111222333444',
        },
        data_source_key: 'pg',
      },
      {
        key: '72pj4jp1ojj',
        name: 'v_t1',
        options: {
          title: 'v_t1',
          tableName: 'v_t1',
          timestamps: false,
          view: true,
          template: 'view',
          introspected: true,
          schema: 'public',
          viewName: 'hjkl',
          filterTargetKey: ['aid'],
          description: '000111222333444',
        },
        data_source_key: 'pg123',
      },
    ]);

    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
    });
    await migration.up();
    const newInstance = await app.db.getRepository('dataSourcesCollections').findOne({
      where: {
        key: '72pj4jp1ojk',
      },
    });
    expect(newInstance.options.schema).toBe('');
    expect(newInstance.options.viewName).toBe('');
  });
});
