import {
  apiClientToken,
  ApiClientError,
  NavigationGuardProvider,
} from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate, useLocation } from 'react-router';
import { useEffect, type ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import knowledge from '../client/plugin.js';
import {
  KnowledgeIndexingDialog,
  KnowledgeIndexingSettings,
  KnowledgeIndexingEntry,
  KnowledgeView,
  KnowledgePage,
} from '../client/pages.js';
import type { IndexingFormProps } from '../client/indexing/types.js';
import type {
  IndexingConfig,
  IndexingStatus,
  GenerationStatus,
  EmbeddingServiceView,
} from '../shared/indexing.js';

function NavigationProbe() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/different-page')}>
        Leave settings
      </button>
      <output aria-label='Test location'>{useLocation().pathname}</output>
    </>
  );
}
function failedStatus(reason: string): IndexingStatus {
  const generation: GenerationStatus = {
    id: 'failed-generation',
    configRevision: '4',
    state: 'failed',
    type: 'fixture-text',
    instanceKey: 'first',
    scanComplete: true,
    dimension: null,
    documents: { total: 1, done: 0, pending: 0, failed: 1 },
    chunks: { total: null, prepared: 0, committed: 0 },
    retryPolicy: 'hostJobs',
    error: { reason, message: 'private-api-key-and-document-text' },
    createdAt: '2026-10-22T00:00:00Z',
    publishedAt: null,
    cleanupAfter: null,
  };
  return {
    revision: '4',
    enabled: true,
    availability: 'degraded',
    reason: null,
    serving: null,
    target: generation,
    observedAt: '2026-10-22T00:00:01Z',
  };
}
function Form(props: IndexingFormProps) {
  return (
    <label>
      Terms
      <input
        aria-label='Terms'
        disabled={props.disabled}
        value={typeof props.value.text === 'string' ? props.value.text : ''}
        onChange={(event) => props.onChange({ text: event.target.value })}
      />
    </label>
  );
}
async function fixture({
  actions = ['read', 'configure', 'rebuild'],
  open = true,
  page = false,
  knowledgeView = false,
  knowledgePage = false,
  titleActions = undefined as ReactNode,
  settingsError = false,
  emptyInstances = false,
  directoryError = false,
  withVector = false,
  modelCatalog = null as readonly EmbeddingServiceView[] | null,
  config = {
    version: 1,
    key: 'first',
    options: { text: 'saved' },
  } as IndexingConfig | null,
  form = Form,
  status = null as IndexingStatus | null,
} = {}) {
  let settings = {
    revision: '4',
    config,
    capabilities: {
      configure: actions.includes('configure'),
      rebuild: actions.includes('rebuild'),
    },
    updatedAt: '2026-10-22T00:00:00Z',
  };
  const instances = [
    {
      key: 'first',
      name: 'First index',
      type: 'fixture-text',
      channels: [{ name: 'terms', kind: 'lexical' }],
      available: true,
      reason: null,
    },
    {
      key: 'second',
      name: 'Second index',
      type: 'fixture-text',
      channels: [{ name: 'terms', kind: 'lexical' }],
      available: true,
      reason: null,
    },
  ];
  if (withVector)
    instances.push({
      key: 'vector',
      name: 'Vector index',
      type: 'pgvector',
      channels: [{ name: 'vector', kind: 'vector' }],
      available: true,
      reason: null,
    });
  let write: ((input: Record<string, unknown>) => Promise<unknown>) | undefined;
  const request = vi.fn(
    async (input: {
      path: string;
      method?: string;
      json?: Record<string, unknown>;
    }) => {
      if (input.path === 'authorization/permissions')
        return {
          data: {
            unrestricted: false,
            permissions: [
              { resource: { type: 'settings', id: 'kb.indexing' }, actions },
            ],
          },
        };
      if (input.method && input.method !== 'GET') {
        if (write) return write(input);
        const body = input.json!;
        settings = {
          ...settings,
          revision: String(BigInt(settings.revision) + 1n),
          config: body.config as IndexingConfig | null,
        };
        return {
          data: {
            requestId: body.requestId,
            revision: settings.revision,
            changed: true,
            acceptedAt: '2026-10-22T00:00:01Z',
            generationId: '11111111-1111-4111-8111-111111111111',
            enabled: settings.config !== null,
          },
        };
      }
      if (input.path === 'knowledge/indexingSettings') {
        if (settingsError)
          throw new ApiClientError('private settings failure', {
            status: 503,
            method: 'GET',
            url: '/private',
          });
        return { data: settings };
      }
      if (
        input.path === 'knowledge/spaces' ||
        input.path === 'knowledge/proposals'
      )
        return { data: [], meta: { total: 0 } };
      if (input.path === 'knowledge/embeddingModels')
        return {
          data: modelCatalog ?? [],
          meta: {
            total: modelCatalog?.length ?? 0,
            reason: modelCatalog === null ? 'unavailable' : null,
          },
        };
      if (input.path === 'knowledge/indexingInstances' && directoryError)
        throw new ApiClientError('private directory detail', {
          status: 503,
          method: 'GET',
          url: '/private',
        });
      if (input.path === 'knowledge/indexingInstances')
        return {
          data: emptyInstances ? [] : instances,
          meta: { total: emptyInstances ? 0 : instances.length, reason: null },
        };
      if (input.path === 'knowledge/indexingSettings/status')
        return {
          data: status ?? {
            revision: settings.revision,
            enabled: config !== null,
            availability: 'ready',
            reason: null,
            serving: null,
            target: null,
            observedAt: '2026-10-22T00:00:01Z',
          },
        };
      throw new Error('Unexpected fixture request: ' + input.path);
    },
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (knowledgeView || knowledgePage) {
    Element.prototype.scrollTo = () => {};
    Element.prototype.scrollIntoView = () => {};
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
  }
  const content = (visible: boolean) => (
    <QueryClientProvider client={client}>
      {knowledgePage ? (
        <KnowledgePage
          space={{ scope: 'fixture', scopeId: '' }}
          title='Knowledge heading'
          titleActions={titleActions}
        />
      ) : knowledgeView ? (
        <KnowledgeView
          space={{ scope: 'fixture', scopeId: '' }}
          title={<h2>Knowledge heading</h2>}
          titleActions={titleActions}
        />
      ) : page ? (
        <NavigationGuardProvider>
          <KnowledgeIndexingSettings className='custom-indexing-settings' />
          <NavigationProbe />
        </NavigationGuardProvider>
      ) : open ? (
        <KnowledgeIndexingDialog open={visible} onOpenChange={vi.fn()} />
      ) : (
        <KnowledgeIndexingEntry />
      )}
    </QueryClientProvider>
  );
  const view = await renderWithApp(content(true), {
    plugins: [
      knowledge({
        routes: false,
        indexingForms: [
          { type: 'fixture-text', load: async () => ({ default: form }) },
        ],
      }),
    ],
    fetch: async (httpRequest) => {
      const input = {
        path: new URL(httpRequest.url).pathname.replace(/^\/api\//, ''),
        ...(httpRequest.method !== 'GET'
          ? {
              method: httpRequest.method,
              json: (await httpRequest.json()) as Record<string, unknown>,
            }
          : {}),
      };
      try {
        return Response.json(await request(input));
      } catch (error) {
        if (error instanceof ApiClientError)
          return Response.json(
            {
              error: {
                status: 'ABORTED',
                reason: error.reason,
                domain: 'knowledge',
                message: error.message,
              },
            },
            { status: error.status },
          );
        throw error;
      }
    },
    services: (app) => {
      app.container.instance(
        authorizationClientToken,
        new AuthorizationClient(app.container.resolve(apiClientToken)),
      );
    },
  });
  return {
    request,
    view,
    content,
    client,
    settings: () => settings,
    changeSettings: (value: typeof settings) => {
      settings = value;
    },
    setWrite: (handler: typeof write) => {
      write = handler;
    },
  };
}
it.each([false, true])(
  'separates enablement from instance selection and retains drafts (page=%s)',
  async (page) => {
    const f = await fixture({ page });
    const toggle = await screen.findByRole('switch', {
      name: 'Enable indexing',
    });
    const terms = await screen.findByRole('textbox', { name: 'Terms' });
    await userEvent.type(terms, ' retained');
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Indexing instance' }),
    );
    expect(
      screen.queryByRole('option', { name: 'Off — use text search only' }),
    ).toBeNull();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(
      screen.getByRole('combobox', { name: 'Indexing instance' }),
    ).toHaveProperty('disabled', true);
    expect(
      screen.getByRole('combobox', { name: 'Indexing instance' }).textContent,
    ).toContain('First index');
    expect(screen.getByRole('textbox', { name: 'Terms' })).toBe(terms);
    expect(terms).toHaveProperty('disabled', true);
    expect(
      screen.getByText('fixture-text', { selector: '[data-slot="badge"]' }),
    ).toBeTruthy();
    expect(f.settings().config?.key).toBe('first');
    expect(f.request.mock.calls.filter(([input]) => input.method)).toHaveLength(
      0,
    );
    await userEvent.click(toggle);
    expect(
      (await screen.findByRole('textbox', { name: 'Terms' })).getAttribute(
        'value',
      ),
    ).toBe('saved retained');
    await save();
    await waitFor(() =>
      expect(f.settings().config?.options.text).toBe('saved retained'),
    );
  },
);

it.each([false, true])(
  'requires choosing an instance when enabling a saved disabled index (page=%s)',
  async (page) => {
    const f = await fixture({ page, config: null, withVector: true });
    const toggle = await screen.findByRole('switch', {
      name: 'Enable indexing',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(
      screen.getByRole('combobox', { name: 'Indexing instance' }),
    ).toHaveProperty('disabled', true);
    await userEvent.click(toggle);
    expect(
      screen.getByRole('button', { name: 'Save', exact: true }),
    ).toHaveProperty('disabled', true);
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Indexing instance' }),
    );
    expect(
      screen.queryByRole('option', { name: 'Off — use text search only' }),
    ).toBeNull();
    await userEvent.click(
      await screen.findByRole('option', { name: 'First index' }),
    );
    await screen.findByRole('textbox', { name: 'Terms' });
    await save();
    await waitFor(() => expect(f.settings().config?.key).toBe('first'));
    expect(
      f.request.mock.calls.some(
        ([input]) => input.path === 'knowledge/embeddingModels',
      ),
    ).toBe(false);
  },
);
it('keeps the enable switch read-only without configure permission', async () => {
  await fixture({ actions: ['read'] });
  const toggle = await screen.findByRole('switch', { name: 'Enable indexing' });
  expect(toggle.getAttribute('aria-disabled')).toBe('true');
  await userEvent.click(toggle);
  expect(toggle.getAttribute('aria-checked')).toBe('true');
});

it.each([false, true])(
  'shows document progress with hover-only failure count and footer rebuild (page=%s)',
  async (page) => {
    await fixture({ page, status: failedStatus('INDEXING_FAILED') });
    const panel = await screen.findByRole('region', {
      name: 'Indexing progress',
    });
    const bar = within(panel).getByRole('progressbar', {
      name: 'Document progress',
    });
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    expect(within(panel).getByText('1 / 1')).toBeTruthy();
    expect(within(panel).queryByText('Pending documents')).toBeNull();
    expect(within(panel).queryByText('Failed documents')).toBeNull();
    expect(within(panel).queryByText('Chunks prepared')).toBeNull();
    expect(within(panel).queryByText('Chunks committed')).toBeNull();
    expect(screen.queryByText('Failed documents: 1')).toBeNull();
    const warning = within(panel).getByRole('button', {
      name: 'Failed documents',
    });
    await userEvent.hover(warning);
    expect(await screen.findByRole('tooltip')).toHaveProperty(
      'textContent',
      'Failed documents: 1',
    );
    await userEvent.unhover(warning);
    const rebuild = screen.getByRole('button', { name: 'Rebuild all spaces' });
    const footer = rebuild.closest('footer');
    expect(footer).not.toBeNull();
    expect(footer?.previousElementSibling?.contains(panel)).toBe(true);
    const selector = screen.getByRole('combobox', {
      name: 'Indexing instance',
    });
    expect(footer?.previousElementSibling?.contains(selector)).toBe(true);
    expect(
      selector.compareDocumentPosition(panel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByText('Edit configuration to save')).toBeNull();
  },
);

it.each([
  { done: 2, failed: 1, total: 6, percentage: '50' },
  { done: 0, failed: 0, total: 0, percentage: '100' },
  { done: 2, failed: 0, total: null, percentage: null },
])(
  'handles bounded, empty and unknown document totals (%j)',
  async ({ done, failed, total, percentage }) => {
    const status = failedStatus('INDEXING_FAILED');
    if (!status.target) throw new Error('Expected fixture generation');
    await fixture({
      status: {
        ...status,
        target: {
          ...status.target,
          error: null,
          documents: { done, failed, total, pending: 0 },
        },
      },
    });
    const bar = await screen.findByRole('progressbar', {
      name: 'Document progress',
    });
    expect(bar.getAttribute('aria-valuenow')).toBe(percentage);
    expect(
      screen.getByText(done + failed + ' / ' + (total ?? '…')),
    ).toBeTruthy();
    if (!failed)
      expect(
        screen.queryByRole('button', { name: 'Failed documents' }),
      ).toBeNull();
  },
);

it('retains the selected draft after saving disable but persists only null', async () => {
  const f = await fixture();
  await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.click(
    screen.getByRole('switch', { name: 'Enable indexing' }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Confirm',
      exact: true,
    }),
  );
  await waitFor(() => expect(f.settings().config).toBeNull());
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toHaveProperty('disabled', true);
  await userEvent.click(
    screen.getByRole('switch', { name: 'Enable indexing' }),
  );
  expect(await screen.findByRole('textbox', { name: 'Terms' })).toHaveProperty(
    'value',
    'saved',
  );
  await save();
  await waitFor(() => expect(f.settings().config?.key).toBe('first'));
});
it.each([false, true])(
  'keeps standalone settings navigation-free (empty=%s)',
  async (empty) => {
    await fixture({
      page: true,
      emptyInstances: empty,
      ...(empty ? { config: null } : {}),
    });
    if (empty) await screen.findByText('Configure a vector database first');
    else await screen.findByRole('textbox', { name: 'Terms' });
    expect(
      screen.queryByRole('button', { name: 'Back to knowledge' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Open standalone settings' }),
    ).toBeNull();
    expect(screen.queryByText('All knowledge spaces')).toBeNull();
    const description = screen.getByText(
      'Configure search indexing for all knowledge spaces.',
    );
    expect(description.closest('section')).toHaveClass(
      'custom-indexing-settings',
    );
  },
);
it('keeps failed standalone settings navigation-free and supports reload', async () => {
  await fixture({ page: true, settingsError: true });
  expect(await screen.findByRole('button', { name: 'Reload' })).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Back to knowledge' }),
  ).toBeNull();
});
it.each([false, true])(
  'renders caller-owned title actions and click behavior (page=%s)',
  async (knowledgePage) => {
    const action = vi.fn();
    const f = await fixture({
      knowledgeView: !knowledgePage,
      knowledgePage,
      titleActions: (
        <button onClick={action} aria-label='Custom action'>
          <svg data-testid='custom-action-icon' aria-hidden='true' />
        </button>
      ),
    });
    const entry = await screen.findByRole('button', { name: 'Custom action' });
    const row = entry.parentElement?.parentElement;
    expect(row).toContainElement(
      screen.getByRole('heading', { name: 'Knowledge heading' }),
    );
    expect(row).not.toContainElement(
      screen.getByRole('button', { name: /Search knowledge/ }),
    );
    expect(within(entry).getByTestId('custom-action-icon')).toBeTruthy();
    await userEvent.click(entry);
    expect(action).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      f.request.mock.calls.some(
        ([input]) =>
          input.path.startsWith('knowledge/indexing') ||
          input.path === 'authorization/permissions',
      ),
    ).toBe(false);
  },
);
it.each([undefined, null, false])(
  'adds no built-in settings or permission requests for an empty titleActions=%s slot',
  async (titleActions) => {
    const f = await fixture({ knowledgeView: true, titleActions });
    await waitFor(() =>
      expect(
        f.request.mock.calls.some(
          ([input]) => input.path === 'knowledge/spaces',
        ),
      ).toBe(true),
    );
    expect(
      screen.queryByRole('button', { name: 'Knowledge index settings' }),
    ).toBeNull();
    expect(
      f.request.mock.calls.some(
        ([input]) =>
          input.path.startsWith('knowledge/indexing') ||
          input.path === 'authorization/permissions',
      ),
    ).toBe(false);
  },
);
it('lets the application compose its own permission-gated indexing entry in the slot', async () => {
  const f = await fixture({
    knowledgeView: true,
    actions: [],
    titleActions: <KnowledgeIndexingEntry />,
  });
  await waitFor(() =>
    expect(
      f.request.mock.calls.some(
        ([input]) => input.path === 'authorization/permissions',
      ),
    ).toBe(true),
  );
  expect(
    screen.queryByRole('button', { name: 'Knowledge index settings' }),
  ).toBeNull();
  expect(
    f.request.mock.calls.some(([input]) =>
      input.path.startsWith('knowledge/indexing'),
    ),
  ).toBe(false);
});
async function save() {
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  const confirmation = await screen.findByRole('alertdialog');
  expect(within(confirmation).getByText(/every knowledge space/)).toBeTruthy();
  await userEvent.click(
    within(confirmation).getByRole('button', { name: 'Confirm', exact: true }),
  );
}
it('does not query catalogs or settings from a closed entry, and hides it without global read permission', async () => {
  const f = await fixture({ actions: [], open: false });
  await waitFor(() =>
    expect(f.request).toHaveBeenCalledWith({
      path: 'authorization/permissions',
    }),
  );
  expect(
    f.request.mock.calls.filter(([input]) =>
      input.path.startsWith('knowledge/'),
    ),
  ).toEqual([]);
  expect(
    screen.queryByRole('button', { name: 'Knowledge index settings' }),
  ).toBeNull();
});
it('keeps a read-only global administrator read-only regardless of any space permissions', async () => {
  const f = await fixture({ actions: ['read'] });
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  expect(input).toHaveProperty('disabled', true);
  expect(input).toHaveProperty('value', 'saved');
  expect(
    screen.queryByRole('button', { name: 'Save', exact: true }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Rebuild all spaces' }),
  ).toBeNull();
  expect(f.request.mock.calls.filter(([input]) => input.method)).toEqual([]);
});
it('selects instance keys, edits a controlled draft, and waits for the explicit all-spaces cost confirmation', async () => {
  const f = await fixture();
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.clear(input);
  await userEvent.type(input, 'draft');
  expect(f.request.mock.calls.filter(([input]) => input.method)).toEqual([]);
  await save();
  await waitFor(() => expect(f.settings().revision).toBe('5'));
  const write = f.request.mock.calls.find(
    ([input]) => input.method === 'PUT',
  )![0];
  expect(write.json).toMatchObject({
    expectedRevision: '4',
    acknowledgeFullRebuild: true,
    config: { version: 1, key: 'first', options: { text: 'draft' } },
  });
  expect(write.json?.requestId).toMatch(/^[0-9a-f-]{36}$/);
  expect(screen.getByRole('textbox', { name: 'Terms' })).toHaveProperty(
    'value',
    'draft',
  );
});
it('preserves a conflict draft across explicit reload and saves it against the refreshed revision', async () => {
  const f = await fixture();
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.clear(input);
  await userEvent.type(input, 'my draft');
  f.changeSettings({
    ...f.settings(),
    revision: '6',
    config: { version: 1, key: 'first', options: { text: 'someone else' } },
  });
  f.setWrite(async () => {
    throw new ApiClientError('private connection secret', {
      status: 409,
      reason: 'INDEXING_REVISION_CONFLICT',
      method: 'PUT',
      url: '/private',
    });
  });
  await save();
  await screen.findByText(/settings changed elsewhere/);
  expect(screen.queryByText(/private connection secret/)).toBeNull();
  expect(screen.getByRole('textbox', { name: 'Terms' })).toHaveProperty(
    'value',
    'my draft',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Reload', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByText(/settings changed elsewhere/)).toBeNull(),
  );
  expect(screen.getByRole('textbox', { name: 'Terms' })).toHaveProperty(
    'value',
    'my draft',
  );
  f.setWrite(undefined);
  await save();
  await waitFor(() => expect(f.settings().revision).toBe('7'));
  const writes = f.request.mock.calls
    .filter(([input]) => input.method === 'PUT')
    .map(([input]) => input.json!);
  expect(writes.map((body) => body.expectedRevision)).toEqual(['4', '6']);
  expect(writes[0]!.requestId).not.toBe(writes[1]!.requestId);
});
it('reuses the durable request ID after an unknown response instead of submitting a second rebuild', async () => {
  const f = await fixture();
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.clear(input);
  await userEvent.type(input, 'retry draft');
  f.setWrite(async () => {
    throw new TypeError('response lost');
  });
  await save();
  await screen.findByText(/Your draft was retained/);
  f.setWrite(undefined);
  await save();
  await waitFor(() => expect(f.settings().revision).toBe('5'));
  const writes = f.request.mock.calls.filter(
    ([input]) => input.method === 'PUT',
  );
  expect(writes).toHaveLength(2);
  expect(writes[0]![0].json).toEqual(writes[1]![0].json);
});
it('retains unavailable extension options, but still allows an authorized explicit global disable', async () => {
  const f = await fixture({
    config: { version: 1, key: 'removed', options: { retained: 'original' } },
  });
  await screen.findByText(/configuration form is unavailable/);
  expect(screen.getByText(/"retained": "original"/)).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toHaveProperty('disabled', true);
  await userEvent.click(
    screen.getByRole('switch', { name: 'Enable indexing' }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  const confirmation = await screen.findByRole('alertdialog');
  expect(
    within(confirmation).getByText(/disables index retrieval/),
  ).toBeTruthy();
  await userEvent.click(
    within(confirmation).getByRole('button', { name: 'Confirm', exact: true }),
  );
  await waitFor(() => expect(f.settings().config).toBeNull());
});
it('fences callbacks from a removed instance even after selecting that same key again', async () => {
  const callbacks: IndexingFormProps['onChange'][] = [];
  function Captured(props: IndexingFormProps) {
    useEffect(() => {
      callbacks.push(props.onChange);
    }, [props.onChange]);
    return <Form {...props} />;
  }
  await fixture({ form: Captured });
  await screen.findByRole('textbox', { name: 'Terms' });
  const stale = callbacks[0]!;
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Indexing instance' }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: 'Second index' }),
  );
  await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Indexing instance' }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: 'First index' }),
  );
  await act(async () => stale({ text: 'late callback' }));
  expect(screen.getByRole('textbox', { name: 'Terms' })).toHaveProperty(
    'value',
    'saved',
  );
});

it('keeps an authorized entry idle until opened and submits the selected key rather than its label or type', async () => {
  const f = await fixture({ open: false });
  const entry = await screen.findByRole('button', {
    name: 'Knowledge index settings',
  });
  expect(
    f.request.mock.calls.filter(([input]) =>
      input.path.startsWith('knowledge/'),
    ),
  ).toEqual([]);
  await userEvent.click(entry);
  await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Indexing instance' }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: 'Second index' }),
  );
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.type(input, 'second draft');
  await save();
  await waitFor(() => expect(f.settings().revision).toBe('5'));
  expect(f.settings().config).toEqual({
    version: 1,
    key: 'second',
    options: { text: 'second draft' },
  });
});
it('ignores a late accepted mutation after the dialog is closed and a replacement draft is opened', async () => {
  const f = await fixture();
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.clear(input);
  await userEvent.type(input, 'old request');
  let resolve!: (value: unknown) => void;
  f.setWrite(
    () =>
      new Promise((finish) => {
        resolve = finish;
      }),
  );
  await save();
  await waitFor(() =>
    expect(f.request.mock.calls.some(([input]) => input.method === 'PUT')).toBe(
      true,
    ),
  );
  const body = f.request.mock.calls.find(
    ([input]) => input.method === 'PUT',
  )![0].json!;
  f.view.rerender(f.content(false));
  f.view.rerender(f.content(true));
  const replacement = await screen.findByRole('textbox', { name: 'Terms' });
  // Reopened cached settings render before the new authorization hook resolves.
  await waitFor(() => expect(replacement).toHaveProperty('disabled', false));
  await userEvent.clear(replacement);
  await userEvent.type(replacement, 'replacement draft');
  await act(async () =>
    resolve({
      data: {
        requestId: body.requestId,
        revision: '5',
        changed: true,
        acceptedAt: '2026-10-22T00:00:02Z',
        generationId: null,
        enabled: true,
      },
    }),
  );
  expect(screen.getByRole('textbox', { name: 'Terms' })).toHaveProperty(
    'value',
    'replacement draft',
  );
  expect(
    f.client.getQueryData(['knowledge', 'indexingSettings']),
  ).toMatchObject({ revision: '4' });
});

it.each([
  ['INDEXING_MODEL_AUTH_FAILED', /Embedding authentication failed/],
  ['INDEXING_MODEL_QUOTA_EXCEEDED', /quota or credit is exhausted/],
  ['INDEXING_MODEL_RATE_LIMITED', /rate-limiting requests/],
  ['INDEXING_STORAGE_AUTH_FAILED', /Index storage authentication failed/],
  [
    'INDEXING_STORAGE_PERMISSION_DENIED',
    /denied the operation or is read-only/,
  ],
  ['INDEXING_VECTOR_EXTENSION_MISSING', /missing the vector extension/],
])('shows safe actionable status feedback for %s', async (reason, message) => {
  await fixture({ status: failedStatus(reason) });
  expect(await screen.findByText(message)).toBeTruthy();
  expect(document.body.textContent).not.toContain(
    'private-api-key-and-document-text',
  );
});
it('keeps simultaneous active and building failures, deduplicates messages and ignores unknown raw reasons', async () => {
  const initial = failedStatus('INDEXING_MODEL_AUTH_FAILED');
  const status: IndexingStatus = {
    ...initial,
    serving: {
      ...initial.target!,
      id: 'old-active',
      state: 'active',
      error: {
        reason: 'INDEXING_STORAGE_PERMISSION_DENIED',
        message: 'private-server-url',
      },
    },
    reason: 'INDEXING_MODEL_AUTH_FAILED',
  };
  await fixture({ status });
  expect(
    await screen.findAllByText(/Embedding authentication failed/),
  ).toHaveLength(1);
  expect(
    await screen.findByText(/denied the operation or is read-only/),
  ).toBeTruthy();
  expect(document.body.textContent).not.toContain('private-server-url');
});
it('falls back for historical or unrecognized errors without rendering provider text or codes', async () => {
  await fixture({ status: failedStatus('private-unknown-code') });
  expect(await screen.findByText(/Some indexing work failed/)).toBeTruthy();
  expect(document.body.textContent).not.toContain('private-unknown-code');
  expect(document.body.textContent).not.toContain(
    'private-api-key-and-document-text',
  );
});
it('shows dependency failures even before a generation exists', async () => {
  await fixture({
    status: {
      ...failedStatus('ignored'),
      target: null,
      availability: 'unavailable',
      reason: 'INDEXING_JOBS_UNAVAILABLE',
    },
  });
  expect(
    await screen.findByText(/host jobs configuration is unavailable/),
  ).toBeTruthy();
});

it.each(['save', 'rebuild', 'retry'] as const)(
  'explains a %s request rejected for configuration drift without losing the draft or resubmitting',
  async (operation) => {
    const f = await fixture({ status: failedStatus('INDEXING_UNAVAILABLE') });
    f.setWrite(async () => {
      throw new ApiClientError('private-endpoint-and-key', {
        status: 400,
        reason: 'INDEXING_MODEL_CHANGED',
        method: operation === 'save' ? 'PUT' : 'POST',
        url: '/private',
      });
    });
    const input = await screen.findByRole('textbox', { name: 'Terms' });
    if (operation === 'save') {
      await userEvent.clear(input);
      await userEvent.type(input, 'retained draft');
      await save();
    } else {
      await userEvent.click(
        await screen.findByRole('button', {
          name:
            operation === 'retry' ? 'Retry failed work' : 'Rebuild all spaces',
          exact: true,
        }),
      );
      const confirmation = await screen.findByRole('alertdialog');
      await userEvent.click(
        within(confirmation).getByRole('button', {
          name: 'Confirm',
          exact: true,
        }),
      );
    }
    expect(
      await screen.findByText(/old generation cannot be retried/),
    ).toBeTruthy();
    expect(screen.getByText(/Your draft was retained/)).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Terms' })).toHaveProperty(
      'value',
      operation === 'save' ? 'retained draft' : 'saved',
    );
    expect(
      f.request.mock.calls.filter(([request]) => request.method),
    ).toHaveLength(1);
    expect(document.body.textContent).not.toContain('private-endpoint-and-key');
  },
);
it.each([
  ['INDEXING_MODEL_AUTH_FAILED', /Embedding authentication failed/],
  ['INDEXING_STORAGE_AUTH_FAILED', /Index storage authentication failed/],
])(
  'uses safe guidance for a request rejected with %s',
  async (reason, message) => {
    const f = await fixture();
    f.setWrite(async () => {
      throw new ApiClientError('private-key', {
        status: 400,
        reason,
        method: 'PUT',
        url: '/private',
      });
    });
    const input = await screen.findByRole('textbox', { name: 'Terms' });
    await userEvent.clear(input);
    await userEvent.type(input, 'draft');
    await save();
    expect(await screen.findByText(message)).toBeTruthy();
    expect(document.body.textContent).not.toContain('private-key');
  },
);
it('uses only generic request feedback for unknown API reasons without exposing them', async () => {
  const f = await fixture();
  f.setWrite(async () => {
    throw new ApiClientError('private-key', {
      status: 400,
      reason: 'private-unrecognized-reason',
      method: 'PUT',
      url: '/private',
    });
  });
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.clear(input);
  await userEvent.type(input, 'draft');
  await save();
  expect(await screen.findByText(/Your draft was retained/)).toBeTruthy();
  expect(document.body.textContent).not.toContain(
    'private-unrecognized-reason',
  );
  expect(document.body.textContent).not.toContain('private-key');
});
it('explains dependency drift before retrying a failed first generation, without submitting work', async () => {
  const f = await fixture({
    status: {
      ...failedStatus('INDEXING_UNAVAILABLE'),
      reason: 'INDEXING_MODEL_CHANGED',
    },
  });
  expect(
    await screen.findByText(/old generation cannot be retried/),
  ).toBeTruthy();
  expect(
    f.request.mock.calls.filter(([request]) => request.method),
  ).toHaveLength(0);
});

it('keeps Save ready after reselecting the same instance and editing its settings', async () => {
  await fixture();
  await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.click(screen.getByRole('combobox'));
  await userEvent.click(
    await screen.findByRole('option', { name: 'First index', exact: true }),
  );
  const input = screen.getByRole('textbox', { name: 'Terms' });
  await userEvent.clear(input);
  await userEvent.type(input, 'same-instance draft');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save', exact: true }),
    ).toHaveProperty('disabled', false),
  );
});

