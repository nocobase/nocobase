// @vitest-environment node
/**
 * New projects and their initialization, over a real database and the GitHub stand-in (nothing reaches the network):
 *
 * - from a template repository with an initialization workflow: the repository is generated (unprotected), the
 *   "Initialize project" issue holds the project's later issues, and the workflow's successful run finishes it (issue
 *   done, branch protected); a failed run is reported with its log and runs again on retry; a lost delivery is caught
 *   up by reading the workflow's newest run;
 * - from a template with no workflow: ready at once;
 * - by an agent with a prompt: an empty repository, the init issue's run checks it out on its default branch as the
 *   initial run, and the run's success and the first push finish it in either order;
 * - as a NocoBase application: an empty repository, the init issue's agent given fixed `create-app` steps, waiting
 *   for a runner while none can run it;
 * - an existing repository or a directory on a runner with a prompt: the init issue's agent, done once its run
 *   succeeds; without a prompt, or with no code: no initialization;
 * - what does not fit is refused before anything is made.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import type { WorkflowRun } from '../../server/git/platform.js';
import {
  createProjectInits,
  type ProjectInits,
} from '../../server/projects-init/service.js';
import { createIssueContextProvider } from '../../server/agents/issue-subject.js';
import { NewProjectInput } from '../../server/projects-init/schemas.js';
import { initialDirOf } from '../../server/projects-init/store.js';
import type { GitConnection } from '../../shared/git.js';
import type { NewProjectRequest } from '../../shared/project-init.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let inits: ProjectInits;
let connection: GitConnection;
let agentId: string;
let stop: () => void;

const alice = () => h.viewer('alice');
const INIT_PATH = '.github/workflows/nb-studio-init.yml';

async function appConnection(): Promise<GitConnection> {
  h.github.app.installations.set('acme', '77');
  return h.gitConnections.create('alice', {
    kind: 'app',
    name: 'Acme app',
    appId: h.github.app.appId,
    privateKey: h.github.app.privateKey,
    account: 'acme',
    clientId: h.github.app.clientId,
    clientSecret: h.github.app.clientSecret,
    webhookSecret: 'a-webhook-secret-long-enough',
  });
}

beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  const software = (await h.projects.workflows.list(alice())).find(
    (workflow) => workflow.builtInKey === 'software',
  )!;
  await h.projects.workflows.setDefault(alice(), software.id);
  agentId = await h.createAgent({ name: 'Coder' });
  connection = await appConnection();
  let next = 0;
  inits = createProjectInits({
    database: h.database,
    projects: () => h.projects,
    agents: () => h.agents,
    connections: () => h.gitConnections,
    git: () => h.git,
    viewerOf: (userId) => Promise.resolve(h.viewer(userId)),
    newId: () => `init-${(next += 1)}`,
    onError: () => undefined,
  });
  stop = h.gitRepoEvents.on((event) => inits.repoEvent(event));
});

afterEach(async () => {
  stop();
  await inits.settled();
  await h.close();
});

/** The starter template repository, with Studio's initialization workflow and a CI workflow. */
function starter() {
  h.github.addRepo('acme/starter', { is_template: true });
  const init = h.github.addWorkflow('acme/starter', {
    name: 'Initialize',
    path: INIT_PATH,
  });
  h.github.addWorkflow('acme/starter', { path: '.github/workflows/ci.yml' });
  return init;
}

const fromTemplate = (
  workflow: { id: string; path: string; name: string } | null,
): NewProjectRequest => ({
  name: 'Shop',
  codeLocation: 'newRepo',
  newRepo: {
    connectionId: connection.id,
    name: 'shop',
    private: true,
    init: { method: 'template', templateRepo: 'acme/starter', workflow },
  },
});

/** A run of the generated repository's copy of the init workflow, as a webhook delivers it. */
function run(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
  return {
    id: '501',
    workflowId: '999',
    name: 'Initialize',
    path: INIT_PATH,
    headBranch: 'main',
    headSha: 'abc',
    status: 'completed',
    conclusion: 'success',
    htmlUrl: 'https://github.com/acme/shop/actions/runs/501',
    runAttempt: 1,
    ...overrides,
  };
}

