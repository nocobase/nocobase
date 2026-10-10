/**
 * New project and its initialization in the browser. A new repository offers three ways to its first code, a NocoBase
 * application from create-app's default template first and chosen (which needs the init agent, says it needs a
 * runner with a link to Runtimes and that it waits while none is online, and has no Deploy step: Studio connects its
 * preview CI), a template repository picked from a lazily read list, searched, or typed as `owner/repo` and checked
 * first (said in words while loading, the reason and Retry on failure, a hint when there is none), and a prompt. Where it
 * is created is a read-only line naming the connection's account; with several connections the Git connection is asked
 * for first, the last one chosen preselected, and serves the template and an existing repository too. An existing
 * repository's list says which connection it comes from, with a link to authorize more on GitHub.
 *
 * A three-step wizard (basics, code, deploy) that sends one request
 * with a "Configure CI" run (`ci`) for the repository: its way and the applications it generates for, checked on
 * create, Studio writing the standard workflow by default, a file edited in place in a YAML editor, or an issue for the
 * project lead agent; a way done by hand shows the workflow, steps and commands (or the prompt) inline, never in a
 * dialog over the wizard's, and sends nothing. "Back" keeps what was entered and "Skip" sends no CI. A new repository's
 * prompt is optional, and the initialization agent is asked for only when a prompt initializes; a directory on a runner
 * or no code has no Deploy step; without a Git connection a new repository is not offered (one line in its card) and
 * only the ways done by hand are. The init issue's page shows the workflow run as a check with GitHub Actions as its
 * executor, and Run again for a failed one.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditorView } from '@codemirror/view';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@nocobase/app-client';

import { ciWorkflowPathOf, type CiTrigger } from '../../shared/ci-modes';
import { pickerAgent } from '../fixtures/picker-agents';
import type {
  GitConnectionChoice,
  GitRepoChoice,
  GitWorkflow,
} from '../../shared/git';
import type {
  NewProjectRequest,
  ProjectInitView,
} from '../../shared/project-init';

const git = {
  templateRepos:
    vi.fn<
      (
        connectionId: string,
        pageToken: string | null,
        query: string,
      ) => Promise<{ items: GitRepoChoice[]; nextPageToken: string | null }>
    >(),
  templateRepo:
    vi.fn<(connectionId: string, repo: string) => Promise<GitRepoChoice>>(),
  workflows: vi.fn<() => Promise<GitWorkflow[]>>(),
};
const init = {
  create: vi.fn<(input: NewProjectRequest) => Promise<unknown>>(),
  init: vi.fn<() => Promise<ProjectInitView | null>>(),
  retry: vi.fn<() => Promise<ProjectInitView>>(),
};
const agents = { options: [] as { value: string; label: string }[] };
const runners = { online: 1 };
const CONNECTION: GitConnectionChoice = {
  id: 'c1',
  provider: 'github',
  kind: 'app',
  name: 'Acme',
  account: 'acme',
  webUrl: 'https://github.com',
  demo: false,
  repositoryAccessUrl:
    'https://github.com/organizations/acme/settings/installations/77',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const OTHER: GitConnectionChoice = {
  ...CONNECTION,
  id: 'c2',
  name: 'Labs',
  account: 'acme-labs',
  createdAt: '2026-02-01T00:00:00.000Z',
};
const status = {
  enabled: true,
  connections: [CONNECTION] as GitConnectionChoice[],
};
const listed = { repos: true };
/** The connection each repository list was read through. */
const reposRead: (string | null)[] = [];
const request = vi.fn(
  (options: {
    path: string;
    json?: {
      app?: { appId: string };
      target?: { trigger: CiTrigger; environmentId: string };
    };
  }) => {
    if (options.path === 'repositoryDeployments/ciWorkflows/environments')
      return Promise.resolve({
        data: [
          {
            id: 'preview',
            name: 'Preview',
            protected: false,
          },
          {
            id: 'staging',
            name: 'Staging',
            protected: false,
          },
        ],
      });
    if (options.path === 'repositoryDeployments/ciWorkflows/generate')
      return Promise.resolve({
        data: [
          {
            path: ciWorkflowPathOf({
              appId: options.json?.app?.appId ?? 'app',
              trigger: options.json?.target?.trigger ?? 'pullRequest',
              environmentId: options.json?.target?.environmentId ?? 'preview',
            }),
            content: 'name: Studio\n',
          },
        ],
      });
    return Promise.reject(new Error(`Unexpected ${options.path}`));
  },
);

