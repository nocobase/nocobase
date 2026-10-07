import { TestI18nProvider } from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import { TooltipProvider } from '@/components/ui/tooltip';

import { runtime } from './fixtures';

/** What an application gives the inbox: a query client, a router, the tooltip provider and the i18n runtime. */
export function Frame({
  children,
  path = '/inbox',
  client,
}: {
  readonly children: ReactNode;
  readonly path?: string;
  readonly client?: QueryClient;
}): ReactElement {
  return (
    <QueryClientProvider
      client={
        client ??
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>
        <TestI18nProvider runtime={runtime}>
          <TooltipProvider>{children}</TooltipProvider>
        </TestI18nProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
