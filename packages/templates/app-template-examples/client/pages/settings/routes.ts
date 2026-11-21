import { ShieldCheck, KeyRound, ListFilter } from 'lucide-react';
import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

/**
 * Permission management, in the Accounts and permissions category of the System settings shell
 * (`shell-routes.ts`). User management joins the same category from `@nocobase/app-plugin-users`. Register this contribution as business capabilities are developed; a bare application stays
 * without them.
 */
const systemSettingsRoutes: AppClientRouteContribution =
  defineSystemSettingsRoutes([
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.account,
      name: 'permissionManagement',
      kind: 'module',
      navigation: {
        title: 'settings.permissionManagement',
        description: 'settings.permissionManagementDescription',
        icon: ShieldCheck,
      },
      breadcrumb: { title: 'settings.permissionManagement' },
      children: [
        {
          name: 'settingsRoles',
          path: '/roles',
          auth: 'required',
          authz: {
            resource: {
              type: 'settings',
              id: 'authorization.permission-sets',
            },
            action: 'read',
          },
          navigation: { title: 'settings.roles', icon: KeyRound },
          breadcrumb: { title: 'settings.roles' },
          componentLoader: () => import('./roles.js'),
          children: [
            {
              name: 'settingsRoleCreate',
              path: 'create',
              authz: {
                resource: {
                  type: 'settings',
                  id: 'authorization.permission-sets',
                },
                action: 'create',
              },
              breadcrumb: { title: 'settings.newRole' },
              componentLoader: () => import('./role-form.js'),
            },
            {
              name: 'settingsRoleEdit',
              path: ':key/edit',
              breadcrumb: { title: 'settings.editRole' },
              componentLoader: () => import('./role-form.js'),
            },
          ],
        },
        {
          name: 'settingsDefaultAccess',
          path: '/default-access',
          auth: 'required',
          authz: {
            resource: {
              type: 'settings',
              id: 'authorization.default-access',
            },
            action: 'read',
          },
          navigation: {
            title: 'settings.defaultAccess.title',
            icon: ListFilter,
          },
          breadcrumb: { title: 'settings.defaultAccess.title' },
          componentLoader: () => import('./default-access.js'),
          children: [
            {
              name: 'settingsDefaultAccessCreate',
              path: 'create',
              authz: {
                resource: {
                  type: 'settings',
                  id: 'authorization.default-access',
                },
                action: 'create',
              },
              breadcrumb: { title: 'settings.defaultAccess.new' },
              presentation: { kind: 'child-page' },
              componentLoader: () => import('./default-access-form.js'),
            },
            // Read permission opens the full rule even when the viewer may not update it.
            {
              name: 'settingsDefaultAccessEdit',
              path: ':key/edit',
              breadcrumb: { title: 'settings.defaultAccess.edit' },
              presentation: { kind: 'child-page' },
              componentLoader: () => import('./default-access-form.js'),
            },
          ],
        },
      ],
    },
  ]);
export default systemSettingsRoutes;
