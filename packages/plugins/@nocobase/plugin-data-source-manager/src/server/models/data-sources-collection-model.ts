import { MagicAttributeModel } from '@nocobase/database';
import { Application } from '@nocobase/server';

export class DataSourcesCollectionModel extends MagicAttributeModel {
  load(loadOptions: { app: Application }) {
    const { app } = loadOptions;

    const collectionOptions = this.get();
    const dataSourceName = this.get('dataSourceKey');
    const dataSource = app.dataSourceManager.dataSources.get(dataSourceName);
    const collection = dataSource.collectionManager.getCollection(collectionOptions.name);
    collection.updateOptions(collectionOptions);
  }
}
