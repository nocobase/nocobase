/**
 * The GitHub Actions workflow of one application and one target of a repository's CI (`shared/ci-modes.ts`,
 * `CiTarget`): CI is the source of truth for what is deployed where, and deployments do not know what they are for.
 * Every target runs the same three commands with its own App and environment: `nb-studio build status` (the build's
 * progress), `nb-studio app ensure <app> --environment <env>` (the App, made when missing) and `nb-studio deploy --app <app>
 * --file <archive>` (uploaded and deployed in one). None names the repository or the commit: the CLI reads them from
 * the run (`GITHUB_REPOSITORY`, and the pull request's head from the event's payload, else `GITHUB_SHA`).
 *
 * | trigger       | runs on                                            | deploys                                          |
 * | ------------- | -------------------------------------------------- | ------------------------------------------------ |
 * | `pullRequest` | a pull request opened, pushed or reopened that     | `<app>-pr-<number>` in the environment: Studio    |
 * |               | touches the application                            | records the pull request as its source and       |
 * |               |                                                    | removes it once the pull request goes            |
 * | `branch`      | a push to the branch                               | `<app>` in the environment                       |
 * | `tag`         | a tag matching the pattern pushed                  | `<app>` in the environment, where a protected    |
 * |               |                                                    | environment usually asks an approver             |
 *
 * The file is `ciWorkflowPathOf` (`.github/workflows/nb-studio-<app>-<purpose>.yml`: `preview` for pull requests, else the
 * environment's name, `nb-studio-crm-preview.yml`, `nb-studio-crm-staging.yml`). Studio writes
 * it (`ciWorkflowFile`, for "Configure CI") and serves it to copy; `ciWorkflow` is the pull request workflow of each
 * application of a repository (`GET /api/repositoryDeployments/:resourceId/ciWorkflow`).
 *
 * A pull request runs only for what it touches: the application's directory or a file every application shares
 * (`SHARED_FILES`, and the workflow itself), with GitHub's own `paths` filter (none for an application at the root,
 * where everything is the application); a pull request that touches none of it runs nothing and gets no App. A branch
 * or a tag builds on every push.
 *
 * Each job checks the commit out (a pull request's head, not GitHub's merge commit), works in the application's
 * directory, reports `building` with the run's address, installs the CLI from the tarball Studio serves
 * (`DIST_ROUTES.resolve`, for `linux-x64`), builds, makes sure of the App, uploads and deploys the archive (which
 * marks the build succeeded), and reports `failed` when a step fails. A pull request's older runs are cancelled. The
 * build command is a NocoBase application's usual one, to adjust in place. Each header names Studio's address after
 * the "Managed by NocoBase Studio" marker.
 */
import { DIST_ROUTES } from '@nocobase/agent-protocol';

import {
  CI_DEFAULT_TAG_PATTERN,
  CI_PREVIEW_ENVIRONMENT,
  ciWorkflowPathOf,
  type CiTarget,
  type CiWorkflowOccupant,
} from '../../shared/ci-modes.js';
import {
  appIdsFor,
  type CiWorkflow,
  type CiWorkflowFile,
} from '../../shared/releases.js';

/** The repository secret the workflows read the API key from. */
export const CI_SECRET = 'NB_STUDIO_API_KEY';
/** The first words of a workflow's header: a file Studio wrote and keeps up to date. */
export const CI_MANAGED_MARKER = 'Managed by NocoBase Studio';

/** Files at the repository's root every application depends on: a pull request touching one builds them all. */
export const SHARED_FILES: readonly string[] = [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'package.json',
];

/** An application of the repository: where it lives, and its App ID. */
export interface CiApplication {
  /** Its directory from the repository's root; `.` for the root. */
  readonly directory: string;
  /** The App a branch or tag deploys to; the base of `<appId>-pr-<number>` for pull requests. */
  readonly appId: string;
}

/** How an App is built: the archive `pnpm build --tar` leaves. */
const BUILD_STEPS = [
  '      - run: pnpm install --frozen-lockfile',
  '      # Leaves storage/exports/dist.tar.gz: dist/ and config.example.yml.',
  '      - run: pnpm build --target linux-x64 --tar',
].join('\n');
const BUILD_ARCHIVE = 'storage/exports/dist.tar.gz';

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** The platform the workflows' jobs run on (`ubuntu-latest`). */
export const CI_TARGET = 'linux-x64';

/** Where the CI resolves the current tarball of the application's CLI (`DIST_ROUTES.resolve`), below Studio's address. */
export function cliResolvePath(
  product: string,
  target: string = CI_TARGET,
): string {
  return DIST_ROUTES.resolve
    .replace(':product', encodeURIComponent(product))
    .replace(':target', encodeURIComponent(target));
}

