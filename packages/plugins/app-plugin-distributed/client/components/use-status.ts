import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useState } from 'react';

import {
  DISTRIBUTED_NAMESPACE,
  type DistributedStatus,
} from '../../shared/types.js';

export interface DistributedStatusState {
  readonly status?: DistributedStatus;
  readonly error?: 'forbidden' | 'failed';
  readonly loading: boolean;
  readonly reload: () => void;
}

/** Loads `GET /api/distributed/status` once per mount; the status only changes when the application restarts. */
export function useDistributedStatus(): DistributedStatusState {
  const api = useApiClient();
  const [state, setState] = useState<Omit<DistributedStatusState, 'reload'>>({
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    api
      .request<{ readonly data: DistributedStatus }>({
        path: `${DISTRIBUTED_NAMESPACE}/status`,
      })
      .then(
        ({ data }) => {
          if (active) setState({ status: data, loading: false });
        },
        (error: unknown) => {
          if (!active) return;
          setState({
            loading: false,
            error:
              error instanceof ApiClientError && error.status === 403
                ? 'forbidden'
                : 'failed',
          });
        },
      );
    return () => {
      active = false;
    };
  }, [api, attempt]);
  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true }));
    setAttempt((value) => value + 1);
  }, []);
  return { ...state, reload };
}
