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
      this.process(result, { ...options });
    });
  }

  toFilter(result) {
    let source = {};
    if (result && typeof result === 'object') {
      if (result.toJSON) {
        source = result.toJSON();
      } else {
        source = result;
      }
    }
    return parse(this.get('filter') || {})(source);
  }

  toValues(result) {
    let source = {};
    if (result && typeof result === 'object') {
      if (result.toJSON) {
        source = result.toJSON();
      } else {
        source = result;
      }
    }
    const data: any = {}
    const values = (this.get('values') || []) as any[];
    for (const item of values) {
      let value = item.value;
      if (item.op === 'truncate') {
        value = null;
      } else if (item.op === 'ref') {
        value = _.get(source, item.value);
      }
      _.set(data, item.column, value);
    }
    return data;
  }

  async process(result?: any, options?: any) {
    const jobType = this.get('type');
    const collectionName = this.get('collection_name');
    const M = this.database.getModel(collectionName);
    if (!collectionName || !M) {
      return;
    }
    let filter: any = this.toFilter(result);
    let data: any = this.toValues(result);
    const { where = {} } = M.parseApiJson({ filter });
    console.log({ data, where });
    switch (jobType) {
      case 'create':
        await M.create(data);
        break;
      case 'update':
        Object.keys(data).length && await M.update(data, { where });
        break;
      case 'destroy':
        await M.destroy(where ? { where } : {});
        break;
    }
  }

  async cancel() {
    const automation = this.getDataValue('automation') || await this.getAutomation();
    await automation.cancelJob(`job-${this.id}`);
  }
}
