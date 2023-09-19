import Database, { Model } from '@nocobase/database';
import lodash from 'lodash';
import { NotificationService } from './NotificationService';

export class Notification extends Model {
  [key: string]: any;

  get db(): Database {
    return this.constructor['database'];
  }

  async getReceiversByOptions(): Promise<any[]> {
    const { data, fromTable, filter, dataField } = this.receiver_options;
    let receivers = [];
    if (data) {
      receivers = Array.isArray(data) ? data : [data];
    } else if (fromTable) {
      const collection = this.db.getCollection(fromTable);
      const rows = await collection.repository.find({
        filter,
      });
      receivers = rows.map((row) => row[dataField]);
    }
    return receivers;
  }

  async send(options: any = {}) {
    const { transaction } = options;

    if (!this.service) {
      this.service = await this.getService();
    }
    const receivers = await this.getReceiversByOptions();
    let { to } = options;
    if (to) {
      to = Array.isArray(to) ? to : [to];
      receivers.push(...to);
    }
    console.log(receivers);
    for (const receiver of receivers) {
      try {
        const response = await (this.service as NotificationService).send({
          to: receiver,
          subject: this.getSubject(),
          html: this.getBody(options),
        });
        await this.createLog(
          {
            receiver,
            state: 'success',
            response,
          },
          {
            transaction,
          },
        );
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      } catch (error) {
        console.error(error);
        await this.createLog(
          {
            receiver,
            state: 'fail',
            response: {},
          },
          {
            transaction,
          },
        );
      }
    }
  }

  getSubject() {
    return this.subject;
  }

  getBody(data) {
    const compiled = lodash.template(this.body);
    const body = compiled(data);
    return body;
  }
}
