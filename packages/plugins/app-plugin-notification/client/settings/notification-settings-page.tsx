import { useCallback, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';

import { NotificationKinds } from '../components/templates.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs.js';
import { useNotificationText } from '../text.js';
import { DELIVERY_OUTCOMES, type NotificationDeliveryOutcome } from './api.js';
import { ChannelsTab } from './channels-tab.js';
import { DeliveriesTab, type DeliveriesTabProps } from './deliveries-tab.js';

import { useLoaded, useSettingsApi } from './hooks.js';
import { Button } from '../components/ui/button.js';
const TABS = ['channels', 'kinds', 'deliveries'] as const;
type Tab = (typeof TABS)[number];

/** The search parameters the delivery log keeps its filters in. */
const FILTER_PARAMS = ['status', 'channel', 'kind', 'q', 'range'] as const;

/**
 * System settings › Messages › Notifications: the channels, the notification kinds and the delivery log, one tab
 * each. The tab, the filters and the open drawer live in the URL, so a link opens the same view.
 */
export function NotificationSettingsPage(): ReactElement {
  const { t } = useNotificationText();
  const api = useSettingsApi();
  const [loaded, reload] = useLoaded(() => api.channels(), 'channels');
  const failures =
    loaded.state === 'ready'
      ? loaded.data.data.reduce(
          (count, channel) => count + channel.last24h.failed,
          0,
        )
      : 0;
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.includes(requested as Tab)
    ? (requested as Tab)
    : 'channels';
  const update = useCallback(
    (change: (next: URLSearchParams) => void) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          change(next);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const openTab = (value: Tab, extra?: Record<string, string>) =>
    update((next) => {
      for (const key of [...FILTER_PARAMS, 'kindId', 'delivery'])
        next.delete(key);
      if (value === 'channels') next.delete('tab');
      else next.set('tab', value);
      for (const [key, item] of Object.entries(extra ?? {}))
        next.set(key, item);
    });
  const status = params.get('status');
  const filter: DeliveriesTabProps['filter'] = {
    ...(DELIVERY_OUTCOMES.includes(status as NotificationDeliveryOutcome)
      ? { status: status as NotificationDeliveryOutcome }
      : {}),
    ...Object.fromEntries(
      (['channel', 'kind', 'q', 'range'] as const)
        .map((key) => [key, params.get(key)] as const)
        .filter(([, value]) => value),
    ),
  };
  return (
    <div className='mx-auto w-full max-w-6xl min-w-0 space-y-5 p-4 sm:p-6'>
      <header className='space-y-1'>
        <h1 className='text-xl font-semibold'>{t('settings.title')}</h1>
        <p className='text-sm text-muted-foreground'>
          {t('settings.description')}
        </p>
      </header>
      {failures > 0 && (
        <div className='flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive'>
          {t('channels.failureSummary', { count: failures })}
          <Button
            variant='link'
            size='sm'
            onClick={() =>
              openTab('deliveries', { status: 'failed', range: '24h' })
            }
          >
            {t('channels.showFailures')}
          </Button>
        </div>
      )}
      <Tabs
        value={tab}
        onValueChange={(value) => openTab(value as Tab)}
        className='min-w-0'
      >
        <TabsList variant='line' className='h-auto max-w-full border-b pb-1'>
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(`settings.tabs.${value}`)}
              {value === 'deliveries' && failures > 0 && tab !== value && (
                <span className='rounded-full bg-destructive/10 px-1.5 text-xs text-destructive'>
                  {failures}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value='channels' className='pt-3'>
          <ChannelsTab
            onShowTest={(channel, q) =>
              openTab('deliveries', { channel, q, range: '24h' })
            }
            loaded={loaded}
            reload={reload}
            onShowDeliveries={(channel) =>
              openTab('deliveries', { channel, status: 'failed', range: '24h' })
            }
          />
        </TabsContent>
        <TabsContent value='kinds' className='pt-3'>
          <NotificationKinds
            selectedId={params.get('kindId')}
            onSelect={(id) =>
              update((next) => {
                if (id) next.set('kindId', id);
                else next.delete('kindId');
              })
            }
          />
        </TabsContent>
        <TabsContent value='deliveries' className='pt-3'>
          <DeliveriesTab
            filter={filter}
            onFilterChange={(change) =>
              update((next) => {
                for (const key of FILTER_PARAMS) {
                  const value = change[key];
                  if (value) next.set(key, value);
                  else next.delete(key);
                }
              })
            }
            selectedId={params.get('delivery')}
            onSelect={(id) =>
              update((next) => {
                if (id) next.set('delivery', id);
                else next.delete('delivery');
              })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NotificationSettingsPage;
