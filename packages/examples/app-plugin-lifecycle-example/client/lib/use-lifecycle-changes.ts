import { useRealtimeTopic } from '@nocobase/app-client';
import {
  LIFECYCLE_CHANGES_TOPIC,
  type LifecycleChange,
} from '../../shared/routes.js';

/** Refreshes after each acknowledged subscription because disconnected changes are not replayed. */
export function useLifecycleChanges(
  listener: (change: LifecycleChange | undefined) => void,
): void {
  useRealtimeTopic<LifecycleChange>(
    LIFECYCLE_CHANGES_TOPIC,
    ({ payload }) => listener(payload),
    { onReady: () => listener(undefined) },
  );
}
