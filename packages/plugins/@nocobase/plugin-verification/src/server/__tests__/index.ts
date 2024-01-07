import { MockServer, createMockServer } from '@nocobase/test';
import path from 'path';

import { ApplicationOptions } from '@nocobase/server';

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface MockAppOptions extends ApplicationOptions {
  manual?: boolean;
}

export async function getApp(options: MockAppOptions = {}): Promise<MockServer> {
  const app = await createMockServer({
    ...options,
    plugins: ['verification'],
  });

  await app.db.import({
    directory: path.resolve(__dirname, './collections'),
  });

  try {
    await app.db.sync();
  } catch (error) {
    console.error(error);
  }

  return app;
}
