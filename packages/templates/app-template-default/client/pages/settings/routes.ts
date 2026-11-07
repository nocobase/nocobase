import { Users, ShieldCheck, KeyRound, ListFilter } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

/**
 * Users and Permission management, in the Accounts and permissions category of the System settings shell
 * (`shell-routes.ts`). Register this contribution as business capabilities are developed; a bare application stays
 * without them.
 */
const systemSettingsRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    parent: 'settingsAccount',
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
  {
    parent: 'settingsAccount',
    name: 'permissionManagement',
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
            presentation: { kind: 'child-page' },
            componentLoader: () => import('./role-form.js'),
          },
          {
            name: 'settingsRoleEdit',
            path: ':key/edit',
            breadcrumb: { title: 'settings.editRole' },
            presentation: { kind: 'child-page' },
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
