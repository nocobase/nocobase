/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defaultTheme, useGlobalTheme } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { error } from '@nocobase/utils/client';
import React, { useEffect, useRef } from 'react';
import {
  getCurrentUserThemeId,
  getEffectiveCurrentThemeItem,
  listThemeItems,
  normalizeThemeConfig,
  serializeThemeItem,
  THEME_RUNTIME_REFRESH_EVENT,
} from '../utils/themeApi';
import { changeAlgorithmFromStringToFunction } from '../utils/changeAlgorithmFromStringToFunction';

const ThemeRuntime = () => {
  const ctx = useFlowContext();
  const { setTheme } = useGlobalTheme();
  const storageAppliedRef = useRef(false);
  const currentUser = (ctx as any).user;
  const currentThemeId = getCurrentUserThemeId(currentUser);

  useEffect(() => {
    if (storageAppliedRef.current) {
      return;
    }

    storageAppliedRef.current = true;
    const storageTheme = ctx.api.auth.getOption('theme');
    if (!storageTheme) {
      return;
    }

    try {
      setTheme(
        normalizeThemeConfig(changeAlgorithmFromStringToFunction(JSON.parse(storageTheme)).config, defaultTheme),
      );
    } catch (err) {
      error(err);
    }
  }, [ctx.api.auth, setTheme]);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    let cancelled = false;

    const applyUserTheme = async () => {
      try {
        const themes = await listThemeItems(ctx.api);
        if (cancelled) {
          return;
        }

        const nextTheme = getEffectiveCurrentThemeItem(themes, currentThemeId);

        if (nextTheme?.config) {
          setTheme(normalizeThemeConfig(nextTheme.config, defaultTheme));
          ctx.api.auth.setOption('theme', serializeThemeItem(nextTheme));
          return;
        }

        setTheme(defaultTheme);
        ctx.api.auth.setOption('theme', null);
      } catch (err) {
        error(err);
      }
    };

    void applyUserTheme();
    const handleRefresh = () => {
      void applyUserTheme();
    };
    (ctx as any).app?.eventBus?.addEventListener(THEME_RUNTIME_REFRESH_EVENT, handleRefresh);

    return () => {
      cancelled = true;
      (ctx as any).app?.eventBus?.removeEventListener(THEME_RUNTIME_REFRESH_EVENT, handleRefresh);
    };
  }, [ctx, ctx.api, ctx.api.auth, currentThemeId, currentUser?.id, setTheme]);

  return null;
};

ThemeRuntime.displayName = 'ThemeRuntime';

export default ThemeRuntime;
