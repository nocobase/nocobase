import { mockServer } from '@nocobase/test';
import CollectionManagerPlugin from '..';

export async function createApp() {
  const app = mockServer();
  const queryInterface = app.db.sequelize.getQueryInterface();
  await queryInterface.dropAllTables();
  app.plugin(CollectionManagerPlugin);
  await app.load();
  return app;
}
