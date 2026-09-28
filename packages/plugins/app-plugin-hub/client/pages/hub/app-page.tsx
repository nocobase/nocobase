import { LoaderCircle } from 'lucide-react';
import {
  useApiClient,
  ApiClientError,
  useService,
  useToaster,
} from '@nocobase/app-client';
import { authorizationClientToken } from '@nocobase/app-plugin-authorization/client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  matchPath,
  useLocation,
  useNavigate,
  useParams,
  useResolvedPath,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';

import { Button } from '../../components/ui/button.js';
import { ErrorNotification, AppDialog } from './shared.js';
import { Detail, RemoveApplicationDialog } from './detail.js';
import { DeploymentDialog } from './configuration.js';
import { UploadReleaseDialog } from './releases.js';
import type {
  ApiResponse,
  AppDetail,
  AppOverview,
  ConfigMode,
  ConfigResponse,
  ConfigTemplateResponse,
  DeploymentRecord,
  DetailTab,
  ReleaseRecord,
} from './types.js';
import { DETAIL_TABS } from './types.js';
import { uploadArtifact, readError, type ReadableError } from './utils.js';
import {
  defaultHubDetailTab,
  emptyHubCapabilities,
  loadHubCapabilities,
  resolveHubDetailTab,
  visibleHubDetailTabs,
  type HubCapabilities,
} from '../../permissions.js';

interface HubAppPageContextValue {
  readonly app: AppDetail;
  readonly capabilities: HubCapabilities;
  readonly busy: boolean;
  readonly panelLoading: boolean;
  readonly deploymentsLoading: boolean;
  readonly configMode: ConfigMode;
  readonly configContent: string;
  readonly selectedReleaseId: string | undefined;
  readonly release: ReleaseRecord | undefined;
  readonly deploymentPagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
  readonly onRelease: (id: string) => void;
  readonly onDeploymentPage: (page: number) => void;
  readonly onDeploy: (releaseId?: string) => void;
  readonly releasesCollapsed: boolean;
  readonly onReleasesCollapsed: (collapsed: boolean) => void;
  readonly onRollback: (deploymentId: string) => void;
  readonly onUpload: () => void;
  readonly onSaveConfiguration: (content: string) => void;
  readonly onSaveSettings: (settings: {
    name: string;
    activation: 'lazy' | 'eager';
  }) => void;
  readonly onRemove: () => void;
  readonly onRefresh: () => void;
}

const HubAppPageContext = createContext<HubAppPageContextValue | undefined>(
  undefined,
);

// eslint-disable-next-line react-refresh/only-export-components
export function useHubAppPage(): HubAppPageContextValue {
  const context = useContext(HubAppPageContext);
  if (!context) {
    throw new Error('useHubAppPage must be used inside an AppPage.');
  }
  return context;
}

export default function AppPage(): ReactElement {
  const { appId = '' } = useParams();
  return <AppPageContent key={appId} appId={appId} />;
}

