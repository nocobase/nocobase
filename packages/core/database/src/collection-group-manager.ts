import { castArray, isString, uniq } from 'lodash';
import Database from './database';

export interface CollectionGroup {
  namespace: string;
  collections: string[];
  function: string;

  dumpable: 'required' | 'optional' | 'skip';
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

      const dumpable = (() => {
        if (!collection.options.duplicator) {
          return undefined;
        }

        if (isString(collection.options.duplicator)) {
          return {
            dumpable: collection.options.duplicator,
          };
        }

        return collection.options.duplicator;
      })();

      // if group not exists, create it
      if (!groups.has(groupKey)) {
        if (!dumpable) {
          skipped.push({
            name: collection.name,
            reason: 'no-dumpable',
          });
          continue;
        }

        const group: CollectionGroup = {
          namespace: groupKey,
          function: groupFunc,
          collections: dumpable.with ? castArray(dumpable.with) : [],
          dumpable: dumpable.dumpable,
        };

        if (dumpable.delayRestore) {
          group.delayRestore = dumpable.delayRestore;
        }

        groups.set(groupKey, group);
      }

      const group = groups.get(groupKey);
      group.collections.push(collection.name);

      if (dumpable.with) {
        group.collections.push(...castArray(dumpable.with));
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
