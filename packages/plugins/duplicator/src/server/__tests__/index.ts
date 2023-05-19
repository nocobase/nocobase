import { mockServer } from '@nocobase/test';

export default async function createApp() {
  const app = mockServer();
  await app.plugin(require('../server').default, { name: 'duplicator' });
  await app.plugin('error-handler');
  await app.plugin('collection-manager');
  await app.loadAndInstall({ clean: true });

  return app;
}
