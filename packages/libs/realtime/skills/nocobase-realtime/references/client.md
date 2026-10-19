# Client integration

React pages reuse the host client. Do not create one connection per component. The usual snapshot pattern is:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import {
  refreshRealtimeQueries,
  useRealtimeRefresh,
} from '@nocobase/app-client';

function useOrderUpdates(visible: boolean) {
  const queryClient = useQueryClient();
  return useRealtimeRefresh(
    'orders:changed',
    (signal) =>
      refreshRealtimeQueries(queryClient, { queryKey: ['orders'] }, signal),
    { enabled: visible, delayMs: 100, refreshIntervalMs: 60_000 },
  );
}
```

This supplements the query's initial load. Prefix, exact-key and predicate matches are supported. When a notification arrives during an earlier read, the helper waits for that request then performs a fresh active read. Inactive queries remain invalid, and removed/replaced queries are not resurrected. Repeatedly cancelling a slow request can starve a streaming view; bare `invalidateQueries` with `cancelRefetch: false` can instead reuse an old response and lose the update. The helper handles both cases.

`useRealtimeRefresh` returns `{ status, stale, failures, error, lastSuccessfulRefresh, retry }`. Keep old usable data while a transient read retries; show a meaningful failure and Retry action after exhaustion. HTTP 401/403 stop automatic retries, and the query helper clears protected cached data. Direct state readers must clear their own protected snapshots and guard late responses. `onError` is for snapshot failure; `onSubscriptionError` and `onSubscriptionStateChange` describe subscription failure separately.

The scheduler coalesces bursts, permits one read at a time, preserves a trailing refresh and pauses hidden documents. Return the actual promise and allow rejected reads to reach it. Do not catch an error and return successful `undefined` from the refresh callback. Defaults allow three transient retries with backoff; `retries`, `retryDelayMs`, `retryMaxDelayMs` and `shouldRetry` customize that policy. New events do not clear exhausted or permanent failure; `retry()` and new topic readiness do. Foreground/online recovery retries transient failures. `refreshIntervalMs` is optional and disabled by default; choose it from the business recovery requirement, not as a universal interval.

For direct stream/event consumption, `useRealtimeTopic(topic, onEvent, { onReady })` owns a watch. Use a null topic or `enabled: false` for inactive content. `onReady` follows an acknowledged subscription; `onOpen` describes the transport only. A resource grant can call a retained watch's `retry()`. A forbidden topic does not prevent other authorized topics from working.

Non-React services resolve `realtimeClientToken`, call `watch(topic, { onEvent, onReady, onError })`, and close the handle on cleanup. Compose `createRealtimeRefresh` with `onEvent: scheduled.request` and `onReady: scheduled.retry`. Close both objects when their owner stops. Its `snapshot` has the same state as the hook. The scheduler's abort signal cancels owned follow-up work; it must not cancel another observer's shared query.

Account changes close the old socket and clear account-bound data. A route/resource change releases its old watch and rejects late snapshot writes. Business writes use HTTP APIs, not WebSocket publication.
