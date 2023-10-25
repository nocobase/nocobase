/* eslint-disable */

import { InstallOptions, Plugin } from '@nocobase/server';
import nodemailer from 'nodemailer';
import { checkAPIKey } from '../client/utils/checkAPIKey';
const fs = require('fs');

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
export class SmtpRequestServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    // Visit: http://localhost:13000/api/email:sendMyEmail

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
        { type: 'boolean', name: 'force' },
      ],
    });

    this.db.collection({
      name: 'otp',
      fields: [
        { type: 'string', name: 'email' },
        { type: 'integer', name: 'otp' },
        { type: 'integer', name: 'expiresAt' },
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

          //looping array to push each attachments
          let attachments = [];
          // if (emailValues.attachment.length > 0) {
          //   for (let i = 0; i <= emailValues?.attachment.length; i++) {
          //     let attachObject = {
          //       path: '',
          //     };
          //     attachObject.path = emailValues.attachment[i];
          //     attachments.push(attachObject)
          //   }

          // }
          const attachment = {
            path: emailValues.attachment,
          };

          const emailOption = {
            to: emailValues?.to,
            from: `Test <${emailValues?.from}>`,
            subject: emailValues?.subject,
            text: emailValues?.text,
            attachments: emailValues.attachment || [],
          };
          // const emailOption = {
          //   to: 'to@to.com',
          //   from: `Test <"from@from.com">`,
          //   subject: 'subject',
          //   text: 'text',
          // };

          const info = await transport.sendMail(emailOption);
          const allowed_users = global.allowed_users;
          const currentUser = global.currentUser;
          const isAllowed = global.isAllowed;

          ctx.body = { data, info, allowed_users, currentUser, isAllowed };
          await next();
        },

        async forgotPassword(ctx, next) {
          // Get the user email from the request body.
          // const userEmail = ctx.request.body.email;
          // const username = ctx.request.body.username;
          // const origin = ctx.request.origin;
          // const token = ctx.request.body.token

          const { email, resetToken } = ctx.request.body;
          
          const { origin } = ctx.request;
          const port = process.env.APP_PORT_1
          const linkOrigin = origin.replace(/:\d+$/, `:${port}`);
          
          const data = await ctx.db.getRepository('users').findOne({
            filter: {
              email,
            },
            projectFields: ['resetToken'],
          });

          const link = `${linkOrigin}/resetPassword/${email}/${resetToken}`;

          const emailOption = {
            to: email,
            from: `Test <bcd@bcd.com>`,
            subject: 'Password reset',
            text: `This link is valid for 5 minutes only ${link}`,
          };
          const info = await transporter.sendMail(emailOption);

          // Respond to the request with a success message.
          ctx.body = {
            message: 'reset password link has been sent to your email.',
          };

          await next();
        },

        async verifyOtp(ctx, next) {
          // Get the user email and OTP from the request body.
          const userEmail = ctx.request.body.email;
          const userOtp = ctx.request.body.otp;

          // Get the OTP from the database using the user's email address.
          const otp = await ctx.db.getRepository('otp').findOne({
            filter: {
              email: userEmail,
            },
          });
          global.otp = otp;
          // Check if the OTP has expired.
          if (otp && otp.expiresAt < new Date()) {
            // The OTP has expired.
            ctx.throw(400, 'The OTP has expired.');
          }

          // // Compare the OTP provided by the user to the OTP stored in the database.
          if (otp && otp.otp !== userOtp) {
            // The OTPs do not match.
            ctx.throw(400, 'The OTP is incorrect.');
          }

          // The OTP has been verified.
          // Send back a success response.
          ctx.body = {
            message: 'OTP has been verified successfully.',
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

    this.app.acl.allow('email', 'sendMyEmail', 'admin');
    this.app.acl.allow('email', 'forgotPassword');
    this.app.acl.allow('email', 'verifyOtp');
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
      },
    });
  }

  async afterDisable() {}

  async remove() {}
}

export default SmtpRequestServer;
