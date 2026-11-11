import { useEffect } from 'react';
import { ApiClientError } from '@nocobase/app-client';
import { useListData } from '../../hooks/use-list-data.js';
export interface Row {
  id: string;
  name?: string;
  description?: string;
  templateId?: string;
  version?: string;
  manifest?: Record<string, unknown>;
  environmentId?: string;
  status?: string;
  currentVersionId?: string | null;
  desiredVersionId?: string;
  operationId?: string | null;
  revision?: number;
  createdAt: string;
  instanceId?: string;
  kind?: string;
  phase?: string;
  errorCode?: string | null;
  checksum?: string;
}
export interface List {
  data: Row[];
  meta: { total: number };
}
export interface Runtime {
  state: string;
  url: string | null;
  drifted: boolean;
  currentVersion: string | null;
  desiredVersion: string | null;
}
export const namespace = '@nocobase/app-plugin-multi-app';
export function permission(kind: string, action: string) {
  return {
    resource: { type: 'composite' as const, id: `multiApp.${kind}` },
    action,
  };
}
export function usePortalData<T>(path: string, keepPreviousData = false) {
  const request = useListData<T>(path, keepPreviousData);
  const reload = request.reload;
  useEffect(() => {
    const handler = () => reload();
    window.addEventListener('portal-changed', handler);
    return () => window.removeEventListener('portal-changed', handler);
  }, [reload]);
  return request;
}
export function refreshPortal(): void {
  window.dispatchEvent(new Event('portal-changed'));
}
export function isTerminalError(error: unknown): error is ApiClientError {
  return (
    error instanceof ApiClientError && [401, 403, 404].includes(error.status)
  );
}
export function errorKey(error: unknown): string {
  return error instanceof ApiClientError &&
    [401, 403, 404].includes(error.status)
    ? `portal.error${error.status}`
    : 'portal.error';
}
export function safeUrl(value: string | null): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value, window.location.origin);
    if (['http:', 'https:'].includes(url.protocol)) return url.href;
  } catch {
    return;
  }
  return;
}
