/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { useApp } from '../../flow-compat';
import languageCodes from '../../locale/languageCodes';
import { useEffect, useMemo, useState } from 'react';

/**
 * 读取系统设置并兼容旧 hook 的返回结构。
 *
 * 该 hook 内部统一消费 `app.systemSettings`，并保持旧代码可继续
 * 通过 `loading/data/error/mutate/refresh` 访问系统设置。
 *
 * @returns 兼容旧 `useSystemSettings` 的结果对象
 * @example
 * ```typescript
 * const { data, loading } = useSystemSettings();
 * ```
 */
export const useSystemSettings = () => {
  const app = useApp();
  const source = app.systemSettings;
  const flowEngine = useFlowEngine({ throwError: false });
  const [, forceUpdate] = useState(0);
  const enabledLanguages = source.data?.data?.enabledLanguages;
  const languageOptions = useMemo(
    () =>
      (Array.isArray(enabledLanguages) ? enabledLanguages : [])
        .filter((code) => languageCodes[code])
        .map((code) => ({
          label: languageCodes[code].label,
          value: code,
        })),
    [enabledLanguages],
  );

  useEffect(() => {
    void source.load();
    return source.subscribe(() => {
      forceUpdate((value) => value + 1);
    });
  }, [source]);

  useEffect(() => {
    if (!flowEngine) {
      return;
    }

    flowEngine.context.defineProperty('locale', {
      get: (ctx) => ctx.api?.auth?.locale || ctx.i18n?.language,
      cache: false,
      meta: {
        type: 'string',
        title: '{{t("Current language")}}',
        sort: 970,
        interface: 'select',
        uiSchema: {
          enum: languageOptions,
          'x-component': 'Select',
        },
      },
    });
  }, [flowEngine, languageOptions]);

  return {
    loading: source.loading,
    data: source.data,
    error: source.error,
    refresh: () => source.refresh(),
    mutate: (next: { data?: any; error?: any }) => {
      if (Object.prototype.hasOwnProperty.call(next || {}, 'data')) {
        source.setData(next?.data);
      }
      if (Object.prototype.hasOwnProperty.call(next || {}, 'error')) {
        source.setError(next?.error);
      }
    },
  };
};
