import { Schema } from '@formily/json-schema';
import { Migration } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import UiSchemaRepository from '../repository';

export default class extends Migration {
  appVersion = '<0.9.3-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<0.9.2-alpha.5');
    if (!result) {
      return;
    }

    const r = this.db.getRepository<UiSchemaRepository>('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-component': 'FormField',
      },
    });
    console.log(items?.length);
    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        schema['type'] = 'object';
        schema['x-component'] = 'CollectionField';
        schema['x-component-props']['mode'] = 'Nester';
        item.set('schema', schema);
        await item.save({ transaction });
        const s = await r.getProperties(item['x-uid'], { transaction });
        const instance = new Schema(s);
        const find = (instance, component) => {
          return instance.reduceProperties((buf, ss) => {
            if (ss['x-component'] === component) {
              return ss;
            }
            const result = find(ss, component);
            if (result) {
              return result;
            }
            return buf;
          }, null);
        };
        const gridSchema = find(instance, 'Grid').toJSON();
        await r.insertAdjacent('afterBegin', item['x-uid'], gridSchema, {
          wrap: {
            type: 'void',
            'x-uid': uid(),
            'x-component': 'AssociationField.Nester',
          },
          transaction,
        });
        const removed = Object.values(instance.properties)?.[0]?.['x-uid'];
        if (removed) {
          await r.remove(removed, { transaction });
        }
      }
    });
  }
}
