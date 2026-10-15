import { createServiceToken, type ServiceToken } from '@nocobase/service-provider';
import type { ProjectReportsService } from './service.js';

export const projectReportsToken: ServiceToken<ProjectReportsService> = createServiceToken<ProjectReportsService>('@nocobase/app-plugin-project-reports/service');
export type { ProjectReportsService } from './service.js';
