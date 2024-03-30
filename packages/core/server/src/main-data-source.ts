import { DataSourceOptions, SequelizeDataSource } from '@nocobase/data-source-manager';
import { parseVariables } from './middlewares';
import { dateTemplate } from './middlewares/data-template';

export class MainDataSource extends SequelizeDataSource {
  init(options: DataSourceOptions = {}) {
    const { acl, resourceManager, database } = options;

    this.acl = acl;
    this.resourceManager = resourceManager;

    this.collectionManager = this.createCollectionManager({
      collectionManager: {
        database,
        collectionsFilter: (collection) => {
          return collection.options.loadedFromCollectionManager;
        },
      },
    });

    if (options.acl !== false) {
      this.resourceManager.use(this.acl.middleware(), { tag: 'acl', after: ['auth'] });
    }

    this.resourceManager.use(parseVariables, {
      tag: 'parseVariables',
      after: 'acl',
    });

    this.resourceManager.use(dateTemplate, { tag: 'dateTemplate', after: 'acl' });
  }
}