it('preserves an unsaved draft when its current instance is selected again', async () => {
  const { request } = await fixture();
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.clear(input);
  await userEvent.type(input, 'keep this draft');
  await userEvent.click(screen.getByRole('combobox'));
  await userEvent.click(
    await screen.findByRole('option', { name: 'First index', exact: true }),
  );
  expect(input).toHaveProperty('value', 'keep this draft');
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toHaveProperty('disabled', false);
  expect(
    request.mock.calls.filter(
      ([input]) => input.method && input.method !== 'GET',
    ),
  ).toHaveLength(0);
});

it.each([false, true])(
  'shows zero deployment configuration without model fields or writes (page=%s)',
  async (page) => {
    const f = await fixture({ page, config: null, emptyInstances: true });
    await screen.findByText('Configure a vector database first');
    expect(
      screen.getByRole('heading', { name: 'SQLite vector database' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'PostgreSQL vector database' }),
    ).toBeTruthy();
    expect(screen.getByText('sqlite-vec')).toBeTruthy();
    expect(screen.getByText('pgvector')).toBeTruthy();
    const steps = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(steps).toHaveLength(3);
    expect(steps[0]).toContain('config.yaml');
    expect(steps[0]).toContain('knowledge.indexing');
    expect(steps[1]).toContain('restart the application');
    expect(steps[2]).toContain('enable indexing');
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Save', exact: true }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Rebuild all spaces' }),
    ).toBeNull();
    expect(
      screen.getByRole('textbox', {
        name: 'Configuration prompt for your development Agent',
      }),
    ).toHaveProperty('readOnly', true);
    expect(
      f.request.mock.calls.some(
        ([input]) => input.path === 'knowledge/embeddingModels' || input.method,
      ),
    ).toBe(false);
  },
);
it('does not present a failed instance directory as an empty deployment', async () => {
  await fixture({ config: null, directoryError: true });
  await screen.findByText(/Unable to load index settings/);
  expect(screen.queryByText('Configure a vector database first')).toBeNull();
});
it('keeps separate instance drafts and renders only the selected type form', async () => {
  await fixture({ withVector: true });
  const terms = await screen.findByRole('textbox', { name: 'Terms' });
  await userEvent.clear(terms);
  await userEvent.type(terms, 'retained per-instance');
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Indexing instance' }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: 'Vector index' }),
  );
  await screen.findByRole('combobox', { name: 'Embedding model' });
  expect(screen.queryByRole('textbox', { name: 'Terms' })).toBeNull();
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Indexing instance' }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: 'First index' }),
  );
  expect(await screen.findByRole('textbox', { name: 'Terms' })).toHaveProperty(
    'value',
    'retained per-instance',
  );
  expect(
    screen.queryByRole('combobox', { name: 'Embedding model' }),
  ).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toHaveProperty('disabled', false);
});
it('does not query models just because an unselected vector instance exists', async () => {
  const f = await fixture({ withVector: true });
  await screen.findByRole('textbox', { name: 'Terms' });
  expect(
    f.request.mock.calls.some(
      ([input]) => input.path === 'knowledge/embeddingModels',
    ),
  ).toBe(false);
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Indexing instance' }),
  );
  const group = await screen.findByRole('group', { name: 'fixture-text' });
  expect(within(group).getAllByRole('option')).toHaveLength(2);
});
it('uses the shared editor in standalone mode with unchanged save semantics', async () => {
  const f = await fixture({ page: true });
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  expect(screen.queryByRole('dialog')).toBeNull();
  await userEvent.clear(input);
  await userEvent.type(input, 'page draft');
  await save();
  await waitFor(() => expect(f.settings().revision).toBe('5'));
});
it('keeps the reusable dialog navigation-free and guards closing a dirty draft', async () => {
  await fixture();
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  expect(
    screen.queryByRole('button', { name: 'Open standalone settings' }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Back to knowledge' }),
  ).toBeNull();
  await userEvent.type(input, ' dirty');
  await userEvent.click(
    screen.getAllByRole('button', { name: 'Close', exact: true })[0]!,
  );
  const confirmation = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(confirmation).getByRole('button', { name: 'Cancel', exact: true }),
  );
  expect(input).toHaveProperty('value', 'saved dirty');
});
it('copies only deployment guidance without changing application settings', async () => {
  userEvent.setup();
  const copy = vi
    .spyOn(navigator.clipboard, 'writeText')
    .mockResolvedValue(undefined);
  const f = await fixture({ config: null, emptyInstances: true });
  await userEvent.click(
    await screen.findByRole('button', { name: 'Copy configuration prompt' }),
  );
  expect(copy).toHaveBeenCalledWith(
    expect.stringContaining('knowledge.indexing'),
  );
  expect(copy).toHaveBeenCalledWith(
    expect.stringContaining('Get my confirmation'),
  );
  expect(f.request.mock.calls.some(([input]) => input.method)).toBe(false);
});

