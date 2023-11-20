import { InstallOptions, Plugin } from '@nocobase/server';
import {resolve} from 'path';

export class PluginSigninSignupForgotpasswordServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.collection({
      name: 'custom-email-body',
      fields: [
        { type: 'string', name: 'signupEmail' },
        { type: 'string', name: 'signupEmailSubject' },
        { type: 'string', name: 'signinEmail' },
        { type: 'string', name: 'signinEmailSubject' },
        { type: 'string', name: 'forgotPasswordEmail' },
        { type: 'string', name: 'forgotPasswordEmailSubject' },
        { type: 'string', name: 'confirmForgotPasswordEmail' },
        { type: 'string', name: 'confirmForgotPasswordEmailSubject' },
        { type: 'string', name: 'custom_variables' },
      ],
    });
    await this.db.sync();
    this.app.resource({
      name: 'customEmail',
      actions: {
        async setCustomMail(ctx, next) {
         
          //   .setFields('companyName', { type: 'string' });
          ctx.body = "dynamic content"
          await next();
        },
      },
    });
    this.app.acl.allow('customEmail', '*');
    this.app.acl.allow('custom-email-body', '*');
    this.app.acl.allow('users', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {
    await this.db.getRepository('custom-email-body').create({
      values: {
        signupEmail: 'Hello {name}, Welcome to {companyName}',
        signinEmail: 'Hello {name}, Welcome to {companyName}, Login successfull',
        forgotPasswordEmail:
          'Hello {name}. Your password has been successfully reset. If its not you please contact undersigned',
        signupEmailSubject: 'welcome to the website',
        signinEmailSubject: 'Login successfull',
        confirmForgotPasswordEmail: 'Here is your link {link} Reset',
        confirmForgotPasswordEmailSubject: 'Password Confirmation',
        custom_variables: '{"name":"",companyName:"metadesign"}',
      },
    });
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginSigninSignupForgotpasswordServer;
