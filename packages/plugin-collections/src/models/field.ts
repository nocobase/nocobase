import _ from 'lodash';
import { Model } from '@nocobase/database';

export class Field extends Model {
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
    const props = { ...data, ...options };
    if (fields.length) {
      props['children'] = fields;
    }
    const uiSchema = await this.getUiSchema();
    if (uiSchema) {
      // props['uiSchema1'] = uiSchema;
      props['uiSchema'] = await uiSchema.toJSONSchema();
    }
    return props;
  }

  async getNestedFields() {
    const fields = await this.getChildren();
    const items = [];
    for (const field of fields) {
      items.push(await field.toProps());
    }
    return items;
  }
}
