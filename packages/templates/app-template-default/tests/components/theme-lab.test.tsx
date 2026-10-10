import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import locales from '../../client/locales/index.js';
import ThemeLabPage from '../../client/pages/theme-lab/index.js';
import CreateCustomer from '../../client/pages/theme-lab/create.js';
import CustomerDetail from '../../client/pages/theme-lab/detail.js';

const showToast = vi.fn();
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useToaster: () => ({ show: showToast, close: vi.fn() }),
}));
function LocationProbe() {
  const location = useLocation();
  return (
    <output aria-label='Location'>
      {location.pathname}
      {location.search}
    </output>
  );
}
async function setup(path = '/theme-lab/customers') {
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
        <LocationProbe />
        <Routes>
          <Route path='/theme-lab/customers' element={<ThemeLabPage />}>
            <Route path='new' element={<CreateCustomer />} />
            <Route path=':id' element={<CustomerDetail />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
  return userEvent.setup();
}
describe('CRM theme preview', () => {
  it('searches locally and clears the no-results state', async () => {
    const user = await setup();
    await user.type(
      screen.getByRole('textbox', { name: 'Search company or email' }),
      'unmatched-company',
    );
    expect(screen.getByText('No matching customers')).toBeVisible();
    await user.click(
      screen.getAllByRole('button', { name: 'Clear filters' })[0],
    );
    expect(
      screen.getByRole('button', { name: 'Northstar Studio' }),
    ).toBeVisible();
  });
  it('validates fields, focuses the first error and creates a local customer', async () => {
    const user = await setup('/theme-lab/customers/new');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));
    expect(screen.getAllByText('This field is required.')).toHaveLength(3);
    expect(screen.getByRole('textbox', { name: 'Company *' })).toHaveFocus();
    await user.type(
      screen.getByRole('textbox', { name: 'Company *' }),
      'Preview Test Company',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Contact *' }),
      'Demo contact',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Email *' }),
      'bad-email',
    );
    await user.click(screen.getByRole('button', { name: 'Create customer' }));
    expect(screen.getByText('Enter a valid email address.')).toBeVisible();
    await user.clear(screen.getByRole('textbox', { name: 'Email *' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Email *' }),
      'preview@example.com',
    );
    await user.click(screen.getByRole('button', { name: 'Create customer' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: 'Preview Test Company' }),
    ).toBeVisible();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Created customer “Preview Test Company”.',
      }),
    );
  });
  it('closes a directly addressed detail without losing filters', async () => {
    const user = await setup('/theme-lab/customers/1?q=云岚');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('云岚科技');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.getByLabelText('Location')).toHaveTextContent(
        '/theme-lab/customers?q=云岚',
      ),
    );
    expect(
      screen.getByRole('textbox', { name: 'Search company or email' }),
    ).toHaveValue('云岚');
  });
});
