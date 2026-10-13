/**
 * What the dashboard reads: Studio's figures over the period (`reports/dashboard`) and what needs attention now
 * (`reports/attention`). Failures throw `ApiClientError`.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

import {
  REPORT_ROUTES,
  type DashboardAttention,
  type DashboardPeriod,
  type DashboardReport,
} from '../../../shared/reports.js';

export const dashboardKeys = {
  all: ['studio', 'dashboard'] as const,
  report: (days: DashboardPeriod) =>
    ['studio', 'dashboard', 'report', days] as const,
  attention: ['studio', 'dashboard', 'attention'] as const,
};

export class DashboardApi {
  public constructor(private readonly api: ApiClient) {}

  public async report(days: DashboardPeriod): Promise<DashboardReport> {
    return (
      await this.api.request<{ data: DashboardReport }>({
        path: REPORT_ROUTES.dashboard,
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
