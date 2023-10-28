import { Application } from '@nocobase/server';
import { CollectionGroup, CollectionGroupWithCollectionTitle } from '@nocobase/database';

export class CollectionGroupManager {
  static collectionGroups: CollectionGroup[] = [];

  static getGroups(app: Application) {
    return app.db.collectionGroupManager.getGroups();
  }

  static getGroupsCollections(groups: CollectionGroup[] | CollectionGroupWithCollectionTitle[]) {
    if (!groups || groups.length == 0) {
      return [];
    }

    return groups.flatMap((collectionGroup) => {
      if ('name' in collectionGroup.collections[0]) {
        // This is a CollectionGroupWithCollectionTitle type
        return collectionGroup.collections.map((c) => c.name);
      } else {
        // This is a CollectionGroup type
        return collectionGroup.collections;
      }
    });
  }
}
