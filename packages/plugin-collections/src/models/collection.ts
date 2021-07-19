import _ from 'lodash';
import { Model } from '@nocobase/database';

export class Collection extends Model {
  static async create(value?: any, options?: any): Promise<any> {
    // console.log({ value });
    const attributes = this.toAttributes(value);
    // @ts-ignore
    const model: Model = await super.create(attributes, options);
    return model;
  }

  static toAttributes(value = {}): any {
    const data = _.cloneDeep(value);
    const keys = [
      ...Object.keys(this.rawAttributes),
      ...Object.keys(this.associations),
    ];
    const attrs = _.pick(data, keys);
    const options = _.omit(data, keys);
    return { ...attrs, options };
  }

  async toProps() {
    const json = this.toJSON();
    const data: any = _.omit(json, ['options', 'created_at', 'updated_at']);
    const options = json['options'] || {};
    const fields = await this.getNestedFields();
    return { ...data, ...options, fields }
  }

  async getNestedFields() {
    const fields = await this.getFields();
    const items = [];
    for (const field of fields) {
      items.push(await field.toProps());
    }
    return items;
  }
}
