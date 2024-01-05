import { mockServer } from '@nocobase/test';

export default async function createApp() {
  const app = mockServer({
    plugins: ['nocobase', 'backup-restore'],
  });

  await app.runCommand('install', '-f');
  await app.runCommand('start');

  return app;
}
