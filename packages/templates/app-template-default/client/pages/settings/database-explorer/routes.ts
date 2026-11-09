import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { DATABASE_EXPLORER_ACCESS } from '@nocobase/app-plugin-database-explorer/client';
import { Database } from 'lucide-react';

export default defineAppRoutes([
  {
    parent: 'settingsSystem',
    name: 'databaseExplorer',
    path: '/database-explorer',
    auth: 'required',
    authz: DATABASE_EXPLORER_ACCESS,
    navigation: {
      title: 'databaseExplorer.title',
      description: 'databaseExplorer.description',
      icon: Database,
      order: 10,
    },
    breadcrumb: { title: 'databaseExplorer.title' },
    componentLoader: () => import('./index.js'),
  },
]);
