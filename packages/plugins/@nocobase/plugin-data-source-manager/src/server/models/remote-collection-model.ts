import { MagicAttributeModel } from '@nocobase/database';
import { Application } from '@nocobase/server';

export class RemoteCollectionModel extends MagicAttributeModel {
  load(loadOptions: { app: Application }) {
    const { app } = loadOptions;

    const collectionOptions = this.get();
    const databaseName = this.get('connectionName');
    const database = app.getDb(databaseName);
    const collectionName = this.get('name');
    const collection = database.getCollection(collectionName);
    collection.updateOptions(collectionOptions);
  }
}
