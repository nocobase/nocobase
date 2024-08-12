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
  }
  send: SendFnType = async function (args) {
    const { message, channel } = args;
    const { host, port, secure, account, password } = channel.options;
    const transpoter: Transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: account,
        pass: password,
      },
    });
    const receivers = message.receivers;
    const { from, subject } = message.content.config;
    const sendMail = async ({ receiver }) => {
      try {
        const res = await transpoter.sendMail({
          from: from,
          to: receiver,
          subject,
          text: message.content.body,
          html: message.content.body,
        });
        return { receiver, status: 'success' };
      } catch (error) {
        throw { receiver, status: 'fail', reason: error.message };
      }
    };
    const results = await Promise.allSettled(receivers.map((receiver) => sendMail({ receiver })));
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return { ...result.value, content: message.content };
      }
      return { ...result.reason, content: message.content };
    });
  };
}
