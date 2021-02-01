import _ from 'lodash';
import { Model } from '@nocobase/database';

export class AutomationJobModel extends Model {
  async bootstrap() {
    const automation = this.getDataValue('automation') || await this.getAutomation();

    console.log('bootstrap');

    automation.startJob(`job-${this.id}`, async function (model) {
      console.log('AutomationJob', model);
      if (automation.get('type') === 'schedule') {
        console.log('Time for tea!', (new Date()).toISOString());
      }
    });
  }

  async cancel() {
    const automation = this.getDataValue('automation') || await this.getAutomation();
    automation.cancelJob(`job-${this.id}`);
  }
}
