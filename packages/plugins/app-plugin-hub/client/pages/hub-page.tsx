import { PageContainer } from '../components/page-container.js';
import { useApiClient, ApiClientError, useService } from '@nocobase/app-client';
import { authorizationClientToken } from '@nocobase/app-plugin-authorization/client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useNavigate, useOutlet, useResolvedPath } from 'react-router';

import type { AppSummary, ListResponse } from './hub/types.js';
import { ErrorNotification } from './hub/shared.js';
import { Catalog, CreateDialog } from './hub/catalog.js';
import { readError, type ReadableError } from './hub/utils.js';
import {
  emptyHubCapabilities,
  loadHubCapabilities,
  type HubCapabilities,
} from '../permissions.js';

export default function HubPage(): ReactElement {
  const outlet = useOutlet();
  if (outlet) return <>{outlet}</>;
  return <ApplicationsCatalog />;
}

export function ApplicationsCatalog(): ReactElement {
  const client = useApiClient();
  const authorization = useService(authorizationClientToken);
  const navigate = useNavigate();
  const parentPath = useResolvedPath('.');
  const requestSequenceRef = useRef(0);
  const initialLoadRef = useRef(true);
  const [capabilities, setCapabilities] =
    useState<HubCapabilities>(emptyHubCapabilities);
  const [apps, setApps] = useState<readonly AppSummary[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 24,
    total: 0,
  });
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newAppId, setNewAppId] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReadableError>();

  const reportError = useCallback(
    (reason: unknown): void => {
      if (reason instanceof ApiClientError && reason.status === 403) {
        authorization.invalidate();
      }
      setError(readError(reason));
    },
    [authorization],
  );
  const loadCapabilities = useCallback(async (): Promise<void> => {
    setCapabilities(await loadHubCapabilities(authorization));
  }, [authorization]);
  const loadApps = useCallback(
    async (
      search: string,
      page: number,
      options: { readonly showLoading?: boolean } = {},
    ): Promise<void> => {
      const sequence = ++requestSequenceRef.current;
      setFetching(true);
      if (options.showLoading ?? false) setLoading(true);
      try {
        const response = await client.request<ListResponse<AppSummary>>({
          path: 'hub/apps',
          query: { q: search.trim() || undefined, page, pageSize: 24 },
        });
        if (sequence !== requestSequenceRef.current) return;
        setApps(response.data);
        setPagination({
          page: response.meta.page,
          pageSize: response.meta.pageSize,
          total: response.meta.total,
        });
      } catch (reason) {
        if (sequence === requestSequenceRef.current) reportError(reason);
      } finally {
        if (sequence === requestSequenceRef.current) {
          setLoading(false);
          setFetching(false);
        }
      }
    },
    [client, reportError],
  );

  useEffect(() => {
    const showLoading = initialLoadRef.current;
    initialLoadRef.current = false;
    const timer = window.setTimeout(
      () => void loadApps(query, pagination.page, { showLoading }),
      query.trim() ? 300 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [loadApps, pagination.page, query]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadCapabilities().catch(reportError),
      0,
    );
    const unsubscribe = authorization.onInvalidated(() => {
      void loadCapabilities().catch(reportError);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [authorization, loadCapabilities, reportError]);

  const goToApp = (appId: string): void => {
    void navigate(`${parentPath.pathname}/${encodeURIComponent(appId)}`);
  };
  const createApp = async (): Promise<void> => {
    if (!newAppName.trim() || !/^(?!__)[A-Za-z0-9_-]+$/.test(newAppId) || busy)
      return;
    setBusy(true);
    setError(undefined);
    try {
      await client.request({
        path: 'hub/apps',
        method: 'POST',
        json: { id: newAppId, name: newAppName },
      });
      const appId = newAppId.trim();
      setNewAppId('');
      setNewAppName('');
      setCreateOpen(false);
      goToApp(appId);
    } catch (reason) {
      reportError(reason);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background [&_button:not(:disabled)]:cursor-pointer'>
      <PageContainer>
        {error ? (
          <ErrorNotification
            error={error}
            onClose={() => setError(undefined)}
          />
        ) : null}
        <Catalog
          apps={apps}
          pagination={pagination}
          loading={loading}
          fetching={fetching}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setError(undefined);
            void loadApps(query, pagination.page, {
              showLoading: false,
            }).finally(() => setRefreshing(false));
          }}
          query={query}
          view={view}
          onQuery={(value) => {
            setQuery(value);
            setPagination((current) => ({ ...current, page: 1 }));
          }}
          onView={setView}
          canCreate={capabilities.create}
          onCreate={() => setCreateOpen(true)}
          onSelect={goToApp}
          onPage={(page) => setPagination((current) => ({ ...current, page }))}
        />
      </PageContainer>
      {createOpen && capabilities.create ? (
        <CreateDialog
          busy={busy}
          appId={newAppId}
          name={newAppName}
          onAppId={setNewAppId}
          onName={setNewAppName}
          onClose={() => {
            if (!busy) setCreateOpen(false);
          }}
          onCreate={() => void createApp()}
        />
      ) : null}
    </main>
  );
}
