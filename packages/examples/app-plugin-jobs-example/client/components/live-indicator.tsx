import { useEffect, useState, type ReactElement } from 'react';
import type { RealtimeClient } from '@nocobase/app-client';

export interface LiveIndicatorProps {
  readonly realtime: RealtimeClient;
  readonly live: string;
  readonly offline: string;
}

/** Shows whether pushed changes are arriving. */
export function LiveIndicator({
  realtime,
  live,
  offline,
}: LiveIndicatorProps): ReactElement {
  const [connected, setConnected] = useState(realtime.connected);
  useEffect(() => {
    // `connected` has no change event of its own; a short poll keeps the
    // indicator honest after the socket drops.
    const timer = setInterval(() => setConnected(realtime.connected), 1000);
    const stopOpen = realtime.onOpen(() => setConnected(true));
    return () => {
      clearInterval(timer);
      stopOpen();
    };
  }, [realtime]);
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
