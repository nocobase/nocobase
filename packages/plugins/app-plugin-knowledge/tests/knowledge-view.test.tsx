/** The knowledge view over a mocked API: the tree, an opened document, the space's home and the proposals waiting. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../client/locales/en-US.js';
import type {
  KnowledgeAccess,
  KnowledgeDoc,
  KnowledgeDocIndex,
  KnowledgeDocSummary,
  KnowledgeEffectiveAccess,
  KnowledgePermissions,
  KnowledgeProposal,
  KnowledgeTree,
} from '../shared/knowledge.js';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class ApiClientError extends Error {},
  realtimeClientToken: Symbol('realtime'),
  useApiClient: () => mocks,
  useService: () => ({ subscribe: () => () => {} }),
  useToaster: () => ({ show: vi.fn(), success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@nocobase/i18n/client', () => {
  const lookup = (key: string): unknown => {
    let found: unknown = enUS;
    for (const part of key.split('.'))
      found = (found as Record<string, unknown> | undefined)?.[part];
    return found;
  };
  const t = (key: string, values?: Record<string, unknown>) => {
    const text =
      lookup(key) ?? lookup(`${key}_${values?.count === 1 ? 'one' : 'other'}`);
    return typeof text === 'string'
      ? text.replace(/{{(\w+)}}/g, (_, name: string) =>
          String(values?.[name] ?? name),
        )
      : key;
  };
  return { useTranslation: () => ({ t, i18n: { language: 'en-US' } }) };
});

const { KnowledgeView } =
  await import('../client/components/knowledge-view.js');

const author = { kind: 'user', id: 'u1', name: 'Ada' };
const space = { scope: 'project', scopeId: 'p1' };
const MANAGE: KnowledgeAccess = {
  read: true,
  propose: true,
  edit: true,
  manage: true,
};

function summary(
  id: string,
  title: string,
  extra: Partial<KnowledgeDocSummary> = {},
): KnowledgeDocSummary {
  return {
    id,
    kind: 'article',
    spaceId: 's1',
    ...space,
    parentId: null,
    sortOrder: 0,
    slug: id,
    title,
    summary: '',
    version: 2,
    file: null,
    verifiedAt: null,
    archivedAt: null,
    updatedAt: '2026-10-01T00:00:00Z',
    updatedBy: author,
    childCount: 0,
    pendingProposals: 0,
    access: MANAGE,
    accessMode: 'inherit',
    accessEntries: 0,
    ...extra,
  };
}

function treeOf(docs: readonly KnowledgeDocSummary[]): KnowledgeTree {
  return {
    spaces: [
      {
        space: {
          ...space,
          id: 's1',
          title: 'Acme',
          inherited: false,
          access: MANAGE,
        },
        docs,
      },
    ],
  };
}

const permissionsOf = (docId: string): KnowledgePermissions => ({
  docId,
  mode: 'custom',
  entries: [
    {
      subject: { type: 'role', id: 'ops', label: 'Operations' },
      level: 'edit',
    },
  ],
  inherited: [],
  types: [
    { type: 'user', title: 'People', icon: 'user' },
    { type: 'role', title: 'Roles', icon: 'role' },
  ],
});

/** Answers a test adds for paths of its own; undefined passes the request on. */
let extra: (request: {
  path: string;
  method?: string;
  json?: unknown;
  query?: Record<string, string>;
}) => unknown = () => undefined;

