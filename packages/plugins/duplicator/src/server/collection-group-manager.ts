import { Application } from '@nocobase/server';
import { CollectionGroup, CollectionGroupWithCollectionTitle } from '@nocobase/database';
import { isString } from 'lodash';

export class CollectionGroupManager {
  static collectionGroups: CollectionGroup[] = [];

  static getGroups(app: Application) {
    return app.db.collectionGroupManager.getGroups();
  }

  static getGroupsCollections(groups: Array<CollectionGroupWithCollectionTitle>): string[] {
    if (!groups || groups.length == 0) {
      return [];
    }

    return groups
      .map((collectionGroup) =>
        collectionGroup.collections.map((collection) => (isString(collection) ? collection : collection.name)),
      )
      .flat();
  }

  static classifyCollectionGroups(collectionGroups: CollectionGroupWithCollectionTitle[]) {
    const requiredGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'required');
    const optionalGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'optional');

    return {
      requiredGroups,
      optionalGroups,
    };
  }
}