function AppPageContent({ appId }: { readonly appId: string }): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const toaster = useToaster();
  const client = useApiClient();
  const authorization = useService(authorizationClientToken);
  const navigate = useNavigate();
  const location = useLocation();
  const appPath = useResolvedPath('.');
  const applicationsPath = useResolvedPath('..');
  const [capabilities, setCapabilities] =
    useState<HubCapabilities>(emptyHubCapabilities);
  const [capabilitiesReady, setCapabilitiesReady] = useState(false);
  const [detail, setDetail] = useState<AppOverview>();
  const [releases, setReleases] = useState<readonly ReleaseRecord[]>([]);
  const [deployments, setDeployments] = useState<readonly DeploymentRecord[]>(
    [],
  );
  const [configMode, setConfigMode] = useState<ConfigMode>('file');
  const [configContent, setConfigContent] = useState('');
  const [panelKey, setPanelKey] = useState('');
  const [deploymentPage, setDeploymentPage] = useState(1);
  const [deploymentPagination, setDeploymentPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [deploymentHistoryVersion, setDeploymentHistoryVersion] = useState(0);
  const [refreshing, setRefreshing] = useState<'auto' | 'manual' | null>(null);
  const refreshInFlightRef = useRef(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>();
  const [releasesCollapsed, setReleasesCollapsed] = useState(false);
  const [deploymentReleaseId, setDeploymentReleaseId] = useState<string>();
  const [rollbackDeploymentId, setRollbackDeploymentId] = useState<string>();
  const [deploymentMode, setDeploymentMode] = useState<ConfigMode>('file');
  const [deploymentContent, setDeploymentContent] = useState('');
  const [deploymentBaseline, setDeploymentBaseline] = useState('');
  const [deploymentBaselineMode, setDeploymentBaselineMode] =
    useState<ConfigMode>('file');
  const [artifact, setArtifact] = useState<File>();
  const [deployOpen, setDeployOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState<
    'start' | 'stop' | 'restart'
  >();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReadableError>();
  const [pollNotice, setPollNotice] = useState<{
    appId: string;
    state: 'retrying' | 'finished';
  }>();

  const reportError = useCallback(
    (reason: unknown): void => {
      if (reason instanceof ApiClientError && reason.status === 403) {
        authorization.invalidate();
      }
      setError(readError(reason));
    },
    [authorization],
  );
  const loadDetail = useCallback(async (): Promise<AppOverview> => {
    const response = await client.request<ApiResponse<AppOverview>>({
      path: `hub/apps/${appId}`,
    });
    return response.data;
  }, [appId, client]);
  const fetchConfig = useCallback(
    async (id: string): Promise<ConfigResponse> => {
      const response = await client.request<ApiResponse<ConfigResponse>>({
        path: `hub/apps/${id}/config`,
      });
      return response.data;
    },
    [client],
  );
  const loadConfig = useCallback(
    async (id: string): Promise<ConfigResponse> => {
      const config = await fetchConfig(id);
      setConfigMode(config.mode);
      setConfigContent(config.content ?? '');
      return config;
    },
    [fetchConfig],
  );
  const loadReleaseConfig = useCallback(
    async (id: string, releaseId: string): Promise<string | null> => {
      const response = await client.request<
        ApiResponse<ConfigTemplateResponse>
      >({
        path: `hub/apps/${id}/releases/${releaseId}/config-template`,
      });
      return response.data.content;
    },
    [client],
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadDetail(), loadHubCapabilities(authorization, appId)])
      .then(([nextDetail, nextCapabilities]) => {
        if (cancelled) return;
        setDetail(nextDetail);
        setCapabilities(nextCapabilities);
        setCapabilitiesReady(true);
      })
      .catch((reason: unknown) => {
        if (!cancelled) reportError(reason);
      });
    return () => {
      cancelled = true;
    };
  }, [appId, authorization, loadDetail, reportError]);

  const tabMatch = matchPath(
    { path: `${appPath.pathname}/:tab/*`, end: true },
    location.pathname,
  );
  const tabParam =
    tabMatch?.params.tab === 'releases' ? 'deployments' : tabMatch?.params.tab;
  const activeTab = DETAIL_TABS.includes(tabParam as DetailTab)
    ? (tabParam as DetailTab)
    : undefined;
  const availableTabs = detail
    ? visibleHubDetailTabs(
        {
          hasReleases: detail.hasReleases,
          deployed: Boolean(detail.app.currentDeploymentId),
        },
        capabilities,
      )
    : [];
  const defaultTab = detail
    ? defaultHubDetailTab(
        {
          hasReleases: detail.hasReleases,
          deployed: Boolean(detail.app.currentDeploymentId),
        },
        capabilities,
      )
    : undefined;
  const isParentEntry = Boolean(
    matchPath({ path: appPath.pathname, end: true }, location.pathname),
  );

  useEffect(() => {
    if (!capabilitiesReady || !detail || !isParentEntry || !defaultTab) return;
    void navigate(
      {
        pathname: `${appPath.pathname}/${defaultTab}`,
        search: location.search,
      },
      { replace: true },
    );
  }, [
    appPath.pathname,
    capabilitiesReady,
    defaultTab,
    detail,
    isParentEntry,
    location.search,
    navigate,
  ]);

  const effectiveTab = resolveHubDetailTab(
    activeTab ?? defaultTab ?? 'deployments',
    {
      hasReleases: detail?.hasReleases ?? false,
      deployed: Boolean(detail?.app.currentDeploymentId),
    },
    capabilities,
  );
  const selectedApp = useMemo<AppDetail | undefined>(
    () =>
      detail
        ? {
            ...detail,
            releases,
            deployments,
          }
        : undefined,
    [deployments, detail, releases],
  );
  const selectedRelease = selectedApp?.releases.find(
    (release) =>
      release.id ===
      (selectedReleaseId ??
        selectedApp.deployment.desiredReleaseId ??
        selectedApp.releases[0]?.id),
  );

  const configTab = activeTab === 'configuration' || activeTab === 'resources';
  // Config is refreshed on explicit actions or a deployment change, not every
  // status response. Other panels still refresh as deployment progress changes.
  const panelDetail = configTab ? Boolean(detail) : detail;
  const panelVersion =
    activeTab === 'deployments' || configTab ? 0 : refreshVersion;
  useEffect(() => {
    if (
      !panelDetail ||
      !activeTab ||
      !capabilitiesReady ||
      activeTab === 'resources'
    )
      return;
    let cancelled = false;
    // Refresh deployment rows in place; only a tab/page change needs a skeleton.
    const key = `${appId}:${activeTab}:${deploymentPage}:${panelVersion}`;
    const load = async (): Promise<void> => {
      if (activeTab === 'deployments') {
        if (capabilities['read-release']) {
          const response = await client.request<
            ApiResponse<readonly ReleaseRecord[]>
          >({ path: `hub/apps/${appId}/releases` });
          if (cancelled) return;
          setReleases(response.data);
        }
        if (capabilities['read-deployment']) {
          setDeploymentsLoading(true);
          try {
            const response = await client.request<
              ApiResponse<{
                readonly items: readonly DeploymentRecord[];
                readonly page: number;
                readonly pageSize: number;
                readonly total: number;
              }>
            >({
              path: `hub/apps/${appId}/deployments`,
              query: { page: deploymentPage, pageSize: 20 },
            });
            if (cancelled) return;
            setDeployments(response.data.items);
            setDeploymentPagination({
              page: response.data.page,
              pageSize: response.data.pageSize,
              total: response.data.total,
            });
          } finally {
            if (!cancelled) setDeploymentsLoading(false);
          }
        }
      } else if (activeTab === 'configuration') {
        const config = await fetchConfig(appId);
        if (cancelled) return;
        setConfigMode(config.mode);
        setConfigContent(config.content ?? '');
      }
      if (!cancelled) setPanelKey(key);
    };
    void load().catch((reason: unknown) => {
      if (!cancelled) reportError(reason);
    });
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    capabilities,
    capabilitiesReady,
    appId,
    client,
    deploymentPage,
    deploymentHistoryVersion,
    fetchConfig,
    refreshVersion,
    reportError,
    panelDetail,
    panelVersion,
    detail?.app.currentDeploymentId,
  ]);

  useEffect(() => {
    const pending =
      detail?.hasPendingDeployment || detail?.runtime.state === 'pending';
    if (!pending) return;
    let cancelled = false;
    let timer: number;
    let failures = 0;
    const poll = async (): Promise<void> => {
      if (refreshInFlightRef.current) {
        timer = window.setTimeout(() => void poll(), 1_500);
        return;
      }
      refreshInFlightRef.current = true;
      setRefreshing('auto');
      let keepPolling = true;
      try {
        const nextDetail = await loadDetail();
        if (cancelled) return;
        failures = 0;
        keepPolling =
          nextDetail.hasPendingDeployment ||
          nextDetail.runtime.state === 'pending';
        setDetail(nextDetail);
        setPollNotice(keepPolling ? undefined : { appId, state: 'finished' });
      } catch (reason) {
        if (cancelled) return;
        // Authentication/authorization failures need user action, not retries.
        if (
          reason instanceof ApiClientError &&
          (reason.status === 401 || reason.status === 403)
        ) {
          keepPolling = false;
          reportError(reason);
        } else {
          failures += 1;
          setPollNotice({ appId, state: 'retrying' });
        }
      } finally {
        refreshInFlightRef.current = false;
        setRefreshing(null);
        // Schedule after completion so slow requests never overlap. Unchanged
        // pending flags must not stop polling; transient errors back off.
        if (!cancelled && keepPolling)
          timer = window.setTimeout(
            () => void poll(),
            Math.min(1_500 * 2 ** Math.min(failures, 3), 12_000),
          );
      }
    };
    timer = window.setTimeout(() => void poll(), 1_500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    loadDetail,
    reportError,
    appId,
    detail?.hasPendingDeployment,
    detail?.runtime.state,
  ]);

  const perform = async (
    work: () => Promise<void>,
    refreshDetail = true,
  ): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      await work();
      if (refreshDetail) setDetail(await loadDetail());
      setRefreshVersion((value) => value + 1);
    } catch (reason) {
      reportError(reason);
    } finally {
      setBusy(false);
    }
  };

  const navigateToTab = (tab: DetailTab): void => {
    void navigate({
      pathname: `${appPath.pathname}/${tab}`,
      search: location.search,
    });
  };

  if (!selectedApp || !capabilitiesReady) {
    if (error) {
      return (
        <div className='space-y-4 py-8'>
          <ErrorNotification
            error={error}
            onClose={() => setError(undefined)}
          />
          <Button
            variant='outline'
            onClick={() => void navigate(applicationsPath.pathname)}
          >
            {t('detail.back', { defaultValue: 'Back to applications' })}
          </Button>
        </div>
      );
    }
    return (
      <div
        role='status'
        className='flex items-center gap-2 py-8 text-muted-foreground'
      >
        <LoaderCircle className='size-4 animate-spin' />
        {t('detail.loading', { defaultValue: 'Loading application…' })}
      </div>
    );
  }

  if (!availableTabs.length) {
    return (
      <div className='space-y-4 py-8'>
        <ErrorNotification
          message={t('detail.noTabs', {
            defaultValue:
              'You do not have access to any tabs for this application.',
          })}
        />
        <Button
          variant='outline'
          onClick={() => void navigate(applicationsPath.pathname)}
        >
          {t('detail.back', { defaultValue: 'Back to applications' })}
        </Button>
      </div>
    );
  }

  const explicitTabInvalid =
    !isParentEntry &&
    (!activeTab ||
      !availableTabs.includes(activeTab) ||
      (tabMatch?.params.tab === 'releases' && !capabilities['read-release']));
  if (explicitTabInvalid) {
    return (
      <div className='space-y-4 py-8'>
        <ErrorNotification
          message={t('detail.unavailable', {
            defaultValue: 'This application page is not available.',
          })}
        />
        <Button
          variant='outline'
          onClick={() => void navigate(applicationsPath.pathname)}
        >
          {t('detail.back', { defaultValue: 'Back to applications' })}
        </Button>
      </div>
    );
  }

  const contextValue: HubAppPageContextValue = {
    app: selectedApp,
    capabilities,
    busy,
    panelLoading:
      panelKey !== `${appId}:${activeTab}:${deploymentPage}:${panelVersion}`,
    deploymentsLoading,
    configMode,
    configContent,
    selectedReleaseId,
    releasesCollapsed,
    onReleasesCollapsed: setReleasesCollapsed,
    release: selectedRelease,
    deploymentPagination,
    onRelease: setSelectedReleaseId,
    onDeploymentPage: setDeploymentPage,
    onDeploy: (releaseId) => {
      setBusy(true);
      setError(undefined);
      void Promise.all([
        client.request<ApiResponse<readonly ReleaseRecord[]>>({
          path: `hub/apps/${appId}/releases`,
        }),
        loadConfig(appId),
      ])
        .then(([response, config]) => {
          setReleases(response.data);
          // Deploying moves forward, so default to the newest upload rather than the release already running. The
          // list is newest first. A release chosen from a row or uploaded in this workspace wins; the running release is only
          // the fallback when nothing has been uploaded at all.
          const targetId =
            releaseId ??
            selectedReleaseId ??
            response.data[0]?.id ??
            selectedApp.deployment.desiredReleaseId;
          if (!targetId) return;
          setDeploymentReleaseId(targetId);
          setDeploymentMode(config.mode);
          setDeploymentContent('');
          setDeploymentBaseline(config.content ?? '');
          setDeploymentBaselineMode(config.mode);
          setRollbackDeploymentId(undefined);
          setDeployOpen(true);
        })
        .catch(reportError)
        .finally(() => setBusy(false));
    },
    onRollback: (deploymentId) => {
      const target = selectedApp.deployments.find(
        (deployment) => deployment.id === deploymentId,
      );
      if (!target) return;
      setBusy(true);
      setError(undefined);
      void Promise.all([
        loadConfig(appId),
        client.request<ApiResponse<ReleaseRecord>>({
          path: `hub/apps/${appId}/releases/${target.releaseId}`,
        }),
      ])
        .then(([config, release]) => {
          setReleases((previous) =>
            previous.some((item) => item.id === release.data.id)
              ? previous
              : [...previous, release.data],
          );
          setDeploymentReleaseId(target.releaseId);
          setDeploymentMode(target.config.mode);
          setDeploymentContent('');
          setDeploymentBaseline(config.content ?? '');
          setDeploymentBaselineMode(config.mode);
          setRollbackDeploymentId(deploymentId);
          setDeployOpen(true);
        })
        .catch(reportError)
        .finally(() => setBusy(false));
    },
    onUpload: () => setUploadOpen(true),
    onSaveConfiguration: (content) =>
      void perform(async () => {
        const response = await client.request<ApiResponse<ConfigResponse>>({
          path: `hub/apps/${appId}/config`,
          method: 'PUT',
          json: { content },
        });
        setConfigContent(response.data.content ?? '');
      }),
    onSaveSettings: (settings) =>
      void perform(async () => {
        await client.request({
          path: `hub/apps/${appId}/settings`,
          method: 'PUT',
          json: settings,
        });
      }),
    onRemove: () => setRemoveOpen(true),
    onRefresh: () => {
      if (refreshInFlightRef.current) return;
      refreshInFlightRef.current = true;
      setRefreshing('manual');
      setError(undefined);
      void (async () => {
        try {
          await client.request({
            path: `hub/apps/${appId}/refresh`,
            method: 'POST',
          });
          setDetail(await loadDetail());
          setRefreshVersion((value) => value + 1);
        } catch (reason) {
          reportError(reason);
        } finally {
          refreshInFlightRef.current = false;
          setRefreshing(null);
        }
      })();
    },
  };

  return (
    <>
      <main className='min-h-[calc(100svh-4rem)] bg-background [&_button:not(:disabled)]:cursor-pointer'>
        <div className='mx-auto max-w-[1600px] px-5 py-6 sm:px-8 sm:py-8'>
          {pollNotice?.appId === appId && (
            <p role='status' className='mb-3 text-sm text-muted-foreground'>
              {pollNotice.state === 'retrying'
                ? t('deployments.statusRetrying', {
                    defaultValue:
                      'Status updates interrupted. Retrying automatically…',
                  })
                : !selectedApp.hasPendingDeployment &&
                    selectedApp.runtime.state !== 'pending'
                  ? t('deployments.statusFinished', {
                      defaultValue:
                        'Deployment or startup has finished. Check the latest status and deployment record for the result.',
                    })
                  : null}
            </p>
          )}
          <HubAppPageContext.Provider value={contextValue}>
            <Detail
              refreshing={refreshing}
              app={selectedApp}
              capabilities={capabilities}
              tab={effectiveTab}
              busy={busy}
              onBack={() => {
                void navigate(applicationsPath.pathname);
              }}
              onTab={navigateToTab}
              onRefresh={contextValue.onRefresh}
              onStart={() => setLifecycleAction('start')}
              onRestart={() => setLifecycleAction('restart')}
              onStop={() => setLifecycleAction('stop')}
            />
          </HubAppPageContext.Provider>
        </div>
      </main>
      {lifecycleAction ? (
        <AppDialog
          title={t(
            `detail.${lifecycleAction === 'start' ? 'startTitle' : lifecycleAction === 'stop' ? 'stopTitle' : 'restartTitle'}`,
            {
              name: selectedApp.app.name,
              defaultValue: `${lifecycleAction === 'start' ? 'Start' : lifecycleAction === 'stop' ? 'Stop' : 'Restart'} ${selectedApp.app.name}?`,
            },
          )}
          description={
            lifecycleAction === 'start'
              ? t('detail.startDescription', {
                  defaultValue:
                    'Start this application using its current release and configuration.',
                })
              : lifecycleAction === 'stop'
                ? t('detail.stopDescription', {
                    defaultValue:
                      'This application will be unavailable until you start it again. Its deployment and data will be retained.',
                  })
                : t('detail.restartDescription', {
                    defaultValue:
                      'Stop and start this application using its current release and configuration. Access will be briefly interrupted; other applications will not be restarted.',
                  })
          }
          onClose={() => {
            if (!busy) setLifecycleAction(undefined);
          }}
          footer={
            <>
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => setLifecycleAction(undefined)}
              >
                {t('detail.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                disabled={busy}
                variant={lifecycleAction === 'stop' ? 'destructive' : 'default'}
                onClick={() => {
                  const action = lifecycleAction;
                  if (!action) return;
                  setLifecycleAction(undefined);
                  void perform(async () => {
                    await client.request({
                      path: `hub/apps/${appId}/${action}`,
                      method: 'POST',
                    });
                  });
                }}
              >
                {busy ? <LoaderCircle className='size-4 animate-spin' /> : null}
                {lifecycleAction === 'start'
                  ? t('detail.start', { defaultValue: 'Start' })
                  : lifecycleAction === 'stop'
                    ? t('detail.stop', { defaultValue: 'Stop' })
                    : t('detail.restart', { defaultValue: 'Restart' })}
              </Button>
            </>
          }
        />
      ) : null}
      {deployOpen &&
      capabilities[rollbackDeploymentId ? 'rollback' : 'deploy'] ? (
        <DeploymentDialog
          app={selectedApp}
          releaseId={deploymentReleaseId}
          mode={deploymentMode}
          content={deploymentContent}
          baselineContent={deploymentBaseline}
          baselineMode={deploymentBaselineMode}
          rollback={Boolean(rollbackDeploymentId)}
          busy={busy}
          onRelease={setDeploymentReleaseId}
          loadTemplate={loadReleaseConfig}
          onMode={setDeploymentMode}
          onContent={setDeploymentContent}
          onClose={() => setDeployOpen(false)}
          onComplete={() =>
            void perform(async () => {
              if (!deploymentReleaseId || deploymentMode === 'managed') return;
              const endpoint = rollbackDeploymentId ? 'rollback' : 'deploy';
              const response = await client.request<
                ApiResponse<{ id: string }>
              >({
                path: `hub/apps/${appId}/${endpoint}`,
                method: 'POST',
                json: {
                  ...(rollbackDeploymentId
                    ? { deploymentId: rollbackDeploymentId }
                    : { releaseId: deploymentReleaseId }),
                  config: {
                    mode: deploymentMode,
                    ...(deploymentMode === 'file'
                      ? { content: deploymentContent }
                      : {}),
                  },
                },
              });
              setDeploymentHistoryVersion((value) => value + 1);
              setSelectedReleaseId(deploymentReleaseId);
              setDeployOpen(false);
              setRollbackDeploymentId(undefined);
              setReleasesCollapsed(true);
              await navigate({
                pathname: `${appPath.pathname}/deployments${capabilities['read-deployment'] ? `/${response.data.id}/logs` : ''}`,
                search: location.search,
              });
              setDeploymentPage(1);
            })
          }
        />
      ) : null}
      {uploadOpen && capabilities['upload-release'] ? (
        <UploadReleaseDialog
          artifact={artifact}
          busy={busy}
          onArtifact={setArtifact}
          onClose={() => setUploadOpen(false)}
          onUpload={() =>
            void perform(async () => {
              if (!artifact) return;
              const uploaded = await uploadArtifact(client, appId, artifact);
              setSelectedReleaseId(uploaded.id);
              setReleases((previous) => [
                uploaded,
                ...previous.filter((item) => item.id !== uploaded.id),
              ]);
              setReleasesCollapsed(false);
              setArtifact(undefined);
              setUploadOpen(false);
              toaster.show({
                type: 'success',
                title: t(
                  capabilities.deploy &&
                    capabilities['read-release'] &&
                    capabilities['read-config'] &&
                    capabilities['read-config-template']
                    ? 'releases.uploaded'
                    : 'releases.uploadedOnly',
                ),
                duration: 4000,
              });
            })
          }
        />
      ) : null}
      {removeOpen && capabilities.remove ? (
        <RemoveApplicationDialog
          app={selectedApp}
          busy={busy}
          onClose={() => setRemoveOpen(false)}
          onRemove={() =>
            void perform(async () => {
              await client.request({
                path: `hub/apps/${appId}`,
                method: 'DELETE',
              });
              setRemoveOpen(false);
              void navigate(applicationsPath.pathname);
            }, false)
          }
        />
      ) : null}
      {error ? (
        <ErrorNotification error={error} onClose={() => setError(undefined)} />
      ) : null}
    </>
  );
}

export function AppTabLoading({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  return (
    <div
      role='status'
      className='flex items-center gap-2 text-muted-foreground'
    >
      <LoaderCircle className='size-4 animate-spin' />
      {children ??
        t('detail.loading', {
          defaultValue: 'Loading…',
        })}
    </div>
  );
}
