import { startMockServer } from '@nocobase/test';

export default async function createApp() {
  const app = await startMockServer({
    plugins: ['nocobase'],
  });
  return app;
}