const deliverRun = (action: 'in_progress' | 'completed', given: WorkflowRun) =>
  h.gitRepoEvents.emit({
    type: 'workflowRun',
    repoId: 'r',
    repo: 'acme/shop',
    action,
    run: given,
  });

async function statusOf(issueId: string) {
  return (await h.projects.issueQueries.detail(alice(), issueId)).statusKey;
}

describe('a new project from a template repository', () => {
  it('lists the template’s workflows through the connection, Studio’s convention among them', async () => {
    starter();
    expect(
      (await h.gitConnections.workflows(connection.id, 'acme/starter')).map(
        (workflow) => workflow.path,
      ),
    ).toEqual([INIT_PATH, '.github/workflows/ci.yml']);
  });

  it('is initialized by the chosen workflow’s successful run, which releases the project’s other issues', async () => {
    const workflow = starter();
    const created = await inits.newProject(
      alice(),
      fromTemplate({
        id: String(workflow.id),
        path: INIT_PATH,
        name: 'Initialize',
      }),
    );
    expect(h.github.repos.get('acme/shop')).toMatchObject({
      generatedFrom: 'acme/starter',
      protected: false,
    });
    expect(created).toMatchObject({
      repo: { fullName: 'acme/shop' },
      initIssueIdentifier: expect.any(String),
      init: {
        method: 'template',
        state: 'running',
        workflow: { path: INIT_PATH },
        run: null,
      },
    });
    const project = await h.projects.projects.get(alice(), created.projectId);
    expect(project.setupIssueId).toBe(created.initIssueId);
    const init = await h.projects.issueQueries.detail(
      alice(),
      created.initIssueId!,
    );
    // Shown as the workflow's: no one executes it in Studio.
    expect(init.executor).toBeNull();
    const later = await h.projects.issues.create(alice(), {
      title: 'Checkout page',
      projectId: created.projectId,
      start: false,
    });
    expect(
      (await h.projects.issueQueries.detail(alice(), later.id)).blockers,
    ).toEqual([expect.objectContaining({ issueId: created.initIssueId })]);

    // Another workflow's run, or another repository's, changes nothing.
    await deliverRun('completed', run({ path: '.github/workflows/ci.yml' }));
    await deliverRun('in_progress', run({ status: 'in_progress' }));
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'running',
      run: { id: '501', status: 'in_progress', conclusion: null },
    });
    await deliverRun('completed', run());
    const done = await inits.view(alice(), created.projectId);
    expect(done).toMatchObject({
      state: 'done',
      branchProtected: true,
      error: null,
      run: { conclusion: 'success' },
    });
    expect(h.github.repos.get('acme/shop')?.protected).toBe(true);
    expect(await statusOf(created.initIssueId!)).toBe('done');
    expect(
      (await h.projects.issueQueries.detail(alice(), later.id)).blockers,
    ).toEqual([]);
  });

  it('reports a failed run with its log, and runs it again on retry', async () => {
    const workflow = starter();
    const created = await inits.newProject(
      alice(),
      fromTemplate({
        id: String(workflow.id),
        path: INIT_PATH,
        name: 'Initialize',
      }),
    );
    const generated = h.github.addWorkflow('acme/shop', {
      name: 'Initialize (copy)',
      path: '.github/workflows/other.yml',
    });
    // The generated repository's own run, which retry runs again.
    const real = h.github.addWorkflowRun('acme/shop', {
      workflow_id: generated.id,
      conclusion: 'failure',
    });
    await deliverRun(
      'completed',
      run({ id: String(real.id), conclusion: 'failure' }),
    );
    const failed = await inits.view(alice(), created.projectId);
    expect(failed).toMatchObject({
      state: 'failed',
      canRetry: true,
      error: expect.stringContaining('failure'),
      run: { id: String(real.id), url: expect.any(String) },
    });
    const comments = await h.projects.commentQueries.list(
      h.database.connection(),
      created.initIssueId!,
    );
    expect(comments.map((comment) => comment.content)).toEqual([
      expect.stringContaining('/actions/runs/'),
    ]);
    // Only someone who manages the project runs it again.
    await expect(
      inits.retry(h.viewer('bob'), created.projectId),
    ).rejects.toBeTruthy();
    const retried = await inits.retry(alice(), created.projectId);
    expect(retried).toMatchObject({ state: 'running', error: null });
    expect(h.github.workflowRuns.get('acme/shop')?.[0]).toMatchObject({
      run_attempt: 2,
    });
    await expect(inits.retry(alice(), created.projectId)).rejects.toMatchObject(
      { code: 'INIT_NOT_FAILED' },
    );
    // An older attempt's delivery arriving late changes nothing; the new attempt's success finishes it.
    await deliverRun(
      'completed',
      run({ id: String(real.id), runAttempt: 2, conclusion: 'success' }),
    );
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'done',
      run: { attempt: 2 },
    });
    await deliverRun(
      'completed',
      run({ id: String(real.id), runAttempt: 1, conclusion: 'failure' }),
    );
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'done',
    });
  });

  it('catches up with a lost delivery by reading the workflow’s newest run', async () => {
    const workflow = starter();
    const created = await inits.newProject(
      alice(),
      fromTemplate({
        id: String(workflow.id),
        path: INIT_PATH,
        name: 'Initialize',
      }),
    );
    const copy = (
      await h.gitConnections.workflows(connection.id, 'acme/shop')
    ).find((item) => item.path === INIT_PATH)!;
    h.github.addWorkflowRun('acme/shop', { workflow_id: Number(copy.id) });
    // Reading changes nothing; the provider's timer asks the host.
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'running',
    });
    await inits.reconcileRunning();
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'done',
      branchProtected: true,
    });
  });

  it('is ready at once without a workflow', async () => {
    starter();
    const created = await inits.newProject(alice(), fromTemplate(null));
    expect(created.init).toMatchObject({
      state: 'done',
      workflow: null,
      branchProtected: true,
    });
    expect(await statusOf(created.initIssueId!)).toBe('done');
  });

  it('refuses what does not fit before anything is made', async () => {
    starter();
    h.github.addRepo('acme/plain');
    await expect(
      inits.newProject(
        alice(),
        fromTemplate({
          id: '1',
          path: '.github/workflows/nope.yml',
          name: 'x',
        }),
      ),
    ).rejects.toMatchObject({ code: 'UNKNOWN_WORKFLOW' });
    await expect(
      inits.newProject(alice(), {
        ...fromTemplate(null),
        newRepo: {
          ...fromTemplate(null).newRepo!,
          init: {
            method: 'template',
            templateRepo: 'acme/plain',
            workflow: null,
          },
        },
      }),
    ).rejects.toBeTruthy();
    await expect(
      inits.newProject(alice(), {
        ...fromTemplate(null),
        initAgentId: null,
        newRepo: {
          ...fromTemplate(null).newRepo!,
          init: { method: 'prompt', prompt: 'A shop' },
        },
      }),
    ).rejects.toMatchObject({ code: 'AGENT_REQUIRED' });
    expect(h.github.repos.has('acme/shop')).toBe(false);
    expect(await h.projects.projects.list(alice())).toEqual([]);
  });
});

