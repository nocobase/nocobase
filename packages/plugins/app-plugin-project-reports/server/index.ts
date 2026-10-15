import path from 'node:path';
import { defineServerPlugin, type AppServerPlugin } from '@nocobase/app-server/plugins';
import { ProjectReportsProvider } from './provider.js';
import { projectReportsRoutes } from './routes.js';

const projectReports: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-project-reports',
  serviceProviders: [ProjectReportsProvider],
  routes: [projectReportsRoutes],
  database: { migrations: './database/migrations' },
});
export default projectReports;
export { projectReportsToken } from './tokens.js';
