/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import VerificationPlugin from '@nocobase/plugin-verification';
import { InstallOptions, Plugin } from '@nocobase/server';
import { authType, namespace } from '../constants';
import { SMSAuth } from './sms-auth';
import { tval } from '@nocobase/utils';

export class PluginAuthSMSServer extends Plugin {
  afterAdd() {}

  async load() {
    const verificationPlugin: VerificationPlugin = this.app.getPlugin('verification');
    if (!verificationPlugin) {
      this.app.logger.warn('auth-sms: @nocobase/plugin-verification is required');
      return;
    }
    verificationPlugin.verificationManager.registerAction('auth:signIn', {
      manual: true,
      getBoundInfoFromCtx: (ctx) => {
        return ctx.action.params.values || {};
      },
    });

    this.app.authManager.registerTypes(authType, {
      auth: SMSAuth,
      title: tval('SMS', { ns: namespace }),
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAuthSMSServer;
