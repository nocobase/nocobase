/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useState, useEffect } from 'react';
import { useFlowEngine } from '@nocobase/flow-engine';

export const MapConfigurationResourceKey = 'map-configuration';
export const getSSKey = (type) => {
  return `NOCOBASE_PLUGIN_MAP_CONFIGURATION_${type}`;
};
export const useMapConfig = (type: string, caching = true) => {
  const flowEngine = useFlowEngine();

  // 初始化缓存读取：只在首次渲染时读取 sessionStorage
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
    // 如果开启缓存且已有数据，则直接跳过请求
    if (caching && config) return;

    let canceled = false;
    // eslint-disable-next-line promise/catch-or-return
    flowEngine.context.api
      .resource(MapConfigurationResourceKey)
      .get({
        isRaw: !caching,
        type,
      })
      .then((res) => {
        if (canceled) return;
        const data = res.data?.data;
        if (caching) {
          // 避免重复写入相同数据
          const prev = sessionStorage.getItem(getSSKey(type));
          if (!prev || prev !== JSON.stringify(data)) {
            sessionStorage.setItem(getSSKey(type), JSON.stringify(data));
          }
        }
        setConfig(data);
      });

    return () => {
      canceled = true;
    };
  }, [type, caching, flowEngine, config]);

  return config;
};
