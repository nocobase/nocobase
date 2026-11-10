import { DATABASE_EXPLORER_ACCESS } from '@nocobase/app-plugin-database-explorer/client';
import { screen, within } from '@testing-library/react';
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
  const tables = await screen.findByRole('list', { name: 'Tables in main' });
  const links = within(tables).getAllByRole('link');
  expect(links.length).toBeGreaterThan(0);
  await user.click(links[0]);
  const fields = await screen.findByRole('table', { name: /^Fields of / });
  expect(within(fields).getAllByRole('row').length).toBeGreaterThan(1);
  // Real tables declare their primary key as a constraint; it is still shown on its field.
  expect(within(fields).getAllByText('Primary key').length).toBeGreaterThan(0);
});

it('lets a member holding only the page grant browse', async () => {
  await renderAuthenticated(<DatabaseExplorerPage />, {
    route: '/settings/database-explorer',
    member: true,
    grants: [
      {
        resource: DATABASE_EXPLORER_ACCESS.resource,
        actions: [{ action: DATABASE_EXPLORER_ACCESS.action }],
      },
    ],
  });
  expect(
    await screen.findByRole('list', { name: 'Tables in main' }),
  ).toBeInTheDocument();
});

it('keeps database information inaccessible to an ordinary member', async () => {
  await renderAuthenticated(<DatabaseExplorerPage />, {
    route: '/settings/database-explorer',
    member: true,
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You do not have permission to browse databases',
  );
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
});
