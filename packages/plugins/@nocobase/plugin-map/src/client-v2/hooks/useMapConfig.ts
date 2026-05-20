/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useEffect, useMemo, useState } from 'react';
import { getSSKey, MapConfigurationResourceKey } from '../../shared/configuration';

export { getSSKey, MapConfigurationResourceKey };

const getCachedConfig = (type: string) => {
  const cached = sessionStorage.getItem(getSSKey(type));
  try {
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const useMapConfig = (type: string, caching = true) => {
  const { api } = useFlowContext();
  const storageKey = useMemo(() => getSSKey(type), [type]);

  const [config, setConfig] = useState<any>(() => {
    if (!caching) return null;
    return getCachedConfig(type);
  });

  useEffect(() => {
    if (!caching) {
      setConfig(null);
      return;
    }

    setConfig(getCachedConfig(type));
  }, [type, caching]);

  useEffect(() => {
    if (caching && getCachedConfig(type)) return;

    let canceled = false;
    api
      .resource(MapConfigurationResourceKey)
      .get({
        isRaw: !caching,
        type,
      })
      .then((res) => {
        if (canceled) return;
        const data = res.data?.data;
        if (caching) {
          const prev = sessionStorage.getItem(storageKey);
          if (!prev || prev !== JSON.stringify(data)) {
            sessionStorage.setItem(storageKey, JSON.stringify(data));
          }
        }
        setConfig(data);
      })
      .catch(() => {
        // Ignore configuration fetch failures and keep the existing config state.
      });

    return () => {
      canceled = true;
    };
  }, [api, type, caching, storageKey]);

  return config;
};
