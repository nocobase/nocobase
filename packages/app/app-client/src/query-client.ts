import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import {
  keepPreviousData,
  QueryClient,
  type DefaultOptions,
} from '@tanstack/react-query';

/**
 * The application's query cache, the one `useQueryClient()` returns under `AppClientRoot`. Code outside React resolves
 * it here to invalidate what a page has loaded, for example when a realtime event announces a change.
 */
export const queryClientToken: ServiceToken<QueryClient> =
  createServiceToken<QueryClient>('@nocobase/app-client/query-client');

/**
 * The defaults the query cache had while Refine created it, kept so pages and plugins that read it behave as they did:
 * returning to the window does not refetch, and a query whose key changes keeps showing the previous data until the
 * new data arrives.
 */
export const APP_QUERY_DEFAULTS: DefaultOptions = Object.freeze({
  queries: Object.freeze({
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  }),
});

export function createAppQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: APP_QUERY_DEFAULTS });
}
