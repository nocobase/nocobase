import { CollectionManager } from './collection-manager';
import { ResourceManager } from './resource-manager';

export type DataSourceOptions = {
  name: string;
};

export class DataSource<O extends DataSourceOptions> {
  collectionManager: CollectionManager;
  resourceManager: ResourceManager;

  constructor(protected options: O) {
    this.collectionManager = new CollectionManager();
    this.resourceManager = new ResourceManager({
      prefix: '/api',
    });
    this.resourceManager.use(this.collectionManager.middleware());
  }

  get name() {
    return this.options.name;
  }

  middleware() {
    return this.resourceManager.restApiMiddleware();
  }
}
