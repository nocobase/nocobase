import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { DATABASE_EXPLORER_ACCESS } from '@nocobase/app-plugin-database-explorer/client';

export default defineAppRoutes([
  {
    parent: 'settingsSystem',
    name: 'databaseExplorer',
    path: '/database-explorer',
    auth: 'required',
    authz: DATABASE_EXPLORER_ACCESS,
    breadcrumb: { title: 'databaseExplorer.title' },
    componentLoader: () => import('./index.js'),
  },
]);
