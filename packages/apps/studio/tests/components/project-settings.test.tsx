/**
 * A project's Settings tab: its sections in the URL (`?section=…&repo=…`), branch rules only with a Git connection,
 * a repository switcher only on the repository sections of a project with more than one, a working directory edited in
 * a dialog the URL opens, the project's and its working directories' agent run variables in one table; and a
 * repository's "Deployment": the Apps CI reported in one table, a header row per environment they run in, each
 * connected by its own reports, with its variables, its builds and removing it behind its "…" (after a confirmation
 * that says what it does); the last failure in the reader's language; the run awaited
 * above them and "Waiting for the first report" before any; "Configure CI" in a dialog the URL opens, connecting one
 * application to a trigger and an environment (the environment following the trigger, the App ID following both until
 * edited) in a way sent for that run (Studio's ways disabled without a Git connection, the ways done by hand sending
 * nothing); and the builds filtered by App.
 */
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditorView } from '@codemirror/view';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BuildView } from '../../shared/builds';
import { pickerAgent } from '../fixtures/picker-agents';
import {
  ciWorkflowPathOf,
  type CiApp,
  type CiConnectionView,
  type CiEnvironment,
  type CiReportedApp,
  type CiRunRequest,
  type CiTarget,
} from '../../shared/ci-modes';

const status = { enabled: true };
const connections = new Map<string, CiConnectionView>();
const builds: BuildView[] = [];
const configured: { resourceId: string; run: CiRunRequest }[] = [];
const removed: { path: string; query: unknown }[] = [];
const generated: { app: CiApp; target: CiTarget; managed: boolean }[] = [];
const revealed: { path: string; json: unknown }[] = [];
let failRevealRequests = 0;

const ENVIRONMENTS: CiEnvironment[] = [
  { id: 'preview', name: 'Preview', protected: false },
  { id: 'staging', name: 'Staging', protected: false },
  {
    id: 'production',
    name: 'Production',
    protected: true,
  },
];

const request = vi.fn(
  (options: {
    path: string;
    method?: string;
    json?: unknown;
    query?: unknown;
  }) => {
    if (options.path === 'repositoryDeployments/ciWorkflows/environments')
      return Promise.resolve({ data: ENVIRONMENTS });
    if (options.path === 'repositoryDeployments/ciWorkflows/generate') {
      const input = options.json as {
        app: CiApp;
        target: CiTarget;
        managed: boolean;
      };
      generated.push(input);
      return Promise.resolve({
        data: [
          {
            path: ciWorkflowPathOf({
              appId: input.app.appId,
              trigger: input.target.trigger,
              environmentId: input.target.environmentId,
            }),
            content: `name: ${input.app.appId}\non: ${input.target.trigger} ${input.target.ref ?? ''}\nenv:\n  KEY: \${{ secrets.NB_STUDIO_API_KEY }}\n# nb-studio deploy\n`,
          },
        ],
      });
    }
    const match = /^repositoryDeployments\/([^/]+)\/(.+)$/u.exec(options.path);
    if (match?.[2] === 'ci/connection')
      return Promise.resolve({ data: connections.get(match[1]!) });
    if (match?.[2]?.startsWith('ci/apps/') && options.method === 'DELETE') {
      removed.push({ path: match[2], query: options.query });
      const current = connections.get(match[1]!)!;
      connections.set(match[1]!, {
        ...current,
        apps: current.apps.filter((app) => `ci/apps/${app.appId}` !== match[2]),
      });
      return Promise.resolve(undefined);
    }
    if (match?.[2] === 'ci/configure' && options.method === 'POST') {
      const run = options.json as CiRunRequest;
      configured.push({ resourceId: match[1]!, run });
      const next: CiConnectionView = {
        ...connections.get(match[1]!)!,
        state: 'pr-open',
        connection: 'pr-open',
        pullRequest: {
          number: 21,
          url: 'https://github.com/acme/shop/pull/21',
        },
      };
      connections.set(match[1]!, next);
      return Promise.resolve({ data: next });
    }
    if (
      (match?.[2] === 'ci/setup' || match?.[2] === 'ci/rotate') &&
      options.method === 'POST'
    ) {
      revealed.push({ path: match[2], json: options.json });
      if (failRevealRequests > 0) {
        failRevealRequests -= 1;
        return Promise.reject(new Error('Failed'));
      }
      const next: CiConnectionView = {
        ...connections.get(match[1]!)!,
        state: 'manual',
        key: {
          id: 'k1',
          name: 'acme/shop CI',
          expiresAt: null,
          lastUsedAt: null,
          status: 'active',
        },
      };
      connections.set(match[1]!, next);
      return Promise.resolve({
        data: { ...next, secret: `nbk_secret_${revealed.length}` },
      });
    }
    if (match?.[2] === 'builds') return Promise.resolve({ data: builds });
    return Promise.reject(new Error(`Unexpected ${options.path}`));
  },
);

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
  useUnsavedChanges: () => () => undefined,
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values && 'number' in values
        ? `${key}:${String(values.number)}`
        : values && 'appId' in values
          ? `${key}:${String(values.appId)}`
          : key,
    i18n: { language: 'en-US' },
  }),
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
  errorText: () => 'failed',
}));
vi.mock('../../client/git/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/git/api')>()),
  useGitStatus: () => ({
    data: { enabled: status.enabled, canManage: true, connections: [] },
  }),
}));
vi.mock('../../client/git/attribution', () => ({
  ProjectAttributionCard: () => <div data-attribution />,
}));
vi.mock('../../client/git/repo-section', () => ({
  GitRepoSection: ({ resource }: { resource: ProjectResource }) => (
    <div data-git-section={resource.id} />
  ),
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  ScopedVariablesSection: (props: {
    scopes: readonly { scope: string; scopeId: string; label: string }[];
    note?: string;
  }) => (
    <div
      data-variables={props.scopes
        .map((item) => `${item.scope}:${item.scopeId}`)
        .join(',')}
      data-variables-labels={props.scopes.map((item) => item.label).join(',')}
      data-variables-note={props.note ?? ''}
    />
  ),
  DefaultSkillsSection: (props: { scope: string; scopeId: string }) => (
    <div data-skills={`${props.scope}:${props.scopeId}`} />
  ),
  useRunnerOptions: () => ({ loading: false, options: [] }),
  useAgentOptions: () => ({
    loading: false,
    failed: false,
    options: [
      { value: 'studio-project-lead', label: 'Project lead' },
      { value: 'studio-senior-developer', label: 'Senior developer' },
    ],
    agents: [
      pickerAgent('studio-project-lead', 'Project lead'),
      pickerAgent('studio-senior-developer', 'Senior developer'),
    ],
  }),
}));
vi.mock('@nocobase/app-plugin-projects/client/projects', () => ({
  useProjectResources: (_: string, resources: readonly ProjectResource[]) => ({
    sorted: resources,
    isPending: false,
    move: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    save: vi.fn(() => Promise.resolve()),
  }),
  useResourceValidation: () => () => ({}),
  useProjectUpdate: () => ({ update: vi.fn(), isPending: false }),
}));

