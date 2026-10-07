import {
  defineAppRoutes,
  type AppClientRouteContribution,
  type AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { FolderKanban } from 'lucide-react';

import type { Page } from '../shared/access.js';

const page = (id: Page) =>
  ({ resource: { type: 'page', id }, action: 'access' }) as const;

/**
 * The work pages. The settings pages (`client/config.ts`) are routed by the application under its own `/config`, next
 * to its members and roles. Tabs and overlays
 * (dialogs, covering detail pages) are child routes: they inherit the page grant, and a page with children places an
 * `<Outlet />` for them.
 *
 * The plugin registers them itself unless the application passes `routes: false` and mounts them from
 * `client/pages.ts` instead, for example under a navigation group of its own.
 */

/** The "New issue" dialog (`pages/issues/new.tsx`), under `/issues` and wherever the application hosts it. */
export const newIssueDefinition: AppClientRoutePageDefinition = {
  name: 'pm-issue-new',
  path: 'new',
  componentLoader: () => import('./pages/issues/new.js'),
};

/**
 * The issue pages under `/issues` that the application's issues page hosts (`client/pages.ts`, `issueChildRoutes`):
 * the "New issue" dialog and a plan's page. The application owns `/issues`, `/my-issues` and an issue's page
 * (`/issues/:issueId`) and composes them from `client/issues.ts` and `client/issue-page.ts`; its `/issues` page places
 * an `<Outlet />` for these.
 */
export const issueChildDefinitions: readonly AppClientRoutePageDefinition[] = [
  newIssueDefinition,
  {
    // A plan's own page (the timeline's "via ‹Agent›'s plan" links here).
    name: 'pm-plan',
    path: 'plans/:planId',
    componentLoader: () => import('./pages/plans/detail.js'),
  },
];

/** The dialogs over an issue's page that stay this plugin's: "New sub-issue" (`new-subtask`). */
export const issueDetailChildDefinitions: readonly AppClientRoutePageDefinition[] =
  [
    {
      name: 'pm-subtask-new',
      path: 'new-subtask',
      componentLoader: () => import('./pages/issues/detail/new-subtask.js'),
    },
  ];

export const projectsDefinition: AppClientRoutePageDefinition = {
  name: 'pm-projects',
  path: '/projects',
  auth: 'required',
  authz: page('pm-projects'),
  navigation: { title: 'nav.projects', icon: FolderKanban },
  breadcrumb: { title: 'nav.projects' },
  componentLoader: () => import('./pages/projects/index.js'),
  children: [
    {
      name: 'pm-project-new',
      path: 'new',
      componentLoader: () => import('./pages/projects/new.js'),
    },
  ],
};

const app: AppClientRouteContribution = defineAppRoutes([projectsDefinition]);

const routes: readonly AppClientRouteContribution[] = [app];

export default routes;
