/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import PluginAuthClientV2 from '@nocobase/plugin-auth/client-v2';
import { authType } from '../constants';

export class PluginAuthSMSClientV2 extends Plugin {
  async load() {
    const auth = this.app.pm.get(PluginAuthClientV2);
    auth.registerType(authType, {
      signInFormLoader: () => import('./forms/SmsSignInForm'),
      adminSettingsFormLoader: () => import('./forms/SmsAdminSettings'),
    });
  }
}

export default PluginAuthSMSClientV2;
