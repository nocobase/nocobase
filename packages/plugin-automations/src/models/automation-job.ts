import _ from 'lodash';
import { Model } from '@nocobase/database';
import parse from 'json-templates';

export class AutomationJobModel extends Model {

  async bootstrap() {
    const automation = this.getDataValue('automation') || await this.getAutomation();
    const automationType = automation.get('type');
    const jobType = this.get('type');
    const collectionName = this.get('collection_name');
    const M = this.database.getModel(collectionName);
    automation.startJob(`job-${this.id}`, async (result: any) => {
      let filter: any = this.get('filter');
      let values: any = this.get('values');
      if ([
        'collections:afterCreate',
        'collections:afterUpdate',
        'collections:afterCreateOrUpdate',
      ].includes(automationType) && result) {
        if (filter) {
          filter = parse(filter)(result.get());
        }
        if (values) {
          values = parse(values)(result.get());
        }
      }
      const { where } = M.parseApiJson({ filter });
      if (['create'].includes(jobType)) {
        await M.create(values||{});
      }
      else if (['update'].includes(jobType) && values) {
        await M.update(values, {
          where,
        });
      }
      else if (['destroy'].includes(jobType)) {
        await M.destroy({
          where,
        });
      }
    });
  }

  async cancel() {
    const automation = this.getDataValue('automation') || await this.getAutomation();
    automation.cancelJob(`job-${this.id}`);
  }
}