describe('a new project an agent initializes', () => {
  const byPrompt = (): NewProjectRequest => ({
    name: 'Shop',
    initAgentId: agentId,
    codeLocation: 'newRepo',
    newRepo: {
      connectionId: connection.id,
      name: 'shop',
      private: false,
      init: { method: 'prompt', prompt: 'A NocoBase app selling shoes.' },
    },
  });

  /** The agent's push reaches GitHub, which tells Studio. */
  const firstPush = () => {
    h.github.repos.get('acme/shop')!.empty = false;
    return h.gitRepoEvents.emit({
      type: 'push',
      repoId: 'r',
      repo: 'acme/shop',
      branch: 'main',
      created: true,
      before: '0'.repeat(40),
      after: 'abc',
    });
  };

  it('creates the repository with its initial commit and no initialization when the prompt is left empty', async () => {
    const created = await inits.newProject(alice(), {
      ...byPrompt(),
      initAgentId: null,
      newRepo: {
        ...byPrompt().newRepo!,
        init: { method: 'prompt', prompt: '  ' },
      },
    });
    expect(h.github.repos.get('acme/shop')).toMatchObject({
      empty: false,
      protected: true,
    });
    expect(created).toMatchObject({
      repo: { fullName: 'acme/shop' },
      initIssueId: null,
      init: null,
    });
    expect(await inits.view(alice(), created.projectId)).toBeNull();
  });

  it('gives the init issue’s run the empty repository on its default branch, and finishes on its success and first push', async () => {
    const created = await inits.newProject(alice(), byPrompt());
    expect(h.github.repos.get('acme/shop')).toMatchObject({
      empty: true,
      protected: false,
    });
    expect(created.init).toMatchObject({
      method: 'prompt',
      state: 'pending',
      firstCommit: true,
    });
    const init = await h.projects.issueQueries.detail(
      alice(),
      created.initIssueId!,
    );
    expect(init.executor).toEqual({ type: 'agent', id: agentId });
    expect(init.description).toContain('A NocoBase app selling shoes.');
    expect(
      await initialDirOf(
        h.database.connection(),
        created.initIssueId!,
        created.projectId,
      ),
    ).toEqual({ resourceId: created.resourceId, defaultBranch: 'main' });

    const payload = await h.claimOne();
    expect(payload.workspace.dirs).toEqual([
      expect.objectContaining({
        kind: 'repo',
        branch: 'main',
        defaultBranch: 'main',
        initial: true,
      }),
    ]);
    expect(payload.prompt.system).toContain('Initializing the repository');

    // Pushed first, then the run succeeds.
    await firstPush();
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'pending',
      pushed: true,
      runSucceeded: false,
    });
    await inits.runChanged(payload.run.id as string, 'completed');
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'done',
      branchProtected: true,
    });
    // Another issue of the project works on its own branch again.
    expect(
      await initialDirOf(
        h.database.connection(),
        created.initIssueId!,
        created.projectId,
      ),
    ).toBeNull();
  });

  it('finishes when the run succeeds before the push arrives', async () => {
    const created = await inits.newProject(alice(), byPrompt());
    const payload = await h.claimOne();
    await inits.runChanged(payload.run.id as string, 'completed');
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'pending',
      runSucceeded: true,
    });
    // A push to another branch, or one that did not create the branch, is not the first commit.
    await h.gitRepoEvents.emit({
      type: 'push',
      repoId: 'r',
      repo: 'acme/shop',
      branch: 'feature',
      created: true,
      before: '0'.repeat(40),
      after: 'abc',
    });
    expect((await inits.view(alice(), created.projectId))?.state).toBe(
      'pending',
    );
    await firstPush();
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'done',
    });
    expect(await statusOf(created.initIssueId!)).toBe('done');
  });
});

