import { createMockServer } from '@nocobase/test';

export async function createApp(options = {}) {
  const app = await createMockServer({
    acl: false,
    ...options,
    plugins: ['users', 'error-handler', 'collection-manager', 'multi-app-manager', 'multi-app-share-collection'],
  });

  return app;
}
