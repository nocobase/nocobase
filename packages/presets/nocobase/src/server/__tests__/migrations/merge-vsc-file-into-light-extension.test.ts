/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import Migration from '../../migrations/20260720143000-merge-vsc-file-into-light-extension';

describe('merge VSC File into Light Extension', () => {
  let app: MockServer;
  let repository: Repository;

  beforeEach(async () => {
    app = await createMockServer({ version: '2.2.0-beta.15' });
    repository = app.db.getRepository('applicationPlugins');
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('retires VSC File while preserving the Light Extension enabled state', async () => {
    await repository.create({
      values: {
        name: 'vsc-file',
        packageName: '@nocobase/plugin-vsc-file',
        enabled: true,
        installed: true,
        builtIn: true,
      },
    });
    await repository.create({
      values: {
        name: 'light-extension',
        packageName: '@nocobase/plugin-light-extension',
        enabled: true,
        installed: true,
        builtIn: true,
      },
    });

    const migration = new Migration({ app } as never);
    await migration.up();

    const vscFile = await repository.findOne({ filter: { name: 'vsc-file' } });
    const lightExtension = await repository.findOne({ filter: { name: 'light-extension' } });

    expect(vscFile.toJSON()).toMatchObject({ enabled: false, builtIn: false });
    expect(lightExtension.toJSON()).toMatchObject({ enabled: true, builtIn: false });
  });
});
