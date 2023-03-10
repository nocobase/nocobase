import Database from './database';
import { isString, castArray } from 'lodash';

export interface CollectionGroup {
  namespace: string;
  collections: string[];
  function: string;

  dumpable: 'required' | 'optional' | 'skip';
  delayRestore?: any;
}

export class CollectionGroupManager {
  constructor(public db: Database) {}

  getGroups() {
    const collections = [...this.db.collections.values()];
    const groups = new Map<string, CollectionGroup>();

    const skipped = [];

    for (const collection of collections) {
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

      if (!groups.has(groupKey)) {
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

        if (!dumpable) {
          skipped.push({
            name: collection.name,
            reason: 'no-dumpable',
          });
          continue;
        }

        const group: CollectionGroup = {
          namespace,
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
    }

    const results = [...groups.values()];
    const groupCollections = results.map((i) => i.collections).flat();

    for (const skipItem of skipped) {
      if (groupCollections.includes(skipItem.name)) {
        continue;
      }

      this.db.logger.warn(`collection ${skipItem.name} is not in any collection group, reason: ${skipItem.reason}.`);
    }

    return results;
  }
}
