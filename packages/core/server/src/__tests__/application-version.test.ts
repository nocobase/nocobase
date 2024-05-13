/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mockServer, MockServer } from '@nocobase/test';

describe('application version', () => {
  let app: MockServer;
  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should get application version', async () => {
    app = mockServer();
    await app.db.sync();
    const appVersion = app.version;

    await appVersion.update();
    expect(await appVersion.get()).toBeDefined();
  });
});
