import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';
import { createPwaRoutes } from '@nocobase/app-server/spa';

const routes: readonly AppRouteContribution<Application>[] = [
  // The installation manifest, served anonymously at <publicBasePath>/manifest.webmanifest from the pwa section.
  createPwaRoutes(),
];

export default routes;
