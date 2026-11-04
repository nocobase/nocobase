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
      {
        name: 'settingsUserCreate',
        path: 'create',
        authz: { resource: { type: 'user', id: '*' }, action: 'create' },
        componentLoader: () => import('./user-form.js'),
      },
      {
        name: 'settingsUser',
        path: ':userId',
        componentLoader: () => import('./user-detail.js'),
        children: [
          {
            name: 'settingsUserEdit',
            path: 'edit',
            componentLoader: () => import('./user-form.js'),
          },
        ],
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
            componentLoader: () => import('./default-access-form.js'),
          },
          // Read permission opens the full rule even when the viewer may not update it.
          {
            name: 'settingsDefaultAccessEdit',
            path: ':key/edit',
            breadcrumb: { title: 'settings.defaultAccess.edit' },
            componentLoader: () => import('./default-access-form.js'),
          },
        ],
      },
    ],
  },
]);
export default systemSettingsRoutes;
