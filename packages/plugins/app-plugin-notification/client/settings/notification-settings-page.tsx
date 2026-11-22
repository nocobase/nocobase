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
      for (const [key, item] of Object.entries(extra ?? {})) next.set(key, item);
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
      <Tabs
        value={tab}
        onValueChange={(value) => openTab(value as Tab)}
        className='min-w-0'
      >
        <TabsList className='max-w-full overflow-x-auto'>
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(`settings.tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value='channels' className='pt-3'>
          <ChannelsTab
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
