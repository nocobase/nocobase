import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientSystemSettingsRoutesContribution,
} from '@nocobase/app-client/plugins';
import { KeyRound, ListFilter, SearchCheck, ShieldCheck } from 'lucide-react';

const PERMISSION_SETS = {
  type: 'settings',
  id: 'authorization.permission-sets',
} as const;
const DEFAULT_ACCESS = {
  type: 'settings',
  id: 'authorization.default-access',
} as const;

/**
 * Roles and permissions, in the Accounts category of the system settings. Each top tab of the page is a page of this
 * module with its own address; the route names and their `authz` ids are what stored page grants and links refer to,
 * so they stay as they were when the application owned these pages.
 */
export function authorizationSettingsRoutes(): AppClientSystemSettingsRoutesContribution {
  return defineSystemSettingsRoutes([
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
          authz: { resource: PERMISSION_SETS, action: 'read' },
          navigation: { title: 'settings.roles', icon: KeyRound },
          breadcrumb: { title: 'settings.roles' },
          componentLoader: () => import('./settings/roles.js'),
          children: [
            {
              name: 'settingsRoleCreate',
              path: 'create',
              authz: { resource: PERMISSION_SETS, action: 'create' },
              breadcrumb: { title: 'settings.newRole' },
              componentLoader: () => import('./settings/role-form.js'),
            },
            {
              name: 'settingsRoleEdit',
              path: ':key/edit',
              breadcrumb: { title: 'settings.editRole' },
              componentLoader: () => import('./settings/role-form.js'),
            },
          ],
        },
        {
          name: 'settingsDefaultAccess',
          path: '/default-access',
          auth: 'required',
          authz: { resource: DEFAULT_ACCESS, action: 'read' },
          navigation: { title: 'settings.dataRules', icon: ListFilter },
          breadcrumb: { title: 'settings.dataRules' },
          componentLoader: () => import('./settings/data-rules.js'),
          // The addresses a rule once opened on: each redirects to the list with the rule's side sheet open.
          children: [
            {
              name: 'settingsDefaultAccessCreate',
              path: 'create',
              authz: { resource: DEFAULT_ACCESS, action: 'create' },
              breadcrumb: { title: 'settings.defaultAccess.new' },
              componentLoader: () =>
                import('./settings/default-access-form.js'),
            },
            // Read permission opens the full rule even when the viewer may not update it.
            {
              name: 'settingsDefaultAccessEdit',
              path: ':key/edit',
              breadcrumb: { title: 'settings.defaultAccess.edit' },
              componentLoader: () =>
                import('./settings/default-access-form.js'),
            },
          ],
        },
        // Reads anyone's permissions, so only an unrestricted role opens it, as the inspector it reads requires.
        {
          name: 'settingsPermissionCheck',
          path: '/permission-check',
          auth: 'required',
          authz: 'unrestricted',
          navigation: {
            title: 'settings.permissionCheck.title',
            icon: SearchCheck,
          },
          breadcrumb: { title: 'settings.permissionCheck.title' },
          componentLoader: () => import('./settings/permission-check.js'),
        },
      ],
    },
  ]);
}
