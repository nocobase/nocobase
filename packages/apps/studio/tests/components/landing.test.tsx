import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { expect, it } from 'vitest';
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

it('preserves search and fragment under the deployment base and replaces the root history entry', async () => {
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
        <Route path='/inbox' element={<Destination />} />
        <Route path='/dashboard' element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    '/inbox?account=preferences&kind=decision#detail',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('status')).toHaveTextContent('/dashboard');
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
