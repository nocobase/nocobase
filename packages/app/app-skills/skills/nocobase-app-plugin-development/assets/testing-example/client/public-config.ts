import type { ClientApplication } from '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    readingList: { pageSize?: number };
  }
}

export function readingListPageSize(
  app: Pick<ClientApplication, 'config'>,
): number {
  return app.config.public.get('readingList.pageSize', 20);
}
