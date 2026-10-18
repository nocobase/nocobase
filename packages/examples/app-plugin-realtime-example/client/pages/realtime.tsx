import { useEffect, useState, type ReactElement } from 'react';
import {
  realtimeClientToken,
  useRealtimeConnectionState,
  useService,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { DemoState } from '../../shared/demo.js';
import { useDemoSnapshot } from '../hooks/demo.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Failure, Metric } from '../components/demo-panel.js';
import {
  ClockExample,
  PersonalExample,
  UnknownTopicExample,
} from '../components/topic-examples.js';
import { RoomExample } from '../components/room-example.js';
import { RefreshExample } from '../components/refresh-example.js';
import { RecoveryExample } from '../components/recovery-example.js';
import { Button } from '../components/ui/button.js';
import { Skeleton } from '../components/ui/skeleton.js';

function Demo({ reload }: { reload: () => void }): ReactElement {
  const { t } = useTranslation();
  const snapshot = useDemoSnapshot<DemoState>('/realtimeExample/state');
  const { reload: readState } = snapshot;
  useEffect(() => {
    void readState();
  }, [readState]);
  if (!snapshot.data)
    return (
      <>
        <Failure
          error={snapshot.error}
          retry={() => {
            void snapshot.reload();
          }}
          reload={reload}
        />
        {!snapshot.error ? (
          <div
            aria-label={t('loading')}
            role='status'
            className='grid gap-6 lg:grid-cols-2'
          >
            {[1, 2, 3, 4, 5, 6].map((id) => (
              <Skeleton key={id} className='h-48 w-full' />
            ))}
          </div>
        ) : null}
      </>
    );
  return (
    <>
      <dl>
        <Metric label={t('account')}>{snapshot.data.userId}</Metric>
      </dl>
      <div className='grid items-start gap-6 lg:grid-cols-2'>
        <ClockExample />
        <PersonalExample reload={reload} />
        <RoomExample
          key={snapshot.data.room.id}
          room={snapshot.data.room}
          reload={reload}
        />
        <RefreshExample reload={reload} />
        <UnknownTopicExample />
        <RecoveryExample />
      </div>
    </>
  );
}

export default function RealtimeExamplePage(): ReactElement {
  const { t } = useTranslation();
  const realtime = useService(realtimeClientToken);
  const connection = useRealtimeConnectionState();
  const { session } = useAuthentication();
  const [generation, setGeneration] = useState(0);
  // Changing account or original session unmounts every watch, pending read and displayed snapshot.
  const identity = JSON.stringify([
    session?.user.id,
    session?.session.id,
    generation,
  ]);
  return (
    <PageContainer>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button variant='outline' onClick={() => realtime.reconnect()}>
            {t('reconnect')}
          </Button>
        }
      />
      <p className='text-sm text-muted-foreground'>{t('scope')}</p>
      <dl>
        <Metric label={t('connection')}>{t(`states.${connection}`)}</Metric>
      </dl>
      {session ? (
        <Demo
          key={identity}
          reload={() => setGeneration((value) => value + 1)}
        />
      ) : null}
    </PageContainer>
  );
}
