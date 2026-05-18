/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useEffect, useState } from 'react';
import { getSSKey, MapConfigurationResourceKey } from '../../shared/configuration';

export { getSSKey, MapConfigurationResourceKey };

export const useMapConfig = (type: string, caching = true) => {
  const { api } = useFlowContext();

  const [config, setConfig] = useState<any>(() => {
    if (!caching) return null;
    const cached = sessionStorage.getItem(getSSKey(type));
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (caching && config) return;

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
          const prev = sessionStorage.getItem(getSSKey(type));
          if (!prev || prev !== JSON.stringify(data)) {
            sessionStorage.setItem(getSSKey(type), JSON.stringify(data));
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
  }, [api, type, caching, config]);

  return config;
};
