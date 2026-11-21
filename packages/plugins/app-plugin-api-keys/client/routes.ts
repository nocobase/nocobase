import {
  definePersonalSettingsRoutes,
  defineSystemSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { KeyRound, ListChecks, ShieldCheck, Users } from 'lucide-react';

const NAMES = {
  personal: 'apiKeysPersonal',
  personalCreate: 'apiKeysPersonalCreate',
  personalDetail: 'apiKeysPersonalDetail',
  system: 'apiKeysSystem',
  systemCreate: 'apiKeysSystemCreate',
  systemDetail: 'apiKeysSystemDetail',
  managed: 'apiKeysManaged',
  managedDetail: 'apiKeysManagedDetail',
  members: 'apiKeysMembers',
  rules: 'apiKeysRules',
} as const;

/** The ids of the pages, which an application's `routeComponentOverrides` names as `routeId` to replace a page. */
export const API_KEY_ROUTES: {
  readonly [
    K in keyof typeof NAMES
  ]: `@nocobase/app-plugin-api-keys:${(typeof NAMES)[K]}`;
} = {
  personal: '@nocobase/app-plugin-api-keys:apiKeysPersonal',
  personalCreate: '@nocobase/app-plugin-api-keys:apiKeysPersonalCreate',
  personalDetail: '@nocobase/app-plugin-api-keys:apiKeysPersonalDetail',
  system: '@nocobase/app-plugin-api-keys:apiKeysSystem',
  systemCreate: '@nocobase/app-plugin-api-keys:apiKeysSystemCreate',
  systemDetail: '@nocobase/app-plugin-api-keys:apiKeysSystemDetail',
  managed: '@nocobase/app-plugin-api-keys:apiKeysManaged',
  managedDetail: '@nocobase/app-plugin-api-keys:apiKeysManagedDetail',
  members: '@nocobase/app-plugin-api-keys:apiKeysMembers',
  rules: '@nocobase/app-plugin-api-keys:apiKeysRules',
};

/**
 * Personal settings › API keys: everyone signed in lists, opens and revokes their own keys. Who may create one is the
 * server's to say (`mayCreate`), since an application decides whether it takes a role permission; the create page asks
 * it. The create and detail pages cover the list.
 */
export const personalRoutes: AppClientRouteContribution =
  definePersonalSettingsRoutes([
    {
      parent: PERSONAL_SETTINGS_CATEGORIES.account,
      name: NAMES.personal,
      path: '/api-keys',
      navigation: { title: 'navigation.personal', icon: KeyRound },
      breadcrumb: { title: 'navigation.personal' },
      componentLoader: () => import('./pages/personal-keys.js'),
      children: [
        {
          name: NAMES.personalCreate,
          path: 'create',
          breadcrumb: { title: 'create.breadcrumb' },
          presentation: { kind: 'child-page' },
          componentLoader: () => import('./pages/personal-key-create.js'),
        },
        {
          name: NAMES.personalDetail,
          path: ':keyId',
          breadcrumb: { title: 'detail.breadcrumb' },
          presentation: { kind: 'child-page' },
          componentLoader: () => import('./pages/personal-key-detail.js'),
        },
      ],
    },
  ]);

const API_KEYS = { type: 'settings', id: 'apiKeys' } as const;

/**
 * System settings › API keys, in the Accounts category: system keys, managed keys, members' personal keys and the
 * rules, each a tab with its own address. Opening it takes `settings:apiKeys/read`; creating a system key takes
 * `manage`, which the pages and the server both check for every change.
 */
export const systemRoutes: AppClientRouteContribution =
  defineSystemSettingsRoutes([
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.account,
      name: 'apiKeysSettings',
      kind: 'module',
      navigation: {
        title: 'navigation.system',
        description: 'navigation.systemDescription',
        icon: KeyRound,
      },
      breadcrumb: { title: 'navigation.system' },
      children: [
        {
          name: NAMES.system,
          path: '/api-keys',
          auth: 'required',
          authz: { resource: API_KEYS, action: 'read' },
          navigation: { title: 'system.tabs.system', icon: KeyRound },
          breadcrumb: { title: 'system.tabs.system' },
          componentLoader: () => import('./pages/system-keys.js'),
          children: [
            {
              name: NAMES.systemCreate,
              path: 'create',
              authz: { resource: API_KEYS, action: 'manage' },
              breadcrumb: { title: 'system.create.breadcrumb' },
              presentation: { kind: 'child-page' },
              componentLoader: () => import('./pages/system-key-create.js'),
            },
            {
              name: NAMES.systemDetail,
              path: ':identityId',
              breadcrumb: { title: 'system.detail.breadcrumb' },
              presentation: { kind: 'child-page' },
              componentLoader: () => import('./pages/system-key-detail.js'),
            },
          ],
        },
        {
          name: NAMES.managed,
          path: '/api-keys/managed',
          auth: 'required',
          authz: { resource: API_KEYS, action: 'read' },
          navigation: { title: 'system.tabs.managed', icon: ShieldCheck },
          breadcrumb: { title: 'system.tabs.managed' },
          componentLoader: () => import('./pages/managed-keys.js'),
          children: [
            {
              name: NAMES.managedDetail,
              path: ':identityId',
              breadcrumb: { title: 'system.detail.breadcrumb' },
              presentation: { kind: 'child-page' },
              componentLoader: () => import('./pages/system-key-detail.js'),
            },
          ],
        },
        {
          name: NAMES.members,
          path: '/api-keys/members',
          auth: 'required',
          authz: { resource: API_KEYS, action: 'read' },
          navigation: { title: 'system.tabs.members', icon: Users },
          breadcrumb: { title: 'system.tabs.members' },
          componentLoader: () => import('./pages/member-keys.js'),
        },
        {
          name: NAMES.rules,
          path: '/api-keys/rules',
          auth: 'required',
          authz: { resource: API_KEYS, action: 'read' },
          navigation: { title: 'system.tabs.rules', icon: ListChecks },
          breadcrumb: { title: 'system.tabs.rules' },
          componentLoader: () => import('./pages/key-rules.js'),
        },
      ],
    },
  ]);
