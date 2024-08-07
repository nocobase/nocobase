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
    const { message, channel, writeLog } = args;
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
    receivers.forEach(async (receiver) => {
      try {
        const res = await transpoter.sendMail({
          from: from,
          to: receiver,
          subject,
          text: message.content.body,
          html: message.content.body,
        });
        writeLog({
          receiver,
          status: 'success',
          content: message.content,
          triggerFrom: message.triggerFrom,
          channelId: channel.id,
        });
      } catch (error) {
        writeLog({
          receiver,
          status: 'fail',
          content: message.content,
          triggerFrom: message.triggerFrom,
          reason: error.message,
          channelId: channel.id,
        });
      }
    });
  };
}
