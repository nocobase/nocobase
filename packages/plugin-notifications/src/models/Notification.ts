import { Model } from '@nocobase/database';
import { NotificationService } from './NotificationService';
import _ from 'lodash';

export class Notification extends Model {

  async getReceiversByOptions(): Promise<any[]> {
    const { data, fromTable, filter, dataField } = this.receiver_options;
    let receivers = [];
    if (data) {
      receivers = Array.isArray(data) ? data : [data];
    } else if (fromTable) {
      const M = this.database.getModel(fromTable);
      const rows = await M.findAll(M.parseApiJson2({
        filter,
      }));
      receivers = rows.map(row => row[dataField]);
    }
    return receivers;
  }

  async send(options: any = {}) {
    if (!this.service) {
      this.service = await this.getService();
    }
    const receivers = await this.getReceiversByOptions();
    let { to } = options;
    if (to) {
      to = Array.isArray(to) ? to : [to];
      receivers.push(...to);
    }
    console.log(receivers)
    for (const receiver of receivers) {
      try {
        const response = await (this.service as NotificationService).send({
          to: receiver,
          subject: this.getSubject(),
          html: this.getBody(options),
        });
        await this.createLog({
          receiver,
          state: 'success',
          response,
        });
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      } catch (error) {
        console.error(error);
        await this.createLog({
          receiver,
          state: 'fail',
          response: {},
        });
      }
    }
  }

  getSubject() {
    return this.subject;
  }

  getBody(data) {
    const compiled = _.template(this.body)
    const body = compiled(data);
    return body;
  }
}