it('lets an administrator disable indexing even when the instance directory fails', async () => {
  const f = await fixture({ directoryError: true });
  await userEvent.click(
    await screen.findByRole('switch', { name: 'Enable indexing' }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Confirm',
      exact: true,
    }),
  );
  await waitFor(() => expect(f.settings().config).toBeNull());
  expect(
    f.request.mock.calls.some(
      ([input]) => input.path === 'knowledge/embeddingModels',
    ),
  ).toBe(false);
});
it('guards route navigation and native unload while a standalone draft is dirty', async () => {
  await fixture({ page: true });
  const input = await screen.findByRole('textbox', { name: 'Terms' });
  const before = screen.getByRole('status', {
    name: 'Test location',
  }).textContent;
  await userEvent.type(input, ' dirty');
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Leave settings' }));
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Cancel',
      exact: true,
    }),
  );
  expect(
    screen.getByRole('status', { name: 'Test location' }).textContent,
  ).toBe(before);
  expect(input).toHaveProperty('value', 'saved dirty');
  await userEvent.click(screen.getByRole('button', { name: 'Leave settings' }));
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Discard changes',
      exact: true,
    }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('status', { name: 'Test location' }).textContent,
    ).toBe('/different-page'),
  );
});
it('copies inside the indexing dialog through the HTTP-compatible fallback', async () => {
  userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('Clipboard API unavailable'),
  );
  const previous = Object.getOwnPropertyDescriptor(document, 'execCommand');
  const command = vi.fn((name: string) => {
    expect(name).toBe('copy');
    expect(document.activeElement).toBeInstanceOf(HTMLTextAreaElement);
    expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull();
    expect((document.activeElement as HTMLTextAreaElement).value).toContain(
      'knowledge.indexing',
    );
    return true;
  });
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: command,
  });
  try {
    const f = await fixture({ config: null, emptyInstances: true });
    const button = await screen.findByRole('button', {
      name: 'Copy configuration prompt',
    });
    await userEvent.click(button);
    await waitFor(() => expect(command).toHaveBeenCalledTimes(1));
    expect(button).toHaveFocus();
    expect(f.request.mock.calls.some(([input]) => input.method)).toBe(false);
  } finally {
    if (previous) Object.defineProperty(document, 'execCommand', previous);
    else Reflect.deleteProperty(document, 'execCommand');
  }
});

