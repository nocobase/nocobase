import { useSyncExternalStore, type ReactElement } from 'react';
import type { RealtimeClient } from '@nocobase/app-client';

export interface LiveIndicatorProps {
  readonly realtime: RealtimeClient;
  readonly live: string;
  readonly offline: string;
}

/** Shows the transport state; topic readiness is acknowledged separately. */
export function LiveIndicator({
  realtime,
  live,
  offline,
}: LiveIndicatorProps): ReactElement {
  const connected = useSyncExternalStore(
    realtime.onStateChange,
    () => realtime.connected,
    () => false,
  );
  return (
    <span className='flex items-center gap-2 text-xs text-muted-foreground'>
      <span
        aria-hidden
        className={`size-2 rounded-full ${connected ? 'bg-primary' : 'bg-muted-foreground/40'}`}
      />
      {connected ? live : offline}
    </span>
  );
}
