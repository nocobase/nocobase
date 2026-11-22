import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { HardDrive } from 'lucide-react';

import { FILE_STORAGE_PAGE } from '../shared/storage-access.js';

/**
 * System settings › System › File storage, at `/settings/file-storage`. One route: the tab and the open disk are in the
 * URL's query, so an application replaces the whole page with a `routeComponentOverrides` entry for this route.
 */
const routes: AppClientRouteContribution = defineSystemSettingsRoutes([
  {
    parent: SYSTEM_SETTINGS_CATEGORIES.system,
    name: 'fileStorage',
    path: '/file-storage',
    auth: 'required',
    authz: FILE_STORAGE_PAGE,
    navigation: {
      title: 'storage.title',
      description: 'storage.navDescription',
      icon: HardDrive,
    },
    breadcrumb: { title: 'storage.title' },
    componentLoader: () => import('./pages/file-storage/index.js'),
  },
]);

export default routes;
