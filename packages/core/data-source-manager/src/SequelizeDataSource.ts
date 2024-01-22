import { DataSource } from './DataSource';
import { SequelizeCollectionManager } from './SequelizeCollectionManager';

export class SequelizeDataSource extends DataSource {
  async load() {}

  createCollectionManager(options?: any) {
    return new SequelizeCollectionManager(options);
  }
}
