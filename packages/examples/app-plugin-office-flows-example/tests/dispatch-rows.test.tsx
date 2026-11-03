import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { I18nProvider } from '@nocobase/i18n/client';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { RowsTable } from '../client/components/flow-ui.js';
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
