import { Plugin } from '@nocobase/server';
import { CollectionManager } from './collection-manager';
import { collectionsActions } from './actions/collection';
import { fieldActions } from './actions/fields';
import { Database } from '@nocobase/database';
import { CollectionModel } from './models/collection-model';
import { FieldModel } from './models/field-model';
import { CollectionRepository } from './repositories/collection-repository';

export default class PluginCollectionManager extends Plugin {
  name() {
    return 'collection-manager';
  }

  registerModel(db: Database) {
    db.registerModels({
      CollectionModel,
      FieldModel,
    });
  }

  registerRepository(db: Database) {
    db.registerRepositories({
      CollectionRepository,
    });
  }
  async load() {
    const db = this.app.db;

    this.registerModel(db);
    this.registerRepository(db);

    await CollectionManager.import(db);

    this.app.resourcer.registerActionHandler('collections:create', collectionsActions.create);
    this.app.resourcer.registerActionHandler('collections:get', collectionsActions.get);

    this.app.resourcer.registerActionHandler('collections.fields:create', fieldActions.create);
    this.app.resourcer.registerActionHandler('collections.fields:get', fieldActions.get);
    this.app.resourcer.registerActionHandler('collections.fields:destroy', fieldActions.destroy);
    this.app.resourcer.registerActionHandler('collections.fields:list', fieldActions.list);

    db.on('collections.beforeSave', async (model) => {
      if (!model.get('name')) {
        model.set('name', model.get('key'));
      }
    });

    db.on('fields.beforeCreate', async (model) => {
      if (!model.get('name')) {
        model.set('name', model.get('key'));
      }
    });
  }
}