function serve(
  docs: readonly KnowledgeDocSummary[],
  proposals: readonly Partial<KnowledgeProposal>[] = [],
): void {
  mocks.request.mockImplementation(async (request: { path: string }) => {
    const { path } = request;
    const answered = extra(request);
    if (answered !== undefined) return answered;
    if (path === 'knowledge/spaces') return { data: treeOf(docs).spaces };
    if (path === 'knowledge/proposals') return { data: proposals };
    if (path === 'knowledge/subjects')
      return {
        data: [{ type: 'user', id: 'alice', label: 'Alice', hint: 'a@x' }],
        meta: { types: permissionsOf('').types },
      };
    const permissions = /^knowledge\/docs\/(\w+)\/permissions$/u.exec(path);
    if (permissions) return { data: permissionsOf(permissions[1]!) };
    const access = /^knowledge\/docs\/(\w+)\/access$/u.exec(path);
    if (access)
      return {
        data: {
          docId: access[1]!,
          level: 'manage',
          access: MANAGE,
          source: { kind: 'manager' },
          mode: 'custom',
          entryCount: 1,
          restrictedBy: { id: access[1]!, title: 'Release flow' },
        } satisfies KnowledgeEffectiveAccess,
      };
    const doc = docs.find((item) => path === `knowledge/docs/${item.id}`);
    if (doc)
      return {
        data: {
          ...doc,
          content: `# ${doc.title}\n\nTag it, then deploy.`,
          contentHash: 'h',
          verifiedBy: null,
          breadcrumbs: [],
        } satisfies KnowledgeDoc,
      };
    throw new Error(`unexpected ${path}`);
  });
}

const url = { search: '' };

// A user's press lets React finish wiring a trigger that has just appeared. It lands off (0, 0),
// where jsdom's zero-sized layout puts the panes' resize handle, which would take the press.
async function press(target: Element): Promise<void> {
  await userEvent.pointer({
    keys: '[MouseLeft]',
    target,
    coords: { clientX: 100, clientY: 100 },
  });
}

function Where(): null {
  const { search } = useLocation();
  useEffect(() => {
    url.search = search;
  }, [search]);
  return null;
}

function show(entry = '/', embedded = true): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree: ReactElement = (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <KnowledgeView space={space} title={embedded ? false : undefined} />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>
  );
  render(tree);
}

beforeEach(() => {
  mocks.request.mockReset();
  extra = () => undefined;
  // jsdom scrolls nothing.
  Element.prototype.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};
  // A wide screen: both panes side by side.
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
});

