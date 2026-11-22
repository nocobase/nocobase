import { Users } from 'lucide-react';
import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

/**
 * Users, in the Accounts category of the System settings shell
 * (`shell-routes.ts`). Register this contribution as business capabilities are developed; a bare application stays
 * without them.
 */
const systemSettingsRoutes: AppClientRouteContribution =
  defineSystemSettingsRoutes([
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.account,
      name: 'settingsUsers',
      path: '/users',
      auth: 'required',
      authz: { resource: { type: 'user', id: '*' }, action: 'read' },
      navigation: {
        title: 'settings.users',
        description: 'settings.usersDescription',
        icon: Users,
      },
      breadcrumb: { title: 'settings.users' },
      componentLoader: () => import('./users.js'),
      children: [
        // The forms declare their presentation, so the dialog or drawer opens at once and the wait for the form's module,
        // its authorization and its data stays inside it instead of under the list.
        {
          name: 'settingsUserCreate',
          path: 'create',
          authz: { resource: { type: 'user', id: '*' }, action: 'create' },
          presentation: { kind: 'dialog', title: 'settings.newUser' },
          componentLoader: () => import('./user-form.js'),
        },
        // A sibling rather than the parent of the editor, so closing the drawer returns to the list instead of to this
        // route, which only forwards older detail links to the editor.
        {
          name: 'settingsUser',
          path: ':userId',
          componentLoader: () => import('./user-detail.js'),
        },
        {
          name: 'settingsUserEdit',
          path: ':userId/edit',
          presentation: { kind: 'drawer', title: 'settings.editUser' },
          componentLoader: () => import('./user-form.js'),
        },
      ],
    },
  ]);
export default systemSettingsRoutes;
