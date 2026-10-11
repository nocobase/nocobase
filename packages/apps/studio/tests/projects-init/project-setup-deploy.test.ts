// @vitest-environment node
/**
 * A repository's "Deploy & previews" choices when it is added, over a real database, release management on an in-memory
 * driver and the GitHub stand-in (nothing reaches the network):
 *
 * - the Apps a choice needs are created and linked, named after the repository (`<repo>`, `<repo>-staging`, the next
 *   free ID when one is taken), created by Studio as the person, and the CI choice is recorded; previews need no App,
 *   as CI deploys them;
 * - a preview environment must run archives and not be protected, and only someone who may create Apps or deploy to
 *   every App has them set up: a refusal, like any other, comes before a repository is created;
 * - a working directory added to a project later is checked and made the same way, its initialization an issue of its
 *   own that the project's other issues do not wait for;
 * - changing the choices on a repository unlinks a role left out.
 */
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import {
  createProjectInits,
  type ProjectInits,
} from '../../server/projects-init/service.js';
import { initialDirOf } from '../../server/projects-init/store.js';
import {
  createRepositoryLinks,
  type RepositoryLinks,
} from '../../server/releases/links.js';
import { linkReleases } from '../../server/releases/provider.js';
import type { GitConnection } from '../../shared/git.js';
import type { NewProjectRequest } from '../../shared/project-init.js';
import type { DeploySettings } from '../../shared/releases.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let inits: ProjectInits;
let links: RepositoryLinks;
let connection: GitConnection;
let agentId: string;

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

