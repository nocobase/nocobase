import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { StandalonePageLayout } from '../../client/routing/standalone-page-layout.js';
import { AppThemeProvider } from '../../client/theme/index.js';

beforeEach(() => {
  // jsdom does not implement the media queries used by the real theme provider.
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener() {},
    removeListener() {},
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('class');
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-theme');
});

it.each(['/login', '/device'])(
  'renders standalone content at %s without an account menu',
  (path) => {
    render(
      <AppThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<StandalonePageLayout />}>
              <Route path={path} element={<h1>Standalone page</h1>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppThemeProvider>,
    );
    expect(
      screen.getByRole('heading', { name: 'Standalone page' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Theme' }),
    ).not.toBeInTheDocument();
  },
);
