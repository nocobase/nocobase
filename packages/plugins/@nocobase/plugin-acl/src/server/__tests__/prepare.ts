import { MockServer, startMockServer } from '@nocobase/test';

export async function prepareApp(): Promise<MockServer> {
  const app = startMockServer({
    registerActions: true,
    acl: true,
    plugins: ['acl', 'error-handler', 'users', 'ui-schema-storage', 'collection-manager', 'auth'],
  });
  return app;
}
