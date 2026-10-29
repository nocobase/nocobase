import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Navigate, Route, Routes } from 'react-router';
import { randomUUID } from 'node:crypto';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import ProcurementPage from '../../client/pages/procurement/index.js';
import ProcurementDetailPage from '../../client/pages/procurement/detail.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';
import type { TestApp } from '@nocobase/app-testing/server';
import { amount } from '../../shared/procurement.js';
import type { ProcurementDetail } from '../../shared/procurement.js';
import {
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';

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

it.each(['save', 'conflict'] as const)(
  'keeps %s refresh consistent with the displayed version',
  async (scenario) => {
    let id: string;
    let owner: TestSession;
    let reviewer: TestSession;
    let holdDetail = false;
    let savedVersion: number;
    const fireRequests: { version: number; status: number }[] = [];
    const fireVersions = new WeakMap<Request, number>();
    const refreshStarted = Promise.withResolvers<void>();
    const refreshGate = Promise.withResolvers<void>();
    const write = (json: unknown, method = 'POST') => ({
      method,
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
        'Idempotency-Key': `${Date.now()}.${randomUUID()}`,
      },
      body: JSON.stringify(json),
    });
    const detail = async () =>
      (
        (await (await owner.fetch(`/procurement/${id}`)).json()) as {
          data: ProcurementDetail;
        }
      ).data;
    const reject = async () => {
      const current = await detail();
      expect(
        (
          await reviewer.fetch(
            `/procurement/${id}/fire`,
            write({
              transition: 'reject',
              version: current.record.lifecycleVersion,
              requestId: randomUUID(),
            }),
          )
        ).status,
      ).toBe(200);
    };
    function RequestRoutes() {
      return (
        <Routes>
          <Route
            path='/start'
            element={<Navigate to={`/procurement/${id}`} replace />}
          />
          <Route path='/procurement' element={<ProcurementPage />}>
            <Route path=':id' element={<ProcurementDetailPage />} />
          </Route>
        </Routes>
      );
    }
    try {
      await renderAuthenticatedClient(<RequestRoutes />, {
        route: '/start',
        async prepare(app, session) {
          owner = session;
          const credentials = {
            name: 'Review colleague',
            email: 'review-colleague@example.test',
            password: 'synthetic-review-password',
          };
          expect(
            (await app.request('/auth/sign-up/email', write(credentials)))
              .status,
          ).toBe(200);
          reviewer = await signIn(app, credentials);
          await app.application.container
            .resolve(authorizationToken)
            .permissionSets.assign({
              id: randomUUID(),
              permissionSet: 'procurement-reviewer',
              subject: { type: 'user', id: reviewer.user.id },
            });
          const supplierId = randomUUID();
          const materialId = randomUUID();
          await app.connection.repository('procurementSuppliers').createOne({
            values: { id: supplierId, name: 'Test supplier', active: true },
          });
          await app.connection.repository('procurementMaterials').createOne({
            values: {
              id: materialId,
              name: 'Test material',
              active: true,
              unitPriceMinor: 1250,
            },
          });
          const created = await owner.fetch(
            '/procurement',
            write({
              title: 'Rejected purchase',
              supplierId,
              reviewerId: reviewer.user.id,
              lines: [{ materialId, quantity: 2, unitPrice: '12.50' }],
              totalMinor: 2500,
            }),
          );
          expect(created.status).toBe(200);
          id = (await created.json()).data.id;
          const current = await detail();
          expect(
            (
              await owner.fetch(
                `/procurement/${id}/fire`,
                write({
                  transition: 'submit',
                  version: current.record.lifecycleVersion,
                  requestId: randomUUID(),
                }),
              )
            ).status,
          ).toBe(200);
          await reject();
        },
        async beforeRequest(request) {
          if (new URL(request.url).pathname.endsWith(`/procurement/${id}/fire`))
            fireVersions.set(request, (await request.clone().json()).version);
        },
        async afterResponse(request, response) {
          const pathname = new URL(request.url).pathname;
          if (pathname.endsWith(`/procurement/${id}`)) {
            if (request.method === 'PATCH' && response.ok) {
              savedVersion = (await detail()).record.lifecycleVersion;
              holdDetail = true;
            } else if (request.method === 'GET' && holdDetail) {
              holdDetail = false;
              refreshStarted.resolve();
              await refreshGate.promise;
            }
          } else if (pathname.endsWith(`/procurement/${id}/fire`)) {
            fireRequests.push({
              version: fireVersions.get(request)!,
              status: response.status,
            });
          }
        },
      });
      const title = await screen.findByRole('textbox', {
        name: 'Title',
        exact: true,
      });
      if (scenario === 'save') {
        await userEvent.clear(title);
        await userEvent.type(title, 'Revised purchase');
        await userEvent.click(
          screen.getByRole('button', { name: 'Save draft' }),
        );
        await refreshStarted.promise;
        expect(
          screen.getByRole('button', { name: 'Submit', exact: true }),
        ).toBeDisabled();
        expect(
          screen.getByRole('button', { name: 'Save draft' }),
        ).toBeDisabled();
        expect(title).toBeDisabled();
        await userEvent.click(
          screen.getByRole('button', { name: 'Submit', exact: true }),
        );
        expect(fireRequests).toEqual([]);
        await act(async () => {
          refreshGate.resolve();
        });
        await waitFor(() =>
          expect(
            screen.getByRole('button', { name: 'Submit', exact: true }),
          ).toBeEnabled(),
        );
        await userEvent.click(
          screen.getByRole('button', { name: 'Submit', exact: true }),
        );
        expect(
          await screen.findByText('Submitted', { selector: 'p', exact: true }),
        ).toBeVisible();
        expect(fireRequests).toEqual([{ version: savedVersion!, status: 200 }]);
        expect((await detail()).record.status).toBe('submitted');
      } else {
        const stale = await detail();
        // A second tab saves after this editor has loaded its version.
        expect(
          (
            await owner!.fetch(
              `/procurement/${id!}`,
              write(
                {
                  title: stale.record.title,
                  supplierId: stale.record.supplierId,
                  reviewerId: stale.record.reviewerId,
                  totalMinor: stale.record.totalMinor,
                  version: stale.record.lifecycleVersion,
                  lines: stale.lines.map(
                    ({ id, materialId, quantity, unitPrice }) => ({
                      id,
                      materialId,
                      quantity,
                      unitPrice,
                    }),
                  ),
                },
                'PATCH',
              ),
            )
          ).status,
        ).toBe(200);
        await userEvent.click(
          screen.getByRole('button', { name: 'Submit', exact: true }),
        );
        const conflict = 'The request changed. Reload before trying again.';
        expect(await screen.findByText(conflict)).toBeVisible();
        await waitFor(() =>
          expect(
            screen.getByRole('button', { name: 'Submit', exact: true }),
          ).toBeEnabled(),
        );
        expect(screen.getByText(conflict)).toBeVisible();
        expect(fireRequests[0]).toEqual({
          version: stale.record.lifecycleVersion,
          status: 409,
        });
        expect((await detail()).record.status).toBe('rejected');
        await userEvent.click(
          screen.getByRole('button', { name: 'Submit', exact: true }),
        );
        expect(
          await screen.findByText('Submitted', { selector: 'p', exact: true }),
        ).toBeVisible();
        expect(screen.queryByText(conflict)).not.toBeInTheDocument();
        expect(fireRequests[1]).toEqual({
          version: stale.record.lifecycleVersion + 1,
          status: 200,
        });
      }
    } finally {
      refreshGate.resolve();
    }
  },
);

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
  await app!.connection.repository('procurementMaterials').updateOne({
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
