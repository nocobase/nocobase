import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import { equipmentRoutes } from './equipment.js';

const routes: readonly AppRouteContribution<Application>[] = [equipmentRoutes];

export default routes;
