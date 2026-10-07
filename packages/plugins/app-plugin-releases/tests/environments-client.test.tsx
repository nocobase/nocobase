/**
 * Environments: the list, whose rows open an environment's page; adding one in a dialog that chooses a driver first,
 * with a driver's form from the registry and JSON for a driver without one; the environment's page with its tabs, its
 * settings form (credentials that say they are set without showing them and are sent only when replaced, the
 * connection test), its variables, and a read-only view for those who may not manage environments.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import enUS from '../client/locales/en-US.js';
import { allPermissions, type ReleasesPermissions } from '../shared/access.js';
import type {
  AppSummary,
  DriverSummary,
  EnvironmentRecord,
  EnvironmentDeclaredVariableView,
  EnvironmentVariableView,
  RegistryRecord,
} from '../shared/releases.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  toasts: [] as { type: string; title: string }[],
  services: undefined as unknown,
}));
vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class extends Error {},
  useApiClient: () => mocks,
  usePageBreadcrumb: () => undefined,
  useClientApplication: () => ({ services: mocks.services }),
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
    for (const part of key.split('.'))
      result = (result as Record<string, unknown> | undefined)?.[part];
    // A count picks the plural form, as i18next does, where the key has one.
    if (result === undefined && typeof values?.count === 'number') {
      result = enUS;
      const parts = key.split('.');
      parts.push(`${parts.pop()!}_${values.count === 1 ? 'one' : 'other'}`);
      for (const part of parts)
        result = (result as Record<string, unknown> | undefined)?.[part];
    }
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

import {
  createDriverFormRegistry,
  decodeDriverForm,
  encodeDriverForm,
  hostDriverForm,
  releasesDriverFormsToken,
  type DriverFormDescription,
} from '../client/driver-forms/index.js';
import EnvironmentPage from '../client/pages/environment-page.js';
import EnvironmentsPage from '../client/pages/environments-page.js';

/** A driver form with a setting, a default, a virtual field and a credential, as a driver package would write it. */
const remoteForm: DriverFormDescription = {
  kind: 'remote',
  ns: 'test',
  title: 'Remote driver',
  description: 'Runs apps somewhere else.',
  codec: {
    decode: (config) => ({
      address: typeof config.endpoint === 'string' ? config.endpoint : '',
    }),
    encode: (values, config) => {
      const address = String(values.address ?? '').trim();
      if (address) config.endpoint = address;
      else delete config.endpoint;
    },
  },
  groups: [
    {
      id: 'connection',
      title: 'Connection',
      fields: [
        { id: 'address', type: 'text', label: 'Address', required: true },
        {
          id: 'token',
          type: 'secret',
          path: 'secret.token',
          label: 'Token',
        },
        {
          id: 'port',
          type: 'number',
          path: 'config.port',
          label: 'Port',
          default: 80,
          integer: true,
        },
      ],
    },
  ],
  check: {
    details: [{ key: 'version', label: 'Version' }],
    explain: (message) =>
      /ECONNREFUSED/.test(message) ? { key: 'Nobody answers there.' } : null,
  },
};

const summary = (
  kind: string,
  facts: unknown = null,
  images = false,
): DriverSummary => ({
  kind,
  title: { key: `drivers.${kind}`, ns: 'test' },
  configSchema: {},
  secretSchema: null,
  capabilities: {
    logs: true,
    urlModes: ['path'],
    ...(images ? { images: true } : {}),
  },
  facts: facts as DriverSummary['facts'],
});

const environment = (
  patch: Partial<EnvironmentRecord> = {},
): EnvironmentRecord => ({
  id: 'remote-1',
  name: 'Remote one',
  driver: 'remote',
  config: { endpoint: 'tcp://far:2375', port: 8080, future: true },
  hasSecret: true,
  secretKeys: ['token'],
  publicUrl: null,
  protected: false,
  approvers: [],
  maxApps: null,
  capabilities: { archives: true, images: false, onDemand: true },
  sampleDataOnFirstDeploy: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...patch,
});

interface Sent {
  readonly path: string;
  readonly method?: string;
  readonly json?: Record<string, unknown>;
  readonly query?: Record<string, unknown>;
}

