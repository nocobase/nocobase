import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { AssetList } from '../../client/pages/equipment/assets.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

it('keeps the asset search controlled through typing, no results and clearing', async () => {
  await renderAuthenticatedClient(<AssetList />, {
    route: '/equipment',
    prepare: async (_server, session) => {
      const post = async (path: string, value: unknown) => {
        const response = await session.fetch('/equipment/' + path, {
          method: 'POST',
          headers: {
            origin: 'http://localhost',
            'content-type': 'application/json',
          },
          body: JSON.stringify(value),
        });
        expect(response.status).toBe(path === 'assets' ? 201 : 200);
        return (await response.json()).data;
      };
      const category = await post('reference/equipmentCategories', {
        name: 'Computers',
        code: 'computers',
      });
      const department = await post('reference/equipmentDepartments', {
        name: 'Engineering',
        code: 'engineering',
      });
      const location = await post('reference/equipmentLocations', {
        name: 'Warehouse',
        code: 'warehouse',
      });
      await post('assets', {
        assetNumber: 'UI-EQ-1',
        name: 'Portable workstation',
        categoryId: category.id,
        departmentId: department.id,
        locationId: location.id,
        purchaseCost: 900,
      });
    },
  });
  expect(await screen.findByText('UI-EQ-1')).toBeInTheDocument();
  const search = screen.getByRole('textbox', {
    name: 'Asset number, name or serial number',
  });
  await userEvent.type(search, 'unmatched');
  expect(search).toHaveValue('unmatched');
  expect(await screen.findByText('No matching records')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  await waitFor(() => expect(search).toHaveValue(''));
  expect(await screen.findByText('UI-EQ-1')).toBeInTheDocument();
});

it('explains missing business access and hides import, export and create from an ordinary Member', async () => {
  await renderAuthenticatedClient(<AssetList />, {
    member: true,
    route: '/equipment',
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Access is not granted',
  );
  expect(
    screen.queryByRole('button', { name: 'Add asset' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Import CSV' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Export CSV' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();
});

it('keeps a filtered empty transaction list recoverable without claiming the collection is empty', async () => {
  const { TransactionList } =
    await import('../../client/pages/equipment/transactions.js');
  await renderAuthenticatedClient(<TransactionList kind='requests' />, {
    route: '/operations?status=rejected',
  });
  expect(await screen.findByText('No matching records')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Clear filters' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'New request' }),
  ).toBeInTheDocument();
});

it('does not offer reference mutations to a plain Member', async () => {
  const { default: ReferenceData } =
    await import('../../client/pages/equipment/reference.js');
  await renderAuthenticatedClient(<ReferenceData />, {
    member: true,
    route: '/referenceData',
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Access is not granted',
  );
  expect(
    screen.queryByRole('button', { name: 'Create' }),
  ).not.toBeInTheDocument();
});