const project = { resources: [] as ProjectResource[] };
vi.mock('../../client/projects/detail/context', () => ({
  useProjectPage: () => ({
    project: {
      id: 'p1',
      name: 'Shop',
      description: null,
      resources: project.resources,
    },
    canEdit: true,
  }),
}));

const { ProjectSettings } = await import('../../client/projects/settings/page');

const repo = (id: string, fullName: string): ProjectResource => ({
  id,
  projectId: 'p1',
  type: 'gitRepo',
  url: `https://github.com/${fullName}.git`,
  defaultRef: 'main',
  binding: {
    provider: 'github',
    connectionId: 'c1',
    repoId: id,
    fullName,
  },
  runnerId: null,
  path: null,
  label: null,
  initPrompt: null,
  position: 0,
});

const reported = (
  environmentId: string,
  appId: string,
  patch: Partial<CiReportedApp> = {},
): CiReportedApp => ({
  environmentId,
  appId,
  pullRequests: environmentId === 'preview',
  lastBuildAt: '2026-10-06T00:00:00.000Z',
  lastBuildState: 'succeeded',
  lastDeployAt: '2026-10-06T00:01:00.000Z',
  connected: true,
  ...patch,
});

const connection = (
  resourceId: string,
  patch: Partial<CiConnectionView> = {},
): CiConnectionView => ({
  resourceId,
  repo: 'acme/shop',
  auto: true,
  state: 'pr-open',
  key: {
    id: 'k1',
    name: 'acme/shop CI',
    expiresAt: '2026-12-01T00:00:00.000Z',
    lastUsedAt: '2026-10-09T12:30:00.000Z',
    status: 'active',
  },
  secretName: 'NB_STUDIO_API_KEY',
  secretKind: 'GitHub Actions secret',
  workflowPaths: ['.github/workflows/nb-studio-shop-preview.yml'],
  pullRequest: { number: 12, url: 'https://github.com/acme/shop/pull/12' },
  workflowSha: null,
  lastRotatedAt: null,
  lastError: null,
  lastFailure: null,
  canManage: true,
  connection: 'connected',
  task: null,
  reported: true,
  connected: true,
  apps: [
    reported('preview', 'shop'),
    reported('preview', 'admin', { lastBuildState: 'failed' }),
    reported('staging', 'shop-staging'),
    reported('production', 'shop', {
      lastBuildAt: null,
      lastBuildState: null,
      lastDeployAt: null,
      connected: false,
    }),
  ],
  environments: ENVIRONMENTS,
  ...patch,
});

