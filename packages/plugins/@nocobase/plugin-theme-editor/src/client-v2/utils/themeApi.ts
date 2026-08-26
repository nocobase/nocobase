/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ThemeConfig, ThemeItem } from '../types';
import { changeAlgorithmFromFunctionToString } from './changeAlgorithmFromFunctionToString';
import { changeAlgorithmFromStringToFunction } from './changeAlgorithmFromStringToFunction';

export const THEME_RUNTIME_REFRESH_EVENT = 'theme-editor:runtime-refresh';

export async function listThemeItems(api: any): Promise<ThemeItem[]> {
  const response = await api.request({
    url: 'themeConfig:list',
    params: {
      sort: 'id',
      paginate: false,
    },
  });

  return ((response?.data?.data || []) as ThemeItem[]).map((item) => changeAlgorithmFromStringToFunction(item));
}

export async function updateUserTheme(api: any, themeId: number | null) {
  await api.resource('users').updateTheme({
    values: {
      themeId,
    },
  });
}

export function getCurrentUserThemeId(user: any): number | null | undefined {
  return user?.systemSettings?.themeId;
}

export function getDefaultThemeItem(items?: ThemeItem[]) {
  return items?.find((item) => item.default);
}

export function getUserSelectedThemeItem(items: ThemeItem[] | undefined, themeId: number | null | undefined) {
  if (themeId == null) {
    return undefined;
  }

  return items?.find((item) => item.id === themeId);
}

export function getEffectiveCurrentThemeItem(items: ThemeItem[] | undefined, themeId: number | null | undefined) {
  return getUserSelectedThemeItem(items, themeId) || getDefaultThemeItem(items);
}

export function getEffectiveCurrentThemeId(items: ThemeItem[] | undefined, themeId: number | null | undefined) {
  return getEffectiveCurrentThemeItem(items, themeId)?.id;
}

export function isDefaultThemeEffective(items: ThemeItem[] | undefined, themeId: number | null | undefined) {
  return !getUserSelectedThemeItem(items, themeId);
}

export function serializeThemeItem(item: ThemeItem) {
  return JSON.stringify({
    ...item,
    config: changeAlgorithmFromFunctionToString(item.config),
  });
}

export function normalizeThemeConfig(themeConfig: ThemeConfig | null | undefined, fallback: ThemeConfig): ThemeConfig {
  if (!themeConfig) {
    return fallback;
  }

  return {
    ...themeConfig,
    token: {
      ...themeConfig.token,
      motionUnit: themeConfig.token?.motionUnit ?? fallback.token?.motionUnit,
    },
  };
}
