import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import locales from '../../client/locales/index.js';
import Controls from '../../client/pages/theme-lab/controls.js';
import Navigation from '../../client/pages/theme-lab/navigation.js';
import Feedback from '../../client/pages/theme-lab/feedback.js';
import Overlay from '../../client/pages/theme-lab/gallery-overlay.js';
const showToast = vi.fn();
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useToaster: () => ({ show: showToast }),
}));
function Location() {
  const value = useLocation();
  return (
    <output aria-label='Location'>
      {value.pathname}
      {value.search}
    </output>
  );
}
async function setup(view = 'controls', suffix = '') {
  const runtime = new I18nRuntime({
    applicationNamespace: 'test-app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('test-app', locales);
  await runtime.init('en-US');
  render(
    <I18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[`/theme-lab/${view}${suffix}`]}>
        <Location />
        <Routes>
          <Route path='/theme-lab/controls' element={<Controls />} />
          <Route path='/theme-lab/feedback' element={<Feedback />} />
          <Route path='/theme-lab/navigation' element={<Navigation />}>
            <Route path='dialog' element={<Overlay />} />
            <Route path='sheet' element={<Overlay />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
  return userEvent.setup();
}
describe('Component gallery', () => {
  it('validates, focuses and saves a local form with feedback', async () => {
    const user = await setup();
    await user.click(
      screen.getByRole('button', { name: 'Save preview', exact: true }),
    );
    expect(screen.getByText('Enter a display name.')).toBeVisible();
    expect(screen.getByLabelText('Display name *')).toHaveFocus();
    await user.type(screen.getByLabelText('Display name *'), 'Demo');
    await user.type(
      screen.getByLabelText('Email address *'),
      'demo@example.com',
    );
    await user.click(
      screen.getByRole('button', { name: 'Save preview', exact: true }),
    );
    expect(screen.getByText(/Preview saved locally\. Demo/)).toBeVisible();
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Preview saved locally.',
    });
    await user.click(
      screen.getByRole('button', { name: 'Reset', exact: true }),
    );
    expect(screen.getByLabelText('Display name *')).toHaveValue('');
    expect(
      screen.queryByText(/Preview saved locally\. Demo/),
    ).not.toBeInTheDocument();
  });
  it('selects menu items, changes pagination and confirms only local clearing', async () => {
    const user = await setup('navigation');
    await user.click(
      screen.getByRole('button', { name: 'Actions', exact: true }),
    );
    await user.click(
      await screen.findByRole('menuitem', { name: 'Select sample title' }),
    );
    expect(
      screen.getByRole('status', { name: 'Selected action' }),
    ).toHaveTextContent('Select sample title');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByLabelText('Location')).toHaveTextContent('?page=2');
    await user.click(
      screen.getByRole('button', {
        name: 'Clear preview selection',
        exact: true,
      }),
    );
    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('status', { name: 'Selected action' }),
    ).toHaveTextContent('Select sample title');
    await user.click(
      screen.getByRole('button', {
        name: 'Clear preview selection',
        exact: true,
      }),
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Clear preview selection',
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('status', { name: 'Selected action' }),
    ).toHaveTextContent('Preview selection cleared.');
  });
  it('closes a directly addressed overlay and preserves the page query', async () => {
    const user = await setup('navigation', '/sheet?page=2');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Open side panel');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.getByLabelText('Location')).toHaveTextContent(
        '/theme-lab/navigation?page=2',
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('shows sample data from an empty state and sends a toast', async () => {
    const user = await setup('feedback');
    await user.click(screen.getByRole('button', { name: 'Show sample data' }));
    expect(
      screen.getByRole('status', { name: 'Sample records' }),
    ).toHaveTextContent('Alex Chen');
    await user.click(screen.getByRole('button', { name: 'Show error toast' }));
    expect(showToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'Example error. No real operation failed.',
    });
    await user.click(
      screen.getByRole('button', { name: 'Show detailed message' }),
    );
    expect(showToast).toHaveBeenLastCalledWith({
      type: 'error',
      title: 'Validation example',
      description: 'Check the fields before continuing.',
      duration: 0,
    });
  });
});
