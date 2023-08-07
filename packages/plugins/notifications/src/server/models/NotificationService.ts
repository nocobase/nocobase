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
