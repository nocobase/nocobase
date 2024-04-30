/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import nodemailer from 'nodemailer';

export class NotificationService extends Model {
  [key: string]: any;

  static createTransport = nodemailer.createTransport;

  private _transporter = null;

  get transporter() {
    if (this._transporter) {
      return this._transporter;
    }
    return (this._transporter = NotificationService.createTransport(this.options));
  }

  async send(options) {
    const { from } = this.options;
    const mailOptions = {
      from,
      ...options,
    };
    return this.transporter.sendMail(mailOptions);
  }
}
