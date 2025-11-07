/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from '@nocobase/client';
import { useMemo } from 'react';

const MapConfigurationResourceKey = 'map-configuration';
const getSSKey = (type) => {
  return `NOCOBASE_PLUGIN_MAP_CONFIGURATION_${type}`;
};
export const useMapConfiguration = (type: string, caching = true) => {
  // cache
  const config = useMemo(() => {
    const d = sessionStorage.getItem(getSSKey(type));
    if (d) {
      return JSON.parse(d);
    }
    return d;
  }, [type]);

  const { data } = useRequest<{
    data: any;
  }>(
    {
      resource: MapConfigurationResourceKey,
      action: 'get',
      params: {
        isRaw: !caching,
        type,
      },
    },
    {
      onSuccess(data) {
        if (!caching) {
          return;
        }
        sessionStorage.setItem(getSSKey(type), JSON.stringify(data?.data));
      },
      refreshOnWindowFocus: false,
      refreshDeps: [],
      manual: config && caching ? true : false,
    },
  );

  if (config && caching) return config;

  return data?.data;
};
