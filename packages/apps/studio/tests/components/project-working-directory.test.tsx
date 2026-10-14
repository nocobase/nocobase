/**
 * A project's working directory dialog in Settings. Adding one is the New project wizard's choice, the same options in
 * the same order without "none" (`projects/code-location`): an existing repository searched through a Git connection,
 * with no way to create one from inside the search, or given by its clone URL and default branch without a connection;
 * a new GitHub repository, created by the server only when Add is pressed, a NocoBase application by default (whose
 * preview CI comes with it, so nothing opens after), from a template repository or a prompt; or a directory on a runner
 * picked by name before its path. Everything goes in one request, then a repository's "Deployment" opens. Without a connection, the
 * new repository's card says why inside it in one line, with where to connect one. Editing an existing one shows its
 * current value with its kind fixed and its short name, and the project's Issues tab offers the Agent queue first,
 * narrowed to the project.
 */
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultProjectDetailLabels } from '../../client/extensions/nocobase-project-detail/labels';
import type { ResourceFormValues } from '../../client/extensions/nocobase-project-detail/project-settings';
import { pickerAgent } from '../fixtures/picker-agents';
import type { GitConnectionChoice } from '../../shared/git';
import type { AddCodeLocationRequest } from '../../shared/project-init';

const repos = {
  items: [
    {
      id: '42',
      fullName: 'acme/app',
      owner: 'acme',
      name: 'app',
      private: true,
      defaultBranch: 'main',
      cloneUrl: 'https://github.com/acme/app.git',
      webUrl: 'https://github.com/acme/app',
      description: null,
      isTemplate: false,
    },
  ],
  nextPageToken: null,
};
const connection: GitConnectionChoice = {
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
const labsConnection: GitConnectionChoice = {
  ...connection,
  id: 'c2',
  kind: 'token',
  name: 'Labs',
  account: 'acme-labs',
  createdAt: '2026-02-01T00:00:00.000Z',
};
const status = {
  enabled: true,
  connections: [connection] as GitConnectionChoice[],
};
/** The connection each repository list was read through. */
const reposRead: (string | null)[] = [];
const git = {
  createRepo: vi.fn(),
  templateRepos: vi.fn(() =>
    Promise.resolve({ items: [], nextPageToken: null }),
  ),
  workflows: vi.fn(() => Promise.resolve([])),
};
const addCodeLocation =
  vi.fn<
    (projectId: string, input: AddCodeLocationRequest) => Promise<unknown>
  >();
const request = vi.fn((options: { path: string }) =>
  Promise.reject(new Error(`Unexpected ${options.path}`)),
);
const issuesView = vi.fn<(props: Record<string, unknown>) => null>(() => null);
const agentBoard = vi.fn<(query: Record<string, string>) => unknown>(() => ({
  data: undefined,
  isError: false,
}));

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
  useGitRepos: (connectionId: string | null) =>
    reposRead.push(connectionId) && connectionId
      ? { isPending: false, data: repos }
      : { isPending: false, data: undefined },
}));
vi.mock('../../client/projects/init-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/projects/init-api')>()),
  ProjectInitApi: class {
    public addCodeLocation = addCodeLocation;
  },
}));
vi.mock('../../client/agents/board/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/agents/board/api')>()),
  useAgentBoard: (query: Record<string, string>) => agentBoard(query),
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
  errorText: () => 'failed',
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-agents/client/kit')
  >()),
  useAgentOptions: () => ({
    loading: false,
    failed: false,
    options: [{ value: 'a1', label: 'Coder' }],
    agents: [pickerAgent('a1', 'Coder')],
    nameOf: () => null,
  }),
  useRunnerOptions: () => ({
    loading: false,
    online: 1,
    options: [
      { value: 'rn1', label: 'Studio Mac', description: 'studio · online' },
    ],
  }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({ userId: 'u1' }),
  WorkflowSelect: ({ id }: { id: string }) => <select id={id} />,
}));
vi.mock('../../client/issues/issues-view', () => ({
  IssuesView: (props: Record<string, unknown>) => issuesView(props),
}));
vi.mock('../../client/projects/detail/context', () => ({
  useProjectPage: () => ({ project: { id: 'p1' }, canCreateIssues: true }),
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

const { AddWorkingDirectoryDialog } =
  await import('../../client/projects/detail/resource-dialog');
const { DirectoryDialog } =
  await import('../../client/projects/settings/directory-dialog');
const { default: NewProjectPage } =
  await import('../../client/pages/projects/new/index');
const { ProjectIssues } = await import('../../client/projects/detail/issues');
const { AgentQueueView } = await import('../../client/issues/agent-view');

const labels = defaultProjectDetailLabels;
const L = 'projectPage.newProject.labels';

const bound: ProjectResource = {
  id: 'r1',
  projectId: 'p1',
  type: 'gitRepo',
  url: 'https://github.com/acme/app.git',
  defaultRef: 'main',
  binding: {
    provider: 'github',
    connectionId: 'c1',
    repoId: '42',
    fullName: 'acme/app',
  },
  runnerId: null,
  path: null,
  label: null,
  initPrompt: 'pnpm install',
  position: 0,
};

const requireLocation = (values: ResourceFormValues) => {
  if (values.type === 'gitRepo')
    return values.url ? {} : { url: 'Enter the URL.' };
  return {
    ...(values.runnerId ? {} : { runnerId: 'Choose a runner.' }),
    ...(values.path.startsWith('/') ? {} : { path: 'Enter the path.' }),
  };
};

const client = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const onAdded =
  vi.fn<(resourceId: string | null, repository: boolean) => void>();

function Dialog(): ReactElement {
  return (
    <QueryClientProvider client={client()}>
      <MemoryRouter>
        <AddWorkingDirectoryDialog
          projectId='p1'
          open
          onClose={() => undefined}
          onAdded={onAdded}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/** The working directory choices in the row of cards, in order. */
const choicesIn = (root: Element) =>
  [...root.querySelectorAll('[data-code-location] [data-choice]')]
    .map((card) => card.getAttribute('data-choice'))
    // The locations, not the choices inside the chosen one's fields (a new repository's template or prompt).
    .filter(
      (choice) => !['nocobase', 'template', 'prompt'].includes(choice ?? ''),
    )
    .filter((choice, index, all) => all.indexOf(choice) === index);

// The repository search (cmdk) measures its list.
globalThis.ResizeObserver ??= class {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
};
Element.prototype.scrollIntoView ??= () => undefined;

/** Picks an option of a shadcn Select by its trigger's label; a select with a value takes the full press. */
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

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  status.enabled = true;
  status.connections = [connection];
  reposRead.length = 0;
  addCodeLocation.mockResolvedValue({
    resourceId: 'r2',
    repo: null,
    initIssueId: null,
    initIssueIdentifier: null,
    init: null,
    apps: [],
    ci: null,
    deployError: null,
  });
});

describe('adding a working directory', () => {
  it('offers the New project wizard’s choices in its order, without "none"', () => {
    const dialog = render(<Dialog />);
    const added = choicesIn(dialog.baseElement);
    dialog.unmount();
    const page = render(
      <QueryClientProvider client={client()}>
        <MemoryRouter>
          <NewProjectPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    // The wizard asks for its code on its second step.
    fireEvent.change(screen.getByLabelText('projectPage.newProject.name'), {
      target: { value: 'Shop' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.newProject.next' }),
    );
    expect(added).toEqual(['newRepo', 'existingRepo', 'runnerDirectory']);
    expect(choicesIn(page.baseElement)).toEqual([...added, 'none']);
  });

  it('searches a connection for an existing repository, with no way to create one there, and adds it', async () => {
    render(<Dialog />);
    fireEvent.click(screen.getByText(`${L}.locations.existingRepo.title`));
    expect(screen.queryByText(/studioGit\.picker\.create/u)).toBeNull();
    fireEvent.click(await screen.findByText('acme/app'));
    expect(screen.getByText('studioGit.picker.selected')).toBeTruthy();
    fireEvent.change(
      screen.getByLabelText('projectPage.codeLocation.defaultBranch'),
      { target: { value: 'develop' } },
    );
    // Its preview CI is connected once it is added.
    expect(screen.getByText('projectPage.codeLocation.ciLater')).toBeTruthy();
    expect(document.querySelector('[data-deploy-choice]')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.codeLocation.add' }),
    );
    await waitFor(() => expect(addCodeLocation).toHaveBeenCalledOnce());
    // Then its "Deployment" opens.
    expect(onAdded).toHaveBeenCalledWith('r2', true);
    expect(addCodeLocation.mock.calls[0]).toEqual([
      'p1',
      {
        codeLocation: 'existingRepo',
        existingRepo: {
          connectionId: 'c1',
          repoId: '42',
          fullName: 'acme/app',
          cloneUrl: 'https://github.com/acme/app.git',
          defaultBranch: 'develop',
        },
      },
    ]);
    expect(git.createRepo).not.toHaveBeenCalled();
  });

  it('starts a new repository as a NocoBase application, whose preview CI comes with it, as the wizard does', async () => {
    render(<Dialog />);
    fireEvent.click(screen.getByText(`${L}.locations.newRepo.title`));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.repoName'), {
      target: { value: 'site' },
    });
    expect(
      document
        .querySelector(
          '[data-choice-panel="newRepo"] [data-choice]:has([data-slot="radio-group-item"][data-checked])',
        )
        ?.getAttribute('data-choice'),
    ).toBe('nocobase');
    expect(document.querySelector('[data-repo-owner]')).not.toBeNull();
    expect(document.querySelector('[data-nocobase-app]')).not.toBeNull();
    expect(screen.getByText('projectPage.codeLocation.ciWithApp')).toBeTruthy();
    expect(screen.queryByText('projectPage.codeLocation.ciLater')).toBeNull();
    // The template repositories are offered the same way, with the same hint when the connection has none.
    fireEvent.click(screen.getByText(`${L}.initMethods.template.title`));
    expect(await screen.findByText(`${L}.templateRepos.empty`)).toBeTruthy();
    fireEvent.click(screen.getByText(`${L}.initMethods.nocobase.title`));
    fireEvent.click(screen.getByLabelText('projectPage.newProject.initAgent'));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Coder/u }));
    const add = screen.getByRole('button', {
      name: 'projectPage.codeLocation.add',
    });
    await waitFor(() => expect(add.hasAttribute('disabled')).toBe(false));
    fireEvent.click(add);
    await waitFor(() => expect(addCodeLocation).toHaveBeenCalledOnce());
    expect(addCodeLocation.mock.calls[0]?.[1]).toEqual({
      codeLocation: 'newRepo',
      initAgentId: 'a1',
      newRepo: {
        connectionId: 'c1',
        name: 'site',
        private: true,
        init: { method: 'nocobase', template: 'default' },
      },
    });
    // Nothing to open: its preview CI was connected with it.
    expect(onAdded).toHaveBeenCalledWith('r2', false);
  });

  it('says which connection lists the existing repositories, with where to authorize more', () => {
    render(<Dialog />);
    fireEvent.click(screen.getByText(`${L}.locations.existingRepo.title`));
    expect(
      document.querySelector('[data-repository-source]')?.textContent,
    ).toContain('studioGit.picker.source');
    expect(
      document.querySelector('[data-repository-access]')?.getAttribute('href'),
    ).toBe(connection.repositoryAccessUrl);
  });

  it('asks for the Git connection first only when there are several, one for a new and an existing repository', async () => {
    render(<Dialog />);
    fireEvent.click(screen.getByText(`${L}.locations.newRepo.title`));
    expect(
      screen.queryByLabelText('projectPage.newProject.gitConnection'),
    ).toBeNull();
    expect(screen.getByText('projectPage.newProject.ownerFrom')).toBeTruthy();
    cleanup();
    status.connections = [connection, labsConnection];
    render(<Dialog />);
    fireEvent.click(screen.getByText(`${L}.locations.newRepo.title`));
    const field = document.querySelector('[data-git-connection]');
    expect(field?.getAttribute('data-git-connection')).toBe('c1');
    // The owner stays a read-only line beneath it.
    expect(screen.getByText('projectPage.newProject.ownerFrom')).toBeTruthy();
    await pickOption('projectPage.newProject.gitConnection', 'Labs');
    await waitFor(() =>
      expect(
        document
          .querySelector('[data-repo-owner]')
          ?.getAttribute('data-repo-owner'),
      ).toBe('acme-labs'),
    );
    // A token connection may still change the owner: a pencil right after the owner's name opens its field.
    const pencil = screen.getByRole('button', {
      name: 'projectPage.newProject.changeOwner',
    });
    expect(pencil.previousElementSibling?.textContent).toBe('acme-labs');
    fireEvent.click(pencil);
    expect(
      document.activeElement ===
        screen.getByLabelText('projectPage.newProject.owner'),
    ).toBe(true);
    expect(
      screen.queryByRole('button', {
        name: 'projectPage.newProject.changeOwner',
      }),
    ).toBeNull();
    // The existing repository is searched through the same connection, with no choice of its own.
    fireEvent.click(screen.getByText(`${L}.locations.existingRepo.title`));
    expect(
      document
        .querySelector('[data-git-connection]')
        ?.getAttribute('data-git-connection'),
    ).toBe('c2');
    expect(screen.queryByLabelText('studioGit.picker.connection')).toBeNull();
    expect(reposRead.at(-1)).toBe('c2');
  });

  it('creates nothing while a new repository is filled in, and asks the server for it on Add', async () => {
    render(<Dialog />);
    fireEvent.click(screen.getByText(`${L}.locations.newRepo.title`));
    fireEvent.change(screen.getByLabelText('projectPage.newProject.repoName'), {
      target: { value: 'site' },
    });
    fireEvent.click(screen.getByText(`${L}.initMethods.prompt.title`));
    fireEvent.change(screen.getByLabelText(`${L}.prompt.label`), {
      target: { value: 'A site.' },
    });
    fireEvent.click(screen.getByLabelText('projectPage.newProject.initAgent'));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Coder/u }));
    expect(git.createRepo).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'projectPage.codeLocation.add' })
          .hasAttribute('disabled'),
      ).toBe(false),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.codeLocation.add' }),
    );
    await waitFor(() => expect(addCodeLocation).toHaveBeenCalledOnce());
    expect(addCodeLocation.mock.calls[0]?.[1]).toMatchObject({
      codeLocation: 'newRepo',
      initAgentId: 'a1',
      newRepo: {
        connectionId: 'c1',
        name: 'site',
        init: { method: 'prompt', prompt: 'A site.' },
      },
    });
    expect(git.createRepo).not.toHaveBeenCalled();
  });

  it('takes a clone URL and default branch without a connection, which offers no new repository', async () => {
    status.enabled = false;
    render(<Dialog />);
    // Why a new repository is not offered, said inside its card rather than on hover, with where to connect one.
    const reason = document.querySelector<HTMLElement>(
      '[data-choice-unavailable="newRepo"]',
    )!;
    expect(reason.textContent).toBe(
      'projectPage.newProject.noGit projectPage.newProject.connect',
    );
    expect(
      document.querySelector('[data-choice-description]')?.textContent,
    ).toContain('projectPage.newProject.noGitTemplates');
    expect(
      within(reason)
        .getByRole('link', { name: 'projectPage.newProject.connect' })
        .getAttribute('href'),
    ).toBe('/config/git');
    expect(screen.getByText(`${L}.incomplete.cloneUrl`)).toBeTruthy();
    fireEvent.change(
      screen.getByLabelText('projectPage.codeLocation.cloneUrl'),
      { target: { value: 'https://git.example.com/team/site.git' } },
    );
    fireEvent.change(
      screen.getByLabelText('projectPage.codeLocation.defaultBranch'),
      { target: { value: 'trunk' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.codeLocation.add' }),
    );
    await waitFor(() => expect(addCodeLocation).toHaveBeenCalledOnce());
    expect(addCodeLocation.mock.calls[0]?.[1]).toMatchObject({
      codeLocation: 'existingRepo',
      existingRepo: {
        cloneUrl: 'https://git.example.com/team/site.git',
        defaultBranch: 'trunk',
      },
    });
  });

  it('picks a directory’s runner by name before its path, with no name to give here', async () => {
    render(<Dialog />);
    fireEvent.click(screen.getByText(`${L}.locations.runnerDirectory.title`));
    const path = screen.getByLabelText('projectPage.newProject.path');
    expect((path as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('projectPage.newProject.runner'));
    fireEvent.click(await screen.findByText('studio · online'));
    await waitFor(() =>
      expect((path as HTMLInputElement).disabled).toBe(false),
    );
    fireEvent.change(path, { target: { value: '/srv/app' } });
    expect(
      screen.queryByLabelText('projectPage.codeLocation.label'),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.codeLocation.add' }),
    );
    await waitFor(() => expect(addCodeLocation).toHaveBeenCalledOnce());
    expect(addCodeLocation.mock.calls[0]?.[1]).toEqual({
      codeLocation: 'runnerDirectory',
      runnerDirectory: { runnerId: 'rn1', path: '/srv/app' },
    });
    expect(onAdded).toHaveBeenCalledWith('r2', false);
  });
});

describe('editing a working directory', () => {
  it('shows an existing repository as chosen, its kind fixed, without a name of its own, and keeps its binding and prompt when saved', async () => {
    const onSubmit = vi.fn<
      (values: ResourceFormValues, existing: ProjectResource) => Promise<void>
    >(() => Promise.resolve());
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={client()}>
        <DirectoryDialog
          resource={bound}
          onClose={onClose}
          runners={{ loading: false, options: [] }}
          connections={[connection]}
          validate={requireLocation}
          onSubmit={onSubmit}
          labels={labels}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryByText(`${L}.locations.newRepo.title`)).toBeNull();
    expect(screen.getByText('studioGit.picker.selected')).toBeTruthy();
    expect(
      screen.queryByLabelText('projectPage.codeLocation.label'),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText(labels.resourceForm.defaultRef), {
      target: { value: 'develop' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'projectPage.settings.save' }),
    );
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [values, existing] = onSubmit.mock.calls[0]!;
    expect(values).toMatchObject({
      defaultRef: 'develop',
      initPrompt: 'pnpm install',
    });
    expect('binding' in values).toBe(false);
    expect(existing).toBe(bound);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('ProjectIssues', () => {
  it('offers the board first and by default, scoped to the project', () => {
    render(
      <MemoryRouter>
        <ProjectIssues />
      </MemoryRouter>,
    );
    expect(issuesView).toHaveBeenCalledWith(
      expect.objectContaining({
        fixedFilters: { projectId: 'p1' },
        viewKey: 'project',
        views: ['board', 'list', 'agent'],
        defaultView: 'board',
      }),
    );
  });

  it('asks the agent board for the page’s project', () => {
    const page = {
      filters: { projectId: 'p1' },
      params: new URLSearchParams(),
      filtered: false,
      updateParams: vi.fn(),
    };
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AgentQueueView
            page={page as never}
            issueHref={(id) => `/issues/${id}`}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(agentBoard).toHaveBeenCalledWith({ projectId: 'p1' });
  });
});
