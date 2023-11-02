import { InstallOptions, Plugin } from '@nocobase/server';
import nodemailer from 'nodemailer';
import format from 'string-template';
import CryptoJS from 'crypto-js';

function createTransPort({ host, port }) {
  return nodemailer.createTransport({
    host,
    port,
  });
}

function getTransport(data, force = false) {
  if (getTransport['transport'] && !force) {
    return getTransport['transport'];
  }
  getTransport['transport'] = createTransPort(data);
  return getTransport['transport'];
}
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
});

export class PluginSmtpServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.collection({
      name: 'smtpRequest',
      fields: [
        { type: 'string', name: 'host' },
        { type: 'boolean', name: 'admin' },
        { type: 'boolean', name: 'member' },
        { type: 'boolean', name: 'root' },
        { type: 'integer', name: 'port' },
        { type: 'string', name: 'username' },
        { type: 'string', name: 'password' },
        { type: 'string', name: 'from' },
        { type: 'boolean', name: 'force' },
      ],
    });

    await this.db.sync();
    this.app.resource({
      name: 'email',
      actions: {
        async sendMyEmail(ctx, next) {
          const data = await ctx.db.getRepository('smtpRequest').findOne({
            filter: {
              id: 1,
            },
          });

          // const emailValues = ctx.request.query;
          const emailValues = ctx.request.body;

          if (!data) {
            //TODO:-send error ......
            return ctx.throw(400, ctx.t('No data found!'));
          }
          const transport = getTransport(data, data.force);
          if (data.force) {
            await ctx.db.getRepository('smtpRequest').update({
              filter: {
                id: 1,
              },
              values: {
                force: false,
              },
            });
          }

          const emailOption = {
            to: emailValues?.to,
            from: `Test <${emailValues?.from}>`,
            subject: emailValues?.subject,
            text: emailValues?.text,
            attachments: emailValues.attachment || [],
          };

          const info = await transport.sendMail(emailOption);
          const allowed_users = global.allowed_users;
          const currentUser = global.currentUser;
          const isAllowed = global.isAllowed;

          ctx.body = { data, info, allowed_users, currentUser, isAllowed };
          await next();
        },

        //forgot Password API
        //forgot Password API
        //forgot Password API
        async forgotPassword(ctx, next) {
          const { email, resetToken, page } = ctx.request.body;

          const { origin } = ctx.request;
          const emailData = await ctx.db.getRepository('smtpRequest').findOne({
            filter: {
              id: 1,
            },
          });
          const data = await ctx.db.getRepository('custom-email-body').findOne({
            filter: {
              id: 1,
            },
          });
          const userdata = await ctx.db.getRepository('users').findOne({
            filter: {
              email,
            },
          });
          const emailBody = page[0];
          const subject = page[1];
          if (!data) {
            //TODO:-send error ......
            return ctx.throw(400, ctx.t('No data found!'));
          }

          const port = process.env.APP_PORT_1;
          const linkOrigin = origin.replace(/:\d+$/, `:${port}`);

          const link = `${linkOrigin}/resetPassword/${email}/${resetToken}`;
          const custom_variable_object = Object.assign(
            {
              username: userdata.username,
              email: email,
              link,
            },
            userdata.dataValues,
          );
          // Exclude sensitive fields
          delete custom_variable_object.password;
          delete custom_variable_object.resetToken;
          delete custom_variable_object.appLang;
          delete custom_variable_object.createdById;

          const mappedStringWithValue = format(data[emailBody], custom_variable_object);
          const domParser = new DOMParser();
          const document = domParser.parseFromString(mappedStringWithValue, 'text/html');
          const emailOption = {
            to: email,
            from: `no reply <${emailData.from}>`,
            subject: data[subject],
            text: mappedStringWithValue,
            html: mappedStringWithValue,
          };
          const info = await transporter.sendMail(emailOption);

          // Respond to the request with a success message.
          ctx.body = {
            message: 'reset password link has been sent to your email.',
            userdata,
            data,
            subject1: data[subject],
            body: data[emailBody],
            emailBody,
            subject,
            custom_variable_object,
          };

          await next();
        },
        //Custom Email Body and subject
        //Custom Email Body and subject
        //Custom Email Body and subject
        async authEmail(ctx, next) {
          const { email, page } = ctx.request.body;
          const emailBody = page[0];
          const subject = page[1];
          const emailData = await ctx.db.getRepository('smtpRequest').findOne({
            filter: {
              id: 1,
            },
          });
          const data = await ctx.db.getRepository('custom-email-body').findOne({
            filter: {
              id: 1,
            },
          });
          const userdata = await ctx.db.getRepository('users').findOne({
            filter: {
              email,
            },
          });

          if (!data) {
            //TODO:-send error ......
            return ctx.throw(400, ctx.t('No data found!'));
          }

          const custom_variable_object = Object.assign(
            {
              username: userdata.username,
              email: email,
            },
            userdata.dataValues,
          );
          // Exclude sensitive fields
          delete custom_variable_object.password;
          delete custom_variable_object.resetToken;
          const mappedStringWithValue = format(data[emailBody], custom_variable_object);
          const emailOption = {
            to: email,
            from: `no reply <${emailData.from}>`,
            subject: data[subject],
            text: mappedStringWithValue,
            html: mappedStringWithValue,
          };
          const info = await transporter.sendMail(emailOption);

          // Respond to the request with a success message.
          ctx.body = {
            message: 'reset password link has been sent to your email.',
            custom_variable_object,
            userdata,
          };

          await next();
        },

        //signup email API
        //signup email API
        //signup email API
        async signupEmail(ctx, next) {
          const { email, page } = ctx.request.body;
          const emailBody = page[0];
          const subject = page[1];
          const emailData = await ctx.db.getRepository('smtpRequest').findOne({
            filter: {
              id: 1,
            },
          });
          const data = await ctx.db.getRepository('custom-email-body').findOne({
            filter: {
              id: 1,
            },
          });
          const userdata = await ctx.db.getRepository('users').findOne({
            filter: {
              email,
            },
          });

          if (!data) {
            //TODO:-send error ......
            return ctx.throw(400, ctx.t('No data found!'));
          }

          //replacing email values and username in userData
          const custom_variable_object = Object.assign(
            {
              username: userdata.username,
              email: email,
            },
            userdata.dataValues,
          );
          // Exclude sensitive fields
          delete custom_variable_object.password;
          delete custom_variable_object.resetToken;

          //mapping variable values to email body
          const mappedStringWithValue = format(data[emailBody], custom_variable_object);
          const emailOption = {
            to: email,
            from: `no reply <${emailData.from}>`,
            subject: data[subject],
            text: mappedStringWithValue,
            html: mappedStringWithValue,
          };
          const info = await transporter.sendMail(emailOption);
           // Respond to the request with a success message.
          ctx.body = {
            message: 'Signup success, Welcome',
          };
       

         

          await next();
        },
      },
    });
    //applying condition on who can access the API
    this.app.acl.allowManager.registerAllowCondition('admin', async (ctx) => {
      //fetching allowed_users from db
      const data = await ctx.db.getRepository('smtpRequest').findOne({
        filter: {
          id: 1,
        },
      });

      const currentUser = ctx.state.currentRole;

      if (data[currentUser] === true) {
        const allowedUserArray = true;
        global.allowed_users = allowedUserArray;
        return true;
      } else if (!data['admin'] && !data['member'] && !data['root']) {
        return true;
      } else {
        global.allowed_users = false;
        return false;
      }
    });
    this.app.acl.allowManager.registerAllowCondition('signupEmailCheck', async (ctx) => {
     

      const token = ctx.request.header.authorization.split(' ')[1].trim().toString();

      // Decrypt
      var bytes = CryptoJS.AES.decrypt(token, 'secret');
      var originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (originalText === 'somerandomstring') {
        return true;
      } else {
        return false;
      }
    });
    this.app.acl.allow('email', 'sendMyEmail', 'admin');
    this.app.acl.allow('email', 'forgotPassword');
    this.app.acl.allow('email', 'verifyOtp');
    this.app.acl.allow('email', 'authEmail');
    this.app.acl.allow('email', 'signupEmail', 'signupEmailCheck');
    this.app.acl.allow('smtpRequest', '*');
    this.app.acl.allow('otp', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {
    await this.db.getRepository('smtpRequest').create({
      values: {
        localhost: 'localhost',
        host: 1025,
        username: '',
        password: '',
        admin: false,
        root: false,
        member: false,
        from: 'example@gmail.com',
      },
    });
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginSmtpServer;
