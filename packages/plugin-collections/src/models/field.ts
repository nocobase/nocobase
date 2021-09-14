import _ from 'lodash';
import { Model } from '@nocobase/database';

export class Field extends Model {
  static async create(value?: any, options?: any): Promise<any> {
    const attributes = this.toAttributes(value);
    // @ts-ignore
    const model: Model = await super.create(attributes, options);
    return model;
  }

  static toAttributes(value = {}): any {
    const data: any = _.cloneDeep(value);
    const keys = [
      ...Object.keys(this.rawAttributes),
      ...Object.keys(this.associations),
    ];
    if (!data.dataType && data.type) {
      data.dataType = data.type;
    }
    const attrs = _.pick(data, keys);
    const options = _.omit(data, [...keys, 'type']);
    return { ...attrs, options };
  }

  async toProps() {
    const json = this.toJSON();
    const data: any = _.omit(json, ['options', 'created_at', 'updated_at']);
    const options = json['options'] || {};
    const fields = await this.getNestedFields();
    const props = { type: json['dataType'], ...data, ...options };
    if (fields.length) {
      props['children'] = fields;
    }
    if (this.getUiSchema) {
      const uiSchema = await this.getUiSchema();
      if (uiSchema) {
        // props['uiSchema1'] = uiSchema;
        props['uiSchema'] = await uiSchema.toJSONSchema();
      }
    }
    return props;
  }

  async migrate() {
    const collection = await this.getCollection();
    await collection.migrate()
  }

  async getNestedFields() {
    const fields = await this.getChildren();
    const items = [];
    for (const field of fields) {
      items.push(await field.toProps());
    }
    return items;
  }

  async generateReverseField(opts: any = {}) {
    const { migrate = true } = opts;
    if (this.get('interface') !== 'linkTo') {
      return;
    }
    if (this.get('reverseKey')) {
      return;
    }
    const fieldCollection = await this.getCollection();
    const options: any = this.get('options') || {};
    const Collection = this.database.getModel('collections');
    let collection = await Collection.findOne({
      where: {
        name: options.target,
      },
    });
    if (!collection) {
      return;
    }
    const reverseField = await collection.createField({
      interface: 'linkTo',
      dataType: 'belongsToMany',
      through: options.through,
      foreignKey: options.otherKey,
      otherKey: options.foreignKey,
      sourceKey: options.targetKey,
      targetKey: options.sourceKey,
      target: this.get('collection_name'),
      reverseKey: this.get('key'),
    });
    await reverseField.updateAssociations({
      uiSchema: {
        type: 'array',
        title: `${fieldCollection?.title}`,
        'x-component': 'Select.Drawer',
        'x-component-props': {
          multiple: true,
        },
        'x-decorator': 'FormItem',
        'x-designable-bar': 'Select.Drawer.DesignableBar',
      }
    });
    await this.update({
      reverseKey: reverseField.key,
    });
    if (migrate) {
      await collection.migrate();
    }
  }
}
