/** Renders pages in a router and a fresh query cache, with a probe showing where the router is. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { HistoryBack } from './history-back.js';
import { LocationProbe } from './location-probe.js';

export function renderAt(
  path: string,
  routes: { readonly path: string; readonly element: ReactElement }[],
  /** Pages visited before `path`, oldest first; with them, `history-back` goes back like the browser. */
  history: readonly string[] = [],
): RenderResult {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[...history, path]}>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
        <LocationProbe />
        {history.length > 0 ? <HistoryBack /> : null}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
