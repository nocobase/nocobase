/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '../application';
import { SyncAdapter } from '../sync-manager';

class MockAdapter extends SyncAdapter {
  private _ready: boolean;

  constructor({ ready = false, ...options } = {}) {
    super(options);
    this._ready = ready;
  }

  get ready() {
    return this._ready;
  }

  publish(data: Record<string, any>): void {
    return;
  }
}

describe('sync manager', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application({
      database: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
      resourcer: {
        prefix: '/api',
      },
      acl: false,
      dataWrapping: false,
      registerActions: false,
    });
  });

  afterEach(async () => {
    return app.destroy();
  });

  it('sync manager should be initialized with application', async () => {
    expect(app.syncManager).toBeDefined();
  });

  it('init adapter', async () => {
    const mockAdapter1 = new MockAdapter();
    app.syncManager.init(mockAdapter1);
    expect(() => app.syncManager.init(mockAdapter1)).toThrowError();
  });
});
