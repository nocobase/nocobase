// @vitest-environment jsdom
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({
  can: vi.fn(async () => true),
  revision: () => 0,
  onInvalidated: vi.fn(() => () => {}),
  listPermissionSets: vi.fn(),
  listAssignments: vi.fn(),
  updatePermissionSet: vi.fn(),
  createPermissionSet: vi.fn(),
  deletePermissionSet: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock('../../client/use-authorization-client.js', () => ({
  useAuthorizationClient: () => api,
}));
import { PermissionSetsPanel } from '../../client/pages/permission-sets/panel.js';
import EditPage from '../../client/pages/permission-set-edit-page.js';
import NewPage from '../../client/pages/permission-set-new-page.js';
import DetailsPage from '../../client/pages/permission-set-details-page.js';
import AssignmentsPage from '../../client/pages/permission-set-assignments-page.js';
import type { AuthorizationOptions } from '../../client/authorization-client.js';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { createAuthorizationI18n, i18nWrapper } from '../helpers/i18n.js';
import { subsection, withSubsections } from '../helpers/workspace-options.js';
const options: AuthorizationOptions = {
  sections: withSubsections({
    administration: [
      subsection('administration.authorization', 'Authorization', [
        {
          type: 'settings',
          value: 'authorization.permission-sets',
          label: 'Permission sets',
          actions: [{ value: 'read', label: 'Read' }],
        },
      ]),
    ],
  }),
  subjectTypes: [],
  recordAccess: [],
  collections: [],
};
// The pages render under this plugin's routes.
const wrapper = i18nWrapper(
  await createAuthorizationI18n(),
  AUTHORIZATION_NAMESPACE,
);
function Location() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid='url'>{location.pathname}</output>
      <output data-testid='search'>{location.search}</output>
      <button onClick={() => void navigate(-1)}>History back</button>
    </>
  );
}
function mount(path = '/sets', resourceOptions = options) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Location />
      <Routes>
        <Route
          path='/sets'
          element={<PermissionSetsPanel options={resourceOptions} />}
        >
          <Route path='new' element={<NewPage />} />
          <Route path='edit/:permissionSetKey' element={<EditPage />}>
            <Route path='assignments' element={<AssignmentsPage />} />
            <Route path='details' element={<DetailsPage />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
    { wrapper },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  api.listPermissionSets.mockResolvedValue([
    { key: 'staff', title: 'Staff', grants: [] },
    { key: 'sales', title: 'Sales', grants: [] },
  ]);
  api.listAssignments.mockResolvedValue([]);
});
describe('permission set workspace', () => {
  it('keeps the selected subsection in the URL across a reload', async () => {
    const view = { value: 'view', label: 'View' };
    const business: AuthorizationOptions = {
      ...options,
      sections: withSubsections({
        business: [
          subsection('example.sales', 'Sales', [
            {
              type: 'composite',
              value: 'quotes',
              label: 'Quotes',
              actions: [view],
            },
          ]),
          subsection('example.delivery', 'Delivery', [
            {
              type: 'composite',
              value: 'shipments',
              label: 'Shipments',
              actions: [view],
            },
          ]),
        ],
        administration: options.sections[2].subsections,
      }),
    };
    const first = mount('/sets/edit/staff', business);
    fireEvent.click(await screen.findByRole('button', { name: 'Delivery' }));
    expect(screen.getByTestId('search')).toHaveTextContent(
      '?section=example.delivery',
    );
    first.unmount();
    mount('/sets/edit/staff?section=example.delivery', business);
    expect(
      await screen.findByRole('button', { name: 'Shipments: View' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delivery' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByTestId('url')).toHaveTextContent('/sets/edit/staff');
  });

  it('confirms cancellation and restores the saved draft without navigating', async () => {
    mount('/sets/edit/staff');
    const permission = await screen.findByRole('button', {
      name: 'Permission sets: Read',
    });
    fireEvent.click(permission);
    fireEvent.click(
      screen.getByRole('button', { name: 'Cancel', exact: true }),
    );
    await screen.findByRole('alertdialog');
    expect(permission).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: 'Discard changes', exact: true }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Permission sets: Read' }),
      ).toHaveAttribute('aria-pressed', 'false'),
    );
    expect(screen.getByTestId('url')).toHaveTextContent('/sets/edit/staff');
    expect(
      screen.getByRole('button', { name: 'Save permission set' }),
    ).toBeDisabled();
    expect(api.updatePermissionSet).not.toHaveBeenCalled();
  });
  it('selects the first set, retains sidebar collapse across routes and supports browser back', async () => {
    mount();
    await waitFor(() =>
      expect(screen.getByTestId('url')).toHaveTextContent('/sets/edit/staff'),
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Assignees',
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(api.listAssignments).toHaveBeenCalledWith('staff'),
    );
    expect(screen.getByTestId('url')).toHaveTextContent(
      '/sets/edit/staff/assignments',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse permission sets' }),
    );
    expect(
      screen.queryByPlaceholderText('Search permission sets'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    await screen.findByRole('button', { name: 'Permission sets: Read' });
    expect(
      screen.getByRole('button', { name: 'Expand permission sets' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Expand permission sets' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sales' }));
    await waitFor(() =>
      expect(screen.getByTestId('url')).toHaveTextContent('/sets/edit/sales'),
    );
  });
  it('opens assignment deep links and confirms unsaved changes before switching sets', async () => {
    mount('/sets/edit/staff/assignments');
    await waitFor(() =>
      expect(api.listAssignments).toHaveBeenCalledWith('staff'),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Permissions', exact: true }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Permission sets: Read' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sales' }));
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('/sets/edit/staff');
  });
  it('saves in place and creates a set without returning to a list', async () => {
    api.updatePermissionSet.mockImplementation((key: string, input: object) =>
      Promise.resolve({ key, ...input }),
    );
    api.createPermissionSet.mockImplementation((input: object) =>
      Promise.resolve(input),
    );
    mount('/sets/edit/staff');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Permission sets: Read' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Save permission set' }),
    );
    await waitFor(() => expect(api.updatePermissionSet).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save permission set' }),
      ).toBeDisabled(),
    );
    expect(screen.getByTestId('url')).toHaveTextContent('/sets/edit/staff');
    fireEvent.click(screen.getByRole('button', { name: 'New permission set' }));
    fireEvent.change(
      await screen.findByRole('textbox', { name: 'Name', exact: true }),
      { target: { value: 'Support' } },
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Key', exact: true }),
      { target: { value: 'support' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Save permission set' }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('url')).toHaveTextContent('/sets/edit/support'),
    );
    expect(screen.getByRole('button', { name: 'Support' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
  it('does not allow changing protected sets but keeps user assignments accessible', async () => {
    api.listPermissionSets.mockResolvedValue([
      {
        key: 'staff',
        title: 'Staff',
        grants: [],
        protection: { allow: ['assign', 'revoke'] },
      },
    ]);
    mount('/sets/edit/staff');
    expect(
      await screen.findByRole('button', { name: 'Permission sets: Read' }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Delete', exact: true }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Assignees', exact: true }),
    );
    await waitFor(() =>
      expect(api.listAssignments).toHaveBeenCalledWith('staff'),
    );
  });
  it('routes basic information last and saves it within its tab', async () => {
    api.updatePermissionSet.mockImplementation((key: string, input: object) =>
      Promise.resolve({ key, ...input }),
    );
    mount('/sets/edit/staff/details');
    const name = await screen.findByRole('textbox', {
      name: 'Name',
      exact: true,
    });
    expect(
      screen.getByRole('button', { name: 'Basic information' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(name).toHaveValue('Staff');
    fireEvent.change(name, { target: { value: 'Staff updated' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Save permission set' }),
    );
    await waitFor(() =>
      expect(api.updatePermissionSet).toHaveBeenCalledWith(
        'staff',
        expect.objectContaining({ title: 'Staff updated', grants: [] }),
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save permission set' }),
      ).toBeDisabled(),
    );
    expect(screen.getByTestId('url')).toHaveTextContent(
      '/sets/edit/staff/details',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Assignees', exact: true }),
    );
    await waitFor(() =>
      expect(api.listAssignments).toHaveBeenCalledWith('staff'),
    );
    expect(
      screen.queryByRole('button', { name: 'Save permission set' }),
    ).not.toBeInTheDocument();
  });

  it('asks before deleting a permission set, names it, and deletes only once confirmed', async () => {
    mount('/sets/edit/staff');
    const remove = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByRole('button', { name: 'Permission sets: Read' });

    remove();
    const dialog = within(screen.getByRole('alertdialog'));
    expect(
      dialog.getByText('Delete permission set "Staff"?'),
    ).toBeInTheDocument();
    expect(
      dialog.getByText(
        'Delete “Staff” and its assignments. Other permission sets and rules remain in effect.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete permission set "Staff"?')).toBeNull();
    expect(api.deletePermissionSet).not.toHaveBeenCalled();

    remove();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Delete permission set',
      }),
    );
    expect(api.deletePermissionSet).toHaveBeenCalledTimes(1);
  });
});