vi.mock('../../client/git/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/git/api')>()),
  useGitApi: () => git,
  useGitStatus: () => ({
    data: {
      enabled: status.enabled,
      canManage: true,
      connections: status.enabled ? status.connections : [],
    },
  }),
  useGitRepos: (connectionId: string | null) => ({
    isPending: !reposRead.push(connectionId),
    data: connectionId
      ? {
          items: !listed.repos
            ? []
            : [
                {
                  id: '42',
                  fullName: 'acme/shop',
                  owner: 'acme',
                  name: 'shop',
                  private: false,
                  defaultBranch: 'main',
                  cloneUrl: 'https://github.com/acme/shop.git',
                  webUrl: 'https://github.com/acme/shop',
                  description: null,
                  isTemplate: false,
                },
              ],
          nextPageToken: null,
        }
      : undefined,
  }),
}));
vi.mock('../../client/projects/init-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/projects/init-api')>()),
  ProjectInitApi: class {
    public create = init.create;
    public init = init.init;
    public retry = init.retry;
  },
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  useAgentOptions: () => ({
    loading: false,
    failed: false,
    options: agents.options,
    agents: agents.options.map((agent) =>
      pickerAgent(agent.value, agent.label),
    ),
    nameOf: (id: string) =>
      agents.options.find((agent) => agent.value === id)?.label ?? null,
  }),
  useRunnerOptions: () => ({
    loading: false,
    online: runners.online,
    options: [{ value: 'r1', label: 'Build box' }],
  }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  WorkflowSelect: ({ id }: { id: string }) => <select id={id} />,
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
  errorText: () => 'failed',
}));
vi.mock('@/components/route-dialog', () => ({
  RouteDialog: ({
    children,
    footer,
  }: {
    children: ReactNode;
    footer: ReactNode;
  }) => (
    <div>
      {children}
      <div>{footer}</div>
    </div>
  ),
}));
vi.mock('@/components/use-route-overlay', () => ({
  useRouteOverlay: () => ({ close: vi.fn() }),
}));

const { default: NewProjectPage } =
  await import('../../client/pages/projects/new/index');
const { IssueInitSection } = await import('../../client/projects/init-card');

const wrap = (ui: ReactElement) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const L = 'projectPage.newProject.labels';

// The repository search (cmdk) measures its list.
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

/** Picks an option of a shadcn Select by its trigger's label. */
/** Picks an agent in an agent picker, whose menu lists it with its availability. */
async function chooseAgent(label: string, name: string) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(
    await screen.findByRole('menuitem', { name: new RegExp(name, 'u') }),
  );
}

async function choose(label: string, option: string) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(await screen.findByRole('option', { name: option }));
}

/** Picks an option of a select that has a value already, which takes the full press. */
async function pickOption(label: string, option: string) {
  fireEvent.click(screen.getByLabelText(label));
  const found = await screen.findByRole('option', {
    name: new RegExp(`^${option}`, 'u'),
  });
  fireEvent.pointerDown(found, { pointerType: 'mouse' });
  fireEvent.pointerUp(found, { pointerType: 'mouse' });
  fireEvent.mouseUp(found);
  fireEvent.click(found);
}

const next = () =>
  fireEvent.click(
    screen.getByRole('button', { name: 'projectPage.newProject.next' }),
  );
const create = () => screen.getByRole('button', { name: `${L}.create` });
const step = () =>
  document
    .querySelector('[data-wizard-steps] [aria-current="step"]')
    ?.getAttribute('data-wizard-step');
/** The application's directory and App ID. */
const appInputs = () =>
  [
    screen.getByLabelText('ciSetup.app.directory'),
    screen.getByLabelText('ciSetup.app.appId'),
  ] as HTMLInputElement[];
/** Pull requests to Preview, unless a run names another target. */
const PULL_REQUESTS = {
  trigger: 'pullRequest',
  ref: null,
  environmentId: 'preview',
};
/** A way's radio in "Configure CI". */
const radio = (method: string) =>
  document.querySelector(
    `[data-ci-method="${method}"] [data-slot="radio-group-item"]`,
  );
/** Chooses a way of "Configure CI". */
const chooseMethod = (method: string) =>
  fireEvent.click(screen.getByText(`ciSetup.methods.${method}.title`));

/** The code location whose card is checked. */
const checkedLocation = () =>
  document
    .querySelector(
      '[data-choice]:has([data-slot="radio-group-item"][data-checked])',
    )
    ?.getAttribute('data-choice');

/** Basics, then an existing repository picked through the connection, then Next to Deploy. */
async function toDeploy(name = 'Shop') {
  fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
    target: { value: name },
  });
  next();
  fireEvent.click(screen.getByText(`${L}.locations.existingRepo.title`));
  fireEvent.click(await screen.findByText('acme/shop'));
  next();
  await waitFor(() => expect(step()).toBe('deploy'));
}

const TEMPLATE: GitRepoChoice = {
  id: '1',
  fullName: 'acme/app-template',
  owner: 'acme',
  name: 'app-template',
  private: false,
  defaultBranch: 'main',
  cloneUrl: 'https://github.com/acme/app-template.git',
  webUrl: 'https://github.com/acme/app-template',
  description: 'A NocoBase app',
  isTemplate: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  reposRead.length = 0;
  agents.options = [];
  runners.online = 1;
  listed.repos = true;
  status.enabled = true;
  status.connections = [CONNECTION];
  git.templateRepo.mockRejectedValue(new Error('not asked for'));
  git.templateRepos.mockResolvedValue({
    items: [
      {
        id: '1',
        fullName: 'acme/app-template',
        owner: 'acme',
        name: 'app-template',
        private: false,
        defaultBranch: 'main',
        cloneUrl: 'https://github.com/acme/app-template.git',
        webUrl: 'https://github.com/acme/app-template',
        description: 'A NocoBase app',
        isTemplate: true,
      },
    ],
    nextPageToken: null,
  });
  git.workflows.mockResolvedValue([
    {
      id: '10',
      name: 'CI',
      path: '.github/workflows/ci.yml',
      state: 'active',
      htmlUrl: null,
    },
    {
      id: '11',
      name: 'Initialize',
      path: '.github/workflows/nb-studio-init.yml',
      state: 'active',
      htmlUrl: null,
    },
  ]);
  init.create.mockResolvedValue({
    projectId: 'p1',
    resourceId: 'r1',
    repo: null,
    initIssueId: 'i1',
    initIssueIdentifier: 'PM-1',
    init: null,
  });
});

