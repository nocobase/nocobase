import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ListIcon } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IssueToolbar } from '../../client/issues/toolbar.js';
import type { IssuesPage } from '../../client/issues/use-issues-page.js';
import enUS from '../../client/locales/en-US.js';

afterEach(cleanup);
describe('personal task phone search preconditions', () => {
  it('retains the URL search in the real collapsed toolbar and exposes it through Filters before querying by role', async () => {
    const runtime = await createTestI18nRuntime({
      application: { namespace: 'studio', resources: enUS },
      locale: 'en-US',
    });
    const page = {
      view: 'list',
      searchText: 'retained-query',
      filtered: true,
      toolbarFilters: [],
      searchRef: { current: null },
      setView: vi.fn(),
      setSearchText: vi.fn(),
      scheduleSearch: vi.fn(),
      clearFilters: vi.fn(),
    } as unknown as IssuesPage;
    render(
      <TestI18nProvider runtime={runtime} namespace='studio'>
        <style>{'.hidden { display: none; }'}</style>
        <IssueToolbar
          page={page}
          views={[{ key: 'list', label: 'List', icon: ListIcon }]}
          fetching={false}
        />
      </TestI18nProvider>,
    );
    const input = screen.getByLabelText('Search issues');
    expect(input).toHaveValue('retained-query');
    expect(input).not.toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Search issues' })).toBeNull();
    const filters = screen.getByRole('button', { name: /Filters/ });
    fireEvent.click(filters);
    expect(filters).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('textbox', { name: 'Search issues' })).toHaveValue(
      'retained-query',
    );
    fireEvent.click(filters);
    fireEvent.click(filters);
    expect(screen.getByRole('textbox', { name: 'Search issues' })).toHaveValue(
      'retained-query',
    );
  });
});
