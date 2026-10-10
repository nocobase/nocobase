/**
 * The rules behind "Deployment" and the project's setup, without React: which ways to configure CI are offered with and
 * without a Git connection, the environment a trigger starts with and the App ID a target starts from, what is wrong
 * with a run, the reported Apps grouped by environment, the wizard's steps, the prompt for one's own agent (the file,
 * commands and secret's name, never a key), and the project's "Next steps".
 */
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { describe, expect, it } from 'vitest';

import { nextSteps } from '../../client/projects/detail/next-steps-model';
import { wizardSteps } from '../../client/projects/new-project-steps';
import {
  availableMethod,
  buildOfRow,
  ciRowName,
  ciRunProblems,
  defaultEnvironment,
  environmentSections,
  initialAppId,
  initialMethod,
  ownAgentPrompt,
  variablesPath,
} from '../../client/releases/ci-setup/model';
import type { CiEnvironment, CiReportedApp } from '../../shared/ci-modes';
import { CI_PROMPT_WORDS_EN } from '../../shared/ci-prompt';
import type { ProjectInitView } from '../../shared/project-init';

const repository = (
  id: string,
  label: string | null = null,
): ProjectResource => ({
  id,
  projectId: 'p1',
  type: 'gitRepo',
  url: `https://github.com/acme/${id}.git`,
  defaultRef: 'main',
  binding: null,
  runnerId: null,
  path: null,
  label,
  initPrompt: null,
  position: 0,
});

const environment = (
  id: string,
  name: string,
  protectedOne = false,
): CiEnvironment => ({
  id,
  name,
  protected: protectedOne,
});

const ENVIRONMENTS = [
  environment('preview', 'Preview'),
  environment('demo-staging', 'Staging (demo)'),
  environment('demo-production', 'Production (demo)', true),
];

describe('Configure CI', () => {
  it('offers the ways Studio carries out only with a Git connection, manual first without one', () => {
    expect(initialMethod(true)).toBe('direct');
    expect(initialMethod(false)).toBe('manual');
    expect(availableMethod('agent', false)).toBe('manual');
    expect(availableMethod('ownAgent', false)).toBe('ownAgent');
    expect(availableMethod('template', true)).toBe('template');
  });

  it('starts each trigger in its own environment: pull requests in Preview, a branch in staging, a tag in the protected one', () => {
    expect(defaultEnvironment('pullRequest', ENVIRONMENTS)).toBe('preview');
    expect(defaultEnvironment('branch', ENVIRONMENTS)).toBe('demo-staging');
    expect(defaultEnvironment('tag', ENVIRONMENTS)).toBe('demo-production');
    // Without them, the first unprotected one other than Preview, else any.
    const plain = [environment('preview', 'Preview'), environment('qa', 'QA')];
    expect(defaultEnvironment('branch', plain)).toBe('qa');
    expect(defaultEnvironment('tag', plain)).toBe('qa');
    expect(defaultEnvironment('pullRequest', [environment('qa', 'QA')])).toBe(
      'qa',
    );
    expect(defaultEnvironment('tag', [])).toBeNull();
  });

  it('starts the App ID from the application: the base for pull requests, <base>-<environment> otherwise', () => {
    const pulls = { trigger: 'pullRequest', environmentId: 'preview' } as const;
    expect(initialAppId('Shop.Web', '.', pulls)).toBe('shop-web');
    expect(initialAppId('shop', 'apps/admin/', pulls)).toBe('admin');
    expect(
      initialAppId('shop', '.', {
        trigger: 'branch',
        environmentId: 'staging',
      }),
    ).toBe('shop-staging');
    expect(
      initialAppId('shop', 'apps/admin', {
        trigger: 'tag',
        environmentId: 'demo-production',
      }),
    ).toBe('admin-demo-production');
    // A directory not valid yet names nothing after itself.
    expect(initialAppId(null, '../x', pulls)).toBe('app');
  });

  it('says what is wrong with a run', () => {
    const app = { directory: '.', appId: 'shop' };
    expect(
      ciRunProblems({
        app,
        target: { trigger: 'pullRequest', environmentId: 'preview' },
      }),
    ).toEqual([]);
    expect(
      ciRunProblems({
        app: { directory: '/abs', appId: 'Shop!' },
        target: { trigger: 'branch', ref: 'a b', environmentId: '' },
      }),
    ).toEqual(['directory', 'appId', 'ref', 'environment']);
    expect(
      ciRunProblems({
        app,
        target: { trigger: 'tag', ref: '', environmentId: 'production' },
      }),
    ).toEqual(['ref']);
  });
});