describe('the New project wizard', () => {
  it('generates a new repository from a template in three steps, its preview CI written by Studio', async () => {
    render(wrap(<NewProjectPage />));
    expect(step()).toBe('basics');
    expect(
      screen
        .getByRole('button', { name: 'projectPage.newProject.next' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.getByText(`${L}.incomplete.name`)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Shop' },
    });
    next();
    expect(step()).toBe('code');
    // The short name is set when a working directory is edited, not here.
    expect(
      screen.queryByLabelText('projectPage.codeLocation.label'),
    ).toBeNull();
    fireEvent.click(screen.getByText(`${L}.locations.newRepo.title`));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.repoName'), {
      target: { value: 'shop' },
    });
    fireEvent.click(screen.getByText(`${L}.initMethods.template.title`));
    fireEvent.click(await screen.findByText('acme/app-template'));
    await waitFor(() =>
      expect(
        document
          .querySelector('[data-init-workflow]')
          ?.getAttribute('data-init-workflow'),
      ).toBe('.github/workflows/nb-studio-init.yml'),
    );
    next();
    expect(step()).toBe('deploy');
    // One application at the root, named after the repository, for pull requests; Studio writes its workflow by default.
    expect(appInputs().map((input) => input.value)).toEqual(['.', 'shop']);
    expect(
      document
        .querySelector(
          '[data-ci-trigger="pullRequest"] [data-slot="radio-group-item"]',
        )
        ?.hasAttribute('data-checked'),
    ).toBe(true);
    expect(radio('direct')?.hasAttribute('data-checked')).toBe(true);
    // Inline in the wizard's dialog, never a dialog of its own.
    expect(document.querySelector('[data-ci-configure]')).not.toBeNull();
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    const sent = init.create.mock.calls[0]?.[0] as NewProjectRequest;
    expect(sent).toMatchObject({
      name: 'Shop',
      codeLocation: 'newRepo',
      newRepo: {
        connectionId: 'c1',
        name: 'shop',
        private: true,
        init: {
          method: 'template',
          templateRepo: 'acme/app-template',
          workflow: { id: '11', path: '.github/workflows/nb-studio-init.yml' },
        },
      },
      ci: {
        method: 'direct',
        app: { directory: '.', appId: 'shop' },
        target: PULL_REQUESTS,
      },
    });
    expect(sent).not.toHaveProperty('deploy');
    expect(sent).not.toHaveProperty('label');
  });

  it('goes back keeping what was entered, and skips connecting the CI', async () => {
    render(wrap(<NewProjectPage />));
    await toDeploy();
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.newProject.back' }),
    );
    expect(step()).toBe('code');
    next();
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.newProject.skip' }),
    );
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    const sent = init.create.mock.calls[0]?.[0] as NewProjectRequest;
    expect(sent).toMatchObject({
      name: 'Shop',
      existingRepo: { fullName: 'acme/shop', defaultBranch: 'main' },
    });
    expect(sent).not.toHaveProperty('ci');
  });

  it('connects one application to the trigger and environment chosen, checked on create', async () => {
    render(wrap(<NewProjectPage />));
    await toDeploy();
    fireEvent.change(appInputs()[0]!, { target: { value: '../admin' } });
    fireEvent.click(create());
    expect(
      await screen.findByText('ciSetup.app.errors.directory'),
    ).toBeTruthy();
    expect(init.create).not.toHaveBeenCalled();
    // The App ID follows the directory and the target: a branch deploys `<base>-staging` in staging.
    fireEvent.change(appInputs()[0]!, { target: { value: 'apps/admin/' } });
    await waitFor(() => expect(appInputs()[1]!.value).toBe('admin'));
    fireEvent.click(screen.getByText('ciSetup.trigger.branch.title'));
    await waitFor(() => expect(appInputs()[1]!.value).toBe('admin-staging'));
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toMatchObject({
      ci: {
        method: 'direct',
        app: { directory: 'apps/admin', appId: 'admin-staging' },
        target: { trigger: 'branch', ref: 'main', environmentId: 'staging' },
      },
    });
  });

  it('edits the template in place, in a YAML editor, without a dialog over the wizard', async () => {
    render(wrap(<NewProjectPage />));
    await toDeploy();
    chooseMethod('template');
    const editor = await screen.findByLabelText(
      '.github/workflows/nb-studio-shop-preview.yml',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    const view = EditorView.findFromDOM(editor)!;
    expect(view.state.doc.toString()).toBe('name: Studio\n');
    // Highlighted and numbered.
    expect(
      editor.closest('.cm-editor')?.querySelector('.cm-lineNumbers'),
    ).not.toBeNull();
    act(() =>
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: 'name: Mine\n' },
      }),
    );
    expect(await screen.findByText(/ciSetup\.workflow\.changed/u)).toBeTruthy();
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toMatchObject({
      ci: {
        method: 'template',
        app: { directory: '.', appId: 'shop' },
        target: PULL_REQUESTS,
        workflowFiles: [
          {
            path: '.github/workflows/nb-studio-shop-preview.yml',
            content: 'name: Mine\n',
          },
        ],
      },
    });
  });

  it('shows the workflow, steps and commands, or an own agent’s prompt, inline, and sends nothing for them', async () => {
    render(wrap(<NewProjectPage />));
    await toDeploy();
    chooseMethod('manual');
    expect(
      await screen.findByLabelText(
        '.github/workflows/nb-studio-shop-preview.yml',
      ),
    ).toBeTruthy();
    expect(document.querySelector('[data-ci-manual-steps]')).not.toBeNull();
    // No repository yet: the key is generated once the project exists.
    expect(
      document.querySelector('[data-ci-manual-steps]')?.textContent,
    ).toContain('ciSetup.manual.steps.keyLater');
    expect(document.querySelector('[data-ci-generate-key]')).toBeNull();
    // The CLI reads the repository from CI: nothing stands in for it before it exists.
    expect(document.querySelector('[data-ci-commands]')?.textContent).toContain(
      'nb-studio deploy --app "shop-pr-$PR" --file storage/exports/dist.tar.gz',
    );
    // The file is generated as one added by hand.
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          app: { directory: '.', appId: 'shop' },
          target: PULL_REQUESTS,
          managed: false,
        }),
      }),
    );
    chooseMethod('ownAgent');
    const prompt = await screen.findByLabelText('ciSetup.ownAgent.title');
    expect(prompt.textContent).toContain('nb-studio-shop-preview.yml');
    expect(prompt.textContent).toContain(
      'nb-studio app ensure "shop-pr-$PR" --environment preview',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).not.toHaveProperty('ci');
  });

  it('hands it to the senior developer agent unless another is chosen', async () => {
    // The project lead coordinates and opens no pull requests, so it is not the default even when listed first.
    agents.options = [
      { value: 'a1', label: 'Coder' },
      { value: 'studio-project-lead', label: 'Project lead' },
      { value: 'studio-senior-developer', label: 'Senior developer' },
    ];
    render(wrap(<NewProjectPage />));
    await toDeploy();
    expect(screen.queryByLabelText('ciSetup.agent.label')).toBeNull();
    chooseMethod('agent');
    await waitFor(() =>
      expect(
        screen.getByLabelText('ciSetup.agent.label').textContent,
      ).toContain('Senior developer'),
    );
    // The agent picker as a form field, with the agent's availability.
    expect(screen.getByLabelText('ciSetup.agent.label')).toHaveAttribute(
      'data-appearance',
      'field',
    );
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toMatchObject({
      ci: {
        method: 'agent',
        app: { appId: 'shop' },
        target: PULL_REQUESTS,
        agentId: 'studio-senior-developer',
      },
    });
  });

  it('creates a new repository with just an initial commit when the prompt is left empty', async () => {
    agents.options = [{ value: 'a1', label: 'Coder' }];
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Shop' },
    });
    next();
    fireEvent.click(screen.getByText(`${L}.locations.newRepo.title`));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.repoName'), {
      target: { value: 'shop' },
    });
    fireEvent.click(screen.getByText(`${L}.initMethods.prompt.title`));
    // No prompt: nothing initializes, so no agent is asked for.
    expect(
      screen.queryByLabelText('projectPage.newProject.initAgent'),
    ).toBeNull();
    const forward = screen.getByRole('button', {
      name: 'projectPage.newProject.next',
    });
    expect(forward.hasAttribute('disabled')).toBe(false);
    next();
    // The environments a run may deploy to load first.
    await waitFor(() =>
      expect(document.getElementById('ci-environment')).not.toBeNull(),
    );
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    const sent = init.create.mock.calls[0]?.[0] as NewProjectRequest;
    expect(sent).toMatchObject({
      codeLocation: 'newRepo',
      newRepo: { init: { method: 'prompt', prompt: '' } },
    });
    expect(sent).not.toHaveProperty('initAgentId');
  });

  it('asks for the initialization agent when an empty repository is initialized from a prompt', async () => {
    agents.options = [{ value: 'a1', label: 'Coder' }];
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Shop' },
    });
    next();
    fireEvent.click(screen.getByText(`${L}.locations.newRepo.title`));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.repoName'), {
      target: { value: 'shop' },
    });
    fireEvent.click(screen.getByText(`${L}.initMethods.prompt.title`));
    // No prompt yet: nothing initializes, so no agent is asked for.
    expect(
      screen.queryByLabelText('projectPage.newProject.initAgent'),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText(`${L}.prompt.label`), {
      target: { value: 'A shop' },
    });
    const forward = screen.getByRole('button', {
      name: 'projectPage.newProject.next',
    });
    expect(forward.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(`${L}.incomplete.initAgent`)).toBeTruthy();
    await chooseAgent('projectPage.newProject.initAgent', 'Coder');
    await waitFor(() => expect(forward.hasAttribute('disabled')).toBe(false));
    next();
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toMatchObject({
      initAgentId: 'a1',
      codeLocation: 'newRepo',
      newRepo: { init: { method: 'prompt', prompt: 'A shop' } },
    });
  });

  it('creates a project on a runner’s directory from the second step, with no Deploy step', async () => {
    agents.options = [{ value: 'a1', label: 'Coder' }];
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Local' },
    });
    next();
    fireEvent.click(screen.getByText(`${L}.locations.runnerDirectory.title`));
    expect(document.querySelector('[data-wizard-step="deploy"]')).toBeNull();
    const path = screen.getByLabelText('projectPage.newProject.path');
    expect(path.hasAttribute('disabled')).toBe(true);
    await choose('projectPage.newProject.runner', 'Build box');
    await waitFor(() => expect(path.hasAttribute('disabled')).toBe(false));
    fireEvent.change(path, { target: { value: '/srv/app' } });
    expect(create().hasAttribute('disabled')).toBe(false);
    fireEvent.change(screen.getByLabelText(`${L}.prompt.optionalLabel`), {
      target: { value: 'Install the dependencies.' },
    });
    expect(create().hasAttribute('disabled')).toBe(true);
    await chooseAgent('projectPage.newProject.initAgent', 'Coder');
    await waitFor(() => expect(create().hasAttribute('disabled')).toBe(false));
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toEqual({
      name: 'Local',
      workflowId: null,
      initAgentId: 'a1',
      codeLocation: 'runnerDirectory',
      runnerDirectory: {
        runnerId: 'r1',
        path: '/srv/app',
        initPrompt: 'Install the dependencies.',
      },
    });
  });

  it('requires an init agent for a local NocoBase 3 app and excludes a previously typed prompt', async () => {
    agents.options = [{ value: 'a1', label: 'Coder' }];
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Local NocoBase' },
    });
    next();
    fireEvent.click(screen.getByText(`${L}.locations.runnerDirectory.title`));
    await choose('projectPage.newProject.runner', 'Build box');
    fireEvent.change(screen.getByLabelText('projectPage.newProject.path'), {
      target: { value: '/srv/support' },
    });
    fireEvent.change(screen.getByLabelText(`${L}.prompt.optionalLabel`), {
      target: { value: 'Custom initialization' },
    });
    fireEvent.click(
      screen.getByRole('switch', {
        name: 'projectPage.codeLocation.directoryNocobase',
      }),
    );
    expect(screen.queryByLabelText(`${L}.prompt.optionalLabel`)).toBeNull();
    expect(
      screen.getByText('projectPage.codeLocation.directoryNocobaseHint'),
    ).toBeTruthy();
    expect(create().hasAttribute('disabled')).toBe(true);
    await chooseAgent('projectPage.newProject.initAgent', 'Coder');
    await waitFor(() => expect(create().hasAttribute('disabled')).toBe(false));
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toEqual({
      name: 'Local NocoBase',
      workflowId: null,
      initAgentId: 'a1',
      codeLocation: 'runnerDirectory',
      runnerDirectory: {
        runnerId: 'r1',
        path: '/srv/support',
        init: { method: 'nocobase', template: 'default' },
      },
    });
  });

  it('starts the code step on the first location available, keeping the person’s choice', async () => {
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Shop' },
    });
    next();
    // With a connection, a new repository.
    await waitFor(() => expect(checkedLocation()).toBe('newRepo'));
    expect(
      screen.getByLabelText('projectPage.newProject.repoName'),
    ).toBeTruthy();
    fireEvent.click(screen.getByText(`${L}.locations.runnerDirectory.title`));
    expect(checkedLocation()).toBe('runnerDirectory');
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.newProject.back' }),
    );
    next();
    expect(checkedLocation()).toBe('runnerDirectory');
  });

  it('starts on an existing repository when no connection can create one', async () => {
    status.enabled = false;
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Site' },
    });
    next();
    expect(checkedLocation()).toBe('existingRepo');
    expect(
      screen.getByLabelText('projectPage.codeLocation.cloneUrl'),
    ).toBeTruthy();
  });

  it('creates a blank project with no code, once it has a name', async () => {
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Notes' },
    });
    next();
    fireEvent.click(screen.getByText(`${L}.locations.none.title`));
    expect(
      screen.queryByLabelText('projectPage.newProject.repoName'),
    ).toBeNull();
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toEqual({
      name: 'Notes',
      workflowId: null,
      codeLocation: 'none',
    });
  });

  it('honours git.enabled: no new repository and only the manual CI modes without a connection', async () => {
    status.enabled = false;
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Site' },
    });
    next();
    // One line in the card it disables; what a connection allows is said under the cards.
    expect(
      document.querySelector('[data-choice-unavailable="newRepo"]')
        ?.textContent,
    ).toBe('projectPage.newProject.noGit projectPage.newProject.connect');
    expect(
      document.querySelector('[data-choice-description]')?.textContent,
    ).toContain('projectPage.newProject.noGitTemplates');
    fireEvent.click(screen.getByText(`${L}.locations.existingRepo.title`));
    expect(document.querySelector('[data-repository-picker]')).toBeNull();
    fireEvent.change(
      screen.getByLabelText('projectPage.codeLocation.cloneUrl'),
      { target: { value: 'https://git.example.com/team/site.git' } },
    );
    fireEvent.change(
      screen.getByLabelText('projectPage.codeLocation.defaultBranch'),
      { target: { value: 'trunk' } },
    );
    next();
    expect(document.querySelector('[data-ci-auto-unavailable]')).not.toBeNull();
    expect(radio('manual')?.hasAttribute('data-checked')).toBe(true);
    for (const method of ['direct', 'template', 'agent'])
      expect(radio(method)?.hasAttribute('data-disabled')).toBe(true);
    // Its application is named after the repository the clone URL names.
    expect(appInputs().map((input) => input.value)).toEqual(['.', 'site']);
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toMatchObject({
      codeLocation: 'existingRepo',
      existingRepo: {
        cloneUrl: 'https://git.example.com/team/site.git',
        defaultBranch: 'trunk',
      },
    });
    // Done by hand: nothing is sent.
    expect(init.create.mock.calls[0]?.[0]).not.toHaveProperty('ci');
    expect(
      (init.create.mock.calls[0]?.[0] as NewProjectRequest).existingRepo,
    ).not.toHaveProperty('connectionId');
  });
});

