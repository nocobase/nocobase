/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EmailProvider } from './index';
import nodemailer from 'nodemailer';

export class SMTPProvider extends EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor(options: any) {
    super(options);
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: {
        user: options.user,
        pass: options.pass,
      },
    });
  }

  async send(receiver: string, data: { [key: string]: any }): Promise<any> {
    const { code, expiresIn } = data;
    let { subject, html, text } = this.options;

    // Replace template variables
    const replacements = {
      code,
      expires: Math.ceil(expiresIn / 60), // minutes
    };

    subject = subject.replace(/\[(\w+)\]/g, (match, key) => replacements[key] || match);
    html = html.replace(/\[(\w+)\]/g, (match, key) => replacements[key] || match);
    text = text.replace(/\[(\w+)\]/g, (match, key) => replacements[key] || match);

    const mailOptions = {
      from: this.options.from,
      to: receiver,
      subject,
      html,
      text,
    };
    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('SMTP send error:', error);
      throw error;
    }
  }
}
