// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  can: vi.fn(async () => true),
  revision: () => 0,
  onInvalidated: vi.fn(() => () => {}),
  loadOptions: vi.fn(),
  listPermissionSets: vi.fn(),
}));
vi.mock('../../client/use-authorization-client.js', () => ({
  useAuthorizationClient: () => client,
}));
vi.mock('@nocobase/app-client', () => ({
  useClientApplication: () => ({ runtime: { routes: [] } }),
}));

import { ManagementTable } from '../../client/components/management-ui.js';
import { PermissionsPage } from '../../client/components/page-shell.js';
import PermissionSetsPage from '../../client/pages/permission-sets-page.js';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { createAuthorizationI18n, i18nWrapper } from '../helpers/i18n.js';

const runtime = await createAuthorizationI18n();
// The page renders under this plugin's routes; the shared components name their namespace themselves.
const page = i18nWrapper(runtime, AUTHORIZATION_NAMESPACE);
const wrapper = i18nWrapper(runtime);

function mount(): void {
  render(
    <MemoryRouter>
      <PermissionSetsPage />
    </MemoryRouter>,
    { wrapper: page },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  client.listPermissionSets.mockResolvedValue([]);
});

it('shows the shared loading state while the options are in flight', () => {
  client.loadOptions.mockReturnValue(new Promise(() => undefined));
  mount();
  expect(screen.getByText('Loading…')).toBeInTheDocument();
});

it('shows the shared error state with a retry when loading fails', async () => {
  client.loadOptions.mockRejectedValue(new Error('Options failed.'));
  mount();
  expect(await screen.findByText('Options failed.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});

it('shows the refusal without a retry when the options are forbidden', async () => {
  client.loadOptions.mockRejectedValue(
    Object.assign(new Error('Forbidden.'), { status: 403 }),
  );
  mount();
  expect(await screen.findByText('Forbidden.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});

describe('PermissionsPage', () => {
  it('flows with its content unless asked to fill', () => {
    render(
      <PermissionsPage title='Rules' description='All rules'>
        <div>Panel</div>
      </PermissionsPage>,
      { wrapper },
    );
    const panel = screen.getByText('Panel');
    expect(panel.parentElement).not.toHaveClass('lg:flex-1');
    expect(screen.getByRole('main')).not.toHaveClass('lg:h-full');
  });

  it('passes the scroll viewport height down when filling', () => {
    render(
      <PermissionsPage title='Rules' description='All rules' fill>
        <div>Panel</div>
      </PermissionsPage>,
      { wrapper },
    );
    // A page with its own scroll regions only stays the sole scroller while
    // the shell hands it the viewport height instead of growing past it.
    expect(screen.getByRole('main')).toHaveClass(
      'lg:flex',
      'lg:h-full',
      'lg:min-h-[36rem]',
      'lg:flex-col',
    );
    expect(screen.getByText('Panel').parentElement).toHaveClass(
      'lg:flex',
      'lg:min-h-0',
      'lg:flex-1',
      'lg:flex-col',
    );
  });
});

describe('ManagementTable', () => {
  it('keeps its card chrome and accepts layout classes', () => {
    render(
      <ManagementTable className='lg:flex lg:min-h-0'>
        <div>Rows</div>
      </ManagementTable>,
      { wrapper },
    );
    expect(screen.getByText('Rows').parentElement).toHaveClass(
      'overflow-hidden',
      'rounded-xl',
      'lg:flex',
      'lg:min-h-0',
    );
  });
});
