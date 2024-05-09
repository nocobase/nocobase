/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { authType } from '../constants';
import { LDAPButton } from './LDAPButton';
import { Options } from './Options';

export class PluginLdapClient extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(authType, {
      components: {
        AdminSettingsForm: Options,
        SignInButton: LDAPButton,
      },
    });
  }
}

export default PluginLdapClient;