/** A directory as the workflow names it: no `./`, no trailing slash; `.` for the root. */
export function normalDirectory(directory: string): string {
  const clean = directory
    .trim()
    .replace(/^(?:\.\/)+/u, '')
    .replace(/\/+$/u, '');
  return clean === '' ? '.' : clean;
}

/** An App ID as a job id or concurrency group may hold it. */
const slugOf = (value: string) => value.replace(/[^A-Za-z0-9_-]/gu, '-');

const LOGS =
  '      LOGS: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}';

/** The steps every job shares: check the commit out, install the CLI and sign in, report `building`, build. */
function setupSteps(
  directory: string,
  cli: string,
  target: string,
  pullRequest: boolean,
): string[] {
  return [
    '    steps:',
    '      - uses: actions/checkout@v4',
    ...(pullRequest
      ? [
          '        with:',
          '          ref: ${{ github.event.pull_request.head.sha }}',
        ]
      : []),
    '      - uses: pnpm/action-setup@v4',
    ...(directory === '.'
      ? []
      : [
          '        with:',
          `          package_json_file: ${quote(`${directory}/package.json`)}`,
        ]),
    '      - uses: actions/setup-node@v4',
    '        with:',
    '          node-version: 24',
    '          cache: pnpm',
    ...(directory === '.'
      ? []
      : [
          `          cache-dependency-path: ${quote(`${directory}/pnpm-lock.yaml`)}`,
        ]),
    '      - name: Install the nb-studio CLI',
    '        env:',
    `          NB_STUDIO_API_KEY: \${{ secrets.${CI_SECRET} }}`,
    '        run: |',
    `          eval "$(curl -fsS -H "x-api-key: $NB_STUDIO_API_KEY" "$NB_STUDIO_URL${cliResolvePath(cli)}?format=env")"`,
    '          mkdir -p "$RUNNER_TEMP/nb-studio"',
    '          curl -fsS -H "x-api-key: $NB_STUDIO_API_KEY" "$NB_STUDIO_URL$url" | tar -xz --strip-components=1 -C "$RUNNER_TEMP/nb-studio"',
    '          echo "$RUNNER_TEMP/nb-studio/bin" >> "$GITHUB_PATH"',
    '          printf %s "$NB_STUDIO_API_KEY" | NB_STUDIO_KEYCHAIN=off "$RUNNER_TEMP/nb-studio/bin/nb-studio" login --server "$NB_STUDIO_URL" --api-key-stdin',
    `      - run: nb-studio build status ${target} --state building --logs "$LOGS"`,
    BUILD_STEPS,
  ];
}

/** Where a job's `run` steps work. */
function jobDefaults(directory: string): string[] {
  return directory === '.'
    ? []
    : [
        '    defaults:',
        '      run:',
        `        working-directory: ${quote(directory)}`,
      ];
}

/** What a workflow file is generated from. */
export interface CiWorkflowFileInput {
  /** Studio's public address, which the CLI signs in to. */
  readonly studioUrl: string;
  readonly app: CiApplication;
  readonly target: CiTarget;
  /** The target environment's name, which names the file of a branch or tag (`ciWorkflowPathOf`). */
  readonly environmentName?: string | null;
  /** The Studio file already at the file's path, when another target's takes it a suffix (`ciWorkflowPathOf`). */
  readonly occupant?: CiWorkflowOccupant | null;
  /** The branch a branch target builds when it names none; `main` by default. */
  readonly defaultBranch?: string;
  /** Studio set the CI up and keeps its secret (`ci-setup.ts`). */
  readonly managed?: boolean;
  /** The application's CLI as Studio serves it (`agents.cli.name`), `nb-studio` unless configured otherwise. */
  readonly cli?: string;
}

/** What starts the workflow: GitHub's `on`. */
function triggerOf(
  app: CiApplication,
  target: CiTarget,
  path: string,
  defaultBranch: string,
): string[] {
  if (target.trigger === 'branch')
    return [
      '  push:',
      `    branches: [${quote(target.ref?.trim() || defaultBranch)}]`,
    ];
  if (target.trigger === 'tag')
    return [
      '  push:',
      `    tags: [${quote(target.ref?.trim() || CI_DEFAULT_TAG_PATTERN)}]`,
    ];
  // Only what the pull request touches; an application at the root is all of it.
  return [
    '  pull_request:',
    '    types: [opened, synchronize, reopened]',
    ...(app.directory === '.'
      ? []
      : [
          '    paths:',
          ...[`${app.directory}/**`, ...SHARED_FILES, path].map(
            (pattern) => `      - ${quote(pattern)}`,
          ),
        ]),
  ];
}

