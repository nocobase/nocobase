import { Migration } from '@nocobase/server';
import { CollectionsGraph } from '@nocobase/utils';

export default class extends Migration {
  appVersion = '<0.9.3-alpha.1';
  async up() {
    const result = await this.app.version.satisfies('<0.9.3-alpha.1');

    if (!result) {
      return;
    }

    if (!this.app.db.getCollection('applications')) return;

    await this.app.db.getCollection('collections').repository.destroy({
      where: {
        name: 'applications',
      },
    });

    const appSyncedCollections: Map<string, Set<string>> = new Map();

    const collections = await this.app.db.getCollection('collections').repository.find();
    const collectionsData = collections.map((collection) => collection.toJSON());

    for (const collection of collections) {
      const collectionSyncToApps = collection.get('syncToApps');
      if (collectionSyncToApps) {
        for (const app of collectionSyncToApps) {
          if (!appSyncedCollections.has(app)) {
            appSyncedCollections.set(app, new Set());
          }
          appSyncedCollections.get(app).add(collection.name);
        }
      }
    }

    const allCollections = collections.map((collection) => collection.name);

    const appCollectionBlacklist = this.app.db.getCollection('appCollectionBlacklist');

    for (const [app, syncedCollections] of appSyncedCollections) {
      const blackListCollections = allCollections.filter(
        (collection) => !syncedCollections.has(collection) && !['users', 'roles'].includes(collection),
      );

      const connectedCollections = CollectionsGraph.connectedNodes({
        collections: collectionsData,
        nodes: blackListCollections,
        direction: 'reverse',
      });

      console.log(
        JSON.stringify(
          {
            app,
            connectedCollections,
          },
          null,
          2,
        ),
      );

      await appCollectionBlacklist.model.bulkCreate(
        connectedCollections.map((collection) => {
          return {
            applicationName: app,
            collectionName: collection,
          };
        }),
      );
    }
  }
}