describe('a new project that starts as a NocoBase application', () => {
  const nocobase = (name = 'shop'): NewProjectRequest => ({
    name: 'Shop',
    initAgentId: agentId,
    codeLocation: 'newRepo',
    newRepo: {
      connectionId: connection.id,
      name,
      private: true,
      init: { method: 'nocobase', template: 'default' },
    },
  });

  it('creates the repository empty and gives the init issue’s agent fixed create-app steps', async () => {
    const created = await inits.newProject(alice(), nocobase());
    expect(h.github.repos.get('acme/shop')).toMatchObject({
      empty: true,
      protected: false,
    });
    expect(created.init).toMatchObject({
      method: 'prompt',
      appTemplate: 'default',
      state: 'pending',
      firstCommit: true,
      templateRepo: null,
      agentId,
    });
    const issue = await h.projects.issueQueries.detail(
      alice(),
      created.initIssueId!,
    );
    expect(issue.executor).toEqual({ type: 'agent', id: agentId });
    const brief = issue.description ?? '';
    for (const step of [
      'node --version',
      'pnpm --version',
      'https://registry.npmjs.org',
      '${NOCOBASE_REGISTRY:+env npm_config_registry="$NOCOBASE_REGISTRY"} pnpm view @nocobase/create-app version',
      'PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 ${NOCOBASE_REGISTRY:+env npm_config_registry="$NOCOBASE_REGISTRY"} pnpm create @nocobase/app shop --template default --json',
      'mktemp -d',
      'TEMPLATE_DOWNLOAD_FAILED',
      'INSTALL_FAILED',
      'NODE_UNSUPPORTED',
      '--exclude=node_modules',
      'git push origin HEAD:main',
    ])
      expect(brief).toContain(step);
    // pnpm create reads no --registry of its own: pnpm 11 rejects it before the package name.
    expect(brief).not.toContain('pnpm --registry');
    // The packages are on the public npm registry: no private registry, and none set unless the runner names one.
    expect(brief).not.toContain('npm.nocobase.ai');
    expect(brief).not.toContain('npm_config_registry="${');
    // The agent's run is the one that may push the empty repository's default branch.
    expect(
      await initialDirOf(
        h.database.connection(),
        created.initIssueId!,
        created.projectId,
      ),
    ).toEqual({ resourceId: created.resourceId, defaultBranch: 'main' });
  });

  it('names the application after the repository in lowercase', async () => {
    const created = await inits.newProject(alice(), nocobase('Shop-App'));
    const issue = await h.projects.issueQueries.detail(
      alice(),
      created.initIssueId!,
    );
    expect(issue.description).toContain(
      'create @nocobase/app shop-app --template default',
    );
  });

  it('waits for a runner while none can run the agent', async () => {
    const created = await inits.newProject(alice(), nocobase());
    expect(created.init).toMatchObject({
      state: 'pending',
      waitingForRunner: true,
    });
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      waitingForRunner: true,
    });
    // A runner comes online and claims the init issue's run.
    await h.claimOne();
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'pending',
      waitingForRunner: false,
    });
  });

  it('refuses what does not fit before anything is made', async () => {
    await expect(
      inits.newProject(alice(), { ...nocobase(), initAgentId: null }),
    ).rejects.toMatchObject({ code: 'AGENT_REQUIRED' });
    await expect(
      inits.newProject(alice(), nocobase('-shop')),
    ).rejects.toMatchObject({ code: 'INVALID_APP_NAME' });
    await expect(
      inits.newProject(alice(), {
        ...nocobase(),
        newRepo: {
          ...nocobase().newRepo!,
          init: { method: 'nocobase', template: 'hub' as never },
        },
      }),
    ).rejects.toMatchObject({ code: 'UNKNOWN_APP_TEMPLATE' });
    expect(h.github.repos.size).toBe(0);
    expect(await h.projects.projects.list(alice())).toEqual([]);
  });
});

