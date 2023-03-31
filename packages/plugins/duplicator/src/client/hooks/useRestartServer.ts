import { useAPIClient } from '@nocobase/client';
import { useState } from 'react';

const LOOP_INTERVAL = 5000;

export const useRestartServer = () => {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const restart = (cb?: () => void) => {
    setLoading(true);
    setTimeout(() => {
      api
        .request({
          resource: 'duplicator',
          action: 'dumpableCollections',
        })
        .catch((error) => {
          console.error(error);
          restart(cb);
        })
        .then((data) => {
          if (!data) {
            return;
          }
          setLoading(false);
          cb?.();
        });
    }, LOOP_INTERVAL);
  };

  return { restart, loading };
};
