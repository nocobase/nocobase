/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import Application from '../application';
import { Plugin } from '../plugin';
import { mockServer } from '@nocobase/test';

describe('application life cycle', () => {
  let app: Application;

  beforeEach(async () => {
    app = mockServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should start application', async () => {
    const loadFn = vi.fn();
    const installFn = vi.fn();

    // register plugin
    class TestPlugin extends Plugin {
      beforeLoad() {}

      getName() {
        return 'Test';
      }

      async load() {
        loadFn();
        this.app.on('beforeInstall', () => {
          installFn();
        });
      }
    }
    app.plugin(TestPlugin);
    await app.load();
    expect(loadFn).toHaveBeenCalledTimes(1);
    expect(installFn).toHaveBeenCalledTimes(0);
    await app.install();
    expect(installFn).toHaveBeenCalledTimes(1);
  });
});
