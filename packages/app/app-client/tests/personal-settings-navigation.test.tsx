import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  Link,
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router';
import { expect, it, vi } from 'vitest';
import { NavigationGuardProvider } from '../src/navigation-guard-provider.js';
import { useNavigationGuard } from '../src/navigation-guard.js';
import {
  PersonalSettingsBackground,
  PersonalSettingsDialogRoutes,
} from '../src/personal-settings-router.js';
import { usePersonalSettingsNavigation } from '../src/personal-settings-navigation.js';

const background = '/work/issues/42?filter=open#notes';

function Key() {
  const { id } = useParams();
  const [dirty, setDirty] = useState(false);
  useNavigationGuard(() => !dirty);
  const navigate = useNavigate();
  return (
    <>
      <p>{id}</p>
      <button onClick={() => setDirty(!dirty)}>
        {dirty ? 'Discard draft' : 'Edit draft'}
      </button>
      <button onClick={() => navigate('..', { relative: 'path' })}>
        Return to keys
      </button>
    </>
  );
}

function Task({ leave }: { leave: () => boolean }) {
  useNavigationGuard(leave);
  return <input aria-label='Task draft' defaultValue='' />;
}

function Shell({ leave }: { leave: () => boolean }) {
  const { isOpen, open, close } = usePersonalSettingsNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid='url'>
        {location.pathname + location.search + location.hash}
      </output>
      <button onClick={() => open('dialog')}>Settings dialog</button>
      <button onClick={() => open()}>Settings page</button>
      <button onClick={() => navigate(-1)}>History back</button>
      <PersonalSettingsBackground>
        <Task leave={leave} />
      </PersonalSettingsBackground>
      {isOpen && (
        <>
          <button onClick={close}>Close</button>
          <PersonalSettingsDialogRoutes>
            <Routes>
              <Route
                path='/me'
                element={<Navigate to='/me/api-keys' replace />}
              />
              <Route
                path='/me/api-keys'
                element={
                  <>
                    <Link to='create'>Create</Link>
                    <Link to='123'>Details</Link>
                    <Outlet />
                  </>
                }
              >
                <Route path=':id' element={<Key />} />
              </Route>
            </Routes>
          </PersonalSettingsDialogRoutes>
        </>
      )}
    </>
  );
}

function setup(url = background, leave = vi.fn(() => true)) {
  render(
    <MemoryRouter
      basename='/main'
      initialEntries={['/main/previous', '/main' + url]}
    >
      <NavigationGuardProvider>
        <Routes>
          <Route path='*' element={<Shell leave={leave} />} />
        </Routes>
      </NavigationGuardProvider>
    </MemoryRouter>,
  );
  return leave;
}

it('keeps the task draft and its history when navigating between settings routes', async () => {
  const guard = setup(
    background,
    vi.fn(() => false),
  );
  fireEvent.change(screen.getByLabelText('Task draft'), {
    target: { value: 'in progress' },
  });
  fireEvent.click(screen.getByText('Settings dialog'));
  const create = await screen.findByRole('link', { name: 'Create' });
  const href = new URL(create.getAttribute('href')!, 'http://test');
  expect(href.pathname).toBe('/main/work/issues/42');
  expect(href.hash).toBe('#notes');
  expect(href.searchParams.get('filter')).toBe('open');
  expect(href.searchParams.get('personalSettings')).toBe('api-keys/create');
  fireEvent.click(create);
  await screen.findByText('create', { selector: 'p' });
  fireEvent.click(screen.getByText('Return to keys'));
  await waitFor(() => expect(screen.queryByText('Return to keys')).toBeNull());
  fireEvent.click(screen.getByRole('link', { name: 'Details' }));
  await screen.findByText('123', { selector: 'p' });
  fireEvent.click(screen.getByText('Close'));
  await waitFor(() =>
    expect(screen.getByTestId('url').textContent).toBe(background),
  );
  expect((screen.getByLabelText('Task draft') as HTMLInputElement).value).toBe(
    'in progress',
  );
  expect(guard).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Settings page'));
  await waitFor(() => expect(guard).toHaveBeenCalled());
  expect(screen.getByTestId('url').textContent).toBe(background);
});

it('closes a direct dialog URL in place and opens the default entry as a page', async () => {
  setup('/work/issues/42?filter=open&personalSettings=api-keys%2F123#notes');
  await screen.findByText('123', { selector: 'p' });
  fireEvent.click(screen.getByText('Close'));
  await waitFor(() =>
    expect(screen.getByTestId('url').textContent).toBe(background),
  );
  fireEvent.click(screen.getByText('Settings page'));
  await waitFor(() =>
    expect(screen.getByTestId('url').textContent).toBe('/me'),
  );
  expect(screen.queryByText('Close')).toBeNull();
  fireEvent.click(screen.getByText('History back'));
  await waitFor(() =>
    expect(screen.getByTestId('url').textContent).toBe(background),
  );
  fireEvent.click(screen.getByText('History back'));
  await waitFor(() =>
    expect(screen.getByTestId('url').textContent).toBe('/previous'),
  );
});

it('honors the dialog editor guard when closing a directly linked child page', async () => {
  setup('/work/issues/42?personalSettings=api-keys%2Fcreate#notes');
  fireEvent.click(await screen.findByText('Edit draft'));
  fireEvent.click(screen.getByText('Close'));
  expect(screen.queryByText('Discard draft')).not.toBeNull();
  fireEvent.click(screen.getByText('Discard draft'));
  fireEvent.click(screen.getByText('Close'));
  await waitFor(() => expect(screen.queryByText('Close')).toBeNull());
});
