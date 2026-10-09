// @vitest-environment jsdom
/**
 * The Models page: the model services in a table, a service per row, several of one provider. Adding one and clicking
 * one open the same dialog: one form (provider type when adding, name, base URL, write-only key, connection test, checked models, on
 * or off) saved at once. A row's menu edits it, turns it on or off or deletes it. The prices are the Usage page's.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ModelServiceView } from '../../shared/models.js';
import { callsTo, clientMocks, resetApi } from './fake-client.js';
import { renderPage } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: ModelsPage } =
  await import('../../client/pages/models/index.js');

const ALL = [
  'agents.services/read',
  'agents.services/manage',
  'agents.prices/read',
  'agents.prices/manage',
];

const state = { services: [] as ModelServiceView[] };

function serve(permissions: readonly string[] = ALL): void {
  resetApi(
    {
      'agents/services': () => state.services,
      'POST agents/services': () => ({ ...state.services[0], name: 'new' }),
      'PATCH agents/services/team': () => state.services[0],
      'POST agents/discoverModels': () => ({
        ok: true,
        items: [
          { id: 'mock-mini', kind: 'chat' },
          { id: 'mock-model', kind: 'chat' },
        ],
      }),
      'POST agents/checkConnection': (request) => {
        const { model, kind } = request.json as { model: string; kind: string };
        // mock-mini is a chat model, whatever it is checked as.
        return model === 'mock-mini' && kind !== 'chat'
          ? { ok: false, message: 'Not an embedding model.', looksLike: 'chat' }
          : { ok: true, message: null };
      },
      'agents/models': () =>
        state.services.map((item) => ({
          name: item.name,
          title: item.title,
          provider: item.provider,
          models: item.models.filter((model) => model.kind === 'chat'),
        })),
      'agents/defaultModels': () => ({
        chat: null,
        effectiveChat: state.services[0]
          ? {
              modelService: state.services[0].name,
              model: state.services[0].models[0]!.value,
              serviceTitle: state.services[0].title,
              modelLabel: state.services[0].models[0]!.label,
            }
          : null,
      }),
      'PUT agents/defaultModels/chat': (request) => ({
        chat: request.json,
        effectiveChat: {
          ...(request.json as object),
          serviceTitle: 'Lab',
          modelLabel: 'lab-model',
        },
      }),
    },
    permissions,
  );
}

const sent = (method: string, path: string): unknown[] =>
  callsTo(method, path).map((call) => call.json);

function service(extra: Partial<ModelServiceView> = {}): ModelServiceView {
  return {
    name: 'team',
    title: 'Team',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:9999/v1',
    apiKeySet: true,
    enabled: true,
    models: [
      {
        value: 'mock-model',
        label: 'mock-model',
        kind: 'chat',
        dimensions: null,
      },
    ],
    ...extra,
  };
}

const servicesList = () =>
  screen.findByRole('table', { name: 'services.list' });

describe('Agent team › Models', () => {
  beforeEach(() => {
    state.services = [];
    serve();
  });

  it('lists every service, several of one provider, with its provider type, host and status', async () => {
    state.services = [
      service(),
      service({
        name: 'lab',
        title: 'Lab',
        provider: 'deepseek',
        baseUrl: 'http://10.0.0.2:8000/v1',
        apiKeySet: false,
      }),
      service({
        name: 'openai',
        title: 'OpenAI',
        provider: 'openai',
        baseUrl: null,
        enabled: false,
      }),
    ];
    renderPage(<ModelsPage />);
    const table = await servicesList();
    // The first row is the header.
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual([
      'OpenAI',
      'Lab',
      'Team',
    ]);
    expect(rows[0]).toHaveTextContent('api.openai.com');
    expect(rows[0]).toHaveTextContent('services.status.off');
    expect(rows[1]).toHaveTextContent('DeepSeek');
    expect(rows[1]).toHaveTextContent('10.0.0.2:8000');
    expect(rows[1]).toHaveTextContent('services.status.noKey');
    expect(rows[2]).toHaveTextContent('127.0.0.1:9999');
    expect(rows[2]).toHaveTextContent('services.status.on');
  });

  it('sets the system default chat model at the top of the page', async () => {
    state.services = [
      service(),
      service({
        name: 'lab',
        title: 'Lab',
        models: [
          {
            value: 'lab-model',
            label: 'lab-model',
            kind: 'chat',
            dimensions: null,
          },
        ],
      }),
    ];
    renderPage(<ModelsPage />);
    const section = await screen.findByTestId('ag-default-model');
    const select = await within(section).findByRole('combobox', {
      name: 'defaultModel.title',
    });
    expect(select).toHaveTextContent('Team · mock-model');
    await userEvent.click(select);
    await userEvent.click(
      await screen.findByRole('option', { name: 'lab-model' }),
    );
    await waitFor(() =>
      expect(sent('PUT', 'agents/defaultModels/chat')).toEqual([
        { modelService: 'lab', model: 'lab-model' },
      ]),
    );
  });

  it('adds a service in one dialog: provider type, name, key, base URL and models', async () => {
    state.services = [service()];
    renderPage(<ModelsPage />);
    await servicesList();
    await userEvent.click(
      screen.getByRole('button', { name: 'services.add.open' }),
    );
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('combobox', { name: 'services.add.provider' }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'OpenAI-compatible' }),
    );
    expect(within(dialog).getByLabelText('services.service.name')).toHaveValue(
      'OpenAI-compatible',
    );
    const key = within(dialog).getByLabelText('services.connection.apiKey');
    expect(key).toHaveAttribute('type', 'password');
    expect(key).toHaveAttribute(
      'placeholder',
      'services.connection.keyPlaceholder',
    );
    await userEvent.type(key, 'mock-key');
    await userEvent.type(
      within(dialog).getByLabelText('services.connection.baseUrl'),
      'http://127.0.0.1:9998/v1',
    );
    await userEvent.type(
      within(dialog).getByLabelText('services.models.addPlaceholder'),
      'mock-model{Enter}',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(sent('POST', 'agents/services')).toEqual([
        {
          title: 'OpenAI-compatible',
          provider: 'openai-compatible',
          baseUrl: 'http://127.0.0.1:9998/v1',
          apiKey: 'mock-key',
          models: [
            {
              value: 'mock-model',
              label: 'mock-model',
              kind: 'chat',
              dimensions: null,
            },
          ],
          enabled: true,
        },
      ]),
    );
  });

  it('lets a listed model take another kind before it is checked, and tests each model as its kind', async () => {
    state.services = [service()];
    renderPage(<ModelsPage />);
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'services.service.edit(title=Team)',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    const mini = await within(dialog).findByRole('listitem', {
      name: 'mock-mini',
    });
    // Not checked yet, its kind is already a choice.
    await userEvent.click(
      within(mini).getByRole('combobox', {
        name: 'services.models.kind(model=mock-mini)',
      }),
    );
    await userEvent.click(
      await screen.findByRole('option', {
        name: 'services.models.kinds.embedding',
      }),
    );
    await userEvent.click(
      within(mini).getByRole('button', {
        name: 'services.models.test(model=mock-mini)',
      }),
    );
    expect(
      await within(mini).findByText(
        'services.models.looksLike(notKind=services.models.notKind.embedding,kind=services.models.kindNouns.chat)',
      ),
    ).toBeInTheDocument();
    expect(sent('POST', 'agents/checkConnection').at(-1)).toMatchObject({
      service: 'team',
      model: 'mock-mini',
      kind: 'embedding',
    });
    // The checked model is tested as its own kind.
    const own = within(dialog).getByRole('listitem', { name: 'mock-model' });
    await userEvent.click(
      within(own).getByRole('button', {
        name: 'services.models.test(model=mock-model)',
      }),
    );
    expect(
      await within(own).findByText(
        'services.models.testOk(kind=services.models.kindNouns.chat)',
      ),
    ).toBeInTheDocument();
    // Checking it keeps the kind chosen.
    await userEvent.click(within(mini).getByRole('checkbox'));
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(sent('PATCH', 'agents/services/team').at(-1)).toMatchObject({
        models: [
          expect.objectContaining({ value: 'mock-model', kind: 'chat' }),
          expect.objectContaining({ value: 'mock-mini', kind: 'embedding' }),
        ],
      }),
    );
  });

  it('edits a service in one dialog and keeps its key when the key field is left empty', async () => {
    state.services = [service()];
    renderPage(<ModelsPage />);
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'services.service.edit(title=Team)',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByLabelText('services.add.provider')).toBeNull();
    expect(
      within(dialog).getByLabelText('services.connection.apiKey'),
    ).toHaveAttribute('placeholder', 'common.secretKept');
    await waitFor(() =>
      expect(sent('POST', 'agents/discoverModels')).toEqual([
        {
          service: 'team',
          provider: 'openai-compatible',
          baseUrl: 'http://127.0.0.1:9999/v1',
        },
      ]),
    );

    const name = within(dialog).getByLabelText('services.service.name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Team EU');
    const models = await within(dialog).findByRole('list', {
      name: 'services.models.title',
    });
    const off = await within(models).findByRole('listitem', {
      name: 'mock-mini',
    });
    // Every model says its kind, which can be changed: a listed one the kind discovery guessed.
    expect(
      within(off).getByRole('combobox', {
        name: 'services.models.kind(model=mock-mini)',
      }),
    ).toHaveTextContent('services.models.kinds.chat');
    await userEvent.click(within(off).getByRole('checkbox'));
    expect(sent('PATCH', 'agents/services/team')).toEqual([]);
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(sent('PATCH', 'agents/services/team')).toEqual([
        {
          title: 'Team EU',
          baseUrl: 'http://127.0.0.1:9999/v1',
          models: [
            {
              value: 'mock-model',
              label: 'mock-model',
              kind: 'chat',
              dimensions: null,
            },
            {
              value: 'mock-mini',
              label: 'mock-mini',
              kind: 'chat',
              dimensions: null,
            },
          ],
          enabled: true,
        },
      ]),
    );
  });

  it('notes an OpenCode base URL, whose session header is sent automatically', async () => {
    state.services = [service({ baseUrl: 'https://opencode.ai/zen/go/v1' })];
    renderPage(<ModelsPage />);
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'services.service.edit(title=Team)',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('services.connection.openCodeHint'),
    ).toBeInTheDocument();
    // Nothing on the form sets the session header up: the server sends it.
    expect(within(dialog).queryAllByTestId('ag-service-header')).toEqual([]);
    expect(
      within(dialog).queryByRole('button', {
        name: 'services.connection.addHeader',
      }),
    ).toBeNull();
  });

  it('replaces the key with what is typed', async () => {
    state.services = [service()];
    renderPage(<ModelsPage />);
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'services.service.actions(title=Team)',
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'actions.edit' }),
    );
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(
      within(dialog).getByLabelText('services.connection.apiKey'),
      'new-key',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(sent('PATCH', 'agents/services/team')[0]).toEqual(
        expect.objectContaining({ apiKey: 'new-key' }),
      ),
    );
  });

  it('turns a service off from its menu', async () => {
    state.services = [service()];
    renderPage(<ModelsPage />);
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'services.service.actions(title=Team)',
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'services.service.turnOff' }),
    );
    await waitFor(() =>
      expect(sent('PATCH', 'agents/services/team')).toEqual([
        { enabled: false },
      ]),
    );
  });

  it('offers the add action only in the empty state while there is no service', async () => {
    renderPage(<ModelsPage />);
    expect(await screen.findByText('services.empty.title')).toBeInTheDocument();
    const adds = screen.getAllByRole('button', { name: 'services.add.open' });
    expect(adds).toHaveLength(1);
    expect(adds[0]!.closest('[data-slot="empty"]')).not.toBeNull();
  });

  it('shows the services alone, unchangeable, to who only reads them', async () => {
    state.services = [service()];
    serve(['agents.services/read']);
    renderPage(<ModelsPage />);
    await servicesList();
    expect(
      screen.queryByRole('button', { name: 'services.add.open' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: 'services.service.actions(title=Team)',
      }),
    ).toBeNull();
    await userEvent.click(
      screen.getByRole('button', { name: 'services.service.edit(title=Team)' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByLabelText('services.service.name'),
    ).toBeDisabled();
    expect(
      within(dialog).queryByRole('button', { name: 'actions.save' }),
    ).toBeNull();
  });
});
