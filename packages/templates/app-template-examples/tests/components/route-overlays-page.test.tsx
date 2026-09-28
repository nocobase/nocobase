import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import RouteDialogExamplePage from '../../client/pages/route-overlays/dialog/index.js';
import RouteOverlaysPage from '../../client/pages/route-overlays/index.js';

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
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
    );

    expect(
      screen.getByRole('heading', { name: 'routeOverlays.title', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /routeOverlays\.openDialogDrawer/ }),
    ).toHaveAttribute('href', '/route-overlays/dialog/drawer');
    expect(
      screen.getByRole('button', { name: /routeOverlays\.openDrawerDialog/ }),
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
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'routeOverlays.showToast' }),
    );
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'routeOverlays.toastTitle',
      description: 'routeOverlays.toastDescription',
    });
  });
});
