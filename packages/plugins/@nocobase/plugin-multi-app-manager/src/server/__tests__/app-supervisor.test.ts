/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { PluginMultiAppManagerServer } from '../server';

AppSupervisor.prototype.initApp = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

describe('App Supervisor', () => {
  let appSupervisor: AppSupervisor;

  beforeEach(() => {
    PluginMultiAppManagerServer.staticImport();
    appSupervisor = AppSupervisor.getInstance();
  });

  afterEach(async () => {
    await appSupervisor.destroy();
  });

  it('should get application initializing status', async () => {
    expect(await appSupervisor.getAppStatus('test')).toBeFalsy();

    appSupervisor.getApp('test');

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await appSupervisor.getAppStatus('test')).toBe('initializing');

    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(await appSupervisor.getAppStatus('test')).toBe('not_found');
  });
});
