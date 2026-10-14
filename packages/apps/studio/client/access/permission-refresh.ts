import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationClient } from '@nocobase/app-plugin-authorization/client';
import { useEffect } from 'react';

/** Local realtime events are immediate; polling also observes changes committed by another instance. */
export function useStudioPermissionRefresh(): void {
  const api = useApiClient();
  const authorization = useAuthorizationClient();
  const { session, refresh: refreshSession } = useAuthentication();
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let stopped = false,
      pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const cached = await authorization.snapshot();
        const response = await api.request<{ data: unknown }>({
          path: 'authorization/permissions',
        });
        if (
          !stopped &&
          JSON.stringify(cached) !== JSON.stringify(response.data)
        )
          authorization.invalidate();
      } catch (error) {
        if (!stopped && error instanceof ApiClientError && error.status === 401)
          await refreshSession().catch(() => undefined);
        if (!stopped) authorization.invalidate();
      } finally {
        pending = false;
      }
    };
    const onFocus = () => {
      void refresh();
    };
    const timer = window.setInterval(onFocus, 15_000);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [api, authorization, userId, refreshSession]);
}
