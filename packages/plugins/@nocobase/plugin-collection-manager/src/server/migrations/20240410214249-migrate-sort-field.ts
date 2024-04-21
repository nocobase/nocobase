/* istanbul ignore file -- @preserve */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.21.0-alpha.7';

  async up() {
    await this.syncCollectionsSortField();
    await this.syncAssociationSortField();
  }

  private async syncCollectionsSortField() {
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

  private async syncAssociationSortField() {
    const sortableAssociations = await this.db.getRepository('fields').find({
      filter: {
        'options.sortable': true,
      },
    });

    for (const field of sortableAssociations) {
      const collectionName = field.get('target');

      const collection = await this.db.getRepository('collections').findOne({
        filter: {
          name: collectionName,
        },
      });

      if (!collection) {
        continue;
      }

      const sortFieldName = field.get('sortBy') ? field.get('sortBy') : field.get('name') + '_sort';

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