describe('the knowledge view', () => {
  it('opens a document from the tree, its title shown once', async () => {
    serve([summary('d1', 'Release flow')]);
    show();
    const tree = await screen.findByRole('tree', { name: 'Acme' });
    fireEvent.click(within(tree).getByRole('button', { name: 'Release flow' }));
    expect(url.search).toBe('?doc=d1');
    expect(
      await screen.findByRole('heading', { name: 'Release flow', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Tag it, then deploy.')).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { name: 'Release flow' }),
    ).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('says an empty space is empty and offers to write the first article', async () => {
    serve([]);
    show();
    expect(
      await screen.findByText('No documents in Acme yet'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('knowledge-home')).getByRole('button', {
        name: 'New article',
      }),
    ).toBeInTheDocument();
  });

  const searchRow = () =>
    screen.getByRole('button', { name: /Search knowledge/ }).parentElement!;

  it('puts New beside the search with no header when embedded', async () => {
    serve([summary('d1', 'Release flow')]);
    show();
    await screen.findByRole('tree', { name: 'Acme' });
    expect(
      within(searchRow()).getByRole('button', { name: 'New' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(
      screen.getByTestId('knowledge-view').querySelector(':scope > header'),
    ).toBeNull();
    // The New beside the search is the only one: the space's heading has none.
    expect(
      within(screen.getByTestId('knowledge-space-project')).queryByRole(
        'button',
        { name: 'New' },
      ),
    ).toBeNull();
    expect(
      within(screen.getByTestId('knowledge-home')).queryByRole('button', {
        name: 'New article',
      }),
    ).toBeNull();
  });

  it('lays out the same standalone, its title at the top of the left pane', async () => {
    serve([summary('d1', 'Release flow')]);
    show('/', false);
    const heading = await screen.findByRole('heading', {
      name: 'Acme',
      level: 1,
    });
    const pane = screen.getByRole('navigation', { name: 'Documents' });
    expect(pane).toContainElement(heading);
    expect(
      within(searchRow()).getByRole('button', { name: 'New' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'New' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Access/ })).toBeNull();
  });

  it('opens the space’s access from its “…” menu', async () => {
    serve([summary('d1', 'Release flow')]);
    show();
    const group = await screen.findByTestId('knowledge-space-project');
    await press(within(group).getByRole('button', { name: 'Space actions' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Space access' }),
    );
    const sheet = await screen.findByTestId('knowledge-space-access');
    expect(within(sheet).getByText('Your access')).toBeInTheDocument();
    expect(within(sheet).getByText('You can manage')).toBeInTheDocument();
  });

  it('lists the proposals waiting in its spaces from the pending entry', async () => {
    serve(
      [summary('d1', 'Release flow')],
      [
        {
          id: 'p1',
          kind: 'update',
          status: 'pending',
          ...space,
          docId: 'd1',
          docTitle: 'Release flow',
          title: null,
          stale: false,
          proposer: { kind: 'agent', id: 'a1', name: 'Scout' },
          authorizedBy: author,
          createdAt: '2026-10-02T00:00:00Z',
          canDecide: true,
        },
      ],
    );
    show();
    fireEvent.click(await screen.findByText('Pending review · 1'));
    expect(url.search).toBe('?proposals=pending');
    const list = await screen.findByTestId('knowledge-proposals');
    expect(
      within(list).getByText('Scout on behalf of Ada', { exact: false }),
    ).toBeInTheDocument();
  });

  it('locks a restricted entry in the tree and says how many are listed on it', async () => {
    serve([
      summary('d1', 'Release flow', { accessMode: 'custom', accessEntries: 2 }),
    ]);
    show('/?doc=d1');
    const tree = await screen.findByRole('tree', { name: 'Acme' });
    expect(
      within(tree).getByRole('img', {
        name: 'Restricted: only the people listed may access it',
      }),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('knowledge-restricted')).toHaveTextContent(
      'Restricted · 2',
    );
  });

  it('edits an entry’s permissions: its entries, adding someone, and saving them whole', async () => {
    serve([
      summary('d1', 'Release flow', { accessMode: 'custom', accessEntries: 1 }),
    ]);
    show('/?doc=d1');
    // The badge opens them once the view knows the viewer manages the entry.
    await screen.findByRole('tree', { name: 'Acme' });
    const badge = await vi.waitFor(() => {
      const found = screen.getByTestId('knowledge-restricted');
      expect(found.tagName).toBe('BUTTON');
      return found;
    });
    fireEvent.click(badge);
    const dialog = await screen.findByTestId('knowledge-permissions');
    expect(await within(dialog).findByText('Operations')).toBeInTheDocument();
    // The candidates open only once the input has focus.
    expect(screen.queryByText('Alice')).toBeNull();
    const add = within(dialog).getByRole('combobox', { name: 'Add people' });
    fireEvent.focus(add);
    fireEvent.click(await screen.findByText('Alice'));
    const listed = within(dialog).getByTestId('knowledge-entries');
    expect(within(listed).getByText('Alice')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          path: 'knowledge/docs/d1/permissions',
          json: {
            mode: 'custom',
            entries: [
              { subject: { type: 'role', id: 'ops' }, level: 'edit' },
              { subject: { type: 'user', id: 'alice' }, level: 'read' },
            ],
          },
        }),
      ),
    );
  });

  it('opens the open entry’s permissions from its header menu, with the viewer’s access first', async () => {
    serve([summary('d1', 'Release flow', { accessMode: 'custom' })]);
    show('/?doc=d1');
    const article = await screen.findByTestId('knowledge-doc');
    await press(within(article).getByRole('button', { name: 'More actions' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Permissions' }),
    );
    const dialog = await screen.findByTestId('knowledge-permissions');
    // The level and where it comes from, on one line.
    await vi.waitFor(() =>
      expect(
        within(dialog).getByTestId('knowledge-node-access'),
      ).toHaveTextContent('You can manage · Source: you manage Acme'),
    );
    expect(await within(dialog).findByText('Operations')).toBeInTheDocument();
  });

  it('offers no permissions to someone who may only read an entry', async () => {
    serve([
      summary('d1', 'Release flow', {
        accessMode: 'custom',
        access: { read: true, propose: false, edit: false, manage: false },
      }),
    ]);
    show('/?doc=d1');
    await screen.findByRole('tree', { name: 'Acme' });
    const badge = await screen.findByTestId('knowledge-restricted');
    expect(badge.tagName).toBe('SPAN');
    expect(
      within(await screen.findByRole('tree', { name: 'Acme' })).queryByRole(
        'button',
        { name: 'Actions' },
      ),
    ).toBeNull();
    // The header's menu still shows them their own access, with nothing to change.
    const article = await screen.findByTestId('knowledge-doc');
    await press(within(article).getByRole('button', { name: 'More actions' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Permissions' }),
    );
    const dialog = await screen.findByTestId('knowledge-permissions');
    expect(
      await within(dialog).findByTestId('knowledge-node-access'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Save' })).toBeNull();
    expect(mocks.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: 'knowledge/docs/d1/permissions' }),
    );
  });

  const indexOf = (
    state: 'pending' | 'done' | 'failed',
  ): KnowledgeDocIndex => ({
    docId: 'd1',
    version: 2,
    enabled: true,
    total: 2,
    indexed: state === 'done' ? 2 : 1,
    pending: state === 'pending' ? 1 : 0,
    failed: state === 'failed' ? 1 : 0,
    state,
    chunks: [
      {
        ordinal: 0,
        headingPath: ['Release flow'],
        anchor: 'release-flow',
        lines: [1, 3],
        chars: 40,
        state: 'done',
        error: null,
      },
      {
        ordinal: 1,
        headingPath: ['Release flow', 'Deploy'],
        anchor: 'deploy',
        lines: [3, 3],
        chars: 20,
        state: state === 'done' ? 'done' : state,
        error: state === 'failed' ? 'Input too long.' : null,
      },
    ],
  });

  it('shows where a document stands in the index, and indexes a failed one again', async () => {
    serve([summary('d1', 'Release flow')]);
    let current = indexOf('failed');
    extra = ({ path, method }) => {
      if (path === 'knowledge/docs/d1/index') return { data: current };
      if (path === 'knowledge/docs/d1/reindex' && method === 'POST') {
        current = indexOf('pending');
        return { data: current };
      }
      return undefined;
    };
    show('/?doc=d1');
    const badge = await screen.findByTestId('knowledge-index-badge');
    expect(badge).toHaveTextContent('Indexing failed');
    fireEvent.click(screen.getByRole('button', { name: 'Index again' }));
    expect(
      await screen.findByText('Indexing 1/2', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'knowledge/docs/d1/reindex',
      }),
    );
  });

  it('shows no index badge while semantic search is off', async () => {
    serve([summary('d1', 'Release flow')]);
    extra = ({ path }) =>
      path === 'knowledge/docs/d1/index'
        ? { data: { ...indexOf('done'), enabled: false, state: null } }
        : undefined;
    show('/?doc=d1');
    await screen.findByText('Tag it, then deploy.');
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'knowledge/docs/d1/index' }),
      ),
    );
    expect(screen.queryByTestId('knowledge-index-badge')).toBeNull();
  });

  it('lists a document’s sections and highlights the lines of the one chosen', async () => {
    serve([summary('d1', 'Release flow')]);
    extra = ({ path }) =>
      path === 'knowledge/docs/d1/index'
        ? { data: indexOf('done') }
        : undefined;
    show('/?doc=d1');
    const article = await screen.findByTestId('knowledge-doc');
    await press(within(article).getByRole('button', { name: 'More actions' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'View sections' }),
    );
    const sheet = await screen.findByTestId('knowledge-chunks');
    expect(
      within(sheet).getByText('Release flow › Deploy'),
    ).toBeInTheDocument();
    expect(within(sheet).getByText(/Lines 3–3/)).toBeInTheDocument();
    fireEvent.click(within(sheet).getByText('Release flow › Deploy'));
    await waitFor(() => expect(url.search).toBe('?doc=d1&lines=3-3'));
    expect(await screen.findByTestId('knowledge-lines')).toHaveTextContent(
      'Highlighting lines 3–3.',
    );
    expect(
      screen.getByText('Tag it, then deploy.').closest('[data-highlighted]'),
    ).not.toBeNull();
  });

  it('lists on the space’s home the documents not fully indexed', async () => {
    serve([summary('d1', 'Release flow')]);
    extra = ({ path }) =>
      path === 'knowledge/indexing'
        ? {
            data: [
              {
                docId: 'd1',
                title: 'Release flow',
                kind: 'article',
                pending: 1,
                failed: 2,
                error: 'Too long.',
              },
            ],
            meta: { enabled: true },
          }
        : undefined;
    show();
    const home = await screen.findByTestId('knowledge-home');
    expect(
      await within(home).findByText('Not fully indexed'),
    ).toBeInTheDocument();
    expect(within(home).getByText('2 failed · 1 waiting')).toBeInTheDocument();
  });

  it('sets a space’s own chunking from its “…” menu', async () => {
    serve([summary('d1', 'Release flow')]);
    const defaults = { headingDepth: 3, target: 1200, max: 2000 };
    extra = ({ path, method, json }) => {
      if (path !== 'knowledge/chunking') return undefined;
      const override =
        method === 'PUT'
          ? (json as { override: typeof defaults | null }).override
          : null;
      return {
        data: {
          defaults,
          override,
          effective: override ?? defaults,
          rechunking: method === 'PUT',
          canManage: true,
        },
      };
    };
    show();
    const group = await screen.findByTestId('knowledge-space-project');
    await press(within(group).getByRole('button', { name: 'Space actions' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Section settings' }),
    );
    const dialog = await screen.findByTestId('knowledge-chunking');
    fireEvent.click(
      await within(dialog).findByRole('switch', { name: 'Set for this space' }),
    );
    const max = within(dialog).getByLabelText('Limit (characters)');
    fireEvent.change(max, { target: { value: '1000' } });
    expect(
      within(dialog).getByText(/the target is at most the limit/),
    ).toBeInTheDocument();
    fireEvent.change(max, { target: { value: '1600' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          path: 'knowledge/chunking',
          json: {
            scope: 'project',
            scopeId: 'p1',
            override: { headingDepth: 3, target: 1200, max: 1600 },
          },
        }),
      ),
    );
  });

  it('explains each hit in the search test and opens it at its lines', async () => {
    serve([summary('d1', 'Release flow')]);
    extra = ({ path, query }) =>
      path === 'knowledge/search'
        ? {
            data: [
              {
                docId: 'd1',
                kind: 'article',
                slug: 'd1',
                title: 'Release flow',
                version: 2,
                ...space,
                inherited: false,
                headingPath: ['Release flow', 'Deploy'],
                anchor: 'deploy',
                lines: [3, 5],
                excerpt: 'Tag it, then deploy.',
                titleMatch: false,
                updatedAt: '2026-10-01T00:00:00Z',
                score: 0.03,
                providers: [{ name: 'vector', rank: 1, score: 0.82 }],
                reranked: 0.91,
                ...(query?.explain === 'true'
                  ? {
                      explain: {
                        normalized: 0.5,
                        providers: [
                          { name: 'vector', rank: 1, score: 0.82, weight: 1 },
                        ],
                        reranked: 0.91,
                      },
                    }
                  : {}),
              },
            ],
            meta: {},
          }
        : undefined;
    show();
    const group = await screen.findByTestId('knowledge-space-project');
    await press(within(group).getByRole('button', { name: 'Space actions' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Search test' }),
    );
    fireEvent.change(await screen.findByLabelText('Words to search for'), {
      target: { value: 'deploy' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    const results = await screen.findByTestId('knowledge-search-test-results');
    expect(within(results).getByText('Relevance 0.50')).toBeInTheDocument();
    expect(within(results).getByText('Meaning #1 · 0.820')).toBeInTheDocument();
    expect(within(results).getByText('Reranked 0.910')).toBeInTheDocument();
    fireEvent.click(within(results).getByRole('button', { name: 'Lines 3–5' }));
    await waitFor(() => expect(url.search).toBe('?doc=d1&lines=3-5'));
  });
});
