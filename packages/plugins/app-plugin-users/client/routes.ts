import {
  defineAppRoutes,
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { Users } from 'lucide-react';

export const INVITE_ROUTE_ID = '@nocobase/app-plugin-users:invite';
/** The User management list at `/settings/users`. */
export const USERS_ROUTE_ID = '@nocobase/app-plugin-users:settingsUsers';
/** The New user dialog at `/settings/users/create`, opened over the list. */
export const USER_CREATE_ROUTE_ID =
  '@nocobase/app-plugin-users:settingsUserCreate';
/** The Edit user drawer at `/settings/users/:userId/edit`, opened over the list. */
export const USER_EDIT_ROUTE_ID = '@nocobase/app-plugin-users:settingsUserEdit';

/**
 * The page an invitation email links to. Public (`optional`) because the invitee has no account yet; the token in the
 * path identifies the invitation. New accounts register with the link; existing accounts sign in.
 */
const inviteRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'invite',
    path: '/invite/:token',
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/accept-invitation-page.js'),
  },
]);

/**
 * User management, in the Accounts and permissions category of System settings. An application replaces any of the
 * three pages with `routeComponentOverrides` and the route ids above; the others stay the plugin's.
 */
const settingsRoutes: AppClientRouteContribution = defineSystemSettingsRoutes([
  {
    parent: SYSTEM_SETTINGS_CATEGORIES.account,
    name: 'settingsUsers',
    path: '/users',
    auth: 'required',
    authz: { resource: { type: 'user', id: '*' }, action: 'read' },
    navigation: {
      // Leads Accounts and permissions, as it did as an application page: application routes register before plugin
      // routes, so the default order would put it after the application's own pages in the category.
      order: -100,
      title: 'management.users',
      description: 'management.usersDescription',
      icon: Users,
    },
    breadcrumb: { title: 'management.users' },
    componentLoader: () => import('./pages/users/users.js'),
    children: [
      // The forms declare their presentation, so the dialog or drawer opens at once and the wait for the form's module,
      // its authorization and its data stays inside it instead of under the list.
      {
        name: 'settingsUserCreate',
        path: 'create',
        authz: { resource: { type: 'user', id: '*' }, action: 'create' },
        presentation: { kind: 'dialog', title: 'management.newUser' },
        componentLoader: () => import('./pages/users/user-form.js'),
      },
      // A sibling rather than the parent of the editor, so closing the drawer returns to the list instead of to this
      // route, which only forwards older detail links to the editor.
      {
        name: 'settingsUser',
        path: ':userId',
        componentLoader: () => import('./pages/users/user-detail.js'),
      },
      {
        name: 'settingsUserEdit',
        path: ':userId/edit',
        presentation: { kind: 'drawer', title: 'management.editUser' },
        componentLoader: () => import('./pages/users/user-form.js'),
      },
    ],
  },
]);

const routes: readonly AppClientRouteContribution[] = [
  inviteRoutes,
  settingsRoutes,
];

export default routes;
