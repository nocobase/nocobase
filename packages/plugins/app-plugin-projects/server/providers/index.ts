import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { ProjectsAuthorizationProvider } from './authorization.js';
import { ProjectsProvider } from './projects.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  ProjectsProvider,
  ProjectsAuthorizationProvider,
];

export default serviceProviders;
