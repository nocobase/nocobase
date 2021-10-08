import { Model } from '@nocobase/database';
import nodemailer from 'nodemailer';

export class NotificationService extends Model {

  static createTransport = nodemailer.createTransport;

  get transporter() {
    if (this._transporter) {
      return this._transporter;
    }
    return this._transporter = NotificationService.createTransport(this.options);
  }

  async send(options) {
    const { from } = this.options;
    const mailOptions = {
      from,
      ...options,
    };
    console.log({ mailOptions });
    return this.transporter.sendMail(mailOptions);
  }
}
