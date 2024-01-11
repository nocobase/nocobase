import { Collection, CollectionOptions } from './collection';
import Database from './database';
import { Model } from './model';

type CollectionTypeOptions = {
  condition: (options: CollectionOptions) => boolean;
  onSync?: (model: typeof Model, options: any) => Promise<void>;
  onDump?: (dumper: any, collection: Collection) => Promise<void>;
};

export class CollectionFactory {
  // Using a Map with the collection subclass as the key and options as the value
  public collectionTypes: Map<typeof Collection, CollectionTypeOptions> = new Map();

  constructor(private database: Database) {}

  registerCollectionType(
    collectionClass: typeof Collection, // Using the collection class as the key
    options: CollectionTypeOptions,
  ) {
    // Storing the options associated with the collection class
    this.collectionTypes.set(collectionClass, options);
  }

  createCollection<T extends Collection>(collectionOptions: CollectionOptions): T {
    let klass: typeof Collection = Collection;

    // Iterating over the map to find the right class based on the condition
    for (const [ctor, options] of this.collectionTypes) {
      if (options.condition(collectionOptions)) {
        klass = ctor;
        break;
      }
    }

    return new klass(collectionOptions, {
      database: this.database,
    }) as T;
  }
}
