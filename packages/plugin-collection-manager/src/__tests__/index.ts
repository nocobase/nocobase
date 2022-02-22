import { mockServer } from '@nocobase/test';
import CollectionManagerPlugin from '..';

export async function createApp() {
  const app = mockServer();
  await app.cleanDb();
  app.plugin(CollectionManagerPlugin);
  await app.load();
  return app;
}
