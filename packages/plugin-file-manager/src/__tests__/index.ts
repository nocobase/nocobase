import path from 'path';
import { mockDatabase, mockServer } from '@nocobase/test';

import plugin from '../server';

export function getDatabase() {
  return mockDatabase();
};

export async function getApp() {
  const app = mockServer();
  app.plugin(require('@nocobase/plugin-collections/src/server').default);
  app.plugin(plugin);
  await app.load();
  app.db.import({
    directory: path.resolve(__dirname, './tables')
  });
  try {
    await app.db.sync();
  } catch (error) {
    console.error(error);
  }
  
  return app;
}
