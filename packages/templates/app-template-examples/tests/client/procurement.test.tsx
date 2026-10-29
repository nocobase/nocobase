import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Route, Routes } from 'react-router';
import { randomUUID } from 'node:crypto';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import ProcurementPage from '../../client/pages/procurement/index.js';
import ProcurementDetailPage from '../../client/pages/procurement/detail.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';
import type { TestApp } from '@nocobase/app-testing/server';
import { amount } from '../../shared/procurement.js';

it('calculates exact minor units and refuses unsupported precision or overflow', () => {
  expect(
    amount([
      { quantity: 3, unitPrice: '0.10' },
      { quantity: 1, unitPrice: '0.20' },
    ]),
  ).toBe(50);
  expect(() => amount([{ quantity: 1, unitPrice: '0.001' }])).toThrow();
  expect(() =>
    amount([{ quantity: 100000, unitPrice: '9999999.99' }]),
  ).toThrow();
});

it('adds, edits and removes lines with a live total, preserving the real saved request', async () => {
  let app: TestApp;
  const materialId = randomUUID();
  await renderAuthenticatedClient(
    <Routes>
      <Route path='/procurement' element={<ProcurementPage />}>
        <Route path='new' element={<ProcurementDetailPage />} />
        <Route path=':id' element={<ProcurementDetailPage />} />
      </Route>
    </Routes>,
    {
      member: true,
      route: '/procurement/new',
      grants: [
        {
          resource: { type: 'page', id: 'procurement' },
          actions: [{ action: 'access' }],
        },
        {
          resource: { type: 'settings', id: 'procurement' },
          actions: [{ action: 'request' }],
        },
      ],
      async prepare(server) {
        app = server;
        await server.connection.repository('procurementMaterials').createOne({
          values: {
            id: materialId,
            name: 'Test notebook',
            active: true,
            allowedUserId: null,
            unitPriceMinor: 1234,
          },
        });
        const authz = server.application.container.resolve(authorizationToken);
        expect(
          await authz.permissionSets.get('procurement-applicant'),
        ).toBeTruthy();
      },
    },
  );
  await userEvent.type(
    await screen.findByRole('textbox', { name: 'Title', exact: true }),
    'Client purchase',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Add line', exact: true }),
  );
  const material = await screen.findByRole('combobox', {
    name: 'Material 1',
    exact: true,
  });
  await waitFor(() => expect(material).toBeEnabled());
  await userEvent.click(material);
  await userEvent.click(
    await screen.findByRole('option', { name: 'Test notebook' }),
  );
  const quantity = screen.getByRole('textbox', {
    name: 'Quantity',
    exact: true,
  });
  await userEvent.clear(quantity);
  await userEvent.type(quantity, '2');
  expect(screen.getByLabelText('Total (USD)')).toHaveTextContent('24.68');
  await userEvent.clear(quantity);
  await userEvent.type(quantity, '1.5');
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  await userEvent.clear(quantity);
  await userEvent.type(quantity, '2');
  await userEvent.click(
    screen.getByRole('button', { name: 'Add line', exact: true }),
  );
  await userEvent.click(
    screen.getAllByRole('button', { name: 'Remove line', exact: true })[1],
  );
  const quote = screen.getByRole('textbox', {
    name: 'Applicant quote snapshot (USD/unit)',
    exact: true,
  });
  await userEvent.clear(quote);
  await userEvent.type(quote, '-1');
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  await userEvent.clear(quote);
  await userEvent.type(quote, '0.001');
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  await userEvent.clear(quote);
  await userEvent.type(quote, '10.25');
  expect(
    screen.getByLabelText('Current catalog reference (USD/unit)'),
  ).toHaveTextContent('12.34');
  expect(
    screen.getByLabelText('Quote minus catalog (USD/unit)'),
  ).toHaveTextContent('-2.09');
  await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(await screen.findByText('History', { exact: true })).toBeVisible();
  expect(
    screen.getByRole('textbox', { name: 'Title', exact: true }),
  ).toHaveValue('Client purchase');
  expect(screen.getByLabelText('Total (USD)')).toHaveTextContent('20.50');
  await app!.connection
    .repository('procurementMaterials')
    .updateOne({
      filter: { id: materialId },
      values: { unitPriceMinor: 1800 },
    });
  await userEvent.click(
    screen.getByRole('button', { name: 'Close', exact: true }),
  );
  await userEvent.click(
    await screen.findByRole('link', { name: 'Client purchase', exact: true }),
  );
  expect(
    await screen.findByRole('textbox', {
      name: 'Applicant quote snapshot (USD/unit)',
      exact: true,
    }),
  ).toHaveValue('10.25');
  expect(
    screen.getByLabelText('Current catalog reference (USD/unit)'),
  ).toHaveTextContent('18.00');
  expect(
    screen.getByLabelText('Quote minus catalog (USD/unit)'),
  ).toHaveTextContent('-7.75');
  expect(screen.getByLabelText('Total (USD)')).toHaveTextContent('20.50');
  expect(await screen.findByText(/Created:.*Test member/)).toBeVisible();
});
