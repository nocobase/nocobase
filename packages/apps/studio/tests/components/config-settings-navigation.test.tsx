import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

const readable = new Set<string>();

vi.stubGlobal('matchMedia', () => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

vi.mock('@nocobase/app-plugin-projects/client/kit', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({ userId: 'u1' }),
  canUseSetting: (_viewer: unknown, item: string, action: string) =>
    action === 'read' && readable.has(item),
}));

vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: ({
    resource,
    action,
  }: {
    resource: { id: string };
    action: string;
  }) => ({
    can:
      (action === 'read' || action === 'access') && readable.has(resource.id),
  }),
}));

const { default: ConfigPage } = await import('../../client/pages/config/index');
const { SettingsNavigation } =
  await import('../../client/layouts/components/settings-navigation');
const { ReturnLocationsContext, useTrackReturnLocations } =
  await import('../../client/layouts/return-locations');
const { SidebarProvider } = await import('../../client/components/ui/sidebar');

function Where(): ReactElement {
  return <output data-testid='where'>{useLocation().pathname}</output>;
}

/** What the layout does: follows the locations and, inside `/config`, shows the settings navigation. */
function Shell({ children }: { readonly children: ReactNode }): ReactElement {
  const location = useLocation();
  const returns = useTrackReturnLocations(location);
  return (
    <ReturnLocationsContext.Provider value={returns}>
      {location.pathname.startsWith('/config') ? (
        <SidebarProvider>
          <SettingsNavigation />
        </SidebarProvider>
      ) : (
        <Link to='/config/general'>enter settings</Link>
      )}
      {children}
      <Where />
    </ReturnLocationsContext.Provider>
  );
}

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Shell>
        <Routes>
          <Route path='/config' element={<ConfigPage />}>
            <Route path='*' element={<p>page</p>} />
          </Route>
          <Route path='*' element={<p>elsewhere</p>} />
        </Routes>
      </Shell>
    </MemoryRouter>,
  );
}

const nav = () => screen.getByRole('navigation', { name: 'config.nav.label' });

function groupLinks(group: string): string[] {
  return within(screen.getByRole('group', { name: group }))
    .getAllByRole('link')
    .map((link) => link.textContent ?? '');
}

describe('the settings navigation', () => {
  it('groups the pages in order, marks the open one, and has no tabs', () => {
    readable.clear();
    for (const item of [
      'pm.general',
      'pm.members',
      'pm.workflows',
      'pm.labels',
      'studio.apiKeys',
      'studio.git',
      'studio.knowledgeSearch',
    ])
      readable.add(item);
    renderAt('/config/roles');
    expect(
      within(nav())
        .getAllByRole('group')
        .map((group) => group.getAttribute('aria-labelledby')),
    ).toEqual([
      'studio-settings-workspace',
      'studio-settings-access',
      'studio-settings-projects',
      'studio-settings-integrations',
    ]);
    expect(groupLinks('config.nav.groups.workspace')).toEqual([
      'config.nav.general',
      'config.nav.labels',
      'config.nav.knowledgeSearch',
    ]);
    expect(groupLinks('config.nav.groups.access')).toEqual([
      'config.nav.members',
      'config.nav.roles',
      'config.nav.apiKeys',
    ]);
    expect(groupLinks('config.nav.groups.projects')).toEqual([
      'config.nav.workflows',
    ]);
    expect(groupLinks('config.nav.groups.integrations')).toEqual([
      'config.nav.git',
    ]);
    expect(
      screen.getByRole('link', { name: 'config.nav.roles' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('shows the API keys only with studio.apiKeys read, not with pm.members', () => {
    readable.clear();
    readable.add('pm.members');
    renderAt('/config/members');
    expect(
      screen.queryByRole('link', { name: 'config.nav.apiKeys' }),
    ).toBeNull();
  });

  it('hides members and roles without pm.members read, and the groups left empty', () => {
    readable.clear();
    readable.add('pm.general');
    renderAt('/config/general');
    expect(screen.queryByRole('link', { name: 'config.nav.roles' })).toBeNull();
    expect(
      screen.queryByRole('group', { name: 'config.nav.groups.access' }),
    ).toBeNull();
    expect(groupLinks('config.nav.groups.workspace')).toEqual([
      'config.nav.general',
    ]);
  });

  it('leaves the agents plugin’s pages and the models to the Agent team section', () => {
    readable.clear();
    for (const item of [
      'pm.general',
      'agents.agents',
      'agents.runners',
      'agents.services',
      'agents.prices',
    ])
      readable.add(item);
    renderAt('/config/general');
    expect(
      within(nav())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['config.nav.back', 'config.nav.general']);
  });

  it('opens the first readable page from the bare address', () => {
    readable.clear();
    readable.add('pm.labels');
    renderAt('/config');
    expect(screen.getByTestId('where')).toHaveTextContent('/config/labels');
  });

  it('goes Back to the page the person was on, or home when settings were opened directly', () => {
    readable.clear();
    readable.add('pm.general');
    renderAt('/config/general');
    expect(
      screen.getByRole('link', { name: 'config.nav.back' }),
    ).toHaveAttribute('href', '/');
  });

  it('remembers the page before settings across the settings pages', () => {
    readable.clear();
    readable.add('pm.general');
    readable.add('pm.labels');
    renderAt('/issues');
    fireEvent.click(screen.getByRole('link', { name: 'enter settings' }));
    fireEvent.click(screen.getByRole('link', { name: 'config.nav.labels' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/config/labels');
    fireEvent.click(screen.getByRole('link', { name: 'config.nav.back' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/issues');
  });
});
