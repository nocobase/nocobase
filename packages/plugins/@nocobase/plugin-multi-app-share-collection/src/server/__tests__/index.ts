import { mockServer } from '@nocobase/test';

export async function createApp(options = {}) {
  const app = mockServer({
    acl: false,
    ...options,
    plugins: ['users', 'error-handler', 'collection-manager', 'multi-app-manager', 'multi-app-share-collection'],
  });

  await app.runCommand('install', '-f');
  await app.runCommand('start');

  return app;
}