describe('a new project with code elsewhere', () => {
  const existingRepo = (
    initPrompt?: string,
  ): NonNullable<NewProjectRequest['existingRepo']> => {
    const repo = h.github.addRepo('acme/existing');
    return {
      connectionId: connection.id,
      repoId: String(repo.id),
      fullName: 'acme/existing',
      cloneUrl: 'https://github.com/acme/existing.git',
      defaultBranch: 'main',
      ...(initPrompt === undefined ? {} : { initPrompt }),
    };
  };

  it('has no initialization for an existing repository or a directory without a prompt, or no code', async () => {
    const existing = await inits.newProject(alice(), {
      name: 'Existing',
      codeLocation: 'existingRepo',
      existingRepo: existingRepo('  '),
    });
    expect(existing).toMatchObject({
      repo: { fullName: 'acme/existing' },
      initIssueId: null,
      init: null,
    });
    const directory = await inits.newProject(alice(), {
      name: 'Local',
      codeLocation: 'runnerDirectory',
      runnerDirectory: { runnerId: 'runner-1', path: '/srv/app' },
    });
    expect(directory.resourceId).toEqual(expect.any(String));
    expect(directory.init).toBeNull();
    const none = await inits.newProject(alice(), {
      name: 'Plain',
      codeLocation: 'none',
    });
    expect(none).toMatchObject({ resourceId: null, init: null });
    expect(await inits.view(alice(), none.projectId)).toBeNull();
  });

  it('initializes an existing repository with a prompt once the agent’s run succeeds, with no push needed', async () => {
    await expect(
      inits.newProject(alice(), {
        name: 'Existing',
        codeLocation: 'existingRepo',
        existingRepo: existingRepo('Read the code and add an AGENTS.md.'),
      }),
    ).rejects.toMatchObject({ code: 'AGENT_REQUIRED' });
    const created = await inits.newProject(alice(), {
      name: 'Existing',
      initAgentId: agentId,
      codeLocation: 'existingRepo',
      existingRepo: existingRepo('Read the code and add an AGENTS.md.'),
    });
    expect(created.init).toMatchObject({
      method: 'prompt',
      state: 'pending',
      firstCommit: false,
      repo: { fullName: 'acme/existing' },
      agentId,
    });
    const project = await h.projects.projects.get(alice(), created.projectId);
    expect(project.setupIssueId).toBe(created.initIssueId);
    const issue = await h.projects.issueQueries.detail(
      alice(),
      created.initIssueId!,
    );
    expect(issue.executor).toEqual({ type: 'agent', id: agentId });
    expect(issue.description).toContain('add an AGENTS.md');
    // Not the initial run of an empty repository: it works on its own branch.
    expect(
      await initialDirOf(
        h.database.connection(),
        created.initIssueId!,
        created.projectId,
      ),
    ).toBeNull();
    const payload = await h.claimOne();
    expect(payload.workspace.dirs[0]).not.toMatchObject({ initial: true });
    await inits.runChanged(payload.run.id as string, 'completed');
    expect(await inits.view(alice(), created.projectId)).toMatchObject({
      state: 'done',
      runSucceeded: true,
      pushed: false,
      branchProtected: null,
    });
    expect(h.github.repos.get('acme/existing')?.protected).toBeFalsy();
    expect(await statusOf(created.initIssueId!)).toBe('done');
  });

  it('initializes a directory on a runner with a prompt through the init issue’s agent', async () => {
    const created = await inits.newProject(alice(), {
      name: 'Local',
      initAgentId: agentId,
      codeLocation: 'runnerDirectory',
      runnerDirectory: {
        runnerId: 'runner-1',
        path: '/srv/app',
        initPrompt: 'Install the dependencies.',
      },
    });
    expect(created).toMatchObject({
      repo: null,
      initIssueId: expect.any(String),
      init: {
        method: 'prompt',
        state: 'pending',
        repo: null,
        firstCommit: false,
      },
    });
    const issue = await h.projects.issueQueries.detail(
      alice(),
      created.initIssueId!,
    );
    expect(issue.executor).toEqual({ type: 'agent', id: agentId });
    expect(issue.description).toContain('Install the dependencies.');
    expect(issue.description).toContain('/srv/app');
  });
});

