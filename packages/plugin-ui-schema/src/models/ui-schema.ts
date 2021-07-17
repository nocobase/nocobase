import _ from 'lodash';
import { Model } from '@nocobase/database';

export class UISchema extends Model {
  static async create(value?: any, options?: any): Promise<any> {
    // console.log({ value });
    const attributes = this.toAttributes(value);
    // @ts-ignore
    const model: Model = await super.create(attributes, options);
    if (value['__prepend__']) {
      console.log('__prepend__', model.parentKey);
    } else if (value['__insertAfter__']) {
      console.log('__insertAfter__', model.parentKey);
    } else if (value['__insertBefore__']) {
      console.log('__insertBefore__', model.parentKey);
    }
    if (!attributes.children) {
      attributes.children = this.properties2children(attributes.properties);
      await model.updateAssociation('children', attributes.children, options);
    }
    return model;
  }

  static toAttributes(value = {}): any {
    const data = _.cloneDeep(value);
    const keys = [
      'properties',
      ...Object.keys(this.rawAttributes),
      ...Object.keys(this.associations),
    ];
    const attrs = _.pick(data, keys);
    const options = _.omit(data, keys);
    return { ...attrs, options };
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
