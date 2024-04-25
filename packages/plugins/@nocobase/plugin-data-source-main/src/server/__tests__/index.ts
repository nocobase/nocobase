import { createMockServer } from '@nocobase/test';

export async function createApp(options: any = {}) {
  const app = await createMockServer({
    acl: false,
    ...options,
    plugins: ['error-handler', 'data-source-main', 'ui-schema-storage'],
  });
  return app;
}
