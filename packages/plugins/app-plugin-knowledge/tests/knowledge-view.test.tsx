import { apiClientToken } from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
/** The knowledge view over a mocked API: the tree, an opened document, the space's home and the proposals waiting. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../client/locales/en-US.js';
import type { KnowledgeDirectorySource } from '../client/hooks/use-directory.js';
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

function treeOf(
  docs: readonly KnowledgeDocSummary[],
  viewSpace = space,
): KnowledgeTree {
  return {
    spaces: [
      {
        space: {
          ...viewSpace,
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
  body?: FormData;
}) => unknown = () => undefined;

function serve(
  docs: readonly KnowledgeDocSummary[],
  proposals: readonly Partial<KnowledgeProposal>[] = [],
  viewSpace = space,
): void {
  mocks.request.mockImplementation(async (request: { path: string }) => {
    const { path } = request;
    const answered = extra(request);
    if (answered !== undefined) return answered;
    if (path === 'knowledge/capabilities')
      return { data: { semanticSearch: true } };
    if (path === 'knowledge/spaces')
      return { data: treeOf(docs, viewSpace).spaces };
    if (path === 'knowledge/proposals')
      return { data: proposals, meta: { total: proposals.length } };
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

const url = { search: '', navigate: (_delta: number): void => {} };

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
  const navigate = useNavigate();
  useEffect(() => {
    url.search = search;
    url.navigate = navigate;
  }, [search, navigate]);
  return null;
}

async function show(
  entry = '/',
  embedded = true,
  directory?: KnowledgeDirectorySource,
  viewSpace = space,
): ReturnType<typeof renderWithApp> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree: ReactElement = (
    <QueryClientProvider client={client}>
      <KnowledgeView
        space={viewSpace}
        title={embedded ? false : undefined}
        directory={directory}
      />
      <Where />
    </QueryClientProvider>
  );
  return renderWithApp(tree, {
    route: entry,
    namespace: '@nocobase/app-plugin-knowledge',
    namespaces: {
      '@nocobase/app-plugin-knowledge': enUS,
      '@nocobase/app-plugin-file': {
        files: { loadingPreview: 'Loading preview...' },
      },
      '@nocobase/i18n': {
        actions: { close: 'Close' },
        status: { loading: 'Loading' },
      },
    },
    services: (app) => {
      vi.spyOn(
        app.container.resolve(apiClientToken),
        'request',
      ).mockImplementation(mocks.request);
    },
  });
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
  async function inheritedFolder(access = MANAGE): Promise<void> {
    const folder = summary('systemfolder', 'Shared folder', {
      scope: 'system',
      scopeId: '',
      kind: 'folder',
      access: MANAGE,
    });
    serve([folder]);
    extra = ({ path, method }) => {
      if (path === 'knowledge/spaces')
        return {
          data: [
            {
              ...treeOf([]).spaces[0],
              space: { ...treeOf([]).spaces[0]!.space, access },
            },
            {
              space: {
                scope: 'system',
                scopeId: '',
                id: 'sys',
                title: 'System knowledge',
                inherited: true,
                access: MANAGE,
              },
              docs: [folder],
            },
          ],
        };
      if (method === 'POST') return { data: { id: 'created' } };
      return undefined;
    };
    await show('/?doc=systemfolder');
  }

  it.each(['article', 'folder'] as const)(
    'keeps toolbar %s creation in the project when a system folder is selected',
    async (kind) => {
      await inheritedFolder();
      await press(
        await screen.findByRole('button', { name: 'New', exact: true }),
      );
      fireEvent.click(
        await screen.findByRole('menuitem', {
          name: kind === 'article' ? 'New article' : 'New folder',
          exact: true,
        }),
      );
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Create in Acme')).toBeInTheDocument();
      fireEvent.change(within(dialog).getByLabelText(/Title/), {
        target: { value: 'New reference' },
      });
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Create', exact: true }),
      );
      await waitFor(() =>
        expect(mocks.request).toHaveBeenCalledWith(
          expect.objectContaining({
            path: 'knowledge/docs',
            method: 'POST',
            json: expect.objectContaining({ ...space, kind }),
          }),
        ),
      );
      const request = mocks.request.mock.calls.find(
        ([r]) => r.path === 'knowledge/docs' && r.method === 'POST',
      )![0];
      expect(request.json.parentId).toBeUndefined();
    },
  );

  it('uploads to the project root when an inherited folder is selected', async () => {
    await inheritedFolder();
    await press(
      await screen.findByRole('button', { name: 'New', exact: true }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: 'Upload files',
        exact: true,
      }),
    );
    fireEvent.change(
      screen.getByLabelText('Upload files', { selector: 'input' }),
      { target: { files: [new File(['text'], 'reference.txt')] } },
    );
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.some(
          ([r]) => r.path === 'knowledge/docs/upload',
        ),
      ).toBe(true),
    );
    const form = mocks.request.mock.calls.find(
      ([r]) => r.path === 'knowledge/docs/upload',
    )![0].body as FormData;
    expect([
      form.get('scope'),
      form.get('scopeId'),
      form.get('parentId'),
    ]).toEqual(['project', 'p1', null]);
  });

  it.each(['article', 'file'] as const)(
    'uses project permissions for propose-only %s creation beside inherited system folders',
    async (kind) => {
      await inheritedFolder({
        read: true,
        propose: true,
        edit: false,
        manage: false,
      });
      await press(
        await screen.findByRole('button', { name: 'New', exact: true }),
      );
      expect(
        screen.queryByRole('menuitem', { name: 'New folder' }),
      ).not.toBeInTheDocument();
      fireEvent.click(
        await screen.findByRole('menuitem', {
          name: kind === 'article' ? 'New article' : 'Propose a file',
          exact: true,
        }),
      );
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Create in Acme')).toBeInTheDocument();
      if (kind === 'article')
        fireEvent.change(within(dialog).getByLabelText(/Title/), {
          target: { value: 'Proposed reference' },
        });
      else
        fireEvent.change(within(dialog).getByLabelText('File'), {
          target: { files: [new File(['text'], 'reference.txt')] },
        });
      fireEvent.change(within(dialog).getByLabelText(/Reason/), {
        target: { value: 'Add reference' },
      });
      fireEvent.submit(dialog.querySelector('form')!);
      const path =
        kind === 'article'
          ? 'knowledge/proposals'
          : 'knowledge/proposals/upload';
      await waitFor(() =>
        expect(
          mocks.request.mock.calls.some(
            ([r]) => r.path === path && r.method === 'POST',
          ),
        ).toBe(true),
      );
      const request = mocks.request.mock.calls.find(
        ([r]) => r.path === path && r.method === 'POST',
      )![0];
      if (kind === 'article') {
        expect(request.json).toMatchObject(space);
        expect(request.json.parentId).toBeUndefined();
      } else
        expect([
          request.body.get('scope'),
          request.body.get('scopeId'),
          request.body.get('parentId'),
        ]).toEqual(['project', 'p1', null]);
    },
  );

  it('searches the project captured by its directory diagnostic action', async () => {
    serve([]);
    const directory: KnowledgeDirectorySource = {
      summaries: async () => [
        {
          space: treeOf([]).spaces[0]!.space,
          documents: 0,
          archivedDocuments: 0,
        },
      ],
      search: async () => [],
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    extra = ({ path }) =>
      path === 'knowledge/search' ? { data: [], meta: {} } : undefined;
    await show('/', true, directory, { scope: 'system', scopeId: '' });
    const group = await screen.findByTestId('knowledge-space-project');
    await press(within(group).getByRole('button', { name: 'Space actions' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Search test' }),
    );
    fireEvent.change(await screen.findByLabelText('Words to search for'), {
      target: { value: 'projectneedle' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Search', exact: true }),
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'knowledge/search',
          query: { ...space, q: 'projectneedle', explain: 'true' },
        }),
      ),
    );
  });

  it('shows the permission-filtered review total without loading later review pages', async () => {
    serve([]);
    const directory: KnowledgeDirectorySource = {
      summaries: async () => [
        {
          space: {
            ...space,
            id: null,
            title: 'Acme',
            inherited: false,
            access: MANAGE,
          },
          documents: 0,
          archivedDocuments: 0,
        },
      ],
      search: async () => [],
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    extra = (request) => {
      if (request.path !== 'knowledge/proposals') return undefined;
      if (Number(request.query?.page ?? 1) > 1) return new Promise(() => {});
      const size = Number(request.query?.pageSize ?? 100);
      return {
        data: Array.from({ length: size }, (_, index) => ({
          id: `review-${index}`,
          scope: 'project',
          scopeId: 'p1',
          status: 'pending',
          canDecide: true,
        })),
        meta: { total: 238 },
      };
    };
    await show('/', true, directory);
    await screen.findByText('Pending review · 238');
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'knowledge/proposals',
        query: expect.objectContaining({ decidable: 'true', pageSize: 1 }),
      }),
    );
  });
  it('pages the global review queue after permission filtering', async () => {
    serve([]);
    const directory: KnowledgeDirectorySource = {
      summaries: async () => [],
      search: async () => [],
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    extra = ({ path, query }) => {
      if (path !== 'knowledge/proposals') return undefined;
      const page = Number(query?.page ?? 1);
      const pageSize = Number(query?.pageSize ?? 20);
      return {
        data: [
          {
            id: `p${page}`,
            kind: 'update',
            status: 'pending',
            ...space,
            docId: `d${page}`,
            docTitle: `Review page ${page}`,
            title: null,
            stale: false,
            proposer: author,
            authorizedBy: author,
            createdAt: '2026-10-02T00:00:00Z',
            canDecide: true,
          },
        ],
        meta: { page, pageSize, total: 21 },
      };
    };
    await show('/?proposals=pending&review=true', true, directory);
    await screen.findByText('Review page 1');
    fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true }));
    await screen.findByText('Review page 2');
    expect(url.search).toContain('proposalPage=2');
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'knowledge/proposals',
        query: expect.objectContaining({
          page: 2,
          pageSize: 20,
          decidable: 'true',
        }),
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Next', exact: true }),
    ).toBeDisabled();
  });
  it('keeps many project sections collapsed and fetches only an expanded tree', async () => {
    serve([]);
    const directory: KnowledgeDirectorySource = {
      summaries: async () =>
        Array.from({ length: 120 }, (_, index) => ({
          space: {
            scope: 'project',
            scopeId: `p${index}`,
            id: null,
            title: `Project ${index}`,
            inherited: false,
            access: MANAGE,
          },
          documents: 0,
          archivedDocuments: 0,
        })),
      search: async () => [],
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    await show('/', true, directory);
    const trigger = await screen.findByRole('button', { name: /^Project 34,/ });
    expect(
      mocks.request.mock.calls.some(
        ([request]) => request.path === 'knowledge/spaces',
      ),
    ).toBe(false);
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.filter(
          ([request]) => request.path === 'knowledge/spaces',
        ),
      ).toHaveLength(1),
    );
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'knowledge/spaces',
        query: { scope: 'project', scopeId: 'p34' },
      }),
    );
  });
  it('proposes an article in the explicitly chosen space without granting folder creation', async () => {
    serve([]);
    const rights = { read: true, propose: true, edit: false, manage: false };
    const directory: KnowledgeDirectorySource = {
      summaries: async () => [
        {
          space: {
            ...space,
            id: null,
            title: 'Acme',
            inherited: false,
            access: rights,
          },
          documents: 0,
          archivedDocuments: 0,
        },
      ],
      search: async () => [],
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    extra = (request) =>
      request.path === 'knowledge/proposals' && request.method === 'POST'
        ? { data: { id: 'proposed' } }
        : undefined;
    await show('/', true, directory);
    await press(
      await screen.findByRole('button', {
        name: 'Choose a project or system knowledge to create in',
      }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Acme', exact: true }),
    );
    await press(
      await screen.findByRole('button', { name: 'New', exact: true }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'New article' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).queryByRole('tab', { name: 'Folder' }),
    ).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Title'), {
      target: { value: 'Proposed article' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Reason/), {
      target: { value: 'A useful reference' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Submit proposal' }),
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: 'knowledge/proposals',
          json: expect.objectContaining({
            kind: 'create',
            scope: 'project',
            scopeId: 'p1',
            title: 'Proposed article',
            reason: 'A useful reference',
          }),
        }),
      ),
    );
    expect(
      mocks.request.mock.calls.some(
        ([request]) =>
          request.method === 'POST' && request.path === 'knowledge/docs',
      ),
    ).toBe(false);
  });
  it('keeps directory trees lazy and searches unopened spaces independently', async () => {
    const doc = summary('d1', 'Release flow');
    serve([doc]);
    const search = vi.fn().mockResolvedValue([]);
    const directory: KnowledgeDirectorySource = {
      summaries: async () =>
        treeOf([doc]).spaces.map((entry) => ({
          space: { ...entry.space, inherited: false },
          documents: entry.docs.length,
          archivedDocuments: 0,
        })),
      search,
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    await show('/', true, directory);
    await screen.findByText('1 document');
    expect(
      mocks.request.mock.calls.some(
        ([request]) => request.path === 'knowledge/spaces',
      ),
    ).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Search knowledge/ }));
    fireEvent.change(await screen.findByRole('combobox'), {
      target: { value: 'unopened' },
    });
    await waitFor(() =>
      expect(search).toHaveBeenCalledWith('unopened', expect.any(AbortSignal)),
    );
    expect(
      mocks.request.mock.calls.some(
        ([request]) => request.path === 'knowledge/spaces',
      ),
    ).toBe(false);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
  });

  it('expands one project by keyboard and gives creation an explicit target', async () => {
    const doc = summary('d1', 'Release flow');
    serve([doc]);
    const directory: KnowledgeDirectorySource = {
      summaries: async () =>
        treeOf([doc]).spaces.map((entry) => ({
          space: { ...entry.space, inherited: false },
          documents: entry.docs.length,
          archivedDocuments: 0,
        })),
      search: async () => [],
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    await show('/', true, directory);
    const group = await screen.findByTestId('knowledge-space-project');
    const trigger = within(group).getByRole('button', { name: /Acme/ });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    // Selecting the space by its name also opens it; no separate "Open" row.
    await within(group).findByText('Release flow');
    expect(
      within(group).queryByRole('button', { name: /^Open / }),
    ).not.toBeInTheDocument();
    await press(
      await screen.findByRole('button', { name: 'New', exact: true }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'New article' }),
    );
    expect(
      within(await screen.findByRole('dialog')).getByText('Create in Acme'),
    ).toBeInTheDocument();
  });
  it('folds a space only by its arrow, and selects it by its name without folding it', async () => {
    const doc = summary('d1', 'Release flow');
    serve([doc]);
    const directory: KnowledgeDirectorySource = {
      summaries: async () =>
        treeOf([doc]).spaces.map((entry) => ({
          space: { ...entry.space, inherited: false },
          documents: entry.docs.length,
          archivedDocuments: 0,
        })),
      search: async () => [],
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    await show('/?doc=d1', true, directory);
    const group = await screen.findByTestId('knowledge-space-project');
    await within(group).findByText('Release flow');
    await screen.findByRole('heading', { name: 'Release flow', level: 1 });
    // The arrow folds and unfolds without leaving the open document.
    fireEvent.click(within(group).getByRole('button', { name: 'Collapse' }));
    await waitFor(() =>
      expect(within(group).queryByText('Release flow')).not.toBeInTheDocument(),
    );
    expect(url.search).toBe('?doc=d1');
    fireEvent.click(within(group).getByRole('button', { name: 'Expand' }));
    await within(group).findByText('Release flow');
    expect(url.search).toBe('?doc=d1');
    // The name selects the space and keeps it open, however often it is pressed.
    const name = within(group).getByRole('button', { name: /^Acme/ });
    fireEvent.click(name);
    await waitFor(() => expect(url.search).toBe(''));
    fireEvent.click(name);
    expect(within(group).getByText('Release flow')).toBeInTheDocument();
    expect(
      within(group).getByRole('button', { name: 'Collapse' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens a document from the tree, its title shown once', async () => {
    serve([summary('d1', 'Release flow')]);
    await show();
    const tree = await screen.findByRole('tree', { name: 'Acme' });
    fireEvent.click(within(tree).getByRole('button', { name: 'Release flow' }));
    await waitFor(() => expect(url.search).toBe('?doc=d1'));
    expect(
      await screen.findByRole('heading', { name: 'Release flow', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Tag it, then deploy.')).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { name: 'Release flow' }),
    ).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it.each(['system', 'project'])(
    'opens an old version from %s history and returns to current',
    async (scope) => {
      const viewSpace = {
        scope,
        scopeId: scope === 'system' ? 'system' : 'p1',
      };
      serve([summary('d1', 'Release flow', viewSpace)], [], viewSpace);
      const versions = [2, 1].map((version) => ({
        docId: 'd1',
        version,
        title: 'Release flow',
        summary: '',
        content:
          version === 1
            ? 'Original release instructions.'
            : 'Tag it, then deploy.',
        contentHash: `h${version}`,
        file: null,
        author,
        source: null,
        runId: null,
        proposalId: null,
        approvedBy: null,
        note: null,
        createdAt: '2026-10-01T00:00:00Z',
      }));
      extra = ({ path }) => {
        if (path === 'knowledge/docs/d1/versions') return { data: versions };
        const match = /^knowledge\/docs\/d1\/versions\/(\d+)$/u.exec(path);
        return match
          ? { data: versions.find((item) => item.version === Number(match[1])) }
          : undefined;
      };
      const shown = await show(
        '/?tab=knowledge&doc=d1&mode=history',
        true,
        undefined,
        viewSpace,
      );
      const history = await screen.findByTestId('knowledge-history');
      const row = (
        await within(history).findByText('v1', { selector: 'li > span' })
      ).closest('li')!;
      fireEvent.click(within(row).getByRole('button', { name: 'View' }));
      await waitFor(() =>
        expect(url.search).toBe('?tab=knowledge&doc=d1&version=1'),
      );
      expect(
        await screen.findByText('Original release instructions.'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('knowledge-history')).toBeNull();
      await act(() => url.navigate(-1));
      expect(
        await screen.findByTestId('knowledge-history'),
      ).toBeInTheDocument();
      expect(url.search).toBe('?tab=knowledge&doc=d1&mode=history');
      await act(() => url.navigate(1));
      expect(
        await screen.findByText('Original release instructions.'),
      ).toBeInTheDocument();
      const savedSearch = url.search;
      shown.unmount();
      await show(`/${savedSearch}`, true, undefined, viewSpace);
      await waitFor(() =>
        expect(
          screen.getByText('Original release instructions.'),
        ).toBeInTheDocument(),
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Back to the current version' }),
      );
      await waitFor(() => expect(url.search).toBe('?tab=knowledge&doc=d1'));
      expect(
        await screen.findByText('Tag it, then deploy.'),
      ).toBeInTheDocument();
      expect(
        mocks.request.mock.calls.every(
          ([request]) => !request.method || request.method === 'GET',
        ),
      ).toBe(true);
    },
  );

  it('says an empty space is empty and offers to write the first article', async () => {
    serve([]);
    await show();
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
    await show();
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
    await show('/', false);
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
    await show();
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
    await show();
    fireEvent.click(await screen.findByText('Pending review · 1'));
    await waitFor(() => expect(url.search).toBe('?proposals=pending'));
    const list = await screen.findByTestId('knowledge-proposals');
    expect(
      await within(list).findByText('Scout on behalf of Ada', { exact: false }),
    ).toBeInTheDocument();
  });

  it('locks a restricted entry in the tree and says how many are listed on it', async () => {
    serve([
      summary('d1', 'Release flow', { accessMode: 'custom', accessEntries: 2 }),
    ]);
    await show('/?doc=d1');
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
    await show('/?doc=d1');
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
    await show('/?doc=d1');
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
    await show('/?doc=d1');
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
    await show('/?doc=d1');
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
    await show('/?doc=d1');
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
    await show('/?doc=d1');
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
    await show();
    const home = await screen.findByTestId('knowledge-home');
    expect(
      await within(home).findByText('Not fully indexed'),
    ).toBeInTheDocument();
    expect(within(home).getByText('2 failed · 1 waiting')).toBeInTheDocument();
  });

  it.each([true, false])(
    'shows semantic search tools only with an indexer (registered: %s)',
    async (semanticSearch) => {
      serve([]);
      extra = ({ path }) =>
        path === 'knowledge/capabilities'
          ? { data: { semanticSearch } }
          : undefined;
      await show();
      const group = await screen.findByTestId('knowledge-space-project');
      await press(within(group).getByRole('button', { name: 'Space actions' }));
      await screen.findByRole('menuitem', { name: 'Space access' });
      expect(
        screen.queryByRole('menuitem', { name: 'Search test' }) !== null,
      ).toBe(semanticSearch);
      expect(
        screen.queryByRole('menuitem', { name: 'Section settings' }) !== null,
      ).toBe(semanticSearch);
    },
  );

  it('hides semantic tools in unopened directory spaces without an indexer', async () => {
    serve([]);
    extra = ({ path }) =>
      path === 'knowledge/capabilities'
        ? { data: { semanticSearch: false } }
        : undefined;
    const directory: KnowledgeDirectorySource = {
      summaries: async () => [
        {
          space: treeOf([]).spaces[0]!.space,
          documents: 0,
          archivedDocuments: 0,
        },
      ],
      search: async () => [],
      sharedScope: 'system',
      sharedLabel: 'Shared across projects',
    };
    await show('/', true, directory, { scope: 'system', scopeId: '' });
    const group = await screen.findByTestId('knowledge-space-project');
    await press(within(group).getByRole('button', { name: 'Space actions' }));
    expect(
      await screen.findByRole('menuitem', { name: 'Space access' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Search test' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Section settings' }),
    ).not.toBeInTheDocument();
    expect(
      mocks.request.mock.calls.some(
        ([request]) => request.path === 'knowledge/spaces',
      ),
    ).toBe(false);
  });

  it('waits for capabilities before showing semantic tools', async () => {
    serve([]);
    const pending = Promise.withResolvers<{
      data: { semanticSearch: boolean };
    }>();
    extra = ({ path }) =>
      path === 'knowledge/capabilities' ? pending.promise : undefined;
    await show();
    const group = await screen.findByTestId('knowledge-space-project');
    await press(within(group).getByRole('button', { name: 'Space actions' }));
    await screen.findByRole('menuitem', { name: 'Space access' });
    expect(
      screen.queryByRole('menuitem', { name: 'Search test' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Section settings' }),
    ).not.toBeInTheDocument();
    await act(async () => {
      pending.resolve({ data: { semanticSearch: true } });
    });
    expect(
      await screen.findByRole('menuitem', { name: 'Search test' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('menuitem', { name: 'Section settings' }),
    ).toBeInTheDocument();
  });

  it('keeps section settings restricted to space managers when semantic search is available', async () => {
    serve([]);
    extra = ({ path }) =>
      path === 'knowledge/spaces'
        ? {
            data: [
              {
                ...treeOf([]).spaces[0],
                space: {
                  ...treeOf([]).spaces[0]!.space,
                  access: { ...MANAGE, manage: false },
                },
              },
            ],
          }
        : undefined;
    await show();
    const group = await screen.findByTestId('knowledge-space-project');
    await press(within(group).getByRole('button', { name: 'Space actions' }));
    expect(
      await screen.findByRole('menuitem', { name: 'Search test' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Section settings' }),
    ).not.toBeInTheDocument();
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
    await show();
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
    await show();
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

it.each([true, false])(
  'proposal availability preserves direct edit access: editor=%s',
  async (editor) => {
    serve([
      summary('d1', 'Availability guide', {
        access: { ...MANAGE, edit: editor, manage: editor },
        pendingProposals: 2,
      }),
    ]);
    extra = ({ path }) =>
      path === 'knowledge/capabilities'
        ? { data: { semanticSearch: false, proposals: false } }
        : undefined;
    await show();
    const tree = await screen.findByRole('tree', { name: 'Acme' });
    fireEvent.click(
      within(tree).getByRole('button', { name: 'Availability guide' }),
    );
    await screen.findByRole('heading', {
      name: 'Availability guide',
      level: 1,
    });
    expect(!!screen.queryByRole('button', { name: 'Edit', exact: true })).toBe(
      editor,
    );
    expect(
      screen.queryByRole('button', { name: 'Propose changes', exact: true }),
    ).not.toBeInTheDocument();
    expect(
      mocks.request.mock.calls.filter(([request]) =>
        request.path.startsWith('knowledge/proposals'),
      ),
    ).toEqual([]);
    const group = await screen.findByTestId('knowledge-space-project');
    await press(within(group).getByRole('button', { name: 'Space actions' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Space access' }),
    );
    const sheet = await screen.findByTestId('knowledge-space-access');
    expect(within(sheet).queryByText(/propos/i)).not.toBeInTheDocument();
    expect(
      within(sheet).queryByText(/read and propose at most/),
    ).not.toBeInTheDocument();
  },
);

describe('a file entry', () => {
  const PROPOSE: KnowledgeAccess = {
    read: true,
    propose: true,
    edit: false,
    manage: false,
  };
  const READ: KnowledgeAccess = { ...PROPOSE, propose: false };
  const fileDoc = (access: KnowledgeAccess) =>
    summary('f1', 'Readme', {
      kind: 'file',
      access,
      file: {
        id: 'file1',
        filename: 'README.md',
        ext: 'md',
        mimeType: 'text/markdown',
        size: 2048,
        parseStatus: 'ready',
        parseError: null,
        contentUrl: '/api/knowledge/files/file1/content',
        downloadUrl: '/api/knowledge/files/file1/download',
      },
    });

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response('# Readme\n\n| Now | Where |\n| --- | --- |\n| a | b |'),
    );
  });

  // The accessible names of the entry's header actions, in order.
  const actions = () =>
    within(screen.getByTestId('knowledge-doc-toolbar'))
      .getAllByRole('button')
      .map(
        (button) =>
          button.getAttribute('aria-label') ?? button.textContent?.trim(),
      )
      .filter((name) => name && !name.startsWith('Updated'));

  const header = async () => {
    const article = await screen.findByTestId('knowledge-doc');
    await within(article).findAllByRole('heading', {
      name: 'Readme',
      level: 1,
    });
    return article;
  };

  it('offers Replace, Download, History and a menu with Rename and Properties, but no Edit, to an editor', async () => {
    serve([fileDoc(MANAGE)]);
    await show('/?doc=f1');
    const article = await header();
    expect(
      within(article).queryByRole('button', { name: 'Edit', exact: true }),
    ).not.toBeInTheDocument();
    for (const name of ['Replace', 'Download', 'History'])
      expect(
        within(article).getByRole('button', { name, exact: true }),
      ).toBeInTheDocument();
    // The card only describes the file.
    expect(
      within(screen.getByTestId('knowledge-file')).queryByRole('button'),
    ).not.toBeInTheDocument();
    await press(within(article).getByRole('button', { name: 'More actions' }));
    expect(
      await screen.findByRole('menuitem', { name: 'Rename' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Properties and summary' }),
    );
    expect(
      within(await screen.findByRole('dialog')).getByRole('textbox', {
        name: 'Summary',
      }),
    ).toBeInTheDocument();
  });

  it('offers Propose a replacement to someone who may only propose, and only Download and History to a reader', async () => {
    serve([fileDoc(PROPOSE)]);
    const first = await show('/?doc=f1');
    const article = await header();
    expect(
      within(article).getByRole('button', { name: 'Propose a replacement' }),
    ).toBeInTheDocument();
    expect(
      within(article).queryByRole('button', { name: 'Replace', exact: true }),
    ).not.toBeInTheDocument();
    first.unmount();

    // A reader's menu keeps the sections and permissions; pending proposals add no entry for them.
    serve([{ ...fileDoc(READ), pendingProposals: 2 }]);
    await show('/?doc=f1');
    const read = await header();
    expect(actions()).toEqual(['Download', 'History', 'More actions']);
    await press(within(read).getByRole('button', { name: 'More actions' }));
    await screen.findByRole('menuitem', { name: 'View sections' });
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent?.trim()),
    ).toEqual(['View sections', 'Permissions']);
  });

  it('keeps an older version from being replaced or proposed against', async () => {
    const versionOne = (path: string) =>
      path === 'knowledge/docs/f1/versions/1'
        ? {
            data: {
              id: 'v1',
              docId: 'f1',
              version: 1,
              title: 'Readme',
              summary: '',
              content: 'Old text.',
              contentHash: 'h1',
              file: fileDoc(MANAGE).file,
              author,
              source: null,
              runId: null,
              proposalId: null,
              approvedBy: null,
              note: null,
              createdAt: '2026-10-01T00:00:00Z',
            },
          }
        : undefined;
    serve([fileDoc(MANAGE)]);
    extra = ({ path }) => versionOne(path);
    const first = await show('/?doc=f1&version=1');
    await header();
    await waitFor(() =>
      expect(actions()).toEqual(['Download', 'History', 'More actions']),
    );
    first.unmount();

    serve([fileDoc(PROPOSE)]);
    extra = ({ path }) => versionOne(path);
    await show('/?doc=f1&version=1');
    await header();
    await waitFor(() =>
      expect(actions()).toEqual(['Download', 'History', 'More actions']),
    );
  });

  it('keeps Download and the menu on a phone, with History, Replace and pending proposals in the menu', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: !query.includes('min-width'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    serve([{ ...fileDoc(MANAGE), pendingProposals: 2 }]);
    const first = await show('/?doc=f1');
    await header();
    expect(actions()).toEqual(['Download', 'More actions']);
    await press(screen.getByRole('button', { name: 'More actions' }));
    const sheet = await screen.findByTestId('knowledge-doc-actions');
    expect(
      within(sheet)
        .getAllByRole('button')
        .map((button) => button.textContent?.trim())
        .filter(Boolean)
        .slice(0, 5),
    ).toEqual([
      '2 pending',
      'Replace',
      'History',
      'Rename',
      'Properties and summary',
    ]);
    first.unmount();

    // A reader: History, the sections and permissions, and no pending proposals.
    serve([{ ...fileDoc(READ), pendingProposals: 2 }]);
    await show('/?doc=f1');
    await header();
    expect(actions()).toEqual(['Download', 'More actions']);
    await press(screen.getByRole('button', { name: 'More actions' }));
    expect(
      within(await screen.findByTestId('knowledge-doc-actions'))
        .getAllByRole('button')
        .map((button) => button.textContent?.trim())
        .filter(Boolean),
    ).toEqual(['History', 'View sections', 'Permissions', 'Close']);
  });

  it("previews Markdown with the documents' rendering and full screen only from the Preview tab", async () => {
    serve([fileDoc(READ)]);
    await show('/?doc=f1');
    const article = await header();
    expect(await within(article).findByRole('table')).toBeInTheDocument();
    await press(within(article).getByRole('button', { name: 'Full screen' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('README.md')).toBeInTheDocument();
    expect(within(dialog).getByText('Readme · Version 2')).toBeInTheDocument();
    expect(await within(dialog).findByRole('table')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await press(within(article).getByRole('tab', { name: 'Extracted text' }));
    await within(article).findByTestId('knowledge-extracted-text');
    expect(
      within(article).queryByRole('button', { name: 'Full screen' }),
    ).not.toBeInTheDocument();
  });

  it('opens the extracted text, numbered, with the cited lines highlighted', async () => {
    serve([fileDoc(READ)]);
    await show('/?doc=f1&lines=3-3');
    const text = await screen.findByTestId('knowledge-extracted-text');
    expect(
      within(text).getByText(/AI search and answers use exactly this text/),
    ).toBeInTheDocument();
    const rows = text.querySelectorAll('[data-line]');
    expect(rows).toHaveLength(3);
    expect(rows[2]?.textContent).toBe('3Tag it, then deploy.');
    expect(
      [...text.querySelectorAll('[data-highlighted]')].map((row) =>
        row.getAttribute('data-line'),
      ),
    ).toEqual(['3']);
    expect(
      within(text).getByRole('button', { name: 'Copy' }),
    ).toBeInTheDocument();
  });

  it('scrolls the cited line into view and copies the extracted text', async () => {
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this);
    };
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    serve([fileDoc(READ)]);
    await show('/?doc=f1&lines=3-3');
    const text = await screen.findByTestId('knowledge-extracted-text');
    await waitFor(() =>
      expect(
        scrolled.some((row) => row.getAttribute('data-line') === '3'),
      ).toBe(true),
    );
    await press(within(text).getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        '# Readme\n\nTag it, then deploy.',
      ),
    );
    expect(await screen.findByText('Copied.')).toBeInTheDocument();
  });

  it('closes the full-screen preview with Esc, also while a frame holds the focus', async () => {
    const pdf = {
      ...fileDoc(READ),
      file: {
        ...fileDoc(READ).file!,
        filename: 'guide.pdf',
        ext: 'pdf',
        mimeType: 'application/pdf',
      },
    };
    serve([pdf]);
    await show('/?doc=f1');
    const article = await header();
    const open = async () => {
      await press(
        await within(article).findByRole('button', { name: 'Full screen' }),
      );
      return screen.findByTestId('knowledge-file-fullscreen');
    };
    const closed = () =>
      waitFor(() =>
        expect(
          screen.queryByTestId('knowledge-file-fullscreen'),
        ).not.toBeInTheDocument(),
      );

    await open();
    await userEvent.keyboard('{Escape}');
    await closed();

    // A frame whose document can be read listens for Esc itself.
    let dialog = await open();
    let frame = dialog.querySelector('iframe')!;
    frame.focus();
    fireEvent.blur(window);
    await waitFor(() => new Promise((resolve) => setTimeout(resolve, 0)));
    fireEvent.keyDown(frame.contentDocument!, { key: 'Escape' });
    await closed();

    // One that cannot be read hands the focus back, where Esc closes the dialog.
    dialog = await open();
    frame = dialog.querySelector('iframe')!;
    Object.defineProperty(frame, 'contentDocument', { get: () => null });
    frame.focus();
    fireEvent.blur(window);
    await waitFor(() => expect(document.activeElement).not.toBe(frame));
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await userEvent.keyboard('{Escape}');
    await closed();
  });

  it('keeps the preview chosen after a citation until other lines are cited', async () => {
    serve([fileDoc(READ)]);
    await show('/?doc=f1&lines=3-3');
    const article = await header();
    await screen.findByTestId('knowledge-extracted-text');
    await press(within(article).getByRole('tab', { name: 'Preview' }));
    expect(await within(article).findByRole('table')).toBeInTheDocument();
    // The same citation parsed again, as every render of the view does.
    await act(() => url.navigate('/?doc=f1&lines=3-3&q=deploy'));
    await act(() => url.navigate('/?doc=f1&lines=3-3'));
    expect(
      within(article).getByRole('tab', { name: 'Preview' }),
    ).toHaveAttribute('aria-selected', 'true');
    await act(() => url.navigate('/?doc=f1&lines=1-2'));
    await waitFor(() =>
      expect(
        within(article).getByRole('tab', { name: 'Extracted text' }),
      ).toHaveAttribute('aria-selected', 'true'),
    );
  });
});
