/**
 * The App page's variables: the table with where each value comes from, secrets masked; setting a value, overriding
 * the environment's in one click, and editing many at once as `.env` text with the changes reviewed before they are
 * sent; the generated first administrator, masked until shown and deleted once saved; and the missing-variables alert.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import enUS from '../client/locales/en-US.js';
import type {
  AppVariableView,
  AppVariablesMeta,
  InitialAdminView,
} from '../shared/releases.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  toasts: [] as { type: string; title: string }[],
}));
vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class extends Error {
    public constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  },
  useApiClient: () => mocks,
  usePageBreadcrumb: () => undefined,
  useToaster: () => ({
    show: (toast: { type: string; title: string }) => {
      mocks.toasts.push(toast);
      return 'toast';
    },
    close: () => undefined,
  }),
}));
vi.mock('@nocobase/i18n/client', () => {
  const t = (key: string, values?: Record<string, unknown>) => {
    let result: unknown = enUS;
    const parts = key.split('.');
    // A count picks the plural form, as i18next does.
    if (typeof values?.count === 'number')
      parts.push(`${parts.pop()!}_${values.count === 1 ? 'one' : 'other'}`);
    for (const part of parts)
      result = (result as Record<string, unknown> | undefined)?.[part];
    return typeof result === 'string'
      ? result.replace(/{{(\w+)}}/g, (_, name: string) =>
          String(values?.[name] ?? name),
        )
      : key;
  };
  return {
    useTranslation: () => ({ t, i18n: { language: 'en-US' } }),
    withNamespace: (_: string, component: unknown) => component,
  };
});

import { ApiClientError } from '@nocobase/app-client';

import {
  InitialAdminAlert,
  MissingVariablesAlert,
} from '../client/components/variable-alerts.js';
import { AppVariables } from '../client/components/variables-table.js';

const row = (patch: Partial<AppVariableView>): AppVariableView => ({
  name: 'X',
  declared: true,
  description: null,
  secret: false,
  required: false,
  firstStartOnly: false,
  generate: null,
  source: 'unset',
  value: null,
  missing: false,
  changed: false,
  app: null,
  environment: null,
  ...patch,
});

interface Sent {
  readonly path: string;
  readonly method?: string;
  readonly json?: unknown;
  readonly query?: Record<string, unknown>;
}

function renderVariables(element: ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/releases/shop?tab=variables']}>
      <Routes>
        <Route path='/releases/:appId' element={element} />
        <Route path='/environments/:environmentId' element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Where a link led. */
function Where(): ReactElement {
  const location = useLocation();
  return <p data-testid='where'>{`${location.pathname}${location.search}`}</p>;
}

function serve(
  variables: readonly AppVariableView[],
  admin: InitialAdminView | null = null,
  patch: Partial<AppVariablesMeta> = {},
): Sent[] {
  const sent: Sent[] = [];
  const meta: AppVariablesMeta = {
    total: variables.length,
    releaseId: 'r1',
    releaseVersion: '1.2.0',
    environmentId: 'staging',
    declared: true,
    missing: variables.filter((item) => item.missing).map((item) => item.name),
    changed: false,
    ...patch,
  };
  mocks.request.mockImplementation((options: Sent) => {
    sent.push(options);
    if (options.path === 'releases/apps/shop/variables' && !options.method)
      return Promise.resolve({ data: variables, meta });
    if (options.path === 'releases/apps/shop/initialAdmin')
      return admin
        ? Promise.resolve({ data: admin })
        : Promise.reject(new ApiClientError('Not found', 404 as never));
    return Promise.resolve(undefined);
  });
  return sent;
}

afterEach(() => {
  cleanup();
  mocks.request.mockReset();
  mocks.toasts.length = 0;
});

