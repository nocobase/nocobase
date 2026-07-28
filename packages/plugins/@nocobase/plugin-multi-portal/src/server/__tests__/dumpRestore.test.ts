/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import { Dumper } from '../../../../plugin-backup-restore/src/server/dumper';
import { Restorer } from '../../../../plugin-backup-restore/src/server/restorer';

describe('Multi Portal dump and restore', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'error-handler',
        'users',
        'auth',
        'client',
        'field-sort',
        'acl',
        'ui-schema-storage',
        'system-settings',
        'data-source-main',
        'data-source-manager',
        'ui-layout',
        'multi-portal',
        'collection-sql',
        'backup-restore',
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('preserves routePermissionMode without deriving it from the Portal UID', async () => {
    const portalUid = 'admin-layout-model';
    await app.db.getRepository('multiPortals').update({
      filterByTk: portalUid,
      values: {
        routePermissionMode: 'layout',
      },
    });
    const dumper = new Dumper(app);
    const dump = await dumper.dump({
      groups: new Set(['required']),
    });

    await app.db.getRepository('multiPortals').update({
      filterByTk: portalUid,
      values: {
        routePermissionMode: 'portal',
      },
    });
    const restorer = new Restorer(app, {
      backUpFilePath: dump.filePath,
    });

    await restorer.restore({
      groups: new Set(['required']),
    });

    const restoredPortal = await app.db.getRepository('multiPortals').findOne({
      filterByTk: portalUid,
      fields: ['uid', 'routePermissionMode'],
    });
    expect(restoredPortal?.get('routePermissionMode')).toBe('layout');
  });
});
