import {
  ApiClientError,
  useApiClient,
  useSubmission,
  useToaster,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect } from 'react';
import { useListData } from '../hooks/use-list-data.js';
export interface LabRecord {
  id: string;
  name: string;
  detail: string;
  location: string;
  createdAt: string;
}
export interface Settings {
  id: string;
  manager: string;
  location: string;
  revision: number;
}
export interface Summary {
  template: string;
  version: string;
  name: string;
  platformUrl: string;
  records: { data: LabRecord[]; meta: { total: number } };
  settings: Settings;
}
export function useLabData<T>(path: string) {
  const request = useListData<T>(path);
  const reload = request.reload;
  useEffect(() => {
    const refresh = () => reload();
    window.addEventListener('lab-saved', refresh);
    return () => window.removeEventListener('lab-saved', refresh);
  }, [reload]);
  return request;
}
export function useLabWrite(scope: string) {
  const api = useApiClient(),
    { session } = useAuthentication(),
    submission = useSubmission({ scope: `${session?.user.id}:lab:${scope}` }),
    toaster = useToaster(),
    { t } = useTranslation();
  return {
    busy: submission.submitting,
    pending: submission.pending,
    async run<T>(
      path: string,
      method: 'POST' | 'PUT' | 'DELETE',
      input: unknown,
    ): Promise<T | undefined> {
      const result = await submission.run(input, (key, signal, snapshot) =>
        api.request<T>({
          path,
          method,
          json: method === 'DELETE' ? undefined : snapshot,
          headers: { 'Idempotency-Key': key },
          signal,
        }),
      );
      if (result) {
        window.dispatchEvent(new Event('lab-saved'));
        toaster.show({ type: 'success', title: t('lab.saved') });
      }
      return result;
    },
  };
}
export function isTerminalError(error: unknown): error is ApiClientError {
  return (
    error instanceof ApiClientError && [401, 403, 404].includes(error.status)
  );
}
export function errorKey(error: unknown): string {
  return error instanceof ApiClientError &&
    [401, 403, 404].includes(error.status)
    ? `lab.error${error.status}`
    : 'lab.error';
}
export function safePortalUrl(value: string): string {
  try {
    const u = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : '/main/';
  } catch {
    return '/main/';
  }
}
