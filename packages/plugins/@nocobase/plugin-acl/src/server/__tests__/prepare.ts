import { createMockServer, MockServer } from '@nocobase/test';

export async function prepareApp(): Promise<MockServer> {
  const app = await createMockServer({
    registerActions: true,
    acl: true,
    plugins: ['acl', 'error-handler', 'users', 'ui-schema-storage', 'data-source-main', 'auth', 'data-source-manager'],
  });
  return app;
}
