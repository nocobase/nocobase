import { CAPABILITY_GUIDE_PATH } from '../../../shared/capability-guide/index.js';
/** Known application entry points, not evidence of business records or configuration. */
export const capabilityPages: Record<
  string,
  { names: readonly string[]; paths?: readonly string[] }
> = {
  'app-plugin-authentication': { names: ['login'], paths: ['/login'] },
  'app-plugin-database-explorer': { names: ['databaseExplorer'] },
  'app-plugin-foundation': { names: [], paths: [CAPABILITY_GUIDE_PATH] },
  'app-plugin-knowledge': { names: ['knowledge'] },
  'app-plugin-notification-in-app': { names: ['inbox'], paths: ['/inbox'] },
  'app-plugin-users': { names: ['settingsUsers'] },
  'app-plugin-authorization-example': {
    names: [],
    paths: ['/authorization-example'],
  },
  'app-plugin-file-example': { names: [], paths: ['/file-repository'] },
  'app-plugin-jobs-example': { names: [], paths: ['/jobs-example/jobs'] },
  'app-plugin-lifecycle-example': {
    names: [],
    paths: ['/lifecycle-example/tickets'],
  },
  'app-plugin-mail-example': { names: [], paths: ['/mail-example'] },
  'app-plugin-notification-example': {
    names: [],
    paths: ['/notification-example'],
  },
  'app-plugin-office-flows-example': {
    names: [],
    paths: ['/office-flows/data-requests'],
  },
  'app-plugin-realtime-example': { names: [], paths: ['/realtime-example'] },
  'app-plugin-repository-example': {
    names: [],
    paths: ['/repository-example/crm'],
  },
  'app-plugin-routes-example': { names: [], paths: ['/routes-example'] },
  'app-plugin-template-print-example': {
    names: [],
    paths: ['/template-print-example'],
  },
};
