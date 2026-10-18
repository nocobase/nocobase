import { useState, type ReactElement } from 'react';
import { useApiClient, useRealtimeRefresh } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  COUNTER_TOPIC,
  type BurstReceipt,
  type CounterSnapshot,
} from '../../shared/demo.js';
import { useDemoSnapshot, useDemoTask, useDemoWatch } from '../hooks/demo.js';
import {
  DemoPanel,
  Failure,
  Metric,
  Topic,
  WatchStatus,
} from './demo-panel.js';
import { Button } from './ui/button.js';

export function RefreshExample({
  reload,
}: {
  reload: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const [enabled, setEnabled] = useState(true);
  const [receipt, setReceipt] = useState<string>();
  const task = useDemoTask();
  const snapshot = useDemoSnapshot<CounterSnapshot>('/realtimeExample/counter');
  // The observer and refresh hook share one server subscription. Pausing the latter leaves event counting active.
  const watch = useDemoWatch(COUNTER_TOPIC);
  useRealtimeRefresh(COUNTER_TOPIC, snapshot.reload, { enabled, delayMs: 100 });
  return (
    <DemoPanel name='counter'>
      <Topic>{COUNTER_TOPIC}</Topic>
      <WatchStatus watch={watch} />
      <dl className='flex flex-col gap-2'>
        <Metric label={t('snapshot')}>
          {snapshot.data?.value ?? t('none')}
        </Metric>
        <Metric label={t('reads')}>{snapshot.reads}</Metric>
        <Metric label={t('readAt')}>{snapshot.readAt ?? t('none')}</Metric>
        <Metric label={t('receipt')}>{receipt ?? t('none')}</Metric>
      </dl>
      {snapshot.loading && enabled ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('counter.refreshing')}
        </p>
      ) : null}
      <p className='text-sm text-muted-foreground'>
        {t(enabled ? 'counter.running' : 'counter.paused')}
      </p>
      <p className='text-sm text-muted-foreground'>{t('counter.note')}</p>
      <Failure
        error={snapshot.error}
        retry={() => {
          void snapshot.reload();
        }}
        reload={reload}
      />
      <Failure error={task.error} reload={reload} />
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          disabled={task.pending}
          onClick={() => {
            void task.run(async (signal) => {
              const response = await api.request<{ data: BurstReceipt }>({
                path: '/realtimeExample/counter/events',
                method: 'POST',
                json: { count: 5 },
                signal,
              });
              if (!signal.aborted) setReceipt(response.data.lastEventId);
            });
          }}
        >
          {t(task.pending ? 'working' : 'counter.burst')}
        </Button>
        <Button variant='outline' onClick={() => setEnabled((value) => !value)}>
          {t(enabled ? 'counter.pause' : 'counter.resume')}
        </Button>
      </div>
    </DemoPanel>
  );
}
