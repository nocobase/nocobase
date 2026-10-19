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

/** Where code outside the routes finds the application's query cache. */
export interface AppQueryCache {
  /**
   * The cache the pages read now. It changes whenever the routes remount, such as for each session, so read it when it
   * is needed instead of keeping it.
   */
  readonly current: QueryClient;
}

/**
 * The application's query cache for code outside the routes, such as a realtime listener that invalidates what pages
 * have loaded, or a React provider, which renders outside the cache the pages read. Pages call `useQueryClient()`.
 */
export const queryClientToken: ServiceToken<AppQueryCache> =
  createServiceToken<AppQueryCache>('@nocobase/app-client/query-client');

export function createAppQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: APP_QUERY_DEFAULTS });
}

/**
 * The query caches of one application. As under Refine, every mount of the routes gets a cache of its own, and it is
 * emptied when they unmount: the authorization provider remounts the routes for each session, so one person never reads
 * what the previous one loaded, and a request still running for that session cannot write into the next one's cache.
 */
export class AppQueryClients implements AppQueryCache {
  private readonly mounted: QueryClient[] = [];
  private readonly leaving = new Set<QueryClient>();
  private idle: QueryClient | undefined;

  /** The cache the mounted routes read, or the one the next mount takes when nothing is mounted. */
  public get current(): QueryClient {
    return this.mounted.at(-1) ?? (this.idle ??= createAppQueryClient());
  }

  /**
   * The cache a mount of the routes should provide. It is called while rendering, possibly more than once, and before
   * the routes it replaces have unmounted, so it never hands out a cache that is still mounted.
   */
  public forMount(): QueryClient {
    return this.idle ?? createAppQueryClient();
  }

  public attach(client: QueryClient): void {
    if (client === this.idle) {
      this.idle = undefined;
    }
    this.leaving.delete(client);
    this.mounted.push(client);
  }

  /**
   * Stops the cache's requests and empties it once the routes have really gone. React's development Strict Mode
   * unmounts and remounts in the same commit and attaches the same cache again, which keeps it.
   */
  public detach(client: QueryClient): void {
    const index = this.mounted.lastIndexOf(client);
    if (index !== -1) {
      this.mounted.splice(index, 1);
    }
    this.leaving.add(client);
    queueMicrotask(() => {
      if (this.leaving.delete(client)) {
        release(client);
      }
    });
  }

  public releaseAll(): void {
    for (const client of [...this.mounted.splice(0), ...this.leaving]) {
      release(client);
    }
    this.leaving.clear();
    if (this.idle) {
      release(this.idle);
      this.idle = undefined;
    }
  }
}

function release(client: QueryClient): void {
  void client.cancelQueries();
  client.clear();
}
