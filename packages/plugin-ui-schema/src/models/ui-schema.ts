import _ from 'lodash';
import { Model } from '@nocobase/database';
import deepmerge from 'deepmerge';

export class UISchema extends Model {
  static async create(value?: any, options?: any): Promise<any> {
    // console.log({ value });
    const attributes = this.toAttributes(_.cloneDeep(value));
    console.log({ attributes })
    // @ts-ignore
    const model: Model = await super.create(attributes, options);
    if (!attributes.children) {
      attributes.children = this.properties2children(attributes.properties);
      await model.updateAssociation('children', attributes.children, options);
    }
    return model;
  }

  async update(key?: any, value?: any, options?: any): Promise<any> {
    const opts = this.get('options') || {};
    if (typeof key === 'object') {
      const attributes = UISchema.toAttributes(key, opts);
      return super.update(attributes, value, options);
    }
    return super.update(key, value, options);
  }

  static toAttributes(value = {}, opts = {}): any {
    const data = _.cloneDeep(value);
    const keys = [
      'properties',
      ...Object.keys(this.rawAttributes),
      ...Object.keys(this.associations),
    ];
    const attrs = _.pick(data, keys);
    const options = _.omit(data, keys);
    return { ...attrs, options: deepmerge(opts, options) };
  }

  static properties2children(properties = []) {
    const children = [];
    for (const [name, property] of Object.entries(properties)) {
      if (property.properties) {
        property.children = this.properties2children(property.properties);
      }
      children.push({
        name,
        ...property,
      });
    }
    return children;
  }

  toProperty() {
    const options = this.get('options') || {};
    const data = _.omit(this.toJSON(), ['created_at', 'updated_at', 'options']);
    return { ...data, ...options };
  }

  async toJSONSchema() {
    const schema = this.toProperty();
    const properties = await this.getProperties();
    if (Object.keys(properties).length) {
      schema['properties'] = properties;
    }
    return schema;
  }

  async getProperties() {
    const properties = {};
    const children: UISchema[] = await this.getChildren({
      order: [['sort', 'asc']],
    });
    for (const child of children) {
      const property = child.toProperty();
      const childProperties = await child.getProperties();
      if (Object.keys(childProperties).length) {
        property['properties'] = childProperties;
      }
      properties[child.name] = property;
    }
    return properties;
  }
}