/** Basics, then the code step with a new repository named `shop`. */
async function toNewRepo() {
  render(wrap(<NewProjectPage />));
  fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
    target: { value: 'Shop' },
  });
  next();
  await waitFor(() => expect(checkedLocation()).toBe('newRepo'));
  fireEvent.change(screen.getByLabelText('projectPage.newProject.repoName'), {
    target: { value: 'shop' },
  });
}

/** The way to a new repository's first code whose card is checked. */
const checkedMethod = () =>
  document
    .querySelector(
      '[data-choice-panel="newRepo"] [data-choice]:has([data-slot="radio-group-item"][data-checked])',
    )
    ?.getAttribute('data-choice');

const typeTemplate = (value: string) =>
  fireEvent.change(screen.getByLabelText(`${L}.templateRepos.search`), {
    target: { value },
  });

describe('a new repository’s first code', () => {
  it('offers three ways side by side, a NocoBase application first and chosen, scaffolded by the init agent with its CI', async () => {
    agents.options = [{ value: 'a1', label: 'Coder' }];
    await toNewRepo();
    expect(
      [
        ...document.querySelectorAll(
          '[data-choice-panel="newRepo"] [data-choice]',
        ),
      ].map((card) => card.getAttribute('data-choice')),
    ).toEqual(['nocobase', 'template', 'prompt']);
    expect(checkedMethod()).toBe('nocobase');
    // It needs a runner, with where runners are added, and says Studio connects its preview CI.
    const panel = document.querySelector('[data-nocobase-app]');
    expect(panel?.textContent).toContain(`${L}.nocobase.runnerNeeded`);
    expect(panel?.textContent).toContain(`${L}.nocobase.ci`);
    expect(
      screen
        .getByRole('link', { name: `${L}.nocobase.runtimesLink` })
        .getAttribute('href'),
    ).toBe('/runtimes');
    expect(document.querySelector('[data-nocobase-no-runner]')).toBeNull();
    // Its initialization is an agent's: one is asked for, and the project is created from this step.
    expect(screen.getByText(`${L}.incomplete.initAgent`)).toBeTruthy();
    expect(document.querySelector('[data-wizard-step="deploy"]')).toBeNull();
    await chooseAgent('projectPage.newProject.initAgent', 'Coder');
    await waitFor(() => expect(create().hasAttribute('disabled')).toBe(false));
    fireEvent.click(create());
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    const sent = init.create.mock.calls[0]?.[0] as NewProjectRequest;
    expect(sent).toMatchObject({
      initAgentId: 'a1',
      codeLocation: 'newRepo',
      newRepo: {
        connectionId: 'c1',
        name: 'shop',
        private: true,
        init: { method: 'nocobase', template: 'default' },
      },
    });
    // The CI is the server's to connect, and the installation decides the owner.
    expect(sent).not.toHaveProperty('ci');
    expect(sent.newRepo).not.toHaveProperty('owner');
    expect(git.templateRepos).not.toHaveBeenCalled();
  });

  it('still creates it while no runner is online, saying its initialization waits', async () => {
    runners.online = 0;
    agents.options = [{ value: 'a1', label: 'Coder' }];
    await toNewRepo();
    expect(
      document.querySelector('[data-nocobase-no-runner]')?.textContent,
    ).toBe(`${L}.nocobase.noRunnerOnline`);
    await chooseAgent('projectPage.newProject.initAgent', 'Coder');
    await waitFor(() => expect(create().hasAttribute('disabled')).toBe(false));
  });

  it('says where the repository is created as a line, with no connection to choose when there is one', async () => {
    await toNewRepo();
    expect(
      document
        .querySelector('[data-repo-owner]')
        ?.getAttribute('data-repo-owner'),
    ).toBe('acme');
    expect(screen.getByText('projectPage.newProject.ownerFrom')).toBeTruthy();
    expect(screen.queryByLabelText('projectPage.newProject.owner')).toBeNull();
    expect(
      screen.queryByLabelText('projectPage.newProject.gitConnection'),
    ).toBeNull();
    expect(document.querySelector('[data-git-connection]')).toBeNull();
  });

  it('asks for the Git connection first when there are several, for the template and an existing repository too, and remembers it', async () => {
    status.connections = [CONNECTION, OTHER];
    await toNewRepo();
    expect(
      document
        .querySelector('[data-git-connection]')
        ?.getAttribute('data-git-connection'),
    ).toBe('c1');
    await pickOption('projectPage.newProject.gitConnection', 'Labs');
    await waitFor(() =>
      expect(
        document
          .querySelector('[data-repo-owner]')
          ?.getAttribute('data-repo-owner'),
      ).toBe('acme-labs'),
    );
    expect(screen.getByText('projectPage.newProject.ownerFrom')).toBeTruthy();
    // Its template repositories are the chosen connection's.
    fireEvent.click(screen.getByText(`${L}.initMethods.template.title`));
    await screen.findByText('acme/app-template');
    expect(git.templateRepos).toHaveBeenCalledWith(
      'c2',
      null,
      '',
      expect.anything(),
    );
    // An existing repository is searched through it, with no choice of its own.
    fireEvent.click(screen.getByText(`${L}.locations.existingRepo.title`));
    expect(
      document
        .querySelector('[data-git-connection]')
        ?.getAttribute('data-git-connection'),
    ).toBe('c2');
    expect(screen.queryByLabelText('studioGit.picker.connection')).toBeNull();
    expect(reposRead.at(-1)).toBe('c2');
    // The next form starts on it.
    cleanup();
    await toNewRepo();
    expect(
      document
        .querySelector('[data-git-connection]')
        ?.getAttribute('data-git-connection'),
    ).toBe('c2');
  });

  it('lists the connections oldest first and starts on the oldest, whatever order they arrive in', async () => {
    status.connections = [OTHER, CONNECTION];
    await toNewRepo();
    expect(
      document
        .querySelector('[data-git-connection]')
        ?.getAttribute('data-git-connection'),
    ).toBe('c1');
    fireEvent.click(
      screen.getByLabelText('projectPage.newProject.gitConnection'),
    );
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      expect.stringMatching(/^Acme/u),
      expect.stringMatching(/^Labs/u),
    ]);
  });

  it('reads the template repositories when that way is chosen, saying it loads, then the list', async () => {
    let answer: (page: {
      items: GitRepoChoice[];
      nextPageToken: null;
    }) => void = () => undefined;
    git.templateRepos.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    await toNewRepo();
    fireEvent.click(screen.getByText(`${L}.initMethods.template.title`));
    // Said in words, as a status: skeleton rows do not show on the muted panel.
    const loading = screen.getByText(`${L}.templateRepos.loading`);
    expect(loading.closest('[role="status"]')).toBe(
      document.querySelector('[data-template-loading]'),
    );
    await act(async () => {
      answer({ items: [TEMPLATE], nextPageToken: null });
      await Promise.resolve();
    });
    expect(await screen.findByText('acme/app-template')).toBeTruthy();
    expect(document.querySelector('[data-template-loading]')).toBeNull();
    expect(git.templateRepos).toHaveBeenCalledWith(
      'c1',
      null,
      '',
      expect.anything(),
    );
  });

  it('says why the list could not be read, and reads it again on Retry', async () => {
    git.templateRepos.mockRejectedValueOnce(new Error('down'));
    await toNewRepo();
    fireEvent.click(screen.getByText(`${L}.initMethods.template.title`));
    const error = await waitFor(() => {
      const found = document.querySelector('[data-template-error]');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(error.textContent).toContain(`${L}.templateRepos.loadFailed`);
    fireEvent.click(
      screen.getByRole('button', { name: `${L}.templateRepos.retry` }),
    );
    expect(await screen.findByText('acme/app-template')).toBeTruthy();
    expect(git.templateRepos).toHaveBeenCalledTimes(2);
  });

  it('reads on while a page of the host’s held no template, and says owner/repo may be typed when there is none', async () => {
    git.templateRepos
      .mockResolvedValueOnce({ items: [], nextPageToken: '2' })
      .mockResolvedValueOnce({ items: [], nextPageToken: null });
    await toNewRepo();
    fireEvent.click(screen.getByText(`${L}.initMethods.template.title`));
    expect(
      (await screen.findByText(`${L}.templateRepos.empty`)).textContent,
    ).toBe(`${L}.templateRepos.empty`);
    expect(git.templateRepos).toHaveBeenNthCalledWith(
      2,
      'c1',
      '2',
      '',
      expect.anything(),
    );
  });

  it('takes any template typed as owner/repo once the host says it is one', async () => {
    git.templateRepo.mockImplementation((_connection, repo) =>
      repo === 'nocobase/starter'
        ? Promise.resolve({
            ...TEMPLATE,
            id: '9',
            fullName: 'nocobase/starter',
            owner: 'nocobase',
            name: 'starter',
          })
        : Promise.reject(
            new ApiClientError('Not a template.', {
              status: 400,
              reason: 'NOT_A_TEMPLATE_REPO',
            }),
          ),
    );
    await toNewRepo();
    fireEvent.click(screen.getByText(`${L}.initMethods.template.title`));
    await screen.findByText('acme/app-template');
    typeTemplate('acme/web');
    expect(
      await screen.findByText(`${L}.templateRepos.notTemplate`),
    ).toBeTruthy();
    typeTemplate('nocobase/starter');
    const use = await screen.findByText(`${L}.templateRepos.useTyped`);
    fireEvent.click(use);
    await waitFor(() =>
      expect(
        document
          .querySelector('[data-template-repo]')
          ?.getAttribute('data-template-repo'),
      ).toBe('nocobase/starter'),
    );
    expect(git.templateRepo).toHaveBeenCalledWith(
      'c1',
      'nocobase/starter',
      expect.anything(),
    );
    await waitFor(() =>
      expect(document.querySelector('[data-init-workflow]')).not.toBeNull(),
    );
    next();
    expect(step()).toBe('deploy');
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.newProject.skip' }),
    );
    await waitFor(() => expect(init.create).toHaveBeenCalledOnce());
    expect(init.create.mock.calls[0]?.[0]).toMatchObject({
      newRepo: {
        init: { method: 'template', templateRepo: 'nocobase/starter' },
      },
    });
  });
});

