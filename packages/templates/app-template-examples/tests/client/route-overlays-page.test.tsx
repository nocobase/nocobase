import { renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import packageMetadata from '../../package.json' with { type: 'json' };
import RouteDialogExamplePage from '../../client/pages/route-overlays/dialog/index.js';
import RouteOverlaysPage from '../../client/pages/route-overlays/index.js';
import enUS from '../../client/locales/en-US.js';

const options = {
  namespace: packageMetadata.name,
  namespaces: { [packageMetadata.name]: enUS },
};

describe('RouteOverlaysPage', () => {
  it('offers direct links to both nested overlay paths', async () => {
    await renderWithApp(
      <Routes>
        <Route path='/route-overlays/*' element={<RouteOverlaysPage />} />
      </Routes>,
      { ...options, route: '/route-overlays' },
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
    const view = await renderWithApp(
      <Routes>
        <Route
          path='/route-overlays/dialog/*'
          element={<RouteDialogExamplePage />}
        />
      </Routes>,
      { ...options, route: '/route-overlays/dialog' },
    );

    fireEvent.click(
      await screen.findByRole('button', { name: enUS.routeOverlays.showToast }),
    );
    expect(view.toasts()).toEqual([
      expect.objectContaining({
        type: 'success',
        title: enUS.routeOverlays.toastTitle,
        description: enUS.routeOverlays.toastDescription,
      }),
    ]);
  });
});
