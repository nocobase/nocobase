import { mockServer } from '@nocobase/test';
import Duplicator from '../server';

export default async function createApp() {
  const app = mockServer();
  await app.plugin(Duplicator, { name: 'duplicator' });
  await app.plugin('error-handler');
  await app.plugin('collection-manager');
  await app.loadAndInstall({ clean: true });

  return app;
}
