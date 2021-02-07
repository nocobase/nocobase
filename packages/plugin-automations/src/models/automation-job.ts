import _ from 'lodash';
import { Model } from '@nocobase/database';
import parse from 'json-templates';

export class AutomationJobModel extends Model {

  async bootstrap() {
    let automation = this.getDataValue('automation');
    if (!automation) {
      automation = await this.getAutomation();
      this.setDataValue('automation', automation);
    }
    automation.startJob(`job-${this.id}`, async (result: any, options: any = {}) => {
      this.process(result, {...options});
    });
  }

  async process(result?: any, options?: any) {
    let source = {};
    if (result && typeof result === 'object') {
      if (result.toJSON) {
        source = result.toJSON();
      } else {
        source = result;
      }
    }
    const jobType = this.get('type');
    const collectionName = this.get('collection_name');
    const M = this.database.getModel(collectionName);
    let filter: any = parse(this.get('filter')||{})(source);
    let values: any = parse(this.get('values')||[])(source);
    const data = {};
    for (const item of values) {
      _.set(data, item.column, item.value);
    }
    const { where = {} } = M.parseApiJson({ filter });
    console.log({values, data, where})
    if (['create'].includes(jobType)) {
      await M.create(data);
    }
    else if (['update'].includes(jobType) && values) {
      Object.keys(data).length && await M.update(data, {
        where,
      });
    }
    else if (['destroy'].includes(jobType)) {
      await M.destroy(where ? {
        where,
      }: {});
    }
  }

  async cancel() {
    const automation = this.getDataValue('automation') || await this.getAutomation();
    automation.cancelJob(`job-${this.id}`);
  }
}
