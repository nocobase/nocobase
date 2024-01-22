import { mockServer } from '@nocobase/test';
import PluginDatabaseConnections from '../plugin';
import { ApplicationOptions } from '@nocobase/server';

export async function createApp(options: ApplicationOptions & { clean?: boolean } = { clean: true }) {
  const app = mockServer(options);

  const { clean: cleanDb } = options;

  if (cleanDb) {
    await app.cleanDb();
  }

  app.plugin('nocobase');
  app.plugin('map');

  app.plugin(PluginDatabaseConnections, { name: 'database-connections' });

  await app.loadAndInstall({ clean: cleanDb });
  await app.start();
  return app;
}
