/**
 * What the deployment demo (`deploy-build.ts`) adds on top of the demo projects (`data.ts`): a demo Git connection,
 * repositories bound to it, their preview CI in each state, pull requests with previews, staging and production Apps
 * with their deployments, deployment marks and a request waiting for approval, and preview variables. Nothing here
 * names a real host: the connection's web pages are on `github.example.com`, its API on a host that cannot resolve, and
 * CI's run pages on `example.com`.
 */
import type { PullRequestCiState } from '../../shared/git.js';

/** The demo connection, stored as a token connection marked `demo`. */
export const DEMO_CONNECTION = {
  name: 'Demo connection (never calls GitHub)',
  account: 'acme-demo',
  webUrl: 'https://github.example.com',
  // `.invalid` never resolves (RFC 2606): even a call the demo marker missed reaches nothing.
  apiBaseUrl: 'https://api.github.invalid',
} as const;

/** Where CI's run pages of the demo point. */
export const DEMO_CI_URL = 'https://example.com/acme-demo';

/** A project the deployment demo adds, beside those of `data.ts`. */
export interface DemoDeployProject {
  readonly name: string;
  readonly description: string;
  readonly lead: string;
  readonly members: readonly string[];
}

export const DEMO_DEPLOY_PROJECTS: readonly DemoDeployProject[] = [
  {
    name: 'CRM System',
    description:
      'A customer relationship management system built on NocoBase. The acme-demo/crm repository holds two applications: apps/crm (for the sales team) and apps/admin (for administrators). Every PR builds a preview; a merge deploys to Staging, and an approval deploys to Production.\n\n> Demo data: the repository, PRs, builds and deployments are only records. Studio never calls GitHub and never runs these applications.',
    lead: 'alex',
    members: ['admin', 'alex', 'lisa', 'leo', 'chloe'],
  },
  {
    name: 'Business Dashboard',
    description:
      'A business metrics dashboard for management, in the acme-demo/dashboard repository. Its CI is not connected to Studio yet: copy the workflow and the prompt from Deployment in the project settings to connect it yourself.\n\n> Demo data; never calls GitHub.',
    lead: 'leo',
    members: ['admin', 'leo', 'zach'],
  },
];

/** The CI state a repository is shown in (`shared/ci-modes.ts`, `CiConnectionState`). */
export type DemoCiState = 'connected' | 'pr-open' | 'task' | 'none';

/** A repository of a demo project, bound to the demo connection. */
export interface DemoRepository {
  readonly key: string;
  /** The project, by name (`data.ts` or `DEMO_DEPLOY_PROJECTS`). */
  readonly project: string;
  readonly fullName: string;
  /** The host's id of the repository. */
  readonly externalId: string;
  /** The NocoBase applications it holds. */
  readonly apps: readonly {
    readonly directory: string;
    readonly appId: string;
  }[];
  readonly ci: DemoCiState;
}

export const DEMO_REPOSITORIES: readonly DemoRepository[] = [
  {
    key: 'crm',
    project: 'CRM System',
    fullName: 'acme-demo/crm',
    externalId: '900001',
    apps: [
      { directory: 'apps/crm', appId: 'crm' },
      { directory: 'apps/admin', appId: 'crm-admin' },
    ],
    ci: 'connected',
  },
  {
    key: 'website',
    project: 'Website Redesign',
    fullName: 'acme-demo/website',
    externalId: '900002',
    apps: [{ directory: '.', appId: 'website' }],
    ci: 'pr-open',
  },
  {
    key: 'platform',
    project: 'Studio Platform',
    fullName: 'acme-demo/platform',
    externalId: '900003',
    apps: [{ directory: '.', appId: 'platform' }],
    ci: 'task',
  },
  {
    key: 'dashboard',
    project: 'Business Dashboard',
    fullName: 'acme-demo/dashboard',
    externalId: '900004',
    apps: [{ directory: '.', appId: 'dashboard' }],
    ci: 'none',
  },
];

