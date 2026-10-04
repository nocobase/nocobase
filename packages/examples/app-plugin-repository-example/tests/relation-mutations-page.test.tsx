import type { ApiClient } from '@nocobase/app-client';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import { relationOperations } from '../client/relation-lab.js';
import { createFixture } from './helpers.js';
const state = vi.hoisted(() => ({ api: undefined as ApiClient | undefined }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
}));
import RelationMutationsPage from '../client/pages/relation-mutations-page.js';
let f: Awaited<ReturnType<typeof createFixture>>;
beforeEach(async () => {
  f = await createFixture();
  state.api = f.api;
});
afterEach(async () => {
  cleanup();
  await f.database.destroy();
});
async function show(locale = 'en-US') {
  const runtime = new I18nRuntime({
    defaultLocale: locale,
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: 'test',
  });
  runtime.registerNamespace('@nocobase/app-plugin-repository-example', locales);
  await runtime.init(locale);
  render(
    <I18nProvider runtime={runtime}>
      <RelationMutationsPage />
    </I18nProvider>,
  );
}
it('provides seven independent forms and tables and runs each operation separately', async () => {
  await show();
  expect(f.requests).toHaveLength(0);
  expect(screen.getAllByRole('region')).toHaveLength(7);
  const user = userEvent.setup();
  for (const operation of relationOperations) {
    const card = screen.getByRole('region', { name: operation, exact: true });
    await user.click(
      within(card).getByRole('button', {
        name: 'Prepare example',
        exact: true,
      }),
    );
    const table = await within(card).findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    if (['create', 'update', 'upsert'].includes(operation)) {
      await user.clear(within(card).getByLabelText('Task title'));
      await user.type(
        within(card).getByLabelText('Task title'),
        `User ${operation}`,
      );
    }
    if (operation === 'set') {
      for (const checkbox of within(card).getAllByRole('checkbox'))
        if ((checkbox as HTMLInputElement).checked) await user.click(checkbox);
    }
    const start = f.requests.length;
    await user.click(
      within(card).getByRole('button', {
        name: `Execute ${operation}`,
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(within(card).getByRole('status')).toHaveTextContent(
        `${operation} write succeeded.`,
      ),
    );
    const mutations = f.requests
      .slice(start)
      .filter((request) => request.path.endsWith('/updateOne'));
    expect(mutations).toHaveLength(1);
    expect(mutations[0]?.body).toMatchObject({
      values: { tasks: { [operation]: expect.anything() } },
    });
    await waitFor(() =>
      expect(
        within(card).getByRole('button', { name: 'Refresh table' }),
      ).toBeEnabled(),
    );
    const rows = within(table).getAllByRole('row').slice(1);
    if (operation === 'disconnect')
      expect(
        within(rows[0]!)
          .getAllByRole('cell')
          .slice(1, 3)
          .map((cell) => cell.textContent),
      ).toEqual(['No', 'Yes']);
    if (operation === 'delete')
      expect(
        within(rows[0]!)
          .getAllByRole('cell')
          .slice(1, 3)
          .map((cell) => cell.textContent),
      ).toEqual(['No', 'No']);
    if (operation === 'set')
      expect(
        rows.every(
          (row) => within(row).getAllByRole('cell')[1]?.textContent === 'No',
        ),
      ).toBe(true);
    if (operation === 'upsert') {
      await user.clear(within(card).getByLabelText('Task title'));
      await user.type(
        within(card).getByLabelText('Task title'),
        'Updated by second upsert',
      );
      await user.click(
        within(card).getByRole('button', {
          name: 'Execute upsert',
          exact: true,
        }),
      );
      await waitFor(() =>
        expect(table).toHaveTextContent('Updated by second upsert'),
      );
      expect(within(table).getAllByRole('row')).toHaveLength(6);
    }
  }
});
it('supports hasOne forms and Chinese labels without requiring seed data', async () => {
  await show('zh-CN');
  const user = userEvent.setup();
  const card = screen.getByRole('region', { name: 'create', exact: true });
  await user.click(within(card).getByRole('combobox', { name: '关系类型' }));
  await user.click(
    await screen.findByRole('option', { name: 'hasOne · profile' }),
  );
  await user.click(within(card).getByRole('button', { name: '准备示例数据' }));
  await within(card).findByRole('table');
  await user.clear(within(card).getByLabelText('简介内容'));
  await user.type(within(card).getByLabelText('简介内容'), 'Profile from form');
  await user.click(
    within(card).getByRole('button', { name: '执行 create', exact: true }),
  );
  await waitFor(() =>
    expect(within(card).getByRole('table')).toHaveTextContent(
      'Profile from form',
    ),
  );
  expect(
    within(card).getByRole('button', { name: '执行 create', exact: true }),
  ).toBeDisabled();
});
it('keeps form values on failure and retries without preparing another project', async () => {
  await show();
  const user = userEvent.setup();
  const card = screen.getByRole('region', { name: 'update', exact: true });
  await user.click(
    within(card).getByRole('button', { name: 'Prepare example', exact: true }),
  );
  await within(card).findByRole('table');
  const field = within(card).getByLabelText('Task title');
  await user.clear(field);
  await user.type(field, 'Keep this value');
  const repository = f.api.repository('repositoryExampleRelationProjects');
  const spy = vi.spyOn(f.api, 'repository').mockReturnValueOnce({
    ...repository,
    updateOne: async () => {
      throw new Error('Write failed');
    },
  });
  await user.click(
    within(card).getByRole('button', { name: 'Execute update', exact: true }),
  );
  expect(await within(card).findByRole('alert')).toHaveTextContent(
    'Write failed',
  );
  expect(field).toHaveValue('Keep this value');
  spy.mockRestore();
  await user.click(
    within(card).getByRole('button', { name: 'Execute update', exact: true }),
  );
  await waitFor(() =>
    expect(within(card).getByRole('table')).toHaveTextContent(
      'Keep this value',
    ),
  );
});
it('repeats hasOne upsert on the actual target without adding phantom table rows', async () => {
  await show();
  const user = userEvent.setup();
  const card = screen.getByRole('region', { name: 'upsert', exact: true });
  await user.click(
    within(card).getByRole('combobox', { name: 'Relation type' }),
  );
  await user.click(
    await screen.findByRole('option', { name: 'hasOne · profile' }),
  );
  await user.click(
    within(card).getByRole('button', { name: 'Prepare example', exact: true }),
  );
  const table = await within(card).findByRole('table');
  for (const value of ['Created profile', 'Updated profile']) {
    const field = within(card).getByLabelText('Profile summary');
    await user.clear(field);
    await user.type(field, value);
    await user.click(
      within(card).getByRole('button', { name: 'Execute upsert', exact: true }),
    );
    await waitFor(() => expect(table).toHaveTextContent(value));
    expect(within(table).getAllByRole('row')).toHaveLength(6);
  }
});
it('refreshes after a post-write read failure without replaying the mutation', async () => {
  await show();
  const user = userEvent.setup();
  const card = screen.getByRole('region', { name: 'create', exact: true });
  await user.click(
    within(card).getByRole('button', { name: 'Prepare example', exact: true }),
  );
  await within(card).findByRole('table');
  const repository = f.api.repository('repositoryExampleRelationProjects');
  const spy = vi
    .spyOn(f.api, 'repository')
    .mockReturnValueOnce(repository)
    .mockReturnValueOnce({
      ...repository,
      findOne: async () => {
        throw new Error('Reload failed');
      },
    });
  const start = f.requests.length;
  await user.click(
    within(card).getByRole('button', { name: 'Execute create', exact: true }),
  );
  expect(await within(card).findByRole('alert')).toHaveTextContent(
    'Reload failed',
  );
  expect(within(card).getByRole('status')).toHaveTextContent(
    'create write succeeded.',
  );
  expect(within(card).queryByRole('table')).not.toBeInTheDocument();
  spy.mockRestore();
  await user.click(within(card).getByRole('button', { name: 'Refresh table' }));
  const table = await within(card).findByRole('table');
  expect(within(table).getAllByRole('row')).toHaveLength(6);
  expect(
    f.requests
      .slice(start)
      .filter((request) => request.path.endsWith('/updateOne')),
  ).toHaveLength(1);
});
