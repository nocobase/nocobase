import { useState, type ReactElement } from 'react';
import {
  useApiClient,
  useRealtimeTopic,
  type RealtimeSubscriptionState,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  PERSONAL_TOPIC,
  UNKNOWN_TOPIC,
  type CounterSnapshot,
  type PublicationReceipt,
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

export function ClockExample(): ReactElement {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState<string>();
  const [events, setEvents] = useState(0);
  const [ready, setReady] = useState(0);
  const [state, setState] = useState<RealtimeSubscriptionState>('pending');
  const [error, setError] = useState<string>();
  useRealtimeTopic<string>(
    'clock:now',
    ({ payload }) => {
      setTime(payload);
      setEvents((value) => value + 1);
    },
    {
      enabled,
      onStateChange: setState,
      onReady: () => {
        setReady((value) => value + 1);
        setError(undefined);
        setState('subscribed');
      },
      onError: (failure) => setError(failure.code),
    },
  );
  return (
    <DemoPanel name='clock'>
      <Topic>clock:now</Topic>
      <WatchStatus
        watch={{
          state: enabled ? state : 'closed',
          error,
          events,
          ready,
          retry() {},
        }}
      />
      <dl>
        <Metric label={t('clock.latest')}>{time ?? t('waiting')}</Metric>
      </dl>
      <p className='text-sm text-muted-foreground'>
        {t(!enabled ? 'clock.paused' : 'clock.initial')}
      </p>
      <div>
        <Button variant='outline' onClick={() => setEnabled((value) => !value)}>
          {t(enabled ? 'pause' : 'resume')}
        </Button>
      </div>
    </DemoPanel>
  );
}

export function PersonalExample({
  reload,
}: {
  reload: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const snapshot = useDemoSnapshot<CounterSnapshot>(
    '/realtimeExample/personal',
  );
  const task = useDemoTask();
  const [receipt, setReceipt] = useState<string>();
  const watch = useDemoWatch<CounterSnapshot>(PERSONAL_TOPIC, {
    onReady: () => {
      void snapshot.reload();
    },
    onEvent: () => {
      void snapshot.reload();
    },
  });
  return (
    <DemoPanel name='personal'>
      <Topic>{PERSONAL_TOPIC}</Topic>
      <WatchStatus watch={watch} />
      <dl>
        <Metric label={t('snapshot')}>
          {snapshot.data?.value ?? t('none')}
        </Metric>
        <Metric label={t('receipt')}>{receipt ?? t('none')}</Metric>
      </dl>
      {snapshot.loading ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('counter.refreshing')}
        </p>
      ) : null}
      <p className='text-sm text-muted-foreground'>
        {t(snapshot.data?.value ? 'personal.recovery' : 'personal.empty')}
      </p>
      <Failure
        error={snapshot.error ?? task.error}
        retry={() => {
          void snapshot.reload();
        }}
        reload={reload}
      />
      <div>
        <Button
          variant='outline'
          disabled={task.pending}
          onClick={() => {
            void task.run(async (signal) => {
              const response = await api.request<{ data: PublicationReceipt }>({
                path: '/realtimeExample/personal/events',
                method: 'POST',
                json: {},
                signal,
              });
              if (!signal.aborted) setReceipt(response.data.eventId);
            });
          }}
        >
          {t(task.pending ? 'working' : 'personal.send')}
        </Button>
      </div>
    </DemoPanel>
  );
}

export function UnknownTopicExample(): ReactElement {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const watch = useDemoWatch(enabled ? UNKNOWN_TOPIC : null);
  return (
    <DemoPanel name='unknown'>
      <Topic>{UNKNOWN_TOPIC}</Topic>
      <WatchStatus watch={watch} />
      <p className='text-sm text-muted-foreground'>
        {t(enabled ? 'unknown.explanation' : 'unknown.initial')}
      </p>
      <div>
        <Button
          variant='outline'
          disabled={enabled}
          onClick={() => setEnabled(true)}
        >
          {t('unknown.try')}
        </Button>
      </div>
    </DemoPanel>
  );
}