describe('NocoBase 3 runner directory initialization', () => {
  const local = (): NewProjectRequest => ({
    name: 'Local NocoBase',
    description: 'Internal support staff enter tickets; use NocoBase 3.',
    initAgentId: agentId,
    codeLocation: 'runnerDirectory',
    runnerDirectory: {
      runnerId: 'runner-1',
      path: '/srv/support',
      init: { method: 'nocobase', template: 'default' },
    },
  });

  async function contextOf(
    issueId: string,
    executor = agentId,
  ): Promise<string> {
    const provider = createIssueContextProvider(h.agents, () => h.projects);
    const assembled = await provider.assemble(h.database.connection(), {
      agent: { id: executor, actions: [] },
      run: { id: 'future-run', subject: { kind: 'issue', id: issueId } },
      inputs: [],
      cli: 'nb-studio',
    } as Parameters<typeof provider.assemble>[1]);
    return assembled.context ?? '';
  }

  it('persists the template without Git setup and carries it to another agent after initialization', async () => {
    const created = await inits.newProject(alice(), local());
    expect(created).toMatchObject({
      repo: null,
      init: {
        appTemplate: 'default',
        firstCommit: false,
        method: 'prompt',
        state: 'pending',
      },
    });
    const issue = await h.projects.issueQueries.detail(
      alice(),
      created.initIssueId!,
    );
    expect(issue.description).toContain(
      'pnpm create @nocobase/app app --template default --json',
    );
    expect(issue.description).toContain('never delete or move existing work');
    expect(issue.description).toContain('recorded reason');
    expect(issue.description).not.toContain('git push');
    expect(issue.description).not.toContain('mktemp');
    expect(issue.description).not.toContain('npm.nocobase.ai');
    expect(issue.description).toContain('NOCOBASE_REGISTRY:+env');
    expect(
      await initialDirOf(h.database.connection(), issue.id, created.projectId),
    ).toBeNull();

    // A completed initialization remains the baseline; the next issue has no framework wording of its own.
    await h.database
      .connection()
      .query.updateTable('studioProjectInits')
      .set({ state: 'done', runSucceeded: true })
      .where('projectId', '=', created.projectId)
      .execute();
    const next = await h.projects.issues.create(alice(), {
      title: 'Add ticket form',
      projectId: created.projectId,
    });
    const otherAgent = await h.createAgent({ name: 'Frontend' });
    const context = await contextOf(next.id, otherAgent);
    expect(context).toContain('Internal support staff enter tickets');
    expect(context).toContain('Framework: NocoBase 3');
    expect(context).toContain('@nocobase/app-template-default');
    expect(context).toContain('application root: app/');
    expect(context).toContain('Never use create-nocobase-app');
    expect(context).toContain('AGENTS.md');

    // A removed working directory must not constrain unrelated code remaining in the project.
    await h.projects.projects.removeResource(
      alice(),
      created.projectId,
      created.resourceId!,
    );
    expect(await contextOf(next.id)).not.toContain(
      'Required application baseline',
    );
  });

  it('also supports adding a NocoBase directory to an existing project', async () => {
    const project = await inits.newProject(alice(), {
      name: 'Existing project',
      codeLocation: 'none',
    });
    const added = await inits.createCodeLocation(
      alice(),
      project.projectId,
      local(),
    );
    expect(added.init).toMatchObject({
      appTemplate: 'default',
      firstCommit: false,
    });
    expect(await contextOf(added.initIssueId!)).toContain(
      'application root: app/',
    );
  });

  it('refuses a missing agent, incompatible prompt, and unsupported template before creating records', async () => {
    await expect(
      inits.newProject(alice(), { ...local(), initAgentId: null }),
    ).rejects.toMatchObject({ code: 'AGENT_REQUIRED' });
    await expect(
      inits.newProject(alice(), {
        ...local(),
        runnerDirectory: {
          ...local().runnerDirectory!,
          initPrompt: 'Use something else',
        },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    const wrong = {
      ...local(),
      runnerDirectory: {
        ...local().runnerDirectory!,
        init: { method: 'nocobase', template: 'legacy' },
      },
    };
    expect(NewProjectInput.safeParse(wrong).success).toBe(false);
    await expect(inits.newProject(alice(), wrong)).rejects.toMatchObject({
      code: 'UNKNOWN_APP_TEMPLATE',
    });
    const rows = await h.database
      .connection()
      .query.selectFrom('studioProjectInits')
      .selectAll()
      .execute();
    expect(rows).toEqual([]);
  });

  it('does not infer a framework for an ordinary directory', async () => {
    const created = await inits.newProject(alice(), {
      ...local(),
      description: null,
      runnerDirectory: {
        runnerId: 'runner-1',
        path: '/srv/plain',
        initPrompt: 'Inspect this directory',
      },
    });
    expect(created.init?.appTemplate).toBeNull();
    expect(await contextOf(created.initIssueId!)).not.toContain(
      'Required application baseline',
    );
  });
});
