/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { I18nProvider } from '@nocobase/i18n/client';
import { WorkflowManagementPage } from '../../client/workflow-management/pages.js';
import locales from '../../client/locales/index.js';
import { createWorkflowI18nRuntime } from '../i18n.js';

const runtime = await createWorkflowI18nRuntime(locales);
function Location() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output>
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => void navigate(-1)}>Back</button>
      <button onClick={() => void navigate(1)}>Forward</button>
    </>
  );
}
function mount(path: string) {
  return render(
    <I18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>
        <Location />
        <Routes>
          <Route path='/settings/workflow' element={<WorkflowManagementPage />}>
            <Route path='workflows' element={<div>Flow panel</div>} />
            <Route path='runs' element={<div>Run panel</div>} />
            <Route path='workflows/:id' element={<div>Detail panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
}
afterEach(cleanup);
describe('workflow module navigation', () => {
  it('redirects the parent with its query and restores selection through history', async () => {
    mount('/settings/workflow?q=test');
    await screen.findByText('Flow panel');
    expect(screen.getByRole('status').textContent).toBe(
      '/settings/workflow/workflows?q=test',
    );
    const runs = screen.getByRole('link', { name: 'Execution records' });
    expect(runs.closest('nav')).toBe(screen.getByRole('navigation'));
    fireEvent.click(runs);
    await screen.findByText('Run panel');
    expect(runs.getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByText('Flow panel');
    fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
    await screen.findByText('Run panel');
  });
  it('keeps a directly opened execution module selected', async () => {
    mount('/settings/workflow/runs');
    await waitFor(() =>
      expect(
        screen
          .getByRole('link', { name: 'Execution records' })
          .getAttribute('aria-current'),
      ).toBe('page'),
    );
    expect(screen.getByText('Run panel')).toBeDefined();
  });
  it('does not wrap a detail page in the module header', () => {
    mount('/settings/workflow/workflows/workflow-1');
    expect(screen.getByText('Detail panel')).toBeDefined();
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
