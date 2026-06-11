/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngineContext } from '@nocobase/flow-engine';
import { useEffect, useState } from 'react';

export function useCurrentAppInfo<TAppInfo extends Record<string, any> = Record<string, any>>() {
  const ctx = useFlowEngineContext();
  const [data, setData] = useState<TAppInfo>();

  useEffect(() => {
    let active = true;

    Promise.resolve(ctx.appInfo)
      .then((info) => {
        if (active) {
          setData((info || {}) as TAppInfo);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, [ctx]);

  return data;
}
