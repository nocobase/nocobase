import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';

import { SettingsRedirect } from '../../client/routing/settings-redirect.js';
import { SETTINGS_REDIRECTS } from '../../client/lib/settings-redirects.js';

function Destination() {
  const { pathname, search, hash } = useLocation();
  return <output>{`${pathname}${search}${hash}`}</output>;
}

it.each([
  ['/users', '/settings/users'],
  ['/roles/operators/edit?q=ops', '/settings/roles/operators/edit?q=ops'],
  [
    '/workflows/definitions/lifecycle.expenses#node',
    '/settings/workflows/definitions/lifecycle.expenses#node',
  ],
  ['/knowledge/indexing', '/settings/knowledge/indexing'],
])('redirects the former settings URL %s to %s', async (from, to) => {
  render(
    <MemoryRouter initialEntries={[from]}>
      <Routes>
        {SETTINGS_REDIRECTS.map(([prefix]) => (
          <Route
            key={prefix}
            path={`${prefix}/*`}
            element={<SettingsRedirect />}
          />
        ))}
        <Route path='/settings/*' element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByRole('status')).toHaveTextContent(to);
});
