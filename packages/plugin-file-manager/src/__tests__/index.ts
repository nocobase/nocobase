import path from 'path';
import supertest from 'supertest';
import { MockServer, mockServer } from '@nocobase/test';

import plugin from '../';

export async function getApp(options = {}): Promise<MockServer> {
  const app = mockServer({
    ...options,
    cors: {
      origin: '*',
    },
  });

  app.plugin(plugin);

  await app.load();

  app.db.import({
    directory: path.resolve(__dirname, './tables'),
  });
  try {
    await app.db.sync();
  } catch (error) {
    console.error(error);
  }

  await app.emitAsync('beforeStart');

  return app;
}

// because the app in supertest will use a random port
export function requestFile(url, agent) {
  // url starts with double slash "//" will be considered as http or https
  // url starts with single slash "/" will be considered from local server
  return url[0] === '/' && url[1] !== '/' ? agent.get(url) : supertest.agent(url).get('');
}
