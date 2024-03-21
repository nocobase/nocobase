import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.9.3-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<0.9.2-alpha.5');
    if (!result) {
      return;
    }
    await this.migrateFields();
    await this.migrateSelector();
    await this.migrateViewer();
  }

  async migrateFields() {
    const r = this.db.getRepository('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-component': 'CollectionField',
      },
    });
    console.log(items?.length);
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
        const component = field.get('uiSchema')?.['x-component'];
        if (!['AssociationField', 'RecordPicker'].includes(component)) {
          continue;
        }
        console.log(field.options.interface, component, schema['x-collection-field']);
        if (['createdBy', 'updatedBy'].includes(field?.options?.interface)) {
          // TODO
        } else if (['hasOne', 'belongsTo'].includes(field.type)) {
          schema['type'] = 'object';
        } else if (['hasMany', 'belongsToMany'].includes(field.type)) {
          schema['type'] = 'array';
        } else {
          continue;
        }
        if (schema['x-component-props']?.mode === 'tags') {
          schema['x-component-props']['enableLink'] = true;
          schema['x-component-props']['mode'] = 'Select';
        } else if (schema['x-component-props']?.mode === 'links') {
          schema['x-component-props']['enableLink'] = true;
          schema['x-component-props']['mode'] = 'Select';
        }
        item.set('schema', schema);
        await item.save({ transaction });
      }
    });
  }

  async migrateViewer() {
    const r = this.db.getRepository('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-component': 'RecordPicker.Viewer',
      },
    });
    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        schema['x-component'] = 'AssociationField.Viewer';
        item.set('schema', schema);
        await item.save({ transaction });
      }
    });
  }

  async migrateSelector() {
    const r = this.db.getRepository('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-component': 'RecordPicker.Selector',
      },
    });
    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        schema['x-component'] = 'AssociationField.Selector';
        item.set('schema', schema);
        await item.save({ transaction });
      }
    });
  }
}
