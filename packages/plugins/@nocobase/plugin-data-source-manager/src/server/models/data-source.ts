import { MagicAttributeModel } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { LocalData } from '../services/database-introspector';

export class DataSourceModel extends MagicAttributeModel {
  async loadIntoApplication(options: { app: Application }) {
    const { app } = options;
    const type = this.get('type');
    const createOptions = this.get('options');

    const instance = app.dataSourceManager.factory.create(type, {
      ...createOptions,
      name: this.get('key'),
    });

    const localData = await this.loadLocalData();

    await app.dataSourceManager.add(instance, {
      localData,
    });
  }

  private async loadLocalData(): Promise<LocalData> {
    const dataSourceKey = this.get('key');

    const remoteCollections = await this.db.getRepository('dataSourcesCollections').find({
      filter: {
        dataSourceKey,
      },
    });

    const remoteFields = await this.db.getRepository('dataSourcesFields').find({
      filter: {
        dataSourceKey,
      },
    });

    const localData = {};

    for (const remoteCollection of remoteCollections) {
      const remoteCollectionOptions = remoteCollection.toJSON();
      localData[remoteCollectionOptions.name] = remoteCollectionOptions;
    }

    for (const remoteField of remoteFields) {
      const remoteFieldOptions = remoteField.toJSON();
      const collectionName = remoteFieldOptions.collectionName;

      if (!localData[collectionName]) {
        localData[collectionName] = {
          name: collectionName,
          fields: [],
        };
      }

      if (!localData[collectionName].fields) {
        localData[collectionName].fields = [];
      }

      localData[collectionName].fields.push(remoteFieldOptions);
    }

    return localData;
  }
}
