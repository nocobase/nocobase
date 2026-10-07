/** Renders a page in a router and a fresh query cache. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { PageBreadcrumbProvider } from '@nocobase/app-client';
import { MemoryRouter, Route, Routes } from 'react-router';

import { HeaderTrail } from './header-trail.js';

export function renderPage(element: ReactElement): RenderResult {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/config']}>{element}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Renders `element` as the route `path` (with its parameters) at `url`. */
export function renderRoute(
  element: ReactElement,
  path: string,
  url: string,
): RenderResult {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <PageBreadcrumbProvider>
          <HeaderTrail />
          <Routes>
            <Route path={path} element={element} />
            <Route path='*' element={<p>elsewhere</p>} />
          </Routes>
        </PageBreadcrumbProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
