import { createMockServer } from '@nocobase/test';

export async function createApp(options: any = {}) {
  const app = await createMockServer({
    acl: false,
    ...options,
    plugins: ['error-handler', 'collection-manager', 'ui-schema-storage'],
  });
  return app;
}
