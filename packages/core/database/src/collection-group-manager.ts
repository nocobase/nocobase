import { castArray, uniq } from 'lodash';
import Database from './database';
import { BaseDuplicatorObject, Duplicator } from './collection';

type MetaDataType = 'meta';
type ConfigDataType = 'config';
type BusinessDataType = 'business';

export type DumpDataType = MetaDataType | ConfigDataType | BusinessDataType;
export type Dumpable = 'required' | 'optional' | 'skip';

// Collection Group is a collection of collections, which can be dumped and restored together.
export interface CollectionGroup {
  namespace: string;
  collections: string[];
  function: string;
  dataType: DumpDataType;
  delayRestore?: any;
}

export interface CollectionGroupWithCollectionTitle extends Omit<CollectionGroup, 'collections'> {
  collections: Array<{
    name: string;
    title: string;
  }>;
}

export class CollectionGroupManager {
  constructor(public db: Database) {}

  static unifyDuplicatorOption(duplicatorOption: Duplicator):
    | (BaseDuplicatorObject & {
        dataType: DumpDataType;
      })
    | undefined {
    if (!duplicatorOption) {
      return undefined;
    }

    if (typeof duplicatorOption === 'string') {
      switch (duplicatorOption) {
        case 'skip':
          return undefined;
        case 'required':
          return { dataType: 'meta' };
        case 'optional':
          throw new Error('optional collection must have dataType specified');
      }
    }

    if ('dumpable' in duplicatorOption && duplicatorOption.dumpable === 'required') {
      const { dumpable, ...rest } = duplicatorOption;
      return {
        ...rest,
        dataType: 'meta',
      };
    }

    if ('dataType' in duplicatorOption) {
      return {
        dataType: duplicatorOption.dataType,
        ...duplicatorOption,
      };
    }

    throw new Error('invalid duplicator option');
  }

  // get all collection groups
  getGroups(): Array<CollectionGroupWithCollectionTitle> {
    const groups = new Map<string, CollectionGroup>();

    const skipped = [];

    for (const [_, collection] of this.db.collections) {
      const groupKey = collection.options.namespace;

      if (!groupKey) {
        continue;
      }

      const [namespace, groupFunc] = groupKey.split('.');

      if (!groupFunc) {
        skipped.push({
          name: collection.name,
          reason: 'no-group-function',
        });

        continue;
      }

      let duplicator: ReturnType<typeof CollectionGroupManager.unifyDuplicatorOption>;

      try {
        duplicator = CollectionGroupManager.unifyDuplicatorOption(collection.options.duplicator);
      } catch (error) {
        throw new Error(`collection ${collection.name} has invalid duplicator option: ${error.message}`, {
          cause: error,
        });
      }

      if (!duplicator) {
        skipped.push({
          name: collection.name,
          reason: 'no-dumpable',
        });
        continue;
      }

      // if group not exists, create it
      if (!groups.has(groupKey)) {
        const group: CollectionGroup = {
          namespace: namespace,
          function: groupFunc,
          collections: duplicator.with ? castArray(duplicator.with) : [],
          dataType: duplicator.dataType,
        };

        if (duplicator.delayRestore) {
          group.delayRestore = duplicator.delayRestore;
        }

        groups.set(groupKey, group);
      }

      const group = groups.get(groupKey);

      const groupDataType = group.dataType;
      if (groupDataType !== duplicator.dataType) {
        throw new Error(
          `collection ${collection.name} has invalid dataType, it conflicts with other collections in the same group, group dataType: ${groupDataType}, collection dataType: ${duplicator.dataType}`,
        );
      }

      group.collections.push(collection.name);

      if (duplicator.with) {
        group.collections.push(...castArray(duplicator.with));
      }

      group.collections = uniq(group.collections);
    }

    const results = [...groups.values()];
    const groupCollections = results.map((i) => i.collections).flat();

    for (const skipItem of skipped) {
      if (groupCollections.includes(skipItem.name)) {
        continue;
      }

      this.db.logger.warn(`collection ${skipItem.name} is not in any collection group, reason: ${skipItem.reason}.`);
    }

    return results.map((group) => {
      return {
        ...group,
        collections: group.collections.map((name) => {
          const collection = this.db.getCollection(name);
          return {
            name,
            title: collection.options.title || name,
          };
        }),
      };
    });
  }
}
