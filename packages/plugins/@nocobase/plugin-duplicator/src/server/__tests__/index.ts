import { mockServer } from '@nocobase/test';

export default async function createApp() {
  const app = mockServer();
  app.plugin((await import('../server')).default, { name: 'duplicator' });
  app.plugin('error-handler');
  app.plugin('collection-manager');
  await app.loadAndInstall({ clean: true });

  return app;
}
