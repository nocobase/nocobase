import { ApiClientError } from '@nocobase/app-client';
import { QueryClient } from '@tanstack/react-query';
import { createContext, type Context } from 'react';

export const ApplicationCacheContext: Context<QueryClient | undefined> =
  createContext<QueryClient | undefined>(undefined);
function retry(failures: number, error: unknown): boolean {
  if (
    error instanceof ApiClientError &&
    error.status >= 400 &&
    error.status < 500
  )
    return false;
  return failures < 1;
}
export function createAgentSessionsCache(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry, staleTime: 5_000, refetchOnWindowFocus: false },
    },
  });
}
let shared: QueryClient | undefined;
export function agentSessionsQueryClient(): QueryClient {
  return (shared ??= createAgentSessionsCache());
}
