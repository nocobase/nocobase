import Database from '@nocobase/database';
import { CollectionOptions, ICollection, ICollectionManager, IRepository, MergeOptions } from './types';

export class SequelizeCollectionManager implements ICollectionManager {
  db: Database;

  constructor(options) {
    this.db = this.createDB(options.database);
  }

  createDB(options) {
    if (options instanceof Database) {
      return options;
    }
    return new Database(options);
  }

  registerFieldTypes(types: Record<string, any>) {
    this.db.registerFieldTypes(types);
  }

  registerFieldInterfaces() {}

  registerCollectionTemplates() {}

  registerModels(models: Record<string, any>) {
    return this.db.registerModels(models);
  }

  registerRepositories(repositories: Record<string, any>) {
    return this.db.registerModels(repositories);
  }

  getRegisteredRepository(key: any) {
    if (typeof key !== 'string') {
      return key;
    }
    return this.db.repositories.get(key);
  }

  defineCollection(options: CollectionOptions) {
    return this.db.collection(options);
  }

  extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection {
    return this.db.extendCollection(collectionOptions, mergeOptions) as unknown as ICollection;
  }

  hasCollection(name: string) {
    return this.db.hasCollection(name);
  }

  getCollection(name: string) {
    return this.db.getCollection(name);
  }

  getCollections() {
    return [...this.db.collections.values()];
  }

  getRepository<R = IRepository>(name: string, sourceId?: string | number): R {
    return this.db.getRepository(name, sourceId) as R;
  }

  async sync() {
    await this.db.sync();
  }
}
