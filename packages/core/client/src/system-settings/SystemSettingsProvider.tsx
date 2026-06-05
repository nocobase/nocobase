/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Result } from 'ahooks/es/useRequest/src/types';
import { useFlowEngine } from '@nocobase/flow-engine';
import React, { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';
import { useRequest } from '../api-client';
import languageCodes from '../locale';

export const SystemSettingsContext = createContext<Result<any, any> | any>(null);
SystemSettingsContext.displayName = 'SystemSettingsContext';

export const useSystemSettings = () => {
  return useContext(SystemSettingsContext);
};

export const SystemSettingsProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const result = useRequest({
    url: 'systemSettings:get',
  }) as Result<any, any>;
  const flowEngine = useFlowEngine({ throwError: false });
  const enabledLanguages = result.data?.data?.enabledLanguages;
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
    if (!flowEngine) {
      return;
    }
    flowEngine.context.defineProperty('locale', {
      get: (ctx) => ctx.api?.auth?.locale || ctx.i18n?.language,
      cache: false,
      meta: {
        type: 'string',
        title: '{{t("Current language")}}',
        interface: 'select',
        uiSchema: {
          enum: languageOptions,
          'x-component': 'Select',
        },
      },
    });
  }, [flowEngine, languageOptions]);

  return <SystemSettingsContext.Provider value={{ ...result }}>{props.children}</SystemSettingsContext.Provider>;
};
