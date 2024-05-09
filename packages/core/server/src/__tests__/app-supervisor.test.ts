/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '../app-supervisor';

describe('App Supervisor', () => {
  let appSupervisor: AppSupervisor;

  beforeEach(() => {
    appSupervisor = AppSupervisor.getInstance();
  });

  afterEach(async () => {
    await appSupervisor.destroy();
  });

  it('should get application initializing status', async () => {
    expect(appSupervisor.getAppStatus('test')).toBe(undefined);

    appSupervisor.setAppBootstrapper(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    appSupervisor.getApp('test');

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(appSupervisor.getAppStatus('test')).toBe('initializing');

    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(appSupervisor.getAppStatus('test')).toBe('not_found');
  });
});
