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
    console.log(args);
    const info = await this.transpoter.sendMail({
      from: 'sheldon<295830037@qq.com>',
      to: 'sheldonguo16@gmail.com, sheldon_66@163.com',
      subject: 'Hello ✔', // Subject line
      text: 'Hello world?', // plain text body
      html: '<b>Hello world?</b>', // html body
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  };
}
