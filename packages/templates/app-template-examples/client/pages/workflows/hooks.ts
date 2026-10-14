import { useCallback, useEffect, useState } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { WorkflowSummary } from '../../../shared/workflows.js';

export function useWorkflowData<T>(path: string, query = '') {
  const api = useApiClient();
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    requestKey?: string;
    data?: T;
    status?: number;
  }>({ key: '' });
  const key = `${path}?${query}`;
  const requestKey = `${key}#${refresh}`;
  useEffect(() => {
    let active = true;
    void api
      .request<T>({
        path,
        query: Object.fromEntries(new URLSearchParams(query)),
      })
      .then((data) => {
        if (active) setResult({ key, requestKey, data });
      })
      .catch((error: unknown) => {
        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? Number(error.status)
            : 500;
        if (active)
          setResult((previous) => ({
            key,
            requestKey,
            status: status || 500,
            data: previous.key === key ? previous.data : undefined,
          }));
      });
    return () => {
      active = false;
    };
  }, [api, key, requestKey, path, query]);
  const reload = useCallback(() => setRefresh((value) => value + 1), []);
  return {
    data: result.key === key ? result.data : undefined,
    status: result.requestKey === requestKey ? result.status : undefined,
    loading: result.requestKey !== requestKey,
    reload,
  };
}

export function useWorkflowLabels() {
  const { t } = useTranslation();
  const { t: lifecycle } = useTranslation(
    '@nocobase/app-plugin-lifecycle-example',
  );
  const { t: office } = useTranslation(
    '@nocobase/app-plugin-office-flows-example',
  );
  return {
    title: (workflow: Pick<WorkflowSummary, 'name'>) =>
      t(`workflows.names.${workflow.name}`, { defaultValue: workflow.name }),
    state: (source: WorkflowSummary['source'], name: string) =>
      (source === 'office' ? office : lifecycle)(`states.${name}`, {
        defaultValue: name,
      }),
    transition: (source: WorkflowSummary['source'], name: string) =>
      name === '$create'
        ? t('workflows.created')
        : (source === 'office' ? office : lifecycle)(`transitions.${name}`, {
            defaultValue: name,
          }),
  };
}
export function workflowDate(value: string, language: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}
