import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
export interface Row {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}
export interface Envelope<T> {
  data: T;
  meta?: { page: number; pageSize: number; total: number };
}
export interface AssetView {
  record: Row;
  available: {
    name: string;
    allowed: boolean;
    blockers: { code: string; message: string }[];
  }[];
  history?: {
    transitions: {
      id: string;
      transition: string;
      at: string;
      from: string | null;
      to: string;
      version: number;
      actorId: string;
    }[];
  };
  items?: Row[];
}
export function useEquipment<T>(path: string | null) {
  const api = useApiClient();
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  return useQuery({
    queryKey: ['equipment', session?.user.id, revision, path],
    enabled: !!session && path !== null,
    queryFn: () => api.request<Envelope<T>>({ path: 'equipment/' + path }),
    retry: false,
  });
}
export function useCapabilities() {
  return useEquipment<Record<string, boolean>>('capabilities');
}
export function useReferences() {
  return useEquipment<Record<string, Row[]>>('reference');
}
export function useEquipmentWrite() {
  const api = useApiClient();
  const query = useQueryClient();
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  return async <T>(
    path: string,
    json?: object,
    method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
  ) => {
    const result = await api.request<Envelope<T>>({
      path: 'equipment/' + path,
      method,
      ...(json ? { json } : {}),
    });
    const key = ['equipment', session?.user.id, revision];
    const record = result.data as unknown;
    if (record && typeof record === 'object' && 'id' in record) {
      query.setQueriesData<Envelope<unknown>>({ queryKey: key }, (old) => {
        if (!old) return old;
        const data = old.data;
        if (Array.isArray(data))
          return {
            ...old,
            data: data.map((row: unknown) =>
              row &&
              typeof row === 'object' &&
              'id' in row &&
              row.id === record.id
                ? record
                : row,
            ),
          };
        if (
          data &&
          typeof data === 'object' &&
          'record' in data &&
          data.record &&
          typeof data.record === 'object' &&
          'id' in data.record &&
          data.record.id === record.id
        )
          return { ...old, data: { ...data, record } };
        return old;
      });
    }
    await query.invalidateQueries({ queryKey: key });
    return result.data;
  };
}