function serve(
  environments: readonly EnvironmentRecord[],
  check: unknown = { ok: true, details: { version: '28.1' } },
  registries: readonly RegistryRecord[] = [],
  variables: readonly EnvironmentVariableView[] = [],
  {
    permissions = allPermissions(),
    apps = [],
    declared = [],
  }: {
    readonly permissions?: ReleasesPermissions;
    readonly apps?: readonly AppSummary[];
    readonly declared?: readonly EnvironmentDeclaredVariableView[];
  } = {},
): Sent[] {
  const sent: Sent[] = [];
  mocks.services = (() => {
    const registry = createDriverFormRegistry([hostDriverForm, remoteForm]);
    return {
      has: (token: unknown) => token === releasesDriverFormsToken,
      resolve: () => registry,
    };
  })();
  mocks.request.mockImplementation((options: Sent) => {
    sent.push(options);
    if (options.path === 'releases/me')
      return Promise.resolve({
        data: { userId: 'u', kind: 'human', permissions },
      });
    if (options.path === 'releases/drivers')
      return Promise.resolve({
        data: [
          summary('host'),
          summary('remote'),
          summary('custom', null, true),
        ],
      });
    if (options.path === 'releases/environments' && !options.method)
      return Promise.resolve({ data: environments });
    if (options.path === 'releases/apps')
      return Promise.resolve({ data: apps, meta: { total: apps.length } });
    if (options.path.endsWith('/declaredVariables'))
      return Promise.resolve({
        data: declared,
        meta: { total: declared.length },
      });
    if (options.path.endsWith('/variables') && !options.method)
      return Promise.resolve({
        data: variables,
        meta: { total: variables.length },
      });
    if (options.path.includes('/variables/'))
      return Promise.resolve({ data: variables[0] ?? {} });
    if (options.path === 'releases/environments/check')
      return Promise.resolve({ data: check });
    if (options.path === 'releases/registries' && !options.method)
      return Promise.resolve({ data: registries });
    if (options.path === 'releases/registries/check')
      return Promise.resolve({
        data: {
          ok: false,
          message: 'The registry refused the pull credentials.',
          details: { anonymous: false, pull: 'failed' },
        },
      });
    return Promise.resolve({ data: environments[0] ?? {} });
  });
  return sent;
}