describe('an existing repository', () => {
  it('says which connection lists it, with where to authorize more on GitHub, also when a search finds none', async () => {
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Shop' },
    });
    next();
    fireEvent.click(screen.getByText(`${L}.locations.existingRepo.title`));
    expect(
      document.querySelector('[data-repository-source]')?.textContent,
    ).toContain('studioGit.picker.source');
    const links = [
      ...document.querySelectorAll('[data-repository-access]'),
    ].map((link) => link.getAttribute('href'));
    expect(links).toEqual([CONNECTION.repositoryAccessUrl]);
    cleanup();
    listed.repos = false;
    render(wrap(<NewProjectPage />));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Shop' },
    });
    next();
    fireEvent.click(screen.getByText(`${L}.locations.existingRepo.title`));
    expect(await screen.findByText('studioGit.picker.notListed')).toBeTruthy();
    expect(document.querySelectorAll('[data-repository-access]')).toHaveLength(
      2,
    );
  });
});

const view = (overrides: Partial<ProjectInitView> = {}): ProjectInitView => ({
  projectId: 'p1',
  method: 'template',
  state: 'failed',
  repo: {
    fullName: 'acme/shop',
    url: 'https://github.com/acme/shop',
    defaultBranch: 'main',
  },
  firstCommit: false,
  templateRepo: 'acme/app-template',
  appTemplate: null,
  workflow: {
    id: '11',
    path: '.github/workflows/nb-studio-init.yml',
    name: 'Initialize',
  },
  run: {
    id: '900',
    name: 'Initialize',
    status: 'completed',
    conclusion: 'failure',
    url: 'https://github.com/acme/shop/actions/runs/900',
    attempt: 1,
  },
  agentId: null,
  waitingForRunner: false,
  issueId: 'i1',
  runSucceeded: false,
  pushed: false,
  error: 'The workflow failed.',
  branchProtected: null,
  completedAt: null,
  canRetry: true,
  ...overrides,
});