function Where(): ReactElement {
  const location = useLocation();
  return <output data-location>{location.search}</output>;
}

function page(search: string): ReactElement {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[`/projects/p1/settings${search}`]}>
        <Routes>
          <Route
            path='/projects/:projectId/settings'
            element={
              <>
                <ProjectSettings />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const sectionLinks = () =>
  [...document.querySelectorAll('[data-section-link]')].map((link) =>
    link.getAttribute('data-section-link'),
  );

globalThis.ResizeObserver ??= class {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
};
Element.prototype.scrollIntoView ??= () => undefined;
// CodeMirror measures text ranges, which jsdom does not lay out.
Range.prototype.getClientRects ??= () =>
  ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: [][Symbol.iterator],
  }) as unknown as DOMRectList;
Range.prototype.getBoundingClientRect ??= () => new DOMRect();

beforeEach(() => {
  vi.clearAllMocks();
  status.enabled = true;
  connections.clear();
  builds.length = 0;
  configured.length = 0;
  removed.length = 0;
  revealed.length = 0;
  failRevealRequests = 0;
  project.resources = [repo('r1', 'acme/shop')];
  connections.set('r1', connection('r1'));
});

describe('the Settings tab', () => {
  it('opens a section from the URL, branch rules only with a Git connection', async () => {
    const { unmount } = render(page(''));
    expect(sectionLinks()).toEqual([
      'general',
      'directories',
      'ci',
      'git',
      'variables',
      'skills',
    ]);
    expect(
      document
        .querySelector('[data-project-settings]')
        ?.getAttribute('data-project-settings'),
    ).toBe('general');
    fireEvent.click(document.querySelector('[data-section-link="ci"]')!);
    expect(await screen.findByText('ciSetup.status.title')).toBeTruthy();
    expect(document.querySelector('[data-location]')?.textContent).toBe(
      '?section=ci',
    );
    unmount();
    status.enabled = false;
    render(page('?section=git'));
    expect(sectionLinks()).not.toContain('git');
    // A section that is not offered falls back to General.
    expect(
      document
        .querySelector('[data-project-settings]')
        ?.getAttribute('data-project-settings'),
    ).toBe('general');
  });

  it('switches repositories only on the repository sections of a project with several', async () => {
    project.resources = [repo('r1', 'acme/shop'), repo('r2', 'acme/admin')];
    connections.set('r2', connection('r2', { repo: 'acme/admin' }));
    render(page('?section=ci&repo=r2'));
    expect(
      document.querySelector(
        '[data-settings-switcher="project-settings-repository"]',
      ),
    ).not.toBeNull();
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'repositoryDeployments/r2/ci/connection',
        }),
      ),
    );
    fireEvent.click(document.querySelector('[data-section-link="general"]')!);
    expect(
      document.querySelector(
        '[data-settings-switcher="project-settings-repository"]',
      ),
    ).toBeNull();
  });

  it('lists the project’s and every working directory’s variables in one table, with no scope switcher', () => {
    render(page('?section=variables'));
    const table = document.querySelector('[data-variables]');
    expect(table?.getAttribute('data-variables')).toBe('project:p1,workdir:r1');
    expect(table?.getAttribute('data-variables-labels')).toBe(
      'projectPage.settings.wholeProject,projectPage.settings.workdirScope',
    );
    expect(table?.getAttribute('data-variables-note')).toBe(
      'projectPage.settings.variablesOverride',
    );
    expect(
      document.querySelector(
        '[data-settings-switcher="project-settings-scope"]',
      ),
    ).toBeNull();
  });

  it('edits a working directory in a dialog the URL opens', async () => {
    render(page('?section=directories&edit=r1'));
    expect(
      await screen.findByText('projectPage.settings.directories.edit'),
    ).toBeTruthy();
    // A repository is named `owner/repo`: it has no name of its own to edit.
    expect(
      screen.queryByLabelText('projectPage.codeLocation.label'),
    ).toBeNull();
  });
});