describe('the status list', () => {
  const app = (
    environmentId: string,
    appId: string,
    pullRequests = false,
  ): CiReportedApp => ({
    environmentId,
    appId,
    pullRequests,
    lastBuildAt: null,
    lastBuildState: null,
    lastDeployAt: null,
    connected: true,
  });

  it('groups the Apps by the environment they run in, in release management’s order', () => {
    const apps = [
      app('demo-production', 'crm-production'),
      app('preview', 'crm', true),
      app('preview', 'crm-admin', true),
      app('demo-staging', 'crm-staging'),
      app('gone', 'old'),
    ];
    const sections = environmentSections({
      apps,
      environments: ENVIRONMENTS,
    });
    expect(
      sections.map((section) => [
        section.environment.id,
        section.apps.map((item) => item.appId),
      ]),
    ).toEqual([
      ['preview', ['crm', 'crm-admin']],
      ['demo-staging', ['crm-staging']],
      ['demo-production', ['crm-production']],
      // An environment no longer listed is named by its ID.
      ['gone', ['old']],
    ]);
    expect(sections[3]!.environment.name).toBe('gone');
  });

  it('names a row, links its variables and finds its builds', () => {
    const pulls = app('preview', 'crm', true);
    const staging = app('demo-staging', 'crm');
    expect(ciRowName(pulls)).toBe('crm-pr-*');
    expect(ciRowName(staging)).toBe('crm');
    expect(variablesPath(pulls)).toBe('/environments/preview?tab=variables');
    expect(variablesPath(staging)).toBe('/releases/crm?tab=variables');
    expect(buildOfRow({ appId: 'crm-pr-12' }, 'crm-pr-*')).toBe(true);
    expect(buildOfRow({ appId: 'crm' }, 'crm-pr-*')).toBe(false);
    expect(buildOfRow({ appId: 'crm-pr-12' }, 'crm')).toBe(false);
    expect(buildOfRow({ appId: 'crm' }, 'crm')).toBe(true);
  });
});

describe('the wizard', () => {
  it('has a Deploy step only for a repository', () => {
    expect(wizardSteps(true)).toEqual([1, 2, 3]);
    expect(wizardSteps(false)).toEqual([1, 2]);
  });
});

