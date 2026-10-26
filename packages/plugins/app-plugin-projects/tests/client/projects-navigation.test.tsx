import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

import type { ProjectListItem } from '../../shared/projects.js';
import { clientMocks, me, resetApi } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: ProjectsPage } =
  await import('../../client/pages/projects/index.js');

afterEach(cleanup);

function Detail() {
  const navigate = useNavigate();
  return (
    <section aria-label='Project detail'>
      <Link to='/projects'>Return to projects</Link>
      <button onClick={() => void navigate(-1)}>History back</button>
    </section>
  );
}

const projects: ProjectListItem[] = Array.from({ length: 25 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Return check ${String(index + 1).padStart(2, '0')}`,
  description: null,
  visibility: 'everyone',
  status: 'planned',
  priority: 'none',
  leadUserId: null,
  startDate: null,
  dueDate: null,
  setupIssueId: null,
  createdAt: '2026-10-26T00:00:00Z',
  updatedAt: '2026-10-26T00:00:00Z',
  lead: null,
  memberCount: 0,
  issueCounts: { total: 0, done: 0, byStatus: {} },
}));

it.each(['Return to projects', 'History back'])(
  'keeps the filtered second page through %s and repeated detail visits',
  async (back) => {
    resetApi({
      projects: () => ({ data: projects }),
      'projects/me': () => ({ data: me('admin') }),
    });
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <MemoryRouter initialEntries={['/projects']}>
          <Routes>
            <Route path='/projects' element={<ProjectsPage />}>
              <Route path=':id' element={<Detail />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const input = await screen.findByRole('textbox', {
      name: 'projects.search',
    });
    fireEvent.change(input, { target: { value: 'Return check' } });
    await screen.findByRole('link', { name: 'Return check 01' });
    fireEvent.click(screen.getByRole('button', { name: 'dataTable.nextPage' }));
    await screen.findByText('dataTable.pageOf(page=2,pageCount=2)');
    for (let visit = 0; visit < 2; visit++) {
      fireEvent.click(screen.getByRole('link', { name: 'Return check 21' }));
      const detail = await screen.findByRole('region', {
        name: 'Project detail',
      });
      fireEvent.click(
        within(detail).getByRole(back === 'History back' ? 'button' : 'link', {
          name: back,
        }),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole('region', { name: 'Project detail' }),
        ).toBeNull(),
      );
      expect((input as HTMLInputElement).value).toBe('Return check');
      expect(
        screen.getByText('dataTable.pageOf(page=2,pageCount=2)'),
      ).toBeTruthy();
      expect(
        screen.getByRole('link', { name: 'Return check 21' }),
      ).toBeTruthy();
      expect(
        screen.queryByRole('link', { name: 'Return check 01' }),
      ).toBeNull();
    }
    // A real search change still resets pagination and changes the displayed results.
    fireEvent.change(input, { target: { value: 'Return check 01' } });
    await screen.findByText('dataTable.pageOf(page=1,pageCount=1)');
    expect(screen.getByRole('link', { name: 'Return check 01' })).toBeTruthy();
    fireEvent.change(input, { target: { value: '' } });
    await screen.findByText('dataTable.pageOf(page=1,pageCount=2)');
  },
);