describe('Deployment', () => {
  beforeEach(() => {
    generated.length = 0;
  });
  // The environments' header rows, each with the App rows under it.
  const sections = () =>
    [...document.querySelectorAll('[data-ci-environment]')].map((section) => {
      const id = section.getAttribute('data-ci-environment');
      return [
        id,
        [...document.querySelectorAll(`[data-ci-app-environment="${id}"]`)].map(
          (row) => [
            row.getAttribute('data-ci-app'),
            row
              .querySelector('[data-ci-app-state]')
              ?.getAttribute('data-ci-app-state') ?? 'connected',
          ],
        ),
      ];
    });
  const location = () =>
    document.querySelector('[data-location]')?.textContent ?? '';
  const radio = (method: string) =>
    document.querySelector(
      `[data-ci-method="${method}"] [data-slot="radio-group-item"]`,
    );
  const openRow = async (name: string) => {
    screen
      .getByRole('button', { name: `ciSetup.status.actionsOf:${name}` })
      .focus();
    await userEvent.keyboard('{ArrowDown}');
  };

  it('lists the Apps CI reported in a section per environment, each by its own reports', async () => {
    render(page('?section=ci'));
    await waitFor(() =>
      expect(sections()).toEqual([
        [
          'preview',
          [
            ['shop', 'connected'],
            ['admin', 'connected'],
          ],
        ],
        ['staging', [['shop-staging', 'connected']]],
        ['production', [['shop', 'waiting']]],
      ]),
    );
    // A protected environment says so; pull requests' Apps are one row named after them.
    const production = document.querySelector(
      '[data-ci-environment="production"]',
    )!;
    expect(
      production.querySelector('[data-ci-environment-protected]'),
    ).not.toBeNull();
    expect(
      document.querySelector(
        '[data-ci-environment="staging"] [data-ci-environment-protected]',
      ),
    ).toBeNull();
    expect(
      document.querySelector(
        '[data-ci-app-environment="preview"][data-ci-app="shop"]',
      )?.textContent,
    ).toContain('shop-pr-*');
    // One table, its header once, its columns the same for every environment.
    expect(document.querySelectorAll('[data-ci-apps] thead tr')).toHaveLength(
      1,
    );
    expect(document.querySelectorAll('[data-ci-apps]')).toHaveLength(1);
    // The run's pull request is awaited above the list; Configure CI sits in the card's header.
    expect(
      document.querySelector('[data-ci-outcome="pr-open"]')?.textContent,
    ).toContain('ciSetup.status.prOpen:12');
    expect(
      screen.getByRole('button', { name: 'ciSetup.configure.action' }),
    ).toBeTruthy();
    expect(document.querySelector('[data-ci-waiting]')).toBeNull();
    expect(document.querySelector('[data-ci-key="k1"]')).not.toBeNull();
    // A repository keeps no preview variables: previews take their environment's and their own.
    expect(screen.queryByText('previews.deploy.variables.title')).toBeNull();
    // A row's variables: the App's in Releases, its environment's for pull requests' Apps.
    await openRow('shop-staging');
    expect(
      (
        await screen.findByRole('menuitem', {
          name: 'ciSetup.status.variables',
        })
      ).getAttribute('href'),
    ).toBe('/releases/shop-staging?tab=variables');
    await userEvent.keyboard('{Escape}');
    await openRow('shop-pr-*');
    expect(
      (
        await screen.findByRole('menuitem', {
          name: 'ciSetup.status.variables',
        })
      ).getAttribute('href'),
    ).toBe('/environments/preview?tab=variables');
  });

  it('removes a row only after a confirmation that says what it does', async () => {
    render(page('?section=ci'));
    await waitFor(() => expect(sections()).toHaveLength(3));
    await openRow('shop-staging');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'ciSetup.remove.action' }),
    );
    const dialog = await waitFor(() => {
      const found = document.querySelector('[data-ci-remove-dialog]');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(dialog.textContent).toContain('ciSetup.remove.title:shop-staging');
    expect(dialog.textContent).toContain('ciSetup.remove.description');
    expect(removed).toEqual([]);
    fireEvent.click(dialog.querySelector('[data-ci-remove-confirm]')!);
    await waitFor(() =>
      expect(removed).toEqual([
        { path: 'ci/apps/shop-staging', query: { environmentId: 'staging' } },
      ]),
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-ci-environment="staging"]'),
      ).toBeNull(),
    );
  });

  it('says that removing the pull requests’ row only hides their builds', async () => {
    render(page('?section=ci'));
    await waitFor(() => expect(sections()).toHaveLength(3));
    await openRow('shop-pr-*');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'ciSetup.remove.action' }),
    );
    const description = await waitFor(() => {
      const found = document.querySelector('[data-ci-remove-kind]');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(description.getAttribute('data-ci-remove-kind')).toBe(
      'pull-requests',
    );
    expect(description.textContent).toBe('ciSetup.remove.pullRequests');
  });

  it('words the last failure in the reader’s language, the server’s words only behind Details', async () => {
    connections.set(
      'r1',
      connection('r1', {
        state: 'manual',
        lastError:
          'Acme demo is a demo connection: Studio never calls its code host.',
        lastFailure: { reason: 'demoConnection', params: {} },
      }),
    );
    const view = render(page('?section=ci'));
    const alert = await waitFor(() => {
      const found = document.querySelector('[data-ci-error]');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(alert.getAttribute('data-ci-failure')).toBe('demoConnection');
    expect(alert.textContent).toContain('ciSetup.failures.demoConnection');
    expect(alert.textContent).not.toContain('demo connection');
    expect(alert.textContent).not.toContain('ciSetup.failures.details');
    view.unmount();
    // A failure recorded before reasons were: a general sentence, its words behind Details.
    connections.set(
      'r1',
      connection('r1', {
        state: 'manual',
        lastError: 'Something unexpected.',
        lastFailure: null,
      }),
    );
    render(page('?section=ci'));
    const legacy = await waitFor(() => {
      const found = document.querySelector('[data-ci-error]');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(legacy.textContent).toContain('ciSetup.failures.unknown');
    await userEvent.click(
      await screen.findByRole('button', { name: 'ciSetup.failures.details' }),
    );
    expect(
      (await screen.findByText('Something unexpected.')).hasAttribute(
        'data-ci-error-detail',
      ),
    ).toBe(true);
  });

  it('offers no removal to someone who does not manage the project', async () => {
    connections.set('r1', connection('r1', { canManage: false }));
    render(page('?section=ci'));
    await waitFor(() => expect(sections()).toHaveLength(3));
    await openRow('shop-staging');
    expect(
      await screen.findByRole('menuitem', { name: 'ciSetup.status.variables' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('menuitem', { name: 'ciSetup.remove.action' }),
    ).toBeNull();
  });

  it('waits for the first report, Configure CI only in the empty state, or nothing for someone who does not manage', async () => {
    connections.set(
      'r1',
      connection('r1', {
        state: 'configured',
        pullRequest: null,
        connection: 'none',
        reported: false,
        apps: [],
      }),
    );
    const view = render(page('?section=ci'));
    await waitFor(() =>
      expect(document.querySelector('[data-ci-waiting]')).not.toBeNull(),
    );
    const waiting = document.querySelector('[data-ci-waiting]')!;
    expect(waiting.textContent).toContain('ciSetup.status.emptyTitle');
    expect(
      screen.getAllByRole('button', { name: 'ciSetup.configure.action' }),
    ).toHaveLength(1);
    expect(waiting.querySelector('[data-ci-configure]')).not.toBeNull();
    expect(document.querySelector('[data-ci-outcome]')).toBeNull();
    view.unmount();
    connections.set(
      'r1',
      connection('r1', {
        state: 'configured',
        connection: 'task',
        task: { issueId: 'i9', identifier: 'SHOP-40' },
        reported: false,
        apps: [],
        canManage: false,
      }),
    );
    render(page('?section=ci'));
    expect((await screen.findByText('SHOP-40')).getAttribute('href')).toBe(
      '/issues/SHOP-40',
    );
    expect(screen.getByText('ciSetup.status.emptyReadOnly')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'ciSetup.configure.action' }),
    ).toBeNull();
  });

  it('configures one application for pull requests in Preview by default, in a dialog the URL opens', async () => {
    render(page('?section=ci'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'ciSetup.configure.action' }),
    );
    await waitFor(() => expect(location()).toContain('configure=1'));
    expect(await screen.findByText('ciSetup.configure.title')).toBeTruthy();
    // One application, no rows to add; Studio writes the standard workflow by default.
    expect(screen.queryByText('ciSetup.apps.add')).toBeNull();
    expect(radio('direct')?.hasAttribute('data-checked')).toBe(true);
    expect(
      document
        .querySelector(
          '[data-ci-trigger="pullRequest"] [data-slot="radio-group-item"]',
        )
        ?.hasAttribute('data-checked'),
    ).toBe(true);
    await waitFor(() =>
      expect(
        (screen.getByLabelText('ciSetup.app.appId') as HTMLInputElement).value,
      ).toBe('shop'),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'ciSetup.configure.submit.direct' }),
    );
    await waitFor(() => expect(configured).toHaveLength(1));
    expect(configured[0]).toEqual({
      resourceId: 'r1',
      run: {
        method: 'direct',
        app: { directory: '.', appId: 'shop' },
        target: { trigger: 'pullRequest', ref: null, environmentId: 'preview' },
      },
    });
    await waitFor(() => expect(location()).not.toContain('configure=1'));
  });

  it('follows the trigger with its environment and the App ID until someone edits it', async () => {
    render(page('?section=ci&configure=1'));
    fireEvent.click(await screen.findByText('ciSetup.trigger.branch.title'));
    const appId = () =>
      (screen.getByLabelText('ciSetup.app.appId') as HTMLInputElement).value;
    // A branch: the default branch, the staging environment, `<base>-staging`.
    await waitFor(() => expect(appId()).toBe('shop-staging'));
    expect(
      (screen.getByLabelText('ciSetup.trigger.branch.ref') as HTMLInputElement)
        .value,
    ).toBe('main');
    // A tag: `v*`, the protected environment, said as such.
    fireEvent.click(screen.getByText('ciSetup.trigger.tag.title'));
    await waitFor(() => expect(appId()).toBe('shop-production'));
    expect(
      (screen.getByLabelText('ciSetup.trigger.tag.ref') as HTMLInputElement)
        .value,
    ).toBe('v*');
    expect(screen.getByText('ciSetup.environment.protectedHint')).toBeTruthy();
    // An existing App named directly; the directory changes nothing typed.
    fireEvent.change(screen.getByLabelText('ciSetup.app.appId'), {
      target: { value: 'shop' },
    });
    fireEvent.change(screen.getByLabelText('ciSetup.app.directory'), {
      target: { value: 'apps/shop' },
    });
    expect(appId()).toBe('shop');
    fireEvent.click(
      screen.getByRole('button', { name: 'ciSetup.configure.submit.direct' }),
    );
    await waitFor(() => expect(configured).toHaveLength(1));
    expect(configured[0]?.run).toEqual({
      method: 'direct',
      app: { directory: 'apps/shop', appId: 'shop' },
      target: { trigger: 'tag', ref: 'v*', environmentId: 'production' },
    });
  });

  it('refuses an invalid branch before sending anything', async () => {
    render(page('?section=ci&configure=1'));
    fireEvent.click(await screen.findByText('ciSetup.trigger.branch.title'));
    fireEvent.change(
      await screen.findByLabelText('ciSetup.trigger.branch.ref'),
      { target: { value: 'not a branch' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'ciSetup.configure.submit.direct' }),
    );
    expect(
      await screen.findByText('ciSetup.trigger.branch.invalid'),
    ).toBeTruthy();
    expect(configured).toEqual([]);
  });

  it('hands it to the project lead agent unless another is chosen', async () => {
    render(page('?section=ci&configure=1'));
    fireEvent.click(await screen.findByText('ciSetup.methods.agent.title'));
    await waitFor(() =>
      expect(
        (screen.getByLabelText('ciSetup.app.appId') as HTMLInputElement).value,
      ).toBe('shop'),
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'ciSetup.configure.submit.agent',
      }),
    );
    await waitFor(() => expect(configured).toHaveLength(1));
    expect(configured[0]?.run).toEqual({
      method: 'agent',
      app: { directory: '.', appId: 'shop' },
      target: { trigger: 'pullRequest', ref: null, environmentId: 'preview' },
      agentId: 'studio-senior-developer',
    });
  });

  it('edits the template in the dialog, the file as generated, and sends it as edited', async () => {
    render(page('?section=ci&configure=1'));
    fireEvent.click(await screen.findByText('ciSetup.methods.template.title'));
    const editor = await screen.findByLabelText(
      '.github/workflows/nb-studio-shop-preview.yml',
    );
    const view = EditorView.findFromDOM(editor)!;
    expect(view.state.doc.toString()).toContain('name: shop\n');
    expect(generated.at(-1)?.managed).toBe(true);
    act(() =>
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: 'name: Z\n' },
      }),
    );
    // A file that never signs in is written with a warning.
    expect(
      await screen.findByText('ciSetup.workflow.warningsTitle'),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'ciSetup.configure.submit.template' }),
    );
    await waitFor(() => expect(configured).toHaveLength(1));
    expect(configured[0]?.run).toEqual({
      method: 'template',
      app: { directory: '.', appId: 'shop' },
      target: { trigger: 'pullRequest', ref: null, environmentId: 'preview' },
      workflowFiles: [
        {
          path: '.github/workflows/nb-studio-shop-preview.yml',
          content: 'name: Z\n',
        },
      ],
    });
  });

  it('offers only the ways done by hand without a Git connection, which show what to copy and send nothing', async () => {
    connections.set(
      'r1',
      connection('r1', {
        auto: false,
        state: 'disabled',
        connected: false,
        connection: 'none',
        key: null,
        pullRequest: null,
        reported: false,
        apps: [],
      }),
    );
    render(page('?section=ci&configure=1'));
    expect(
      await screen.findByText('ciSetup.method.autoUnavailable'),
    ).toBeTruthy();
    expect(radio('direct')?.hasAttribute('data-disabled')).toBe(true);
    expect(radio('manual')?.hasAttribute('data-checked')).toBe(true);
    await waitFor(() =>
      expect(document.querySelector('[data-ci-commands]')).not.toBeNull(),
    );
    expect(document.querySelector('[data-ci-manual-steps]')).not.toBeNull();
    expect(document.querySelector('[data-ci-commands]')!.textContent).toContain(
      'app ensure "shop-pr-$PR" --environment preview\n',
    );
    // Copied by hand: the header says how to add the key.
    expect(generated.at(-1)?.managed).toBe(false);
    // A branch target's commands name its App and environment.
    fireEvent.click(screen.getByText('ciSetup.trigger.branch.title'));
    await waitFor(() =>
      expect(
        document.querySelector('[data-ci-commands]')!.textContent,
      ).toContain('app ensure shop-staging --environment staging\n'),
    );
    fireEvent.click(screen.getByText('ciSetup.methods.ownAgent.title'));
    const prompt = await waitFor(() => {
      const found = screen
        .getAllByLabelText('ciSetup.ownAgent.title')
        .map((element) => element.textContent ?? '')
        .find((text) => text.includes('nb-studio app ensure'));
      expect(found).toBeDefined();
      return found!;
    });
    expect(prompt).toContain('.github/workflows/nb-studio-shop-staging.yml');
    expect(prompt).toContain('name: shop-staging');
    expect(prompt).toContain('ciSetup.prompt.secretOwn');
    fireEvent.click(
      screen.getByRole('button', { name: 'ciSetup.configure.submit.ownAgent' }),
    );
    await waitFor(() => expect(location()).not.toContain('configure=1'));
    expect(configured).toEqual([]);
  });

  it('generates the repository’s CI key by hand, its secret shown once to copy', async () => {
    connections.set(
      'r1',
      connection('r1', {
        auto: false,
        state: 'disabled',
        connected: false,
        connection: 'none',
        key: null,
        pullRequest: null,
        reported: false,
        apps: [],
      }),
    );
    render(page('?section=ci&configure=1'));
    const generate = await screen.findByRole('button', {
      name: 'ciSetup.manual.generate',
    });
    expect(screen.getByText('ciSetup.manual.steps.key')).toBeTruthy();
    expect(screen.queryByText('ciSetup.manual.replaces')).toBeNull();
    fireEvent.click(generate);
    const secret = await screen.findByLabelText(
      'ciSetup.manual.revealed.label',
    );
    expect((secret as HTMLInputElement).value).toBe('nbk_secret_1');
    expect(revealed).toEqual([{ path: 'ci/setup', json: { reveal: true } }]);
    const shown = document.querySelector('[data-ci-revealed-key]')!;
    expect(shown.textContent).toContain('ciSetup.manual.revealed.store');
    expect(shown.textContent).toContain('ciSetup.copy');
    // Nothing was configured: the workflow and commands stay to copy.
    expect(document.querySelector('[data-ci-commands]')).not.toBeNull();
    expect(configured).toEqual([]);
    // Closed, the secret is gone; opened again, generating gives a new one.
    fireEvent.click(
      screen.getByRole('button', { name: 'ciSetup.configure.submit.manual' }),
    );
    await waitFor(() =>
      expect(document.querySelector('[data-ci-revealed-key]')).toBeNull(),
    );
    expect(document.body.textContent).not.toContain('nbk_secret_1');
  });

  it('confirms before replacing an existing key and cancellation leaves it unchanged', async () => {
    connections.set(
      'r1',
      connection('r1', {
        state: 'manual',
        connected: false,
        connection: 'none',
        reported: false,
        apps: [],
      }),
    );
    render(page('?section=ci&configure=1'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'ciSetup.manual.generate' }),
    );
    expect(
      await screen.findByRole('alertdialog', {
        name: 'ciSetup.key.confirmReplacement.title',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText('ciSetup.key.confirmReplacement.description'),
    ).toBeTruthy();
    expect(
      screen.getByText('ciSetup.key.confirmReplacement.lastUsed'),
    ).toBeTruthy();
    expect(revealed).toEqual([]);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'ciSetup.key.confirmReplacement.cancel',
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('alertdialog', {
          name: 'ciSetup.key.confirmReplacement.title',
        }),
      ).toBeNull(),
    );
    expect(revealed).toEqual([]);
  });

  it('replaces an existing key only after confirmation', async () => {
    connections.set(
      'r1',
      connection('r1', {
        state: 'manual',
        connected: false,
        connection: 'none',
        reported: false,
        apps: [],
      }),
    );
    render(page('?section=ci&configure=1'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'ciSetup.manual.generate' }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'ciSetup.key.confirmReplacement.confirm',
      }),
    );
    await screen.findByLabelText('ciSetup.manual.revealed.label');
    expect(revealed).toEqual([{ path: 'ci/setup', json: { reveal: true } }]);
  });

  it('generates a key directly when the repository has none', async () => {
    connections.set(
      'r1',
      connection('r1', {
        state: 'disabled',
        key: null,
        connected: false,
        connection: 'none',
        reported: false,
        apps: [],
      }),
    );
    render(page('?section=ci&configure=1'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'ciSetup.manual.generate' }),
    );
    await screen.findByLabelText('ciSetup.manual.revealed.label');
    expect(
      screen.queryByRole('alertdialog', {
        name: 'ciSetup.key.confirmReplacement.title',
      }),
    ).toBeNull();
    expect(revealed).toEqual([{ path: 'ci/setup', json: { reveal: true } }]);
  });

  it('confirms once, closes on success, and shows the rotated key once', async () => {
    connections.set('r1', connection('r1', { state: 'manual' }));
    render(page('?section=ci'));
    const actions = await screen.findByRole('button', {
      name: 'ciSetup.key.actions',
    });
    actions.focus();
    await userEvent.keyboard('{ArrowDown}');
    fireEvent.click(await screen.findByText('ciSetup.key.rotateReveal'));
    expect(
      await screen.findByRole('alertdialog', {
        name: 'ciSetup.key.confirmReplacement.title',
      }),
    ).toBeTruthy();
    expect(revealed).toEqual([]);
    const confirm = screen.getByRole('button', {
      name: 'ciSetup.key.confirmReplacement.confirm',
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    const secret = await screen.findByLabelText(
      'ciSetup.manual.revealed.label',
    );
    expect((secret as HTMLInputElement).value).toBe('nbk_secret_1');
    expect(revealed).toEqual([{ path: 'ci/rotate', json: { reveal: true } }]);
    expect(
      screen.queryByRole('alertdialog', {
        name: 'ciSetup.key.confirmReplacement.title',
      }),
    ).toBeNull();
  });

  it('keeps the replacement confirmation open after failure so it can be retried', async () => {
    failRevealRequests = 1;
    connections.set('r1', connection('r1', { state: 'manual' }));
    render(page('?section=ci'));
    const actions = await screen.findByRole('button', {
      name: 'ciSetup.key.actions',
    });
    actions.focus();
    await userEvent.keyboard('{ArrowDown}');
    fireEvent.click(await screen.findByText('ciSetup.key.rotateReveal'));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'ciSetup.key.confirmReplacement.confirm',
      }),
    );
    await screen.findByRole('alertdialog', {
      name: 'ciSetup.key.confirmReplacement.title',
    });
    expect(revealed).toEqual([{ path: 'ci/rotate', json: { reveal: true } }]);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'ciSetup.key.confirmReplacement.confirm',
      }),
    );
    await screen.findByLabelText('ciSetup.manual.revealed.label');
    expect(revealed).toHaveLength(2);
    expect(
      screen.queryByRole('alertdialog', {
        name: 'ciSetup.key.confirmReplacement.title',
      }),
    ).toBeNull();
  });

  it('shows every build, filtered by a row: pull requests’ Apps counting as their row', async () => {
    const build = (patch: Partial<BuildView>): BuildView => ({
      id: 'b',
      appId: 'shop',
      sha: 'a'.repeat(40),
      ref: null,
      pullRequest: false,
      state: 'succeeded',
      logsUrl: null,
      message: null,
      superseded: false,
      releaseId: null,
      uploadedAt: null,
      newVariables: null,
      reportedAt: '2026-10-06T00:00:00.000Z',
      updatedAt: '2026-10-06T00:00:00.000Z',
      ...patch,
    });
    builds.push(
      build({ id: 'b1', appId: 'shop-pr-3', pullRequest: true }),
      build({ id: 'b2', appId: 'admin-pr-4', pullRequest: true }),
      build({ id: 'b3', appId: 'shop', ref: 'v1.0.0', state: 'failed' }),
      build({ id: 'b4', appId: 'shop-staging', ref: 'main' }),
    );
    render(page('?section=ci'));
    const shown = () =>
      [...document.querySelectorAll('[data-ci-build]')].map((row) =>
        row.getAttribute('data-ci-build'),
      );
    await waitFor(() => expect(shown()).toEqual(['b1', 'b2', 'b3', 'b4']));
    await openRow('shop-pr-*');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'ciSetup.status.builds' }),
    );
    await waitFor(() => expect(shown()).toEqual(['b1']));
    await openRow('shop');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'ciSetup.status.builds' }),
    );
    await waitFor(() => expect(shown()).toEqual(['b3']));
  });
});
