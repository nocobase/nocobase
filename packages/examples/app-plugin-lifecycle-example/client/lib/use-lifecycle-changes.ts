import { useEffect, useEffectEvent } from 'react';
import { realtimeClientToken, useService } from '@nocobase/app-client';

import {
  LIFECYCLE_CHANGES_TOPIC,
  type LifecycleChange,
} from '../../shared/routes.js';

/**
 * Calls `listener` with each record the server says changed — a transition
 * committed, a webhook stored or delivered — and with nothing when the
 * connection (re)opens: pushes are not replayed, so whatever was missed is
 * read again then.
 */
export function useLifecycleChanges(
  listener: (change: LifecycleChange | undefined) => void,
): void {
  const realtime = useService(realtimeClientToken);
  // The latest listener, without resubscribing on every render.
  const onChange = useEffectEvent(listener);
  useEffect(() => {
    const unsubscribe = realtime.subscribe<LifecycleChange>(
      LIFECYCLE_CHANGES_TOPIC,
      (event) => onChange(event.payload),
    );
    const stopOpen = realtime.onOpen(() => onChange(undefined));
    return () => {
      stopOpen();
      unsubscribe();
    };
  }, [realtime]);
}
