import { InstallOptions, Plugin } from '@nocobase/server';
import { enUS, zhCN } from './locale';
import { namespace } from '..';
import { SMSAuth } from './sms-auth';
import VerificationPlugin from '@nocobase/plugin-verification';

export class SmsAuthPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);

    this.app.on('afterLoad', () => {
      const verificationPlugin: VerificationPlugin = this.app.getPlugin('verification');
      if (!verificationPlugin) {
        this.app.logger.warn('sms-auth: @nocobase/plugin-verification is required');
        return;
      }
      verificationPlugin.interceptors.register('auth:signIn', {
        manual: true,
        getReceiver: (ctx) => {
          return ctx.action.params.values.phone;
        },
        expiresIn: 120,
        validate: async (ctx, phone) => {
          if (!phone) {
            throw new Error(ctx.t('Not a valid cellphone number, please re-enter'));
          }
          return true;
        },
      });
    });
  }

  async load() {
    this.app.authManager.registerTypes('sms', {
      auth: SMSAuth,
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default SmsAuthPlugin;
