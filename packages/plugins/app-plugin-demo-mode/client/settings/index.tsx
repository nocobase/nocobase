import { useApiClient, useNavigationGuard } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';

import type { DemoConfigurationView } from '../../server/configuration/types.js';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.js';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.js';
import { Badge } from '../components/ui/badge.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { Tabs, TabsContent } from '../components/ui/tabs.js';
import { useDemoData } from '../demo-data.js';
import { Button, DefaultHeader, TabsList, TabsTrigger } from './components.js';
import { DataCard, VisitorsCard } from './overview.js';
import { ScheduleCard } from './schedule.js';
import {
  DemoSettingsContext,
  useT,
  type Configuration,
  type DemoSettingsOptions,
} from './context.js';
import { ErrorAlert } from './shared.js';
import { ChatCard, MocksCard } from './simulation.js';
import { CapabilitiesCard, CollectionsCard } from './writes.js';

export type {
  DemoSettingsComponents,
  DemoSettingsHeaderProps,
} from './components.js';

export type {
  DemoChatTool,
  DemoLabelKind,
  DemoSettingsOptions,
} from './context.js';

const TABS = ['overview', 'schedule', 'writes', 'simulation'] as const;
type Tab = (typeof TABS)[number];

const settings = (id: string, action: string) => ({
  resource: { type: 'settings', id },
  action,
});

/** What the signed-in person may see and change on the page. */
function useAccess() {
  const readData = useCan(settings('demoMode.data', 'read'));
  const manageData = useCan(settings('demoMode.data', 'manage'));
  const readConfiguration = useCan(settings('demoMode.configuration', 'read'));
  const configure = useCan(settings('demoMode.configuration', 'configure'));
  return {
    pending: readData.isPending || readConfiguration.isPending,
    readData: readData.can,
    manageData: readData.can && manageData.can,
    readConfiguration: readConfiguration.can,
    configure: readConfiguration.can && configure.can,
  };
}

/**
 * The demo's administration page: its data and how visitors enter, the daily reset, what visitors may write, and
 * what is simulated. An application mounts it on a route of its own, passing the names of what it registered.
 */
