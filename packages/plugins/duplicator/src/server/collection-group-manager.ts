import { Application } from '@nocobase/server';
import { CollectionGroup } from '@nocobase/database';

export class CollectionGroupManager {
  static collectionGroups: CollectionGroup[] = [];

  static getGroups(app: Application) {
    return app.db.collectionGroupManager.getGroups();
  }

  static getGroupsCollections(groups: CollectionGroup[]) {
    if (!groups || groups.length == 0) {
      return [];
    }

    return groups.map((collectionGroup) => collectionGroup.collections).flat();
  }

  static classifyCollectionGroups(collectionGroups: CollectionGroup[]) {
    const requiredGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'required');
    const optionalGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'optional');

    return {
      requiredGroups,
      optionalGroups,
    };
  }
}