it('selects the read-only deployment prompt if clipboard permission is refused', async () => {
  userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('permission denied'),
  );
  const f = await fixture({ config: null, emptyInstances: true });
  await userEvent.click(
    await screen.findByRole('button', { name: 'Copy configuration prompt' }),
  );
  const input = screen.getByRole('textbox', {
    name: 'Configuration prompt for your development Agent',
  }) as HTMLTextAreaElement;
  await waitFor(() => expect(document.activeElement).toBe(input));
  expect(input.selectionStart).toBe(0);
  expect(input.selectionEnd).toBe(input.value.length);
  expect(f.request.mock.calls.some(([request]) => request.method)).toBe(false);
});

it.each([false, true])(
  'has one title and no duplicate configuration header or footer close (page=%s)',
  async (page) => {
    await fixture({ page });
    await screen.findByRole('textbox', { name: 'Terms' });
    expect(
      screen.getAllByRole('heading', { name: 'Knowledge index settings' }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole('heading', { name: 'Index configuration' }),
    ).toBeNull();
    const footer = screen
      .getByRole('button', { name: 'Rebuild all spaces' })
      .closest('footer')!;
    expect(within(footer).queryByRole('button', { name: 'Close' })).toBeNull();
    expect(
      screen.queryAllByRole('button', { name: 'Close', exact: true }),
    ).toHaveLength(page ? 0 : 1);
  },
);
it('keeps a single close control in error dialogs', async () => {
  await fixture({ settingsError: true });
  await screen.findByRole('button', { name: 'Reload' });
  expect(
    screen.getAllByRole('button', { name: 'Close', exact: true }),
  ).toHaveLength(1);
});

it.each([false, true])(
  'saves a manually typed fixed model ID without selecting a model option (page=%s)',
  async (page) => {
    const f = await fixture({
      page,
      withVector: true,
      config: {
        version: 1,
        key: 'vector',
        options: {
          embedding: { modelService: 'fixed-service', model: 'saved-model' },
        },
      },
      modelCatalog: [
        {
          name: 'fixed-service',
          title: 'Fixed service',
          provider: 'openai-compatible',
          models: [],
        },
      ],
    });
    const input = await screen.findByRole('combobox', {
      name: 'Embedding model',
    });
    await waitFor(() => expect(input).not.toBeDisabled());
    await userEvent.clear(input);
    await userEvent.type(input, 'my-fixed-embedding-v2');
    await userEvent.tab();
    expect(input).toHaveValue('my-fixed-embedding-v2');
    expect(f.request.mock.calls.some(([r]) => r.method)).toBe(false);
    await save();
    await waitFor(() => expect(f.settings().revision).toBe('5'));
    expect(f.settings().config).toEqual({
      version: 1,
      key: 'vector',
      options: {
        embedding: {
          modelService: 'fixed-service',
          model: 'my-fixed-embedding-v2',
        },
      },
    });
  },
);

it.each([false, true])(
  'shows deployment guidance instead of stale saved controls when no instances are configured (page=%s)',
  async (page) => {
    const f = await fixture({ page, emptyInstances: true });
    await screen.findByText('Configure a vector database first');
    expect(screen.queryByText(/Previously saved index settings/)).toBeNull();
    expect(
      screen.getAllByRole('heading', {
        name: 'Configuration prompt',
        exact: true,
      }),
    ).toHaveLength(1);
    const copyButton = screen.getByRole('button', {
      name: 'Copy configuration prompt',
    });
    expect(copyButton.textContent).toBe('');
    expect(copyButton.title).toBe('Copy configuration prompt');
    expect(
      screen.queryByText('Configure an instance in the deployment first'),
    ).toBeNull();
    expect(
      screen.queryByText(/Copying does not execute configuration/),
    ).toBeNull();
    const promptLabel = screen.getByText(
      'Configuration prompt for your development Agent',
    );
    expect(promptLabel.className).toContain('sr-only');
    if (!page) {
      expect(screen.getByRole('dialog').querySelector('footer')).toBeNull();
    }
    expect(
      screen.getByRole('button', { name: 'Copy configuration prompt' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('switch', { name: 'Enable indexing' }),
    ).toBeNull();
    expect(
      screen.queryByRole('combobox', { name: 'Indexing instance' }),
    ).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Terms' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Index progress' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Save', exact: true }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Rebuild all spaces' }),
    ).toBeNull();
    expect(screen.queryByText(/configuration form is unavailable/)).toBeNull();
    expect(document.querySelector('pre')).toBeNull();
    expect(f.settings().config).toEqual({
      version: 1,
      key: 'first',
      options: { text: 'saved' },
    });
    expect(f.settings().revision).toBe('4');
    expect(
      f.request.mock.calls.some(
        ([r]) => r.method || r.path === 'knowledge/embeddingModels',
      ),
    ).toBe(false);
  },
);
it('keeps a failed deployment directory distinct from an empty deployment with saved settings', async () => {
  await fixture({ directoryError: true });
  await screen.findByText(/Unable to load index settings/);
  expect(screen.queryByText('Configure a vector database first')).toBeNull();
});
