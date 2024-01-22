import { MagicAttributeModel } from '@nocobase/database';
import { Application } from '@nocobase/server';

type LoadOptions = {
  app: Application;
};
export class RemoteFieldModel extends MagicAttributeModel {
  load(loadOptions: LoadOptions) {
    const options = this.get();
    const { collectionName, name, connectionName } = options;
    const database = loadOptions.app.getDb(connectionName);
    const collection = database.getCollection(collectionName);
    const oldField = collection.getField(name);

    const newOptions = {
      ...(oldField?.options || {}),
      ...options,
    };

    collection.setField(name, newOptions);

    const interfaceOption = options.interface;

    if (interfaceOption === 'updatedAt') {
      // @ts-ignore
      collection.model._timestampAttributes.createdAt = this.get('name');
    }

    if (interfaceOption === 'createdAt') {
      // @ts-ignore
      collection.model._timestampAttributes.updatedAt = this.get('name');
    }
  }

  unload(loadOptions: LoadOptions) {
    const options = this.get();
    const { collectionName, name, connectionName } = options;
    const database = loadOptions.app.getDb(connectionName);
    const collection = database.getCollection(collectionName);
    collection.removeField(name);
  }
}
