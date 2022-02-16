import { Repository } from '@nocobase/database';
import { CollectionModel } from '../models/collection';

interface LoadOptions {
  filter?: any;
  skipExist?: boolean;
}

export class CollectionRepository extends Repository {
  async load(options: LoadOptions = {}) {
    const { filter, skipExist } = options;
    const instances = (await this.find({ filter })) as CollectionModel[];
    for (const instance of instances) {
      await instance.load({ skipExist });
    }
  }
}