/** What the header says the workflow does. */
function summaryOf(target: CiTarget, defaultBranch: string): string {
  if (target.trigger === 'branch')
    return `on every push to ${target.ref?.trim() || defaultBranch}: builds it and deploys it to its App in ${target.environmentId}`;
  if (target.trigger === 'tag')
    return `on every tag matching ${target.ref?.trim() || CI_DEFAULT_TAG_PATTERN}: builds it and deploys it to its App in ${target.environmentId}`;
  return `on the pull requests that touch it: builds the head and deploys it to the pull request's own App in ${target.environmentId}`;
}

/** The workflow file of an application and a target. */
export function ciWorkflowFile(input: CiWorkflowFileInput): CiWorkflowFile {
  const app: CiApplication = {
    directory: normalDirectory(input.app.directory),
    appId: input.app.appId.trim(),
  };
  const { target } = input;
  const cli = input.cli ?? 'nb-studio';
  const defaultBranch = input.defaultBranch ?? 'main';
  const path = ciWorkflowPathOf(
    {
      appId: app.appId,
      trigger: target.trigger,
      environmentId: target.environmentId,
      environmentName: input.environmentName ?? null,
    },
    input.occupant ?? null,
  );
  const pullRequest = target.trigger === 'pullRequest';
  const named = '--app "$APP_ID"';
  const content = [
    `# ${CI_MANAGED_MARKER} (${input.studioUrl}): deploys ${app.appId}${app.directory === '.' ? '' : ` (${app.directory})`} ${summaryOf(target, defaultBranch)}.`,
    input.managed
      ? `# Studio keeps the repository secret ${CI_SECRET} (an organization API key for this repository's CI) and rotates it.`
      : `# Store the repository's CI key (Studio: the project's Deployment › Configure CI, or nb-studio build ci setup <owner/repo> --reveal) as the repository secret ${CI_SECRET}.`,
    `name: NocoBase Studio ${app.appId} ${target.environmentId}`,
    'on:',
    ...triggerOf(app, target, path, defaultBranch),
    'permissions:',
    '  contents: read',
    'env:',
    `  NB_STUDIO_URL: ${quote(input.studioUrl)}`,
    'jobs:',
    '  deploy:',
    `    name: Deploy ${app.appId} to ${target.environmentId}`,
    '    runs-on: ubuntu-latest',
    '    concurrency:',
    pullRequest
      ? `      group: nb-studio-${slugOf(app.appId)}-${slugOf(target.environmentId)}-\${{ github.event.pull_request.number }}`
      : `      group: nb-studio-${slugOf(app.appId)}-${slugOf(target.environmentId)}`,
    `      cancel-in-progress: ${pullRequest ? 'true' : 'false'}`,
    ...jobDefaults(app.directory),
    '    env:',
    `      APP_ID: ${quote(pullRequest ? `${app.appId}-pr-\${{ github.event.pull_request.number }}` : app.appId)}`,
    `      ENVIRONMENT: ${quote(target.environmentId)}`,
    LOGS,
    ...setupSteps(app.directory, cli, named, pullRequest),
    pullRequest
      ? "      # The pull request's own App: Studio records the pull request as its source and removes it once it goes."
      : '      # The App, made in the environment when it is missing (the key must be allowed to).',
    '      - run: nb-studio app ensure "$APP_ID" --environment "$ENVIRONMENT"',
    '      # Uploads the archive and deploys it; a protected environment asks its approvers instead.',
    `      - run: nb-studio deploy ${named} --file ${BUILD_ARCHIVE}`,
    '      - if: failure()',
    `        run: nb-studio build status ${named} --state failed --logs "$LOGS"`,
    '',
  ].join('\n');
  return { path, content };
}

/** What `ciWorkflow` takes. */
export interface CiWorkflowInput {
  readonly studioUrl: string;
  /** The repository's name, the single application at its root is named after when `apps` is left out. */
  readonly repositoryName: string;
  /** The applications in the repository; one at its root, named after the repository, by default. */
  readonly apps?: readonly CiApplication[];
  readonly defaultBranch?: string;
  /** The environment pull requests deploy to; `preview` by default. */
  readonly environmentId?: string;
  readonly managed?: boolean;
  readonly cli?: string;
}

/** The pull request workflow of each application of a repository. */
export function ciWorkflow(input: CiWorkflowInput): CiWorkflow {
  const given = (input.apps ?? []).filter((app) => app.appId.trim());
  const apps =
    given.length > 0
      ? given
      : [{ directory: '.', appId: appIdsFor(input.repositoryName).production }];
  const target: CiTarget = {
    trigger: 'pullRequest',
    environmentId: input.environmentId ?? CI_PREVIEW_ENVIRONMENT,
  };
  return {
    files: apps.map((app) =>
      ciWorkflowFile({
        studioUrl: input.studioUrl,
        app,
        target,
        ...(input.defaultBranch ? { defaultBranch: input.defaultBranch } : {}),
        managed: input.managed ?? false,
        ...(input.cli ? { cli: input.cli } : {}),
      }),
    ),
    secret: CI_SECRET,
  };
}
