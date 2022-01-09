import path from 'path';
import { MockServer, mockServer } from '@nocobase/test';

import plugin from '../server';

export async function getApp(options = {}): Promise<MockServer> {
  const app = mockServer(options);

  app.plugin(plugin);

  await app.load();

  app.db.import({
    directory: path.resolve(__dirname, './collections')
  });

  try {
    await app.db.sync();
  } catch (error) {
    console.error(error);
  }
  // TODO: need a better life cycle event than manually trigger
  await app.emitAsync('beforeStart');
  
  return app;
}
