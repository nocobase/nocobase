import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import RouteDialogExamplePage from '../../client/pages/route-overlays/dialog/index.js';
import RouteOverlaysPage from '../../client/pages/route-overlays/index.js';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-examples',
    resources: enUS,
  },
});

function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider
      runtime={runtime}
      namespace='@nocobase/app-template-examples'
    >
      {children}
    </TestI18nProvider>
  );
}

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock('@nocobase/app-client', () => {
  const toaster = { show: showToast, close: vi.fn() };
  return { useToaster: () => toaster };
});

describe('RouteOverlaysPage', () => {
  it('offers direct links to both nested overlay paths', () => {
    render(
      <MemoryRouter initialEntries={['/route-overlays']}>
        <Routes>
          <Route path='/route-overlays/*' element={<RouteOverlaysPage />} />
        </Routes>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    expect(
      screen.getByRole('heading', { name: enUS.routeOverlays.title, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: enUS.routeOverlays.openDialogDrawer }),
    ).toHaveAttribute('href', '/route-overlays/dialog/drawer');
    expect(
      screen.getByRole('button', { name: enUS.routeOverlays.openDrawerDialog }),
    ).toHaveAttribute('href', '/route-overlays/drawer/dialog');
  });

  it('raises a notification from inside the dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/route-overlays/dialog']}>
        <Routes>
          <Route
            path='/route-overlays/dialog/*'
            element={<RouteDialogExamplePage />}
          />
        </Routes>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    fireEvent.click(
      await screen.findByRole('button', { name: enUS.routeOverlays.showToast }),
    );
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      title: enUS.routeOverlays.toastTitle,
      description: enUS.routeOverlays.toastDescription,
    });
  });
});