describe('App variables', () => {
  it('shows each variable with its source and tags, secrets masked', async () => {
    serve([
      row({
        name: 'SMTP_PASSWORD',
        description: 'The SMTP password.',
        secret: true,
        required: true,
        missing: true,
      }),
      row({
        name: 'DB_HOST',
        source: 'environment',
        value: 'db.internal',
        environment: { set: true, value: 'db.internal' },
      }),
      row({
        name: 'AUTH_SECRET',
        secret: true,
        source: 'generated',
        app: { set: true, value: null, generated: true },
        changed: true,
      }),
    ]);
    renderVariables(<AppVariables appId='shop' canEdit />);
    const smtp = (await screen.findByText('SMTP_PASSWORD')).closest('tr')!;
    expect(within(smtp).getByText('The SMTP password.')).toBeInTheDocument();
    expect(within(smtp).getByText('Missing')).toBeInTheDocument();
    expect(within(smtp).getByText('Not set')).toBeInTheDocument();
    expect(within(smtp).getByText('Unset')).toBeInTheDocument();
    const host = screen.getByText('DB_HOST').closest('tr')!;
    expect(within(host).getByText('db.internal')).toBeInTheDocument();
    expect(within(host).getByText('From environment')).toBeInTheDocument();
    const auth = screen.getByText('AUTH_SECRET').closest('tr')!;
    expect(within(auth).getByText('Generated')).toBeInTheDocument();
    expect(within(auth).getByText('Set')).toBeInTheDocument();
    expect(
      within(auth).getByText('Changed — restart needed'),
    ).toBeInTheDocument();
  });

  it('sets a value behind the row menu', async () => {
    const sent = serve([
      row({ name: 'DB_HOST', source: 'environment', value: 'db.internal' }),
    ]);
    renderVariables(<AppVariables appId='shop' canEdit />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Actions for DB_HOST' }),
    );
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Override']);
    fireEvent.click(items[0]!);
    fireEvent.change(await screen.findByLabelText('Value'), {
      target: { value: 'db.staging' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(sent.some((item) => item.method === 'PUT')).toBe(true),
    );
    const put = sent.find((item) => item.method === 'PUT')!;
    expect(put.path).toBe('releases/apps/shop/variables/DB_HOST');
    expect(put.json).toEqual({ value: 'db.staging' });
  });

  it('overrides the environment’s value in one click', async () => {
    const sent = serve([
      row({
        name: 'DB_HOST',
        source: 'environment',
        value: 'db.internal',
        environment: { set: true, value: 'db.internal' },
      }),
    ]);
    renderVariables(<AppVariables appId='shop' canEdit />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Override DB_HOST' }),
    );
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('Override DB_HOST')).toBeInTheDocument();
    fireEvent.change(within(sheet).getByLabelText('Value'), {
      target: { value: 'db.shop' },
    });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(sent.some((item) => item.method === 'PUT')).toBe(true),
    );
    expect(sent.find((item) => item.method === 'PUT')).toMatchObject({
      path: 'releases/apps/shop/variables/DB_HOST',
      json: { value: 'db.shop' },
    });
  });

  it('edits many values as .env text, reviewing the changes before saving them', async () => {
    const sent = serve([
      row({
        name: 'TIER',
        source: 'app',
        value: 'small',
        app: { set: true, value: 'small', generated: false },
      }),
      row({
        name: 'SMTP_PASSWORD',
        secret: true,
        source: 'app',
        app: { set: true, value: null, generated: false },
      }),
      row({
        name: 'DB_HOST',
        source: 'environment',
        value: 'db.internal',
        environment: { set: true, value: 'db.internal' },
      }),
    ]);
    renderVariables(<AppVariables appId='shop' canEdit />);
    fireEvent.click(await screen.findByRole('button', { name: 'Bulk edit' }));
    const text = await screen.findByLabelText('Variables (.env)');
    // The App's own plain values; Secrets and the environment's values stay out of the text.
    expect(text).toHaveValue('TIER=small');

    fireEvent.change(text, {
      target: { value: '# pasted\nDB_HOST=db.shop\nNEW_TOKEN=xyz\noops' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
    expect(
      await screen.findByText('Line 4: write it as KEY=value.'),
    ).toBeInTheDocument();
    expect(sent.some((item) => item.method)).toBe(false);

    fireEvent.change(text, {
      target: { value: '# pasted\nDB_HOST=db.shop\nNEW_TOKEN=xyz' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Review changes' }));
    const changes = await screen.findByRole('list', { name: 'Changes' });
    const items = within(changes).getAllByRole('listitem');
    expect(items.map((item) => item.getAttribute('data-kind'))).toEqual([
      'add',
      'add',
      'remove',
    ]);
    expect(within(changes).getByText('TIER')).toBeInTheDocument();
    // A new name ending in TOKEN is a Secret, masked, and may be changed before saving.
    expect(
      within(changes).getByRole('checkbox', { name: 'NEW_TOKEN is a Secret' }),
    ).toBeChecked();
    expect(within(changes).queryByText('xyz')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Save 3 changes' }));
    await waitFor(() =>
      expect(sent.filter((item) => item.method)).toHaveLength(3),
    );
    const writes = sent.filter((item) => item.method);
    expect(writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: 'PUT',
          path: 'releases/apps/shop/variables/DB_HOST',
          json: { value: 'db.shop' },
        }),
        expect.objectContaining({
          method: 'PUT',
          path: 'releases/apps/shop/variables/NEW_TOKEN',
          json: { value: 'xyz', secret: true },
        }),
        expect.objectContaining({
          method: 'DELETE',
          path: 'releases/apps/shop/variables/TIER',
        }),
      ]),
    );
    await waitFor(() =>
      expect(mocks.toasts.at(-1)?.title).toBe('3 changes saved.'),
    );
  });

  it('lists what the most recent build declares, missing first, and what it does not under Undeclared', async () => {
    serve([
      row({ name: 'APP_TITLE', source: 'default' }),
      row({
        name: 'PAYMENT_KEY',
        secret: true,
        required: true,
        missing: true,
      }),
      row({
        name: 'SMTP_HOST',
        source: 'configFile',
      }),
      row({
        name: 'OLD_FLAG',
        declared: false,
        source: 'app',
        value: 'on',
        app: { set: true, value: 'on', generated: false },
      }),
    ]);
    renderVariables(
      <AppVariables
        appId='shop'
        canEdit
        environmentTo='/environments/staging?tab=variables'
      />,
    );
    expect(
      await screen.findByText(
        /Listed as the most recent build \(1\.2\.0\) declares them/,
      ),
    ).toBeInTheDocument();
    const [declared, undeclared] = screen.getAllByRole('table');
    const names = within(declared!)
      .getAllByRole('row')
      .slice(1)
      .map((tr) => tr.querySelector('td')?.textContent);
    expect(names).toEqual(['PAYMENT_KEY', 'APP_TITLE', 'SMTP_HOST']);
    expect(
      within(declared!).getByText('PAYMENT_KEY').closest('tr')!,
    ).toHaveTextContent(/UnsetMissing/);
    expect(within(declared!).getByText('Default')).toBeInTheDocument();
    expect(within(declared!).getByText('config.yml')).toBeInTheDocument();
    expect(screen.getByText('Undeclared')).toBeInTheDocument();
    expect(within(undeclared!).getByText('OLD_FLAG')).toBeInTheDocument();

    // Undeclared: the App's own value is cleared; there is nothing to set on the environment for it.
    fireEvent.click(
      screen.getByRole('button', { name: 'Actions for OLD_FLAG' }),
    );
    expect(
      (await screen.findAllByRole('menuitem')).map((item) => item.textContent),
    ).toEqual(['Replace', 'Clear']);
  });

  it('links a declared variable to its environment’s variables', async () => {
    serve([row({ name: 'PAYMENT_KEY', required: true, missing: true })]);
    renderVariables(
      <AppVariables
        appId='shop'
        canEdit={false}
        environmentTo='/environments/staging?tab=variables'
      />,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Actions for PAYMENT_KEY' }),
    );
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Set on environment',
    ]);
    fireEvent.click(items[0]!);
    expect(await screen.findByTestId('where')).toHaveTextContent(
      '/environments/staging?tab=variables',
    );
  });

  it('explains that variables come with the first build, and still takes one by hand', async () => {
    serve([], null, { releaseId: null, releaseVersion: null, declared: false });
    renderVariables(<AppVariables appId='shop' canEdit />);
    expect(await screen.findByText('No build yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Variables appear here once the app’s first build/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add variable' }),
    ).toBeInTheDocument();
  });

  it('offers no changes without configure', async () => {
    serve([row({ name: 'DB_HOST' })]);
    renderVariables(<AppVariables appId='shop' canEdit={false} />);
    await screen.findByText('DB_HOST');
    expect(screen.queryByRole('button', { name: /Actions for/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add variable' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bulk edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Override/ })).toBeNull();
  });
});

describe('App variable alerts', () => {
  it('names the missing variables and links to the environment’s and the App’s variables', () => {
    render(
      <MemoryRouter initialEntries={['/releases/shop']}>
        <MissingVariablesAlert
          names={['SMTP_PASSWORD', 'DB_PASSWORD']}
          environmentTo='/environments/staging?tab=variables'
          appTo='?tab=variables'
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/SMTP_PASSWORD, DB_PASSWORD must be set/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Set on environment' }),
    ).toHaveAttribute('href', '/environments/staging?tab=variables');
    expect(
      screen.getByRole('link', { name: 'Set on this app' }),
    ).toHaveAttribute('href', '/releases/shop?tab=variables');
  });

  it('leaves out the links the reader cannot follow', () => {
    render(
      <MemoryRouter initialEntries={['/releases/shop?tab=variables']}>
        <MissingVariablesAlert names={['SMTP_PASSWORD']} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/SMTP_PASSWORD must be set/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('shows the first administrator masked, and deletes it once saved', async () => {
    const sent = serve([], {
      deploymentId: 'd1',
      username: 'nocobase',
      email: 'admin@nocobase.com',
      password: 'Secret123Secret1',
      expiresAt: new Date(Date.now() + 5 * 3_600_000).toISOString(),
    });
    render(<InitialAdminAlert appId='shop' />);
    expect(await screen.findByText('nocobase')).toBeInTheDocument();
    expect(screen.queryByText('Secret123Secret1')).toBeNull();
    expect(screen.getByText(/deleted in 5 h/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByText('Secret123Secret1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'I’ve saved it' }));
    await waitFor(() => expect(screen.queryByText('nocobase')).toBeNull());
    expect(
      sent.some(
        (item) =>
          item.method === 'POST' &&
          item.path === 'releases/apps/shop/initialAdmin/dismiss',
      ),
    ).toBe(true);
  });

  it('shows nothing when there is no first administrator', async () => {
    const sent = serve([]);
    const { container } = render(<InitialAdminAlert appId='shop' />);
    await waitFor(() =>
      expect(
        sent.some((item) => item.path === 'releases/apps/shop/initialAdmin'),
      ).toBe(true),
    );
    expect(container.querySelector('[data-slot=initial-admin]')).toBeNull();
  });
});
