import {
  definePersonalSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { KeyRound } from 'lucide-react';

const NAMES = {
  personal: 'apiKeysPersonal',
  personalCreate: 'apiKeysPersonalCreate',
  personalDetail: 'apiKeysPersonalDetail',
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
};

const PERSONAL_API_KEYS = { type: 'settings', id: 'personalApiKeys' } as const;

/**
 * Personal settings › API keys: everyone signed in lists, opens and revokes their own keys; creating one takes
 * `settings:personalApiKeys/create`, as the server requires. The create and detail pages cover the list.
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
          authz: { resource: PERSONAL_API_KEYS, action: 'create' },
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
