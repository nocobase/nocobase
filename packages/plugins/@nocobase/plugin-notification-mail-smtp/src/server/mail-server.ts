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
    const { host, port, secure, account, password, from } = channel.options;
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
    const { subject, cc, bcc } = message.content.config;
    const sendMail = async ({ receivers, cc, bcc }) => {
      try {
        const res = await transpoter.sendMail({
          from: from,
          to: receivers,
          subject,
          cc,
          bcc,
          text: message.content.body,
          html: message.content.body,
        });
        return { receivers, status: 'success' } as const;
      } catch (error) {
        throw { receivers, status: 'fail', reason: error.message };
      }
    };

    const result = await sendMail({
      receivers: receivers.map((item) => item?.trim()).filter(Boolean),
      cc: cc
        ? cc
            .flat()
            .map((item) => item?.trim())
            .filter(Boolean)
        : null,
      bcc: bcc
        ? bcc
            .flat()
            .map((item) => item?.trim())
            .filter(Boolean)
        : null,
    });
    return { ...result, content: message.content };
  };
}
