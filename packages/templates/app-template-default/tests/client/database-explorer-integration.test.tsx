import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import DatabaseExplorerPage from '../../client/pages/settings/database-explorer/index.js';
import { createAuthenticatedClientRenderer } from '../helpers/authenticated-client.js';

const renderAuthenticated = createAuthenticatedClientRenderer();

it('browses real database tables and fields as an administrator', async () => {
  await renderAuthenticated(<DatabaseExplorerPage />, {
    route: '/settings/database-explorer',
  });
  const user = userEvent.setup();
  const tables = await screen.findAllByRole('button', { pressed: false });
  expect(tables.length).toBeGreaterThan(0);
  await user.click(tables[0]);
  expect(await screen.findByRole('table')).toBeInTheDocument();
  expect(screen.getAllByRole('cell').length).toBeGreaterThan(0);
});

it('keeps database information inaccessible to an ordinary member', async () => {
  await renderAuthenticated(<DatabaseExplorerPage />, {
    route: '/settings/database-explorer',
    member: true,
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You do not have permission',
  );
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});
