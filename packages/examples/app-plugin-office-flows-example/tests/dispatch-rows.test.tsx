import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { I18nProvider } from '@nocobase/i18n/client';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { RowsTable, History } from '../client/components/flow-ui.js';
import type { Config } from '../client/lib/api.js';
import locales from '../client/locales/index.js';

it('uses asynchronously loaded copy defaults and retains explicit row choices', async () => {
  const runtime = await createTestI18nRuntime({
    locale: 'en-US',
    namespaces: { '@nocobase/app-plugin-office-flows-example': locales },
  });
  const config: Config = {
    departments: [
      {
        id: '1',
        name: 'IT',
        clerks: ['huangtao'],
        heads: ['xulei'],
        leaders: [],
      },
    ],
    managementGroups: [],
    holidays: [],
    dispatchRules: {
      departmentNames: [],
      ownDepartmentOnly: true,
      assigneeRole: 'heads',
      ccHeads: true,
      ccLeaders: false,
    },
  };
  const props = {
    rows: [],
    editable: true,
    parentDepartment: 'IT',
    dispatchLabel: 'Dispatch',
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onDispatch: vi.fn(),
    busy: false,
  };
  const view = (configuration: Config | undefined) => (
    <I18nProvider runtime={runtime}>
      <RowsTable {...props} config={configuration} />
    </I18nProvider>
  );
  const { rerender } = render(view(undefined));
  expect(
    screen.getByRole('button', { name: 'Copy: heads and others' }),
  ).toHaveAttribute('aria-pressed', 'false');
  rerender(view(config));
  const heads = screen.getByRole('button', { name: 'Copy: heads and others' });
  expect(heads).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(heads);
  rerender(view({ ...config }));
  expect(heads).toHaveAttribute('aria-pressed', 'false');
  expect(
    screen.getByRole('columnheader', { name: 'Assignees' }),
  ).toBeInTheDocument();
});

it('shows upgrade provenance for a historical record with no remaining transition log', async () => {
  const runtime = await createTestI18nRuntime({
    locale: 'en-US',
    namespaces: { '@nocobase/app-plugin-office-flows-example': locales },
  });
  render(
    <I18nProvider runtime={runtime}>
      <History
        lifecycle='incoming'
        view={{
          record: { id: '1' },
          description: { name: 'incoming', states: [], transitions: [] },
          available: [],
          history: { transitions: [], effectRuns: [] },
          traces: [],
          parameterSnapshot: {
            scope: 'office',
            lifecycle: 'incoming',
            recordId: '1',
            at: '2026-11-15T00:00:00.000Z',
            revision: 4,
            values: { dispatchRules: {} },
            sources: {
              dispatchRules: {
                group: 'incoming',
                schemaVersion: 1,
                revision: 4,
                origin: 'upgrade',
              },
            },
          },
        }}
      />
    </I18nProvider>,
  );
  expect(screen.getByText('Fixed instance parameters')).toBeInTheDocument();
  expect(
    screen.getByText(
      'dispatchRules: Added during upgrade using configuration revision 4',
    ),
  ).toBeInTheDocument();
  expect(screen.getByText('Nothing has happened yet.')).toBeInTheDocument();
});
