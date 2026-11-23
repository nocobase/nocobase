import type * as AppClient from '@nocobase/app-client';

import { removeDemoLink } from './chat-client.js';

// The tests' stand-in for the application's API client: unlinking is the one request the linked details make; it
// changes the sample conversation in memory.
// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- stands in for the hook of the same name
export const useApiClient: typeof AppClient.useApiClient = () =>
  ({
    request: async ({ path, method }: { path: string; method?: string }) => {
      const unlink = /conversations\/([^/]+)\/links\/([^/]+)$/u.exec(path);
      if (method === 'DELETE' && unlink)
        removeDemoLink(
          decodeURIComponent(unlink[1]),
          decodeURIComponent(unlink[2]),
        );
      return { data: null };
    },
  }) as unknown as AppClient.ApiClient;