/** The environments page, or with `path` one environment's page below it. */
function renderPage(path = '/environments'): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path='/environments' element={<EnvironmentsPage />}>
          <Route path=':environmentId' element={<EnvironmentPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/** An environment's Settings tab, and its settings card once loaded. */
async function openSettings(id = 'remote-1'): Promise<HTMLElement> {
  renderPage(`/environments/${id}?tab=settings`);
  const title = await screen.findByText('Environment settings');
  return title.closest('[data-slot="environment-settings"]') as HTMLElement;
}

afterEach(() => {
  cleanup();
  mocks.request.mockReset();
});

describe('environment form mapping', () => {
  it('reads stored settings into inputs and writes back only what differs from the defaults', () => {
    const stored = { endpoint: 'tcp://far:2375', port: 80, future: { x: 1 } };
    const state = decodeDriverForm(remoteForm, {
      config: stored,
      secretKeys: ['token'],
    });
    expect(state.values).toMatchObject({
      address: 'tcp://far:2375',
      port: '80',
    });
    expect(state.secrets.token).toEqual({ mode: 'keep', value: '' });
    const output = encodeDriverForm(remoteForm, state, stored);
    expect(output).toMatchObject({
      config: { endpoint: 'tcp://far:2375', future: { x: 1 } },
      secretChanges: {},
      errors: {},
    });
    expect(output.config.port).toBeUndefined();
    const changed = encodeDriverForm(
      remoteForm,
      {
        ...state,
        values: { ...state.values, address: '', port: 'x' },
        secrets: { token: { mode: 'clear', value: '' } },
      },
      stored,
    );
    expect(changed.errors).toEqual({ address: 'required', port: 'number' });
    expect(changed.secretChanges).toEqual({ token: null });
  });

  it('maps the Host form to the public URL pattern only', () => {
    const state = decodeDriverForm(hostDriverForm, {
      config: {},
      publicUrl: 'https://p.example.com/{appId}/',
    });
    expect(state.values.publicUrl).toBe('https://p.example.com/{appId}/');
    expect(
      encodeDriverForm(
        hostDriverForm,
        { ...state, values: { ...state.values, publicUrl: ' ' } },
        {},
      ),
    ).toMatchObject({ config: {}, publicUrl: null, errors: {} });
  });
});

describe('environment dialog', () => {
  it('lists each Host environment by its run mode', async () => {
    serve([
      environment({
        id: 'apps',
        name: 'Apps',
        driver: 'host',
        config: { backend: 'docker' },
      }),
      environment({
        id: 'preview',
        name: 'Preview',
        driver: 'host',
        config: { backend: 'in-process' },
      }),
    ]);
    renderPage();
    const docker = (await screen.findByText('Apps')).closest('tr')!;
    expect(
      within(docker as HTMLElement).getByText('Docker'),
    ).toBeInTheDocument();
    const preview = screen.getByText('Preview').closest('tr')!;
    expect(
      within(preview as HTMLElement).getByText('In process'),
    ).toBeInTheDocument();
  });

  it('keeps a row’s actions in one menu, deleting last and only once confirmed', async () => {
    const sent = serve([environment()]);
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Actions for Remote one' }),
    );
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Open',
      'Edit',
      'Check',
      'Delete',
    ]);
    expect(items[3]).toHaveAttribute('data-variant', 'destructive');
    fireEvent.click(items[3]!);
    const confirm = await screen.findByRole('alertdialog');
    expect(sent.some((item) => item.method === 'DELETE')).toBe(false);
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(sent.some((item) => item.method === 'DELETE')).toBe(true),
    );
  });

  it('starts with the driver, shows its form, and falls back to JSON for a driver without one', async () => {
    serve([]);
    renderPage();
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Add environment' }))[0]!,
    );
    expect(await screen.findByText('This server')).toBeInTheDocument();
    expect(screen.getByText('Runs apps somewhere else.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: /This server/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByLabelText('Public URL pattern'),
    ).toBeInTheDocument();
    // The run modes, in plain words; nothing read-only posing as a setting.
    expect(
      screen.getByRole('radio', { name: /In process/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Advanced settings')).toBeNull();
    // Docker asks for no connection settings: it explains which Docker it uses.
    expect(screen.queryByText('Docker connection')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /^Docker/ }));
    expect(await screen.findByText('Docker connection')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Socket/ })).toBeNull();
    expect(screen.queryByLabelText('Settings (JSON)')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    fireEvent.click(screen.getByRole('radio', { name: /custom/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByLabelText('Settings (JSON)')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Credentials (JSON, write-only)'),
    ).toBeInTheDocument();
  });

  it('says a credential is set without showing it, and sends it only when replaced', async () => {
    const sent = serve([environment()]);
    await openSettings();
    expect(await screen.findByText('Set')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Token/)).toBeNull();
    expect(screen.getByLabelText(/Address/)).toHaveValue('tcp://far:2375');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(sent.some((item) => item.method === 'PATCH')).toBe(true),
    );
    const first = sent.find((item) => item.method === 'PATCH')!;
    expect(first.path).toBe('releases/environments/remote-1');
    expect(first.json).toMatchObject({
      config: { endpoint: 'tcp://far:2375', port: 8080, future: true },
    });
    expect(first.json).not.toHaveProperty('secretChanges');
    expect(first.json).not.toHaveProperty('secret');

    // Saved, the form starts again from what is stored: the credential is still set.
    fireEvent.click(await screen.findByRole('button', { name: 'Replace' }));
    fireEvent.change(screen.getByLabelText(/Token/), {
      target: { value: 'new-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(sent.filter((item) => item.method === 'PATCH')).toHaveLength(2),
    );
    expect(
      sent.filter((item) => item.method === 'PATCH')[1]!.json,
    ).toMatchObject({ secretChanges: { token: 'new-token' } });
  });

  it('tests the settings in the form and explains a failure', async () => {
    const sent = serve([environment()]);
    await openSettings();
    fireEvent.change(await screen.findByLabelText(/Address/), {
      target: { value: 'tcp://near:2375' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }));
    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('28.1')).toBeInTheDocument();
    const check = sent.find(
      (item) => item.path === 'releases/environments/check',
    )!;
    expect(check.json).toMatchObject({
      id: 'remote-1',
      driver: 'remote',
      config: { endpoint: 'tcp://near:2375' },
    });

    cleanup();
    serve([environment()], {
      ok: false,
      message: 'connect ECONNREFUSED 10.0.0.1:2375',
    });
    await openSettings();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Test connection' }),
    );
    expect(
      await screen.findByText('Nobody answers there.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('connect ECONNREFUSED 10.0.0.1:2375'),
    ).toBeInTheDocument();
  });
});

