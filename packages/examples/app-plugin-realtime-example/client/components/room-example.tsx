import { useRef, useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  CounterSnapshot,
  PublicationReceipt,
  RoomAccess,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog.js';

export function RoomExample({
  room,
  reload,
}: {
  room: RoomAccess;
  reload: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const [allowed, setAllowed] = useState(room.allowed);
  const grantRef = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState(false);
  const [receipt, setReceipt] = useState<string>();
  const path = `/realtimeExample/rooms/${room.id}`;
  const snapshot = useDemoSnapshot<CounterSnapshot>(path);
  const task = useDemoTask();
  const topic = `realtime-example:rooms:${room.id}`;
  const watch = useDemoWatch(topic, {
    onReady: () => {
      setAllowed(true);
      void snapshot.reload();
    },
    onEvent: () => {
      void snapshot.reload();
    },
    onError: (failure) => {
      snapshot.clear();
      if (failure.code === 'FORBIDDEN') setAllowed(false);
    },
  });
  const changeAccess = async (next: boolean): Promise<void> => {
    if (!next) snapshot.clear();
    const success = await task.run(async (signal) => {
      const response = await api.request<{ data: RoomAccess }>({
        path: `${path}/access`,
        method: 'PATCH',
        json: { allowed: next },
        signal,
      });
      if (!signal.aborted) setAllowed(response.data.allowed);
    }, 'room.success');
    if (success) setConfirm(false);
  };
  return (
    <DemoPanel name='room'>
      <Topic>{topic}</Topic>
      <p className='text-sm font-medium'>
        {t(allowed ? 'room.allowed' : 'room.denied')}
      </p>
      <WatchStatus watch={watch} />
      <dl>
        <Metric label={t('snapshot')}>
          {allowed ? (snapshot.data?.value ?? t('none')) : t('room.blocked')}
        </Metric>
        <Metric label={t('receipt')}>{receipt ?? t('none')}</Metric>
      </dl>
      {snapshot.loading ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('counter.refreshing')}
        </p>
      ) : null}
      <Failure
        error={snapshot.error ?? task.error}
        retry={
          allowed
            ? () => {
                void snapshot.reload();
              }
            : undefined
        }
        reload={reload}
      />
      {!allowed || watch.state === 'error' ? (
        <p className='text-sm text-muted-foreground'>
          {t(allowed ? 'room.retryHint' : 'room.grantHint')}
        </p>
      ) : null}
      <div className='flex flex-wrap gap-2'>
        {!allowed ? (
          <Button
            variant='outline'
            ref={grantRef}
            disabled={task.pending}
            onClick={() => {
              void changeAccess(true);
            }}
          >
            {t(task.pending ? 'working' : 'room.grant')}
          </Button>
        ) : (
          <>
            {watch.state === 'error' ? (
              <Button
                variant='outline'
                disabled={task.pending}
                onClick={watch.retry}
              >
                {t('room.retry')}
              </Button>
            ) : null}
            <Button
              variant='outline'
              disabled={task.pending || watch.state !== 'subscribed'}
              onClick={() => {
                void task.run(async (signal) => {
                  const response = await api.request<{
                    data: PublicationReceipt;
                  }>({
                    path: `${path}/events`,
                    method: 'POST',
                    json: {},
                    signal,
                  });
                  if (!signal.aborted) setReceipt(response.data.eventId);
                });
              }}
            >
              {t(task.pending ? 'working' : 'room.send')}
            </Button>
          </>
        )}
        <AlertDialog
          open={confirm}
          onOpenChange={(open) => {
            if (!task.pending) setConfirm(open);
          }}
        >
          {allowed ? (
            <AlertDialogTrigger
              render={<Button variant='destructive' disabled={task.pending} />}
            >
              {t('room.revoke')}
            </AlertDialogTrigger>
          ) : null}
          <AlertDialogContent finalFocus={allowed ? undefined : grantRef}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('room.revokeTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('room.revokeDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Failure error={task.error} reload={reload} />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={task.pending}>
                {t('cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                disabled={task.pending}
                onClick={() => {
                  void changeAccess(false);
                }}
              >
                {t(task.pending ? 'working' : 'room.revoke')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DemoPanel>
  );
}
