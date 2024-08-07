/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import nodemailer, { Transporter } from 'nodemailer';
import NotificationsServerPlugin, { SendFnType, NotificationServerBase } from '@nocobase/plugin-notification-manager';
export class MailServer extends NotificationServerBase {
  transpoter: Transporter;
  constructor() {
    super();
    this.transpoter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: '295830037@qq.com',
        pass: 'lwrpuisrceflcbed',
      },
    });
  }
  send: SendFnType = async function (args) {
    const { message, channel } = args;
    const { host, port, secure, account, password } = channel.options;
    const transpoter: Transporter = nodemailer.createTransport({
      host,
      port,
      secure: true, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: account,
        pass: password,
      },
    });
    const receivers = message.receiveOption.receivers;
    await Promise.all(
      receivers.map(async (receiver) => {
        return transpoter.sendMail({
          from: 'sheldon <295830037@qq.com>',
          to: receiver,
          subject: 'Hello', // Subject line
          text: message.content.body, // plain text body
          html: message.content.body, // html body
        });
      }),
    );
    return true;
  };
}
