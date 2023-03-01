import lodash, { castArray, isString } from 'lodash';
import { Application } from '@nocobase/server';

export interface CollectionGroup {
  namespace: string;
  collections: string[];
  function: string;

  dumpable: 'required' | 'optional' | 'skip';
  delayRestore?: any;
}

export class CollectionGroupManager {
  static collectionGroups: CollectionGroup[] = [];

  static registerCollectionGroup(collectionGroup: CollectionGroup) {
    this.collectionGroups.push(collectionGroup);
  }

  static getGroups(app: Application) {
    const collections = [...app.db.collections.values()];
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

      app.logger.warn(`collection ${skipItem.name} is not in any collection group, reason: ${skipItem.reason}.`);
    }

    return results;
  }

  static getGroupsCollections(groups: string[] | CollectionGroup[]) {
    if (!groups || groups.length == 0) {
      return [];
    }

    if (lodash.isPlainObject(groups[0])) {
      return (groups as CollectionGroup[]).map((collectionGroup) => collectionGroup.collections).flat();
    }

    return this.collectionGroups
      .filter((collectionGroup) => {
        const groupKey = `${collectionGroup.namespace}.${collectionGroup.function}`;
        return (groups as string[]).includes(groupKey);
      })
      .map((collectionGroup) => collectionGroup.collections)
      .flat();
  }

  static classifyCollectionGroups(collectionGroups: CollectionGroup[]) {
    const requiredGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'required');
    const optionalGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'optional');

    return {
      requiredGroups,
      optionalGroups,
    };
  }

  static getDelayRestoreCollectionGroups() {
    return this.collectionGroups.filter((collectionGroup) => collectionGroup.delayRestore);
  }
}
