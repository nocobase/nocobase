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
    console.log({automationType, jobType, M});
    automation.startJob(`job-${this.id}`, async (result: any) => {
      console.log({automationType, jobType, M});
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
      const data = {};
      for (const item of values) {
        _.set(data, item.column, item.value);
      }
      const { where } = M.parseApiJson({ filter });
      console.log({values, data, where})
      // if (['create'].includes(jobType)) {
      //   await M.create(data);
      // }
      // else if (['update'].includes(jobType) && values) {
      //   await M.update(data, {
      //     where,
      //   });
      // }
      // else if (['destroy'].includes(jobType)) {
      //   await M.destroy({
      //     where,
      //   });
      // }
    });
  }

  async cancel() {
    const automation = this.getDataValue('automation') || await this.getAutomation();
    automation.cancelJob(`job-${this.id}`);
  }
}
