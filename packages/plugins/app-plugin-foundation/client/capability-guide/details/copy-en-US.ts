import fileOverview from './file-overview-en-US.js';
import databaseExplorerOverview from './database-explorer-overview-en-US.js';
import concurrencyOverview from './concurrency-overview-en-US.js';
import authenticationOverview from './authentication-overview-en-US.js';
import authorizationOverview from './authorization-overview-en-US.js';
import i18nOverview from './i18n-overview-en-US.js';
import agentsOverview from './agents-overview-en-US.js';
import databaseOverview from './database-overview-en-US.js';
import { featureOverview } from './feature-overview-en-US.js';

const copy: Readonly<Record<string, unknown>> = {
  fileOverview,
  databaseExplorerOverview,
  concurrencyOverview,
  authenticationOverview,
  authorizationOverview,
  i18nOverview,
  agentsOverview,
  databaseOverview,
  featureOverview,
  databaseExplorer: {
    expired: 'Your session has expired. Sign in again to continue.',
    forbidden: 'You do not have permission to browse this database.',
    failed: 'Unable to load database information.',
    signIn: 'Sign in',
    retry: 'Retry',
    defaultConnection: 'Default',
  },
};

export default copy;
