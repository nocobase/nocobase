import { DataSource } from './data-source';
import { SequelizeCollectionManager } from './sequelize-collection-manager';

export class SequelizeDataSource extends DataSource {
  async load() {}

  createCollectionManager(options?: any) {
    return new SequelizeCollectionManager(options.collectionManager);
  }
}
