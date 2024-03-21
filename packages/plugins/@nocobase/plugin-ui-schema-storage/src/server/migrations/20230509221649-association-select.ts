import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.9.3-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<0.9.2-alpha.5');
    if (!result) {
      return;
    }
    const r = this.db.getRepository('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-designer': 'AssociationSelect.Designer',
      },
    });
    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        if (!schema['x-collection-field']) {
          continue;
        }
        const field = this.db.getFieldByPath(schema['x-collection-field']);
        if (!field) {
          continue;
        }
        if (['hasOne', 'belongsTo'].includes(field.type)) {
          schema['type'] = 'object';
        } else if (['hasMany', 'belongsToMany'].includes(field.type)) {
          schema['type'] = 'array';
        } else {
          continue;
        }
        schema['x-designer'] = 'FormItem.Designer';
        schema['x-component'] = 'CollectionField';
        item.set('schema', schema);
        await item.save({ transaction });
      }
    });
  }
}
