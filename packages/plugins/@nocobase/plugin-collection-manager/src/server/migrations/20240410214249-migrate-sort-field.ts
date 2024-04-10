import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.21.0-alpha.7';

  async up() {
    const collections = await this.db.getRepository('collections').find();

    for (const collection of collections) {
      const sortable = collection.get('sortable');
      if (!sortable) {
        continue;
      }

      const sortFieldName = sortable === true ? 'sort' : sortable;

      const fields = await collection.getFields();
      const sortField = fields.find((item) => item.get('type') === 'sort' && item.get('name') === sortFieldName);

      if (!sortField) {
        await this.db.getRepository('fields').create({
          values: {
            name: sortFieldName,
            type: 'sort',
            interface: 'sort',
            uiSchema: {
              title: sortFieldName,
              type: 'number',
              'x-component': 'InputNumber',
              'x-component-props': { stringMode: true, step: '1' },
              'x-validator': 'integer',
            },
            collectionName: collection.get('name'),
          },
        });
      }
    }
  }
}