beforeEach(async () => {
  h = await createBridgeHarness({ releases: true });
  for (const id of ['alice', 'bob']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  agentId = await h.createAgent({ name: 'Coder' });
  h.github.app.installations.set('acme', '77');
  connection = await h.gitConnections.create('alice', {
    kind: 'app',
    name: 'Acme app',
    appId: h.github.app.appId,
    privateKey: h.github.app.privateKey,
    account: 'acme',
    clientId: h.github.app.clientId,
    clientSecret: h.github.app.clientSecret,
    webhookSecret: 'a-webhook-secret-long-enough',
  });
  const releases = h.releases!;
  for (const environment of [
    { id: 'preview', name: 'Preview' },
    { id: 'staging', name: 'Staging' },
    { id: 'production', name: 'Production', protected: true },
    { id: 'docker', name: 'Docker', config: { images: true } },
  ])
    await releases.environments.create(SYSTEM_CALLER, {
      driver: 'fake',
      ...environment,
    });
  let next = 0;
  const adapter = linkReleases(() => releases);
  links = createRepositoryLinks({
    database: h.database,
    releases: () => adapter,
    newId: () => `link-${(next += 1)}`,
  });
  inits = createProjectInits({
    database: h.database,
    projects: () => h.projects,
    agents: () => h.agents,
    connections: () => h.gitConnections,
    git: () => h.git,
    links: () => links,
    viewerOf: (userId) => Promise.resolve(h.viewer(userId)),
    newId: () => `init-${(next += 1)}`,
    onError: () => undefined,
  });
});

afterEach(async () => {
  await inits.settled();
  await h.close();
});

const deploy = (patch: Partial<DeploySettings> = {}): DeploySettings => ({
  previewEnvironmentId: 'preview',
  stagingEnvironmentId: 'staging',
  productionEnvironmentId: 'production',
  configureCi: true,
  ...patch,
});

function existingShop(
  patch: Partial<NewProjectRequest> = {},
): NewProjectRequest {
  const repo = h.github.repos.has('acme/shop')
    ? h.github.repos.get('acme/shop')!
    : h.github.addRepo('acme/shop');
  return {
    name: 'Shop',
    codeLocation: 'existingRepo',
    existingRepo: {
      connectionId: connection.id,
      repoId: String(repo.id),
      fullName: 'acme/shop',
      cloneUrl: 'https://github.com/acme/shop.git',
      defaultBranch: 'main',
    },
    ...patch,
  };
}

const newShop = (
  patch: Partial<NewProjectRequest> = {},
): NewProjectRequest => ({
  name: 'Shop',
  initAgentId: agentId,
  codeLocation: 'newRepo',
  newRepo: {
    connectionId: connection.id,
    name: 'shop',
    private: true,
    init: { method: 'prompt', prompt: 'A shop.' },
  },
  ...patch,
});

describe('Deploy & previews when a repository is added', () => {
  it('creates and links the Apps the choices need, named after the repository, as the person', async () => {
    const created = await inits.newProject(
      alice(),
      existingShop({ deploy: deploy() }),
    );
    expect(created.deployError).toBeNull();
    expect(created.apps).toEqual([
      {
        appId: 'shop',
        role: 'production',
        previewEnvironmentId: null,
        name: 'shop',
        environmentId: 'production',
      },
      {
        appId: 'shop-staging',
        role: 'staging',
        previewEnvironmentId: null,
        name: 'shop staging',
        environmentId: 'staging',
      },
    ]);
    expect(created.ci).toEqual({ auto: true, state: 'manual' });
    const app = await h.releases!.releases.findApp('shop-staging');
    expect(app).toMatchObject({ createdBy: 'alice' });
  });

  it('creates no App when only previews are asked for: CI deploys them', async () => {
    const created = await inits.newProject(
      alice(),
      existingShop({
        deploy: deploy({
          stagingEnvironmentId: null,
          productionEnvironmentId: null,
          configureCi: false,
        }),
      }),
    );
    expect(created.apps).toEqual([]);
    expect(created.ci).toEqual({ auto: false, state: 'disabled' });
    expect(await h.releases!.releases.findApp('shop-preview')).toBeNull();
  });

  it('refuses a preview environment that runs images or is protected, before the repository is created', async () => {
    for (const previewEnvironmentId of ['docker', 'production'])
      await expect(
        inits.newProject(
          alice(),
          newShop({ deploy: deploy({ previewEnvironmentId }) }),
        ),
      ).rejects.toMatchObject({ code: 'PREVIEW_ENVIRONMENT_UNSUITABLE' });
    await expect(
      inits.newProject(
        alice(),
        newShop({ deploy: deploy({ stagingEnvironmentId: 'nowhere' }) }),
      ),
    ).rejects.toMatchObject({ code: 'UNKNOWN_ENVIRONMENT' });
    expect(h.github.repos.has('acme/shop')).toBe(false);
    expect(await h.projects.projects.list(alice())).toEqual([]);
  });

  it('has Apps set up only for someone who may create Apps or deploy to every App; anyone else adds the repository alone', async () => {
    await expect(
      inits.newProject(bob(), newShop({ deploy: deploy() })),
    ).rejects.toMatchObject({ code: 'APPS_NOT_CREATABLE' });
    expect(h.github.repos.has('acme/shop')).toBe(false);
    const created = await inits.newProject(bob(), newShop());
    expect(created).toMatchObject({ apps: [], ci: null, deployError: null });
    expect(h.github.repos.has('acme/shop')).toBe(true);
  });
});

describe('a working directory added to a project', () => {
  it('is made like a new project’s, its own init issue given its agent once recorded, and holds no other issue', async () => {
    const project = await inits.newProject(alice(), {
      name: 'Shop',
      codeLocation: 'none',
    });
    const added = await inits.createCodeLocation(alice(), project.projectId, {
      codeLocation: 'newRepo',
      initAgentId: agentId,
      newRepo: {
        connectionId: connection.id,
        name: 'shop',
        private: true,
        init: { method: 'prompt', prompt: 'A shop.' },
      },
      label: 'Storefront',
      deploy: deploy({ productionEnvironmentId: null }),
    });
    expect(added).toMatchObject({
      repo: { fullName: 'acme/shop' },
      init: { method: 'prompt', state: 'pending', firstCommit: true },
      apps: [expect.objectContaining({ appId: 'shop-staging' })],
    });
    const issue = await h.projects.issueQueries.detail(
      alice(),
      added.initIssueId!,
    );
    expect(issue.executor).toEqual({ type: 'agent', id: agentId });
    expect(issue.title).toContain('acme/shop');
    expect(
      (await h.projects.projects.get(alice(), project.projectId)).setupIssueId,
    ).toBeNull();
    const resource = (
      await h.projects.projects.get(alice(), project.projectId)
    ).resources.find((item) => item.id === added.resourceId);
    expect(resource?.label).toBe('Storefront');
    // Its run makes the first commit on the default branch.
    expect(
      await initialDirOf(
        h.database.connection(),
        added.initIssueId!,
        project.projectId,
      ),
    ).toEqual({ resourceId: added.resourceId, defaultBranch: 'main' });
    const later = await h.projects.issues.create(alice(), {
      title: 'Checkout page',
      projectId: project.projectId,
      start: false,
    });
    expect(
      (await h.projects.issueQueries.detail(alice(), later.id)).blockers,
    ).toEqual([]);
  });

  it('takes a repository by its clone URL alone, and is refused, before anything is made, to someone who does not manage the project', async () => {
    const project = await inits.newProject(alice(), {
      name: 'Shop',
      codeLocation: 'none',
    });
    await expect(
      inits.createCodeLocation(bob(), project.projectId, {
        codeLocation: 'newRepo',
        initAgentId: agentId,
        newRepo: {
          connectionId: connection.id,
          name: 'shop',
          private: true,
          init: { method: 'prompt', prompt: 'A shop.' },
        },
      }),
    ).rejects.toBeTruthy();
    expect(h.github.repos.has('acme/shop')).toBe(false);
    const added = await inits.createCodeLocation(alice(), project.projectId, {
      codeLocation: 'existingRepo',
      existingRepo: {
        cloneUrl: 'https://git.example.com/team/site.git',
        defaultBranch: 'trunk',
      },
      deploy: deploy({
        stagingEnvironmentId: null,
        productionEnvironmentId: null,
      }),
    });
    expect(added).toMatchObject({
      repo: null,
      init: null,
      apps: [],
    });
  });
});

describe('changing a repository’s choices', () => {
  it('unlinks a role left out', async () => {
    const created = await inits.newProject(
      alice(),
      existingShop({
        deploy: deploy({
          stagingEnvironmentId: null,
          productionEnvironmentId: null,
        }),
      }),
    );
    const resourceId = created.resourceId!;
    const staged = await links.save(alice(), resourceId, {
      apps: created.apps,
      plan: deploy({ productionEnvironmentId: null }),
    });
    expect(staged.apps).toEqual([
      expect.objectContaining({
        appId: 'shop-staging',
        role: 'staging',
        previewEnvironmentId: null,
      }),
    ]);
    const none = await links.save(alice(), resourceId, {
      apps: staged.apps,
      plan: deploy({
        previewEnvironmentId: null,
        stagingEnvironmentId: null,
        productionEnvironmentId: null,
        configureCi: false,
      }),
    });
    expect(none).toMatchObject({
      apps: [],
      ci: { auto: false, state: 'disabled' },
    });
  });
});
