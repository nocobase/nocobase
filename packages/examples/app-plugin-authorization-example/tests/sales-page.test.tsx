// @vitest-environment jsdom
import { MemoryRouter } from 'react-router';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ request: vi.fn(async () => ({ data: {} })) }));
vi.mock('@nocobase/app-client', () => ({
  apiClientToken: {},
  useService: () => api,
}));
vi.mock('../client/pages/use-example.js', () => ({
  useExample: (path: string) => ({
    loading: false,
    error: '',
    reload: vi.fn(),
    data: path.endsWith('/relations')
      ? {
          id: 'o1',
          title: 'Harbor order',
          access: 'allowed',
          operations: {
            carrier: ['connect', 'disconnect'],
            checks: ['create', 'update', 'delete'],
            collaborators: ['connect', 'set', 'disconnect'],
          },
          options: {
            carrier: [{ id: 'express', title: 'Express' }],
            collaborators: [{ id: 'freight', title: 'Freight' }],
          },
          carrier: null,
          checks: [],
          collaborators: [],
        }
      : path === 'sales/projects'
        ? {
            items: [
              {
                id: 'p1',
                title: 'Harbor',
                notes: 'Qualified',
                operations: { edit: 'allowed' },
              },
            ],
          }
        : path === 'sales/quotes'
          ? {
              items: [
                {
                  id: 'q1',
                  title: 'Harbor quote',
                  projectId: 'p1',
                  preparedByName: 'Alex Chen',
                  operations: { edit: 'allowed', submit: 'allowed' },
                  notes: 'Draft',
                  amount: 100,
                  status: 'draft',
                },
              ],
              navigation: { projects: true, quotes: true, orders: true },
            }
          : {
              items: [
                {
                  id: 'o1',
                  title: 'Harbor order',
                  projectId: 'p1',
                  quoteId: 'q1',
                  status: 'ready',
                  deliveryReference: '',
                  operations: { deliver: 'allowed' },
                },
              ],
              navigation: { projects: false, quotes: false, orders: true },
            },
  }),
}));
import SalesPage from '../client/pages/sales-page.js';
import enUS from '../client/locales/en-US.js';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactNode } from 'react';
import { NS } from '../catalog.js';

// The page renders under this plugin's routes.
const runtime = await createTestI18nRuntime({ namespaces: { [NS]: enUS } });
function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime} namespace={NS}>
      {children}
    </TestI18nProvider>
  );
}
it('submits pricing, quotes and delivery to their distinct endpoints', async () => {
  const page = render(
    <MemoryRouter>
      <SalesPage path='quotes' />
    </MemoryRouter>,
    { wrapper },
  );
  fireEvent.change(
    screen.getByRole('spinbutton', { name: 'Harbor quote: Amount' }),
    { target: { value: '250' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/authorization-example/sales/quotes/q1',
      json: { amount: 250, notes: 'Draft' },
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Submit quote' })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Submit quote' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/authorization-example/sales/quotes/q1/submit',
      json: {},
    }),
  );
  page.unmount();
  render(
    <MemoryRouter>
      <SalesPage path='orders' />
    </MemoryRouter>,
    { wrapper },
  );
  fireEvent.change(
    screen.getByRole('textbox', {
      name: 'Harbor order: Delivery reference',
    }),
    { target: { value: 'SHIP-42' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delivery' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/authorization-example/sales/orders/o1/deliver',
      json: { deliveryReference: 'SHIP-42' },
    }),
  );
  cleanup();
  // The order relationship editor sends relation mutation envelopes.
  render(
    <MemoryRouter>
      <SalesPage path='orders' />
    </MemoryRouter>,
    { wrapper },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Assign carrier' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/authorization-example/sales/orders/o1/relations',
      json: { carrier: { connect: { id: 'express' } } },
    }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Add selected carrier' }),
    ).toBeEnabled(),
  );
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Collaboration note' }),
    {
      target: { value: 'Review paperwork' },
    },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Add selected carrier' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/authorization-example/sales/orders/o1/relations',
      json: {
        collaborators: {
          connect: [
            {
              where: { id: 'freight' },
              through: { note: 'Review paperwork' },
            },
          ],
        },
      },
    }),
  );
});

it('keeps delivery references visible without linking to unauthorized menus', () => {
  render(
    <MemoryRouter>
      <SalesPage path='orders' />
    </MemoryRouter>,
    { wrapper },
  );
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText('p1 · No page access')).toBeInTheDocument();
  expect(screen.getByText('q1 · No page access')).toBeInTheDocument();
});

it('requires unsaved quote changes to be saved before submission', () => {
  render(
    <MemoryRouter>
      <SalesPage path='quotes' />
    </MemoryRouter>,
    { wrapper },
  );
  fireEvent.change(screen.getByRole('spinbutton'), {
    target: { value: '999' },
  });
  expect(screen.getByRole('button', { name: 'Submit quote' })).toBeDisabled();
  expect(
    screen.getByText('Save changes before submitting.'),
  ).toBeInTheDocument();
});
