import { mockServer, MockServer } from '@nocobase/test';

export async function prepareApp(): Promise<MockServer> {
  const app = mockServer({
    registerActions: true,
    acl: true,
    plugins: ['acl', 'error-handler', 'users', 'ui-schema-storage', 'collection-manager', 'auth'],
  });

  await app.quickstart({ clean: true });

  return app;
}
