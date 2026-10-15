/**
 * What the dashboard reads, one request per panel so each loads, fails and refreshes on its own: the delivery figures
 * (`reports/delivery`), the agents' performance (`reports/agents`), the projects (`reports/projects`) and what needs
 * attention now (`reports/attention`). Failures throw `ApiClientError`.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

import {
  REPORT_ROUTES,
  type DashboardAgents,
  type DashboardAttention,
  type DashboardDelivery,
  type DashboardPeriod,
  type DashboardProjects,
} from '../../../shared/reports.js';

export const dashboardKeys = {
  all: ['studio', 'dashboard'] as const,
  delivery: (days: DashboardPeriod) =>
    ['studio', 'dashboard', 'delivery', days] as const,
  agents: (days: DashboardPeriod) =>
    ['studio', 'dashboard', 'agents', days] as const,
  projects: (days: DashboardPeriod) =>
    ['studio', 'dashboard', 'projects', days] as const,
  attention: ['studio', 'dashboard', 'attention'] as const,
};

export class DashboardApi {
  public constructor(private readonly api: ApiClient) {}

  public delivery(days: DashboardPeriod): Promise<DashboardDelivery> {
    return this.period<DashboardDelivery>(REPORT_ROUTES.delivery, days);
  }

  public agents(days: DashboardPeriod): Promise<DashboardAgents> {
    return this.period<DashboardAgents>(REPORT_ROUTES.agents, days);
  }

  public projects(days: DashboardPeriod): Promise<DashboardProjects> {
    return this.period<DashboardProjects>(REPORT_ROUTES.projects, days);
  }

  private async period<T>(path: string, days: DashboardPeriod): Promise<T> {
    return (
      await this.api.request<{ data: T }>({
        path,
        query: { days: String(days) },
      })
    ).data;
  }

  public async attention(): Promise<DashboardAttention> {
    return (
      await this.api.request<{ data: DashboardAttention }>({
        path: REPORT_ROUTES.attention,
      })
    ).data;
  }
}

export function useDashboardApi(): DashboardApi {
  const api = useApiClient();
  return useMemo(() => new DashboardApi(api), [api]);
}
