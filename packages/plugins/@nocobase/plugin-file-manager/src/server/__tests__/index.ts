import { MockServer, createMockServer } from '@nocobase/test';
import send from 'koa-send';
import path from 'path';
import supertest from 'supertest';

export async function getApp(options = {}): Promise<MockServer> {
  const app = await createMockServer({
    ...options,
    cors: {
      origin: '*',
    },
    plugins: ['file-manager'],
    acl: false,
  });

  app.use(async (ctx, next) => {
    if (ctx.path.startsWith('/storage/uploads')) {
      await send(ctx, ctx.path, { root: process.cwd() });
      return;
    }
    await next();
  });

  await app.db.import({
    directory: path.resolve(__dirname, './tables'),
  });

  await app.db.sync();

  return app;
}

// because the app in supertest will use a random port
export function requestFile(url, agent) {
  // url starts with double slash "//" will be considered as http or https
  // url starts with single slash "/" will be considered from local server
  return url[0] === '/' && url[1] !== '/' ? agent.get(url) : supertest.agent(url).get('');
}
