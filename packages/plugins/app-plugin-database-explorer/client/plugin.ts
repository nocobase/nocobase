import {
  defineAppRoutes,
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import { DATABASE_EXPLORER_ACCESS } from './access.js';
import { Database } from 'lucide-react';

export interface DatabaseExplorerOptions {
  /** Qualified parent route of the settings category. */
  readonly parent?: string;
  readonly path?: string;
  /** Set to false when the application supplies its own explorer page. */
  readonly routes?: false;
}

const databaseExplorer: AppClientPluginFactory<DatabaseExplorerOptions> =
  defineClientPlugin<DatabaseExplorerOptions>({
    packageName: '@nocobase/app-plugin-database-explorer',
    locales: {
      'en-US': () => import('./locales/en-US.js'),
      'zh-CN': () => import('./locales/zh-CN.js'),
    },
    routes: ({ parent, path = '/database-explorer', routes }) =>
      defineAppRoutes(
        routes === false
          ? []
          : [
              {
                parent,
                name: 'databaseExplorer',
                path,
                auth: 'required',
                authz: DATABASE_EXPLORER_ACCESS,
                navigation: {
                  title: 'databaseExplorer.title',
                  description: 'databaseExplorer.description',
                  icon: Database,
                  order: 10,
                },
                breadcrumb: { title: 'databaseExplorer.title' },
                componentLoader: () => import('./page/index.js'),
              },
            ],
      ),
  });

export default databaseExplorer;
