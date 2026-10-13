import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('matchMedia', () => ({
  matches: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

const { AccountSettingsDialog } =
  await import('../../client/account/account-dialog');
const { default: AccountSettingsRoute } =
  await import('../../client/pages/account/index');
const { ReturnLocationsContext, useTrackReturnLocations } =
  await import('../../client/layouts/return-locations');

function Where(): ReactElement {
  const { pathname, search } = useLocation();
  return <output data-testid='where'>{pathname + search}</output>;
}

/** What the layout does: follows the locations, and draws the dialog over every page. */
function Shell(): ReactElement {
  const returns = useTrackReturnLocations(useLocation());
  return (
    <ReturnLocationsContext.Provider value={returns}>
      <Routes>
        <Route path='/account' element={<AccountSettingsRoute />}>
          <Route path=':category' element={<AccountSettingsRoute />} />
        </Route>
        <Route
          path='*'
          element={<Link to='/account/git'>connect your account</Link>}
        />
      </Routes>
      <AccountSettingsDialog />
      <Where />
    </ReturnLocationsContext.Provider>
  );
}

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Shell />
    </MemoryRouter>,
  );
}

const where = () => screen.getByTestId('where').textContent;

describe('the account settings dialog', () => {
  it('lists the categories in their groups, in order, and marks the open one', () => {
    renderAt('/issues?account=security');
    const dialog = screen.getByRole('dialog', {
      name: 'accountSettings.title',
    });
    const nav = within(dialog).getByRole('navigation', {
      name: 'accountSettings.categoriesLabel',
    });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/issues?account=profile',
      '/issues?account=security',
      '/issues?account=preferences',
      '/issues?account=api-keys',
      '/issues?account=git',
    ]);
    expect(links[1]).toHaveAttribute('aria-current', 'page');
    expect(
      within(nav).getByText('accountSettings.groups.account'),
    ).toBeTruthy();
    expect(
      within(nav).getByText('accountSettings.groups.integrations'),
    ).toBeTruthy();
    expect(
      dialog.querySelector('[data-account-category="security"]'),
    ).not.toBeNull();
  });

  it('is closed without the parameter', () => {
    renderAt('/issues');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens an address visited directly over home, on the first category when it is missing or unknown', () => {
    renderAt('/account');
    expect(where()).toBe('/?account=profile');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('sends an unknown category to the first one', () => {
    renderAt('/account/nothing');
    expect(where()).toBe('/?account=profile');
  });

  it('opens a link followed in the app over the page it was followed from', () => {
    renderAt('/issues?view=board');
    fireEvent.click(screen.getByRole('link', { name: 'connect your account' }));
    expect(where()).toBe('/issues?view=board&account=git');
    expect(
      screen.getByRole('dialog').querySelector('[data-account-category="git"]'),
    ).not.toBeNull();
  });

  it('keeps what the code host sent the person back with, for the category to read', () => {
    renderAt(
      '/account/git?error=GIT_AUTHORIZATION_REFUSED&hostError=redirect_uri_mismatch',
    );
    expect(where()).toBe(
      '/?error=GIT_AUTHORIZATION_REFUSED&hostError=redirect_uri_mismatch&account=git',
    );
  });
});