describe('the init issue’s page', () => {
  it('shows the workflow run as a check run by GitHub Actions, and runs a failed one again', async () => {
    init.init.mockResolvedValue(view());
    init.retry.mockResolvedValue(view({ state: 'running', canRetry: false }));
    render(wrap(<IssueInitSection issue={{ id: 'i1', projectId: 'p1' }} />));
    expect(
      await screen.findByText('projectPage.init.executor.actions'),
    ).toBeTruthy();
    const check = document.querySelector('[data-check="Initialize"]');
    expect(check?.textContent).toContain('studioGit.check.failure');
    expect(check?.querySelector('a')?.getAttribute('href')).toBe(
      'https://github.com/acme/shop/actions/runs/900',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.init.retry' }),
    );
    await waitFor(() => expect(init.retry).toHaveBeenCalledOnce());
    expect(
      await screen.findByText('projectPage.init.states.running'),
    ).toBeTruthy();
  });

  it('shows a NocoBase application’s template, and that it waits for a runner', async () => {
    init.init.mockResolvedValue(
      view({
        method: 'prompt',
        state: 'pending',
        firstCommit: true,
        templateRepo: null,
        appTemplate: 'default',
        workflow: null,
        run: null,
        agentId: 'a1',
        waitingForRunner: true,
        error: null,
        canRetry: false,
      }),
    );
    render(wrap(<IssueInitSection issue={{ id: 'i1', projectId: 'p1' }} />));
    expect(
      await screen.findByText('projectPage.init.executor.agent'),
    ).toBeTruthy();
    expect(screen.getByText('default')).toBeTruthy();
    expect(
      document.querySelector('[data-init-waiting-runner]')?.textContent,
    ).toBe('projectPage.init.waitingForRunner');
  });

  it('shows nothing on another issue of the project', async () => {
    init.init.mockResolvedValue(view());
    const { container } = render(
      wrap(<IssueInitSection issue={{ id: 'i2', projectId: 'p1' }} />),
    );
    await waitFor(() => expect(init.init).toHaveBeenCalled());
    expect(container.querySelector('[data-project-init]')).toBeNull();
  });
});
