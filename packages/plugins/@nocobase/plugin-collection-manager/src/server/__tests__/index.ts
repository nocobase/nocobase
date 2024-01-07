import { mockServer } from '@nocobase/test';

export async function createApp(options: any = {}) {
  const app = mockServer({
    acl: false,
    ...options,
    plugins: ['error-handler', 'collection-manager', 'ui-schema-storage'],
  });
  await app.runCommand('install', '-f');
  await app.runCommand('start');
  return app;
}
