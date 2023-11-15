import { Collection, CollectionOptions } from './collection';
import Database from './database';

export class CollectionFactory {
  private collectionTypes: Array<{
    ctor: typeof Collection;
    condition: (options: CollectionOptions) => boolean;
  }> = [];

  constructor(private database: Database) {}

  registerCollectionType(collectionClass: typeof Collection, condition: (options: CollectionOptions) => boolean) {
    this.collectionTypes.push({ ctor: collectionClass, condition });
  }

  createCollection<T extends Collection>(options: CollectionOptions): T {
    let klass = Collection;
    for (const { ctor, condition } of this.collectionTypes) {
      if (condition(options)) {
        klass = ctor;
        break;
      }
    }

    return new klass(options, {
      database: this.database,
    }) as T;
  }
}
