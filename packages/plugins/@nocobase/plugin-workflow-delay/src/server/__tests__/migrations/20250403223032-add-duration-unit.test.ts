/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20250403223032-add-duration-unit';

describe('20250403223032-add-duration-unit', () => {
  let app;
  let migration;
  let NodeRepo;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.version.update('1.6.0');

    migration = new Migration({ db: app.db, app } as any);

    NodeRepo = app.db.getRepository('flow_nodes');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it(`duration as null`, async () => {
    const n1 = await NodeRepo.create({
      values: {
        type: 'delay',
        config: {},
      },
    });

    await migration.up();

    const n2 = await NodeRepo.findOne({
      filterByTk: n1.id,
    });
    expect(n2.config.duration).toBeFalsy();
  });

  it(`duration as number (second)`, async () => {
    const n1 = await NodeRepo.create({
      values: {
        type: 'delay',
        config: {
          duration: 1000,
        },
      },
    });

    await migration.up();

    const n2 = await NodeRepo.findOne({
      filterByTk: n1.id,
    });
    expect(n2.config.duration).toBe(1);
    expect(n2.config.unit).toBe(1000);
  });

  it(`duration as number (day)`, async () => {
    const n1 = await NodeRepo.create({
      values: {
        type: 'delay',
        config: {
          duration: 1000 * 60 * 60 * 24 * 2,
        },
      },
    });

    await migration.up();

    const n2 = await NodeRepo.findOne({
      filterByTk: n1.id,
    });
    expect(n2.config.duration).toBe(2);
    expect(n2.config.unit).toBe(1000 * 60 * 60 * 24);
  });
});
