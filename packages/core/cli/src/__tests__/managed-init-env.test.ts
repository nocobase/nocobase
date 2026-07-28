/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';
import { buildInitAppEnvVarsFromConfig } from '../lib/managed-init-env';

test('buildInitAppEnvVarsFromConfig includes initial portal type and portal settings', () => {
  expect(
    buildInitAppEnvVarsFromConfig({
      lang: 'en-US',
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
      portalType: 'ai',
      portalName: 'admin',
      portalTemplate: '@nocobase/portal-template-default',
    }),
  ).toEqual({
    INIT_APP_LANG: 'en-US',
    INIT_ROOT_USERNAME: 'nocobase',
    INIT_ROOT_EMAIL: 'admin@nocobase.com',
    INIT_ROOT_PASSWORD: 'admin123',
    INIT_ROOT_NICKNAME: 'Super Admin',
    INIT_PORTAL_TYPE: 'ai',
    INIT_PORTAL_NAME: 'admin',
    INIT_PORTAL_TEMPLATE: '@nocobase/portal-template-default',
  });
});

test('buildInitAppEnvVarsFromConfig can omit portal init settings', () => {
  expect(
    buildInitAppEnvVarsFromConfig(
      {
        lang: 'en-US',
        rootUsername: 'nocobase',
        portalType: 'ai',
        portalName: 'admin',
        portalTemplate: '/tmp/portal-template',
      },
      { includePortal: false },
    ),
  ).toEqual({
    INIT_APP_LANG: 'en-US',
    INIT_ROOT_USERNAME: 'nocobase',
  });
});