/** The working directory on a runner the platform project keeps beside its repository. */
export const DEMO_RUNNER_DIRECTORY = {
  project: 'Studio Platform',
  runnerId: 'demo-runner',
  path: '/srv/acme-demo/platform',
  label: 'Local working directory (demo)',
  initPrompt: 'Run pnpm install first, then copy .env.example to .env.',
} as const;

/** The pull request that adds the website's workflow, waiting to be merged. */
export const DEMO_CI_PULL_REQUEST = 12;

/** The title of the issue the platform's agent connects its CI in. */
export const DEMO_CI_TASK_TITLE = 'Set up deployment';

/** A fixed 40-hex commit, readable in the demo by its first characters. */
const sha = (prefix: string): string => prefix.padEnd(40, '0');

export const DEMO_SHAS = {
  /** What Staging runs, and Production's pending request. */
  staging: sha('a1b2c3d4e5f6'),
  /** What Production runs, tagged v1.4.0. */
  production: sha('9e8d7c6b5a4f'),
  pr12: sha('c12c12c12c12'),
  pr15: sha('c15c15c15c15'),
  pr18: sha('c18c18c18c18'),
  pr9Merge: sha('b9b9b9b9b9b9'),
  pr10Merge: sha('b10b10b10b10'),
} as const;

/** How a demo issue's pull request previews. */
export type DemoPreviewState = 'ready' | 'blocked' | 'building';

/** An issue of the CRM project, with the pull request linked to it. */
export interface DemoDeployIssue {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly priority: string;
  readonly owner: string;
  readonly executor: string;
  readonly pullRequest: {
    readonly number: number;
    readonly title: string;
    readonly branch: string;
    readonly state: 'open' | 'merged';
    readonly headSha: string;
    readonly mergeCommitSha?: string;
    readonly ciState: PullRequestCiState;
    readonly author: string;
    /** How many days it has been open, when longer than the demo's build (the dashboard's waits for review). */
    readonly openedDaysAgo?: number;
  };
  readonly preview?: DemoPreviewState;
  /** Environments whose current deployment carries its change. */
  readonly deployed?: readonly ('staging' | 'production')[];
}

