/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  WorkflowListPage,
  WorkflowRunListPage,
} from '../../client/workflow-management/pages.js';
import { workflowApi } from '../../client/workflow-management/data.js';
import locales from '../../client/locales/index.js';
import { createWorkflowI18nRuntime } from '../i18n.js';

const runtime = await createWorkflowI18nRuntime(locales);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('workflow list filters', () => {
  it.each([
    {
      Component: WorkflowListPage,
      method: 'workflowPage' as const,
      parameter: 'enabled',
      option: 'Enabled',
      value: 'true',
      search: 'q',
    },
    {
      Component: WorkflowRunListPage,
      method: 'runPage' as const,
      parameter: 'status',
      option: 'Running',
      value: '0',
      search: 'workflowTitle',
    },
  ])(
    'applies and clears $parameter while retaining search',
    async ({ Component, method, parameter, option, value, search }) => {
      const request = vi.spyOn(workflowApi, method).mockResolvedValue({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0 },
      });
      render(
        <I18nProvider runtime={runtime}>
          <MemoryRouter>
            <Component />
          </MemoryRouter>
        </I18nProvider>,
      );
      await waitFor(() => expect(request).toHaveBeenCalled());
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'customer' },
      });
      // A user's press, not a bare click event: it lets React finish wiring the Select trigger.
      await userEvent.click(screen.getByRole('combobox'));
      chooseOption(
        await screen.findByRole('option', { name: option, exact: true }),
      );
      await waitFor(() => {
        const query = new URLSearchParams(request.mock.lastCall?.[0]);
        expect(query.get(parameter)).toBe(value);
        expect(query.get(search)).toBe('customer');
        expect(query.get('page')).toBe('1');
      });
      await userEvent.click(screen.getByRole('combobox'));
      chooseOption(
        await screen.findByRole('option', {
          name: 'All statuses',
          exact: true,
        }),
      );
      await waitFor(() => {
        const query = new URLSearchParams(request.mock.lastCall?.[0]);
        expect(query.has(parameter)).toBe(false);
        expect(query.get(search)).toBe('customer');
      });
    },
  );
});

function chooseOption(option: HTMLElement): void {
  fireEvent.pointerDown(option, { pointerType: 'mouse' });
  fireEvent.click(option);
}
