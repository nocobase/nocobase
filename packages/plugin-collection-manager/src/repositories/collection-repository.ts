import { FindOptions, Repository } from '@nocobase/database';
import { CollectionModel } from '../models/collection-model';

interface LoadOptions extends FindOptions {}

export class CollectionRepository extends Repository {
  async load(options?: LoadOptions) {
    const instances = (await this.find(options)) as CollectionModel[];
    for (const instance of instances) {
      await this.loadCollectionModel(instance);
    }
  }

  async loadCollectionModel(instance: CollectionModel) {
    return instance.load();
  }
}
