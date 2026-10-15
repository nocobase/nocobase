import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { expect, it, vi } from 'vitest';

// Whether the person may open My tasks, as the authorization plugin answers.
const access = vi.hoisted(() => ({ myTasks: true }));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationClient: () => ({
    can: () => Promise.resolve(access.myTasks),
  }),
}));
import LandingPage from '../../client/pages/landing/index.js';
import HomeRedirect from '../../client/pages/home/redirect.js';

function Destination() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output>{location.pathname + location.search + location.hash}</output>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  );
}

function renderLanding() {
  render(
    <MemoryRouter
      basename='/main'
      initialEntries={[
        '/main/dashboard',
        '/main/?account=preferences&kind=decision#detail',
      ]}
      initialIndex={1}
    >
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/my-issues' element={<Destination />} />
        <Route path='/inbox' element={<Destination />} />
        <Route path='/dashboard' element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

it('opens My tasks, preserving search and fragment under the deployment base and replacing the root history entry', async () => {
  access.myTasks = true;
  renderLanding();
  expect(await screen.findByRole('status')).toHaveTextContent(
    '/my-issues?account=preferences&kind=decision#detail',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('status')).toHaveTextContent('/dashboard');
});

it('opens the inbox for someone My tasks is not granted to', async () => {
  access.myTasks = false;
  renderLanding();
  expect(await screen.findByRole('status')).toHaveTextContent(
    '/inbox?account=preferences&kind=decision#detail',
  );
});

it('redirects legacy home URLs to the chat composer with search and fragment, replacing history', async () => {
  render(
    <MemoryRouter
      basename='/main'
      initialEntries={['/main/inbox', '/main/home?account=preferences#detail']}
      initialIndex={1}
    >
      <Routes>
        <Route path='/home' element={<HomeRedirect />} />
        <Route path='/chat' element={<Destination />} />
        <Route path='/inbox' element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    '/chat?account=preferences#detail',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('status')).toHaveTextContent('/inbox');
});
