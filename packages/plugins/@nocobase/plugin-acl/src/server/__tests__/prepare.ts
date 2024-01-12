import { MockServer, createMockServer } from '@nocobase/test';

export async function prepareApp(): Promise<MockServer> {
  const app = await createMockServer({
    registerActions: true,
    acl: true,
    plugins: ['acl', 'error-handler', 'users', 'ui-schema-storage', 'collection-manager', 'auth'],
  });
  return app;
}
