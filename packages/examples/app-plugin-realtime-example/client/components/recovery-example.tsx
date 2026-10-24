import { useEffect, useState, type ReactElement } from 'react';
import {
  realtimeClientToken,
  useApiClient,
  useRealtimeConnectionState,
  useService,
  type RealtimeConnectionState,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useDemoTask } from '../hooks/demo.js';
import { DemoPanel, Failure, Metric } from './demo-panel.js';
import { Button } from './ui/button.js';

export function RecoveryExample(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const realtime = useService(realtimeClientToken);
  const connection = useRealtimeConnectionState();
  const [history, setHistory] = useState<RealtimeConnectionState[]>(() => [
    realtime.state,
  ]);
  const task = useDemoTask();
  useEffect(
    () =>
      realtime.onStateChange((state) =>
        setHistory((previous) => [...previous.slice(-11), state]),
      ),
    [realtime],
  );
  return (
    <DemoPanel name='recovery'>
      <dl>
        <Metric label={t('connection')}>{t(`states.${connection}`)}</Metric>
      </dl>
      <div>
        <p className='text-sm text-muted-foreground'>{t('recovery.history')}</p>
        <p className='break-words text-sm'>
          {history.map((state) => t(`states.${state}`)).join(' → ')}
        </p>
      </div>
      <p className='text-sm text-muted-foreground'>{t('recovery.note')}</p>
      <p className='text-sm text-muted-foreground'>
        {t('recovery.instruction')}
      </p>
      <Failure error={task.error} />
      <div>
        <Button
          variant='outline'
          disabled={task.pending || connection !== 'open'}
          onClick={() => {
            void task.run(async (signal) => {
              await api.request({
                path: '/realtimeExample/connection/disconnect',
                method: 'POST',
                json: {},
                signal,
              });
            }, 'recovery.disconnected');
          }}
        >
          {t(task.pending ? 'working' : 'recovery.disconnect')}
        </Button>
      </div>
    </DemoPanel>
  );
}
