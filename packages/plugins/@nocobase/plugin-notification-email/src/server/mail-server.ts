/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseNotificationChannel } from '@nocobase/plugin-notification-manager';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
type Message = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
} & (
  | {
      contentType: 'html';
      html: string;
    }
  | {
      contentType: 'text';
      text: string;
    }
);

export class MailNotificationChannel extends BaseNotificationChannel {
  transpoter: Transporter;
  async send(args): Promise<any> {
    const { message, channel, receivers } = args;
    const { host, port, secure, account, password, from } = channel.options;
    const userRepo = this.app.db.getRepository('users');

    try {
      const transpoter: Transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: account,
          pass: password,
        },
      });
      const { subject, cc, bcc, to, contentType } = message;
      if (receivers?.type === 'userId') {
        const users = await userRepo.find({
          filter: {
            id: receivers.value,
          },
        });
        const usersEmail = users.map((user) => user.email).filter(Boolean);
        const payload = {
          to: usersEmail,
          from,
          subject,
          ...(contentType === 'html' ? { html: message.html } : { text: message.text }),
        };
        const result = await transpoter.sendMail(payload);
        return { status: 'success', message };
      } else {
        const payload = {
          to: to
            ? to
                .flat()
                .map((item) => item?.trim())
                .filter(Boolean)
            : undefined,
          cc: cc
            ? cc
                .flat()
                .map((item) => item?.trim())
                .filter(Boolean)
            : undefined,
          bcc: bcc
            ? bcc
                .flat()
                .map((item) => item?.trim())
                .filter(Boolean)
            : undefined,
          subject,
          from,
          ...(contentType === 'html' ? { html: message.html } : { text: message.text }),
        };

        const result = await transpoter.sendMail(payload);
        return { status: 'success', message };
      }
    } catch (error) {
      throw { status: 'failure', reason: error.message, message };
    }
  }
}