describe('image registries', () => {
  const registry: RegistryRecord = {
    id: 'ghcr',
    name: 'GHCR',
    url: 'https://ghcr.io',
    host: 'ghcr.io',
    namespace: 'acme',
    pullUsername: 'bot',
    secretKeys: ['pullPassword'],
    environmentIds: ['production'],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  it('has no registries page, and edits the chosen registry write-only in the environment form', async () => {
    const sent = serve(
      [
        environment({
          id: 'production',
          name: 'Production',
          driver: 'custom',
          config: {},
          registryId: 'ghcr',
        }),
      ],
      undefined,
      [registry],
    );
    const dialog = await openSettings('production');
    fireEvent.click(
      await within(dialog).findByRole('button', { name: 'Edit' }),
    );
    expect(
      within(dialog).getByText(
        'Changes apply to every environment that pulls from this registry.',
      ),
    ).toBeInTheDocument();
    // The stored pull password says it is set and offers Replace and Remove.
    expect(within(dialog).getAllByText('Set').length).toBeGreaterThan(0);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Replace' }));
    fireEvent.change(dialog.querySelector('#rel-env-registry-pull-password')!, {
      target: { value: 'read-token' },
    });
    fireEvent.click(
      within(dialog).getAllByRole('button', { name: 'Test connection' })[0]!,
    );
    expect(
      await within(dialog).findByText('Cannot use the registry'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('refused')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(
        sent.find(
          (item) =>
            item.path === 'releases/environments/production' &&
            item.method === 'PATCH',
        )?.json,
      ).toMatchObject({ registryId: 'ghcr' }),
    );
    const saved = sent.findIndex(
      (item) =>
        item.path === 'releases/registries/ghcr' && item.method === 'PATCH',
    );
    expect(sent[saved]?.json).toMatchObject({
      name: 'GHCR',
      url: 'https://ghcr.io',
      namespace: 'acme',
      pullUsername: 'bot',
      secretChanges: { pullPassword: 'read-token' },
    });
    expect(saved).toBeLessThan(
      sent.findIndex(
        (item) =>
          item.path === 'releases/environments/production' &&
          item.method === 'PATCH',
      ),
    );
    const check = sent.find(
      (item) => item.path === 'releases/registries/check',
    );
    expect(check?.json).toMatchObject({
      id: 'ghcr',
      secretChanges: { pullPassword: 'read-token' },
    });
  });

  it('adds a new registry from a Docker environment form, before the environment', async () => {
    const sent = serve([], undefined, [registry]);
    renderPage();
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Add environment' }))[0]!,
    );
    fireEvent.click(await screen.findByRole('radio', { name: /custom/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Production' },
    });
    fireEvent.change(dialog.querySelector('#rel-env-id')!, {
      target: { value: 'production' },
    });
    fireEvent.click(dialog.querySelector('#rel-env-registry')!);
    const option = await screen.findByRole('option', { name: 'New registry' });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.mouseUp(option);
    fireEvent.click(option);
    fireEvent.change(await within(dialog).findByLabelText('Address'), {
      target: { value: 'https://ghcr.io' },
    });
    fireEvent.change(dialog.querySelector('#rel-env-registry-namespace')!, {
      target: { value: 'acme' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(
        sent.find(
          (item) =>
            item.path === 'releases/environments' && item.method === 'POST',
        )?.json,
      ).toMatchObject({ id: 'production', registryId: 'ghcr-io-acme' }),
    );
    const added = sent.findIndex(
      (item) => item.path === 'releases/registries' && item.method === 'POST',
    );
    expect(sent[added]?.json).toMatchObject({
      id: 'ghcr-io-acme',
      name: 'ghcr.io/acme',
      url: 'https://ghcr.io',
      namespace: 'acme',
    });
    expect(added).toBeLessThan(
      sent.findIndex(
        (item) =>
          item.path === 'releases/environments' && item.method === 'POST',
      ),
    );
  });

  it('shows nothing about registries for an in-process environment', async () => {
    serve([], undefined, [registry]);
    renderPage();
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Add environment' }))[0]!,
    );
    fireEvent.click(await screen.findByRole('radio', { name: /This server/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByLabelText('Public URL pattern');
    expect(within(dialog).queryByText('Release images')).toBeNull();
    expect(dialog.querySelector('#rel-env-registry')).toBeNull();
  });
});

describe('protected environments', () => {
  it('marks a protected environment with one badge', async () => {
    serve([environment({ protected: true })]);
    renderPage();
    const row = (await screen.findByText('Remote one')).closest('tr')!;
    expect(
      within(row as HTMLElement).getByText('Protected'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Requires approval')).toBeNull();
  });

  it('asks for approvers once the environment is protected, and saves them with it', async () => {
    const sent = serve([environment()]);
    await openSettings();
    const isProtected = await screen.findByRole('checkbox', {
      name: /Protected/,
    });
    expect(screen.queryByLabelText('Approvers')).toBeNull();
    fireEvent.click(isProtected);
    fireEvent.change(await screen.findByLabelText('Approvers'), {
      target: { value: 'wang, li' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(sent.some((item) => item.method === 'PATCH')).toBe(true),
    );
    const saved = sent.find((item) => item.method === 'PATCH')!.json!;
    expect(saved).toMatchObject({ protected: true, approvers: ['wang', 'li'] });
    expect(saved).not.toHaveProperty('requiresApproval');
  });
});

describe('environment variables and sample data', () => {
  it('saves the sample-data switch with the environment', async () => {
    const sent = serve([environment()]);
    await openSettings();
    const sampleData = await screen.findByRole('checkbox', {
      name: /Load sample data on first deployment/,
    });
    expect(sampleData).not.toBeChecked();
    fireEvent.click(sampleData);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(sent.some((item) => item.method === 'PATCH')).toBe(true),
    );
    expect(sent.find((item) => item.method === 'PATCH')!.json).toMatchObject({
      sampleDataOnFirstDeploy: true,
    });
  });

  it('lists the environment’s variables, secrets masked, and adds one', async () => {
    const sent = serve(
      [environment()],
      undefined,
      [],
      [
        {
          name: 'SMTP_PASSWORD',
          secret: true,
          description: null,
          set: true,
          value: null,
          updatedBy: 'u',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
        {
          name: 'REGION',
          secret: false,
          description: null,
          set: true,
          value: 'eu-west',
          updatedBy: 'u',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    );
    renderPage('/environments/remote-1?tab=variables');
    const block = await screen.findByText('SMTP_PASSWORD');
    const panel = block.closest('[data-slot="environment-variables"]')!;
    expect(
      within(panel as HTMLElement).getByText('eu-west'),
    ).toBeInTheDocument();
    expect(
      within(panel as HTMLElement).getAllByText('Set').length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Add variable' }));
    await waitFor(() =>
      expect(document.getElementById('rel-variable-name')).not.toBeNull(),
    );
    fireEvent.change(document.getElementById('rel-variable-name')!, {
      target: { value: 'api_token' },
    });
    const value = document.getElementById('rel-variable-value')!;
    fireEvent.change(value, { target: { value: 'abc' } });
    // A name ending in TOKEN is a Secret unless someone says otherwise.
    expect(screen.getByRole('checkbox', { name: /^Secret/ })).toBeChecked();
    const dialog = value.closest('[role="dialog"]')!;
    fireEvent.click(
      within(dialog as HTMLElement).getByRole('button', { name: 'Save' }),
    );
    await waitFor(() =>
      expect(sent.some((item) => item.method === 'PUT')).toBe(true),
    );
    const put = sent.find((item) => item.method === 'PUT')!;
    expect(put.path).toBe('releases/environments/remote-1/variables/API_TOKEN');
    expect(put.json).toEqual({ value: 'abc', secret: true });
  });
});

describe('environment variables declared by its apps', () => {
  it('lists what the apps’ builds declare beside the environment’s values, with who declares and who misses each', async () => {
    serve(
      [environment()],
      undefined,
      [],
      [
        {
          name: 'SMTP_HOST',
          secret: false,
          description: null,
          set: true,
          value: 'smtp.example.com',
          updatedBy: 'u',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
        {
          name: 'MANUAL_ONLY',
          secret: false,
          description: null,
          set: true,
          value: 'x',
          updatedBy: 'u',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      ],
      {
        declared: [
          {
            name: 'PAYMENT_KEY',
            description: 'The payment provider key.',
            secret: true,
            required: true,
            set: false,
            apps: [
              'crm',
              'crm-pr-1',
              'crm-pr-2',
              'crm-pr-3',
              'shop',
              'blog',
              'wiki',
            ],
            missingIn: ['crm-pr-2', 'crm-pr-3'],
          },
          {
            name: 'SMTP_HOST',
            description: 'Mail host.',
            secret: false,
            required: true,
            set: true,
            apps: ['crm'],
            missingIn: [],
          },
        ],
      },
    );
    renderPage('/environments/remote-1?tab=variables');
    const payment = (await screen.findByText('PAYMENT_KEY')).closest('tr')!;
    const rows = payment.closest('tbody')!.querySelectorAll('tr');
    // What an app misses comes first; then by name.
    expect([...rows].map((tr) => tr.querySelector('td')?.textContent)).toEqual([
      'PAYMENT_KEYThe payment provider key.',
      'MANUAL_ONLY',
      'SMTP_HOSTMail host.',
    ]);
    expect(within(payment).getByText('Not set')).toBeInTheDocument();
    expect(within(payment).getByText('crm-pr-* ×3')).toBeInTheDocument();
    expect(within(payment).getByText('+2')).toBeInTheDocument();
    const missing = within(payment).getByText('Missing in 2 apps');
    expect(missing.closest('[title]')).toHaveAttribute(
      'title',
      'Required, and no value for: crm-pr-2, crm-pr-3',
    );
    const manual = screen.getByText('MANUAL_ONLY').closest('tr')!;
    expect(within(manual).getByText('No app declares it')).toBeInTheDocument();
    const smtp = screen.getByText('SMTP_HOST').closest('tr')!;
    expect(within(smtp).getByText('smtp.example.com')).toBeInTheDocument();
    expect(within(smtp).getByText('Required')).toBeInTheDocument();
    // A declared variable the environment does not set is set from its row.
    fireEvent.click(
      within(payment).getByRole('button', { name: 'Actions for PAYMENT_KEY' }),
    );
    expect(
      (await screen.findAllByRole('menuitem')).map((item) => item.textContent),
    ).toEqual(['Set value']);
  });
});

describe('environment page', () => {
  const app = {
    app: { id: 'shop', name: 'Shop', environmentId: 'remote-1', labels: {} },
    environment: {
      id: 'remote-1',
      name: 'Remote one',
      protected: false,
      runsImages: false,
    },
    runtime: {
      available: true,
      state: 'running',
      version: '1.0.0',
      startedAt: null,
      error: null,
    },
    url: 'https://shop.example.com/',
    currentVersion: '1.0.0',
    hasReleases: true,
    hasPendingDeployment: false,
  } as unknown as AppSummary;

  it('opens from its row, with its apps on the Overview tab', async () => {
    const sent = serve([environment()], undefined, [], [], { apps: [app] });
    renderPage();
    fireEvent.click((await screen.findByText('Remote one')).closest('tr')!);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Remote one' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Variables',
      'Settings',
    ]);
    expect(await screen.findByRole('link', { name: 'Shop' })).toHaveAttribute(
      'href',
      '/releases/shop',
    );
    expect(
      sent.find((item) => item.path === 'releases/apps')?.query,
    ).toMatchObject({ environmentId: 'remote-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    await waitFor(() =>
      expect(
        sent.some(
          (item) =>
            item.path === 'releases/environments/remote-1/check' &&
            item.method === 'POST',
        ),
      ).toBe(true),
    );
  });

  it('is read-only for those who may not manage environments', async () => {
    const permissions = allPermissions();
    serve(
      [environment()],
      undefined,
      [],
      [
        {
          name: 'REGION',
          secret: false,
          description: null,
          set: true,
          value: 'eu-west',
          updatedBy: 'u',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      ],
      {
        permissions: {
          ...permissions,
          settings: {
            ...permissions.settings,
            'rel.environments/manage': false,
          },
        },
      },
    );
    renderPage('/environments/remote-1?tab=settings');
    expect(
      await screen.findByText(
        'You can view this environment’s settings but not change them.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Variables' }));
    expect(await screen.findByText('eu-west')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add variable' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Bulk edit' })).toBeNull();
  });
});
