/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '../../app-supervisor';

describe('AppSupervisor app-sso issuer bridge', () => {
  afterEach(async () => {
    await AppSupervisor.getInstance().destroy();
  });

  it('stores normalized app-sso issuer values', () => {
    const supervisor = AppSupervisor.getInstance();

    supervisor.setAppSsoIssuer(' https://main.example.com/api/ ');

    expect(supervisor.getAppSsoIssuer()).toBe('https://main.example.com/api');
  });

  it('clears blank app-sso issuer values', () => {
    const supervisor = AppSupervisor.getInstance();

    supervisor.setAppSsoIssuer('https://main.example.com/api');
    supervisor.setAppSsoIssuer('   ');

    expect(supervisor.getAppSsoIssuer()).toBeUndefined();
  });
});
