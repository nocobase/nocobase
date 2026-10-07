/**
 * The work pages as route definitions, for an application that routes them itself (`projects({ routes: false })`),
 * for example under a navigation group of its own. Every page is bound to this plugin's namespace, since it renders
 * under the application's. The application gives each its own `navigation` and `breadcrumb`, whose titles are looked up
 * in the application's namespace.
 */
import type {
  AppClientRouteDefinition,
  AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { withNamespace } from '@nocobase/i18n/client';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import {
  issueChildDefinitions,
  issueDetailChildDefinitions,
  newIssueDefinition,
  projectsDefinition,
} from './routes.js';

function bind<T extends AppClientRouteDefinition>(definition: T): T {
  const {
    navigation: _navigation,
    breadcrumb: _breadcrumb,
    ...rest
  } = definition;
  const children = definition.children?.map(bind);
  if (!definition.componentLoader)
    return { ...rest, ...(children ? { children } : {}) } as unknown as T;
  const load = definition.componentLoader;
  return {
    ...rest,
    componentLoader: async () => ({
      default: withNamespace(ACCESS_NAMESPACE, (await load()).default),
    }),
    ...(children ? { children } : {}),
  } as unknown as T;
}

/**
 * The pages under `/issues` (new issue, a plan), for the application's own `/issues` page to host as its children.
 * The application composes `/issues`, `/my-issues` and an issue's page itself (`client/issues.ts`,
 * `client/issue-page.ts`).
 */
export const issueChildRoutes: readonly AppClientRouteDefinition[] =
  issueChildDefinitions.map((definition) => bind(definition));
/** The dialogs over an issue's page (`new-subtask`), for the application's issue page to host as its children. */
export const issueDetailChildRoutes: readonly AppClientRouteDefinition[] =
  issueDetailChildDefinitions.map((definition) => bind(definition));
/** `/projects`: the projects and "New project"; the application adds a project's page (`:projectId`) to its children. */
export const projectsRoute: AppClientRoutePageDefinition =
  bind(projectsDefinition);
/**
 * The "New issue" dialog alone, for the application to host over another page under its own name and path, such as a
 * project page's tabs (`/projects/:projectId/<tab>/new-issue`), where the project is preselected and the dialog closes
 * there once the issue is created.
 */
export const newIssueRoute: AppClientRoutePageDefinition =
  bind(newIssueDefinition);
