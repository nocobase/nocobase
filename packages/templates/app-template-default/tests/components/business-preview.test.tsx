import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import locales from '../../client/locales/index.js';
import OrdersPage from '../../client/pages/theme-lab/orders/index.js';
import OrderForm from '../../client/pages/theme-lab/orders/form.js';
import OrderDetail from '../../client/pages/theme-lab/orders/detail.js';
import WorkspacePage from '../../client/pages/theme-lab/workspace.js';
const show = vi.fn();
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useToaster: () => ({ show, close: vi.fn() }),
}));
function Location() {
  const location = useLocation();
  return (
    <output aria-label='Location'>
      {location.pathname}
      {location.search}
    </output>
  );
}
async function setup(path = '/theme-lab/orders') {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: 'test-app',
  });
  runtime.registerApplicationNamespace('test-app', locales);
  await runtime.init('en-US');
  render(
    <I18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>
        <Location />
        <Routes>
          <Route path='/theme-lab/orders' element={<OrdersPage />}>
            <Route path='new' element={<OrderForm />} />
            <Route path='edit/:orderId' element={<OrderForm />} />
            <Route path=':orderId' element={<OrderDetail />}>
              <Route path='edit' element={<OrderForm />} />
            </Route>
          </Route>
          <Route path='/theme-lab/workspace' element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
  return userEvent.setup();
}
describe('business theme preview', () => {
  it('paginates, searches, sorts and completes a selected page', async () => {
    const user = await setup();
    expect(screen.getByText('18 orders')).toBeVisible();
    expect(screen.getAllByRole('row')).toHaveLength(7);
    const previousHint = screen
      .getByRole('button', { name: 'Previous page' })
      .closest('[data-slot=tooltip-trigger]') as HTMLElement;
    await user.hover(previousHint);
    await waitFor(() =>
      expect(screen.getByText('You are on the first page.')).toBeVisible(),
    );
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 2 of 3')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Order number' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Location')).toHaveTextContent(
        'sort=number',
      ),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Search customer or order number' }),
      'SO-2026-0001',
    );
    expect(screen.getByText('1 orders')).toBeVisible();
    await user.click(
      screen.getByRole('checkbox', { name: 'Select orders on this page' }),
    );
    await user.click(screen.getByRole('button', { name: 'Mark completed' }));
    expect(screen.getByText('Completed')).toBeVisible();
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
    await user.clear(
      screen.getByRole('textbox', { name: 'Search customer or order number' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Search customer or order number' }),
      'unmatched-order',
    );
    expect(screen.getByText('No matching orders')).toBeVisible();
    await user.click(
      screen.getAllByRole('button', { name: 'Clear filters' })[0],
    );
    expect(screen.getByText('18 orders')).toBeVisible();
  });
  it('validates required and numeric values and creates a record without losing the query', async () => {
    const user = await setup('/theme-lab/orders/new?status=draft');
    const dialog = within(screen.getByRole('dialog'));
    await user.click(
      dialog.getByRole('button', { name: 'Create', exact: true }),
    );
    await waitFor(() =>
      expect(dialog.getByLabelText('Customer *')).toHaveFocus(),
    );
    await user.type(dialog.getByLabelText('Customer *'), 'Acme preview');
    await user.type(
      dialog.getByLabelText('Contact email *'),
      'buyer@acme.example',
    );
    await user.type(
      dialog.getByLabelText('Product or service *'),
      'Annual subscription',
    );
    await user.type(dialog.getByLabelText('Unit price (CNY) *'), '1200');
    await user.clear(dialog.getByLabelText('Quantity *'));
    await user.type(dialog.getByLabelText('Quantity *'), '0');
    await user.click(
      dialog.getByRole('button', { name: 'Create', exact: true }),
    );
    expect(
      dialog.getByText('Enter a whole number from 1 to 100,000.'),
    ).toBeVisible();
    await user.clear(dialog.getByLabelText('Quantity *'));
    await user.type(dialog.getByLabelText('Quantity *'), '10000');
    await user.click(
      dialog.getByRole('button', { name: 'Create', exact: true }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Acme preview')).toBeVisible();
    expect(screen.getByText('10,000')).toBeVisible();
    expect(screen.getByLabelText('Location')).toHaveTextContent(
      '/theme-lab/orders?status=draft',
    );
  });
  it('guards dirty close and edits on top of the detail drawer', async () => {
    const user = await setup('/theme-lab/orders/2?status=processing');
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Edit' }),
    );
    const dialog = within(screen.getByRole('dialog', { name: 'Edit order' }));
    const input = dialog.getByLabelText('Customer *');
    await user.clear(input);
    await user.type(input, 'Edited customer');
    await user.click(
      dialog.getByRole('button', { name: 'Cancel', exact: true }),
    );
    expect(screen.getByRole('alertdialog')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(input).toHaveValue('Edited customer');
    await user.click(dialog.getByRole('button', { name: 'Save', exact: true }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Edit order' }),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole('dialog')).getByText('Edited customer'),
    ).toBeVisible();
    await user.click(
      within(screen.getByRole('dialog')).getAllByRole('button', {
        name: 'Close',
        exact: true,
      })[0],
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Location')).toHaveTextContent(
      '/theme-lab/orders?status=processing',
    );
  });
  it('keeps IME composition local until the completed search is committed', async () => {
    await setup();
    const search = screen.getByRole('textbox', {
      name: 'Search customer or order number',
    });
    fireEvent.compositionStart(search);
    fireEvent.change(search, { target: { value: '云' }, isComposing: true });
    fireEvent.compositionEnd(search, { data: '云' });
    await waitFor(() =>
      expect(screen.getByLabelText('Location')).toHaveTextContent('q='),
    );
    expect(search).toHaveValue('云');
    expect(screen.queryByText('No matching orders')).not.toBeInTheDocument();
  });
  it('discards dirty edits on Escape without modifying the saved record', async () => {
    const user = await setup('/theme-lab/orders/edit/3');
    const input = screen.getByLabelText('Customer *');
    const original = (input as HTMLInputElement).value;
    await user.clear(input);
    await user.type(input, 'Discard this edit');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Search customer or order number' }),
      'SO-2026-0003',
    );
    expect(screen.getByText(original)).toBeVisible();
    expect(screen.queryByText('Discard this edit')).not.toBeInTheDocument();
  });
  it('shows a close-only missing record', async () => {
    const user = await setup('/theme-lab/orders/missing');
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Order not found')).toBeVisible();
    expect(
      dialog.queryByRole('button', { name: 'Edit' }),
    ).not.toBeInTheDocument();
    await user.click(
      dialog.getAllByRole('button', { name: 'Close', exact: true })[0],
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
  it('validates and saves the independent workspace profile', async () => {
    const user = await setup('/theme-lab/workspace');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.clear(screen.getByLabelText('Business name *'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByLabelText('Business name *')).toHaveFocus();
    await user.type(
      screen.getByLabelText('Business name *'),
      'Updated workspace',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    );
    expect(screen.getByLabelText('Business name *')).toHaveValue(
      'Updated workspace',
    );
    await user.click(
      screen.getByRole('switch', { name: 'Follow-up reminders' }),
    );
    expect(
      screen.getByRole('switch', { name: 'Follow-up reminders' }),
    ).toBeChecked();
  });
});