export const DEMO_DEPLOY_ISSUES: readonly DemoDeployIssue[] = [
  {
    key: 'crm-import',
    title: 'Bulk import customers',
    description:
      'The sales team needs to import customers in bulk from Excel: a template to download, field mapping and an import results report.\n\nThe preview is deployed; open it from Preview on the right to try it.',
    status: 'in_review',
    priority: 'high',
    owner: 'alex',
    executor: 'lisa',
    pullRequest: {
      number: 12,
      title: 'feat(crm): import customers from Excel',
      branch: 'feature/customer-import',
      state: 'open',
      headSha: DEMO_SHAS.pr12,
      ciState: 'success',
      author: 'lisa',
    },
    preview: 'ready',
  },
  {
    key: 'crm-kanban',
    title: 'Drag to reorder the opportunity board',
    description:
      'The opportunity board has a column per stage; drag a card to change its stage and order. The map view needs the SMS verification service key, so the preview is waiting for that variable.',
    status: 'in_review',
    priority: 'medium',
    owner: 'alex',
    executor: 'leo',
    pullRequest: {
      number: 15,
      title: 'feat(crm): drag opportunities between stages',
      branch: 'feature/opportunity-kanban',
      state: 'open',
      headSha: DEMO_SHAS.pr15,
      ciState: 'failure',
      author: 'leo',
      openedDaysAgo: 4,
    },
    preview: 'blocked',
  },
  {
    key: 'crm-report',
    title: 'Filters for exported reports',
    description:
      'Filter customer reports by owner, region and close date when exporting them. CI is building this PR’s preview.',
    status: 'in_progress',
    priority: 'medium',
    owner: 'alex',
    executor: 'chloe',
    pullRequest: {
      number: 18,
      title: 'feat(crm): filter exported reports',
      branch: 'feature/report-filters',
      state: 'open',
      headSha: DEMO_SHAS.pr18,
      ciState: 'pending',
      author: 'chloe',
    },
    preview: 'building',
  },
  {
    key: 'crm-wecom',
    title: 'Sign in with a WeCom QR code',
    description:
      'Employees can sign in to the CRM by scanning a WeCom QR code. Deployed to Staging and Production.',
    status: 'done',
    priority: 'high',
    owner: 'alex',
    executor: 'lisa',
    pullRequest: {
      number: 9,
      title: 'feat(auth): sign in with WeCom QR code',
      branch: 'feature/wecom-login',
      state: 'merged',
      headSha: sha('d9d9d9d9d9d9'),
      mergeCommitSha: DEMO_SHAS.pr9Merge,
      ciState: 'success',
      author: 'lisa',
    },
    deployed: ['staging', 'production'],
  },
  {
    key: 'crm-timezone',
    title: 'Fix the time zone on the customer details page',
    description:
      'Follow-up times on the customer details page show in the browser’s time zone. Verified on Staging, waiting to be deployed to Production (pending approval).',
    status: 'done',
    priority: 'medium',
    owner: 'alex',
    executor: 'chloe',
    pullRequest: {
      number: 10,
      title: 'fix(crm): show follow-up times in the viewer’s time zone',
      branch: 'fix/detail-timezone',
      state: 'merged',
      headSha: sha('d10d10d10d10'),
      mergeCommitSha: DEMO_SHAS.pr10Merge,
      ciState: 'success',
      author: 'chloe',
    },
    deployed: ['staging'],
  },
];

/** Values every CRM preview App sets as its own, over the Preview environment's: one plain, one secret. */
export const DEMO_PREVIEW_APP_VARIABLES: readonly {
  readonly name: string;
  readonly value: string;
  readonly secret: boolean;
}[] = [
  { name: 'DEMO_BANNER_TEXT', value: 'This is a demo preview', secret: false },
  {
    name: 'MAP_API_KEY',
    value: 'demo-map-key-not-a-real-secret',
    secret: true,
  },
];

/** A variable on the Preview environment, which every preview there takes; no App reads it. */
export const DEMO_ENVIRONMENT_VARIABLE = {
  name: 'STUDIO_DEMO_NOTICE',
  value: 'Added by Studio’s demo data; safe to delete',
  description: 'Added by Studio’s demo data; no App reads it.',
} as const;

/** The variable the blocked preview's build requires and nothing sets. */
export const DEMO_MISSING_VARIABLE = {
  name: 'SMS_API_KEY',
  description: 'The SMS verification service key (demo)',
} as const;

/** The demo's staging and production environments, on the local App Host. */
export const DEMO_ENVIRONMENTS = {
  staging: { id: 'demo-staging', name: 'Staging' },
  production: { id: 'demo-production', name: 'Production' },
} as const;

/** The CRM application's long-lived Apps, and the releases they run. */
export const DEMO_RELEASES = {
  staging: {
    appId: 'crm-staging',
    name: 'CRM Staging (demo)',
    version: '1.4.1-rc.1',
    sha: DEMO_SHAS.staging,
    ref: 'main',
  },
  production: {
    appId: 'crm-production',
    name: 'CRM Production (demo)',
    version: '1.4.0',
    sha: DEMO_SHAS.production,
    ref: 'v1.4.0',
  },
  /** Built from what Staging runs, waiting for an approver before it reaches Production. */
  pending: { version: '1.4.1', sha: DEMO_SHAS.staging, ref: 'v1.4.1' },
} as const;

/** Where the demo's images are said to be: no registry is ever asked. */
export const DEMO_IMAGE = 'registry.example.com/acme-demo/crm';
