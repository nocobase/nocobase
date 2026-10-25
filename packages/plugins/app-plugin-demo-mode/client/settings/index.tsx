import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useCallback, useEffect, useState, type ReactElement } from 'react';

import type { DemoConfigurationView } from '../../shared/configuration.js';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { useDemoData } from '../demo-data.js';
import { Button, DefaultHeader } from './components.js';
import { DataCard, VisitorsCard } from './overview.js';
import { ScheduleCard } from './schedule.js';
import {
  DemoSettingsContext,
  useT,
  type DemoSettingsOptions,
} from './context.js';
import { ErrorAlert } from './shared.js';

export type {
  DemoSettingsComponents,
  DemoSettingsHeaderProps,
} from './components.js';

export type { DemoLabelKind, DemoSettingsOptions } from './context.js';

const settings = (id: string, action: string) => ({
  resource: { type: 'settings', id },
  action,
});

/** What the signed-in person may see and change on the page. */
function useAccess() {
  const readData = useCan(settings('demoMode.data', 'read'));
  const manageData = useCan(settings('demoMode.data', 'manage'));
  const readConfiguration = useCan(settings('demoMode.configuration', 'read'));
  return {
    pending: readData.isPending || readConfiguration.isPending,
    readData: readData.can,
    manageData: readData.can && manageData.can,
    readConfiguration: readConfiguration.can,
  };
}

/**
 * The demo's administration page: its data, how visitors enter, and the daily reset.
 * An application mounts it on a route of its own, passing the names of its dataset counts.
 */
export function DemoModeSettings(
  options: DemoSettingsOptions = {},
): ReactElement {
  const t = useT();
  const Header = options.components?.Header ?? DefaultHeader;
  const api = useApiClient();
  const access = useAccess();
  const demo = useDemoData({ enabled: access.readData });
  const [view, setView] = useState<DemoConfigurationView>();
  const [viewError, setViewError] = useState<unknown>();
  const [configurationLoaded, setConfigurationLoaded] = useState<{
    reads: number;
    importing: boolean;
  }>();
  const [enabled, setEnabled] = useState<boolean>();
  // Bumped to read the configuration again; a later read supersedes an earlier one still in flight.
  const [reads, setReads] = useState(0);
  const load = useCallback(async () => {
    setReads((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    api
      .request<{ data: { enabled: boolean } }>({ path: '/demoMode/status' })
      .then(({ data }) => {
        if (active) setEnabled(data.enabled);
      })
      .catch(() => {
        if (active) setEnabled(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  // Refresh the busy state and the server's next-run preview when a data operation finishes.
  const importing = Boolean(demo.status?.importing);
  const readable = access.readConfiguration && enabled === true;
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

  if (access.pending || enabled === undefined)
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-48 w-full' />
      </div>
    );
  if (!enabled)
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

  const refreshing =
    demo.loading ||
    (readable &&
      (configurationLoaded?.reads !== reads ||
        configurationLoaded?.importing !== importing));
  const configured = () =>
    viewError ? (
      <ErrorAlert
        error={viewError}
        action={
          <Button variant='outline' size='sm' onClick={() => void load()}>
            {t('retry')}
          </Button>
        }
      />
    ) : view ? (
      <ScheduleCard configuration={view} />
    ) : (
      <Skeleton className='h-56 w-full' />
    );

  return (
    <DemoSettingsContext.Provider value={options}>
      <div className='flex flex-col gap-4'>
        <Header
          title={t('title')}
          refreshLabel={t('refresh')}
          refreshDisabled={refreshing}
          refreshing={refreshing}
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
        {access.readData ? (
          <DataCard demo={demo} canManage={access.manageData} />
        ) : null}
        {access.readConfiguration ? configured() : null}
        {access.readData ? <VisitorsCard status={demo.status} /> : null}
      </div>
    </DemoSettingsContext.Provider>
  );
}

export default DemoModeSettings;
