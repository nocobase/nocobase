import { createMockServer, MockServer } from '@nocobase/test/server';
import settingsCollection from '../collections/backup-settings';

export async function getApp(options = {}): Promise<MockServer> {
  const app = await createMockServer({
    ...options,
    cors: {
      origin: '*',
    },
    plugins: ['backups', 'file-manager'],
    beforeInstall: async (app) => {
      await app.db.collection({
        name: 'storages',
        fields: [],
      });
      await app.db.collection(settingsCollection);
      await app.db.sync();
    },
  });

  return app;
}
