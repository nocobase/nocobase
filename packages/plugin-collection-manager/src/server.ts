import { Plugin } from '@nocobase/server';
import { CollectionManager } from './collection-manager';
import { collectionsActions } from './actions/collection';
import lodash from 'lodash';
import { CollectionModel } from './collection-model';

export default class PluginCollectionManager extends Plugin {
  name() {
    return 'collection-manager';
  }

  async load(this: Plugin) {
    const db = this.app.db;

    await CollectionManager.import(db);

    this.app.resourcer.registerActionHandler('collections:create', collectionsActions.create);

    db.on('collections.beforeSave', async (model) => {
      if (!model.get('name')) {
        model.set('name', model.get('key'));
      }
    });

    db.on('collections.afterSave', async (model) => {
      // handle sortable option
      const previousSortOptions = lodash.get(model._previousDataValues, 'sortable');
      const sortOptions = lodash.get(model.get('options'), 'sortable');

      if (previousSortOptions != sortOptions) {
        const existSortField = await db.getCollection('fields').repository.findOne({
          filter: {
            collectionKey: model.get('key'),
            type: 'sort',
            name: 'auto-sort',
            // additional json query (options.autoSortField = true)
          },
        });

        if (sortOptions && !existSortField) {
          // add sort field
          const collectionModel = new CollectionModel(model, db);
          await collectionModel.addField({
            type: 'sort',
            name: 'auto-sort',
          });
        }
      }
    });
  }
}