export function DemoModeSettings(
  options: DemoSettingsOptions = {},
): ReactElement {
  const t = useT();
  const Header = options.components?.Header ?? DefaultHeader;
  const api = useApiClient();
  const access = useAccess();
  const [params, setParams] = useSearchParams();
  const demo = useDemoData({ enabled: access.readData });
  const [view, setView] = useState<DemoConfigurationView>();
  const [viewError, setViewError] = useState<unknown>();
  const [configurationLoaded, setConfigurationLoaded] = useState<{
    reads: number;
    importing: boolean;
  }>();
  const [mode, setMode] = useState<string>();
  // Bumped to read the configuration again; a later read supersedes an earlier one still in flight.
  const [reads, setReads] = useState(0);
  const load = useCallback(async () => {
    setReads((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    api
      .request<{ data: { mode: string } }>({ path: '/demoMode/status' })
      .then(({ data }) => {
        if (active) setMode(data.mode);
      })
      .catch(() => {
        if (active) setMode('off');
      });
    return () => {
      active = false;
    };
  }, [api]);

  // A finished import or reset changes the configuration's `busy`, and may change what the reset schedule names.
  const importing = Boolean(demo.status?.importing);
  const readable =
    access.readConfiguration && mode !== undefined && mode !== 'off';
  useEffect(() => {
    if (!readable) return;
    let active = true;
    api
      .request<{ data: DemoConfigurationView }>({
        path: '/demoMode/configuration',
      })
      .then(({ data }) => {
        if (!active) return;
        setView(data);
        setViewError(undefined);
      })
      .catch((cause: unknown) => {
        if (active) setViewError(cause);
      })
      .finally(() => {
        if (active) setConfigurationLoaded({ reads, importing });
      });
    return () => {
      active = false;
    };
  }, [api, readable, importing, reads]);

  const [dirty, setDirty] = useState<ReadonlySet<string>>(() => new Set());
  const onDirty = useCallback((id: string, value: boolean) => {
    setDirty((current) => {
      if (current.has(id) === value) return current;
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const dirtyCount = dirty.size;
  const [leaving, setLeaving] = useState<(stay: boolean) => void>();
  useNavigationGuard(() =>
    dirtyCount
      ? new Promise<boolean>((resolve) =>
          setLeaving(() => (leave: boolean) => {
            setLeaving(undefined);
            resolve(leave);
          }),
        )
      : true,
  );
  useEffect(() => {
    if (!dirtyCount) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyCount]);

  if (access.pending || mode === undefined)
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-48 w-full' />
      </div>
    );
  if (mode === 'off')
    return (
      <Alert>
        <AlertTitle>{t('disabled.title')}</AlertTitle>
        <AlertDescription>{t('disabled.help')}</AlertDescription>
      </Alert>
    );
  if (!access.readData && !access.readConfiguration)
    return (
      <Alert>
        <AlertTitle>{t('errors.denied')}</AlertTitle>
      </Alert>
    );

  const available = TABS.filter((tab) =>
    tab === 'overview' ? access.readData : access.readConfiguration,
  );
  const requested = params.get('tab') as Tab | null;
  const tab =
    requested && available.includes(requested) ? requested : available[0];
  const configuration: Configuration | undefined = view
    ? {
        view: { ...view, busy: view.busy || importing },
        canEdit: access.configure,
        onSaved: setView,
        reload: load,
        onDirty,
      }
    : undefined;
  const configured = (render: (value: Configuration) => ReactElement) =>
    viewError ? (
      <ErrorAlert
        error={viewError}
        action={
          <Button variant='outline' size='sm' onClick={() => void load()}>
            {t('retry')}
          </Button>
        }
      />
    ) : configuration ? (
      render(configuration)
    ) : (
      <Skeleton className='h-56 w-full' />
    );

  return (
    <DemoSettingsContext.Provider value={options}>
      <div className='flex flex-col gap-6'>
        <Header
          title={t('title')}
          description={t(
            mode === 'observe' ? 'mode.observeHelp' : 'mode.readOnlyHelp',
          )}
          badge={
            <Badge variant={mode === 'observe' ? 'secondary' : 'default'}>
              {t(mode === 'observe' ? 'mode.observe' : 'mode.readOnly')}
            </Badge>
          }
          refreshLabel={t('refresh')}
          refreshDisabled={Boolean(dirtyCount)}
          refreshing={
            demo.loading ||
            (readable &&
              (configurationLoaded?.reads !== reads ||
                configurationLoaded?.importing !== importing))
          }
          activeTabLabel={t(`tabs.${tab}`)}
          onRefresh={() => {
            void demo.refresh();
            if (access.readConfiguration) void load();
          }}
        />
        {view?.busy || importing ? (
          <Alert>
            <AlertTitle>{t('busy')}</AlertTitle>
            <AlertDescription>{t('busyHelp')}</AlertDescription>
          </Alert>
        ) : null}
        <Tabs
          value={tab}
          onValueChange={(next) =>
            setParams(
              (current) => {
                const copy = new URLSearchParams(current);
                copy.set('tab', String(next));
                return copy;
              },
              { replace: true },
            )
          }
        >
          <TabsList aria-label={t('title')}>
            {available.map((item) => (
              <TabsTrigger key={item} value={item}>
                {t(`tabs.${item}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent
            keepMounted
            value='overview'
            className='mt-4 flex flex-col gap-4'
          >
            <DataCard demo={demo} canManage={access.manageData} />
            <VisitorsCard status={demo.status} />
          </TabsContent>
          <TabsContent
            keepMounted
            value='schedule'
            className='mt-4 flex flex-col gap-4'
          >
            {configured((value) => (
              <ScheduleCard
                configuration={value}
                languages={demo.status?.languages ?? []}
              />
            ))}
          </TabsContent>
          <TabsContent
            keepMounted
            value='writes'
            className='mt-4 flex flex-col gap-4'
          >
            <p className='text-sm text-muted-foreground'>{t('writes.intro')}</p>
            {configured((value) => (
              <>
                <CapabilitiesCard configuration={value} />
                <CollectionsCard configuration={value} />
              </>
            ))}
          </TabsContent>
          <TabsContent
            keepMounted
            value='simulation'
            className='mt-4 flex flex-col gap-4'
          >
            {configured((value) => (
              <>
                <ChatCard configuration={value} />
                <MocksCard configuration={value} />
              </>
            ))}
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog
        open={leaving !== undefined}
        onOpenChange={(open) => {
          if (!open) leaving?.(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leave.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('leave.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant='outline' onClick={() => leaving?.(false)}>
              {t('leave.stay')}
            </Button>
            <Button variant='destructive' onClick={() => leaving?.(true)}>
              {t('leave.discard')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DemoSettingsContext.Provider>
  );
}

export default DemoModeSettings;