describe('the prompt for one’s own agent', () => {
  const input = {
    studioUrl: 'https://studio.example.com',
    repo: 'acme/shop',
    defaultBranch: 'main',
    app: { directory: 'apps/admin', appId: 'admin' },
    files: [
      {
        path: '.github/workflows/nb-studio-admin-preview.yml',
        content: 'name: Admin\n',
      },
    ],
    secretName: 'NB_STUDIO_API_KEY',
  };

  it('carries the repository, the application, the file and the commands of pull requests, and asks for the key without taking it', () => {
    const prompt = ownAgentPrompt(
      {
        ...input,
        target: { trigger: 'pullRequest', environmentId: 'preview' },
      },
      CI_PROMPT_WORDS_EN,
    );
    expect(prompt).toContain('acme/shop');
    expect(prompt).toContain('https://studio.example.com');
    expect(prompt).toContain('for pull requests');
    expect(prompt).toContain('- Directory: `apps/admin`');
    expect(prompt).toContain('- Apps: `admin-pr-<number>`');
    expect(prompt).toContain('.github/workflows/nb-studio-admin-preview.yml');
    expect(prompt).toContain('name: Admin');
    // The commands: the build's progress, the pull request's own App, the archive uploaded and deployed, a failure.
    // The CLI reads the repository and the commit from CI, and a comment says what to add elsewhere.
    expect(prompt).toContain(
      'nb-studio build status --app "admin-pr-$PR" --state building',
    );
    expect(prompt).toContain(
      'nb-studio app ensure "admin-pr-$PR" --environment preview\n',
    );
    expect(prompt).toContain(
      'nb-studio deploy --app "admin-pr-$PR" --file storage/exports/dist.tar.gz',
    );
    expect(prompt).toContain(
      'elsewhere add --repository <owner/repo> --sha <commit>',
    );
    expect(prompt).not.toContain('$SHA');
    expect(prompt).toContain(
      'generate the repository’s CI key in Studio (https://studio.example.com: the project’s settings › Deployment › Configure CI',
    );
    expect(prompt).toContain(
      '`nb-studio build ci setup <owner/repo> --reveal`) and to store it as the repository secret `NB_STUDIO_API_KEY`',
    );
    expect(prompt).toContain('Never ask me to paste the key to you.');
    expect(prompt).not.toMatch(/\{\{\w+\}\}/u);
  });

  it('says the branch or tag pattern and the environment of other targets', () => {
    const branch = ownAgentPrompt(
      {
        ...input,
        app: { directory: 'apps/admin', appId: 'admin-staging' },
        target: { trigger: 'branch', environmentId: 'staging' },
      },
      CI_PROMPT_WORDS_EN,
    );
    // A branch target naming none builds the default branch.
    expect(branch).toContain('for the branch `main`');
    expect(branch).toContain('in the environment `staging`');
    expect(branch).toContain(
      '- App: `admin-staging`, made in `staging` when it is missing',
    );
    expect(branch).toContain(
      'nb-studio app ensure admin-staging --environment staging\n',
    );
    const tag = ownAgentPrompt(
      {
        ...input,
        target: { trigger: 'tag', ref: 'release-*', environmentId: 'live' },
      },
      CI_PROMPT_WORDS_EN,
    );
    expect(tag).toContain('for tags matching `release-*`');
    expect(tag).toContain('--environment live');
    expect(tag).not.toMatch(/\{\{\w+\}\}/u);
  });
});

describe('next steps', () => {
  const t = (key: string, values?: Record<string, unknown>) =>
    values ? `${key}(${Object.values(values).join(',')})` : key;
  const init = (state: ProjectInitView['state']) =>
    ({ state, issueId: 'i1' }) as ProjectInitView;

  it('asks for a working directory, the initialization and each repository’s preview CI', () => {
    expect(
      nextSteps({ projectId: 'p1', resources: [], init: null, ci: {} }, t).map(
        (step) => [step.key, step.to],
      ),
    ).toEqual([['directory', '/projects/p1/settings?section=directories']]);
    const steps = nextSteps(
      {
        projectId: 'p1',
        // A repository is named owner/repo, whatever label an older version stored.
        resources: [repository('web', 'Frontend'), repository('api')],
        init: init('pending'),
        ci: { web: 'none', api: 'task' },
      },
      t,
    );
    expect(steps).toEqual([
      {
        key: 'init',
        title: 'projectPage.nextSteps.init',
        state: 'projectPage.init.states.pending',
        to: '/issues/i1',
      },
      {
        key: 'ci:web',
        title: 'projectPage.nextSteps.ci(acme/web)',
        state: null,
        to: '/projects/p1/settings?section=ci&repo=web',
      },
      {
        key: 'ci:api',
        title: 'projectPage.nextSteps.ci(acme/api)',
        state: 'ciSetup.states.task',
        to: '/projects/p1/settings?section=ci&repo=api',
      },
    ]);
  });

  it('has nothing left once everything is set up, or while a repository’s CI is unknown', () => {
    expect(
      nextSteps(
        {
          projectId: 'p1',
          resources: [repository('web'), repository('api')],
          init: init('done'),
          ci: { web: 'connected' },
        },
        t,
      ),
    ).toEqual([]);
  });
});
